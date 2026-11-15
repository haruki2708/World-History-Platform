// Offline checks for the tutor route. Nothing here reaches the real Claude
// API: the "live" checks talk to fake-anthropic.ts on localhost, with a dummy
// key. Exits with code 1 if any check fails.
//
//   node --import ./src/server/tutor/tools/register.mjs \
//     src/server/tutor/tools/self-check.ts

import assert from "node:assert/strict";
import {
  TUTOR_LIMITS,
  type TutorContext,
  type TutorMessage,
  type TutorStreamEvent,
} from "@/lib/tutor";
import { startFakeAnthropic } from "./fake-anthropic";

const DUMMY_KEY = "test-key-not-a-real-secret";
const LIMIT_ENV = [
  "TUTOR_QUESTIONS_PER_MINUTE",
  "TUTOR_QUESTIONS_PER_DAY",
  "TUTOR_DAILY_BUDGET_USD",
] as const;

// Set before the tutor modules load, so no real credentials can be picked up.
const fake = await startFakeAnthropic();
process.env.ANTHROPIC_BASE_URL = fake.url;
process.env.ANTHROPIC_API_KEY = DUMMY_KEY;
delete process.env.ANTHROPIC_AUTH_TOKEN;
delete process.env.ANTHROPIC_PROFILE;
process.env.TUTOR_MOCK = "1";
// The checks start from the default limits, whatever .env.local says.
for (const name of LIMIT_ENV) delete process.env[name];

const { handleTutorPost } = await import("../handler");
const { buildClaudeParams } = await import("../claude");
const { renderViewingContext } = await import("../prompt");
const { streamResponse } = await import("../respond");
const limits = await import("../limits");
const { MemoryQuotaStore, utcDay } = await import("../quota-store");

// Everything the server logs is captured, to check that no secret leaks.
const logged: string[] = [];
for (const level of ["info", "warn", "error"] as const) {
  console[level] = (...args: unknown[]) => {
    logged.push(args.map((arg) => JSON.stringify(arg)).join(" "));
  };
}

const context: TutorContext = {
  year: -216,
  locale: "en",
  viewport: {
    center: { lng: 16.1519, lat: 41.3064 },
    zoom: 5.5,
    bounds: [8.85, 37.1, 23.45, 45.2],
  },
  selectedEventId: "battle-of-cannae",
};

function user(content: string, overrides: Partial<TutorContext> = {}): TutorMessage {
  return { role: "user", content, context: { ...context, ...overrides } };
}

interface Outcome {
  status: number;
  contentType: string | null;
  cacheControl: string | null;
  events: Record<string, unknown>[];
  text: string;
}

// Each request comes from its own address unless a test says otherwise, so
// the per-person limits only bite in the checks written for them.
let nextAddress = 0;
const freshAddress = () => `10.0.${Math.floor(nextAddress / 250)}.${(nextAddress++ % 250) + 1}`;

function tutorRequest(
  body: unknown,
  { signal, headers }: { signal?: AbortSignal; headers?: Record<string, string> } = {},
): Request {
  return new Request("http://localhost/api/tutor", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "x-forwarded-for": freshAddress(), ...headers },
    signal,
  });
}

async function read(response: Response): Promise<Outcome> {
  const raw = await response.text();
  assert.ok(raw === "" || raw.endsWith("\n"), "every NDJSON line ends with a newline");
  const events = raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
  return {
    status: response.status,
    contentType: response.headers.get("content-type"),
    cacheControl: response.headers.get("cache-control"),
    events,
    text: events
      .filter((event) => event.type === "text")
      .map((event) => event.text)
      .join(""),
  };
}

async function post(
  body: unknown,
  options?: { signal?: AbortSignal; headers?: Record<string, string> },
): Promise<Outcome> {
  return read(await handleTutorPost(tutorRequest(body, options)));
}

const ask = (question: string, depth = "standard", overrides?: Partial<TutorContext>) =>
  post({ depth, messages: [user(question, overrides)] });

