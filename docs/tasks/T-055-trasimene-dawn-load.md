# T-055: Trận hồ Trasimene: cảnh lúc mở trận quá tối, cảnh tải chậm hơn Cannae

- **Lane:** 3. **Phiên chính làm thay** (người dùng yêu cầu 2026-11-19, vì lane 3 hết hạn mức trước khi bắt đầu), trên nhánh `t055-trasimene-dawn-load`, worktree `E:\World_History_Platform_assets\wt-T055`.
- **Model đề xuất:** Opus 5.5, effort `high`. Việc chỉnh và đo trên code bạn vừa viết ở T-053, không có hệ thống mới.
- **Nhánh:** `lane3/T-055-trasimene-dawn-load` (phiên chính đã tạo sẵn từ `main` trong worktree của bạn).
- **Phạm vi file:** `src/components/battle/`.

## Bối cảnh

T-052 và T-053 đã gộp vào `main` (2026-11-19); trận hồ Trasimene có nút xem trong app chính. Khi kiểm việc mở trận từ app trên bản production, phiên chính thấy ba điều. Người dùng yêu cầu sửa.

1. **Lúc mở trận cảnh gần như đen.** Trận bắt đầu lúc 4:30, mặt trời mọc lúc 4:45 (`trasimene.md`, mục 6), lại có sương dày. Đúng nguồn, nhưng ấn tượng đầu của người xem là một màn hình tối, không thấy đồi, hồ hay quân. Ảnh: `E:\World_History_Platform_assets\duyet\K-bay-ban-do\trk-2-scene-start.png` và `trk-4-scene-end.png` (mức chất lượng thấp); ảnh `duyet\T-053\01-cung-goc-0500.png` của bạn (5:00, mức cao) đã sáng hơn nhưng vẫn tối.
2. **Cảnh sẵn sàng chậm hơn Cannae 2,5–3 giây.** Đo từ lúc bấm nút xem trận tới lúc có canvas và lớp phủ, bản production, ba lượt: Trasimene 8,2–9,0 giây, Cannae 5,7 giây. Lưới khoảng cách của hồ (`LakeField`) chỉ tốn 60–70 ms khi chạy riêng trong Node, nên không phải nguyên nhân. Nguyên nhân chưa ai tìm.
3. **Hai chỗ nhỏ ở mép nước**, thấy khi review T-053:
   - nhìn cả hồ từ xa, quanh đảo và dọc bờ có một quầng vàng nhạt (`duyet\T-053\sua-anh-09\2-ho-tu-xa-sau.png`, rõ nhất ở đảo Polvese);
   - nhìn gần, mép nước có một vệt trắng đứt khúc như đường chấm (`duyet\T-053\06-ho-dao-tu-dong-bang-1000.png`, mép dưới ảnh).

Đọc trước: `docs/ARCHITECTURE.md`, mục "Trận đánh 3D": "Hồ", "Sương mù", "Vùng xa", "Đồ hoạ theo ảnh mẫu"; `engine/sky.ts` (các bảng mốc theo độ cao mặt trời), `engine/mist.ts`.

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Cảnh lúc rạng đông

