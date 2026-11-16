# Mô hình lính cho cảnh trận đánh 3D

Thư mục này chứa script Blender dựng mô hình lính, ảnh render để duyệt và phần ghi công. File mô hình đã xuất nằm ở `public/battles/models/`. Hợp đồng của mô hình (hệ trục, khung xương, LOD, vật liệu, hoạt hình) ở `docs/ARCHITECTURE.md`, mục "Trận đánh 3D".

```
art/
  blender/      script Python chạy bằng Blender không giao diện
  renders/      ảnh render để người dùng duyệt, mỗi mô hình một thư mục
  build/        file trung gian (.blend, ảnh bake, ảnh xem thử); không đưa vào git
  CREDITS.md    ghi công mô hình gốc và những gì đã sửa
```

## Cần có

- **Blender 5.2.2** tại `D:\Tools\Blender\5.2.2\blender.exe` (không nằm trong PATH). Không cần cài thêm add-on nào: chỉ dùng phần nhập FBX, xuất và nhập glTF, Cycles và EEVEE có sẵn.
- **File gốc** để ngoài repo, trong thư mục mà biến môi trường `WHP_ASSETS` trỏ tới. Mặc định là `E:\World_History_Platform_assets`. Cách tải và đặt file: xem `README.txt` trong thư mục đó.

  ```
  %WHP_ASSETS%\sources\
    roman-soldier-andywoodhead\source\Old man head 12 FBX test.fbx
    roman-soldier-andywoodhead\textures\*.jpeg
    celt-andywoodhead\source\unzipped\Celt 07.fbx
  ```

Không đưa file gốc (FBX, ảnh vật liệu gốc) hay file `.blend` trung gian vào repo.

## Cách chạy

Luôn chạy Blender với ba cờ `--background --factory-startup --disable-autoexec`. Chạy từ thư mục gốc của repo (PowerShell):

```powershell
$blender = "D:\Tools\Blender\5.2.2\blender.exe"

# Dựng lại toàn bộ từ file gốc, xuất public/battles/models/roman-legionary.glb rồi kiểm tra file (khoảng 1–2 phút)
& $blender --background --factory-startup --disable-autoexec --python art/blender/build_roman_legionary.py

# Chạy lại từ một giai đoạn (dùng file .blend của giai đoạn trước trong art/build/)
& $blender --background --factory-startup --disable-autoexec --python art/blender/build_roman_legionary.py -- --from lod

# Chỉ kiểm tra file .glb đã xuất
& $blender --background --factory-startup --disable-autoexec --python art/blender/build_roman_legionary.py -- --check

# Ảnh duyệt, render từ file .glb đã xuất (khoảng 20 giây)
& $blender --background --factory-startup --disable-autoexec --python art/blender/render_review.py
& $blender --background --factory-startup --disable-autoexec --python art/blender/render_review.py -- --only head lods
```

Tham số của `build_roman_legionary.py`, đặt sau dấu `--`:

| Tham số | Ý nghĩa |
|---|---|
| `--from <giai đoạn>` | Bắt đầu từ giai đoạn này; cần file `.blend` của giai đoạn trước trong `art/build/roman-legionary/`. |
| `--to <giai đoạn>` | Dừng sau giai đoạn này. |
| `--preview` | Render ảnh xem thử sau mỗi giai đoạn vào `art/build/roman-legionary/preview-*.png`: trước, nghiêng, sau; thêm ba tư thế thử sau `rig` và vài khung hình mỗi hoạt hình sau `anim`. |
| `--check` | Chỉ đọc lại file `.glb` đã xuất và kiểm tra theo hợp đồng. |

Tham số của `render_review.py`: `--model <tên>` (mặc định `roman-legionary`), `--only <ảnh> ...` (`views`, `three-quarter`, `head`, `formation`, `lods`, `animations`, `compare`, `test-poses`).

Đổi chỗ để file gốc:

