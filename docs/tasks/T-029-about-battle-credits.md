# T-029: Trận đánh 3D trong hộp thoại Giới thiệu

- **Lane:** 1 (sau T-022). Nếu lane khác rảnh trước, phiên chính sẽ ghi ngoại lệ cho lane đó.
- **Model đề xuất:** Opus 5.5, effort `high`. Task nhỏ, chủ yếu là chữ.
- **Nhánh:** `lane1/T-029-about-battle` (tạo từ `main` mới nhất, sau khi T-022 đã gộp)
- **Phạm vi file:** `src/components/shell/` (hộp thoại Giới thiệu), khoá `about.*` trong `src/lib/i18n/messages.ts` (cả `en` lẫn `vi`).

## Bối cảnh

Trận Cannae 3D đã vào app chính. Bấm "Xem trận đánh 3D" trong panel sự kiện thì bản đồ bay tới chiến trường, rồi khung xem trận mở. Khung xem trận đã có ghi công riêng ở cuối tab "Thông tin trận". Hộp thoại Giới thiệu (T-013) thì chưa nhắc gì tới trận đánh.

Đây là việc cuối của giai đoạn 7. Kiến trúc ghi từ đầu: "Khi trận đánh vào app chính, ghi công thêm ở hộp thoại Giới thiệu và README." Làm sau T-022, để ghi công cả ngựa của kỵ binh.

## Đọc trước

- README, mục "Data credits": các dòng "Soldier models" và "Battle terrain" (đúng câu chữ).
- `art/CREDITS.md`: dòng ghi công gợi ý của mô hình lính và của ngựa (T-022 sẽ cập nhật).
- `src/components/battle/viewer/credits.ts` và khoá `battle.credits.*`: ghi công trong khung xem trận. Hai nơi phải nói như nhau.
- `docs/ARCHITECTURE.md`, mục "Mô hình lính" (Kỵ binh, ghi công ngựa) và "Khung xem trận".

## Yêu cầu

### 1. Mục "Cách dùng"

Thêm một ý: trận có cảnh 3D (hiện có trận Cannae) thì panel sự kiện có nút xem trận. Bản đồ bay tới chiến trường; trong khung xem trận có nút phát, tua, lời dẫn theo giai đoạn, thông tin hai bên, và phím Space, ←/→, Esc.

### 2. Mục "Độ chính xác"

Thêm một ý, nói ngắn gọn rằng trận đánh 3D là **phỏng dựng**:
- vị trí và đường đi của các khối quân dựa trên Polybius và Livy, nhiều chỗ còn tranh cãi (có ghi trong tab "Thông tin trận");
- một hình lính tượng trưng cho 20 người, và hình lính được vẽ to hơn thật;
- trận dài khoảng 11 giờ được phát trong vài phút;
- trang bị và màu sắc dựa theo nguồn và hiện vật, nhưng một số màu là lựa chọn để phân biệt các đạo quân.

### 3. Mục "Nguồn và ghi công"

Thêm, kèm link mở trong thẻ mới như các dòng hiện có:
- **Địa hình trận đánh:** câu ghi công và câu miễn trách nhiệm Copernicus **đúng từng chữ như README**, giữ tiếng Anh ở cả hai ngôn ngữ (giấy phép bắt buộc giữ hai câu này). Link tới giấy phép Copernicus DEM GLO-30.
- **Mô hình lính:** "Roman Soldier - T pose" và "Celt - rigged for UE4/5" của Andywoodhead (Sketchfab, CC BY 4.0), đã sửa đổi.
- **Ngựa:** "Horse" của Tarnyloo (Blend Swap, CC BY 3.0); khung xương và dáng đi từ "Horse Rigged All Gaits" của fdoss001 (Blend Swap, CC0); đã sửa đổi.
- **Hoạt hình:** Universal Animation Library của Quaternius (CC0).
- **Nguồn của trận:** Polybius 3.107–118, Livy 22.36–52. Có thể dẫn chung "xem tab Thông tin trận trong khung xem trận".

Tên tác phẩm, tên tác giả và câu ghi công Copernicus giữ nguyên tiếng Anh. Phần còn lại dịch sang tiếng Việt.

### 4. Mục "App này là gì"

Câu đếm dữ liệu ("59 sự kiện và 14 mốc biên giới") thêm số trận có cảnh 3D. Lấy từ dữ liệu, không viết cứng số.

### 5. Kiểm tra

- Hộp thoại vẫn mở, đóng, giữ focus như T-013; không có thanh cuộn thứ hai.
- Ở 390 px: không cuộn ngang.
- Đúng cả nền sáng lẫn tối.
- Mọi link mới mở trong thẻ mới, có `rel="noreferrer"`.
- So từng chữ câu Copernicus với README (bằng script, không bằng mắt).
- `npm run lint`, `npm run build`, `npm run validate` qua.

## Ràng buộc

- Không sửa store, `src/lib/` (trừ khoá `about.*`), `src/data/`, `src/app/`, README. README do phiên chính giữ; cần đổi thì ghi đề nghị.
- Không thêm thư viện npm.

## Xong khi

- Hộp thoại Giới thiệu nói về trận đánh 3D trong các mục Cách dùng, Độ chính xác, Nguồn và ghi công, ở cả hai ngôn ngữ.
- Câu Copernicus khớp từng chữ với README.
- Ảnh chụp (ngoài repo): tiếng Anh nền sáng, tiếng Việt nền tối, 390 px.

## Kết quả

_(Lane điền khi xong.)_