let failures = 0;
async function check(name: string, run: () => Promise<void> | void): Promise<void> {
  try {
    await run();
    process.stdout.write(`ok    ${name}\n`);
  } catch (error) {
    failures += 1;
    process.stdout.write(`FAIL  ${name}\n      ${String(error).replace(/\n/g, "\n      ")}\n`);
  }
}

// --- Mock mode -------------------------------------------------------------

await check("mock: streams text then done, as NDJSON, uncached", async () => {
  const result = await ask("What is happening here?");
  assert.equal(result.status, 200);
  assert.match(result.contentType ?? "", /^application\/x-ndjson/);
  assert.equal(result.cacheControl, "no-store");
  assert.ok(result.events.length > 5, "several text chunks");
  assert.deepEqual(result.events.at(-1), { type: "done", truncated: false });
  assert.ok(result.events.slice(0, -1).every((event) => event.type === "text"));
});

await check("mock: repeats the context it received (en)", async () => {
  const { text } = await ask("What is happening here?");
  assert.match(text, /Year: 216 BCE/);
  assert.match(text, /Selected event: Battle of Cannae/);
  assert.match(text, /Map centre: 41\.31°, 16\.15° · zoom 5\.5/);
  assert.match(text, /Depth: standard/);
  assert.match(text, /What is happening here\?/);
});

await check("mock: answers in Vietnamese and reflects depth and no selection", async () => {
  const { text } = await ask("Chuyện gì đang xảy ra?", "deep", {
    locale: "vi",
    selectedEventId: null,
    year: -44,
  });
  assert.match(text, /Năm: 44 TCN/);
  assert.match(text, /Sự kiện đang chọn: chưa chọn/);
  assert.match(text, /Độ sâu: deep/);
  assert.match(text, /Chế độ giải thích sâu đang bật/);
});

const expectedStatus: Record<string, number> = {
  not_configured: 503,
  invalid_key: 503,
  no_credits: 503,
  rate_limited: 429,
  overloaded: 503,
  refused: 422,
  bad_request: 400,
  unavailable: 502,
};
for (const [code, status] of Object.entries(expectedStatus)) {
  await check(`mock: #error:${code} is a lone error with status ${status}`, async () => {
    const result = await ask(`Please fail #error:${code}`);
    assert.equal(result.status, status);
    assert.deepEqual(result.events, [{ type: "error", code }]);
  });
}

await check("mock: #error:midstream sends text, then unavailable, status 200", async () => {
  const result = await ask("Fail later #error:midstream");
  assert.equal(result.status, 200);
  assert.ok(result.text.length > 0);
  assert.deepEqual(result.events.at(-1), { type: "error", code: "unavailable" });
});

await check("mock: #truncated ends with truncated: true", async () => {
  const result = await ask("Cut me off #truncated");
  assert.deepEqual(result.events.at(-1), { type: "done", truncated: true });
});

// --- Validation ------------------------------------------------------------

