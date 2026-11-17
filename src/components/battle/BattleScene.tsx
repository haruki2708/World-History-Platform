"use client";

import { memo, useEffect, useId, useMemo, useRef, useState, type PointerEvent, type RefObject } from "react";
import { getPolity } from "@/data";
import type { Battle, BattleLandmark, BattleSceneProps, BattleUnit, FieldPoint, UnitType } from "@/lib/battle";
import { useT } from "@/lib/i18n/useT";
import type { LocalizedText } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { BattleEngine, type EngineStats, type Quality, type UnitView } from "./engine/BattleEngine";
import {
  DOT_RADIUS,
  type LabelObstacle,
  type LabelPlacement,
  type LabelRequest,
  type LabelSide,
  type LabelSpot,
  layoutLabels,
  placeCard,
} from "./labelLayout";
import { roundMen, unitStateAt } from "./unitState";
import { formatCount } from "./viewer/format";

/** The quality the user picked with the button, kept between visits. */
const QUALITY_STORAGE_KEY = "whp.battleQuality";
/** Whether the names of the units show on the scene, kept between visits. */
const UNIT_NAMES_STORAGE_KEY = "whp.battleUnitNames";

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function store(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage is unavailable: the choice lasts until the scene closes.
  }
}

function readStoredQuality(): Quality | null {
  const stored = readStored(QUALITY_STORAGE_KEY);
  return stored === "high" || stored === "low" ? stored : null;
}

interface SceneLabel {
  key: string;
  name: LocalizedText;
  /** Where the label may stand: one point for a landmark, several along a river. */
  anchors: FieldPoint[];
  river: boolean;
  approximate: boolean;
}

interface UnitLabel {
  unit: BattleUnit;
  /** Colour of its side, from polities.json. */
  color: string | undefined;
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

/**
 * Which labels win a crowded spot: lower first. The names of the units come
 * between the two kinds of place: after the town and the river, which the
 * viewer needs to find their way, and before camps, hills and fords.
 */
const KIND_PRIORITY: Record<BattleLandmark["kind"] | "river", number> = {
  town: 0,
  river: 1,
  camp: 2,
  hill: 3,
  ford: 4,
  other: 5,
};
/** Places ranked up to this come before the units. */
const PLACES_BEFORE_UNITS = KIND_PRIORITY.river;

const LANDMARK_SIDES: readonly LabelSide[] = ["above", "below", "right", "left"];
const RIVER_SIDES: readonly LabelSide[] = ["center"];
const UNIT_SIDES: readonly LabelSide[] = ["above"];
/** Where along a river its name may stand, as shares of its length, best first. */
const RIVER_STOPS = [0.5, 0.38, 0.62, 0.26, 0.74, 0.14, 0.86];

/**
 * Unit labels, when there is not room for all (22 blocks deployed side by
 * side): the blocks that look largest on screen come first, which favours
 * both large blocks and near ones. A label shown in the last frame counts
 * UNIT_LABEL_KEEP times larger, so two labels of about the same size do not
 * take turns as the camera moves. Each keeps UNIT_LABEL_MARGIN pixels clear
 * around it, so the names that show do not run together.
 */
const UNIT_LABEL_KEEP = 1.6;
const UNIT_LABEL_MARGIN = 3;
/** A press that moves less than this many pixels before it lifts is a click, not a drag. */
const CLICK_SLOP = 5;

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

interface UnitSelection {
  /** The unit whose card is open. Given with onSelectUnit, the viewer keeps it; otherwise the scene does. */
  selectedUnit?: string | null;
  /** A click on a unit (its id), or elsewhere on the scene, Esc or the close button of the card (null). */
  onSelectUnit?: (id: string | null) => void;
  /**
   * Each change flies the camera to the selected unit and moves the focus
   * to its card: a unit chosen from the list in the side panel.
   */
  unitFocusRequest?: number;
}

/**
 * The 3D scene of a battle. Reads the battle time from the store and draws
 * the field at that moment; three.js lives behind this component only.
 */
export function BattleScene({
  battle,
  unitTypes,
  debug,
  introFromAbove = false,
  selectedUnit,
  onSelectUnit,
  unitFocusRequest = 0,
}: BattleSceneProps &
  UnitSelection & {
    /**
     * Open looking straight down on the field, north up, as the map left it,
     * and bring the camera down to the opening view (the battle viewer).
     */
    introFromAbove?: boolean;
  }) {
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
      introFromAbove={introFromAbove}
      selectedUnit={selectedUnit}
      onSelectUnit={onSelectUnit}
      unitFocusRequest={unitFocusRequest}
    />
  );
}

