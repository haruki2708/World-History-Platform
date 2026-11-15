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

_(Lane 1 điền khi xong.)_
