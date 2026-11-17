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

Xong. Nhánh `lane1/T-029-about-battle`, hai commit:
- `9a9d067`: hộp thoại Giới thiệu;
- commit cuối: kết quả.

Chỉ sửa hai file: `src/components/shell/AboutDialog.tsx` và khoá `about.*` trong `src/lib/i18n/messages.ts` (cả `en` lẫn `vi`).

### Đã làm

**1. "Cách dùng"** (sau ý về sự kiện, vì nút xem trận nằm trong panel sự kiện):
- trận có cảnh 3D có nút “Xem trận đánh 3D” trong panel sự kiện; bản đồ bay tới chiến trường rồi khung xem trận mở;
- trong khung có phát, tua, lời dẫn theo giai đoạn, thông tin hai bên;
- phím vẽ bằng `<kbd>` như trong hộp thoại phím tắt: Space phát hoặc dừng, ← → sang giai đoạn trước hoặc sau, Esc đóng.

Tên nút lấy từ khoá `battle.open`. Danh sách trận ("hiện có: Trận Cannae") lấy từ dữ liệu: các sự kiện có `hasBattle(id)`, nối bằng `Intl.ListFormat`. Không có trận nào thì ý này ẩn.

**2. "Độ chính xác"**: một ý "Trận đánh 3D là phỏng dựng:" với bốn ý con:
- vị trí và đường đi của các khối quân dựa theo Polybius và Livy, nhiều chỗ còn tranh cãi, xem tab “Thông tin trận”;
- mỗi hình lính tượng trưng cho 20 người (số lấy từ `MEN_PER_FIGURE` trong `src/lib/battle.ts`) và được vẽ to hơn thật;
- trận Cannae kéo dài khoảng 11 giờ được phát trong vài phút;
- trang bị và màu sắc dựa theo sử liệu và hiện vật, một số màu chỉ là lựa chọn để phân biệt các đạo quân.

Tên tab lấy từ khoá `battle.viewer.tab.info` ("About the battle" / "Thông tin trận").

**3. "Nguồn và ghi công"**: một ý "Trận đánh 3D:" với năm ý con; mọi link mở thẻ mới, có `rel="noreferrer"` và chữ ẩn "mở trong thẻ mới" như các dòng cũ:
- **Địa hình trận đánh:** hai câu Copernicus đúng từng chữ như README, giữ tiếng Anh (`lang="en"`) ở cả hai ngôn ngữ; link "Copernicus DEM GLO-30" tới giấy phép;
- **Mô hình lính**, **ngựa**, **hoạt hình**: dùng đúng câu chữ của `battle.credits.models` (theo yêu cầu: ghi công ngựa dùng đúng dòng đó), tách thành ba ý; "Modified." / "Đã sửa đổi." ghi ở cả ý mô hình lính lẫn ý ngựa. Tên tác phẩm là link: "Roman Soldier - T pose", "Celt - rigged for UE4/5", "Horse", "Horse Rigged All Gaits", "Universal Animation Library", và hai giấy phép CC BY 4.0, CC BY 3.0. Link giống link của khung xem trận (`MODEL_CREDIT_LINKS`);
- **Nguồn của trận Cannae:** Polybius 3.107–118 và Livy 22.36–52 (link giống dữ liệu trận), cộng một câu "mỗi trận ghi nguồn riêng ở tab “Thông tin trận”".

Tên tác phẩm, tác giả và câu Copernicus giữ tiếng Anh; phần còn lại dịch.

**4. "App này là gì"**: câu đếm thêm số trận có cảnh 3D, lấy từ dữ liệu: "59 sự kiện, 14 mốc biên giới và 1 trận đánh xem được dạng 3D" / "59 events, 14 border snapshots and 1 battle to watch in 3D". Tiếng Anh chia số ít, số nhiều bằng `Intl.PluralRules` (khoá `about.what.battles.one`, `.other`).

### Kiểm tra

Dev server cổng 3101, Chrome không giao diện điều khiển qua DevTools. Kịch bản `s-about.mjs` (ngoài repo, ở `E:\World_History_Platform_assets\T-029\tools\`) chạy ba lần: tiếng Anh nền sáng 1280×800, tiếng Việt nền tối 1280×800, tiếng Việt 390×844 (giả lập điện thoại). Cả ba lần đều:
- **Mở, đóng, focus như T-013:** bấm nút Giới thiệu thì hộp thoại mở, focus nằm trong hộp thoại; Esc đóng và focus trở về nút Giới thiệu.
- **Một thanh cuộn:** trong hộp thoại chỉ có một vùng cuộn (thân hộp thoại).
- **Không cuộn ngang:** không phần tử nào trong hộp thoại rộng hơn khung của nó, trang không rộng hơn cửa sổ, kể cả ở 390 px.
- **Link:** 14 link trong hộp thoại, cả 14 có `target="_blank"` và `rel="noreferrer"`.
- **Câu Copernicus:** script đọc hai câu từ dòng "Battle terrain" của README và so với chữ hiển thị trong hộp thoại: khớp từng chữ, cả hai ngôn ngữ.
- **Ghi công mô hình, ngựa, hoạt hình:** script ghép chữ hiển thị của ba ý lại (bỏ chữ ẩn của link, gộp hai chữ "Modified." / "Đã sửa đổi." làm một như trong dòng gốc) rồi so với `battle.credits.models` đọc từ `messages.ts`: bằng nhau, cả hai ngôn ngữ.
- **Nền sáng và tối:** xem bằng mắt trên ảnh chụp; màu chỉ dùng token sẵn có.

`npm run lint`, `npm run validate`, `npm run build` đều qua.

**Ảnh chụp** (ngoài repo, `E:\World_History_Platform_assets\T-029\shots\`, mỗi ảnh chụp cả hộp thoại):
- `about-en-light.png`: tiếng Anh, nền sáng;
- `about-vi-dark.png`: tiếng Việt, nền tối;
- `about-vi-390.png`: tiếng Việt, 390 px.

### Ghi chú

- **Câu Copernicus lặp lại** ở `AboutDialog.tsx` (cùng câu với `src/components/battle/viewer/credits.ts` và README). Tôi không import từ `credits.ts` vì file đó nằm trong mảng trận đánh của lane khác. Comment ở cả hai chỗ ghi phải sửa cùng nhau; script ở trên kiểm tra được.
- **Phần viết riêng cho Cannae:** câu "trận Cannae kéo dài khoảng 11 giờ" và ý "Nguồn của trận Cannae". Thêm trận thứ hai thì phải sửa hai khoá `about.accuracy.battle.time` và `about.credits.battleSources`. Số trận và tên trận trong "Cách dùng" thì tự cập nhật theo dữ liệu.

### Đề nghị ngoài phạm vi

1. **Phiên chính:** chuyển các hằng ghi công dùng chung (hai câu Copernicus, link giấy phép, link các mô hình) sang một module trong `src/lib/` (ví dụ `src/lib/credits.ts`), để khung xem trận và hộp thoại Giới thiệu cùng import, khỏi chép hai nơi.
2. **README:** không cần sửa. Mục "Data credits" đã có đủ mô hình lính, ngựa, hoạt hình và địa hình, khớp với hộp thoại.
3. Không thêm thư viện npm; không sửa store, `src/data/`, `src/app/`, README.
