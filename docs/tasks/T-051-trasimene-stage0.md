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

Lane 2, 2026-11-19. Bốn commit trên `lane2/T-051-trasimene-stage0`: lưới độ cao và script địa hình (`4882971`), kiểm tra hồ và sương mù cùng khối `terrain` nháp (`32f4115`), `trasimene.md` (`2e72d2f`), mục này. Dừng ở chặng 0: **chưa viết file trận** `src/data/battles/battle-of-lake-trasimene.json`. Chi tiết nguồn, lý do và số đo ở `docs/data/battles/trasimene.md`.

### 1. Nguồn, và chỗ sửa bảng tóm tắt của task

Đọc lại Polybius 3.77–86 và 6.26, 6.40 (Paton, LacusCurtius), Livy 22.1–7 bản Latin (The Latin Library) đối chiếu bản Roberts, Ovid *Fasti* 6.763–770 (Latin), bài của Konrad về ngày của trận (*RhM* 166, 2023) và một bài địa vật lý về lối Malpasso (kỷ yếu GNGTS 2013). Wikipedia tiếng Anh và tiếng Ý chỉ để tham khảo ước lượng hiện đại và tóm tắt các giả thuyết về vị trí; theo bài học T-045, điều gì chỉ thấy trên Wikipedia thì không gắn tên tác giả.

Bảng của phiên chính đúng ở phần lớn các dòng. Sửa (đầy đủ ở `trasimene.md`, mục 1):

- **Livy 22.7.2: 10 000 người chạy tản mát về Roma**, không phải 1 000. Bản Latin: *decem milia*. "1000" là lỗi của bản Roberts trên Wikisource.
- Livy 22.4.2–3: "khoảng bằng nhỏ có đồi hai bên" là cách dịch của Roberts; bản Latin chỉ nói một lối rất hẹp, rồi khoảng đất bằng rộng hơn một chút, rồi đồi nhô lên. Trại của Hannibal ở "chỗ trống, thấy được" (*in aperto*), không phải "ở khoảng đất bằng nhỏ".
- Livy 22.6.6: người bị dồn xuống nước đi qua "chỗ nước nông của **đầm**" (*vada paludis*); bản Roberts bỏ chữ đầm. Dùng cho cảnh vật (mép hồ đầm lầy).
- Livy 22.6.11: Maharbal đuổi theo trong đêm với **toàn bộ kỵ binh**; Polybius 3.84.14 lại nói lính Iberia và lính giáo. Hai nguồn khác nhau.
- Polybius 3.84.13: sương tan lúc toán 6 000 người lên tới đỉnh đồi (cụ thể hơn "sau trận").
- **Ngày:** nguồn cổ duy nhất là Ovid, *Fasti* 6.767–768: *a.d. X Kal. Quinct.*, 21 hoặc 22 tháng 6 theo lịch La Mã.

### 2. Vị trí

Chọn **thung lũng Sanguineto và đồng bằng Tuoro, lối hẹp ở Malpasso** (giữa Borghetto và Tuoro), `approximate`. Lý do chính: trên lưới độ cao, Malpasso là chỗ sườn núi xuống sát hồ nhất trên cả bờ bắc trong lưới (đất cao hơn mặt hồ 15 m cách bờ ngày nay 45–110 m), đúng câu của Livy 22.4.1; sau lối hẹp là khoảng đất bằng rộng khoảng 2 km, rồi đồi Tuoro chắn ngang phía đông, đúng trình tự Livy 22.4.2 và "đồi dốc chắn phía trước" của Polybius 3.83.1. Bài GNGTS 2013 nói đây là vị trí được coi là khả dĩ nhất hiện nay. Ba nhóm giả thuyết khác (cả thung lũng tới Montigeto; Passignano–Montecolognola; Val di Chiana) ở `trasimene.md`, mục 3.

### 3. Địa hình và hồ

