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

_(Lane 2 điền khi xong.)_
