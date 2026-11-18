# T-043: Giáp lá cà hỗn chiến (hàng sau chen lấn, lao bay)

- **Ai làm:** phiên chính.
- **Model:** Fable 5.2.
- **Nhánh:** `batch-i/look-sample`, worktree `E:\World_History_Platform_assets\wt-stage3`, `next dev` cổng 3106.
- **Trạng thái:** người dùng xem khi phát và duyệt (2026-11-18): "tôi đã xem rồi, ưng ý với tôi đấy". Chưa gộp; còn nợ một câu trong hộp thoại Giới thiệu (xem "Mức căn cứ").
- **Phạm vi file:** `src/components/battle/engine/` (`units.ts`, `missiles.ts`, `timeline.ts`), `docs/`.

File này vừa là đề bài vừa là nhật ký: phiên nào làm tiếp thì đọc mục "Kết quả" trước.

## Vấn đề

Sau khi lính và ngựa đạt (T-041, ánh sáng bù), người dùng chọn việc tiếp theo của cảnh mẫu là **giáp lá cà hỗn chiến** (2026-11-18). Khác biệt lớn nhất còn lại so với ảnh mẫu: trong khối đang đánh, chỉ hàng đầu đấu từng cặp (đợt G), mọi người phía sau đứng nghiêm theo ô lưới, cùng một dáng, cùng một hướng. Ảnh mẫu là đám đông chen nhau, mỗi người một tư thế, lao bay trên đầu.

## Xong khi

Người dùng xem cảnh giáp lá cà và nói nó đạt, hoặc nói rõ còn thiếu gì.

## Kết quả

Bản cắt đầu tiên, 2026-11-18.

### Xem ở đâu

Bấm **Phát** để thấy chuyển động; ảnh đứng yên chỉ thấy hàng ngũ xô lệch.

- Bộ binh giáp mặt, nhìn gần: `http://localhost:3106/battle-lab?lang=vi&t=3.6&cam=-320,-310,36,16,230`
- Cùng chỗ, nhìn từ trên: `http://localhost:3106/battle-lab?lang=vi&t=3.6&cam=-330,-330,110,40,200`
- Lính nhẹ ném lao và bắn đá (giai đoạn 2): `http://localhost:3106/battle-lab?lang=vi&t=1.7&cam=-350,30,50,12,60`

### Đã làm

**Hàng sau chen lấn** (`units.ts`, các hằng `PRESS_*`). Trong khối có hành động `fight`, người không có đối thủ riêng:

- xê dịch quanh chỗ của mình, tối đa 0,3 lần khoảng trống mỗi người có trong khối (không quá 2,4 m), và xoay người theo, tối đa khoảng 30°. Mạnh nhất ở hai hàng ngay sau hàng đầu, yếu dần về phía sau (còn 0,4 lần từ hàng thứ tám);
- cứ 5 đến 11 giây phát một lần thì có thể đâm với qua người đứng trước (clip `attack`) hoặc giơ khiên (clip `block`): hàng ngay sau hàng đầu đâm 50% số lượt, hàng kế 35%; giơ khiên 20% số lượt;
- người đầu hàng dọc mà không có địch trong tầm thì không đâm vào không khí (giữ quy tắc của đợt G), chỉ xê dịch.

**Lao bay** (`missiles.ts`, lớp `Missiles`; các hằng `MISSILE_SPEED`, `RANGE_*` trong `units.ts`):

- Khối có hành động `skirmish` trước đây chỉ vung tay, không có gì bay ra. Nay mỗi lần vung tay, đúng lúc đòn của clip `attack` chạm, một cây lao rời tay (lính bắn đá Baleares: một viên đá) và bay theo đường cong tới chỗ khối địch gần nhất phía trước, từ 25 đến 110 m, mỗi lần lệch xa gần và trái phải một chút.
- Trong khối `fight`, từ hàng thứ tư trở về sau, 22% số lượt "đâm" là một cây lao ném qua đầu các hàng trước, rơi xuống sau hàng đầu của địch 6 đến 28 m. Chỉ bộ binh; kỵ binh và lính bắn đá không ném.
- Lao dài 5,4 m (hình lính vẽ to gấp ba, lao cũng vậy), bay mũi về trước. Tối đa 1 536 lao và 1 536 đá cùng lúc.

