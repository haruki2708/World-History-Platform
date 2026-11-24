"use client";

import { getEvent } from "@/data";
import { useT } from "@/lib/i18n/useT";
import type { TutorMapLink } from "@/lib/tutor";
import { formatYear } from "@/lib/years";
import { useAppStore } from "@/store/useAppStore";

/**
 * The "view on the map" buttons under an answer. Labels are built here from
 * the data, in the current language, so they follow a language switch.
 * Clicking moves the app through the store only: `selectEvent` for an event
 * (the timeline, the panel and the map follow), `setYear` for a bare year.
 * Playback pauses by itself when the year is moved from outside the timeline.
 */
export function MapLinkButtons({
  links,
  onEventSelect,
}: {
  links: readonly TutorMapLink[];
  onEventSelect?: () => void;
}) {
  const { t } = useT();
  if (links.length === 0) return null;

  return (
    <ul aria-label={t("tutor.mapLinks")} className="flex flex-wrap gap-1.5 pt-0.5">
      {links.map((link) => (
        <li key={`${link.eventId ?? ""}@${link.year}`} className="min-w-0 max-w-full">
          <MapLinkButton link={link} onEventSelect={onEventSelect} />
        </li>
      ))}
    </ul>
  );
}

function MapLinkButton({
  link,
  onEventSelect,
}: {
  link: TutorMapLink;
  onEventSelect?: () => void;
}) {
  const { t, locale } = useT();
  const year = useAppStore((state) => state.year);
  const selectedEventId = useAppStore((state) => state.selectedEventId);
  const event = link.eventId ? getEvent(link.eventId) : undefined;

  // A bare year only asks for the year; an event link also needs the event.
  const current =
    year === link.year && (event ? selectedEventId === event.id : true);

  const yearText = formatYear(link.year, locale);
  const visible = event
    ? `${event.title[locale]} · ${yearText}`
    : t("tutor.mapLink.year").replace("{year}", yearText);
  const target = event ? `${event.title[locale]}, ${yearText}` : yearText;
  const label = t("tutor.mapLink.label").replace("{target}", target);

  const go = () => {
    const { selectEvent, setYear } = useAppStore.getState();
    if (event) {
      onEventSelect?.();
      selectEvent(event.id, link.year);
    } else {
      setYear(link.year);
    }
  };

  return (
    <button
      type="button"
      onClick={go}
      aria-label={label}
      aria-current={current ? "location" : undefined}
      title={current ? `${label} (${t("tutor.mapLink.current")})` : label}
      className={`flex max-w-full items-center gap-1.5 rounded-xl border px-2.5 py-1 text-left text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        current
          ? "border-accent/60 bg-accent/10 text-foreground"
          : "border-line/85 bg-surface/65 text-foreground hover:border-accent hover:bg-surface"
      }`}
    >
      {/* Marking the current link swaps the icon for a check rather than
          adding text, so the buttons never change width and reflow. */}
      <span aria-hidden className={`shrink-0 ${current ? "text-accent" : "text-muted"}`}>
        {current ? <CheckIcon /> : event ? <PinIcon /> : <ClockIcon />}
      </span>
      <span className="min-w-0 truncate">{visible}</span>
    </button>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 fill-current">
      <path d="M8 1.5a4.75 4.75 0 0 0-4.75 4.75c0 3.3 3.86 7.45 4.2 7.8a.75.75 0 0 0 1.1 0c.34-.35 4.2-4.5 4.2-7.8A4.75 4.75 0 0 0 8 1.5Zm0 6.6a1.85 1.85 0 1 1 0-3.7 1.85 1.85 0 0 1 0 3.7Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.75V8l2.25 1.5" />
    </svg>
  );
}