```powershell
$env:WHP_ASSETS = "D:\duong\dan\khac"
```

**Chạy lại ra cùng kết quả.** Hai lần dựng từ đầu cho file `.glb` giống hệt từng byte. Script không dùng số ngẫu nhiên; Cycles bake với hạt giống cố định. Lưới do các phép `bmesh` tạo ra được đưa về thứ tự chuẩn (`whp_mesh.canonicalise`), vì các phép này trả về cạnh và mặt theo thứ tự thay đổi giữa các lần chạy.

## Các giai đoạn của `build_roman_legionary.py`

Mỗi giai đoạn lưu `art/build/roman-legionary/<số>-<tên>.blend`. Muốn chỉnh tay trong Blender: mở file của một giai đoạn, sửa, lưu đè, rồi chạy tiếp bằng `--from <giai đoạn sau>`. Lưu ý chạy lại từ đầu sẽ ghi đè phần chỉnh tay.

| Giai đoạn | Việc làm | Script |
|---|---|---|
| `source` | Nhập mô hình 07 (lính La Mã, tư thế chữ T), áp scale và hướng, nối lại ảnh vật liệu theo tên file, sửa vật liệu (FBX nhập vào bị kim loại hoàn toàn). | `roman_source.py` |
| `strip` | Bỏ trang bị thời Đế chế. Danh sách và lý do nằm trong `REMOVED`. | `roman_source.py` |
| `kit` | Nắm bàn tay, đặt kiếm vào tay, chuyển bao kiếm sang hông phải. Dựng mũ, má che, lông mũ, giáp lưới, lớp che vai, đai, móc ngực, khiên; mỗi món thêm một bản ít tam giác (`.low`) cho LOD. | `roman_hands.py`, `roman_helmet.py`, `roman_mail.py`, `roman_shield.py`, `whp_materials.py` |
| `rig` | Nhập khung xương của mô hình 09 (Celt). Mỗi xương một ma trận đưa phần thân quanh nó từ tư thế chữ T và tỉ lệ của 07 sang tư thế chữ A và tỉ lệ của khung (`roman_fit.py`). Trọng số chuyển từ thân Celt theo điểm gần nhất, tách theo bên trái/phải, làm mượt. | `roman_fit.py`, `whp_skeleton.py`, `whp_skin.py` |
| `anim` | Ba hoạt hình tạm bằng keyframe: `idle`, `walk`, `attack`. | `roman_anims.py`, `whp_anim.py` |
| `lod` | Lưới `LOD0`, `LOD1`, `LOD2` và một vật liệu (chi tiết ở dưới). | `roman_lod.py`, `whp_lod.py`, `whp_proxy.py` |
| `export` | Xuất `.glb`, rồi đọc lại để kiểm tra (chi tiết ở dưới). | `whp_export.py` |

### Giai đoạn `lod`

- **Phần ít tam giác.** Mỗi phần của mô hình chi tiết có một bản ít tam giác. Với lưới gốc: bỏ mặt nằm dưới lớp khác (tay dưới tay áo, áo dưới giáp, da đầu dưới mũ, cả chỗ lòi ra ngoài lớp phải che nó), hạ mặt dưới bàn chân xuống đế xăng đan, chiếu UV trên lưới dày rồi mới giảm tam giác. Trang bị tự dựng dùng bản `.low`.
- **Atlas.** Một bộ UV chung, mật độ điểm ảnh chuẩn hoá theo diện tích (mặt người ×1,8, mặt sau khiên ×0,45).
- **Bake.** Cycles bake ảnh màu (2048) và ảnh pháp tuyến (bake ở 2048, lấy trung bình xuống 1024) từ mô hình chi tiết. Độ che khuất môi trường (AO) bake từ chính các phần LOD0 rồi nhân vào ảnh màu; khiên và kiếm bake riêng để không in bóng lên người.
- **LOD1.** Giảm tam giác từ các phần của LOD0, nên dùng lại UV và trọng số; bao kiếm bỏ ở mức này.
- **LOD2.** Giảm tam giác tới mức này thì xé nát các mảnh hở, nên thân người được dựng lại: các ống và elip đặt theo khung xương, kích thước đo từ đỉnh của LOD0, mỗi tam giác một màu phẳng lấy từ atlas. Mũ, lông, khiên, kiếm vẫn giảm từ phần của chúng.
- **Trọng số.** Tối đa 4 xương mỗi đỉnh.

