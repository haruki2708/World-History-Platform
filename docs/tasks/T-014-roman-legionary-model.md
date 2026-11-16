# T-014: Mô hình lính La Mã thời Cộng hoà (Blender)

- **Lane:** 1
- **Model đề xuất:** Fable 5.2, effort `high`. Hết hạn mức thì dùng Opus 5.5, effort `xhigh`.
- **Nhánh:** `lane1/T-014-roman-legionary-model` (đã tạo sẵn từ `main`)
- **Phạm vi file:** `art/`, `public/battles/models/`

## Mục tiêu

Dựng **một** mô hình lính bộ binh La Mã thời Cộng hoà (khoảng năm 216 TCN, trận Cannae) cho cảnh trận đánh 3D. Mô hình làm từ một mô hình tả thực có sẵn, chạy được bằng script Blender, và xuất ra `public/battles/models/roman-legionary.glb` đúng hợp đồng.

Đây là đợt A. **Người dùng sẽ xem ảnh render và quyết định có làm tiếp các loại lính khác không**, nên chất lượng hình ảnh là thước đo chính.

## Đọc trước

- `docs/ARCHITECTURE.md`, mục "Trận đánh 3D", nhất là phần "Mô hình lính": hệ trục, khung xương, mức chi tiết (LOD), vật liệu, tên hoạt hình, dung lượng.
- `src/lib/battle.ts`: `UNIT_CLIPS`, `UNIT_LODS`.

## Hiện trạng

**Blender:** bản 5.2.2 tại `D:\Tools\Blender\5.2.2\blender.exe`. Không có trong PATH. Chạy không giao diện được, có sẵn xuất glTF. Luôn chạy với cờ `--background --factory-startup --disable-autoexec`.

