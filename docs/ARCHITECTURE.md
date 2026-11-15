# Kiến trúc và hợp đồng chung

Tài liệu này mô tả những gì mọi lane phải bám theo. Chỉ phiên chính được sửa các file nêu ở đây.

## Tổng quan

```
src/
  app/                 layout, trang chính, token màu (globals.css)
  components/
    AppShell.tsx       sắp xếp các vùng: header, bản đồ, panel, timeline
    LocaleSwitch.tsx
    map/               Lane 2
    timeline/          Lane 1
    panel/             Lane 1 (danh sách và chi tiết sự kiện)
    tutor/             Lane 1 (khung chat), giai đoạn 4
  data/
    events.json        Lane 3
    polities.json      Lane 3
    border-snapshots.json   Lane 3 (danh mục các mốc biên giới)
    index.ts           hàm truy vấn dữ liệu (phiên chính)
  lib/
    types.ts           kiểu dữ liệu chung
    years.ts           YEAR_MIN, YEAR_MAX, clampYear, formatYear
    i18n/              chuỗi giao diện en/vi và hook useT
  store/
    useAppStore.ts     trạng thái chung
public/data/borders/   file GeoJSON biên giới, Lane 3
public/map/            bản đồ nền (Natural Earth), Lane 2
scripts/               script kiểm tra dữ liệu, Lane 3
```

Trên màn hẹp (dưới 1024px), panel bên chia thành hai tab "Sự kiện" và "Gia sư AI". Trên màn rộng hai phần xếp chồng.

## Trạng thái chung: `useAppStore`

Ba mảng (timeline, bản đồ, tutor) chỉ giao tiếp qua store này.

| Trường | Kiểu | Ai ghi | Ai đọc |
|---|---|---|---|
| `year` | `Year` | Timeline qua `setYear`; chọn sự kiện qua `selectEvent(id, year)` | Tất cả |
| `viewport` | `MapViewport` | Bản đồ qua `setViewport` mỗi khi di chuyển | Tutor |
| `selectedEventId` | `string \| null` | Panel và bản đồ qua `selectEvent` | Tất cả |
| `locale` | `"en" \| "vi"` | `LocaleSwitch` | Tất cả |

`setYear` tự làm tròn và giới hạn trong `[YEAR_MIN, YEAR_MAX]`, nên bên gọi không cần kiểm tra.

## Năm

Số nguyên, âm là TCN, không có năm 0. Phạm vi MVP: `-509` đến `-27`.

## Dữ liệu

Định nghĩa đầy đủ nằm ở `src/lib/types.ts`. Tóm tắt:

- **`HistoricalEvent`** (`src/data/events.json`): `id` dạng kebab-case, `year`, `endYear` tuỳ chọn cho sự kiện kéo dài, `title` và `summary` song ngữ, `location` tuỳ chọn (kinh độ, vĩ độ, `approximate`), `polityIds`, `category`, `importance` 1–3, `sources`.
- **`Polity`** (`src/data/polities.json`): `id`, `name` song ngữ, `color`, `startYear` và `endYear` tuỳ chọn.
- **`BorderSnapshot`** (`src/data/border-snapshots.json`): `year`, `file`, `sources`. Mỗi mốc trỏ tới một file trong `public/data/borders/`.

### File biên giới

- Đường dẫn: `public/data/borders/<năm>.geojson`, ví dụ `-264.geojson`.
- Nội dung: GeoJSON `FeatureCollection`, toạ độ WGS84. Mỗi feature là `Polygon` hoặc `MultiPolygon` và có `properties.polityId` khớp với một `id` trong `polities.json`.
- Bản đồ hiển thị mốc gần nhất tại hoặc trước năm đang xem (`getBorderSnapshot(year)`).
- **Không cần vẽ bám bờ biển.** Bản đồ vẽ biển và hồ đè lên lớp lãnh thổ, nên phần polygon tràn ra biển bị che đi. Chỉ cần đúng ở phần đất liền và ở đường ranh giới giữa các thế lực.
- Vùng bản đồ: kinh độ −40 đến 80, vĩ độ 5 đến 70. Toạ độ ngoài vùng này không hiển thị được.
- Feature có `polityId` không có trong `polities.json` bị bỏ qua (kèm cảnh báo ở console). `npm run validate` bắt lỗi này.
- Khi `border-snapshots.json` còn rỗng và chạy `npm run dev`, bản đồ dùng ba mốc thử vẽ thô trong `src/components/map/__fixtures__/` (chú giải ghi "Dữ liệu thử"). Có mốc thật là dữ liệu thử tự tắt; bản build chính thức không bao giờ chứa chúng.

### Bản đồ nền

`public/map/basemap.json`: biển, hồ và sông từ Natural Earth (phạm vi công cộng), không có yếu tố hiện đại. Nguồn và cách tạo lại xem `public/map/README.md`. Màu đất, biển và đường bờ lấy từ token `--map-land`, `--map-water`, `--map-coast` trong `globals.css`.

### Kiểm tra dữ liệu

`npm run validate` (script `scripts/validate-data.mjs`) kiểm tra sự kiện, thế lực và các file biên giới. Phải qua trước khi gộp mọi thay đổi về dữ liệu.

### Hàm truy vấn (`src/data/index.ts`)

`events`, `polities`, `borderSnapshots`, `getEvent(id)`, `getPolity(id)`, `isEventActive(event, year)`, `getEventsAround(year, windowYears = 30)`, `getBorderSnapshot(year)`.

