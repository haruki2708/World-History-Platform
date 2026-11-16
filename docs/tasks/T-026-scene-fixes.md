# T-026: Sửa cảnh 3D trước khi có kỵ binh

- **Lane:** 3
- **Model đề xuất:** Fable 5.2, effort `high`. Hết hạn mức thì dùng Opus 5.5, effort `xhigh`.
- **Nhánh:** `lane3/T-026-scene-fixes` (tạo từ `main` mới nhất)
- **Phạm vi file:** `src/components/battle/`, khoá `battle.*` trong `src/lib/i18n/messages.ts` (cả `en` lẫn `vi`).

## Bối cảnh

Đã gộp:
- T-021: đủ 8 mô hình bộ binh;
- T-020: ngựa, và dữ liệu Cannae chỉnh trong cảnh thật;
- T-023: khung xem trận. Phiên chính làm nốt sau khi bạn hết hạn mức; đọc mục "Kết quả" của file này để biết phần đã làm thêm.

Còn T-022 (lane 1, ba loại kỵ binh: người cưỡi trên ngựa của lane 2). Task này sửa những gì review và các lane khác thấy trong cảnh, và chuẩn bị cho kỵ binh.

Trong lúc bạn làm:
- lane 1 làm T-024 (sửa mô hình bộ binh, trong `art/`);
- lane 2 làm T-025 (bản đồ bay tới chiến trường trước khi mở trận, trong `src/components/map/`).

## Đọc trước

- `docs/ARCHITECTURE.md`, mục "Mô hình lính". Mới có:
  - độ dài `attack` theo kiểu đánh;
  - xương `ik_hand_gun`;
  - chiều cao giáo triarii;
  - ngựa.
- `docs/tasks/T-020-horse.md`, mục "Kết quả", phần "Đề nghị cho lane 3".
- `docs/tasks/T-021-infantry-models.md`, mục "Đề nghị ngoài phạm vi", ý 1–3.
- `docs/data/battles/cannae.md`, mục 9: vì sao triarii vẫn nhìn về nam ở giai đoạn 6.
- `art/README.md`, mục "Ngựa" và "Gắn người cưỡi".

## Yêu cầu

Commit sau mỗi việc. Nếu sắp hết hạn mức thì ghi bảng tiến độ vào mục "Kết quả" rồi commit.

### 1. Quay đầu tại chỗ (lane 2 đề nghị)

**Hiện tại:** khi `facing` của một khối đổi gần 180° mà tâm khối gần như đứng yên, cảnh xoay cả khối quanh tâm. Khối triarii rộng 820 m vì vậy quét ngang qua cả đạo quân.

**Cần làm:** trong trường hợp này, từng hình lính quay đầu tại chỗ, không xoay cả khối. Hàng đầu và hàng cuối đổi vai cho nhau là chấp nhận được.
- Tự đặt ngưỡng cho "gần 180°" và "gần như đứng yên", ghi lại trong code.
- Xong thì ghi vào "Kết quả" để lane 2 biết có thể cho triarii quay về bắc ở giai đoạn 6.

### 2. Chuẩn bị cho kỵ binh

- **Sải chân của ngựa:** `plantedStride` phải đo được bước chân bốn chân (móng), hoặc có cách khác hợp lý cho ngựa. Ghi cách làm.
- **Tốc độ phát `run` của kỵ binh:**
  - một vòng `run` của ngựa (phi nước đại) dài 0,4 s và chỉ không trượt chân quanh 3 m/s;
  - lane 2 đề nghị giới hạn tốc độ phát khoảng 1,5 lần;
  - kiểm tra ngưỡng chuyển `walk`/`run` hiện có có hợp với ngựa không.
- **Thử với ngựa thật:**
  - dùng `art/build/horse/horse-test.glb` (ngựa trần, 4 clip). File này không có trong git; dựng bằng `art/blender/horse_build.py`, khoảng 1 phút; xem `art/README.md`, mục "Ngựa";
  - tạm chép vào `public/battles/models/` dưới tên một mô hình kỵ binh và tạm thêm vào `index.json`, như cách làm ở T-018;
  - xem ở cự ly gần lúc đi, lúc phi, lúc ngã;
  - thử xong thì trả `public/battles/models/` về như cũ.

### 3. Mức chi tiết của khối dàn rộng

Mức chi tiết đang chọn theo lô 256 hình. Khối dàn rộng (velites, lính ném đá) có lô mà tâm nằm ở xa, nên nhìn gần 22 m vẫn thấy hình LOD2 (khiên thành hình bát giác).