**File gốc:** để ngoài repo, ở `E:\World_History_Platform_assets\sources\`. Xem `E:\World_History_Platform_assets\README.txt`.

**Mô hình 07, lính La Mã** ("Roman Soldier - T pose", Andywoodhead, CC BY 4.0)
- Thư mục `roman-soldier-andywoodhead\`.
- File `source\Old man head 12 FBX test.fbx`, ảnh vật liệu trong `textures\`.
- **280 nghìn tam giác**, chia 16 lưới riêng: `Full_figure_42_T_pose`, `New_head`, `New_eye`, `New_eye_2`, `New_arms`, `New_legs`, `Tunic_1`, `Ties` (không có UV), `Armour_top`, `Dangles`, `Helmet3`, `Scutum_04_01`, `Sword2_1`, `Scabbard`, `Boots`, `Wrist_guard1`.
- **Chưa có khung xương.** Đứng tư thế chữ T, cao 1,89 m.
- 27 ảnh vật liệu. FBX không tìm thấy ảnh nào; phải nối lại theo tên file trong `textures\`.

**Mô hình 09, lính Celt** ("Celt - rigged for UE4/5", cùng tác giả, CC BY 4.0)
- Thư mục `celt-andywoodhead\`.
- FBX đã giải nén ở `source\unzipped\Celt 07.fbx`, ảnh vật liệu trong `textures\` và `source\unzipped\`.
- 124 nghìn tam giác, 7 lưới.
- **Đã gắn khung xương chuẩn Unreal (UE mannequin), 67 xương**: gốc `pelvis`, `ik_foot_root`, `ik_hand_root`; có `spine_01..03`, `clavicle_l`, `upperarm_l`…
- Đứng gần tư thế chữ A. Khung xương có scale 0,01, tức đơn vị centimet.
- **Lỗi khi nhập:** mọi vật liệu có Alpha = 0, nên mô hình trong suốt hoàn toàn. Phải đặt lại Alpha = 1.

**Phiên chính đã kiểm tra:** cả hai mô hình nhập được và render đúng sau khi nối ảnh và sửa Alpha. Ảnh render ở `model-previews/blender-07-roman.png` và `blender-09-celt.png`. Thư mục `model-previews/` nằm ở repo chính, không ở worktree của lane.

## Yêu cầu

Chia thành các bước dưới đây. **Commit sau mỗi bước.** Lane hay hết hạn mức giữa chừng; commit thường xuyên thì phiên sau làm tiếp được.

1. **Khung quy trình.**
   - Script Python trong `art/blender/`, chạy bằng `blender --background --factory-startup --disable-autoexec --python art/blender/<script>.py -- <tham số>`.
   - Đường dẫn file gốc lấy từ biến môi trường `WHP_ASSETS`, mặc định `E:\World_History_Platform_assets`.
   - Chạy lại từ đầu phải ra cùng kết quả.
   - Ghi cách chạy trong `art/README.md`.
2. **Bỏ trang bị thời Đế chế** khỏi 07:
   - `Armour_top` (giáp lá lorica segmentata);
   - `Helmet3` (mũ kiểu Đế chế);
   - `Scutum_04_01` (khiên chữ nhật);
   - `Dangles` (tạp dề đai lưng).

   Giữ lại thân người, đầu, tay, chân, áo, xăng đan, kiếm và bao kiếm. Món nào giữ hay bỏ có lý do khác thì ghi lý do.
3. **Trang bị thời Cộng hoà**, theo Polybius 6.23. Dựng bằng script, có thể chỉnh tay thêm trong Blender:
   - **mũ Montefortino** bằng đồng: chỏm tròn có núm, vành sau ngắn, hai má che;
   - **giáp lưới** (lorica hamata), có phần che vai. Chủ yếu là vật liệu dệt lưới (ảnh màu và ảnh pháp tuyến) phủ trên một lớp vỏ bám theo thân;
   - **khiên bầu dục cong** (scutum), khoảng 120 × 75 cm, có gờ dọc giữa và núm khiên;
   - có thể thêm: một tấm che ống chân, ngù lông trên mũ.

   Hình dáng chỉ tham khảo ảnh hiện vật bảo tàng và tranh minh hoạ thuộc phạm vi công cộng. Ghi nguồn tham khảo trong `art/README.md`.
4. **Khung xương:**
   - Gắn 07 vào khung xương chuẩn Unreal lấy từ 09, để mọi loại lính dùng chung hoạt hình.
   - Hai mô hình đứng hai tư thế khác nhau (chữ T và gần chữ A); phải chỉnh cho khớp trước khi gắn.
   - Cách gắn trọng số do lane chọn (chuyển trọng số từ 09, hay tự động) miễn là biến dạng đúng.
   - Kiểm tra bằng vài tư thế thử: giơ tay, bước chân, cúi người.
5. **Hoạt hình tạm** để thử khung xương: `idle`, `walk`, `attack` (đâm kiếm sau khiên), tạo bằng keyframe trong script. Thư viện hoạt hình thật sẽ dùng ở đợt B; lane 2 đang tìm trong T-016.
6. **Vật liệu và mức chi tiết:**
   - Gộp toàn bộ ảnh vật liệu thành **một vật liệu**, ảnh màu tối đa 2048×2048, ảnh pháp tuyến nếu có tối đa 1024×1024.
   - Tạo `LOD0` (tối đa 8 000 tam giác), `LOD1` (tối đa 1 500), `LOD2` (tối đa 300), cùng gắn vào một khung xương.
7. **Xuất file:**
   - `public/battles/models/roman-legionary.glb`, tối đa 4 MB.
   - Đúng hệ trục: mét, trục Y lên, đứng trên y = 0, mặt nhìn về +Z.
   - Nhập lại file `.glb` vào Blender để kiểm tra số tam giác, tên lưới, tên hoạt hình và dung lượng.
8. **Ảnh để người dùng duyệt**, đặt trong `art/renders/`, JPEG, mỗi ảnh tối đa 400 KB:
   - nhìn trước, nghiêng, sau;
   - cận đầu và mũ;
   - một hàng 20 lính dàn đội hình;
   - ba mức LOD cạnh nhau;
   - ba khung hình của mỗi hoạt hình;
   - một ảnh đặt cạnh mô hình gốc 07 để thấy những gì đã đổi.
9. **Ghi công** trong `art/CREDITS.md`:
   - tên mô hình, tác giả, link, giấy phép CC BY 4.0;
   - **liệt kê những gì đã sửa**, vì giấy phép yêu cầu nói rõ phần đã thay đổi.

## Ràng buộc

- **Không đưa file gốc vào repo**, gồm FBX, ảnh vật liệu gốc và file `.blend` trung gian. Trong repo chỉ có script, file `.glb` đã xuất, ảnh render và tài liệu.
- Không dùng mô hình hay ảnh vật liệu từ nguồn nào khác nếu chưa đọc giấy phép. Không dùng tài sản trích từ game thương mại (Total War hay game khác).
- Không sửa code trong `src/`. Cảnh 3D là việc của lane 3 (T-015).
- Không thêm thư viện npm. Thứ gì cần cài thêm cho Blender thì ghi đề nghị vào mục "Kết quả".

## Xong khi

- `roman-legionary.glb` đúng hợp đồng: một khung xương; ba lưới `LOD0`, `LOD1`, `LOD2` trong giới hạn tam giác; một vật liệu; ba hoạt hình `idle`, `walk`, `attack`; tối đa 4 MB.
- Chạy script từ đầu dựng lại được file `.glb`.
- Có đủ ảnh duyệt trong `art/renders/` và ghi công trong `art/CREDITS.md`.
- `npm run lint` và `npm run build` qua.

## Kết quả

Xong cả 9 bước, ngày 2026-11-16. Nhánh `lane1/T-014-roman-legionary-model`, chưa gộp vào `main`.

### Đối chiếu với "Xong khi"

| Yêu cầu | Kết quả |
|---|---|
| Một khung xương | 1 skin, 67 xương (khung Celt thu nhỏ 0,8); ba lưới dùng chung |
| LOD0 ≤ 8 000, LOD1 ≤ 1 500, LOD2 ≤ 300 tam giác | 7 483 / 1 360 / 296 |
| Một vật liệu | `roman-legionary`: ảnh màu JPEG 2048×2048 (528 KB, đã nhân AO), ảnh pháp tuyến JPEG 1024×1024 (199 KB); độ nhám 0,72, không kim loại |
| Ba hoạt hình | `idle` 2,0 s, `walk` 1,0 s, `attack` 1,2 s; 30 khung/giây, lặp được |
| Tối đa 4 MB | 1,75 MB (1 834 936 byte) |
| Hệ trục | mét, Y lên, điểm thấp nhất y = −0,005, mặt nhìn về +Z |
| Chạy script từ đầu dựng lại được | một lệnh, khoảng 70 giây; hai lần dựng từ file gốc ra file `.glb` giống hệt từng byte (SHA-256 `21eab329…`) |
| Ảnh duyệt, ghi công | 11 ảnh trong `art/renders/roman-legionary/`; `art/CREDITS.md` |
| `npm run lint`, `npm run build` | qua |

### Đã kiểm tra thế nào

- **Script tự kiểm tra** sau khi xuất (`whp_export.check_glb`). Script đọc chính file `.glb` và dừng với mã 1 nếu có lỗi:
  - tên và số tam giác của từng lưới, có gắn skin;
  - số skin và số xương, số vật liệu, kích thước ảnh;
  - tên hoạt hình, dung lượng;
  - đứng trên mặt đất, ngón chân hướng +Z;
  - nhập lại vào Blender.

  Chạy riêng phần này: `build_roman_legionary.py -- --check`.
- **three.js 0.187** (bản trong `node_modules`), chạy `GLTFLoader` trong Node:
  - đọc được, ba lưới `SkinnedMesh` dùng chung một skeleton;
  - ba clip chạy trong `AnimationMixer`, không có cảnh báo track nào bị lạc;
  - khi đâm kiếm, đầu tiến về +Z.

  Ảnh được thay bằng texture giả vì Node không giải mã ảnh; ảnh đã được kiểm qua bước nhập lại vào Blender.
- **Chưa thử trong trình duyệt:** chưa trang nào tải mô hình lính; cảnh 3D là T-015 của lane 3.
- **Tư thế thử** (giơ tay, bước dài, cúi người): ảnh `11-test-poses.jpg`. Thêm `--preview` để có ảnh tư thế thử của mô hình chi tiết trong `art/build/`.
- **Ảnh duyệt** đều render từ file `.glb` đã xuất, nên thấy đúng thứ cảnh 3D nhận được.

### Ảnh để duyệt: `art/renders/roman-legionary/`

| Ảnh | Nội dung |
|---|---|
| `01-front-side-back.jpg` | Nhìn trước, nghiêng (phía khiên), sau; tư thế đứng |
| `02-three-quarter.jpg` | Nhìn chéch từ phía kiếm |
| `03-head-front.jpg`, `04-head-side.jpg` | Cận đầu và mũ |
| `05-formation.jpg` | 20 lính dàn đội hình, lệch bước nhau |
| `06-lods.jpg` | LOD0, LOD1, LOD2 cạnh nhau |
| `07-anim-idle.jpg`, `08-anim-walk.jpg`, `09-anim-attack.jpg` | Ba khung hình mỗi hoạt hình |
| `10-compare-source.jpg` | Mô hình gốc 07; mô hình mới ở tư thế gốc; mô hình mới đứng |
| `11-test-poses.jpg` | Tư thế thử khung xương |

### Đã làm gì

**Bỏ khỏi 07** (lý do trong `REMOVED` của `art/blender/roman_source.py`):
- bốn món task nêu;
- dây buộc của giáp lá (`Ties`);
- bao cổ tay da (`Wrist_guard1`): quy ước của phim, không có căn cứ cho lính bộ binh;
- mảng thân `Full_figure_42_T_pose`, bị áo che hết.

**Trang bị thời Cộng hoà** (dựng hoàn toàn bằng script):
- mũ Montefortino bằng đồng: chỏm có núm, vành sau ngắn, hai má che có khoét theo mắt và miệng;
- ngù ba lông đỏ tía, cao 40 cm;
- giáp lưới có lớp che vai, móc ngực bằng đồng; vòng lưới là vật liệu (ảnh màu và độ lồi) phủ trên lớp vỏ cắt từ áo;
- đai da;
- khiên bầu dục cong 120 × 75 cm: gờ dọc phình thành chỗ đặt núm, tấm sắt có đinh tán, viền sắt ở hai đầu, tay cầm ngang;
- bàn tay nắm lại, kiếm nằm trong nắm tay, bao kiếm chuyển sang hông phải (Polybius 6.23.6).

**Khung xương:** mỗi xương một ma trận đưa phần thân quanh nó từ tư thế chữ T sang tư thế chữ A của khung Celt, co giãn theo chiều dài xương. Trọng số chuyển từ thân Celt theo điểm gần nhất, tách bên trái/phải (để dây xăng đan không dính sang chân kia), rồi làm mượt.

**LOD:** chi tiết trong `art/README.md`, mục "Giai đoạn `lod`".

### Còn chưa ưng ý

1. **Mũ đồng trông mờ, giống đất sét.** Cả mô hình chỉ có một độ nhám, không có ánh kim, nên đồng, sắt và da phản sáng như nhau. Muốn mũ và giáp bóng hơn thì cần một ảnh độ nhám/kim loại (xem đề nghị 2).
2. **Còn theo mô hình gốc, chưa chắc đúng năm 216 TCN:**
   - kiếm và bao kiếm mang dáng muộn hơn (giống kiểu Pompeii/Mainz, thế kỷ 1 TCN – 1 SCN), chưa phải *gladius hispaniensis* lưỡi dài hơi thắt eo;
   - xăng đan kiểu *caligae*;
   - áo màu đỏ: màu áo lính thời này chưa rõ.
3. **Mô hình là người lính khá giả.** Theo Polybius 6.23.14–15, chỉ người thuộc hạng tài sản cao nhất mặc giáp lưới; số đông đeo một tấm đồng vuông che ngực (*pectorale*). Polybius cũng nói lính mang hai cây lao (*pilum*) và tấm che ống chân; cả hai chưa làm.
4. **Nhìn rất gần:** mép má che hơi răng cưa; mép cổ áo giáp lưới lởm chởm; tấm sắt trên núm khiên còn hở một vệt đỏ nhỏ ở giữa. Ở cự ly cảnh trận không thấy.
5. **LOD1:** mặt hơi nhoè. **LOD2:** hình người khối đơn giản, mỗi tam giác một màu; chỉ hợp khi lính cao vài chục điểm ảnh.
6. **Atlas** mới dùng khoảng 52% diện tích ảnh màu; xếp chặt hơn thì mặt và giáp sẽ nét hơn.
7. **Hoạt hình** là bản tạm: cứng, tay cầm khiên ít chuyển động. `walk` không có chuyển động gốc, cảnh phải tự di chuyển hình lính với tốc độ 1,08 m mỗi vòng (1,08 m/s).
8. **Tư thế gốc** (không phát hoạt hình) là tư thế chữ A với khiên nằm dọc cánh tay trái, trông lạ. Cảnh nên luôn phát ít nhất `idle`.

### Đề nghị ngoài phạm vi

1. **Phiên chính, khi trận đánh vào app:** thêm dòng ghi công vào hộp thoại Giới thiệu và README. Câu gợi ý song ngữ ở cuối `art/CREDITS.md`.
2. **Phiên chính, `docs/ARCHITECTURE.md`, mục "Mô hình lính":**
   - ghi rõ hoạt hình không có chuyển động gốc, `walk` 1,08 m mỗi vòng, tư thế gốc là chữ A;
   - cân nhắc cho phép thêm một ảnh độ nhám/kim loại 1024×1024 (glTF `metallicRoughnessTexture`), khoảng +150 KB, để kim loại trông như kim loại;
   - ảnh duyệt đặt theo thư mục từng mô hình: `art/renders/<model>/`.
3. **Lane 3 (T-015):** đọc mục "Ghi chú cho cảnh 3D" trong `art/README.md`, gồm thời lượng clip, tốc độ đi, phía của khiên, và việc ảnh màu đã có AO.
4. **Đợt B**, nếu duyệt làm tiếp: biến thể *pectorale* cho lính nghèo hơn, lao *pilum*, tấm che ống chân, kiếm *gladius hispaniensis*, lính nhẹ *velites*.
5. Không cần cài thêm gì cho Blender, không thêm thư viện npm.
