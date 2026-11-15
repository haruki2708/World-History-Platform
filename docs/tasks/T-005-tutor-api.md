# T-005: Route API của gia sư AI

- **Lane:** 2
- **Nhánh:** `lane2/T-005-tutor-api` (đã tạo sẵn từ `main`)
- **Phạm vi file:** `src/app/api/tutor/`, `src/server/tutor/`

## Mục tiêu

Viết route `POST /api/tutor` nhận câu hỏi kèm ngữ cảnh người dùng đang xem, gọi Claude API và stream câu trả lời về cho khung chat. Lane 1 làm khung chat song song (T-006) dựa trên cùng hợp đồng.

## Hiện trạng

- Hợp đồng nằm ở `src/lib/tutor.ts`; mô tả ở `docs/ARCHITECTURE.md`, mục "AI tutor". Đọc kỹ cả hai trước khi làm.
- `@anthropic-ai/sdk` 1.3.0 đã được cài.
- **Tài khoản API hiện chưa có tiền.** Mọi lần gọi thật sẽ trả lỗi `billing_error`. Toàn bộ task này làm và kiểm tra bằng chế độ giả lập (`TUTOR_MOCK=1`), cộng với việc kiểm tra cách xử lý lỗi hết tiền.
- Dữ liệu: 59 sự kiện và 17 thế lực, truy cập qua `@/data`.

## Trước khi viết code gọi Claude API

Nạp skill `claude-api` và làm theo hướng dẫn TypeScript trong đó (khởi tạo client, streaming, prompt caching, xử lý lỗi, xử lý `refusal`, tham số `fallbacks`). Không viết từ trí nhớ.

## Yêu cầu

1. **Route** `src/app/api/tutor/route.ts`, chỉ chạy phía server. Phần logic đặt trong `src/server/tutor/` (dựng prompt, gọi API, giả lập, ánh xạ lỗi) để route mỏng và dễ kiểm tra.
2. **Kiểm tra đầu vào** theo `TutorRequest` và `TUTOR_LIMITS`: đúng kiểu, tin nhắn cuối là của người dùng, câu hỏi không rỗng và không quá dài, `selectedEventId` (nếu có) tồn tại, năm trong phạm vi. Sai thì trả `bad_request`.
3. **Phản hồi NDJSON** đúng như mô tả ở `TutorStreamEvent`, với header `Content-Type: application/x-ndjson` và không cache.
4. **Gọi Claude API:**
   - Model `claude-opus-5-5`, có streaming. Effort `high` cho `depth: "standard"`, `xhigh` cho `depth: "deep"`.
   - Prompt caching: phần hướng dẫn và toàn bộ dữ liệu sự kiện, thế lực (cả tên tiếng Việt, để model dùng đúng cách viết tên của dự án) đặt ở phần đầu cố định và được cache. Phần này phải giống hệt nhau giữa mọi yêu cầu: dựng một lần, không chèn thời gian hay giá trị thay đổi.
   - Mỗi tin nhắn của người dùng được dựng thành: khối ngữ cảnh (năm theo ngôn ngữ, sự kiện đang chọn, tâm, mức phóng và giới hạn của vùng bản đồ, danh sách id các sự kiện quanh năm đó) rồi đến câu hỏi. Hàm dựng phải tất định: cùng `context` thì ra cùng chuỗi.
   - Lượt của trợ lý chỉ gửi phần chữ.
   - Bật server-side fallback theo hướng dẫn của skill cho Opus 5.5. Xử lý `stop_reason: "refusal"` thành lỗi `refused`; `max_tokens` thành `done` với `truncated: true`.
5. **Hướng dẫn cho model** (system prompt), gợi ý nội dung:
   - Là gia sư lịch sử về Cộng hoà La Mã và thế giới Địa Trung Hải, 509–27 TCN. Trả lời bằng ngôn ngữ của `context.locale`.
   - Bám vào ngữ cảnh người dùng đang xem. Dựa trên dữ liệu đã cung cấp trước; khi dùng kiến thức ngoài dữ liệu thì nói rõ.
   - Nêu rõ khi mốc năm là theo truyền thống hoặc còn tranh cãi. Không bịa nguồn.
   - Ngắn gọn: vài đoạn ngắn ở chế độ thường, sâu hơn ở chế độ "deep". Chỉ dùng đoạn văn và danh sách gạch đầu dòng `- `, không dùng tiêu đề, bảng hay định dạng markdown khác (khung chat chỉ hiển thị được hai kiểu này).
   - Câu hỏi ngoài chủ đề thì trả lời ngắn và gợi ý quay lại chủ đề.
6. **Chế độ giả lập** khi `TUTOR_MOCK=1`: không gọi API, stream vài mẩu chữ có độ trễ nhỏ, nội dung theo ngôn ngữ của người dùng và **nhắc lại ngữ cảnh nhận được** (năm, tên sự kiện đang chọn, tâm bản đồ, độ sâu), để lane 1 thấy ngữ cảnh đã đi đúng. Hỗ trợ giả lập lỗi: câu hỏi chứa `#error:<mã>` thì trả lỗi đó (ví dụ `#error:no_credits`); `#error:midstream` thì gửi vài mẩu chữ rồi báo `unavailable`.
7. **Ánh xạ lỗi** từ lỗi có kiểu của SDK sang `TutorErrorCode`: thiếu khoá (và không giả lập) → `not_configured`; 401 → `invalid_key`; 402 `billing_error` → `no_credits`; 429 → `rate_limited`; 529 và 5xx → `overloaded`; còn lại → `unavailable`. Ghi chi tiết lỗi ra log server, nhưng không bao giờ ghi khoá API và không gửi chi tiết nội bộ về trình duyệt.
8. **Người dùng ngắt kết nối** (bấm dừng): huỷ yêu cầu tới Claude API để không tốn tiền cho phần không ai đọc.

## Ràng buộc

- Không sửa `src/lib/tutor.ts` hay `src/data/`. Hợp đồng chưa đủ dùng thì ghi đề nghị vào mục "Kết quả".
- Không thêm thư viện ngoài `@anthropic-ai/sdk`. SDK 1.3.0 thiếu thứ cần thiết thì ghi đề nghị nâng bản.
- Khoá API không bao giờ xuất hiện trong code, commit, log hay báo cáo.

## Xong khi

- Ở chế độ giả lập: gửi yêu cầu bằng `curl` (hoặc script), nhận đúng chuỗi NDJSON; ngữ cảnh được nhắc lại đúng; mỗi `#error:<mã>` trả đúng mã; yêu cầu sai trả `bad_request`.
- Tắt giả lập và không có khoá: trả `not_configured`.
- Có hàm (hoặc script nhỏ trong `src/server/tutor/`) in ra prompt đầy đủ cho một yêu cầu mẫu, để phiên chính kiểm tra nội dung và độ dài, kèm ước lượng số token của phần được cache.
- `npm run lint` và `npm run build` qua.
- Không gọi API thật. Khi người dùng nạp tiền, phiên chính sẽ chạy thử thật.

## Kết quả

_(Lane 2 điền khi xong.)_
