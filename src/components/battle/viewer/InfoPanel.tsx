"use client";

import { getPolity } from "@/data";
import type { Battle, NumberRange } from "@/lib/battle";
import { useT } from "@/lib/i18n/useT";
import type { SourceRef } from "@/lib/types";
import {
  MODEL_CREDIT_LINKS,
  TERRAIN_ATTRIBUTION,
  TERRAIN_DISCLAIMER,
  TERRAIN_LICENCE,
} from "./credits";
import { formatNumberRange } from "./format";

const HEADING = "text-xs font-semibold uppercase tracking-wide text-muted";
const LINK =
  "text-accent underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-accent";

/** Colour of a side, from its polity; the same one the scene paints it in. */
export function sideColor(polityId: string): string | undefined {
  return getPolity(polityId)?.color;
}

/**
 * The facts of the battle: date, the two sides with their commanders and
 * numbers, what is disputed, sources and credits.
 */
export function InfoPanel({ battle }: { battle: Battle }) {
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
          {battle.sides.map((side) => (
            <div key={side.id} className="rounded-md border border-line p-3">
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
