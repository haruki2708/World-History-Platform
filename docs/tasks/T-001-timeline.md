# T-001: Dòng thời gian và panel sự kiện

- **Lane:** 1
- **Nhánh:** `lane1/T-001-timeline`
- **Phạm vi file:** `src/components/timeline/`, `src/components/panel/`, khoá `timeline.*` và `events.*` trong `src/lib/i18n/messages.ts`

## Mục tiêu

Thay thanh trượt tạm trong `TimelineBar.tsx` bằng một dòng thời gian thật, để người dùng kéo qua 509–27 TCN và thấy ngay sự kiện nằm ở đâu trên trục thời gian.

## Hiện trạng

`TimelineBar.tsx` là một `<input type="range">` nối với `year` / `setYear` trong store. `EventPanel.tsx` liệt kê sự kiện quanh năm đang xem bằng `getEventsAround(year)` và mở chi tiết khi bấm. Cả hai đang chạy được, dùng làm điểm xuất phát.

## Yêu cầu

1. Trục thời gian có vạch chia và nhãn năm (ví dụ mỗi 50 năm), hiển thị qua `formatYear`.
2. Mỗi sự kiện là một dấu mốc trên trục. Sự kiện kéo dài (`endYear`) hiện thành một đoạn. `importance` quyết định mức nổi bật.
3. Kéo con trỏ để đổi năm, cập nhật liên tục trong lúc kéo. Bấm vào một dấu mốc thì gọi `selectEvent(id, year)`.
4. Dùng được bằng bàn phím: mũi tên trái/phải đổi 1 năm, Page Up/Down đổi 10 năm, Home/End về hai đầu. Có `aria-valuetext` đọc năm bằng ngôn ngữ đang chọn.
5. Nút phát/tạm dừng để thời gian tự chạy, có chọn tốc độ.
6. Panel sự kiện: sự kiện đang chọn và sự kiện đang diễn ra ở năm hiện tại phải dễ nhận ra; khi năm đổi, danh sách không giật.
7. Dùng được ở bề ngang 390px và ở cả chế độ sáng lẫn tối.

## Ràng buộc

- Chỉ đọc và ghi trạng thái qua `useAppStore`. Không import gì từ `src/components/map/`.
- Lấy dữ liệu qua `@/data`, không import thẳng file JSON.
- Không thêm thư viện. Nếu thấy thật sự cần, ghi đề nghị vào mục "Kết quả".
- Dữ liệu hiện mới có 9 sự kiện mẫu; Lane 3 sẽ nâng lên 40–60. Thiết kế phải chịu được 60 dấu mốc mà không chồng chéo khó đọc.

## Xong khi

- Kéo, bấm dấu mốc, bàn phím và phát tự động đều đổi `year`, và panel sự kiện cập nhật theo.
- `npm run lint` và `npm run build` qua.

## Kết quả

### Đã làm

**Dòng thời gian** (`src/components/timeline/`)

- `TimelineBar.tsx`: khung ngoài gồm nút phát/tạm dừng, năm đang xem (kèm tên sự kiện đang chọn), chọn tốc độ và trục thời gian.
- `TimelineTrack.tsx`: trục có vạch mỗi 10 năm, vạch vừa mỗi 50 năm, nhãn năm qua `formatYear`. Khoảng nhãn tự chọn theo bề ngang: mỗi 50 năm ở màn rộng, mỗi 100 năm ở màn hẹp, để nhãn không chồng nhau.
  - Kéo ở bất kỳ đâu trên trục (cả vùng dấu mốc) để đổi năm, cập nhật liên tục nhờ pointer capture; chạy được cả chuột lẫn cảm ứng (`touch-action: none`).
  - Phần tử `role="slider"` nhận bàn phím: ←/↓ lùi 1 năm, →/↑ tiến 1 năm, Page Down/Up đổi 10 năm, Home/End về hai đầu. Có `aria-valuenow` và `aria-valuetext` đọc năm theo ngôn ngữ đang chọn.
  - Dấu mốc nằm ngoài phần tử slider (con của slider không được chứa nút). Sự kiện một năm là chấm tròn, sự kiện có `endYear` là một đoạn. `importance` quyết định kích thước và độ đậm (3: to, màu accent; 2: vừa, accent nhạt; 1: nhỏ, xám). Sự kiện đang diễn ra có viền sáng, sự kiện đang chọn có viền đậm. Bấm dấu mốc gọi `selectEvent(id, year)`.
  - Dấu mốc là một `role="toolbar"` chỉ chiếm một điểm Tab; mũi tên trái/phải đi qua các mốc theo thứ tự thời gian, Enter/Space để chọn.
- `layout.ts`: hàm thuần cho vạch chia và xếp dấu mốc. Dấu mốc được xếp vào tối đa 4 hàng theo pixel thực tế, ưu tiên sự kiện quan trọng (rồi sự kiện dài, rồi sự kiện sớm) ở hàng sát trục. Sự kiện không còn chỗ được gộp thành chip "+n" ở hàng trên cùng; bấm chip thì nhảy tới năm giữa của nhóm, panel sẽ hiện các sự kiện đó. Nhờ vậy dấu mốc không bao giờ chồng lên nhau, kể cả ở 390px.
- `usePlayback.ts`: phát bằng `requestAnimationFrame`, giữ năm lẻ để tốc độ thấp vẫn mượt. Tốc độ 5/10/20/50 năm/giây (mặc định 10). Tự dừng ở 27 TCN; bấm phát khi đang ở cuối thì chạy lại từ đầu. Kéo, bấm phím trên trục hoặc bấm dấu mốc đều tạm dừng phát. Nếu năm bị đổi từ nơi khác trong lúc phát (ví dụ chọn sự kiện trên bản đồ), phát tiếp từ năm mới.
- `PlaybackControls.tsx`, `useElementWidth.ts`: nút phát, ô chọn tốc độ, đo bề ngang trục bằng `ResizeObserver`.

