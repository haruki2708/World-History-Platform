# T-022: Ba loại kỵ binh, và clip chạy chậm `jog`

- **Lane:** 1
- **Model đề xuất:** Fable 5.2, effort `high`. Hết hạn mức thì dùng Opus 5.5, effort `xhigh`.
- **Nhánh:** `lane1/T-022-cavalry` (tạo từ `main` mới nhất)
- **Phạm vi file:**
  - `art/` và `public/battles/models/`.
  - **Ngoại lệ chỉ cho task này:** được sửa các file ngựa của lane 2 (`art/blender/horse_*.py`) nếu cần cho việc ghép người cưỡi. Lane 2 làm T-027 trong bản đồ và dữ liệu nên không đụng tới các file này. Sửa gì thì ghi vào "Kết quả".

## Bối cảnh

Đã gộp:
- **T-024:** chân không trượt, nắm tay người Gaul, vạt áo, *pilum*, giáo triarii;
- **T-020:** con ngựa của lane 2, ở `art/build/horse/horse.blend`;
- **T-026:** cảnh đo được sải móng ngựa và chạy được ngựa thật;
- **T-025:** bản đồ bay tới chiến trường.

Còn lại của trận Cannae là **ba loại kỵ binh**, hiện vẫn là hình tạm. Tên mô hình đã có trong `src/data/battles/unit-types.json`:

| Mô hình | Loại lính dùng nó | Phe |
|---|---|---|
| `roman-cavalry` | kỵ binh La Mã, kỵ binh đồng minh | La Mã |
| `iberian-gallic-cavalry` | kỵ binh Iberia và Gaul (cánh trái của Hasdrubal) | Carthage |
| `numidian-cavalry` | kỵ binh Numidia | Carthage |

**Người dùng duyệt thêm clip thứ sáu, `jog`** (chạy đều, chậm hơn `run`). Lý do: `run` của thư viện là chạy nhanh (5,8 m/s ở cỡ người thật). Khi khối quân đi vừa phải, cảnh phải phát clip này chậm lại, nên trông như chạy nước rút quay chậm.

Phiên chính đã sửa hợp đồng và engine:
- `UNIT_CLIPS` có thêm `jog` ở cuối, nên chỉ số các clip cũ không đổi;
- cảnh xếp các dáng đi theo tốc độ tự nhiên: `walk`, rồi `jog` nếu có, rồi `run`;
- đã thử bằng ngựa thử có nước kiệu đổi tên thành `jog`: kỵ binh đi 4,3 m/s chọn `jog`, đi 2,6 m/s chọn `walk`;
- mô hình chưa có `jog` vẫn chạy như trước.

## Đọc trước

- `docs/ARCHITECTURE.md`, mục "Mô hình lính":
  - `jog` và cách cảnh chọn dáng đi;
  - phần **Kỵ binh** (ngựa, xương `horse_saddle`, ghi công);
  - chiều cao.
- `art/README.md`, mục "Ngựa" và "Gắn người cưỡi" (lane 2 viết).
- `docs/tasks/T-020-horse.md`, mục "Kết quả":
  - phần "Đề nghị cho lane 1": hàm dùng chung của `whp_unit_lod`; `export_glb` xuất thừa action; tên thuộc tính màu; ghép atlas;
  - phần "Còn chưa tốt" của ngựa.
- `docs/tasks/T-026-scene-fixes.md`, mục "Kết quả", phần 2 và "Ghi chú cho lane 1": cảnh đo được sải móng ngựa. Kỵ binh Cannae đi 16–30 m/s trên sân, quá trần nhịp phi, nên móng trượt.
- `docs/tasks/T-024-model-polish.md`, mục 1: đề xuất `jog` của bạn, và `art/tools/gait_check.py`.

## Yêu cầu

Commit sau mỗi phần việc. Nếu sắp hết hạn mức thì ghi bảng tiến độ vào "Kết quả" rồi commit.

### 1. `jog` cho 8 mô hình bộ binh

- Dựng clip `jog`: chạy đều khoảng 2,5–3,5 m/s ở cỡ người thật, dáng lính giữ đội hình (khiên và vũ khí giữ như khi đi).
  - Bạn đã đề xuất: trộn `Walk_Loop` và `Jog_Fwd_Loop` theo pha, rồi khoá chân trụ. Chọn cách nào cũng được; ghi lại cách làm.
- Khoá chân trụ như `walk`/`run`. Đo bằng `gait_check.py`: ghi tốc độ, độ dài vòng, độ trượt.
- Xuất lại cả 8 file, kèm `jog`. Chạy lại từ đầu phải ra file giống hệt từng byte.

