# T-008: Trải nghiệm trên máy tính

- **Lane:** 1
- **Nhánh:** `lane1/T-008-desktop-ux` (đã tạo sẵn từ `main`)
- **Phạm vi file:** `src/components/timeline/`, `src/components/panel/`, `src/components/tutor/`, `src/components/LocaleSwitch.tsx`, thư mục mới `src/components/shell/`, khoá `share.*`, `shortcuts.*`, `timeline.*`, `tutor.*` trong `src/lib/i18n/messages.ts`. Trong `src/components/AppShell.tsx` chỉ được thêm dòng để gắn các component mới (ví dụ nút chia sẻ cạnh nút đổi ngôn ngữ ở header); không sửa bố cục.

## Mục tiêu

Ba việc giúp dùng app trên máy tính thuận tiện hơn: gửi được đường link mở thẳng vào đúng năm và sự kiện, app nhớ ngôn ngữ đã chọn, và điều khiển được bằng phím tắt.

## Hiện trạng

- Dự án ưu tiên máy tính (xem `CLAUDE.md`). Thiết kế và kiểm tra chính ở 1280×800; trên điện thoại chỉ cần không vỡ trang.
- Trạng thái phát/tạm dừng hiện nằm trong `TimelineBar` (`usePlayback`). Phím tắt toàn trang cần điều khiển được nó; tổ chức lại thế nào là việc của lane, miễn là không sửa `src/store/useAppStore.ts`.
- `selectEvent(id, year)` đã làm bản đồ bay tới sự kiện và panel mở chi tiết.

## Yêu cầu

1. **Link chia sẻ.**
   - Thanh địa chỉ phản ánh trạng thái đang xem bằng tham số: `year` (số, ví dụ `-216`), `event` (id sự kiện, nếu có chọn), `lang` (`en` hoặc `vi`). Ví dụ: `/?year=-216&event=battle-of-cannae&lang=vi`.
   - Mở một link như vậy thì app vào đúng năm, chọn đúng sự kiện (bản đồ bay tới) và đúng ngôn ngữ. Tham số sai (năm ngoài phạm vi, sự kiện không tồn tại) thì bỏ qua tham số đó, không báo lỗi.
   - Cập nhật địa chỉ bằng `history.replaceState`, không tạo mục mới trong lịch sử trình duyệt mỗi lần năm đổi; không cập nhật liên tục trong lúc kéo hay phát tự động (chỉ khi đã dừng, hoặc có độ trễ nhỏ).
   - Nút "Chia sẻ" ở header: chép link hiện tại vào bộ nhớ tạm và báo ngắn "Đã chép link". Nếu trình duyệt không cho chép thì hiện link để người dùng tự chép.
2. **Nhớ ngôn ngữ.** Lưu lựa chọn trong `localStorage`. Thứ tự ưu tiên khi mở trang: tham số `lang` trên link, rồi lựa chọn đã lưu, rồi ngôn ngữ của trình duyệt (bắt đầu bằng `vi` thì chọn tiếng Việt), cuối cùng là tiếng Anh. Mọi truy cập `localStorage` đặt trong `try/catch`; không dùng được thì vẫn chạy bình thường.
3. **Phím tắt.**
   - Space: phát hoặc tạm dừng.
   - ← / →: lùi hoặc tiến 1 năm; Shift + ← / →: 10 năm. Home / End: về hai đầu.
   - `/`: đưa con trỏ vào ô hỏi gia sư. Esc: rời ô nhập.
   - `?`: mở bảng liệt kê phím tắt (song ngữ, đóng bằng Esc hoặc nút đóng, giữ focus trong bảng khi đang mở).
   - Không kích hoạt khi đang gõ trong ô nhập, khi đang giữ Ctrl, Alt hoặc Cmd, khi focus đang ở trên bản đồ (mũi tên dùng để kéo bản đồ), và không chặn Space hay Enter khi focus đang ở một nút.
   - Có một gợi ý nhỏ, dễ thấy nhưng không chiếm chỗ, cho biết bấm `?` để xem phím tắt.

## Ràng buộc

- Không sửa `src/store/useAppStore.ts`, `src/lib/types.ts` hay `src/lib/tutor.ts`. Cần thay đổi ở đó thì ghi đề nghị vào mục "Kết quả".
- Không thêm thư viện.
- Mọi chuỗi mới đều song ngữ.

## Xong khi

- Mở link có `year`, `event`, `lang` vào đúng trạng thái; link có tham số sai vẫn mở bình thường.
- Đổi năm, chọn sự kiện, đổi ngôn ngữ thì địa chỉ đổi theo, nút Quay lại của trình duyệt không bị lấp đầy.
- Tải lại trang thì giữ ngôn ngữ đã chọn.
- Tất cả phím tắt hoạt động đúng và không làm phiền khi gõ chữ hay khi đang ở trên bản đồ.
- `npm run lint` và `npm run build` qua; trang không vỡ ở bề ngang 390px.

