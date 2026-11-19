"use client";

import { Fragment, type ReactNode } from "react";
import { borderSnapshots, events, hasBattle } from "@/data";
import { MEN_PER_FIGURE } from "@/lib/battle";
import {
  MODEL_CREDIT_URLS,
  TERRAIN_ATTRIBUTION,
  TERRAIN_DISCLAIMER,
  TERRAIN_LICENCE,
} from "@/lib/credits";
import type { MessageKey } from "@/lib/i18n/messages";
import { useT } from "@/lib/i18n/useT";
import { YEAR_MAX, YEAR_MIN, formatYearRange } from "@/lib/years";
import { Modal } from "./Modal";

/**
 * Links in the credits. Every source, licence and citation here must match
 * README.md ("Data credits") and docs/data/SOURCES.md; the 3D battle ones
 * (in src/lib/credits.ts, shared with the battle viewer) also art/CREDITS.md,
 * and the battle sources the battle's own data (src/data/battles/). Change
 * them together.
 */
const LINKS = {
  cliopatriaData: "https://github.com/Seshat-Global-History-Databank/cliopatria",
  cliopatriaPaper: "https://doi.org/10.1038/s41597-025-04516-9",
  ccBy: "https://creativecommons.org/licenses/by/4.0/",
  naturalEarth: "https://www.naturalearthdata.com/",
  polybius: "https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/3*.html",
  livy: "https://en.wikisource.org/wiki/From_the_Founding_of_the_City/Book_22",
} as const;

const CLIOPATRIA_TITLE =
  "Cliopatria - A geospatial database of world-wide political entities from 3400BCE to 2024CE";

/** Events that have a 3D battle scene, in the order of the event list. */
const battleEvents = events.filter((event) => hasBattle(event.id));

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
  /** Opens the keyboard shortcuts dialog (on top of this one). */
  onShowShortcuts: () => void;
}

