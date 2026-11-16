"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { loadBattle, unitTypes } from "@/data";
import { type Battle, hourAt, phaseAt } from "@/lib/battle";
import { useAppStore } from "@/store/useAppStore";

// three.js runs only in the browser, and only once the lab opens.
const BattleScene = dynamic(
  () => import("@/components/battle/BattleScene").then((m) => m.BattleScene),
  { ssr: false },
);

const DEFAULT_BATTLE = "battle-of-cannae";

const noSubscribe = () => () => {};

/** ?battle=<event id>&stats=1&stress=<figures>&lang=vi */
function useLabParams() {
  const search = useSyncExternalStore(
    noSubscribe,
    () => window.location.search,
    () => "",
  );
  const params = new URLSearchParams(search);
  const stress = Number(params.get("stress"));
  return {
    battleId: params.get("battle") ?? DEFAULT_BATTLE,
    showStats: params.get("stats") === "1",
    stressFigures: Number.isInteger(stress) && stress > 0 ? stress : undefined,
    locale: params.get("lang") === "vi" ? ("vi" as const) : ("en" as const),
  };
}

function formatHour(hour: number): string {
  const minutes = Math.round(hour * 60);
  const hh = String(Math.floor(minutes / 60) % 24).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function BattleLab() {
  const { battleId, showStats, stressFigures, locale } = useLabParams();
  const setLocale = useAppStore((s) => s.setLocale);
  useEffect(() => setLocale(locale), [locale, setLocale]);
  const [battle, setBattle] = useState<Battle | null>(null);
  const [missing, setMissing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const time = useAppStore((s) => s.battleTime);
  const setTime = useAppStore((s) => s.setBattleTime);
  const openBattle = useAppStore((s) => s.openBattle);
  const closeBattle = useAppStore((s) => s.closeBattle);

  useEffect(() => {
    let alive = true;
    openBattle(battleId);
    loadBattle(battleId).then((loaded) => {
      if (!alive) return;
      if (loaded) setBattle(loaded);
      else setMissing(true);
    });
    return () => {
      alive = false;
      closeBattle();
    };
  }, [battleId, openBattle, closeBattle]);

  // Playback: each phase takes its own playSeconds.
  useEffect(() => {
    if (!playing || !battle) return;
    const end = battle.phases.length;
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const seconds = (now - last) / 1000;
      last = now;
      const current = useAppStore.getState().battleTime;
      const phase = battle.phases[phaseAt(battle, current) - 1];
      const next = current + seconds / phase.playSeconds;
      if (next >= end) {
        setTime(end);
        setPlaying(false);
        return;
      }
      setTime(next);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing, battle, setTime]);

  if (missing) {
    return <p className="p-6 text-sm">No battle data for “{battleId}”.</p>;
  }
  if (!battle) {
    return <p className="p-6 text-sm text-muted">Loading {battleId}…</p>;
  }

  const end = battle.phases.length;
  const phase = battle.phases[phaseAt(battle, time) - 1];

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <div className="min-h-0 flex-1">
        <BattleScene
          battle={battle}
          unitTypes={unitTypes}
          debug={{ showStats, stressFigures }}
        />
      </div>
      <div className="flex shrink-0 items-center gap-3 border-t border-line px-4 py-2 text-sm">
        <button
          type="button"
          className="w-16 rounded-md border border-line px-2 py-1 hover:bg-surface"
          onClick={() => {
            if (!playing && time >= end) setTime(0);
            setPlaying(!playing);
          }}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min={0}
          max={end}
          step={0.001}
          value={Math.min(time, end)}
          onChange={(e) => {
            setPlaying(false);
            setTime(Number(e.target.value));
          }}
          className="min-w-0 flex-1"
          aria-label="Battle time"
        />
        <span className="w-14 tabular-nums">{formatHour(hourAt(battle, time))}</span>
        <span className="w-64 truncate" title={phase.title.en}>
          {phaseAt(battle, time)}/{end} · {phase.title.en}
        </span>
      </div>
    </div>
  );
}
