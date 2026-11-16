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

_(Lane 1 điền khi xong. Kèm danh sách ảnh trong `art/renders/` để người dùng xem, và những chỗ còn chưa ưng ý.)_

### Tiến độ (chưa xong, lưu giữa chừng ngày 2026-11-16)

**Đã xong và đã commit: bước 1 đến 5.** Chạy `build_roman_legionary.py` không tham số ra tới giai đoạn `anim` (file `art/build/roman-legionary/5-anim.blend`).

| Bước | Trạng thái | Ghi chú |
|---|---|---|
| 1. Khung quy trình | Xong | `art/blender/`, `art/README.md` (README mới mô tả tới giai đoạn `strip`, cần bổ sung) |
| 2. Bỏ trang bị Đế chế | Xong | Bỏ thêm `Ties`, `Wrist_guard1`, `Full_figure_42_T_pose`; lý do trong `REMOVED` của `roman_source.py` |
| 3. Trang bị Cộng hoà | Xong | Mũ Montefortino + 3 lông cắm, giáp lưới + lớp vai + móc ngực, đai, khiên bầu dục, bao kiếm chuyển sang hông phải, bàn tay nắm lại. **Chưa làm** tấm che ống chân (phần "có thể thêm") |
| 4. Khung xương | Xong | Khung Celt × 0,8, đế chân ở z = 0; trọng số chuyển từ lưới Celt; đã thử 3 tư thế |
| 5. Hoạt hình tạm | Xong | `idle` 60 khung, `walk` 30 khung (1,08 m mỗi vòng), `attack` 36 khung, 30 khung/giây |
| 6. Vật liệu và LOD | **Đang làm** | `art/blender/whp_lod.py` đã viết nhưng **chưa chạy thử và chưa nối vào `build_roman_legionary.py`** |
| 7. Xuất `.glb` | Chưa | |
| 8. Ảnh duyệt | Chưa | `art/renders/` còn trống |
| 9. `art/CREDITS.md` | Chưa | |

**Việc còn lại cho phiên sau, theo thứ tự:**

1. Giai đoạn `kit`: gọi thêm `build_kit(0, ".low")` để có bản ít tam giác của mũ, má che, lông, khiên, móc ngực (đặt `hide_render = True`). Giai đoạn `rig` đã xử lý sẵn tên có hậu tố `.low` (hàm `base_name`).
2. Thêm giai đoạn `lod` dùng `whp_lod.py`:
   - mỗi phần một bản ít tam giác: phần lấy từ mô hình gốc thì `low_copy` → `remove_covered` (áo dưới giáp, tay dưới tay áo, cổ dưới giáp) → `decimate`; chân thì `wrap_over` để ôm cả xăng đan (không giữ lưới `Boots` riêng); trang bị dựng bằng script thì dùng bản `.low`;
   - ngân sách tam giác dự kiến cho LOD0 / LOD1 / LOD2: đầu 1000/200/30, mắt 48/0/0, tay 1100/200/36, chân 1300/240/44, áo 700/120/24, giáp 1100/220/40, lớp vai 420/80/0, đai 140/40/0, bao kiếm 220/40/0, kiếm 140/40/10, mũ ~350/110/24, má che ~216/40/0, lông ~120/48/12, khiên ~250/100/36;
   - `unwrap_atlas` (một UV chung; trọng số mật độ: đầu 1,8–2,2, mặt sau khiên 0,45), rồi bake từng phần bằng Cycles: `NORMAL` trước, sau đó `EMIT` trong `EmissionSwap`, rồi `AO`; nhân AO vào ảnh màu, `dilate`, ảnh pháp tuyến hạ từ 2048 xuống 1024;
   - LOD1, LOD2 lấy bằng `decimate` từ các phần của LOD0 sau khi bake; gộp thành ba lưới tên `LOD0`, `LOD1`, `LOD2`, một vật liệu (`final_material`), giới hạn 4 xương mỗi đỉnh (`whp_skin.prune`).
3. Giai đoạn `export`: xuất `.glb` (ảnh JPEG, có tangent, hoạt hình theo action; nếu chế độ `ACTIONS` không ra đủ ba clip thì chuyển sang NLA), rồi script nhập lại để kiểm tra số tam giác, tên lưới, tên clip, dung lượng.
4. `render_review.py`: render từ file `.glb` đã xuất, đủ các ảnh ở bước 8. Khi chụp `idle` và `walk` nên đặt camera chếch bên phải, vì khiên che gần hết thân nếu nhìn từ bên trái.
5. `art/CREDITS.md`, bổ sung `art/README.md` (các giai đoạn `kit`, `rig`, `anim`, `lod`, `export`; nguồn tham khảo hình dáng: Polybius 6.23, bàn thờ Domitius Ahenobarbus, khiên Kasr el-Harit, mũ Montefortino trong các bảo tàng), chạy `npm run lint` và `npm run build`, điền mục "Kết quả".

**Điều cần biết khi làm tiếp:**

- Blender 5.2: action dùng slot và channelbag (xem `action_fcurves`, `set_action` trong `whp_anim.py`); engine EEVEE tên là `BLENDER_EEVEE`.
- Tư thế nghỉ của khung xương: khiên nằm dọc cánh tay trái (do khiên gắn cứng vào `hand_l`). Chỉ khi chạy clip khiên mới dựng đứng; hai vector `whp_shield_down`, `whp_shield_out` lưu trên đối tượng armature cho biết hướng của khiên so với xương bàn tay.
- Mô hình chuẩn hoá theo tỉ lệ của khung Celt: thân ngắn đi 9%, cánh tay trên ngắn 14%, cẳng tay dài thêm 12% so với mô hình gốc (số in ra ở giai đoạn `rig`).
- File trung gian nằm ở `art/build/` (không vào git). Mất thì chạy lại từ đầu, khoảng 2 phút tới giai đoạn `anim`.
