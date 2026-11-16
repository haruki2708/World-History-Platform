# T-016: Dữ liệu trận Cannae, địa hình, tìm mô hình ngựa và hoạt hình

- **Lane:** 2
- **Model đề xuất:** Opus 5.5, effort `high`.
- **Nhánh:** `lane2/T-016-cannae-data` (đã tạo sẵn từ `main`)
- **Phạm vi file:** `src/data/battles/`, `public/data/terrain/`, `scripts/battles/`, `docs/data/battles/`

## Mục tiêu

Soạn dữ liệu để cảnh 3D (lane 3, T-015) dựng lại trận Cannae năm 216 TCN qua 6 giai đoạn, trên địa hình thật. Đồng thời tìm hai thứ cho đợt B: mô hình ngựa, và thư viện hoạt hình có giấy phép dùng được.

## Đọc trước

- `CLAUDE.md`, mục "Nội dung lịch sử".
- `docs/ARCHITECTURE.md`, mục "Trận đánh 3D": toạ độ, thời gian, quân số, định dạng địa hình.
- `src/lib/battle.ts`: kiểu `Battle` và các kiểu đi kèm.
- `docs/data/SOURCES.md`: cách các lane trước khảo sát nguồn và đọc giấy phép. Làm theo cùng chuẩn.
- Dữ liệu mẫu hiện có: `src/data/battles/battle-of-cannae.json` (dữ liệu tạm, sẽ thay toàn bộ) và `src/data/battles/unit-types.json`.

## Yêu cầu

### 1. Dữ liệu trận: `src/data/battles/battle-of-cannae.json`

Thay toàn bộ dữ liệu tạm. Giữ id `battle-of-cannae`.

- **Nguồn chính:** Polybius 3.107–118 và Livy 22.40–52. Đối chiếu thêm Appian và Plutarch (*Fabius*) nếu cần. Dùng tài liệu hiện đại để kiểm chứng; không chép văn bản.
- **Gốc toạ độ `origin`, các phe, chỉ huy, quân số và thương vong:**
  - Hai bên: Varro và Paullus đối đầu Hannibal, Hasdrubal, Hanno, Maharbal… theo nguồn.
  - Quân số và thương vong dùng `NumberRange`, ghi rõ nguồn nào cho số nào. Ví dụ số tử trận theo Polybius khác theo Livy.
- **Đơn vị:**
  - Chia đủ chi tiết để thấy chiến thuật: bộ binh La Mã và đồng minh ở giữa; kỵ binh La Mã sát sông; kỵ binh đồng minh ở cánh kia; lính nhẹ; lính Gaul và Iberia xếp lưỡi liềm; lính châu Phi ở hai cánh; kỵ binh nặng của Hasdrubal; kỵ binh Numidia.
  - Tổng `men` của mỗi phe khớp với `strength`. Script kiểm tra cho lệch tối đa 10%.
  - Sửa `unit-types.json` nếu cần, mỗi thay đổi kèm lý do. Nhớ rằng mô hình cho từng `model` sẽ do lane 1 dựng ở đợt B, nên đừng tách loại lính quá vụn.
- **`initial` và 6 giai đoạn:**
  1. dàn trận;
  2. lính nhẹ đụng độ;
  3. kỵ binh nặng của Hasdrubal đánh tan kỵ binh La Mã bên sông;
  4. bộ binh La Mã đẩy lõm giữa lưỡi liềm;
  5. lính châu Phi đánh hai sườn, kỵ binh vòng ra sau lưng;
  6. vòng vây khép lại.

  Mỗi giai đoạn ghi đủ trạng thái cuối của mọi đơn vị, mũi tên di chuyển, `endHour`, `playSeconds` (gợi ý 15–30 giây), tiêu đề và lời dẫn song ngữ tự viết (2–5 câu).
