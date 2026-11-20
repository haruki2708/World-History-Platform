# Mô hình lính cho cảnh trận đánh 3D

Thư mục này chứa script Blender dựng mô hình lính, ảnh render để duyệt và phần ghi công. File mô hình đã xuất nằm ở `public/battles/models/`. Hợp đồng của mô hình (hệ trục, khung xương, LOD, vật liệu, hoạt hình) ở `docs/ARCHITECTURE.md`, mục "Trận đánh 3D".

```
art/
  blender/      script Python chạy bằng Blender không giao diện
  tools/        script Python chạy ngoài Blender (numpy): gait_check.py đo sải
                chân và độ trượt chân của walk/jog/run trên file .glb như cảnh đo
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

Kỵ binh (T-022, T-050): người cưỡi và ngựa trong cùng một file (mục "Kỵ binh" ở cuối).

| Mô hình | Lính | Người cưỡi | Ngựa |
|---|---|---|---|
| `roman-cavalry` | kỵ binh La Mã và đồng minh: giáp lưới, khiên tròn ở cẳng tay, giáo | lính La Mã | vải lót yên đỏ, dây cương |
| `iberian-gallic-cavalry` | kỵ binh Iberia (từ T-050; trước đó Iberia và Gaul): áo lanh trắng viền tía, mũ gân, khiên bầu dục nhỏ, giáo | lính La Mã | vải lót yên xanh đen, dây cương |
| `gallic-cavalry` | kỵ binh Gaul (T-050): áo xanh lục viền vàng, áo choàng kẻ ô xanh chàm, quần sọc, tóc vàng dài, không mũ, khiên bầu dục xanh, kiếm dài | Celt | vải lót yên len mộc viền đỏ, dây cương |
| `numidian-cavalry` | kỵ binh Numidia: áo len mộc không thắt lưng, khiên da tròn nhỏ, lao | lính La Mã | nhỏ hơn (0,95), không yên cương, dây quàng cổ |

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

# Dựng mọi mô hình (kỵ binh cần dựng ngựa trước: mục "Kỵ binh")
& $blender --background --factory-startup --disable-autoexec --python art/blender/build_model.py -- --model all

# Chạy lại từ một giai đoạn (dùng file .blend của giai đoạn trước trong art/build/<id>/)
& $blender --background --factory-startup --disable-autoexec --python art/blender/build_model.py -- --model roman-legionary --from anim

# Chỉ kiểm tra file .glb đã xuất
& $blender --background --factory-startup --disable-autoexec --python art/blender/build_model.py -- --model all --check

# Ảnh duyệt, render từ file .glb đã xuất (khoảng 30 giây mỗi mô hình)
& $blender --background --factory-startup --disable-autoexec --python art/blender/render_review.py -- --model roman-hastatus
& $blender --background --factory-startup --disable-autoexec --python art/blender/render_review.py -- --model roman-hastatus --only animations closeups

# Clip knockdown (bị ngựa xô ngã rồi gượng dậy) thành hai dải: art/renders/<id>/knockdown.jpg
& $blender --background --factory-startup --disable-autoexec --python art/blender/render_review.py -- --model roman-legionary --knockdown

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

Tham số của `render_review.py`: `--model <id>`, `--only <ảnh> ...` (tên trong danh sách `REVIEW` của mô hình: `views`, `three-quarter`, `head`, `formation`, `lods`, `animations`, `metal`, `compare`, `closeups`, `beside`, `test-poses`; với kỵ binh còn `beside-cavalry`, `far-cavalry`, T-050), `--lineup`, `--attack-styles`, `--knockdown` (T-057).

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
| `anim` | Các clip từ thư viện hoạt hình (`whp_clips.py`): sáu clip chuẩn, `block` và `hit` (bộ binh đánh gần), `knockdown` (mọi bộ binh) | `KIT`: có khiên không, kiểu tấn công, cách cầm vũ khí, dây ném |
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
- **Khoá chân trụ** (T-024, `Builder.lock_feet`). Clip `walk` của thư viện tự nó đã trượt chân lúc bàn chân lăn: lúc mũi chân đẩy rời đất, mũi chân trượt ra trước (tới 80% tốc độ mặt đất trong vài khung). Với `walk`, `jog` và `run`, script dựng clip ba lượt nữa. Mỗi lượt, với từng bàn chân đang chạm đất, dời mắt cá theo chiều ngang để đỉnh thấp nhất của đế lùi đúng tốc độ mặt đất từ khung này sang khung sau. Độ dời được canh giữa trong mỗi lần chạm đất, rồi trả về dần trong lúc chân ở trên không. Mắt cá dời tối đa 2,1 cm (`walk`, `jog`) và 0,8 cm (`run`). Độ trượt lớn nhất của chân trụ trên LOD0 của file `.glb`: `walk` từ 81% xuống 2–3%, `jog` từ 25% xuống 0%, `run` từ 6% xuống 1–2%. Log của giai đoạn `anim` ghi các số này cho từng mô hình.
- **`die`.** Người mặc giáp nằm cao hơn hình nộm của thư viện: sau khi dựng, script đo điểm thấp nhất của mọi lưới ở khung cuối và nâng hông lên cho vừa chạm đất (lính La Mã: 8,2 cm). Khi đã nằm, đầu cúi vừa đủ để ngù lông mũ nằm dọc mặt đất thay vì cắm xuống. Khiên nằm trên người.

**Clip** (giống nhau cho mọi mô hình; số đo của hai mô hình La Mã):

| Clip | Nguồn | Độ dài | Ghi chú |
|---|---|---|---|
| `idle` | `Idle_Loop` (UAL 1) | 2,5 s (75 khung) | Đứng thở, khiên chếch bên trái, kiếm chĩa xuống. Lặp. |
| `walk` | `Walk_Loop` (UAL 1) | 1,333 s (40 khung) | Đi tại chỗ. **Một vòng = 1,30 m**, tức 0,975 m/s. Lặp. |
| `run` | `Jog_Fwd_Loop` (UAL 1) | 0,933 s (28 khung) | Chạy tại chỗ, khiên cao hơn. **Một vòng = 5,45 m**, tức 5,84 m/s: chạy rất nhanh, gần chạy nước rút (xem dưới). Lặp. |
| `jog` | `Walk_Loop` và `Jog_Fwd_Loop` (UAL 1) trộn theo pha | 0,733 s (22 khung) | Chạy đều, giữ đội hình: khiên và vũ khí giữ như khi đi. **Một vòng = 2,07–2,10 m**, tức 2,8–2,9 m/s. Lặp. Cách dựng: xem dưới. |
| `attack` | tuỳ mô hình, xem dưới | | Lặp. |
| `die` | `Death01` (UAL 1) | 2,4 s (72 khung) | Ngã ngửa, nằm yên từ khoảng khung 50. **Không lặp**: cảnh giữ khung cuối. |
| `block` | `Idle_Loop` và `Hit_Chest` (UAL 1) | 1,0 s (30 khung) | Đợt G. Đỡ đòn bằng khiên: nâng khiên và đẩy ra trước, khiên bị dội về ngực lúc đòn chạm (khung 9), rồi hồi lại. Thân nhận 35% cú giật của `Hit_Chest`. **Không lặp.** |
| `hit` | `Idle_Loop` và `Hit_Chest` (UAL 1) | 1,0 s (30 khung) | Đợt G. Trúng đòn: đứng như `idle` tới khung 9, rồi cả cú giật `Hit_Chest`, tay khiên bị bật ra; hồi lại. **Không lặp.** |
| `knockdown` | `Idle_Loop` (UAL 1), `Hit_Knockback` và `LayToIdle` soi gương (UAL 2) | 3,5 s (105 khung) | Đợt L, T-057. Bị ngựa xô ngã: co người, giơ khiên; ngựa chạm ở khung 9; bật ngửa, nằm, lăn sang phải chống nắm tay phải, gượng dậy, thế thủ, về thế đứng của `idle`. **Không lặp.** Xem dưới. |

**`block` và `hit`** (đợt G, `whp_clips.REACT`, `Builder.block`, `Builder.hit`): cảnh phát hai clip này đè lên `idle` khi đòn của địch chạm vào hình lính. Đòn chạm ở khung 9 (0,3 s), trùng với `REACTION_IMPACT` trong `src/lib/battle.ts`; đổi số này là đổi hợp đồng. Hai clip dựng sau `jog`, nên sáu clip trước giống hệt từng byte. Có ở sáu mô hình bộ binh đánh gần và ba mô hình kỵ binh (mục "Kỵ binh"); hai mô hình bộ binh đánh từ xa (kiểu tấn công trong `whp_clips.THROWN`: `roman-velites`, `balearic-slinger`) giữ sáu clip, file không đổi (`whp_build.clips_of`). Ảnh hai mô hình đối mặt quanh lúc đòn chạm: `render_review.py -- --model A --duel B`, ra `art/renders/duel-A-B.jpg`.

**`knockdown`** (đợt L, T-057, `whp_clips.KNOCK`, `Builder.knockdown`): cảnh phát clip này đè lên việc người lính đang làm khi một con ngựa phi xuyên qua khối quân xô vào anh ta (`docs/ARCHITECTURE.md`, mục "Kỵ binh xông qua"). Mọi mô hình bộ binh đều có, kể cả hai mô hình đánh từ xa. Cảnh xoay người lính quay mặt về phía ngựa trước khi ngựa tới, nên clip chỉ ngã một hướng: ngửa ra sau (+Y trong Blender, −Z trong file `.glb`).

| Khung | Giây | Việc |
|---|---|---|
| 0–9 | 0–0,30 | Đứng như `idle`, co người lại (15% tư thế đầu của `Hit_Knockback`), khiên giơ lên trước người (`SHIELD_CARRY["block"]`). |
| 9 | 0,30 | Ngựa chạm (`REACT["impact"]`, trùng `REACTION_IMPACT`); đổi số này là đổi hợp đồng. |
| 9–35 | 0,30–1,17 | `Hit_Knockback` từ khung 3 (chậm lại còn 0,64 lần tới lúc chạm đất ở khung 20, rồi đúng nhịp): bị hất lên, hai chân bị quét khỏi mặt đất, ngã ngửa, nảy nhẹ. Khiên bị dội về ngực (`jolt`) rồi nằm trên ngực và bụng (`lying`). |
| 35–52 | 1,17–1,73 | Nằm, trôi dần sang tư thế đầu của `LayToIdle`. Người ở dưới đất từ khoảng khung 18 tới khung 62 (1,5 s), nằm ngửa yên khoảng 1 s. |
| 52–98 | 1,73–3,27 | `LayToIdle` soi gương: ngồi dậy, xoay người sang phải, chống nắm tay phải (vẫn cầm kiếm, lưỡi kiếm nằm ngang trên mặt đất), quỳ một gối, đứng lên. Khiên nằm trên đùi khi ngồi (`seated`, như `die`), lên thế thủ (`guard`) khi đứng. |
| 98–105 | 3,27–3,50 | Trôi về khung đầu của `idle`, khiên về thế nghỉ. Khung cuối trùng khung đầu của `idle`. |

- **Soi gương** (`whp_ual.Pack.mirrored`): người của thư viện chống tay trái để dậy, mà tay trái lính ta cầm khiên. Tư thế được lật qua mặt phẳng giữa người (đổi trái và phải, mỗi xương lấy góc xoay so với tư thế nghỉ của xương đối xứng), rồi mới đổi đích như mọi clip. Các tư thế của nhiều clip được ghép ở dạng biến đổi cục bộ (`Pack.local`, `Pack.mix`, `Pack.world`); hai bản của thư viện cùng một khung xương nên ghép được với nhau.
- **Không chìm xuống đất** (`whp_clips.Skin`, `KNOCK_GROUND`): người mặc giáp nằm cao hơn hình nộm, khiên to hơn mọi thứ hình nộm cầm. Clip được dựng thử nhiều lượt; mỗi lượt đo điểm thấp nhất của bốn phần (thân; bàn chân và ống chân, `LEG_ENDS`, kể cả xương xoắn của bắp chân vì ống chân của người Gaul đi theo chúng; thứ tay trái cầm; thứ tay phải cầm), chia theo xương mà đỉnh đi theo, skin bằng numpy như cảnh. Phần nào thấp hơn mặt đất thì được nâng lên ở khung đó, mượt qua các khung kề: thân bằng hông (`Retargeter.hips_shift`), chân bằng mắt cá (`Retargeter.ankle_lift`, mới ở T-057), khiên và vũ khí bằng cổ tay (IK, bàn tay giữ hướng). Lượt nào thân hay chân còn chìm thì chỉ nâng thân và chân, vì nâng thân là nâng luôn hai tay; tối đa năm lượt như thế (`KNOCK_BODY_PASSES`). Các lượt khác nâng mọi phần còn chìm; tổng cộng tối đa mười lượt (`KNOCK_PASSES`). Không nâng ở khung đầu và khung cuối. Với `roman-legionary`: thân nâng tối đa 14 cm khi nằm, khiên 16 cm khi quỳ dậy, chân 5 cm, tay phải 2 cm.
- **Vũ khí** (`Builder._knock_weapon`): cầm như khi đứng; khi người đã xuống thấp thì nằm ngang theo cẳng tay (như `die`), để không cắm xuống đất hay dựng đứng khỏi người nằm.
  - Giáo dài của triarii (`SPEAR_CARRY`, `lie_flat`): cánh tay chỉ bị giải IK về thế cầm giáo đứng khi người đã đứng lên; lúc nằm và lúc chống tay dậy, cánh tay là của thư viện. Giáo nằm ngang dọc bên phải người, chĩa về phía chân và chếch ra ngoài, giữ một hướng dù cẳng tay xoay (theo cẳng tay thì ngọn giáo 2,4 m quét vòng qua chân), rồi dựng dần lên phía trước bên phải khi đứng dậy.
  - Hai cây *pilum* của hastatus ở nguyên trong tay trái suốt clip (`knockdown` không nằm trong `SPARE_GONE`).
- **Dây ném** (`Builder._knock_sling`, `balearic-slinger`): túi đá rủ từ nắm tay khi người còn đứng; khi đã xuống thấp thì văng sang bên phải người, không rủ thẳng xuống xuyên qua ngực, rồi nằm dọc mặt đất bên cạnh (`SlingCord.place`). Không có khiên: tay trái là của thư viện (lúc dậy chống lên gối).
- **Không có chuyển động gốc**: hông của `Hit_Knockback` chỉ lùi 0,23 m; nằm thì đầu cách chỗ đứng 0,77 m, mọi điểm của người trong vòng 1,40 m.
- **Kiểm tra** (`whp_export.check_knockdown`, khi đọc lại file đã xuất, trên LOD0 ở mọi khung): dài tối đa 4 s; không điểm nào thấp hơn −3 cm; không điểm nào của thân xa chỗ đứng quá 1,5 m; khung đầu và khung cuối lệch khung đầu của `idle` dưới 5 mm. Thứ hai tay cầm (đỉnh đi theo `hand_l`, `hand_r`, `ik_hand_l`, `ik_hand_gun`) được đo và ghi riêng, không xét ngưỡng 1,5 m: *pilum* nằm quá đầu tới khoảng 1,6 m, giáo của triarii nằm dọc người. Số đo của từng mô hình ghi trong log của bước kiểm tra và trong mục "Kết quả" của T-057.
- Dựng sau mọi clip khác, nên các clip trước giống hệt từng byte. File nặng thêm khoảng 60 KB.
- Ảnh duyệt: `render_review.py -- --model <id> --knockdown`, ra `art/renders/<id>/knockdown.jpg`: một dải nhìn từ bên phải người lính (anh ta ngã về bên trái ảnh), một dải nhìn chếch từ trước bên phải và từ trên xuống; mỗi khung ghi giây; khung 0,30 s (ngựa chạm) có viền đỏ.

**Quãng đường một vòng** đo như cảnh đo (`plantedStride` trong `src/components/battle/engine/figures/model.ts`): đỉnh đế bàn chân nào nằm trong 2 cm trên điểm thấp nhất của clip ở hai khung liền nhau thì đang chạm đất, và lùi về sau đúng bằng tốc độ hình lính đi. Lấy trung vị các tốc độ đó, nhân với độ dài clip. Log của giai đoạn `anim` đo trên lưới chi tiết; `art/tools/gait_check.py` đo trên LOD0 của file `.glb` (hai số chênh nhau dưới 0,01 m). Số ở bảng là của mô hình La Mã; các mô hình khác chênh dưới 0,02 m.

Số cũ (1,00 m và 1,99 m, từ T-019 tới T-021) sai: script cộng quãng lùi của mắt cá thấp hơn qua từng khung.
- `walk`: lúc hai chân cùng chạm đất, mắt cá của chân vừa hạ đã thấp hơn, nên script theo chân đó (mắt cá còn đưa ra trước), bỏ qua mũi chân sau vẫn đang tì đất và lùi theo mặt đất. Hụt khoảng 0,29 m mỗi vòng.
- `run`: 19 trên 28 khung không bàn chân nào chạm đất. Hình lính vẫn đi trong lúc đó, nhưng script không tính (còn trừ đi chút quãng chân đưa ra trước).

Muốn đi nhanh hơn thì cảnh tăng tốc độ phát clip theo tỉ lệ: tốc độ phát = tốc độ di chuyển / (quãng đường một vòng / độ dài clip).

**`run` là chạy nhanh từ clip nguồn, không phải do đổi đích.** Bản có chuyển động gốc của thư viện (`UAL1_Standard_RM.glb`) đi 5,00 m trong một vòng `Jog_Fwd_Loop` (5,36 m/s); bản tại chỗ mà ta dùng cho chân trụ lùi 5,9 m/s. Đổi đích giữ nguyên tỉ lệ (chân của khung xương dài bằng 0,998 lần chân hình nộm). Clip có nhịp 129 bước/phút, mỗi bước 2,7 m, mỗi bàn chân chỉ chạm đất 4–5 trên 28 khung (khoảng 16% vòng): dáng của chạy nước rút. Thư viện không có clip chạy chậm nào khác. Đề xuất cách xử lý ghi ở mục "Kết quả" của T-024.

**`jog`** (T-022, `whp_clips.JOG`, `Builder.jog`). Thư viện chỉ có đi (1 m/s) và chạy nhanh (5,8 m/s), không có gì ở giữa. Clip `jog` trộn hai clip đó theo pha:

- Hai clip được canh cho chân trái chạm đất cùng lúc (`Walk_Loop` khung 0, `Jog_Fwd_Loop` khung 1).
- Trộn thẳng thì thời gian chạm đất do clip chạy quyết định: mỗi bàn chân chỉ chạm đất 29% một bước, còn lại là bay, nên vẫn ra dáng chạy nước rút. Vì vậy clip chạy được kéo giãn thời gian trong từng bước trước khi trộn: 4 khung chạm đất của nó chiếm 65% bước của `jog` (`contact`), pha bay bị nén lại; đường cong thời gian là một đường bậc ba đơn điệu, không gãy.
- Rồi lấy một phần của clip chạy đặt lên clip đi, theo nhóm xương (`share`): chân và hông 65%, thân 45%, tay 50%.
- Hông của clip chạy nhún 25 cm mỗi bước; `jog` giữ 60% (`bounce`), IK của chân bù phần còn lại.
- Một vòng 22 khung (0,733 s, 164 bước mỗi phút). Khiên giữ thế `march` như khi đi, vũ khí giữ như khi đi.
- Cuối cùng khoá chân trụ như `walk`, `run`.

Số đo trên LOD0 của file `.glb` (`gait_check.py`): 2,07–2,10 m mỗi vòng, 2,82–2,86 m/s, chân trụ trượt dưới 1%. Năm clip cũ không đổi (dữ liệu hoạt hình giống hệt từng byte); `jog` được dựng sau cùng. Mỗi file nặng thêm khoảng 48 KB.

**Các kiểu tấn công** (`whp_clips.ATTACKS`; tên clip trong file `.glb` luôn là `attack`):

| Kiểu | Nguồn thân | Độ dài | Dùng cho |
|---|---|---|---|
| `sword-thrust` | `Punch_Cross` (UAL 1) | 1,0 s | Đâm kiếm qua mép phải khiên, khiên đẩy tới trước một nhịp. `roman-legionary`, `roman-hastatus`, `libyan-infantry`, `iberian-infantry`. |
| `spear-thrust` | `Punch_Cross` (UAL 1) | 1,0 s | Đâm giáo tầm hông, cán giáo chạy qua mép phải khiên, khiên giữ yên. `roman-triarii`. |
| `javelin-throw` | `OverhandThrow` (UAL 2) | 1,333 s | Phóng lao qua vai. Thân giữ một nửa biên độ của nguồn (lính trong hàng không lao cả người), chân một phần tư (T-024: với nửa biên độ, đùi bước ra trước chọc qua vạt áo). `roman-velites`. |
| `sling` | `OverhandThrow` (UAL 2) | 1,333 s | Một vòng rưỡi dây trên đầu, hòn đá chạy sau bàn tay; rồi vung lên sau vai, ném ra trước và lên; dây rũ xuống. Đường tay tự dựng (không có clip nguồn cho dây ném). Chân giữ một phần tư biên độ, như `javelin-throw`. `balearic-slinger`. |
| `sword-slash` | `OverhandThrow` (UAL 2) | 1,333 s | Giơ kiếm qua vai phải, lưỡi chĩa lên sau, rồi đưa qua đầu ra trước; vươn xa nhất khi lưỡi kiếm nằm ngang ở tầm mép trên khiên đối thủ (cảnh lấy lúc này làm lúc đòn chạm), rồi mới bổ xuống và chéo sang trái (`whp_clips._cut`, T-047); khiên giữ yên. Thân giữ nửa biên độ. `gallic-infantry`. |

**Giáo dài** (`SPEAR_CARRY`): khi không đánh, cánh tay phải giải bằng IK, cẳng tay đưa ra trước, giáo dựng đứng cạnh đùi, đế giáo cách đất vài cm, mũi giáo cao khoảng 2,44 m. Hướng giáo đặt trong khung ngực, mà ngực nghiêng ra trước khoảng 9° khi đứng và đi, nên trong khung đó giáo ngả về sau bằng chừng ấy (T-024): nhìn nghiêng, giáo lệch khỏi phương thẳng đứng dưới 3° khi đứng và đi, ngả ra trước khoảng 18° khi chạy (trước là 14°, 15° và 30°).

**Vật cầm thêm trong tay trái** (`Kit(spare=True)`, T-024): hai cây *pilum* của hastatus. Ở giai đoạn `rig`, vật được khớp tư thế theo `hand_l` rồi gắn vào xương `ik_hand_l` (`RIGID = {"Pila": ("hand_l", whp_clips.SPARE_BONE)}`; xương IK không lưới nào khác dùng). Trong mọi clip xương này theo bàn tay trái; riêng `attack` và `die` nó thu nhỏ còn 1% quanh cổ tay (`SPARE_GONE`, `SPARE_SCALE`), tức *pilum* biến vào trong nắm tay. (Từ đợt G cả `block` và `hit` cũng vậy; và cảnh tự giữ *pilum* ở trạng thái đã cất cho người đầu hàng của khối đang giáp lá cà, xem T-035: nó nhận ra xương này nhờ chính việc thu nhỏ đó, nên đừng đổi `SPARE_SCALE` lên quá 0,2.) Lý do: hastati phóng *pilum* rồi mới rút kiếm (Caesar, *Gallic War* 1.25 tả rõ nhất), mà cảnh chỉ có một clip `attack` cho mỗi mô hình, nên không thể vừa phóng lao vừa đâm kiếm. Giấu *pilum* sau khiên không được: *pilum* dài khoảng 2 m, khiên cao 1,2 m; dựng đứng thì nhô lên trên, nằm ngang thì đâm vào hàng sau. Xương này có vị trí, góc quay và tỉ lệ trong clip. Khi cảnh chuyển từ đi sang đánh (0,35 s), *pilum* thu nhỏ dần trong khoảng đó.

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
- **LOD1** (T-047, `whp_far.py`). Giảm tam giác từ các phần của LOD0 như trước (hình giữ nguyên, dùng lại trọng số; bao kiếm bỏ ở mức này), nhưng UV làm lại để ít đường nối:
  - mỗi mảnh chia thành vài vùng (`chart_unwrap`): vùng lớn dần từ mặt lớn nhất, luôn lấy mặt có pháp tuyến gần pháp tuyến trung bình của vùng nhất, trong nón 90°, và giữ vùng là một đĩa (không thủng); đường nối nằm ở ranh giới các vùng; trải UV theo góc (`ANGLE_BASED`);
  - các mảnh LOD1 xếp chung atlas với LOD0, mật độ điểm ảnh bằng 0,25 lần LOD0 (`LOD1_DENSITY`): ở tầm LOD1 (17–58 điểm ảnh) vẫn hơn độ phân giải màn hình;
  - không bake: mỗi điểm ảnh của mảnh LOD1 lấy màu (đã nhân AO), độ nhám và kim loại của điểm gần nhất trên phần LOD0 của nó trong atlas đã ghép (`transfer`); ảnh pháp tuyến phẳng ở đó (ở tầm LOD1, ảnh pháp tuyến của LOD0 cũng đã mờ hết);
  - mảnh rời dưới 3 mặt (vụn của phép giảm tam giác, trong đầu, dưới tóc) bị bỏ: một vùng một tam giác trải UV thành điểm, và pháp tuyến, tangent của nó ra khác nhau giữa các lần dựng;
  - kết quả: số đỉnh còn 1,55–1,76 lần số vị trí (trước là 2,3–3,4 lần); riêng `gallic-infantry` 2,16 lần (trước 3,42): lưới Celt khép kín, pháp tuyến lổn nhổn sau khi giảm, vùng nhỏ.
- **LOD2.** Thân người dựng lại bằng các ống và elip đặt theo khung xương (`whp_proxy.py`). Mũ, lông, khiên, kiếm, *pilum* vẫn giảm từ phần của chúng. Mỗi tam giác một màu phẳng (`whp_lod.flat_colour_uvs`), rồi (T-047, `whp_palette.py`):
  - màu các tam giác gom thành một bảng màu nhỏ (thường 12–20 màu): gộp hai màu gần nhau dưới 0,04 (khoảng cách OKLab, trung bình theo diện tích);
  - một tam giác được lấy màu của tam giác kề nếu đổi màu không quá 0,12 và bớt được đỉnh tách (mỗi góc chung đáng 0,03);
  - mỗi màu là một ô 32×32 điểm ảnh một màu trong atlas, thẳng hàng với khối 16×16 của JPEG; ảnh pháp tuyến phẳng và ảnh độ nhám/kim loại mang giá trị của màu đó ở ô tương ứng. Mọi góc của tam giác trỏ vào giữa ô, nên UV không đổi trên tam giác và GPU đọc ảnh ở độ phân giải đủ;
  - chỗ cho các ô: một hình chữ nhật xếp chung với các mảnh của atlas rồi bỏ đi (`whp_lod.unwrap_atlas`, tham số `room`);
  - kết quả: số đỉnh còn 1,19–1,46 lần số vị trí (trước là 3,1–3,6 lần). Tam giác cùng màu dùng chung đỉnh.
- **Cảnh đo tầm đánh trên LOD2** (`UnitModel.strike` lấy mức cuối): đỉnh của LOD2 gộp lại không làm đổi số đo nào (kiểm bằng cách đọc lại trong trang cho cả 11 mô hình).
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
  - sáu clip `idle`, `walk`, `run`, `attack`, `die`, `jog`;
  - đứng trên y = 0, ngón chân hướng +Z, đầu hướng +Y;
  - dung lượng tối đa 4 MB; có tên trong `index.json`.

  Sau đó nhập lại file vào Blender và thử vài tư thế với mặt đất: khung đầu `idle` và `walk` đứng trên đế dép, khung cuối `die` nằm sát đất và không vật nào xuyên xuống. Có lỗi thì script dừng với mã 1.

## Thang chi tiết `hi` (T-042, đang thử)

Một thang bốn mức dựng lại từ mô hình gốc, để thử nâng đồ hoạ lính và ngựa. **Cảnh 3D chưa dùng**: file xuất ra `art/build/<id>/<id>-hi.glb`, không đụng `public/battles/models/` và `index.json`. Đường dựng thường không đổi. Chi tiết, số liệu và nhận xét ở [T-042](../docs/tasks/T-042-model-upgrade.md).

| Mức | Lấy từ đâu | Giới hạn tam giác (bộ binh / kỵ binh) |
|---|---|---|
| LOD0 | Giảm từ lưới gốc, gấp ba LOD0 thường | 26 000 |
| LOD1 | 0,7 lần LOD0 thường | 7 000 |
| LOD2 | 1,2 lần LOD1 thường, có chất liệu | 1 800 / 2 400 |
| LOD3 | Hình ống màu phẳng (LOD2 thường) | 300 / 330 |

Ảnh pháp tuyến 2048; file tối đa 8 MB. LOD1 và LOD2 của thang này vẫn dựng như trước T-047 (UV của LOD0, mỗi tam giác của mức cuối một điểm của atlas). Ngựa `hi` có bờm và đuôi bằng lọn lông ở LOD0 và LOD1; LOD2 dùng bờm và đuôi kiểu thường (`horse-mane-far`, `horse-tail-far`), vì lọn lông rời không giảm tam giác được.

```powershell
# Ngựa hi (ra art/build/horse/horse-hi.blend), rồi một mô hình trên thang hi
& $blender --background --factory-startup --disable-autoexec --python art/blender/horse_build.py -- --hi
& $blender --background --factory-startup --disable-autoexec --python art/blender/build_model.py -- --model roman-cavalry --hi

