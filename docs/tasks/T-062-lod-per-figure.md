# T-062: Mỗi người một mức chi tiết (B4)

- **Lane:** phiên chính. Người dùng chọn 2026-11-22: phiên chính làm hết (phần cảnh thuộc vùng của lane 3).
- **Nhánh:** `batch-l/B4-lod`, từ `main` (sau khi gộp T-061).
- **Phạm vi file:**
  - `src/components/battle/engine/units.ts` (lô lính, chọn mức chi tiết), `src/components/battle/engine/BattleEngine.ts` (mức chất lượng `high`);
  - `src/lib/i18n/messages.ts` (khoá `battle.scene.stats.lods`, cả `en` lẫn `vi`);
  - `docs/` (ARCHITECTURE, PLAN, danh sách task, task này).
- **Kế hoạch chung:** `docs/PLAN.md`, mục "Đợt L", việc B4.

## Bối cảnh

Dòng B4 của PLAN: dùng mức chi tiết cao từ xa hơn, làm lại mức thấp cho bớt giống hình khối, giữ từ 50 khung hình/giây trên máy người dùng (RTX 3050).

Phiên chính đo trước khi làm (2026-11-22, Cannae giai đoạn 5, camera cách khối hastati 40–400 m; script ở `E:\World_History_Platform_assets\main-tools\drive\s-b4-*.mjs`):

- **Giữa trận, LOD0 không bao giờ hiện, kể cả khi camera cách khối quân 40 m.** Cảnh chọn mức chi tiết cho cả lô (tối đa 256 người) theo người gần camera nhất của lô. Các lô lại trải rộng: trung vị 330 m, 10% dài trên 1,1 km (người ngã nằm rải dọc đường đi, khối giãn ra khi đánh). Một người đứng gần là cả lô đòi LOD0. Ở 40 m, cảnh muốn 11,6 triệu tam giác cho lính, gần gấp năm trần 2,5 triệu, nên bước hạ cấp đẩy cả các lô gần nhất về LOD1 và LOD2: 0 người ở LOD0, 1 340 ở LOD1, 950 ở LOD2. Chọn theo từng người thì cùng ngưỡng chỉ cần 5,5 triệu (427 người ở LOD0).
- **Màn hình của người dùng:** 2880×1620, phóng 175% (khung nhìn 1646×926 điểm ảnh CSS, tỉ lệ điểm ảnh 1,75). Các số đo hiệu năng trước đây chụp ở 1280×800, tỉ lệ 1, tức khoảng một phần tư số điểm ảnh. Ở đúng màn hình người dùng, góc mở trận (cả chiến trường, mọi người ở LOD2) chạy khoảng 53 khung/giây (ở 1280×800 là 95). Góc này nặng nhất vì phần lớn là mặt đất, cây, cỏ phủ kín màn hình; số tam giác của lính không đổi nó.
- **Ba bản lính ở cùng khoảng cách** (ảnh `duyet/B4/B4-01-ba-ban-linh.jpg`): LOD2 (ống và elip, màu phẳng) lộ rõ dạng khối ở 60–105 m; từ khoảng 250 m (lính cao chừng 43 điểm ảnh thật) ba bản gần như không phân biệt được. LOD1 và LOD0 khác rõ chỉ khi lính cao từ khoảng 100 điểm ảnh thật. Tức cái "hình khối" chủ yếu do lỗi chọn mức ở trên: LOD2 bị dùng ngay sát camera.
- **Chi phí theo trần** (bản thử chọn theo từng người, màn hình người dùng, trung vị 3 vòng): mỗi triệu tam giác của lính tốn khoảng 2 ms một khung. Camera cách khối quân 40 m: trần 2,5 triệu 86 khung/giây (74 người ở LOD0), 4 triệu 67 (235), 6 triệu 52 (479), 9 triệu 41. Ở 110 m gần như vậy.

Người dùng chọn (2026-11-22, câu hỏi chọn phương án, sau khi xem `B4-01` và `B4-02-truoc-sau.jpg`):

- **trần 4,5 triệu tam giác** (góc gần khoảng 60–65 khung/giây; hai phương án khác: 3,5 triệu, 6 triệu);
- **không làm lại các bản thấp** (LOD1, LOD2): sau khi sửa, LOD2 chỉ còn dùng khi lính cao dưới khoảng 20–40 điểm ảnh thật, tầm mà ba bản gần như như nhau;
- phiên chính làm hết.

