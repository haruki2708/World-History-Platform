# T-006: Khung chat của gia sư AI

- **Lane:** 1
- **Nhánh:** `lane1/T-006-tutor-chat` (đã tạo sẵn từ `main`)
- **Phạm vi file:** `src/components/tutor/`, khoá `tutor.*` trong `src/lib/i18n/messages.ts`

## Mục tiêu

Thay khung tutor tạm bằng khung chat thật: người dùng hỏi về những gì đang xem, câu trả lời hiện ra dần khi được stream về. Lane 2 làm route `/api/tutor` song song (T-005) dựa trên cùng hợp đồng.

## Hiện trạng

- Hợp đồng nằm ở `src/lib/tutor.ts`; mô tả ở `docs/ARCHITECTURE.md`, mục "AI tutor". Đọc kỹ cả hai trước khi làm.
- `TutorPanel.tsx` hiện chỉ in ra ngữ cảnh lấy từ store (năm, sự kiện đang chọn, vùng bản đồ). Hãy giữ ý này dưới dạng gọn hơn trong khung chat mới.
- Trên màn rộng khung tutor chiếm nửa dưới panel bên; trên màn hẹp nó là tab "Gia sư AI" (xem `AppShell.tsx`).
- **Route `/api/tutor` chưa có** cho tới khi lane 2 xong. Trong lúc chờ, hãy viết một hàm giả lập phía trình duyệt, theo đúng hợp đồng, để phát triển giao diện. Hàm này chỉ dùng khi phát triển và phải dễ gỡ. Khi T-005 đã gộp, phiên chính sẽ nối hai phần với nhau.

## Yêu cầu

1. **Gửi câu hỏi:** ô nhập nhiều dòng (Enter gửi, Shift+Enter xuống dòng), nút gửi, giới hạn `TUTOR_LIMITS.maxQuestionChars`. Mỗi tin nhắn của người dùng lưu kèm `context` chụp từ store **lúc gửi**; các tin nhắn cũ cùng `context` của chúng được gửi lại nguyên vẹn ở các lần sau.
2. **Hiển thị câu trả lời** dần dần theo các sự kiện `text`. Câu trả lời chỉ có đoạn văn và dòng gạch đầu dòng `- `: hiển thị đúng hai kiểu này, không cần thư viện markdown. Không dùng `dangerouslySetInnerHTML`.
3. **Dừng:** trong lúc đang trả lời, nút gửi thành nút dừng, huỷ yêu cầu bằng `AbortController`. Phần đã nhận được giữ lại và đánh dấu là bị dừng.
4. **Ngữ cảnh:** phía trên ô nhập hiện gọn những gì sẽ được gửi kèm (năm, sự kiện đang chọn nếu có). Mỗi câu hỏi đã gửi hiện kèm năm của nó, để người dùng biết câu hỏi đó được hỏi khi đang xem năm nào.
5. **Câu hỏi gợi ý** khi chưa có cuộc trò chuyện, song ngữ, dựa theo ngữ cảnh. Ví dụ: "Chuyện gì đang xảy ra ở đây?", "Vì sao [sự kiện đang chọn] quan trọng?", "Ai là những nhân vật chính lúc này?".
6. **Trả lời sâu:** một công tắc "Giải thích sâu / Deep answer" chọn `depth: "deep"`. Ghi chú ngắn rằng chế độ này chậm hơn.
7. **Lỗi:** mỗi `TutorErrorCode` có một thông báo song ngữ dễ hiểu, kèm nút thử lại khi hợp lý (`rate_limited`, `overloaded`, `unavailable`). `not_configured` và `no_credits` nói rõ tutor chưa sẵn sàng. Lỗi giữa chừng thì giữ phần chữ đã nhận.
8. **Cuộc trò chuyện mới:** nút xoá lịch sử. Khi chạm `TUTOR_LIMITS.maxMessages`, đề nghị bắt đầu cuộc trò chuyện mới thay vì tự cắt bớt.
9. **Trợ năng:** trình đọc màn hình được báo khi có câu trả lời xong (không đọc từng mẩu đang stream); toàn bộ dùng được bằng bàn phím; danh sách tin nhắn tự cuộn xuống khi có chữ mới, trừ khi người dùng đang cuộn lên đọc.
10. Dùng được ở bề ngang 390px và ở cả chế độ sáng lẫn tối. Đổi ngôn ngữ giữa chừng thì các câu hỏi mới dùng ngôn ngữ mới.

## Ràng buộc

- Chỉ đọc trạng thái qua `useAppStore`; lịch sử chat giữ trong component (chưa cần lưu giữa các lần tải trang).
- Không sửa `src/lib/tutor.ts`. Hợp đồng chưa đủ dùng thì ghi đề nghị vào mục "Kết quả".
- Không thêm thư viện.

## Xong khi

- Với hàm giả lập: hỏi, nhận câu trả lời dần dần, dừng giữa chừng, thử từng loại lỗi, hỏi tiếp nhiều lượt (kiểm tra `context` của tin nhắn cũ được gửi lại không đổi), bắt đầu cuộc trò chuyện mới.
- `npm run lint` và `npm run build` qua.

## Kết quả

_(Lane 1 điền khi xong.)_