# Ảnh so sánh trước và sau: art/renders/upgrade/<id>-NN-<tên>.jpg (close, strike, detail, levels, near, middle, far)
& $blender --background --factory-startup --disable-autoexec --python art/blender/render_upgrade.py -- --model roman-cavalry
```

"Trước" trong ảnh so sánh là file trong `public/battles/models/`, "sau" là file `-hi.glb`. Ba ảnh khối quân (`near`, `middle`, `far`) vẽ mỗi người ở mức chi tiết mà chiều cao trên màn hình 1920×1080 của người đó cho, rồi cắt sát khối quân; `middle` phóng to gấp hai, `far` gấp ba.

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
| `render_upgrade.py` | Ảnh so sánh mô hình đang dùng với mô hình trên thang `hi` (T-042). |
| `whp_build.py` | Các giai đoạn chung, dòng lệnh, kiểm tra, `index.json`. |
| `whp_common.py` | Đường dẫn (`WHP_ASSETS`, `art/build/`), đọc tham số, nhập FBX, tiện ích chọn, gộp, nhân bản đối tượng. |
| `whp_render.py` | Đèn, camera, render ảnh tĩnh bằng EEVEE. |
| `whp_mesh.py` | Truy cập đỉnh bằng numpy, dựng lưới, đưa lưới về thứ tự chuẩn. |
| `whp_materials.py` | Vật liệu thủ tục: đồng, sắt, da, gỗ, sơn khiên, lông, vòng giáp lưới; độ nhám và kim loại của từng loại. |
| `whp_skeleton.py` | Khung xương chung (lấy từ mô hình Celt), đưa về dạng chuẩn, gắn lưới, tạo tư thế. |
| `whp_skin.py` | Chuyển trọng số theo điểm gần nhất, làm mượt, giới hạn số xương, skinning bằng numpy. |
| `whp_anim.py` | `Poser`: dựng tư thế theo trục của người lính (xoay, ngắm, đặt hướng xương, IK hai đoạn) và ghi keyframe. |
| `whp_ual.py` | Đọc file `.glb` của thư viện hoạt hình bằng numpy, lấy mẫu clip; ghép và soi gương tư thế (`local`, `mix`, `mirrored`, `world`). |
| `whp_retarget.py` | Đổi đích tư thế từ thư viện sang khung xương chung. |
| `whp_clips.py` | Các clip (sáu clip chuẩn, `block`, `hit`, `knockdown`), tay cầm khiên, vũ khí, các kiểu tấn công, tư thế thử; đo điểm thấp nhất của từng phần người (`Skin`). |
| `whp_lod.py` | Phần ít tam giác, atlas UV, bake, xử lý ảnh, vật liệu cuối. |
| `whp_unit_lod.py` | Giai đoạn `lod` chung: các phần, bake, ghép ảnh, LOD0..2. |
| `whp_proxy.py` | Hình người đơn giản theo khung xương cho LOD2. |
| `whp_far.py` | LOD1 ít đường nối UV (T-047): chia mảnh, trải UV theo góc, chép màu từ atlas LOD0; tìm chỗ trống trong atlas. |
| `whp_palette.py` | Bảng màu nhỏ cho LOD2 (T-047): gom màu tam giác, làm mượt theo tam giác kề, ghi các ô màu vào atlas. |
| `whp_export.py` | Xuất glTF và kiểm tra file `.glb` theo hợp đồng. |
| `unit_<id>.py` | Phần riêng của từng mô hình (mười hai file: tám bộ binh, bốn kỵ binh). |
| `whp_cavalry.py` | Kỵ binh: ghép ngựa vào file, nối hai khung xương, tư thế và các clip của người cưỡi, giai đoạn `lod` chung cho người và ngựa. |
| `roman_kit.py` | Phần chung của các mô hình dựng trên lính La Mã: chuẩn bị thân (kiếm trong tay, trong bao hay bỏ), mũ, khiên, vật liệu, luật gắn xương, dữ liệu cho clip. |
| `roman_weapons.py` | Giáo *hasta*, lao nhẹ, lao Iberia; cất kiếm vào bao. |
| `roman_parma.py` | Khiên tròn của velites. |
| `roman_faces.py` | Màu da, râu và tóc dựng từ lưới đầu của mô hình nền; tóc xoăn dày, chân tóc không đều (`build_hair`, T-047). |
| `balearic_kit.py` | Ba dây ném đá (dây cầm tay co giãn), túi đá. |
| `celt_source.py` | Nhập mô hình Celt cho người Gaul; xoá hình vẽ trên da, nhuộm lại quần. |
| `celt_hands.py` | Khép hai bàn tay mở của mô hình Celt thành nắm tay (bẻ xương ngón, lưới lấy hình đó làm tư thế gốc); tìm lòng nắm tay. |
| `celt_kit.py` | Kiếm dài và khiên của người Gaul, đặt vào lòng nắm tay. |
| `celt_tunic.py` | Áo nhuộm của kỵ binh Gaul (T-050): ống quanh thân và hai tay áo dựng theo hình người Celt, đai da. |
| `celt_cloak.py` | Áo choàng của kỵ binh Gaul (T-050): tấm vải rủ từ vai theo hình người (`surface`, dùng chung cho tóc), lớp vỏ hai mặt, khuy đồng, vân kẻ ô, trọng số theo cột sống. |
| `celt_hair.py` | Tóc dài của kỵ binh Gaul (T-050): lớp vỏ từ những mặt có tóc của lưới đầu (chọn theo màu ảnh vật liệu), mảng tóc rủ xuống gáy. |
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
| `knockdown.jpg` | Clip `knockdown` (T-057): mười một khung từ 0 tới 3,50 s, nhìn từ bên phải và chếch từ trước; khung 0,30 s (ngựa chạm) viền đỏ. Tám mô hình bộ binh đều có ảnh này trong thư mục của mình. |

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
  & $blender --background --factory-startup --disable-autoexec --python art/blender/horse_render.py -- --only anim gallop   # chỉ vài ảnh
  ```

  Sau khi dựng lại ngựa, dựng lại ba mô hình kỵ binh (mục "Kỵ binh") để chúng nhận clip mới.