### 2. Ba mô hình kỵ binh

**Chung:**
- Người và ngựa trong cùng một file, đúng hợp đồng:
  - một khung xương (khung người cộng khung ngựa);
  - `LOD0` tối đa 8 000 tam giác cho cả người lẫn ngựa;
  - một vật liệu (ghép atlas người và ngựa);
  - tối đa 4 MB, cố giữ khoảng 2,5 MB.
- Ngựa của lane 2: dựng bằng `art/blender/horse_build.py`, người cưỡi gắn vào xương `horse_saddle`. Mỗi loại kỵ binh chọn đúng kiểu yên cương lane 2 đã dựng.
- **Clip:**

  | Clip | Ngựa | Người cưỡi |
  |---|---|---|
  | `idle` | đứng | ngồi trên ngựa |
  | `walk` | đi | ngồi |
  | `jog` | nước kiệu hoặc nước kiệu nhanh | ngồi theo nhịp |
  | `run` | phi | ngồi theo nhịp |
  | `attack` | đứng hoặc nhích tại chỗ | đâm giáo hoặc phóng lao, tuỳ loại |
  | `die` | ngã | ngã theo ngựa, rồi nằm yên |

  Mọi clip đều không có chuyển động gốc.
- **Sải móng khi phi:** clip phi của ngựa hiện chỉ đi 1,09 m mỗi vòng 0,4 s (khoảng 3 m/s ở cỡ ngựa thật), mà kỵ binh trong trận đi nhanh hơn nhiều, nên móng trượt. Nếu làm được không tốn nhiều công, cho `run` có sải dài hơn (phi thật khoảng 4–6 m mỗi vòng). Không được thì ghi lại.
- Làm các đề nghị của lane 2 ở T-020 nếu cần cho việc này: hàm dùng chung của `whp_unit_lod`, chỉ xuất các action có trong danh sách clip, ghép atlas.

**Từng loại** (chỉ tham khảo văn bản cổ, hiện vật bảo tàng, tranh thuộc phạm vi công cộng; ghi nguồn cho từng mô hình):
- **`roman-cavalry`** (Polybius 6.25): kỵ binh La Mã và đồng minh năm 216 TCN.
  - Polybius tả đồ cũ (không giáp, khiên da bò, giáo yếu) và việc chuyển sang đồ kiểu Hy Lạp. Tự chọn theo nguồn, ghi lý do.
  - Giáo, kiếm; khiên tròn hay khiên kỵ binh. Màu hợp với lính La Mã khác.
- **`iberian-gallic-cavalry`**: một mô hình dùng chung cho kỵ binh Iberia và Gaul. Chọn bộ đồ chung nhất mà có căn cứ (Polybius 3.114–115, Livy 22.46–47), ghi lý do.
- **`numidian-cavalry`** (Livy 21.46, 35.11; Strabo 17.3.7):
  - ngựa nhỏ, cưỡi không yên, không cương, chỉ có dây quàng cổ (lane 2 đã dựng kiểu này);
  - vài cây lao nhẹ, khiên tròn nhỏ bằng da, áo ngắn, không giáp;
  - `attack` là phóng lao.

### 3. Ảnh duyệt

Như T-021, trong `art/renders/<model>/`:
- nhìn trước, nghiêng, sau, chéch;
- ba mức LOD;
- ba khung hình mỗi clip;
- đứng cạnh `roman-legionary` để so tỉ lệ.

Thêm ảnh chung `art/renders/cavalry-lineup.jpg`: ba mô hình kỵ binh nhìn nghiêng. Với `jog` của bộ binh, thêm một ảnh trước/sau cho một mô hình.

### 4. Ghi công

- `art/CREDITS.md`: mục cho từng mô hình kỵ binh. Ngựa ghi đúng như lane 2: lưới "Horse" của Tarnyloo (Blend Swap, CC BY 3.0, bắt buộc nêu tên tác giả), khung xương và dáng đi của fdoss001 (CC0).
- Dòng ghi công gợi ý mới, gồm cả ngựa, bằng tiếng Việt và tiếng Anh. Phiên chính sẽ đưa vào khung xem trận và README khi gộp.

## Ràng buộc

- Như T-021 và T-024:
  - không đưa file gốc hay `art/build/` vào repo;
  - không dùng tài sản chưa đọc giấy phép, tài sản NC hay ND, hay tài sản trích từ game;
  - không sửa `src/`;
  - không thêm thư viện npm.
