# T-019: Hoạt hình thật cho mọi loại lính, nâng lính La Mã, thêm hastatus

- **Lane:** 1
- **Model đề xuất:** Fable 5.2, effort `high`. Hết hạn mức thì dùng Opus 5.5, effort `xhigh`.
- **Nhánh:** `lane1/T-019-animations-hastatus` (tạo từ `main` mới nhất)
- **Phạm vi file:** `art/` (trừ các file ngựa của lane 2, xem dưới), `public/battles/models/`

## Bối cảnh

Đợt A đã gộp. Người dùng xem ảnh lính La Mã của T-014 và duyệt làm đợt B. Kế hoạch đợt B (`docs/PLAN.md`):

| Task | Lane | Việc |
|---|---|---|
| **T-019** | 1 | **Task này:** thư viện hoạt hình dùng chung, nâng lính La Mã, thêm hastatus |
| T-020 | 2 | Ngựa |
| T-021 | 1 | 6 loại bộ binh: triarii, velites, Gaul, Iberia, Libya, lính ném đá Baleares |
| T-022 | 1 | 3 loại kỵ binh |

Vì vậy, ngoài hai mô hình của task này, **quy trình phải dễ dùng lại cho 9 mô hình sau**.

**Lane 2 làm ngựa song song trong `art/`**, chỉ ở các file riêng:
- `art/blender/horse_*.py`;
- `art/renders/horse/`;
- `art/build/horse/`.

Lane 2 có thể import các module chung `whp_*.py` của bạn nhưng không sửa chúng. Nếu bạn đổi tên hay chữ ký hàm trong `whp_*.py`, ghi vào mục "Kết quả".

## Đọc trước

- `docs/ARCHITECTURE.md`, mục "Mô hình lính". Mới cập nhật:
  - danh sách mô hình `public/battles/models/index.json`;
  - ảnh độ nhám và kim loại;
  - không có chuyển động gốc.
- `docs/data/battles/ASSETS.md`, mục "Thư viện hoạt hình người": lane 2 đã khảo sát.
- `docs/tasks/T-014-roman-legionary-model.md`, mục "Kết quả": nhất là "Còn chưa ưng ý".
- `art/README.md` và `art/CREDITS.md`.

## Yêu cầu

Commit sau mỗi bước. Nếu sắp hết hạn mức thì ghi bảng tiến độ vào mục "Kết quả" rồi commit, như T-014.

### 1. Thư viện hoạt hình dùng chung

**Nguồn: Universal Animation Library của Quaternius (CC0).**
- Bản 1 cho đứng, đi, chạy, ngã.
- Bản 2 cho đòn đánh, nếu cần.

