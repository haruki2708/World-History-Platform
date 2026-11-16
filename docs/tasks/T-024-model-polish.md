# T-024: Sửa các chỗ chưa ưng ý của mô hình bộ binh

- **Lane:** 1
- **Model đề xuất:** Fable 5.2, effort `high`. Hết hạn mức thì dùng Opus 5.5, effort `xhigh`.
- **Nhánh:** `lane1/T-024-model-polish` (tạo từ `main` mới nhất)
- **Phạm vi file:** `art/` (trừ các file ngựa của lane 2: `art/blender/horse_*.py`, `art/renders/horse/`, `art/build/horse/`), `public/battles/models/`

## Bối cảnh

T-021 và T-023 đã gộp ngày 2026-11-17: cảnh Cannae có đủ 8 mô hình bộ binh, và trận đã xem được từ app chính (khung xem trận). Còn T-022 (kỵ binh), nhưng task đó phải chờ ngựa của lane 2 (T-020 đang làm).

Trong lúc chờ, task này sửa những chỗ chưa ưng ý đã được ghi lại ở hai nơi:
- lane 1, mục "Còn chưa ưng ý" của T-021;
- lane 3, mục "Ghi chú cho lane 1" của T-023.

## Đọc trước

- `docs/tasks/T-021-infantry-models.md`, mục "Còn chưa ưng ý".
- `docs/tasks/T-023-battle-viewer.md`, mục "Ghi chú cho lane 1".
- `docs/ARCHITECTURE.md`, mục "Mô hình lính". Mới có:
  - cảnh tự đo sải chân từ clip;
  - chiều cao tối đa của hình lính;
  - xương `ik_hand_gun`.
- `src/components/battle/engine/figures/model.ts`, hàm `plantedStride`: cách cảnh đo sải chân. Chỉ đọc, không sửa.

## Yêu cầu

Commit sau mỗi việc. Nếu sắp hết hạn mức thì ghi bảng tiến độ vào mục "Kết quả" rồi commit.

### 1. Sải chân và clip `walk`, `run` (ưu tiên cao nhất)

Lane 3 đo trên clip đã bake và ra số khác tài liệu:

| Clip | Lane 3 đo được | `art/README.md` ghi |
|---|---|---|
| `walk` | 1,31 m mỗi vòng | 1,00 m |
| `run` | 5,5 m mỗi vòng (5,9 m/s ở cỡ người thật, gần chạy nước rút) | 1,99 m |

Clip nguồn của `run` là `Jog_Fwd_Loop` (chạy chậm). Theo lane 3, số của lane 1 chỉ cộng quãng trượt lúc chân chạm đất.