- Đổi tên hay chữ ký hàm trong `whp_*.py` thì ghi vào "Kết quả".
- Trước mỗi lần chạy Blender, kiểm tra bằng `tasklist | findstr blender`; nếu đang có Blender khác chạy thì chờ.
- Dev server dùng cổng 3101.

## Xong khi

- 11 file `.glb` có trong `index.json`: 8 bộ binh có `jog`, 3 kỵ binh mới.
- `/battle-lab?stats=1` với Cannae:
  - khung số đo ghi `file` cho cả 11 mô hình, console sạch;
  - xem gần kỵ binh lúc đi, chạy chậm, phi, đánh, ngã;
  - xem gần một khối bộ binh lúc chạy chậm.
- Chạy lại script từ đầu ra file giống hệt từng byte.
- Có đủ ảnh duyệt và ghi công.
- `npm run validate`, `npm run lint`, `npm run build` qua.
- Ghi tổng dung lượng `public/battles/models/`.

## Kết quả

Xong cả 4 phần. Nhánh `lane1/T-022-cavalry`, mỗi phần một commit:

- `baabd91`: phần 1, clip `jog` cho 8 mô hình bộ binh;
- `864a33c`: phần 2, ba mô hình kỵ binh;
- `7210c47`: phần 3, ảnh duyệt;
- commit cuối: kết quả và tài liệu.

### Đối chiếu "Xong khi"

- **11 file `.glb` có trong `index.json`:** 8 bộ binh có `jog`; 3 kỵ binh mới (`roman-cavalry`, `iberian-gallic-cavalry`, `numidian-cavalry`).
- **`/battle-lab?stats=1` với Cannae** (dev server cổng 3101, Chrome không giao diện qua DevTools, card RTX 3050):
  - khung số đo ghi `file` cho cả 11 mô hình; console không có lỗi hay cảnh báo nào;
  - xem gần kỵ binh lúc đi, chạy chậm, phi, đánh, ngã: mục "Kiểm tra trong cảnh" bên dưới;
  - xem gần một khối bộ binh lúc chạy chậm: hastati ở giai đoạn 3 (9,7 m/s trên sân) giờ tự chọn `jog`.
- **Chạy lại từ đầu ra file giống hệt từng byte:** sau ba commit trên, tôi dựng lại từ đầu: `horse_build.py` rồi `build_model.py -- --model all` (11 mô hình, khoảng 45 phút). `git status` không thấy file `.glb` nào đổi so với các file đã commit (vốn dựng ở những lần chạy riêng trước đó); bước kiểm tra của script qua cho cả 11. SHA-256 (12 ký tự đầu):

  | File | Dung lượng (byte) | SHA-256 |
  |---|---|---|
  | `balearic-slinger.glb` | 1 764 912 | `939e7af2c35a` |
  | `gallic-infantry.glb` | 1 888 604 | `a82d01bb0cf8` |
  | `iberian-gallic-cavalry.glb` | 2 155 184 | `a5af049baa32` |
  | `iberian-infantry.glb` | 1 785 432 | `c9a116a2dd55` |
  | `libyan-infantry.glb` | 2 268 668 | `6a0fca8f35cc` |
  | `numidian-cavalry.glb` | 2 109 576 | `e806425271ea` |
  | `roman-cavalry.glb` | 2 455 440 | `74525c53d448` |
  | `roman-hastatus.glb` | 1 949 972 | `1501c012334f` |
  | `roman-legionary.glb` | 2 264 384 | `fa682181b015` |
  | `roman-triarii.glb` | 2 272 912 | `ff8be5cb5642` |
  | `roman-velites.glb` | 1 856 316 | `84702ccb43ce` |
- **Ảnh duyệt và ghi công:** đủ (phần 3, phần 4).
- **`npm run validate`, `npm run lint`, `npm run build`:** đều qua.
- **Tổng dung lượng `public/battles/models/`:** 22 771 629 byte (21,7 MiB): 11 file `.glb` (22 771 400 byte) và `index.json`. Trước T-022: 15 665 464 byte cho 8 file.

### 1. `jog` cho 8 mô hình bộ binh

