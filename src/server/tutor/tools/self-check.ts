// Offline checks for the tutor route. Nothing here reaches the real Claude
// API: the "live" checks talk to fake-anthropic.ts on localhost, with a dummy
// key. Exits with code 1 if any check fails.
//
//   node --import ./src/server/tutor/tools/register.mjs \
//     src/server/tutor/tools/self-check.ts

import assert from "node:assert/strict";
import { TUTOR_LIMITS, type TutorContext, type TutorMessage } from "@/lib/tutor";
import { startFakeAnthropic } from "./fake-anthropic";

const DUMMY_KEY = "test-key-not-a-real-secret";

// Set before the tutor modules load, so no real credentials can be picked up.
const fake = await startFakeAnthropic();
process.env.ANTHROPIC_BASE_URL = fake.url;
process.env.ANTHROPIC_API_KEY = DUMMY_KEY;
delete process.env.ANTHROPIC_AUTH_TOKEN;
delete process.env.ANTHROPIC_PROFILE;
process.env.TUTOR_MOCK = "1";

const { handleTutorPost } = await import("../handler");
const { buildClaudeParams } = await import("../claude");
const { renderViewingContext } = await import("../prompt");

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

async function post(body: unknown, signal?: AbortSignal): Promise<Outcome> {
  const response = await handleTutorPost(
    new Request("http://localhost/api/tutor", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
      signal,
    }),
  );
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
    new Request("http://localhost/api/tutor", {
      method: "POST",
      body: JSON.stringify({ depth: "standard", messages: [user("Wait #upstream:hang")] }),
    }),
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
    new Request("http://localhost/api/tutor", {
      method: "POST",
      body: JSON.stringify({ depth: "standard", messages: [user("Wait #upstream:hang")] }),
      signal: abort.signal,
    }),
  );
  const reader = response.body!.getReader();
  await reader.read();
  abort.abort();
  await untilDisconnect(expected);
  assert.equal((await reader.read()).done, true, "the stream ends without a final event");
});

await check("logs: failures are logged with details, never with the key", () => {
  const all = logged.join("\n");
  assert.ok(!all.includes(DUMMY_KEY), "the API key must not appear in the logs");
  assert.match(all, /billing_error/);
  assert.match(all, /"requestId":"req_fake"/);
  assert.match(all, /bad request: messages\[0\]: question is empty/);
  assert.match(all, /"cacheReadTokens":20000/);
});

await fake.close();
process.stdout.write(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
