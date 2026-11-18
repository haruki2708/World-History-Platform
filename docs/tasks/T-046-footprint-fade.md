# T-046: Mảng màu phe dưới chân khối quân mờ đi khi nhìn gần

- **Ai làm:** phiên chính (việc nhỏ: dựng một lane lên tốn hơn chính việc sửa).
- **Nhánh:** `batch-j/footprint-fade` (tạo từ `main`)
- **Phạm vi file:** `src/components/battle/engine/units.ts`; tài liệu.

## Vấn đề

Mỗi khối quân có một mảng màu phe trải trên mặt đất (`UnitBlock.footprint`), để nhìn từ xa vẫn đọc ra đội hình khi hình lính chỉ còn là chấm. `setFootprintLook` cho mảng màu đậm lên khi hình lính gần nhất của khối nhỏ đi (từ 18 xuống 5 điểm ảnh). Nhưng khi nhìn gần, độ đục vẫn còn 0,1: dưới chân lính hiện một lớp đỏ nâu, trông như đất trống (ghi ở T-041, mục "Chưa làm").

Phiên chính thử (2026-11-19): tắt mảng màu ở góc nhìn cận cảnh đã duyệt thì dưới chân lính chỉ còn các đốm đất trần của mặt đất, như ở mọi chỗ khác. Ảnh ở `main-tools/shots/c1-fp-A-with.png` và `c1-fp-B-without.png`.

## Người dùng chọn (2026-11-19)

Giữ mảng màu như hiện tại khi nhìn từ xa, vì nó giúp thấy rõ đội hình; mờ dần rồi mất hẳn khi camera hạ thấp, như mũi tên đang làm.

## Xong khi

- Ở các góc cận cảnh đã duyệt, không còn lớp màu phe dưới chân lính.
- Ở góc nhìn mở và góc nhìn cao (ví dụ toàn cảnh lúc 17:00), mảng màu như trước.
- Không có lượt vẽ thừa cho mảng màu đã mờ hẳn.
- `npm run lint`, `npm run build` qua; hồi quy lõi qua; ảnh trước và sau ở `E:\World_History_Platform_assets\duyet\T-046\`.

## Kết quả

Xong 2026-11-19 trên nhánh `batch-j/footprint-fade`.

**Đã làm** (`setFootprintLook` trong `src/components/battle/engine/units.ts`): độ đục của vùng màu đổi từ `0,1 + 0,42 × xa` thành `0,52 × xa`, với `xa` như cũ (1 khi hình lính gần nhất của khối cao dưới 5 điểm ảnh, 0 khi cao từ 18 điểm ảnh). Ở xa vùng màu đục như trước (0,52); ở gần nó mất hẳn, và mesh được ẩn (`visible = false`) nên không tốn lượt vẽ. Hàm chạy sau `update` trong cùng khung hình, nên việc ẩn có hiệu lực cho khung vẽ ngay sau đó; khung kế tiếp `updateFootprint` bật lại theo số người còn đứng rồi hàm này quyết lại.

**Kiểm tra:**
- `eslint`, `npm run validate`, `npm run build` (ở worktree riêng) qua.
- Hồi quy lõi trên bản production của nhánh (cổng 3108): 17/17, console sạch.
- Ảnh trước và sau, cùng góc, ở `E:\World_History_Platform_assets\duyet\T-046\`:
  - cận cảnh lúc 10:30, cả xuôi lẫn ngược nắng: lớp đỏ nâu dưới chân lính mất, chỉ còn đốm đất trần của mặt đất;
  - tầm trung (trại lớn lúc 5:30): không đổi thấy được, vì trước đó vùng màu chỉ còn 0,1;
  - toàn cảnh lúc 17:00 và góc mở trận: vùng màu như cũ.
- Số lượt vẽ ở góc cận cảnh: 83 xuống 73 (10 vùng màu không còn vẽ).

**Còn lại:** độ mờ vẫn tính theo cả khối (theo hình lính gần nhất của khối), không theo từng điểm trên mặt đất: một khối dài nhìn từ một đầu thì cả vùng màu mờ, kể cả đầu xa. Chưa thấy chỗ nào cần sửa.