**Cách dựng** (`whp_clips.JOG`, `Builder.jog`; đúng đề xuất ở T-024: trộn `Walk_Loop` và `Jog_Fwd_Loop` theo pha rồi khoá chân trụ, thêm một bước kéo giãn thời gian):
- Hai clip canh cho chân trái chạm đất cùng lúc.
- Trộn thẳng thì không được: một bàn chân chỉ "chạm đất" khi nó thấp ở cả hai clip, nên thời gian chạm đất là của clip chạy (29% một bước), vẫn ra dáng chạy nước rút có pha bay dài. Vì vậy trước khi trộn, clip chạy được kéo giãn thời gian trong từng bước: 4 khung chạm đất của nó chiếm 65% bước của `jog`, pha bay bị nén; đường cong thời gian là đường bậc ba đơn điệu, không gãy.
- Rồi lấy 65% clip chạy cho chân và hông, 45% cho thân, 50% cho tay, đặt lên clip đi. Hông giữ 60% độ nhún của bản trộn (IK của chân bù phần còn lại).
- Một vòng 22 khung (0,733 s, 164 bước mỗi phút). Khiên giữ thế `march` như khi đi, vũ khí giữ như khi đi.
- Khoá chân trụ như `walk`/`run`.
- Tôi thử 4 biến thể (độ trộn chân 0,5–0,85, phần chạm đất 0,6–0,7, vòng 20–22 khung) trên lính La Mã, render dải khung nhìn nghiêng rồi chọn.

**Số đo** (`gait_check.py` trên LOD0 của file `.glb`, đã thêm `jog`):

| Mô hình | Một vòng `jog` | Tốc độ ở cỡ thật | Trượt lớn nhất của chân trụ |
|---|---|---|---|
| 7 mô hình trên thân lính La Mã | 2,096–2,097 m / 0,733 s | 2,86 m/s | 0% |
| `gallic-infantry` | 2,065 m / 0,733 s | 2,82 m/s | 0% |

Trong log của giai đoạn `anim`: trước khi khoá, chân trụ trượt tới 24–25%; sau khi khoá 0%; mắt cá dời tối đa 1,9–2,1 cm.

**Năm clip cũ không đổi:** tôi so dữ liệu hoạt hình của từng clip trong file mới với file đã commit trước đó: `idle`, `walk`, `run`, `attack`, `die` giống hệt từng byte; `jog` được dựng sau cùng. Mỗi file nặng thêm khoảng 48 KB.

**Ảnh trước/sau:** `art/renders/roman-legionary/17-jog-before-after.jpg`. Hàng trên là `run`, clip cảnh phát chậm lại khi khối quân đi vừa phải trước T-022; hàng dưới là `jog`; sáu khung mỗi clip, nhìn nghiêng.

### 2. Ba mô hình kỵ binh

Cách dựng chi tiết ở `art/README.md`, mục "Kỵ binh". Tóm tắt:
- người cưỡi dựng như lính bộ binh, rồi `whp_cavalry.mount` nạp ngựa từ `art/build/horse/horse.blend`;
- tư thế gốc của người được nhấc lên lưng ngựa; hai khung xương nối thành một (107 xương); `pelvis`, `ik_foot_root`, `ik_hand_root` treo vào `horse_saddle`;
- mọi clip được key trên cả 107 xương: ngựa theo clip của nó, người dựng trong khung của xương yên;
- người và ngựa chung một atlas, bake một lượt, một vật liệu.

**Hợp đồng:**

| Mô hình | LOD0 (người + ngựa) | LOD1 | LOD2 | Dung lượng |
|---|---|---|---|---|
| `roman-cavalry` | 7 592 (4 248 + 3 344) | 1 365 | 288 | 2 455 440 byte |
| `iberian-gallic-cavalry` | 7 217 (3 873 + 3 344) | 1 311 | 289 | 2 155 184 byte |
| `numidian-cavalry` | 7 225 (4 189 + 3 036) | 1 362 | 276 | 2 109 576 byte |

- Một khung xương 107 xương; một vật liệu; ảnh màu 2048, pháp tuyến và độ nhám/kim loại 1024; sáu clip; không có chuyển động gốc.
- Dưới 4 MB, gần mức 2,5 MB mong muốn.
- Bước kiểm tra của script qua cho cả ba: đọc lại file, nhập lại vào Blender; ở `idle` và `walk` khung 0 móng chạm đất; khung cuối `die` không vật nào xuyên xuống đất (thấp nhất −0,02..0,00 m, cao nhất 0,66–0,71 m).
- Atlas: phủ 62–65% ô UV; 75–77% điểm ảnh ảnh màu có dùng. Mật độ điểm ảnh của ngựa bằng 0,62 lần của người.

**Yên cương** (đúng kiểu lane 2 đã dựng):
- La Mã, Iberia/Gaul: vải lót yên, đai bụng, dây cương. Tay trái người cầm dây cương: mỗi khung, nắm tay được giải IK tới đầu dây cương, nên dây luôn nằm trong tay;
- Numidia: ngựa trần, chỉ dây quàng cổ; ngựa thu còn 0,95 lần (1,33 m tới vai), đúng gợi ý của lane 2.

