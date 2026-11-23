# T-064: Panel sự kiện và gia sư, làm thử phương án giao diện

- **Lane:** Gemini Neon. **Mượn vùng của lane 1 cho riêng task này** (người dùng chọn 2026-11-23). Lane 1 không sửa các file trong phạm vi dưới đây cho tới khi task được gộp; gộp xong, vùng trả về lane 1.
- **Nhánh:** `gemini/T-064-panel-tutor-ui` (phiên chính đã tạo sẵn từ `main` trong worktree `E:\World_History_Platform_lanes\lane-gemini-neon`).
- **Phạm vi file:** `src/components/panel/`; phần giao diện của gia sư: `src/components/tutor/TutorPanel.tsx`, `ChatEntryView.tsx`, `Composer.tsx`, `MapLinkButtons.tsx`; trong `src/components/AppShell.tsx` **chỉ phần `<aside>`** (cột bên phải: bề rộng, cách chia chỗ giữa sự kiện và gia sư, hai tab của màn hẹp); thêm khoá `events.*`, `tutor.*`, `panel.*` vào `src/lib/i18n/messages.ts` (cả `en` lẫn `vi`).
- **Không sửa:** logic gia sư (`useTutorChat.ts`, `tutorClient.ts`, `mapLinks.ts`), hợp đồng `src/lib/tutor.ts`, `src/store/`, `src/app/globals.css` (giữ nguyên token màu và font), header và `src/components/shell/`, trục thời gian, bản đồ và chú giải (`src/components/map/`, vùng lane 2), `src/components/battle/`.

## Bối cảnh

Người dùng chọn làm đẹp panel sự kiện và gia sư (2026-11-23), sau khi xem app ở cửa sổ thật của họ: 1646×830 điểm ảnh CSS, tỉ lệ điểm ảnh 1,75. Ảnh hiện trạng: `E:\World_History_Platform_assets\duyet\giao-dien\hien-tai-sang.jpg` và `hien-tai-toi.jpg`. Những chỗ chưa ổn:

1. Panel sự kiện chỉ được 2/5 chiều cao cột (`lg:flex-[2]`, gia sư `lg:flex-[3]`). Ở 830 px chỉ thấy một thẻ; tóm tắt bị cắt giữa dòng; nút "Xem trận đánh 3D" (dính ở đáy danh sách) đè lên dòng bên dưới.
2. Gia sư chiếm 3/5 cột kể cả khi chưa hỏi gì (lời chào và ba câu gợi ý).
3. Thẻ sự kiện ít phân tầng: tóm tắt, thế lực, địa điểm, nguồn gần như cùng một kiểu chữ.

Người dùng chọn:
- **Làm thử 2–3 phương án**, chụp ảnh cho người dùng chọn rồi mới hoàn thiện.
- **Giữ token màu và font** (đỏ La Mã, nền giấy, Inter); chỉ đổi cách phối: độ đậm nhạt, viền, bóng, cỡ chữ, khoảng cách, bo góc.
- Chỉ panel sự kiện và gia sư; không đụng header, trục thời gian, bản đồ.

Hướng thiết kế nên hợp với khung xem trận mới (T-063): khối bo góc, phân tầng rõ, chấm màu phe, chữ dễ đọc.

## Lượt 1: 2–3 phương án, dừng cho người dùng chọn

Gợi ý hướng. Lane có thể đổi hoặc thay bằng hướng của mình, nhưng các phương án phải khác nhau rõ:

- **A. Giữ hai khối trên dưới, chia lại chỗ.** Sự kiện đang chọn đọc trọn; gia sư thu thành ô hỏi ở đáy khi chưa dùng, mở rộng khi bắt đầu hỏi.
- **B. Hai tab trong cột (Sự kiện | Gia sư) cả trên máy tính**, mỗi tab dùng hết chiều cao. Có dấu hiệu khi gia sư trả lời xong lúc người dùng đang ở tab kia.
- **C. Khối chi tiết riêng cho sự kiện đang chọn** (tiêu đề lớn, năm, tóm tắt, thế lực, địa điểm, nguồn, nút xem trận), danh sách sự kiện gọn bên dưới hoặc thu lại; gia sư như A hoặc B.

Mỗi phương án phải:

