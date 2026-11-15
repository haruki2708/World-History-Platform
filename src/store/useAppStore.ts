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

  setYear: (year: Year) => void;
  setViewport: (viewport: MapViewport) => void;
  /** Selecting an event also moves the timeline to that event's year. */
  selectEvent: (id: string | null, year?: Year) => void;
  setLocale: (locale: Locale) => void;
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

  setYear: (year) => set({ year: clampYear(year) }),
  setViewport: (viewport) => set({ viewport }),
  selectEvent: (id, year) =>
    set((state) => ({
      selectedEventId: id,
      ...(year === undefined ? {} : { year: clampYear(year) }),
      ...(id === null ? {} : { focusRequest: state.focusRequest + 1 }),
    })),
  setLocale: (locale) => set({ locale }),
}));
