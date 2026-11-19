# T-056: Bản đồ nền thiếu hồ Trasimene

- **Lane:** 2
- **Model đề xuất:** Opus 5.5, effort `medium`. Task nhỏ về dữ liệu bản đồ.
- **Nhánh:** `lane2/T-056-map-lake-trasimene` (phiên chính đã tạo sẵn từ `main` trong worktree của bạn).
- **Phạm vi file:** `public/map/`, `src/components/map/` (kể cả `tools/build-basemap.mjs`).

## Bối cảnh

Trận hồ Trasimene đã vào app chính (T-052 và T-053 gộp 2026-11-19). Bấm "Xem trận đánh 3D" ở sự kiện năm 217 TCN thì bản đồ bay tới chiến trường, và cú bay chạy đúng. Nhưng **bản đồ không vẽ hồ**: trong khung chiến trường chỉ có một mảng màu thế lực (ảnh `E:\World_History_Platform_assets\duyet\K-bay-ban-do\trk-1-flying.png`). Một trận đánh bên hồ mà bản đồ không có hồ thì người xem khó hiểu.

Phiên chính đã kiểm `public/map/basemap.json`: quanh miền trung Ý chỉ có một hồ, hồ Bolsena (11,86–12,00° Đ, 42,54–42,65° B). Hồ Trasimene (khoảng 12,03–12,20° Đ, 43,08–43,20° B, rộng chừng 128 km², lớn hơn Bolsena) không có, dù `public/map/README.md` ghi bản đồ nền có hồ tự nhiên từ khoảng 1 km². Hồ này là hồ tự nhiên, có từ thời cổ.

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Tìm vì sao thiếu, rồi thêm hồ Trasimene vào bản đồ nền

- Xem `tools/build-basemap.mjs` và dữ liệu Natural Earth: hồ không có trong `ne_10m_lakes`, hay bị bước lọc hoặc đơn giản hoá bỏ đi?
- Ưu tiên lấy từ Natural Earth (phạm vi công cộng, không thêm ghi công). Natural Earth có file bổ sung `ne_10m_lakes_europe`; nếu hồ nằm ở đó thì thêm file này vào bước dựng, vẫn lọc hồ chứa và yếu tố hiện đại như hiện nay.
- Nếu Natural Earth không có hồ này, **dừng và ghi vào "Kết quả"**, đừng tự lấy nguồn khác. Nguồn khác (ví dụ đường bờ Copernicus của file trận) kéo theo việc ghi công, là việc phiên chính và người dùng quyết.
- Dựng lại `basemap.json` bằng script, không sửa tay. Ghi vào `public/map/README.md` những gì đổi ở nguồn và bước xử lý.

### 2. Kiểm các hồ khác

- Nếu thêm một file nguồn mới, sẽ có thêm hồ khác trong vùng bản đồ. Liệt kê các hồ mới xuất hiện và loại bỏ hồ nhân tạo hay hồ không có ở thời cổ, theo đúng cách script đang làm.
- Ghi vào "Kết quả" kích thước `basemap.json` trước và sau. Nếu file lớn hơn 15%, nêu lý do và cách giảm.
- Không thêm hồ đã mất từ thời cổ (ví dụ hồ Fucinus) ở task này; thấy đáng làm thì ghi đề nghị.

### 3. Hồ thấy được trong cú bay

- Trong khung chiến trường lúc bay tới và lúc bay về, hồ phải thấy rõ dưới lớp màu thế lực và khung chiến trường, ở cả nền sáng lẫn nền tối.
- Đường bờ của bản đồ nền thô hơn bờ hồ trong cảnh 3D (cảnh dùng dữ liệu Copernicus 30 m); lệch nhau một ít là chấp nhận được. Nếu lệch tới mức chiến trường nằm trên nước hay hồ nằm ngoài khung, ghi vào "Kết quả" kèm ảnh.

### 4. Kiểm tra và ảnh

