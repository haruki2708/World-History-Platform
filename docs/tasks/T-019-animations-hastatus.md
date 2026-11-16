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

Xong cả 6 bước, ngày 2026-11-16. Nhánh `lane1/T-019-animations-hastatus`, chưa gộp vào `main`.

### Đối chiếu với "Xong khi"

| Yêu cầu | `roman-legionary` | `roman-hastatus` |
|---|---|---|
| Một khung xương 67 xương | 1 skin, 67 xương | 1 skin, 67 xương |
| LOD0 ≤ 8 000, LOD1 ≤ 1 500, LOD2 ≤ 300 tam giác | 7 483 / 1 360 / 296 | 7 340 / 1 301 / 294 |
| Một vật liệu | ảnh màu 2048 (630 KB), pháp tuyến 1024 (203 KB), độ nhám/kim loại 1024 (84 KB) | ảnh màu 2048 (410 KB), pháp tuyến 1024 (158 KB), độ nhám/kim loại 1024 (87 KB) |
| Năm clip | `idle` 2,5 s, `walk` 1,333 s, `run` 0,933 s, `attack` 1,0 s, `die` 2,4 s | như bên trái |
| Tối đa 4 MB | 2,06 MB (2 163 240 byte) | 1,78 MB (1 867 048 byte) |
| `index.json` liệt kê cả hai | `{"models": ["roman-hastatus", "roman-legionary"]}`, do script xuất tự thêm | |
| Chạy lại từ đầu ra file giống hệt từng byte | `build_model.py -- --model all` chạy hai lần (240 s, 209 s), cùng SHA-256 `65450d62…2773b` | cùng SHA-256 `df2ef129…514ce` |
| `npm run validate`, `lint`, `build` | qua; `validate` có một cảnh báo đã biết: `roman-hastatus` chưa là mô hình của loại lính nào (xem đề nghị 1) | |
| Ảnh duyệt, ghi công | 14 ảnh; `art/CREDITS.md` | 15 ảnh; `art/CREDITS.md` |

### Thư viện hoạt hình

