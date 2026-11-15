/**
 * Where the tutor keeps its usage counters. The limit logic in limits.ts only
 * talks to this interface, so a shared store (Redis, a database) can replace
 * the in-memory one when the app runs on more than one process.
 */
export interface QuotaStore {
  /**
   * Counts one question for `userId` at time `now` (ms since the epoch),
   * unless that would exceed one of the limits; a refused question is not
   * counted. Must be atomic per user.
   *
   * - `minute`: more than `perMinute` questions in the 60 s up to `now`.
   * - `day`: more than `perDay` questions in the UTC day of `now`.
   */
  takeQuestion(
    userId: string,
    now: number,
    limits: { perMinute: number; perDay: number },
  ): Promise<"ok" | "minute" | "day">;
  /** USD spent in the UTC day `day` ("YYYY-MM-DD"). */
  spentUsd(day: string): Promise<number>;
  addSpendUsd(day: string, usd: number): Promise<void>;
}

export const MINUTE_MS = 60_000;

/** "YYYY-MM-DD" of the UTC day that contains `now`. */
export function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

interface UserUsage {
  /** Times of the questions of the last minute, oldest first. */
  recent: number[];
  day: string;
  dayCount: number;
}

/**
 * Counters in the memory of this process. They are lost on restart, and each
 * process counts on its own; good enough for one server.
 */
export class MemoryQuotaStore implements QuotaStore {
  private users = new Map<string, UserUsage>();
  private spend = new Map<string, number>();
  private lastSweep = 0;

  async takeQuestion(
    userId: string,
    now: number,
    limits: { perMinute: number; perDay: number },
  ): Promise<"ok" | "minute" | "day"> {
    this.sweep(now);
    const today = utcDay(now);
    let usage = this.users.get(userId);
    if (!usage) {
      usage = { recent: [], day: today, dayCount: 0 };
      this.users.set(userId, usage);
    }
    if (usage.day !== today) {
      usage.day = today;
      usage.dayCount = 0;
    }
    usage.recent = usage.recent.filter((time) => time > now - MINUTE_MS);

    if (usage.dayCount >= limits.perDay) return "day";
    if (usage.recent.length >= limits.perMinute) return "minute";
    usage.recent.push(now);
    usage.dayCount += 1;
    return "ok";
  }

  async spentUsd(day: string): Promise<number> {
    return this.spend.get(day) ?? 0;
  }

  async addSpendUsd(day: string, usd: number): Promise<void> {
    if (!(usd > 0)) return;
    this.spend.set(day, (this.spend.get(day) ?? 0) + usd);
  }

  /** Forgets users with nothing left to count, and past days' spending. */
  private sweep(now: number): void {
    if (now - this.lastSweep < MINUTE_MS) return;
    this.lastSweep = now;
    const today = utcDay(now);
    for (const [userId, usage] of this.users) {
      const idle = usage.recent.every((time) => time <= now - MINUTE_MS);
      if (idle && usage.day !== today) this.users.delete(userId);
    }
    for (const day of this.spend.keys()) {
      if (day !== today) this.spend.delete(day);
    }
  }
}
