# T-017: Chú giải bản đồ không che nhãn tên thế lực

- **Lane:** 2
- **Model đề xuất:** Opus 5.5, effort `high`.
- **Nhánh:** `lane2/T-017-legend-labels` (tạo từ `main` mới nhất)
- **Phạm vi file:** `src/components/map/`, khoá `map.*` trong `src/lib/i18n/messages.ts`

## Mục tiêu

Chú giải bản đồ (`MapLegend.tsx`) nằm ở góc dưới bên trái. Ở các năm có nhiều thế lực, nó cao gần hết khung bản đồ và che nhãn tên thế lực ở nửa trái. Ví dụ: "Gallic tribes" năm 290 TCN, Mauretania năm 88 TCN. Sửa sao cho nhãn không bị che mà chú giải vẫn dùng được.

## Đọc trước

- `src/components/map/MapLegend.tsx`, `MapView.tsx`.
- `src/components/map/labels/`: cách đặt nhãn (`spots.ts`, `placement.ts`, `TerritoryLabels.tsx`).

## Yêu cầu

1. **Tái hiện trước khi sửa.** Ở 1280×800, chụp ảnh năm 290 và 88 TCN, chú giải mở. Tìm thêm các năm khác bị che, ví dụ năm có nhiều thế lực nhất.
2. **Chọn cách sửa.** Lane tự chọn, miễn là đạt yêu cầu ở mục 3. Một số hướng:
   - Chú giải gọn hơn: chia hai cột, hoặc giới hạn chiều cao rồi cuộn bên trong.
   - Khi đặt nhãn, coi khung chú giải là vùng cấm. Nhãn rơi vào đó thì chuyển sang chỗ khác trong lãnh thổ; không còn chỗ thì ẩn.
   - Kết hợp hai hướng trên.

   Ghi lý do chọn trong mục "Kết quả".
3. **Yêu cầu sau khi sửa:**
   - Ở 1280×800, chú giải mở, không nhãn nào bị chú giải che, ở mọi mốc biên giới.
   - Nhãn vẫn đúng khi mở hoặc thu chú giải, khi kéo hay phóng bản đồ, khi đổi kích thước cửa sổ, khi đổi ngôn ngữ (tên tiếng Việt dài hơn).
   - Chú giải vẫn đọc được đủ. Dòng ghi công Cliopatria là bắt buộc, không được ẩn khi chú giải mở.
   - Ở 390px không vỡ, không cuộn ngang. Không cần tinh chỉnh riêng cho điện thoại.
   - Đúng ở cả chế độ sáng lẫn tối, cả `en` lẫn `vi`.

## Ràng buộc

- Không sửa file ngoài phạm vi. Cần đổi store hay hợp đồng thì ghi đề nghị vào mục "Kết quả".
- Không thêm thư viện npm.

## Xong khi

- `npm run lint` và `npm run build` qua.
- Có ảnh trước và sau ở năm 290 và 88 TCN (1280×800), cùng một ảnh ở 390px. Để ảnh ngoài repo và ghi đường dẫn trong mục "Kết quả".

## Kết quả

### Tái hiện (trước khi sửa)

Ở 1280×800, khung bản đồ chỉ còn 896×566 px (bảng sự kiện và gia sư chiếm bên phải). Chú giải một cột cao tới 550 px ở các năm nhiều thế lực. Kiểm tra cả 14 mốc biên giới, chú giải mở, `en`:

| Mốc | Nhãn bị chú giải che |
|---|---|
| 509, 338, 30 TCN | Không |
| 290, 264, 241 TCN | Gallic tribes |
| 218 TCN | Gallic tribes, Carthage |
| 201, 168, 146, 129 TCN | Gallic tribes, Roman Republic (Tây Ban Nha), Kingdom of Mauretania |
| 88, 63 TCN | Roman Republic (Tây Ban Nha), Kingdom of Mauretania |
| 50 TCN | Kingdom of Mauretania |

### Cách sửa và lý do

Kết hợp hai hướng: chủ yếu là coi chú giải là vùng cấm khi đặt nhãn, kèm một thay đổi nhỏ cho chú giải.

1. **Vùng cấm khi đặt nhãn** (`labels/placement.ts`, `labels/TerritoryLabels.tsx`):
   - `MapView` truyền ref của chú giải và cụm nút phóng to/thu nhỏ vào `TerritoryLabels`. Các nút này cũng che nhãn theo cùng kiểu nên được coi là vùng cấm luôn.
   - Khi đặt nhãn, khung của chúng (toạ độ màn hình so với bản đồ) là vùng cấm. Nhãn có điểm mặc định bị che thì thử các điểm thay thế trong cùng mảnh lãnh thổ, sâu nhất trước.
   - Riêng nhãn chính của một thế lực còn thử thêm điểm tốt nhất của các mảnh lãnh thổ không có nhãn riêng. Ví dụ năm 201 TCN, Tây Ban Nha của La Mã bị che hết thì thử sang Ý và Sicily.
   - Điểm thay thế phải nằm trọn trong khung bản đồ đang thấy. Không còn chỗ nào thì nhãn ẩn.
   - Nhãn đã dời thì giữ điểm cũ nếu điểm đó còn dùng được, để nhãn không nhảy khi kéo bản đồ. Khi điểm mặc định hết bị che thì nhãn về chỗ cũ.
   - Nhãn không bị che thì đặt như trước, kết quả không đổi.
   - Điểm thay thế (`spots.ts`, `alternatives`) tính một lần cho mỗi mốc, cùng lúc với điểm mặc định. Cách tính: chia mảnh lãnh thổ thành ô vuông cạnh bằng nửa độ sâu của điểm tốt nhất, lấy ô sâu nhất mỗi khối, tối đa 40 điểm mỗi mảnh. Thêm một lượt duyệt lưới nên rẻ.
   - Vì chú giải đứng yên trên màn hình, việc đặt nhãn giờ chạy lại khi bản đồ di chuyển (`move`, gồm cả kéo và phóng), khi bản đồ đổi kích thước (`resize`), và khi chú giải đổi kích thước (`ResizeObserver`: mở/thu, đổi ngôn ngữ, đổi số thế lực). Mỗi khung hình chạy tối đa một lần. Bảng nhãn chỉ cập nhật khi kết quả khác đi.
   - `PolityLabel` tạo marker một lần, rồi chỉ `setLngLat` khi điểm đổi.