### Giai đoạn `export`

- **Xuất.** glTF nhị phân, ảnh JPEG, có tangent, đủ 67 xương, mỗi hoạt hình một animation lấy mẫu từng khung (30 khung/giây).
- **Kiểm tra.** Đọc chính file `.glb`:
  - một khung xương 67 xương;
  - ba lưới `LOD0`, `LOD1`, `LOD2` trong giới hạn tam giác;
  - một vật liệu, kích thước ảnh;
  - tên ba hoạt hình;
  - đứng trên y = 0, ngón chân hướng +Z, đầu hướng +Y;
  - dung lượng tối đa 4 MB.

  Sau đó nhập lại file vào Blender. Có lỗi thì script dừng với mã 1.

## Ghi chú cho cảnh 3D (lane 3)

- **Hoạt hình:** `idle` 2,0 s, `walk` 1,0 s, `attack` 1,2 s. Cả ba lặp được, không có chuyển động gốc: hình lính đứng yên tại chỗ, cảnh tự di chuyển nó. Một vòng `walk` ứng với **1,08 m** (`WALK_STRIDE` trong `roman_anims.py`), tức khoảng 1,08 m/s ở tốc độ phát bình thường.
- **Tư thế gốc** (khi không phát hoạt hình nào) là tư thế chữ A, khiên nằm dọc cánh tay trái. Khiên chỉ dựng đứng trước người khi có hoạt hình, nên cảnh luôn phát ít nhất `idle`.
- **Vật liệu:** độ nhám cố định 0,72, không kim loại. Ảnh màu đã có AO.
- **Tâm hình lính:** đứng giữa gốc toạ độ; khiên ở bên trái của người lính, tức phía +X trong glTF (lính nhìn về +Z, trục Y hướng lên).

## Các file script

| File | Nội dung |
|---|---|
| `build_roman_legionary.py` | Điểm vào: chạy các giai đoạn theo thứ tự, kiểm tra file xuất. |
| `render_review.py` | Ảnh duyệt, render từ file `.glb` đã xuất. |
| `whp_common.py` | Đường dẫn (`WHP_ASSETS`, `art/build/`), đọc tham số, nhập FBX, tiện ích chọn, gộp, nhân bản đối tượng. |
| `whp_render.py` | Đèn, camera, render ảnh tĩnh bằng EEVEE. |
| `whp_mesh.py` | Truy cập đỉnh bằng numpy, dựng lưới, đưa lưới về thứ tự chuẩn. |
| `whp_materials.py` | Vật liệu thủ tục: đồng, sắt, da, gỗ, sơn khiên, lông, vòng giáp lưới. |
| `whp_skeleton.py` | Khung xương chung (lấy từ mô hình Celt), đưa về dạng chuẩn, gắn lưới, tạo tư thế. |
| `whp_skin.py` | Chuyển trọng số theo điểm gần nhất, làm mượt, giới hạn số xương, skinning bằng numpy. |
| `whp_anim.py` | Dựng tư thế theo trục của người lính (ngắm tay chân, IK hai đoạn cho chân) và ghi keyframe. |
| `whp_lod.py` | Phần ít tam giác, atlas UV, bake, xử lý ảnh, vật liệu cuối. |
| `whp_proxy.py` | Hình người đơn giản theo khung xương cho LOD2. |
| `whp_export.py` | Xuất glTF và kiểm tra file `.glb` theo hợp đồng. |
| `roman_source.py` | Nhập mô hình 07, bỏ trang bị thời Đế chế, chuyển bao kiếm. |
| `roman_hands.py` | Nắm bàn tay, đặt kiếm vào tay. |
| `roman_helmet.py` | Mũ Montefortino, má che, lông mũ. |
| `roman_mail.py` | Giáp lưới, lớp che vai, đai, móc ngực. |
| `roman_shield.py` | Khiên bầu dục. |
| `roman_fit.py` | Khớp tư thế và tỉ lệ của 07 vào khung xương chung. |
| `roman_anims.py` | Hoạt hình tạm và các tư thế thử. |
| `roman_lod.py` | Danh sách phần, ngân sách tam giác từng LOD, dựng LOD và vật liệu. |

