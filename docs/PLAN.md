# Kế hoạch

Quyết định đã chốt (2026-11-15): Next.js + TypeScript + MapLibre; MVP 509–27 TCN, vùng Địa Trung Hải; song ngữ Anh/Việt; tutor dùng `claude-opus-5-5`. Ngày 2026-11-16: ưu tiên máy tính, điện thoại chỉ cần dùng được.

| Giai đoạn | Nội dung | Ai làm | Xong khi | Trạng thái |
|---|---|---|---|---|
| 0. Khung | Project, layout các vùng, store chung, hợp đồng dữ liệu, tài liệu | Phiên chính | Trang chạy được ở local, store nối đủ ba vùng | Xong, đã duyệt 2026-11-15 |
| 1. Timeline | Dòng thời gian đầy đủ, panel sự kiện | Lane 1 (T-001) | Kéo thanh thì sự kiện đổi theo | Xong, đã gộp 2026-11-15 |
| 2. Bản đồ | Bản đồ nền, lớp lãnh thổ theo mốc, điểm sự kiện | Lane 2 (T-002) | Kéo thanh thì biên giới đổi theo | Xong. Biên giới thật, nhãn tên thế lực và chuyển cảnh giữa các mốc (T-009) đã gộp 2026-11-16 |
| 3. Dữ liệu | 40–60 sự kiện, 12–15 mốc biên giới | Lane 3 (T-003, T-004) | Xem trọn thời kỳ không bị trống | Xong: 59 sự kiện, 23 thế lực, 14 mốc biên giới. Đợt 2 của biên giới do phiên chính làm, nên được lane 3 soát lại |
| 4. AI tutor | Khung chat, streaming, gửi ngữ cảnh | Lane 2 (T-005, route API), Lane 1 (T-006, khung chat) | Hỏi "chuyện gì đang xảy ra ở đây?" được trả lời đúng năm và vùng | Xong ở chế độ giả lập, đã gộp 2026-11-15. Chưa chạy với Claude API thật (chờ nạp tiền vào tài khoản API) |
| 5. Hoàn thiện | Chuyển cảnh mượt, giới hạn lượt gọi API, deploy | Phiên chính + lane | Có link công khai | Đang làm. Xong: T-007 (giới hạn, trần chi phí), T-008 (link chia sẻ, nhớ ngôn ngữ, phím tắt) |
| 6. Mở rộng | Gia sư dẫn đường trên bản đồ; sau đó quiz, thời kỳ mới | Lane 1 (T-010), Lane 2 (T-011) | Câu trả lời có nút đưa tới đúng sự kiện và năm | Gia sư dẫn đường: giao diện xong (T-010); phần server (T-011) chờ giao |

## Nhật ký

- **2026-11-15:** Giai đoạn 0 xong. Giao T-001, T-002, T-003 cho ba lane chạy song song. Lane 1 và lane 2 xong task. Lane 3 hết hạn mức giữa chừng; phiên chính soát lại dữ liệu và làm nốt T-003. Gộp cả ba vào `main`, kèm chỉnh sửa tích hợp: panel bên chia tab trên màn hẹp, màu riêng cho đất và biển trên bản đồ, `color-scheme` cho chế độ tối, khung tutor hiện vùng bản đồ đang xem.

