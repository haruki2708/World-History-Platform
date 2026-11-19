# T-051: Trận hồ Trasimene, chặng 0: tư liệu, địa hình, kiểm tra hồ và sương mù

- **Lane:** 2
- **Model đề xuất:** Opus 5.5, effort `high`.
- **Nhánh:** `lane2/T-051-trasimene-stage0` (phiên chính đã tạo sẵn trong worktree của bạn và gộp `main` mới nhất vào: có file này, sự kiện mới, phần hợp đồng hồ và sương mù, cùng T-049 và T-050)
- **Phạm vi file:**
  - `docs/data/battles/` (file mới `trasimene.md`);
  - `scripts/battles/` (`build-terrain.mjs`, `validate-battles.mjs`);
  - `public/data/terrain/` (lưới độ cao của trận mới).
  - Chưa viết file trận `src/data/battles/battle-of-lake-trasimene.json` ở chặng này (đó là chặng 1), trừ phần `terrain` nháp nếu bạn cần nó để chạy kiểm tra.

## Bối cảnh

T-049 của bạn và T-050 (mô hình kỵ binh Gaul, lane 1) đã gộp vào `main` ngày 2026-11-19: loại lính `iberian-cavalry` và `gallic-cavalry` đều có mô hình riêng. Đừng sửa thêm dữ liệu Cannae ở task này.

Người dùng duyệt **đợt K: trận 3D thứ hai, hồ Trasimene (217 TCN)** (`docs/PLAN.md`, mục "Đợt K"). Lý do chọn: cùng hai đạo quân với Cannae một năm trước đó, nên **không dựng mô hình mới**; việc mới là dữ liệu, địa hình có hồ và đồi, sương mù. Đợt này thử xem trận thứ hai có đúng là chỉ thêm dữ liệu không.

Bốn chặng: 0 tư liệu và hợp đồng (task này và phần của phiên chính); 1 dữ liệu trận (bạn); 2 cảnh có hồ và sương mù (lane 3); 3 ghép vào app (phiên chính).

Phiên chính đã làm cho chặng 0:
- **Sự kiện** `battle-of-lake-trasimene` (năm −217) trong `src/data/events.json`. Id file trận phải trùng id này.
- **Hợp đồng** (`src/lib/battle.ts`):
  - `BattleTerrain.lakes?: BattleLake[]`: hồ là một đường bao khép kín (`outline`, mét trên sân), mặt nước ở `level` mét trên mực biển, kèm `evidence`. Khác với biển, khối quân **được** đứng trong hồ (cảnh cho lính lội nước).
  - `BattleScenery.mist?: { level, clearsAt?, evidence }`: sương mù lúc đầu trận, `level` từ 0 tới 1; tan hết vào giờ `clearsAt`.
- Cảnh **chưa vẽ** hồ và sương mù (chặng 2). Hiện hồ chỉ là mặt đất phẳng của lưới độ cao.

## Nguồn: phiên chính đã đọc gì

Đọc ngày 2026-11-19, bản dịch Roberts (Livy, Wikisource) và Loeb (Polybius, Thayer; trang ghi là chưa soát lỗi). **Bạn đọc lại và sửa chỗ nào tôi tóm tắt sai.**