**Cách tính.** Mọi thứ suy ra từ đồng hồ trận và số ngẫu nhiên cố định của từng hình lính, không lưu trạng thái: tua tới một thời điểm cho đúng cảnh như khi phát tới đó. Riêng lao của khối `skirmish` theo đồng hồ thật, vì clip vung tay của họ lặp theo đồng hồ thật trong shader. Khi dừng phát, lao đứng yên giữa không trung cùng với cảnh.

`UnitTrack.before` (số người còn đứng trước mỗi người trong hàng dọc) trước là biến riêng của `timeline.ts`, nay để công khai cho `units.ts` đọc.

### Mức căn cứ

Phần này vẽ cho giống một trận đánh, **không lấy từ tư liệu**: không nguồn nào tả từng người ở hàng sau làm gì. Riêng việc hàng sau ném lao qua đầu hàng trước trong lúc giáp lá cà là điều các nhà nghiên cứu còn bàn; ở đây áp dụng cho mọi loại bộ binh của cả hai bên, kể cả những loại không rõ có mang lao hay không. Hộp thoại Giới thiệu nói điều này trong dòng `about.accuracy.battle.duels` (viết lại 2026-11-19, chờ người dùng duyệt câu chữ cùng lúc duyệt gộp).

### Chưa làm, còn thấy được

- **Mật độ.** Một hình lính thay cho 20 người, nên các hình đứng cách nhau 6 đến 10 m: không thành đám đông vai kề vai như ảnh mẫu. Muốn dày hơn phải đổi cách dàn hình trong khối đang đánh (dồn về phía trước) hoặc đổi tỉ lệ 1:20.
- **Tư thế.** Vẫn chỉ có các clip sẵn có (`idle`, `attack`, `block`, `hit`). Chưa có clip hò hét, xô đẩy, ném lao riêng: người ném dùng động tác đâm.
- Hai hàng ngay sau một hàng đầu **không có địch trong tầm** vẫn đâm với lên.
- Lao rơi xuống thì biến mất: không cắm lại trên đất hay trên khiên, người bị nhắm không phản ứng.
- Chưa xem ở mức chất lượng thấp và trên điện thoại.

### Kiểm tra

Commit 6fec471, bản production dựng ở worktree tạm:

- `npm run lint`, `npm run validate`, `next build` qua.
- Hồi quy lõi (`main-tools/reg-core.js`): 17/17, không lỗi console.
- Số khung hình mỗi giây, hai lượt `s-perf3.mjs` (lúc mở; phát giai đoạn 3; giai đoạn 4): 78,7; 51,9; 55,4 và 90,9; 62,0; 55,3. Lượt đo ngay trước thay đổi này (T-041, một lượt): 90,9; 65,4; 60,3. Tức giai đoạn 4, lúc giáp lá cà đông nhất, chậm đi khoảng 5 khung hình mỗi giây (60 xuống 55), vẫn trên mục tiêu 50. Chưa đo xen kẽ và chưa tách phần của xê dịch (bốn, năm phép lượng giác mỗi hình lính mỗi khung) với phần của lao.
- Xem bằng ảnh chụp ở cổng 3106 (`E:\World_History_Platform_assets\main-tools\shots\press1-side.png`, `press1-high.png`, `press2-inf.png`, `press2-skirmlow.png`): hàng ngũ xô lệch, người xoay nhiều hướng, lao và đá hiện trên trời. **Chuyển động khi phát chưa ai xem bằng mắt**: phiên chính chỉ xem ảnh tĩnh.