- **2026-11-15:** Chốt hợp đồng giữa khung chat và route của tutor (`src/lib/tutor.ts`), cài `@anthropic-ai/sdk` 1.3.0, thêm chế độ giả lập `TUTOR_MOCK` để làm giai đoạn 4 khi tài khoản API chưa nạp tiền. Viết T-005 (lane 2) và T-006 (lane 1).
- **2026-11-15:** Lane 2 xong T-005 (route `/api/tutor`), lane 1 xong T-006 (khung chat). Gộp cả hai, gỡ phần giả lập tạm phía trình duyệt, dành thêm chỗ cho khung chat (2/3 panel bên trên màn rộng; trên điện thoại bản đồ thu nhỏ khi mở tab gia sư), thêm `npm run tutor:check` và `npm run tutor:prompt`. Chạy thử đầu cuối ở chế độ giả lập: câu trả lời stream về, ngữ cảnh từng câu hỏi đi đúng, dừng, lỗi, chế độ sâu, tiếng Việt, khi thiếu khoá.
- **2026-11-16:** Người dùng chốt: ưu tiên máy tính, điện thoại chỉ cần dùng được. Lane 3 có lại hạn mức, bắt đầu T-004 đợt 1. Thêm vào hợp đồng tutor mã lỗi `limit_reached` và sự kiện `ping`. Viết T-007 (lane 2: giới hạn, trần chi phí, giữ kết nối) và T-008 (lane 1: link chia sẻ, nhớ ngôn ngữ, phím tắt).
- **2026-11-16:** Lane 2 xong T-007, lane 1 xong T-008; gộp cả hai. Chạy thử đầu cuối trên bản gộp: link mở đúng năm, sự kiện, ngôn ngữ; phím tắt; nút chia sẻ; nhớ ngôn ngữ; câu trả lời chậm vẫn về nhờ `ping`; giới hạn mỗi phút và `limit_reached` hiện đúng thông báo.
- **2026-11-16:** Lane 3 xong T-004 đợt 1 (3 mốc biên giới vẽ tay theo Shepherd và Cliopatria). Người dùng chốt: thêm Ba Tư và các vương quốc lớn đang để trống; đồng minh Ý tô đỏ nhạt cùng tông La Mã; gộp đợt 1 ngay; giao lane 2 nhãn tên thế lực và chuyển cảnh (T-009). Phiên chính gộp đợt 1, thêm dòng ghi công Cliopatria (CC BY 4.0) vào chú giải và README, sửa lỗi chớp tiếng Anh khi tải trang.
- **2026-11-16:** Lane 1 có lại hạn mức. Người dùng chọn làm "gia sư dẫn đường": câu trả lời kèm nút đưa tới sự kiện hay năm được nhắc tới. Phiên chính thêm sự kiện `map_link` vào hợp đồng và cho chế độ giả lập gửi nút mẫu. Cách làm: model chèn ký hiệu vào câu trả lời, server tách ra thành nút (một lần gọi API, không dùng tool use). Viết T-010 (lane 1, giao diện) và T-011 (lane 2, server, sau T-009).
- **2026-11-16:** Lane 3 lại hết hạn mức; phiên chính làm T-004 đợt 2: 11 mốc biên giới, 6 thế lực mới (Ba Tư, Armenia, Bithynia, Cappadocia, Galatia, Mauretania), nới quy tắc để thế lực chỉ cần có trên bản đồ. Lane 2 xong T-009 (nhãn tên thế lực, chuyển cảnh, gỡ dữ liệu thử), lane 1 xong T-010 (nút "xem trên bản đồ"). Gộp cả ba; sửa khi gộp: bấm nút của sự kiện đang chọn thì bản đồ bay lại (`focusRequest` trong store).

## Việc để giai đoạn 5

- Thống nhất cách viết tên riêng tiếng Việt (dạng Latinh, Hy Lạp hay tiếng Anh quen dùng).
- Khi deploy: thay bộ đếm giới hạn trong bộ nhớ (T-007) bằng kho dùng chung nếu chạy nhiều tiến trình; kiểm tra proxy của nền tảng có ghi đè `x-forwarded-for` và đặt `x-forwarded-host`, nếu không giới hạn theo người dùng bị lách được và kiểm tra Origin có thể chặn nhầm.
- Soát lại 11 mốc biên giới của đợt 2 (đối chiếu bản đồ Shepherd như đợt 1); danh sách đơn giản hoá trong `docs/data/BORDERS.md`.
- Theo dõi một đường mảnh nằm ngang qua vùng Ai Cập và vịnh Ba Tư, thấy trong ảnh chụp bản đồ thu nhỏ trước T-009 (không có trong dữ liệu; có thể là đường nối giữa các ô khi MapLibre tô lớp lãnh thổ). Sau T-009 chưa thấy lại.
- Khi chạy thật: kiểm tra cache có trúng (`cacheReadTokens` > 0 từ câu thứ hai), đo chi phí thật mỗi câu hỏi, đọc thử câu trả lời ở hai ngôn ngữ và hai độ sâu rồi chỉnh prompt.

## Không làm (điện thoại chỉ cần dùng được)

- Phóng to trục thời gian trên màn hẹp (hiện khoảng một phần ba sự kiện bị gộp vào chip "+n" ở bề ngang 390px).
- Chú giải bản đồ che gần hết bản đồ khi bản đồ thu nhỏ ở tab gia sư trên điện thoại.

## Để sau MVP

Quiz AI, cá nhân hoá học tập, tài khoản người dùng, các nền văn minh và thời kỳ khác.
