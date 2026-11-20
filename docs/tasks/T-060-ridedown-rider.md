# T-060: Clip `ridedown`, và sửa người cưỡi

- **Lane:** 1. **Phiên chính làm thay** (người dùng giao phiên chính làm luôn việc của lane 1 và lane 2 ở lượt này, 2026-11-21).
- **Nhánh:** `batch-l/T-060-rider`, từ `main` (sau khi T-058 gộp: bốn file kỵ binh đã có `walk` mới của ngựa).
- **Phạm vi file:** `art/` (script Blender của lane 1, `art/renders/`, `art/README.md`), `public/battles/models/` (bốn file `.glb` kỵ binh).
- **Kế hoạch chung:** `docs/PLAN.md`, mục "Đợt L": chặng A2 (clip `ridedown`) và việc B3 (phần người cưỡi). Hợp đồng: `docs/ARCHITECTURE.md`, mục "Kỵ binh xông qua" và phần hoạt hình của mục "Mô hình lính"; `RIDEDOWN_IMPACT`, `RIDEDOWN_SECONDS` trong `src/lib/battle.ts`.

## Bối cảnh

- Từ chặng A1, khi kỵ binh xông qua bộ binh, người cưỡi đánh người đi bộ trong tầm lúc phi ngang. Mô hình chưa có `ridedown` thì cảnh phát `attack` trên riêng người cưỡi: nhát đâm tới trước, không nhắm vào người bên cạnh ngựa.
- B3 (người dùng chọn 2026-11-20, "sửa ngựa và người cưỡi"): móng ngựa trượt khi đi bước (T-058, xong), và phần người cưỡi: chân người cưỡi cứng, cú ngã của kỵ binh không có đường bay, vạt áo xoè.

## Yêu cầu

### 1. Clip `ridedown` cho bốn mô hình kỵ binh

- Theo hợp đồng: người cưỡi vung vũ khí đánh xuống một người đi bộ ở bên cạnh ngựa, phía tay cầm vũ khí (bên phải). Phát một lần, dài tối đa 1,2 giây; đòn chạm ở giây 0,4. Bắt đầu và kết thúc ở thế ngồi như trong `run`.
- Kiểu đánh theo vũ khí của từng loại: giáo đâm xuống (La Mã, Iberia), kiếm dài chém xuống (Gaul), lao đâm xuống (Numidia).
- Thêm sau mọi clip cũ, để các clip cũ không đổi vì nó.
- Ảnh duyệt: dải khung của clip, nhìn từ bên phải và từ trước, có một người lính đứng ở chỗ người bị đánh.

### 2. Chân người cưỡi trong các dáng đi

- Không có bàn đạp (216 TCN): cẳng chân buông từ đầu gối. Khi ngựa đi, kiệu, phi, chân phải nhúc nhích theo lưng ngựa, không đứng yên như đóng đinh vào yên.

### 3. Cú ngã của kỵ binh

- Người cưỡi phải bị hất khỏi yên và bay theo một đường có trọng lực, rồi chạm đất; không trượt theo đường thẳng từ yên xuống đất rồi chậm dần như bây giờ.
- Không phần nào xuyên đất ở khung cuối (bước kiểm tra mặt đất của bản xuất).

### 4. Vạt áo

- Vạt áo của người cưỡi không xoè ngang như chiếc hộp. Xem xét lại cách phủ vạt áo theo đùi của T-047 (`drape_skirts`).

### 5. Kiểm tra

- `build_model.py` không báo lỗi; clip `idle`, `attack`, `block`, `hit` giống hệt từng byte so với `main` (`main-tools/glb-clips.mjs`). `walk`, `jog`, `run`, `die` đổi có chủ ý; `ridedown` mới.
- Mỗi file dưới 4 MB.
- Trong cảnh: `/battle-lab?duel=1&pair=8` (kỵ binh Gaul xông qua hastati) và Cannae giai đoạn 6: người cưỡi đâm hay chém xuống người bên cạnh ngựa; không lỗi trong console.
- `npm run validate`, `npm run lint`, `npm run build` qua.

## Kết quả

Phiên chính, 2026-11-21. Nhánh `batch-l/T-060-rider`. Code trong `art/blender/whp_cavalry.py` (lane 1), `whp_build.py` (`clips_of`), `render_review.py` (`--ridedown`).

### 1. `ridedown`

- Clip 36 khung (1,2 s), không lặp, đòn chạm ở khung 12 (0,4 s), thêm sau `hit`: tám clip cũ không đổi vì nó.
- Từ thế cầm vũ khí lúc phi, người cưỡi giơ vũ khí qua vai phải (khung 7), đánh xuống và ra phía phải (khung 12), đi tiếp qua (tới khung 20), rồi về thế cầm lúc phi (khung 36). Thân xoay sang phải 16°, nghiêng sang phải 18°, chồm tới 10°; đầu quay sang phải, cúi nhìn người bị đánh.
- Giáo (La Mã, Iberia) và lao (Numidia) đâm chếch xuống ra ngoài (`RIDE_THRUST`); kiếm dài (Gaul) chém chéo xuống (`RIDE_SLASH`). Mũi giáo, mũi lao, lưỡi kiếm tới chỗ một người đứng cách đường giữa ngựa khoảng 1,25 m, ngang đầu và vai.
- Ngựa trong clip giữ một khung của `run`: khung có yên gần độ cao giữa của cả clip (1,346 m; `run` từ 1,309 tới 1,428 m). Cảnh chỉ phát clip này trên người cưỡi, ngựa vẫn phi bên dưới, nên người cưỡi ngồi đúng độ cao trung bình lúc phi.
- Ảnh: `art/renders/<id>/ridedown.jpg` cho cả bốn mô hình (`render_review.py -- --model <id> --ridedown`): nhìn từ trước và chếch từ trên cao, một hastatus đứng ở chỗ người bị đánh.

