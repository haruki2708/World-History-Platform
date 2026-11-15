# T-012: Soát lại các mốc biên giới của đợt 2

- **Lane:** 3
- **Nhánh:** `lane3/T-012-borders-review` (đã tạo sẵn từ `main`)
- **Phạm vi file:** `scripts/`, `public/data/borders/`, `src/data/border-snapshots.json`, `src/data/polities.json`, `docs/data/`

## Mục tiêu

Đưa 11 mốc biên giới của đợt 2 lên cùng độ chính xác với đợt 1. Đợt 2 do phiên chính vẽ khi lane 3 hết hạn mức, khái quát từ các bài Wikipedia và hiểu biết phổ thông, chưa đối chiếu từng nét với bản đồ như đợt 1.

## Hiện trạng

- 14 mốc: 509, 338, 290, 264, 241, 218, 201, 168, 146, 129, 88, 63, 50, 30 TCN. 23 thế lực.
- Đọc `docs/data/BORDERS.md`, nhất là mục "Đợt 2": cách làm, bảng từng mốc và danh sách "Đơn giản hoá đã biết".
- Các hình mới nằm trong khối "batch 2" của `scripts/borders/snapshots.mjs`. Hình nào không đổi so với đợt 1 thì được lấy lại bằng `polygonOf`.
- Nhãn tên thế lực trên bản đồ (T-009) tự đặt theo dữ liệu, nên sửa hình là nhãn tự đi theo.

## Yêu cầu

1. **Soát từng mốc của đợt 2** (338, 290, 241, 218, 201, 168, 129, 88, 63, 50, 30) và các phần đợt 2 thêm vào 509, 264, 146. Đối chiếu với các bản đồ phạm vi công cộng của Shepherd (những bản đồ đợt 1 đã dùng, và các bản khác cùng atlas nếu có), Cliopatria và các nguồn mở có giấy phép dùng được. Sửa chỗ sai rõ ràng. **Ưu tiên vùng Địa Trung Hải** (vùng người dùng thấy khi mở app) trước vùng xa phía đông.
2. **Xử lý các đơn giản hoá** trong danh sách nếu nguồn cho phép làm tốt hơn, ví dụ: Gaul trong dãy Alps năm 218 và 201; Pergamon từ 241 tới 201; Tây Ban Nha của La Mã năm 201 và 168; Armenia năm 88. Cái nào giữ nguyên thì ghi lý do.
3. **Thêm kiểm tra màu vào `scripts/build-borders.mjs`:** với mỗi cặp thế lực có chung đường biên ở một mốc, độ chênh màu (CIE76 ΔE, tính trên màu tô 45% đè lên màu đất `--map-land` ở cả chế độ sáng `#ebe4d3` lẫn tối `#2a2620`) phải từ 12 trở lên. Phiên chính đã đo bằng một script tạm: 59 cặp, nhỏ nhất 13,5.
4. **Ghi lại mọi thay đổi** trong `docs/data/BORDERS.md`: sửa gì, ở mốc nào, theo nguồn nào. Mốc nào đã soát mà không sửa thì ghi "đã soát, giữ nguyên". Cập nhật `docs/data/SOURCES.md` nếu dùng nguồn mới, kèm giấy phép đọc trực tiếp từ trang của nguồn.

## Ràng buộc

- Giữ phương pháp của đợt 1: đường biên dùng chung, không chồng lấn trên đất liền, mỗi file dưới 300 KB.
- Không sửa `src/components/`, `src/lib/` hay `src/data/index.ts`.
- Không bịa nguồn. Nguồn có giấy phép không rõ hoặc buộc dữ liệu dẫn xuất theo cùng giấy phép thì không dùng.

## Xong khi

- `npm run borders`, `npm run validate`, `npm run lint`, `npm run build` qua, có cả kiểm tra màu mới.
- Đã xem từng mốc trên bản đồ của app (`npm run dev`).
- `docs/data/BORDERS.md` ghi rõ kết quả soát của từng mốc.

## Kết quả

_(Lane 3 điền khi xong.)_
