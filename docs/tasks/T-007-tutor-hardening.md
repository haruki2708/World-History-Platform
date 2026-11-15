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

Lane 2, 2026-11-16. Nhánh `lane2/T-007-tutor-hardening`, chưa push, chưa gộp. Không gọi Claude API thật lần nào.

### Đã làm

- **Giới hạn theo người dùng** (`src/server/tutor/limits.ts`): người dùng là phần tử đầu của `x-forwarded-for`, không có thì `x-real-ip`, không có nữa thì "local". Chuỗi nhận diện bị cắt còn 64 ký tự để header dài không làm phình bộ đếm.
  - Theo phút: tính theo cửa sổ trượt 60 giây (không phải phút đồng hồ), câu thứ 7 trong 60 giây nhận `rate_limited` 429.
  - Theo ngày UTC: câu thứ 101 nhận `limit_reached` 429. Khi vượt cả hai, trả `limit_reached`, vì chờ một phút cũng không hết.
- **Trần chi phí mỗi ngày** (`src/server/tutor/pricing.ts`): giá `claude-opus-5-5` lấy từ skill `claude-api` (bản cache 2026-11-03), tính theo USD mỗi triệu token: đầu vào 4, ghi cache 5 phút 5, ghi cache 1 giờ 8, đọc cache 0,20, đầu ra 20. Phần suy luận tính là đầu ra. Chi phí ước tính của từng câu nằm ở trường `costUsd` trong dòng log `[tutor] response finished`.
  - Khi tổng trong ngày đạt trần thì mọi câu hỏi mới, kể cả ở chế độ giả lập, nhận `limit_reached` cho tới 0 giờ UTC. Log `[tutor] daily spending cap reached` được ghi một lần mỗi ngày.
  - Câu trả lời bị dừng giữa chừng (người dùng bấm dừng, mất kết nối, lỗi giữa luồng) vẫn được cộng phần `usage` đã biết, và ghi log `[tutor] response stopped early`.
- **Biến môi trường** (thêm vào `.env.example`): `TUTOR_QUESTIONS_PER_MINUTE` (mặc định 6), `TUTOR_QUESTIONS_PER_DAY` (100), `TUTOR_DAILY_BUDGET_USD` (5). Giá trị sai (không phải số dương; hai biến đếm còn phải là số nguyên) thì dùng mặc định và ghi một cảnh báo. Cảnh báo chỉ ghi khi giá trị đổi, không ghi lại ở mỗi yêu cầu.
- **Kho đếm** (`src/server/tutor/quota-store.ts`): interface `QuotaStore` có ba hàm `takeQuestion`, `spentUsd`, `addSpendUsd`; bản hiện tại là `MemoryQuotaStore`. Muốn thay kho khác thì gọi `setQuotaStore()`, không phải sửa logic. Kho trong bộ nhớ tự dọn người dùng đã hết việc và số tiền của các ngày trước.
- **Origin**: có `Origin` mà host khác host của route thì trả `{"type":"error","code":"bad_request"}` với HTTP 403. Host của route lấy từ `x-forwarded-host`, `Host` hoặc URL của yêu cầu, khớp một trong ba là được. Origin `null` bị từ chối. Yêu cầu không có `Origin` vẫn được nhận.
- **Thứ tự kiểm tra trong `handler.ts`**: Origin, đầu vào, cấu hình (thiếu khoá), trần chi phí, lượt hỏi, rồi mới gọi API. Câu bị chặn không gọi API, không tốn tiền và không bị tính lượt; câu bị chặn vì trần chi phí cũng không bị tính lượt. Nếu kho đếm lỗi (chỉ xảy ra với kho dùng chung sau này) thì route trả `unavailable` và không gọi API.
- **Phản hồi sớm** (`respond.ts`): chờ sự kiện đầu tiên tối đa 2 giây. Lỗi đến trong khoảng đó vẫn mang mã HTTP như cũ. Quá 2 giây, route trả 200 bắt đầu bằng `ping`, và lỗi đến sau đó đi trong luồng 200. Trong lúc luồng mở, cứ 15 giây không có gì thì gửi một `ping`. `route.ts` có `export const maxDuration = 300`.
- **Chế độ giả lập**: thẻ `#slow` chờ 20 giây trước chữ đầu tiên; `#slow:<giây>` chờ số giây tuỳ chọn, tối đa 120. Ghép được với `#error:<mã>` để thấy lỗi đến muộn.
- **Máy chủ Claude giả**: thẻ `#delay:<ms>`, kịch bản `expensive` (250 000 token đầu ra, khoảng 5 USD) và `overloaded_first` (lỗi trong luồng trước chữ đầu tiên).

### Đã kiểm tra