Sửa để hình ở gần luôn đủ chi tiết, ví dụ chia lô theo vị trí hay chọn mức chi tiết theo hình gần nhất của lô. Ghi số đo hiệu năng trước và sau.

### 4. Vùng màu dưới chân lính

Khi nhìn gần, vùng màu đánh dấu khối quân trên mặt đất phủ lên chân lính. Sửa, ví dụ:
- cho vùng màu mờ dần khi camera lại gần;
- hoặc vẽ vùng màu nằm dưới hình lính.

### 5. Nhãn địa danh trước hàng lính

Nhãn là HTML phủ lên cảnh. Khi nhìn thấp, nhãn của địa danh ở phía sau vẫn hiện đè lên hàng lính phía trước. Sửa, ví dụ:
- ẩn hay làm mờ nhãn khi điểm của nó bị địa hình hay khối quân che;
- hoặc mờ dần khi camera xuống thấp.

### 6. Tuỳ chọn: hạ camera khi mở trận

Lane 2 cho bản đồ bay tới chiến trường, hướng bắc lên, nhìn thẳng xuống. Nếu gọn, khi khung xem trận vừa mở:
- camera bắt đầu từ trên cao, nhìn thẳng xuống, hướng bắc lên;
- trong khoảng 1,5 giây hạ dần xuống góc nhìn mở hiện có;
- bỏ qua nếu người dùng bật giảm chuyển động, hoặc khi người dùng chạm vào cảnh.

### Kiểm tra chung

