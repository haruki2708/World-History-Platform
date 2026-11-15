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

Lane 2, 2026-11-15. Đã xong cả 8 yêu cầu. `npm run lint` và `npm run build` qua. **Chưa có lần gọi Claude API thật nào**: đường gọi thật chỉ được thử với một máy chủ giả trên localhost.

### Đã làm

`src/app/api/tutor/route.ts` chỉ chuyển yêu cầu cho `handleTutorPost`. Logic nằm trong `src/server/tutor/`:

| File | Việc |
|---|---|
| `handler.ts` | Kiểm tra đầu vào → chọn giả lập, `not_configured` hoặc gọi API → trả NDJSON |
| `validate.ts` | Kiểm tra theo `TutorRequest` và `TUTOR_LIMITS`, trả về bản sao chỉ gồm các trường của hợp đồng |
| `prompt.ts` | Hướng dẫn cho model, khối dữ liệu, khối ngữ cảnh `<viewing>`, dựng `messages` |
| `claude.ts` | Tham số yêu cầu, streaming, xử lý `stop_reason`, huỷ khi người dùng ngắt |
| `errors.ts` | Ánh xạ lỗi của SDK sang `TutorErrorCode`, ghi log có chọn lọc |
| `mock.ts` | Chế độ giả lập |
| `respond.ts` | Biến chuỗi sự kiện thành phản hồi NDJSON, chọn mã HTTP |
| `config.ts` | Model, effort, `max_tokens`, giới hạn phía server, mã HTTP cho từng lỗi |
| `tools/` | Script in prompt, bộ tự kiểm tra, máy chủ Claude giả (không vào bản build) |

**Yêu cầu gửi tới Claude** (đã làm theo skill `claude-api`):

- `claude-opus-5-5`, streaming qua `client.beta.messages.stream`. `output_config.effort` là `high` (standard) hoặc `xhigh` (deep), luôn đặt rõ vì mặc định của Opus 5.5 là `medium`. `thinking: { type: "adaptive" }`.
- Fallback phía server: `fallbacks: "default"` với beta `server-side-fallback-2026-07-01`. Khi bộ lọc an toàn từ chối, API tự chạy lại trên model dự phòng. Nếu cả chuỗi vẫn từ chối (`stop_reason: "refusal"`) thì trả `refused`.
- `max_tokens`: 16 000 (standard), 32 000 (deep). Đây là trần cho cả phần suy luận lẫn câu trả lời, đặt thấp hơn mức 64 000 skill gợi ý để giới hạn chi phí mỗi câu hỏi. Chạm trần thì trả `done` với `truncated: true`.
- Lượt của trợ lý chỉ gửi phần chữ.

**Bố cục prompt và cache:**

```
system[0]  hướng dẫn                    ┐ giống hệt nhau ở mọi yêu cầu,
system[1]  dữ liệu 17 thế lực, 59 sự kiện ┘ điểm cache đặt ở cuối khối này
system[2]  chế độ trả lời               một trong hai đoạn cố định, theo depth
messages   cuộc trò chuyện              mỗi lượt người dùng = <viewing> + câu hỏi
```

- Hai khối đầu được dựng một lần khi nạp module, không có thời gian hay giá trị thay đổi. Dữ liệu gồm tên, tiêu đề, địa danh và tóm tắt bằng cả hai ngôn ngữ, cùng tên nguồn (không kèm URL).
- Độ dài câu trả lời theo `depth` nằm ở `system[2]`, sau điểm cache, nên phần cache dùng chung cho cả hai chế độ.
- Thêm một điểm cache tự động ở cuối cuộc trò chuyện (`cache_control` cấp cao nhất), để câu hỏi tiếp theo đọc lại các lượt trước từ cache.
- Khối `<viewing>` chỉ phụ thuộc `context`: năm theo ngôn ngữ, sự kiện đang chọn, tâm, mức phóng, giới hạn bản đồ, id các sự kiện quanh năm đó, ngôn ngữ trả lời.

