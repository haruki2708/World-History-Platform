"use client";

import { useEffect } from "react";
import { getEvent } from "@/data";
import { useAppStore } from "@/store/useAppStore";
import { resolveInitialLocale } from "./locale";
import { buildSearch, parseUrlState } from "./urlState";

/**
 * How long the year must stay still before the address bar follows it, so
 * dragging the timeline or playing it back does not rewrite the URL on every
 * frame.
 */
const YEAR_SETTLE_MS = 400;

/**
 * Keeps the address bar and the store in step. On load it applies the link's
 * `year`, `event` and `lang` (and the remembered language); afterwards it
 * mirrors the store into the URL with `history.replaceState`, so the back
 * button never fills up with every year the user passed through.
 *
 * Renders nothing. Talks to the rest of the app only through `useAppStore`.
 */
export function UrlSync() {
  useEffect(() => {
    applyLink(window.location.search);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const write = () => {
      clearTimeout(timer);
      timer = undefined;
      const { year, selectedEventId, locale } = useAppStore.getState();
      const { pathname, search, hash } = window.location;
      const next = buildSearch({ year, eventId: selectedEventId, locale }, search);
      if (next !== search) {
        window.history.replaceState(null, "", `${pathname}${next}${hash}`);
      }
    };

    // Canonical URL right away: invalid parameters disappear, missing ones
    // are filled in.
    write();

    const unsubscribe = useAppStore.subscribe((state, previous) => {
      if (
        state.selectedEventId !== previous.selectedEventId ||
        state.locale !== previous.locale
      ) {
        // One-off changes: show them at once (this also carries any year
        // change that came with selecting an event).
        write();
      } else if (state.year !== previous.year) {
        clearTimeout(timer);
        timer = setTimeout(write, YEAR_SETTLE_MS);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  return null;
}

function applyLink(search: string) {
  const link = parseUrlState(search);
  const { setLocale, setYear, selectEvent } = useAppStore.getState();

  setLocale(resolveInitialLocale(link.locale));

  if (link.eventId) {
    // Without a year of its own, the link opens at the event's year.
    const year = link.year ?? getEvent(link.eventId)?.year;
    selectEvent(link.eventId, year);
  } else if (link.year !== undefined) {
    setYear(link.year);
  }
}