1. Ở 1646×830, đọc trọn tóm tắt của sự kiện đang chọn, không bị nút hay khối nào che. Nút "Xem trận đánh 3D" luôn thấy được khi sự kiện có trận.
2. Giữ đủ những gì đang có:
   - Danh sách sự kiện: theo thời gian, tự cuộn tới sự kiện của năm, đánh dấu sự kiện đang diễn ra, làm mờ sự kiện xa.
   - Thẻ sự kiện: tóm tắt, thế lực kèm màu, địa điểm (kèm "ước lượng" khi có), nguồn.
   - Gia sư: chip ngữ cảnh gửi kèm (năm, sự kiện, vùng bản đồ), câu gợi ý, "Giải thích sâu", nút dừng, nút xoá cuộc trò chuyện, nút dẫn đường trên bản đồ trong câu trả lời, vùng `aria-live`.
3. Giữ phím `/` (nhảy vào ô hỏi) và các thuộc tính `data-event-id`, `data-battle-open`. Chuyến bay bản đồ, khung xem trận (trả focus về nút có `data-battle-open` khi đóng) và script thử của phiên chính đều dùng chúng.
4. Bề ngang 390 px vẫn dùng được: giữ hai tab của màn hẹp, không cuộn ngang. Không tinh chỉnh riêng cho điện thoại.
5. Không khối nào đè lên bản đồ, vì nhãn trên bản đồ (lane 2) chưa biết né. Cột phải được rộng hơn hiện tại (`lg:w-96`, 384 px) nếu cần, tối đa 28rem (448 px); ghi rõ trong Kết quả.

Cách chuyển giữa các phương án tuỳ lane (ví dụ một hằng số tạm). Sau khi người dùng chọn thì xoá sạch phần của các phương án không chọn.

**Ảnh duyệt** đặt ở `E:\World_History_Platform_assets\duyet\T-064\`. Chụp với `TUTOR_MOCK=1`, URL gốc `/?year=-216&event=battle-of-cannae&lang=vi`. Cỡ chính là 1646×830, tỉ lệ điểm ảnh 1,75 (cửa sổ thật của người dùng, không phải 1646×926 như T-063). Tên file `<số>-<cảnh>-<sang|toi>-<truoc|A|B|C>.png` (`truoc` là `main` hiện tại):

- `01-cannae`: Cannae đang chọn, gia sư chưa dùng; sáng và tối.
- `02-hoi`: sau khi bấm một câu gợi ý (câu trả lời giả lập có nút dẫn đường); sáng.
- `03-khong-tran`: một sự kiện không có trận (`/?year=-509&event=founding-of-the-republic&lang=vi`); sáng.
- `04-1280`: Cannae ở 1280×800, tỉ lệ 1; sáng.
- `05-390`: Cannae ở 390 px; sáng.

Ảnh PNG cỡ 2880×1452 có thể làm treo client DevTools; nếu treo thì chụp JPEG.

Xong lượt 1: mỗi phương án một đoạn ngắn trong mục "Kết quả" (ý tưởng, ưu, nhược), commit, **dừng và báo người dùng**.

## Lượt 2

Phiên chính sẽ ghi yêu cầu lượt 2 vào file này sau khi người dùng chọn: hoàn thiện phương án được chọn, xoá phần còn lại.

## Ràng buộc

- Màu dùng token trong `globals.css`, không viết mã màu trực tiếp (trừ màu thế lực lấy từ dữ liệu, như hiện nay). Đúng ở cả sáng lẫn tối.
- Chuỗi mới qua `useT()`, đủ `en` và `vi`. Năm hiển thị qua `formatYear` / `formatYearRange`.
- Chuyển động chỉ dùng `opacity` và `transform`, tôn trọng `prefers-reduced-motion`.
- Không thêm thư viện, không đổi store hay hợp đồng. Cần thì ghi đề nghị vào mục "Kết quả".
- Đọc hướng dẫn trong `node_modules/next/dist/docs/` trước khi viết code Next.js.

## Chạy thử

- Một dev server duy nhất: `npm run dev -- -p 3300` với `TUTOR_MOCK=1`; tắt khi xong. Không tắt server của phiên khác (3000, 3105, 3106, 32xx).
- Máy người dùng ít RAM: không chạy hai bản build cùng lúc.

## Xong khi

- `npm run lint`, `npm run build`, `npm run tutor:check` qua.
- Lượt 1: đủ ảnh, mục "Kết quả" ghi các phương án, đã commit, dừng.

## Kết quả

(Lane điền.)
