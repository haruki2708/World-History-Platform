# T-004: Dữ liệu biên giới

- **Lane:** 3
- **Nhánh:** `lane3/T-004-borders-data` (đã tạo sẵn từ `main`, worktree của lane 3 đang ở nhánh này)
- **Phạm vi file:** `public/data/borders/`, `src/data/border-snapshots.json`, `src/data/polities.json`, `scripts/`, `docs/data/`

## Mục tiêu

Tạo 12–15 mốc biên giới cho vùng Địa Trung Hải trong 509–27 TCN, để khi kéo thanh thời gian người dùng thấy La Mã lớn dần và các thế lực khác thu hẹp hoặc biến mất.

## Hiện trạng

- Bản đồ (T-002) đã chạy và đã đọc `border-snapshots.json`: thêm mốc vào đó là bản đồ hiển thị ngay. Chạy `npm run dev` để xem; khi đã có mốc thật, dữ liệu thử của lane 2 tự tắt.
- `src/data/border-snapshots.json` đang rỗng. Định dạng nằm ở `docs/ARCHITECTURE.md`, mục "File biên giới".
- `npm run validate` (`scripts/validate-data.mjs`) đã kiểm tra sẵn file biên giới: GeoJSON hợp lệ, `polityId` tồn tại, danh mục khớp với file, toạ độ nằm trong vùng bản đồ, vòng polygon khép kín.
- `polities.json` đã có 17 thế lực từ T-003.

## Yêu cầu

1. **Khảo sát nguồn trước khi làm.** Xem các bộ dữ liệu mở về biên giới cổ đại (ví dụ historical-basemaps, Ancient World Mapping Center, Pleiades cho vị trí địa danh). Với mỗi nguồn, ghi vào `docs/data/SOURCES.md`: phạm vi, độ chi tiết, và **giấy phép đọc trực tiếp từ trang của nguồn**. Dừng lại và báo ở mục "Kết quả" trước khi dùng bất kỳ nguồn nào có giấy phép không rõ, hoặc buộc cả dự án phải theo cùng giấy phép.
2. **Đợt 1, giao sớm:** 3 mốc ở các năm 509, 264 và 146 TCN. Commit riêng trên nhánh và báo ngay khi xong, để phiên chính kiểm tra hướng làm trước khi lane làm tiếp.
3. **Đợt 2:** đủ 12–15 mốc, chọn ở các thời điểm lãnh thổ thay đổi rõ, ví dụ sau khi thống nhất bán đảo Ý, sau mỗi cuộc chiến Punic, sau các cuộc chinh phục ở phương Đông, sau Caesar ở Gaul, sau Actium. Danh sách cuối cùng do lane đề xuất kèm lý do.
4. **Các thế lực** cần có khi còn tồn tại: La Mã, Carthage, Etruscan, các thành bang Hy Lạp, Macedonia, các vương quốc Hy Lạp hoá (Ptolemaios, Seleukos), và các thế lực khác trong `polities.json`. Thêm thế lực mới nếu cần, nhưng thế lực nào cũng phải được ít nhất một sự kiện dùng (script kiểm tra điều này); nếu thêm thế lực chỉ có trên bản đồ, ghi đề nghị nới quy tắc đó vào mục "Kết quả".
5. **Độ chính xác:** biên giới cổ đại vốn là ước lượng. Ưu tiên hình dạng đúng về đại thể và nhất quán giữa các mốc (một vùng không nhảy qua lại vô cớ) hơn là chi tiết từng đường. Giữ file nhẹ, mục tiêu dưới 300 KB mỗi mốc.
6. **Không cần vẽ bám bờ biển:** biển được vẽ đè lên lãnh thổ nên phần tràn ra biển bị che. Chỉ cần đúng ở đất liền và ở ranh giới giữa các thế lực. Vùng bản đồ là kinh độ −40 đến 80, vĩ độ 5 đến 70.
7. **Danh mục:** mỗi mốc có một mục trong `border-snapshots.json` với `year`, `file`, `sources`.

## Ràng buộc

- Không sửa `src/lib/types.ts`, `src/data/index.ts` hay `src/components/map/`. Định dạng chưa đủ dùng thì ghi đề nghị vào mục "Kết quả".
- Không bịa nguồn.

## Xong khi

- `npm run validate` qua với 12–15 mốc.
- `npm run lint` và `npm run build` qua.
- Đã xem từng mốc trên bản đồ của app (`npm run dev`) và kéo thanh thời gian qua cả thời kỳ.
- `docs/data/SOURCES.md` ghi đủ nguồn và giấy phép cho từng mốc.

## Kết quả

_(Lane 3 điền khi xong.)_