Các giai đoạn, mỗi giai đoạn lưu một file trong `art/build/horse/`:

| Giai đoạn | Việc làm | File |
|---|---|---|
| `source` | Mở file gốc và lấy ra:<br>• lưới, trọng số của 80 xương biến dạng;<br>• ma trận các xương đó qua từng dáng đi, lấy mẫu 30 khung/giây; trước mỗi action, rig được đưa về tư thế nghỉ.<br>So lưới với file của Tarnyloo. | `source.npz` |
| `rig` | Dựng trong cảnh trống:<br>• khung xương 40 xương, thân ngựa;<br>• màu lông (thuộc tính màu đỉnh `whp_color`), bờm, đuôi, trang bị. | `1-rig.blend` |
| `anim` | Clip `idle`, `walk`, `run`, `die`, thêm `trot`, `canter`. `run` dựng lại cho sải đủ dài, móng trụ của `trot` được khoá (T-030, `horse_gallop.py`). Đo quãng đường một vòng như cảnh đo, độ trượt và độ cao yên. | `2-anim.blend`, `horse-info.json` |
| `lod` | Ba mức chi tiết cho từng nhóm lưới, một atlas, bake màu, pháp tuyến, độ nhám và AO. | `3-lod.blend` |
| `finish` | • Xếp vào hai collection: `horse` (khung xương và lưới game), `detailed` (lưới chi tiết, ẩn).<br>• Lưu `horse.blend`.<br>• Xuất thử `horse-test.glb` (ngựa trần, 4 clip) và kiểm tra bằng `whp_export.check_glb` và `reimport`. | `horse.blend`, `horse-test.glb` |