**Tải về:**
- Đọc giấy phép trực tiếp trên trang trước khi tải.
- Tải về `E:\World_History_Platform_assets\sources\quaternius-ual\`, ngoài repo. Ghi nguồn và ngày tải vào `E:\World_History_Platform_assets\README.txt`.
- **Nếu trang bắt đăng nhập hay tạo tài khoản: dừng lại, hỏi người dùng.** Người dùng sẽ tự tải về đúng thư mục.

**Ghép vào khung xương chung:**
- So tên và hướng xương của thư viện với khung 67 xương của mô hình Celt.
- Viết bước đổi đích (retarget) bằng script, chạy lại từ đầu được.

**Clip cần có cho mọi người lính:**
- `idle`, `walk`, `run`, `die`;
- vài kiểu `attack` để mỗi mô hình chọn một: đâm kiếm sau khiên, đâm giáo, phóng lao hay vung dây ném đá. Tên trong file `.glb` vẫn là `attack`.

**Các yêu cầu khác:**
- **Tay cầm khiên.** Khiên gắn cứng vào bàn tay trái. Hoạt hình của thư viện vung tay tự do thì khiên sẽ văng lung tung, nên phải giữ hay chỉnh tay trái để khiên ở trước người.
- **Không có chuyển động gốc**, lặp liền mạch. Ghi độ dài một vòng `walk` và `run` trong `art/README.md`.
- **`die`:** ngã xuống và nằm yên ở khung cuối. Cảnh giữ khung cuối vài giây.
- Không dùng được thư viện này thì ghi lý do và đề xuất cách khác. Cách tạm là keyframe tự làm như T-014.

### 2. Nâng `roman-legionary`

- Thay ba clip tạm bằng năm clip thật: `idle`, `walk`, `run`, `attack` (đâm kiếm sau khiên), `die`.
- **Ảnh độ nhám và kim loại** 1024×1024 (glTF `metallicRoughnessTexture`) để mũ đồng, núm khiên, viền khiên và giáp lưới trông như kim loại; da, vải, gỗ thì không. Lane 3 đang thêm phần đọc ảnh này trong T-018.
- Nên làm thêm nếu còn sức: atlas đang dùng 52% ảnh màu, xếp chặt hơn để mặt và giáp nét hơn.

### 3. Mô hình mới `roman-hastatus`

Hastati là hàng lính trẻ, nghèo hơn. Polybius 6.23 chép:
- số đông đeo một **tấm đồng vuông che ngực** (*pectorale*, khoảng 20 × 20 cm, buộc bằng dây da), không mặc giáp lưới;
- mang **hai cây lao *pilum*** (cán gỗ, mũi sắt dài);
- có **tấm che ống chân**;
- mũ có ngù ba lông như lính La Mã hiện có.

Cách làm:
- Dựng từ `roman-legionary`: thay giáp lưới bằng áo và tấm đồng che ngực; thêm *pilum* và tấm che ống chân.
- Cầm *pilum* thế nào cho hợp với khiên và kiếm thì lane tự chọn, ghi lý do. Ví dụ: tay phải cầm kiếm, tay trái giữ *pilum* sau khiên.
- Hình dáng chỉ tham khảo hiện vật bảo tàng và tranh thuộc phạm vi công cộng. Ghi nguồn tham khảo.
- Khi gộp, phiên chính sẽ đổi `roman-hastati` trong `unit-types.json` sang mô hình này. Principes và đồng minh vẫn dùng `roman-legionary`.

### 4. Quy trình dùng lại được

- Tách phần chung (nhập nguồn, khung xương, LOD, bake, hoạt hình, xuất, kiểm tra, render ảnh duyệt) khỏi phần riêng của từng mô hình, để T-021 thêm 6 mô hình nhanh.
  - Ví dụ: mỗi mô hình một file cấu hình hay một module nhỏ, dùng chung các giai đoạn.
- Script xuất **tự cập nhật `public/battles/models/index.json`**: thêm id mô hình vừa xuất, giữ thứ tự chữ cái.
  - `npm run validate` sẽ báo lỗi nếu danh sách lệch với các file `.glb`.
- Chạy lại từ đầu vẫn phải ra file `.glb` giống hệt từng byte, như T-014.

### 5. Ảnh duyệt

Đặt trong `art/renders/<model>/`, JPEG, mỗi ảnh tối đa 400 KB, render từ chính file `.glb`.

- **Hoạt hình mới:** mỗi clip ba khung hình, cho cả hai mô hình.
- **`roman-hastatus`:** nhìn trước, nghiêng và sau; cận ngực và *pilum*; đặt cạnh `roman-legionary`.
- **Kim loại:** ảnh trước và sau khi có ảnh độ nhám và kim loại. Render bằng EEVEE có thể khác cảnh three.js; lane 3 sẽ chụp trong cảnh thật.

### 6. Ghi công

Cập nhật `art/CREDITS.md`:
- thư viện Quaternius: CC0, không bắt ghi công nhưng vẫn ghi cho minh bạch;
- những gì đã sửa thêm ở `roman-legionary`;
- mục mới cho `roman-hastatus`.

## Ràng buộc

- Như T-014:
  - không đưa file gốc (FBX, glTF gốc của thư viện, ảnh vật liệu gốc, `.blend`) vào repo;
  - không dùng tài sản chưa đọc giấy phép;
  - không dùng tài sản trích từ game;
  - không sửa `src/`;
  - không thêm thư viện npm.
- Lane 3 có thể đang đo hiệu năng. Bake bằng Cycles thì giữ CPU, và không để `blender.exe` chạy khi không cần.

## Xong khi

- `roman-legionary.glb` và `roman-hastatus.glb` đều đúng hợp đồng:
  - một khung xương 67 xương;
  - `LOD0..2` trong giới hạn tam giác;
  - một vật liệu;
  - năm clip `idle`, `walk`, `run`, `attack`, `die`;
  - mỗi file tối đa 4 MB.
- `index.json` liệt kê cả hai. `npm run validate`, `npm run lint`, `npm run build` qua.
- Chạy lại script từ đầu ra file giống hệt từng byte.
- Có đủ ảnh duyệt và ghi công.

## Kết quả

_(Lane 1 điền khi xong. Kèm danh sách ảnh duyệt và những chỗ còn chưa ưng ý.)_
