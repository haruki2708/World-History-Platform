/**
 * DEV-ONLY simulated tutor. Used by tutorClient.ts while /api/tutor (T-005)
 * does not exist yet: a development request that gets a 404 is answered here
 * instead. Remove this file and the fallback branch in tutorClient.ts once the
 * route is merged.
 *
 * It follows the contract in src/lib/tutor.ts exactly (NDJSON
 * TutorStreamEvents) and answers from the request it receives, so the chat
 * can be exercised end to end. Tags in the question trigger edge cases:
 *
 *   #error:<code>      fail at once with that TutorErrorCode
 *   #miderror:<code>   send part of an answer, then fail with that code
 *   #truncated         finish with `done.truncated = true`
 *   #long              a long answer (for stop / auto-scroll testing)
 */
import { getEvent } from "@/data";
import type {
  TutorErrorCode,
  TutorMessage,
  TutorRequest,
  TutorStreamEvent,
} from "@/lib/tutor";
import { formatYear } from "@/lib/years";

const STATUS: Record<TutorErrorCode, number> = {
  not_configured: 503,
  invalid_key: 502,
  no_credits: 402,
  rate_limited: 429,
  overloaded: 529,
  refused: 200,
  bad_request: 400,
  unavailable: 500,
};

const CHUNK_DELAY_MS = 45;

export function mockTutorResponse(
  request: TutorRequest,
  signal: AbortSignal,
): Response {
  const last = request.messages[request.messages.length - 1];
  const question = last?.role === "user" ? last.content : "";

  const immediate = /#error:(\w+)/.exec(question)?.[1] as TutorErrorCode | undefined;
  if (immediate && immediate in STATUS) {
    return ndjson([{ type: "error", code: immediate }], STATUS[immediate], signal);
  }

  const midError = /#miderror:(\w+)/.exec(question)?.[1] as TutorErrorCode | undefined;
  const words = buildAnswer(request).split(/(?<=\s)/);
  const events: TutorStreamEvent[] = [];
  for (let i = 0; i < words.length; i += 3) {
    events.push({ type: "text", text: words.slice(i, i + 3).join("") });
  }
  if (midError && midError in STATUS) {
    events.splice(Math.ceil(events.length / 2));
    events.push({ type: "error", code: midError });
  } else {
    events.push({ type: "done", truncated: question.includes("#truncated") });
  }
  return ndjson(events, 200, signal, request.depth === "deep" ? 900 : 300);
}

function ndjson(
  events: TutorStreamEvent[],
  status: number,
  signal: AbortSignal,
  firstDelayMs = 150,
): Response {
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let index = 0;
      const abort = () => {
        clearTimeout(timer);
        controller.error(new DOMException("The request was aborted.", "AbortError"));
      };
      if (signal.aborted) return abort();
      signal.addEventListener("abort", abort, { once: true });

      const push = () => {
        if (index >= events.length) {
          signal.removeEventListener("abort", abort);
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(JSON.stringify(events[index++]) + "\n"));
        timer = setTimeout(push, CHUNK_DELAY_MS);
      };
      timer = setTimeout(push, firstDelayMs);
    },
    cancel() {
      clearTimeout(timer);
    },
  });

  return new Response(stream, {
    status,
    headers: { "Content-Type": "application/x-ndjson" },
  });
}

/** A short answer in the question's language, echoing what the request held. */
function buildAnswer({ messages, depth }: TutorRequest): string {
  const userMessages = messages.filter(
    (message): message is Extract<TutorMessage, { role: "user" }> =>
      message.role === "user",
  );
  const current = userMessages[userMessages.length - 1];
  const { locale, year, selectedEventId, viewport } = current.context;
  const event = selectedEventId ? getEvent(selectedEventId) : undefined;
  const earlierYears = userMessages
    .slice(0, -1)
    .map((message) => formatYear(message.context.year, locale));
  const long = current.content.includes("#long");
  const where = `${viewport.center.lat.toFixed(1)}°, ${viewport.center.lng.toFixed(1)}° (zoom ${viewport.zoom.toFixed(1)})`;

  if (locale === "vi") {
    const lines = [
      `[Giả lập] Bạn đang xem năm ${formatYear(year, "vi")}, vùng bản đồ quanh ${where}.`,
      event
        ? `Sự kiện đang chọn là ${event.title.vi}. ${event.summary.vi}`
        : "Bạn chưa chọn sự kiện nào.",
      "",
      "Vài ý chính:",
      `- Câu hỏi của bạn: “${current.content.slice(0, 80)}”`,
      `- Chế độ trả lời: ${depth === "deep" ? "giải thích sâu" : "thường"}`,
      earlierYears.length
        ? `- Các câu hỏi trước được hỏi khi xem: ${earlierYears.join(", ")}`
        : "- Đây là câu hỏi đầu tiên của cuộc trò chuyện",
      "",
      "Đây là câu trả lời mẫu, không gọi tới mô hình AI.",
    ];
    if (long) lines.push("", ...filler("vi"));
    return lines.join("\n");
  }

  const lines = [
    `[Mock] You are looking at ${formatYear(year, "en")}, with the map around ${where}.`,
    event
      ? `The selected event is ${event.title.en}. ${event.summary.en}`
      : "No event is selected.",
    "",
    "Key points:",
    `- Your question: “${current.content.slice(0, 80)}”`,
    `- Answer depth: ${depth}`,
    earlierYears.length
      ? `- Earlier questions were asked at: ${earlierYears.join(", ")}`
      : "- This is the first question in the conversation",
    "",
    "This is a canned answer; no AI model was called.",
  ];
  if (long) lines.push("", ...filler("en"));
  return lines.join("\n");
}

function filler(locale: "en" | "vi"): string[] {
  const paragraph =
    locale === "vi"
      ? "Đoạn văn mẫu để kiểm tra việc tự cuộn và nút dừng. Câu trả lời thật sẽ do mô hình viết dựa trên dữ liệu sự kiện và ngữ cảnh bạn đang xem."
      : "Filler paragraph for testing auto-scroll and the stop button. A real answer would be written by the model from the event data and the context you are looking at.";
  return Array.from({ length: 8 }, (_, i) => `${i + 1}. ${paragraph}\n`);
}
