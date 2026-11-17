# Mô hình lính cho cảnh trận đánh 3D

Thư mục này chứa script Blender dựng mô hình lính, ảnh render để duyệt và phần ghi công. File mô hình đã xuất nằm ở `public/battles/models/`. Hợp đồng của mô hình (hệ trục, khung xương, LOD, vật liệu, hoạt hình) ở `docs/ARCHITECTURE.md`, mục "Trận đánh 3D".

```
art/
  blender/      script Python chạy bằng Blender không giao diện
  tools/        script Python chạy ngoài Blender (numpy): gait_check.py đo sải
                chân và độ trượt chân của walk/run trên file .glb như cảnh đo
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
3. Đặt `KIT = whp_clips.Kit(shield=..., attack=..., carry=..., lie_flat=..., sling=..., spare=...)`. Kiểu tấn công có sẵn: `sword-thrust`, `spear-thrust`, `javelin-throw`, `sling`, `sword-slash` (xem dưới). `carry=whp_clips.SPEAR_CARRY` cho giáo dài cầm dựng đứng, `lie_flat=True` để giáo nằm ngang khi ngã. Tay phải cầm vũ khí thì `rig_extras()` phải ghi `whp_weapon_axis`; tay trái cầm khiên thì ghi `whp_shield_down`, `whp_shield_out` (xem `roman_kit.rig_extras`, có tham số `weapon=` và `shield=`).
4. Khai báo `PARTS` và `LOD2`, chạy `build_model.py -- --model <id> --preview`, chỉnh ngân sách tam giác cho tới khi bước kiểm tra qua.
5. Chạy `render_review.py -- --model <id>`, ghi công vào `art/CREDITS.md`.

## Thư viện hoạt hình

**Nguồn:** Universal Animation Library 1 và 2 của Quaternius (CC0), bản Standard. Khung xương 65 xương kiểu Unreal (`root`, `pelvis`, `spine_01..03`, `neck_01`, `Head`, tay, ngón, chân), cùng tên với khung Celt trừ `Head`; không có xương xoắn, không có xương IK. Tư thế nghỉ là chữ T. 30 khung/giây, khung cuối của clip lặp trùng khung đầu.

**Đổi đích** (`whp_ual.py` đọc file, `whp_retarget.py` đổi đích):

- Thân, cổ, đầu, tay và bàn chân giữ hướng của nguồn trong không gian. Mỗi xương có một khung giải phẫu dựng giống nhau trên cả hai khung xương từ hai hướng (dọc xương; về trước hoặc ngang lòng bàn tay), nên khác biệt tư thế nghỉ (chữ T, chữ A) được bù hết.
- Hông đi theo hông của nguồn, nhân với tỉ lệ chiều dài chân (0,998).
- Chân giải bằng IK hai đoạn: mắt cá đặt theo mắt cá của nguồn tính từ hông, độ cao trên mặt đất theo nguồn, đầu gối gập theo hướng của nguồn. Khung Celt đứng dạng chân (mắt cá cách nhau 39 cm) nên không thể chép thẳng góc xương chân.
- Nửa độ xoay của bàn tay quanh cẳng tay chuyển sang xương xoắn của cẳng tay. Ngón tay giữ tư thế nghỉ (nắm tay đã khép trong lưới; với người Gaul, nắm tay được khép ở giai đoạn `source`, xem `celt_hands.py`).

**Chỉnh sau khi đổi đích** (`whp_clips.py`):

- **Tay cầm khiên.** Tay trái được giải lại bằng IK để khiên giữ một chỗ và một góc định sẵn trước ngực (`SHIELD_CARRY`: đứng, hành quân, chạy, thủ thế, đẩy khiên, ngã, ngồi bệt). Khung tham chiếu theo ngực một phần (`follow`), nên khiên nhún theo người mà không quay ngang khi thân xoay.
- **Vũ khí.** Khi không đánh, cổ tay phải xoay cho lưỡi kiếm chĩa ra trước và xuống (`WEAPON_CARRY`). Khi đánh, tay phải đi theo một đường IK định sẵn, nhịp lấy theo độ duỗi tay của clip nguồn, và vũ khí được ngắm theo hướng đâm.
- **Khoá chân trụ** (T-024, `Builder.lock_feet`). Clip `walk` của thư viện tự nó đã trượt chân lúc bàn chân lăn: lúc mũi chân đẩy rời đất, mũi chân trượt ra trước (tới 80% tốc độ mặt đất trong vài khung). Với `walk` và `run`, script dựng clip ba lượt nữa. Mỗi lượt, với từng bàn chân đang chạm đất, dời mắt cá theo chiều ngang để đỉnh thấp nhất của đế lùi đúng tốc độ mặt đất từ khung này sang khung sau. Độ dời được canh giữa trong mỗi lần chạm đất, rồi trả về dần trong lúc chân ở trên không. Mắt cá dời tối đa 2,1 cm (`walk`) và 0,8 cm (`run`). Độ trượt lớn nhất của chân trụ trên LOD0 của file `.glb`: `walk` từ 81% xuống 3–6%, `run` từ 6% xuống 1%. Log của giai đoạn `anim` ghi các số này cho từng mô hình.
- **`die`.** Người mặc giáp nằm cao hơn hình nộm của thư viện: sau khi dựng, script đo điểm thấp nhất của mọi lưới ở khung cuối và nâng hông lên cho vừa chạm đất (lính La Mã: 8,2 cm). Khi đã nằm, đầu cúi vừa đủ để ngù lông mũ nằm dọc mặt đất thay vì cắm xuống. Khiên nằm trên người.

**Clip** (giống nhau cho mọi mô hình; số đo của hai mô hình La Mã):

| Clip | Nguồn | Độ dài | Ghi chú |
|---|---|---|---|
| `idle` | `Idle_Loop` (UAL 1) | 2,5 s (75 khung) | Đứng thở, khiên chếch bên trái, kiếm chĩa xuống. Lặp. |
| `walk` | `Walk_Loop` (UAL 1) | 1,333 s (40 khung) | Đi tại chỗ. **Một vòng = 1,30 m**, tức 0,975 m/s. Lặp. |
| `run` | `Jog_Fwd_Loop` (UAL 1) | 0,933 s (28 khung) | Chạy tại chỗ, khiên cao hơn. **Một vòng = 5,45 m**, tức 5,84 m/s: chạy rất nhanh, gần chạy nước rút (xem dưới). Lặp. |
| `attack` | tuỳ mô hình, xem dưới | | Lặp. |
| `die` | `Death01` (UAL 1) | 2,4 s (72 khung) | Ngã ngửa, nằm yên từ khoảng khung 50. **Không lặp**: cảnh giữ khung cuối. |

**Quãng đường một vòng** đo như cảnh đo (`plantedStride` trong `src/components/battle/engine/figures/model.ts`): đỉnh đế bàn chân nào nằm trong 2 cm trên điểm thấp nhất của clip ở hai khung liền nhau thì đang chạm đất, và lùi về sau đúng bằng tốc độ hình lính đi. Lấy trung vị các tốc độ đó, nhân với độ dài clip. Log của giai đoạn `anim` đo trên lưới chi tiết; `art/tools/gait_check.py` đo trên LOD0 của file `.glb` (hai số chênh nhau dưới 0,01 m). Số ở bảng là của mô hình La Mã; các mô hình khác chênh dưới 0,02 m.

Số cũ (1,00 m và 1,99 m, từ T-019 tới T-021) sai: script cộng quãng lùi của mắt cá thấp hơn qua từng khung.
- `walk`: lúc hai chân cùng chạm đất, mắt cá của chân vừa hạ đã thấp hơn, nên script theo chân đó (mắt cá còn đưa ra trước), bỏ qua mũi chân sau vẫn đang tì đất và lùi theo mặt đất. Hụt khoảng 0,29 m mỗi vòng.
- `run`: 19 trên 28 khung không bàn chân nào chạm đất. Hình lính vẫn đi trong lúc đó, nhưng script không tính (còn trừ đi chút quãng chân đưa ra trước).

Muốn đi nhanh hơn thì cảnh tăng tốc độ phát clip theo tỉ lệ: tốc độ phát = tốc độ di chuyển / (quãng đường một vòng / độ dài clip).

**`run` là chạy nhanh từ clip nguồn, không phải do đổi đích.** Bản có chuyển động gốc của thư viện (`UAL1_Standard_RM.glb`) đi 5,00 m trong một vòng `Jog_Fwd_Loop` (5,36 m/s); bản tại chỗ mà ta dùng cho chân trụ lùi 5,9 m/s. Đổi đích giữ nguyên tỉ lệ (chân của khung xương dài bằng 0,998 lần chân hình nộm). Clip có nhịp 129 bước/phút, mỗi bước 2,7 m, mỗi bàn chân chỉ chạm đất 4–5 trên 28 khung (khoảng 16% vòng): dáng của chạy nước rút. Thư viện không có clip chạy chậm nào khác. Đề xuất cách xử lý ghi ở mục "Kết quả" của T-024.

**Các kiểu tấn công** (`whp_clips.ATTACKS`; tên clip trong file `.glb` luôn là `attack`):

| Kiểu | Nguồn thân | Độ dài | Dùng cho |
|---|---|---|---|
| `sword-thrust` | `Punch_Cross` (UAL 1) | 1,0 s | Đâm kiếm qua mép phải khiên, khiên đẩy tới trước một nhịp. `roman-legionary`, `roman-hastatus`, `libyan-infantry`, `iberian-infantry`. |
| `spear-thrust` | `Punch_Cross` (UAL 1) | 1,0 s | Đâm giáo tầm hông, cán giáo chạy qua mép phải khiên, khiên giữ yên. `roman-triarii`. |
| `javelin-throw` | `OverhandThrow` (UAL 2) | 1,333 s | Phóng lao qua vai. Thân giữ một nửa biên độ của nguồn (lính trong hàng không lao cả người), chân một phần tư (T-024: với nửa biên độ, đùi bước ra trước chọc qua vạt áo). `roman-velites`. |
| `sling` | `OverhandThrow` (UAL 2) | 1,333 s | Một vòng rưỡi dây trên đầu, hòn đá chạy sau bàn tay; rồi vung lên sau vai, ném ra trước và lên; dây rũ xuống. Đường tay tự dựng (không có clip nguồn cho dây ném). Chân giữ một phần tư biên độ, như `javelin-throw`. `balearic-slinger`. |
| `sword-slash` | `OverhandThrow` (UAL 2) | 1,333 s | Giơ kiếm qua vai phải, lưỡi chĩa lên sau, rồi bổ xuống trước và chéo sang trái; khiên giữ yên. Thân giữ nửa biên độ. `gallic-infantry`. |

**Giáo dài** (`SPEAR_CARRY`): khi không đánh, cánh tay phải giải bằng IK, cẳng tay đưa ra trước, giáo dựng đứng cạnh đùi, đế giáo cách đất vài cm, mũi giáo cao khoảng 2,44 m. Hướng giáo đặt trong khung ngực, mà ngực nghiêng ra trước khoảng 9° khi đứng và đi, nên trong khung đó giáo ngả về sau bằng chừng ấy (T-024): nhìn nghiêng, giáo lệch khỏi phương thẳng đứng dưới 3° khi đứng và đi, ngả ra trước khoảng 18° khi chạy (trước là 14°, 15° và 30°).

**Vật cầm thêm trong tay trái** (`Kit(spare=True)`, T-024): hai cây *pilum* của hastatus. Ở giai đoạn `rig`, vật được khớp tư thế theo `hand_l` rồi gắn vào xương `ik_hand_l` (`RIGID = {"Pila": ("hand_l", whp_clips.SPARE_BONE)}`; xương IK không lưới nào khác dùng). Trong mọi clip xương này theo bàn tay trái; riêng `attack` và `die` nó thu nhỏ còn 1% quanh cổ tay (`SPARE_GONE`, `SPARE_SCALE`), tức *pilum* biến vào trong nắm tay. Lý do: hastati phóng *pilum* rồi mới rút kiếm (Caesar, *Gallic War* 1.25 tả rõ nhất), mà cảnh chỉ có một clip `attack` cho mỗi mô hình, nên không thể vừa phóng lao vừa đâm kiếm. Giấu *pilum* sau khiên không được: *pilum* dài khoảng 2 m, khiên cao 1,2 m; dựng đứng thì nhô lên trên, nằm ngang thì đâm vào hàng sau. Xương này có vị trí, góc quay và tỉ lệ trong clip. Khi cảnh chuyển từ đi sang đánh (0,35 s), *pilum* thu nhỏ dần trong khoảng đó.

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

- **Hoạt hình:** độ dài và quãng đường một vòng ở bảng "Clip" phía trên (cảnh tự đo từ clip, nên không phụ thuộc số trong tài liệu). Không có chuyển động gốc: hình lính đứng yên tại chỗ, cảnh tự di chuyển nó. `die` không lặp, giữ khung cuối.
- **Tư thế gốc** (khi không phát clip nào) là tư thế chữ A, khiên nằm dọc cánh tay trái, *pilum* của hastatus chĩa chéo lên. Cảnh luôn phát ít nhất `idle`.
- **Vật liệu:** ảnh màu (đã nhân AO), ảnh pháp tuyến, ảnh độ nhám và kim loại. Màu gốc của kim loại là màu phản xạ của kim loại (T-021: đồng khoảng sRGB (231, 182, 115), sắt khoảng (197, 198, 201), độ nhám đồng 0,40, sắt 0,42, giáp lưới 0,55). Ảnh so sánh trong cảnh three.js: `art/renders/roman-legionary/15-scene-metal-before-after.jpg`.
- **Cao nhất:** mũi giáo của triarii cao khoảng 2,44 m khi đứng (các mô hình khác dưới 2,25 m).
- **Lính Baleares:** xương `ik_hand_gun` có vị trí và góc quay trong mọi clip (túi đá của dây ném). Cảnh phải phát kênh của mọi xương, không chỉ các xương thân.
- **Hastatus:** hai cây *pilum* gắn vào xương `ik_hand_l`, có cả tỉ lệ trong clip: 1 khi đứng, đi, chạy; 0,01 trong `attack` và `die` (*pilum* đã phóng). Cảnh phải nướng cả tỉ lệ của xương (cảnh hiện nướng `matrixWorld`, nên đã có).
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
| `celt_hands.py` | Khép hai bàn tay mở của mô hình Celt thành nắm tay (bẻ xương ngón, lưới lấy hình đó làm tư thế gốc); tìm lòng nắm tay. |
| `celt_kit.py` | Kiếm dài và khiên của người Gaul, đặt vào lòng nắm tay. |
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
| `16-foot-slip-before-after.jpg` | Biểu đồ (T-024, `art/tools/gait_check.py`): độ trượt của chân trụ trong từng khung `walk` và `run`, trước (nét đứt) và sau khi khoá chân. |

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
| `16-pila-before-after.jpg` | T-024. Hàng trên: trước; hàng dưới: sau. Đứng (`idle`), đầu và lúc đâm của `attack`, nằm (`die`): sau khi sửa, *pilum* chỉ còn khi đứng, đi, chạy. |

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

Ảnh trước và sau của T-024 (hàng trên: trước; hàng dưới: sau; `render_review.py --before`):
- `gallic-infantry/14-fists-before-after.jpg`: tay trái cầm khiên (nhìn từ sau khiên), tay phải cầm kiếm (hai góc), tay phải lúc giơ kiếm;
- `roman-velites/14-skirt-before-after.jpg`, `balearic-slinger/14-skirt-before-after.jpg`: hông và đùi ở bốn khung `attack` quanh lúc bước tới (40–70% clip) và hai khung `run`, nhìn chéch từ phía tay phải;
- `roman-triarii/14-spear-before-after.jpg`: nhìn nghiêng từ phía tay phải, hai khung `idle`, hai khung `walk`, một khung `run`.

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

## Ngựa (cho kỵ binh, T-020)

Con ngựa là nền cho ba mô hình kỵ binh (`roman-cavalry`, `iberian-gallic-cavalry`, `numidian-cavalry`). Script của ngựa là các file `horse_*.py` (lane 2). Chúng chỉ import các module `whp_*.py`, không sửa.

Ngựa **không** xuất ra `public/`. Đầu ra là `art/build/horse/horse.blend`, để T-022 ghép người cưỡi lên rồi xuất.

### Nguồn và cách dựng

- **Lưới:** "Horse" của Tarnyloo (Blend Swap 17172, CC BY 3.0).
- **Khung Rigify và dáng đi:** "Horse Rigged All Gaits" của fdoss001 (Blend Swap 28627, CC0). Xem `art/CREDITS.md`.
- **Chỗ để file gốc:** `%WHP_ASSETS%\sources\horse-fdoss001\Horse Rigged All Gaits.blend` (612 MB). File của Tarnyloo (`horse-tarnyloo\horse01b.blend`) chỉ dùng để so lưới. Cách tải và mã băm: `README.txt` trong `%WHP_ASSETS%`.
- **Lệnh dựng** (PowerShell, từ thư mục gốc repo; cả lệnh dựng khoảng 1 phút, kể cả bake Cycles trên CPU):

  ```powershell
  & $blender --background --factory-startup --disable-autoexec --python art/blender/horse_build.py
  & $blender --background --factory-startup --disable-autoexec --python art/blender/horse_build.py -- --from lod   # chạy lại từ một giai đoạn
  & $blender --background --factory-startup --disable-autoexec --python art/blender/horse_render.py                # ảnh duyệt
  ```

Các giai đoạn, mỗi giai đoạn lưu một file trong `art/build/horse/`:

| Giai đoạn | Việc làm | File |
|---|---|---|
| `source` | Mở file gốc và lấy ra:<br>• lưới, trọng số của 80 xương biến dạng;<br>• ma trận các xương đó qua từng dáng đi, lấy mẫu 30 khung/giây; trước mỗi action, rig được đưa về tư thế nghỉ.<br>So lưới với file của Tarnyloo. | `source.npz` |
| `rig` | Dựng trong cảnh trống:<br>• khung xương 40 xương, thân ngựa;<br>• màu lông (thuộc tính màu đỉnh `whp_color`), bờm, đuôi, trang bị. | `1-rig.blend` |
| `anim` | Clip `idle`, `walk`, `run`, `die`, thêm `trot`, `canter`. Đo quãng đường một vòng và độ cao yên. | `2-anim.blend`, `horse-info.json` |
| `lod` | Ba mức chi tiết cho từng nhóm lưới, một atlas, bake màu, pháp tuyến, độ nhám và AO. | `3-lod.blend` |
| `finish` | • Xếp vào hai collection: `horse` (khung xương và lưới game), `detailed` (lưới chi tiết, ẩn).<br>• Lưu `horse.blend`.<br>• Xuất thử `horse-test.glb` (ngựa trần, 4 clip) và kiểm tra bằng `whp_export.check_glb` và `reimport`. | `horse.blend`, `horse-test.glb` |

Chạy lại từ đầu cho cùng kết quả: hai lần dựng cho `horse-test.glb` giống hệt từng byte.

**Mẹo:** thuộc tính màu đỉnh không được đặt tên `color`. Cycles đọc tên đó theo nghĩa khác, nên khi bake màu ra đen.

### Kích thước

**Cao 1,40 m tới vai** (đỉnh lưng ngay sau đỉnh xương bả vai), nằm giữa khoảng 1,35–1,45 m mà task đặt ra. File gốc được thu theo tỉ lệ 0,773.

Nguồn số liệu, cả hai đều đọc qua trích đoạn của công cụ tìm kiếm, **chưa đọc bản gốc** (các trang này chặn truy cập tự động):

- **Ngựa thời La Mã ở Hà Lan,** bài trên tạp chí *Archaeofauna* về việc ăn thịt ngựa ở Hà Lan thời La Mã (revistas.uam.es/archaeofauna, bài số 8431; chưa xác nhận được tác giả):
  - ngựa ở các làng bản địa phía bắc biên giới cao trung bình 132 cm tới vai;
  - ngựa ở trại lính trung bình 142 cm, ở các trang trại *villa* 144 cm.
- **Ngựa Celt cuối thời đồ sắt,** một nghiên cứu Thuỵ Sĩ: nhỏ, 110–130 cm; người La Mã có nuôi giống ngựa lớn hơn.

Ngựa chiến năm 216 TCN đặt khoảng giữa hai nhóm: 1,40 m. Ngựa Numidia được mô tả là nhỏ và nhanh (Strabo 17.3.7), nên T-022 có thể thu riêng nó (ví dụ 0,95 lần). Mô hình hiện chỉ có một cỡ.

### Hệ trục và hướng

- **Trong Blender:** đơn vị mét, Z hướng lên, ngựa nhìn về −Y.
- **Trong glTF:** Y hướng lên, ngựa nhìn về +Z.
- **Mặt đất:** móng đứng trên z = 0.
- **Gốc toạ độ:** trên mặt đất, giữa móng trước và móng sau (cách nhau 1,25 m). Mõm ở y ≈ −1,45 m, đuôi ở y ≈ +0,9 m.

### Gắn người cưỡi (T-022)

- **Xương yên `horse_saddle`:** con của `horse_spine_3`.
  - Ma trận nghỉ chỉ là một phép tịnh tiến, các trục trùng trục của khung xương; xương chỉ thẳng về sau (+Y).
  - Đầu xương nằm trên mặt tấm vải lót yên, trên đường giữa lưng, 0,30 m sau vai: (0,00; −0,157; 1,351) m.
  - **Chiều cao yên lúc đứng: 1,35 m.**
- **Ghép khung xương:** ghép khung người cưỡi vào `horse-rig`, rồi đặt `horse_saddle` làm cha của các xương gốc của người: `pelvis`, `ik_foot_root`, `ik_hand_root`. Đặt người sao cho mông chạm đầu xương yên. Khi đó người đi theo lưng ngựa trong mọi clip.
- **Tên xương:** 40 xương ngựa đều bắt đầu bằng `horse_` và có hậu tố `_l`/`_r`, nên không trùng với 67 xương của người. Ghép lại thành 107 xương.
- **Độ cao yên theo clip** (m, thấp nhất..cao nhất), cho biết người cưỡi nhấp nhô bao nhiêu:

  | `idle` | `walk` | `run` | `trot` | `canter` | `die` |
  |---|---|---|---|---|---|
  | 1,349..1,352 | 1,353..1,364 | 1,308..1,428 | 1,304..1,352 | 1,302..1,402 | 0,43..1,41 |

- **Dây cương:** đầu dây cương nằm ở chỗ tay người cưỡi, (±0,05; −0,62; 1,57) m, tức 0,16 m trước vai và 0,16 m trên lưng. Dây đi theo cổ, không gắn vào tay người. Nếu tay người ở chỗ khác thì đầu dây cương sẽ lơ lửng; T-022 có thể bỏ dây cương ở loại kỵ binh đó.

### Lưới và yên cương

Một vật liệu chung tên `horse`:

- ảnh màu 2048, đã nhân AO;
- ảnh pháp tuyến 1024;
- ảnh độ nhám/kim loại 1024 (chỉ hai vòng sắt là kim loại).

Mỗi nhóm lưới có ba mức để T-022 bật tắt theo loại kỵ binh. Số tam giác:

| Lưới | LOD0 | LOD1 | LOD2 | Dùng cho |
|---|---|---|---|---|
| `horse_LOD*` (thân, bờm, đuôi) | 2 952 | 629 | 111 | mọi loại |
| `horse_cloth_LOD*` (vải lót yên, đai bụng) | 236 | 59 | 11 | La Mã, Iberia/Gaul |
| `horse_bridle_LOD0` (dây đầu, dây mũi, vòng sắt, dây cương) | 164 | không có | không có | La Mã, Iberia/Gaul |
| `horse_neckrope_LOD*` (dây quàng cổ) | 84 | 22 | không có | Numidia |
| **Tổng, khi có đủ yên cương** | **3 436** | **710** | **122** | |

Ngựa Numidia (thân và dây quàng cổ) có 3 036, 651 và 111 tam giác. Các lưới đã gắn sẵn vào `horse-rig` (tối đa 4 xương mỗi đỉnh).

Ở LOD1 không có dây cương: dây mảnh và rời từng mảnh, giảm lưới thì vỡ, mà ở khoảng cách đó cũng không thấy. LOD1 của bờm cũng bỏ vì lý do đó; mép cổ của thân đủ thay. LOD2 của thân là hình thay thế dựng từ ống theo khung xương, tô màu phẳng từ atlas, như lính ở LOD2.

Đúng năm 216 TCN:

- không bàn đạp, không yên có cốt;
- vải lót buộc bằng đai bụng;
- hàm thiếc chỉ thể hiện bằng hai vòng sắt ở khoé miệng;
- ngựa Numidia không yên, không cương, chỉ có dây quàng cổ: Livy 35.11.7 (*equi sine frenis*); Strabo 17.3.7 (vòng gỗ hay vòng lông quanh cổ ngựa).

**Ghép atlas:** người và ngựa mỗi bên có một atlas 2048 riêng, mà hợp đồng chỉ cho một vật liệu. T-022 cần xếp lại UV của cả hai vào một atlas rồi bake lại, hoặc ghép hai ảnh vào một ảnh rồi thu UV (xem đề nghị trong mục "Kết quả" của T-020).

### Clip

30 khung/giây. Không có chuyển động gốc: ngựa đứng tại chỗ, cảnh tự di chuyển nó.

| Clip | Nguồn | Độ dài | Một vòng | Ghi chú |
|---|---|---|---|---|
| `idle` | tư thế nghỉ, cộng `horse.head.shake` và `horse.tail.flick.*` | 4,967 s (149 khung) | | Đứng bốn chân; thở; lắc đầu ở khung 24–66; vẫy đuôi ở khung 86 và 118. Lặp. |
| `walk` | `horse.walk` | 1,667 s (50 khung) | **1,20 m** (0,72 m/s) | Lặp; đuôi được khép vòng trong 12 khung cuối. Móng trước lún tối đa 3,2 cm xuống đất trong vài khung (có từ file gốc). |
| `run` | `horse.gallop` (nước đại) | 0,400 s (12 khung) | **1,21 m** (3,0 m/s) | Lặp; file gốc dài 10 khung ở 24 khung/giây, nay 12 khung ở 30 khung/giây (nhanh hơn 4%) để lặp khít. |
| `die` | tự làm | 1,967 s (59 khung) | | Khuỵu hai gối trước (khung 18), lăn sang sườn phải, nằm yên từ khung 48. Mọi khung đều chạm đất; khung cuối cao 0..0,70 m. **Không lặp.** |
| `trot` (thêm) | `horse.trot` | 0,833 s (25 khung) | 1,82 m (2,19 m/s) | Nước kiệu. Lặp. |
| `canter` (thêm) | `horse.canter` | 0,700 s (21 khung) | 2,11 m (3,0 m/s) | Nước phi nhỏ; gốc 17 khung ở 24 khung/giây, nhanh hơn 1,2%. Lặp. |

**Cách đo một vòng:** trong lúc chạm đất và chịu sức nặng, móng trượt về sau với đúng tốc độ con ngựa đi trên mặt đất. Số đo là trung vị tốc độ đó, lấy trên cả bốn móng, nhân với độ dài clip.

**Lưu ý cho cảnh (lane 3):** gallop của file gốc có pha chạm đất ngắn. Phát ở tốc độ 1× thì không trượt chân ở 3 m/s, chậm hơn nhiều so với nước đại thật (10–15 m/s).
- Nếu cảnh tăng tốc độ phát theo tốc độ di chuyển của kỵ binh, thì nên giới hạn khoảng 1,5×, chấp nhận móng trượt ở tốc độ cao hơn: gallop thật chỉ khoảng 2,5 sải mỗi giây.
- Có thể dùng `canter` cho kỵ binh đi nhanh vừa phải.

**Không có `attack`.** T-022 dựng `attack` của kỵ binh bằng clip đánh của người, cộng `idle` (hoặc `walk`) của ngựa lặp lại.

**Clip thêm:** bộ xuất của lane 1 (`whp_export`, chế độ ACTIONS) xuất mọi action trong file, kể cả `trot` và `canter`. Bản xuất thử có 6 action. T-022 xoá hai action này nếu không dùng.

### Ảnh duyệt: `art/renders/horse/`

Render từ `horse.blend` (lưới game, vật liệu đã bake), không phải từ file `.glb`.

| Ảnh | Nội dung |
|---|---|
| `01-side-front-back.jpg` | Nhìn nghiêng, trước, sau; đủ vải lót yên và dây cương. |
| `02-tack.jpg` | Ba kiểu: vải lót và dây cương (La Mã, Iberia/Gaul); chỉ dây quàng cổ (Numidia); trần. |
| `03-lods.jpg` | LOD0, LOD1, LOD2 cạnh nhau, có yên cương. |
| `04-anim-idle.jpg` … `07-anim-die.jpg` | Ba khung hình mỗi clip `idle`, `walk`, `run`, `die`. |
| `08-beside-roman-legionary.jpg` | Ngựa cạnh `roman-legionary` đứng (`idle`): nhìn nghiêng, rồi nhìn chéch. |
| `09-extra-trot-canter.jpg` | Hai khung `trot`, hai khung `canter`. |

### Các file script của ngựa

| File | Nội dung |
|---|---|
| `horse_build.py` | Điểm vào, các giai đoạn, xuất thử và kiểm tra. |
| `horse_source.py` | Đọc file gốc: lưới, trọng số, ma trận xương qua các action; so với lưới của Tarnyloo. |
| `horse_rig.py` | Khung xương 40 xương (bảng gộp xương), đổi tỉ lệ, thân, đổi ma trận thành keyframe, khép vòng. |
| `horse_kit.py` | Màu lông, bờm, đuôi, vải lót yên và đai bụng, dây cương, dây quàng cổ, chỗ ngồi. |
| `horse_clips.py` | `idle`, `die`, lấy dáng đi, đo một vòng. |
| `horse_lod.py` | LOD0..2 theo nhóm, atlas, bake (dùng `whp_lod`, `whp_unit_lod`, `whp_proxy`), hình thay thế cho LOD2. |
| `horse_render.py` | Ảnh duyệt. |