### 2. Chân người cưỡi

- Trước: chân đặt cố định trong khung của yên ở mọi clip.
- Nay trong `walk`, `jog`, `run` (`RiderPoser.leg_swing`): cẳng chân lùi về sau khi lưng ngựa bị hất lên, đưa ra trước khi lưng hạ xuống (theo gia tốc lên xuống của yên). Khi đi bước, hai chân đung đưa ngược nhau theo lưng ngựa lắc ngang. Trễ hai khung so với yên; tối đa 12°.
- Đo yên của ngựa: đi bước nhún 1 cm, lắc ngang ±0,5°; kiệu nhún 5 cm; phi nhún 12 cm, chúi ±3,5°. Độ chúi quá nhỏ để làm nguồn (thử trước: chân chỉ đung đưa dưới 3°), nên dùng gia tốc và độ lắc.
- Biên độ: `walk` khoảng ±4°, `jog` −6° tới +4°, `run` −12° tới +7°.

### 3. Cú ngã

- Trước: từ khung 12 tới 40, người trượt theo đường thẳng từ yên xuống đất, chậm dần lúc gần đất.
- Nay (`THROWN` 18, `LANDS` 36): người ngồi trên yên tới khi ngựa khuỵu gối (khung 18), bị hất khỏi yên, bay 0,6 s: xương chậu đi đều theo chiều ngang tới chỗ nằm (1,5–1,6 m), rơi theo trọng lực, lúc rời yên còn bay lên khoảng 4–5 cm; người xoay đều từ thế ngồi sang thế nằm; chạm đất ở khung 36, nằm yên từ khung 46 như trước.
- Khiên đeo cẳng tay theo tay tới lúc người chạm đất rồi mới nằm phẳng xuống đất (trước: khiên rơi xuống trước người).
- Khung cuối như trước: điểm thấp nhất từ −1,4 cm (La Mã) tới −3,8 cm (Gaul) (bước kiểm tra cho phép −5 cm).

### 4. Vạt áo

- Soi lưới chi tiết lúc ngồi (`idle` khung 0), từ trước, bên phải, sau lưng và từ trên cao: phía trước và hai bên vạt áo đã được kéo vào đùi từ T-047. Phần sau thì giữ dáng lúc đứng: loe ra quanh chỗ ngồi như cái chụp đèn, rộng hơn hông. Rõ nhất ở áo trắng của kỵ binh Iberia.
- Nay phía sau người, vạt áo cũng được kéo vào phía giữa người theo chiều ngang, càng xuống thấp càng nhiều: ở gấu chỉ còn 55% độ chìa ngang (`SKIRT_NARROW`; thử 72% thì chưa đủ thấy). Sau đó vẫn đẩy ra khỏi chân như trước. Không mặt nào bị lật.
- Kỵ binh Gaul gần như không đổi: áo ngắn, lưng có áo choàng che.
- Ảnh atlas gần như không đổi: chỉ vài ô của bảng màu cho LOD2 (màu trung bình của từng phần, tính lại theo vạt áo mới) và vài điểm lẻ; các mảnh khác giữ nguyên (so điểm ảnh của `iberian-gallic-cavalry`: 0,2% số điểm ảnh khác).

### 5. Kiểm tra

- Kích thước (byte, `main` → nhánh): `roman-cavalry` 2 464 000 → 2 546 172, `iberian-gallic-cavalry` 2 151 324 → 2 232 036, `numidian-cavalry` 2 141 760 → 2 220 152, `gallic-cavalry` 2 410 856 → 2 491 212: thêm khoảng 80 KB, phần lớn là `ridedown`; đều dưới 4 MB.
- `main-tools/glb-clips.mjs` so với `main`: `idle`, `attack`, `block`, `hit` giống hệt từng byte ở cả bốn file; `walk`, `jog`, `run`, `die` khác (có chủ ý); `ridedown` mới. `main-tools/glb-parts.mjs`: skin, ảnh pháp tuyến và các nút giống hệt; lưới (vạt áo) và ảnh màu, độ nhám (vài ô của bảng màu LOD2) khác.
- `art/tools/gait_check.py`: sải và độ trượt của móng không đổi (`walk` 1,203 m, `jog` 1,822 m, `run` 5,506 m; trượt 1%).
- `build_model.py`: không lỗi; bước kiểm tra mặt đất của bản xuất qua (`idle`, `walk` khung 0, `die` khung cuối).
- **Trong cảnh:** `/battle-lab?duel=1&pair=8` (kỵ binh Gaul xông qua hastati) và Cannae giai đoạn 6 (t = 5,1): cả bốn mô hình kỵ binh nạp `ridedown` (1,2 s); console không có cảnh báo hay lỗi. Ảnh cảnh ở `E:\World_History_Platform_assets\duyet\T-060\`.
- `npm run validate`, `npm run lint`, `npm run build` qua.
