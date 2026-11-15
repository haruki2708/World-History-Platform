import type { Locale } from "@/lib/types";

/**
 * UI strings. Add a key to `en` first; TypeScript then requires it in `vi`.
 * Historical content (event titles, summaries) lives in src/data, not here.
 */
const en = {
  "app.title": "World History Platform",
  "app.subtitle": "The Roman Republic, 509–27 BCE",
  "locale.switch": "Language",
  "timeline.label": "Year",
  "timeline.play": "Play",
  "timeline.pause": "Pause",
  "timeline.speed": "Speed",
  "timeline.speedUnit": "yrs/s",
  "timeline.markers": "Events on the timeline",
  "timeline.cluster": "{count} more events around {year}",
  "panel.tabs": "Side panel",
  "map.label": "Historical map",
  "map.loading": "Loading map…",
  "map.error": "The map could not be loaded.",
  "map.zoomIn": "Zoom in",
  "map.zoomOut": "Zoom out",
  "map.resetView": "Reset view",
  "map.legend": "Legend",
  "map.legend.bordersAsOf": "Borders as of",
  "map.legend.noBorders": "No border data for this year yet.",
  "map.legend.bordersError": "Border data could not be loaded.",
  "map.legend.testData": "Test data, development only",
  "map.legend.eventActive": "Event in this year",
  "map.legend.eventNearby": "Event in nearby years",
  "map.legend.approximate": "Approximate location",
  "map.legend.basemap": "Present-day coastlines and rivers (Natural Earth).",
  "events.heading": "Events",
  "events.empty": "No events recorded yet.",
  "events.now": "Now",
  "events.sources": "Sources",
  "events.approximate": "Approximate location",
  "tutor.heading": "AI tutor",
  "tutor.intro":
    "Ask about what you are looking at. Each question is sent with the year, the map view and the selected event.",
  "tutor.suggestions": "Suggested questions",
  "tutor.suggest.here": "What is happening here?",
  "tutor.suggest.event": "Why does {event} matter?",
  "tutor.suggest.people": "Who are the key figures at this time?",
  "tutor.suggest.before": "What led up to the situation in {year}?",
  "tutor.messages": "Conversation",
  "tutor.you": "You",
  "tutor.assistant": "Tutor",
  "tutor.askedAt": "Asked at {year}",
  "tutor.thinking": "Thinking…",
  "tutor.stopped": "Stopped",
  "tutor.truncated": "The answer reached its length limit and was cut short.",
  "tutor.deepTag": "Deep",
  "tutor.retry": "Try again",
  "tutor.answered": "The tutor answered:",
  "tutor.input.label": "Ask the tutor",
  "tutor.input.placeholder": "Ask a question…",
  "tutor.input.hint": "Enter to send · Shift+Enter for a new line",
  "tutor.chars": "{count}/{max}",
  "tutor.send": "Send",
  "tutor.stop": "Stop answering",
  "tutor.new": "New chat",
  "tutor.deep": "Deep answer",
  "tutor.deep.note": "Slower, but more thorough.",
  "tutor.context.label": "Sent with your question",
  "tutor.context.mapView": "map view",
  "tutor.limit":
    "This conversation is getting long. Start a new chat to keep asking.",
  "tutor.error.not_configured":
    "The tutor is not ready yet: the server has no API key configured.",
  "tutor.error.invalid_key":
    "The tutor is not available: the server's API key was rejected.",
  "tutor.error.no_credits":
    "The tutor is not available right now: the AI account has run out of credit.",
  "tutor.error.rate_limited":
    "Too many questions in a short time. Wait a moment, then try again.",
  "tutor.error.overloaded":
    "The AI service is busy right now. Try again in a moment.",
  "tutor.error.refused":
    "The tutor declined to answer this. Try asking it a different way.",
  "tutor.error.bad_request":
    "This question could not be sent. It may be too long, or the conversation too large.",
  "tutor.error.unavailable":
    "Something went wrong while reaching the tutor. Try again.",
} as const;

export type MessageKey = keyof typeof en;

