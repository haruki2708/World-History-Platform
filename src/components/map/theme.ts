/**
 * Map colours come from the design tokens in src/app/globals.css. MapLibre
 * paints on a canvas and cannot read CSS variables itself, so the values are
 * resolved here and re-applied whenever the colour scheme changes.
 */
export interface MapTheme {
  land: string;
  water: string;
  coast: string;
}

const TOKENS: Record<keyof MapTheme, string> = {
  land: "--map-land",
  water: "--map-water",
  coast: "--map-coast",
};

export function readMapTheme(): MapTheme {
  const styles = getComputedStyle(document.documentElement);
  // A missing token leaves that layer see-through rather than breaking the map.
  const read = (token: string) =>
    styles.getPropertyValue(token).trim() || "transparent";
  return {
    land: read(TOKENS.land),
    water: read(TOKENS.water),
    coast: read(TOKENS.coast),
  };
}

/** Calls `onChange` when the light/dark preference flips. Returns a cleanup. */
export function watchColorScheme(onChange: () => void): () => void {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