## Yêu cầu

1. **Mỗi người một mức.** Mỗi hình lính chọn mức chi tiết theo chiều cao của chính nó trên màn hình, không theo lô. Lô vẫn là đơn vị cắt theo khung nhìn (một khung bao) và vẫn được ghi từng khung như cũ; mỗi lô vẽ mỗi mức đang dùng bằng một lượt vẽ.
2. **Trần tam giác.** Khi tam giác của lính trong khung nhìn vượt trần, giãn cả hai ngưỡng theo cùng một hệ số, nhỏ nhất vừa trần: người nhỏ nhất trên màn hình (xa nhất) bị hạ trước, và tỉ lệ giữa hai ngưỡng giữ nguyên nên không mức nào bị rút cạn cho mức kia.
3. **Không nhấp nháy.** Một người giữ mức cũ tới khi qua ngưỡng 12% (như cũ, nay cho từng người). Hệ số giãn tăng ngay khi cần (không khung nào vượt trần lâu) và giảm dần khi bớt người.
4. **Bóng** như cũ: người ở LOD0 đổ bóng từ LOD1, người khác từ LOD2; lô ngoài khung nhìn vẫn đổ bóng vào khung nhìn.
5. **Mức chất lượng thấp** giữ nguyên (không LOD0, LOD1 khi cao trên 70 điểm ảnh, trần 0,7 triệu, không bóng).
6. **Số đo:** ở màn hình người dùng (`W=1646 H=830 DSF=1.75`), so xen kẽ với `main`: góc mở trận không chậm đi; góc gần từ 50 khung/giây trở lên; CPU thêm cho bước chọn mức dưới 1 ms một khung.

## Kết quả

**Trạng thái:** xong, gộp 2026-11-22 (phiên chính làm). Người dùng xem ảnh và chọn gộp ngay; sau đó nói không cần đo thêm (nguyên văn: "không cần đo gì nữa đâu, ổn cả rồi"), nên không có lần đo chốt lúc máy yên và tỉ lệ điểm ảnh giữ nguyên (mục "Để lại").

### Đã làm

- `units.ts`:
  - lớp `Level` mới: một mức chi tiết của một lô, với bộ đệm riêng cho bốn thuộc tính của từng người (`iPosYaw`, `iAnim`, `iSeed`, `iStrike`), một lưới cho khung nhìn và một lưới đổ bóng;
  - `Chunk`: bốn mảng dữ liệu của lô nay chỉ nằm ở CPU, được ghi mỗi khung như trước (thêm `slot`: người thứ mấy của lô). `measure` tính chiều cao trên màn hình của từng người; `sort` chép từng người sang bộ đệm của mức mình. Lô cả một mức (đa số, và mọi lô ngoài khung nhìn) chép cả khối một lần; lô mà người gần nhất cũng dưới ngưỡng LOD1 thì không xét từng người;
  - `Crowd.selectLods`: chọn mức theo từng người, giãn ngưỡng theo trần (`stretch`, `MAX_STRETCH`, `STRETCH_EASE`, `EASE_ROOM`). Thường chỉ một hay hai lượt duyệt mỗi khung.
- `BattleEngine.ts`, mức `high`: ngưỡng 36 / 12 điểm ảnh CSS (trước 58 / 17), trần 4,5 triệu (trước 2,5 triệu). Mức `low` giữ nguyên.
- Khung số liệu của `/battle-lab?stats=1` đếm người ở mỗi mức thay vì lô (`battle.scene.stats.lods`, `en` và `vi`).
- ARCHITECTURE: mục "Vẽ lính" (mỗi người một mức, trần, chống nhấp nháy) và "Hiệu năng" (màn hình thật của người dùng).

### Kiểm tra

