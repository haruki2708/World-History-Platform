import { getEvent, getEventsAround } from "@/data";
import type {
  TutorErrorCode,
  TutorRequest,
  TutorStreamEvent,
} from "@/lib/tutor";
import type { Locale } from "@/lib/types";
import { formatYear } from "@/lib/years";
import { ERROR_STATUS } from "./config";

/*
 * Mock mode (TUTOR_MOCK=1): a canned answer built from the request, with no
 * API call. It repeats the context it received so the chat can be checked end
 * to end. Directives anywhere in the latest question change the outcome:
 *
 *   #error:<code>     fail with that TutorErrorCode before any text
 *   #error:midstream  send some text, then fail with `unavailable`
 *   #truncated        finish with `done` and `truncated: true`
 */

function isErrorCode(value: string | undefined): value is TutorErrorCode {
  return value !== undefined && Object.hasOwn(ERROR_STATUS, value);
}

const FIRST_CHUNK_DELAY_MS = 250;
const CHUNK_DELAY_MS = 35;
const WORDS_PER_CHUNK = 3;

const TEXT = {
  en: {
    intro: "This is a mock answer. No request was sent to the Claude API.",
    asked: "You asked",
    received: "Here is the context that arrived with your question:",
    year: "Year",
    event: "Selected event",
    none: "none",
    centre: "Map centre",
    zoom: "zoom",
    bounds: "Map bounds (west, south, east, north)",
    nearby: "Events around this year",
    depth: "Depth",
    history: "Messages in this conversation",
    deep: "Deep mode is on, so a real answer would be longer and go further into causes, consequences and the points historians dispute. This extra paragraph stands in for that, so the difference in length is visible in the chat.",
    closing:
      "When the tutor is connected, this is where the explanation would be.",
  },
  vi: {
    intro:
      "Đây là câu trả lời giả lập. Không có yêu cầu nào được gửi tới Claude API.",
    asked: "Bạn đã hỏi",
    received: "Đây là ngữ cảnh đi kèm câu hỏi của bạn:",
    year: "Năm",
    event: "Sự kiện đang chọn",
    none: "chưa chọn",
    centre: "Tâm bản đồ",
    zoom: "mức phóng",
    bounds: "Giới hạn bản đồ (tây, nam, đông, bắc)",
    nearby: "Sự kiện quanh năm này",
    depth: "Độ sâu",
    history: "Số tin nhắn trong cuộc trò chuyện",
    deep: "Chế độ giải thích sâu đang bật, nên câu trả lời thật sẽ dài hơn và đi sâu hơn vào nguyên nhân, hệ quả và những điểm các sử gia còn tranh luận. Đoạn thêm này thay cho phần đó, để thấy rõ khác biệt về độ dài trong khung chat.",
    closing: "Khi gia sư được kết nối, phần giải thích sẽ nằm ở đây.",
  },
} as const satisfies Record<Locale, Record<string, string>>;

function buildAnswer(request: TutorRequest): string {
  const last = request.messages[request.messages.length - 1];
  if (last.role !== "user") return "";

  const { content, context } = last;
  const { year, locale, viewport, selectedEventId } = context;
  const text = TEXT[locale];
  const selected = selectedEventId ? getEvent(selectedEventId) : undefined;
  const question =
    content.length > 120 ? `${content.slice(0, 120).trimEnd()}…` : content;

  const bullets = [
    `${text.year}: ${formatYear(year, locale)}`,
    `${text.event}: ${selected ? selected.title[locale] : text.none}`,
    `${text.centre}: ${viewport.center.lat.toFixed(2)}°, ${viewport.center.lng.toFixed(2)}° · ${text.zoom} ${viewport.zoom.toFixed(1)}`,
  ];
  if (viewport.bounds) {
    bullets.push(
      `${text.bounds}: ${viewport.bounds.map((value) => value.toFixed(2)).join(", ")}`,
    );
  }
  bullets.push(
    `${text.nearby}: ${getEventsAround(year).length}`,
    `${text.depth}: ${request.depth}`,
    `${text.history}: ${request.messages.length}`,
  );

  const paragraphs = [
    `${text.intro} ${text.asked}: “${question.replace(/\s+/g, " ")}”`,
    `${text.received}\n${bullets.map((bullet) => `- ${bullet}`).join("\n")}`,
  ];
  if (request.depth === "deep") paragraphs.push(text.deep);
  paragraphs.push(text.closing);
  return paragraphs.join("\n\n");
}

/** Splits text into chunks of a few words, keeping all whitespace. */
function chunk(text: string): string[] {
  const words = text.match(/\S+\s*/g) ?? [];
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += WORDS_PER_CHUNK) {
    chunks.push(words.slice(i, i + WORDS_PER_CHUNK).join(""));
  }
  return chunks;
}

/** Resolves after `ms`, or at once when the signal aborts. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    signal.addEventListener("abort", finish);
  });
}

export async function* streamMockAnswer(
  request: TutorRequest,
  signal: AbortSignal,
): AsyncGenerator<TutorStreamEvent, void, void> {
  const question = request.messages[request.messages.length - 1].content;
  const directive = /#error:([a-z_]+)/.exec(question)?.[1];
  const failMidstream = directive === "midstream";

  await sleep(FIRST_CHUNK_DELAY_MS, signal);
  if (signal.aborted) return;
  if (isErrorCode(directive)) {
    yield { type: "error", code: directive };
    return;
  }

  const chunks = chunk(buildAnswer(request));
  const stopAfter = failMidstream ? Math.min(8, chunks.length) : chunks.length;
  for (const text of chunks.slice(0, stopAfter)) {
    yield { type: "text", text };
    await sleep(CHUNK_DELAY_MS, signal);
    if (signal.aborted) return;
  }

  if (failMidstream) yield { type: "error", code: "unavailable" };
  else yield { type: "done", truncated: question.includes("#truncated") };
}
