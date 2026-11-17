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

_(Lane 1 điền khi xong.)_
