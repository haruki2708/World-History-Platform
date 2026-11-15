// A stand-in for the Claude API on localhost, for testing the real code path
// (SDK, streaming, error mapping, cancellation) without a key or any cost.
// It speaks just enough of POST /v1/messages for the tutor. The scenario is
// picked by a "#upstream:<name>" tag in the latest question:
//
//   (none)        a short streamed answer, stop_reason end_turn
//   max_tokens    a short answer cut off by max_tokens
//   refusal       refusal before any text
//   refusal_mid   some text, then refusal
//   empty         end_turn with thinking only, no text
//   overloaded_mid  some text, then an `overloaded_error` inside the stream
//   overloaded_first  an `overloaded_error` inside the stream, before any text
//   expensive     a short answer that reports 250 000 output tokens ($5)
//   links         an answer ending in map-link markers, cut across deltas
//   drop          some text, then the connection is cut
//   hang          one piece of text, then silence until the client leaves
//   400 401 402 403 429 500 529   that HTTP error
//
// "#delay:<ms>" anywhere in the question holds the whole response that long,
// like a model that thinks for a while before it writes.
//
// Used by self-check.ts. To point a dev server at it instead:
//   node --import ./src/server/tutor/tools/register.mjs \
//     src/server/tutor/tools/fake-anthropic.ts 4010
//   TUTOR_MOCK=0 ANTHROPIC_API_KEY=test ANTHROPIC_BASE_URL=http://127.0.0.1:4010 npm run dev

import {
  createServer,
  type IncomingHttpHeaders,
  type ServerResponse,
} from "node:http";
import type { AddressInfo } from "node:net";
import { pathToFileURL } from "node:url";

export interface FakeAnthropic {
  url: string;
  /** Every request received, oldest first. */
  requests: { headers: IncomingHttpHeaders; body: Record<string, unknown> }[];
  /** Number of streams the client closed before they finished. */
  clientDisconnects: number;
  close(): Promise<void>;
}

const ERROR_TYPES: Record<number, string> = {
  400: "invalid_request_error",
  401: "authentication_error",
  402: "billing_error",
  403: "permission_error",
  429: "rate_limit_error",
  500: "api_error",
  529: "overloaded_error",
};

function lastQuestion(body: Record<string, unknown>): string {
  const messages = body.messages as { content: unknown }[] | undefined;
  const content = messages?.[messages.length - 1]?.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const last = content[content.length - 1] as { text?: string } | undefined;
  return last?.text ?? "";
}

function send(response: ServerResponse, event: string, data: object): void {
  response.write(`event: ${event}\ndata: ${JSON.stringify({ type: event, ...data })}\n\n`);
}

function startMessage(response: ServerResponse, model: string): void {
  response.writeHead(200, {
    "content-type": "text/event-stream",
    "request-id": "req_fake",
  });
  send(response, "message_start", {
    message: {
      id: "msg_fake",
      type: "message",
      role: "assistant",
      model,
      content: [],
      stop_reason: null,
      stop_sequence: null,
      usage: {
        input_tokens: 12,
        output_tokens: 0,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 20000,
      },
    },
  });
}

function sendThinking(response: ServerResponse, index: number): void {
  send(response, "content_block_start", {
    index,
    content_block: { type: "thinking", thinking: "", signature: "" },
  });
  send(response, "content_block_delta", {
    index,
    delta: { type: "signature_delta", signature: "fake" },
  });
  send(response, "content_block_stop", { index });
}

function sendText(response: ServerResponse, index: number, parts: string[]): void {
  send(response, "content_block_start", {
    index,
    content_block: { type: "text", text: "" },
  });
  for (const text of parts) {
    send(response, "content_block_delta", {
      index,
      delta: { type: "text_delta", text },
    });
  }
}

function sendOverloaded(response: ServerResponse): void {
  response.write(
    `event: error\ndata: ${JSON.stringify({
      type: "error",
      error: { type: "overloaded_error", message: "Overloaded" },
    })}\n\n`,
  );
}

