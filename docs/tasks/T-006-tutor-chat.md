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

### Đã làm

Mọi file nằm trong `src/components/tutor/`:

- `TutorPanel.tsx`: khung chat. Gồm tiêu đề, nút "Trò chuyện mới", danh sách tin nhắn tự cuộn, vùng `aria-live` và ô nhập. Khi chưa có cuộc trò chuyện thì hiện lời giới thiệu và 3 câu hỏi gợi ý dựng từ năm và sự kiện đang chọn; bấm là gửi luôn.
- `Composer.tsx`: ô nhập nhiều dòng tự giãn (`field-sizing: content`, tối đa ~8 dòng).
  - Enter gửi, Shift+Enter xuống dòng. Enter dùng để xác nhận bộ gõ (IME, ví dụ bộ gõ tiếng Việt) thì không gửi.
  - `maxLength` bằng `TUTOR_LIMITS.maxQuestionChars`, bộ đếm hiện khi gần chạm giới hạn.
  - Nút gửi thành nút dừng khi đang trả lời.
  - Dòng "Gửi kèm câu hỏi: [năm] [sự kiện đang chọn] + vùng bản đồ" nằm ngay trên ô nhập.
  - Công tắc "Giải thích sâu" (`role="switch"`) kèm ghi chú "Chậm hơn nhưng kỹ hơn".
  - Khi chạm giới hạn tin nhắn: hiện thông báo kèm nút bắt đầu cuộc trò chuyện mới, không cho gửi tiếp.
- `ChatEntryView.tsx`: hiển thị một tin nhắn.
  - Câu hỏi có nhãn "Hỏi khi xem năm …" lấy từ `context.year` của chính nó.
  - Câu trả lời có chỉ báo "Đang suy nghĩ…" trước chữ đầu tiên và con trỏ nhấp nháy khi đang stream. Câu trả lời ở chế độ sâu có nhãn "Sâu". Có thêm nhãn "Đã dừng" và ghi chú khi `done.truncated`.
  - Lỗi có hộp thông báo song ngữ; nút "Thử lại" chỉ hiện với `rate_limited`, `overloaded`, `unavailable`, và chỉ ở câu trả lời cuối.
  - Bộ phân tích nhỏ chỉ nhận đoạn văn và dòng `- `, render thành `<p>` / `<ul>` bằng text React, không dùng `dangerouslySetInnerHTML`.
- `useTutorChat.ts`: trạng thái cuộc trò chuyện.
  - `context` được chụp từ `useAppStore.getState()` lúc gửi, `viewport` được sao chép. Lịch sử gửi lại giữ nguyên nội dung và `context` cũ.
  - Dừng bằng `AbortController`; phần chữ đã nhận được giữ lại.
  - "Thử lại" gửi lại đúng yêu cầu cũ và thay câu trả lời lỗi.
  - Đổi ngôn ngữ giữa chừng: câu hỏi mới mang `locale` mới, câu cũ giữ `locale` cũ.
- `tutorClient.ts`: `POST TUTOR_ENDPOINT` và đọc NDJSON theo từng dòng, chịu được dòng bị cắt giữa hai gói dữ liệu.
  - Ánh xạ HTTP status sang `TutorErrorCode` khi body không có sự kiện `error` hợp lệ: 429 → `rate_limited`; 503/529 → `overloaded`; 400/413 → `bad_request`; còn lại → `unavailable`.
  - Luồng đóng mà không có `done` thì báo `unavailable` và giữ phần chữ đã nhận.
- `devMockTutor.ts`: **hàm giả lập chỉ dùng khi phát triển** (xem bên dưới).

Quy tắc dựng lịch sử (`toHistory` trong `useTutorChat.ts`): mỗi lượt gồm câu hỏi và câu trả lời. Câu trả lời đã có chữ (xong, bị dừng, hoặc lỗi giữa chừng) thì gửi phần chữ đó. Lượt mà câu trả lời **không có chữ nào** (lỗi ngay hoặc dừng trước chữ đầu tiên) thì bỏ cả lượt khỏi các yêu cầu sau. Nhờ vậy lịch sử luôn xen kẽ người dùng/trợ lý, và vì luôn áp cùng một quy tắc nên lịch sử của các lần gửi sau không đổi.

Chuỗi giao diện: thay các khoá `tutor.*` cũ của khung tạm (`tutor.placeholder`, `tutor.context.*`) bằng bộ khoá mới cho chat, đủ cả `en` và `vi`, gồm thông báo cho cả 8 `TutorErrorCode`. Giữ `tutor.heading` vì `AppShell` dùng.

### Hàm giả lập và cách gỡ

