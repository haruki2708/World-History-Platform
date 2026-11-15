# Kế hoạch

Quyết định đã chốt (2026-11-15): Next.js + TypeScript + MapLibre; MVP 509–27 TCN, vùng Địa Trung Hải; song ngữ Anh/Việt; tutor dùng `claude-opus-5-5`.

| Giai đoạn | Nội dung | Ai làm | Xong khi | Trạng thái |
|---|---|---|---|---|
| 0. Khung | Project, layout các vùng, store chung, hợp đồng dữ liệu, tài liệu | Phiên chính | Trang chạy được ở local, store nối đủ ba vùng | Xong, chờ duyệt |
| 1. Timeline | Dòng thời gian đầy đủ, panel sự kiện | Lane 1 (T-001) | Kéo thanh thì sự kiện đổi theo | Chưa bắt đầu |
| 2. Bản đồ | Bản đồ nền, lớp lãnh thổ theo mốc, điểm sự kiện | Lane 2 (T-002) | Kéo thanh thì biên giới đổi theo | Chưa bắt đầu |
| 3. Dữ liệu | 40–60 sự kiện, 12–15 mốc biên giới | Lane 3 (T-003, T-004) | Xem trọn thời kỳ không bị trống | Chưa bắt đầu |
| 4. AI tutor | Khung chat, streaming, gửi ngữ cảnh | Lane 1 + Lane 2 | Hỏi "chuyện gì đang xảy ra ở đây?" được trả lời đúng năm và vùng | Chưa bắt đầu |
| 5. Hoàn thiện | Chuyển cảnh mượt, mobile, giới hạn lượt gọi API, deploy | Phiên chính + lane | Có link công khai | Chưa bắt đầu |
| 6. Mở rộng | Tutor điều khiển bản đồ, quiz, thời kỳ mới | Chốt sau | | |

Giai đoạn 1, 2 và 3 chạy song song sau khi giai đoạn 0 được duyệt.

## Để sau MVP

Quiz AI, cá nhân hoá học tập, tài khoản người dùng, các nền văn minh và thời kỳ khác.
