# T-032: Giáp lá cà, chặng 1 (cảnh và dữ liệu, clip sẵn có)

- **Ai làm:** phiên chính (người dùng chọn 2026-11-18, không giao lane).
- **Model:** Fable 5.2, effort `xhigh`.
- **Nhánh:** `batch-g/stage1-melee` (tạo từ `main`). Không commit thẳng vào `main`; commit sau mỗi phần lớn.
- **Phạm vi file:** `src/lib/battle.ts`, `src/components/battle/`, `src/data/battles/`, `scripts/battles/`, `docs/data/battles/`, `src/app/battle-lab/`, `src/lib/i18n/messages.ts` (`about.*`), `docs/`.
- **Kế hoạch chung:** `docs/PLAN.md`, mục "Đợt G".

File này vừa là đề bài vừa là nhật ký: phiên nào làm tiếp thì đọc mục "Tiến độ" ở cuối trước.

## Vấn đề

Đo bằng chính code của cảnh (`timeline.ts`, từng hình lính, mỗi 1/4 giai đoạn):

- Giai đoạn 4–6 của Cannae: người hàng đầu của các khối `fight` cách hình lính địch gần nhất 20–70 m (trung vị 30–50 m), không lúc nào dưới 8 m.
- Hai chiến tuyến chỉ gặp nhau đúng ở mốc cuối giai đoạn 4. Suốt giai đoạn 4 chúng còn đang tiến lại gần nhau (99 m ở 3/4 giai đoạn), vì cảnh nội suy thẳng giữa hai mốc.
- Lính Libya chạm sườn quân La Mã đúng ở mốc cuối giai đoạn 6, tức lúc trận kết thúc; kỵ binh Hasdrubal cũng vậy.
- Lưỡi liềm là năm khối thẳng xếp bậc thang, còn mặt trận La Mã là hai khối cong: hai đường không trùng nhau.
- Cảnh: hàng trước (`rank ≤ 0,34`) phát `attack` suốt giai đoạn `fight`; người ngã chọn ngẫu nhiên lúc dựng `UnitTrack`.

## Thiết kế

### Hợp đồng (`src/lib/battle.ts`)

- `UnitType.ranged`: loại lính đánh từ xa (lao, đá ném). Không áp sát, giữ cách đánh hiện nay.
- Clip `block`, `hit` để chặng 2 thêm.

### Dữ liệu Cannae

Nguyên tắc: hai khối đánh gần nhau thì **mép trước trùng nhau** (lệch tối đa vài mét) ở **cả hai mốc** của giai đoạn, và đi cùng nhau ở giữa. Chỉ như vậy cảnh mới thấy đánh suốt giai đoạn, vì giữa hai mốc là nội suy thẳng.

- Mốc 3: bộ binh nặng La Mã đã chạm lưỡi liềm (còn lồi). Giai đoạn 4 là đánh trong lúc lưỡi liềm bị đẩy từ lồi sang lõm.
- Mép trước của năm khối lưỡi liềm nằm trên một cung tròn liền nhau; mặt trận La Mã nằm trên cùng cung đó.
- Mốc 5: lính Libya đã chạm hai sườn; principes và bộ binh đồng minh hàng sau đã quay ra đối mặt. Giai đoạn 6 đánh ở sườn suốt giai đoạn.
- Kỵ binh, lưng quân La Mã: xem mục "Tiến độ" (cần quyết cách cho kỵ binh tới sớm trong giai đoạn 6).
- `ranged: true` cho velites, lính ném đá, lính giáo nhẹ, kỵ binh Numidia.
- Script kiểm tra trong `npm run validate`: khối đánh gần có `fight` phải chạm một khối địch; hai khối địch không được xuyên vào nhau.

### Cảnh

Dữ liệu thuần (không three.js), thử được bằng Node:

- **Ai ngã** (`timeline.ts`): trong giai đoạn `fight` của khối đánh gần, người ngã là người đứng đầu một hàng dọc; trong mỗi hàng dọc người ngã lần lượt từ trước ra sau. Giai đoạn khác giữ cách chọn cũ.
- **Người sau bước lên:** vị trí trong hàng dọc tính theo số người phía trước còn đứng, làm mượt 1,5 giây sau mỗi người ngã. Là hàm của thời gian, nên tua được.
- **Xếp lại ở mỗi mốc:** người còn đứng được chia vào hàng dọc mới theo vị trí ngang, trong mỗi hàng xếp theo thứ tự trước sau cũ (trước đây xếp theo số thứ tự, làm người hàng sau đổi chỗ với người hàng trước).
- **Ghép cặp** (`melee.ts`, mỗi khung): người đầu hàng dọc của khối đánh gần đang `fight` tìm người đầu hàng địch gần nhất trong tầm và trong góc trước mặt. Hai người chọn nhau thì bước lại tới khoảng cách đấu và quay mặt vào nhau; người thừa đánh kèm.
- **Nhịp đánh:** mỗi người bị đánh theo nhịp riêng, chu kỳ 2,4 giây phát. Người sắp ngã có nhịp neo vào đúng lúc ngã, nên nhát cuối của đối thủ rơi đúng lúc đó. Người đánh phát `attack` một lần mỗi chu kỳ, canh cho lúc đòn chạm (đo từ clip) trùng nhịp của đối thủ; phần còn lại của chu kỳ đứng thủ (`idle`).
- **Không có đối thủ trong tầm thì không đánh.**
- Trạng thái làm mượt theo từng hình (độ dời, góc quay) đặt lại khi tua, như phần đi xiên.

### Trang thử

`/battle-lab?duel=1`: trận nhỏ dựng từ trận đang chọn (cùng địa hình), vài cặp khối đối mặt: tiến, chạm, đánh, bị đẩy lùi.

## Xong khi

- Cannae: ở giai đoạn 4–6, người đầu hàng của các khối đánh gần có đối thủ trong tầm (đo bằng script, ghi số vào đây).
- Không khối nào đánh vào khoảng không; người ngã trong khối đang đánh là người đầu hàng, ngã đúng lúc đòn chạm.
- Tua tới cùng một thời điểm ra cùng người đứng, người ngã.
- Tốc độ khung hình không thấp hơn `main` khi đo xen kẽ.
- `npm run lint`, `npm run validate`, `npm run build` qua; hồi quy lõi qua.
- Hộp thoại Giới thiệu có câu: các cặp đấu là minh hoạ, một hình bằng 20 người.
- `docs/ARCHITECTURE.md` (mục "Giáp lá cà"), `docs/data/battles/cannae.md` cập nhật.

## Tiến độ

- 2026-11-18: đo vấn đề, chốt thiết kế, mở nhánh.