function finish(
  response: ServerResponse,
  stopReason: string,
  outputTokens = 9,
): void {
  send(response, "message_delta", {
    delta: {
      stop_reason: stopReason,
      stop_sequence: null,
      stop_details:
        stopReason === "refusal"
          ? { type: "refusal", category: "cyber", explanation: null }
          : null,
    },
    usage: { output_tokens: outputTokens },
  });
  send(response, "message_stop", {});
  response.end();
}

export function startFakeAnthropic(port = 0): Promise<FakeAnthropic> {
  const fake: FakeAnthropic = {
    url: "",
    requests: [],
    clientDisconnects: 0,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };

  const server = createServer((request, response) => {
    let raw = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => (raw += chunk));
    request.on("end", () => {
      const body = JSON.parse(raw || "{}") as Record<string, unknown>;
      fake.requests.push({ headers: request.headers, body });

      const question = lastQuestion(body);
      const scenario = /#upstream:(\w+)/.exec(question)?.[1] ?? "ok";
      const delayMs = Number(/#delay:(\d+)/.exec(question)?.[1] ?? 0);
      const model = String(body.model);
      if (delayMs > 0) {
        const timer = setTimeout(() => respond(response, scenario, model), delayMs);
        response.on("close", () => clearTimeout(timer));
      } else {
        respond(response, scenario, model);
      }
    });
  });

  function respond(response: ServerResponse, scenario: string, model: string): void {
    const status = Number(scenario);
    if (ERROR_TYPES[status]) {
      response.writeHead(status, {
        "content-type": "application/json",
        "request-id": "req_fake",
        // Tells the SDK not to retry, which keeps the checks fast.
        "x-should-retry": "false",
      });
      response.end(
        JSON.stringify({
          type: "error",
          error: { type: ERROR_TYPES[status], message: `fake ${status}` },
        }),
      );
      return;
    }

    startMessage(response, model);
    sendThinking(response, 0);
    switch (scenario) {
      case "refusal":
        return finish(response, "refusal");
      case "empty":
        return finish(response, "end_turn");
      case "refusal_mid":
        sendText(response, 1, ["Partial "]);
        send(response, "content_block_stop", { index: 1 });
        return finish(response, "refusal");
      case "max_tokens":
        sendText(response, 1, ["Cut ", "off"]);
        send(response, "content_block_stop", { index: 1 });
        return finish(response, "max_tokens");
      case "overloaded_mid":
        sendText(response, 1, ["Partial "]);
        sendOverloaded(response);
        return void response.end();
      case "overloaded_first":
        sendOverloaded(response);
        return void response.end();
      case "links":
        sendText(response, 1, [
          "Hannibal crossed the Alps in 218 BCE",
          " and won at Cannae two years later.\n\n[[ma",
          "p:-218:hannibal-crosses-the-alps]]\n[[map:-",
          "202:battle-of-zama]]\n[[map:oops]]\n",
        ]);
        send(response, "content_block_stop", { index: 1 });
        return finish(response, "end_turn");
      case "expensive":
        sendText(response, 1, ["Costly."]);
        send(response, "content_block_stop", { index: 1 });
        return finish(response, "end_turn", 250_000);
      case "drop":
        sendText(response, 1, ["Partial "]);
        return void setTimeout(() => response.destroy(), 50);
      case "hang":
        sendText(response, 1, ["Waiting "]);
        response.on("close", () => {
          if (!response.writableFinished) fake.clientDisconnects += 1;
        });
        return;
      default:
        sendText(response, 1, ["Hello", ", ", "world."]);
        send(response, "content_block_stop", { index: 1 });
        return finish(response, "end_turn");
    }
  }

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      const address = server.address() as AddressInfo;
      fake.url = `http://127.0.0.1:${address.port}`;
      resolve(fake);
    });
  });
}

// Run directly: serve until stopped.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const fake = await startFakeAnthropic(Number(process.argv[2] ?? 4010));
  console.log(`Fake Claude API listening on ${fake.url}`);
}