- `/battle-lab` và khung xem trận: console sạch.
- Đo lại hiệu năng bằng `s-perf.mjs` trên bản production, máy sạch (không có `blender.exe`), so với số trong mục "Kết quả" của T-023: 63–72 khung hình/giây khi đang phát.
- Đo lại bộ nhớ bằng `s-memory.mjs`.
- Công cụ thử của bạn ở `E:\World_History_Platform_assets\T-023\tools\` vẫn dùng được.

## Ràng buộc

- Không sửa store, `src/lib/`, `src/data/`, `src/app/`. Cần đổi thì ghi đề nghị vào "Kết quả".
- Không import component của lane khác. Không thêm thư viện npm.
- Không để lại thay đổi nào trong `public/battles/models/`.
- Lane 1 và lane 2 có thể đang chạy Blender. Trước khi đo hiệu năng thì kiểm tra `blender.exe` và ghi điều kiện đo.
- Dev server dùng cổng 3103. Tắt dev server cũ của bạn trước.

## Xong khi

- Việc 1–5 xong, hoặc ghi rõ lý do nếu không làm được.
- Ngựa thử chạy được trong cảnh: chân không trượt rõ ở tốc độ hợp lý.
- Hiệu năng vẫn từ 50 khung hình/giây trở lên khi đang phát, máy sạch.
- `npm run lint`, `npm run build`, `npm run validate` qua.

## Kết quả

Lane 3 hết hạn mức nên phiên chính làm task này, theo yêu cầu của người dùng. Có 5 commit "T-026 step …" trên nhánh `lane3/T-026-scene-fixes`.

**Tóm tắt:** xong cả 6 việc, kể cả việc 6 (tuỳ chọn).
- Khối quân quay đầu tại chỗ.
- Ngựa thật chạy được trong cảnh mà không phải sửa engine.
- Hình ở gần luôn được vẽ chi tiết.
- Vùng màu và mũi tên nằm dưới chân lính.
- Nhãn địa danh ẩn khi bị đồi hay khối quân che.
- Khung xem trận mở bằng cú hạ camera từ trên cao.

`npm run lint`, `npm run build`, `npm run validate` qua. Hiệu năng không kém `main`, đo xen kẽ trong cùng điều kiện máy.

### 1. Quay đầu tại chỗ (`engine/timeline.ts`)

- **Ngưỡng:** hướng đổi từ 135° trở lên giữa hai mốc thì coi là quay đầu (`ABOUT_FACE`). Áp dụng cả khi khối đứng yên lẫn khi khối di chuyển: một đạo quân quay lưng tháo chạy thì quay đầu rồi mới chạy, không xoay cả khối như cánh cửa.
- **Cách làm:**
  - suốt giai đoạn đó, cảnh vẽ khối trong khung của mốc đầu;
  - đội hình ở mốc cuối được biểu diễn lại theo chiều ngược (`reversed`: hướng cộng 180°, độ phình đổi dấu), nên ô (u, v) của mốc cuối thành ô (−u, 1 − v), ở đúng chỗ đó trên sân. Vì vậy vị trí của các hình lính nội suy liền mạch, không xoay;
  - mỗi người tự quay mặt trong 8% đầu giai đoạn, người này lệch người kia tới 8%;
  - quay xong thì hàng cuối cũ thành hàng đầu, dùng để chọn ai đánh khi giáp chiến.
- **Thử:** tạm cho triarii nhìn về bắc ở giai đoạn 6 (sửa tạm dữ liệu, không commit):
  - khối đứng nguyên chỗ: y trong khoảng −260…−222 m suốt giai đoạn; bề ngang co từ 820 m xuống 460 m đúng như dữ liệu;
  - hướng trung bình đổi từ 180° sang 360° trong khoảng 15% đầu giai đoạn.
- **Dữ liệu hiện tại** có hai chỗ quay gần 180° và giờ quay đầu tại chỗ:
  - kỵ binh La Mã tháo chạy ở giai đoạn 3 (đổi −160°);
  - đạo quân ở trại lớn rút về ở giai đoạn 6 (đổi −180°).

### 2. Chuẩn bị cho kỵ binh

Thử bằng `horse-test.glb` của lane 2: tạm chép vào `public/battles/models/` dưới tên `roman-cavalry`, thử xong đã trả về như cũ.

- **Sải chân của ngựa:** `plantedStride` lấy các đỉnh thấp nhất của tư thế gốc làm "đế chân", nên với ngựa đó là móng. Không phải sửa code.
  - Đo được: `walk` 1,08 m mỗi vòng 1,667 s; `run` (phi nước đại) 1,09 m mỗi vòng 0,400 s.
  - Lane 2 ghi 1,20 m và 1,21 m; lệch khoảng 10%.
- **Tốc độ tự nhiên trên sân** (`FIGURE_SCALE` 3):
  - `walk` 1,95 m/s, `run` 8,2 m/s;
  - chuyển sang `run` khi trên 4,4 m/s; ở ngưỡng đó nhịp phi bằng 0,54 lần nhịp gốc;
  - trần nhịp phi là 1,5 lần (`MAX_RUN_RATE`, đúng như lane 2 đề nghị), tức 12,3 m/s.
- **Trong Cannae:** kỵ binh La Mã đi 30 m/s lúc dàn trận và 16–18 m/s lúc tháo chạy, đều trên trần, nên móng hơi trượt.
- **Xem gần:** lúc phi thì chân, bờm, đuôi đúng nhịp; quay đầu tháo chạy đúng; ngựa ngã nằm lại.

### 3. Mức chi tiết của khối dàn rộng (`engine/units.ts`)

- **Nguyên nhân:** mức chi tiết của một lô chọn theo khoảng cách từ camera tới tâm lô trừ 0,7 lần bán kính. Lô của velites hay lính ném đá trải dài hàng trăm mét, nên tâm ở xa dù có người đứng ngay trước camera.
- **Sửa:** mỗi khung hình, mỗi lô đo khoảng cách tới hình lính gần nhất của nó (`Chunk.measureDistance`; khoảng 6 800 phép tính, không đáng kể). Velites ở 22 m giờ vẽ bằng LOD0 với vật liệu chi tiết; trước đó là LOD2, khiên thành hình bát giác.

### 4. Vùng màu và mũi tên dưới chân lính

- **Chỗ phủ lên chân rõ nhất là mũi tên hướng di chuyển.** Mũi tên là vật trong suốt, vẽ sau lính, đậm tới 0,85 và dịch độ sâu mạnh, nên khi nhìn thấp nó tô màu cả cẳng chân.
- **Sửa:**
  - vùng màu và mũi tên vẫn hoà màu như vật trong suốt, nhưng được xếp vào nhóm vật đặc, vẽ ngay sau mặt đất và trước lính (`FOOTPRINT_ORDER`, `ARROW_ORDER`, `FIGURE_ORDER` trong `units.ts`). Hai lớp này không ghi độ sâu, nên lính vẽ sau luôn che lên chúng;
  - mũi tên mờ dần về 30% trong vài chục mét quanh camera;
  - độ đậm của vùng màu tính theo hình lính gần nhất của khối, không theo tâm khối. Trước đây khối dàn rộng nhìn gần vẫn tô đậm.

### 5. Nhãn địa danh trước hàng lính (`engine/occlusion.ts`)

- `engine.project`, hàm đặt điểm neo của nhãn, giờ trả `false` cả khi điểm bị che:
  - **bởi địa hình:** lấy 40 mẫu độ cao dọc đường nhìn;
  - **bởi khối quân:** mỗi khối còn người đứng là một hộp cao tới vai hình lính, tính giao giữa đường nhìn và hộp bằng phương pháp slab (`Crowd.occluders`).
- Quân đứng trong vòng 15 m quanh chính địa danh thì không che tên của nó.
- Nhãn sông có nhiều điểm neo, nên tự chuyển sang điểm còn thấy.
- **Kết quả:** nhìn thấp giữa hàng velites, các nhãn "Roman crossing", "Aufidus" không còn nổi trên khiên. Góc nhìn mở vẫn giữ 2 nhãn như trước, không nhãn nào đè nhau, ở cả hai ngôn ngữ.

### 6. Hạ camera khi mở trận (tuỳ chọn)

- `BattleScene` có thêm prop `introFromAbove`. Prop này không nằm trong `BattleSceneProps` của hợp đồng; khung xem trận bật nó, còn `/battle-lab` thì không.
- **Cú hạ camera:**
  - bắt đầu xa gấp 1,7 lần góc nhìn mở, nhìn thẳng xuống (nghiêng 0,02 rad), hướng bắc lên;
  - trong 1,6 giây hạ dần về góc nhìn mở. Đo được: 3 651 m, 20° → 2 649 m, 49° → 2 544 m, 52°;
  - bỏ qua khi người dùng bật giảm chuyển động (đã thử bằng giả lập); kéo, xoay hay phóng thì dừng ngay.

### Kiểm tra

Bản production, Chrome không cửa sổ, RTX 3050.

- **Không tải three.js trước khi mở trận:** trước khi bấm nút có 18 request, không script nào chứa `WebGLRenderer`, không request dữ liệu trận. Chunk three.js chỉ tải sau khi bấm.
- **Luồng mở/đóng** (`s-open.mjs`), tiếng Anh và tiếng Việt: như ở T-023, mọi mục đều đúng; console sạch.
- **Bộ nhớ** (`s-memory.mjs`), mở đóng 10 lần:
  - heap 12,7 MB trước khi mở; 16,0 MB sau lần 1; 16,9 MB sau lần 5; 17,2 MB sau lần 10;
  - chỉ còn 1 context WebGL, 1 canvas, số node DOM không đổi.
- **Hiệu năng:**
  - Lần đo `s-perf.mjs`: hai cửa sổ đầu máy sạch (dừng ở góc nhìn mở 84, đang phát giai đoạn 1 53 khung hình/giây), các cửa sổ sau Blender của lane 1 hay lane 2 đã chạy. Lane 1 và lane 2 đang làm việc suốt buổi nên không có lúc máy sạch hẳn.
  - Vì vậy đo xen kẽ `main` (bản xem thử ở cổng 3000) và nhánh này, 3 lượt, cùng điều kiện (có Blender), khung bên mở. Trung bình:

    | | Góc nhìn mở, dừng | Đang phát giai đoạn 3 | Đang phát giai đoạn 4 |
    |---|---|---|---|
    | `main` | 80 | 44 | 49 |
    | T-026 | 85 | 54 | 53 |

  - Nhánh này không chậm hơn `main`. Mục tiêu 50 khung hình/giây khi máy sạch vẫn đạt: T-023 và T-021 đo được 63–72 khi máy sạch.

### Ghi chú cho lane 2

- Giờ có thể cho triarii quay về bắc ở giai đoạn 6 (`docs/data/battles/cannae.md`, mục 9). Khối sẽ quay đầu tại chỗ.
- Mọi lần đổi hướng từ 135° trở lên đều được vẽ là quay đầu. Nếu muốn một khối xoay cả đội hình (bẻ hướng như cánh cửa) quá 135°, hãy chia thành hai giai đoạn.

### Ghi chú cho lane 1 (T-022)

- Cảnh đo sải chân ngựa từ chính clip. Với clip phi hiện có (1,09 m mỗi 0,4 s), kỵ binh Cannae thường đi nhanh hơn trần 1,5 lần nhịp, nên móng trượt khi phi.
- Nếu muốn ít trượt hơn: dùng clip phi có sải dài hơn (phi nước đại thật khoảng 3–4 m mỗi bước nhảy ở cỡ ngựa thật). Hoặc báo phiên chính để cân nhắc nâng trần riêng cho kỵ binh.

### Đề nghị ngoài phạm vi

1. Phiên chính có thể ghi vào `docs/ARCHITECTURE.md`:
   - mục "Khung xem trận": cú hạ camera khi mở (`introFromAbove`), nối tiếp chuyến bay của bản đồ (T-025);
   - mục "Cảnh 3D": nhãn địa danh ẩn khi bị che; quy ước quay đầu từ 135°.
2. Không cần đổi store, `src/lib/`, `src/data/`.