/** What the app is, how to use it, how far to trust it, and its sources. */
export function AboutDialog({ open, onClose, onShowShortcuts }: AboutDialogProps) {
  const { t, locale } = useT();
  const battleCount = battleEvents.length;
  const battleNames = new Intl.ListFormat(locale, { type: "conjunction" }).format(
    battleEvents.map((event) => event.title[locale]),
  );
  const pluralBattles = new Intl.PluralRules(locale).select(battleCount) === "one" ? "one" : "other";
  const infoTab = t("battle.viewer.tab.info");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("about.title")}
      closeLabel={t("about.close")}
      size="lg"
    >
      <div className="space-y-5 text-sm leading-relaxed">
        <Section heading={t("about.what.heading")}>
          <p>
            {fill(t("about.what.body"), {
              range: formatYearRange(YEAR_MIN, YEAR_MAX, locale),
              events: events.length,
              snapshots: borderSnapshots.length,
              battles: fill(t(`about.what.battles.${pluralBattles}`), { count: battleCount }),
            })}
          </p>
        </Section>

        <Section heading={t("about.use.heading")}>
          <ul className="list-disc space-y-1.5 pl-5 marker:text-muted">
            <li>{t("about.use.timeline")}</li>
            <li>{t("about.use.events")}</li>
            {battleCount > 0 && (
              <li>
                {fill(t("about.use.battle"), {
                  battles: battleNames,
                  button: t("battle.open"),
                  space: <Key>Space</Key>,
                  left: <Key>←</Key>,
                  right: <Key>→</Key>,
                  esc: <Key>Esc</Key>,
                })}
              </li>
            )}
            <li>{t("about.use.tutor")}</li>
            <li>{t("about.use.links")}</li>
            <li>{t("about.use.share")}</li>
          </ul>
          <button
            type="button"
            onClick={onShowShortcuts}
            className="mt-3 flex items-center gap-2 rounded-md border border-line px-2.5 py-1.5 text-sm hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <kbd
              aria-hidden
              className="inline-flex min-w-5 items-center justify-center rounded border border-line border-b-2 bg-surface px-1 text-xs font-medium"
            >
              ?
            </kbd>
            {t("about.use.shortcuts")}
          </button>
        </Section>

        <Section heading={t("about.accuracy.heading")}>
          <Bullets
            keys={[
              "about.accuracy.borders",
              "about.accuracy.blank",
              "about.accuracy.coast",
              "about.accuracy.dates",
              "about.accuracy.tutor",
            ]}
          >
            {battleCount > 0 && (
              <li>
                {t("about.accuracy.battle")}
                <ul className="mt-1.5 list-[circle] space-y-1.5 pl-5 marker:text-muted">
                  <li>{fill(t("about.accuracy.battle.positions"), { tab: infoTab })}</li>
                  <li>{fill(t("about.accuracy.battle.figures"), { men: MEN_PER_FIGURE })}</li>
                  <li>{t("about.accuracy.battle.duels")}</li>
                  <li>{t("about.accuracy.battle.time")}</li>
                  <li>{t("about.accuracy.battle.pulses")}</li>
                  <li>{t("about.accuracy.battle.scenery")}</li>
                  <li>{t("about.accuracy.battle.dust")}</li>
                  <li>{t("about.accuracy.battle.colours")}</li>
                </ul>
              </li>
            )}
          </Bullets>
        </Section>

        <Section heading={t("about.credits.heading")}>
          <ul className="list-disc space-y-2 pl-5 marker:text-muted">
            <li>
              {t("about.credits.borders")}
              <ul className="mt-1.5 list-[circle] space-y-1.5 pl-5 marker:text-muted">
                <li>
                  {fill(t("about.credits.shepherd"), {
                    title: <cite>Historical Atlas</cite>,
                  })}
                </li>
                <li>
                  {fill(t("about.credits.cliopatria"), {
                    citation: (
                      <>
                        Bennett J. S. {t("about.credits.etAl")}, “{CLIOPATRIA_TITLE}”,{" "}
                        <cite>Scientific Data</cite> 12, 247 (2025)
                      </>
                    ),
                    license: <ExternalLink href={LINKS.ccBy}>CC BY 4.0</ExternalLink>,
                  })}{" "}
                  <span className="whitespace-nowrap">
                    <ExternalLink href={LINKS.cliopatriaData}>
                      {t("about.credits.data")}
                    </ExternalLink>
                    {" · "}
                    <ExternalLink href={LINKS.cliopatriaPaper}>
                      {t("about.credits.paper")}
                    </ExternalLink>
                  </span>
                </li>
              </ul>
            </li>
            <li>
              {fill(t("about.credits.basemap"), {
                link: (
                  <ExternalLink href={LINKS.naturalEarth}>Natural Earth</ExternalLink>
                ),
              })}
            </li>
            <li>{t("about.credits.events")}</li>
            {battleCount > 0 && (
              <li>
                {t("about.credits.battles")}
                <ul className="mt-1.5 list-[circle] space-y-1.5 pl-5 marker:text-muted">
                  <li>
                    {fill(t("about.credits.terrain"), {
                      attribution: <span lang="en">{TERRAIN_ATTRIBUTION}</span>,
                      disclaimer: <span lang="en">{TERRAIN_DISCLAIMER}</span>,
                      licence: (
                        <ExternalLink href={TERRAIN_LICENCE.url}>{TERRAIN_LICENCE.title}</ExternalLink>
                      ),
                    })}
                  </li>
                  <li>
                    {fill(t("about.credits.models"), {
                      roman: (
                        <ExternalLink href={MODEL_CREDIT_URLS.romanSoldier}>
                          Roman Soldier - T pose
                        </ExternalLink>
                      ),
                      celt: (
                        <ExternalLink href={MODEL_CREDIT_URLS.celt}>Celt - rigged for UE4/5</ExternalLink>
                      ),
                      ccBy4: <ExternalLink href={MODEL_CREDIT_URLS.ccBy4}>CC BY 4.0</ExternalLink>,
                    })}
                  </li>
                  <li>
                    {fill(t("about.credits.horses"), {
                      horse: <ExternalLink href={MODEL_CREDIT_URLS.horse}>Horse</ExternalLink>,
                      ccBy3: <ExternalLink href={MODEL_CREDIT_URLS.ccBy3}>CC BY 3.0</ExternalLink>,
                      rigged: (
                        <ExternalLink href={MODEL_CREDIT_URLS.horseRig}>
                          Horse Rigged All Gaits
                        </ExternalLink>
                      ),
                    })}
                  </li>
                  <li>
                    {fill(t("about.credits.animations"), {
                      library: (
                        <ExternalLink href={MODEL_CREDIT_URLS.animations}>
                          Universal Animation Library
                        </ExternalLink>
                      ),
                    })}
                  </li>
                  <li>
                    {fill(t("about.credits.battleSources"), {
                      polybius: <ExternalLink href={LINKS.polybius}>Polybius 3.107–118</ExternalLink>,
                      livy: <ExternalLink href={LINKS.livy}>Livy 22.36–52</ExternalLink>,
                      tab: infoTab,
                    })}
                  </li>
                </ul>
              </li>
            )}
          </ul>
        </Section>

        <Section heading={t("about.tutor.heading")}>
          <Bullets
            keys={[
              "about.tutor.model",
              "about.tutor.context",
              "about.tutor.storage",
              "about.tutor.limits",
            ]}
          />
        </Section>
      </div>
    </Modal>
  );
}

function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        {heading}
      </h3>
      {children}
    </section>
  );
}

function Bullets({ keys, children }: { keys: MessageKey[]; children?: ReactNode }) {
  const { t } = useT();
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-muted">
      {keys.map((key) => (
        <li key={key}>{t(key)}</li>
      ))}
      {children}
    </ul>
  );
}

/** A key on the keyboard, as in the shortcuts dialog. */
function Key({ children }: { children: ReactNode }) {
  return (
    <kbd
      className="inline-flex min-w-5 items-center justify-center rounded border border-line border-b-2 bg-surface px-1 text-xs font-medium"
    >
      {children}
    </kbd>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  const { t } = useT();
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
    >
      {children}
      <span className="sr-only"> ({t("about.newTab")})</span>
    </a>
  );
}

/**
 * Replaces `{name}` placeholders in a translated string with text or elements,
 * so links and titles can sit inside a sentence in either language.
 */
function fill(template: string, parts: Record<string, ReactNode>): ReactNode {
  return template.split(/(\{\w+\})/).map((piece, index) => {
    const name = /^\{(\w+)\}$/.exec(piece)?.[1];
    return (
      <Fragment key={index}>
        {name !== undefined && name in parts ? parts[name] : piece}
      </Fragment>
    );
  });
}
