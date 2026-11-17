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
| [T-011](T-011-tutor-map-links-server.md) | 2 | Server tạo nút "xem trên bản đồ" từ câu trả lời của Claude | Xong, đã gộp 2026-11-16 |
| [T-012](T-012-borders-review.md) | 3 | Soát lại các mốc biên giới của đợt 2 | Xong, đã gộp 2026-11-16 |
| [T-013](T-013-about.md) | 1 | Giới thiệu, cách dùng và ghi công | Xong, đã gộp 2026-11-16 |
| [T-014](T-014-roman-legionary-model.md) | 1 | Trận đánh 3D: mô hình lính La Mã thời Cộng hoà (Blender) | Xong, đã gộp 2026-11-16 |
| [T-015](T-015-battle-scene.md) | 3 | Trận đánh 3D: cảnh 3D (three.js) | Xong, đã gộp 2026-11-16 |
| [T-016](T-016-cannae-data.md) | 2 | Trận đánh 3D: dữ liệu trận Cannae, địa hình, tìm mô hình ngựa và hoạt hình | Xong, đã gộp 2026-11-16 |
| [T-017](T-017-legend-labels.md) | 2 | Chú giải bản đồ không che nhãn tên thế lực | Xong, đã gộp 2026-11-16 |
| [T-018](T-018-battle-scene-polish.md) | 3 | Cảnh 3D: góc nhìn đầu, nhãn địa danh, danh sách mô hình, vật liệu kim loại | Xong, đã gộp 2026-11-16 |
| [T-019](T-019-animations-hastatus.md) | 1 | Trận đánh 3D: thư viện hoạt hình dùng chung, nâng lính La Mã, thêm hastatus | Xong, đã gộp 2026-11-16 |
| [T-020](T-020-horse.md) | 2 | Trận đánh 3D: ngựa cho kỵ binh, chỉnh dữ liệu Cannae trong cảnh thật | Xong, đã gộp 2026-11-17 |
| [T-021](T-021-infantry-models.md) | 1 | Trận đánh 3D: sáu loại bộ binh còn lại, kim loại sáng đúng trong cảnh | Xong, đã gộp 2026-11-17 |
| [T-022](T-022-cavalry.md) | 1 | Trận đánh 3D: ba loại kỵ binh (người cưỡi trên ngựa của T-020), clip `jog` cho bộ binh | Xong, đã gộp 2026-11-17 |
| [T-023](T-023-battle-viewer.md) | 3 | Trận đánh 3D: khung xem trận trong app chính, mở từ panel sự kiện | Xong, đã gộp 2026-11-17 (phiên chính làm nốt) |
| [T-024](T-024-model-polish.md) | 1 | Trận đánh 3D: sửa các chỗ chưa ưng ý của mô hình bộ binh (sải chân, tay người Gaul, vạt áo, *pilum*) | Xong, đã gộp 2026-11-17 |
| [T-025](T-025-battle-flight.md) | 2 | Trận đánh 3D: bản đồ bay tới chiến trường trước khi mở trận, bay về khi đóng | Xong, đã gộp 2026-11-17 |
| [T-026](T-026-scene-fixes.md) | 3 | Trận đánh 3D: sửa cảnh (quay đầu tại chỗ, chuẩn bị kỵ binh, mức chi tiết, vùng màu, nhãn) | Xong, đã gộp 2026-11-17 (phiên chính làm thay lane 3) |
| [T-027](T-027-prefetch-cannae-data.md) | 2 | Trận đánh 3D: tải sẵn tài nguyên cảnh trong lúc bay; triarii quay đầu, các khối đi xiên | Xong, đã gộp 2026-11-17 |
| [T-028](T-028-unit-labels.md) | 3 | Trận đánh 3D: tên khối quân trên cảnh, thẻ thông tin khi bấm, khối đi xiên | Xong, đã gộp 2026-11-17 |
| [T-029](T-029-about-battle-credits.md) | 1 | Trận đánh 3D trong hộp thoại Giới thiệu: cách dùng, độ chính xác, ghi công | Xong, đã gộp 2026-11-17 |
| [T-030](T-030-horse-gallop.md) | 2 | Trận đánh 3D: clip phi nước đại mới cho ngựa (sải 4,5–6 m), xuất lại ba mô hình kỵ binh | Xong, đã gộp 2026-11-17 |
| [T-031](T-031-scene-performance.md) | 3 | Trận đánh 3D: lấy lại hiệu năng của cảnh sau đợt E (nhãn khối quân, mức chi tiết của kỵ binh); việc dở của T-028 | Xong, đã gộp 2026-11-17 |
| [T-032](T-032-melee-stage1.md) | Phiên chính | Trận đánh 3D, đợt G chặng 1: giáp lá cà (hàng đầu áp sát, đấu từng cặp, người ngã là người vừa bị đánh), dùng clip sẵn có | Xong, đã gộp 2026-11-18 (lane 3 đọc lại: [T-032 review](T-032-review.md)) |