- **`uncertainty`:** nói rõ chỗ nào là phỏng dựng:
  - trận diễn ra ở bờ nào của sông Aufidus (còn tranh cãi);
  - sông ngày nay đã đổi dòng;
  - quân số;
  - vị trí đơn vị chỉ là ước lượng hợp lý theo mô tả của nguồn.
- **Ghi căn cứ:** viết căn cứ từng giai đoạn và từng lựa chọn quan trọng trong `docs/data/battles/cannae.md`. Mỗi chỗ chọn giữa các giả thuyết thì ghi giả thuyết đã chọn và lý do.

### 2. Địa hình: `public/data/terrain/battle-of-cannae.bin`

- **Vùng phủ:** đủ rộng cho cả trận và các trại, khoảng 10 × 8 km. Độ phân giải khoảng 30 m.
- **Định dạng:** đúng hợp đồng: Int16 little-endian, decimet, hàng từ bắc xuống nam. Cập nhật `width`, `height`, `minX..maxY` trong file trận.
- **Nguồn dữ liệu độ cao:** chỉ dùng nguồn thuộc phạm vi công cộng hoặc chỉ yêu cầu ghi công. Không dùng nguồn buộc dữ liệu dẫn xuất theo cùng giấy phép (share-alike), ví dụ OpenStreetMap (ODbL). Đọc giấy phép trực tiếp trên trang của nguồn rồi ghi vào `terrain.sources` và `docs/data/battles/cannae.md`.
  - SRTM của NASA/USGS thuộc phạm vi công cộng, nhưng một số kho tải bắt đăng nhập.
  - **Nếu nguồn cần tài khoản, dừng lại và hỏi người dùng**, không tự tạo tài khoản.
