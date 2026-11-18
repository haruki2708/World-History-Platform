# T-041: Cảnh mẫu đồ hoạ theo ảnh người dùng gửi

- **Ai làm:** phiên chính.
- **Model:** Fable 5.2.
- **Nhánh:** `batch-i/look-sample`, xếp chồng lên `batch-h/stage3-vegetation` (chặng 3) và `batch-h/stage2-structures` (chặng 2); cả hai chưa gộp, người dùng chọn giữ làm nền. Làm ở worktree `E:\World_History_Platform_assets\wt-stage3`, `next dev` cổng 3106.
- **Trạng thái:** bản cắt đầu tiên xong, chờ người dùng xem và nói có đúng hướng không. **Chưa phải cảnh mẫu hoàn chỉnh** (xem "Chưa làm").
- **Phạm vi file:** `src/components/battle/`, `src/app/battle-lab/`, `src/data/battles/`, `public/battles/textures/`, `art/CREDITS.md`, `docs/`.

File này vừa là đề bài vừa là nhật ký: phiên nào làm tiếp thì đọc mục "Kết quả" ở cuối trước.

## Vấn đề

Ngày 2026-11-18 người dùng gửi năm ảnh mẫu ở `E:\World_History_Platform_assets\ảnh` (ảnh chụp một game chiến thuật thời cổ) và nói: "tôi muốn đồ hoạ như thế, cận cảnh đánh nhau cũng như thế... phương án hiện giờ đồ hoạ hơi xấu". Trước đó họ đã chê trại "như khối đá" và lính "như hình khối".

Những gì ảnh mẫu có mà cảnh của ta chưa có: màu tươi đậm, nắng gắt, bóng rõ; mặt đất phủ bụi cỏ có hình, có hoa; lính to, chất liệu vẽ đậm, màu phe rõ, mỗi người một tư thế; giáp lá cà là đám đông hỗn chiến, lao bay; cây và công trình là mô hình có chất liệu; nước xanh thẫm lấp lánh nắng, có bọt ở bờ.

**Người dùng chọn (2026-11-18):**

- Làm một cảnh mẫu nhỏ trước, duyệt rồi mới áp dụng ra cả trận.
- Mặt đất **xanh tươi như ảnh mẫu**, dù trận Cannae đánh giữa hè trên ruộng đã gặt. Hộp thoại Giới thiệu sẽ phải nói rõ điều này.
- Được dùng mô hình và chất liệu giấy phép mở (CC0), có ghi công.
- Hai nhánh chặng 2 và 3 giữ làm nền, chưa gộp.

## Xong khi

Người dùng xem cảnh mẫu và nói nó đạt chuẩn ảnh mẫu, hoặc nói rõ còn thiếu gì.

## Kết quả

Bản cắt đầu tiên, 2026-11-18.

### Xem ở đâu

- Bộ binh giáp mặt: `http://localhost:3106/battle-lab?lang=vi&t=3.6&cam=-320,-310,36,16,230`
- Kỵ binh bên sông: `http://localhost:3106/battle-lab?lang=vi&t=2.9&cam=-1250,130,150,14,110`

`/battle-lab` nhận thêm hai tham số: `t` (thời điểm của trận) và `cam=x,y,khoảng cách,độ cao,phương vị` (góc nhìn lúc mở). Chỉ trang này đọc `cam`.

### Đã làm

- **Màu và ánh sáng** (`engine/grade.ts`, `sky.ts`): đường cong màu riêng của cảnh thay cho ACES của three.js (màu đậm hơn 16%, tương phản hơn một chút); nắng mạnh hơn, trời xanh hơn, sương mù lùi xa. Lần thử đầu đặt độ đậm 1,38 thì màu chói như neon và bóng đen kịt; đã hạ xuống.
- **Mặt đất xanh có chất liệu thật** (`terrain.ts`): Cannae đổi `ground.cover` từ `stubble` sang `grass` (không còn ô ruộng); bảng màu cỏ xanh; một ảnh chụp cỏ (ambientCG `Grass001`, CC0) lặp trên mặt đất ở hai cỡ để tạo vân.
- **Bụi cỏ có hình** (`engine/grass.ts`): 42 000 bụi cỏ quanh camera trong bán kính 145 m, là một lưới dựng sẵn mà shader dời theo camera; mỗi bụi là ba tấm lá đứng chéo, sẫm ở gốc, sáng ở ngọn, đung đưa theo gió; khoảng 4% có hoa trắng, vàng hoặc tím. Không mọc trên biển và trong lòng sông. Camera lên cao quá 900 m thì ẩn.
- **Lính chi tiết hiện từ xa hơn**: ngưỡng mức chi tiết cao nhất hạ từ 110 xuống 58 điểm ảnh, mức giữa từ 32 xuống 17. Đây là "bước 1" trong các phương án nâng cấp lính người dùng đã chọn.
- **Tán cây sáng hơn**: màu lá tươi hơn, chiếu sáng đều từ trên xuống để không mặt nào của tán bị đen.

### Chưa làm (so với ảnh mẫu)

- **Giáp lá cà vẫn ngay hàng thẳng lối**: lính đứng theo hàng, cùng một dáng; ảnh mẫu là đám đông chen nhau, mỗi người một tư thế, lao bay. Đây là khác biệt lớn nhất còn lại.
- **Chất liệu lính chưa tô lại**; mọi người lính vẫn là bản sao.
- **Lều, nhà, cây vẫn là hình dựng bằng code**, chưa thay bằng mô hình có chất liệu.
- **Nước** chưa có vệt nắng lấp lánh trên biển, sóng và bọt bờ.
- Mảng màu đỏ nâu dưới chân các khối quân (màu phe vẽ trên đất) trông như đất trống; chưa quyết giữ hay bỏ.
- Xa ngoài vòng bụi cỏ, mặt đất là màu phẳng; chỗ chuyển tiếp còn thấy được.
- Chưa có đá, vách đá có vân, thú vật.
- **Chưa đo hiệu năng một cách đầy đủ**; chặng 3 (cây) trước đó đã làm cảnh chậm dưới mục tiêu và lần đo lại sau khi tối ưu bị ngắt. Bụi cỏ và lính chi tiết hơn sẽ tốn thêm.
- Chưa xem ban đêm, hoàng hôn, mức chất lượng thấp.
- Dữ liệu Cannae: ghi chú căn cứ của `ground` vẫn là câu về ruộng đã gặt; phải viết lại cho lớp phủ `grass` (trái mùa, theo lựa chọn của người dùng) trước khi gộp. Hộp thoại Giới thiệu cũng chưa nói điều này.