**Mã HTTP khi lỗi là toàn bộ phản hồi:** `bad_request` 400, `refused` 422, `rate_limited` 429, `unavailable` 502, còn `not_configured`, `invalid_key`, `no_credits`, `overloaded` là 503. Lỗi sau khi đã có chữ thì mã 200.

**Chế độ giả lập** (`TUTOR_MOCK=1`): trả lời theo ngôn ngữ của câu hỏi, nhắc lại năm, sự kiện đang chọn, tâm và giới hạn bản đồ, số sự kiện quanh năm, độ sâu, số tin nhắn. Có cả đoạn văn lẫn gạch đầu dòng; chế độ deep dài hơn một đoạn. Thẻ trong câu hỏi mới nhất: `#error:<mã>`, `#error:midstream`, và thêm `#truncated` (kết thúc bằng `truncated: true`) để lane 1 thử được trường hợp này.

**Ngắt kết nối:** `request.signal` và việc trình duyệt đóng luồng phản hồi đều huỷ yêu cầu tới Claude API.

**Log:** chỉ ghi mã lỗi, HTTP status, loại lỗi, request id và thông điệp (đã xoá khoá API nếu có, cắt ở 600 ký tự); không ghi nguyên đối tượng lỗi. Mỗi câu trả lời xong ghi một dòng `[tutor] response finished` kèm số token và số token đọc từ cache.

### Đã kiểm tra thế nào

- **Bộ tự kiểm tra, 57 mục, qua hết.** Chạy: `node --import ./src/server/tutor/tools/register.mjs src/server/tutor/tools/self-check.ts`. Gồm giả lập (ngữ cảnh, từng `#error`), 21 kiểu yêu cầu sai, tính tất định của prompt, và đường gọi thật với máy chủ giả: nội dung yêu cầu gửi đi, từng mã lỗi 400/401/402/403/429/500/529, từ chối trước và giữa chừng, lỗi và đứt kết nối giữa chừng, `max_tokens`, huỷ khi người dùng ngắt, và khoá không xuất hiện trong log.
- **Qua `curl` với `next start` và `npm run dev`:** giả lập trả đúng chuỗi NDJSON, đúng header, chữ về dần (byte đầu sau 0,27 giây, xong sau 1,7 giây); từng `#error:<mã>` trả đúng mã; yêu cầu sai trả `bad_request` 400; tắt giả lập và không có khoá trả `not_configured` 503; `GET` trả 405.
- **Qua Next với máy chủ giả:** đường gọi thật trả đúng kết quả; khi `curl` bị ngắt giữa chừng, kết nối từ Next tới máy chủ giả đóng theo.

Chưa kiểm tra được vì cần API thật: chất lượng câu trả lời và prompt, cache có trúng không, số token chính xác, và việc API chấp nhận beta `server-side-fallback-2026-07-01` cùng `fallbacks: "default"` cho tài khoản này.

### In prompt và độ dài

```
node --import ./src/server/tutor/tools/register.mjs src/server/tutor/tools/print-prompt.ts [--deep] [--vi] [--json]
```

Phần được cache: 68 026 ký tự, 74 930 byte UTF-8. **Ước lượng 18 000–27 000 token** (thô, tính từ số byte; chưa chạy tokenizer). Con số chính xác lấy bằng `client.messages.countTokens` với cùng các khối `system`. Tóm tắt tiếng Việt chiếm khoảng 37% phần này; bỏ đi thì rẻ hơn nhưng model mất chỗ dựa cho cách viết tên và thuật ngữ tiếng Việt.

### Điều phiên chính nên biết

