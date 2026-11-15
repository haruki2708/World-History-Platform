import type { TutorErrorCode } from "@/lib/tutor";
import { MemoryQuotaStore, utcDay, type QuotaStore } from "./quota-store";

/*
 * Usage limits of the tutor: questions per person per minute and per UTC
 * day, and a spending cap per UTC day for the whole app. A person is an IP
 * address. Configured from the environment (see .env.example).
 */

export interface LimitSettings {
  questionsPerMinute: number;
  questionsPerDay: number;
  dailyBudgetUsd: number;
}

export const DEFAULT_LIMITS: LimitSettings = {
  questionsPerMinute: 6,
  questionsPerDay: 100,
  dailyBudgetUsd: 5,
};

const ENV_NAMES = {
  questionsPerMinute: "TUTOR_QUESTIONS_PER_MINUTE",
  questionsPerDay: "TUTOR_QUESTIONS_PER_DAY",
  dailyBudgetUsd: "TUTOR_DAILY_BUDGET_USD",
} as const satisfies Record<keyof LimitSettings, string>;

let cached: { raw: string; settings: LimitSettings } | undefined;

function parseSetting(
  key: keyof LimitSettings,
  raw: string | undefined,
): number {
  const fallback = DEFAULT_LIMITS[key];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw.trim());
  const valid =
    Number.isFinite(value) &&
    value > 0 &&
    (key === "dailyBudgetUsd" || Number.isInteger(value));
  if (valid) return value;
  console.warn(
    `[tutor] ${ENV_NAMES[key]} must be a positive ${key === "dailyBudgetUsd" ? "number" : "whole number"}; using the default ${fallback}`,
  );
  return fallback;
}

/**
 * The current limits. Read from the environment on every call (cheap), but
 * parsed, and warned about, only when the values change.
 */
export function getLimitSettings(): LimitSettings {
  const values = Object.values(ENV_NAMES).map((name) => process.env[name]);
  const raw = JSON.stringify(values);
  if (cached?.raw !== raw) {
    const keys = Object.keys(ENV_NAMES) as (keyof LimitSettings)[];
    const settings = Object.fromEntries(
      keys.map((key, i) => [key, parseSetting(key, values[i])]),
    ) as unknown as LimitSettings;
    cached = { raw, settings };
  }
  return cached.settings;
}

let store: QuotaStore = new MemoryQuotaStore();

/** For a shared store at deploy time, or a fresh one in tests. */
export function setQuotaStore(next: QuotaStore): void {
  store = next;
}

/** Longest client id kept, so a huge header cannot bloat the counters. */
const MAX_CLIENT_ID_CHARS = 64;

/**
 * Who is asking: the first address in `x-forwarded-for`, else `x-real-ip`,
 * else one shared user "local". These headers are only trustworthy behind a
 * proxy that sets them; see the note in docs/tasks/T-007.
 */
export function clientId(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0];
  const id = forwarded?.trim() || request.headers.get("x-real-ip")?.trim();
  return id ? id.slice(0, MAX_CLIENT_ID_CHARS).toLowerCase() : "local";
}

/**
 * True when the request carries an `Origin` from another site. Requests
 * without one (curl, server to server) pass; the limits cover them.
 */
export function isForeignOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return true; // "null" (sandboxed frames, file://) or garbage
  }
  const hosts = [
    request.headers.get("x-forwarded-host")?.split(",")[0],
    request.headers.get("host"),
    new URL(request.url).host,
  ];
  return !hosts.some((host) => host?.trim().toLowerCase() === originHost);
}

let capLoggedFor: string | undefined;

/**
 * Decides whether a question may go ahead, and if so counts it. Returns the
 * error to send otherwise. The spending cap is checked first, so a question
 * refused for any reason is not counted.
 */
export async function admitQuestion(
  userId: string,
  now = Date.now(),
): Promise<TutorErrorCode | null> {
  const settings = getLimitSettings();
  const day = utcDay(now);
  const spent = await store.spentUsd(day);
  if (spent >= settings.dailyBudgetUsd) {
    if (capLoggedFor !== day) {
      capLoggedFor = day;
      console.warn("[tutor] daily spending cap reached", {
        day,
        spentUsd: Number(spent.toFixed(4)),
        capUsd: settings.dailyBudgetUsd,
      });
    }
    return "limit_reached";
  }

  const result = await store.takeQuestion(userId, now, {
    perMinute: settings.questionsPerMinute,
    perDay: settings.questionsPerDay,
  });
  if (result === "ok") return null;
  // The address is not logged; the kind of limit is enough to tune them.
  console.warn(`[tutor] question refused: ${result} limit reached`);
  return result === "minute" ? "rate_limited" : "limit_reached";
}

/** Adds the estimated cost of an answer to today's total. */
export async function recordSpend(usd: number, now = Date.now()): Promise<void> {
  await store.addSpendUsd(utcDay(now), usd);
}
