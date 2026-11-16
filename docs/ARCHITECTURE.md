# Kiến trúc và hợp đồng chung

Tài liệu này mô tả những gì mọi lane phải bám theo. Chỉ phiên chính được sửa các file nêu ở đây.

## Tổng quan

```
src/
  app/                 layout, trang chính, token màu (globals.css)
  components/
    AppShell.tsx       sắp xếp các vùng: header, bản đồ, panel, timeline
    LocaleSwitch.tsx
    shell/             Lane 1: link chia sẻ, nhớ ngôn ngữ, phím tắt, hộp thoại, giới thiệu
    map/               Lane 2
    timeline/          Lane 1
    panel/             Lane 1 (danh sách và chi tiết sự kiện)
    tutor/             Lane 1 (khung chat), giai đoạn 4
    battle/            Lane 3: cảnh trận đánh 3D (three.js)
  data/
    events.json        Lane 3
    polities.json      Lane 3
    border-snapshots.json   Lane 3 (danh mục các mốc biên giới)
    battles/           Lane 2: dữ liệu trận đánh 3D, loại lính
    index.ts           hàm truy vấn dữ liệu (phiên chính)
  lib/
    types.ts           kiểu dữ liệu chung
    battle.ts          hợp đồng của trận đánh 3D
    years.ts           YEAR_MIN, YEAR_MAX, clampYear, formatYear
    i18n/              chuỗi giao diện en/vi và hook useT
  store/
    useAppStore.ts     trạng thái chung
  app/battle-lab/      trang thử cảnh trận đánh, chỉ chạy khi phát triển (phiên chính)
public/data/borders/   file GeoJSON biên giới, Lane 3
public/data/terrain/   lưới độ cao của chiến trường, Lane 2
public/battles/models/ mô hình lính .glb, Lane 1
public/map/            bản đồ nền (Natural Earth), Lane 2
scripts/               script kiểm tra dữ liệu, Lane 3 (trừ scripts/battles/ của Lane 2)
art/                   script Blender dựng mô hình lính, Lane 1
```

Trên màn hẹp (dưới 1024px), panel bên chia thành hai tab "Sự kiện" và "Gia sư AI". Trên màn rộng hai phần xếp chồng.

## Trạng thái chung: `useAppStore`

Các mảng (timeline, bản đồ, tutor, cảnh trận đánh) chỉ giao tiếp qua store này.

| Trường | Kiểu | Ai ghi | Ai đọc |
|---|---|---|---|
| `year` | `Year` | Timeline qua `setYear`; chọn sự kiện qua `selectEvent(id, year)` | Tất cả |
| `viewport` | `MapViewport` | Bản đồ qua `setViewport` mỗi khi di chuyển | Tutor |
| `selectedEventId` | `string \| null` | Panel, bản đồ, nút trong câu trả lời của gia sư, qua `selectEvent` | Tất cả |
| `focusRequest` | `number` | Tăng mỗi lần `selectEvent` chọn một sự kiện, kể cả chọn lại đúng sự kiện đang chọn | Bản đồ (bay tới sự kiện) |
| `locale` | `"en" \| "vi"` | `LocaleSwitch` | Tất cả |
| `battleId` | `string \| null` | `openBattle(id)` (nút xem trận trong panel sự kiện), `closeBattle()` (khung xem trận) | `AppShell` (nạp khung xem trận), cảnh trận đánh |
| `battleTime` | `number` | `setBattleTime` (khung xem trận; trang thử) | Cảnh trận đánh, khung xem trận |

