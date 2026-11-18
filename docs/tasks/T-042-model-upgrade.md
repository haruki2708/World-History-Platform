# T-042: Nâng mô hình lính và ngựa từ mô hình gốc (thang chi tiết `hi`)

- **Ai làm:** phiên chính (người dùng chọn). Task này sửa cả script của lane 1 (`art/blender/whp_*.py`) và của lane 2 (`art/blender/horse_*.py`); hai lane đọc mục "Đã đổi trong script" trước khi sửa tiếp các file đó.
- **Model:** Fable 5.2 (xhigh).
- **Nhánh:** `batch-i/look-sample`, worktree `E:\World_History_Platform_assets\wt-stage3` (cùng nhánh với [T-041](T-041-look-sample.md)).
- **Trạng thái:** hai mô hình thử (lính La Mã, kỵ binh La Mã) đã dựng và có ảnh so sánh. **Chờ người dùng xem ảnh và chốt.** Chưa đưa gì vào cảnh 3D.
- **Phạm vi file:** `art/blender/`, `art/renders/upgrade/`, `docs/`.

File này vừa là đề bài vừa là nhật ký: phiên nào làm tiếp thì đọc mục "Kết quả" trước.

## Vấn đề

Người dùng xem bản cắt đầu tiên của cảnh mẫu (T-041) ngày 2026-11-18: "góc quay và khung cảnh ok rồi đấy, nhưng lính bộ binh và ngựa thì vẫn mang hướng đồ hoạ ps1, không đủ chân thực như ảnh mẫu, có thể thiết kế lại được không".

**Người dùng chọn:**

- Nâng từ mô hình gốc trong Blender, không thay bằng mô hình khác.
- Nâng một mẫu lính và một mẫu ngựa, **render ảnh cho người dùng xem trước**; người dùng chốt rồi mới đưa vào cảnh làm bản thử.
- Làm thử hai mô hình (lính La Mã, kỵ binh La Mã) trước chín mô hình còn lại.

## Xong khi

Người dùng xem ảnh so sánh và chốt: đưa vào cảnh làm bản thử, nâng tiếp, hay đổi hướng.

## Kết quả

Ngày 2026-11-18.

### Xem ở đâu

Ảnh ở `art/renders/upgrade/`, mỗi mô hình bảy ảnh, bên trái (hoặc trên) là **TRƯỚC**, bên phải (hoặc dưới) là **SAU**:

| Ảnh | Nội dung |
|---|---|
| `<mô hình>-01-close.jpg` | Cận cảnh, đứng yên, mức chi tiết cao nhất của mỗi bên |
| `<mô hình>-02-strike.jpg` | Cận cảnh, lúc ra đòn |
| `<mô hình>-03-detail.jpg` | Đầu và ngực (kỵ binh: cả đầu ngựa) |
| `<mô hình>-04-levels.jpg` | Mọi mức chi tiết của mỗi bên đặt cạnh nhau, có số tam giác |
| `<mô hình>-05-near.jpg` | Một khối quân nhìn gần: mỗi người cao 118 điểm ảnh trên màn hình 1920×1080 |
| `<mô hình>-06-middle.jpg` | Nhìn từ tầm trung: mỗi người cao 58 điểm ảnh; ảnh phóng to gấp hai |
| `<mô hình>-07-far.jpg` | Nhìn từ xa, góc nhìn thường gặp khi xem cả trận: mỗi người cao 26 điểm ảnh; ảnh phóng to gấp ba |

`<mô hình>` là `roman-legionary` hoặc `roman-cavalry`. Trong ba ảnh cuối, mỗi người được vẽ ở đúng mức chi tiết mà cảnh sẽ chọn cho chiều cao đó. Ngưỡng của "TRƯỚC" là ngưỡng của `main` (110 và 32 điểm ảnh; nhánh cảnh mẫu đã hạ xuống 58 và 17). Ngưỡng của "SAU" (110, 44, 15) là số dự kiến, cảnh chưa có.

Ảnh render bằng Blender (EEVEE) dưới nắng cao trên nền xanh, **không phải ảnh chụp cảnh 3D**: ánh sáng và màu trong cảnh khác (xem "Nhận xét").

### Đã làm