const valid = { depth: "standard", messages: [user("Hi")] };
const badRequests: [string, unknown][] = [
  ["not JSON", "{nope"],
  ["not an object", [1, 2]],
  ["missing depth", { messages: valid.messages }],
  ["unknown depth", { ...valid, depth: "extreme" }],
  ["messages not an array", { ...valid, messages: "hi" }],
  ["no messages", { ...valid, messages: [] }],
  ["empty question", { ...valid, messages: [user("   ")] }],
  [
    "question too long",
    { ...valid, messages: [user("x".repeat(TUTOR_LIMITS.maxQuestionChars + 1))] },
  ],
  [
    "too many messages",
    {
      ...valid,
      messages: Array.from({ length: TUTOR_LIMITS.maxMessages + 1 }, (_, i) =>
        i % 2 === 0 ? user("Hi") : { role: "assistant", content: "Hello" },
      ),
    },
  ],
  ["last message from the assistant", { ...valid, messages: [user("Hi"), { role: "assistant", content: "Hello" }] }],
  ["first message from the assistant", { ...valid, messages: [{ role: "assistant", content: "Hello" }, user("Hi")] }],
  ["unknown role", { ...valid, messages: [{ ...user("Hi"), role: "system" }] }],
  ["content not a string", { ...valid, messages: [{ ...user("Hi"), content: 5 }] }],
  ["missing context", { ...valid, messages: [{ role: "user", content: "Hi" }] }],
  ["unknown selected event", { ...valid, messages: [user("Hi", { selectedEventId: "no-such-event" })] }],
  ["year before the range", { ...valid, messages: [user("Hi", { year: -510 })] }],
  ["year after the range", { ...valid, messages: [user("Hi", { year: -26 })] }],
  ["fractional year", { ...valid, messages: [user("Hi", { year: -216.5 })] }],
  ["unknown locale", { ...valid, messages: [user("Hi", { locale: "fr" as never })] }],
  ["bad viewport", { ...valid, messages: [user("Hi", { viewport: { center: { lng: 999, lat: 0 }, zoom: 4 } })] }],
  ["bad bounds", { ...valid, messages: [user("Hi", { viewport: { ...context.viewport, bounds: [1, 2, 3] as never } })] }],
];
for (const [name, body] of badRequests) {
  await check(`validation: ${name} -> bad_request, status 400`, async () => {
    const result = await post(body);
    assert.equal(result.status, 400);
    assert.deepEqual(result.events, [{ type: "error", code: "bad_request" }]);
  });
}

await check("validation: limits are inclusive, bounds are optional", async () => {
  const messages = Array.from({ length: TUTOR_LIMITS.maxMessages - 1 }, (_, i) =>
    i % 2 === 0
      ? user("x".repeat(TUTOR_LIMITS.maxQuestionChars), {
          viewport: { center: { lng: 14, lat: 40 }, zoom: 4 },
        })
      : { role: "assistant", content: "Hello" },
  );
  assert.equal((await post({ depth: "deep", messages })).status, 200);
});

// --- Prompt ----------------------------------------------------------------

await check("prompt: the context block depends only on the context", () => {
  const first = renderViewingContext(context);
  assert.equal(first, renderViewingContext(structuredClone(context)));
  assert.match(first, /^<viewing>\nYear on the timeline: 216 BCE\n/);
  assert.match(first, /Selected event: Battle of Cannae \(id battle-of-cannae\)/);
  assert.match(first, /Map centre: 41\.31°N, 16\.15°E; zoom 5\.5/);
  assert.match(first, /Map shows: 37\.10°N to 45\.20°N, 8\.85°E to 23\.45°E/);
  assert.match(first, /Events listed around this year: .*battle-of-cannae/);
  assert.match(renderViewingContext({ ...context, locale: "vi" }), /216 TCN[\s\S]*Trận Cannae[\s\S]*Answer in: Vietnamese/);
});

await check("prompt: the cached prefix is identical across requests and depths", () => {
  const a = buildClaudeParams({ depth: "standard", messages: [user("One")] });
  const b = buildClaudeParams({
    depth: "deep",
    messages: [user("Two", { locale: "vi", year: -44, selectedEventId: null })],
  });
  assert.equal(JSON.stringify(a.system.slice(0, 2)), JSON.stringify(b.system.slice(0, 2)));
  assert.deepEqual(a.system[1].cache_control, { type: "ephemeral" });
  assert.equal(a.system[0].cache_control, undefined);
  assert.notEqual(a.system[2].text, b.system[2].text);
  for (const eventId of ["founding-of-the-republic", "battle-of-actium"]) {
    assert.ok(a.system[1].text.includes(`<event id="${eventId}">`));
  }
  assert.ok(a.system[1].text.includes("Cộng hoà La Mã"), "Vietnamese names are included");
});

