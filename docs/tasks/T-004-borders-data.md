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

### Đợt 1 (2026-11-16): xong 3 mốc 509, 264, 146 TCN. Chờ phiên chính duyệt hướng làm trước khi làm đợt 2.

**Đã làm**

- Khảo sát 7 nguồn, giấy phép đọc trực tiếp từ trang của nguồn, ghi ở `docs/data/SOURCES.md`. Dùng: Shepherd *Historical Atlas* (phạm vi công cộng), Cliopatria v0.2.1 (CC BY 4.0), Natural Earth (phạm vi công cộng). **Không dùng** historical-basemaps (GPL-3.0) và AWMC (ODbL), vì cả hai buộc dữ liệu dẫn xuất theo cùng giấy phép; DARE cũng không dùng vì không đọc được giấy phép. Không có nguồn nào giấy phép không rõ mà vẫn dùng.
- Biên giới **vẽ tay**, không ghép thẳng polygon của bộ nào. Polygon Cliopatria hụt bờ biển 0,1–0,3° và xê dịch giữa các năm khung, nên ghép vào thì bờ biển lộ dải trống và đường biên nhảy qua lại giữa các mốc. Cách làm: đường ranh giới dùng chung vẽ một lần trong `scripts/borders/arcs.mjs`, từng mốc trong `scripts/borders/snapshots.mjs`, đảo và vài đoạn bờ ở eo hẹp lấy đúng từ bản đồ nền. Chi tiết và lựa chọn của từng mốc: `docs/data/BORDERS.md`.
- `scripts/build-borders.mjs` (không cần thư viện) ghi `public/data/borders/*.geojson` và `src/data/border-snapshots.json`, đồng thời kiểm tra: không chồng lấn trên đất liền, thế lực còn tồn tại ở năm của mốc, mốc có nguồn.
- Kích thước file: 509 là 15 KB, 264 là 38 KB, 146 là 37 KB.

**Đã kiểm tra**

- `node scripts/build-borders.mjs --check`, `npm run validate` (59 sự kiện, 17 thế lực, 3 mốc), `npm run lint`, `npm run build`: đều qua.
- Chạy `npm run dev` và chụp app bằng Edge headless ở các năm −509, −400, −264, −200, −146, −100, −27, và ở mức zoom 5.5 khi chọn các sự kiện "Founding of the Roman Republic", "First Punic War", "Destruction of Carthage", "Sack of Corinth". Chú giải hiện đúng "Borders as of 509/264/146 BCE"; dữ liệu thử của lane 2 đã tự tắt; console không có cảnh báo `polityId`; bờ biển không lộ dải trống. Các năm giữa hai mốc hiện mốc trước đó (đúng như thiết kế, đợt 2 sẽ thêm mốc).
- Diện tích đối chiếu: năm 264 lãnh thổ công dân La Mã 26 nghìn km², đồng minh 104 nghìn km²; Seleukos, Ptolemaios, Pergamon gần với số của Cliopatria.
- Cả 12 link nguồn trong `border-snapshots.json` đều phản hồi.

**Cần phiên chính quyết định**

1. **Thiếu Ba Tư.** `polities.json` không có Đế quốc Achaemenid, nên năm 509 toàn bộ Tiểu Á, Cận Đông và Ai Cập để trống (Ionia và Cyprus cũng trống). Nếu đợt 2 có mốc 338 thì càng cần. Đề nghị thêm thế lực `achaemenid-empire`, chỉ dùng trên bản đồ. Muốn vậy thì phải nới quy tắc của `validate-data.mjs` "thế lực nào cũng phải được ít nhất một sự kiện dùng", hoặc thêm một sự kiện dùng nó (ví dụ trận Marathon 490). Lane 3 chưa tự làm, vì `events.json` nằm ngoài phạm vi T-004 và nới quy tắc là việc của phiên chính. Câu hỏi tương tự với các thế lực chỉ có trên bản đồ ở các mốc sau (Bithynia, Cappadocia, Armenia, Mauretania): thêm, hay để trống như hiện nay?
2. **La Mã và đồng minh tách màu** (264, 146): đỏ là lãnh thổ công dân, xám là `italian-allies`. Đúng sử hơn và khớp với sự kiện Chiến tranh Đồng minh (năm 88 đồng minh nhập vào La Mã), nhưng năm 264 nước Ý trông "phần lớn không phải La Mã". Nếu muốn cả bán đảo một màu thì chỉ cần đổi gán vùng trong `snapshots.mjs`.
3. Vài lựa chọn khác với Cliopatria, có ghi lý do trong `BORDERS.md`: năm 146 không tính Dalmatia, ven biển Thrace, Lycia và Caria là của La Mã; năm 264 Cilicia của Ptolemaios chỉ giữ dải ven biển; năm 264 Cyrenaica để trống (vương quốc riêng của Magas theo Cliopatria); năm 264 Euboea thuộc Macedonia (theo Cliopatria).

**Đề nghị ngoài phạm vi**

- **Ghi công trên giao diện** (lane 2 hoặc phiên chính): CC BY 4.0 của Cliopatria yêu cầu ghi công ở chỗ người dùng nhìn thấy. Chú giải bản đồ hiện chỉ ghi Natural Earth. Đề nghị thêm một dòng, ví dụ "Borders: drawn after Shepherd's Historical Atlas and Cliopatria (CC BY 4.0)" và bản tiếng Việt.
- `package.json`: thêm `"borders": "node scripts/build-borders.mjs"`. Cân nhắc cho `npm run validate` gọi luôn `build-borders.mjs --check`.
- Gỡ `src/components/map/__fixtures__/` (đã có trong PLAN).

**Đề xuất cho đợt 2** (tổng cộng 14 mốc; mốc đánh dấu ✓ đã xong)

| Năm | Lý do |
|---|---|
| 509 ✓ | Lập Cộng hoà |
| 338 | Kết thúc Chiến tranh Latinh, giải thể Liên minh Latinh; Macedonia của Philip II |
| 290 | Kết thúc Chiến tranh Samnite lần ba, sáp nhập xứ Sabine |
| 264 ✓ | Ý thống nhất dưới La Mã, mở đầu Chiến tranh Punic lần một |
| 241 | Sicily thành tỉnh đầu tiên |
| 218 | Trước Chiến tranh Punic lần hai: Tây Ban Nha của nhà Barca; Sardinia, Corsica, Gaul trong dãy Alps đã thuộc La Mã |
| 201 | Sau Zama: Tây Ban Nha, vương quốc Numidia của Masinissa |
| 168 | Pydna, Macedonia chấm dứt; sau hoà ước Apamea (188) |
| 146 ✓ | Carthage và Corinth bị phá |
| 129 | Tỉnh Asia (di sản Pergamon); Narbonensis sau đó ít lâu |
| 88 | Chiến tranh Đồng minh kết thúc (đồng minh nhập vào La Mã), Pontus của Mithridates bành trướng |
| 63 | Pompey sắp xếp lại phương Đông: Syria, Pontus, Bithynia; Seleukos chấm dứt |
| 50 | Caesar chinh phục xong Gaul |
| 30 | Ai Cập bị sáp nhập sau Actium |
