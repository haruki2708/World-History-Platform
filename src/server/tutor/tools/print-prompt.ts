// Prints the complete Claude API request for a sample question, plus the
// size of the cached part. Makes no network call.
//
//   node --import ./src/server/tutor/tools/register.mjs \
//     src/server/tutor/tools/print-prompt.ts [--deep] [--vi] [--json]
//
// --deep  depth "deep" instead of "standard"
// --vi    a Vietnamese conversation instead of an English one
// --json  the raw request body instead of the readable layout

import type { TutorContext, TutorRequest } from "@/lib/tutor";
import { buildClaudeParams } from "../claude";
import { CACHED_SYSTEM_TEXT } from "../prompt";

const flags = new Set(process.argv.slice(2));
const locale = flags.has("--vi") ? "vi" : "en";

const firstView: TutorContext = {
  year: -218,
  locale,
  viewport: {
    center: { lng: 12.5, lat: 42.5 },
    zoom: 4.5,
    bounds: [-2.1, 34.2, 27.1, 49.6],
  },
  selectedEventId: null,
};
const secondView: TutorContext = {
  year: -216,
  locale,
  viewport: {
    center: { lng: 16.1519, lat: 41.3064 },
    zoom: 5.5,
    bounds: [8.85, 37.1, 23.45, 45.2],
  },
  selectedEventId: "battle-of-cannae",
};

const sample: TutorRequest = {
  depth: flags.has("--deep") ? "deep" : "standard",
  messages:
    locale === "vi"
      ? [
          { role: "user", content: "Chuyện gì đang xảy ra ở đây?", context: firstView },
          { role: "assistant", content: "(câu trả lời trước của gia sư)" },
          { role: "user", content: "Vì sao trận này quan trọng?", context: secondView },
        ]
      : [
          { role: "user", content: "What is happening here?", context: firstView },
          { role: "assistant", content: "(the tutor's earlier answer)" },
          { role: "user", content: "Why does this battle matter?", context: secondView },
        ],
};

const params = buildClaudeParams(sample);

if (flags.has("--json")) {
  console.log(JSON.stringify(params, null, 2));
} else {
  const { system, messages, ...settings } = params;
  console.log("=== REQUEST SETTINGS ===");
  console.log(JSON.stringify(settings, null, 2));

  system.forEach((block, index) => {
    const cached = block.cache_control ? " (cache breakpoint: everything up to here is cached)" : "";
    console.log(`\n=== SYSTEM BLOCK ${index}${cached} ===`);
    console.log(block.text);
  });

  for (const message of messages) {
    console.log(`\n=== ${message.role.toUpperCase()} ===`);
    const blocks = Array.isArray(message.content) ? message.content : [];
    for (const block of blocks) {
      if (block.type === "text") console.log(`${block.text}\n`);
    }
  }
}

// Rough only: no tokenizer runs here. Vietnamese costs more tokens per
// character than English, so the estimate is taken from UTF-8 bytes. For the
// exact figure, pass these same `system` blocks to client.messages.countTokens.
const bytes = CACHED_SYSTEM_TEXT.reduce(
  (sum, text) => sum + Buffer.byteLength(text, "utf8"),
  0,
);
const chars = CACHED_SYSTEM_TEXT.reduce((sum, text) => sum + text.length, 0);
console.error(
  [
    "",
    "=== CACHED PART (system blocks 0 and 1) ===",
    `${chars.toLocaleString("en")} characters, ${bytes.toLocaleString("en")} UTF-8 bytes`,
    `Estimated tokens: ${Math.round(bytes / 4.2).toLocaleString("en")} to ${Math.round(bytes / 2.8).toLocaleString("en")} (rough: UTF-8 bytes / 4.2 to / 2.8)`,
    "Minimum cacheable prefix on claude-opus-5-5: 512 tokens.",
  ].join("\n"),
);