await check("prompt: history renders the same on every request; blank answers are dropped", () => {
  const history: TutorMessage[] = [
    user("First", { year: -264, selectedEventId: null }),
    { role: "assistant", content: "Answer one" },
    user("Second"),
    { role: "assistant", content: "  " },
  ];
  const earlier = buildClaudeParams({ depth: "standard", messages: history.slice(0, 3) });
  const later = buildClaudeParams({ depth: "standard", messages: [...history, user("Third")] });
  assert.equal(
    JSON.stringify(later.messages.slice(0, 2)),
    JSON.stringify(earlier.messages.slice(0, 2)),
  );
  assert.deepEqual(later.messages.map((message) => message.role), ["user", "assistant", "user"]);
  // "Second" and "Third" merged into one user turn: 2 blocks each.
  assert.equal((later.messages[2].content as unknown[]).length, 4);
  assert.deepEqual(later.messages[1].content, [{ type: "text", text: "Answer one" }]);
});

// --- Early response and keep-alive -----------------------------------------

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const types = (events: Record<string, unknown>[]) => events.map((event) => event.type);

async function* scripted(
  steps: (number | TutorStreamEvent)[],
): AsyncGenerator<TutorStreamEvent, void, void> {
  for (const step of steps) {
    if (typeof step === "number") await delay(step);
    else yield step;
  }
}

const quickTiming = { firstEventWaitMs: 30, pingIntervalMs: 40 };

await check("respond: no first event within the wait -> ping first, then the answer, status 200", async () => {
  const result = await read(
    await streamResponse(
      scripted([90, { type: "text", text: "A" }, 200, { type: "done", truncated: false }]),
      new AbortController(),
      quickTiming,
    ),
  );
  assert.equal(result.status, 200);
  assert.deepEqual(result.events[0], { type: "ping" });
  const textAt = result.events.findIndex((event) => event.type === "text");
  assert.ok(textAt > 0, "the text comes after the first ping");
  assert.ok(
    types(result.events.slice(textAt + 1, -1)).every((type) => type === "ping") &&
      result.events.length - textAt - 2 >= 2,
    `pings keep the silence after the text alive: ${JSON.stringify(types(result.events))}`,
  );
  assert.deepEqual(result.events.at(-1), { type: "done", truncated: false });
});

await check("respond: an error within the wait keeps its HTTP status, no ping", async () => {
  const result = await read(
    await streamResponse(
      scripted([5, { type: "error", code: "no_credits" }]),
      new AbortController(),
      quickTiming,
    ),
  );
  assert.equal(result.status, 503);
  assert.deepEqual(result.events, [{ type: "error", code: "no_credits" }]);
});

await check("respond: an error after the wait -> ping, then the error, status 200", async () => {
  const result = await read(
    await streamResponse(
      scripted([60, { type: "error", code: "overloaded" }]),
      new AbortController(),
      quickTiming,
    ),
  );
  assert.equal(result.status, 200);
  assert.deepEqual(result.events, [{ type: "ping" }, { type: "error", code: "overloaded" }]);
});

await check("mock: #slow:3 -> the response starts after about 2 s with a ping, then the answer", async () => {
  const started = Date.now();
  const slow = handleTutorPost(tutorRequest({ depth: "deep", messages: [user("Think hard #slow:3")] }));
  const slowError = handleTutorPost(
    tutorRequest({ depth: "deep", messages: [user("Fail late #slow:3 #error:no_credits")] }),
  );
  const response = await slow;
  const waited = Date.now() - started;
  assert.ok(waited >= 1900 && waited < 2900, `headers after ${waited} ms`);
  const result = await read(response);
  assert.equal(result.status, 200);
  assert.deepEqual(result.events[0], { type: "ping" });
  assert.equal(result.events[1].type, "text");
  assert.deepEqual(result.events.at(-1), { type: "done", truncated: false });

  const failed = await read(await slowError);
  assert.equal(failed.status, 200, "a late error travels in the 200 stream");
  assert.deepEqual(failed.events, [{ type: "ping" }, { type: "error", code: "no_credits" }]);
});

// --- Usage limits ----------------------------------------------------------

function withEnv(values: Partial<Record<(typeof LIMIT_ENV)[number], string>>) {
  for (const name of LIMIT_ENV) {
    if (values[name] === undefined) delete process.env[name];
    else process.env[name] = values[name];
  }
}