- `tutorClient.ts` luôn gọi `/api/tutor` thật trước. Chỉ khi `NODE_ENV === "development"` **và** route trả 404 (tức T-005 chưa gộp) thì mới nạp động `devMockTutor.ts` và trả lời bằng nó. Khi đó tiêu đề hiện nhãn "Câu trả lời giả lập (chỉ khi phát triển)".
- Bản build production loại nhánh này: đã kiểm tra `.next/static` không chứa code giả lập, chỉ có chuỗi nhãn i18n.
- Khi T-005 gộp xong, route trả lời thật nên giả lập tự không được dùng nữa. **Để gỡ hẳn:** xoá `src/components/tutor/devMockTutor.ts` và khối có comment `DEV-ONLY FALLBACK` trong `tutorClient.ts` (6 dòng). Prop `onMock` và state `usingMock` trong `useTutorChat.ts` / `TutorPanel.tsx` có thể xoá luôn hoặc để nguyên (không gây hại).
- Câu trả lời giả lập dựng từ yêu cầu: năm, vùng bản đồ, sự kiện đang chọn, độ sâu, và **năm của các câu hỏi trước** (để nhìn thấy `context` cũ được gửi lại). Thẻ trong câu hỏi để thử trường hợp đặc biệt: `#error:<mã>`, `#miderror:<mã>`, `#truncated`, `#long`.

### Đã kiểm tra

- `npm run lint` và `npm run build` qua.
- Chạy `npm run dev` và điều khiển Chrome thật bằng Playwright (script nằm ngoài repo), đọc body các `POST /api/tutor`:
  - Bấm gợi ý "Why does Battle of Cannae matter?" sau khi chọn Cannae trên timeline: `context` = `{year: -216, selectedEventId: "battle-of-cannae", locale: "en", viewport: …}`. Chữ hiện dần (độ dài tăng theo thời gian); xong thì vùng `aria-live` có "The tutor answered: …".
  - Lượt 2 sau khi kéo về 27 TCN: `messages[0]` giống hệt yêu cầu đầu (so sánh sâu), `messages.length = 3`, câu mới có `year: -27`. Nhãn "Asked at 216 BCE" và "Asked at 27 BCE" đúng.
  - Shift+Enter tạo dòng mới trong ô nhập và không gửi.
  - `#long`: khi đang stream, danh sách bám đáy (khoảng cách 0px). Người dùng cuộn lên thì nó đứng yên (`scrollTop` giữ 0). Bấm Dừng: còn phần chữ, có nhãn "Stopped". Câu tiếp theo gửi 7 tin nhắn, trong đó có câu trả lời dở dang; `context` cũ không đổi.
  - Cả 8 mã lỗi qua `#error:<mã>`: đúng thông báo. "Thử lại" chỉ có ở 3 mã tạm thời, và gửi lại yêu cầu y hệt. `#miderror:overloaded` giữ phần chữ đã nhận rồi hiện lỗi.
  - Công tắc sâu → `depth: "deep"`. `#truncated` → hiện ghi chú bị cắt.
  - Đổi sang tiếng Việt giữa chừng: câu mới `locale: "vi"`, câu đầu vẫn `"en"`, câu trả lời giả lập bằng tiếng Việt.
  - "Trò chuyện mới": về màn gợi ý, con trỏ về ô nhập.
  - 390×844 chế độ tối, tab "Gia sư AI": gửi 20 câu (40 tin nhắn) thì hiện thông báo giới hạn, câu thứ 21 không gửi được, bấm "Trò chuyện mới" thì xoá sạch. Không cuộn ngang. Không lỗi console.
- Đường gọi thật (không qua giả lập) với `page.route` chặn `/api/tutor`:
  - Đoạn văn + danh sách gạch đầu dòng bị chia giữa hai sự kiện `text` hiển thị đúng `<ul>` 2 mục.
  - 429 có dòng lỗi → `rate_limited`; 500 body HTML → `unavailable`; 529 body rỗng → `overloaded`; mã lỗi lạ → `unavailable`.
  - Luồng 200 đứt giữa chừng → giữ chữ và báo `unavailable`. `text` rồi `error: refused` → giữ chữ và báo `refused`.
- Chế độ sáng và tối đều đã chụp màn hình kiểm tra.

### Còn lại / lưu ý

- Chưa thử với route thật của lane 2 (T-005 chưa gộp vào nhánh này). Khi nối, nên chạy lại kịch bản trên với `TUTOR_MOCK=1` phía server.
- Câu trả lời bị dừng giữa câu vẫn được gửi lại làm lượt `assistant` ở các yêu cầu sau. Route cần chấp nhận điều này (về phía API thì hợp lệ).

### Đề nghị ngoài phạm vi (phiên chính quyết)

1. **`docs/ARCHITECTURE.md` / `src/lib/tutor.ts`**: hợp đồng chưa nói gì về lượt hỏi thất bại không có chữ. Đề nghị ghi rõ quy tắc đang dùng ở trên (bỏ cả lượt khỏi lịch sử; câu trả lời dở dang thì gửi phần chữ đã có), để route của lane 2 có thể kiểm tra `messages` xen kẽ đúng thứ tự.
2. **`AppShell.tsx`**: chỗ cho tin nhắn khá chật. Trên màn rộng 1280×800, khung tutor chỉ cao khoảng 300px, trừ ô nhập còn khoảng 170px. Trên điện thoại 390×844, khi mở tab "Gia sư AI" còn khoảng 100–150px vì bản đồ (`min-h-64`) và timeline vẫn chiếm chỗ. Đề nghị: trên điện thoại, khi đang ở tab tutor thì thu bản đồ lại (ví dụ `min-h-40`); trên màn rộng, chia panel bên theo tỉ lệ khoảng 40/60 nghiêng về tutor khi đã có cuộc trò chuyện.
3. Không cần thư viện mới.