- Ở góc mở lúc 4:30, người xem phải nhận ra được, không cần nhãn: dáng đồi, mép hồ, và các khối quân đang lộ (mảng màu phe). Cảnh vẫn phải ra là rạng đông: tối hơn và lạnh màu hơn lúc 6:00, và sáng dần đều tới lúc mặt trời mọc, không có bước nhảy.
- Sửa ở ánh sáng của cảnh (các mốc trước bình minh trong `sky.ts`, màu sương lúc trời tối trong `mist.ts`), ở cả hai mức chất lượng. **Không đổi giờ bắt đầu trận**: 4:30 là dữ liệu người dùng đã duyệt.
- Sương vẫn theo lựa chọn của người dùng ở T-053: không đổi độ dày và độ cao của lớp sương.
- **Cannae không được đổi.** Cannae chỉ diễn ra khi mặt trời đã lên (5:30–17:00), nên các mốc dưới chân trời không chạm tới nó; kiểm bằng so từng điểm ảnh như ở T-053 (`T-053\tools\imgdiff.py`), ở giờ đầu và giờ cuối trận.
- Đo độ sáng trước và sau bằng `E:\World_History_Platform_assets\main-tools\look\measure.py` (p5, p50, p95) ở góc mở lúc 4:30, 5:00, 5:30 và 6:00; ghi vào "Kết quả".
- **Dừng một lần** khi có bản đầu: chụp trước và sau ở bốn giờ trên, ở cả hai mức chất lượng, rồi báo người dùng xem. Người dùng chọn độ sáng ở bước này.

### 2. Thời gian tải cảnh

- Đo từng bước từ lúc bấm nút tới lúc cảnh sẵn sàng, ở cả hai trận, trên bản production: tải file trận và lưới độ cao, dựng mặt đất gần và vùng xa, cây và công trình, mô hình lính, biên dịch shader, khung hình đầu. Kịch bản có sẵn để đo tổng: `main-tools\drive\s-transition.mjs` (Cannae) và `s-transition-k.mjs` (Trasimene).
- Tìm 2,5–3 giây chênh nằm ở đâu, rồi sửa phần đáng sửa.
- Đích: Trasimene sẵn sàng chậm hơn Cannae không quá 1 giây. Nếu không tới được, ghi số đo từng bước và lý do.
- Không đổi hình ảnh của cảnh để đổi lấy thời gian tải, và không làm số khung hình/giây lúc phát giảm.

### 3. Mép nước

- Quầng vàng nhạt quanh đảo và bờ khi nhìn xa: tìm nguyên nhân; sửa nếu gọn.
- Vệt trắng đứt khúc ở mép nước khi nhìn gần: nếu là sóng vỗ thì làm cho ra sóng vỗ (liền hơn, mờ hơn), hoặc bỏ.
- Hai việc này nhỏ. Nếu sửa phải đụng nhiều thì ghi lại nguyên nhân và đề nghị, không cần cố.

### 4. Kiểm tra và ảnh