await check("limits: the client is the first x-forwarded-for address, else x-real-ip, else local", () => {
  const id = (headers: Record<string, string>) =>
    limits.clientId(new Request("http://localhost/api/tutor", { headers }));
  assert.equal(id({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }), "203.0.113.7");
  assert.equal(id({ "x-real-ip": "198.51.100.2" }), "198.51.100.2");
  assert.equal(id({ "x-forwarded-for": " ", "x-real-ip": "198.51.100.2" }), "198.51.100.2");
  assert.equal(id({}), "local");
  assert.equal(id({ "x-forwarded-for": "x".repeat(500) }).length, 64);
});

await check("limits: the store counts a sliding minute and the UTC day; refusals are free", async () => {
  const store = new MemoryQuotaStore();
  const caps = { perMinute: 2, perDay: 3 };
  const t = Date.parse("2026-11-16T23:58:30Z"); // UTC midnight is at t + 90 s
  assert.equal(await store.takeQuestion("a", t, caps), "ok");
  assert.equal(await store.takeQuestion("a", t + 1_000, caps), "ok");
  assert.equal(await store.takeQuestion("a", t + 59_000, caps), "minute");
  assert.equal(await store.takeQuestion("b", t + 59_000, caps), "ok", "other people are not affected");
  // The first question has left the window, and the refused one was not
  // counted, so this is the third of the day.
  assert.equal(await store.takeQuestion("a", t + 60_500, caps), "ok");
  assert.equal(await store.takeQuestion("a", t + 75_000, caps), "day");
  assert.equal(await store.takeQuestion("a", t + 91_000, caps), "ok", "a new UTC day starts over");

  await store.addSpendUsd("2026-11-16", 1.5);
  await store.addSpendUsd("2026-11-16", 0.25);
  assert.equal(await store.spentUsd("2026-11-16"), 1.75);
  assert.equal(await store.spentUsd("2026-11-17"), 0);
  assert.equal(utcDay(t + 91_000), "2026-11-17");
});

await check("limits: settings come from the environment; bad values fall back with a warning", () => {
  try {
    withEnv({});
    assert.deepEqual(limits.getLimitSettings(), limits.DEFAULT_LIMITS);
    withEnv({
      TUTOR_QUESTIONS_PER_MINUTE: "10",
      TUTOR_QUESTIONS_PER_DAY: " 50 ",
      TUTOR_DAILY_BUDGET_USD: "2.5",
    });
    assert.deepEqual(limits.getLimitSettings(), {
      questionsPerMinute: 10,
      questionsPerDay: 50,
      dailyBudgetUsd: 2.5,
    });
    const before = logged.length;
    withEnv({
      TUTOR_QUESTIONS_PER_MINUTE: "2.5",
      TUTOR_QUESTIONS_PER_DAY: "-3",
      TUTOR_DAILY_BUDGET_USD: "five",
    });
    assert.deepEqual(limits.getLimitSettings(), limits.DEFAULT_LIMITS);
    const warnings = logged.slice(before).join("\n");
    for (const name of LIMIT_ENV) assert.match(warnings, new RegExp(`${name} must be`));
    limits.getLimitSettings();
    assert.equal(logged.length, before + 3, "warned once, not on every request");
  } finally {
    withEnv({});
  }
});

const sameUser = (address: string) => ({ headers: { "x-forwarded-for": address } });

await check("limits: the 7th question in a minute -> rate_limited, status 429", async () => {
  const first = await Promise.all(
    Array.from({ length: 6 }, (_, i) => post({ depth: "standard", messages: [user(`Q${i}`)] }, sameUser("192.0.2.10"))),
  );
  assert.deepEqual(first.map((result) => result.status), [200, 200, 200, 200, 200, 200]);
  const seventh = await post(valid, sameUser("192.0.2.10"));
  assert.equal(seventh.status, 429);
  assert.deepEqual(seventh.events, [{ type: "error", code: "rate_limited" }]);
  assert.equal((await post(valid, sameUser("192.0.2.11"))).status, 200, "someone else may still ask");
});