Chạy lại từ đầu cho cùng kết quả: hai lần dựng cho `horse-test.glb` và `horse-info.json` giống hệt từng byte. `horse.blend` thì không giống từng byte giữa hai lần lưu, nhưng các mô hình kỵ binh dựng từ nó vẫn ra giống hệt từng byte.

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
  | 1,349..1,352 | 1,353..1,364 | 1,309..1,428 | 1,304..1,352 | 1,302..1,402 | 0,43..1,41 |

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

| Clip | Nguồn | Độ dài | Một vòng, cảnh đo | Móng trụ trượt | Ghi chú |
|---|---|---|---|---|---|
| `idle` | tư thế nghỉ, cộng `horse.head.shake` và `horse.tail.flick.*` | 4,967 s (149 khung) | | | Đứng bốn chân; thở; lắc đầu ở khung 24–66; vẫy đuôi ở khung 86 và 118. Lặp. |
| `walk` | `horse.walk` | 1,667 s (50 khung) | 0,99 m (0,60 m/s) | 102% | Lặp; đuôi được khép vòng trong 12 khung cuối. Móng trước lún tối đa 3,2 cm xuống đất trong vài khung (có từ file gốc). Để nguyên, xem "Khoá móng trụ" dưới đây. |
| `run` | `horse.gallop` (nước đại), dựng lại (T-030) | 0,433 s (13 khung) | **5,51 m** (12,7 m/s) | **1%** | Nước đại bốn nhịp. Lặp. Xem "Clip phi" dưới đây. Trước T-030: clip gốc, 12 khung, 1,09 m, trượt 270%. |
| `die` | tự làm | 1,967 s (59 khung) | | | Khuỵu hai gối trước (khung 18), lăn sang sườn phải, nằm yên từ khung 48. Mọi khung đều chạm đất; khung cuối cao 0..0,70 m. **Không lặp.** |
| `trot` (thêm) | `horse.trot`, khoá móng trụ (T-030) | 0,833 s (25 khung) | 1,82 m (2,19 m/s) | **1%** | Nước kiệu. Lặp. Trước T-030 trượt 88%, sải như nay. |
| `canter` (thêm) | `horse.canter` | 0,700 s (21 khung) | 2,19 m (3,1 m/s) | 44% | Nước phi nhỏ; gốc 17 khung ở 24 khung/giây, nhanh hơn 1,2%. Lặp. Không dùng trong mô hình nào, nên chưa sửa. |