## Ảnh duyệt: `art/renders/roman-legionary/`

Tất cả render từ file `.glb` đã xuất, tức đúng thứ cảnh 3D nhận được; riêng ảnh 10 có thêm mô hình gốc 07.

| Ảnh | Nội dung |
|---|---|
| `01-front-side-back.jpg` | Nhìn trước, nghiêng (phía khiên), sau; tư thế đứng (`idle`). |
| `02-three-quarter.jpg` | Nhìn chéch từ trước bên phải (phía kiếm). |
| `03-head-front.jpg`, `04-head-side.jpg` | Cận đầu và mũ. |
| `05-formation.jpg` | 20 lính: 5 hàng ngang, 4 hàng dọc, lệch bước nhau. |
| `06-lods.jpg` | LOD0, LOD1, LOD2 cạnh nhau. |
| `07-anim-idle.jpg`, `08-anim-walk.jpg`, `09-anim-attack.jpg` | Ba khung hình mỗi hoạt hình. |
| `10-compare-source.jpg` | Trái: mô hình gốc 07 như khi tải về. Giữa: mô hình mới ở tư thế gốc. Phải: mô hình mới đứng. |
| `11-test-poses.jpg` | Tư thế thử khung xương: giơ tay, bước dài, cúi người. |

## Tham khảo hình dáng

Trang bị dựng theo mô tả văn bản và hình dạng đã biết của các hiện vật dưới đây. Không dùng ảnh, mô hình hay ảnh vật liệu nào của các nguồn này làm vật liệu, và không dùng tài sản trích từ game.

- **Polybius, *Histories* 6.23** (bản dịch tiếng Anh của W. R. Paton, Loeb 1922–1927, phạm vi công cộng):
  - khiên cong, rộng 2,5 bộ, dài 4 bộ, có viền sắt ở mép trên và dưới, có núm sắt;
  - kiếm đeo bên đùi phải;
  - mũ đồng có ngù ba lông đỏ tía hoặc đen, đứng thẳng, cao khoảng một cubit;
  - người thuộc hạng giàu mặc giáp lưới, những người khác đeo một tấm đồng che ngực.
- **Mũ kiểu Montefortino** (thế kỷ 4–1 TCN): chỏm tròn hơi nhọn có núm đúc liền, vành sau ngắn hình mái che gáy, hai má che có khoét theo mắt và miệng. Có nhiều chiếc trong các bảo tàng châu Âu.
- **Phù điêu "bàn thờ Domitius Ahenobarbus"** (Louvre, khoảng cuối thế kỷ 2 TCN): lính mặc giáp lưới có lớp che vai, mũ có ngù, khiên bầu dục.
- **Khiên Kasr el-Harit** (Fayum, Ai Cập), hiện vật duy nhất còn gần nguyên của loại scutum bầu dục: cao khoảng 1,28 m, ván gỗ ghép nhiều lớp, gờ dọc giữa phình ra thành chỗ đặt núm.

Những chỗ còn theo mô hình nền, chưa chắc đúng năm 216 TCN, ghi ở mục "Kết quả" của `docs/tasks/T-014-roman-legionary-model.md`.
