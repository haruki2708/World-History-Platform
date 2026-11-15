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
```

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

### Hàm truy vấn (`src/data/index.ts`)

`events`, `polities`, `borderSnapshots`, `getEvent(id)`, `getPolity(id)`, `isEventActive(event, year)`, `getEventsAround(year, windowYears = 30)`, `getBorderSnapshot(year)`.

## Đa ngôn ngữ

- Chuỗi giao diện: thêm khoá vào `src/lib/i18n/messages.ts` (cả `en` và `vi`), dùng qua `const { t, locale } = useT()`.
- Nội dung lịch sử: `LocalizedText`, lấy bằng `event.title[locale]`.
- Ngôn ngữ mặc định là tiếng Anh, người dùng đổi bằng nút ở header. Lựa chọn hiện chưa được lưu giữa các lần tải trang.

## AI tutor (giai đoạn 4)

- Gọi Claude API từ route phía server, khoá API không ra trình duyệt.
- Model `claude-opus-5-5`, effort `high`, lên `xhigh` cho câu hỏi nặng. Có streaming.
- Mỗi yêu cầu gửi kèm ngữ cảnh lấy từ store: năm, vùng nhìn, sự kiện đang chọn, và các sự kiện liên quan từ bộ dữ liệu.