**Cách đo một vòng (như cảnh):** đo trên lưới chi tiết của ngựa bằng `horse_gallop.stride`, cùng cách với `plantedStride` của cảnh và `art/tools/gait_check.py` (qua `whp_clips.planted`):
- "đế" là các đỉnh cách điểm thấp nhất lúc nghỉ trong 3 cm;
- một đế nằm trong 2 cm trên điểm thấp nhất của clip ở hai khung liền là đang chạm đất;
- sải = trung vị tốc độ lùi của các đế chạm đất × độ dài vòng;
- trượt = móng chạm đất (đế thấp nhất của mỗi móng) lệch khỏi tốc độ đó bao nhiêu trong một khung, tính theo phần trăm tốc độ đó, lấy khung tệ nhất.

`horse-info.json` ghi số này (`scene_m`, `scene_slip`; số của clip gốc: `source_scene_m`, `source_scene_slip`), cạnh số đo cũ (`cycle_m`: trung vị tốc độ lùi của bốn móng khi chịu sức nặng). Trên LOD0 của các file kỵ binh, `gait_check.py` đọc ra gần như vậy (`walk` 1,08 m vì đế của LOD0 khác lưới chi tiết đôi chút); bảng ở mục "Kết quả" của T-030.

### Clip phi (T-030)

Clip phi của file gốc đúng thứ tự chân, nhưng mỗi móng chỉ lùi 0,3–0,5 m khi chạm đất và trượt trong lúc ấy. `horse_gallop.gallop` dựng lại phần chân, giữ phần thân:

- **Nhịp:** một vòng **13 khung (0,433 s, 2,3 sải mỗi giây)**, đi **5,5 m** (`FRAMES`, `STRIDE`). Thân, cổ, đầu và đuôi lấy từ clip gốc, giãn từ 12 sang 13 khung, nên nhún như clip gốc.
- **Thứ tự chân** (`FOOTFALLS`, giữ như gốc: nước đại tay phải): sau trái chạm ở khung 0, sau phải ở khung 2, trước trái ở khung 4, trước phải ở khung 6, rồi bốn chân co lại trên không tới khung 13 (= khung 0). Chân sau chạm đất 2 khung, chân trước 3 khung (`STANCE`); khung 6 có cả hai chân trước.
  - Chân sau chạm ít khung hơn vì nó đứng gần thẳng dưới hông ngay cả lúc nghỉ (móng cách hông 1,22 m, chân dài 1,28 m), nên chỉ quét được khoảng nửa quãng của chân trước.
- **Móng khi chạm đất:** nằm phẳng (hướng lúc nghỉ), lùi đều về sau đúng `STRIDE` mỗi vòng, nên cảnh đọc đúng sải và móng không trượt. Chỗ giữa pha chạm đất của mỗi cặp chân lấy từ clip gốc (trung bình hai chân); cặp chân trước lùi thêm 0,16 m (`CENTRE_BACK`) vì chân trước thẳng chỉ với tới 0,46 m trước đỉnh xương bả vai.
- **Chân:** mỗi chân là chân của clip gốc, nắn lại thời gian từng đoạn (pha chạm đất và pha bay rơi đúng chỗ của nhịp mới), rồi gập các khớp để móng tới đúng chỗ: **IK phẳng** quanh trục ngang của ngựa (class `Leg`), từ xương đai (đùi, xương bả vai) tới móng.
  - Mỗi khớp có giá riêng khi bị gập khỏi tư thế gốc (`COST`): hông, xương bả vai và vai quét chính; khuỷu và gối chân trước gần như giữ nguyên, nên chân trụ thẳng; cổ chân gập ít; khớp móng đặt móng phẳng.
  - Chân trụ bắt đầu từ tư thế nghỉ (không phải tư thế gốc giữa pha chạm, ở đó xương cổ chân trước gần nằm ngang), nên đứng thẳng.
  - Mỗi vòng IK quay một khớp nhiều nhất 0,25 rad (`IK_STEP`), 24 vòng (`IK_ROUNDS`). Log ghi sai số lớn nhất của móng chạm đất (lần dựng này 0,0 mm) và báo `WARNING` khi quá 2 mm.
- **Trên không:** móng theo đường của clip gốc, cộng một độ lệch chuyển mượt (smoothstep) từ chỗ móng rời đất tới chỗ lần chạm sau, như cách lane 1 khoá bàn chân người (`whp_clips.lock_shifts`). Móng không xa đỉnh chân quá 98% chiều dài chân (`REACH`), và điểm thấp nhất của móng luôn cao hơn đất ít nhất 3 cm (`CLEAR`): cảnh coi đế nào trong 2 cm trên đất là đang chạm.

**Ảnh so sánh:** `art/renders/horse/10-run-before-after.jpg` (mọi khung, hàng trên là clip cũ, hàng dưới là clip mới).

### Khoá móng trụ (`walk`, `trot`)

`horse_gallop.lock` giữ nguyên dáng đi của file gốc, chỉ dời các móng đang chạm đất (tối đa 5 cm) để mỗi móng lùi đều với một tốc độ, bằng IK như trên (`LOCKED`). Cách làm giống `whp_clips.lock_shifts` của lane 1: dời cố định trong pha chạm đất, chuyển mượt trong pha bay.

- **`trot`:** khoá được. Trượt từ 88% còn 1%, sải giữ nguyên 1,82 m. Kỵ binh dùng nó làm `jog`.
- **`walk`: để nguyên** (trượt 102%). Khi đi bước, móng lăn từ gót tới mũi lúc chạm đất: điểm thấp nhất chạy dọc móng. Khoá theo điểm thấp nhất thì sải cảnh đọc ngắn đi 8% mà vẫn trượt 31%. Muốn sửa thật phải dựng lại cả cách móng lăn, ngoài phạm vi T-030.

**Lưu ý cho cảnh (lane 3):**
- `run` tự nhiên ở 12,7 m/s cỡ thật, tức **38,1 m/s trên sân** (×3). Với `MAX_RATE` 1,5 thì trần phi là **57,2 m/s trên sân** (Numidia 54,4 m/s), trước là 12,3 m/s.
- Nước kiệu giờ phải gánh khoảng tốc độ rộng hơn trước (từ chỗ đổi với `walk` tới chỗ đổi với `run`). Khi gộp T-030, trần `jog` của cảnh nâng từ 1,8 lên 2,7 lần, đủ tới chỗ đổi sang `run` (17,4 m/s trên sân), nên kiệu nhanh không trượt móng.

**Không có `attack`.** T-022 dựng `attack` của kỵ binh bằng clip đánh của người, cộng `idle` (hoặc `walk`) của ngựa lặp lại.

**Clip thêm:** `trot` và `canter` nằm trong `horse.blend`. Từ T-022, `whp_export.export_glb` xoá các action không có trong danh sách clip trước khi xuất, nên bản xuất thử chỉ có 4 action; kỵ binh dùng `trot` làm `jog`.

### Ảnh duyệt: `art/renders/horse/`

Render từ `horse.blend` (lưới game, vật liệu đã bake), không phải từ file `.glb`.

