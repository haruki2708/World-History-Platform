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

Lane 3 soạn dữ liệu rồi hết hạn mức giữa chừng, chưa kịp commit hay viết báo cáo. Phiên chính đọc soát lại, làm nốt phần còn thiếu và viết mục này (2026-11-15).

### Đã làm

**Lane 3**

- `src/data/events.json`: 59 sự kiện phủ 509–27 TCN (9 sự kiện mẫu đã soát lại + 50 sự kiện mới). Phân loại: 29 quân sự, 16 chính trị, 8 xã hội, 6 văn hoá. Mức quan trọng: 15 sự kiện mức 3, 35 mức 2, 9 mức 1. Mỗi sự kiện có tiêu đề và tóm tắt song ngữ, toạ độ, và nguồn kèm chương mục cụ thể; 111 link tới bản dịch hoặc bài tham khảo.
- `src/data/polities.json`: 17 thế lực (thêm Latinh, Samnite, Syracuse, Macedonia, Epirus, Seleukos, Pergamon, Numidia, Pontus, đồng minh Ý, Parthia).
- Sửa trên 9 sự kiện mẫu:
  - Toạ độ chỉnh chính xác hơn cho cả 9 sự kiện; đáng kể nhất là Cannae (vĩ độ 41,3064 → 41,2967) và Actium (kinh độ 20,72 → 20,7659).
  - Vụ ám sát Caesar: đổi địa điểm từ "Roma" thành "Sảnh Curia của Pompey, Roma".
  - Thành lập Cộng hoà: thế lực liên quan đổi từ La Mã + Etruscan thành La Mã + Carthage (hiệp ước đầu tiên theo Polybius 3.22). Chiến tranh Punic lần 1 thêm Syracuse, Zama thêm Numidia, Carthage bị huỷ diệt bỏ các thành bang Hy Lạp (đã có sự kiện Corinth riêng).
  - Không mốc năm nào bị đổi. Phần tóm tắt được viết lại chi tiết hơn và nêu rõ các mốc theo truyền thống hoặc còn tranh cãi (509, 494, 451, 396, 390, 367, 348).
  - Màu Ai Cập thời Ptolemaios đổi `#c9a227` → `#e6cf3a` để tách khỏi màu Etruscan.

**Phiên chính**

- Đọc soát toàn bộ 59 sự kiện ở cả hai ngôn ngữ: mốc năm, nhân vật, con số, chương mục nguồn. Không phát hiện sai sót cần sửa.
- Đổi màu ba thế lực quá tối, gần như không thấy được ở chế độ tối: Macedonia `#1c2f6b` → `#5a55c8`, Pontus `#3a3a3a` → `#e0662f`, Parthia `#6e1640` → `#a04a7a`.
- Viết `scripts/validate-data.mjs` theo yêu cầu 8, kèm luôn phần kiểm tra file biên giới của T-004 (GeoJSON hợp lệ, `polityId` tồn tại, danh mục khớp với file, toạ độ trong vùng bản đồ). Script còn kiểm tra thêm: màu thế lực không trùng nhau, thế lực nào cũng được ít nhất một sự kiện dùng, link nguồn bắt đầu bằng `https://`.
- Viết `docs/data/SOURCES.md`.

### Đã kiểm tra

- `node scripts/validate-data.mjs`: qua (59 sự kiện, 17 thế lực, 0 mốc biên giới).
- Thử script với dữ liệu cố tình làm sai (thế lực không tồn tại, thiếu bản dịch, toạ độ vô lý, `endYear` trước `year`, thiếu nguồn, trùng `id`, năm ngoài phạm vi, khoảng trống dài): script bắt đủ và thoát với mã 1.
- Cả 111 link nguồn đều phản hồi bình thường.
- Lấy mẫu 35 link của 14 sự kiện: trang được dẫn đều nhắc tới đúng sự kiện hoặc nhân vật.
- `npm run lint`, `npm run build`: qua.

### Còn lại / lưu ý

- Không rõ lane 3 đã tra cứu tới mức nào cho từng sự kiện, vì phiên của lane dừng trước khi ghi lại. Phần soát của phiên chính dựa trên kiến thức sẵn có cộng với kiểm tra link như trên; chưa đối chiếu từng con số chương mục với từng trang cho cả 59 sự kiện.
- Giấy phép của các trang được dẫn chưa được đối chiếu. Dự án chỉ dẫn link và tự viết tóm tắt, không chép nguyên văn (xem `docs/data/SOURCES.md`).
- Tên riêng tiếng Việt chưa hoàn toàn theo một kiểu: tên Hy Lạp dùng dạng Hy Lạp (Seleukos, Antiochos, Philippos), tên La Mã phần lớn dùng dạng Latinh (Antonius) nhưng "Pompey" và "Alexander" giữ dạng tiếng Anh quen dùng. Có thể thống nhất ở giai đoạn 5.
- 11 vị trí được đánh dấu `approximate`; danh sách nằm trong `docs/data/SOURCES.md`.
- Sự kiện ở Babylon (Alexander qua đời) và Carrhae nằm xa về phía đông nhưng vẫn trong vùng bản đồ nền.

### Đề nghị ngoài phạm vi

- Thêm lệnh `"validate": "node scripts/validate-data.mjs"` vào `package.json`.