`setYear` tự làm tròn và giới hạn trong `[YEAR_MIN, YEAR_MAX]`, nên bên gọi không cần kiểm tra. `setBattleTime` chỉ chặn số âm; cảnh và nút điều khiển tự giữ trong `[0, số giai đoạn]`.

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
- Một thế lực trong `polities.json` phải được ít nhất một sự kiện hoặc một file biên giới dùng (quyết định 2026-11-16; có những thế lực chỉ xuất hiện trên bản đồ, như Ba Tư).
- Màu: đồng minh Ý cùng tông đỏ với La Mã (đỏ nhạt), để cả bán đảo đọc là vùng của La Mã nhưng vẫn phân biệt công dân với đồng minh. Hai thế lực chung đường biên phải phân biệt rõ ở cả chế độ sáng lẫn tối: `npm run borders` báo lỗi nếu hai thế lực có đất liền chạm nhau chênh màu dưới ΔE 12 (CIE76, tính trên màu tô thực vẽ trên nền đất của cả hai chế độ). Khi ghi file, các polygon chạm nhau của cùng một thế lực được gộp lại, để bản đồ không vẽ đường kẻ bên trong một lãnh thổ.
- Biên giới được vẽ tay theo bản đồ Shepherd (phạm vi công cộng) và Cliopatria (CC BY 4.0). Giấy phép CC BY 4.0 bắt buộc ghi công: dòng ghi công nằm ở chú giải bản đồ, ở hộp thoại Giới thiệu và ở `README.md`; không được gỡ. Phương pháp và căn cứ từng mốc: `docs/data/BORDERS.md`. Dựng lại file: `npm run borders`.
- Bản đồ ghi tên thế lực ở điểm sâu nhất trong phần đất liền của lãnh thổ, ẩn nhãn không đủ chỗ ở mức phóng hiện tại, và chuyển cảnh mờ dần 400 ms giữa hai mốc (`src/components/map/labels/`, `territoryFade.ts`).

### Bản đồ nền

`public/map/basemap.json`: biển, hồ và sông từ Natural Earth (phạm vi công cộng), không có yếu tố hiện đại. Nguồn và cách tạo lại xem `public/map/README.md`. Màu đất, biển và đường bờ lấy từ token `--map-land`, `--map-water`, `--map-coast` trong `globals.css`.

### Kiểm tra dữ liệu

`npm run validate` (script `scripts/validate-data.mjs`) kiểm tra sự kiện, thế lực và các file biên giới. Phải qua trước khi gộp mọi thay đổi về dữ liệu.

### Hàm truy vấn (`src/data/index.ts`)

`events`, `polities`, `borderSnapshots`, `getEvent(id)`, `getPolity(id)`, `isEventActive(event, year)`, `getEventsAround(year, windowYears = 30)`, `getBorderSnapshot(year)`. Cho trận đánh 3D: `unitTypes`, `hasBattle(eventId)`, `loadBattle(id)` (nạp file trận khi cần, không nằm trong gói chính).

## Đa ngôn ngữ

- Chuỗi giao diện: thêm khoá vào `src/lib/i18n/messages.ts` (cả `en` và `vi`), dùng qua `const { t, locale } = useT()`.
- Nội dung lịch sử: `LocalizedText`, lấy bằng `event.title[locale]`.
- Ngôn ngữ khi mở trang, theo thứ tự ưu tiên: tham số `lang` trên link, lựa chọn đã lưu (`localStorage`, khoá `whp.locale`), ngôn ngữ của trình duyệt (bắt đầu bằng `vi` thì tiếng Việt), cuối cùng là tiếng Anh. Chỉ lựa chọn bằng nút ở header mới được lưu; mở link của người khác không ghi đè.
- Trang được dựng sẵn bằng tiếng Anh. Với người dùng sẽ xem bằng tiếng Việt, một script nhỏ trong `src/app/layout.tsx` chạy trước khi trang hiện ra, ẩn trang (thuộc tính `data-locale-pending` trên `<html>`) cho tới khi `AppShell` đã áp tiếng Việt, thường dưới 0,1 giây; quá 2 giây thì trang tự hiện. Script này lặp lại thứ tự ưu tiên của `resolveInitialLocale` trong `src/components/shell/locale.ts`; sửa một bên thì sửa cả hai.

## Link chia sẻ, giới thiệu và phím tắt

- **Địa chỉ trang** phản ánh trạng thái đang xem: `/?year=-216&event=battle-of-cannae&lang=vi`. `src/components/shell/UrlSync.tsx` áp tham số khi mở trang (tham số sai bị bỏ qua từng cái) và cập nhật địa chỉ bằng `history.replaceState`: ngay khi chọn sự kiện hay đổi ngôn ngữ, sau 400 ms năm đứng yên khi đổi năm. Tham số lạ khác trên link được giữ nguyên.
- **Phát tự động:** đang phát mà năm bị đổi từ nơi khác (kéo, phím, nút của gia sư) hoặc có sự kiện được chọn thì dừng phát.
- **Giới thiệu** (`src/components/shell/AboutDialog.tsx`, mở bằng nút ở header): app là gì, cách dùng, độ chính xác, nguồn và ghi công, cách gia sư hoạt động. Nguồn, giấy phép và trích dẫn ở đây phải khớp với `README.md` (mục "Data credits") và `docs/data/SOURCES.md`; đổi một chỗ thì đổi cả ba. Lần đầu mở app, header có một gợi ý mời xem phần này; đóng gợi ý hoặc mở Giới thiệu thì ghi `localStorage` khoá `whp.aboutSeen` và gợi ý không hiện lại.
- **Phím tắt** (`src/components/shell/keyboard.ts`): Space phát hoặc tạm dừng, ←/→ đổi 1 năm (Shift: 10 năm), Home/End về hai đầu, `/` vào ô hỏi gia sư, Esc rời ô nhập, `?` mở bảng phím tắt. Mỗi phần tự đăng ký phím của mình bằng `useShortcuts`; phím tắt không chạy khi đang gõ chữ, đang giữ Ctrl/Alt/Cmd, đang dùng bộ gõ, đang mở hộp thoại, focus ở trên bản đồ, hoặc Space khi focus ở một nút.

