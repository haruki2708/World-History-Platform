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

(Phiên chính điền khi xong.)
