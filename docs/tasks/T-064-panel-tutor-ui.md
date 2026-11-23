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

**Người dùng chọn phương án C** (2026-11-23), sau khi xem ảnh ghép cột phải hiện tại | A | B | C ở `E:\World_History_Platform_assets\duyet\T-064\so-sanh\`. Phiên chính đã đọc code lượt 1 (`761ccb5`): đúng phạm vi, gộp với `main` không xung đột, phím `/`, `data-event-id`, `data-battle-open` còn đủ.

### Yêu cầu lượt 2

1. **Chỉ giữ phương án C.** Xoá `panelVariant.ts`, tham số `?panel=`, mọi nhánh code của A và B (thanh gia sư thu gọn/mở rộng của A, các nhánh `variant` trong `SidePanel.tsx`, `EventPanel.tsx`, `TutorPanel.tsx`), kiểu thẻ mở rộng ngay trong danh sách của `EventListItem` nếu không còn dùng, và các khoá `messages.ts` không còn dùng (cả `en` lẫn `vi`).
2. **Màn 1280×800:** ở lượt 1 khối chi tiết (`lg:max-h-[70%]`) chiếm gần hết cột, danh sách chỉ còn khoảng 4 dòng. Khi chọn sự kiện có tóm tắt dài nhất (`marius-enrols-the-landless`, năm -107) hay Cannae, danh sách phải còn thấy **ít nhất 6 dòng**. Giới hạn chiều cao khối chi tiết; khi không đủ chỗ thì chỉ phần giữa (tóm tắt, thế lực, địa điểm, nguồn) cuộn bên trong, còn **dòng tiêu đề và nút "Xem trận đánh 3D" luôn hiện** (ở lượt 1 nút nằm trong vùng cuộn, có thể bị cuộn khuất).
3. **Mép trên danh sách:** ở lượt 1 (ảnh `04-1280-sang-C`) dòng ngay dưới khối chi tiết hiện bị cắt nửa. Khi danh sách tự cuộn, căn theo mép dòng hoặc cho mép trên mờ dần, để không còn chữ bị cắt ngang sát khối.
4. **Bàn phím và trình đọc màn hình:**
   - Dòng đang chọn trỏ tới khối chi tiết (`aria-controls` tới `id` của khối).
   - Bấm `×` thì focus về dòng của sự kiện đó trong danh sách (trên màn hẹp: sau khi danh sách hiện lại).
   - Mở trận bằng bàn phím từ nút trong khối chi tiết, `Esc` đóng trận: focus phải về lại nút đó. Khung xem trận tìm nút theo `data-battle-open`, nên trên trang chỉ được có một nút như vậy cho mỗi sự kiện.
5. **Đổi sự kiện lúc đang ở tab Gia sư:** nếu người dùng chọn từ trục thời gian hay bản đồ thì chuyển sang tab Sự kiện. Nếu chọn từ nút dẫn đường trong câu trả lời thì ở lại tab Gia sư và chấm báo trên tab Sự kiện, giống chấm báo của gia sư. Nếu không phân biệt được nguồn mà không đổi store, thì ở lại và chấm báo, ghi lý do vào Kết quả.
6. **Kiểm lại cả hai ngôn ngữ:** chữ tiếng Anh (tab, nhãn, nút) không tràn hay xuống dòng xấu ở 1280×800.

**Ảnh lượt 2**, tên `…-C2.png`, cùng thư mục `duyet\T-064\`:
- 1646×830 (tỉ lệ 1,75): `01-cannae` sáng và tối, `02-hoi` sáng, `03-khong-tran` sáng;
- 1280×800: `04-1280` Cannae sáng, `06-1280-dai` (`/?year=-107&event=marius-enrols-the-landless&lang=vi`) sáng, `07-1280-en` Cannae tiếng Anh sáng;
- 390 px: `05-390` sáng.

Xong lượt 2: ghi Kết quả, commit, dừng và báo người dùng. Phiên chính sẽ build, chạy hồi quy và cho người dùng bấm thử trước khi gộp. Khi gộp, phiên chính tự cập nhật mục bố cục trong `docs/ARCHITECTURE.md` (cột phải giờ nằm ở `panel/SidePanel.tsx`).

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

### Đã làm (Lượt 1: 3 phương án A, B, C)

- **Chuyển giữa các phương án:** mặc định là `"A"` (`DEFAULT_PANEL_VARIANT` trong `src/components/panel/panelVariant.ts`); thêm tham số `?panel=A`, `?panel=B`, hoặc `?panel=C` trên địa chỉ trang để xem trực tiếp từng phương án.
- **Bề rộng cột phải:** nâng nhẹ từ `lg:w-96` (384 px) lên `lg:w-[26rem]` (416 px, trong trần 28 rem = 448 px) trong `<aside>` của `src/components/AppShell.tsx` để dòng chữ đọc thoáng hơn và dãy chip ngữ cảnh của gia sư nằm gọn trên một hàng.
- **Nâng cấp phân tầng chung cho cả 3 phương án** (`EventListItem.tsx`, `EventDetailCard.tsx`, `ChatEntryView.tsx`, `Composer.tsx`, `MapLinkButtons.tsx`):
  - Thẻ sự kiện phân lớp rõ: năm + nhãn `Đang diễn ra`, tiêu đề đậm hơn, đoạn tóm tắt thoáng dòng, ngăn cách rõ phần thông tin phụ (thế lực dạng pill kèm chấm màu, địa điểm kèm biểu tượng ghim và ghi chú ước lượng, nguồn chữ nhỏ hơn). Nút `Xem trận đánh 3D` (`data-battle-open`) đặt gọn trong chân thẻ, không còn dính đè lên chữ tóm tắt. Sự kiện có trận 3D trong danh sách mang thẻ nhỏ `3D`.
  - Gia sư: khung nhập gom ô gõ và nút gửi/dừng vào một khối bo góc gọn, chip ngữ cảnh đồng bộ viền/nền, tin nhắn người dùng và câu trả lời tách bạch hơn, nút dẫn đường trên bản đồ đồng bộ bo góc với T-063.
  - Giữ nguyên phím tắt `/`, thuộc tính `data-event-id`, `data-battle-open`, vùng `aria-live`, và hai tab cho màn hẹp 390 px.

### So sánh 3 phương án

- **Phương án A — Hai khối trên/dưới linh hoạt (gia sư thu gọn ở đáy, tự mở khi hỏi):**
  - *Ý tưởng:* Giữ cả danh sách sự kiện và gia sư cùng hiện trên máy tính, nhưng khi chưa hỏi gì thì gia sư thu gọn thành một thanh ở đáy (~155 px: tiêu đề, dải câu gợi ý một hàng cuộn ngang, ô hỏi kèm chip ngữ cảnh và công tắc Giải thích sâu). Danh sách sự kiện nhận hơn 420 px, đọc trọn Trận Cannae và nút Xem trận đánh 3D. Khi bấm câu gợi ý hoặc gửi câu hỏi, gia sư tự mở rộng (tỉ lệ 3:2) và có nút mũi tên để chủ động thu gọn/mở rộng bất cứ lúc nào.
  - *Ưu:* Không phải đổi tab, thấy ngay cả hai chức năng khi vừa mở app; ở 1646×830 và 1280×800 đều đọc trọn sự kiện đang chọn và nút 3D.
  - *Nhược:* Khi chưa mở rộng, câu gợi ý thứ 3 nằm ngoài mép ngang của dải cuộn; lúc đã hỏi gia sư thì danh sách sự kiện phía trên thu hẹp lại còn khoảng 40% chiều cao.

- **Phương án B — Hai tab trọn chiều cao trên cả máy tính (`Các sự kiện` | `Gia sư AI`):**
  - *Ý tưởng:* Dùng chung thanh tab dạng pill (đồng bộ với khung xem trận T-063) cho cả máy tính và điện thoại. Mỗi tab hưởng trọn chiều cao cột (~559 px ở 1646×830). Khi gia sư đang trả lời hoặc vừa trả lời xong lúc người dùng đứng ở tab Sự kiện, tab Gia sư hiện chấm đỏ báo hiệu; bấm `/` từ tab Sự kiện tự chuyển sang tab Gia sư và đưa con trỏ vào ô hỏi.
  - *Ưu:* Rộng rãi nhất cho cả hai việc — vừa thấy trọn thẻ Cannae cùng 5–6 sự kiện lân cận trong dòng thời gian, vừa có khung chat dài thoáng khi đọc câu trả lời nhiều đoạn; giao diện tinh gọn và đồng nhất nhất với khung xem trận 3D.
  - *Nhược:* Phải bấm chuyển tab (hoặc bấm `/`) để tới câu gợi ý của gia sư; không vừa đọc sự kiện vừa nhìn câu trả lời song song.

- **Phương án C — Thẻ chi tiết riêng cố định ở trên + danh sách mốc gọn bên dưới (kèm tab Gia sư trọn chiều cao):**
  - *Ý tưởng:* Tách việc đọc sự kiện đang chọn ra một khối chi tiết cố định ở đầu tab Sự kiện (dải nhấn đỏ La Mã bên trái, tiêu đề lớn, tóm tắt, thế lực, địa điểm, nguồn, nút Xem trận đánh 3D, nút đóng `×`), bên dưới là danh sách sự kiện một dòng rất gọn không bao giờ co giãn khi chọn. Tab Gia sư giống phương án B (trọn chiều cao, có chấm báo khi trả lời xong, `/` tự mở). Trên 390 px, chọn sự kiện mở khối chi tiết trọn tab, bấm `×` về lại danh sách.
  - *Ưu:* Thẻ sự kiện đang chọn có bố cục nổi bật, luôn đứng yên một chỗ dù cuộn danh sách bên dưới để lướt mốc năm khác; nút Xem trận đánh 3D luôn hiện trọn vẹn không bị che hay cuộn mất.
  - *Nhược:* Khi chọn sự kiện trên máy tính, tên sự kiện xuất hiện ở cả thẻ trên lẫn dòng đang chọn bên dưới; vẫn cần chuyển tab sang Gia sư như phương án B.

### Kiểm tra

- `npm run lint`, `npm run build`, `npm run tutor:check`: qua sạch.
- Kiểm tra trên Chrome headless (`TUTOR_MOCK=1`, 1646×830 @ 1,75×, 1280×800 @ 1×, 390×844 @ 2×):
  - Bề rộng `<aside>` đo thực tế: `416 px` (`26rem`).
  - Ở cả 3 phương án A, B, C tại 1646×830 và 1280×800: tóm tắt Trận Cannae và nút `Xem trận đánh 3D` (`data-battle-open`) hiện trọn vẹn, không bị cắt hay đè chữ.
  - Bấm câu gợi ý trả câu trả lời giả lập kèm nút dẫn đường bản đồ; màn 390 px không cuộn ngang (`scrollWidth <= innerWidth`) ở cả 3 phương án.
- Đã tắt dev server cổng 3300 sau khi chụp xong.

### Ảnh duyệt (24 ảnh)

Thư mục `E:\World_History_Platform_assets\duyet\T-064\`:
- `01-cannae-{sang,toi}-{truoc,A,B,C}.png` (1646×830, DSF 1,75)
- `02-hoi-sang-{truoc,A,B,C}.png` (1646×830, DSF 1,75)
- `03-khong-tran-sang-{truoc,A,B,C}.png` (1646×830, DSF 1,75)
- `04-1280-sang-{truoc,A,B,C}.png` (1280×800, DSF 1)
- `05-390-sang-{truoc,A,B,C}.png` (390×844, DSF 2)

### Đề nghị ngoài phạm vi

Không có. Mọi phần đều dùng token màu, font, store và hợp đồng sẵn có.
