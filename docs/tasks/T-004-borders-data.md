# T-004: Dữ liệu biên giới

- **Lane:** 3
- **Nhánh:** `lane3/T-004-borders-data`
- **Làm sau:** T-003
- **Phạm vi file:** `public/data/borders/`, `src/data/border-snapshots.json`, `src/data/polities.json`, `scripts/`, `docs/data/`

## Mục tiêu

Tạo 12–15 mốc biên giới cho vùng Địa Trung Hải trong 509–27 TCN, để khi kéo thanh thời gian người dùng thấy La Mã lớn dần và các thế lực khác thu hẹp hoặc biến mất.

## Hiện trạng

Chưa có file biên giới nào. `src/data/border-snapshots.json` là mảng rỗng. Định dạng nằm ở `docs/ARCHITECTURE.md`, mục "File biên giới".

## Yêu cầu

1. **Khảo sát nguồn trước khi làm.** Xem các bộ dữ liệu mở về biên giới cổ đại (ví dụ historical-basemaps, Ancient World Mapping Center, Pleiades cho vị trí địa danh). Với mỗi nguồn, ghi vào `docs/data/SOURCES.md`: phạm vi, độ chi tiết, và **giấy phép đọc trực tiếp từ trang của nguồn**. Dừng lại và báo ở mục "Kết quả" trước khi dùng bất kỳ nguồn nào có giấy phép không rõ, hoặc buộc cả dự án phải theo cùng giấy phép.
2. **Đợt 1, giao sớm:** 3 mốc ở các năm 509, 264 và 146 TCN, để Lane 2 nối vào bản đồ. Commit riêng và báo ngay khi xong.
3. **Đợt 2:** đủ 12–15 mốc, chọn ở các thời điểm lãnh thổ thay đổi rõ, ví dụ sau khi thống nhất bán đảo Ý, sau mỗi cuộc chiến Punic, sau các cuộc chinh phục ở phương Đông, sau Caesar ở Gaul, sau Actium. Danh sách cuối cùng do lane đề xuất kèm lý do.
4. **Các thế lực** cần có khi còn tồn tại: La Mã, Carthage, Etruscan, các thành bang Hy Lạp, Macedonia, các vương quốc Hy Lạp hoá (Ptolemaios, Seleukos), và các thế lực khác có vai trò trong sự kiện của T-003.
5. **Độ chính xác:** biên giới cổ đại vốn là ước lượng. Ưu tiên hình dạng đúng về đại thể và nhất quán giữa các mốc (một vùng không nhảy qua lại vô cớ) hơn là chi tiết từng đường. Giữ file nhẹ, mục tiêu dưới 300 KB mỗi mốc.
6. **Danh mục:** mỗi mốc có một mục trong `border-snapshots.json` với `year`, `file`, `sources`.
7. **Mở rộng script kiểm tra** từ T-003: GeoJSON hợp lệ; mọi feature có `polityId` tồn tại trong `polities.json`; mỗi mục trong danh mục có file tương ứng và ngược lại; toạ độ nằm trong vùng Địa Trung Hải mở rộng.

## Ràng buộc

- Không sửa `src/lib/types.ts` hay `src/data/index.ts`. Định dạng chưa đủ dùng thì ghi đề nghị vào mục "Kết quả".
- Không sửa `src/components/map/`. Muốn xem thử dữ liệu thì dùng một công cụ xem GeoJSON bên ngoài.

## Xong khi

- `node scripts/validate-data.mjs` qua với 12–15 mốc.
- `npm run lint` và `npm run build` qua.
- `docs/data/SOURCES.md` ghi đủ nguồn và giấy phép cho từng mốc.

## Kết quả

_(Lane 3 điền khi xong.)_
