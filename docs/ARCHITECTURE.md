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
| `battleRequest` | `string \| null` | `requestBattle(id)` (nút xem trận, từ T-025); `openBattle` xoá về `null` | Bản đồ (bay tới chiến trường rồi gọi `openBattle`; tải sẵn file của cảnh, T-027), `AppShell` (tải sẵn code khung xem trận) |
| `battleId` | `string \| null` | `openBattle(id)` (bản đồ sau khi bay; trước T-025 là nút xem trận), `closeBattle()` (khung xem trận) | `AppShell` (nạp khung xem trận), cảnh trận đánh, bản đồ (bay về chỗ cũ khi trận đóng) |
| `battleTime` | `number` | `setBattleTime` (khung xem trận; trang thử) | Cảnh trận đánh, khung xem trận |

`setYear` tự làm tròn và giới hạn trong `[YEAR_MIN, YEAR_MAX]`, nên bên gọi không cần kiểm tra. `setBattleTime` chỉ chặn số âm; cảnh và nút điều khiển tự giữ trong `[0, số giai đoạn]`.

**Mở trận qua bản đồ (T-025):**
- Nút xem trận gọi `requestBattle(id)`. Bản đồ thấy `battleRequest` thì bay khoảng 2 giây tới khung vùng địa hình của trận (`terrain`, không phải `origin`), hướng bắc lên, không nghiêng, vẽ khung nét đứt của vùng đó, rồi gọi `openBattle(id)`. Trong lúc có trận, giới hạn phóng của bản đồ được nâng tạm từ 8 lên 14.
- Trận luôn mở, kể cả khi không bay được:
  - bản đồ chưa tải xong hay lỗi WebGL, hoặc `loadBattle` lỗi: mở ngay;
  - người dùng bật giảm chuyển động: mở ngay, bản đồ không dịch chuyển;
  - người dùng kéo hay phóng bản đồ giữa chừng: mở ngay;
  - quá 4 giây kể từ lúc bấm: mở luôn.
- Khi trận đóng, bản đồ bay về góc nhìn trước lúc bay (nhảy thẳng nếu giảm chuyển động), xoá khung, trả giới hạn phóng về 8.
- `AppShell` tải sẵn code khung xem trận lúc bản đồ bắt đầu bay; nếu code đã về khi trận mở thì hiện khung ngay, không qua trạng thái tải của `next/dynamic`.
- Bản đồ tải sẵn file của cảnh vào cache của trình duyệt khi có `battleRequest` (T-027, `src/components/map/battlePrefetch.ts`): file địa hình, `index.json` và các file `.glb` của những loại lính trong trận. Mỗi trận một lần mỗi lần mở trang; không tải three.js. Cảnh và bản đồ dựng đường dẫn bằng cùng các hàm `modelUrl`, `terrainUrl` trong `src/lib/battle.ts`, vì lệch một ký tự là tải hai lần.

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
- **Giới thiệu** (`src/components/shell/AboutDialog.tsx`, mở bằng nút ở header): app là gì, cách dùng, độ chính xác, nguồn và ghi công, cách gia sư hoạt động. Nguồn, giấy phép và trích dẫn ở đây phải khớp với `README.md` (mục "Data credits") và `docs/data/SOURCES.md`; đổi một chỗ thì đổi cả ba. Từ T-029 hộp thoại nói về trận đánh 3D trong các mục cách dùng, độ chính xác, ghi công: số trận và tên trận lấy từ dữ liệu (`hasBattle`), ghi công trận đánh (câu Copernicus, link mô hình) dùng chung `src/lib/credits.ts` với khung xem trận; riêng hai khoá viết cho Cannae (`about.accuracy.battle.time`, `about.credits.battleSources`) phải sửa tay khi thêm trận thứ hai. Lần đầu mở app, header có một gợi ý mời xem phần này; đóng gợi ý hoặc mở Giới thiệu thì ghi `localStorage` khoá `whp.aboutSeen` và gợi ý không hiện lại.
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
- **Hành động** (`UnitAction`): có hai kiểu đánh (đợt G, xem mục "Giáp lá cà").
  - `skirmish`: đánh từ xa (lao, đá ném). Hàng trước ném từ chỗ đứng; hai khối không cần chạm nhau.
  - `fight`: giáp lá cà. Mép trước của khối phải nằm trên mép trước của một khối địch cũng `fight`, ở **cả mốc đầu lẫn mốc cuối** của giai đoạn, vì giữa hai mốc cảnh nội suy thẳng. `npm run validate` kiểm tra (ít nhất 15% bề ngang cách mép trước của địch không quá 8 m).
  - Khối chỉ tới chỗ địch ở cuối một giai đoạn thì giai đoạn đó ghi `advance` hay `charge`, giai đoạn sau mới ghi `fight`.
- **Địa hình:**
  - Lưới độ cao trong `public/data/terrain/`: số Int16 little-endian, đơn vị decimet, hàng chạy từ bắc xuống nam, cột từ tây sang đông.
  - Sông và địa danh (trại, đồi, thành) đi kèm trong `terrain`.
  - Phong cảnh (mặt đất, công trình, gió, bụi) nằm trong `terrain.scenery`, từ đợt H; xem mục "Phong cảnh".
  - Số liệu hay vị trí là phỏng dựng hoặc còn tranh cãi thì ghi ở `uncertainty`, `NumberRange.note` hoặc `approximate`.