## Đa ngôn ngữ

- Chuỗi giao diện: thêm khoá vào `src/lib/i18n/messages.ts` (cả `en` và `vi`), dùng qua `const { t, locale } = useT()`.
- Nội dung lịch sử: `LocalizedText`, lấy bằng `event.title[locale]`.
- Ngôn ngữ mặc định là tiếng Anh, người dùng đổi bằng nút ở header. Lựa chọn hiện chưa được lưu giữa các lần tải trang.

## AI tutor (giai đoạn 4)

Hợp đồng nằm ở `src/lib/tutor.ts`. Chỉ phiên chính được sửa file này.

```
Khung chat (Lane 1)                         Route /api/tutor (Lane 2)                  Claude API
src/components/tutor/   --POST TutorRequest-->  src/app/api/tutor/route.ts   --stream-->  claude-opus-5-5
                        <--NDJSON TutorStreamEvent--  src/server/tutor/      <----------
```

- **Yêu cầu:** `POST /api/tutor` với `{ messages, depth }`. Mỗi tin nhắn của người dùng mang theo `context` (năm, ngôn ngữ, vùng bản đồ, sự kiện đang chọn) **chụp lại lúc gửi**. Khung chat giữ nguyên các tin nhắn cũ cùng `context` của chúng và gửi lại y hệt ở các lần sau; không sửa hay chèn thêm gì vào tin nhắn cũ.
- **Phản hồi:** NDJSON, mỗi dòng một `TutorStreamEvent`: nhiều sự kiện `text`, kết thúc bằng `done`; hoặc một `error` với mã trong `TutorErrorCode`. Trong lúc model còn suy nghĩ, server có thể gửi `ping` (không mang dữ liệu) để bắt đầu phản hồi sớm và giữ kết nối; khung chat bỏ qua `ping`.
- **Khoá API** chỉ nằm ở server, đọc từ biến môi trường `ANTHROPIC_API_KEY` trong `.env.local` (không bao giờ commit). Xem `.env.example`.
- **Chế độ giả lập:** `TUTOR_MOCK=1` khiến route trả câu trả lời mẫu dựng từ yêu cầu, không gọi API, không tốn tiền. Dùng khi phát triển và kiểm thử.
- **Model:** `claude-opus-5-5`, có streaming. `depth: "standard"` dùng effort `high`, `depth: "deep"` dùng effort `xhigh`.
- **Ngữ cảnh cho model:** phần hướng dẫn và toàn bộ dữ liệu sự kiện, thế lực nằm ở phần đầu cố định của prompt, được cache. Ngữ cảnh của từng câu hỏi (năm, vùng nhìn, sự kiện đang chọn, các sự kiện quanh năm đó) được dựng từ `context` của tin nhắn đó, cùng đầu vào thì ra cùng một đoạn chữ.
- **Lịch sử gửi cho model** chỉ gồm phần chữ của các lượt trước; không gửi lại các khối suy luận (thinking). Cách này hợp lệ với Opus 5.5.
- **Lượt hỏi thất bại:** lượt nào câu trả lời không có chữ nào (lỗi ngay, hoặc dừng trước chữ đầu tiên) thì khung chat bỏ cả lượt khỏi các yêu cầu sau. Câu trả lời dở dang (bị dừng hoặc lỗi giữa chừng) thì gửi phần chữ đã có. Route cũng tự bỏ lượt trợ lý rỗng và gộp các lượt cùng vai liền nhau, nên lịch sử gửi cho model luôn xen kẽ người dùng và trợ lý.
- **Mã HTTP** khi lỗi là toàn bộ phản hồi: `bad_request` 400, `refused` 422, `rate_limited` và `limit_reached` 429, `unavailable` 502; `not_configured`, `invalid_key`, `no_credits`, `overloaded` là 503. Lỗi đến sau khi phản hồi đã bắt đầu (sau `ping` hoặc `text`) thì vẫn là 200.
- **`rate_limited` và `limit_reached`:** `rate_limited` là tạm thời (hỏi quá nhanh, hoặc Claude API báo quá tải yêu cầu), thử lại sau ít phút được. `limit_reached` là đã hết lượt của app (số câu mỗi ngày của một người, hoặc trần chi phí mỗi ngày của cả app), thử lại ngay không được.
- **Thẻ thử lỗi trong chế độ giả lập:** câu hỏi chứa `#error:<mã>` trả lỗi đó ngay; `#error:midstream` gửi vài mẩu chữ rồi báo `unavailable`; `#truncated` kết thúc bằng `done` với `truncated: true`.
- **Tham số gọi API** (`src/server/tutor/config.ts`): `max_tokens` 16 000 (standard) và 32 000 (deep), tính cả phần suy luận; fallback phía server bật (`fallbacks: "default"`), nên khi bộ lọc an toàn từ chối, API tự chạy lại trên model dự phòng.
- **Kiểm tra:** `npm run tutor:check` chạy bộ tự kiểm tra của route (giả lập và một máy chủ Claude giả, không gọi API thật); `npm run tutor:prompt` in prompt đầy đủ cho một yêu cầu mẫu.
- **Giới hạn và xác thực:** chưa có xác thực người dùng. Giới hạn theo người dùng và trần chi phí mỗi ngày đang làm ở T-007. Route chưa được đưa ra Internet trước khi T-007 xong.