await check("limits: past the questions of the day -> limit_reached, status 429", async () => {
  try {
    withEnv({ TUTOR_QUESTIONS_PER_DAY: "2" });
    assert.equal((await post(valid, sameUser("192.0.2.20"))).status, 200);
    assert.equal((await post(valid, sameUser("192.0.2.20"))).status, 200);
    const third = await post(valid, sameUser("192.0.2.20"));
    assert.equal(third.status, 429);
    assert.deepEqual(third.events, [{ type: "error", code: "limit_reached" }]);
  } finally {
    withEnv({});
  }
});

await check("limits: malformed and foreign requests use up no question", async () => {
  try {
    withEnv({ TUTOR_QUESTIONS_PER_MINUTE: "1" });
    const client = "192.0.2.30";
    for (let i = 0; i < 3; i++) {
      assert.equal((await post("{nope", sameUser(client))).status, 400);
      const foreign = await post(valid, {
        headers: { "x-forwarded-for": client, origin: "https://elsewhere.example" },
      });
      assert.equal(foreign.status, 403);
    }
    assert.equal((await post(valid, sameUser(client))).status, 200, "the first real question passes");
    assert.equal((await post(valid, sameUser(client))).status, 429);
  } finally {
    withEnv({});
  }
});

await check("origin: same host passes; another site, or a null origin -> bad_request, status 403", async () => {
  const withOrigin = (origin: string, extra: Record<string, string> = {}) =>
    post(valid, { headers: { origin, ...extra } });
  assert.equal((await withOrigin("http://localhost")).status, 200);
  assert.equal(
    (await withOrigin("https://tutor.example.org", { "x-forwarded-host": "tutor.example.org" })).status,
    200,
    "behind a proxy the forwarded host counts",
  );
  for (const origin of ["https://elsewhere.example", "http://localhost:4000", "null"]) {
    const result = await withOrigin(origin);
    assert.equal(result.status, 403, origin);
    assert.deepEqual(result.events, [{ type: "error", code: "bad_request" }]);
  }
});

// --- Live path, against the fake API ---------------------------------------

process.env.TUTOR_MOCK = "0";

await check("live: no key and no mock -> not_configured, status 503", async () => {
  process.env.ANTHROPIC_API_KEY = "";
  try {
    const before = fake.requests.length;
    const result = await ask("Hello");
    assert.equal(result.status, 503);
    assert.deepEqual(result.events, [{ type: "error", code: "not_configured" }]);
    assert.equal(fake.requests.length, before, "no upstream call was made");
  } finally {
    process.env.ANTHROPIC_API_KEY = DUMMY_KEY;
  }
});

await check("live: streams the model's text and sends the expected request", async () => {
  const result = await post({
    depth: "standard",
    messages: [user("Earlier"), { role: "assistant", content: "Before" }, user("Now")],
  });
  assert.equal(result.status, 200);
  assert.deepEqual(result.events, [
    { type: "text", text: "Hello" },
    { type: "text", text: ", " },
    { type: "text", text: "world." },
    { type: "done", truncated: false },
  ]);

  const { headers, body } = fake.requests.at(-1)!;
  // SDK 1.x sends the key as a bearer token.
  assert.equal(headers.authorization, `Bearer ${DUMMY_KEY}`);
  assert.match(String(headers["anthropic-beta"]), /server-side-fallback-2026-07-01/);
  assert.equal(body.model, "claude-opus-5-5");
  assert.equal(body.stream, true);
  assert.equal(body.fallbacks, "default");
  assert.equal(body.max_tokens, 16000);
  assert.deepEqual(body.thinking, { type: "adaptive" });
  assert.deepEqual(body.output_config, { effort: "high" });
  assert.deepEqual(body.cache_control, { type: "ephemeral" });
  assert.equal(body.betas, undefined, "betas travel in the header, not the body");
  const messages = body.messages as { role: string; content: { text: string }[] }[];
  assert.deepEqual(messages.map((message) => message.role), ["user", "assistant", "user"]);
  assert.match(messages[2].content[0].text, /^<viewing>/);
  assert.equal(messages[2].content[1].text, "Now");
  assert.deepEqual(messages[1].content, [{ type: "text", text: "Before" }]);
});

