# T-002: Bản đồ lịch sử

- **Lane:** 2
- **Nhánh:** `lane2/T-002-map`
- **Phạm vi file:** `src/components/map/`, `public/map/` (dữ liệu bản đồ nền), khoá `map.*` trong `src/lib/i18n/messages.ts`

## Mục tiêu

Thay `MapView.tsx` tạm bằng bản đồ MapLibre hiển thị lãnh thổ các thế lực theo năm đang xem và vị trí các sự kiện.

## Hiện trạng

`MapView.tsx` chỉ in ra năm và viewport lấy từ store. `maplibre-gl` đã được cài. Chưa có file biên giới nào: `src/data/border-snapshots.json` đang là mảng rỗng, Lane 3 sẽ bổ sung ở T-004.

## Yêu cầu

1. **Bản đồ nền không có yếu tố hiện đại**: chỉ đất liền, biển, có thể thêm sông lớn. Không biên giới, tên nước hay thành phố ngày nay. Hướng đề xuất: dùng dữ liệu đất liền của Natural Earth (public domain) đặt trong `public/map/` và vẽ bằng lớp GeoJSON, để không phụ thuộc dịch vụ tile hay khoá API. Nếu chọn hướng khác, nêu lý do ở mục "Kết quả".
2. **Lớp lãnh thổ**: lấy mốc bằng `getBorderSnapshot(year)`, tải `public/data/borders/<file>`, tô mỗi feature theo `color` của thế lực (`getPolity(properties.polityId)`). Khi `year` đi qua một mốc mới thì đổi lớp. Chưa cần chuyển cảnh mượt, đó là việc của giai đoạn 5.
3. **Điểm sự kiện**: hiện các sự kiện có `location` trong `getEventsAround(year)`. Bấm vào điểm thì gọi `selectEvent(id, year)`. Sự kiện đang chọn được làm nổi và bản đồ bay tới đó. Vị trí `approximate` có kiểu hiển thị khác.
4. **Viewport**: bắt đầu từ `INITIAL_VIEWPORT`. Mỗi khi bản đồ dừng di chuyển, ghi `center`, `zoom`, `bounds` vào store bằng `setViewport`.
5. **Chú giải** các thế lực đang có mặt trên bản đồ, tên theo ngôn ngữ đang chọn.
6. Khi chưa có mốc biên giới nào cho năm đang xem, bản đồ vẫn chạy bình thường với bản đồ nền và điểm sự kiện.
7. Dùng được ở bề ngang 390px, cả chế độ sáng lẫn tối.

## Dữ liệu thử

Để tự kiểm tra trước khi Lane 3 xong, tạo một hoặc hai file biên giới thô trong `src/components/map/__fixtures__/` và nạp chúng khi phát triển. Không ghi vào `public/data/borders/` hay `src/data/`, đó là vùng của Lane 3.

## Ràng buộc

- Chỉ đọc và ghi trạng thái qua `useAppStore`. Không import gì từ `src/components/timeline/` hay `panel/`.
- MapLibre chỉ chạy ở trình duyệt: khởi tạo trong `useEffect` và dọn dẹp khi component bị gỡ.
- Định dạng file biên giới theo `docs/ARCHITECTURE.md`. Thấy định dạng chưa đủ dùng thì ghi đề nghị, không tự đổi.

## Xong khi

- Kéo thanh thời gian thì lớp lãnh thổ (dữ liệu thử) và điểm sự kiện đổi theo.
- Bấm sự kiện trong panel thì bản đồ bay tới; di chuyển bản đồ thì `viewport` trong store đổi (xem ở khung tutor hoặc React DevTools).
- `npm run lint` và `npm run build` qua.

## Kết quả

Lane 2, 2026-11-15. Đã xong cả 7 yêu cầu; `npm run lint` và `npm run build` qua.

### Đã làm

