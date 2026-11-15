# T-010: Nút "xem trên bản đồ" trong câu trả lời của gia sư

- **Lane:** 1
- **Nhánh:** `lane1/T-010-tutor-map-links` (đã tạo sẵn từ `main`)
- **Phạm vi file:** `src/components/tutor/`, `src/components/timeline/`, khoá `tutor.*` trong `src/lib/i18n/messages.ts`

## Mục tiêu

Khi gia sư nhắc tới một sự kiện hay một năm, dưới câu trả lời có nút để đưa người dùng tới đó. Ví dụ bấm "Trận Cannae · 216 TCN" thì thanh thời gian về năm 216 TCN, sự kiện được chọn và bản đồ bay tới Cannae.

## Hiện trạng

- Hợp đồng mới trong `src/lib/tutor.ts`: sự kiện `{ type: "map_link", link: TutorMapLink }` với `link = { year, eventId }` (`eventId` là `null` nếu chỉ là một năm). Đọc kỹ chú thích về những gì server bảo đảm, và `TUTOR_LIMITS.maxMapLinks` (3).
- `map_link` có thể đến bất cứ lúc nào trước `done`, xen giữa các sự kiện `text`. Phần chữ không bao giờ chứa ký hiệu model dùng để tạo nút.
- **Chế độ giả lập đã gửi nút mẫu:** nút của sự kiện đang chọn, nút của một sự kiện quan trọng quanh năm đó, và một nút chỉ có năm (25 năm sau). Một nút đến giữa câu trả lời, các nút còn lại đến cuối. Câu hỏi có `#nolinks` thì không có nút.
- Khi gọi Claude thật, server chưa tạo nút. Phần đó là T-011 của lane 2, làm sau.
- Khung chat hiện bỏ qua `map_link`.

## Yêu cầu

1. **Nhận nút:** `tutorClient.ts` đọc `map_link` và chuyển cho khung chat. Phía trình duyệt vẫn kiểm tra lại (sự kiện có trong dữ liệu, năm trong phạm vi), bỏ nút trùng và giữ tối đa `maxMapLinks` nút.
2. **Hiển thị:** các nút nằm dưới phần chữ của câu trả lời và hiện ngay khi đến, cả lúc câu trả lời còn đang hiện dần.
   - Chữ trên nút dựng từ dữ liệu theo ngôn ngữ đang chọn: nút sự kiện là tên sự kiện kèm năm, nút chỉ có năm là "Đến năm 191 TCN" / "Go to 191 BCE". Đổi ngôn ngữ thì chữ trên các nút cũ đổi theo.
   - Câu trả lời bị dừng hoặc lỗi giữa chừng vẫn giữ các nút đã nhận.
3. **Bấm nút:**
   - Nút sự kiện gọi `selectEvent(eventId, year)`; nút chỉ có năm gọi `setYear(year)`.
   - Nếu thanh thời gian đang phát thì dừng lại, như khi người dùng tự kéo.
   - Nút trùng với cái đang xem (đúng năm, đúng sự kiện) được đánh dấu là đang xem.
4. **Trợ năng:** nút dùng được bằng bàn phím, có nhãn đầy đủ cho trình đọc màn hình (ví dụ "Xem trên bản đồ: Trận Cannae, 216 TCN").
5. Ưu tiên máy tính; trên điện thoại chỉ cần không vỡ trang.

## Ràng buộc

- Không sửa `src/lib/tutor.ts`, `src/server/` hay `src/store/useAppStore.ts`. Cần thay đổi ở đó thì ghi đề nghị vào mục "Kết quả".
- Lịch sử gửi lên server vẫn chỉ gồm phần chữ của câu trả lời, không kèm nút.
- Không thêm thư viện.

## Xong khi

- Với `TUTOR_MOCK=1`: hỏi khi đang chọn Cannae thì có nút Cannae (đến giữa câu trả lời), một nút sự kiện khác và một nút năm; bấm từng nút thì thanh thời gian, panel và bản đồ đi đúng chỗ. Câu hỏi có `#nolinks` không có nút. Đang phát mà bấm nút thì dừng phát. Đổi ngôn ngữ thì chữ trên nút đổi theo.
- `npm run lint` và `npm run build` qua; không có lỗi console.

## Kết quả

_(Lane 1 điền khi xong.)_
