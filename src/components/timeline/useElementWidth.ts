"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Tracks an element's content width. Returns `fallback` until the first
 * measurement, so server and first client render agree.
 */
export function useElementWidth(
  ref: RefObject<HTMLElement | null>,
  fallback: number,
): number {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width ?? fallback;
}