**Clip:**

| Clip | Ngựa | Người cưỡi |
|---|---|---|
| `idle` | đứng (`idle` của ngựa) | ngồi, thở, quay đầu nhìn quanh |
| `walk` | đi | ngồi, ngả 2° |
| `jog` | nước kiệu (`trot` của lane 2) | ngồi nước kiệu (không nhổm: chưa có bàn đạp), thân đỡ nhịp |
| `run` | phi | ngả 13°, giáo chĩa ra trước |
| `attack` | đứng bốn chân, thở và gật đầu theo nhịp đánh | đâm giáo qua vai, qua bên phải đầu ngựa (La Mã, Iberia/Gaul, 1,0 s); phóng lao (Numidia, 1,333 s) |
| `die` | ngã, lăn sang sườn phải | ngã theo ngựa; từ khung 12 văng khỏi lưng ngựa về phía ngựa lăn, ngã ngửa (`Death01` của thư viện, trộn từ tư thế ngồi); nằm yên từ khung 46 cạnh lưng ngựa, cách thân ngựa 6 cm |

**Sải móng** (đo như cảnh, `gait_check.py`): `walk` 1,08 m / 1,667 s, `jog` 1,82 m / 0,833 s, `run` 1,09 m / 0,400 s; ngựa Numidia ngắn hơn 5%. **Sải phi chưa dài hơn:** xem "Còn chưa ưng ý", mục 1.

**Từng loại, lý do chọn đồ** (đầy đủ trong docstring của `unit_*.py` và `art/CREDITS.md`):

- **`roman-cavalry`**: Polybius 6.25 tả đồ cũ (không giáp, giáo yếu, khiên da bò như bánh tế) rồi việc "chuyển nhanh sang kiểu Hy Lạp" (giáo cứng có đế nhọn, khiên chắc), không nói năm nào. Tôi chọn đồ mới vì:
  - kỵ binh là những công dân giàu nhất, mà năm 216 người giàu nhất trong bộ binh đã mặc giáp lưới (Polybius 6.23.15);
  - kỵ binh La Mã trên tượng đài Aemilius Paullus ở Delphi (168 TCN) mặc giáp lưới có lớp che vai, mang khiên tròn.

  Vậy: mũ Montefortino có ngù, giáp lưới của principes trên áo đỏ, khiên tròn 0,66 m đeo ở cẳng tay trái (tay trái cầm cương), giáo 2,5 m có đế nhọn, kiếm trong bao ở hông phải. Màu như lính La Mã khác; vải lót yên đỏ của lane 2.
- **`iberian-gallic-cavalry`**: Polybius 3.114 và Livy 22.46 nói khiên của người Iberia và người Gaul giống nhau, kiếm khác nhau; người Iberia mặc áo lanh trắng ngắn viền tía, người Gaul cởi trần (hai đoạn này tả bộ binh). Polybius 3.115 và Livy 22.47 tả trận kỵ binh đánh giáp mặt, nhiều người xuống ngựa đánh bộ, không tả trang phục. Cánh trái của Hasdrubal phần lớn là người Iberia. Bộ đồ chung:
  - áo lanh trắng viền tía của người Iberia (không trái với áo của quý tộc Gaul);
  - khiên bầu dục cả hai dân tộc cùng dùng, nhỏ lại cho người cưỡi (0,92 × 0,50 m), đeo ở cẳng tay;
  - giáo 2,3 m, kiếm trong bao;
  - mũ bằng gân như bộ binh Iberia (Strabo 3.3.6);
  - da ô liu.

  Vải lót yên nhuộm lại xanh đen viền vàng đất để khác màu đỏ của La Mã. Diodorus 5.33 nói người Celtiberia mặc áo choàng len đen thô; ngoài ra màu này là lựa chọn.
- **`numidian-cavalry`**:
  - Livy 35.11.7–8: người và ngựa nhỏ, gầy; người cưỡi không thắt lưng, không vũ khí ngoài lao; ngựa không cương;
  - Livy 21.46.5: ở trận Ticinus, Hannibal để kỵ binh có cương ở giữa, người Numidia ở hai cánh;
  - Strabo 17.3.7 (về người Maurusii, phía tây Numidia): ngựa nhỏ, nhanh, nghe lời đến mức điều khiển bằng một que nhỏ, có vòng cổ bằng gỗ hay lông; người cưỡi không yên, phần lớn dùng lao (giáo nhỏ mũi rộng), mang khiên nhỏ bằng da sống, mặc áo không thắt lưng viền rộng. Tôi đọc lại đoạn này trên bản dịch Loeb ở LacusCurtius.

  Vậy: áo len mộc không thắt lưng, viền rộng nâu đỏ sẫm; không giáp, không mũ; tóc và râu sẫm; khiên tròn da sống 0,52 m và hai cây lao dự phòng trong tay trái; một cây lao mũi rộng 1,5 m trong tay phải; `attack` là phóng lao.

