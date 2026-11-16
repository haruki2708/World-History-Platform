"use client";

import { useId, useState, type Ref } from "react";
import { getPolity } from "@/data";
import { useT } from "@/lib/i18n/useT";
import { formatYear } from "@/lib/years";
import { eventDotClass } from "./eventDot";
import type { TerritoryState } from "./useTerritories";

/**
 * Legend for the polities on the map and the event marker styles. Starts
 * collapsed on narrow screens, where the map area is small.
 *
 * Polity labels keep clear of it (see labels/TerritoryLabels.tsx). On a
 * map too short for all of it, the polity list scrolls on its own, so the
 * marker key and the credits (required by the Cliopatria licence) always
 * stay in view.
 */
export function MapLegend({
  territory,
  ref,
}: {
  territory: TerritoryState;
  ref?: Ref<HTMLDivElement>;
}) {
  const { t, locale } = useT();
  const bodyId = useId();
  // Rendered only once the map has loaded in the browser, so `window` exists.
  const [open, setOpen] = useState(
    () => window.matchMedia("(min-width: 1024px)").matches,
  );

  const { status, source, territories } = territory;

  return (
    <div
      ref={ref}
      className="absolute bottom-2 left-2 z-10 flex max-h-[calc(100%-1rem)] max-w-[calc(100%-4rem)] flex-col rounded-md border border-line bg-background text-xs shadow-sm"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((value) => !value)}
        className="flex shrink-0 cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-1.5 font-semibold uppercase tracking-wide text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
      >
        {t("map.legend")}
        <span aria-hidden className="text-sm leading-none">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div
          id={bodyId}
          className="flex min-h-0 w-56 max-w-full flex-col gap-2 overflow-y-auto border-t border-line px-2.5 py-2"
        >
          {territories && source ? (
            <div className="flex min-h-14 flex-col">
              <p className="shrink-0 text-muted">
                {t("map.legend.bordersAsOf")}{" "}
                <span className="tabular-nums">
                  {formatYear(source.year, locale)}
                </span>
              </p>
              <ul className="mt-1.5 min-h-0 space-y-1 overflow-y-auto">
                {territories.polityIds.map((id) => {
                  const polity = getPolity(id);
                  if (!polity) return null;
                  return (
                    <li key={id} className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="size-3 shrink-0 rounded-sm border border-line"
                        style={{ backgroundColor: polity.color }}
                      />
                      {polity.name[locale]}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            status !== "loading" && (
              <p className="shrink-0 text-muted">
                {t(
                  status === "error"
                    ? "map.legend.bordersError"
                    : "map.legend.noBorders",
                )}
              </p>
            )
          )}

          <ul className="shrink-0 space-y-1 border-t border-line pt-2">
            <LegendDot
              label={t("map.legend.eventActive")}
              active
              approximate={false}
            />
            <LegendDot
              label={t("map.legend.eventNearby")}
              active={false}
              approximate={false}
            />
            <LegendDot
              label={t("map.legend.approximate")}
              active={false}
              approximate
            />
          </ul>

          {/* Attribution required by the CC BY 4.0 licence of Cliopatria; the
              full credits are in docs/data/SOURCES.md and the README. */}
          <p className="shrink-0 space-y-1 border-t border-line pt-2 text-muted">
            <span className="block">
              {t("map.legend.bordersCredit")}{" "}
              <a
                href="https://github.com/Seshat-Global-History-Databank/cliopatria"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-line underline-offset-2 hover:text-foreground"
              >
                Cliopatria
              </a>{" "}
              (
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-line underline-offset-2 hover:text-foreground"
              >
                CC BY 4.0
              </a>
              ).
            </span>
            <span className="block">{t("map.legend.basemap")}</span>
          </p>
        </div>
      )}
    </div>
  );
}

function LegendDot({
  label,
  active,
  approximate,
}: {
  label: string;
  active: boolean;
  approximate: boolean;
}) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden className="flex w-4 shrink-0 justify-center">
        <span
          className={eventDotClass({
            importance: 2,
            active,
            approximate,
            selected: false,
          })}
        />
      </span>
      {label}
    </li>
  );
}