| Ảnh | Nội dung |
|---|---|
| `01-side-front-back.jpg` | Nhìn nghiêng, trước, sau; đủ vải lót yên và dây cương. |
| `02-tack.jpg` | Ba kiểu: vải lót và dây cương (La Mã, Iberia/Gaul); chỉ dây quàng cổ (Numidia); trần. |
| `03-lods.jpg` | LOD0, LOD1, LOD2 cạnh nhau, có yên cương. |
| `04-anim-idle.jpg` … `07-anim-die.jpg` | Ba khung hình mỗi clip `idle`, `walk`, `run`, `die`. `run` (từ T-030): khung 0 (chân sau trái vừa chạm đất), 3 (chân sau phải trụ), 6 (hai chân trước cùng chạm đất). |
| `08-beside-roman-legionary.jpg` | Ngựa cạnh `roman-legionary` đứng (`idle`): nhìn nghiêng, rồi nhìn chéch. |
| `09-extra-trot-canter.jpg` | Hai khung `trot` (đã khoá móng từ T-030), hai khung `canter`. |
| `10-run-before-after.jpg` | Mọi khung của clip phi, nhìn từ bên trái: hàng trên là clip của file gốc (trước T-030, 12 khung), hàng dưới là `run` mới (13 khung). |
| `11-scene-cannae.jpg` | Chụp trong cảnh (`/battle-lab?battle=battle-of-cannae`, T-030): trái, kỵ binh đồng minh phi ở giai đoạn 1; phải, kỵ binh La Mã phi ở giai đoạn 3. |

`horse_render.py -- --only ...` chọn ảnh cần render, trong `views tack lods anim beside extra gallop`; không có `--only` thì render tất cả. Ảnh 11 chụp từ cảnh, không do script render.

### Các file script của ngựa

| File | Nội dung |
|---|---|
| `horse_build.py` | Điểm vào, các giai đoạn, xuất thử và kiểm tra. |
| `horse_source.py` | Đọc file gốc: lưới, trọng số, ma trận xương qua các action; so với lưới của Tarnyloo. |
| `horse_rig.py` | Khung xương 40 xương (bảng gộp xương), đổi tỉ lệ, thân, đổi ma trận thành keyframe, khép vòng. |
| `horse_kit.py` | Màu lông, bờm, đuôi, vải lót yên và đai bụng, dây cương, dây quàng cổ, chỗ ngồi. |
| `horse_clips.py` | `idle`, `die`, lấy dáng đi, đo một vòng. |
| `horse_gallop.py` | Clip phi dựng lại với sải đủ dài, khoá móng trụ của `trot`, IK phẳng cho chân ngựa, đo sải như cảnh (T-030). |
| `horse_lod.py` | LOD0..2 theo nhóm, atlas, bake (dùng `whp_lod`, `whp_unit_lod`, `whp_proxy`), hình thay thế cho LOD2. |
| `horse_render.py` | Ảnh duyệt. |

## Kỵ binh (T-022, T-050)

Bốn mô hình, mỗi mô hình là một người cưỡi trên một con ngựa, trong cùng một file `.glb`: `roman-cavalry`, `iberian-gallic-cavalry` (kỵ binh Iberia), `numidian-cavalry` (T-022) và `gallic-cavalry` (T-050, người cưỡi dựng trên người Celt của `gallic-infantry`; mục "Kỵ binh Gaul" ở cuối). Người cưỡi dựng như lính bộ binh (giai đoạn `source`, `kit`, `rig` trong `unit_<id>.py`); ngựa là con ngựa của lane 2 (mục "Ngựa" ở trên). Phần ghép và các clip nằm ở `whp_cavalry.py`.

### Cách dựng

Dựng ngựa trước (một lần, khoảng 2–3 phút), rồi dựng từng mô hình kỵ binh (khoảng 4–5 phút mỗi mô hình) hoặc tất cả:

```powershell
& $blender --background --factory-startup --disable-autoexec --python art/blender/horse_build.py
& $blender --background --factory-startup --disable-autoexec --python art/blender/build_model.py -- --model roman-cavalry
& $blender --background --factory-startup --disable-autoexec --python art/blender/build_model.py -- --model all
```

Thiếu `art/build/horse/horse.blend` thì giai đoạn `anim` dừng và báo phải chạy `horse_build.py`.

Một unit module kỵ binh có thêm (ngoài những gì của lính bộ binh):
- `HORSE` (`whp_cavalry.Horse`): yên cương nào, cỡ ngựa, màu vải lót yên;
- `RIDER` (`whp_cavalry.Rider`): kiểu tấn công, có cầm cương không, khiên ở đâu, cách mang vũ khí;
- `KIT`: dùng để dựng cú ngã của người, như lính bộ binh;
- `BONES` (107), `GROUND_CHECKS`, `SEAT_MESHES` (lưới người chạm lưng ngựa);
- với khiên đeo cẳng tay: `SHIELD_MESH`, `SHIELD_HANG`;
- tuỳ chọn (T-050): `SEAT_MEASURE = "seated"` (đo chỗ ngồi khi người đã ngồi, xem "Tư thế ngồi"); `SKIRTS`, `LEGS_MESH` (vạt áo nào kéo theo đùi, theo lưới chân nào; mặc định `Tunic_1`, `Mail` theo `New_legs` của lính La Mã).

Có `HORSE` thì `whp_build` gọi giai đoạn `anim` và `lod` của `whp_cavalry`.

### Giai đoạn `anim`: ghép người và ngựa

1. **Cú ngã của người** được dựng trước, khi người còn đứng một mình trên mặt đất: `die` của lính bộ binh (`whp_clips.Builder.die` với `KIT`), giữ lại dưới dạng ma trận xương từng khung.
2. **Ghép ngựa vào file** (`mount`):
   - nạp từ `horse.blend` khung xương `horse-rig`, các lưới chi tiết (thân, bờm, đuôi và yên cương của loại kỵ binh này) và năm clip `idle`, `walk`, `trot`, `run`, `die`; đọc các clip thành ma trận xương rồi xoá action;
   - ngựa Numidia: thu khung xương và lưới còn 0,95 lần (vị trí trong clip cũng nhân 0,95);
   - **nhấc tư thế gốc của người** lên lưng ngựa: xương và lưới dịch lên (0,58 m; Numidia 0,49 m) và lùi về chỗ ngồi. Ở tư thế gốc, người đứng chữ A trên lưng ngựa (chân xuyên qua thân ngựa). Nhờ vậy:
     - khung bao của LOD0 ở tư thế gốc cao gần bằng người cưỡi thật (cảnh lấy chiều cao mô hình từ khung bao này);
     - đỉnh thấp nhất ở tư thế gốc chỉ còn là móng ngựa (cảnh lấy các đỉnh này làm "đế chân" để đo sải);
   - nối hai khung xương thành một (67 + 40 = **107 xương**, đối tượng tên `root` như lính bộ binh), rồi đặt `horse_saddle` làm cha của ba xương gốc của người: `pelvis`, `ik_foot_root`, `ik_hand_root`.
3. **Mọi clip được key trên cả 107 xương**, từng khung (`RiderPoser`): xương ngựa lấy từ clip của ngựa; người được dựng trong khung của xương yên lúc nghỉ, rồi cả người đi theo xương yên.

### Tư thế ngồi

- **Hông:** chậu hông ngả ra sau 8° (ngồi trên xương ngồi), thân dựng thẳng lại. Độ cao đo từ chính lưới: các đỉnh của lưới chân (`SEAT_MESHES`) gần đường giữa, trên chỗ ngồi, đặt cao hơn điểm ngồi của lane 2 (mặt vải lót yên) 4 mm. Ngựa Numidia không có vải lót nên điểm ngồi thấp hơn 1,4 cm.
  - Ba mô hình của T-022 đo các đỉnh này ở tư thế đứng. Với quần ống rộng của người Celt, mặt trong đùi rơi vào vùng đo và nhấc người lên cao hơn lưng ngựa khoảng 10 cm; vì vậy `gallic-cavalry` đo khi người đã ngồi (`SEAT_MEASURE = "seated"`, `RiderPoser._find_seated_height`): điểm thấp nhất của lưới chân gần đường giữa, từ hông xuống 0,30 m, đặt lên điểm ngồi. Hông của người Gaul ở 1,629 m, của kỵ binh La Mã 1,649 m.
- **Chân:** IK hai đoạn theo hướng đùi và cẳng chân cố định trong khung yên (`Rider.thigh`, `Rider.calf`):
  - đùi chĩa ra trước, xuống và ra ngoài, ôm thân ngựa (thân rộng 0,27 m mỗi bên ở độ cao 1,04–1,09 m);
  - cẳng chân buông gần thẳng đứng;
  - mũi chân chúc xuống 30°, xoè 14°;
  - không có bàn đạp (chưa có vào năm 216 TCN).

  Log ghi bao nhiêu đỉnh của chân lọt vào trong thân ngựa ở `idle` khung 0: 12 trên 6 722 đỉnh, sâu nhất 1 mm.
