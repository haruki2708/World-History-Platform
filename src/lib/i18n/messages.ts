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
  "tutor.placeholder":
    "The tutor is built in phase 4. It will know the year, the place and the event you are looking at.",
  "tutor.context": "Context the tutor will receive",
  "tutor.context.year": "Year",
  "tutor.context.event": "Selected event",
  "tutor.context.view": "Map view",
  "tutor.context.zoom": "zoom",
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
  "tutor.placeholder":
    "Gia sư sẽ làm ở giai đoạn 4. Nó sẽ biết năm, địa điểm và sự kiện bạn đang xem.",
  "tutor.context": "Ngữ cảnh gia sư sẽ nhận được",
  "tutor.context.year": "Năm",
  "tutor.context.event": "Sự kiện đang chọn",
  "tutor.context.view": "Vùng bản đồ",
  "tutor.context.zoom": "mức phóng",
  "tutor.context.none": "chưa chọn",
};

export const messages: Record<Locale, Record<MessageKey, string>> = { en, vi };

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "vi", label: "Tiếng Việt" },
];
