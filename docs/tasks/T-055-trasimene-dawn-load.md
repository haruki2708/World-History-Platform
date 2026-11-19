# T-055: Trận hồ Trasimene: cảnh lúc mở trận quá tối, cảnh tải chậm hơn Cannae

- **Lane:** 3
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

(Lane 3 điền khi xong.)
