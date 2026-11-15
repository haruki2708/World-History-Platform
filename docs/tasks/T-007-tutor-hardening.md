# T-007: Gia cố route của gia sư AI

- **Lane:** 2
- **Nhánh:** `lane2/T-007-tutor-hardening` (đã tạo sẵn từ `main`)
- **Phạm vi file:** `src/app/api/tutor/`, `src/server/tutor/`, `.env.example` (chỉ thêm biến mới)

## Mục tiêu

Chuẩn bị route `/api/tutor` cho ngày được đưa ra Internet: không ai tiêu quá nhiều tiền của tài khoản API, và câu trả lời chế độ sâu (suy nghĩ lâu) không làm đứt kết nối.

## Hiện trạng

- Route từ T-005 đã chạy và đã gộp. Đọc lại mục "AI tutor" trong `docs/ARCHITECTURE.md`.
- Phiên chính vừa thêm vào hợp đồng (`src/lib/tutor.ts`):
  - mã lỗi `limit_reached` (HTTP 429): người dùng hoặc cả app đã hết lượt hỏi, thử lại ngay cũng không được. Khung chat và chuỗi song ngữ đã có sẵn;
  - sự kiện `{ type: "ping" }`: không mang dữ liệu, khung chat bỏ qua.
- Tài khoản API vẫn **chưa có tiền**. Làm và kiểm tra bằng chế độ giả lập cùng máy chủ Claude giả trong `src/server/tutor/tools/`.
- Chưa deploy. Trước mắt route chạy trên một máy (một tiến trình).

## Yêu cầu

1. **Giới hạn theo người dùng**, nhận diện bằng IP: lấy từ `x-forwarded-for` (phần tử đầu) hoặc `x-real-ip`; không có thì coi là một người dùng chung "local".
   - Theo phút (mặc định 6 câu hỏi mỗi phút) → `rate_limited`.
   - Theo ngày (mặc định 100 câu hỏi mỗi ngày, tính theo ngày UTC) → `limit_reached`.
2. **Trần chi phí mỗi ngày cho cả app** (mặc định 5 USD): sau mỗi câu trả lời, ước tính chi phí từ `usage` (đầu vào, ghi cache, đọc cache, đầu ra) theo bảng giá của `claude-opus-5-5`, lấy từ skill `claude-api`. Khi tổng trong ngày UTC vượt trần thì mọi câu hỏi mới nhận `limit_reached` cho tới hết ngày. Ghi chi phí ước tính của từng câu vào dòng log `[tutor] response finished`.
3. **Cấu hình bằng biến môi trường**, có mặc định hợp lý, thêm vào `.env.example` kèm chú thích: số câu mỗi phút, số câu mỗi ngày, trần USD mỗi ngày. Giá trị sai hoặc thiếu thì dùng mặc định và ghi cảnh báo vào log.
4. **Lưu đếm trong bộ nhớ** của tiến trình là đủ cho bây giờ. Đặt sau một interface nhỏ, để giai đoạn deploy có thể thay bằng kho dùng chung (ví dụ Redis) mà không sửa logic. Nêu rõ giới hạn này trong mục "Kết quả".
5. **Chỉ nhận yêu cầu từ chính app:** nếu có header `Origin` mà khác host của route thì trả `bad_request` (HTTP 403 là hợp lệ, nhưng thân phản hồi vẫn theo hợp đồng). Yêu cầu không có `Origin` (ví dụ `curl`) vẫn được nhận, giới hạn ở trên lo phần đó.
6. **Bắt đầu phản hồi sớm và giữ kết nối:**
   - Chờ tối đa khoảng 2 giây cho sự kiện đầu tiên từ Claude. Lỗi đến trong khoảng đó (thiếu tiền, sai khoá, quá tải...) vẫn trả với mã HTTP đúng như hiện nay.
   - Quá 2 giây mà chưa có chữ: bắt đầu phản hồi 200 bằng một `ping`, rồi gửi `ping` khoảng mỗi 15 giây cho tới khi có chữ. Lỗi sau đó đi trong luồng 200.
   - Thêm `export const maxDuration` trong `route.ts` (300 giây) cho lúc deploy.
7. **Chế độ giả lập** chịu cùng các giới hạn, để kiểm tra được. Thêm thẻ để giả lập một câu trả lời suy nghĩ lâu (ví dụ `#slow`, chờ khoảng 20 giây trước chữ đầu tiên), nhờ đó thấy được `ping`.
8. **Câu hỏi bị chặn** (giới hạn, Origin, đầu vào sai) không được gọi Claude API và không bị tính vào trần chi phí. Câu hỏi bị chặn vì giới hạn thì không tính vào lượt.
9. Cập nhật bộ tự kiểm tra (`npm run tutor:check`) cho các phần mới: giới hạn phút và ngày, trần chi phí (dùng máy chủ giả trả `usage` lớn), Origin, `ping` và mã HTTP khi lỗi đến sớm hay muộn.

## Ràng buộc

- Không sửa `src/lib/tutor.ts`. Hợp đồng chưa đủ dùng thì ghi đề nghị vào mục "Kết quả".
- Không thêm thư viện.
- Không gọi Claude API thật. Khoá API không bao giờ xuất hiện trong code, commit, log hay báo cáo.

## Xong khi

- `npm run tutor:check` qua với các mục mới.
- Thử bằng `curl` ở chế độ giả lập: vượt giới hạn phút ra `rate_limited` 429, vượt giới hạn ngày ra `limit_reached` 429, Origin lạ bị từ chối, `#slow` cho thấy `ping` trước chữ.
- `npm run lint` và `npm run build` qua.

## Kết quả

_(Lane 2 điền khi xong.)_