- **Script:** `scripts/battles/build-terrain.mjs` dựng lại lưới từ dữ liệu gốc. Dữ liệu gốc tải về để ngoài repo, ở `E:\World_History_Platform_assets\terrain\`. Không thêm thư viện npm.
- **Sông và địa danh:**
  - Sông Aufidus (Ofanto) vẽ theo dòng chảy hiện nay, đặt `approximate: true`.
  - Đồi và thành Cannae, hai trại La Mã, trại của Hannibal: vị trí ước lượng, đặt `approximate`.

### 3. Tìm nguồn cho đợt B: ghi vào `docs/data/battles/ASSETS.md`

- **Mô hình ngựa:**
  - Tả thực, hợp với phong cách của mô hình lính Andywoodhead. Tốt nhất là đã có khung xương và hoạt hình đi, chạy.
  - Giấy phép cho phép dùng và sửa: CC0 hoặc CC BY. Không dùng giấy phép NC (cấm thương mại), ND (cấm sửa), hay mô hình trích từ game.
  - Liệt kê 3–5 ứng viên: link, tác giả, giấy phép đọc trực tiếp trên trang, số tam giác, có khung xương không, nhận xét.
- **Thư viện hoạt hình người:**
  - Phải gắn được vào **khung xương chuẩn Unreal (UE mannequin)**, xem danh sách xương trong `docs/tasks/T-014-roman-legionary-model.md`.
  - Cần: đứng, đi, chạy, đâm kiếm hay giáo, ngã.
  - Giấy phép cho phép đưa hoạt hình vào file `.glb` công khai trong repo. Ví dụ Mixamo có điều khoản riêng của Adobe, phải đọc kỹ trước khi đề xuất.
  - Liệt kê ứng viên theo cùng cách như mô hình ngựa.
- **Chỉ tìm và đánh giá.** Không tải file vào repo.

### 4. Kiểm tra dữ liệu

- `scripts/battles/validate-battles.mjs` (phiên chính viết sẵn, `npm run validate` đã gọi) giờ thuộc lane 2.
- Mở rộng nếu cần. Ví dụ: các đơn vị cùng phe không chồng lên nhau quá nhiều ở cùng một thời điểm; mọi giai đoạn có ít nhất một đơn vị đổi trạng thái.

## Ràng buộc

- Tóm tắt và lời dẫn tự viết, không chép nguyên văn từ nguồn.
- Không bịa nguồn. Số liệu nào không chắc thì ghi khoảng và nguồn của từng con số.
- Không sửa `src/lib/battle.ts`. Kiểu dữ liệu chưa đủ dùng thì ghi đề nghị vào mục "Kết quả".
- Không thêm thư viện npm.

## Xong khi

- `npm run validate`, `npm run lint`, `npm run build` qua.
- `/battle-lab` (`npm run dev`) mở được dữ liệu mới. Engine của lane 3 có thể chưa xong, khi đó trang hiện chỗ giữ chỗ là đúng; quan trọng là dữ liệu nạp được và hợp lệ.
- Có `docs/data/battles/cannae.md` và `docs/data/battles/ASSETS.md`.

## Kết quả

Lane 2, 2026-11-16. Nhánh `lane2/T-016-cannae-data`.

### Đã làm

- **Dữ liệu trận** (`src/data/battles/battle-of-cannae.json`): thay toàn bộ dữ liệu tạm.
  - 22 đơn vị: 10 phía La Mã (86 200 người, gồm 10 000 ở lại trại lớn), 12 phía Hannibal (50 000). Lưỡi liềm chia 5 khối Gaul và Iberia xen kẽ như Polybius 3.114.
  - Quân số và thương vong là `NumberRange`, `note` ghi rõ số nào của Polybius, số nào của Livy.
  - `initial` và 6 giai đoạn theo đúng thứ tự task yêu cầu, mỗi giai đoạn đủ trạng thái 22 đơn vị, có mũi tên. Giờ từ 5:30 tới 17:00, phát tổng cộng 140 giây.
  - Tổng số hình lính khoảng 6 800 (20 người một hình), dưới mục tiêu 7 000 của T-015.
- **Chọn bờ sông:** trận ở bờ phải (bờ đông) của Aufidus, trên đồng bằng đông bắc Cannae, nơi sông ngày nay có một đoạn chảy về hướng bắc. Ở đó quân La Mã quay mặt về nam thì sông nằm bên phải họ, đúng như Polybius và Livy tả. Lý do và các giả thuyết khác ghi ở `docs/data/battles/cannae.md`, mục 3. Gốc toạ độ đặt ở giữa hai chiến tuyến, cách thành Cannae 6,2 km.
- **Địa hình** (`public/data/terrain/battle-of-cannae.bin`):
  - Lưới 341 × 271 điểm, cách nhau 30 m, vùng phủ 10,2 × 8,1 km, gồm chiến trường, 3 trại, chỗ vượt sông và thành Cannae.
  - Nguồn: Copernicus DEM GLO-30 từ kho AWS công khai, không cần tài khoản.
  - Sông Aufidus dò từ chính dữ liệu độ cao, theo dòng chảy ngày nay, `approximate: true`. Thành, đồi Cannae, ba trại, ba chỗ vượt sông đều `approximate`.
- **Script** `scripts/battles/build-terrain.mjs`, không thêm thư viện npm:
  - Đọc GeoTIFF (Int16 và Float32), dựng lưới.
  - Dò lòng sông (`--trace`).
  - Vẽ ảnh xem trước địa hình kèm khung các khối quân của từng giai đoạn (`--preview --phase n`).
  - Có nguồn dự phòng SRTM (`--source srtm`).
- **Kiểm tra** `validate-battles.mjs`, thêm ba kiểm tra:
  - các khối cùng phe không chồng nhau quá 25%;
  - mỗi giai đoạn phải có đơn vị đổi trạng thái;
  - điểm của sông nằm trong địa hình.
- **`unit-types.json`:** thêm `light-spearmen` (lính giáo nhẹ). Polybius 3.113 tả lính ném đá và lính giáo đi trước quân Hannibal, mà chưa có loại nào hợp. Loại này dùng chung mô hình `iberian-infantry` để lane 1 không phải dựng thêm.
- **Tài liệu:**
  - `docs/data/battles/cannae.md`: nguồn đã đọc, mọi lựa chọn kèm lý do, khảo sát nguồn độ cao và giấy phép.
  - `docs/data/battles/ASSETS.md`: 5 ứng viên mô hình ngựa, 4 thư viện hoạt hình, kèm danh sách đã loại và lý do.

### Kiểm tra

- `npm run validate`, `npm run lint`, `npm run build`: qua.
- `/battle-lab` (`npm run dev`, Chrome không giao diện, 1280×800): dữ liệu nạp được, thanh dưới hiện "05:30" và "1/6 · The armies deploy". Cảnh 3D còn là chỗ giữ chỗ vì T-015 chưa xong. File địa hình được phục vụ đúng 184 822 byte.
- Soát bằng mắt vị trí các khối quân của cả 7 thời điểm trên ảnh xem trước địa hình.
- Đối chiếu bản Latin của Livy: bản dịch Roberts (trên Perseus) dịch ngược hướng quân ở 22.46.8. Dữ liệu theo bản Latin, tức La Mã quay về nam (ghi ở `cannae.md`).

### Chưa xong, còn mở

- **Giấy phép Copernicus, cần phiên chính quyết:**
  - Giấy phép cho dùng, sửa, phân phối; không share-alike, không cấm thương mại.
  - Nhưng ngoài câu ghi công còn buộc kèm một câu miễn trách nhiệm, và buộc người nhận lại tuân theo cùng các nghĩa vụ đó. Tức là không "chỉ ghi công" thuần như CC BY.
  - Nếu muốn tránh: `node scripts/battles/build-terrain.mjs --source srtm` cho lưới SRTM cùng khung, cùng kích thước. Nhược điểm: SRTM nhiễu khoảng ±2 m trên đồng bằng và không thấy lòng sông.
  - Cũng chưa đọc được trực tiếp câu "public domain" của SRTM trên trang USGS (lỗi 405/403).
- **Hoạt hình:** điều khoản Mixamo (trang FAQ của Adobe lỗi 403) và CMU mocap (lỗi chứng chỉ TLS) chưa đọc được, nên không đề xuất hai nguồn này.
- **Ngựa:** ngựa CC0 tốt nhất (BlendSwap 28627) có bình luận nói lưới gốc là của tác giả khác; phải đọc giấy phép mô hình gốc trước khi dùng.
- **Chưa thử với cảnh 3D thật.** Khi T-015 xong, cần xem lại tốc độ chuyển động, độ dày khối quân và mũi tên.

### Đề nghị ngoài phạm vi

1. **Ghi công** khi trận đánh vào app chính (hộp thoại Giới thiệu, README; phiên chính và lane 1). Câu ghi công Copernicus đã nằm trong `terrain.sources`. Cần thêm câu miễn trách nhiệm: "The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM-30." Nếu dùng mô hình ngựa CC BY thì ghi công thêm.
2. **`package.json`** (phiên chính): có thể thêm `"terrain": "node scripts/battles/build-terrain.mjs"` cho tiện, như lệnh `borders`.
3. **Kiểu dữ liệu:** `battle.ts` đủ dùng, không cần đổi. Lưỡi liềm dựng bằng 5 khối có `facing` và `bulge` riêng. Nếu sau này cần lưỡi liềm liền một khối mà vẫn hai loại lính xen kẽ, có thể cân nhắc cho một `BattleUnit` mang nhiều `type`, nhưng hiện chưa cần.
4. **Bản đồ** (lane 2, đợt C): toạ độ sự kiện trong `events.json` là thành Cannae, còn `origin` của trận cách đó 6,2 km về phía đông bắc. Khi chuyển cảnh từ bản đồ vào trận, nên bay tới `origin` chứ không phải toạ độ sự kiện.
