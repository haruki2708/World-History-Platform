# Trận Cannae (216 TCN): căn cứ dữ liệu

Cập nhật: 2026-11-16 (T-016). File dữ liệu: `src/data/battles/battle-of-cannae.json`. Lưới độ cao: `public/data/terrain/battle-of-cannae.bin`, dựng bằng `scripts/battles/build-terrain.mjs`.

Tài liệu này ghi nguồn đã đọc, các giả thuyết đã chọn và lý do, để người sau kiểm tra hoặc sửa.

## 1. Nguồn đã đọc

| Nguồn | Đọc ở đâu | Dùng cho |
|---|---|---|
| Polybius, *Histories* 3.107–118 (bản dịch Loeb 1922 của W. R. Paton) | [LacusCurtius](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/3*.html) | Trại, hướng quân, thứ tự dàn trận, diễn biến, quân số, thương vong |
| Livy, *Ab Urbe Condita* 22.36–52 (bản dịch Roberts) | [Wikisource](https://en.wikisource.org/wiki/From_the_Founding_of_the_City/Book_22) và Perseus (chương 40, 41, 45–48) | Hai trại, dàn trận, gió Volturnus, mưu 500 kỵ binh Numidia, thương vong, số người chạy thoát |
| Livy 22 (bản Latin) | [The Latin Library](https://www.thelatinlibrary.com/livy/liv.22.shtml) | Đối chiếu 22.36 (87.200 người), 22.46 (hướng quân), 22.49 (thương vong, Paullus trúng đá ném) |
| Bài "Battle of Cannae" | [Wikipedia](https://en.wikipedia.org/wiki/Battle_of_Cannae) | Chỉ để tham khảo cách chia quân của Hannibal theo ước lượng hiện đại (bài dẫn Daly 2002 và Goldsworthy 2001). Không chép nội dung |

Mọi tiêu đề và lời dẫn trong file trận là tự viết. Chỉ dẫn link, không chép văn bản.

### Một lỗi dịch cần biết

Bản dịch Roberts của Livy 22.46.8 (trên Perseus) viết quân La Mã quay mặt về **bắc**, quân Carthage về **nam**. Bản Latin viết ngược lại: *Romanis in meridiem, Poenis in septentrionem versis*, tức quân La Mã quay về **nam**. Như vậy Livy khớp với Polybius 3.113 và 3.114: La Mã quay về nam, Carthage quay về bắc. Dữ liệu theo bản Latin.

## 2. Hệ toạ độ

- **Gốc toạ độ** `origin` = 16,2085 Đ, 41,3327 B: điểm giữa hai chiến tuyến lúc dàn trận. Bản đồ bay tới đây trước khi mở cảnh.
- Thành Cannae (toạ độ của sự kiện trong `events.json`: 16,1518 Đ, 41,2967 B) nằm ở x = −4746 m, y = −3998 m, tức cách chiến trường khoảng 6,2 km về phía tây nam.
- Đổi kinh vĩ độ ra mét: mặt phẳng tiếp xúc tại gốc, dùng bán kính cong của elipxoit WGS84 ở vĩ độ gốc (111 060 m mỗi độ vĩ, 83 711 m mỗi độ kinh). Trên 10 km, sai số nhỏ hơn nhiều so với một ô lưới.

## 3. Trận ở bờ nào của sông Aufidus

**Đây là chỗ còn tranh cãi.** Các nguồn cổ không nói thẳng bờ nào. Các mô tả dùng được:

- Polybius 3.110: Paullus đóng trại lớn (hai phần ba quân) bên bờ sông, và trại nhỏ ở **bờ bên kia, phía đông chỗ lội qua**, cách trại lớn khoảng 10 stadion (chừng 1,8 km).
- Polybius 3.111: Hannibal dời trại sang **cùng bờ với trại lớn** của La Mã.
- Polybius 3.113, Livy 22.45: hôm giao chiến, Varro dẫn quân trại lớn **vượt sông**, nhập với quân trại nhỏ, dàn trận **quay mặt về nam**. Kỵ binh La Mã ở **cánh phải, sát sông**. Hannibal vượt sông ở **hai chỗ** và dàn quân quay về bắc, kỵ binh Iberia và Gaul ở cánh trái, sát sông.
- Polybius 3.114 và Livy 22.46: mặt trời buổi sáng chiếu **xiên** cả hai bên, không làm chói bên nào. Điều này hợp với hai chiến tuyến chạy theo hướng đông–tây.

Từ đó: chiến trường ở bờ của trại nhỏ; sông nằm ở **phía tây** chiến trường; chiến tuyến chạy đông–tây.

**Dòng sông ngày nay** (dò từ dữ liệu độ cao, mục 7) chảy từ tây nam lên đông bắc. Sát chân đồi Cannae, đồng bằng ven bờ phải chỉ rộng chừng 1,5 km, kẹp giữa sông và vách đất cao 15–20 m; một chiến tuyến dài 2,5–3 km vuông góc với sông ở đó sẽ cắt ngang vách đất. Nhưng cách Cannae khoảng 5 km về phía đông bắc, sông có một đoạn dài khoảng 1 km **chảy gần đúng hướng bắc**, và bờ đông của đoạn này là một đồng bằng thấp (cao 2–7 m), rộng khoảng 2,5 km, kín phía nam bởi một bậc đất cao 10–17 m.

**Giả thuyết đã chọn:** trận ở **bờ phải (bờ đông) của sông, trên đồng bằng đông bắc Cannae**, ở bờ đông của đoạn sông chảy về bắc. Lý do:

1. Quân La Mã quay mặt về nam thì sông nằm ở bên phải họ, đúng như Polybius và Livy tả, mà không phải xoay chiến tuyến.
2. Chiến tuyến đông–tây hợp với chi tiết mặt trời buổi sáng chiếu xiên.
3. Đồng bằng đủ rộng cho cả hai đạo quân, không có vách đất cắt ngang.
4. Bố trí trại khớp với Polybius: trại lớn của La Mã và trại của Hannibal ở bờ tây, trại nhỏ ở bờ đông, phía đông chỗ lội qua.

**Giả thuyết khác:** nhiều phỏng dựng đặt chiến trường ở bờ trái, gần Cannae hơn. Ví dụ toạ độ trong hộp thông tin của bài Wikipedia (16,1325 Đ, 41,3064 B) nằm ở bờ trái, cách Cannae khoảng 1,9 km về phía tây bắc. Dòng sông cổ có thể khác hẳn ngày nay, nên không thể loại các giả thuyết đó. Tất cả được nói rõ trong `uncertainty` của file trận.

## 4. Trại và chỗ vượt sông

Toàn bộ là vị trí ước lượng (`approximate: true`):

| Địa danh | x, y (m) | Căn cứ |
|---|---|---|
| Trại lớn của La Mã | −1600, 1250 | Bờ tây; cách trại nhỏ 1,85 km (khoảng 10 stadion, Polybius 3.110) |
| Trại nhỏ của La Mã | 250, 1200 | Bờ đông, phía đông chỗ quân La Mã lội qua (Polybius 3.110) |
| Trại của Hannibal | −3550, −400 | Bờ tây, cùng bờ với trại lớn (Polybius 3.111); trên đất hơi cao, cách sông khoảng 900 m |
| Chỗ quân La Mã vượt sông | −470, 1100 | Giữa hai trại La Mã |
| Hai chỗ Hannibal vượt sông | −1350, −450 và −1900, −740 | Polybius 3.113: vượt ở hai chỗ |
| Thành và đồi Cannae | −4746, −3998 và −4650, −4300 | Toạ độ sự kiện; đỉnh gò đất ngay phía nam |

Hannibal lúc đầu đóng trại gần Cannae (bờ phải), rồi mới dời sang bờ trái. Cảnh chỉ vẽ trại ở vị trí sau khi dời.

## 5. Quân số và chia đơn vị

### Tổng quân số (`strength`)

- **La Mã: 86 000 – 87 200.** Polybius 3.113: khoảng 80 000 bộ binh (kể cả 10 000 người để lại trại lớn, 3.117) và hơn 6 000 kỵ binh. Livy 22.36: các nguồn không thống nhất; một số tác giả cho 87 200 người. Một số sử gia hiện đại nghĩ con số thật thấp hơn; ghi trong `note`.
- **Carthage: 50 000.** Polybius 3.114 và Livy 22.46 cùng ghi khoảng 40 000 bộ binh và 10 000 kỵ binh. Toán giữ trại của Hannibal không rõ quân số nên không có đơn vị riêng.

### Đơn vị phía La Mã (tổng 86 200)

| Đơn vị | Loại | Người | Căn cứ |
|---|---|---|---|
| Kỵ binh La Mã (Paullus) | `roman-cavalry` | 2 400 | 8 quân đoàn × 300 kỵ (Livy 22.36); cánh phải sát sông |
| Kỵ binh đồng minh (Varro) | `allied-cavalry` | 3 800 | Cho tổng kỵ binh khoảng 6 200, hơi trên 6 000 của Polybius; cánh trái |
| Velites La Mã | `roman-velites` | 8 000 | Lính nhẹ đứng trước toàn quân (Polybius 3.113) |
| Bộ binh nhẹ đồng minh | `roman-velites` | 7 000 | Như trên. Tổng lính nhẹ 15 000, cùng mức với ước lượng hiện đại |
| Hastati | `roman-hastati` | 11 400 | Hàng đầu của tám quân đoàn |
| Principes | `roman-principes` | 11 400 | Hàng giữa |
| Triarii | `roman-triarii` | 4 200 | Hàng sau; ít người hơn (Polybius 6.21: 600 mỗi quân đoàn khi quân đoàn đông hơn) |
| Bộ binh đồng minh, các hàng trước | `socii-infantry` | 14 000 | Livy 22.45: bộ binh đồng minh đứng giữa quân đoàn La Mã và kỵ binh đồng minh, tức lệch về cánh trái |
| Bộ binh đồng minh, các hàng sau | `socii-infantry` | 14 000 | |
| Lực lượng ở lại trại lớn | `socii-infantry` | 10 000 | Polybius 3.117. Thành phần không rõ; dùng tạm loại bộ binh đồng minh |

Cách chia 70 000 bộ binh ra trận thành lính nhẹ và ba hàng là ước lượng: tám quân đoàn La Mã, mỗi quân đoàn 5 000 bộ binh (Livy 22.36), cùng số bộ binh đồng minh tương đương; phần 10 000 ở lại trại lấy đều từ cả hai.

### Đơn vị phía Hannibal (tổng 50 000)

| Đơn vị | Loại | Người | Căn cứ |
|---|---|---|---|
| Lính ném đá Baleares | `balearic-slingers` | 2 000 | Polybius 3.113 và Livy 22.46 nhắc lính ném đá đi trước; số theo ước lượng hiện đại |
| Lính giáo nhẹ | `light-spearmen` (loại mới) | 6 000 | Polybius 3.113: lính ném đá và lính giáo đi trước; số theo ước lượng hiện đại |
| Kỵ binh Iberia và Gaul, hàng trước / hàng sau (Hasdrubal) | `iberian-gallic-cavalry` | 3 000 + 3 000 | Cánh trái sát sông. Chia hai khối để dễ thấy cú vòng ra sau lưng |
| Bộ binh Libya, cánh trái / cánh phải | `libyan-infantry` | 4 000 + 4 000 | Polybius 3.113: một nửa lính châu Phi ở mỗi bên. Tổng 8 000 theo ước lượng hiện đại |
| Lưỡi liềm: Gaul trái, Iberia lệch trái, Gaul giữa, Iberia lệch phải, Gaul phải | `gallic-infantry`, `iberian-infantry` | 5 000, 4 000, 6 000, 4 000, 5 000 | Polybius 3.114: Gaul và Iberia đứng xen kẽ từng toán. Gaul 16 000, Iberia 8 000 theo ước lượng hiện đại |
| Kỵ binh Numidia | `numidian-cavalry` | 4 000 | Cánh phải. Polybius ghi Hanno chỉ huy cánh phải, Livy ghi Maharbal |

Ước lượng hiện đại về cách chia quân của Hannibal lấy từ bài Wikipedia nói trên, bài này dẫn Daly (2002) và Goldsworthy (2001). Hộp thông tin của chính bài đó lại cho cách chia khác (21 000 Gaul, 3 000 Iberia); đây là chỗ chưa thống nhất.

**Lưỡi liềm** chia thành năm khối xen kẽ Gaul và Iberia, đặt theo một cung tròn, mỗi khối quay mặt theo cung. Cách này vừa đúng chi tiết "xen kẽ từng toán" của Polybius, vừa cho phép lưỡi liềm lồi lúc đầu rồi lõm vào ở giai đoạn 4 mà không cần kiểu dữ liệu mới.

### Thương vong (`casualties`, tính số chết)

- **La Mã: 48 200 – 70 000.** Livy 22.49: 45 500 bộ binh và 2 700 kỵ binh chết; 3 000 bộ binh và 1 500 kỵ binh bị bắt ngay trong trận. Polybius 3.117: khoảng 70 000 chết, khoảng 10 000 bị bắt (lực lượng ở trại), chỉ khoảng 3 000 bộ binh và 370 kỵ binh thoát.
- **Carthage: 5 700 – 8 000.** Polybius 3.117: khoảng 4 000 Gaul, 1 500 Iberia và Libya, 200 kỵ binh. Livy 22.52: tới 8 000.
- Trong file, số người của từng đơn vị giảm dần qua các giai đoạn. Phía Carthage mất tổng cộng khoảng 6 000 người, chia theo Polybius: Gaul mất 4 000, Iberia và Libya 1 500, kỵ binh 200, lính nhẹ 350. Phía La Mã còn khoảng 9 300 người trên chiến trường ở cuối trận (gồm cả người chạy thoát) và 8 000 ở trại; tức gần với con số của Polybius. Số "còn lại" chỉ để cảnh biết vẽ bao nhiêu hình lính, không phải một con số lịch sử.

### Chỉ huy

- La Mã: Varro (cánh trái, cầm quân hôm ấy), Paullus (cánh phải), Gnaeus Servilius Geminus và Marcus Atilius Regulus (trung quân, theo Polybius 3.114). Livy 22.40 lại nói Atilius được cho về Rome vì tuổi cao trước trận; ghi rõ "theo Polybius".
- Carthage: Hannibal và em là Mago (trung quân), Hasdrubal (cánh trái), Hanno (cánh phải, theo Polybius) hoặc Maharbal (theo Livy).

## 6. Thời gian và các giai đoạn

Không nguồn nào cho giờ cụ thể, trừ việc quân La Mã ra trận "ngay sau khi mặt trời mọc" (Polybius 3.113) và Hannibal vượt sông "lúc rạng sáng" (Livy 22.46). Các mốc giờ dưới đây là ước lượng để ánh sáng trong cảnh hợp lý:

| Giai đoạn | Kết thúc | Phát (giây) | Căn cứ |
|---|---|---|---|
| Lúc bắt đầu (`initial`) | 5:30 | | Mỗi đạo quân là một khối đang khép hàng, lùi về phía nơi nó đến: quân La Mã lùi 760 m về phía bắc (hai trại và chỗ lội), quân Hannibal lùi 1,7 km về phía tây (trại và hai chỗ vượt sông của ông). Xem mục 9 |
| 1. Dàn trận | 8:00 | 25 | Polybius 3.113: thứ tự hai bên như mục 5. Hai chiến tuyến cách nhau khoảng 450 m, lính nhẹ đứng trước. Lưỡi liềm lồi khoảng 90 m về phía quân La Mã |
| 2. Lính nhẹ đụng độ | 9:00 | 15 | Polybius 3.115: lính nhẹ giao chiến trước, chưa bên nào hơn. Livy 22.49: Paullus trúng đá ném ngay đầu trận. Livy 22.46: gió Volturnus thổi bụi vào mặt quân La Mã. Polybius 3.117: lực lượng ở trại lớn đánh trại Hannibal khi trận bắt đầu |
| 3. Kỵ binh bên sông | 9:45 | 20 | Polybius 3.115 và Livy 22.47: chỗ hẹp, không xoay trở được, kỵ binh xuống ngựa đánh bộ; kỵ binh La Mã bị đánh tan và bị đuổi dọc bờ sông. Lính nhẹ lui về, bộ binh nặng tiến lên (Polybius 3.115). Kỵ binh Numidia cầm chân kỵ binh đồng minh (Polybius 3.116) |
| 4. Lưỡi liềm bị đẩy lõm | 11:00 | 25 | Polybius 3.115 và Livy 22.47: lính Gaul và Iberia trụ một lúc rồi lùi; lưỡi liềm lõm vào; quân La Mã dồn từ hai cánh vào giữa. Mặt trận La Mã được đặt cách mép lưỡi liềm 6 m, xoay và phình theo đúng chỗ lõm (mục 9) |
| 5. Cái bẫy sập | 12:30 | 25 | Polybius 3.115: lính châu Phi hai bên quay vào đánh sườn. Polybius 3.116: Hasdrubal vòng sang giúp kỵ binh Numidia, kỵ binh đồng minh bỏ chạy, ông để Numidia đuổi theo |
| 6. Vòng vây khép lại | 17:00 | 30 | Polybius 3.116: Hasdrubal đánh vào lưng các quân đoàn; quân La Mã chống cự tới khi các hàng ngoài ngã rồi bị giết tại chỗ; Paullus, Servilius và Atilius tử trận; Varro chạy về Venusia. Polybius 3.117: Hannibal giải vây trại, đánh lui toán La Mã về trại của họ |

Chi tiết không vẽ thành chuyển động riêng: mưu 500 kỵ binh Numidia giả hàng (Livy 22.48), cảnh Lentulus gặp Paullus (Livy 22.49), các toán chạy thoát về hai trại và làng Cannae (Livy 22.49–50).

Hướng các khối quân: La Mã quay về nam (180°), Carthage về bắc (0°) lúc dàn trận. Khoảng cách và bề rộng các khối là ước lượng sao cho tổng chiều dài chiến tuyến khoảng 2,7 km, khớp với bề rộng đồng bằng; bộ binh La Mã đứng sâu (ba hàng, tổng chừng 120 m) như Polybius 3.113 tả.

### Ngày trong năm (`dayOfYear`)

Ngày 2 tháng 8 là theo **lịch La Mã thời đó** (Macrobius, *Saturnalia* 1.16.26, dẫn sử gia Quadrigarius: *ante diem IIII Nonas Sextiles*). Lịch La Mã trước cải cách của Caesar không khớp với mùa: các giáo sĩ (*pontifices*) chèn tháng nhuận thất thường. Ví dụ: Livy (44.37.8) ghi nguyệt thực năm 168 TCN vào ngày 4 tháng 9, trong khi tính thiên văn cho ra ngày 21 tháng 6 theo lịch Julius.

- **Chọn:** ngày 1 tháng 7 năm 216 TCN theo lịch Julius, là quy đổi của P. S. Derow ("The Roman Calendar, 218–191 B.C.", *Phoenix* 30.3, 1976, tr. 277 trở đi). Bài báo của Derow nằm sau JSTOR, tôi chưa đọc bản gốc; con số lấy theo bài "Battle of Cannae" trên Wikipedia tiếng Anh, có dẫn bài này. Wikipedia cũng ghi các tác giả khác đề xuất những ngày khác, không nêu cụ thể.
- **Quy đổi:** hợp đồng dùng lịch Gregory nối ngược. Ngày 1/7 năm 216 TCN (năm thiên văn −215) theo lịch Julius là ngày Julius 1 642 710,5, tức **27 tháng 6** theo lịch Gregory nối ngược. Năm −215 không nhuận, nên **`dayOfYear` = 178**, vài ngày sau hạ chí: ngày dài nhất năm, mặt trời mọc sớm, đúng với "ngay sau khi mặt trời mọc" quân La Mã đã ra trận.
- Nếu lấy thẳng ngày 2/8 theo lịch Julius thì ra 29/7 Gregory (`dayOfYear` 210). Đường đi của mặt trời hai ngày này không khác nhiều; giữ số của Derow vì đó là quy đổi có căn cứ.

## 7. Địa hình

### Khảo sát nguồn độ cao

Giấy phép đọc trực tiếp ngày 2026-11-16.

| Nguồn | Tải ở đâu, cần tài khoản? | Giấy phép (đọc ở đâu) | Chất lượng ở Cannae | Dùng? |
|---|---|---|---|---|
| **Copernicus DEM GLO-30** (ESA, Airbus, DLR) | Kho AWS công khai `copernicus-dem-30m`, **không cần tài khoản** | File giấy phép đi kèm từng ô: `INFO/eula_F.pdf` ("Licence for Copernicus DEM instance COP-DEM-GLO-30-F Global 30m Full, Free & Open"). Điều 4 cho phép sao chép, phân phối, công bố, **sửa đổi và kết hợp**; điều 5 miễn phí. Điều 6 buộc ghi câu ghi công (xem dưới), kèm câu miễn trách nhiệm, không ngụ ý được chứng thực, và buộc người nhận lại tuân theo cùng các nghĩa vụ ghi công đó. **Không có điều khoản chia sẻ tương tự** buộc dữ liệu dẫn xuất theo cùng giấy phép | Mịn, thấy rõ lòng sông uốn khúc trên đồng bằng | **Có**: nguồn chính |
| SRTM GL1 (NASA/USGS) | Kho S3 công khai của OpenTopography, **không cần tài khoản**. Trang OpenTopography ghi "Use License: Not Provided" và yêu cầu ghi công OpenTopography. Trang USGS và LP DAAC không đọc được (lỗi 405 và 403) | SRTM của NASA/USGS thường được coi là phạm vi công cộng, nhưng chưa đọc được câu đó trên trang của USGS | Nhiễu khoảng ±2 m trên đồng bằng, không thấy lòng sông | Dự phòng: `--source srtm` |
| OpenStreetMap (sông, đường) | | ODbL, buộc dữ liệu dẫn xuất theo ODbL | | **Không** (theo yêu cầu task) |

**Câu ghi công bắt buộc** (điều 6b, vì dữ liệu đã được lấy mẫu lại): "produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved". Câu này nằm trong `terrain.sources`. Theo điều 6c, khi đưa trận đánh vào app chính, phần ghi công (hộp thoại Giới thiệu, README) cần thêm câu: "The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM-30."

**Lưu ý cho phiên chính:** giấy phép Copernicus không phải "chỉ ghi công" thuần như CC BY: ngoài ghi công còn có câu miễn trách nhiệm và nghĩa vụ chuyển tiếp các yêu cầu đó cho người nhận lại. Không có điều khoản chia sẻ tương tự hay cấm thương mại. Nếu phiên chính muốn tránh hẳn, chạy `node scripts/battles/build-terrain.mjs --source srtm` là có lưới thuần SRTM (cùng khung, cùng kích thước); khi đó sửa `terrain.sources` và đánh giá lại vị trí sông (dò từ Copernicus).

### Copernicus DEM là mô hình bề mặt

GLO-30 là mô hình bề mặt (DSM): đo cả cây và nhà, không chỉ mặt đất. Vùng chiến trường hiện là đồng ruộng nên ảnh hưởng nhỏ; một số đường đắp, mương và kè sông hiện đại vẫn hiện trên lưới. Không lọc bỏ.

### Dựng lưới

- Ô gốc: `N41E016` (GeoTIFF Float32, nén deflate, predictor dấu phẩy động), lưu ngoài repo tại `E:\World_History_Platform_assets\terrain\copernicus-glo30\`. Ô SRTM dự phòng ở `...\srtm-gl1\`.
- Vùng phủ: x từ −5400 tới 4800 m, y từ −4800 tới 3300 m (10,2 × 8,1 km), gồm chiến trường, ba trại, chỗ vượt sông và thành Cannae.
- Lưới 341 × 271 điểm, cách nhau 30 m, nội suy song tuyến. Điểm lưới nằm ở mép vùng phủ: cột i ở x = minX + 30·i.
- Độ cao từ −1,0 tới 71,2 m. Góc đông bắc chạm đồng bằng ven biển (0–1 m).
- Script không dùng thư viện npm: tự đọc GeoTIFF bằng `zlib` của Node.

### Sông Aufidus (Ofanto)

- Vẽ theo **dòng chảy ngày nay**, `approximate: true`. Dòng sông thời cổ chắc chắn khác: sông uốn khúc trên đồng bằng phù sa và đã đổi dòng nhiều lần, hạ lưu còn bị đắp kè.
- Cách dò: `build-terrain.mjs --trace` tìm đường đi rẻ nhất qua các điểm mốc, với giá mỗi ô tăng theo độ cao của ô so với trung vị độ cao trong bán kính 500 m quanh nó. Đường đi vì thế bám lòng sông khoét sâu, kể cả khi cả thung lũng dốc dần ra biển. Kết quả rút gọn còn 68 điểm (sai lệch tối đa 20 m). Lệnh và các điểm mốc ghi ở đầu script.
- Đã soát bằng mắt trên ảnh độ cao tương đối: đường dò bám lòng sông, trừ vài khúc uốn nhỏ bị cắt ngắn.
- Bề rộng 30 m.

### Xem trước

`node scripts/battles/build-terrain.mjs --preview out.png --phase 3 --extent -1800,1800,-800,1400 --spacing 5` vẽ địa hình, sông, địa danh, khung các khối quân lúc cuối giai đoạn 3 và các mũi tên. Dùng để soát vị trí khi sửa dữ liệu.

## 8. Kiểm tra

`scripts/battles/validate-battles.mjs` (chạy trong `npm run validate`) đã thêm:

- Các khối quân cùng phe không được chồng lên nhau quá 25% diện tích khối nhỏ hơn, ở mọi mốc (`initial` và cuối mỗi giai đoạn; bỏ qua `bulge`).
- Mỗi giai đoạn phải có ít nhất một đơn vị đổi vị trí, hành động hoặc số người.
- Mọi điểm của sông phải nằm trong vùng địa hình.
- `dayOfYear`, nếu có, là số nguyên từ 1 tới 366 (T-020).

`scripts/battles/check-overlap.mjs` (T-020, không nằm trong `npm run validate`) báo các khối chồng nhau ở mọi mốc **và giữa các mốc** (mỗi 1/4 giai đoạn), cả cùng phe lẫn hai phe, tính cả `bulge`, đúng như cảnh di chuyển chúng (nội suy tuyến tính). Dùng khi sửa dữ liệu: `node scripts/battles/check-overlap.mjs --min 0.05`.

## 9. Chỉnh khi xem trong cảnh thật (T-020)

Xem cả 6 giai đoạn trong `/battle-lab?stats=1` (cảnh của T-015, T-018), kết hợp với `check-overlap.mjs`. Đã sửa:

**Tốc độ.** Tính theo thời gian trong trận (quãng đường chia cho khoảng `endHour`), mọi khối đều ở mức hợp lý: bộ binh nhanh nhất là lực lượng ở trại lớn đi đánh trại Hannibal (0,5 m/s trung bình cả giai đoạn 2), các khối khác dưới 0,2 m/s, đều dưới mức đi bộ 1 m/s; kỵ binh của Hasdrubal nhanh nhất (0,2–0,3 m/s trung bình khi truy đuổi và vòng ra sau lưng quân La Mã). Lúc dàn quân, cả đạo quân di chuyển cùng nhau (0,19 m/s phía Carthage, 0,09 m/s phía La Mã). Không cần đổi `endHour`. Khi phát, mỗi giai đoạn nén hàng chục phút vào 15–30 giây, nên khối quân trên màn hình đi nhanh hơn thật hàng trăm lần; lane 3 chỉnh tốc độ bước chân theo tốc độ trên màn hình (T-023).

**Hành động khớp với di chuyển.** Cảnh dùng `action` ghi ở giai đoạn k cho suốt giai đoạn k. Trước đây:
- giai đoạn 1 ghi `stand` cho mọi khối, nên lính đứng nghỉ mà trượt đi 0,6–5 km; nay là `advance`, trừ lực lượng ở trại;
- lính nhẹ Carthage lùi theo lưỡi liềm ở giai đoạn 4 nay là `retreat`;
- lính nhẹ La Mã tiến theo bộ binh nặng ở giai đoạn 5 nay là `advance`.

**Dàn quân không xuyên nhau.** Trước đây các khối đi thẳng từ trại tới chỗ đứng nên cắt đường nhau (principes xuyên qua bộ binh đồng minh tới 86%, lính Iberia xuyên qua kỵ binh Numidia 73%). Nay mỗi đạo quân bắt đầu như một khối đã sắp đúng thứ tự trái phải của chiến tuyến, các đơn vị hẹp lại còn 60% bề ngang, lùi về một phía chung (La Mã: x −150, y +760; Carthage: x −1700, y −380). Mọi đơn vị của một bên di chuyển cùng một véc-tơ nên không khối nào cắt nhau. Mũi tên giai đoạn 1 vẽ lại theo đúng đường đi đó. Đổi lại, cảnh không còn vẽ đường vòng qua chỗ lội; chỗ lội vẫn là địa danh trên bản đồ.

**Mặt trận La Mã ôm lưỡi liềm (giai đoạn 4–6).** Trước đây hastati và bộ binh đồng minh hàng đầu cắm sâu 20–42% vào lưỡi liềm, vì mỗi khối La Mã phình ra ở giữa khối trong khi lưỡi liềm lõm ở giữa cả đạo quân. Nay:
- mép trước của lưỡi liềm là đường bao phía bắc của các đoạn (đoạn lõm thì hai đầu nhô hơn phần giữa);
- mỗi khối La Mã hàng đầu được xoay song song với dây cung của đoạn mép nó đối mặt, phình đúng bằng độ lõm của lưỡi liềm trên đoạn đó, rồi lùi lại cho mọi điểm mép trước cách lưỡi liềm 6 m;
- hàng sau (principes, đồng minh hàng sau) đứng song song, cách 12 m;
- triarii lùi thêm 35 m cho khỏi chạm hàng principes.

**Giai đoạn 6.**
- Principes và bộ binh đồng minh hàng sau quay ra hai sườn, đứng sát lính Libya (cách 10 m) thay vì lơ lửng giữa vòng vây.
- Lính nhẹ La Mã kẹt lại trong vòng vây, sau triarii, thay vì chạy thoát xuyên qua kỵ binh Hasdrubal đang đánh vào.
- Kỵ binh Hasdrubal hẹp lại (360 m) cho khỏi chạm góc của lính Libya.

**Kỵ binh tháo chạy.**
- Kỵ binh La Mã chạy dọc bờ sông lên phía bắc, giữ hướng, thay vì cắt ngang đường kỵ binh Hasdrubal.
- Kỵ binh đồng minh tháo chạy thành một khối hẹp và sâu hơn.

**Còn lại, có chủ ý:**
- Giữa giai đoạn 3, lính nhẹ hai bên lui về **qua** hàng bộ binh nặng của mình (Polybius 3.115: lính nhẹ rút qua khoảng hở giữa các đơn vị). Ở mức khối quân, việc này hiện thành khối xuyên qua khối, khoảng 2–4 giây khi phát.
- Giai đoạn 5, kỵ binh Numidia đuổi sát và lẫn vào kỵ binh đồng minh đang quay đầu bỏ chạy (chồng tối đa 14% giữa giai đoạn).
- Giai đoạn 6, các khối La Mã bị dồn chặt khi quay ra hai sườn, chồng nhau tối đa 14% giữa giai đoạn, không chồng ở cuối giai đoạn.
- **Triarii vẫn quay mặt về nam ở giai đoạn 6**, dù kỵ binh Hasdrubal đánh từ phía bắc: cảnh xoay cả khối quanh tâm khi `facing` đổi, nên quay đầu 180° làm một khối rộng 820 m quét ngang cả đạo quân. Đề nghị cho lane 3 ghi trong mục "Kết quả" của T-020.
