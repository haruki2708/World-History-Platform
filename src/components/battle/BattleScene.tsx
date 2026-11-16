"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { getPolity } from "@/data";
import type { BattleSceneProps, FieldPoint } from "@/lib/battle";
import { useT } from "@/lib/i18n/useT";
import type { LocalizedText } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { BattleEngine, type EngineStats, type Quality } from "./engine/BattleEngine";

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
  point: FieldPoint;
  river: boolean;
  approximate: boolean;
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
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [quality, setQuality] = useState<Quality>(() => readStoredQuality() ?? "high");
  const [lowered, setLowered] = useState(false);
  const [hintSeen, setHintSeen] = useState(false);
  const [stats, setStats] = useState<EngineStats | null>(null);
  const initialQuality = useRef(quality);

  const labels = useMemo<SceneLabel[]>(
    () => [
      ...battle.terrain.landmarks.map((landmark, i) => ({
        key: `landmark-${i}`,
        name: landmark.name,
        point: landmark.point,
        river: false,
        approximate: landmark.approximate ?? false,
      })),
      ...battle.terrain.rivers
        .filter((river) => river.points.length > 0)
        .map((river, i) => ({
          key: `river-${i}`,
          name: river.name,
          point: river.points[Math.floor(river.points.length / 2)],
          river: true,
          approximate: river.approximate ?? false,
        })),
    ],
    [battle],
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let engine: BattleEngine;
    let noticeTimer = 0;
    const position = { x: 0, y: 0 };
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
        onFrame: () => {
          labels.forEach((label, i) => {
            const element = labelRefs.current[i];
            if (!element) return;
            const visible = engine.project(label.point, position);
            element.style.visibility = visible ? "visible" : "hidden";
            if (visible) {
              element.style.transform = `translate(${Math.round(position.x)}px, ${Math.round(position.y)}px)`;
            }
          });
        },
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
            <span
              className={`absolute left-0 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-sm border border-line bg-background/75 px-1.5 py-0.5 text-xs text-foreground ${
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
              onClick={toggleQuality}
              className="rounded-md border border-line bg-background/85 px-2.5 py-1 text-xs text-foreground hover:bg-surface"
            >
              {t("battle.scene.quality")}:{" "}
              {t(quality === "high" ? "battle.scene.quality.high" : "battle.scene.quality.low")}
            </button>
            {lowered && (
              <p
                role="status"
                className="max-w-56 rounded-md border border-line bg-background/85 px-2.5 py-1 text-xs text-muted"
              >
                {t("battle.scene.quality.lowered")}
              </p>
            )}
          </div>

          {!hintSeen && (
            <p className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-line bg-background/85 px-2.5 py-1 text-xs text-muted">
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