## Kết quả

Lane 1, 2026-11-16. Hai commit trên nhánh `lane1/T-008-desktop-ux`: `e6ab4ca` (link và nhớ ngôn ngữ), `f28dd40` (nút chia sẻ và phím tắt).

### Đã làm

**Thư mục mới `src/components/shell/`:**

- `urlState.ts`: đọc và dựng tham số `year`, `event`, `lang`. Mỗi tham số được kiểm tra riêng: năm phải là số nguyên trong `[YEAR_MIN, YEAR_MAX]`, sự kiện phải có trong dữ liệu, ngôn ngữ phải là `en` hoặc `vi`. Tham số sai thì bỏ qua, các tham số khác vẫn dùng. Tham số lạ khác trên link (ví dụ `utm=...`) được giữ nguyên.
- `UrlSync.tsx` (không hiển thị gì): khi tải trang thì áp tham số từ link vào store. Link có `event` mà không có `year` hợp lệ thì mở ở năm của sự kiện. Link có cả hai thì dùng đúng năm trên link. Sau đó địa chỉ theo store bằng `history.replaceState`: chọn sự kiện hoặc đổi ngôn ngữ thì cập nhật ngay, đổi năm thì chờ năm đứng yên 400 ms. Nhờ vậy địa chỉ không đổi liên tục khi kéo hay phát tự động. Lúc mở trang, địa chỉ được viết lại ngay về dạng chuẩn, nên tham số sai biến mất.
- `locale.ts`: lưu và đọc ngôn ngữ trong `localStorage` (khoá `whp.locale`, mọi truy cập đều nằm trong `try/catch`). Thứ tự ưu tiên khi mở trang: `lang` trên link, rồi lựa chọn đã lưu, rồi ngôn ngữ trình duyệt (bắt đầu bằng `vi` thì chọn tiếng Việt), cuối cùng là tiếng Anh. Chỉ lưu khi người dùng bấm nút đổi ngôn ngữ (`LocaleSwitch`). Mở một link `lang=vi` của người khác không ghi đè lựa chọn đã lưu.
- `ShareButton.tsx`: nút "Chia sẻ" dựng link từ store (không lấy từ thanh địa chỉ, nên đúng cả khi địa chỉ còn đang chờ năm đứng yên) rồi chép vào bộ nhớ tạm. Chép được thì hiện "Đã chép link" khoảng 2 giây (có `role="status"`). Trình duyệt không cho chép thì mở hộp thoại hiện link, ô link được chọn sẵn để người dùng tự chép.
- `Modal.tsx`: hộp thoại dùng chung, dựa trên `<dialog>` gốc. Phần trang phía sau bị vô hiệu, Esc đóng, Tab và Shift+Tab chỉ quay vòng trong hộp thoại, bấm ra ngoài thì đóng, đóng xong focus trở về chỗ cũ.
- `keyboard.ts`: điều kiện chung quyết định khi nào một phím được dùng làm phím tắt, cùng hook `useShortcuts` và `useEscapeLeavesField`. Phím tắt không chạy khi: đã có thành phần khác xử lý phím đó (`defaultPrevented`), đang giữ Ctrl/Alt/Cmd, đang gõ dở bằng bộ gõ (IME), đang mở hộp thoại, focus ở ô nhập, textarea, select hoặc vùng sửa được, focus nằm trong bản đồ (`.maplibregl-map`, lớp của MapLibre), hoặc bấm Space khi focus đang ở nút, link, switch, tab...
- `ShortcutsHelp.tsx`: nút nhỏ `?` + "Phím tắt" ở header. Đây vừa là gợi ý vừa là chỗ mở bảng; trên màn hẹp chỉ còn ô `?`. Bảng phím tắt song ngữ, đóng bằng Esc hoặc nút đóng. File này cũng giữ phím `?` và phím Esc để rời ô nhập.
- `HeaderActions.tsx`: nhóm phía phải header (gợi ý phím tắt, Chia sẻ, đổi ngôn ngữ).

**Sửa trong vùng của lane 1:**

- `TimelineBar.tsx`: đăng ký Space (phát/tạm dừng), ←/→ (1 năm, Shift: 10 năm), Home/End. Trạng thái phát vẫn nằm trong `usePlayback`; phím tắt được đăng ký ngay cạnh nó nên không phải chuyển trạng thái này ra ngoài. Đổi năm bằng phím thì dừng phát, giống khi kéo.
- `TimelineTrack.tsx`: khi focus ở thanh trượt, Shift + mũi tên cũng đi 10 năm, khớp với phím tắt toàn trang. Thanh trượt và dãy mốc sự kiện tự xử lý mũi tên của mình, nên phím tắt toàn trang không chạy thêm lần nữa.
- `TutorPanel.tsx`: phím `/` đưa con trỏ vào ô hỏi.
- `Composer.tsx`, `PlaybackControls.tsx`: thêm `aria-keyshortcuts`.
- `LocaleSwitch.tsx`: lưu lựa chọn.
- `messages.ts`: khoá `share.*` và `shortcuts.*` cho cả `en` lẫn `vi`.