## AI tutor (giai đoạn 4)

Hợp đồng nằm ở `src/lib/tutor.ts`. Chỉ phiên chính được sửa file này.

```
Khung chat (Lane 1)                         Route /api/tutor (Lane 2)                  Claude API
src/components/tutor/   --POST TutorRequest-->  src/app/api/tutor/route.ts   --stream-->  claude-opus-5-5
                        <--NDJSON TutorStreamEvent--  src/server/tutor/      <----------
```

- **Yêu cầu:** `POST /api/tutor` với `{ messages, depth }`. Mỗi tin nhắn của người dùng mang theo `context` (năm, ngôn ngữ, vùng bản đồ, sự kiện đang chọn) **chụp lại lúc gửi**. Khung chat giữ nguyên các tin nhắn cũ cùng `context` của chúng và gửi lại y hệt ở các lần sau; không sửa hay chèn thêm gì vào tin nhắn cũ.
- **Phản hồi:** NDJSON, mỗi dòng một `TutorStreamEvent`: nhiều sự kiện `text`, kết thúc bằng `done`; hoặc một `error` với mã trong `TutorErrorCode`. Trong lúc model còn suy nghĩ, server có thể gửi `ping` (không mang dữ liệu) để bắt đầu phản hồi sớm và giữ kết nối; khung chat bỏ qua `ping`. Cụ thể: route chờ sự kiện đầu tiên tối đa 2 giây (lỗi đến trong khoảng đó vẫn có mã HTTP riêng), quá 2 giây thì bắt đầu phản hồi 200 bằng `ping`, rồi gửi `ping` sau mỗi 15 giây im lặng.
- **Khoá API** chỉ nằm ở server, đọc từ biến môi trường `ANTHROPIC_API_KEY` trong `.env.local` (không bao giờ commit). Xem `.env.example`.
- **Chế độ giả lập:** `TUTOR_MOCK=1` khiến route trả câu trả lời mẫu dựng từ yêu cầu, không gọi API, không tốn tiền. Dùng khi phát triển và kiểm thử.
- **Model:** `claude-opus-5-5`, có streaming. `depth: "standard"` dùng effort `high`, `depth: "deep"` dùng effort `xhigh`.
- **Ngữ cảnh cho model:** phần hướng dẫn và toàn bộ dữ liệu sự kiện, thế lực nằm ở phần đầu cố định của prompt, được cache. Ngữ cảnh của từng câu hỏi (năm, vùng nhìn, sự kiện đang chọn, các sự kiện quanh năm đó) được dựng từ `context` của tin nhắn đó, cùng đầu vào thì ra cùng một đoạn chữ.
- **Lịch sử gửi cho model** chỉ gồm phần chữ của các lượt trước; không gửi lại các khối suy luận (thinking). Cách này hợp lệ với Opus 5.5.
- **Lượt hỏi thất bại:** lượt nào câu trả lời không có chữ nào (lỗi ngay, hoặc dừng trước chữ đầu tiên) thì khung chat bỏ cả lượt khỏi các yêu cầu sau. Câu trả lời dở dang (bị dừng hoặc lỗi giữa chừng) thì gửi phần chữ đã có. Route cũng tự bỏ lượt trợ lý rỗng và gộp các lượt cùng vai liền nhau, nên lịch sử gửi cho model luôn xen kẽ người dùng và trợ lý.
- **Nút xem trên bản đồ:** câu trả lời có thể kèm tối đa 3 sự kiện `map_link` (`{ year, eventId }`), đến xen giữa các `text`. Khung chat hiện chúng thành nút dưới câu trả lời; bấm thì thanh thời gian (và bản đồ, nếu có sự kiện) đi tới đó. Chữ trên nút do khung chat dựng từ dữ liệu, theo ngôn ngữ đang chọn. Model yêu cầu nút bằng ký hiệu ở cuối câu trả lời, `[[map:-216:battle-of-cannae]]` cho một sự kiện hay `[[map:-218]]` cho một năm (hướng dẫn nằm trong phần prompt cố định). Server (`src/server/tutor/mapLinks.ts`) tách ký hiệu ra khỏi luồng chữ, kể cả khi ký hiệu bị cắt giữa hai mẩu, kiểm tra từng nút và bỏ lặng lẽ nút sai, nút trùng, nút thứ tư trở đi và nút trỏ đúng vào năm cùng sự kiện người dùng đang xem. Log chỉ ghi số nút đã gửi và đã bỏ (`[tutor] map links`). Chế độ giả lập gửi nút mẫu; thẻ `#nolinks` tắt chúng. Lịch sử gửi lên server chỉ gồm phần chữ, không kèm nút.
- **Mã HTTP** khi lỗi là toàn bộ phản hồi: `bad_request` 400 (403 khi yêu cầu đến từ trang khác), `refused` 422, `rate_limited` và `limit_reached` 429, `unavailable` 502; `not_configured`, `invalid_key`, `no_credits`, `overloaded` là 503. Lỗi đến sau khi phản hồi đã bắt đầu (sau `ping` hoặc `text`) thì vẫn là 200.
- **`rate_limited` và `limit_reached`:** `rate_limited` là tạm thời (hỏi quá nhanh, hoặc Claude API báo quá tải yêu cầu), thử lại sau ít phút được. `limit_reached` là đã hết lượt của app (số câu mỗi ngày của một người, hoặc trần chi phí mỗi ngày của cả app), thử lại ngay không được.
- **Thẻ thử lỗi trong chế độ giả lập:** câu hỏi chứa `#error:<mã>` trả lỗi đó ngay; `#error:midstream` gửi vài mẩu chữ rồi báo `unavailable`; `#truncated` kết thúc bằng `done` với `truncated: true`; `#slow` (hoặc `#slow:<giây>`, tối đa 120) chờ trước chữ đầu tiên, để thấy `ping`.
- **Tham số gọi API** (`src/server/tutor/config.ts`): `max_tokens` 16 000 (standard) và 32 000 (deep), tính cả phần suy luận; fallback phía server bật (`fallbacks: "default"`), nên khi bộ lọc an toàn từ chối, API tự chạy lại trên model dự phòng.
- **Kiểm tra:** `npm run tutor:check` chạy bộ tự kiểm tra của route (giả lập và một máy chủ Claude giả, không gọi API thật); `npm run tutor:prompt` in prompt đầy đủ cho một yêu cầu mẫu.
- **Giới hạn** (`src/server/tutor/limits.ts`, cấu hình trong `.env.example`): mỗi người (theo IP) 6 câu trong 60 giây (`rate_limited`) và 100 câu mỗi ngày UTC (`limit_reached`); cả app tối đa 5 USD mỗi ngày UTC, ước tính từ số token của từng câu trả lời (`limit_reached`). Câu bị chặn không gọi API và không bị tính lượt. Chỉ nhận yêu cầu cùng nguồn (header `Origin`).
- **Giới hạn của phần giới hạn:** bộ đếm nằm trong bộ nhớ của một tiến trình, khởi động lại là mất; chạy nhiều tiến trình thì cần kho dùng chung (thay `QuotaStore`). IP lấy từ `x-forwarded-for`, chỉ đáng tin khi đứng sau proxy ghi đè header này. Chưa có xác thực người dùng.

