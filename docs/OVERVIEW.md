# Tổng quan dự án

## Sản phẩm

Một web app giúp khám phá lịch sử thế giới theo cách trực quan hơn sách vở. Ba phần luôn đồng bộ với nhau:

- **Thanh thời gian:** kéo để đổi năm, bản đồ và danh sách sự kiện cập nhật theo.
- **Bản đồ lịch sử:** lãnh thổ các thế lực đổi theo năm, bấm vào vùng hoặc sự kiện để xem chi tiết.
- **Gia sư AI:** khung chat luôn biết người dùng đang ở năm nào, đang nhìn vùng nào và đang chọn sự kiện gì.

Điểm khác biệt nằm ở sự đồng bộ này: gia sư trả lời theo đúng ngữ cảnh đang xem, và về sau có thể tự điều khiển bản đồ ("để tôi đưa bạn tới năm 216 TCN, trận Cannae").

## Phạm vi bản đầu tiên (MVP)

Làm trọn vẹn một thời kỳ trước khi mở rộng:

- **Thời gian:** 509 TCN (thành lập Cộng hoà La Mã) đến 27 TCN (Augustus, kết thúc Cộng hoà).
- **Không gian:** Địa Trung Hải.
- **Các thế lực:** La Mã, Carthage, Etruscan, các thành bang Hy Lạp, Macedonia và các vương quốc Hy Lạp hoá.
- **Dữ liệu:** 12–15 mốc biên giới và 40–60 sự kiện, mỗi sự kiện có năm, toạ độ, tóm tắt và nguồn.
- **Ngôn ngữ:** tiếng Anh và tiếng Việt, cho cả giao diện lẫn nội dung lịch sử.

Để sau MVP: quiz do AI tạo, cá nhân hoá học tập, tài khoản người dùng, các nền văn minh và thời kỳ khác.

## Công nghệ

| Phần | Lựa chọn | Lý do |
|---|---|---|
| Framework | Next.js + TypeScript | Một codebase cho cả giao diện lẫn API, dễ deploy |
| Bản đồ | MapLibre GL JS | Mã nguồn mở, miễn phí, vẽ GeoJSON mượt |
| Trạng thái | Zustand | Một store chung cho cả ba phần |
| Giao diện | Tailwind CSS | Nhanh cho nhóm nhỏ |
| Dữ liệu | File JSON và GeoJSON trong repo | Chưa cần database ở MVP |
| AI | Claude API (`claude-opus-5-5`) qua route phía server, có streaming | Khoá API không lộ ra trình duyệt |
| Deploy | Vercel | Miễn phí ở quy mô nhỏ |

## Gia sư AI hoạt động thế nào

- Mỗi câu hỏi gửi kèm ngữ cảnh: năm hiện tại, vùng đang nhìn, sự kiện đang chọn và các sự kiện liên quan lấy từ bộ dữ liệu.
- Gia sư ưu tiên trả lời dựa trên dữ liệu đã biên soạn và nói rõ khi nào nó vượt ra ngoài, để giảm bịa đặt.
- Phần hướng dẫn cố định được cache để giảm chi phí.
- Giai đoạn sau: gia sư có công cụ để tự đổi năm và di chuyển bản đồ.

## Cách tổ chức công việc

- Một phiên điều phối giữ hợp đồng chung (kiểu dữ liệu, store), viết task, review và gộp code.
- Ba lane thực thi chạy song song, mỗi lane sở hữu một mảng: giao diện và timeline, bản đồ, dữ liệu lịch sử.
- Mỗi task là một file trong [`docs/tasks/`](tasks/README.md). Tiến độ từng giai đoạn nằm ở [`PLAN.md`](PLAN.md), chi tiết kỹ thuật ở [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Rủi ro chính

- **Dữ liệu biên giới là phần tốn công nhất.** Các nguồn mở chỉ có mốc thưa và độ chính xác vừa phải, nên sẽ phải chỉnh tay. Giấy phép từng nguồn phải được kiểm tra trước khi dùng.
- **Chi phí API** khi mở công khai: cần giới hạn lượt hỏi theo người dùng trước khi deploy.
- **Độ chính xác lịch sử:** biên giới cổ đại vốn không rõ ràng, nên giao diện cần ghi chú đây là ước lượng.