await check("live: depth deep -> effort xhigh and a higher max_tokens", async () => {
  await ask("Explain in depth", "deep");
  const { body } = fake.requests.at(-1)!;
  assert.deepEqual(body.output_config, { effort: "xhigh" });
  assert.equal(body.max_tokens, 32000);
});

const upstream: [string, number, Record<string, unknown>[]][] = [
  ["401", 503, [{ type: "error", code: "invalid_key" }]],
  ["402", 503, [{ type: "error", code: "no_credits" }]],
  ["429", 429, [{ type: "error", code: "rate_limited" }]],
  ["500", 503, [{ type: "error", code: "overloaded" }]],
  ["529", 503, [{ type: "error", code: "overloaded" }]],
  ["400", 502, [{ type: "error", code: "unavailable" }]],
  ["403", 502, [{ type: "error", code: "unavailable" }]],
  ["refusal", 422, [{ type: "error", code: "refused" }]],
  ["empty", 502, [{ type: "error", code: "unavailable" }]],
  ["refusal_mid", 200, [{ type: "text", text: "Partial " }, { type: "error", code: "refused" }]],
  ["overloaded_mid", 200, [{ type: "text", text: "Partial " }, { type: "error", code: "overloaded" }]],
  ["overloaded_first", 503, [{ type: "error", code: "overloaded" }]],
  ["drop", 200, [{ type: "text", text: "Partial " }, { type: "error", code: "unavailable" }]],
  ["max_tokens", 200, [{ type: "text", text: "Cut " }, { type: "text", text: "off" }, { type: "done", truncated: true }]],
];
for (const [scenario, status, events] of upstream) {
  await check(`live: upstream ${scenario} -> ${JSON.stringify(events.at(-1))}, status ${status}`, async () => {
    const result = await ask(`Test #upstream:${scenario}`);
    assert.equal(result.status, status);
    assert.deepEqual(result.events, events);
  });
}

async function untilDisconnect(expected: number): Promise<void> {
  for (let i = 0; i < 100 && fake.clientDisconnects < expected; i++) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  assert.equal(fake.clientDisconnects, expected, "the upstream request was cancelled");
}

await check("live: cancelling the response body cancels the upstream request", async () => {
  const expected = fake.clientDisconnects + 1;
  const response = await handleTutorPost(
    tutorRequest({ depth: "standard", messages: [user("Wait #upstream:hang")] }),
  );
  const reader = response.body!.getReader();
  const { value } = await reader.read();
  assert.equal(new TextDecoder().decode(value), '{"type":"text","text":"Waiting "}\n');
  await reader.cancel();
  await untilDisconnect(expected);
});

await check("live: aborting the incoming request cancels the upstream request", async () => {
  const expected = fake.clientDisconnects + 1;
  const abort = new AbortController();
  const response = await handleTutorPost(
    tutorRequest(
      { depth: "standard", messages: [user("Wait #upstream:hang")] },
      { signal: abort.signal },
    ),
  );
  const reader = response.body!.getReader();
  await reader.read();
  abort.abort();
  await untilDisconnect(expected);
  assert.equal((await reader.read()).done, true, "the stream ends without a final event");
});

await check("live: slow upstream -> ping first, then the answer or a late error, all status 200", async () => {
  const [answer, noCredits, overloaded] = await Promise.all(
    ["Think #delay:2600", "Think #delay:2600 #upstream:402", "Think #delay:2600 #upstream:overloaded_first"].map(
      (question) => ask(question),
    ),
  );
  assert.equal(answer.status, 200);
  assert.deepEqual(answer.events, [
    { type: "ping" },
    { type: "text", text: "Hello" },
    { type: "text", text: ", " },
    { type: "text", text: "world." },
    { type: "done", truncated: false },
  ]);
  assert.equal(noCredits.status, 200);
  assert.deepEqual(noCredits.events, [{ type: "ping" }, { type: "error", code: "no_credits" }]);
  assert.equal(overloaded.status, 200);
  assert.deepEqual(overloaded.events, [{ type: "ping" }, { type: "error", code: "overloaded" }]);
});