1. **Phản hồi chỉ bắt đầu khi có mẩu chữ đầu tiên.** Route chờ sự kiện đầu rồi mới tạo phản hồi, để lỗi trước khi có chữ được trả với mã 4xx/5xx như hợp đồng yêu cầu. Hệ quả: `fetch` ở khung chat chỉ trả về sau khi model suy luận xong, có thể vài chục giây ở chế độ deep. Nếu triển khai lên nền tảng giới hạn thời gian tới byte đầu, cần đổi cách này hoặc thêm sự kiện báo "đang suy nghĩ" vào hợp đồng.
2. **Đổi `depth` giữa cuộc trò chuyện làm mất cache của các lượt trước** (đổi effort luôn làm vậy; với một số model còn mất cả cache của phần system). Giữ nguyên `depth` thì cache giữ được.
3. **Lượt trợ lý rỗng bị bỏ, các lượt cùng vai liền nhau được gộp** trước khi gửi cho model. Nhờ vậy câu trả lời bị dừng trước khi có chữ không làm hỏng lịch sử.
4. **Giới hạn ngoài hợp đồng:** nội dung một lượt trợ lý tối đa 200 000 ký tự, thân yêu cầu tối đa 2 000 000 ký tự. Vượt thì trả `bad_request`. Câu trả lời thật không tới gần mức này.
5. **Lỗi 400 và 403 từ Claude API trả `unavailable`**, không phải `bad_request`: yêu cầu của khung chat vẫn hợp lệ, lỗi nằm ở phía server.
6. **Model trả về mà không có chữ nào** (chỉ suy luận) được coi là `unavailable`.
7. SDK 1.3.0 gửi khoá dưới dạng `Authorization: Bearer` và dùng phiên bản API `2026-10-21`. Yêu cầu của tutor không dùng tham số nào bị phiên bản này loại bỏ.
8. Script trong `tools/` chạy TypeScript bằng Node trực tiếp (cần Node 22.18 trở lên; máy này là 24.16). `register.mjs` xử lý alias `@/`, import không đuôi file và import JSON.

### Khi tài khoản có tiền

1. Đặt khoá vào `.env.local`, bỏ `TUTOR_MOCK`, hỏi hai câu liên tiếp trong vòng 5 phút.
2. Xem dòng `[tutor] response finished` của câu thứ hai: `cacheReadTokens` phải lớn hơn 0 (khoảng bằng độ dài phần được cache). Bằng 0 nghĩa là cache không trúng.
3. Nếu API trả 400 về beta hoặc `fallbacks`, route sẽ báo `unavailable` và log ghi rõ lý do. Khi đó bỏ hai dòng `betas` và `fallbacks` trong `claude.ts`.
4. Đọc thử câu trả lời ở cả hai ngôn ngữ và hai độ sâu rồi chỉnh hướng dẫn trong `prompt.ts`.

### Đề nghị ngoài phạm vi

1. **`package.json`:** thêm hai lệnh tắt, ví dụ `"tutor:check"` và `"tutor:prompt"`, trỏ tới hai script trên.
2. **`docs/ARCHITECTURE.md`:** ghi các thẻ giả lập (`#error:<mã>`, `#error:midstream`, `#truncated`) và bảng mã HTTP, để lane 1 và người sau dùng.
3. **Lane 1 (T-006):** lỗi đứng một mình đi kèm mã HTTP 4xx/5xx, nên phải đọc thân phản hồi cả khi `response.ok` là `false`. `fetch` trả về muộn như nêu ở điểm 1, nên trạng thái "đang trả lời" phải bật từ lúc gửi.
4. **`src/lib/tutor.ts`:** nếu muốn, đưa giới hạn độ dài lượt trợ lý vào `TUTOR_LIMITS` để hai bên dùng chung một con số.
5. **Trước khi mở cho người ngoài:** route chưa có xác thực hay giới hạn tần suất, ai gọi được cũng tiêu được tiền của tài khoản. Cần chặn ở tầng trước hoặc thêm giới hạn theo IP.
6. **Triển khai:** tuỳ nền tảng, có thể cần `export const maxDuration` trong `route.ts` vì câu trả lời deep có thể chạy vài phút.