**Thang chi tiết bốn mức, dựng lại từ mô hình gốc** (cờ `--hi`). Mô hình đang dùng có ba mức, mức thấp nhất là hình ống tô màu phẳng. Thang mới:

| Mức | Thang mới lấy từ đâu |
|---|---|
| LOD0 | Giảm từ lưới gốc, giữ gấp ba số tam giác của LOD0 đang dùng |
| LOD1 | 0,7 lần LOD0 đang dùng (gần bằng mức cao nhất hiện nay) |
| LOD2 | 1,2 lần LOD1 đang dùng, **có chất liệu** (hiện nay ở tầm này là hình ống màu phẳng) |
| LOD3 | Hình ống màu phẳng của LOD2 đang dùng |

Số tam giác và dung lượng file:

| Mô hình | LOD0 | LOD1 | LOD2 | LOD3 | File `.glb` |
|---|---|---|---|---|---|
| Lính La Mã, đang dùng | 7 483 | 1 360 | 296 | không có | 2,25 MB |
| Lính La Mã, `hi` | 22 421 | 5 242 | 1 638 | 292 | 4,25 MB |
| Kỵ binh La Mã, đang dùng | 7 592 | 1 365 | 288 | không có | 2,43 MB |
| Kỵ binh La Mã, `hi` | 23 771 | 6 232 | 1 747 | 288 | 4,71 MB |
| Riêng ngựa đủ yên cương, đang dùng | 3 436 | 710 | 122 | không có | |
| Riêng ngựa đủ yên cương, `hi` | 11 248 | 3 306 | 955 | 122 | |

Ảnh pháp tuyến của thang `hi` là 2048 (đang dùng: 1024); ảnh màu vẫn 2048, ảnh độ nhám và kim loại vẫn 1024.

**Ngựa:**

- Bờm là 46 lọn lông mọc từ sống cổ, rủ sang bên phải cổ, vài lọn ngắn rủ sang trái, thêm chỏm lông trước trán (trước đây là một dải phẳng dựng đứng). Mỗi lọn nằm sát da cổ, tìm bằng tia chiếu từ bên.
- Đuôi là cuống đuôi và 30 lọn lông dài tới khoeo (trước đây là một ống).
- Lọn lông là mảnh rời nên không giảm tam giác được. Vì vậy file ngựa `hi` giữ thêm bờm và đuôi kiểu cũ (`horse-mane-far`, `horse-tail-far`) cho LOD2; LOD3 dùng đuôi tám tam giác như cũ.
- Lông ngựa bóng hơn một chút (độ nhám 0,46), sắc lông có thêm biến thiên; lông bờm và đuôi thì lì (độ nhám 0,9), nếu không mỗi lọn bắt sáng một kiểu.

**Ảnh so sánh:** `art/blender/render_upgrade.py` (cách chạy ở `art/README.md`, mục "Thang chi tiết `hi`").

### Nhận xét

Ghi thẳng, để người dùng quyết:

1. **Cận cảnh, lính gần như không đổi.** LOD0 mới có gấp ba tam giác nhưng nhìn bằng mắt chỉ thấy vành khiên, mũ và bắp tay tròn hơn. Chất liệu (ảnh màu) chưa đụng tới.
2. **Cận cảnh, ngựa đổi rõ hơn:** bờm và đuôi là lông, không còn là dải và ống.
3. **Tầm trung và xa đổi rõ nhất.** Ở 26 điểm ảnh, hiện nay là hình ống màu phẳng, thang mới còn chất liệu: khiên đỏ, lông mũ, giáp vẫn đọc được.
4. **Phần lớn cái "PS1" trong cảnh không nằm ở mô hình.** Cùng một mô hình đang dùng, render trong Blender dưới nắng thì trông ổn; trong cảnh 3D, nhìn từ phía có nắng cũng ổn, nhưng nhìn từ phía khuất nắng thì cả người và ngựa thành một khối đỏ sẫm, phẳng, mất hết vân chất liệu. Nguyên nhân nằm ở cách cảnh chiếu sáng hình lính (mặt khuất gần như không có ánh sáng bù, đường cong màu của T-041 ép tối thêm, chỉ người gần nhất được vẽ bằng vật liệu có phản xạ). Ảnh chụp cảnh để đối chiếu (không lưu trong repo): `E:\World_History_Platform_assets\main-tools\shots\now-inf.png` và `now-cav.png` (phía khuất nắng), `now-infsun.png` và `now-cavsun.png` (phía có nắng).
5. **Ảnh mẫu của người dùng không dùng mô hình chi tiết hơn của ta.** Lính trong ảnh mẫu ít tam giác hơn; cái làm chúng sống là nắng gắt và ánh sáng bù mạnh, màu phe sáng, mỗi người một tư thế, trang bị khác nhau.