await check("live: refused requests never reach the API", async () => {
  const before = fake.requests.length;
  assert.equal((await post(valid, { headers: { origin: "https://elsewhere.example" } })).status, 403);
  assert.equal((await post({ ...valid, depth: "extreme" })).status, 400);
  try {
    withEnv({ TUTOR_QUESTIONS_PER_MINUTE: "1" });
    assert.equal((await post(valid, sameUser("192.0.2.40"))).status, 200);
    assert.equal((await post(valid, sameUser("192.0.2.40"))).status, 429);
  } finally {
    withEnv({});
  }
  assert.equal(fake.requests.length, before + 1, "only the admitted question was sent");
});

const today = () => utcDay(Date.now());
const near = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not ${expected}`);

await check("cost: each answer's estimate is logged and added to today's total", async () => {
  const store = new MemoryQuotaStore();
  limits.setQuotaStore(store);
  const before = logged.length;
  assert.equal((await ask("Hello")).status, 200);
  // 12 input, 20 000 cache read, 9 output: (12 × 4 + 20 000 × 0.2 + 9 × 20) / 1e6
  near(await store.spentUsd(today()), 0.004228);
  assert.match(logged.slice(before).join("\n"), /\[tutor\] response finished.*"costUsd":0\.004228/);
});

await check("cost: an answer stopped early still adds what it used", async () => {
  const store = new MemoryQuotaStore();
  limits.setQuotaStore(store);
  const expected = fake.clientDisconnects + 1;
  const response = await handleTutorPost(
    tutorRequest({ depth: "standard", messages: [user("Wait #upstream:hang")] }),
  );
  const reader = response.body!.getReader();
  await reader.read();
  await reader.cancel();
  await untilDisconnect(expected);
  // The input side, known from message_start; no output was reported yet.
  near(await store.spentUsd(today()), 0.004048);
  assert.match(logged.join("\n"), /response stopped early/);
});

await check("cost: past the daily cap -> limit_reached for everyone, without calling the API", async () => {
  const store = new MemoryQuotaStore();
  limits.setQuotaStore(store);
  try {
    assert.equal((await ask("Big one #upstream:expensive")).status, 200);
    // 250 000 output tokens at $20 per million is $5, the default cap.
    near(await store.spentUsd(today()), 5.004048);

    const before = fake.requests.length;
    const blocked = await ask("Hello");
    assert.equal(blocked.status, 429);
    assert.deepEqual(blocked.events, [{ type: "error", code: "limit_reached" }]);
    process.env.TUTOR_MOCK = "1";
    assert.equal((await ask("Hello")).status, 429, "mock answers are capped too");
    process.env.TUTOR_MOCK = "0";
    assert.equal(fake.requests.length, before, "no upstream call past the cap");
    assert.match(logged.join("\n"), /daily spending cap reached.*"capUsd":5/);

    withEnv({ TUTOR_DAILY_BUDGET_USD: "10" });
    assert.equal((await ask("Hello")).status, 200, "a higher cap lets questions through");
  } finally {
    process.env.TUTOR_MOCK = "0";
    withEnv({});
    limits.setQuotaStore(new MemoryQuotaStore());
  }
});

await check("logs: failures are logged with details, never with the key", () => {
  const all = logged.join("\n");
  assert.ok(!all.includes(DUMMY_KEY), "the API key must not appear in the logs");
  assert.ok(!all.includes("192.0.2."), "client addresses are not logged");
  assert.match(all, /billing_error/);
  assert.match(all, /"requestId":"req_fake"/);
  assert.match(all, /bad request: messages\[0\]: question is empty/);
  assert.match(all, /"cacheReadTokens":20000/);
});

await fake.close();
process.stdout.write(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
