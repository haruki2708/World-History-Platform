# Quy trình task

Mỗi task là một file `T-XXX-ten-ngan.md` trong thư mục này, do phiên chính viết.

## Lane nhận task

1. Đọc `CLAUDE.md`, `docs/ARCHITECTURE.md` và file task được giao.
2. Làm trên nhánh của mình, tên nhánh ghi trong file task. Không commit thẳng vào `main`.
3. Chỉ sửa file trong mục "Phạm vi file" của task.
4. Trước khi báo xong: `npm run lint` và `npm run build` phải qua (thêm `npm run validate` nếu đụng tới dữ liệu), và tự chạy thử phần mình làm trong trình duyệt.
5. Điền mục "Kết quả" ở cuối file task: đã làm gì, đã kiểm tra thế nào, còn gì chưa xong, và các đề nghị thay đổi ngoài phạm vi (kiểu dữ liệu, store, thư viện mới).
6. Commit trên nhánh của mình rồi báo người dùng. Không tự gộp vào `main`.

## Phiên chính

Review diff của nhánh, chạy lại lint và build, kiểm tra chéo dữ liệu lịch sử, rồi gộp vào `main` sau khi người dùng duyệt.

## Danh sách

| Task | Lane | Nội dung | Trạng thái |
|---|---|---|---|
| [T-001](T-001-timeline.md) | 1 | Dòng thời gian và panel sự kiện | Xong, đã gộp 2026-11-15 |
| [T-002](T-002-map.md) | 2 | Bản đồ lịch sử | Xong, đã gộp 2026-11-15 |
| [T-003](T-003-events-data.md) | 3 | Dữ liệu sự kiện và thế lực, script kiểm tra | Xong, đã gộp 2026-11-15 (phiên chính làm nốt) |
| [T-004](T-004-borders-data.md) | 3 | Dữ liệu biên giới | Xong, đã gộp 2026-11-16 (đợt 2 do phiên chính làm) |
| [T-005](T-005-tutor-api.md) | 2 | Route API của gia sư AI | Xong, đã gộp 2026-11-15 |
| [T-006](T-006-tutor-chat.md) | 1 | Khung chat của gia sư AI | Xong, đã gộp 2026-11-15 |
| [T-007](T-007-tutor-hardening.md) | 2 | Gia cố route của gia sư AI: giới hạn, trần chi phí, giữ kết nối | Xong, đã gộp 2026-11-16 |
| [T-008](T-008-desktop-ux.md) | 1 | Trải nghiệm trên máy tính: link chia sẻ, nhớ ngôn ngữ, phím tắt | Xong, đã gộp 2026-11-16 |
| [T-009](T-009-map-labels.md) | 2 | Nhãn tên thế lực trên bản đồ, chuyển cảnh giữa các mốc | Xong, đã gộp 2026-11-16 |
| [T-010](T-010-tutor-map-links.md) | 1 | Nút "xem trên bản đồ" trong câu trả lời của gia sư (giao diện) | Xong, đã gộp 2026-11-16 |
| [T-011](T-011-tutor-map-links-server.md) | 2 | Server tạo nút "xem trên bản đồ" từ câu trả lời của Claude | Đang làm (giao 2026-11-16) |
| [T-012](T-012-borders-review.md) | 3 | Soát lại các mốc biên giới của đợt 2 | Đang làm (giao 2026-11-16) |
| [T-013](T-013-about.md) | 1 | Giới thiệu, cách dùng và ghi công | Đang làm (giao 2026-11-16) |