- **Tải về:** Universal Animation Library 1 và 2 (Quaternius), bản Standard, từ itch.io. Trang có nút "No thanks, just take me to the downloads", không bắt đăng nhập hay tạo tài khoản. Hai file zip ở `E:\World_History_Platform_assets\sources\quaternius-ual\`, giải nén vào `unzipped\`. Nguồn, ngày tải và SHA-256 của hai file zip ghi trong `E:\World_History_Platform_assets\README.txt`.
- **Giấy phép:** CC0 1.0, đọc trên trang Quaternius, trang itch.io và trong `License.txt` của mỗi file zip.
- **Khung xương của thư viện:** 65 xương, đúng tên kiểu Unreal như khung Celt, trừ `Head` viết hoa; không có xương xoắn, không có xương IK; tư thế nghỉ chữ T; 30 khung/giây. Bản không `_RM` đi tại chỗ.
- **Đổi đích:** script `whp_ual.py` + `whp_retarget.py`, chạy lại từ đầu được. Cách làm ghi ở `art/README.md`, mục "Thư viện hoạt hình". Điểm chính:
  - thân và tay theo hướng xương với khung giải phẫu hai vector, nên bù được chữ T và chữ A;
  - chân giải bằng IK theo vị trí mắt cá, vì khung Celt đứng dạng chân 39 cm.
- **Clip chọn:** xem ảnh mẫu của thư viện thì các clip kiếm (`Sword_Attack`, `Sword_Regular_*`, `Sword_Dash`) đều chém vòng, xoay, nhảy, không hợp lính giữ đội hình. Dùng:
  - `Idle_Loop`, `Walk_Loop`, `Jog_Fwd_Loop`, `Death01`;
  - `Punch_Cross` làm nền cho cú đâm: đấm thẳng tay phải, chân trái trước, xoay hông;
  - `OverhandThrow` cho phóng lao và ném đá.
- **Kiểu tấn công có sẵn** (`whp_clips.ATTACKS`): `sword-thrust` (hai mô hình này dùng), `spear-thrust`, `javelin-throw`, `sling`. Ảnh `art/renders/animation-library/attack-styles.jpg`.
- **Tay cầm khiên:** tay trái giải lại bằng IK, khiên theo ngực một phần nên không văng khi thân xoay. Đã quét mọi khung của năm clip trên mô hình chi tiết để xem có gì cắm xuống đất:
  - `idle`, `walk`, `run`, `attack`: không có gì thấp hơn −2,1 cm (đế dép);
  - `die` ở khung cuối: không có gì thấp hơn −2 cm.
- **Độ dài một vòng:**
  - `walk` 1,333 s đi được **1,00 m** (0,75 m/s);
  - `run` 0,933 s đi được **1,99 m** (2,13 m/s).

  Đo từ chính clip đã đổi đích. Đã ghi trong `art/README.md`.

### Đã làm gì

1. **Thư viện hoạt hình dùng chung:**
   - `whp_ual.py` đọc thẳng file `.glb` của thư viện bằng numpy;
   - `whp_retarget.py` đổi đích;
   - `whp_clips.py` dựng năm clip và bốn kiểu tấn công;
   - `whp_anim.Poser` có thêm `set_rotation`, `place`, `turned`, `limb` (IK hai đoạn dùng chung).
2. **`roman-legionary`:**
   - năm clip thật thay ba clip tạm (đã xoá `roman_anims.py`);
   - ảnh độ nhám và kim loại 1024: đồng, sắt, giáp lưới, lưỡi kiếm là kim loại; da, vải, gỗ thì không;
   - atlas xếp chặt hơn: 79% điểm ảnh ảnh màu có dùng, trước là 52%. Các mảnh được xếp với khoảng hở cố định 3 điểm ảnh thay cho kiểu "scaled" của Blender;
   - bao kiếm đi theo nửa hông, nửa đùi phải, nên khi nằm không cắm xuống đất;
   - LOD tự dọn vài mặt trùng sau khi giảm lưới, hết cảnh báo của bộ xuất glTF.
3. **`roman-hastatus`:**
   - dựng từ cùng mô hình nền, mũ, khiên, kiếm, đai;
   - không giáp lưới; thêm tấm đồng vuông 22 cm che ngực có gờ và núm, dây da qua vai và đai quanh ngực;
   - hai tấm che ống chân bằng đồng, dựng theo đường bao của chân và quai dép;
   - hai cây *pilum* khoảng 2 m: cây to tán vào khối gỗ vuông, cây mảnh có ống tra cán.

   **Cách cầm *pilum*:** tay trái giữ hai cây dựng đứng sau khiên, tay phải giữ kiếm. Lý do:
   - clip `attack` là cú đâm kiếm sau khiên, hợp với cảnh giáp lá cà;
   - hastati ném *pilum* rồi mới rút kiếm, mà file chỉ có một clip `attack`;
   - *pilum* nhô cao hơn đầu một khúc, nên nhìn từ xa phân biệt được hastati với principes.
4. **Quy trình dùng lại được:**
   - `build_model.py -- --model <id>|all` chạy `whp_build.py`, gồm sáu giai đoạn chung, bước kiểm tra và cập nhật `index.json`;
   - mỗi mô hình là một module nhỏ `unit_<id>.py`; phần chung của lính La Mã ở `roman_kit.py`;
   - giai đoạn LOD thành `whp_unit_lod.py`;
   - `render_review.py` đánh số ảnh theo danh sách `REVIEW` của từng mô hình;
   - cách thêm mô hình cho T-021 ghi ở `art/README.md`.
5. **Ảnh duyệt:** danh sách ở dưới.
6. **Ghi công:** `art/CREDITS.md` có mục thư viện Quaternius, những gì sửa thêm ở `roman-legionary`, mục mới cho `roman-hastatus`, dòng ghi công gợi ý cập nhật.

### Ảnh để duyệt

`art/renders/roman-legionary/` (render từ file `.glb`):

| Ảnh | Nội dung |
|---|---|
| `01-front-side-back.jpg` | Nhìn trước, nghiêng (phía khiên), sau; đứng (`idle`) |
| `02-three-quarter.jpg` | Nhìn chéch từ phía kiếm |
| `03-head-front.jpg`, `04-head-side.jpg` | Cận đầu và mũ |
| `05-formation.jpg` | 20 lính dàn đội hình, lệch nhịp nhau |
| `06-lods.jpg` | LOD0, LOD1, LOD2 |
| `07-anim-idle.jpg`, `08-anim-walk.jpg`, `09-anim-run.jpg`, `10-anim-attack.jpg`, `11-anim-die.jpg` | Ba khung hình mỗi clip (`attack`: thủ thế, giữa chừng, lúc đâm xa nhất; `die`: đầu, đang ngã, khung cuối) |
| `12-metal-before-after.jpg` | Trái: không có ảnh độ nhám/kim loại (như T-014). Phải: như đã xuất |
| `13-compare-source.jpg` | Mô hình gốc 07; mô hình mới ở tư thế gốc; mô hình mới đứng |
| `14-test-poses.jpg` | Tư thế thử khung xương |

`art/renders/roman-hastatus/` (render từ file `.glb`):

| Ảnh | Nội dung |
|---|---|
| `01-front-side-back.jpg` | Nhìn trước, nghiêng, sau |
| `02-three-quarter.jpg` | Nhìn chéch từ phía kiếm |
| `03-head-front.jpg`, `04-head-side.jpg` | Cận đầu và mũ |
| `05-formation.jpg` | 20 lính dàn đội hình |
| `06-lods.jpg` | LOD0, LOD1, LOD2 |
| `07-anim-idle.jpg` … `11-anim-die.jpg` | Ba khung hình mỗi clip |
| `12-metal-before-after.jpg` | Trước và sau ảnh độ nhám/kim loại |
| `13-chest-pilum.jpg` | Trái: cận ngực (tấm đồng, dây da). Phải: hai cây *pilum* trong tay trái sau khiên, nhìn từ sau |
| `14-beside-roman-legionary.jpg` | `roman-legionary` cạnh `roman-hastatus`: nhìn trước, rồi nhìn nghiêng |
| `15-test-poses.jpg` | Tư thế thử khung xương |

`art/renders/animation-library/attack-styles.jpg`: ba kiểu tấn công chưa mô hình nào dùng, mỗi hàng một kiểu (từ trên xuống: `spear-thrust`, `javelin-throw`, `sling`), mỗi kiểu ba khung, trên mô hình chi tiết của lính La Mã cầm kiếm (render từ file `.blend` trung gian, không phải `.glb`).

### Còn chưa ưng ý

1. **`die` giữa lúc ngã:**
   - mép khiên chạm đất tối đa 3 cm trong 1–2 khung;
   - với hastatus, đầu *pilum* chạm đất tối đa 7 cm trong 2–3 khung.

   Khung cuối thì sạch.
2. **`walk` khá chậm** (0,75 m/s, theo clip của thư viện). Cảnh muốn đi nhanh hơn thì tăng tốc độ phát; công thức ở `art/README.md`.
3. **Ba kiểu tấn công `spear-thrust`, `javelin-throw`, `sling` mới chỉnh sơ:**
   - mới thử trên lính La Mã cầm kiếm;
   - dây ném đá là vật cứng: khi quay, tay xoay dây hướng ra ngoài vòng quay.

   T-021 phải chỉnh lại khi có mô hình thật.
4. **Tấm che ngực:**
   - không tìm được hiện vật bảo tàng nào là tấm vuông; dáng theo văn bản Polybius, gờ và núm là chi tiết tự thêm;
   - nhìn rất gần, mép tấm hơi gợn do ảnh pháp tuyến;
   - đặt giữa ngực, không lệch hẳn sang tim.
5. **Tấm che ống chân:**
   - trông hơi thô, to bản vì ôm cả quai dép;
   - mép trên phẳng, chưa uốn theo gối;
   - phía sau hở, nhìn từ sau thấy bắp chân.
6. **Tư thế gốc** (không phát clip) của hastatus: *pilum* chĩa chéo lên cạnh đầu. Cảnh luôn phát ít nhất `idle` nên không thấy.
7. **LOD2:** bàn tay trái của hình khối lòi qua khiên, ở cả hai mô hình (như T-014).
8. **Đai lưng của hastatus** cách áo 1,4 cm: đai làm cho người mặc giáp lưới, dùng lại nguyên.
9. **Hai mô hình cùng một khuôn mặt và dáng người** (cùng mô hình nền).
10. **Còn theo mô hình nền từ T-014:**
    - kiếm và bao kiếm dáng muộn hơn *gladius hispaniensis*;
    - xăng đan kiểu *caligae*;
    - áo đỏ.
11. **Màu gốc của kim loại khá tối.** Đồng và sắt chỉ sáng ánh kim khi cảnh có ánh sáng môi trường; ảnh EEVEE có thể khác three.js.

### Thay đổi ở các module `whp_*.py` (cho lane 2)

**Không đổi:** `whp_common`, `whp_skeleton`, `whp_skin`, `whp_proxy`, `whp_render`, `whp_mesh`.

**Thêm, giữ tương thích:**
- `whp_anim.Poser`: thêm `set_rotation`, `place`, `turned`, `limb`. `leg()` giữ chữ ký cũ, giờ gọi `limb()`.
- `whp_lod.unwrap_atlas(parts, margin=0.003, pixels=None, size=2048)`: mặc định như cũ; truyền `pixels` thì xếp với khoảng hở cố định.
- `whp_lod.final_material(..., surface_image=None)`: thêm ảnh độ nhám/kim loại nếu có.
- `whp_lod`: thêm `SurfaceSwap` và `METAL_FROM_GREY`.
- `whp_export.check_glb`: kiểm thêm kích thước ảnh độ nhám/kim loại.
- `whp_export.reimport(path, lods, ground=GROUND_CHECKS)`: mặc định giờ thử tư thế với mặt đất cho các clip `idle`, `walk`, `die` nếu file có. Khi file có các clip này thì chiều cao đỉnh phải trong 1,5–2,3 m (`idle`, `walk`), dưới 0,75 m (`die` khung cuối). Với ngựa thì truyền `ground=()` hoặc ngưỡng riêng.
- `whp_materials`: đồng, sắt, giáp lưới giờ có `Metallic` (1,0 / 1,0 / 0,85) và độ nhám mới. Ảnh màu bake bằng `EmissionSwap` không đổi.

**Mới:** `whp_ual`, `whp_retarget`, `whp_clips`, `whp_build`, `whp_unit_lod`.

**Bỏ:** `build_roman_legionary.py`, `roman_lod.py` (thành `whp_unit_lod.py`), `roman_anims.py`.

### Đề nghị ngoài phạm vi

1. **Phiên chính, `src/data/battles/unit-types.json`:** đổi `roman-hastati` sang mô hình `roman-hastatus`, như đã định. Trước khi đổi, `npm run validate` cảnh báo (không lỗi) rằng `roman-hastatus` chưa là mô hình của loại lính nào.
2. **Phiên chính, `docs/ARCHITECTURE.md`, mục "Mô hình lính":**
   - sửa "lính La Mã: 1,08 m" thành: một vòng `walk` 1,333 s = 1,00 m, một vòng `run` 0,933 s = 1,99 m;
   - ghi `die` không lặp, cảnh giữ khung cuối.
3. **Lane 3:**
   - tốc độ phát `walk`/`run` theo tốc độ di chuyển (công thức ở `art/README.md`, mục "Thư viện hoạt hình");
   - `die` giữ khung cuối;
   - ảnh độ nhám/kim loại đã có trong cả hai file; cần ánh sáng môi trường để kim loại ra ánh kim.
4. **Phiên chính, khi trận đánh vào app:** dòng ghi công gợi ý ở cuối mục `roman-legionary` trong `art/CREDITS.md` đã thêm Quaternius.
5. Không cần cài thêm gì cho Blender, không thêm thư viện npm.