### Chưa làm

- **Chất liệu:** chưa tô lại (vết mòn, bụi đất, nếp vải), chưa có vài khuôn mặt và sắc áo khác nhau. Đây là phần của đề xuất ban đầu chưa làm.
- **Cảnh 3D chưa đọc được thang bốn mức.** `UNIT_LODS` trong `src/lib/battle.ts` có ba mức; phải sửa hợp đồng, `units.ts`, `figures/`, các ngưỡng, ngân sách tam giác và giới hạn dung lượng trước khi thử trong cảnh.
- **Chi phí chưa đo:** file gấp đôi (11 mô hình: khoảng 26 MB thành khoảng 50 MB tải về); số tam giác trên màn hình tăng trong khi nhánh cảnh mẫu đã sát mục tiêu 50 khung hình mỗi giây.
- Chín mô hình còn lại.
- Chưa kiểm hai lần dựng `hi` có ra file giống hệt từng byte như đường dựng thường hay không.

### Đã đổi trong script

Đường dựng thường (không có `--hi`) giữ nguyên kết quả; mọi thứ mới nằm sau cờ `--hi` và ghi ra file tên có đuôi `-hi`, không đụng `public/battles/models/` và `index.json`.

| File | Thay đổi |
|---|---|
| `whp_build.py` | Cờ `--hi`; `HI_LODS`, `HI_LIMITS` (26 000, 7 000, 1 800, 300), `HI_LIMITS_MOUNTED` cho kỵ binh (26 000, 7 000, 2 400, 330), giới hạn file 8 MB, ảnh pháp tuyến tối đa 2048; xuất ra `art/build/<id>/<id>-hi.glb`; file giai đoạn `lod` và `export` (kỵ binh: cả `anim`) có đuôi `-hi` |
| `whp_unit_lod.py` | `Part(..., hi=None)`, `game_budget()`, `hi_source()`, `build_low_parts(..., hi=False)`, `figure_levels_hi()`; `build()` đi đường `hi` khi nhận bốn giới hạn |
| `whp_export.py` | `check_glb(..., max_bytes=...)` |
| `whp_cavalry.py` | `horse_keys()`; giai đoạn `lod` đi đường `hi` khi nhận bốn giới hạn; lấy ngựa từ `horse-hi.blend` |
| `horse_build.py` | Cờ `--hi`: file `*-hi.blend`, `horse-test-hi.glb`; dựng thêm bờm và đuôi kiểu cũ làm mảnh nhìn xa |
| `horse_kit.py` | `build_mane_hi()`, `build_tail_hi()`, `_lock()`, `coat_colours_hi()`, `body_materials(hi=False)`, `MANE_FAR`, `TAIL_FAR` |
| `horse_lod.py` | `HI_BODY`, `HI_LIMITS`, `HI_HAIR`, `FAR`, `low_parts(..., hi=False)`, `levels_hi()`, `build(..., hi=False)` |
| `render_upgrade.py` | Mới: ảnh so sánh trước và sau |

### Kiểm tra

- `build_model.py --model roman-legionary --hi` và `--model roman-cavalry --hi`: bước kiểm tra file `.glb` qua (bốn lưới trong giới hạn, sáu clip, đứng trên mặt đất).
- Đường dựng thường sau khi sửa script: `horse_build.py --from rig` cho ngựa 2 952 / 629 / 111 tam giác, `build_model.py --model roman-legionary --from lod --to lod` cho 7 483 / 1 360 / 296, đúng các số trước khi sửa. Không xuất lại file trong `public/battles/models/`.
- Không đụng mã của app, nên không chạy `npm run build` cho task này.
