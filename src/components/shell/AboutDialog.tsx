"use client";

import { Fragment, type ReactNode } from "react";
import { borderSnapshots, events } from "@/data";
import type { MessageKey } from "@/lib/i18n/messages";
import { useT } from "@/lib/i18n/useT";
import { YEAR_MAX, YEAR_MIN, formatYearRange } from "@/lib/years";
import { Modal } from "./Modal";

/**
 * Links in the credits. Every source, licence and citation here must match
 * README.md ("Data credits") and docs/data/SOURCES.md; change them together.
 */
const LINKS = {
  cliopatriaData: "https://github.com/Seshat-Global-History-Databank/cliopatria",
  cliopatriaPaper: "https://doi.org/10.1038/s41597-025-04516-9",
  ccBy: "https://creativecommons.org/licenses/by/4.0/",
  naturalEarth: "https://www.naturalearthdata.com/",
} as const;

const CLIOPATRIA_TITLE =
  "Cliopatria - A geospatial database of world-wide political entities from 3400BCE to 2024CE";

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
  /** Opens the keyboard shortcuts dialog (on top of this one). */
  onShowShortcuts: () => void;
}

/** What the app is, how to use it, how far to trust it, and its sources. */
export function AboutDialog({ open, onClose, onShowShortcuts }: AboutDialogProps) {
  const { t, locale } = useT();

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
            })}
          </p>
        </Section>

        <Section heading={t("about.use.heading")}>
          <Bullets
            keys={[
              "about.use.timeline",
              "about.use.events",
              "about.use.tutor",
              "about.use.links",
              "about.use.share",
            ]}
          />
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
          />
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

function Bullets({ keys }: { keys: MessageKey[] }) {
  const { t } = useT();
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-muted">
      {keys.map((key) => (
        <li key={key}>{t(key)}</li>
      ))}
    </ul>
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
