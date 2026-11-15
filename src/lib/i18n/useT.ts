"use client";

import { useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { messages, type MessageKey } from "./messages";

/** Returns the current locale and a translate function for UI strings. */
export function useT() {
  const locale = useAppStore((state) => state.locale);
  const t = useCallback((key: MessageKey) => messages[locale][key], [locale]);
  return { t, locale };
}