- **Bản đồ nền** (`public/map/basemap.json`, 1,3 MB, khoảng 440 kB khi gzip): theo đúng hướng đề xuất, dùng Natural Earth 1:10m, vẽ bằng lớp GeoJSON, không tile, không khoá API, không font chữ. Chỉ có biển, hồ tự nhiên và sông; đã loại hồ chứa và kênh đào. Dữ liệu cắt theo vùng kinh độ −40…80, vĩ độ 5…70 và bản đồ khoá khung nhìn trong vùng đó, mức phóng 2–8. Nguồn và cách tạo lại ghi ở `public/map/README.md`; script là `src/components/map/tools/build-basemap.mjs` (không cần thư viện ngoài).
- **Lớp lãnh thổ**: `getBorderSnapshot(year)` → tải `/data/borders/<file>` → tô theo `color` của thế lực. Đổi lớp khi năm đi qua mốc mới; trong lúc mốc mới đang tải thì giữ mốc cũ để không nháy. File đã tải được giữ trong bộ nhớ.
- **Biển vẽ đè lên lãnh thổ**: thứ tự lớp là đất → lãnh thổ → sông → biển/hồ → đường bờ. Nhờ vậy polygon biên giới chỉ cần đúng ở phần đất liền; phần tràn ra biển bị che. Lane 3 không phải vẽ bám theo bờ biển.
- **Điểm sự kiện**: mỗi sự kiện có `location` trong `getEventsAround(year)` là một nút bấm (dùng được bằng bàn phím, có `aria-label`). Sự kiện diễn ra đúng năm đang xem có màu nhấn, sự kiện ở năm lân cận màu xám; kích thước theo `importance`. Vị trí `approximate` là vòng tròn rỗng viền đứt, to hơn. Sự kiện đang chọn có vòng viền và nhãn tên + năm; di chuột hoặc focus cũng hiện nhãn. Các sự kiện trùng địa điểm (ví dụ nhiều sự kiện ở Roma) được xoè ra quanh vị trí thật để không che nhau.
- **Chọn sự kiện**: bấm điểm gọi `selectEvent(id, event.year)`, bấm lại điểm đang chọn thì bỏ chọn (giống panel). Khi `selectedEventId` đổi, bản đồ bay tới và phóng tối thiểu mức 5,5.
- **Viewport**: bắt đầu từ `INITIAL_VIEWPORT`; mỗi lần bản đồ dừng (`moveend`) và ngay sau khi tải xong thì ghi `center`, `zoom`, `bounds` bằng `setViewport`.
- **Chú giải**: các thế lực có trong mốc đang hiển thị (tên theo ngôn ngữ), năm của mốc, ý nghĩa các kiểu điểm sự kiện. Thu gọn được; mặc định đóng ở màn hình hẹp. Khi không có mốc nào thì ghi "chưa có dữ liệu biên giới cho năm này".
- **Màu**: lấy từ token (`--surface` cho đất, `--background` cho nước, `--line` cho đường bờ), đọc lúc chạy và áp lại khi hệ thống đổi sáng/tối.
- Nút phóng to, thu nhỏ, về góc nhìn ban đầu tự vẽ bằng token và chuỗi song ngữ, thay cho control mặc định của MapLibre (chỉ có tiếng Anh, không theo chế độ tối). Bản đồ luôn hướng bắc, không xoay, không nghiêng.
- Thêm 15 khoá `map.*` vào `messages.ts` cho cả `en` và `vi`.

### Dữ liệu thử

Ba file thô trong `src/components/map/__fixtures__/` (mốc −500, −264, −146). Chỉ được nạp khi chạy `next dev` **và** `border-snapshots.json` còn rỗng; chú giải ghi rõ "Dữ liệu thử". Khi Lane 3 thêm mốc thật thì dữ liệu thử tự tắt. Đã kiểm tra bản build production không chứa chúng. Sau T-004 có thể xoá thư mục này cùng khối `fixtureSources` trong `borders.ts`.

### Đã kiểm tra thế nào

Công cụ Claude in Chrome không bật trong phiên này, nên tôi điều khiển Edge headless trên máy qua DevTools Protocol, chụp ảnh và đọc DOM. Chưa thử trên điện thoại thật hay bằng tay.

