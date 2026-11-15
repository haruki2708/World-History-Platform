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

Lane 1, 2026-11-16. Hai commit trên nhánh `lane1/T-010-tutor-map-links`: `02ef1af` (dừng phát), `bfbb807` (nút trong câu trả lời).

### Đã làm

- **`tutor/mapLinks.ts` (mới):** `sanitizeMapLink` kiểm tra lại từng nút phía trình duyệt. Năm phải là số nguyên trong `[YEAR_MIN, YEAR_MAX]`. Nếu có sự kiện thì sự kiện phải có trong dữ liệu và đang diễn ra trong năm đó (`isEventActive`), đúng như điều server bảo đảm. Nút sai thì bỏ, không báo lỗi. `addMapLink` bỏ nút trùng và giữ tối đa `TUTOR_LIMITS.maxMapLinks` nút.
- **`tutorClient.ts`:** đọc `map_link`, kiểm tra rồi chuyển qua callback mới `onMapLink`.
- **`useTutorChat.ts`:** mỗi câu trả lời có thêm `links`. Nút được thêm ngay khi đến, kể cả lúc chữ còn đang hiện dần. Câu trả lời bị dừng hay lỗi vẫn giữ nút đã nhận; "Thử lại" tạo câu trả lời mới với danh sách nút trống. `toHistory` không đổi, nên lịch sử gửi lên server vẫn chỉ có phần chữ.
- **`tutor/MapLinkButtons.tsx` (mới), gắn vào `ChatEntryView.tsx`:** các nút nằm ngay dưới phần chữ, trên dòng "Đã dừng"/lỗi.
  - Chữ trên nút dựng từ dữ liệu theo ngôn ngữ đang chọn: "Trận Cannae · 216 TCN" (biểu tượng ghim) hoặc "Đến năm 191 TCN" (biểu tượng đồng hồ). Đổi ngôn ngữ thì nút cũ đổi theo.
  - Nhãn cho trình đọc màn hình: "Xem trên bản đồ: Trận Cannae, 216 TCN"; nút chỉ có năm thì "Xem trên bản đồ: 191 TCN". Nhóm nút có nhãn "Xem trên bản đồ".
  - Bấm nút sự kiện gọi `selectEvent(eventId, year)`, nút năm gọi `setYear(year)`.
  - Nút trùng với cái đang xem được đánh dấu bằng viền và nền tông accent, biểu tượng đổi thành dấu tích, kèm `aria-current="location"` và tooltip "Đang xem". Trùng nghĩa là: nút sự kiện thì đúng năm và đúng sự kiện; nút năm thì đúng năm. Ban đầu tôi dùng chữ "ĐANG XEM" trên nút, nhưng chữ làm nút rộng ra và đẩy nút bên cạnh xuống dòng mỗi lần bấm, nên đã đổi sang dấu tích.
- **`timeline/usePlayback.ts`, cách dừng phát:** trong lúc phát, hook theo dõi store. Nếu năm đổi sang giá trị mà chính nó không ghi, hoặc có sự kiện mới được chọn, thì dừng phát. Tutor không cần import gì từ timeline, đúng quy tắc chỉ giao tiếp qua `useAppStore`.
  - **Thay đổi hành vi cần phiên chính biết:** trước đây chọn sự kiện ở panel hay trên bản đồ trong lúc phát thì phát vẫn tiếp tục từ năm mới. Giờ cũng dừng, giống khi người dùng tự kéo. Tôi nghĩ hợp lý hơn: đã chọn một sự kiện thì muốn dừng lại xem. Nếu muốn giữ hành vi cũ cho panel và bản đồ thì cần một kênh riêng để tutor yêu cầu dừng (xem đề nghị bên dưới).
  - Bỏ chọn sự kiện hay đổi tốc độ không làm dừng phát.
- **`messages.ts`:** `tutor.mapLinks`, `tutor.mapLink.year`, `tutor.mapLink.label`, `tutor.mapLink.current` cho cả `en` lẫn `vi`.

### Đã kiểm tra

