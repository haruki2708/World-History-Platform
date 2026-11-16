# Mô hình lính cho cảnh trận đánh 3D

Thư mục này chứa script Blender dựng mô hình lính, ảnh render để duyệt và phần ghi công. File mô hình đã xuất nằm ở `public/battles/models/`. Hợp đồng của mô hình (hệ trục, khung xương, LOD, vật liệu, hoạt hình) ở `docs/ARCHITECTURE.md`, mục "Trận đánh 3D".

```
art/
  blender/      script Python chạy bằng Blender không giao diện
  renders/      ảnh render để người dùng duyệt, mỗi mô hình một thư mục;
                infantry-lineup.jpg: tám mô hình bộ binh đứng thành hàng
  build/        file trung gian (.blend, ảnh bake, ảnh xem thử); không đưa vào git
  CREDITS.md    ghi công mô hình gốc, thư viện hoạt hình và những gì đã sửa
```

Mô hình đã có (bộ binh trận Cannae):

| Mô hình | Lính | Mô hình nền |
|---|---|---|
| `roman-legionary` | principes, bộ binh đồng minh: giáp lưới | lính La Mã |
| `roman-hastatus` | hastati: tấm đồng che ngực, tấm che ống chân, hai cây *pilum* | lính La Mã |
| `roman-triarii` | triarii: giáp lưới, giáo *hasta* | lính La Mã |
| `roman-velites` | velites, bộ binh nhẹ đồng minh: khiên tròn, da sói trên mũ, lao | lính La Mã |
| `libyan-infantry` | bộ binh Libya: đồ La Mã thu được, áo màu đất, khiên da nhạt | lính La Mã |
| `iberian-infantry` | bộ binh Iberia, lính giáo nhẹ: áo lanh trắng viền tía, khiên dài | lính La Mã |
| `balearic-slinger` | lính ném đá Baleares: ba dây ném đá | lính La Mã |
| `gallic-infantry` | bộ binh Gaul: cởi trần, quần sọc, kiếm dài, khiên dài | Celt |

## Cần có

- **Blender 5.2.2** tại `D:\Tools\Blender\5.2.2\blender.exe` (không nằm trong PATH). Không cần cài thêm add-on nào: chỉ dùng phần nhập FBX, xuất và nhập glTF, Cycles và EEVEE có sẵn.
- **File gốc** để ngoài repo, trong thư mục mà biến môi trường `WHP_ASSETS` trỏ tới. Mặc định là `E:\World_History_Platform_assets`. Cách tải và đặt file: xem `README.txt` trong thư mục đó.

  ```
  %WHP_ASSETS%\sources\
    roman-soldier-andywoodhead\source\Old man head 12 FBX test.fbx
    roman-soldier-andywoodhead\textures\*.jpeg
    celt-andywoodhead\source\unzipped\Celt 07.fbx
    celt-andywoodhead\textures\*.jpeg            (người Gaul)
    quaternius-ual\unzipped\Universal Animation Library[Standard]\Unreal-Godot\UAL1_Standard.glb
    quaternius-ual\unzipped\Universal Animation Library 2[Standard]\Unreal-Godot\UAL2_Standard.glb
  ```

  Thư viện hoạt hình: bản Standard (miễn phí) trên itch.io, chọn "No thanks, just take me to the downloads", không cần tài khoản. Giải nén cả hai file zip vào `quaternius-ual\unzipped\`. Script đọc bản **không** có `_RM` (không có chuyển động gốc).

Không đưa file gốc (FBX, glTF của thư viện, ảnh vật liệu gốc) hay file `.blend` trung gian vào repo.

## Cách chạy

Luôn chạy Blender với ba cờ `--background --factory-startup --disable-autoexec`. Chạy từ thư mục gốc của repo (PowerShell):

```powershell
$blender = "D:\Tools\Blender\5.2.2\blender.exe"

# Dựng một mô hình từ file gốc: xuất public/battles/models/<id>.glb, thêm vào index.json, kiểm tra (khoảng 2–2,5 phút)
& $blender --background --factory-startup --disable-autoexec --python art/blender/build_model.py -- --model roman-hastatus

# Dựng mọi mô hình
& $blender --background --factory-startup --disable-autoexec --python art/blender/build_model.py -- --model all

# Chạy lại từ một giai đoạn (dùng file .blend của giai đoạn trước trong art/build/<id>/)
& $blender --background --factory-startup --disable-autoexec --python art/blender/build_model.py -- --model roman-legionary --from anim

# Chỉ kiểm tra file .glb đã xuất
& $blender --background --factory-startup --disable-autoexec --python art/blender/build_model.py -- --model all --check