**Đề nghị của lane 2 ở T-020 đã làm:**
1. `whp_unit_lod`: `finish_lod` công khai (giữ tên cũ `_finish_lod`), thêm `bake_atlas` (giao diện tối thiểu của một phần: `name`, `bake`, `extrusion`, `ray`, `ao_alone`, ghi trong docstring) và `figure_levels`.
2. `whp_export.export_glb` chỉ xuất các action có trong danh sách clip: các action khác bị xoá khỏi file trước khi xuất (`drop_other_actions`). Bản xuất thử của ngựa giờ có 4 action thay vì 6.
3. Tên thuộc tính màu `color`: không đụng tới (người cưỡi không thêm thuộc tính màu mới).
4. Ghép atlas: xếp UV của người và ngựa vào một atlas rồi bake lại một lượt (cách thứ hai lane 2 đề nghị), AO bake riêng cho người và cho ngựa.

**Sửa ở file ngựa của lane 2:** chỉ `horse_lod.py`, không đổi kết quả của con ngựa:
- `low_parts(keys, uv)`;
- `Spec` (trước là `_Spec`), `specs`, `Unskinned`, `levels`;
- `bake` dùng `whp_unit_lod.bake_atlas`.

`horse_build.py` dựng lại từ đầu vẫn qua bước xuất thử và kiểm tra.

### 3. Ảnh duyệt

Render từ file `.glb`, mỗi ảnh dưới 400 KB (tổng 3,4 MB). Danh sách ở `art/README.md`, mục "Kỵ binh", phần "Ảnh duyệt".
- `art/renders/<model>/` cho ba mô hình: trước, nghiêng, sau; chéch; ba mức LOD; ba khung mỗi clip (6 clip); cạnh `roman-legionary` (nhìn trước và nhìn nghiêng).
- `art/renders/cavalry-lineup.jpg`: ba kỵ binh nhìn nghiêng.
- `art/renders/roman-legionary/17-jog-before-after.jpg`: `run` và `jog` của bộ binh.
- `render_review.py` có thêm `--lineup --cavalry` và `--jog`. Ảnh `animations` của bộ binh vẫn chỉ năm clip cũ, để số thứ tự các ảnh đã có không đổi.

### 4. Ghi công

`art/CREDITS.md`, mục "Ba mô hình kỵ binh của T-022": mục chung và mục cho từng mô hình. Ngựa ghi đúng như lane 2: lưới "Horse" của Tarnyloo (Blend Swap, CC BY 3.0, bắt buộc nêu tên tác giả); khung xương và dáng đi của fdoss001 (CC0).

**Dòng ghi công gợi ý mới** (thay dòng chung của các mô hình lính; phiên chính đưa vào khung xem trận, hộp thoại Giới thiệu và README):
- Tiếng Việt: *Các mô hình lính dựa trên "Roman Soldier - T pose" và "Celt - rigged for UE4/5", cùng của Andywoodhead (Sketchfab, CC BY 4.0). Ngựa dựa trên "Horse" của Tarnyloo (Blend Swap, CC BY 3.0), khung xương và dáng đi từ "Horse Rigged All Gaits" của fdoss001 (Blend Swap, CC0). Đã sửa đổi. Hoạt hình từ Universal Animation Library của Quaternius (CC0).*
- English: *Soldier models based on "Roman Soldier - T pose" and "Celt - rigged for UE4/5", both by Andywoodhead (Sketchfab, CC BY 4.0). Horses based on "Horse" by Tarnyloo (Blend Swap, CC BY 3.0), with the rig and gaits of "Horse Rigged All Gaits" by fdoss001 (Blend Swap, CC0). Modified. Animations from the Universal Animation Library by Quaternius (CC0).*
- Link thêm cho `MODEL_CREDIT_LINKS`: https://blendswap.com/blend/17172, https://blendswap.com/blend/28627, https://creativecommons.org/licenses/by/3.0/

### Kiểm tra trong cảnh

