"use client";

import { useId } from "react";
import { getPolity } from "@/data";
import type { Battle, BattleSide, NumberRange } from "@/lib/battle";
import {
  MODEL_CREDIT_LINKS,
  TERRAIN_ATTRIBUTION,
  TERRAIN_DISCLAIMER,
  TERRAIN_LICENCE,
} from "@/lib/credits";
import { useT } from "@/lib/i18n/useT";
import type { SourceRef } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { roundMen, unitStateAt } from "../unitState";
import { formatCount, formatNumberRange } from "./format";

const HEADING = "text-xs font-semibold uppercase tracking-wide text-muted";
const LINK =
  "text-accent underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-accent";

/** Colour of a side, from its polity; the same one the scene paints it in. */
export function sideColor(polityId: string): string | undefined {
  return getPolity(polityId)?.color;
}

interface InfoPanelProps {
  battle: Battle;
  /** The unit whose card is open on the scene. */
  selectedUnit: string | null;
  /** A unit chosen in the list: the scene flies to it and opens its card. */
  onChooseUnit: (id: string, row: HTMLElement) => void;
}

/**
 * The facts of the battle: date, the two sides with their commanders,
 * numbers and units, what is disputed, sources and credits. The list of
 * units is the way to a unit's card without a mouse.
 */
export function InfoPanel({ battle, selectedUnit, onChooseUnit }: InfoPanelProps) {
  const { t, locale } = useT();

  return (
    <div className="space-y-5 text-sm">
      <section>
        <h3 className={HEADING}>{t("battle.info.date")}</h3>
        <p className="mt-1">{battle.date[locale]}</p>
      </section>

      <section>
        <h3 className={HEADING}>{t("battle.info.sides")}</h3>
        <div className="mt-2 space-y-2.5">
          {battle.sides.map((side, index) => (
            <div key={side.id} className="rounded-xl border border-line/75 bg-surface/55 p-3.5">
              <h4 className="flex items-center gap-2 font-semibold">
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full border border-line"
                  style={{ backgroundColor: sideColor(side.polityId) }}
                />
                {side.name[locale]}
              </h4>
              <dl className="mt-2 space-y-2">
                <div>
                  <dt className="text-xs text-muted">{t("battle.info.commanders")}</dt>
                  <dd>
                    <ul className="list-disc pl-4">
                      {side.commanders.map((commander) => (
                        <li key={commander.en}>{commander[locale]}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <Figures label={t("battle.info.strength")} range={side.strength} />
                {side.casualties && (
                  <Figures label={t("battle.info.casualties")} range={side.casualties} />
                )}
              </dl>
              <UnitList
                battle={battle}
                side={side}
                hint={index === 0}
                selectedUnit={selectedUnit}
                onChoose={onChooseUnit}
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className={HEADING}>{t("battle.info.uncertainty")}</h3>
        <p className="mt-1 leading-relaxed">{battle.uncertainty[locale]}</p>
      </section>

      <section>
        <h3 className={HEADING}>{t("battle.info.sources")}</h3>
        <SourceList label={t("battle.info.sources.battle")} sources={battle.sources} />
        <SourceList label={t("battle.info.sources.terrain")} sources={battle.terrain.sources} />
      </section>

      <section>
        <h3 className={HEADING}>{t("battle.credits.heading")}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">{t("battle.credits.models")}</p>
        <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          {MODEL_CREDIT_LINKS.map((link) => (
            <li key={link.url}>
              <ExternalLink href={link.url}>{link.title}</ExternalLink>
            </li>
          ))}
        </ul>
        {/* The licence wants these sentences as they are, so they stay English. */}
        <p className="mt-2 text-xs leading-relaxed text-muted">
          {t("battle.credits.terrain")}: <span lang="en">{TERRAIN_ATTRIBUTION}</span>{" "}
          <span lang="en">{TERRAIN_DISCLAIMER}</span>{" "}
          <ExternalLink href={TERRAIN_LICENCE.url}>{TERRAIN_LICENCE.title}</ExternalLink>
        </p>
      </section>
    </div>
  );
}

/** A low and a high figure, with the note on which source says what. */
function Figures({ label, range }: { label: string; range: NumberRange }) {
  const { t, locale } = useT();
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd>
        <span className="font-medium tabular-nums">
          {t("battle.info.men").replace("{count}", formatNumberRange(range, locale))}
        </span>
        {range.note && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{range.note[locale]}</p>
        )}
      </dd>
    </div>
  );
}

interface UnitListProps {
  battle: Battle;
  side: BattleSide;
  /** Say what choosing a unit does (above the first list only). */
  hint: boolean;
  selectedUnit: string | null;
  onChoose: (id: string, row: HTMLElement) => void;
}

/**
 * The units of one side, each with its men at the battle time under way;
 * follows the battle clock. Choosing one shows it on the field.
 */
function UnitList({ battle, side, hint, selectedUnit, onChoose }: UnitListProps) {
  const { t, locale } = useT();
  const headingId = useId();
  const time = useAppStore((state) => Math.min(state.battleTime, battle.phases.length));
  const units = battle.units.filter((unit) => unit.side === side.id);
  if (units.length === 0) return null;

  return (
    <div className="mt-3">
      <h5 id={headingId} className="text-xs text-muted">
        {t("battle.info.units")}
      </h5>
      {hint && <p className="text-xs text-muted">{t("battle.info.units.hint")}</p>}
      <ul aria-labelledby={headingId} className="mt-1 -mx-1.5">
        {units.map((unit) => {
          const moment = unitStateAt(battle, unit.id, time);
          const men = roundMen(moment.men);
          const current = unit.id === selectedUnit;
          return (
            <li key={unit.id}>
              <button
                type="button"
                aria-current={current ? "true" : undefined}
                onClick={(event) => onChoose(unit.id, event.currentTarget)}
                className={`flex w-full items-baseline justify-between gap-3 rounded-lg px-2 py-1 text-left hover:bg-background/80 focus-visible:outline-2 focus-visible:outline-accent ${
                  current ? "bg-background/90 font-medium ring-1 ring-accent/35" : ""
                }`}
              >
                <span className="min-w-0">
                  {unit.name[locale]}
                  {moment.hidden && <span className="ml-1.5 text-xs text-muted">{t("battle.info.units.hidden")}</span>}
                </span>
                <span className="shrink-0 text-xs text-muted tabular-nums">
                  {t("battle.info.men").replace("{count}", formatCount(men, locale))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SourceList({ label, sources }: { label: string; sources: SourceRef[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="mt-1.5">
      <h4 className="text-xs text-muted">{label}</h4>
      <ul className="mt-0.5 list-disc space-y-1 pl-4">
        {sources.map((source) => (
          <li key={source.title} className="break-words">
            {source.url ? <ExternalLink href={source.url}>{source.title}</ExternalLink> : source.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExternalLink({ href, children }: { href: string; children: string }) {
  const { t } = useT();
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className={LINK}>
      {children}
      <span className="sr-only"> ({t("battle.info.newTab")})</span>
    </a>
  );
}
