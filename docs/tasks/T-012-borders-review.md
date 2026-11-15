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

Xong ngày 2026-11-16 (lane 3). Chi tiết từng mốc: `docs/data/BORDERS.md`, mục "Soát lại đợt 2".

**Đã làm**

- **Kiểm tra màu** trong `scripts/build-borders.mjs`: mọi cặp thế lực có đất liền chạm nhau ở một mốc (kể cả chạm chéo ô lưới 0,05°) phải chênh CIE76 ΔE ≥ 12, tính trên màu tô ở độ mờ `TERRITORY_OPACITY.fill` đè lên `--map-land` sáng và tối. Hai giá trị này đọc thẳng từ `mapStyle.ts` và `globals.css`, nên đổi màu nền hay độ mờ thì kiểm tra tự theo. Kết quả: 54 cặp, nhỏ nhất 13,5 (thành bang Hy Lạp và Syracuse, năm 338 và 290), khớp số phiên chính đo. Phiên chính đếm được 59 cặp; script này chỉ tính các cặp chạm nhau trên đất liền, không tính cặp chỉ gặp nhau ngoài biển. Đã thử nâng ngưỡng lên 14 thì build báo lỗi đúng các cặp dưới ngưỡng.
- **Soát 11 mốc của đợt 2** và các phần đợt 2 thêm vào 509, 264, 146: chồng từng mốc lên Cliopatria, đối chiếu với bản đồ Shepherd (thêm bản đồ "The Macedonian Empire, 336–323 B.C."), chỗ khác nhau thì tra Wikipedia.
  - **Có sửa:** 338, 290, 218, 201, 168, 129, 88, 63, 50, 30.
  - **Đã soát, giữ nguyên:** 509, 264, 241, 146.
  - **Sửa chính:** người Senones ở bờ Adriatic (338, 290); Etruria vẫn là Etruscan năm 290; Gaul trong dãy Alps là của người Gaul và Liguria để trống năm 218 và 201; vùng bảo hộ Illyria (218–168) và Illyricum (50, 30); Pergamon của Attalus I (218, 201); Tây Ban Nha năm 201; Rhodes giữ Caria và Lycia, Seleukos giữ Cilicia năm 168; Caria thuộc tỉnh Asia từ 129; Judaea, Armenia và Syria năm 88; chỉ dải bờ Pontus là của La Mã từ 63.
- **Một lỗi rõ ràng** đã sửa: ranh giới Mauretania–Numidia năm 88, 63, 50 nằm ở khoảng 1,5° Đông, đặt Iol (kinh đô phía đông của Mauretania năm 49) sang phía Numidia. Nay dời về Saldae (khoảng 5,3° Đông) theo Cliopatria.
- **Các đơn giản hoá** trong danh sách: đã sửa Gaul trong dãy Alps, Liguria, Tây Ban Nha năm 201, Pergamon năm 218 và 201, Armenia năm 88, Pontus từ 63, Judaea năm 88, Illyria. Giữ nguyên, có ghi lý do: Tây Ban Nha năm 168, Pergamon năm 241, Judaea năm 129 và từ 63, các tiểu quốc không có trong `polities.json`.
  - Riêng Armenia năm 88 phải sửa theo hướng ngược với dự kiến: năm đó Armenia **nhỏ hơn** hình năm 146, vì Tigranes đã nhường "bảy mươi thung lũng" cho Parthia; đế quốc lớn của ông là từ năm 83.
- **Ngoài yêu cầu: gộp polygon cùng thế lực.** Từ đợt 2, các mảnh chạm nhau của cùng một thế lực (các tỉnh La Mã từ năm 241, Pontus năm 88, Seleukos năm 168) được ghi thành polygon riêng, nên bản đồ vẽ đường kẻ giữa chúng (thấy rõ trong app, ví dụ giữa Gaul và Narbonensis năm 50). Script build nay gộp các mảnh này khi ghi file: bỏ cạnh chung, nối phần còn lại. Bản gộp chỉ được dùng nếu phủ đúng các ô lưới như các mảnh rời; các kiểm tra chồng lấn và màu vẫn chạy trên các mảnh như đã vẽ. Kết quả: 61 mảnh được gộp, không trường hợp nào phải giữ mảnh rời.
- Tài liệu: `docs/data/BORDERS.md` (cách soát, bảng từng mốc kèm căn cứ, trạng thái từng đơn giản hoá, phần còn lại, kiểm tra mới); `docs/data/SOURCES.md` (bản đồ Shepherd mới, các dòng Cliopatria mới, 15 bài Wikipedia kèm giấy phép văn bản đọc ở chân trang).

**Đã kiểm tra**

- `npm run borders`, `npm run validate`, `npm run lint`, `npm run build`: đều qua. Mỗi file biên giới 19–45 KB.
- Đã xem cả 14 mốc trên app (`npm run dev`, Edge headless, 1440×900): chú giải đúng từng năm, console không có cảnh báo, không còn đường kẻ bên trong lãnh thổ một thế lực. Cả 35 link nguồn trong `border-snapshots.json` đều phản hồi.

**Còn lại, để phiên chính cân nhắc**

- La Mã chinh phục Gaul trong dãy Alps năm 222 và mất năm 218. Không có mốc nào giữa 241 và 218 nên giai đoạn đó không hiện. Nếu muốn hiện, có thể thêm mốc 222.
- Chưa vẽ được Tây Ban Nha của nhà Barca chi tiết hơn (năm 218) và Đại Phrygia của Pontus (năm 129), vì các nguồn đã đọc không cho ranh giới. Người Veneti để trống tới năm 168, như đợt 1.
- Việc gộp polygon làm số mảnh của một thế lực giảm, nên nhãn tên thế lực của T-009 (một nhãn cho mỗi mảnh lớn) có thể đổi chỗ. Trong app ở các năm đã xem, nhãn vẫn hiển thị bình thường.

**Commit trên nhánh:** `c0519c5` (kiểm tra màu), `621d5a2` (sửa đường biên), `783c811` (gộp polygon), `d0fc833` (Caria), `0b0f19f` (tài liệu), cộng commit điền kết quả này.
