"use client";

import { useT } from "@/lib/i18n/useT";

interface FirstVisitHintProps {
  onOpen: () => void;
  onDismiss: () => void;
}

/**
 * A small pill in the header, shown until the user opens About or dismisses
 * it. It sits in the header row instead of floating over the map or panels,
 * so it never covers the main content.
 */
export function FirstVisitHint({ onOpen, onDismiss }: FirstVisitHintProps) {
  const { t } = useT();

  return (
    <div className="flex max-w-full min-w-0 items-center rounded-full border border-accent/40 bg-accent/10 text-sm max-sm:basis-full">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 items-center gap-1.5 rounded-full py-1 pr-1 pl-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="min-w-0 truncate">
          {t("about.hint.lead")}{" "}
          <span className="font-medium text-accent underline decoration-accent/40 underline-offset-2">
            {t("about.hint.open")}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t("about.hint.dismiss")}
        title={t("about.hint.dismiss")}
        className="mr-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-accent/10 hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
      >
        <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 fill-current">
          <path d="M4.2 3a.85.85 0 0 0-1.2 1.2L6.8 8 3 11.8A.85.85 0 1 0 4.2 13L8 9.2l3.8 3.8a.85.85 0 0 0 1.2-1.2L9.2 8 13 4.2A.85.85 0 0 0 11.8 3L8 6.8 4.2 3Z" />
        </svg>
      </button>
    </div>
  );
}
