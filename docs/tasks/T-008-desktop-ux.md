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

_(Lane 1 điền khi xong.)_
