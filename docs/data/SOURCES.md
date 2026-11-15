# Nguồn dữ liệu lịch sử

Cập nhật: 2026-11-16.

## Cách dùng nguồn

- Mỗi sự kiện trong `src/data/events.json` dẫn ít nhất một nguồn, ưu tiên sử liệu cổ kèm chương mục cụ thể (ví dụ "Polybius, Histories 3.107–118").
- Dự án **chỉ trích dẫn và dẫn link**. Phần tóm tắt là tự viết, không chép nguyên văn từ bản dịch hay bài viết nào. Vì không sao chép nội dung, việc dẫn link không phụ thuộc giấy phép của trang được dẫn.
- Giấy phép của từng trang dưới đây **chưa được đối chiếu**. Nếu sau này muốn trích nguyên văn một đoạn dịch, phải kiểm tra giấy phép của bản dịch đó trước.

## Sử liệu cổ được dẫn

Livy (Ab Urbe Condita, Periochae), Polybius, Plutarch (Parallel Lives), Appian, Cassius Dio, Diodorus Siculus, Sallust, Suetonius, Caesar, Thucydides, Xenophon, Cicero, Tacitus, Pausanias, Velleius Paterculus, Aulus Gellius, Pliny the Elder, Frontinus, Augustus (Res Gestae).

Một nguồn không có link: bản đồng Senatus consultum de Bacchanalibus (tìm thấy ở Tiriolo), dẫn cho sự kiện trấn áp lễ Bacchanalia.

## Trang chứa bản dịch và bài tham khảo

| Trang | Số link | Nội dung dùng |
|---|---|---|
| penelope.uchicago.edu (LacusCurtius) | 53 | Bản dịch Polybius, Plutarch, Cassius Dio, Appian, Diodorus, Suetonius, Sallust và các tác giả khác |
| www.livius.org | 30 | Bài tham khảo hiện đại về trận đánh và nhân vật; bản dịch Appian, Periochae của Livy |
| en.wikisource.org | 23 | Bản dịch Livy (From the Founding of the City) và Thucydides |
| www.perseus.tufts.edu | 3 | Aulus Gellius, Pliny the Elder |
| www.attalus.org | 1 | Cicero, Brutus |
| www.theoi.com | 1 | Pausanias |

## Đã kiểm tra

- Cả 111 link đều phản hồi bình thường (kiểm tra ngày 2026-11-15).
- Lấy mẫu 35 link của 14 sự kiện: trang được dẫn đều có nhắc tới đúng sự kiện hoặc nhân vật.
- Chưa đối chiếu từng con số chương mục với từng trang cho toàn bộ 59 sự kiện.

## Toạ độ

Toạ độ là vị trí của địa danh cổ theo hiểu biết phổ thông, làm tròn tới 4 chữ số thập phân. Các vị trí chưa xác định chắc chắn hoặc còn tranh cãi được đánh dấu `approximate: true`: Núi Thiêng, núi Algidus, hẻm núi Caudium, Ipsus, đường Hannibal vượt Alps, Zama, Cynoscephalae, Eleusis gần Alexandria, sông Rubicon, Pharsalus, nơi gặp của Tam hùng lần thứ hai.

## Bản đồ nền

Xem `public/map/README.md` (Natural Earth, phạm vi công cộng).

## Biên giới (T-004)

### Khảo sát nguồn

Giấy phép dưới đây đọc trực tiếp từ trang hoặc file giấy phép của từng nguồn, ngày 2026-11-16.

