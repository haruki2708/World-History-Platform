import type { Locale } from "@/lib/types";

/**
 * UI strings. Add a key to `en` first; TypeScript then requires it in `vi`.
 * Historical content (event titles, summaries) lives in src/data, not here.
 */
const en = {
  "app.title": "World History Platform",
  "app.subtitle": "The Roman Republic, 509–27 BCE",
  "locale.switch": "Language",
  "about.button": "About",
  "about.title": "About this app",
  "about.close": "Close",
  "about.newTab": "opens in a new tab",
  "about.hint.lead": "New here?",
  "about.hint.open": "See what this app does",
  "about.hint.dismiss": "Dismiss this tip",
  "about.what.heading": "What this is",
  "about.what.body":
    "Explore the Roman Republic and the Mediterranean world, {range}, through a timeline, a map and an AI tutor. The app holds {events} events and {snapshots} border snapshots, in English and Vietnamese.",
  "about.use.heading": "How to use it",
  "about.use.timeline":
    "Drag the timeline at the bottom of the page, or press play to watch the years go by. The borders on the map follow the year.",
  "about.use.events":
    "Click an event in the list, on the map or on the timeline to read its summary and sources. The map flies to where it happened.",
  "about.use.tutor":
    "Ask the AI tutor about what you are looking at. Every question is sent with the year and the part of the map in view.",
  "about.use.links":
    "An answer can come with buttons that take you to the year and the event it mentions.",
  "about.use.share":
    "Share copies a link that opens the app on the same year, event and language.",
  "about.use.shortcuts": "Show keyboard shortcuts",
  "about.accuracy.heading": "How far to trust it",
  "about.accuracy.borders":
    "Borders are estimates, redrawn by hand from historical atlases and data sets: right in broad outline, not in every detail. Each border snapshot holds until the next one, so changes between two snapshots do not show.",
  "about.accuracy.blank":
    "Land left uncoloured belonged to peoples and states that are not yet in the data set.",
  "about.accuracy.coast":
    "Coastlines and rivers are today's. In some places, such as the Po and Nile deltas, they differ noticeably from ancient times.",
  "about.accuracy.dates":
    "Many dates of the early Republic are traditional rather than certain; an event's summary says so when its date is traditional or disputed. Sites that are uncertain are marked as approximate on the map.",
  "about.accuracy.tutor":
    "The AI tutor can be wrong. Check what it says against the sources listed under each event.",
  "about.credits.heading": "Sources and credits",
  "about.credits.borders":
    "Borders are redrawn by hand, with these references:",
  "about.credits.shepherd":
    "W. R. Shepherd, {title} (1911 and 1923), public domain.",
  "about.credits.cliopatria":
    "Cliopatria v0.2.1, by the Seshat Global History Databank: {citation}. Licensed under {license}. Simplified and redrawn, not copied.",
  "about.credits.etAl": "et al.",
  "about.credits.data": "Data",
  "about.credits.paper": "Paper",
  "about.credits.basemap":
    "Base map (sea, lakes and rivers): {link}, public domain.",
  "about.credits.events":
    "Events: summaries written for this project. Each event cites its own sources, mostly ancient authors such as Livy, Polybius, Plutarch and Appian, most with a link to a translation or reference page online.",
  "about.tutor.heading": "About the AI tutor",
  "about.tutor.model": "The tutor uses Claude, an AI model made by Anthropic.",
  "about.tutor.context":
    "Each question is sent with the year, the selected event, the part of the map in view and the interface language, together with the earlier questions and answers of the conversation.",
  "about.tutor.storage":
    "The app does not save conversations. The chat lives only in this page and is gone when you reload it or start a new chat.",
  "about.tutor.limits":
    "To prevent abuse, the number of questions per minute and per day is limited.",
  "timeline.label": "Year",
  "timeline.play": "Play",
  "timeline.pause": "Pause",
  "timeline.speed": "Speed",
  "timeline.speedUnit": "yrs/s",
  "timeline.markers": "Events on the timeline",
  "timeline.cluster": "{count} more events around {year}",
  "panel.tabs": "Side panel",
  "share.button": "Share",
  "share.copied": "Link copied",
  "share.manual.title": "Copy this link",
  "share.manual.hint":
    "Your browser did not allow copying. Select the link below and copy it.",
  "share.manual.label": "Link to this view",
  "share.close": "Close",
  "shortcuts.button": "Shortcuts",
  "shortcuts.title": "Keyboard shortcuts",
  "shortcuts.hint": "Keyboard shortcuts (press ?)",
  "shortcuts.close": "Close",
  "shortcuts.key.space": "Space",
  "shortcuts.playPause": "Play or pause",
  "shortcuts.step": "Back or forward 1 year",
  "shortcuts.stepBig": "Back or forward 10 years",
  "shortcuts.ends": "Jump to {start} or {end}",
  "shortcuts.ask": "Ask the tutor",
  "shortcuts.leave": "Leave the text box, or close this list",
  "shortcuts.help": "Show this list",
  "shortcuts.note":
    "Shortcuts are off while you type, and while the map has focus (there the arrow keys move the map).",
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
  "map.legend.eventActive": "Event in this year",
  "map.legend.eventNearby": "Event in nearby years",
  "map.legend.approximate": "Approximate location",
  "map.legend.bordersCredit":
    "Borders are approximate, redrawn after Shepherd's Historical Atlas and",
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
  "tutor.mapLinks": "On the map",
  "tutor.mapLink.year": "Go to {year}",
  "tutor.mapLink.label": "View on map: {target}",
  "tutor.mapLink.current": "Showing",
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
  "tutor.error.limit_reached":
    "The tutor has reached its question limit for now. Please come back later.",
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
  "about.button": "Giới thiệu",
  "about.title": "Giới thiệu",
  "about.close": "Đóng",
  "about.newTab": "mở trong thẻ mới",
  "about.hint.lead": "Lần đầu ghé thăm?",
  "about.hint.open": "Xem app này làm được gì",
  "about.hint.dismiss": "Đóng gợi ý",
  "about.what.heading": "App này là gì",
  "about.what.body":
    "Khám phá Cộng hoà La Mã và thế giới Địa Trung Hải, {range}, qua dòng thời gian, bản đồ và gia sư AI. Dữ liệu gồm {events} sự kiện và {snapshots} mốc biên giới, bằng tiếng Anh và tiếng Việt.",
  "about.use.heading": "Cách dùng",
  "about.use.timeline":
    "Kéo thanh thời gian ở cuối trang, hoặc bấm phát để xem các năm trôi qua. Biên giới trên bản đồ đổi theo năm.",
  "about.use.events":
    "Bấm một sự kiện trong danh sách, trên bản đồ hoặc trên dòng thời gian để đọc tóm tắt và nguồn. Bản đồ bay tới nơi diễn ra sự kiện.",
  "about.use.tutor":
    "Hỏi gia sư AI về những gì bạn đang xem. Mỗi câu hỏi luôn được gửi kèm năm và vùng bản đồ đang xem.",
  "about.use.links":
    "Câu trả lời có thể kèm nút đưa bạn tới đúng năm và sự kiện được nhắc tới.",
  "about.use.share":
    "Nút Chia sẻ chép một link mở app ở đúng năm, sự kiện và ngôn ngữ bạn đang xem.",
  "about.use.shortcuts": "Xem phím tắt",
  "about.accuracy.heading": "Độ chính xác",
  "about.accuracy.borders":
    "Biên giới là ước lượng, được vẽ lại bằng tay theo các tập bản đồ và bộ dữ liệu lịch sử: đúng về đại thể, không đúng từng chi tiết. Mỗi mốc biên giới được giữ cho tới mốc sau, nên những thay đổi giữa hai mốc không hiện ra.",
  "about.accuracy.blank":
    "Vùng đất không tô màu thuộc về những dân tộc và vương quốc chưa có trong dữ liệu.",
  "about.accuracy.coast":
    "Bờ biển và sông là của ngày nay. Ở một số nơi, như châu thổ sông Po và sông Nile, chúng khác đáng kể so với thời cổ đại.",
  "about.accuracy.dates":
    "Nhiều mốc năm thời đầu Cộng hoà là theo truyền thống, chưa chắc chắn; phần tóm tắt của sự kiện nói rõ khi mốc năm theo truyền thống hoặc còn tranh cãi. Địa điểm chưa chắc chắn được đánh dấu là vị trí ước lượng trên bản đồ.",
  "about.accuracy.tutor":
    "Gia sư AI có thể sai. Hãy đối chiếu với các nguồn ghi ở từng sự kiện.",
  "about.credits.heading": "Nguồn và ghi công",
  "about.credits.borders": "Biên giới được vẽ tay, tham chiếu:",
  "about.credits.shepherd":
    "W. R. Shepherd, {title} (1911 và 1923), phạm vi công cộng.",
  "about.credits.cliopatria":
    "Cliopatria v0.2.1 của Seshat Global History Databank: {citation}. Giấy phép {license}. Đã đơn giản hoá và vẽ lại, không sao chép nguyên.",
  "about.credits.etAl": "và cộng sự",
  "about.credits.data": "Dữ liệu",
  "about.credits.paper": "Bài báo",
  "about.credits.basemap":
    "Bản đồ nền (biển, hồ, sông): {link}, phạm vi công cộng.",
  "about.credits.events":
    "Sự kiện: tóm tắt tự viết cho dự án. Mỗi sự kiện dẫn nguồn riêng, chủ yếu là sử liệu cổ như Livy, Polybius, Plutarch, Appian; phần lớn có link tới bản dịch hoặc bài tham khảo trực tuyến.",
  "about.tutor.heading": "Về gia sư AI",
  "about.tutor.model": "Gia sư dùng Claude, mô hình AI của Anthropic.",
  "about.tutor.context":
    "Mỗi câu hỏi được gửi kèm năm, sự kiện đang chọn, vùng bản đồ đang xem và ngôn ngữ giao diện, cùng các câu hỏi và trả lời trước đó trong cuộc trò chuyện.",
  "about.tutor.storage":
    "App không lưu cuộc trò chuyện. Lịch sử chỉ nằm trong trang này và mất khi bạn tải lại trang hoặc bắt đầu cuộc trò chuyện mới.",
  "about.tutor.limits":
    "Để tránh lạm dụng, số câu hỏi mỗi phút và mỗi ngày có giới hạn.",
  "timeline.label": "Năm",
  "timeline.play": "Phát",
  "timeline.pause": "Tạm dừng",
  "timeline.speed": "Tốc độ",
  "timeline.speedUnit": "năm/giây",
  "timeline.markers": "Các sự kiện trên dòng thời gian",
  "timeline.cluster": "Thêm {count} sự kiện quanh năm {year}",
  "panel.tabs": "Bảng bên",
  "share.button": "Chia sẻ",
  "share.copied": "Đã chép link",
  "share.manual.title": "Chép link này",
  "share.manual.hint":
    "Trình duyệt không cho chép tự động. Hãy chọn link bên dưới rồi chép.",
  "share.manual.label": "Link tới góc nhìn này",
  "share.close": "Đóng",
  "shortcuts.button": "Phím tắt",
  "shortcuts.title": "Phím tắt",
  "shortcuts.hint": "Phím tắt (bấm ?)",
  "shortcuts.close": "Đóng",
  "shortcuts.key.space": "Space",
  "shortcuts.playPause": "Phát hoặc tạm dừng",
  "shortcuts.step": "Lùi hoặc tiến 1 năm",
  "shortcuts.stepBig": "Lùi hoặc tiến 10 năm",
  "shortcuts.ends": "Về năm {start} hoặc {end}",
  "shortcuts.ask": "Hỏi gia sư",
  "shortcuts.leave": "Rời ô nhập, hoặc đóng bảng này",
  "shortcuts.help": "Mở bảng này",
  "shortcuts.note":
    "Phím tắt tạm tắt khi bạn đang gõ chữ và khi đang ở trên bản đồ (khi đó phím mũi tên dùng để di chuyển bản đồ).",
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
  "map.legend.eventActive": "Sự kiện trong năm này",
  "map.legend.eventNearby": "Sự kiện ở các năm lân cận",
  "map.legend.approximate": "Vị trí ước lượng",
  "map.legend.bordersCredit":
    "Biên giới là ước lượng, vẽ lại theo Historical Atlas của Shepherd và",
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
  "tutor.mapLinks": "Xem trên bản đồ",
  "tutor.mapLink.year": "Đến năm {year}",
  "tutor.mapLink.label": "Xem trên bản đồ: {target}",
  "tutor.mapLink.current": "Đang xem",
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
  "tutor.error.limit_reached":
    "Gia sư đã hết lượt hỏi cho lúc này. Hãy quay lại sau.",
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