- **Nội dung và nguồn:** tiêu đề và lời dẫn song ngữ, tự viết. Mỗi trận có nguồn. Dữ liệu độ cao có nguồn và giấy phép.
- **Kiểm tra:** `npm run validate` chạy thêm `scripts/battles/validate-battles.mjs`.

### Mô hình lính

- **File:** `public/battles/models/<model>.glb`, mỗi file tối đa 4 MB.
- **Hệ trục:** đơn vị mét, trục Y hướng lên, nhân vật đứng trên y = 0, mặt nhìn về +Z.
- **Khung xương:** một khung xương chuẩn Unreal (67 xương, lấy từ mô hình Celt của Andywoodhead); kỵ binh có thêm 40 xương của ngựa (107 xương, xem "Kỵ binh"). Ba lưới cùng gắn vào khung này:
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
  - Nên có: `run`, `die`, `jog`. Thiếu `run` thì cảnh dùng `walk` thay; thiếu `die` thì cảnh bỏ hình lính đi mà không có hoạt hình ngã.
  - **`jog`** (thêm 2026-11-17, người dùng duyệt): chạy đều, chậm hơn `run`, khoảng 3 m/s ở cỡ người thật; với ngựa là nước kiệu hay nước kiệu nhanh. `run` của thư viện chung là chạy nhanh (5,8 m/s), nên khối quân đi vừa phải mà chỉ có `walk` và `run` thì trông như chạy nước rút quay chậm.
    - Cảnh xếp các dáng đi của mô hình theo tốc độ tự nhiên (`walk`, `jog` nếu có, `run` nếu có) và chuyển từ dáng này sang dáng kế ở trung bình nhân của hai tốc độ, có khoảng đệm 10%. Mỗi dáng phát nhanh nhất 3 lần (`walk`), 2,7 lần (`jog`), 1,5 lần (`run`) tốc độ của nó. Trần của `jog` phải tới được chỗ đổi sang `run` (trung bình nhân, cộng khoảng đệm): ngựa phi nhanh gấp 5,8 lần kiệu, nên kiệu phát tới 2,65 lần rồi mới đổi sang phi (17,4 m/s trên sân). Trần cũ 1,8 làm móng trượt khi kiệu nhanh; nâng khi gộp T-030 (người dùng chọn). Bộ binh đổi sang `run` ở 1,6 lần tốc độ `jog`, nên không bị ảnh hưởng.
    - `jog` đứng cuối `UNIT_CLIPS`, nên chỉ số của các clip cũ không đổi. Mô hình chưa có `jog` vẫn chạy như trước.
  - **`block`, `hit`** (thêm 2026-11-18, đợt G): phản ứng của người bị đánh trong giáp lá cà. `block`: đưa khiên ra đỡ, khiên bị dội lại. `hit`: đòn lọt qua, người giật lại.
    - Cả hai bắt đầu và kết thúc ở thế đứng như `idle`, không lặp, dài 1,0 giây. Đòn của địch chạm ở giây thứ `REACTION_IMPACT` (0,3) của clip; cảnh canh giờ theo số này, nên đổi nó là đổi hợp đồng.
    - Đứng cuối `UNIT_CLIPS`, nên chỉ số các clip cũ không đổi. Mô hình chưa có hai clip này thì nhận đòn mà không phản ứng.
    - Có ở chín mô hình: sáu mô hình bộ binh đánh gần (`roman-legionary`, `roman-hastatus`, `roman-triarii`, `libyan-infantry`, `iberian-infantry`, `gallic-infantry`) và ba mô hình kỵ binh. Hai mô hình bộ binh đánh từ xa (`roman-velites`, `balearic-slinger`) không có.
  - Không có chuyển động gốc: hình lính đứng tại chỗ, cảnh tự di chuyển nó.
  - **Bước chân:** cảnh không dùng số sải chân trong tài liệu. Khi nạp mô hình, cảnh đo sải chân từ chính clip `walk` và `run` (`plantedStride` trong `src/components/battle/engine/figures/model.ts`), rồi cho chân bước theo quãng đường từng hình lính đi được.
    - Đứng, đi hay chạy chọn theo tốc độ đo được của khối quân, không theo `action`; `action` chỉ còn quyết định lúc đánh (`fight`, `skirmish`). Ngưỡng ghi ở đầu `src/components/battle/engine/units.ts`.
    - Số đo với thư viện hoạt hình chung của lane 1 (Quaternius, đổi đích sang khung 67 xương; T-024 đo lại theo cách của cảnh, bằng `art/tools/gait_check.py`): một vòng `walk` dài 1,333 s, đi được 1,30 m; một vòng `run` dài 0,933 s, đi được 5,45 m. Clip nguồn của `run` vốn là chạy nhanh (5,8 m/s ở cỡ người thật).
    - `jog` của bộ binh (T-022): trộn `Walk_Loop` và `Jog_Fwd_Loop` theo pha, kéo giãn để chân chạm đất 65% mỗi bước, rồi khoá chân trụ. Một vòng 0,733 s, đi được 2,07–2,10 m (2,8–2,9 m/s ở cỡ người thật).
    - Chân trụ đã được khoá trong clip (`whp_clips.Builder.lock_feet`): trượt dưới 3% khi đi, khoảng 1% khi chạy.
  - `idle`, `walk`, `jog`, `run`, `attack` lặp liền mạch. `die` không lặp: cảnh phát một lần rồi giữ khung cuối, và lính ngã nằm lại đến hết trận.
  - Độ dài `attack` khác nhau theo kiểu tấn công: 1,0 s (`sword-thrust`, `spear-thrust`), 1,333 s (`javelin-throw`, `sling`, `sword-slash`).
  - Clip có thể làm chuyển động mọi xương của khung, không chỉ xương có lưới da người: lính Baleares (`balearic-slinger`) dùng xương `ik_hand_gun` cho túi đá và dây ném; hastatus (`roman-hastatus`) dùng xương `ik_hand_l` cho hai cây *pilum*, có cả tỉ lệ trong clip (thu nhỏ còn 1% trong `attack` và `die`: coi như đã phóng). Cảnh phải nướng chuyển động của mọi xương mà lưới có dùng, gồm vị trí, góc quay và tỉ lệ.
