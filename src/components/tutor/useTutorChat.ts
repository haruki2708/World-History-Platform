"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  TUTOR_LIMITS,
  type TutorContext,
  type TutorDepth,
  type TutorErrorCode,
  type TutorMessage,
} from "@/lib/tutor";
import { useAppStore } from "@/store/useAppStore";
import { streamTutor } from "./tutorClient";

export type AnswerStatus = "streaming" | "done" | "stopped" | "error";

export type ChatEntry =
  | { id: string; role: "user"; content: string; context: TutorContext }
  | {
      id: string;
      role: "assistant";
      content: string;
      status: AnswerStatus;
      depth: TutorDepth;
      error?: TutorErrorCode;
      truncated?: boolean;
    };

type AssistantEntry = Extract<ChatEntry, { role: "assistant" }>;

/** What the screen reader should hear once an answer settles. */
export type Announcement =
  | { kind: "answer"; text: string; id: number }
  | { kind: "error"; code: TutorErrorCode; id: number };

/** Errors worth a "try again" button: they are usually temporary. */
export const RETRYABLE_ERRORS: ReadonlySet<TutorErrorCode> = new Set([
  "rate_limited",
  "overloaded",
  "unavailable",
]);

let nextId = 0;
const newId = () => `m${++nextId}`;

/** Snapshot of what the user is looking at, taken at the moment of sending. */
function captureContext(): TutorContext {
  const { year, locale, viewport, selectedEventId } = useAppStore.getState();
  return { year, locale, viewport: structuredClone(viewport), selectedEventId };
}

/**
 * Turns the visible conversation into the request history. Earlier messages
 * are sent exactly as they were first sent (same text, same context). An
 * exchange whose answer produced no text at all (failed or stopped before the
 * first word) is left out, so the history stays a clean user/assistant
 * alternation; the same rule applies every time, so the history is stable.
 */
function toHistory(entries: ChatEntry[]): TutorMessage[] {
  const history: TutorMessage[] = [];
  for (let i = 0; i < entries.length - 1; i++) {
    const question = entries[i];
    const answer = entries[i + 1];
    if (question.role !== "user" || answer.role !== "assistant") continue;
    if (answer.status === "streaming" || answer.content === "") continue;
    history.push(
      { role: "user", content: question.content, context: question.context },
      { role: "assistant", content: answer.content },
    );
    i++;
  }
  return history;
}

export function useTutorChat() {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Abort any request still running when the panel unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  const busy = entries.some(
    (entry) => entry.role === "assistant" && entry.status === "streaming",
  );
  /** True when one more question would break TUTOR_LIMITS.maxMessages. */
  const atLimit = toHistory(entries).length + 1 > TUTOR_LIMITS.maxMessages;

  const updateAnswer = useCallback(
    (id: string, update: (entry: AssistantEntry) => Partial<AssistantEntry>) => {
      setEntries((current) =>
        current.map((entry) =>
          entry.id === id && entry.role === "assistant"
            ? { ...entry, ...update(entry) }
            : entry,
        ),
      );
    },
    [],
  );

  /** Streams an answer to `messages` into the assistant entry `answerId`. */
  const run = useCallback(
    async (messages: TutorMessage[], depth: TutorDepth, answerId: string) => {
      const controller = new AbortController();
      abortRef.current = controller;
      let text = "";
      try {
        const outcome = await streamTutor(
          { messages, depth },
          {
            signal: controller.signal,
            onText: (piece) => {
              text += piece;
              updateAnswer(answerId, () => ({ content: text }));
            },
          },
        );
        if (outcome.kind === "done") {
          updateAnswer(answerId, () => ({
            status: "done",
            truncated: outcome.truncated,
          }));
          setAnnouncement({ kind: "answer", text, id: Date.now() });
        } else {
          updateAnswer(answerId, () => ({ status: "error", error: outcome.code }));
          setAnnouncement({ kind: "error", code: outcome.code, id: Date.now() });
        }
      } catch {
        // Only an abort reaches here: keep what arrived and mark it stopped.
        updateAnswer(answerId, () => ({ status: "stopped" }));
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [updateAnswer],
  );

  const send = (question: string, depth: TutorDepth) => {
    const content = question.trim().slice(0, TUTOR_LIMITS.maxQuestionChars);
    if (!content || busy || atLimit) return;

    const userEntry: ChatEntry = {
      id: newId(),
      role: "user",
      content,
      context: captureContext(),
    };
    const answerEntry: ChatEntry = {
      id: newId(),
      role: "assistant",
      content: "",
      status: "streaming",
      depth,
    };
    const messages: TutorMessage[] = [
      ...toHistory(entries),
      { role: "user", content, context: userEntry.context },
    ];
    setEntries([...entries, userEntry, answerEntry]);
    void run(messages, depth, answerEntry.id);
  };

  /** Asks the last question again, unchanged, replacing its failed answer. */
  const retry = () => {
    const answer = entries[entries.length - 1];
    const question = entries[entries.length - 2];
    if (busy || answer?.role !== "assistant" || question?.role !== "user") return;

    const answerEntry: ChatEntry = {
      id: newId(),
      role: "assistant",
      content: "",
      status: "streaming",
      depth: answer.depth,
    };
    const messages: TutorMessage[] = [
      ...toHistory(entries.slice(0, -2)),
      { role: "user", content: question.content, context: question.context },
    ];
    setEntries([...entries.slice(0, -1), answerEntry]);
    void run(messages, answer.depth, answerEntry.id);
  };

  const stop = () => abortRef.current?.abort();

  const reset = () => {
    abortRef.current?.abort();
    setEntries([]);
    setAnnouncement(null);
  };

  return { entries, busy, atLimit, announcement, send, retry, stop, reset };
}