| Nguồn | Phạm vi | Độ chi tiết | Giấy phép (đọc ở đâu) | Dùng? |
|---|---|---|---|---|
| [Cliopatria](https://github.com/Seshat-Global-History-Databank/cliopatria) (Seshat Global History Databank), bản v0.2.1 phát hành 2026-10-03 | Toàn thế giới, 3400 TCN–2024; hơn 1600 thế lực, mỗi dòng có `FromYear`–`ToYear` (năm âm là TCN) | Ảnh bản đồ gốc khoảng 40 km² mỗi điểm ảnh, polygon làm trơn ở độ phân giải 0,07°; không khớp chính xác với bờ biển. Trong vùng và thời kỳ của dự án có La Mã, Carthage, Etruscan, các thành bang Hy Lạp, Macedonia, Ptolemaios, Seleukos, Pergamon, Pontus, Numidia, Parthia; **không có** Gaul, Samnite, Liên minh Latinh, Syracuse, Epirus | **CC BY 4.0**: `LICENSE.md` của repo ở tag v0.2.1 ("This data is licensed under a Creative Commons Attribution 4.0 International License"); bản ghi Zenodo cũng ghi CC BY 4.0 | **Có**: tham chiếu để vẽ tay; phía đông (Seleukos, Ptolemaios, Parthia, Pergamon, Pontus, Numidia) lấy các đỉnh đã đơn giản hoá của Cliopatria rồi sửa |
| [historical-basemaps](https://github.com/aourednik/historical-basemaps) (A. Ourednik) | Toàn thế giới, các mốc `world_bc500`, `bc400`, `bc323`, `bc300`, `bc200`, `bc100`, `bc1`… | Tỉ lệ thế giới/châu lục; trường `BORDERPRECISION` 1–3; README không ghi nguồn cho từng vùng | **GPL-3.0**: thanh About của repo và file `LICENSE` ("GNU GENERAL PUBLIC LICENSE Version 3, 29 June 2007") | **Không.** Giấy phép copyleft, dữ liệu dẫn xuất phải theo GPL-3.0. Dùng hay không là việc của phiên chính |
| [AWMC geodata](https://github.com/AWMC/geodata) (Ancient World Mapping Center) | Bờ biển, sông, đường, cống dẫn nước cổ; `Cultural-Data/political_shading` chỉ có vài mốc: `roman_empire_bce_60`, `roman_empire_ce_117_extent`, `roman_empire_ce_200_*`, `alexanders_empire`, `persian_extent`, `hasmonean`, `herod`… | Dựa trên Barrington Atlas, chi tiết cao | **ODbL 1.0**: README và `LICENSE.txt`. Điều 4.4 buộc cơ sở dữ liệu dẫn xuất công bố công khai phải theo ODbL | **Không.** Điều khoản chia sẻ tương tự sẽ buộc các file biên giới theo ODbL; lại chỉ có một mốc thời Cộng hoà (60 TCN) |
| [Pleiades](https://pleiades.stoa.org/) | Danh bạ địa danh cổ (gazetteer) | Chủ yếu là điểm, không có polygon lãnh thổ | **CC BY 3.0**: trang [Downloads](https://pleiades.stoa.org/downloads) và [Credits](https://pleiades.stoa.org/credits) ("Sharing and remixing permitted under terms of the Creative Commons Attribution 3.0 License") | Không dùng ở đợt 1 |
| [Natural Earth](https://www.naturalearthdata.com/) | Bờ biển, sông, hồ ngày nay | 1:10m | **Phạm vi công cộng**: trang [Terms of Use](https://www.naturalearthdata.com/about/terms-of-use/) ("All versions of Natural Earth raster + vector map data found on this website are in the public domain") | **Có**: bản đồ nền; với biên giới thì lấy đường bờ của các đảo và vài đoạn bờ ở eo hẹp, kiểm tra chồng lấn trên đất liền |
| W. R. Shepherd, *Historical Atlas* (Henry Holt, New York, 1911 và 1923), bản quét trên Wikimedia Commons (từ Perry-Castañeda Library, University of Texas) | Các bản đồ: [Growth of Roman Power in Italy](https://commons.wikimedia.org/wiki/File:Rome_power_italy_500_100.jpg) (lãnh thổ La Mã khoảng 500, 338 và 100 TCN, thuộc địa Latinh, đồng minh); [Greek and Phoenician Settlements about 550 B.C.](https://commons.wikimedia.org/wiki/File:Shepherd-c-012.jpg); [Roman territory from 264 B.C. to Diocletian](https://commons.wikimedia.org/wiki/File:Roman_expansion_264_BC_Shepherd.jpg); [Kingdoms of the Diadochi 301 and 200 B.C.](https://commons.wikimedia.org/wiki/File:Diadochi_kingdoms_301_200.jpg) | Ảnh bản đồ, có lưới kinh vĩ tuyến. Bản đồ Ý được gắn toạ độ bằng 15 giao điểm kinh vĩ tuyến (sai số dưới 4 px, khoảng 0,015°) để đọc vị trí | **Phạm vi công cộng**: trường giấy phép của từng file trên Commons ("Public domain"); xuất bản ở Mỹ năm 1911 và 1923 | **Có**: tham chiếu chính để vẽ tay nước Ý, các thuộc địa Hy Lạp và lãnh thổ La Mã năm 146 |
| Digital Atlas of the Roman Empire (DARE, J. Åhlfeldt) | Địa danh và nền bản đồ thời Đế chế | Dựa trên Barrington Atlas | **Chưa đọc được:** tên miền chính thức `dare.ht.lu.se` không còn phân giải (2026-11-16); trang `imperium.ahlfeldt.se` không ghi giấy phép | **Không** |

### Ghi chú về Cliopatria

- Trích dẫn: Bennett J. S. và cộng sự, "Cliopatria - A geospatial database of world-wide political entities from 3400BCE to 2024CE", *Scientific Data* 12, 247 (2025), doi:[10.1038/s41597-025-04516-9](https://doi.org/10.1038/s41597-025-04516-9).
- Nghĩa vụ theo CC BY 4.0: ghi công tác giả và nguồn, dẫn link giấy phép, ghi rõ đã sửa đổi. Mỗi mốc trong `border-snapshots.json` ghi Cliopatria trong `sources`. Giấy phép: <https://creativecommons.org/licenses/by/4.0/>. Phần sửa đổi (đơn giản hoá, vẽ lại, cắt bớt, đẩy ra biển) ghi ở `BORDERS.md`.
- Theo bài báo, polygon của Cliopatria được vẽ lại bằng tay từ các tập bản đồ in (Penguin Atlas of World History, Times Atlas of World History, Shepherd's Historical Atlas…) rồi số hoá. Giấy phép CC BY 4.0 là do nhóm Cliopatria công bố; dự án dựa vào tuyên bố đó.
- Cliopatria chỉ cập nhật theo các "năm khung" (frame years), nên một dòng có thể phủ vài chục năm. Mốc của dự án chọn dòng gần nhất rồi sửa theo sử liệu khi cần (ghi ở từng mốc).

### Nguồn văn bản cho biên giới

Chỉ dẫn link, không chép: Polybius 3.22–23 (LacusCurtius), Livius.org "Sicily (5)" (biên giới sông Halycus), Wikipedia: "Etruscan civilization", "First Punic War", "Hiero II of Syracuse", "Fossa regia", "Hispania Citerior". Cả 12 link nguồn trong `border-snapshots.json` đều phản hồi bình thường (kiểm tra ngày 2026-11-16).

### Cách dựng và lựa chọn cho từng mốc

Xem `BORDERS.md`.