- **Áo** (T-047, `whp_cavalry.drape_skirts`): ở tư thế gốc người đứng, vạt áo xoè ra từ hông; khi ngồi, đùi gập lên kéo vạt áo theo và phần xoè chìa ngang ra hai bên. Vì vậy vạt áo (và vạt giáp lưới của kỵ binh La Mã) được kéo vào đùi ở đúng chỗ đùi nằm khi người ngồi (clip `idle`, khung 0): dưới hông, phần cách chân quá 1,2 cm chỉ giữ lại 5%; độ dời làm mượt dọc các cạnh của lưới để vải không gấp; sau đó không đỉnh nào nằm trong chân (cách da tối thiểu 8 mm, vì làm mượt kéo một ít vào trong); lớp giáp lưới nằm ngoài lớp áo thêm 1,2 cm. Vị trí mới đổi ngược về tư thế đứng qua ma trận skin của từng đỉnh, nên các clip khác (người vẫn ngồi) cũng thấy vạt áo rủ theo đùi. Độ dời được giữ thành thuộc tính `whp_drape` và chỉ áp vào LOD0, LOD1 của người cưỡi sau khi bake atlas (`apply_drape`): đổi ngược về tư thế đứng, mặt vải không còn trơn ở chỗ đỉnh pha trộn giữa đùi và hông, tia bake xuyên qua tới mặt trong và để lại các tam giác xám trên vạt áo. Đẩy vải ra khỏi chân cũng được làm mượt qua các đỉnh kề (4 lượt), vì đẩy từng đỉnh thì mặt vải lổn nhổn. Kéo ở tư thế đứng (bản đầu của T-047) gần như không đổi gì khi ngồi. Vạt sau giữ nguyên hình và đi theo hông, rủ thẳng xuống lưng ngựa. Làm sau khi dựng xong các clip, nên clip không đổi.
- **Thân theo nhịp ngựa** (`LEAN`):
  - mỗi clip một độ ngả ra trước: `walk` 2°, `jog` 4°, `run` 13°;
  - thân lấy lại một phần độ xoay của xương yên để giữ gần thẳng đứng: `walk` 50%, `jog` 70%, `run` 60%;
  - thân gập thêm theo độ lên xuống của yên, trễ một khung. Ngồi nước kiệu, không nhổm (chưa có bàn đạp);
  - đầu ngẩng lại một phần để mắt nhìn ngang.
- **Tay trái cầm cương** (La Mã, Iberia/Gaul): mỗi khung, nắm tay trái được giải IK tới giữa hai đầu dây cương của lane 2. Đầu dây đi theo cổ ngựa, nên dây cương luôn nằm trong nắm tay.
- **Tay phải mang vũ khí:**
  - giáo dựng chếch ra trước khi đứng, đi, chạy chậm (`SPEAR_UP`);
  - giáo chĩa ra trước khi phi (`SPEAR_FORWARD`);
  - lao của người Numidia chĩa lên (`JAVELIN_UP`).
- **Khiên:**
  - đeo ở cẳng tay trái (La Mã, Iberia/Gaul, vì tay trái cầm cương): khiên dựng ở giai đoạn `kit` như khiên bộ binh trong nắm tay trái, rồi gắn vào xương `ik_hand_l` (`whp_clips.SPARE_BONE`, như hai cây *pilum* của hastatus). Mọi clip đặt xương này theo cẳng tay trái: tâm khiên ở 35% cẳng tay tính từ khuỷu, cách ra ngoài 17 cm, mặt khiên quay ra ngoài và hơi ra trước (`SHIELD_HANG`);
  - trong tay trái (Numidia): tay trái giải IK như lính bộ binh cầm khiên, khiên ở trước hông trái (`RIDE_SHIELD`).

### Clip

| Clip | Ngựa | Người | Độ dài |
|---|---|---|---|
| `idle` | `idle` của ngựa | ngồi, thở, quay đầu nhìn sang trái rồi trở lại | 4,967 s (149 khung) |
| `walk` | `walk` | ngồi, đung đưa theo ngựa | 1,667 s (50 khung) |
| `jog` | `trot` (nước kiệu) | ngồi nước kiệu, thân đỡ nhịp | 0,833 s (25 khung) |
| `run` | `run` (phi, dựng lại ở T-030) | ngả ra trước, giáo (kiếm) chĩa ra trước | 0,433 s (13 khung) |
| `attack` | đứng bốn chân (tư thế gốc của ngựa), thở và gật đầu theo nhịp đánh | đâm giáo qua vai, phóng lao, hoặc chém kiếm (Gaul) | 1,0 s (30 khung) hoặc 1,333 s (40 khung) |
| `die` | `die` của ngựa | ngã theo ngựa, rồi văng khỏi lưng, nằm yên | 1,967 s (59 khung), không lặp |
| `block` | đứng bốn chân như `attack`, hất đầu nhẹ lúc đòn chạm | đưa khiên ra trước người đỡ đòn, khiên bị dội lại, rồi ngồi lại như cũ | 1,0 s (30 khung), không lặp |
| `hit` | đứng bốn chân như `attack`, hất đầu lúc đòn chạm | bật ngửa và xoay người trên lưng ngựa, đầu gục tới, rồi ngồi lại | 1,0 s (30 khung), không lặp |

- **Đâm giáo** (La Mã, Iberia/Gaul):
  - giáo giơ trên vai phải, chĩa ra trước và xuống; kéo về sau, đâm tới qua bên phải đầu ngựa, giữ một nhịp, rồi về;
  - thân xoay theo (vai phải lùi 18° rồi tiến 16°) và ngả tới 10° lúc đâm;
  - đường tay tự dựng bằng IK theo các khung khoá (`THRUST`), không dùng clip của thư viện.
- **Phóng lao** (Numidia): lao kéo về sau qua vai phải, phóng ra trước và lên, tay vung theo, rồi về tư thế mang lao (`THROW`). Thân xoay 24° ra sau rồi 16° ra trước.
- **Chém kiếm** (Gaul, T-050, `SLASH`, kiểu `sword-slash`, 1,333 s): từ tư thế cầm kiếm dựng chếch ra ngoài bên phải (`SWORD_UP`), giơ kiếm qua vai phải, lưỡi chĩa lên và ra sau (khung 7–10); chém tới qua bên phải đầu ngựa, vươn xa nhất khi lưỡi kiếm gần nằm ngang (khung 15, 0,500 s: cảnh lấy lúc này làm lúc đòn chạm); bổ xuống bên phải cổ ngựa (khung 18–23), rồi về. Thân xoay 22° ra sau rồi 18° ra trước, ngả tới 15° lúc chém. Khi phi, kiếm chĩa lên và ra trước, lệch sang phải để không chạm tai ngựa (`SWORD_FORWARD`).
- **Ngã:**
  - ngựa khuỵu gối rồi lăn sang sườn phải (−X);
  - từ khung 12 tới khung 40, người được trộn dần từ tư thế ngồi trên yên sang cú ngã ngửa `Death01` của thư viện (từng xương: góc quay theo xương cha; xương gốc theo vị trí trong không gian);
  - cú ngã ấy đặt trên mặt đất phía ngựa lăn sang, mặt hướng về ngựa: người văng qua lưng ngựa và ngã ngửa ra xa nó. Chỗ nằm tính từ khung cuối: phía người gần ngựa cách thân ngựa 6 cm;
  - từ khung 46 người nằm yên;
  - khiên đeo cẳng tay đi theo tay rồi nằm phẳng xuống đất cạnh tay trái; giáo nằm ngang.
- **Đỡ đòn và trúng đòn** (đợt G, `_reaction`, cùng hợp đồng với bộ binh: `whp_clips.REACT`, đòn chạm ở khung 9):
  - `block`, người đeo khiên ở cẳng tay (La Mã, Iberia/Gaul): tay trái rời dây cương, cẳng tay đưa ngang trước ngực cho mặt khiên quay ra trước (`SHIELD_UP`); thân xoay bên khiên về phía đòn 14°, chồm tới 6°. Đòn chạm thì khiên bị dội về ngực, thân bật ngửa 5°; nửa sau clip tay trở lại dây cương. Dây cương là lưới của ngựa nên vẫn nằm ở cổ ngựa lúc tay rời ra;
  - `block`, người cầm khiên trong tay (Numidia): đẩy khiên ra trước rồi bị dội lại, như lính bộ binh (`RIDE_SHIELD_REACT`);
  - `hit`: thân bật ngửa 18°, xoay 16°, nghiêng 7°, đầu gục tới rồi ngẩng lại (`REACT_TRUNK`); tay trái giữ dây cương, khiên của người Numidia bị bật sang trái;
  - ngựa hất đầu lên lúc đòn chạm (`REACT_TOSS`: 3° và 10°);
  - hai clip dựng sau `die`, nên sáu clip trước giống hệt từng byte so với trước đợt G.
- Mọi clip đều không có chuyển động gốc.

**Sải bước đo như cảnh** (`gait_check.py` trên LOD0 của file `.glb`; "đế chân" là móng ngựa):

| Clip | Một vòng | Tốc độ ở cỡ thật | Trượt lớn nhất của móng trụ trong một khung |
|---|---|---|---|
| `walk` | 1,08 m / 1,667 s | 0,65 m/s | 101% |
| `jog` | 1,82 m / 0,833 s | 2,19 m/s | 1% (trước T-030: 88%) |
| `run` | 5,51 m / 0,433 s | 12,7 m/s | 1% (trước T-030: 1,09 m / 0,400 s, 269%) |

`walk` là dáng đi của file gốc (lane 2 lấy mẫu lại); độ trượt có sẵn trong file gốc, ở vài khung lúc móng chạm và rời đất. `run` dựng lại và `jog` khoá móng ở T-030 (mục "Clip phi" ở trên). Ngựa Numidia nhỏ hơn nên sải ngắn hơn 5%.

### Giai đoạn `lod`

