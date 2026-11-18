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
    "Explore the Roman Republic and the Mediterranean world, {range}, through a timeline, a map and an AI tutor. The app holds {events} events, {snapshots} border snapshots and {battles}, in English and Vietnamese.",
  "about.what.battles.one": "{count} battle to watch in 3D",
  "about.what.battles.other": "{count} battles to watch in 3D",
  "about.use.heading": "How to use it",
  "about.use.timeline":
    "Drag the timeline at the bottom of the page, or press play to watch the years go by. The borders on the map follow the year.",
  "about.use.events":
    "Click an event in the list, on the map or on the timeline to read its summary and sources. The map flies to where it happened.",
  "about.use.battle":
    "Battles with a 3D scene (so far: {battles}) have a “{button}” button in their event panel. The map flies to the battlefield, then the battle opens: play it or scrub through it, read the narration phase by phase and what is known of the two sides. {space} plays or pauses, {left} and {right} go to the previous or next phase, {esc} closes it.",
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
  "about.accuracy.battle": "Battles in 3D are reconstructions:",
  "about.accuracy.battle.positions":
    "where the units stood and how they moved follow Polybius and Livy, and much of it is disputed; the “{tab}” tab of the battle view says what is uncertain;",
  "about.accuracy.battle.figures":
    "each figure stands for {men} men, and the figures are drawn larger than life;",
  "about.accuracy.battle.duels":
    "the men who fight in pairs show what hand-to-hand fighting was like; they are not a record of who fought whom;",
  "about.accuracy.battle.time": "Cannae, a battle of about 11 hours, plays in a few minutes;",
  "about.accuracy.battle.pulses":
    "the fighting is shown without a pause; in a real battle the lines probably fought in short bursts and drew apart to rest in between;",
  "about.accuracy.battle.scenery":
    "the country around the armies is part evidence and part illustration: the hills, the river and the shore follow today’s elevation data, though river and shore have both moved since antiquity; the fields only show that this was farmland, and are no record of any real field;",
  "about.accuracy.battle.colours":
    "equipment and colours follow the ancient sources and surviving objects, but some colours were chosen only to tell the armies apart.",
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
  "about.credits.battles": "3D battles:",
  "about.credits.terrain": "Battle terrain: {attribution} {disclaimer} Licence: {licence}.",
  "about.credits.models":
    'Soldier models based on "{roman}" and "{celt}", both by Andywoodhead (Sketchfab, {ccBy4}). Modified.',
  "about.credits.horses":
    'Horses based on "{horse}" by Tarnyloo (Blend Swap, {ccBy3}), with the rig and gaits of "{rigged}" by fdoss001 (Blend Swap, CC0). Modified.',
  "about.credits.animations": "Animations from the {library} by Quaternius (CC0).",
  "about.credits.battleSources":
    "Sources of the battle of Cannae: {polybius} and {livy}. Each battle lists its own sources in the “{tab}” tab of the battle view.",
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
  "map.flyingToBattle": "Flying to the battlefield…",
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
  "battle.scene.label": "3D battle scene",
  "battle.scene.loading": "Loading the scene…",
  "battle.scene.error":
    "The 3D scene could not be shown. Your browser or graphics card may not support WebGL 2.",
  "battle.scene.hint": "Drag to move, right-drag to turn, scroll to zoom. Click a unit to learn about it.",
  "battle.scene.unitNames": "Unit names",
  "battle.scene.quality": "Quality",
  "battle.scene.quality.high": "High",
  "battle.scene.quality.low": "Low",
  "battle.scene.quality.lowered": "Quality lowered to keep the scene smooth.",
  "battle.scene.approximate": "approximate location",
  "battle.scene.stats.fps": "frames per second",
  "battle.scene.stats.figures": "figures standing",
  "battle.scene.stats.drawn": "figures in view",
  "battle.scene.stats.calls": "draw calls",
  "battle.scene.stats.triangles": "triangles",
  "battle.scene.stats.lods": "blocks at LOD 0 / 1 / 2",
  "battle.scene.stats.models": "models",
  "battle.scene.stats.gpu": "graphics card",
  "battle.open": "View the battle in 3D",
  "battle.viewer.loading": "Loading the battle…",
  "battle.viewer.error": "The battle could not be loaded. Close this view and try again.",
  "battle.viewer.close": "Close the battle",
  "battle.viewer.panel": "Narration and details",
  "battle.viewer.panel.hide": "Hide the side panel",
  "battle.viewer.panel.show": "Show the side panel",
  "battle.viewer.tabs": "Sections of the side panel",
  "battle.viewer.tab.story": "Narration",
  "battle.viewer.tab.info": "About the battle",
  "battle.viewer.keys": "Space: play or pause · ← →: previous or next phase · Esc: close",
  "battle.controls.label": "Playback",
  "battle.controls.play": "Play",
  "battle.controls.pause": "Pause",
  "battle.controls.replay": "Play again from the start",
  "battle.controls.previous": "Previous phase",
  "battle.controls.next": "Next phase",
  "battle.controls.time": "Battle time",
  "battle.controls.clock": "Time of day",
  "battle.controls.speed": "Playback speed",
  "battle.phase": "Phase {n} of {total}",
  "battle.phase.list": "Phases of the battle",
  "battle.info.date": "Date",
  "battle.info.sides": "The two sides",
  "battle.info.commanders": "Commanders",
  "battle.info.strength": "Strength",
  "battle.info.casualties": "Casualties",
  "battle.info.men": "{count} men",
  "battle.info.uncertainty": "What is uncertain",
  "battle.info.sources": "Sources",
  "battle.info.sources.battle": "The battle",
  "battle.info.sources.terrain": "The terrain",
  "battle.info.newTab": "opens in a new tab",
  "battle.info.units": "Units",
  "battle.info.units.hint": "Choose a unit to see it on the field.",
  "battle.card.label": "About this unit",
  "battle.card.close": "Close",
  "battle.card.type": "Type",
  "battle.card.start": "Men at the start",
  "battle.card.now": "Men now",
  "battle.card.action": "Action",
  "battle.action.stand": "Standing",
  "battle.action.advance": "Advancing",
  "battle.action.charge": "Charging",
  "battle.action.fight": "Fighting hand to hand",
  "battle.action.skirmish": "Skirmishing",
  "battle.action.retreat": "Falling back",
  "battle.action.rout": "Fleeing",
  "battle.action.pursue": "Pursuing",
  "battle.credits.heading": "Credits",
  "battle.credits.models":
    'Soldier models based on "Roman Soldier - T pose" and "Celt - rigged for UE4/5", both by Andywoodhead (Sketchfab, CC BY 4.0). Horses based on "Horse" by Tarnyloo (Blend Swap, CC BY 3.0), with the rig and gaits of "Horse Rigged All Gaits" by fdoss001 (Blend Swap, CC0). Modified. Animations from the Universal Animation Library by Quaternius (CC0).',
  "battle.credits.terrain": "Terrain",
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
    "Khám phá Cộng hoà La Mã và thế giới Địa Trung Hải, {range}, qua dòng thời gian, bản đồ và gia sư AI. Dữ liệu gồm {events} sự kiện, {snapshots} mốc biên giới và {battles}, bằng tiếng Anh và tiếng Việt.",
  "about.what.battles.one": "{count} trận đánh xem được dạng 3D",
  "about.what.battles.other": "{count} trận đánh xem được dạng 3D",
  "about.use.heading": "Cách dùng",
  "about.use.timeline":
    "Kéo thanh thời gian ở cuối trang, hoặc bấm phát để xem các năm trôi qua. Biên giới trên bản đồ đổi theo năm.",
  "about.use.events":
    "Bấm một sự kiện trong danh sách, trên bản đồ hoặc trên dòng thời gian để đọc tóm tắt và nguồn. Bản đồ bay tới nơi diễn ra sự kiện.",
  "about.use.battle":
    "Trận đánh có cảnh 3D (hiện có: {battles}) có nút “{button}” trong panel sự kiện. Bản đồ bay tới chiến trường rồi khung xem trận mở ra: phát hoặc tua trận, đọc lời dẫn theo từng giai đoạn và thông tin về hai bên. {space} phát hoặc dừng, {left} và {right} sang giai đoạn trước hoặc sau, {esc} đóng khung xem trận.",
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
  "about.accuracy.battle": "Trận đánh 3D là phỏng dựng:",
  "about.accuracy.battle.positions":
    "vị trí và đường đi của các khối quân dựa theo Polybius và Livy, nhiều chỗ còn tranh cãi; tab “{tab}” trong khung xem trận ghi rõ những gì chưa chắc chắn;",
  "about.accuracy.battle.figures":
    "mỗi hình lính tượng trưng cho {men} người, và hình lính được vẽ to hơn thật;",
  "about.accuracy.battle.duels":
    "các cặp lính đấu với nhau là minh hoạ cho cảnh giáp lá cà, không phải ghi chép ai đánh với ai;",
  "about.accuracy.battle.time": "trận Cannae kéo dài khoảng 11 giờ được phát trong vài phút;",
  "about.accuracy.battle.pulses":
    "cảnh vẽ hai bên đánh liên tục; trong trận thật, nhiều khả năng hai tuyến đánh theo từng đợt ngắn, giữa các đợt thì lùi ra nghỉ;",
  "about.accuracy.battle.scenery":
    "cảnh vật quanh hai đạo quân có phần theo tư liệu, có phần minh hoạ: đồi núi, sông và bờ biển theo dữ liệu độ cao ngày nay, dù sông và bờ biển đều đã đổi chỗ từ thời cổ; các thửa ruộng chỉ cho thấy đây là đất canh tác, không phải ghi chép về thửa ruộng nào có thật;",
  "about.accuracy.battle.colours":
    "trang bị và màu sắc dựa theo sử liệu và hiện vật, nhưng một số màu chỉ là lựa chọn để phân biệt các đạo quân.",
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
  "about.credits.battles": "Trận đánh 3D:",
  "about.credits.terrain": "Địa hình trận đánh: {attribution} {disclaimer} Giấy phép: {licence}.",
  "about.credits.models":
    'Các mô hình lính dựa trên "{roman}" và "{celt}", cùng của Andywoodhead (Sketchfab, {ccBy4}). Đã sửa đổi.',
  "about.credits.horses":
    'Ngựa dựa trên "{horse}" của Tarnyloo (Blend Swap, {ccBy3}), khung xương và dáng đi từ "{rigged}" của fdoss001 (Blend Swap, CC0). Đã sửa đổi.',
  "about.credits.animations": "Hoạt hình từ {library} của Quaternius (CC0).",
  "about.credits.battleSources":
    "Nguồn của trận Cannae: {polybius} và {livy}. Mỗi trận ghi nguồn riêng ở tab “{tab}” trong khung xem trận.",
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
  "map.flyingToBattle": "Đang bay tới chiến trường…",
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
  "battle.scene.label": "Cảnh trận đánh 3D",
  "battle.scene.loading": "Đang tải cảnh…",
  "battle.scene.error":
    "Không hiển thị được cảnh 3D. Trình duyệt hoặc card đồ hoạ của bạn có thể không hỗ trợ WebGL 2.",
  "battle.scene.hint":
    "Kéo để di chuyển, kéo chuột phải để xoay, cuộn để phóng. Bấm vào một khối quân để xem thông tin.",
  "battle.scene.unitNames": "Tên khối quân",
  "battle.scene.quality": "Chất lượng",
  "battle.scene.quality.high": "Cao",
  "battle.scene.quality.low": "Thấp",
  "battle.scene.quality.lowered": "Đã hạ chất lượng để cảnh chạy mượt.",
  "battle.scene.approximate": "vị trí ước lượng",
  "battle.scene.stats.fps": "khung hình/giây",
  "battle.scene.stats.figures": "hình lính còn đứng",
  "battle.scene.stats.drawn": "hình lính trong khung hình",
  "battle.scene.stats.calls": "lệnh vẽ",
  "battle.scene.stats.triangles": "tam giác",
  "battle.scene.stats.lods": "khối ở LOD 0 / 1 / 2",
  "battle.scene.stats.models": "mô hình",
  "battle.scene.stats.gpu": "card đồ hoạ",
  "battle.open": "Xem trận đánh 3D",
  "battle.viewer.loading": "Đang tải trận đánh…",
  "battle.viewer.error": "Không tải được trận đánh. Hãy đóng khung này rồi thử lại.",
  "battle.viewer.close": "Đóng trận đánh",
  "battle.viewer.panel": "Lời dẫn và thông tin",
  "battle.viewer.panel.hide": "Ẩn khung bên",
  "battle.viewer.panel.show": "Hiện khung bên",
  "battle.viewer.tabs": "Các phần của khung bên",
  "battle.viewer.tab.story": "Lời dẫn",
  "battle.viewer.tab.info": "Thông tin trận",
  "battle.viewer.keys": "Space: phát hoặc dừng · ← →: giai đoạn trước hoặc sau · Esc: đóng",
  "battle.controls.label": "Điều khiển phát",
  "battle.controls.play": "Phát",
  "battle.controls.pause": "Dừng",
  "battle.controls.replay": "Phát lại từ đầu",
  "battle.controls.previous": "Giai đoạn trước",
  "battle.controls.next": "Giai đoạn sau",
  "battle.controls.time": "Thời gian trong trận",
  "battle.controls.clock": "Giờ trong ngày",
  "battle.controls.speed": "Tốc độ phát",
  "battle.phase": "Giai đoạn {n}/{total}",
  "battle.phase.list": "Các giai đoạn của trận đánh",
  "battle.info.date": "Ngày",
  "battle.info.sides": "Hai bên tham chiến",
  "battle.info.commanders": "Chỉ huy",
  "battle.info.strength": "Quân số",
  "battle.info.casualties": "Thương vong",
  "battle.info.men": "{count} người",
  "battle.info.uncertainty": "Những điểm chưa chắc chắn",
  "battle.info.sources": "Nguồn",
  "battle.info.sources.battle": "Trận đánh",
  "battle.info.sources.terrain": "Địa hình",
  "battle.info.newTab": "mở trong tab mới",
  "battle.info.units": "Các khối quân",
  "battle.info.units.hint": "Chọn một khối để xem trên chiến trường.",
  "battle.card.label": "Thông tin khối quân",
  "battle.card.close": "Đóng",
  "battle.card.type": "Loại lính",
  "battle.card.start": "Quân số đầu trận",
  "battle.card.now": "Quân số lúc này",
  "battle.card.action": "Đang làm gì",
  "battle.action.stand": "Đứng yên",
  "battle.action.advance": "Tiến lên",
  "battle.action.charge": "Xung phong",
  "battle.action.fight": "Giáp lá cà",
  "battle.action.skirmish": "Đánh từ xa",
  "battle.action.retreat": "Rút lui",
  "battle.action.rout": "Tháo chạy",
  "battle.action.pursue": "Truy kích",
  "battle.credits.heading": "Ghi công",
  "battle.credits.models":
    'Các mô hình lính dựa trên "Roman Soldier - T pose" và "Celt - rigged for UE4/5", cùng của Andywoodhead (Sketchfab, CC BY 4.0). Ngựa dựa trên "Horse" của Tarnyloo (Blend Swap, CC BY 3.0), khung xương và dáng đi từ "Horse Rigged All Gaits" của fdoss001 (Blend Swap, CC0). Đã sửa đổi. Hoạt hình từ Universal Animation Library của Quaternius (CC0).',
  "battle.credits.terrain": "Địa hình",
};

export const messages: Record<Locale, Record<MessageKey, string>> = { en, vi };

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "vi", label: "Tiếng Việt" },
];