# Ảnh duyệt, render từ file .glb đã xuất (khoảng 30 giây mỗi mô hình)
& $blender --background --factory-startup --disable-autoexec --python art/blender/render_review.py -- --model roman-hastatus
& $blender --background --factory-startup --disable-autoexec --python art/blender/render_review.py -- --model roman-hastatus --only animations closeups

# Tám mô hình bộ binh đứng thành hàng: art/renders/infantry-lineup.jpg
& $blender --background --factory-startup --disable-autoexec --python art/blender/render_review.py -- --lineup

# Các kiểu tấn công mà một mô hình không dùng, dựng trên file .blend giai đoạn anim của nó (ảnh để thử, không lưu trong repo)
& $blender --background --factory-startup --disable-autoexec --python art/blender/render_review.py -- --attack-styles --model roman-legionary
```

Tham số của `build_model.py`, đặt sau dấu `--`:

| Tham số | Ý nghĩa |
|---|---|
| `--model <id>` | Mô hình cần dựng (một file `unit_<id>.py`, dấu gạch ngang thành gạch dưới), hoặc `all`. Bắt buộc. |
| `--from <giai đoạn>` | Bắt đầu từ giai đoạn này; cần file `.blend` của giai đoạn trước trong `art/build/<id>/`. |
| `--to <giai đoạn>` | Dừng sau giai đoạn này. |
| `--preview` | Render ảnh xem thử sau mỗi giai đoạn vào `art/build/<id>/preview-*.png`: trước, nghiêng, sau; thêm ba tư thế thử sau `rig` và vài khung hình mỗi clip sau `anim`. |
| `--check` | Chỉ đọc lại file `.glb` đã xuất và kiểm tra theo hợp đồng. |

Tham số của `render_review.py`: `--model <id>`, `--only <ảnh> ...` (tên trong danh sách `REVIEW` của mô hình: `views`, `three-quarter`, `head`, `formation`, `lods`, `animations`, `metal`, `compare`, `closeups`, `beside`, `test-poses`), `--lineup`, `--attack-styles`.

Đổi chỗ để file gốc:

```powershell
$env:WHP_ASSETS = "D:\duong\dan\khac"
```

**Chạy lại ra cùng kết quả.** Hai lần dựng từ đầu cho file `.glb` giống hệt từng byte. Script không dùng số ngẫu nhiên; Cycles bake với hạt giống cố định; thư viện hoạt hình được đọc thẳng từ file bằng numpy. Lưới do các phép `bmesh` tạo ra được đưa về thứ tự chuẩn (`whp_mesh.canonicalise`), vì các phép này trả về cạnh và mặt theo thứ tự thay đổi giữa các lần chạy.

## Quy trình chung và phần riêng của từng mô hình

Mọi mô hình đi qua cùng sáu giai đoạn (`whp_build.py`). Mỗi giai đoạn lưu `art/build/<id>/<số>-<tên>.blend`. Muốn chỉnh tay trong Blender: mở file của một giai đoạn, sửa, lưu đè, rồi chạy tiếp bằng `--from <giai đoạn sau>`. Lưu ý chạy lại từ đầu sẽ ghi đè phần chỉnh tay.

| Giai đoạn | Việc làm (chung) | Phần riêng trong `unit_<id>.py` |
|---|---|---|
| `source` | Tạo cảnh trống | `build_source()`: nhập mô hình nền, bỏ phần không hợp thời kỳ |
| `kit` | | `build_kit()`: dựng trang bị, mỗi món thêm một bản ít tam giác (`.low`) cho LOD |
| `rig` | Nhập khung xương Celt; đưa thân về tư thế chữ A và tỉ lệ của khung; chuyển trọng số theo điểm gần nhất, làm mượt; đưa về dạng chuẩn | `fit()`, `RIGID`, `SHARED`, `SMOOTHING`, `MERGE_FINGERS`, `rig_extras()` |
| `anim` | Năm clip từ thư viện hoạt hình (`whp_clips.py`) | `KIT`: có khiên không, kiểu tấn công, cách cầm vũ khí, dây ném |
| `lod` | Phần ít tam giác, atlas, bake, một vật liệu, LOD0..2 (`whp_unit_lod.py`) | `PARTS` (các phần và ngân sách tam giác), `LOD2` |
| `export` | Xuất `.glb`, thêm id vào `public/battles/models/index.json`, kiểm tra | `GROUND_CHECKS` nếu khác mặc định (giáo dựng đứng cao hơn người) |

Ảnh duyệt: `REVIEW` (danh sách và thứ tự ảnh), `CLOSEUPS`, `BESIDE`.

### Thêm một mô hình (T-021, T-022)

1. Tải mô hình nền về `%WHP_ASSETS%\sources\<tên>\`, ghi nguồn và giấy phép vào `README.txt` của thư mục đó.
2. Tạo `art/blender/unit_<id>.py`, chép từ mô hình gần nhất. Mô hình nền khác thì viết lại `build_source()` và `fit()` (ma trận đưa thân về khung xương: xem `roman_fit.py`; mô hình Celt đã đứng đúng khung nên `celt_source.build` trả ma trận đơn vị). Cùng mô hình nền La Mã thì dùng lại `roman_kit.py` (mũ, khiên, cất kiếm vào bao), `roman_weapons.py` (giáo, lao), `roman_source.recolour`/`tint` (nhuộm áo, màu da), `roman_faces.py` (râu, tóc).
3. Đặt `KIT = whp_clips.Kit(shield=..., attack=..., carry=..., lie_flat=..., sling=...)`. Kiểu tấn công có sẵn: `sword-thrust`, `spear-thrust`, `javelin-throw`, `sling`, `sword-slash` (xem dưới). `carry=whp_clips.SPEAR_CARRY` cho giáo dài cầm dựng đứng, `lie_flat=True` để giáo nằm ngang khi ngã. Tay phải cầm vũ khí thì `rig_extras()` phải ghi `whp_weapon_axis`; tay trái cầm khiên thì ghi `whp_shield_down`, `whp_shield_out` (xem `roman_kit.rig_extras`, có tham số `weapon=` và `shield=`).
4. Khai báo `PARTS` và `LOD2`, chạy `build_model.py -- --model <id> --preview`, chỉnh ngân sách tam giác cho tới khi bước kiểm tra qua.
5. Chạy `render_review.py -- --model <id>`, ghi công vào `art/CREDITS.md`.

## Thư viện hoạt hình

**Nguồn:** Universal Animation Library 1 và 2 của Quaternius (CC0), bản Standard. Khung xương 65 xương kiểu Unreal (`root`, `pelvis`, `spine_01..03`, `neck_01`, `Head`, tay, ngón, chân), cùng tên với khung Celt trừ `Head`; không có xương xoắn, không có xương IK. Tư thế nghỉ là chữ T. 30 khung/giây, khung cuối của clip lặp trùng khung đầu.

**Đổi đích** (`whp_ual.py` đọc file, `whp_retarget.py` đổi đích):

- Thân, cổ, đầu, tay và bàn chân giữ hướng của nguồn trong không gian. Mỗi xương có một khung giải phẫu dựng giống nhau trên cả hai khung xương từ hai hướng (dọc xương; về trước hoặc ngang lòng bàn tay), nên khác biệt tư thế nghỉ (chữ T, chữ A) được bù hết.
- Hông đi theo hông của nguồn, nhân với tỉ lệ chiều dài chân (0,998).
- Chân giải bằng IK hai đoạn: mắt cá đặt theo mắt cá của nguồn tính từ hông, độ cao trên mặt đất theo nguồn, đầu gối gập theo hướng của nguồn. Khung Celt đứng dạng chân (mắt cá cách nhau 39 cm) nên không thể chép thẳng góc xương chân.
- Nửa độ xoay của bàn tay quanh cẳng tay chuyển sang xương xoắn của cẳng tay. Ngón tay giữ tư thế nghỉ (nắm tay đã khép trong lưới).

**Chỉnh sau khi đổi đích** (`whp_clips.py`):

- **Tay cầm khiên.** Tay trái được giải lại bằng IK để khiên giữ một chỗ và một góc định sẵn trước ngực (`SHIELD_CARRY`: đứng, hành quân, chạy, thủ thế, đẩy khiên, ngã, ngồi bệt). Khung tham chiếu theo ngực một phần (`follow`), nên khiên nhún theo người mà không quay ngang khi thân xoay.
- **Vũ khí.** Khi không đánh, cổ tay phải xoay cho lưỡi kiếm chĩa ra trước và xuống (`WEAPON_CARRY`). Khi đánh, tay phải đi theo một đường IK định sẵn, nhịp lấy theo độ duỗi tay của clip nguồn, và vũ khí được ngắm theo hướng đâm.
- **`die`.** Người mặc giáp nằm cao hơn hình nộm của thư viện: sau khi dựng, script đo điểm thấp nhất của mọi lưới ở khung cuối và nâng hông lên cho vừa chạm đất (lính La Mã: 8,2 cm). Khi đã nằm, đầu cúi vừa đủ để ngù lông mũ nằm dọc mặt đất thay vì cắm xuống. Khiên nằm trên người.

**Clip** (giống nhau cho mọi mô hình; số đo của hai mô hình La Mã):

| Clip | Nguồn | Độ dài | Ghi chú |
|---|---|---|---|
| `idle` | `Idle_Loop` (UAL 1) | 2,5 s (75 khung) | Đứng thở, khiên chếch bên trái, kiếm chĩa xuống. Lặp. |
| `walk` | `Walk_Loop` (UAL 1) | 1,333 s (40 khung) | Đi tại chỗ. **Một vòng = 1,00 m**, tức 0,75 m/s. Lặp. |
| `run` | `Jog_Fwd_Loop` (UAL 1) | 0,933 s (28 khung) | Chạy tại chỗ, khiên cao hơn. **Một vòng = 1,99 m**, tức 2,13 m/s. Lặp. |
| `attack` | tuỳ mô hình, xem dưới | | Lặp. |
| `die` | `Death01` (UAL 1) | 2,4 s (72 khung) | Ngã ngửa, nằm yên từ khoảng khung 50. **Không lặp**: cảnh giữ khung cuối. |

Quãng đường một vòng đo từ chính clip đã đổi đích (bàn chân đang chạm đất trượt về sau bao nhiêu trong một vòng). Muốn đi nhanh hơn thì cảnh tăng tốc độ phát clip theo tỉ lệ: tốc độ phát = tốc độ di chuyển / (quãng đường một vòng / độ dài clip).

**Các kiểu tấn công** (`whp_clips.ATTACKS`; tên clip trong file `.glb` luôn là `attack`):

| Kiểu | Nguồn thân | Độ dài | Dùng cho |
|---|---|---|---|
| `sword-thrust` | `Punch_Cross` (UAL 1) | 1,0 s | Đâm kiếm qua mép phải khiên, khiên đẩy tới trước một nhịp. `roman-legionary`, `roman-hastatus`, `libyan-infantry`, `iberian-infantry`. |
| `spear-thrust` | `Punch_Cross` (UAL 1) | 1,0 s | Đâm giáo tầm hông, cán giáo chạy qua mép phải khiên, khiên giữ yên. `roman-triarii`. |
| `javelin-throw` | `OverhandThrow` (UAL 2) | 1,333 s | Phóng lao qua vai. Thân và chân chỉ giữ một nửa biên độ của nguồn (lính trong hàng không lao cả người). `roman-velites`. |
| `sling` | `OverhandThrow` (UAL 2) | 1,333 s | Một vòng rưỡi dây trên đầu, hòn đá chạy sau bàn tay; rồi vung lên sau vai, ném ra trước và lên; dây rũ xuống. Đường tay tự dựng (không có clip nguồn cho dây ném). `balearic-slinger`. |
| `sword-slash` | `OverhandThrow` (UAL 2) | 1,333 s | Giơ kiếm qua vai phải, lưỡi chĩa lên sau, rồi bổ xuống trước và chéo sang trái; khiên giữ yên. Thân giữ nửa biên độ. `gallic-infantry`. |

**Giáo dài** (`SPEAR_CARRY`): khi không đánh, cánh tay phải giải bằng IK, cẳng tay đưa ra trước, giáo dựng đứng cạnh đùi, đế giáo cách đất vài cm, mũi giáo cao khoảng 2,4 m.

**Dây ném đá co giãn** (`balearic_kit.py`, `whp_clips.SlingCord`): túi và hòn đá gắn vào xương `ik_hand_gun` của khung (xương IK không lưới nào dùng); hai sợi dây có trọng số chuyển dần từ bàn tay (ở nắm tay) sang xương đó (ở túi). Mọi clip đặt xương này vào chỗ hòn đá: treo dưới tay khi đứng, đi, chạy; nằm dọc mặt đất khi ngã; quay quanh đầu và văng ra khi ném. Xương này có cả vị trí lẫn góc quay trong clip.

Các clip kiếm của thư viện (`Sword_Attack`, `Sword_Regular_*`, `Sword_Dash`...) có chém vòng, xoay người, nhảy, không hợp với lính giữ đội hình, nên không dùng.

## Giai đoạn `lod`

- **Phần ít tam giác.** Mỗi phần của mô hình chi tiết có một bản ít tam giác. Với lưới gốc: bỏ mặt nằm dưới lớp khác (tay dưới tay áo, áo dưới giáp, da đầu dưới mũ, cả chỗ lòi ra ngoài lớp phải che nó), hạ mặt dưới bàn chân xuống đế xăng đan, chiếu UV trên lưới dày rồi mới giảm tam giác. Trang bị tự dựng dùng bản `.low`. Không bỏ mặt dưới những lớp đứng cách người (tấm che ngực, tấm che ống chân): nhìn chéo vào khe sẽ thấy lỗ.
- **Atlas.** Một bộ UV chung, mật độ điểm ảnh chuẩn hoá theo diện tích (mặt người ×1,8, mặt sau khiên ×0,45). Các mảnh được xếp với khoảng hở cố định 3 điểm ảnh mỗi bên (ở 2048), không theo kiểu "scaled" của Blender: lính La Mã phủ 66,6% ô UV (trước là 35,6%), 79% điểm ảnh ảnh màu có dùng (trước là 52%), nên mặt và giáp nét hơn khoảng 1,35 lần.
- **Bake.** Cycles bake:
  - ảnh màu 2048 từ mô hình chi tiết;
  - ảnh pháp tuyến: bake ở 2048, lấy trung bình xuống 1024;
  - **ảnh độ nhám và kim loại** (`metallicRoughnessTexture`: kênh G độ nhám, kênh B kim loại): bake ở 2048 từ giá trị Roughness và Metallic của từng vật liệu (`whp_lod.SurfaceSwap`), lấy trung bình xuống 1024. Đồng, sắt, giáp lưới là kim loại. Lưỡi kiếm của mô hình gốc lấy độ kim loại theo độ bão hoà màu: chỗ xám là thép, chỗ nâu (chuôi gỗ, xương) thì không;
  - độ che khuất môi trường (AO) bake ở 1024 từ chính các phần LOD0, viền 1 điểm ảnh, rồi nhân vào ảnh màu; khiên, kiếm, *pilum* bake riêng để không in bóng lên người.
- **LOD1.** Giảm tam giác từ các phần của LOD0, nên dùng lại UV và trọng số; bao kiếm bỏ ở mức này.
- **LOD2.** Thân người dựng lại bằng các ống và elip đặt theo khung xương, mỗi tam giác một màu phẳng lấy từ atlas (`whp_proxy.py`). Mũ, lông, khiên, kiếm, *pilum* vẫn giảm từ phần của chúng.
- **Trọng số.** Tối đa 4 xương mỗi đỉnh.
- **Thuộc tính phụ.** Thuộc tính màu (dùng để đánh dấu viền áo cho bake) và các thuộc tính `whp_*` bị xoá khỏi LOD trước khi xuất; bước kiểm tra báo lỗi nếu file có `COLOR_n` (three.js sẽ nhân màu đỉnh vào vật liệu).
- **Không có váy.** Mô hình mặc quần (người Gaul) đặt `LOD2["skirt"] = None`.

## Giai đoạn `export`

- **Xuất.** glTF nhị phân, ảnh JPEG, có tangent, đủ 67 xương, mỗi clip một animation lấy mẫu từng khung (30 khung/giây).
- **Danh sách mô hình.** Thêm id vào `public/battles/models/index.json`, giữ thứ tự chữ cái; chỉ ghi file khi danh sách đổi.
- **Kiểm tra.** Đọc chính file `.glb`:
  - một khung xương 67 xương;
  - ba lưới `LOD0`, `LOD1`, `LOD2` trong giới hạn tam giác;
  - một vật liệu; ảnh màu tối đa 2048, ảnh pháp tuyến và ảnh độ nhám/kim loại tối đa 1024;
  - năm clip `idle`, `walk`, `run`, `attack`, `die`;
  - đứng trên y = 0, ngón chân hướng +Z, đầu hướng +Y;
  - dung lượng tối đa 4 MB; có tên trong `index.json`.

  Sau đó nhập lại file vào Blender và thử vài tư thế với mặt đất: khung đầu `idle` và `walk` đứng trên đế dép, khung cuối `die` nằm sát đất và không vật nào xuyên xuống. Có lỗi thì script dừng với mã 1.

## Ghi chú cho cảnh 3D (lane 3)

- **Hoạt hình:** độ dài và quãng đường một vòng ở bảng "Clip" phía trên. Không có chuyển động gốc: hình lính đứng yên tại chỗ, cảnh tự di chuyển nó. `die` không lặp, giữ khung cuối.
- **Tư thế gốc** (khi không phát clip nào) là tư thế chữ A, khiên nằm dọc cánh tay trái, *pilum* của hastatus chĩa chéo lên. Cảnh luôn phát ít nhất `idle`.
- **Vật liệu:** ảnh màu (đã nhân AO), ảnh pháp tuyến, ảnh độ nhám và kim loại. Màu gốc của kim loại là màu phản xạ của kim loại (T-021: đồng khoảng sRGB (231, 182, 115), sắt khoảng (197, 198, 201), độ nhám đồng 0,40, sắt 0,42, giáp lưới 0,55). Ảnh so sánh trong cảnh three.js: `art/renders/roman-legionary/15-scene-metal-before-after.jpg`.
- **Cao nhất:** mũi giáo của triarii cao khoảng 2,4 m khi đứng (các mô hình khác dưới 2,25 m).
- **Lính Baleares:** xương `ik_hand_gun` có vị trí và góc quay trong mọi clip (túi đá của dây ném). Cảnh phải phát kênh của mọi xương, không chỉ các xương thân.
- **Tâm hình lính:** đứng giữa gốc toạ độ; khiên ở bên trái của người lính, tức phía +X trong glTF (lính nhìn về +Z, trục Y hướng lên).

## Các file script

| File | Nội dung |
|---|---|
| `build_model.py` | Điểm vào: dựng một mô hình hay tất cả. |
| `render_review.py` | Ảnh duyệt, render từ file `.glb` đã xuất; ảnh các kiểu tấn công của thư viện. |
| `whp_build.py` | Các giai đoạn chung, dòng lệnh, kiểm tra, `index.json`. |
| `whp_common.py` | Đường dẫn (`WHP_ASSETS`, `art/build/`), đọc tham số, nhập FBX, tiện ích chọn, gộp, nhân bản đối tượng. |
| `whp_render.py` | Đèn, camera, render ảnh tĩnh bằng EEVEE. |
| `whp_mesh.py` | Truy cập đỉnh bằng numpy, dựng lưới, đưa lưới về thứ tự chuẩn. |
| `whp_materials.py` | Vật liệu thủ tục: đồng, sắt, da, gỗ, sơn khiên, lông, vòng giáp lưới; độ nhám và kim loại của từng loại. |
| `whp_skeleton.py` | Khung xương chung (lấy từ mô hình Celt), đưa về dạng chuẩn, gắn lưới, tạo tư thế. |
| `whp_skin.py` | Chuyển trọng số theo điểm gần nhất, làm mượt, giới hạn số xương, skinning bằng numpy. |
| `whp_anim.py` | `Poser`: dựng tư thế theo trục của người lính (xoay, ngắm, đặt hướng xương, IK hai đoạn) và ghi keyframe. |
| `whp_ual.py` | Đọc file `.glb` của thư viện hoạt hình bằng numpy, lấy mẫu clip. |
| `whp_retarget.py` | Đổi đích tư thế từ thư viện sang khung xương chung. |
| `whp_clips.py` | Năm clip chuẩn, tay cầm khiên, vũ khí, các kiểu tấn công, tư thế thử. |
| `whp_lod.py` | Phần ít tam giác, atlas UV, bake, xử lý ảnh, vật liệu cuối. |
| `whp_unit_lod.py` | Giai đoạn `lod` chung: các phần, bake, ghép ảnh, LOD0..2. |
| `whp_proxy.py` | Hình người đơn giản theo khung xương cho LOD2. |
| `whp_export.py` | Xuất glTF và kiểm tra file `.glb` theo hợp đồng. |
| `unit_<id>.py` | Phần riêng của từng mô hình (tám file). |
| `roman_kit.py` | Phần chung của các mô hình dựng trên lính La Mã: chuẩn bị thân (kiếm trong tay, trong bao hay bỏ), mũ, khiên, vật liệu, luật gắn xương, dữ liệu cho clip. |
| `roman_weapons.py` | Giáo *hasta*, lao nhẹ, lao Iberia; cất kiếm vào bao. |
| `roman_parma.py` | Khiên tròn của velites. |
| `roman_faces.py` | Màu da, râu và tóc dựng từ lưới đầu của mô hình nền. |
| `balearic_kit.py` | Ba dây ném đá (dây cầm tay co giãn), túi đá. |
| `celt_source.py` | Nhập mô hình Celt cho người Gaul; xoá hình vẽ trên da, nhuộm lại quần. |
| `celt_kit.py` | Kiếm dài và khiên của người Gaul, đặt vào tay mô hình Celt. |
| `roman_source.py` | Nhập mô hình 07, bỏ trang bị thời Đế chế, chuyển bao kiếm; nhuộm áo, viền áo, màu da. |
| `roman_hands.py` | Nắm bàn tay, đặt kiếm vào tay. |
| `roman_helmet.py` | Mũ Montefortino, má che, lông mũ; da sói phủ mũ (velites); mũ gân (Iberia). |
| `roman_mail.py` | Giáp lưới, lớp che vai, đai, móc ngực. |
| `roman_armour.py` | Tấm đồng che ngực và dây da, tấm che ống chân, hai cây *pilum*. |
| `roman_shield.py` | Khiên bầu dục; `variant()` và `OVAL_SHIELD` cho khiên dài của người Gaul và Iberia. |
| `roman_fit.py` | Khớp tư thế và tỉ lệ của 07 vào khung xương chung. |

## Ảnh duyệt

Tất cả render từ file `.glb` đã xuất, tức đúng thứ cảnh 3D nhận được; riêng ảnh `compare-source` có thêm mô hình gốc 07.

### `art/renders/roman-legionary/`

| Ảnh | Nội dung |
|---|---|
| `01-front-side-back.jpg` | Nhìn trước, nghiêng (phía khiên), sau; tư thế đứng (`idle`). |
| `02-three-quarter.jpg` | Nhìn chéch từ trước bên phải (phía kiếm). |
| `03-head-front.jpg`, `04-head-side.jpg` | Cận đầu và mũ. |
| `05-formation.jpg` | 20 lính: 5 hàng ngang, 4 hàng dọc, lệch nhịp nhau. |
| `06-lods.jpg` | LOD0, LOD1, LOD2 cạnh nhau. |
| `07-anim-idle.jpg` … `11-anim-die.jpg` | Ba khung hình mỗi clip: `idle`, `walk`, `run`, `attack`, `die`. |
| `12-metal-before-after.jpg` | Trái: vật liệu không có ảnh độ nhám/kim loại (như T-014). Phải: như đã xuất. |
| `13-compare-source.jpg` | Mô hình gốc 07 như khi tải về; mô hình mới ở tư thế gốc; mô hình mới đứng. |
| `14-test-poses.jpg` | Tư thế thử khung xương: giơ tay, bước dài, cúi người. |

### `art/renders/roman-hastatus/`

| Ảnh | Nội dung |
|---|---|
| `01-front-side-back.jpg` | Nhìn trước, nghiêng (phía khiên), sau. |
| `02-three-quarter.jpg` | Nhìn chéch từ phía kiếm. |
| `03-head-front.jpg`, `04-head-side.jpg` | Cận đầu và mũ. |
| `05-formation.jpg` | 20 lính dàn đội hình. |
| `06-lods.jpg` | LOD0, LOD1, LOD2. |
| `07-anim-idle.jpg` … `11-anim-die.jpg` | Ba khung hình mỗi clip. |
| `12-metal-before-after.jpg` | Trước và sau ảnh độ nhám/kim loại. |
| `13-chest-pilum.jpg` | Trái: cận ngực, tấm đồng và dây da. Phải: hai cây *pilum* trong tay trái sau khiên, nhìn từ sau. |
| `14-beside-roman-legionary.jpg` | `roman-legionary` và `roman-hastatus`: nhìn trước, rồi nhìn nghiêng. |
| `15-test-poses.jpg` | Tư thế thử khung xương. |

`roman-legionary/15-scene-metal-before-after.jpg`: ảnh chụp cảnh three.js (`/battle-lab`, Cannae), hàng đầu quân La Mã lúc 08:00 (hai hàng trên: trước, sau) và lúc 12:00 (trái: trước, phải: sau), trước và sau khi đổi màu kim loại ở T-021.

### Sáu mô hình của T-021

`art/renders/<model>/` của `roman-triarii`, `roman-velites`, `libyan-infantry`, `iberian-infantry`, `balearic-slinger`, `gallic-infantry` có cùng bộ ảnh:

| Ảnh | Nội dung |
|---|---|
| `01-front-side-back.jpg` | Nhìn trước, nghiêng (phía tay trái), sau; tư thế đứng (`idle`). |
| `02-three-quarter.jpg` | Nhìn chéch từ phía tay phải. |
| `03-head-front.jpg`, `04-head-side.jpg` | Cận đầu. |
| `05-formation.jpg` | 20 lính dàn đội hình. |
| `06-lods.jpg` | LOD0, LOD1, LOD2. |
| `07-anim-idle.jpg` … `11-anim-die.jpg` | Ba khung hình mỗi clip; `10-anim-attack.jpg` là kiểu tấn công của mô hình. |
| `12-beside-roman-legionary.jpg` | Đứng cạnh `roman-legionary`: nhìn trước, rồi nhìn nghiêng. |
| `13-test-poses.jpg` | Tư thế thử khung xương. |

### `art/renders/infantry-lineup.jpg`

Tám mô hình bộ binh đứng thành hàng, nhìn trước, từ trái sang: `roman-velites`, `roman-hastatus`, `roman-legionary`, `roman-triarii`, `libyan-infantry`, `iberian-infantry`, `gallic-infantry`, `balearic-slinger`.

## Tham khảo hình dáng

Trang bị dựng theo mô tả văn bản và hình dạng đã biết của các hiện vật dưới đây. Không dùng ảnh, mô hình hay ảnh vật liệu nào của các nguồn này làm vật liệu, và không dùng tài sản trích từ game.

- **Polybius, *Histories* 6.23** (bản dịch tiếng Anh của W. R. Paton, Loeb 1922–1927, phạm vi công cộng):
  - khiên cong, rộng 2,5 bộ, dài 4 bộ, có viền sắt ở mép trên và dưới, có núm sắt;
  - kiếm đeo bên đùi phải;
  - mũ đồng có ngù ba lông đỏ tía hoặc đen, đứng thẳng, cao khoảng một cubit;
  - mỗi người hai cây *pilum*, một to (tròn, đường kính một lòng bàn tay, hoặc vuông mỗi cạnh một lòng bàn tay), một mảnh như giáo săn; cán gỗ khoảng ba cubit, mũi sắt có ngạnh dài bằng cán, tán đinh vào tới nửa cán;
  - tấm che ống chân bằng đồng;
  - số đông đeo một tấm đồng vuông mỗi cạnh một gang tay, đặt trước tim (*pectorale*); chỉ người có tài sản trên mười nghìn drachma mặc giáp lưới.
- **Mũ kiểu Montefortino** (thế kỷ 4–1 TCN): chỏm tròn hơi nhọn có núm đúc liền, vành sau ngắn hình mái che gáy, hai má che có khoét theo mắt và miệng. Có nhiều chiếc trong các bảo tàng châu Âu.
- **Phù điêu "bàn thờ Domitius Ahenobarbus"** (Louvre, khoảng cuối thế kỷ 2 TCN): lính mặc giáp lưới có lớp che vai, mũ có ngù, khiên bầu dục.
- **Khiên Kasr el-Harit** (Fayum, Ai Cập), hiện vật duy nhất còn gần nguyên của loại scutum bầu dục: cao khoảng 1,28 m, ván gỗ ghép nhiều lớp, gờ dọc giữa phình ra thành chỗ đặt núm.
- **Mũi *pilum* thời Cộng hoà** tìm thấy ở Talamone (Ý) và các trại La Mã quanh Numantia (Renieblas, Tây Ban Nha): có loại chuôi dẹt tán đinh vào khối gỗ ở đầu cán, có loại ống tra cán; thân sắt dài, mũi nhỏ hình chóp có ngạnh. Hai cây của hastatus làm theo hai loại này.
- **Tấm che ngực vuông:** chưa tìm được hiện vật bảo tàng nào. Kích thước theo Polybius; gờ cuộn và núm tròn ở giữa là chi tiết tự thêm, theo kiểu các tấm đĩa che ngực (*kardiophylax*) bằng đồng của người Ý.
- **Tấm che ống chân:** dáng ôm cẳng chân, hở phía sau, như các tấm che ống chân bằng đồng kiểu Hy Lạp và Ý trong bảo tàng. Polybius chỉ viết "greaves" (số nhiều), không nói rõ mỗi người một hay hai chiếc; mô hình đeo cả hai.

**Sáu mô hình của T-021:**

- **Polybius 6.21–23** (Paton): velites không giáp, khiên tròn ba bộ, mũ trơn đôi khi phủ da sói, kiếm, lao có cán khoảng hai cubit to bằng ngón tay và mũi sắt dài một gang, mỏng đến mức cong khi đâm trúng; triarii trang bị như principes nhưng cầm giáo thay *pilum*.
- **Polybius 3.87, 3.114; Livy 22.46:** người Libya mang vũ khí La Mã thu được ở Trebia và Trasimene, nhìn như quân La Mã; khiên người Iberia và người Gaul rất giống nhau; kiếm Iberia vừa đâm vừa chém, kiếm Gaul chỉ chém và cần vung rộng; người Gaul cởi trần, người Iberia mặc áo ngắn bằng vải lanh trắng viền đỏ tía.
- **Polybius 2.28–33:** người Gaul mặc quần và áo choàng nhẹ (người Gaesatae cởi trần), đeo vòng cổ và vòng tay bằng vàng; kiếm không mũi, dễ cong.
- **Diodorus 5.28–30:** người Gaul để ria mép, mặc áo nhuộm nhiều màu và quần dài (*bracae*); **5.17–18:** người Baleares mùa hè gần như không mặc gì, mang ba dây ném đá (quanh đầu, quanh bụng, trong tay), ném đá to hơn mọi lính ném đá khác.
- **Strabo 3.5.1:** dây ném đá của người Baleares bằng cói đen, lông hay gân; người Phoenicia là những người đầu tiên cho họ mặc áo có viền rộng. **Strabo 3.3.6:** phần đông người Lusitania đội mũ bằng gân, ít người có giáp xích và mũ ba ngù.
- **Khiên kiểu La Tène** (gờ dọc, núm hình thoi, đai sắt ngang qua núm): nhiều khiên và đai núm khiên còn lại từ các khu La Tène và các mộ người Celt; khiên Iberia (*scutum* của lính Hispania) cùng dáng.
- **Kiếm La Tène** (lưỡi dài song song, đầu tròn): các kiếm thế kỷ 3 TCN trong bảo tàng; người Gaul ở Cannae dùng kiếm này theo Polybius.
- **Màu chưa có nguồn:** màu khiên của người Libya (da nhạt), người Iberia (da bò), người Gaul (xanh chàm, theo khiên của mô hình nền), màu nâu đất của áo người Libya, màu viền áo người Baleares là lựa chọn để phân biệt các đạo quân, không có nguồn trực tiếp.

Những chỗ còn theo mô hình nền, chưa chắc đúng năm 216 TCN, ghi ở mục "Kết quả" của `docs/tasks/T-014-roman-legionary-model.md`, `docs/tasks/T-019-animations-hastatus.md` và `docs/tasks/T-021-infantry-models.md`.