const vi: Record<MessageKey, string> = {
  "app.title": "World History Platform",
  "app.subtitle": "Cộng hoà La Mã, 509–27 TCN",
  "locale.switch": "Ngôn ngữ",
  "timeline.label": "Năm",
  "timeline.play": "Phát",
  "timeline.pause": "Tạm dừng",
  "timeline.speed": "Tốc độ",
  "timeline.speedUnit": "năm/giây",
  "timeline.markers": "Các sự kiện trên dòng thời gian",
  "timeline.cluster": "Thêm {count} sự kiện quanh năm {year}",
  "panel.tabs": "Bảng bên",
  "map.label": "Bản đồ lịch sử",
  "map.loading": "Đang tải bản đồ…",
  "map.error": "Không tải được bản đồ.",
  "map.zoomIn": "Phóng to",
  "map.zoomOut": "Thu nhỏ",
  "map.resetView": "Về góc nhìn ban đầu",
  "map.legend": "Chú giải",
  "map.legend.bordersAsOf": "Biên giới vào năm",
  "map.legend.noBorders": "Chưa có dữ liệu biên giới cho năm này.",
  "map.legend.bordersError": "Không tải được dữ liệu biên giới.",
  "map.legend.testData": "Dữ liệu thử, chỉ dùng khi phát triển",
  "map.legend.eventActive": "Sự kiện trong năm này",
  "map.legend.eventNearby": "Sự kiện ở các năm lân cận",
  "map.legend.approximate": "Vị trí ước lượng",
  "map.legend.basemap": "Đường bờ biển và sông ngày nay (Natural Earth).",
  "events.heading": "Các sự kiện",
  "events.empty": "Chưa có sự kiện nào trong dữ liệu.",
  "events.now": "Đang diễn ra",
  "events.sources": "Nguồn",
  "events.approximate": "Vị trí ước lượng",
  "tutor.heading": "Gia sư AI",
  "tutor.intro":
    "Hãy hỏi về những gì bạn đang xem. Mỗi câu hỏi được gửi kèm năm, vùng bản đồ và sự kiện đang chọn.",
  "tutor.suggestions": "Câu hỏi gợi ý",
  "tutor.suggest.here": "Chuyện gì đang xảy ra ở đây?",
  "tutor.suggest.event": "Vì sao {event} quan trọng?",
  "tutor.suggest.people": "Ai là những nhân vật chính lúc này?",
  "tutor.suggest.before": "Điều gì dẫn tới tình hình năm {year}?",
  "tutor.messages": "Cuộc trò chuyện",
  "tutor.you": "Bạn",
  "tutor.assistant": "Gia sư",
  "tutor.askedAt": "Hỏi khi xem năm {year}",
  "tutor.thinking": "Đang suy nghĩ…",
  "tutor.stopped": "Đã dừng",
  "tutor.truncated": "Câu trả lời chạm giới hạn độ dài nên bị cắt ngắn.",
  "tutor.deepTag": "Sâu",
  "tutor.retry": "Thử lại",
  "tutor.answered": "Gia sư đã trả lời:",
  "tutor.input.label": "Hỏi gia sư",
  "tutor.input.placeholder": "Đặt câu hỏi…",
  "tutor.input.hint": "Enter để gửi · Shift+Enter để xuống dòng",
  "tutor.chars": "{count}/{max}",
  "tutor.send": "Gửi",
  "tutor.stop": "Dừng trả lời",
  "tutor.new": "Trò chuyện mới",
  "tutor.deep": "Giải thích sâu",
  "tutor.deep.note": "Chậm hơn nhưng kỹ hơn.",
  "tutor.context.label": "Gửi kèm câu hỏi",
  "tutor.context.mapView": "vùng bản đồ",
  "tutor.limit":
    "Cuộc trò chuyện đã khá dài. Hãy bắt đầu cuộc trò chuyện mới để hỏi tiếp.",
  "tutor.error.not_configured":
    "Gia sư chưa sẵn sàng: máy chủ chưa được cấu hình khoá API.",
  "tutor.error.invalid_key":
    "Gia sư chưa dùng được: khoá API của máy chủ bị từ chối.",
  "tutor.error.no_credits":
    "Gia sư tạm thời chưa dùng được: tài khoản AI đã hết tín dụng.",
  "tutor.error.rate_limited":
    "Bạn hỏi quá nhiều trong thời gian ngắn. Chờ một lát rồi thử lại.",
  "tutor.error.overloaded":
    "Dịch vụ AI đang quá tải. Hãy thử lại sau ít phút.",
  "tutor.error.refused":
    "Gia sư từ chối trả lời câu này. Hãy thử hỏi theo cách khác.",
  "tutor.error.bad_request":
    "Không gửi được câu hỏi này. Có thể câu hỏi quá dài hoặc cuộc trò chuyện quá lớn.",
  "tutor.error.unavailable":
    "Có lỗi khi kết nối tới gia sư. Hãy thử lại.",
};

export const messages: Record<Locale, Record<MessageKey, string>> = { en, vi };

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "vi", label: "Tiếng Việt" },
];
