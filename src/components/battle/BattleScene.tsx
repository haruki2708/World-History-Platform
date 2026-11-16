"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { getPolity } from "@/data";
import type { BattleLandmark, BattleSceneProps, FieldPoint } from "@/lib/battle";
import { useT } from "@/lib/i18n/useT";
import type { LocalizedText } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { BattleEngine, type EngineStats, type Quality } from "./engine/BattleEngine";
import {
  DOT_RADIUS,
  type LabelObstacle,
  type LabelPlacement,
  type LabelRequest,
  type LabelSide,
  type LabelSpot,
  layoutLabels,
} from "./labelLayout";

/** The quality the user picked with the button, kept between visits. */
const QUALITY_STORAGE_KEY = "whp.battleQuality";

function readStoredQuality(): Quality | null {
  try {
    const stored = window.localStorage.getItem(QUALITY_STORAGE_KEY);
    return stored === "high" || stored === "low" ? stored : null;
  } catch {
    return null;
  }
}

function storeQuality(quality: Quality): void {
  try {
    window.localStorage.setItem(QUALITY_STORAGE_KEY, quality);
  } catch {
    // Storage is unavailable: the choice lasts until the scene closes.
  }
}

interface SceneLabel {
  key: string;
  name: LocalizedText;
  /** Where the label may stand: one point for a landmark, several along a river. */
  anchors: FieldPoint[];
  river: boolean;
  approximate: boolean;
}

/**
 * Anything drawn over the scene carries this attribute, here or in the
 * viewer around it; place labels keep clear of it.
 */
const OVERLAY_SELECTOR = "[data-battle-overlay]";
/** Overlays are measured again every this many frames. */
const OVERLAY_FRAMES = 15;

/** The boxes of the overlays that lie over `host`, relative to it. */
function measureOverlays(host: HTMLElement): LabelObstacle[] {
  const frame = host.getBoundingClientRect();
  const boxes: LabelObstacle[] = [];
  for (const element of document.querySelectorAll(OVERLAY_SELECTOR)) {
    const box = element.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) continue;
    if (box.right <= frame.left || box.left >= frame.right) continue;
    if (box.bottom <= frame.top || box.top >= frame.bottom) continue;
    boxes.push({
      left: box.left - frame.left,
      top: box.top - frame.top,
      right: box.right - frame.left,
      bottom: box.bottom - frame.top,
    });
  }
  return boxes;
}

/** Which labels win a crowded spot: lower first. */
const KIND_PRIORITY: Record<BattleLandmark["kind"] | "river", number> = {
  town: 0,
  river: 1,
  camp: 2,
  hill: 3,
  ford: 4,
  other: 5,
};

const LANDMARK_SIDES: readonly LabelSide[] = ["above", "below", "right", "left"];
const RIVER_SIDES: readonly LabelSide[] = ["center"];
/** Where along a river its name may stand, as shares of its length, best first. */
const RIVER_STOPS = [0.5, 0.38, 0.62, 0.26, 0.74, 0.14, 0.86];

