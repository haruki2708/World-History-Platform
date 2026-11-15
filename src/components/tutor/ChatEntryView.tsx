"use client";

import type { ReactNode } from "react";
import { useT } from "@/lib/i18n/useT";
import { formatYear } from "@/lib/years";
import { RETRYABLE_ERRORS, type ChatEntry } from "./useTutorChat";

interface ChatEntryViewProps {
  entry: ChatEntry;
  /** Only the latest answer can be retried. */
  isLast: boolean;
  onRetry: () => void;
}

export function ChatEntryView({ entry, isLast, onRetry }: ChatEntryViewProps) {
  const { t, locale } = useT();

  if (entry.role === "user") {
    return (
      <li className="flex flex-col items-end gap-1">
        <span className="text-[11px] text-muted tabular-nums">
          <span className="sr-only">{t("tutor.you")} · </span>
          {t("tutor.askedAt").replace(
            "{year}",
            formatYear(entry.context.year, locale),
          )}
        </span>
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-surface px-3 py-2 text-sm">
          {entry.content}
        </p>
      </li>
    );
  }

  const waiting = entry.status === "streaming" && entry.content === "";

  return (
    <li className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-[11px] text-muted">
        {t("tutor.assistant")}
        {entry.depth === "deep" && (
          <span className="rounded-full border border-line px-1.5 leading-tight">
            {t("tutor.deepTag")}
          </span>
        )}
      </span>

      {waiting && (
        <p className="text-sm text-muted motion-safe:animate-pulse">
          {t("tutor.thinking")}
        </p>
      )}
      {entry.content && (
        <AnswerText
          text={entry.content}
          streaming={entry.status === "streaming"}
        />
      )}

      {entry.status === "stopped" && (
        <p className="text-xs text-muted italic">{t("tutor.stopped")}</p>
      )}
      {entry.status === "done" && entry.truncated && (
        <p className="text-xs text-muted italic">{t("tutor.truncated")}</p>
      )}
      {entry.status === "error" && entry.error && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md border border-accent/40 bg-accent/5 px-3 py-2 text-sm">
          <p className="min-w-0 flex-1">{t(`tutor.error.${entry.error}`)}</p>
          {isLast && RETRYABLE_ERRORS.has(entry.error) && (
            <button
              type="button"
              onClick={onRetry}
              className="shrink-0 rounded-md border border-line bg-background px-2.5 py-1 text-xs font-medium hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent"
            >
              {t("tutor.retry")}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

type Block =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

const BULLET = /^\s*- /;

/**
 * Answers use only paragraphs and "- " bullet lines (see the tutor prompt), so
 * this tiny parser renders exactly those two forms as plain React text.
 */
function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] | null = null;

  const flush = () => {
    if (paragraph.length) {
      blocks.push({ kind: "paragraph", text: paragraph.join("\n") });
      paragraph = [];
    }
    if (list) {
      blocks.push({ kind: "list", items: list });
      list = null;
    }
  };

  for (const line of text.split("\n")) {
    if (line.trim() === "") {
      flush();
    } else if (BULLET.test(line)) {
      if (paragraph.length) flush();
      list ??= [];
      list.push(line.replace(BULLET, ""));
    } else {
      if (list) flush();
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}

function AnswerText({ text, streaming }: { text: string; streaming: boolean }) {
  const blocks = parseBlocks(text);
  const caret: ReactNode = streaming ? (
    <span
      aria-hidden
      className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-accent/60 motion-safe:animate-pulse"
    />
  ) : null;

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {blocks.map((block, index) => {
        const isLastBlock = index === blocks.length - 1;
        if (block.kind === "paragraph") {
          return (
            <p key={index} className="whitespace-pre-line break-words">
              {block.text}
              {isLastBlock && caret}
            </p>
          );
        }
        return (
          <ul key={index} className="list-disc space-y-1 pl-5 marker:text-muted">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="break-words">
                {item}
                {isLastBlock && itemIndex === block.items.length - 1 && caret}
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}