## Trận đánh 3D (bản thử: Cannae)

Bấm một trận lớn thì xem trận đó trong cảnh 3D: địa hình thật, các khối quân chuyển động qua từng giai đoạn, lời dẫn, ánh sáng theo giờ. Hợp đồng nằm ở `src/lib/battle.ts`. Chỉ phiên chính được sửa file này.

```
dữ liệu trận (Lane 2)                cảnh 3D, khung xem trận (Lane 3)
src/data/battles/*.json     ──►   src/components/battle/  ◄──  useAppStore.battleId, battleTime
public/data/terrain/*.bin            three.js
                                          ▲
mô hình lính (Lane 1): art/blender/ (script)  ──►  public/battles/models/*.glb
                       file gốc để ngoài repo
```

### Dữ liệu

- **File trận:** mỗi trận một file `src/data/battles/<id sự kiện>.json` (kiểu `Battle`). Id trùng với id sự kiện trong `events.json`. Phiên chính đăng ký file mới vào `battleLoaders` trong `src/data/index.ts`.
- **Loại lính:** dùng chung cho mọi trận, nằm ở `src/data/battles/unit-types.json` (kiểu `UnitType`). `model` là tên file trong `public/battles/models/`; nhiều loại lính có thể dùng chung một mô hình.
- **Toạ độ trên chiến trường:** tính bằng mét từ `origin` (kinh độ, vĩ độ của điểm x = 0, y = 0). x hướng đông, y hướng bắc. `facing` tính bằng độ, theo chiều kim đồng hồ từ hướng bắc.
- **Thời gian:**
  - `initial` là vị trí lúc bắt đầu. Mỗi giai đoạn ghi trạng thái của **mọi** đơn vị lúc **kết thúc** giai đoạn.
  - `battleTime` trong store chạy từ 0 tới số giai đoạn. Giữa hai mốc, cảnh tự nội suy.
  - `phaseAt` và `hourAt` trong `battle.ts` quy đổi `battleTime` ra giai đoạn đang diễn ra và giờ trong ngày.