- **Chiều cao:** hình lính cao dưới 2,25 m tính cả ngù mũ; riêng mũi giáo của triarii (`roman-triarii`) lên tới khoảng 2,44 m. Kỵ binh (T-022): khung bao ở tư thế gốc cao 2,24–2,67 m; mũi giáo dựng lên tới 3,04 m (`roman-cavalry`) và 2,95 m (`iberian-gallic-cavalry`). Khung bao dùng để cắt hình phải tính phần này.
  - Tư thế gốc là tư thế chữ A của khung xương, có thể trông lạ (khiên nằm dọc cánh tay). Cảnh luôn phát ít nhất `idle`.
- **Ảnh duyệt:** `art/renders/<model>/`, JPEG, mỗi ảnh tối đa 400 KB, render từ chính file `.glb` đã xuất.
- **Kỵ binh:** người và ngựa nằm trong cùng một file.
  - Ngựa (T-020, lane 2): `art/build/horse/horse.blend`, dựng bằng `art/blender/horse_build.py`. Cao 1,40 m tới vai, 40 xương tên `horse_*`; người cưỡi gắn vào xương `horse_saddle`, yên cao 1,35 m. Chi tiết ở `art/README.md`, mục "Ngựa" và "Gắn người cưỡi".
  - Ba mô hình kỵ binh (T-022, lane 1): `roman-cavalry`, `iberian-gallic-cavalry`, `numidian-cavalry`. Tư thế gốc của người được nhấc lên lưng ngựa; hai khung xương nối thành một (107 xương); `pelvis`, `ik_foot_root`, `ik_hand_root` treo vào `horse_saddle`. Người và ngựa chung một atlas, một vật liệu. Tay trái người cưỡi giữ dây cương; xương `ik_hand_l` mang khiên của kỵ binh La Mã và Iberia/Gaul. Người Numidia cưỡi ngựa trần, ngựa thu còn 0,95 lần.
  - Clip: `jog` là nước kiệu; `attack` là ngựa đứng, người đâm giáo (người Numidia phóng lao); `die` là ngựa ngã, người văng xuống nằm cạnh.
  - Sải móng đo như cảnh: `walk` 1,08 m / 1,667 s (dáng đi gốc, móng trượt vài khung); `jog` 1,82 m / 0,833 s, móng trụ khoá ở T-030 (trượt 1%); `run` (phi nước đại bốn nhịp, dựng lại ở T-030, `art/blender/horse_gallop.py`) 5,51 m / 0,433 s, trượt 1%. Ngựa Numidia ngắn hơn 5%.
  - Trần phi khoảng 57 m/s trên sân (Numidia 54). Kỵ binh Cannae vượt trần khoảng 20% thời gian di chuyển (Hasdrubal, Numidia, 62–70 m/s), lúc đó móng trượt 8–22%. Người dùng chọn để nguyên (2026-11-17).
  - Ghi công ngựa: lưới "Horse" của Tarnyloo (Blend Swap, CC BY 3.0, bắt buộc nêu tên tác giả); khung xương và dáng đi của fdoss001 (CC0). Đã có trong khung xem trận và README (T-022).
