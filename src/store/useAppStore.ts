"use client";

import { create } from "zustand";
import type { Locale, MapViewport, Year } from "@/lib/types";
import { YEAR_MIN, clampYear } from "@/lib/years";

/**
 * The single shared state of the app. The timeline, the map and the tutor only
 * talk to each other through this store — never by importing one another.
 */
export interface AppState {
  /** The year the user is looking at. */
  year: Year;
  /** Written by the map on every move; read by the tutor for context. */
  viewport: MapViewport;
  selectedEventId: string | null;
  /**
   * Goes up by one every time an event is selected, even the one already
   * selected, so the map can fly back to it (e.g. from a tutor map link).
   */
  focusRequest: number;
  locale: Locale;
  /** The battle open in the 3D scene (an event id), or null for the map. */
  battleId: string | null;
  /**
   * Position on the open battle's own timeline, in phases: 0 is the start,
   * n the end of phase n; fractions lie between. See phaseAt in lib/battle.
   */
  battleTime: number;

  setYear: (year: Year) => void;
  setViewport: (viewport: MapViewport) => void;
  /** Selecting an event also moves the timeline to that event's year. */
  selectEvent: (id: string | null, year?: Year) => void;
  setLocale: (locale: Locale) => void;
  /** Opens a battle at its start. */
  openBattle: (id: string) => void;
  closeBattle: () => void;
  /** Never below 0; the scene and the controls keep it within the phases. */
  setBattleTime: (time: number) => void;
}

/** Central Mediterranean, wide enough to see Rome and Carthage. */
export const INITIAL_VIEWPORT: MapViewport = {
  center: { lng: 14, lat: 40 },
  zoom: 4,
};

export const useAppStore = create<AppState>()((set) => ({
  year: YEAR_MIN,
  viewport: INITIAL_VIEWPORT,
  selectedEventId: null,
  focusRequest: 0,
  locale: "en",
  battleId: null,
  battleTime: 0,

  setYear: (year) => set({ year: clampYear(year) }),
  setViewport: (viewport) => set({ viewport }),
  selectEvent: (id, year) =>
    set((state) => ({
      selectedEventId: id,
      ...(year === undefined ? {} : { year: clampYear(year) }),
      ...(id === null ? {} : { focusRequest: state.focusRequest + 1 }),
    })),
  setLocale: (locale) => set({ locale }),
  openBattle: (id) => set({ battleId: id, battleTime: 0 }),
  closeBattle: () => set({ battleId: null, battleTime: 0 }),
  setBattleTime: (time) =>
    set({ battleTime: Number.isFinite(time) ? Math.max(0, time) : 0 }),
}));