- 1280×800 và 390×844, cả sáng lẫn tối, cả `en` lẫn `vi`. Không có lỗi trong console; ở 390px trang không tràn ngang.
- Kéo năm: −509 không có mốc (bản đồ nền + điểm sự kiện vẫn chạy); −480, −264, −146 đổi lớp lãnh thổ và chú giải; điểm sự kiện đổi theo năm.
- Bấm "Battle of Cannae" trong panel: bản đồ bay tới (tâm 16,15°; 41,31°, mức 5,5), điểm được làm nổi.
- Bấm điểm Zama trên bản đồ: sự kiện được chọn, năm nhảy về −202; bấm lại thì bỏ chọn. Điểm Zama hiện kiểu "ước lượng".
- Năm −30: hai sự kiện ở Roma tách thành hai điểm cạnh nhau.
- Kéo bản đồ và bấm nút phóng: `setViewport` được gọi với giá trị mới (xem bằng log tạm, đã gỡ).
- Đổi sáng/tối khi đang chạy: bản đồ đổi màu theo.
- `next start` trên bản production: bản đồ và worker tải bình thường, không có lớp lãnh thổ (đúng, vì chưa có dữ liệu thật).

### Còn hạn chế

- Đường bờ biển và sông là của ngày nay (ghi trong chú giải và README).
- Ở chế độ sáng, đất và biển chỉ khác nhau nhẹ vì hai token gần màu nhau (xem đề nghị 1).
- Không có nhãn chữ trên bản đồ (tên thế lực, địa danh): MapLibre cần file font glyph, hiện chưa có.
- Sự kiện đang chọn mà nằm ngoài `getEventsAround(year)` thì không có điểm trên bản đồ, giống cách panel đang làm.
- Bấm một sự kiện kéo dài đang diễn ra (ví dụ Chiến tranh Punic lần 1 khi đang xem −250) sẽ đưa năm về năm bắt đầu, vì gọi `selectEvent(id, event.year)` như panel.
- Chuyển cảnh mượt giữa các mốc để giai đoạn 5 như task đã nêu.

### Đề nghị ngoài phạm vi

1. **Token màu cho bản đồ** (`globals.css`): thêm `--map-land`, `--map-water` (và nếu muốn, `--map-coast`) để đất và biển tách rõ hơn, nhất là ở chế độ sáng. Chỉ cần đổi ba tên token trong `src/components/map/theme.ts`.
2. **Ghi chú cho Lane 3 trong `docs/ARCHITECTURE.md`**: (a) polygon biên giới không cần bám bờ biển vì biển che phần tràn; (b) feature có `polityId` không khớp `polities.json` bị bỏ qua kèm cảnh báo ở console; (c) bản đồ chỉ phủ kinh độ −40…80, vĩ độ 5…70. Định dạng file biên giới hiện tại đủ dùng, không cần đổi.
3. **Script tạo bản đồ nền** đang nằm ở `src/components/map/tools/` vì `scripts/` thuộc Lane 3. Nếu muốn gom script về một chỗ thì chuyển sang `scripts/` và sửa đường dẫn `outputPath` trong file.
4. **Khoá i18n cũ** `map.placeholder`, `map.center`, `map.zoom` không còn được bản đồ dùng. Tôi để nguyên vì quy tắc chỉ cho thêm khoá.
5. **Worker của MapLibre 6**: bản 6 tách worker thành file riêng. Tôi trỏ tới nó bằng `new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url)` để Turbopack tự xuất file, không cần sửa `next.config.ts`. Turbopack xuất kèm cả bản worker `-dev` (1,2 MB) vào `.next/static/media`; file này không được trình duyệt tải, chỉ tốn chỗ trên đĩa.
6. **Khung tutor** hiện chưa in `viewport`, nên muốn xem viewport đổi phải dùng React DevTools. Nếu cần kiểm tra nhanh thì in thêm tâm và mức phóng ở đó.