- Các phần của người (`PARTS`, như lính bộ binh nhưng ít tam giác hơn) và các phần của ngựa (`horse_lod.low_parts`, chỉ với yên cương của loại kỵ binh đó) xếp chung **một atlas** 2048, bake một lượt từ các lưới chi tiết của cả hai (`whp_unit_lod.bake_atlas`).
- Mật độ điểm ảnh của ngựa bằng 0,62 lần của người (`Horse.uv`): lông ngựa gần như một màu, người cần điểm ảnh hơn.
- **AO** bake riêng cho người và cho ngựa (ở tư thế gốc, người đứng xuyên qua lưng ngựa).
- Lưới chi tiết của ngựa bake ở tư thế nghỉ, tắt armature (như lane 2).
- **Ngân sách:** ngựa đủ yên cương chiếm 3 344 tam giác ở LOD0 (thân 2 738, bờm, đuôi, vải lót yên, dây cương), ngựa Numidia 3 036; người lấy phần còn lại (3 873–4 248). Số tam giác của từng mô hình ở mục "Kết quả" của T-022.
- **LOD2 của người** là hình đơn giản theo khung xương như lính bộ binh, nhưng không có bàn tay, bàn chân và váy (`LOD2["feet"] = False`, `"skirt": None`): 150 tam giác; thêm khiên và giáo hay lao.
- **LOD1 và LOD2 ít đường nối** (T-047) như lính bộ binh, cho cả người và ngựa: các mảnh LOD1 của ngựa (`horse_lod.lod1_pieces`: thân, đuôi, vải lót yên, dây cổ) chia vùng và lấy màu như của người; một bảng màu chung cho LOD2 của người và ngựa.
- **Mặt trong của vạt áo** (T-050, `iberian-gallic-cavalry`): áo của mô hình nền La Mã (`Tunic_1`) có hai lớp vải; lớp trong bake ra màu xám. Khi vạt áo kéo theo đùi, lớp trong lộ thành mảng xám ở sườn trái, nhìn từ trước. `Part(drop=whp_cavalry.inner_skirt)` xoá khỏi bản ít tam giác của áo những mặt dưới hông quay vào giữa người (2 573 mặt), trước khi giảm tam giác; tia bake của áo cũng xuất phát xa hơn (3 cm). Clip không đổi. `roman-cavalry`, `numidian-cavalry` không đổi (không thấy lỗi này ở hai mô hình đó, nên không áp).

### Kích thước

- Yên cao 1,35 m (Numidia 1,27 m); ngựa Numidia cao 1,33 m tới vai.
- Mũi giáo dựng chếch lên tới **3,04 m** (La Mã) và 2,95 m (Iberia/Gaul) khi đứng yên; đỉnh ngù mũ La Mã khoảng 2,55 m. Cao hơn trần 2,25 m (và 2,44 m của triarii) trong hợp đồng. Cảnh lấy chiều cao từ khung bao ở tư thế gốc, ở đây khoảng 2,67 m.

### Ghi chú cho cảnh 3D (lane 3, phiên chính)

- Xương `ik_hand_l` mang khiên của kỵ binh La Mã và Iberia/Gaul, có vị trí và góc quay trong mọi clip. Cảnh đã nướng mọi xương nên hiện đúng.
- Ở tư thế gốc người đứng chữ A trên lưng ngựa; cảnh luôn phát ít nhất `idle`.
- `jog` (nước kiệu, 2,19 m/s) và `run` (phi, 2,73 m/s) của ngựa gần nhau về tốc độ tự nhiên; xem đề xuất ở "Kết quả" của T-022.

### Thay đổi ở các file ngựa (lane 2) cho T-022

Chỉ `horse_lod.py`; kết quả của con ngựa không đổi:
- `low_parts(keys=TACK, uv=1.0)`: chọn yên cương và mật độ điểm ảnh;
- `Spec` (trước là `_Spec`), `specs(parts, sources)`, `Unskinned` (tắt armature khi bake), `levels(parts, rest, color_image)` (các mức LOD theo nhóm);
- `bake` dùng `whp_unit_lod.bake_atlas`; `build` dùng `whp_unit_lod.finish_lod` (trước là `_finish_lod`; tên cũ vẫn giữ).

### Ảnh duyệt

`art/renders/<model>/` cho bốn mô hình, render từ file `.glb`:

| Ảnh | Nội dung |
|---|---|
| `01-front-side-back.jpg` | Trước, nghiêng (bên trái, bên khiên), sau; đứng (`idle` khung 0). |
| `02-three-quarter.jpg` | Nhìn chéch. |
| `03-lods.jpg` | LOD0, LOD1, LOD2. |
| `04-anim-idle.jpg` … `09-anim-die.jpg` | Ba khung mỗi clip (`idle`, `walk`, `jog`, `run`, `attack`, `die`), nhìn từ bên phải ngựa. |
| `10-beside-roman-legionary.jpg` | Cạnh `roman-legionary`: nhìn trước, rồi nhìn nghiêng (người đứng trước đầu ngựa). |
| `11-beside-cavalry.jpg` | Chỉ `gallic-cavalry` (T-050): kỵ binh Iberia, Gaul, La Mã cạnh nhau (`HORSEMEN`); trước, bên trái, sau. |
| `12-far-cavalry.jpg` | Chỉ `gallic-cavalry`: ba kỵ binh đó nhỏ như cảnh vẽ ở LOD1 (khoảng 40 điểm ảnh, cột trái) và LOD2 (khoảng 13 điểm ảnh, cột phải), phóng to không làm mượt; hàng trên nhìn trước, giữa bên trái, dưới sau. |

`block` và `hit` của kỵ binh xem ở ảnh hai kỵ binh đối mặt quanh lúc đòn chạm (`render_review.py -- --model A --duel B`): `art/renders/duel-roman-cavalry-iberian-gallic-cavalry.jpg`, `art/renders/duel-roman-cavalry-numidian-cavalry.jpg`, `art/renders/duel-roman-cavalry-gallic-cavalry.jpg`.

- `art/renders/cavalry-lineup.jpg`: bốn mô hình kỵ binh nhìn nghiêng (bên phải): La Mã, Iberia, Gaul, Numidia.
- `art/renders/roman-legionary/17-jog-before-after.jpg`: hàng trên là `run` (trước T-022, cảnh phát clip này chậm lại khi khối quân đi vừa phải), hàng dưới là `jog`; sáu khung mỗi clip.

### Kỵ binh Gaul (`gallic-cavalry`, T-050)

Người cưỡi là người Celt của `gallic-infantry` (`celt_source`, nắm tay đã khép), không phải lính La Mã như ba mô hình kia. Nguồn và lựa chọn của từng món: docstring của `unit_gallic_cavalry.py` và `art/CREDITS.md`.

- **Áo** (`celt_tunic.py`): một ống vải quanh thân, từ cổ áo (1,35 m phía trước, dưới vòng *torc*; 1,405 m phía sau) tới gấu 0,76 m, cách da 9 mm. Dưới ngực, vải thu vào chậm hơn thân người (0,35 m mỗi mét); ở thắt lưng (0,945–1,000 m) bó sát; xuống hông xoè thêm tới 2,2 cm. Hai tay áo là hai ống quanh cánh tay trên, từ trong vai tới trên khuỷu, đo theo chính bề mặt cánh tay. Một lớp vải; viền vàng 3,5 cm ở cổ, tay và gấu là ô vật liệu riêng. Đai da ở eo bám theo áo. Trọng số lấy mẫu từ thân như mọi đồ mặc; vạt áo kéo theo đùi khi ngồi (`SKIRTS = ("Tunic.low",)`, `LEGS_MESH = "Celt_legs"`). Đai lưng to của mô hình nền nằm dưới áo nên không có trong LOD; phần thân người dưới áo bị bỏ ở LOD0 (`covers`).
- **Áo choàng** (`celt_cloak.py`): mỗi cột của lưới đi quanh trục thẳng đứng sau lưng, từ giữa lưng ra hai bên tới 96°; mỗi hàng ở một độ cao. Mỗi điểm cách thân (và áo) 1–2,2 cm, rủ từ chỗ rộng nhất phía trên, thu vào lưng chậm (0,3 m mỗi mét), xoè 2,5 cm ở gấu. Gấu sau ở 0,79 m (ngồi: trên yên khoảng 12 cm), gấu hai bên 0,985 m (trên đùi khi ngồi). Lớp vỏ dày 9 mm, kín (mặt ngoài, mặt trong, viền). Vân kẻ ô là ảnh 96 × 96 điểm ảnh lặp mỗi 9 cm theo UV `cloth` (mét dọc theo vải). Trọng số chỉ theo cột sống, hông và một phần xương đòn (`weights`), không theo tay hay chân. Trước khi cho áo choàng thu vào lưng, áo choàng rủ thẳng lơ lửng sau lưng, nên khi người nằm ngửa (`die`) gấu áo cắm xuống đất 5,7 cm (độ nâng lúc nằm của `whp_clips` tối đa 12 cm).
- **Tóc** (`celt_hair.py`): tóc của mô hình nền là ảnh vật liệu trên đầu, ngắn. Lớp tóc mới lấy những mặt của lưới đầu có màu tóc vàng trong ảnh vật liệu (bỏ vòng *torc*, lông mày và ria), đẩy ra 1,4–2 cm, dày hơn về phía sau, lổn nhổn theo nhiễu; thêm một mảng tóc rủ từ sau đầu xuống gáy, dựng như áo choàng (thu vào gáy 0,75 m mỗi mét). Trọng số: đầu, xuống gáy là cổ rồi `spine_03`.
- **Chỗ ngồi:** `SEAT_MEASURE = "seated"` (mục "Tư thế ngồi"). Đùi choãi hơn và cẳng chân hơi ra ngoài (`Rider(thigh=(0.49, -0.61, -0.62), calf=(0.07, 0.16, -0.985))`) vì quần ống rộng.
- **Đánh:** chém kiếm (mục "Clip").