| Điểm | Polybius 3.80–85 | Livy 22.3–7 |
|---|---|---|
| Địa thế | 83.1: đường đi qua một dải đất bằng hẹp giữa hai dãy đồi cao; một đồi dốc chắn phía trước; hồ ở phía sau; lối giữa hồ và sườn đồi rất hẹp | 4: hồ sát chân các đồi Cortona; một lối hẹp giữa đồi và hồ, rồi tới một khoảng đất bằng rộng hơn; một khoảng bằng nhỏ có đồi hai bên |
| Người Phi và Iberia | 83.2: trên đồi phía trước, cùng Hannibal | 4: ở khoảng đất bằng nhỏ nơi Hannibal đóng trại |
| Lính ném đá Baleares, lính nhẹ | 83.3: đi vòng, dàn hàng dài dưới các đồi bên phải lối hẹp | 4: sau các đồi |
| Người Celt và kỵ binh | 83.4: vòng qua các đồi bên trái, dàn liền dưới chân đồi; toán cuối ở cửa lối hẹp, giữa sườn đồi và hồ | 4: kỵ binh nấp sau các đồi thấp ở cửa lối hẹp; không nói riêng về người Gaul ở đây |
| Sương | 84.1: "buổi sáng mù sương khác thường"; 84.13: sương tan sau trận | 4: sương từ hồ bốc lên, dày ở đồng bằng hơn trên cao; 6: mặt trời làm tan sương sau trận |
| Quân La Mã vào | 83.7: hôm trước đóng trại sát hồ lúc muộn; rạng sáng dẫn tiền quân dọc hồ vào lối hẹp. 84.1: Hannibal ra hiệu khi đầu đoàn quân đã chạm trán và phần lớn đã vào lối hẹp | 4: tới hồ lúc mặt trời lặn; sáng hôm sau, trời chưa sáng rõ, vào lối hẹp không cho trinh sát đi trước |
| Flaminius | 84.6: bị một số người Celt giết | 6: bị kỵ sĩ Insubres tên Ducarius đâm chết; triarii giữ xác |
| Thương vong La Mã | 84.7: khoảng 15 000 chết trong thung lũng; 85.1: hơn 15 000 tù binh | 7: 15 000 chết; số người chạy tản mát về Roma: xem ghi chú dưới bảng |
| Toán 6 000 | 84.11–14: phá vây ở đầu lối hẹp, lên chỗ cao, rút vào một làng Etruria; Maharbal cùng lính Iberia và lính giáo vây làng, họ hàng | 6: khoảng 6 000 ở đầu đoàn quân phá vây, đứng trên chỗ cao; sương tan mới thấy thất bại; hôm sau hàng Maharbal |
| Thương vong của Hannibal | 85.5: khoảng 1 500, phần lớn là người Celt | 7: 2 500 |
| Dồn xuống hồ | 84.9–10: người bị dồn xuống hồ chết đuối, hoặc đứng ngập tới cổ rồi bị kỵ binh giết | 6: lội tới vai, có người bơi; kỵ binh cưỡi xuống nước chém |
| Thời lượng | không nói | 6: gần ba giờ |
| Động đất | không nhắc | 5: có động đất lớn lúc đánh, không ai để ý |
| Ngày tháng | 77.1: đầu xuân Flaminius tiến quân; không cho ngày | không cho ngày của trận |
| Quân số La Mã | không cho | không cho |

Một chỗ tôi chưa chắc: số người chạy thoát theo Livy 22.7. Bản tôi nhận được ghi "khoảng 1 000", trong khi con số thường gặp là 10 000. Đối chiếu với bản Latinh.

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Tư liệu: `docs/data/battles/trasimene.md`

Theo cách trình bày của `cannae.md`:

- **Nguồn đã đọc**, kèm link; tóm tắt tự viết.
- **Vị trí.** Vị trí trận đánh còn tranh cãi (các giả thuyết quanh bờ bắc hồ). Nêu các giả thuyết chính bạn tìm được, chọn một để dựng, ghi lý do và đặt `approximate`. Không ghi tên tác giả cho điều mới chỉ thấy trên Wikipedia (bài học ở T-045).
- **Bờ hồ.** Mực nước và bờ hồ thời cổ khác ngày nay. Ghi nguồn nói gì; cảnh sẽ vẽ bờ hồ ngày nay và nói rõ điều đó trong `evidence` của hồ.
- **Quân số và đơn vị.** Nguồn cổ không cho quân số La Mã; tìm ước lượng hiện đại và ghi là giả định. Lập bảng đơn vị hai bên **chỉ với các loại lính đã có** trong `unit-types.json` (sau T-049: `iberian-cavalry`, `gallic-cavalry`). Nếu thấy cần loại lính mới thì dừng lại, ghi đề nghị: người dùng muốn được hỏi trước.
- **Các giai đoạn** của trận (giờ bắt đầu, giờ kết thúc từng giai đoạn, mỗi giai đoạn dài bao nhiêu giây phát) và căn cứ. Nhớ hai luật của cảnh: giai đoạn `fight` nên dài ít nhất 8 giây phát; khối chỉ tới chỗ địch ở cuối một giai đoạn thì giai đoạn sau mới ghi `fight`.
- **Ngày trong năm** (`dayOfYear`) để tính nắng: nguồn không cho ngày; ghi cách bạn chọn.
- **Cảnh vật** có trong nguồn (sương, hồ, đồi, lối hẹp, làng Etruria, trại) và mức căn cứ của từng thứ. Người dùng đã chọn cho Cannae: mặt đất xanh, có cây và nhà minh hoạ, thứ nào trái nguồn thì nói rõ; áp dụng như vậy.
- **Những gì hợp đồng hiện nay không tả được.** Ví dụ: cột hành quân uốn theo bờ hồ (khối quân là hình chữ nhật, phải chia thành nhiều khối ngắn); quân phục kích nấp sau đồi. Đề nghị cách làm, hoặc đề nghị đổi hợp đồng.

### 2. Địa hình

- Thêm cấu hình trận mới vào bảng theo trận của `scripts/battles/build-terrain.mjs` (script đã nhận `--battle`). Nguồn độ cao như Cannae: Copernicus DEM GLO-30. Ghi ô đã tải và giấy phép vào `trasimene.md`.
- Chọn `origin` và vùng lưới chính sao cho gồm cả lối hẹp, các đồi phục kích và phần hồ quân La Mã bị dồn xuống. Lưới vùng xa (`far`) như Cannae.
- Copernicus là mô hình bề mặt: mặt hồ là một mặt phẳng ở cao độ mặt nước. Ghi cao độ đó (`level`) và vạch đường bao bờ hồ (`outline`) trong vùng lưới.
- Ảnh xem trước địa hình (`--preview`) đặt ở `E:\World_History_Platform_assets\duyet\T-051\`.

### 3. Kiểm tra trong `scripts/battles/validate-battles.mjs`

- `terrain.lakes`: id, tên song ngữ, `level` là số, `outline` ít nhất ba điểm, `evidence` đúng dạng; địa danh và công trình không nằm trong hồ.
- Khối quân **được** đứng trong hồ ở một mốc. Đề nghị một giới hạn hợp lý (ví dụ không quá xa bờ), hoặc nói vì sao không cần.
- `scenery.mist`: `level` trong 0–1, `clearsAt` (nếu có) nằm trong khoảng giờ của trận, `evidence` đúng dạng.
- Trận không có hồ hay sương mù (Cannae) vẫn qua như cũ.

## Ràng buộc

- Không sửa `src/lib/`, `src/components/`, `src/data/events.json`, `src/data/index.ts`. Cần đổi hợp đồng thì ghi đề nghị vào "Kết quả"; phiên chính sửa.
- Driver chụp của phiên chính: đặt `PORT=9362` khi chạy.
- `npm run validate`, `npm run lint`, `npm run build` phải qua.

## Xong khi

- `trasimene.md` có nguồn, vị trí đã chọn, bảng đơn vị, các giai đoạn, cảnh vật, và danh sách những gì hợp đồng chưa tả được.
- Có lưới độ cao của trận (chính và vùng xa), cao độ và đường bao hồ.
- `npm run validate` kiểm tra hồ và sương mù.
- Mục "Kết quả" đã điền. **Dừng ở đây**: phiên chính và người dùng xem xong mới sang chặng 1 (file trận).

## Kết quả

(Lane 2 điền khi xong.)