- **Đo lại theo cách của cảnh:** lấy tốc độ lùi của bàn chân trụ trong pha chân chạm đất, rồi tính ra quãng đường một vòng. Tìm vì sao hai cách đo khác nhau. Có thể dùng lại kịch bản `s-planted.mjs` và `s-stride.mjs` của lane 3 trong `E:\World_History_Platform_assets\T-023\tools\` (ngoài repo; cách chạy ghi ở cuối mục "Kết quả" của T-023).
- **Nếu `run` sau khi đổi đích thật sự là chạy nước rút** (ví dụ do đổi đích làm sai tỉ lệ chuyển động): sửa lại thành chạy chậm, hợp với lính giữ đội hình, khoảng 2,5–3,5 m/s ở cỡ người thật. Nếu clip nguồn vốn như vậy thì ghi lại và đề xuất cách xử lý.
- **Clip `walk`:** quanh lúc gót chạm đất và lúc mũi chân rời đất (khung 0–4 và 20–24), bàn chân trượt khoảng 32%. Sửa nếu không tốn nhiều công.
- Sửa các số trong `art/README.md` cho đúng.
- Cảnh tự đo sải chân, nên đổi clip không phải sửa code. Kiểm tra trong `/battle-lab` (`npm run dev -- -p 3101`) rằng chân không trượt rõ khi đi và khi chạy.

### 2. Tay người Gaul

Bàn tay của mô hình Celt không nắm lại: chuôi kiếm nằm giữa các ngón xoè, tay trái cầm khiên cũng vậy. Làm cho hai bàn tay nắm chặt, ví dụ:
- giữ một tư thế ngón tay nắm cố định cho mô hình này trong mọi clip;
- hoặc sửa trọng số.

### 3. Đùi chọc qua vạt áo

Velites lúc phóng lao và lính Baleares lúc ném: đùi phải đưa ra trước, chọc qua vạt áo trong vài khung. Sửa, ví dụ:
- giảm biên độ chân trong hai kiểu tấn công này;
- hoặc thêm trọng số cho vạt áo theo đùi.

### 4. Hastati và *pilum*

Lane 3 thấy ở cự ly gần: hastati đánh bằng kiếm trong khi tay trái vẫn cầm hai cây *pilum*. Theo Polybius, hastati phóng *pilum* trước rồi mới rút kiếm. Chọn cách ít tốn công nhất mà vẫn trông hợp lý, và ghi lý do. Ví dụ:
- trong `attack`, hai cây *pilum* nằm sau khiên, khuất khỏi mặt trước;
- hoặc một kiểu `attack` mới là phóng *pilum*. Lưu ý: cảnh chỉ có một clip `attack` cho mỗi mô hình, nên không thể vừa phóng lao vừa đâm kiếm.

### 5. Nếu còn hạn mức (tuỳ chọn, theo thứ tự)

1. Khi nhìn nghiêng, giáo của triarii ngả ra trước khoảng 10°.
2. Ở LOD2, bàn tay trái lòi qua khiên.
3. Tóc lính Baleares trông giống mũ da.
4. Lúc ngã, mép khiên và đầu vũ khí chạm đất vài cm.

### Chung

- Đúng hợp đồng như T-021:
  - 67 xương;
  - LOD trong giới hạn tam giác;
  - một vật liệu;
  - năm clip;
  - khoảng 2 MB mỗi file.
- Mô hình nào bị ảnh hưởng thì xuất lại. Chạy lại từ đầu phải ra file giống hệt từng byte.
- Ảnh duyệt:
  - cập nhật những ảnh trong `art/renders/<model>/` có thay đổi;
  - thêm ảnh trước và sau cho từng việc 1–4.
- Nếu đổi tên hay chữ ký hàm trong `whp_*.py` thì ghi vào "Kết quả", vì lane 2 đang import các module này.

## Ràng buộc

- Như T-021:
  - không đưa file gốc hay `art/build/` vào repo;
  - không dùng tài sản chưa đọc giấy phép, tài sản NC hay ND, hay tài sản trích từ game;
  - không sửa `src/`;
  - không thêm thư viện npm.
- Không sửa các file ngựa của lane 2.
- Lane 2 cũng chạy Blender. Trước mỗi lần chạy Blender, kiểm tra bằng `tasklist | findstr blender`; nếu có Blender khác đang chạy thì chờ nó xong.
- Bake bằng Cycles thì dùng CPU. Không để `blender.exe` chạy khi không cần.

## Xong khi

- Việc 1–4 xong. Việc nào không làm được thì ghi rõ lý do.
- `/battle-lab?stats=1`: cả 8 loại bộ binh ghi `file`, console sạch.
- Chân không trượt rõ khi đi và khi chạy. Ghi cách đã kiểm.
- Chạy lại script từ đầu ra file giống hệt từng byte.
- `npm run validate`, `npm run lint`, `npm run build` qua.

## Kết quả

Xong việc 1–4 và việc tuỳ chọn 5.1. Nhánh `lane1/T-024-model-polish`, mỗi việc một commit, thêm một commit ảnh duyệt cho các mô hình chỉ đổi `walk`/`run`.

### Đối chiếu "Xong khi"

- **Việc 1–4:** xong (chi tiết dưới). `run` vẫn là clip chạy nhanh của thư viện: clip nguồn vốn như vậy, không phải do đổi đích; đề xuất cách xử lý ở mục 1.
- **`/battle-lab?stats=1`:** cả 8 loại bộ binh ghi `file` (`balearic-slinger`, `gallic-infantry`, `iberian-infantry`, `libyan-infantry`, `roman-hastatus`, `roman-legionary`, `roman-triarii`, `roman-velites`); ba mô hình kỵ binh còn `placeholder`. Console sạch: không lỗi, không cảnh báo (Chrome không giao diện, điều khiển qua DevTools).
- **Chân không trượt rõ khi đi và khi chạy:** cách kiểm ở mục 1.
- **Chạy lại từ đầu ra file giống hệt từng byte:** `build_model.py -- --model all` dựng lại cả 8 mô hình từ file gốc; `git status` không thấy file nào đổi so với các file đã commit (dựng ở những lần chạy riêng trước đó). SHA-256 (12 ký tự đầu):

  | File | SHA-256 |
  |---|---|
  | `balearic-slinger.glb` | `11c8a25ef0bd` |
  | `gallic-infantry.glb` | `1f3ede80016c` |
  | `iberian-infantry.glb` | `da3c62fa34eb` |
  | `libyan-infantry.glb` | `34b60a1b3cf9` |
  | `roman-hastatus.glb` | `23b4dfa720ce` |
  | `roman-legionary.glb` | `5a4e583a254b` |
  | `roman-triarii.glb` | `d4ae27e2cd0b` |
  | `roman-velites.glb` | `de181d7f2fe6` |
- **`npm run validate`, `npm run lint`, `npm run build`:** đều qua.
- **Hợp đồng:** mọi file 67 xương, LOD trong giới hạn tam giác, một vật liệu, năm clip, đứng trên y = 0; bước kiểm tra của script qua cho cả 8. Dung lượng (byte):

  | Mô hình | Dung lượng |
  |---|---|
  | `balearic-slinger` | 1 715 188 |
  | `gallic-infantry` | 1 840 892 |
  | `iberian-infantry` | 1 737 436 |
  | `libyan-infantry` | 2 220 808 |
  | `roman-hastatus` | 1 900 956 |
  | `roman-legionary` | 2 216 524 |
  | `roman-triarii` | 2 225 052 |
  | `roman-velites` | 1 808 608 |
  | **Tổng** | **15 665 464** |

### 1. Sải chân, `walk` và `run`

**Đo lại theo cách của cảnh.** Tôi viết `art/tools/gait_check.py` (Python và numpy, không cần Blender): đọc thẳng file `.glb`, skin các đỉnh đế bàn chân của LOD0 với từng khung, rồi đo như `plantedStride`. Trên file cũ, nó ra đúng số của lane 3: `walk` 1,305 m mỗi vòng, `run` 5,50 m. Số sau khi sửa (8 mô hình như nhau, chênh dưới 0,03 m):

| Clip | Một vòng | Tốc độ ở cỡ người thật | `art/README.md` cũ |
|---|---|---|---|
| `walk` | 1,30 m trong 1,333 s | 0,975 m/s | 1,00 m |
| `run` | 5,45 m trong 0,933 s (người Gaul 5,47 m) | 5,84 m/s | 1,99 m |

**Vì sao hai cách đo khác nhau.** `_stride` cũ của `whp_clips` cộng quãng lùi của mắt cá thấp hơn qua từng khung. Hai chỗ sai:
- `walk`: lúc hai chân cùng chạm đất, mắt cá của chân vừa hạ đã thấp hơn, nên script theo chân đó (mắt cá còn đưa ra trước), bỏ qua mũi chân sau vẫn đang tì đất và lùi theo mặt đất. Trên clip nguồn: phần lùi chỉ có 1,07 m, phần tiến trừ đi 0,06 m, nên ra 1,01 m.
- `run`: 19 trên 28 khung không bàn chân nào chạm đất. Hình lính vẫn đi trong lúc đó, nhưng script không tính.

`_stride` đã bỏ. `Builder.strides` giờ đo như cảnh: trung vị tốc độ của các đỉnh đế đang chạm đất, nhân với độ dài clip.

**`run` vốn là chạy nhanh từ clip nguồn, không do đổi đích.**
- Bản có chuyển động gốc của thư viện (`UAL1_Standard_RM.glb`) đi 5,00 m trong một vòng `Jog_Fwd_Loop` (5,36 m/s). Bản tại chỗ mà ta dùng: chân trụ lùi 5,9 m/s. Bản `RM` của `Walk_Loop` đi 1,30 m, khớp với số đo của `walk`.
- Đổi đích giữ nguyên tỉ lệ: chân của khung xương dài bằng 0,998 lần chân hình nộm.
- Dáng của clip là chạy nước rút: 129 bước/phút, mỗi bước 2,7 m, mỗi bàn chân chạm đất 4–5 trên 28 khung. Thư viện không có clip chạy chậm nào khác (UAL 1 có `Jog_Fwd_Loop`, `Sprint_Loop`, hai kiểu đi; UAL 2 không có clip chạy).

**Đề xuất cho `run` (phiên chính và lane 3 quyết).** Trận được phát nhanh hơn thật nhiều lần. Đo trong cảnh (`s-gait`), các khối bộ binh đang chạy đi 8–22 m/s trên màn hình ở pha 3–4, tức 2,7–7,5 m/s ở cỡ hình lính (FIGURE_SCALE 3); lúc dàn trận 30–70 m/s. Clip hiện tại (17,5 m/s ở cỡ hình lính) được phát ở 0,46–1,27 lần tốc độ của nó.
1. **Giữ nguyên.** Hợp với lúc quân La Mã xông lên ở pha 4 (20–22 m/s, phát khoảng 1,2 lần, trông như chạy thật). Ở đầu dưới (pha 3, 8–10 m/s) clip phát chậm còn khoảng 0,5 lần, trông như chạy nước rút quay chậm.
2. **Thêm clip thứ ba vào hợp đồng** (ví dụ `jog`, khoảng 3 m/s ở cỡ người thật), cảnh chọn đi, chạy chậm hay chạy nhanh theo tốc độ. Cho kết quả đẹp nhất ở cả hai đầu. Lane 1 dựng được, ví dụ trộn `Walk_Loop` và `Jog_Fwd_Loop` theo pha rồi khoá chân như dưới; mỗi file nặng thêm khoảng 80 KB.
3. **Thay `run` bằng clip chạy chậm khoảng 3 m/s.** Khi đó lane 3 phải nâng `MAX_RUN_RATE` lên khoảng 2,5 (lính chạy líu ríu ở pha 4), hoặc chấp nhận chân trượt trên 13,5 m/s.

Tôi nghiêng về 2; nếu chưa muốn đổi hợp đồng thì giữ 1.

**Clip `walk` trượt chân: đã sửa.** Chỗ trượt có sẵn trong clip nguồn: lúc mũi chân đẩy rời đất, mũi chân trượt ra trước, tới 80% tốc độ mặt đất trong vài khung. Cách sửa (`whp_clips.Builder.lock_feet`):
- với `walk` và `run`, script dựng clip thêm ba lượt;
- mỗi lượt, với từng bàn chân đang chạm đất, dời mắt cá theo chiều ngang để đỉnh thấp nhất của đế lùi đúng tốc độ mặt đất từ khung này sang khung sau;
- độ dời được canh giữa trong mỗi lần chạm đất, rồi trả về dần trong lúc chân ở trên không;
- mắt cá dời tối đa 2,1 cm (`walk`) và 0,8 cm (`run`). Log của giai đoạn `anim` ghi các số này cho từng mô hình.

**Cách đã kiểm chân không trượt:**
- `gait_check.py` trên LOD0 của cả 8 file: độ trượt lớn nhất của chân trụ trong một khung, `walk` từ 81% xuống 2–3%, `run` từ 5–6% xuống 1%. Biểu đồ trước/sau: `art/renders/roman-legionary/16-foot-slip-before-after.jpg`.
- Trong cảnh thật, kịch bản `s-planted.mjs` của lane 3 (chép sang cổng 3101):
  - đi: hastati ở pha 3 với `norun` (khối tiến thẳng, đi bộ 8,2 m/s). Bản cũ: chân trụ trượt 4,7% quãng đường, riêng 33 bước ở các khung bàn chân lăn là 25%. Bản mới: 0,5%; 38/40 khung đi đều tốc độ (bản cũ 32/40);
  - chạy: hastati ở pha 3 (8,2 m/s): 1,5%.
- **Ghi chú cho lane 3:** ở pha 5–6, `s-planted` cho 32–48% với khối đang đi (hastati, principes, Libya), như nhau ở bản cũ lẫn bản mới. Rất có thể do khối đi xiên so với hướng mặt (ví dụ người Libya quay vào sườn quân La Mã): chân trụ lùi theo hướng mặt, còn kịch bản đo theo hướng đi. Clip không sửa được chỗ này.

`art/README.md` đã sửa số, cách đo, lý do số cũ sai và mục khoá chân trụ.

### 2. Tay người Gaul

Hai bàn tay đã nắm chặt (`celt_hands.py`, mới):
- giai đoạn `source` bẻ các xương ngón của chính mô hình Celt thành nắm tay: ngón dồn sát nhau, gập quanh trục ngang bàn tay (60–72°, 80–90°, 44–50° ở ba khớp), ngón cái xoay vào trước lòng bàn tay rồi gập đè lên đốt giữa ngón trỏ và ngón giữa;
- lưới lấy hình đã nắm làm tư thế gốc, như nắm tay của mô hình La Mã khép sẵn trong lưới. Giai đoạn `rig` gộp trọng số ngón vào bàn tay (`MERGE_FINGERS`), nên tay nắm trong mọi clip mà không cần key ngón nào;
- lòng nắm tay được tính từ các khớp ngón (đường tròn qua các khớp của từng ngón); `celt_kit` đặt chuôi kiếm và tay cầm khiên vào đó.

Ảnh trước/sau: `art/renders/gallic-infantry/14-fists-before-after.jpg` (tay trái cầm khiên nhìn từ sau khiên; tay phải cầm kiếm hai góc; tay phải lúc giơ kiếm). Ảnh duyệt của người Gaul đã render lại.

### 3. Đùi chọc qua vạt áo

Đã sửa bằng cách giảm biên độ chân. Phóng lao (velites) và ném đá (lính Baleares) vẫn giữ nửa biên độ thân của clip nguồn, nhưng chân chỉ còn một phần tư (`CALM_THROW_SKIRT`). Lính vẫn bước chân trước khi ném, chỉ bớt choãi.

Tôi thử cách sửa trọng số trước (kéo trọng số vạt áo theo xương đùi, dưới khớp hông, tới 90%) nhưng không đỡ: đùi chọc ra ở phần trên, gần ngang khớp hông, nơi trọng số theo đùi hầu như không tác dụng. Code đó đã bỏ.

Ảnh trước/sau: `roman-velites/14-skirt-before-after.jpg`, `balearic-slinger/14-skirt-before-after.jpg` (bốn khung `attack` quanh lúc bước tới và hai khung `run`).

### 4. Hastati và *pilum*

Chọn: **trong `attack` và `die`, hai cây *pilum* không còn**, coi như đã phóng.
- Lý do: lính lê dương phóng *pilum* rồi mới rút kiếm xông lên (Caesar, *Gallic War* 1.25 tả rõ nhất). Cảnh chỉ có một clip `attack` cho mỗi mô hình. Giấu *pilum* sau khiên không được: *pilum* dài khoảng 2 m, khiên cao 1,2 m; dựng đứng thì nhô lên trên, nằm ngang thì chĩa ra sau, đâm vào hàng sau.
- Cách làm (ít công nhất): *pilum* gắn vào xương `ik_hand_l`, xương IK mà không lưới nào khác dùng. Mọi clip đặt xương này theo bàn tay trái; riêng `attack` và `die` thu nhỏ còn 1% quanh cổ tay, tức *pilum* biến vào trong nắm tay. Xương có vị trí, góc quay và tỉ lệ trong clip. Cảnh đã nướng `matrixWorld` của mọi xương nên hiện đúng.
- Kiểm trong cảnh (`s-attack`, `s-pila`): hàng đầu hastati đang đánh không còn *pilum*; lúc đứng và lúc chạy vẫn có.
- Ảnh trước/sau: `roman-hastatus/16-pila-before-after.jpg`.

### 5. Việc tuỳ chọn

1. **Giáo của triarii: xong.** Đo trên clip: nhìn nghiêng, giáo ngả ra trước 14° khi đứng, 15° khi đi, 30° khi chạy, vì hướng giáo đặt trong khung ngực mà ngực nghiêng ra trước khoảng 9°. `SPEAR_CARRY` giờ ngả giáo về sau bằng chừng ấy: lệch dưới 3° khi đứng và đi, khoảng 18° khi chạy. Mũi giáo cao 2,44 m. Ảnh: `roman-triarii/14-spear-before-after.jpg`.
2. LOD2 bàn tay trái lòi qua khiên: chưa làm.
3. Tóc lính Baleares giống mũ da: chưa làm.
4. Lúc ngã, mép khiên và đầu vũ khí chạm đất: chưa làm. Riêng hastatus không còn *pilum* lúc nằm (việc 4).

### Ảnh duyệt

- Render lại toàn bộ ảnh của cả 8 mô hình (`walk` và `run` đều đổi) và `infantry-lineup.jpg` (nắm tay người Gaul).
- Thêm sáu ảnh trước/sau, liệt kê ở `art/README.md`, mục "Ảnh duyệt". Hàng trên là trước, hàng dưới là sau. Chúng render từ file `.glb` cũ (lấy từ git) và file mới bằng lệnh mới `render_review.py -- --model X --before OLD.glb --compare {fists,skirt,pila,spear} --out NN-tên.jpg`.
- Mọi ảnh dưới 400 KB.

### Thay đổi ở các module `whp_*.py` (cho lane 2)

Không đổi tên hay bỏ hàm công khai nào; chỉ thêm tham số tuỳ chọn và hằng số. Các module ngựa của lane 2 dùng (`whp_anim`, `whp_common`, `whp_export`, `whp_lod`, `whp_mesh`, `whp_proxy`, `whp_render`, `whp_skin`, `whp_unit_lod`) chạy như cũ.
- **`whp_anim`:** `Poser.key(frame, bones, located=("pelvis",), scaled=())`: thêm `scaled`, key cả tỉ lệ cho các xương trong đó. Mặc định như cũ.
- **`whp_retarget`:** thêm thuộc tính `Retargeter.ankle_shift` (mặc định `None`).
- **`whp_clips`:**
  - thêm `Soles`, `planted`, `worst_slip`, `lock_shifts`, `Builder.lock_feet`, `Builder.soles`, `Builder.slips`, `Builder.spare`;
  - thêm `GAITS`, `SOLE_HEIGHT`, `GROUND_REACH`, `LOCK_PASSES`, `SPARE_BONE`, `SPARE_GONE`, `SPARE_SCALE`, `TRUNK_BONES`, `LEG_BONES`, `CALM_THROW_SKIRT`;
  - `Kit(..., spare=False)`;
  - `SPEAR_CARRY["aim"]` đổi;
  - bỏ hàm nội bộ `_stride`.
- **`whp_build`:** `RIGID` nhận thêm dạng `(xương để khớp, xương để buộc)`; log của giai đoạn `anim` ghi độ trượt chân.
- **Không đổi:** `whp_common`, `whp_skeleton`, `whp_skin`, `whp_proxy`, `whp_render`, `whp_mesh`, `whp_ual`, `whp_export`, `whp_lod`, `whp_unit_lod`, `whp_materials`.

### Còn chưa ưng ý

1. **`run` là chạy nước rút** (xem đề xuất ở mục 1).
2. **Thu nhỏ *pilum*:** khi cảnh chuyển từ đi sang đánh (0,35 s), *pilum* thu nhỏ dần trong khoảng đó, nhìn gần thấy được. Hastatus chết mà chưa đánh (ví dụ trúng đá) cũng mất *pilum* khi ngã.
3. **Vạt áo khi chạy:** velites và lính Baleares vẫn lộ chút da đùi qua vạt áo ở vài khung `run` (đùi nhấc cao). Không thuộc việc 3; giảm biên độ chân khi chạy thì sải chân đổi, nên chưa làm.
4. **Lỗ nhỏ trên áo lính Baleares:** ở hông trái phía trước, áo LOD0 có một lỗ nhỏ thấy được cả khi đứng, và to ra khi áo bị kéo căng. Có từ T-021.
5. **Nắm tay người Gaul:** nhìn rất gần, các ngón còn hơi lỏng quanh chuôi; ở LOD1 và LOD2 nắm tay giản lược.
6. **Việc 5.2–5.4** chưa làm, cùng các mục còn lại ở "Còn chưa ưng ý" của T-021.

### Đề nghị ngoài phạm vi

1. **Phiên chính, `docs/ARCHITECTURE.md`, mục "Mô hình lính":**
   - thay câu "`art/README.md` đang ghi 1,00 m và 1,99 m; lane 1 cần đối chiếu" bằng số mới: một vòng `walk` 1,30 m trong 1,333 s, `run` 5,45 m trong 0,933 s;
   - mũi giáo triarii cao khoảng 2,44 m;
   - hastatus dùng xương `ik_hand_l` có cả tỉ lệ trong clip (thu nhỏ còn 0,01 ở `attack` và `die`).
2. **Phiên chính và lane 3:** quyết cách xử lý `run` (mục 1).
3. **Lane 3:** xem vì sao ở pha 5–6 chân trụ của các khối đang đi trượt 32–48% (mục 1, ghi chú cho lane 3).
4. Không cần cài thêm gì cho Blender, không thêm thư viện npm. Riêng `gait_check.py --plot` cần matplotlib; không có thì vẫn đo được.