/** Points at the given shares of the length of a polyline. */
function pointsAlong(points: FieldPoint[], shares: number[]): FieldPoint[] {
  if (points.length < 2) return points.slice(0, 1);
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    lengths.push(lengths[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  }
  const total = lengths[lengths.length - 1];
  return shares.map((share) => {
    const at = share * total;
    let i = 1;
    while (i < points.length - 1 && lengths[i] < at) i++;
    const span = lengths[i] - lengths[i - 1];
    const t = span > 0 ? (at - lengths[i - 1]) / span : 0;
    return {
      x: points[i - 1].x + (points[i].x - points[i - 1].x) * t,
      y: points[i - 1].y + (points[i].y - points[i - 1].y) * t,
    };
  });
}

/**
 * The 3D scene of a battle. Reads the battle time from the store and draws
 * the field at that moment; three.js lives behind this component only.
 */
export function BattleScene({ battle, unitTypes, debug }: BattleSceneProps) {
  const showStats = debug?.showStats ?? false;
  const stressFigures = debug?.stressFigures;
  // A new battle or a new stress crowd starts from a clean scene.
  return (
    <SceneView
      key={`${battle.id}/${stressFigures ?? 0}`}
      battle={battle}
      unitTypes={unitTypes}
      showStats={showStats}
      stressFigures={stressFigures}
    />
  );
}

interface SceneViewProps {
  battle: BattleSceneProps["battle"];
  unitTypes: BattleSceneProps["unitTypes"];
  showStats: boolean;
  stressFigures: number | undefined;
}

// Memoised: a parent that re-renders on every tick of the battle clock (the
// lab does) must not re-render the scene with it.
const SceneView = memo(function SceneView({
  battle,
  unitTypes,
  showStats,
  stressFigures,
}: SceneViewProps) {
  const { t, locale } = useT();
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BattleEngine | null>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelTextRefs = useRef<(HTMLSpanElement | null)[]>([]);
  /** Measured sizes of the label texts, kept current by a ResizeObserver. */
  const labelSizes = useRef<({ width: number; height: number } | null)[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [quality, setQuality] = useState<Quality>(() => readStoredQuality() ?? "high");
  const [lowered, setLowered] = useState(false);
  const [hintSeen, setHintSeen] = useState(false);
  const [stats, setStats] = useState<EngineStats | null>(null);
  const initialQuality = useRef(quality);

  // In priority order, so the layout can take them as they come.
  const labels = useMemo<SceneLabel[]>(() => {
    const ranked = [
      ...battle.terrain.landmarks.map((landmark, i) => ({
        rank: KIND_PRIORITY[landmark.kind] ?? KIND_PRIORITY.other,
        label: {
          key: `landmark-${i}`,
          name: landmark.name,
          anchors: [landmark.point],
          river: false,
          approximate: landmark.approximate ?? false,
        },
      })),
      ...battle.terrain.rivers
        .filter((river) => river.points.length > 0)
        .map((river, i) => ({
          rank: KIND_PRIORITY.river,
          label: {
            key: `river-${i}`,
            name: river.name,
            anchors: pointsAlong(river.points, RIVER_STOPS),
            river: true,
            approximate: river.approximate ?? false,
          },
        })),
    ];
    // A stable sort keeps the order of the data within a kind.
    return ranked.sort((a, b) => a.rank - b.rank).map((entry) => entry.label);
  }, [battle]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let engine: BattleEngine;
    let noticeTimer = 0;
    const position = { x: 0, y: 0 };
    const spots: (LabelSpot | null)[] = labels.map(() => null);
    const shown: string[] = labels.map(() => "");
    let overlays: LabelObstacle[] = [];
    let overlayAge = OVERLAY_FRAMES;
    const placeLabels = () => {
      if (++overlayAge >= OVERLAY_FRAMES) {
        overlayAge = 0;
        overlays = measureOverlays(host);
      }
      const requests: LabelRequest[] = labels.map((label, i) => {
        // Measured once here, then by the ResizeObserver below.
        const text = labelTextRefs.current[i];
        let size = labelSizes.current[i];
        if (!size && text && text.offsetWidth > 0) {
          size = { width: text.offsetWidth, height: text.offsetHeight };
          labelSizes.current[i] = size;
        }
        return {
          // Not mounted or not measured yet: nothing to place.
          anchors: size
            ? label.anchors.map((anchor) =>
                engine.project(anchor, position) ? { x: position.x, y: position.y } : null,
              )
            : [],
          sides: label.river ? RIVER_SIDES : LANDMARK_SIDES,
          width: size?.width ?? 0,
          height: size?.height ?? 0,
          dot: !label.river,
          previous: spots[i],
        };
      });
      const placements = layoutLabels(requests, engine.viewSize, overlays);
      placements.forEach((placement, i) => {
        spots[i] = placement && { anchor: placement.anchor, side: placement.side };
        const element = labelRefs.current[i];
        const text = labelTextRefs.current[i];
        if (!element || !text) return;
        const key = placementKey(placement);
        if (key === shown[i]) return;
        shown[i] = key;
        showLabel(element, text, placement);
      });
    };
    try {
      engine = new BattleEngine(host, {
        battle,
        unitTypes,
        colorOfPolity: (id) => getPolity(id)?.color,
        getTime: () => useAppStore.getState().battleTime,
        quality: initialQuality.current,
        stressFigures,
        onReady: () => setStatus("ready"),
        onError: () => setStatus("error"),
        onStats: showStats ? setStats : undefined,
        onQualityLowered: () => {
          setQuality("low");
          setLowered(true);
          noticeTimer = window.setTimeout(() => setLowered(false), 8000);
        },
        onFrame: placeLabels,
      });
    } catch (error) {
      console.error("The battle scene could not start.", error);
      queueMicrotask(() => setStatus("error"));
      return;
    }
    engineRef.current = engine;
    return () => {
      window.clearTimeout(noticeTimer);
      engineRef.current = null;
      engine.dispose();
    };
  }, [battle, unitTypes, stressFigures, showStats, labels]);

  // Label texts change size with the language and the font; measure them
  // when they do, not on every frame.
  useEffect(() => {
    if (status !== "ready") return;
    const texts = labelTextRefs.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const i = texts.indexOf(entry.target as HTMLSpanElement);
        const box = entry.borderBoxSize?.[0];
        if (i >= 0 && box) labelSizes.current[i] = { width: box.inlineSize, height: box.blockSize };
      }
    });
    for (const text of texts) if (text) observer.observe(text);
    return () => observer.disconnect();
  }, [status, labels]);

  const toggleQuality = () => {
    const next: Quality = quality === "high" ? "low" : "high";
    setQuality(next);
    setLowered(false);
    storeQuality(next);
    engineRef.current?.setQuality(next);
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-surface"
      onPointerDown={() => setHintSeen(true)}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div ref={hostRef} className="absolute inset-0" role="img" aria-label={t("battle.scene.label")} />

      {status === "ready" &&
        labels.map((label, i) => (
          <div
            key={label.key}
            ref={(element) => {
              labelRefs.current[i] = element;
            }}
            className="pointer-events-none absolute left-0 top-0"
            style={{ visibility: "hidden" }}
          >
            {!label.river && (
              <span
                className="absolute rounded-full border border-background bg-foreground"
                style={{
                  left: -DOT_RADIUS,
                  top: -DOT_RADIUS,
                  width: DOT_RADIUS * 2,
                  height: DOT_RADIUS * 2,
                }}
              />
            )}
            <span
              ref={(element) => {
                labelTextRefs.current[i] = element;
              }}
              className={`absolute left-0 top-0 whitespace-nowrap rounded-sm border border-line bg-background/75 px-1.5 py-0.5 text-xs text-foreground ${
                label.river ? "italic" : ""
              }`}
              title={label.approximate ? t("battle.scene.approximate") : undefined}
            >
              {label.name[locale]}
              {label.approximate ? " (?)" : ""}
            </span>
          </div>
        ))}

      {status !== "ready" && (
        <div className="absolute inset-0 grid place-items-center bg-surface px-6 text-center text-sm text-muted">
          {status === "loading" ? t("battle.scene.loading") : t("battle.scene.error")}
        </div>
      )}

      {status === "ready" && (
        <>
          <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
            <button
              type="button"
              data-battle-overlay
              onClick={toggleQuality}
              className="rounded-md border border-line bg-background/85 px-2.5 py-1 text-xs text-foreground hover:bg-surface"
            >
              {t("battle.scene.quality")}:{" "}
              {t(quality === "high" ? "battle.scene.quality.high" : "battle.scene.quality.low")}
            </button>
            {lowered && (
              <p
                role="status"
                data-battle-overlay
                className="max-w-56 rounded-md border border-line bg-background/85 px-2.5 py-1 text-xs text-muted"
              >
                {t("battle.scene.quality.lowered")}
              </p>
            )}
          </div>

          {!hintSeen && (
            <p
              data-battle-overlay
              className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-line bg-background/85 px-2.5 py-1 text-xs text-muted"
            >
              {t("battle.scene.hint")}
            </p>
          )}
        </>
      )}

      {showStats && stats && (
        <dl
          data-battle-stats
          data-fps={stats.fps.toFixed(1)}
          data-figures={stats.figures}
          data-drawn={stats.drawn}
          data-calls={stats.drawCalls}
          data-triangles={stats.triangles}
          data-quality={stats.quality}
          data-gpu={stats.gpu}
          data-battle-overlay
          className="pointer-events-none absolute left-3 top-3 grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 rounded-md border border-line bg-background/85 px-2.5 py-1.5 font-mono text-xs text-foreground"
        >
          <dt className="text-muted">{t("battle.scene.stats.fps")}</dt>
          <dd className="text-right tabular-nums">
            {stats.fps.toFixed(0)} ({stats.frameMs.toFixed(1)} ms)
          </dd>
          <dt className="text-muted">{t("battle.scene.stats.figures")}</dt>
          <dd className="text-right tabular-nums">{stats.figures}</dd>
          <dt className="text-muted">{t("battle.scene.stats.drawn")}</dt>
          <dd className="text-right tabular-nums">{stats.drawn}</dd>
          <dt className="text-muted">{t("battle.scene.stats.calls")}</dt>
          <dd className="text-right tabular-nums">{stats.drawCalls}</dd>
          <dt className="text-muted">{t("battle.scene.stats.triangles")}</dt>
          <dd className="text-right tabular-nums">{stats.triangles.toLocaleString(locale)}</dd>
          <dt className="text-muted">{t("battle.scene.stats.lods")}</dt>
          <dd className="text-right tabular-nums">{stats.lods.join(" / ")}</dd>
          <dt className="text-muted">{t("battle.scene.quality")}</dt>
          <dd className="text-right">
            {t(stats.quality === "high" ? "battle.scene.quality.high" : "battle.scene.quality.low")}
          </dd>
          <dt className="text-muted">{t("battle.scene.stats.models")}</dt>
          <dd className="text-right">
            {stats.models.map((model) => (
              <div key={model}>{model}</div>
            ))}
          </dd>
          {stats.gpu && (
            <>
              <dt className="text-muted">{t("battle.scene.stats.gpu")}</dt>
              <dd className="max-w-72 truncate text-right">{stats.gpu}</dd>
            </>
          )}
        </dl>
      )}
    </div>
  );
});

function placementKey(placement: LabelPlacement | null): string {
  if (!placement) return "";
  return `${Math.round(placement.x)},${Math.round(placement.y)},${Math.round(placement.dx)},${Math.round(placement.dy)}`;
}

/** Moves a label to its placement, or hides it (null). */
function showLabel(element: HTMLDivElement, text: HTMLSpanElement, placement: LabelPlacement | null): void {
  if (!placement) {
    element.style.visibility = "hidden";
    return;
  }
  element.style.visibility = "visible";
  element.style.transform = `translate(${Math.round(placement.x)}px, ${Math.round(placement.y)}px)`;
  text.style.transform = `translate(${Math.round(placement.dx)}px, ${Math.round(placement.dy)}px)`;
}