- **Quân số:** một hình lính bằng `MEN_PER_FIGURE` (20) người. Số người `men` của một đơn vị chỉ giảm, không tăng; `npm run validate` có kiểm tra.
- **Địa hình:**
  - Lưới độ cao trong `public/data/terrain/`: số Int16 little-endian, đơn vị decimet, hàng chạy từ bắc xuống nam, cột từ tây sang đông.
  - Sông và địa danh (trại, đồi, thành) đi kèm trong `terrain`.
  - Số liệu hay vị trí là phỏng dựng hoặc còn tranh cãi thì ghi ở `uncertainty`, `NumberRange.note` hoặc `approximate`.
- **Nội dung và nguồn:** tiêu đề và lời dẫn song ngữ, tự viết. Mỗi trận có nguồn. Dữ liệu độ cao có nguồn và giấy phép.
- **Kiểm tra:** `npm run validate` chạy thêm `scripts/battles/validate-battles.mjs`.

### Mô hình lính

- **File:** `public/battles/models/<model>.glb`, mỗi file tối đa 4 MB.
- **Hệ trục:** đơn vị mét, trục Y hướng lên, nhân vật đứng trên y = 0, mặt nhìn về +Z.
- **Khung xương:** một khung xương chuẩn Unreal (67 xương, lấy từ mô hình Celt của Andywoodhead). Ba lưới cùng gắn vào khung này:
  - `LOD0`: tối đa 8 000 tam giác;
  - `LOD1`: tối đa 1 500;
  - `LOD2`: tối đa 300.
- **Danh sách mô hình đã có:** `public/battles/models/index.json` (`ModelIndex`, đường dẫn `MODEL_INDEX_URL` trong `src/lib/battle.ts`). Cảnh chỉ tải các mô hình có trong danh sách, còn lại vẽ hình tạm, nên console không có lỗi 404. Script xuất của lane 1 tự cập nhật file này; `npm run validate` kiểm tra danh sách khớp với các file `.glb` trong thư mục.
- **Vật liệu:** một vật liệu.
  - Ảnh màu gộp, tối đa 2048×2048, đã nhân độ che khuất môi trường (AO).
  - Ảnh pháp tuyến nếu có, tối đa 1024×1024.
  - Ảnh độ nhám và kim loại nếu có (`metallicRoughnessTexture` của glTF: kênh G là độ nhám, kênh B là kim loại), tối đa 1024×1024. Dùng để đồng và sắt trông như kim loại.
- **Hoạt hình:** đặt tên theo `UNIT_CLIPS`.
  - Bắt buộc: `idle`, `walk`, `attack`.
  - Nên có: `run`, `die`. Thiếu `run` thì cảnh dùng `walk` thay; thiếu `die` thì cảnh bỏ hình lính đi mà không có hoạt hình ngã.
  - Không có chuyển động gốc: hình lính đứng tại chỗ, cảnh tự di chuyển nó.
  - Độ dài một vòng `walk` và `run` ghi trong `art/README.md`. Các mô hình dùng thư viện hoạt hình chung của lane 1 (Quaternius, đổi đích sang khung 67 xương): một vòng `walk` dài 1,333 s và đi được 1,00 m; một vòng `run` dài 0,933 s và đi được 1,99 m. Cảnh chỉnh tốc độ phát theo tốc độ di chuyển của khối quân để chân không trượt.
  - `idle`, `walk`, `run`, `attack` lặp liền mạch. `die` không lặp: cảnh phát một lần rồi giữ khung cuối.
  - Tư thế gốc là tư thế chữ A của khung xương, có thể trông lạ (khiên nằm dọc cánh tay). Cảnh luôn phát ít nhất `idle`.
