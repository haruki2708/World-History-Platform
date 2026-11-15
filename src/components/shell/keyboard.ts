"use client";

import { useEffect, useRef } from "react";

/**
 * Page-wide keyboard shortcuts. Each part of the page registers the keys it
 * owns with `useShortcuts` (the timeline its playback keys, the tutor `/`,
 * the help dialog `?`); this module decides centrally when a key press is
 * free to be used as a shortcut at all.
 *
 * Listeners sit on `window`, so they run after React's own handlers: a
 * component that handles a key itself (the timeline slider's arrows, the
 * marker toolbar) calls `preventDefault` and the shortcut stands aside.
 */

const TEXT_INPUT_TYPES = new Set([
  "text",
  "search",
  "email",
  "url",
  "tel",
  "password",
  "number",
  "date",
  "datetime-local",
  "month",
  "time",
  "week",
]);

/** Somewhere the user types: text inputs, textareas, selects, editable content. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement) {
    return TEXT_INPUT_TYPES.has(target.type);
  }
  return false;
}

/** Controls for which Space (and Enter) already mean "activate". */
const ACTIVATABLE =
  'button, a[href], summary, input, [role="button"], [role="link"], [role="switch"], [role="checkbox"], [role="radio"], [role="tab"], [role="menuitem"], [role="option"]';

/** MapLibre's own class on the map container; it uses the arrows to pan. */
const MAP_SELECTOR = ".maplibregl-map";

function isComposing(event: KeyboardEvent): boolean {
  // keyCode 229 covers IMEs (as Vietnamese input methods use) that report
  // composition only that way.
  return event.isComposing || event.keyCode === 229;
}

/**
 * True when a key press may trigger a page shortcut: nothing handled it yet,
 * no Ctrl/Alt/Cmd, no modal open, the user is not typing, focus is not on the
 * map, and Space is not about to press a focused button.
 */
export function isShortcutEvent(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || isComposing(event)) return false;
  if (event.ctrlKey || event.altKey || event.metaKey) return false;
  if (document.querySelector("dialog[open]")) return false;

  const target = event.target;
  if (isTypingTarget(target)) return false;
  if (target instanceof Element) {
    if (target.closest(MAP_SELECTOR)) return false;
    if (event.key === " " && target.closest(ACTIVATABLE)) return false;
  }
  return true;
}

/**
 * Handler returns true when it used the key; the event is then
 * `preventDefault`ed so no other shortcut (or the browser) acts on it.
 */
export type ShortcutHandler = (event: KeyboardEvent) => boolean;

/** Registers page-wide shortcuts for as long as the component is mounted. */
export function useShortcuts(handler: ShortcutHandler): void {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isShortcutEvent(event)) return;
      if (handlerRef.current(event)) event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

/**
 * Esc leaves a text field (focus returns to the page, so the shortcuts work
 * again). Fields and dialogs that give Esc a meaning of their own handle it
 * first and call `preventDefault`.
 */
export function useEscapeLeavesField(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (isComposing(event)) return;
      const target = event.target;
      if (!(target instanceof HTMLElement) || !isTypingTarget(target)) return;
      // A select uses Esc to close its list; a dialog closes on Esc already.
      if (target instanceof HTMLSelectElement || target.closest("dialog")) return;
      target.blur();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
