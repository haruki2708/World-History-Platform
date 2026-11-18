# T-041: Cảnh mẫu đồ hoạ theo ảnh người dùng gửi

- **Ai làm:** phiên chính.
- **Model:** Fable 5.2.
- **Nhánh:** `batch-i/look-sample`, xếp chồng lên `batch-h/stage3-vegetation` (chặng 3) và `batch-h/stage2-structures` (chặng 2); cả hai chưa gộp, người dùng chọn giữ làm nền. Làm ở worktree `E:\World_History_Platform_assets\wt-stage3`, `next dev` cổng 3106.
- **Trạng thái:** người dùng đã xem bản cắt đầu tiên: góc quay và khung cảnh đạt, lính và ngựa chưa đạt ("ps1"). Đã thêm ánh sáng bù cho hình lính (mục cùng tên bên dưới), **chờ người dùng xem lại**. **Chưa phải cảnh mẫu hoàn chỉnh** (xem "Chưa làm").
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

### Ánh sáng bù cho hình lính (2026-11-18, sau T-042)

Người dùng xem ảnh so sánh mô hình của [T-042](T-042-model-upgrade.md) và chọn **sửa ánh sáng lính trong cảnh trước, giữ mô hình cũ**.

**Vì sao.** Cùng một mô hình, nhìn từ phía có nắng thì ổn, nhìn từ phía khuất nắng thì người và ngựa thành một khối đỏ sẫm, phẳng. Mặt khuất chỉ nhận ánh sáng trời đều mọi hướng nên không còn hình khối, và đường cong màu của cảnh ép tông tối xuống thêm.

**Đã làm** (`engine/sky.ts`: `Sky.fill`; `engine/figures/material.ts`: `figFill`). Chỉ hình lính nhận thêm bốn nguồn sáng, cộng vào ánh sáng gián tiếp của cả hai vật liệu (Lambert và vật liệu chi tiết); mặt đất, cây, công trình không đổi:

| Nguồn | Từ đâu tới | Mức |
|---|---|---|
| Trời | Từ trên xuống | 0,9 lần ánh sáng trời của cảnh |
| Đất hắt lên | Từ dưới lên | Nắng nhân độ phản xạ của mặt đất (0,20; 0,21; 0,13) và sin độ cao mặt trời |
| Đèn phụ | Từ phía đối diện mặt trời, cao 25°, không đổ bóng | 1,0 lần ánh sáng trời; tạo hình khối cho mặt khuất |
| Nắng lọt | Theo hướng nắng, không bị bóng che | 0,22 lần nắng: người đứng trong bóng của người bên cạnh không tối sầm |

Cả bốn nguồn tắt dần khi mặt trời xuống dưới 10° và bằng 0 từ −4° (ban đêm không có). Các hệ số nằm ở `FILL`, `FILL_GROUND`, `KICK_ELEVATION` trong `sky.ts`.

**Xem ở đâu** (cổng 3106):

- Bộ binh, phía khuất nắng (góc người dùng đã xem): `http://localhost:3106/battle-lab?lang=vi&t=3.6&cam=-320,-310,36,16,230`
- Bộ binh, phía có nắng: `http://localhost:3106/battle-lab?lang=vi&t=3.6&cam=-320,-310,30,14,50`
- Kỵ binh, phía khuất nắng: `http://localhost:3106/battle-lab?lang=vi&t=2.9&cam=-1250,130,40,12,110`
- Kỵ binh, phía có nắng: `http://localhost:3106/battle-lab?lang=vi&t=2.9&cam=-1250,130,34,12,290`

Ảnh chụp trước và sau (không lưu trong repo), ở `E:\World_History_Platform_assets\main-tools\shots\`: trước là `now-inf.png`, `now-cav.png`, `now-infsun.png`, `now-cavsun.png`; sau là `fill1-inf.png`, `fill1-cav.png`, `fill1-infsun.png`, `fill1-cavsun.png`; mức chất lượng thấp sau khi sửa: `fill1low-inf.png`.

**Kết quả nhìn bằng mắt.** Mặt khuất nắng: áo đỏ đọc được là đỏ tươi và có hình khối, ngựa có màu lông thay vì khối sẫm. Mặt có nắng: sáng hơn một chút, áo trắng của velites chưa cháy sáng.

**Chưa kiểm:** hiệu năng (thêm vài phép tính mỗi điểm ảnh của hình lính; chưa đo), hoàng hôn và ban đêm (trận Cannae không có giờ đó trên thanh thời gian).

### Chưa làm (so với ảnh mẫu)

- **Giáp lá cà vẫn ngay hàng thẳng lối**: lính đứng theo hàng, cùng một dáng; ảnh mẫu là đám đông chen nhau, mỗi người một tư thế, lao bay. Đây là khác biệt lớn nhất còn lại.
- **Chất liệu lính chưa tô lại**; mọi người lính vẫn là bản sao.
- **Lều, nhà, cây vẫn là hình dựng bằng code**, chưa thay bằng mô hình có chất liệu.
- **Nước** chưa có vệt nắng lấp lánh trên biển, sóng và bọt bờ.
- Mảng màu đỏ nâu dưới chân các khối quân (màu phe vẽ trên đất) trông như đất trống; chưa quyết giữ hay bỏ.
- Xa ngoài vòng bụi cỏ, mặt đất là màu phẳng; chỗ chuyển tiếp còn thấy được.
- Chưa có đá, vách đá có vân, thú vật.
- **Hiệu năng sát hoặc dưới mục tiêu.** Đo ba lượt trên bản production của nhánh (commit da78f73, s-perf3.mjs, RTX 3050, không có Blender chạy): đứng yên lúc mở 72,5 / 74,3 / 72,5 khung hình mỗi giây; phát giai đoạn 3: 54,5 / 51,8 / 46,4; phát giai đoạn 4: 50,6 / 44,6 / 53,0. Trung bình khoảng 51 và 49, mục tiêu là 50; main cùng ngày đạt khoảng 59 và 55, lúc mở 94. Không đo xen kẽ với main lần này, và chưa tách phần của cây, của bụi cỏ và của lính chi tiết hơn. Phải lấy lại hiệu năng trước khi áp dụng ra cả trận.
- Chưa xem ban đêm, hoàng hôn, mức chất lượng thấp.
- Dữ liệu Cannae: ghi chú căn cứ của `ground` vẫn là câu về ruộng đã gặt; phải viết lại cho lớp phủ `grass` (trái mùa, theo lựa chọn của người dùng) trước khi gộp. Hộp thoại Giới thiệu cũng chưa nói điều này.
