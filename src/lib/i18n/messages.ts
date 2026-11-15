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
  "map.placeholder": "The historical map is built in phase 2.",
  "map.center": "Map centre",
  "map.zoom": "Zoom",
  "events.heading": "Events",
  "events.empty": "No events recorded yet.",
  "events.now": "Now",
  "events.sources": "Sources",
  "events.approximate": "Approximate location",
  "tutor.heading": "AI tutor",
  "tutor.placeholder":
    "The tutor is built in phase 4. It will know the year, the place and the event you are looking at.",
  "tutor.context": "Context the tutor will receive",
  "tutor.context.year": "Year",
  "tutor.context.event": "Selected event",
  "tutor.context.none": "none",
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
  "map.placeholder": "Bản đồ lịch sử sẽ làm ở giai đoạn 2.",
  "map.center": "Tâm bản đồ",
  "map.zoom": "Mức phóng",
  "events.heading": "Các sự kiện",
  "events.empty": "Chưa có sự kiện nào trong dữ liệu.",
  "events.now": "Đang diễn ra",
  "events.sources": "Nguồn",
  "events.approximate": "Vị trí ước lượng",
  "tutor.heading": "Gia sư AI",
  "tutor.placeholder":
    "Gia sư sẽ làm ở giai đoạn 4. Nó sẽ biết năm, địa điểm và sự kiện bạn đang xem.",
  "tutor.context": "Ngữ cảnh gia sư sẽ nhận được",
  "tutor.context.year": "Năm",
  "tutor.context.event": "Sự kiện đang chọn",
  "tutor.context.none": "chưa chọn",
};

export const messages: Record<Locale, Record<MessageKey, string>> = { en, vi };

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "vi", label: "Tiếng Việt" },
];
