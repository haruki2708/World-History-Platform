# T-013: Giới thiệu, cách dùng và ghi công

- **Lane:** 1
- **Nhánh:** `lane1/T-013-about` (đã tạo sẵn từ `main`)
- **Phạm vi file:** `src/components/shell/`, khoá `about.*` trong `src/lib/i18n/messages.ts`

## Mục tiêu

Trước khi đưa app ra Internet, người dùng cần một chỗ đọc: app này là gì, dùng thế nào, độ chính xác đến đâu, dữ liệu lấy từ đâu. Đây cũng là nơi ghi công đầy đủ các nguồn dữ liệu.

## Hiện trạng

- Header có nút phím tắt `?`, nút Chia sẻ và nút đổi ngôn ngữ (`src/components/shell/HeaderActions.tsx`). Đã có hộp thoại dùng chung `Modal.tsx`.
- Chú giải bản đồ có một dòng ghi công ngắn. Ghi công đầy đủ hiện chỉ có trong `README.md`.
- Nguồn và giấy phép: `docs/data/SOURCES.md`, `docs/data/BORDERS.md`, `public/map/README.md`. Cách gia sư hoạt động: `docs/ARCHITECTURE.md`, mục "AI tutor".

## Yêu cầu

1. **Nút "Giới thiệu" ở header** mở một hộp thoại, dùng `Modal.tsx`, gồm các phần:
   - **App này là gì:** khám phá Cộng hoà La Mã và thế giới Địa Trung Hải 509–27 TCN qua dòng thời gian, bản đồ và gia sư AI.
   - **Cách dùng:** kéo hoặc phát thanh thời gian; bấm sự kiện ở panel, trên bản đồ hoặc trên dòng thời gian; hỏi gia sư, câu hỏi luôn kèm năm và vùng đang xem; nút trong câu trả lời đưa tới đúng chỗ; link Chia sẻ. Có một nút mở bảng phím tắt.
   - **Độ chính xác:** biên giới là ước lượng và vẽ lại; bờ biển và sông là của ngày nay; nhiều mốc năm thời đầu Cộng hoà là theo truyền thống; gia sư AI có thể sai, nên đối chiếu với nguồn ghi ở từng sự kiện.
   - **Nguồn và ghi công:** Natural Earth (phạm vi công cộng); *Historical Atlas* của W. R. Shepherd (phạm vi công cộng); Cliopatria v0.2.1 của Seshat Global History Databank (Bennett J. S. và cộng sự, *Scientific Data* 12, 247, 2025) theo giấy phép CC BY 4.0, có link tới dữ liệu và giấy phép, ghi rõ là "đã đơn giản hoá và vẽ lại"; sử liệu cổ dẫn theo từng sự kiện. Lấy đúng nội dung từ `docs/data/SOURCES.md` và `README.md`, không tự thêm nguồn.
   - **Gia sư AI:** dùng Claude của Anthropic; mỗi câu hỏi được gửi kèm năm, sự kiện đang chọn và vùng bản đồ đang xem; app không lưu cuộc trò chuyện (lịch sử chỉ nằm trong trang, mất khi tải lại). Không viết gì về cách Anthropic xử lý dữ liệu.
2. **Lần đầu mở app:** một gợi ý nhỏ, không che nội dung chính, mời xem phần giới thiệu, kèm nút đóng. Đã đóng hoặc đã mở giới thiệu thì không hiện lại; nhớ bằng `localStorage`, mọi truy cập đặt trong `try/catch`.
3. Song ngữ, đọc rõ ở cả chế độ sáng lẫn tối, dùng được bằng bàn phím. Ưu tiên máy tính; trên điện thoại chỉ cần không vỡ trang.

## Ràng buộc

- Mọi thông tin về nguồn, giấy phép và cách gia sư hoạt động phải khớp với tài liệu trong repo. Chỗ nào không chắc thì ghi vào mục "Kết quả", không tự đoán.
- Trong `AppShell.tsx` chỉ được thêm dòng để gắn component mới, không sửa bố cục.
- Không thêm thư viện.

## Xong khi

- Mở hộp thoại bằng nút ở header, đọc đủ các phần ở cả hai ngôn ngữ; nút mở bảng phím tắt hoạt động; đóng bằng Esc.
- Gợi ý lần đầu hiện ra, đóng xong thì tải lại trang không hiện nữa.
- `npm run lint` và `npm run build` qua; không có lỗi console.

## Kết quả

_(Lane 1 điền khi xong.)_