- `npm run validate`, `npm run lint`, `npm run build` qua; hồi quy lõi (`main-tools\reg-core.js`) không hỏng.
- Hiệu năng: Trasimene và Cannae không chậm hơn `main`; đo xen kẽ A-B như ở T-053, ghi Godot và Blender có đang chạy không (`tasklist`).
- Ảnh ở `E:\World_History_Platform_assets\duyet\T-055\`, đặt tên `…-A-truoc`, `…-B-sau`. Driver chụp: `PORT=9364`.

## Ràng buộc

- Chỉ sửa file trong phạm vi. File trận là của lane 2: thấy cần đổi thì ghi vào "Kết quả".
- Không đổi hợp đồng `src/lib/battle.ts`; cần thì ghi đề nghị.

## Xong khi

- Người dùng đã duyệt độ sáng lúc rạng đông; Cannae không đổi.
- Có số đo từng bước của thời gian tải ở cả hai trận; Trasimene chậm hơn Cannae không quá 1 giây, hoặc có lý do kèm số đo.
- Hai chỗ ở mép nước đã sửa hoặc đã có nguyên nhân và đề nghị.
- Các kiểm tra ở mục 4 qua; mục "Kết quả" đã điền.

## Kết quả

Phiên chính, 2026-11-19, nhánh `t055-trasimene-dawn-load`: ba commit, một cho mỗi phần.

### 1. Cảnh lúc rạng đông

- **Cách làm:** mắt quen dần với bóng tối. Trước khi mặt trời lên 8°, cảnh được phơi sáng mạnh hơn ban ngày, theo bảng `ADAPT` trong `sky.ts`: gấp 2,9 lần ở −8°, 2,5 lần ở −3°, 1,75 lần ở 2°, 1 lần từ 8°. `BattleEngine` nhân `Sky.exposure` vào `toneMappingExposure` mỗi khung; `mist.ts` nhân vào bản sao đường cong màu của nó, để sương sáng cùng mức với cảnh.
- Ánh sáng, màu trời và màu sương không đổi: cảnh vẫn tối và lạnh màu hơn lúc 6:00, sáng dần đều, không có bước nhảy. Giờ bắt đầu trận vẫn là 4:30.
- **Người dùng chọn bản C**, mức sáng hơn trong hai mức (bản B: 2,4 / 2,0 / 1,5 / 1).
- **Độ sáng** đo bằng `main-tools/look/measure.py` ở góc mở của `/battle-lab`, mức cao; mức thấp ra cùng số:

| Giờ (độ cao mặt trời) | p5 / p50 / p95 trước khi sửa | Bản B | Bản C (đã chọn) |
|---|---|---|---|
| 4:30 (−3,3°) | 0,09 / 0,15 / 0,20 | 0,14 / 0,23 / 0,32 | 0,16 / 0,27 / 0,37 |
| 5:00 (1,6°) | 0,15 / 0,25 / 0,35 | 0,19 / 0,32 / 0,45 | 0,20 / 0,35 / 0,49 |
| 5:30 (6,7°) | 0,20 / 0,35 / 0,48 | 0,21 / 0,37 / 0,51 | 0,22 / 0,38 / 0,52 |
| 6:00 (12°) | 0,23 / 0,40 / 0,54 | 0,23 / 0,40 / 0,54 | 0,23 / 0,40 / 0,54 |

- Mở trận trong app lúc 4:30: độ sáng trung vị của cả khung hình (gồm cột lời dẫn) từ 0,12 lên 0,22.
- **Cannae không đổi:** mặt trời ở Cannae luôn cao từ 9,9° trở lên (5:30–17:00, ngày 178, vĩ độ 41,3°), nên hệ số luôn là 1.

### 2. Thời gian tải cảnh

- **Đo từng bước:** `BattleEngine.loadSteps` ghi số mili giây từ lúc tạo engine tới khi xong mỗi bước (lưới độ cao, mặt đất, công trình, cây, cỏ, mô hình, quân, bụi, shader, khung hình đầu). Kịch bản đo `main-tools/drive/s-load55.mjs`; đo CPU lúc mở trận `s-loadprof55.mjs`.
- **Nguyên nhân:** cây. Trasimene có ba khu rừng lớn và nhiều đồi dốc mọc bụi: khoảng 7 triệu đỉnh, gấp gần chín lần Cannae (0,8 triệu). Bước dựng cây mất 3,3–6,4 giây trên bản dev, so với 0,5–0,8 giây ở Cannae; bộ đệm lớn cũng làm việc biên dịch shader và khung hình đầu lâu hơn. Lưới khoảng cách của hồ chỉ 60–70 ms.
- **Đã sửa, không đổi hình:**
  - `vegetation.ts`: hình ghi thẳng vào mảng có kiểu, tăng gấp đôi khi đầy, thay cho mảng số thường; mỗi tấm lá và mỗi đoạn thân là một hình bốn đỉnh có chỉ số, thay cho sáu đỉnh rời, nên ít hơn một phần ba số đỉnh; bảng `cos`/`sin` của thân cây tính một lần. Kiểm bằng script (`main-tools/t055/veg-same.mjs`): dựng cùng các cây bằng bản cũ và bản mới, so từng số của mọi đỉnh, không lệch số nào.
  - `BattleEngine.load`: tải danh mục mô hình cùng lúc với lưới độ cao, bắt đầu tải các file mô hình, rồi mới dựng mặt đất, công trình, cây và cỏ trong lúc file đang về. Mũi tên vẫn dựng sau quân như cũ, để thứ tự vẽ các lớp trong suốt không đổi.
- **Số đo**, bản production, mở trận từ panel sự kiện, từ lúc bấm nút tới khi có cảnh và lớp phủ (`s-transition.mjs`, `s-transition-k.mjs`), ba lượt xen kẽ, máy không chạy Blender hay Godot:

| | `main` | Nhánh |
|---|---|---|
| Trasimene | 8,8 / 8,0 / 7,7 giây (trung bình 8,2) | 6,5 / 6,4 / 6,1 giây (trung bình 6,3) |
| Cannae | 5,7 / 6,1 / 5,6 giây (trung bình 5,8) | 5,7 / 5,6 / 5,8 giây (trung bình 5,7) |
| Chênh | 2,4 giây | 0,6 giây |

- Từng bước trên nhánh (ba lượt, trung bình): Trasimene dựng cây 1,1 giây, shader 1,6 giây; Cannae 0,46 và 1,26 giây. Phần còn chênh chủ yếu là cây.
- **Số khung hình/giây**, `s-perf53.mjs`, hai lượt xen kẽ, cùng máy và cùng lúc: Trasimene góc mở 80 / 80 trên `main`, 91 / 92 trên nhánh; lúc phát (giai đoạn 1, 3, 5) 54–62 trên `main`, 62–70 trên nhánh. Cannae góc mở 90 / 104 và 105 / 105; lúc phát 58–67 và 62–69. Không chậm hơn, Trasimene nhanh hơn nhờ bớt đỉnh. Máy lúc đo chỉ còn khoảng 2 GB RAM trống (hai bản production cùng chạy), nên số tuyệt đối thấp hơn các lần đo trước.

### 3. Mép nước

- **Quầng vàng quanh đảo khi nhìn xa:** là dải nước nông (màu `uLakeShallow`, sáng hơn nước sâu, ít phản chiếu trời hơn) rộng tới 120 m. Từ xa, dải này giờ hẹp lại cùng dải bùn, còn 25 m. Còn lại một viền mảnh.
- **Vệt trắng đứt khúc ở mép nước gần:** là sóng vỗ, họa tiết bọt ở toàn mức cắt vệt thành chấm. Giờ là một vệt mờ liền nét (cường độ 0,13 thay vì 0,3; bọt chỉ làm đậm nhạt), tắt từ 150 tới 700 m thay vì 300 tới 1 500 m.

### Kiểm tra

- `npm run lint`, `npm run validate`, `npm run build`, `npm run tutor:check`, `npx tsc --noEmit` qua.
- Hồi quy lõi (`main-tools/reg-core.js`) trên bản production của nhánh: qua cả 17 mục, không lỗi console.
- **Cannae không đổi:** so từng điểm ảnh giữa `main` và nhánh, cùng góc và cùng giờ (`T-053/tools/imgdiff.py`), lúc 5:30, 17:00 và nhìn xa: 0,04%, 0,13%, 0,09% điểm ảnh lệch quá 8/255, đúng mức của cây đung đưa theo thời gian thật.

### Ảnh

Ở `E:\World_History_Platform_assets\duyet\T-055\`:
- `1-so-sanh-goc-mo-4-gio.png`: góc mở lúc 4:30, 5:00, 5:30, 6:00; trước khi sửa, bản B, bản C.
- `2-mo-tran-trong-app-0430.png`: mở trận trong app lúc 4:30, trước khi sửa và bản C.
- `3-mep-nuoc-nhin-xa.png`, `4-dao-polvese-phong-to.png`, `4b-hai-dao-nho-phong-to.png`: cả hồ nhìn từ xa lúc 10:00, trước và sau.
- `5-mep-nuoc-gan.png`: mép nước nhìn từ đồng bằng, trước và sau.
- `work\`: ảnh gốc của các bảng trên, kể cả ảnh mức chất lượng thấp và ảnh Cannae dùng để so.