`/battle-lab?battle=battle-of-cannae&stats=1`, kịch bản điều khiển Chrome qua DevTools (chép từ kịch bản của lane 3 ở `E:\World_History_Platform_assets\T-023\tools\`, ngoài repo).

- **Mô hình** (số cảnh đo khi nạp):

  | Mô hình | Chiều cao (khung bao) | walk | jog | run |
  |---|---|---|---|---|
  | 7 mô hình bộ binh trên thân La Mã | 1,65–2,09 m | 1,30 m / 1,333 s | 2,10 m / 0,733 s | 5,45 m / 0,933 s |
  | `gallic-infantry` | 1,67 m | 1,30 m | 2,06 m | 5,47 m |
  | `roman-cavalry` | 2,67 m | 1,08 m / 1,667 s | 1,82 m / 0,833 s | 1,09 m / 0,400 s |
  | `iberian-gallic-cavalry` | 2,24 m | 1,08 m | 1,82 m | 1,09 m |
  | `numidian-cavalry` | 2,33 m | 1,03 m | 1,73 m | 1,04 m |

  `hasJog` đúng cho cả 11 mô hình.
- **Dáng đi của kỵ binh khi phát cả trận:**
  - giai đoạn 1 và 4–5: mọi khối kỵ binh phi (9–72 m/s trên sân);
  - giai đoạn 2: đứng;
  - giai đoạn 3: kỵ binh đồng minh, cánh sau của Hasdrubal và người Numidia đánh (`attack`); kỵ binh La Mã tháo chạy, 88/120 hình ngã;
  - đi và chạy chậm chỉ thoáng qua lúc dừng ở cuối giai đoạn 1, và ở giai đoạn 4 khi kỵ binh La Mã đi khoảng 8,5 m/s.
- **Xem gần** (ảnh để thử, không lưu trong repo):
  - kỵ binh đi và chạy nước kiệu: tôi cho đồng hồ trận chạy chậm lại (0,3 và 0,7 lần) ở giai đoạn 4; khối kỵ binh La Mã chọn `walk` (1,8 m/s), `jog` (8,4 m/s): ngựa đi và kiệu đúng nhịp, tay trái trên dây cương, khiên ở cẳng tay;
  - phi: cánh trước của Hasdrubal ở giai đoạn 3 (34 m/s, tốc độ phát thường): người ngả tới, giáo chĩa tới; móng hơi trượt vì nhanh hơn trần 1,5 lần nhịp (như T-026 đã ghi);
  - đánh: kỵ binh đồng minh đâm giáo qua vai; người Numidia phóng lao;
  - ngã: ngựa quỵ gối mang người theo; hình đã ngã nằm lại;
  - bộ binh chạy chậm: hastati ở giai đoạn 3 chọn `jog` ở 9,7 m/s: bước chạy đều, không còn dáng chạy nước rút quay chậm.

### Thay đổi ở các module `whp_*.py`

Không đổi tên hay bỏ hàm công khai nào; chỉ thêm. Tham số mới đều có mặc định giữ hành vi cũ.
- **`whp_ual`:** `Pack.blend(a, b, weight)`.
- **`whp_retarget`:** thuộc tính `Retargeter.hips_shift` (mặc định `None`).
- **`whp_clips`:**
  - thêm `JOG`, `JOG_LEGS`, `JOG_TRUNK`, `retime`, `Builder.dress`, `Builder.gait`, `Builder.jog_sample`, `Builder.jog`;
  - `GAITS` và `LOOPS` có thêm `jog`; `Builder.build` dựng `jog` sau cùng.
- **`whp_build`:** `CLIPS` có thêm `jog`; unit có `HORSE` thì giai đoạn `anim` và `lod` là của `whp_cavalry`; bước kiểm tra lấy số xương từ `unit.BONES` nếu có.
- **`whp_export`:** thêm `drop_other_actions`; `export_glb` xoá các action không phải clip trước khi xuất.
- **`whp_unit_lod`:**
  - `build_low_parts(specs, ground=0.0)`, `bake_ao(..., sets=None)`, `build_lod2_proxy(..., ground=0.0)` (và `LOD2["feet"]`);
  - thêm `finish_lod` (tên cũ `_finish_lod` vẫn giữ), `bake_atlas`, `figure_levels`;
  - `build` dùng các hàm đó, kết quả như cũ.
- **Mới:** `whp_cavalry.py`, ba file `unit_*_cavalry.py`.
- **`render_review.py`:** bố cục cho kỵ binh, `--lineup --cavalry`, `--jog`; `SHOTS` thành hàm `shots(unit, name)`.
- **`art/tools/gait_check.py`:** đo cả `jog` nếu file có.

### Còn chưa ưng ý

1. **Sải phi.** `run` vẫn là clip phi của lane 2: 1,09 m mỗi vòng 0,4 s (2,73 m/s ở cỡ thật). Kỵ binh Cannae đi 9–72 m/s trên sân, phần lớn nhanh hơn trần 12,3 m/s, nên móng trượt khi phi.
   - Clip gốc có móng chạm đất 8 trên 12 khung và lùi chậm khi chạm đất; vài khung trượt tới 269% ngay ở tốc độ gốc.
   - Kéo giãn thời gian chỉ lợi khoảng 1,3 lần và làm mỗi móng chỉ còn chạm đất 1–2 khung (cảnh khó đo).
   - Muốn sải 4–6 m phải dựng lại chuyển động chân lúc chạm đất (IK cho chân ngựa nhiều đoạn, như khoá chân trụ của người) hoặc lấy một clip phi khác.
2. **`jog` và `run` của ngựa gần nhau** (2,19 và 2,73 m/s ở cỡ thật), nên cảnh chỉ chọn nước kiệu trong một khoảng tốc độ hẹp (khoảng 6,6–7,3 m/s trên sân). Sẽ tự hết nếu phi có sải dài hơn.
3. **Dáng đi gốc của ngựa trượt móng** ở vài khung lúc chạm và rời đất (`walk` tới 101%, `trot` 88%). Có từ file gốc.
4. **Vạt áo người cưỡi** xoè ra hai bên khi nhìn thẳng từ trước (đùi choãi kéo vạt áo theo); vạt sau và gấu giáp lưới khuất trong lưng ngựa.
5. **Chân người cưỡi** cố định trong khung yên, không đung đưa theo nhịp ngựa.
6. **Cú ngã:** người đi từ yên xuống đất theo phép trộn tư thế, không có đường bay thật. Chỉ khung cuối được kiểm không chạm thân ngựa; các khung giữa chỉ xem bằng mắt (khung 20, 25, 30).
7. **Chiều cao:** mũi giáo dựng lên tới 3,04 m (La Mã) và 2,95 m (Iberia/Gaul); hợp đồng ghi dưới 2,25 m (triarii 2,44 m). Khung bao ở tư thế gốc cao 2,24–2,67 m.
8. **Tóc người Numidia** trông như mũ da, như tóc lính Baleares (đã ghi ở T-024).
9. **Người Gaul** trong `iberian-gallic-cavalry` trông như người Iberia (bộ đồ chung theo người Iberia).
10. Ở tư thế gốc (không phát clip nào), người đứng chữ A, chân xuyên qua lưng ngựa. Cảnh luôn phát ít nhất `idle`.

### Đề nghị ngoài phạm vi

1. **Phiên chính, `docs/ARCHITECTURE.md`, mục "Mô hình lính":**
   - số đo `jog` với thư viện chung: một vòng 2,07–2,10 m trong 0,733 s (2,8–2,9 m/s);
   - kỵ binh: tư thế gốc của người nhấc lên lưng ngựa; xương `ik_hand_l` mang khiên của kỵ binh La Mã và Iberia/Gaul; mũi giáo tới 3,04 m;
   - sải móng đo được: `walk` 1,08 m / 1,667 s, `jog` 1,82 m / 0,833 s, `run` 1,09 m / 0,4 s.
2. **Lane 3 hoặc phiên chính:** `FALLBACK_STRIDES.jog` trong `src/components/battle/engine/figures/model.ts` đang là 2,4 m (đoán); số đo là 2,1 m. Cảnh tự đo nên không ảnh hưởng, chỉ để khớp.
3. **Ghi công:** đưa dòng gợi ý ở phần 4 vào `src/components/battle/viewer/credits.ts`, khoá `battle.credits.models` và README ("Data credits").
4. **Sải phi:**
   - một task riêng (lane 2 hoặc lane 1) dựng lại clip phi có sải 4–6 m bằng IK khoá móng trụ;
   - hoặc phiên chính và lane 3 nâng trần nhịp phi riêng cho kỵ binh;
   - hoặc chấp nhận móng trượt.
5. Không thêm thư viện npm, không sửa `src/`.

### Ghi chú quy trình

- Trước mỗi lần chạy Blender tôi kiểm tra `tasklist`; không lần nào chạy song song với Blender khác.
- Dev server chạy ở cổng 3101 (cổng 3102, 3103 của lane khác đang chạy, tôi không đụng tới).
