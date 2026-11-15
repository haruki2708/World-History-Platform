/**
 * Cost estimate for one answer, from the `usage` the Claude API reports.
 *
 * Prices are those of claude-opus-5-5 (TUTOR_MODEL) on the Claude API, in
 * USD per million tokens, as listed in the claude-api skill (cached
 * 2026-11-03). Check https://platform.claude.com/docs/en/about-claude/pricing
 * when the model or the prices change. Thinking is billed as output.
 *
 * The estimate is approximate on purpose: an answer served by a fallback
 * model (after a refusal) is still priced at Opus 5.5 rates.
 */
export const PRICE_PER_MTOK_USD = {
  input: 4,
  cacheWrite5m: 5,
  cacheWrite1h: 8,
  cacheRead: 0.2,
  output: 20,
} as const;

/**
 * The fields of the API's `usage` object that cost money. Structural, so that
 * both the full usage of `message_start` and the partial one of
 * `message_delta` fit.
 */
export interface TokenUsage {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation?: {
    ephemeral_5m_input_tokens?: number | null;
    ephemeral_1h_input_tokens?: number | null;
  } | null;
}

/** Copies the non-null fields of `update` onto `target` (as the SDK does). */
export function mergeUsage(target: TokenUsage, update: TokenUsage): void {
  for (const key of [
    "input_tokens",
    "output_tokens",
    "cache_creation_input_tokens",
    "cache_read_input_tokens",
    "cache_creation",
  ] as const) {
    if (update[key] != null) Object.assign(target, { [key]: update[key] });
  }
}

const n = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;

export function estimateCostUsd(usage: TokenUsage): number {
  const write1h = n(usage.cache_creation?.ephemeral_1h_input_tokens);
  // Writes without a TTL breakdown are priced as 5-minute writes, the TTL
  // this route asks for.
  const write5m = Math.max(0, n(usage.cache_creation_input_tokens) - write1h);
  const price = PRICE_PER_MTOK_USD;
  const micro =
    n(usage.input_tokens) * price.input +
    write5m * price.cacheWrite5m +
    write1h * price.cacheWrite1h +
    n(usage.cache_read_input_tokens) * price.cacheRead +
    n(usage.output_tokens) * price.output;
  return micro / 1_000_000;
}
