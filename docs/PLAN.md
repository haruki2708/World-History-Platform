# Kế hoạch

Quyết định đã chốt (2026-11-15): Next.js + TypeScript + MapLibre; MVP 509–27 TCN, vùng Địa Trung Hải; song ngữ Anh/Việt; tutor dùng `claude-opus-5-5`. Ngày 2026-11-16: ưu tiên máy tính, điện thoại chỉ cần dùng được.

| Giai đoạn | Nội dung | Ai làm | Xong khi | Trạng thái |
|---|---|---|---|---|
| 0. Khung | Project, layout các vùng, store chung, hợp đồng dữ liệu, tài liệu | Phiên chính | Trang chạy được ở local, store nối đủ ba vùng | Xong, đã duyệt 2026-11-15 |
| 1. Timeline | Dòng thời gian đầy đủ, panel sự kiện | Lane 1 (T-001) | Kéo thanh thì sự kiện đổi theo | Xong, đã gộp 2026-11-15 |
| 2. Bản đồ | Bản đồ nền, lớp lãnh thổ theo mốc, điểm sự kiện | Lane 2 (T-002) | Kéo thanh thì biên giới đổi theo | Xong, đã gộp 2026-11-15. Biên giới thật chờ T-004 |
| 3. Dữ liệu | 40–60 sự kiện, 12–15 mốc biên giới | Lane 3 (T-003, T-004) | Xem trọn thời kỳ không bị trống | Sự kiện xong (59 sự kiện, T-003). Biên giới (T-004): lane 3 đang làm đợt 1 |
| 4. AI tutor | Khung chat, streaming, gửi ngữ cảnh | Lane 2 (T-005, route API), Lane 1 (T-006, khung chat) | Hỏi "chuyện gì đang xảy ra ở đây?" được trả lời đúng năm và vùng | Xong ở chế độ giả lập, đã gộp 2026-11-15. Chưa chạy với Claude API thật (chờ nạp tiền vào tài khoản API) |
| 5. Hoàn thiện | Chuyển cảnh mượt, giới hạn lượt gọi API, deploy | Phiên chính + lane | Có link công khai | Đang làm: T-007 (lane 2), T-008 (lane 1) |
| 6. Mở rộng | Tutor điều khiển bản đồ, quiz, thời kỳ mới | Chốt sau | | |

## Nhật ký

- **2026-11-15:** Giai đoạn 0 xong. Giao T-001, T-002, T-003 cho ba lane chạy song song. Lane 1 và lane 2 xong task. Lane 3 hết hạn mức giữa chừng; phiên chính soát lại dữ liệu và làm nốt T-003. Gộp cả ba vào `main`, kèm chỉnh sửa tích hợp: panel bên chia tab trên màn hẹp, màu riêng cho đất và biển trên bản đồ, `color-scheme` cho chế độ tối, khung tutor hiện vùng bản đồ đang xem.

- **2026-11-15:** Chốt hợp đồng giữa khung chat và route của tutor (`src/lib/tutor.ts`), cài `@anthropic-ai/sdk` 1.3.0, thêm chế độ giả lập `TUTOR_MOCK` để làm giai đoạn 4 khi tài khoản API chưa nạp tiền. Viết T-005 (lane 2) và T-006 (lane 1).
- **2026-11-15:** Lane 2 xong T-005 (route `/api/tutor`), lane 1 xong T-006 (khung chat). Gộp cả hai, gỡ phần giả lập tạm phía trình duyệt, dành thêm chỗ cho khung chat (2/3 panel bên trên màn rộng; trên điện thoại bản đồ thu nhỏ khi mở tab gia sư), thêm `npm run tutor:check` và `npm run tutor:prompt`. Chạy thử đầu cuối ở chế độ giả lập: câu trả lời stream về, ngữ cảnh từng câu hỏi đi đúng, dừng, lỗi, chế độ sâu, tiếng Việt, khi thiếu khoá.
- **2026-11-16:** Người dùng chốt: ưu tiên máy tính, điện thoại chỉ cần dùng được. Lane 3 có lại hạn mức, bắt đầu T-004 đợt 1. Thêm vào hợp đồng tutor mã lỗi `limit_reached` và sự kiện `ping`. Viết T-007 (lane 2: giới hạn, trần chi phí, giữ kết nối) và T-008 (lane 1: link chia sẻ, nhớ ngôn ngữ, phím tắt).

## Việc để giai đoạn 5

- Chuyển cảnh mượt khi đổi mốc biên giới.
- Nhãn chữ trên bản đồ (tên thế lực, địa danh) cần file font glyph cho MapLibre.
- Thống nhất cách viết tên riêng tiếng Việt (dạng Latinh, Hy Lạp hay tiếng Anh quen dùng).
- Khi deploy: thay bộ đếm giới hạn trong bộ nhớ (T-007) bằng kho dùng chung nếu chạy nhiều tiến trình.
- Khi chạy thật: kiểm tra cache có trúng (`cacheReadTokens` > 0 từ câu thứ hai), đo chi phí thật mỗi câu hỏi, đọc thử câu trả lời ở hai ngôn ngữ và hai độ sâu rồi chỉnh prompt.
- Gỡ dữ liệu biên giới thử của lane 2 (`src/components/map/__fixtures__/`) sau khi T-004 xong.

## Không làm (điện thoại chỉ cần dùng được)

- Phóng to trục thời gian trên màn hẹp (hiện khoảng một phần ba sự kiện bị gộp vào chip "+n" ở bề ngang 390px).
- Chú giải bản đồ che gần hết bản đồ khi bản đồ thu nhỏ ở tab gia sư trên điện thoại.

## Để sau MVP

Quiz AI, cá nhân hoá học tập, tài khoản người dùng, các nền văn minh và thời kỳ khác.