- **Ảnh duyệt:** `art/renders/<model>/`, JPEG, mỗi ảnh tối đa 400 KB, render từ chính file `.glb` đã xuất.
- **Kỵ binh:** người và ngựa nằm trong cùng một file.
- **File gốc:** các file tải từ Sketchfab để ngoài repo, ở `E:\World_History_Platform_assets\sources\`. Trong repo chỉ có script `art/blender/` và file `.glb` đã xuất. Chạy lại script bằng Blender 5.2.2 không giao diện là dựng lại được mô hình.
- **Giấy phép và ghi công:**
  - Mô hình nền có giấy phép CC BY 4.0 (Andywoodhead, Sketchfab). Ghi công trong `art/CREDITS.md`, kèm mô tả những gì đã sửa.
  - Khi trận đánh vào app chính, ghi công thêm ở hộp thoại Giới thiệu và README.
  - Không dùng mô hình trích từ game thương mại (Total War hay game khác).

### Cảnh 3D

- **Component:** `BattleScene` (`src/components/battle/BattleScene.tsx`) nhận `BattleSceneProps` và đọc `battleTime` từ store. Nó chỉ được nạp ở phía trình duyệt (`next/dynamic` với `ssr: false`), nên three.js không nằm trong gói của trang chính.
- **Vẽ lính:** hàng nghìn hình lính có hoạt hình được vẽ theo lô (instancing). Mức chi tiết chọn theo khoảng cách, cho từng khối quân. Thiếu file mô hình thì vẽ hình tạm theo màu của phe. Màu phe lấy từ `polities.json` qua `polityId`.
- **Hiệu năng:**
  - Mục tiêu: khoảng 7 000 hình lính, từ 50 khung hình/giây trở lên ở 1280×800 trên máy của người dùng (laptop RTX 3050).
  - Có mức chất lượng thấp cho máy yếu.
  - Mở rồi đóng cảnh nhiều lần không rò bộ nhớ (giải phóng WebGL).
- **Trang thử `/battle-lab`:** chỉ chạy với `npm run dev`. Gồm cảnh, nút phát và thanh tua. Tham số:
  - `?battle=<id>`: chọn trận;
  - `?stats=1`: hiện số khung hình/giây và số hình lính;
  - `?stress=<số hình>`: thay quân của trận bằng một đám đông tổng hợp để đo hiệu năng;
  - `?lang=vi`: xem chuỗi giao diện của cảnh bằng tiếng Việt.

### Khung xem trận (đợt C)

- **Mở:** sự kiện nào có trận 3D (`hasBattle(id)` trong `src/data/index.ts`) thì panel sự kiện có nút xem trận. Nút gọi `openBattle(id)`.
- **Hiện:** khi `battleId` khác `null`, `AppShell` nạp `BattleViewer` (`src/components/battle/BattleViewer.tsx`) bằng `next/dynamic` với `ssr: false`. three.js chỉ tải khi người dùng mở trận lần đầu.
- **Khung:** `BattleViewer` phủ kín trang, nằm trong một `<dialog>` mở bằng `showModal()`. Nhờ vậy các phím tắt chung của trang (`src/components/shell/keyboard.ts`) tự đứng ngoài khi trận đang mở; khung xem trận tự xử lý phím của nó. Esc hoặc nút đóng gọi `closeBattle()`, và focus trở về nút đã mở trận.
- **Thời gian:** khung xem trận là nơi duy nhất ghi `battleTime` trong app chính (phát, tua, chuyển giai đoạn). Trang `/battle-lab` vẫn tự ghi như trước.

### Các đợt làm

Chi tiết ở `docs/PLAN.md`.
- **Đợt A:** mô hình lính La Mã (T-014), cảnh 3D (T-015), dữ liệu trận Cannae và địa hình (T-016).
- **Đợt B:** các loại lính còn lại, ghép mô hình và dữ liệu thật.
- **Đợt C:** khung xem trận (lời dẫn, nút điều khiển, thông tin hai bên, ghi công), mở trận từ panel sự kiện, chuyển cảnh từ bản đồ vào trận, ghi công trong hộp thoại Giới thiệu.