- `npm run validate`, `npm run lint`, `npm run build` qua.
- Ảnh ở `E:\World_History_Platform_assets\duyet\T-056\`: bản đồ quanh miền trung Ý năm 217 TCN trước và sau (nền sáng và nền tối), và một ảnh lúc bay tới chiến trường. Driver chụp của phiên chính (`E:\World_History_Platform_assets\main-tools\drive`; kịch bản bay có sẵn: `s-transition-k.mjs`): đặt `PORT=9362`.
- Bản đồ ở các năm khác và các vùng khác không đổi ngoài các hồ mới.

### 5. Bờ hồ Trasimene theo file trận (người dùng chọn 2026-11-19, sau review)

Phiên chính đã review phần 1–4: đạt. Người dùng chọn cách (b) trong đề nghị 1 của bạn: hồ Trasimene trên bản đồ nền lấy đường bờ trong file trận, không lấy của Natural Earth. Làm tiếp trên cùng nhánh, rồi T-056 gộp một lượt.

- **Script** (`build-basemap.mjs`): thay hồ `ne_id` 1159109725 của Natural Earth bằng `terrain.lakes[0].outline` trong `src/data/battles/battle-of-lake-trasimene.json`.
  - Đọc thẳng file trận, không chép toạ độ vào script: file trận đổi bờ hồ thì dựng lại là xong.
  - Đổi mét ra kinh độ và vĩ độ bằng đúng phép đổi mà dự án đang dùng cho file trận (`origin`; x về phía đông, y về phía bắc), như `build-terrain.mjs`.
- **Đảo:** theo cùng quy tắc với phần còn lại của bản đồ nền (bỏ đảo dưới khoảng 1 km²). Ghi vào "Kết quả" đảo nào giữ, đảo nào bỏ.
- **Đơn giản hoá:** không dùng sai số chung 0,006° cho hồ này. Sai số đó khoảng 500 m, sẽ làm mất cái vừa sửa được. Bờ sau khi đơn giản hoá phải nằm trong khoảng 50 m so với đường bao của file trận. Ghi số điểm và kích thước `basemap.json` sau khi sửa.
- **Ghi công Copernicus:** bờ này lấy từ mặt nạ nước của Copernicus DEM, nên phải ghi nguồn.
  - Sửa khoá `map.legend.basemap` (cả `en` lẫn `vi`): nói thêm hồ, và nói hồ Trasimene theo Copernicus. Ví dụ: "Đường bờ biển, sông và hồ ngày nay (Natural Earth; hồ Trasimene theo Copernicus DEM, xem phần Giới thiệu)". Giữ ngắn như dòng hiện có.
  - `public/map/README.md`: ghi nguồn mới và cách dựng.
  - Phiên chính sửa README gốc, `docs/data/SOURCES.md` và dòng bản đồ nền trong hộp thoại Giới thiệu khi gộp.
- **Kiểm tra:**
  - Làm lại ảnh 13 với bờ mới: đoàn quân La Mã lúc đầu trận không còn nằm trên nước.
  - Chụp lại ảnh bay tới, và miền trung Ý ở hai mức phóng (sau khi sửa), cả hai nền.
  - Biển, sông và các hồ khác giống hệt từng byte so với bản phần 1–4.
  - `npm run validate`, `npm run lint`, `npm run build` qua.
- Điền thêm vào "Kết quả", commit, rồi báo.

## Ràng buộc

- Chỉ sửa file trong phạm vi. Không sửa file trận và cảnh 3D.
- Không thêm thư viện. Không thêm nguồn dữ liệu có điều kiện ghi công mà chưa hỏi.

## Xong khi

- Hồ Trasimene có trên bản đồ nền và thấy được trong cú bay, hoặc mục "Kết quả" nói rõ vì sao Natural Earth không đủ và đề nghị nguồn khác.
- Các kiểm tra ở mục 4 qua; có ảnh; mục "Kết quả" đã điền.

## Kết quả

(Lane 2 điền khi xong.)
