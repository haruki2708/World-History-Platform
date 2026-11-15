# T-011: Server tạo nút "xem trên bản đồ" từ câu trả lời của Claude

- **Lane:** 2 (làm sau T-009)
- **Nhánh:** tạo từ `main` khi bắt đầu: `lane2/T-011-tutor-map-links-server`
- **Phạm vi file:** `src/server/tutor/`, `src/app/api/tutor/`

## Mục tiêu

Khi gọi Claude thật, câu trả lời của gia sư kèm tối đa 3 nút đưa người dùng tới các sự kiện hay năm được nhắc tới. Khung chat (T-010, lane 1) đã hiển thị và xử lý các nút này.

## Hiện trạng

- Hợp đồng: sự kiện `{ type: "map_link", link: TutorMapLink }` trong `src/lib/tutor.ts`. Đọc kỹ chú thích về những gì server phải bảo đảm.
- Chế độ giả lập đã gửi nút mẫu (phiên chính làm, xem `mockMapLinks` trong `mock.ts`), và bộ tự kiểm tra đã có mục cho phần đó.
- Đường gọi thật (`claude.ts`) chưa tạo nút nào.
- Tài khoản API vẫn chưa có tiền: kiểm tra bằng máy chủ Claude giả trong `tools/`.

## Cách làm đã chốt

Chỉ một lần gọi API, **không dùng tool use** (vòng lặp công cụ tốn thêm một lượt gọi, thêm thời gian và tiền). Model chèn ký hiệu vào câu trả lời theo hướng dẫn trong system prompt; server tách ký hiệu ra khỏi luồng chữ và gửi `map_link`.

## Yêu cầu

1. **Ký hiệu:** lane chọn cú pháp, ngắn và khó trùng với chữ thường, ví dụ `[[map:-216:battle-of-cannae]]` và `[[map:-218]]`. Hướng dẫn model trong `prompt.ts`:
   - chỉ tạo nút khi câu trả lời nhắc tới một sự kiện hay một năm cụ thể mà người dùng có thể muốn xem trên bản đồ;
   - chỉ dùng id sự kiện có trong dữ liệu tham chiếu; tối đa 3 nút; đặt ký hiệu ở cuối câu trả lời;
   - không tạo nút trỏ đúng vào năm và sự kiện người dùng đang xem.
   Thêm hướng dẫn vào phần prompt cố định để không làm hỏng cache.
2. **Tách ký hiệu khi stream:** ký hiệu có thể bị cắt giữa hai mẩu chữ, nên phải giữ lại phần chữ có thể là đầu một ký hiệu cho tới khi biết chắc. Chữ gửi đi không bao giờ chứa ký hiệu, và không để lại dòng trống thừa ở cuối câu trả lời.
3. **Kiểm tra từng nút** trước khi gửi: sự kiện phải có trong dữ liệu; năm trong phạm vi; nếu có sự kiện mà năm nằm ngoài các năm của sự kiện thì dùng năm bắt đầu của sự kiện; bỏ nút trùng; tối đa `TUTOR_LIMITS.maxMapLinks`. Ký hiệu sai thì bỏ đi lặng lẽ (ghi số lượng vào log, không ghi nội dung câu trả lời).
4. **Lịch sử:** câu trả lời mà khung chat gửi lại ở các lượt sau không có ký hiệu. Không cần làm gì thêm, nhưng kiểm tra prompt vẫn tất định.
5. **Bộ tự kiểm tra:** thêm các trường hợp: ký hiệu bị cắt giữa hai mẩu chữ, ký hiệu sai cú pháp, sự kiện không tồn tại, năm ngoài phạm vi, quá 3 nút, nút trùng, ký hiệu nằm giữa đoạn văn, câu trả lời không có ký hiệu nào, và dấu `[[` trong chữ bình thường không phải ký hiệu.

## Ràng buộc

- Không sửa `src/lib/tutor.ts`. Hợp đồng chưa đủ dùng thì ghi đề nghị vào mục "Kết quả".
- Không thêm thư viện. Không gọi Claude API thật.

## Xong khi

- `npm run tutor:check` qua với các mục mới.
- Với máy chủ Claude giả trả câu có ký hiệu: khung chat (đã gộp T-010) hiện đúng nút, chữ không còn ký hiệu.
- `npm run lint` và `npm run build` qua.

## Kết quả

_(Lane 2 điền khi xong.)_