**`AppShell.tsx`:** thêm `<UrlSync />` và thay `<LocaleSwitch />` bằng `<HeaderActions />` (bên trong vẫn có `LocaleSwitch`). Bố cục header không đổi; bỏ import `LocaleSwitch` vì không còn dùng ở đây.

### Đã kiểm tra

- `npm run lint`, `npm run build` qua.
- Chạy thử trên `npm run dev` (`TUTOR_MOCK=1`) bằng Chrome headless, điều khiển qua DevTools Protocol bằng một script tạm (không thêm thư viện vào dự án). Kết quả: cả 54 kiểm tra đều qua, console không có lỗi hay cảnh báo:
  - Link `/?year=-216&event=battle-of-cannae&lang=vi` mở đúng năm, đúng sự kiện (bản đồ bay tới), tiếng Việt. Link chỉ có `event` mở ở năm của sự kiện. Link `?year=-1000&event=khong-co&lang=fr&utm=x` mở bình thường ở năm mặc định, địa chỉ được sửa thành `?year=-509&lang=en&utm=x`. Link `year=abc` kèm sự kiện đúng vẫn chọn được sự kiện.
  - Đổi năm nhiều lần: `history.length` không tăng. Trong lúc phát, địa chỉ đứng yên; dừng lại thì địa chỉ theo năm mới. Chọn sự kiện hoặc đổi ngôn ngữ thì địa chỉ đổi ngay.
  - Bấm "Tiếng Việt" rồi tải lại `/` thì vẫn tiếng Việt. `/?lang=en` thắng lựa chọn đã lưu và không ghi đè nó.
  - Phím tắt: Space, ←/→, Shift+←/→, Home/End, `/`, Esc, `?` chạy đúng. Ctrl+→ bị bỏ qua. Khi đang gõ trong ô hỏi, chữ và dấu cách được gõ bình thường, không phím tắt nào chạy. Khi focus ở bản đồ, mũi tên và Space không đổi năm. Space trên một nút thì bấm nút đó, không phát. Mũi tên trên thanh trượt chỉ đi 1 bước, không bị cộng hai lần. Khi bảng phím tắt đang mở: Tab không ra khỏi bảng, phím tắt khác tạm tắt, Esc và nút đóng đều đóng bảng, focus trở về nút `?`.
  - Chia sẻ: có quyền clipboard thì hiện "Link copied" và nội dung chép đúng link. Giả lập clipboard bị từ chối thì mở hộp thoại, link được chọn sẵn, Esc đóng.
  - Đã chụp và xem ảnh ở 1280×800 cả chế độ sáng lẫn tối, cả hai ngôn ngữ. Ở 390px không có cuộn ngang; header xuống hai dòng, bảng phím tắt vừa màn hình.
- Chưa thử trên trình duyệt thật có người dùng thao tác (phiên này không bật được Claude in Chrome), cũng chưa thử Firefox/Safari.

### Hạn chế còn lại

- **Chớp ngôn ngữ khi tải trang.** Trang được dựng sẵn tĩnh bằng tiếng Anh; tiếng Việt (từ link hoặc lựa chọn đã lưu) chỉ được áp sau khi JavaScript chạy, nên có một khoảnh khắc thấy tiếng Anh. Thời gian mở link hay tải lại trang vẫn đúng.
- **`/` trên màn hẹp** không làm gì khi đang ở tab "Sự kiện", vì ô hỏi đang bị ẩn. Muốn tự chuyển sang tab "Gia sư AI" thì trạng thái tab trong `AppShell` phải đọc được từ bên ngoài. Theo `CLAUDE.md` đây là phần chỉ cần dùng được trên điện thoại, nên tôi để nguyên.
- Bấm Quay lại sau khi đã mở app sẽ rời khỏi app (đúng yêu cầu: không tạo mục lịch sử mới).

### Đề nghị ngoài phạm vi (phiên chính quyết)

1. **Bỏ chớp ngôn ngữ:** có thể chèn một script nhỏ chạy trước khi trang hiện ra, trong `src/app/layout.tsx`, để đọc `lang`/`localStorage`. Hoặc cho store nhận ngôn ngữ ban đầu từ bên ngoài. Cả hai đều chạm `layout.tsx` hoặc `useAppStore.ts`, nằm ngoài vùng của lane 1.
2. Cập nhật `docs/ARCHITECTURE.md`, mục "Đa ngôn ngữ": câu "Lựa chọn hiện chưa được lưu giữa các lần tải trang" không còn đúng. Nên thêm mô tả tham số URL (`year`, `event`, `lang`), khoá `whp.locale` và thư mục `src/components/shell/` vào phần tổng quan.