- `npm run lint`, `npx tsc --noEmit`, `npm run validate`, `npm run build` qua.
- Hồi quy lõi (`main-tools/reg-core.js`, bản production của nhánh, `TUTOR_MOCK=1`): 17/17.
- Trận hồ Trasimene mở được, console không có lỗi hay cảnh báo; ở góc gần (40 m cách `hastati-2`, giai đoạn 4) có 174 người ở LOD0, 56 ở LOD1.
- Số người ở mỗi mức, Cannae giai đoạn 5, cùng góc nhìn, màn hình người dùng (`main` → nhánh): 15 m: LOD0 0 → 309; 40 m: 0 → 260; 110 m: 0 → 231; 200 m: 0 → 148; 320 m: 0 → 16.
- Nhấp nháy (`main-tools/drive/s-b4-flicker.mjs`; "lật" là một người đổi mức rồi đổi lại trong vòng 15 khung): camera đứng ở 60 m khi trận đang phát: 8 lần lật trong khoảng 6 giây với hơn 2 100 người trong khung nhìn (trước khi thêm `EASE_ROOM`: 48 lần trong 8 giây); camera trôi từ 300 m vào 30 m: 0 lần lật.

### Khung hình

Đo ở đúng màn hình của người dùng (`W=1646 H=830 DSF=1.75`), Cannae.

- Lúc máy yên (quét theo trần trên bản thử, trung vị 3 vòng, camera 40 m và 110 m): trần 2,5 triệu 86–88 khung/giây; 4 triệu 67; 6 triệu 52–57; 9 triệu 40–41. Mỗi triệu tam giác của lính tốn khoảng 2 ms một khung. Trần 4,5 triệu ước khoảng 62.
- Góc mở trận (mọi người ở LOD2) không phụ thuộc trần: khoảng 53 khung/giây.
- Đo xen kẽ hai bản production (`main-tools/perf/fps-servers-ab.sh`, `main` cổng 3200, nhánh cổng 3201) **chưa chốt được**: suốt lúc đo có Godot chạy (không phải của phiên chính) và RAM chỉ còn khoảng 1,4 GB. Trong điều kiện đó, trung vị 3 vòng (`main` → nhánh): góc mở trận 62,9 → 58,5; giai đoạn 5 đang phát 40,7 → 40,2; giai đoạn 6 38,7 → 39,5; camera 40 m 60,6 → 41,6; 110 m 58,7 → 40,2. Godot làm mọi số tụt khoảng 28% (bản `main` ở góc 40 m: 86 lúc máy yên, 60 lúc có Godot).
- Vài giây đầu sau khi đưa camera lại gần, khung hình thấp hơn hẳn (lần quét theo trần: vòng đầu ở 40 m chỉ 34–49, các vòng sau 52–89). Kịch bản `s-b4-perf.mjs` đo ngay sau khi đặt camera nên dính phần này; lần đo chốt nên chờ lâu hơn hoặc đo nhiều cửa sổ liền (`s-b4-warm.mjs`).
- CPU của `selectLods`: 0,45–0,5 ms một khung trên bản đã tối ưu (trước B4: 0,1–0,17 ms).

### Để lại

- **Đo chốt lúc máy yên:** người dùng thấy không cần. Muốn đo lại: `ROUNDS=3 bash main-tools/perf/fps-servers-ab.sh` khi không có Godot hay Blender chạy; nhớ phần khởi động chậm ở góc gần (mục "Khung hình").
- **Tỉ lệ điểm ảnh của góc mở trận:** giữ 1,75. Ở màn hình người dùng, góc mở trận đã sát hoặc dưới 50 khung/giây từ trước B4 (Cannae khoảng 53, hồ Trasimene khoảng 47). Ảnh so độ nét `B4-04`: tỉ lệ 1,5 gần như không khác 1,75, còn 1,25 hơi mềm ở mép cỏ và mép khiên. Nếu sau này cần nhanh hơn ở góc này, đây là cách rẻ nhất (một dòng `pixelRatio` của mức `high` trong `BattleEngine.ts`), nhưng phải đo lúc máy yên trước.

### Ảnh duyệt

`E:\World_History_Platform_assets\duyet\B4\`:
- `B4-01-ba-ban-linh.jpg`: ba bản lính ở cùng khoảng cách, 60–360 m;
- `B4-02-truoc-sau.jpg`: trước/sau ở 40, 110, 200, 320 m;
- `B4-03-can-canh.jpg`: trước/sau ở 15 và 25 m;
- `B4-04-ti-le-diem-anh.jpg`: cùng góc nhìn ở tỉ lệ điểm ảnh 1,75, 1,5 và 1,25, phóng về cỡ màn hình như trình duyệt làm.

Script: `E:\World_History_Platform_assets\main-tools\drive\s-b4-*.mjs`, `main-tools\b4\compose_lods.py`, `main-tools\perf\fps-servers-ab.sh`.