**Panel sự kiện** (`src/components/panel/`)

- Danh sách giờ hiện **toàn bộ** sự kiện theo thứ tự thời gian và không thêm/bớt mục khi năm đổi, nên không giật. Thay vào đó:
  - Sự kiện đang diễn ra ở năm hiện tại: thanh accent bên trái, năm tô accent, nhãn "Now / Đang diễn ra".
  - Sự kiện đang chọn: nền `bg-surface`, viền accent, mở rộng tóm tắt, thế lực, địa điểm, nguồn (như trước).
  - Sự kiện trong cửa sổ `getEventsAround(year)` hiện bình thường, các sự kiện xa hơn bị làm mờ.
  - Danh sách tự cuộn mượt để giữ sự kiện gần năm nhất ở khoảng 1/3 phía trên (hoặc sự kiện đang chọn nếu nó đang diễn ra). Chỉ cuộn khi sự kiện "neo" đổi, không cuộn theo từng năm, nên kéo trục không làm danh sách rung. Tôn trọng `prefers-reduced-motion`.
- Tách `EventListItem.tsx` từ `EventPanel.tsx`.

**Chuỗi giao diện** (`src/lib/i18n/messages.ts`, cả `en` và `vi`)

- Thêm `timeline.play`, `timeline.pause`, `timeline.speed`, `timeline.speedUnit`, `timeline.markers`, `timeline.cluster`, `events.now`.
- Bỏ `timeline.placeholder` (không còn dùng). Đổi nội dung `events.heading` thành "Events / Các sự kiện" và `events.empty` cho khớp với danh sách đầy đủ.

### Đã kiểm tra

- `npm run lint`, `npm run build`: qua.
- Chạy `npm run dev` và điều khiển Chrome thật bằng Playwright (script nằm ngoài repo), ở 1280×800 chế độ sáng và 390×844 chế độ tối:
  - Kéo: năm đổi liên tục trong lúc kéo (-485, -461, ... -268).
  - Bàn phím: →, ←, Page Up/Down, Home, End cho đúng năm; `aria-valuetext` đổi "202 BCE" thành "202 TCN" khi chuyển ngôn ngữ.
  - Bấm dấu mốc Cannae: năm thành -216, mốc có `aria-pressed=true`, panel mở chi tiết; mũi tên trong toolbar chuyển sang Zama, Enter chọn Zama.
  - Phát ở 50 năm/giây: năm chạy, tạm dừng thì đứng yên, phát tiếp thì tự dừng ở 27 TCN và nút trở về "Phát".
  - Không cuộn ngang ở 390px, không có lỗi console.
- Thử tải 60 sự kiện: tạm thay `src/data/events.json` bằng 60 sự kiện giả (dồn nhiều vào 218–201 và 91–31 TCN), chụp màn hình rồi khôi phục file gốc (không nằm trong commit). Ở 1280px: 56 dấu mốc + 3 chip; ở 390px: 37 dấu mốc + 2 chip ("+12", "+13"). Không có dấu mốc nào chồng nhau, bấm chip đưa năm tới đúng nhóm.

### Còn lại / lưu ý

- Ở 390px, với 60 sự kiện, khoảng một phần ba số sự kiện nằm trong chip "+n" vì trục chỉ rộng ~330px cho 482 năm. Muốn thấy hết từng mốc trên màn hẹp cần phóng to trục (zoom/pan); chưa làm vì ngoài yêu cầu, có thể cân nhắc ở giai đoạn 5.
- Chiều cao footer tăng theo số hàng dấu mốc đang dùng (tối đa 4 hàng + 1 hàng chip, khoảng 80px phần dấu mốc).
- Nút chỉ báo của Next dev tools (chữ "N", góc dưới) che mép phải của trục khi chạy `npm run dev`. Chỉ có ở môi trường dev.

### Đề nghị ngoài phạm vi (phiên chính quyết)

1. **`src/components/AppShell.tsx`**: ở 390px, `TutorPanel` là `shrink-0` nên panel sự kiện chỉ còn cao khoảng 1–2 mục, mục đang chọn khi mở rộng bị cắt. Đề nghị trên mobile cho khu vực panel một chiều cao tối thiểu (ví dụ `min-h-48` cho `EventPanel`), hoặc thu gọn `TutorPanel` thành dạng mở/đóng cho tới giai đoạn 4.
2. **`src/app/globals.css`**: chưa đặt `color-scheme: light dark`, nên các điều khiển gốc (thanh cuộn, menu của `<select>`) vẫn sáng trong chế độ tối. Tạm thời ô chọn tốc độ dùng class `scheme-light-dark`; đặt ở `:root` thì toàn trang được hưởng.
3. Không cần thư viện mới, không cần đổi kiểu dữ liệu hay store.