interface SceneViewProps extends UnitSelection {
  battle: BattleSceneProps["battle"];
  unitTypes: BattleSceneProps["unitTypes"];
  showStats: boolean;
  stressFigures: number | undefined;
  introFromAbove: boolean;
  unitFocusRequest: number;
}

// Memoised: a parent that re-renders on every tick of the battle clock (the
// lab does) must not re-render the scene with it.
const SceneView = memo(function SceneView({
  battle,
  unitTypes,
  showStats,
  stressFigures,
  introFromAbove,
  selectedUnit,
  onSelectUnit,
  unitFocusRequest,
}: SceneViewProps) {
  const { t, locale } = useT();
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BattleEngine | null>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelTextRefs = useRef<(HTMLSpanElement | null)[]>([]);
  /** Measured sizes of the label texts, kept current by a ResizeObserver. */
  const labelSizes = useRef<({ width: number; height: number } | null)[]>([]);
  const unitLabelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const unitTextRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const unitSizes = useRef<({ width: number; height: number } | null)[]>([]);
  const cardRef = useRef<HTMLElement>(null);
  const cardSize = useRef<{ width: number; height: number } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [quality, setQuality] = useState<Quality>(() => readStoredQuality() ?? "high");
  const [unitNames, setUnitNames] = useState(() => readStored(UNIT_NAMES_STORAGE_KEY) !== "off");
  const [lowered, setLowered] = useState(false);
  const [hintSeen, setHintSeen] = useState(false);
  const [stats, setStats] = useState<EngineStats | null>(null);
  const [ownSelection, setOwnSelection] = useState<string | null>(null);
  const initialQuality = useRef(quality);

  const controlled = onSelectUnit !== undefined;
  const selected = controlled ? (selectedUnit ?? null) : ownSelection;
  const select = useRef<(id: string | null) => void>(() => {});
  useEffect(() => {
    select.current = (id) => (controlled ? onSelectUnit?.(id) : setOwnSelection(id));
  });

  // What the frame loop reads; it lives outside React.
  const unitNamesRef = useRef(unitNames);
  const selectedRef = useRef(selected);
  /** The card should take the focus once it is placed on screen. */
  const focusCardPending = useRef(false);
  /** Unit labels on screen in the last frame, for a click on a name. */
  const shownUnitBoxes = useRef<{ id: string; box: LabelObstacle }[]>([]);
  useEffect(() => {
    unitNamesRef.current = unitNames;
    selectedRef.current = selected;
  });

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
    ranked.sort((a, b) => a.rank - b.rank);
    return ranked.map((entry) => entry.label);
  }, [battle]);
  /** How many of `labels` come before the names of the units. */
  const placesFirst = useMemo(
    () =>
      battle.terrain.landmarks.filter((l) => (KIND_PRIORITY[l.kind] ?? KIND_PRIORITY.other) <= PLACES_BEFORE_UNITS)
        .length + battle.terrain.rivers.filter((r) => r.points.length > 0).length,
    [battle],
  );

  const unitLabels = useMemo<UnitLabel[]>(() => {
    const colors = new Map(battle.sides.map((side) => [side.id, getPolity(side.polityId)?.color]));
    return battle.units.map((unit) => ({ unit, color: colors.get(unit.side) }));
  }, [battle]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let engine: BattleEngine;
    let noticeTimer = 0;
    const position = { x: 0, y: 0 };
    const spots: (LabelSpot | null)[] = labels.map(() => null);
    const shown: string[] = labels.map(() => "");
    const unitIndex = new Map(battle.units.map((unit, i) => [unit.id, i]));
    const unitSpots: (LabelSpot | null)[] = battle.units.map(() => null);
    const unitShown: string[] = battle.units.map(() => "");
    /** The unit the card was last placed for, and where. */
    let cardFor: string | null = null;
    let cardAt = "";
    let overlays: LabelObstacle[] = [];
    let overlayAge = OVERLAY_FRAMES;

    /** Size of a label text, measured once here, then by the ResizeObserver below. */
    const sizeOf = (
      sizes: RefObject<({ width: number; height: number } | null)[]>,
      text: HTMLElement | null,
      i: number,
    ) => {
      let size = sizes.current[i];
      if (!size && text && text.offsetWidth > 0) {
        size = { width: text.offsetWidth, height: text.offsetHeight };
        sizes.current[i] = size;
      }
      return size;
    };

    const placeLabels = () => {
      if (++overlayAge >= OVERLAY_FRAMES) {
        overlayAge = 0;
        overlays = measureOverlays(host);
      }
      const view = engine.viewSize;
      const namesOn = unitNamesRef.current;
      const chosen = selectedRef.current;
      const views: readonly UnitView[] = namesOn || chosen ? engine.unitViews() : [];

      // The card of the selected unit first: the labels keep clear of it.
      let obstacles = overlays;
      const card = cardRef.current;
      if (chosen !== cardFor) {
        // Another unit: a new card, placed afresh.
        cardFor = chosen;
        cardAt = "";
        cardSize.current = null;
      }
      if (card && chosen) {
        const size = cardSize.current ?? { width: card.offsetWidth, height: card.offsetHeight };
        const at = placeCard(views.find((v) => v.id === chosen)?.box ?? null, size, view, overlays);
        if (at) {
          const key = `${Math.round(at.x)},${Math.round(at.y)}`;
          if (key !== cardAt) {
            cardAt = key;
            card.style.transform = `translate(${Math.round(at.x)}px, ${Math.round(at.y)}px)`;
            card.style.visibility = "visible";
          }
          obstacles = [...overlays, { left: at.x, top: at.y, right: at.x + size.width, bottom: at.y + size.height }];
        }
        if (focusCardPending.current && card.style.visibility === "visible") {
          focusCardPending.current = false;
          card.focus({ preventScroll: true });
        }
      }

      const placeRequest = (label: SceneLabel, i: number): LabelRequest => {
        const size = sizeOf(labelSizes, labelTextRefs.current[i], i);
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
      };

      // The units with men standing, largest on screen first.
      const units = namesOn
        ? views
            .filter((v) => v.standing > 0 && v.id !== chosen && unitIndex.has(v.id))
            .map((v) => {
              const i = unitIndex.get(v.id) ?? 0;
              return { v, i, rank: v.prominence * (unitShown[i] ? UNIT_LABEL_KEEP : 1) };
            })
            .sort((a, b) => b.rank - a.rank)
        : [];
      const unitRequests: LabelRequest[] = units.map(({ v, i }) => {
        const size = sizeOf(unitSizes, unitTextRefs.current[i], i);
        return {
          anchors: size ? v.anchors.map((a) => (a ? { x: a.x, y: a.y } : null)) : [],
          sides: UNIT_SIDES,
          width: size?.width ?? 0,
          height: size?.height ?? 0,
          dot: false,
          previous: unitSpots[i],
          margin: UNIT_LABEL_MARGIN,
        };
      });

      const head = labels.slice(0, placesFirst).map((label, i) => placeRequest(label, i));
      const tail = labels.slice(placesFirst).map((label, i) => placeRequest(label, placesFirst + i));
      const placements = layoutLabels([...head, ...unitRequests, ...tail], view, obstacles);

      const placeAt = (i: number, placement: LabelPlacement | null) => {
        spots[i] = placement && { anchor: placement.anchor, side: placement.side };
        const element = labelRefs.current[i];
        const text = labelTextRefs.current[i];
        if (!element || !text) return;
        const key = placementKey(placement);
        if (key === shown[i]) return;
        shown[i] = key;
        showLabel(element, text, placement);
      };
      head.forEach((_, i) => placeAt(i, placements[i]));
      tail.forEach((_, i) => placeAt(placesFirst + i, placements[head.length + unitRequests.length + i]));

      // Every unit label: placed, or hidden.
      const unitPlacements = new Map<number, LabelPlacement | null>();
      units.forEach(({ i }, k) => unitPlacements.set(i, placements[head.length + k]));
      const boxes: { id: string; box: LabelObstacle }[] = [];
      battle.units.forEach((unit, i) => {
        const placement = unitPlacements.get(i) ?? null;
        unitSpots[i] = placement && { anchor: placement.anchor, side: placement.side };
        if (placement) {
          const size = unitSizes.current[i];
          const left = placement.x + placement.dx;
          const top = placement.y + placement.dy;
          if (size) boxes.push({ id: unit.id, box: { left, top, right: left + size.width, bottom: top + size.height } });
        }
        const element = unitLabelRefs.current[i];
        const text = unitTextRefs.current[i];
        if (!element || !text) return;
        const key = placementKey(placement);
        if (key === unitShown[i]) return;
        unitShown[i] = key;
        showLabel(element, text, placement);
      });
      shownUnitBoxes.current = boxes;
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
        introFromAbove,
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
  }, [battle, unitTypes, stressFigures, showStats, labels, placesFirst, introFromAbove]);

  // Label texts change size with the language and the font; measure them
  // when they do, not on every frame.
  useEffect(() => {
    if (status !== "ready") return;
    const groups = [
      { texts: labelTextRefs.current, sizes: labelSizes.current },
      { texts: unitTextRefs.current, sizes: unitSizes.current },
    ];
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const box = entry.borderBoxSize?.[0];
        if (!box) continue;
        const size = { width: box.inlineSize, height: box.blockSize };
        if (entry.target === cardRef.current) {
          cardSize.current = size;
          continue;
        }
        for (const { texts, sizes } of groups) {
          const i = texts.indexOf(entry.target as HTMLSpanElement);
          if (i >= 0) sizes[i] = size;
        }
      }
    });
    for (const { texts } of groups) for (const text of texts) if (text) observer.observe(text);
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [status, labels, unitLabels, selected]);

  // A unit chosen from the list: the camera flies to it, and its card takes the focus.
  const lastFocusRequest = useRef(unitFocusRequest);
  useEffect(() => {
    if (unitFocusRequest === lastFocusRequest.current) return;
    lastFocusRequest.current = unitFocusRequest;
    if (!selected) return;
    engineRef.current?.focusUnit(selected);
    focusCardPending.current = true;
  }, [unitFocusRequest, selected]);

  // Esc closes the card before it closes the battle: the key is taken here,
  // before the dialog around the scene sees it.
  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || event.isComposing) return;
      event.preventDefault();
      event.stopPropagation();
      select.current(null);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [selected]);

  // A click (not a drag) on the scene picks the unit under it, or closes the card.
  const press = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    setHintSeen(true);
    press.current = event.isPrimary && event.button === 0 ? { x: event.clientX, y: event.clientY } : null;
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = press.current;
    press.current = null;
    const host = hostRef.current;
    const engine = engineRef.current;
    if (!start || !host || !engine || event.button !== 0) return;
    if (!(event.target instanceof Node) || !host.contains(event.target)) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > CLICK_SLOP) return;
    const frame = host.getBoundingClientRect();
    const x = event.clientX - frame.left;
    const y = event.clientY - frame.top;
    const onName = shownUnitBoxes.current.find(
      ({ box }) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom,
    );
    select.current(onName ? onName.id : engine.pickUnit(x, y));
  };

  const toggleQuality = () => {
    const next: Quality = quality === "high" ? "low" : "high";
    setQuality(next);
    setLowered(false);
    store(QUALITY_STORAGE_KEY, next);
    engineRef.current?.setQuality(next);
  };

  const toggleUnitNames = () => {
    const next = !unitNames;
    setUnitNames(next);
    // The frame loop shows or hides them from the next frame on.
    store(UNIT_NAMES_STORAGE_KEY, next ? "on" : "off");
  };

  const selectedLabel = selected ? unitLabels.find((label) => label.unit.id === selected) : undefined;
  const typeById = useMemo(() => new Map(unitTypes.map((type) => [type.id, type])), [unitTypes]);

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-surface"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        press.current = null;
      }}
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

      {/* Names of the units: a dark pill with the colour of the side (light
          in dark mode), set apart from the light boxes of the places. For
          the eye only: the list in the side panel names them for everyone. */}
      {status === "ready" &&
        unitLabels.map(({ unit, color }, i) => (
          <div
            key={unit.id}
            ref={(element) => {
              unitLabelRefs.current[i] = element;
            }}
            aria-hidden
            data-unit-label={unit.id}
            className="pointer-events-none absolute left-0 top-0"
            style={{ visibility: "hidden" }}
          >
            <span
              ref={(element) => {
                unitTextRefs.current[i] = element;
              }}
              className="absolute left-0 top-0 flex max-w-60 items-center gap-1 whitespace-nowrap rounded-full bg-foreground/85 py-0.5 pr-2 pl-1 text-[11px] font-semibold leading-4 text-background shadow-sm"
            >
              <span
                className="size-2.5 shrink-0 rounded-full border border-background"
                style={{ backgroundColor: color }}
              />
              <span className="min-w-0 truncate">{unit.name[locale]}</span>
            </span>
          </div>
        ))}

      {/* Keyed by unit: a new card starts out of sight until the next frame places it. */}
      {status === "ready" && selectedLabel && (
        <UnitCard
          key={selectedLabel.unit.id}
          cardRef={cardRef}
          battle={battle}
          unit={selectedLabel.unit}
          color={selectedLabel.color}
          type={typeById.get(selectedLabel.unit.type)}
          onClose={() => select.current(null)}
        />
      )}

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
              aria-pressed={unitNames}
              onClick={toggleUnitNames}
              className="flex items-center gap-1.5 rounded-md border border-line bg-background/85 py-1 pr-2.5 pl-2 text-xs text-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent"
            >
              <span
                aria-hidden
                className={`flex size-3.5 items-center justify-center rounded-sm border ${
                  unitNames ? "border-accent bg-accent text-on-accent" : "border-muted"
                }`}
              >
                {unitNames && (
                  <svg viewBox="0 0 12 12" className="size-2.5 fill-none stroke-current stroke-2">
                    <path d="M2.5 6.2 5 8.6l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              {t("battle.scene.unitNames")}
            </button>
            <button
              type="button"
              data-battle-overlay
              onClick={toggleQuality}
              className="rounded-md border border-line bg-background/85 px-2.5 py-1 text-xs text-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent"
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
              className="pointer-events-none absolute bottom-3 left-3 mr-3 rounded-md border border-line bg-background/85 px-2.5 py-1 text-xs text-muted"
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

interface UnitCardProps {
  cardRef: RefObject<HTMLElement | null>;
  battle: Battle;
  unit: BattleUnit;
  color: string | undefined;
  type: UnitType | undefined;
  onClose: () => void;
}

/**
 * A small card beside a unit on the scene: its name and side, its kind of
 * soldier, its men at the start and now, and what it is doing. Follows the
 * battle clock, so the numbers change while the battle plays. The frame
 * loop of the scene moves it beside its block.
 */
function UnitCard({ cardRef, battle, unit, color, type, onClose }: UnitCardProps) {
  const { t, locale } = useT();
  const titleId = useId();
  const time = useAppStore((state) => state.battleTime);
  const { men, action } = unitStateAt(battle, unit.id, time);
  const side = battle.sides.find((s) => s.id === unit.side);

  return (
    <section
      ref={cardRef}
      tabIndex={-1}
      aria-labelledby={titleId}
      aria-describedby={`${titleId}-about`}
      data-battle-card
      className="absolute left-0 top-0 w-64 max-w-[calc(100%-1rem)] rounded-md border border-line bg-background/95 p-3 text-sm text-foreground shadow-lg focus-visible:outline-2 focus-visible:outline-accent"
      style={{ visibility: "hidden" }}
    >
      <span id={`${titleId}-about`} className="sr-only">
        {t("battle.card.label")}
      </span>
      <div className="flex items-start gap-2">
        <span
          aria-hidden
          className="mt-1 size-3 shrink-0 rounded-full border border-line"
          style={{ backgroundColor: color }}
        />
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="font-semibold leading-snug">
            {unit.name[locale]}
          </h3>
          {side && <p className="text-xs text-muted">{side.name[locale]}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("battle.card.close")}
          aria-keyshortcuts="Escape"
          title={t("battle.card.close")}
          className="-mt-1 -mr-1 flex size-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
        >
          <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 fill-current">
            <path d="M4.2 3a.85.85 0 0 0-1.2 1.2L6.8 8 3 11.8A.85.85 0 1 0 4.2 13L8 9.2l3.8 3.8a.85.85 0 0 0 1.2-1.2L9.2 8 13 4.2A.85.85 0 0 0 11.8 3L8 6.8 4.2 3Z" />
          </svg>
        </button>
      </div>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        {type && (
          <>
            <dt className="text-muted">{t("battle.card.type")}</dt>
            <dd>{type.name[locale]}</dd>
          </>
        )}
        <dt className="text-muted">{t("battle.card.start")}</dt>
        <dd className="tabular-nums">{formatCount(unit.men, locale)}</dd>
        <dt className="text-muted">{t("battle.card.now")}</dt>
        <dd className="font-medium tabular-nums">{formatCount(roundMen(men), locale)}</dd>
        <dt className="text-muted">{t("battle.card.action")}</dt>
        <dd>{t(`battle.action.${action}`)}</dd>
      </dl>
    </section>
  );
}

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