- `npm run tutor:check`: 74 mục qua, chạy khoảng 30 giây (lâu hơn trước vì có hai lần chờ thật 2–3 giây). Các mục mới gồm:
  - cửa sổ phút trượt, sang ngày UTC mới, câu bị từ chối không bị tính lượt;
  - đọc biến môi trường và cảnh báo khi giá trị sai;
  - câu thứ 7 trong một phút ra 429 `rate_limited`, vượt số câu trong ngày ra 429 `limit_reached`, yêu cầu sai hoặc khác Origin không bị tính lượt;
  - Origin cùng host, khác host, khác cổng, `null`, và qua `x-forwarded-host`;
  - `ping` khi chờ và khi im lặng, lỗi sớm giữ mã 503, lỗi muộn đi trong luồng 200 (cả với route giả lập lẫn máy chủ giả);
  - yêu cầu bị chặn không chạm tới API;
  - chi phí ghi đúng vào log và vào tổng ngày, kể cả khi bị dừng giữa chừng;
  - vượt trần thì cả chế độ thật lẫn giả lập ra `limit_reached` mà không gọi API, nâng trần thì hỏi lại được;
  - log không chứa khoá API, cũng không chứa IP.
- `curl` trên `next dev` với `TUTOR_MOCK=1`:
  - cùng một IP gửi 7 câu: `200 ×6`, rồi `429 {"type":"error","code":"rate_limited"}`;
  - với `TUTOR_QUESTIONS_PER_DAY=2`: `200 200`, rồi `429 {"type":"error","code":"limit_reached"}`;
  - `Origin: https://evil.example` ra `403 bad_request`; `Origin: http://localhost:3102` ra 200;
  - `#slow`: `ping` lúc 2,2 giây, `ping` lúc 17,2 giây, chữ đầu tiên lúc 20,2 giây;
  - `TUTOR_DAILY_BUDGET_USD=abc` ghi cảnh báo và dùng mặc định 5.
- `npm run lint` và `npm run build` qua.
- Không đổi gì ở khung chat (nó đã bỏ qua `ping`), nên chưa thử lại trong trình duyệt.

### Giới hạn cần biết trước khi deploy

- **Bộ đếm nằm trong bộ nhớ của một tiến trình**: khởi động lại là mất hết, kể cả tổng tiền trong ngày. Chạy nhiều tiến trình hoặc serverless thì mỗi nơi đếm riêng, nên giới hạn và trần thực tế nhân lên theo số tiến trình. Khi deploy cần một `QuotaStore` dùng chung (Redis chẳng hạn); `takeQuestion` phải nguyên tử, ví dụ dùng một script Lua.
- **IP lấy từ header nên giả được**: `x-forwarded-for` chỉ đáng tin khi đứng sau một proxy ghi đè header này. Gọi thẳng vào route thì ai cũng tự đặt được IP để lách giới hạn theo người dùng; khi đó chỉ còn trần chi phí bảo vệ tài khoản.
- **Trần có thể bị vượt một chút**: chi phí chỉ được cộng khi câu trả lời kết thúc, nên các câu đang chạy cùng lúc lúc chạm trần vẫn chạy nốt. Một câu deep tốn tối đa khoảng 32 000 × 20 USD / 1 triệu ≈ 0,64 USD đầu ra, cộng phần đầu vào.
- **Ước tính thấp hơn thực tế trong hai trường hợp**:
  - câu bị dừng trước khi API báo số token đầu ra: chỉ tính được phần đầu vào, phần suy luận đã chạy thì không biết;
  - câu do model dự phòng trả lời (sau khi bị từ chối): vẫn tính theo giá Opus 5.5.
- **Lỗi từ API sau khi câu đã được nhận** (quá tải, thiếu tiền...) vẫn tính một lượt. Cố ý như vậy để thử lại liên tục cũng bị giới hạn phút chặn lại.
- **`ping` được gửi sau mỗi 15 giây im lặng**, cả sau khi đã có chữ, chứ không chỉ trước chữ đầu tiên. Hợp đồng cho phép điều này và khung chat bỏ qua `ping`.
- **Kiểm tra Origin chỉ so host**, không so scheme. Khi deploy, nếu proxy đổi host mà không đặt `x-forwarded-host`, yêu cầu từ chính app sẽ bị chặn. Cần kiểm tra lại điểm này trên môi trường thật.

### Đề nghị ngoài phạm vi (phiên chính)

- `docs/ARCHITECTURE.md`, mục "AI tutor":
  - bổ sung `bad_request` có thể đi với HTTP 403 (Origin lạ);
  - ghi thời gian chờ 2 giây và chu kỳ `ping` 15 giây;
  - thêm thẻ `#slow` / `#slow:<giây>`;
  - thêm ba biến môi trường mới;
  - sửa câu "Giới hạn theo người dùng và trần chi phí mỗi ngày đang làm ở T-007".
- `src/lib/tutor.ts` đủ dùng, không cần sửa. Nếu muốn gọn, có thể thêm 403 vào ghi chú về mã HTTP trong hợp đồng.