- `build-terrain.mjs` có cấu hình `battle-of-lake-trasimene`: gốc 12,055 Đ, 43,200 B; lưới chính 321 × 271 điểm, 30 m (x −4 500…5 100, y −3 000…5 100), độ cao 254,5–772,1 m; lưới vùng xa 271 × 271, 400 m, ±54 km, như Cannae. Ô Copernicus GLO-30 `N43E012`, `N43E011`, `N42E012`, `N42E011` và bốn mặt nạ nước đi kèm, tải ngày 2026-11-19 từ kho AWS công khai; file giấy phép giống từng byte với của Cannae. Dựng lại lưới Cannae ra đúng từng byte như trước.
- **Hồ:** mặt nước trên lưới ở **254,5 m** (Copernicus là mô hình bề mặt, mặt hồ phẳng; 5–95% của 60 501 ô đều 254,5 m). Đường bờ **239 điểm**, vạch từ mặt nạ nước của Copernicus (`--lake`), bao cả hồ (120,3 km²), chạy ra ngoài lưới chính. Khớp lưới: chỉ 19 điểm đất ngoài bờ thấp hơn mặt nước + 0,5 m, đều cách bờ dưới 8 m. Bờ là **bờ ngày nay**; `evidence` nói rõ, kèm điều bài GNGTS 2013 viết: thời Etruria và La Mã nước hồ thường thấp hơn, lối Malpasso rộng hơn.
- Khối `terrain` nháp cho chặng 1 (lưới, hồ, 7 địa danh, nguồn): `docs/data/battles/trasimene-terrain.json`.
- Ảnh duyệt ở `E:\World_History_Platform_assets\duyet\T-051\`: `1-vung-luoi-chinh.jpg`, `2-phuong-an-bo-tri.jpg` (phác bố trí cho chặng 1: đường đoàn quân, chỗ phục kích, đường toán phá vây), `3-loi-hep.jpg`, `4-vung-xa.jpg`.

### 4. Quân số, đơn vị, giai đoạn

- **Quân số** (giả định, `trasimene.md` mục 5): La Mã 25 000–31 000 (mức dưới là ước lượng hiện đại do Wikipedia nêu; mức trên cộng từ chính Polybius và Livy); Carthage 50 000–55 000. Chết: La Mã 15 000 (cả hai nguồn), Carthage 1 500–2 500.
- **Đơn vị: chỉ dùng loại lính đã có, không cần loại mới.** La Mã 16 khối xếp theo thứ tự hành quân của Polybius 6.40 (*extraordinarii* đi đầu, cánh phải đồng minh, hai quân đoàn, cánh trái đồng minh đi cuối); hai khối đầu là toán 6 000 người phá vây. Hannibal: Libya và Iberia trên đồi Tuoro, bốn khối Gaul dưới các đồi phía bắc, lính ném đá và lính giáo nhẹ sau mỏm Tuoro, kỵ binh Numidia và Iberia sau gò ở cửa lối hẹp, kỵ binh Gaul cùng bộ binh Gaul (Ducarius là kỵ sĩ Insubres, Livy 22.6.3). Không vẽ con voi cuối cùng và đoàn hành lý (không có loại lính; nguồn không nói con voi có mặt).
- **Sáu giai đoạn**, 4:30 tới 10:30, tổng 122 giây phát; ba giai đoạn có `fight` dài 12, 25 và 25 giây (từ 8 trở lên); khối chạm địch ở cuối giai đoạn trước rồi mới `fight`. Đánh nhau 6:00–9:00 theo "gần ba giờ" của Livy 22.6.1.
- **`dayOfYear` = 131** (10 tháng 5 lịch Gregory nối ngược = 14 tháng 5 năm 217 TCN lịch Julius): ngày của Ovid lùi 5–6 tuần theo độ lệch lịch của Derow và Fronda, như Cannae theo Derow. Các ước lượng khác cho tới 169; mặt trời mọc chênh chưa tới nửa giờ.

### 5. Sương mù và cảnh vật

- `scenery.mist` đề nghị: `level` 0,8, `clearsAt` 9,75 (trận ngã ngũ thì sương tan), `attested` (Polybius 3.84, Livy 22.4–6). Livy 22.4.6 nói sương dày ở đồng bằng hơn trên đồi: cảnh đã vẽ như vậy.
- Bảng cảnh vật và mức căn cứ ở `trasimene.md`, mục 8. Khác Cannae: trận giữa tháng 5 nên **mặt đất xanh không trái nguồn** (`inferred`). Mép hồ lau sậy (`inferred`, từ "đầm" của Livy); hai trại và làng Etruria `attested` (vị trí, kích thước giả định); nhà nông minh hoạ, nhiều cái `ruined` vì Hannibal đốt phá dọc đường (Polybius 3.82); cây minh hoạ; gió nhẹ và bụi ít (`inferred`, buổi sáng có sương).

### 6. Kiểm tra trong `validate-battles.mjs`

- `terrain.lakes`: danh sách; id kebab-case không trùng; tên song ngữ; `level` là số; `outline` từ ba điểm (số `x`, `y`) và có diện tích; `evidence` đúng dạng. Địa danh và công trình không nằm trong hồ. Cảnh báo khi lưới trong đường bờ lệch `level` quá 1 m.
- **Giới hạn lội hồ: 150 m từ bờ** (mọi điểm của khối, ở mọi mốc). Polybius và Livy: người đứng ngập tới cổ, tới vai, ở chỗ nước nông đầu tiên; hồ nông, đáy thoải. Đề nghị cho chặng 2: nước sâu khoảng 1,4–1,6 m ở 150 m từ bờ, để giới hạn này đúng là "ngập tới vai".
- `scenery.mist`: `level` 0–1; `clearsAt` là số, sau `startHour` và không muộn hơn giờ kết thúc giai đoạn cuối; `evidence`.
- `validate-battles.mjs` nhận đường dẫn file trận. `scripts/battles/test-lake-checks.mjs` chạy 25 ca từ một thư mục tạm (4 ca phải qua, 21 ca phải bị bắt, gồm một cảnh báo): **25/25 đúng**. Cannae qua như cũ.

### 7. Đã kiểm tra thế nào

- `npm run validate`, `npm run lint`, `npm run build`: qua.
- `node scripts/battles/test-lake-checks.mjs`: 25/25.
- Lưới Cannae dựng lại bằng script mới: không đổi byte nào.
- Xem bốn ảnh duyệt và đo trên lưới (chỗ hẹp, đỉnh đồi, độ khớp đường bờ) bằng script nhỏ ngoài repo.
- **Không chạy trình duyệt và driver chụp** (`PORT=9362`): chặng này không đổi gì trong app hay cảnh, và chưa có file trận để mở ở `/battle-lab`.

### 8. Đề nghị cho phiên chính (ngoài vùng của lane 2)

1. **Hợp đồng, đảo trong hồ (cần quyết trước chặng 2).** `BattleLake` không có lỗ, và hợp đồng nói cảnh không vẽ lưới độ cao trong đường bờ: đảo Maggiore và Minore (trong lưới chính, cao hơn mặt nước 35–55 m, nhìn thẳng từ chiến trường) sẽ biến mất. Đề nghị đổi câu trong `battle.ts` và ARCHITECTURE thành: cảnh vẽ nước trong `outline` **chỉ ở chỗ mặt đất không cao hơn `level`**; đảo tự hiện lên, không cần dữ liệu thêm. Cách khác: thêm `islands?: FieldPoint[][]`; script đã vạch sẵn đường bao đảo.
2. **Hợp đồng, quân nấp (tuỳ phiên chính):** `UnitState.concealed?: boolean`, cảnh vẽ khối đang nấp mờ đi hay ẩn tên, thẻ khối ghi "đang nấp". Không có thì chặng 1 vẫn làm được (sườn khuất, sương, lời dẫn).
3. **Ghi cho lane 3 ở chặng 2:** lưới vùng xa có mặt hồ ở 254,5 m, không ≤ 0, nên phải vẽ nước theo `outline` ở cả vùng xa; độ sâu nước gần bờ như ý 6 ở trên.
4. **ARCHITECTURE**, mục "Phong cảnh" và "Kiểm tra": thêm các kiểm tra hồ, sương, giới hạn 150 m; `validate-battles.mjs` nhận đường dẫn file; `test-lake-checks.mjs`; `build-terrain.mjs --lake`.
5. **`events.json`** (sự kiện `battle-of-lake-trasimene`): toạ độ (12,07 Đ, 43,2 B) nằm giữa đồng bằng đã chọn, không cần sửa. Nguồn Livy của sự kiện trỏ tới bản Roberts trên Wikisource, bản có lỗi "1000"; tóm tắt không dùng con số đó, nhưng nên thêm link bản Latin (The Latin Library) làm nguồn thứ hai.
6. **Ghi công** (chặng 3): `src/lib/credits.ts` trỏ tới file giấy phép của ô Cannae; file của ô Trasimene giống từng byte, nên không cần đổi.

### 9. Còn chưa chắc

- Độ lệch lịch năm 217 chưa ngã ngũ; tôi chưa đọc Derow, Fronda, Brind'Amour, chỉ đọc chú thích của Konrad.
- Chưa đọc nghiên cứu năm 2008 của Brizzi và Gambini; chỗ đứng chi tiết của lính nhẹ và làng Etruria lấy theo bản tóm của Wikipedia tiếng Ý.
- Cách chia 25 000 người La Mã thành 16 khối là giả định của tôi.
- Mặt hồ trên lưới (254,5 m) thấp hơn mực nước chuẩn của hồ (257,33 m, theo Wikipedia) 2,8 m; chưa rõ phần nào do hệ cao độ, phần nào do nước thấp lúc đo. Không ảnh hưởng tới cảnh.
- Khi viết file trận ở chặng 1: xoá `trasimene-terrain.json` (file trận thay nó).
