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

Lane 2, 2026-11-16. Nhánh `lane2/T-011-tutor-map-links-server`, chưa push, chưa gộp. Không gọi Claude API thật.

### Đã làm

- **Ký hiệu:** `[[map:YEAR:EVENT_ID]]` cho sự kiện và `[[map:YEAR]]` cho một năm. YEAR là số nguyên, âm là TCN (giống dữ liệu); EVENT_ID dạng kebab-case.
- **Hướng dẫn model** nằm ở mục "Buttons to the map" trong `INSTRUCTIONS` (`prompt.ts`), phần cố định đã cache, nên không làm hỏng cache:
  - chỉ tạo nút cho sự kiện hay năm cụ thể mà câu trả lời bàn tới, tối đa 3;
  - không tạo nút cho đúng năm và sự kiện đang xem;
  - ký hiệu đặt ở cuối câu trả lời, mỗi ký hiệu một dòng;
  - không nhắc tới nút trong chữ, câu trả lời phải đọc trọn vẹn khi không có nút;
  - id chỉ dùng bên trong ký hiệu.
- **Tách ký hiệu khi stream** (`mapLinks.ts`, lớp `MapLinkStream`, dùng trong `claude.ts`):
  - **Giữ lại:** phần chữ có thể là đầu một ký hiệu (một `[` ở cuối mẩu, hoặc `[[`, `[[m`… tới `[[map:` chưa đóng) được giữ cho tới khi biết chắc.
  - **Không phải ký hiệu:** chuỗi bắt đầu bằng `[[map:` mà có xuống dòng, hoặc dài quá 120 ký tự trước khi đóng, thì được trả lại thành chữ thường. Mọi `[[` khác giữ nguyên trong chữ.
  - **Khoảng trắng:** khoảng trắng ở cuối mỗi mẩu chỉ gửi đi khi có chữ tiếp theo, nên câu trả lời không bao giờ kết thúc bằng dòng trống. Khi bỏ một ký hiệu, khoảng trắng hai bên được gộp lại: "Cannae [[…]] was" thành "Cannae was"; ký hiệu đứng một mình giữa hai đoạn vẫn để lại đúng một dòng trống.
  - **Khi câu trả lời dừng:** ký hiệu bị cắt cụt ở cuối (ví dụ dừng vì `max_tokens`) bị bỏ đi. Khi lỗi giữa chừng, chữ đang giữ vẫn được gửi trước `error`.
  - `map_link` được gửi ngay khi đọc xong một ký hiệu, nên có thể xen giữa các sự kiện `text`, đúng như hợp đồng cho phép.
- **Kiểm tra từng nút:**
  - sự kiện phải có trong dữ liệu;
  - nếu năm nằm ngoài các năm của sự kiện thì dùng năm bắt đầu của sự kiện (cùng phép kiểm tra `isEventActive` mà khung chat dùng);
  - năm phải nằm trong [−509, −27];
  - bỏ nút trùng, tối đa `TUTOR_LIMITS.maxMapLinks`;
  - thêm một điều kiện: bỏ nút trỏ đúng vào cái đang xem (cùng năm và cùng sự kiện đang chọn, hoặc cùng năm khi không chọn sự kiện nào), để ép quy tắc trong prompt.
  - Ký hiệu sai bị bỏ lặng lẽ. Log chỉ có số lượng, `[tutor] map links { sent, dropped }`, không có nội dung câu trả lời.
- **Lịch sử:** khung chat gửi lại phần chữ không có ký hiệu, nên prompt vẫn tất định. Đã thêm một mục kiểm tra cho điều này.
- **Máy chủ Claude giả:** thêm kịch bản `#upstream:links`. Câu trả lời có 3 ký hiệu cắt ngang các mẩu chữ: 2 ký hiệu đúng, 1 sai cú pháp.
- **Một thay đổi nhỏ ở các mục kiểm tra cũ:** vì khoảng trắng cuối mẩu được giữ lại, chữ có thể được chia mẩu khác trước. Các mục kiểm tra đường gọi thật giờ so chữ đã nối lại (chỗ chia mẩu không thuộc hợp đồng). Câu trả lời dở dang cũng không còn khoảng trắng thừa ở cuối ("Partial " thành "Partial").

### Đã kiểm tra

- `npm run tutor:check`: 87 mục qua. Các mục mới gồm:
  - ký hiệu bị cắt ở **mọi** vị trí giữa hai mẩu chữ, và khi stream từng ký tự một;
  - ký hiệu sai cú pháp (6 dạng), sự kiện không tồn tại, năm ngoài phạm vi;
  - năm ngoài các năm của sự kiện, chuyển về năm bắt đầu;
  - quá 3 nút, nút trùng, nút trỏ đúng cái đang xem;
  - ký hiệu giữa đoạn văn, ở đầu câu trả lời, và giữa hai đoạn;
  - câu trả lời không có ký hiệu nào;
  - `[[` trong chữ thường: `[[1, 2]]`, `[[Rome]]`, `[[` và `[[ma` ở cuối, `[[mapping]]`, `[[map]]`, có xuống dòng;
  - ký hiệu bị cắt cụt ở cuối câu trả lời;
  - hướng dẫn nằm trong phần cache và prompt tất định;
  - đường gọi thật với máy chủ giả: chữ sạch, 2 `map_link`, log có `sent: 2, dropped: 1` và không chứa câu trả lời.
- **Trên trình duyệt:** chạy `next dev` với `TUTOR_MOCK=0`, khoá giả và `ANTHROPIC_BASE_URL` trỏ vào máy chủ giả, rồi hỏi gia sư bằng Chrome headless.
  - Khung chat hiện đúng 2 nút "Hannibal crosses the Alps · 218 BCE" và "Battle of Zama · 202 BCE".
  - Chữ trên trang không còn `[[map`.
  - Bấm nút Zama thì địa chỉ trang thành `?year=-202&event=battle-of-zama`.
  - Không có lỗi console.
- `npm run lint` và `npm run build` qua.

### Giới hạn và ghi chú

- **Chưa thử với model thật** (tài khoản chưa có tiền). Model có thể không theo hướng dẫn hoàn toàn: đặt ký hiệu giữa câu, viết năm dạng "216 BCE", hoặc viết sai id. Các trường hợp này đã được xử lý: ký hiệu giữa câu vẫn bị bỏ sạch, ký hiệu sai bị bỏ và đếm vào log. Khi có tiền nên xem `dropped` trong log vài ngày để chỉnh prompt.
- **Chữ đến trễ một chút:** khoảng trắng ở cuối mỗi mẩu, và một `[` cuối mẩu, đến trễ một mẩu. Người dùng không nhận ra.
- **Một trường hợp hiếm:** chữ thường có `[[map:…]]` hợp lệ cú pháp (ví dụ người dùng hỏi về chính cú pháp này) cũng bị coi là ký hiệu và bị bỏ khỏi chữ. Chấp nhận được.

### Đề nghị ngoài phạm vi (phiên chính)

- `src/lib/tutor.ts` đủ dùng, không cần sửa.
- `docs/ARCHITECTURE.md`, mục "AI tutor": có thể ghi cú pháp ký hiệu, và rằng server bỏ nút trỏ đúng vào cái đang xem.
