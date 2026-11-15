# T-003: Dữ liệu sự kiện và thế lực

- **Lane:** 3
- **Nhánh:** `lane3/T-003-events-data`
- **Phạm vi file:** `src/data/events.json`, `src/data/polities.json`, `scripts/`, `docs/data/`

## Mục tiêu

Nâng bộ dữ liệu từ 9 sự kiện mẫu lên 40–60 sự kiện phủ đều 509–27 TCN, đủ để người dùng kéo qua bất kỳ đoạn nào cũng thấy có chuyện đang diễn ra.

## Hiện trạng

`events.json` có 9 sự kiện mẫu và `polities.json` có 6 thế lực, do phiên chính viết từ kiến thức chung, chưa đối chiếu nguồn. Định dạng nằm ở `src/lib/types.ts` và `docs/ARCHITECTURE.md`.

## Yêu cầu

1. **Kiểm tra lại 9 sự kiện mẫu**: năm, toạ độ, nội dung tóm tắt, nguồn. Sửa chỗ sai và ghi lại đã sửa gì.
2. **Bổ sung tới 40–60 sự kiện.** Không đoạn nào dài quá 25 năm mà không có sự kiện. Cần đủ cả bốn `category`, không chỉ chiến tranh: đấu tranh giữa các đẳng cấp, Luật Mười hai bảng, cải cách của anh em Gracchus, cải cách quân đội của Marius, Sulla, Tam hùng, v.v. Có cả sự kiện của các thế lực láng giềng khi chúng làm thay đổi cục diện Địa Trung Hải (Alexander, các vương quốc Hy Lạp hoá, Carthage).
3. **`importance`**: 3 cho bước ngoặt (khoảng 10–15 sự kiện), 2 cho sự kiện đáng chú ý, 1 cho chi tiết.
4. **Song ngữ**: `title` và `summary` có đủ `en` và `vi`. Tóm tắt 2–4 câu, tự viết, không chép nguyên văn. Tên riêng tiếng Việt theo cách viết phổ biến và nhất quán trong toàn bộ file.
5. **Nguồn**: mỗi sự kiện ít nhất một nguồn, ưu tiên sử liệu cổ (Livy, Polybius, Appian, Plutarch, Cassius Dio...) kèm một tài liệu tham khảo hiện đại khi có. Thêm `url` khi có bản truy cập mở.
6. **Chỗ không chắc**: mốc năm theo truyền thống hoặc còn tranh cãi thì nói rõ trong tóm tắt. Vị trí không chắc thì đặt `approximate: true`.
7. **Thế lực**: bổ sung `polities.json` cho mọi `polityId` được dùng (Macedonia, Seleukos, Pontus, Numidia, Samnite...), mỗi thế lực một màu phân biệt được với các màu còn lại.
8. **Script kiểm tra** `scripts/validate-data.mjs`, chạy bằng `node scripts/validate-data.mjs`, thoát với mã khác 0 khi có lỗi. Kiểm tra: `id` duy nhất và đúng kebab-case; năm trong `[-509, -27]` và `endYear >= year`; đủ `en` và `vi`, không rỗng; `polityIds` đều tồn tại; toạ độ hợp lệ; có ít nhất một nguồn; không có khoảng trống quá 25 năm.
9. **Ghi chép nguồn** trong `docs/data/SOURCES.md`: danh sách nguồn đã dùng và giấy phép của từng nguồn.

## Ràng buộc

- Không sửa `src/lib/types.ts` hay `src/data/index.ts`. Cần thêm trường thì ghi đề nghị vào mục "Kết quả".
- Không bịa nguồn. Không tìm được nguồn cho một chi tiết thì bỏ chi tiết đó hoặc ghi rõ là chưa kiểm chứng trong mục "Kết quả".

## Xong khi

- `node scripts/validate-data.mjs` qua với 40–60 sự kiện.
- `npm run lint` và `npm run build` qua.
- Mục "Kết quả" liệt kê các sửa đổi trên dữ liệu mẫu và các điểm còn nghi ngờ.

## Kết quả

_(Lane 3 điền khi xong.)_