- **File gốc:** các file tải từ Sketchfab để ngoài repo, ở `E:\World_History_Platform_assets\sources\`. Trong repo chỉ có script `art/blender/` và file `.glb` đã xuất. Chạy lại script bằng Blender 5.2.2 không giao diện là dựng lại được mô hình.
- **Giấy phép và ghi công:**
  - Mô hình nền có giấy phép CC BY 4.0 (Andywoodhead, Sketchfab). Ghi công trong `art/CREDITS.md`, kèm mô tả những gì đã sửa.
  - Ghi công có ở khung xem trận, hộp thoại Giới thiệu (T-029) và README. Hai nơi trong app dùng chung `src/lib/credits.ts`.
  - Không dùng mô hình trích từ game thương mại (Total War hay game khác).

### Cảnh 3D

- **Component:** `BattleScene` (`src/components/battle/BattleScene.tsx`) nhận `BattleSceneProps` và đọc `battleTime` từ store. Nó chỉ được nạp ở phía trình duyệt (`next/dynamic` với `ssr: false`), nên three.js không nằm trong gói của trang chính.
- **Vẽ lính:** hàng nghìn hình lính có hoạt hình được vẽ theo lô (instancing). Mức chi tiết chọn cho từng lô, theo khoảng cách tới hình lính gần camera nhất của lô. Thiếu file mô hình thì vẽ hình tạm theo màu của phe. Màu phe lấy từ `polities.json` qua `polityId`.
- **Quay đầu:** hướng của một khối đổi từ 135° trở lên giữa hai mốc thì từng người quay đầu tại chỗ, hàng cuối thành hàng đầu; cả khối không xoay quanh tâm. Muốn một khối bẻ hướng cả đội hình quá 135° thì chia thành hai giai đoạn.
  - Mỗi người giữ chỗ của mình: sau một số lẻ lần quay đầu, ô của người ở các mốc sau được lật từ (u, v) thành (−u, 1 − v), cùng đội hình đó nhìn từ phía sau. Trước bản sửa (2026-11-17, lỗi lane 2 tìm ra ở T-027), mỗi người đi xuyên qua khối tới vị trí đối xứng, và khối co về giữa giữa giai đoạn.
- **Đi xiên** (T-028, `engine/units.ts`): các clip chỉ bước thẳng tới hay lùi, nên hình lính đi lệch hướng mặt thì trượt chân. Mỗi hình lính tự quay về hướng nó đi, theo vận tốc riêng làm mượt trong 0,25 s:
  - lệch dưới 35° thì giữ hướng khối; từ 55° thì quay hẳn về hướng đi; ở giữa thì quay một phần;
  - đi về phía sau nhiều hơn phía trước thì vẫn bước lùi, mặt hướng về địch;
  - quay tối đa 3 rad/s theo thời gian thật; quay lại hướng khối khi khối dừng, khi đang quay đầu, hay sau khi tua;
  - trong khối đang đánh, các hàng đang đánh giữ hướng khối; các hàng đang chờ lượt quay tối đa 45° (`WAITING_TURN`).
- **Vẽ trên mặt đất:** vùng màu dưới mỗi khối và mũi tên di chuyển được vẽ sau mặt đất và trước lính, nên lính luôn đứng lên trên.
- **Nhãn địa danh:** ẩn khi điểm của nhãn bị đồi hay khối quân che (`engine/occlusion.ts`); quân đứng ngay tại địa danh thì không che tên của nó.
- **Nhãn khối quân** (T-028): mỗi khối còn người đứng có nhãn tên kèm chấm màu phe, trên đầu khối, ở giữa mặt trận (hay 30% về hai đầu nếu chỗ giữa bị che). Nhãn khối quân và nhãn địa danh dùng chung `labelLayout`, không đè nhau, không đè lớp phủ.
  - Thứ tự giành chỗ: thị trấn và sông, rồi tên khối quân, rồi trại, đồi, chỗ vượt sông. Giữa các khối: khối trông lớn nhất trên màn hình trước (căn bậc hai của bề ngang × chiều sâu, chia cho khoảng cách tới camera).
  - Bị đồi hay khối khác che thì ẩn; khối không tự che nhãn của mình.
- **Bấm một khối** (T-028): tia từ camera qua điểm bấm, gặp hộp của khối nào trước thì chọn khối đó (`engine.pickUnit`). Thẻ hiện cạnh khối: tên, phe, loại lính, quân số đầu trận và lúc này, đang làm gì (`battle.action.*`). Quân số lúc này nội suy như cảnh (`unitState.ts`).
- **Hiệu năng:**
  - Mục tiêu: khoảng 7 000 hình lính, từ 50 khung hình/giây trở lên ở 1280×800 trên máy của người dùng (laptop RTX 3050).
  - Có mức chất lượng thấp cho máy yếu.
  - Mở rồi đóng cảnh nhiều lần không rò bộ nhớ (giải phóng WebGL).
  - Bóng của hình lính (T-031) vẽ từ lưới đã gộp đỉnh (`depthGeometry` trong `units.ts`). Mô hình tách đỉnh theo đường nối UV (LOD1, LOD2 gấp 3–4 lần), còn lượt vẽ bóng không đọc UV, nên gộp lại ra đúng bóng cũ mà rẻ hơn. Lưới chỉ để đổ bóng nằm ở `SHADOW_LAYER`: camera của bóng thấy, camera chính không thấy.
  - Đo khung hình: dấu thời gian của `requestAnimationFrame` nhảy theo nhịp, nên khi khung dài quá khoảng 16,7 ms thì p99 theo dấu thời gian này lên khoảng 35 ms. Đọc kèm p99 theo đồng hồ thật (`performance.now()` lúc callback chạy), như `s-perf.mjs` của T-031 in ra.
- **Trang thử `/battle-lab`:** chỉ chạy với `npm run dev`. Gồm cảnh, nút phát và thanh tua. Tham số:
  - `?battle=<id>`: chọn trận;
  - `?stats=1`: hiện số khung hình/giây và số hình lính;
  - `?stress=<số hình>`: thay quân của trận bằng một đám đông tổng hợp để đo hiệu năng;
  - `?duel=1`: trận nhỏ để xem giáp lá cà (`src/app/battle-lab/duelBattle.ts`): năm cặp khối trên địa hình của trận đang chọn, tiến lại, chạm nhau, đánh tại chỗ, rồi một bên bị đẩy lùi; cặp thứ năm đánh từ xa;
  - `?lang=vi`: xem chuỗi giao diện của cảnh bằng tiếng Việt.

### Giáp lá cà (đợt G)

Trong giai đoạn `fight`, người đứng đầu mỗi hàng dọc của khối đấu với người đầu hàng của địch; ai không có đối thủ trong tầm thì không đánh. Phần tính toán là dữ liệu thuần (không three.js), chạy thử được bằng Node qua `src/server/tutor/tools/register.mjs`.

- **Ai ngã** (`engine/timeline.ts`):
  - Trong giai đoạn `fight`, người ngã là người đầu hàng dọc; trong một hàng dọc người ngã lần lượt từ trước ra sau. Hàng dọc không có địch trước mặt gần như không mất người.
  - "Có địch trước mặt" (`opposition`) tính từ đội hình các khối địch đang `fight`, theo cùng điều kiện với lúc ghép cặp: mép trước của địch nằm trước mặt người đầu hàng không quá 12 m, không lệch quá 3 m ra ngoài đầu mút của mép đó, và hai bên quay mặt vào nhau trong 70°.
  - Người đứng sau trở thành người đầu hàng ngay khi người trước ngã, trước cả khi bước lên.
  - Giai đoạn khác giữ cách chọn cũ: ngẫu nhiên, nghiêng về hàng trước.
  - Số người ngã theo thời gian vẫn chia đều theo `men` của hai mốc. Riêng giai đoạn `fight`, không ai ngã trong 1,9 giây phát cuối, để người phía sau kịp bước lên trước mốc. Giai đoạn `fight` nên dài ít nhất 8 giây phát; ngắn hơn thì người ngã bị dồn về đầu giai đoạn.
- **Người sau bước lên:** vị trí trước sau của một người trong hàng dọc bằng vị trí ở mốc đầu trừ số người phía trước đã ngã; mỗi người ngã được tính dần trong 1,5 giây phát (sau 0,4 giây chờ). Đây là hàm của thời gian, nên tua tới đâu cũng ra cùng một cảnh.
- **Xếp lại ở mỗi mốc:** người còn đứng được chia vào các hàng dọc của lưới mới theo vị trí ngang, trong mỗi hàng xếp theo thứ tự trước sau đang có. Không ai đi xuyên qua ai, và người đang ở phía trước vẫn ở phía trước. Sau một lần quay đầu, khung của mốc là khung cũ nhìn từ phía sau.
- **Hàng đầu sát mép trước:** hàng đầu đứng sau mép trước của khối 3,2 m (hay nửa khoảng cách hàng, nếu nhỏ hơn), kể cả khi khối chỉ còn vài người trên một bề ngang rộng.
- **Ghép cặp** (`engine/melee.ts`, mỗi khung hình, sau khi mọi khối đã được tính vị trí):
  - Mỗi người đầu hàng chọn người đầu hàng địch gần nhất, trong tầm (khoảng cách đấu cộng 10 m) và trong góc 70° trước mặt của cả hai. Khoảng cách đo giữa **chỗ của họ ở hàng đầu** (`UnitTrack.frontX/Y`), không phải chỗ đang đứng: người vừa thành đầu hàng, còn đang bước lên, đã là đối thủ của người mà người trước đấu, nên cặp đổi ít hơn số lần có người ngã.
  - Chỉ chọn địch mà hai người **bước tới nhau được từ chỗ đang đứng** (mỗi người tối đa 5 m, tới trong tầm đòn chạm). Người đứng xa chỗ của mình ở hàng đầu (nhiều người phía trước vừa ngã, hay đang trôi về hàng sau của đội hình mốc kế) thì nhường đối thủ cho người khác.
  - Hai người chọn nhau thì mỗi người bước tối đa 5 m để đứng cách nhau đúng khoảng cách đấu, mặt quay vào nhau.
  - Người có đối thủ đang bận với người khác thì đánh kèm từ bên cạnh, lệch ít nhất 55°; mỗi bên của một người chỉ có một người đánh kèm.
  - Người sẽ ngã trong một chu kỳ tới mà chưa ai chọn thì đối thủ anh ta đã chọn sẽ quay sang anh ta, trừ khi đối thủ đó là người duy nhất đang nhắm một người khác cũng sắp ngã.
  - Khoảng cách đấu lấy từ mô hình (`UnitModel.strike`, đo từ clip `attack` lúc nạp): tầm của vũ khí lúc đòn chạm, và phần thân (khiên, đầu ngựa) nhô ra trước lúc đứng.
  - Kết quả chỉ phụ thuộc thời gian trong trận.
- **Nhịp đánh:** mỗi hình lính có một nhịp bị đánh (`UnitTrack.beat`), chu kỳ `STRIKE_PERIOD` (2,4 giây phát). Nhịp của người sẽ ngã chính là lúc người đó ngã. Người đánh phát clip `attack` một lần mỗi chu kỳ, đặt sao cho lúc đòn chạm trùng nhịp của đối thủ, nên nhát cuối rơi đúng lúc đối thủ ngã. Giữa hai nhát, hình lính đứng thủ (`idle`).
  - **Luân phiên:** hai người chọn nhau thì nhịp bị đánh lệch nhau nửa chu kỳ, tức người này đánh xong 1,2 giây thì người kia đánh. Người sắp ngã giữ nhịp riêng (lúc ngã), người kia theo đó.
- **Nhận đòn** (`engine/blows.ts`, thuần dữ liệu như `melee.ts`; `Crowd.update` gọi sau khi ghép cặp): mỗi khung hình chạy hai lượt trên mọi hình lính.
  - Lượt một, đòn đánh ra: hình lính đang dở một nhát thì báo cho người mà nhát đó nhắm tới (đối thủ lúc nhát bắt đầu), cho tới lúc đòn chạm.
  - Lượt hai, đòn nhận vào: hình lính được báo có đòn tới thì phát `block` hoặc `hit` một lần, bắt đầu `REACTION_IMPACT` trước khi đòn chạm. Nó phản ứng với nhát đánh thật của địch, nên không giơ khiên đỡ một đòn không tới.
  - Ba trên mười đòn lọt qua (`hit`); đòn hạ gục luôn lọt qua. Chọn clip nào là cố định theo từng hình và từng đòn.
  - **Mỗi lúc một clip, không clip nào bị cắt ngang:** hình lính đang dở nhát đánh của mình thì không phản ứng; nhát đánh kế tiếp của nó sẽ bắt đầu trước khi phản ứng phát xong thì cũng không phản ứng; đang phản ứng thì nhát đánh của nó chờ phản ứng phát xong (còn dưới 0,1 giây). Hai người trong một cặp vốn đánh luân phiên, nên các quy tắc này chỉ có tác dụng lúc đổi đối thủ hay đổi nhịp. Ngoại lệ duy nhất: nhát hạ gục đối thủ không chờ.
  - Clip đánh dài và lấy đà lâu thì không đủ chỗ cho cả hai trong một chu kỳ: kỵ binh Numidia đánh gần (phóng lao, đòn chạm ở giây 0,73) hầu như không đỡ đòn.
  - Sau khi tua, hình lính vào ngay nhát đánh mà đồng hồ trận cho nó, và người bị nhắm vào ngay giữa clip `block` hay `hit` tương ứng, kể cả khi đòn đã chạm. (Lúc phát liên tục, một nhát chỉ được báo tới lúc đòn chạm.)
  - Khối đang đánh từ xa (`skirmish`) không phản ứng, kể cả với nhát của địch bắt đầu trước khi khối chuyển sang ném.
  - Lý do người Numidia không đỡ được: gọi d là khoảng từ lúc đòn của họ chạm tới lúc đòn của đối thủ chạm; họ cần d từ 1,38 tới 1,50 giây, kỵ binh đối diện cần 0,83 tới 1,28 giây. Hai khoảng không giao nhau, nên chỉnh độ lệch nhịp không sửa được.
- **Vẽ** (`engine/units.ts`):
  - Hình lính dời từ chỗ trong đội hình tới chỗ đấu với tốc độ 6 m/s theo thời gian thật; quay mặt về đối thủ, tối đa 80° so với hướng khối.
  - **Cất đồ cầm thêm** (T-035): mô hình nào thu nhỏ một xương trong các clip đánh (hai cây *pilum* của hastatus) thì cảnh nhận ra lúc nạp (`UnitModel.stow`). Người đầu hàng dọc của khối đang `fight` cất chúng trong 0,3 giây và giữ như vậy giữa các clip; hàng sau vẫn cầm. Shader co các đỉnh của xương đó về cổ tay theo số thứ hai của `iStrike`.
  - Thuộc tính `iStrike` của từng hình có hai số. Số đầu cho shader biết đang ở giây thứ mấy của clip `attack`, `block` hay `hit`. Giá trị âm thì `attack` lặp theo đồng hồ như trước (dùng cho `skirmish`).
  - Một nhát đã bắt đầu thì phát hết, dù đối thủ đã ngã; nhát mới chỉ bắt đầu ở đầu clip (`swingBeat` trong `melee.ts`). Ngoại lệ là nhát hạ gục đối thủ: nó được bắt đầu muộn, bất cứ lúc nào trước khi đòn chạm, và cắt ngang nhát đang dở. Sau khi tua, hình lính đứng ngay vào chỗ đấu và vào đúng khung của nhát đang diễn ra.
  - Người ngã nằm lại ở chỗ đang đấu, không bị kéo về chỗ trong đội hình. Sau khi tua, người đã ngã nằm ở chỗ trong đội hình, lệch vài mét so với lúc phát liên tục.
  - Trong khối đứng yên, người tự di chuyển (bước lên thay người ngã, bước tới đối thủ) thì chân đi theo clip `walk`.
  - Khi dừng phát, nhát đánh đứng hình theo đồng hồ trận.
- **Kỵ binh** đấu từng cặp và nhận đòn như bộ binh (chặng 3). Khoảng cách đấu của họ tính theo thân ngựa, nên hai con ngựa đứng chạm mũi nhau và mũi giáo chỉ tới đầu ngựa của địch.

### Phong cảnh (đợt H)

Từ đợt H, một trận có thể mô tả những thứ nằm trên mặt đất ngoài hai đạo quân: lớp phủ mặt đất, bờ sông, trại, thành, làng, gió và bụi. Chặng 0 (T-037) thêm kiểu dữ liệu, dữ liệu của Cannae và phần kiểm tra. Chặng 1 (T-038) vẽ mặt đất, sông, vùng xa và biển. Chặng 2 (T-039) dựng công trình. Mảng đất riêng (`areas`), gió và bụi **chưa được vẽ**: các chặng sau làm.

- **Nguyên tắc:** vẽ cho giống thật, nhưng mỗi thứ phải nói rõ nó dựa vào đâu. Mọi phần của phong cảnh mang một `evidence` (kiểu `SceneryEvidence`):
  - `basis`: `attested` (nguồn cổ nói có; bắt buộc kèm `sources`), `inferred` (suy từ nguồn hoặc từ địa hình), hoặc `illustrative` (không có căn cứ, chỉ hợp với vùng và thời ấy).
  - `note`: một hai câu song ngữ, tự viết, nói nguồn viết gì và phần nào là giả định.
  - Cảnh vẽ ba mức như nhau. Khác biệt được nói bằng chữ (hộp thoại Giới thiệu, thông tin trận), không bằng hình.
  - `attested` chỉ nói thứ đó có thật. Kích thước và vị trí chính xác thường vẫn là giả định, và ghi chú phải nói vậy.
- **Mặt đất** (`scenery.ground`, `scenery.areas`): `ground.cover` là lớp phủ ở mọi chỗ không có mảng riêng. `areas` là các mảng có lớp phủ khác, cho bằng đường bao (`outline`, ít nhất ba điểm). Lớp phủ (`GroundCover`): `stubble` (ruộng đã gặt), `grass`, `scrub` (bụi thấp), `reeds` (lau sậy và cây thấp ven nước), `woodland`, `bare`.
- **Sông** (thêm vào `BattleRiver`): `level.stage` là `low` (nước cạn, lộ bãi sỏi, lội qua được ở các địa danh loại `ford`) hoặc `full`; `banks` là lớp phủ dọc hai bờ, trong một dải rộng `width` mét tính từ mép nước.
- **Công trình** (`scenery.structures`, kiểu `SceneryStructure`): `camp` (trại quân: hào, luỹ, cọc rào, cổng, lều; bắt buộc có `side`), `citadel` (thành nhỏ có tường), `village` (nhà không có tường bao), `farm` (nhà nông với chuồng trại trong sân có tường, thêm ở T-039). Phần đất của công trình là một hình chữ nhật cho giống `Formation`: `center`, `width` (bề ngang mặt trước), `depth`, `facing` (hướng mặt trước, tức cổng chính). `ruined` là đổ nát.
  - Phần đất tính theo **kích thước thật**. Những thứ đứng trong đó (lều, nhà) cảnh vẽ to hơn thật và ít hơn thật, như cách vẽ lính (`FIGURE_SCALE`, một hình bằng 20 người).
  - Nhãn tên vẫn thuộc về `landmarks`. Nhãn của một trại hay thị trấn nên nằm trong công trình tương ứng; `npm run validate` cảnh báo nếu không.
  - Khối quân có thể đứng trong trại của mình (lúc ra quân, lúc rút về). Cảnh để trống chỗ đó: lều không được dựng ở nơi một khối quân đứng hay đi qua.
  - **Trong cảnh** (T-039, `engine/structures.ts`): mọi công trình được sinh bằng code lúc mở trận, bám theo mặt đất, có hạt giống ngẫu nhiên là id trận và id công trình (cùng một trận luôn ra cùng một cảnh). Không có file mô hình nào. Trại của bên có id `rome` xếp lều theo quy tắc (khoảng trống sau luỹ, đường lớn, lối đi); trại của bên khác xếp lỏng. Một lều cho chừng `MEN_PER_FIGURE` người. Chi tiết ở `docs/tasks/T-039-structures.md`.
- **Gió** (`scenery.wind`): `from` là hướng gió thổi **tới từ đâu**, độ theo chiều kim đồng hồ từ hướng bắc; `speed` tính bằng mét mỗi giây. **Bụi** (`scenery.dust`): `level` từ 0 (đất ẩm, không bụi) tới 1 (đất khô nẻ, bụi dày).
- **Trận không có `scenery`** vẫn hợp lệ: mặt đất vẽ như trước đợt H (không có ô ruộng), sông đầy nước và không có dải bờ.
- **Vùng xa** (`terrain.far`, kiểu `BattleFarTerrain`, T-038): một lưới độ cao thưa của cả vùng quanh chiến trường, cùng định dạng với lưới chính, để chân trời có đồi núi và biển thật.
  - Phải vượt ra ngoài lưới chính ít nhất hai ô của nó ở mọi phía. Không có thì mặt đất kéo phẳng từ mép lưới chính ra 40 km như trước.
  - Cảnh vẽ nó bằng chính vật liệu của mặt đất gần (`Terrain.buildFar`), khoét một lỗ là các ô nguyên của lưới xa bao quanh lưới chính; vòng đỉnh ngoài cùng của mặt đất gần nằm trên mép lỗ và lấy độ cao của lưới xa.
  - Đỉnh của vùng xa hạ thấp theo độ cong trái đất (d² / 2R): núi ở 45 km thấp đi khoảng 160 m.
  - `scripts/battles/build-terrain.mjs` ghi cả hai lưới; mỗi giá trị của lưới xa là trung bình của vùng đất quanh điểm lưới.
- **Biển** (T-038): đất có độ cao từ 0 trở xuống, ở cả hai lưới, được vẽ là biển, viền một dải cát. Trong lưới chính, mặt nạ biển được làm mờ hai lượt để đường bờ tròn lại. Sông dừng ở bờ biển. `npm run validate` không cho khối quân (quá 10% diện tích), địa danh hay công trình nào nằm trên biển.
- **Mặt đất và sông trong cảnh** (T-038): `engine/terrain.ts` (ô ruộng, hàng rạ, độ gồ ghề gần camera) và `engine/river.ts` (lòng sỏi, dòng nước cạn, chỗ lội, dải bờ, phản chiếu trời). Chi tiết ở `docs/tasks/T-038-ground-river.md`.
- **Kiểm tra** (`checkScenery` trong `scripts/battles/validate-battles.mjs`): mức căn cứ, ghi chú và nguồn; công trình nằm trọn trong vùng địa hình, không chồng nhau, không lấn vào sông và dải bờ; các số nằm trong khoảng cho phép.
- **Căn cứ của Cannae:** `docs/data/battles/cannae.md`, mục 12.

### Khung xem trận (đợt C)

- **Mở:** sự kiện nào có trận 3D (`hasBattle(id)` trong `src/data/index.ts`) thì panel sự kiện có nút xem trận. Nút gọi `openBattle(id)`; từ T-025 nút gọi `requestBattle(id)` để bản đồ bay tới chiến trường trước (xem mục "Trạng thái chung").
- **Hiện:** khi `battleId` khác `null`, `AppShell` nạp `BattleViewer` (`src/components/battle/BattleViewer.tsx`) bằng `next/dynamic` với `ssr: false`. three.js chỉ tải khi người dùng mở trận lần đầu.
- **Khung:** `BattleViewer` phủ kín trang, nằm trong một `<dialog>` mở bằng `showModal()`. Nhờ vậy các phím tắt chung của trang (`src/components/shell/keyboard.ts`) tự đứng ngoài khi trận đang mở; khung xem trận tự xử lý phím của nó. Esc hoặc nút đóng gọi `closeBattle()`, và focus trở về nút đã mở trận.
- **Thời gian:** khung xem trận là nơi duy nhất ghi `battleTime` trong app chính (phát, tua, chuyển giai đoạn). Trang `/battle-lab` vẫn tự ghi như trước.
- **Bố cục** (T-023): cảnh và thanh điều khiển bên trái; khung bên 360 px bên phải, thu gọn được, có hai tab "Lời dẫn" và "Thông tin trận" (hai bên, nguồn, ghi công). Ở bề ngang hẹp, khung bên nằm dưới cảnh.
- **Ghi công trong khung:** `src/lib/credits.ts`, dùng chung với hộp thoại Giới thiệu (gộp khi gộp T-029). Phải khớp với README ("Data credits") và `art/CREDITS.md`. Thêm mô hình mới thì thêm dòng ở cả ba chỗ.
- **Lớp phủ:** phần tử nào của khung nằm đè lên cảnh thì có thuộc tính `data-battle-overlay`; nhãn địa danh của cảnh tránh các phần tử này.
- **Khối quân** (T-028):
  - nút "Tên khối quân" bật/tắt nhãn khối quân, ghi nhớ trong `localStorage` khoá `whp.battleUnitNames`;
  - tab "Thông tin trận" có danh sách khối quân của mỗi bên; chọn một dòng thì camera bay tới khối và focus vào thẻ;
  - Esc đóng thẻ trước, lần Esc sau mới đóng khung xem trận;
  - props `selectedUnit`, `onSelectUnit`, `unitFocusRequest` của `BattleScene` nằm ngoài `BattleSceneProps`, như `introFromAbove`. Không truyền thì cảnh tự giữ khối đang chọn (`/battle-lab`).
- **Cú hạ camera** (T-026): khung xem trận mở với camera nhìn thẳng xuống tâm vùng địa hình, hướng bắc lên, đủ cao để thấy cả vùng, như bản đồ để lại sau khi bay tới chiến trường (T-025); rồi trong 1,8 giây dời điểm nhìn và hạ về góc nhìn mở. Bật bằng prop `introFromAbove` của `BattleScene`; `/battle-lab` không bật. Bỏ qua khi người dùng bật giảm chuyển động; người dùng chạm vào cảnh thì dừng.

### Các đợt làm

Chi tiết ở `docs/PLAN.md`.
- **Đợt A:** mô hình lính La Mã (T-014), cảnh 3D (T-015), dữ liệu trận Cannae và địa hình (T-016).
- **Đợt B:** các loại lính còn lại, ghép mô hình và dữ liệu thật.
- **Đợt C:** khung xem trận (lời dẫn, nút điều khiển, thông tin hai bên, ghi công), mở trận từ panel sự kiện, chuyển cảnh từ bản đồ vào trận, ghi công trong hộp thoại Giới thiệu.
- **Đợt G:** giáp lá cà (T-032, T-033, T-034).
- **Đợt H:** phong cảnh. Chặng 0 (T-037): kiểu dữ liệu và dữ liệu Cannae. Chặng 1 (T-038): mặt đất, sông, vùng xa và biển. Chặng 2 (T-039): công trình. Các chặng sau: thực vật, bụi.