- `npm run lint`, `npm run build` qua.
- Chạy `npm run dev` với `TUTOR_MOCK=1`, điều khiển Chrome headless bằng script tạm qua DevTools Protocol, không thêm thư viện vào dự án. Cả 26 kiểm tra đều qua, console không có lỗi hay cảnh báo:
  - Hỏi khi đang chọn Cannae: nút Cannae hiện khi câu trả lời còn đang chạy. Khi xong có đủ 3 nút: Cannae (đánh dấu đang xem), Trận Zama · 202 BCE, "Go to 191 BCE". Nhãn cho trình đọc màn hình đúng.
  - Bấm Zama: thanh thời gian về 202 TCN, panel mở Zama, địa chỉ đổi, bản đồ bay tới Zama (đã xem ảnh chụp), dấu "đang xem" chuyển sang nút Zama. Bấm nút năm: về 191 TCN. Bấm Cannae: về lại 216 TCN.
  - Đang phát mà bấm nút năm hay nút sự kiện thì dừng, năm đứng đúng chỗ của nút. Chọn sự kiện ở panel cũng dừng. Phát bình thường, đổi tốc độ khi đang phát, bỏ chọn sự kiện khi đang phát đều không bị dừng ngoài ý muốn.
  - Đổi sang tiếng Việt: "Trận Cannae · 216 TCN", "Đến năm 191 TCN", nhãn "Xem trên bản đồ: Trận Cannae, 216 TCN".
  - `#nolinks`: không có nút. Yêu cầu gửi đi sau đó chỉ có `role`, `content` (và `context` cho câu hỏi), không có nút.
  - Bấm dừng sau khi nút đầu tiên đến: câu trả lời "Đã dừng" vẫn giữ nút đó. Focus vào nút rồi bấm Enter cũng dùng được.
  - Ở 390px: đủ 3 nút, không cuộn ngang. Ảnh chụp ở 1280×800 và 390px đều ổn.
- Khi chạy thử liên tục, route trả `rate_limited` (giới hạn 6 câu mỗi phút của T-007). Đó là hành vi đúng của route; chờ hết một phút rồi chạy lại thì qua hết.
- Chưa thử với người thao tác thật, chưa thử Firefox/Safari, và chưa thử với Claude thật (server chưa tạo nút, đó là T-011).

### Hạn chế còn lại

- **Bấm nút của sự kiện đang được chọn thì bản đồ không bay lại.** Ví dụ đang chọn Cannae, người dùng kéo bản đồ đi chỗ khác rồi bấm nút Cannae: thanh thời gian về đúng năm, nhưng bản đồ đứng yên. Lý do: `MapView` chỉ bay khi `selectedEventId` đổi, mà gọi lại `selectEvent` với cùng id thì không đổi gì. Tôi suy ra điều này từ code, chưa thử trong trình duyệt. Trường hợp này hay gặp, vì nút đầu tiên thường là sự kiện đang chọn.
- Nút năm trùng đúng năm đang phát (khó xảy ra) không đổi năm, nên không làm dừng phát.

### Đề nghị ngoài phạm vi (phiên chính quyết)

1. **Cho bản đồ bay lại khi chọn lại cùng sự kiện:** ví dụ thêm vào store một bộ đếm `focusRequest` (hoặc `selectEvent` luôn tăng một số thứ tự), và `MapView` bay theo bộ đếm đó thay vì chỉ theo `selectedEventId`. Việc này chạm `useAppStore.ts` (phiên chính) và `MapView.tsx` (lane 2).
2. Nếu phiên chính muốn giữ hành vi cũ (chọn ở panel hay bản đồ thì phát vẫn tiếp tục), cần thêm vào store một hành động kiểu `requestPause()` để tutor gọi, và `usePlayback` chỉ dừng theo yêu cầu đó.
3. Cập nhật `docs/ARCHITECTURE.md` nếu đồng ý: "đang phát thì mọi thay đổi năm từ bên ngoài hoặc chọn sự kiện sẽ dừng phát".