2. **Chú giải** (`MapLegend.tsx`): giữ một cột, nhưng khi bản đồ thấp thì chỉ danh sách thế lực cuộn bên trong (luôn hiện ít nhất khoảng hai dòng). Ký hiệu sự kiện và dòng ghi công Cliopatria luôn nằm trong khung. Trước đây cả thân chú giải cuộn, nên dòng ghi công có thể bị đẩy ra khỏi khung.

**Vì sao không chia hai cột:** tôi đã thử chú giải hai cột (rộng 352 px, thấp hơn khoảng 200 px), rồi đếm nhãn hiện được ở 11 mốc nhiều thế lực, cả `en` lẫn `vi`. Hai cột cho **ít nhãn hơn** ở hầu hết các mốc (thường kém một nhãn, ví dụ 88 TCN: 9 so với 10; 201 TCN: 9 so với 10).
- Lý do là góc dưới bên trái của khung nhìn ban đầu là Bắc Phi (Numidia, Mauretania). Chú giải rộng che hẳn các nước này, không còn chỗ dời nhãn.
- Chú giải cao chỉ che Tây Ban Nha và phía tây xứ Gaul, những chỗ nhãn dời được lên trên hoặc sang phải.
- Diện tích hai kiểu gần như bằng nhau, nên không có lợi gì để đổi lấy cái mất này.

### Kiểm tra

Kiểm tra bằng Chrome headless qua CDP, bằng script `E:\World_History_Platform_assets\T-017\shoot.mjs` (để ngoài repo). Script đo khung của từng nhãn đang hiện, so với khung chú giải và cụm nút, và kiểm tra link Cliopatria nằm trong khung chú giải.
- Ở 1280×800, chú giải mở, **cả 14 mốc**, cả `en` (sáng) lẫn `vi` (tối): không nhãn nào chạm chú giải hay cụm nút; dòng ghi công hiện; không cuộn ngang.
- Năm 201 TCN (nhiều thế lực nhất): thu rồi mở lại chú giải, kéo bản đồ hai hướng, phóng to và thu nhỏ bằng con lăn, đổi cửa sổ sang 1100×700, 1440×900, 1280×640, đổi ngôn ngữ ngay trong trang (`en` sang `vi`, và `vi` sang `en` ở năm 129 TCN). Không nhãn nào bị che, dòng ghi công luôn hiện.
- Ở 390 px, chú giải thu và mở (`vi`, tối) và chú giải thu (`en`, sáng): không nhãn nào bị che, không cuộn ngang. Chú giải mở chiếm gần hết bản đồ, danh sách thế lực cuộn, dòng ghi công hiện.
- `npm run lint` và `npm run build` qua.

Những gì vẫn còn:
- Một nhãn bị che trước đây giờ có thể bị ẩn nếu không còn chỗ. Ví dụ năm 201 TCN, Roman Republic chỉ có lãnh thổ lớn ở Tây Ban Nha, mà Tây Ban Nha nằm hết dưới chú giải; Ý, Sicily và Sardinia quá hẹp cho nhãn ở mức phóng ban đầu. Thu chú giải hoặc kéo bản đồ thì nhãn hiện lại. Đây là chỗ đánh đổi theo hướng task cho phép ("không còn chỗ thì ẩn").
- Nhãn dời đi thì nhảy sang chỗ mới, không có hiệu ứng chuyển.

### Ảnh

Ngoài repo, trong `E:\World_History_Platform_assets\T-017\`. Tên file theo dạng `năm_ngôn ngữ_giao diện_bề ngang_…`.
- Trước: `before\-290_en_light_1280_shot_slow.png`, `before\-290_vi_light_1280_shot.png`, `before\-88_en_light_1280_shot.png`, `before\-88_vi_dark_1280_shot.png`.
- Sau, 1280×800: `after\-290_en_light_1280_shot_slow.png`, `after\-290_vi_dark_1280_shot.png`, `after\-88_en_light_1280_shot.png`, `after\-88_vi_dark_1280_shot.png`.
- Sau, các thao tác ở năm 201 TCN: `after\-201_en_light_1280_pan250,-60_shot.png` (kéo), `after\-201_en_light_1280_zoom300,350,-300_shot.png` (phóng to), `after\-201_en_light_1280_size1280x640_shot.png` (cửa sổ thấp, danh sách cuộn).
- Sau, 390 px: `after\-88_en_light_390_shot.png` (chú giải thu, như khi mới mở trang trên điện thoại), `after\-88_vi_dark_390_toggle_shot.png` (chú giải mở).

### File đã sửa

Chỉ trong `src/components/map/`: `MapLegend.tsx`, `MapView.tsx`, `MapControls.tsx` (nhận `ref`), `labels/placement.ts`, `labels/spots.ts`, `labels/TerritoryLabels.tsx`. Không thêm khoá i18n, không thêm thư viện, không cần đổi store hay hợp đồng.

### Đề nghị ngoài phạm vi

Không có.
