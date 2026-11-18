# Trận Cannae (216 TCN): căn cứ dữ liệu

Cập nhật: 2026-11-18 (T-032, giáp lá cà: mục 11; lập ở T-016). Từ T-032, bố cục các khối đánh giáp lá cà ở mục 9 và 10 được thay bằng mục 11. File dữ liệu: `src/data/battles/battle-of-cannae.json`. Lưới độ cao: `public/data/terrain/battle-of-cannae.bin`, dựng bằng `scripts/battles/build-terrain.mjs`.

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
| Trại của Hannibal | −3975, −500 | Bờ tây, cùng bờ với trại lớn (Polybius 3.111); trên đất hơi cao (8–10 m). Trước T-037 nhãn đặt ở −3550, −400; dời về tâm trại khi trại có kích thước (mục 12) |
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

**Từ T-032 (mục 11)** các mốc giờ và căn cứ trên không đổi, nhưng một số chuyển động được vẽ sớm hơn một giai đoạn, để hai bên đã chạm nhau ở đầu giai đoạn chúng đánh nhau:

| Giai đoạn | Thêm hay đổi so với bảng trên |
|---|---|
| 2 | Kỵ binh hai bên ở cánh sát sông tiến sát vào nhau (Polybius 3.115: kỵ binh Iberia và Gaul đụng kỵ binh La Mã ngay sau khi lính nhẹ giao chiến) |
| 3 | Kỵ binh bên sông đánh nhau suốt giai đoạn, quân La Mã bị đẩy lùi 80 m và mất phần lớn quân; chưa tháo chạy. Bộ binh nặng tiến tới chạm lưỡi liềm, lúc này còn lồi |
| 4 | Lưỡi liềm vừa đánh vừa lùi từ lồi sang lõm, mặt trận La Mã bám theo. Kỵ binh La Mã tháo chạy dọc bờ sông; Hasdrubal vòng ra sau lưng quân La Mã, hướng sang cánh bên kia (Polybius 3.116) |
| 5 | Lính Libya quay vào và tới sườn quân La Mã ở cuối giai đoạn; hàng sau của La Mã quay ra hai sườn; triarii quay đầu. Kỵ binh đồng minh bỏ chạy khi Hasdrubal tới gần; ông quay sang lưng các quân đoàn và tới nơi ở cuối giai đoạn |
| 6 | Bốn phía cùng đánh suốt giai đoạn: lưỡi liềm ở mặt trước, lính Libya ở hai sườn, kỵ binh Hasdrubal ở sau lưng |

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
- Độ cao từ −1,0 tới 71,2 m. Góc đông bắc là biển (độ cao 0): xem mục 13. (Trước T-038 dòng này ghi nhầm là "đồng bằng ven biển".)
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

`scripts/battles/check-overlap.mjs` (T-020, không nằm trong `npm run validate`) báo các khối chồng nhau ở mọi mốc **và giữa các mốc** (mỗi 1/4 giai đoạn), cả cùng phe lẫn hai phe, tính cả `bulge`, đúng như cảnh di chuyển chúng (nội suy tuyến tính). Từ T-027, hướng đổi từ 135° trở lên được tính là quay đầu tại chỗ như cảnh của T-026, không xoay cả khối. Dùng khi sửa dữ liệu: `node scripts/battles/check-overlap.mjs --min 0.05`.

`scripts/battles/check-facing.mjs` (T-027, không nằm trong `npm run validate`) liệt kê các khối có lính đi lệch hướng mặt quá 45° (đi ngang hay đi lùi), xem mục 10.

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
- ~~Triarii vẫn quay mặt về nam ở giai đoạn 6~~: đã sửa ở T-027 (mục 10), sau khi T-026 cho khối quay đầu tại chỗ.

## 10. Hướng mặt và hướng đi (T-027)

Cảnh cho chân bước theo hướng mặt của từng hình lính, với tốc độ bằng quãng đường hình lính đi được. Khối nào đi ngang hay đi lùi so với hướng mặt thì chân trụ trượt (lane 1 đo được 32–48% ở giai đoạn 5–6, ghi chú ở T-024).

### Script kiểm tra

`node scripts/battles/check-facing.mjs [--min 0.25] [--angle 45]`
- Mô phỏng chuyển động như cảnh (`src/components/battle/engine/timeline.ts`): tâm, bề ngang, chiều sâu, độ phình nội suy tuyến tính; hướng xoay theo chiều ngắn; đổi từ 135° trở lên là quay đầu tại chỗ, mỗi người quay trong khoảng 8% đầu giai đoạn.
- Lấy mẫu 21 ô trong khối (7 hàng ngang × 3 hàng dọc), 19 thời điểm mỗi giai đoạn. Coi như mỗi người giữ ô của mình suốt giai đoạn; bỏ qua việc cảnh xếp lại ô khi có người ngã.
- Với mỗi khối và mỗi giai đoạn: tỉ lệ thời gian khối đi nhanh hơn ngưỡng đi bộ của cảnh (0,36 m/s), và trong lúc đó tỉ lệ mẫu đi lệch hướng mặt quá 45°. Cột `side` là đi ngang (45°–135°), `back` là đi lùi (trên 135°); `centre` là góc giữa đường đi của tâm khối và hướng mặt ở giữa giai đoạn.
- Số dòng từ 25% trở lên: 54 trước khi sửa, 46 sau khi sửa. Giai đoạn 3 hết hẳn (4 → 0), giai đoạn 4 còn 6 (từ 8), giai đoạn 6 còn 14 (từ 16).

### Đã sửa

1. **Triarii, giai đoạn 6: quay về bắc** (0°). Kỵ binh Hasdrubal đánh vào lưng các quân đoàn từ phía bắc (Polybius 3.116), mà triarii là hàng cuối, nên hàng này quay lại đối mặt. Khối quay đầu tại chỗ (T-026): đứng nguyên chỗ, chỉ co bề ngang từ 820 m xuống 460 m như trước.
2. **Lính nhẹ La Mã (velites, bộ binh nhẹ đồng minh), giai đoạn 6: quay về bắc.** Ở mục 9 hai khối này bị kẹt giữa triarii và kỵ binh Hasdrubal, đang đánh (`fight`) và mất phần lớn quân, nhưng lại quay lưng về phía kỵ binh.
3. **Lính nhẹ lui qua hàng quân mình thì quay lưng mà đi**, thay vì đi giật lùi hàng trăm mét. Polybius 3.115 chỉ nói lính nhẹ rút qua khoảng hở giữa các đơn vị, không nói họ vừa lùi vừa quay mặt về địch; với lính nhẹ, quay lưng chạy về là cách tự nhiên.
   - La Mã: quay về bắc ở giai đoạn 3 (lui 200 m ra sau bộ binh nặng), quay lại hướng nam ở giai đoạn 4 khi theo sau bộ binh nặng.
   - Carthage (lính ném đá Baleares, lính giáo nhẹ): quay về nam ở giai đoạn 3–4 (lui 430 m qua lưỡi liềm, rồi 160 m nữa); quay lại hướng bắc tại chỗ ở giai đoạn 5. `action` giai đoạn 5 đổi từ `retreat` thành `stand`, vì khối không còn di chuyển.
4. **Lính nhẹ Carthage, giai đoạn 6: đứng yên.** Trước đây ghi `stand` nhưng khối vẫn trôi lùi 40 m (cảnh cho lính đi giật lùi).
5. **Kỵ binh đồng minh, giai đoạn 4: không bị đẩy lùi.** Polybius 3.116 tả kỵ binh Numidia đánh quấy, vòng lên rồi rút, cầm chân kỵ binh đồng minh chứ không đánh lui. Đoạn lùi 106 m chỉ còn 14 m, đủ để khỏi chạm góc khối kỵ binh Numidia.

`check-overlap.mjs --min 0.05` cho đúng danh sách như trước khi sửa (các chỗ chồng có chủ ý ở mục 9). Sau các thay đổi, dữ liệu có 14 lần quay đầu, 11 trong số đó mới thêm ở T-027.

**Phụ thuộc vào cảnh.** Hiện cảnh vẽ quay đầu chưa đúng ý: từng hình lính đi tới vị trí đối xứng qua tâm khối, nên giữa giai đoạn cả khối co lại gần tâm rồi giãn ra. Đề nghị sửa ở `docs/tasks/T-027-prefetch-cannae-data.md`, mục "Kết quả". Lỗi này có từ T-026 và ảnh hưởng cả 3 lần quay đầu đã có từ trước (kỵ binh La Mã giai đoạn 3, kỵ binh đồng minh giai đoạn 5, lực lượng ở trại lớn giai đoạn 6).

### Còn đi xiên, có chủ ý

Dữ liệu không sửa được những chỗ dưới đây mà vẫn đúng nguồn, hoặc phải dàn lại cả phần mở đầu:

| Giai đoạn | Khối | Kiểu | Lý do giữ |
|---|---|---|---|
| 1 | 12 khối của Hannibal | Đi ngang 77°, 70 m/s | Cả đạo quân đi 1,7 km về hướng đông bắc trong khi quay mặt về bắc. Muốn đi thẳng thì phải dàn lại thế đứng ban đầu thành hàng dọc (các khối đang đứng cạnh nhau theo trục đông tây, lính nhẹ đứng trước, sẽ chồng lên nhau khi xoay). Ở 70 m/s chân vẫn trượt vì nhanh hơn trần của clip chạy (26,6 m/s) |
| 4, 5, 6 | Lưỡi liềm (Gaul, Iberia) | Đi lùi, có lúc đi ngang | Polybius 3.115, Livy 22.47: lưỡi liềm vừa đánh vừa lùi, mặt vẫn hướng về quân La Mã. Đi lùi khi giao chiến là đúng |
| 4 | Kỵ binh đồng minh | Xoay 10° tại chỗ, 1,2 m/s | Rất nhỏ (mục "Đã sửa", 5) |
| 5, 6 | Các khối bộ binh La Mã (hastati, principes, triarii, bộ binh đồng minh, lính nhẹ) | Đi ngang 50–75° | Vòng vây khép dần: các khối co bề ngang và dồn vào giữa trong khi vẫn quay mặt ra ngoài (Polybius 3.116; Livy 22.47). Người ở hai đầu khối bước ngang |
| 5 | Lính Libya hai cánh | Đi ngang khoảng một nửa thời gian | Polybius 3.115: lính châu Phi quay mặt vào trong rồi đánh vào sườn. Cảnh xoay khối đều trong cả giai đoạn trong khi khối tiến 100–140 m, nên nửa đầu khối đi ngang |
| 6 | Principes, bộ binh đồng minh hàng sau | Đi ngang khoảng 60° | Quay 90° ra hai sườn và đi tới đó trong cùng một giai đoạn. Cũng như lính Libya: quay xong rồi mới đi thì không còn xiên |
| 6 | Kỵ binh Hasdrubal (hai khối) | Đi ngang 80–100°, 37 m/s | Vòng từ phía đông về đánh vào lưng quân La Mã: đi về hướng tây nam, quay mặt từ đông nam sang nam. Ở tốc độ này chân vẫn trượt |

Cả bảng này là việc của cảnh, không phải của dữ liệu; đề nghị cụ thể ở mục "Kết quả" của T-027.

## 11. Giáp lá cà (T-032)

Từ đợt G, cảnh cho người đầu mỗi hàng dọc đấu với người đầu hàng của địch, và chỉ người có đối thủ trong tầm mới đánh (`docs/ARCHITECTURE.md`, mục "Giáp lá cà"). Dữ liệu cũ không dùng được với cách này: đo bằng code của cảnh, ở giai đoạn 4–6 người hàng đầu của các khối đang đánh cách hình lính địch gần nhất 20–70 m, và hai chiến tuyến chỉ gặp nhau đúng ở mốc cuối giai đoạn 4.

### Nguyên tắc

- Hai khối đánh giáp lá cà thì **mép trước nằm trên cùng một đường**, cách nhau 1,5 m, ở **cả mốc đầu lẫn mốc cuối** của giai đoạn. Giữa hai mốc cảnh nội suy thẳng, nên chỉ như vậy hai hàng đầu mới ở trong tầm nhau suốt giai đoạn.
- Khối tới chỗ địch trong một giai đoạn thì giai đoạn đó ghi `advance` hay `charge`; giai đoạn sau mới ghi `fight`.
- Đánh từ xa ghi `skirmish`: lính nhẹ ở giai đoạn 2, kỵ binh Numidia ở giai đoạn 3–4, lực lượng ở trại lớn đánh trại Hannibal ở giai đoạn 3–5 (toán giữ trại không có đơn vị riêng, nên cuộc đánh trại được vẽ như đánh từ xa).
- Kỵ binh đồng minh bị kỵ binh Numidia cầm chân ở giai đoạn 3–4 ghi `stand`.

### Script dựng bố cục

`node scripts/battles/cannae-lines.mjs` in các đội hình; thêm `--write` thì ghi vào file trận. Script chỉ đổi `formation`, `action`, `men` của các đơn vị nó liệt kê, từ mốc 1 tới mốc 6. Lời dẫn và mũi tên sửa tay trong file.

- **Đường chung của lưỡi liềm và mặt trận La Mã** là một cung tròn. Mốc 1–3: lồi về phía bắc, bán kính 1450 m, đỉnh ở (−60, −152), tức lồi khoảng 90 m như trước. Mốc 4: lõm, bán kính 975 m, đỉnh (−60, −462). Mốc 5: bán kính 800 m, đỉnh (−60, −495). Mốc 6: bán kính 550 m, đỉnh (−60, −510).
- Năm khối của lưỡi liềm nằm liền nhau trên cung, mỗi khối quay mặt theo pháp tuyến ở giữa khối, `bulge` bằng độ võng của cung trên bề ngang khối. Hai khối La Mã hàng đầu (hastati, bộ binh đồng minh hàng đầu) nằm ở phía bắc cùng cung đó.
- **Giai đoạn 4 không co bề ngang.** Mặt trận La Mã rộng 1260 m ở cả mốc 3 và mốc 4. Nếu vừa co bề ngang vừa đổi từ lồi sang lõm thì giữa giai đoạn hai đầu mặt trận La Mã cắt qua khối Gaul (đã thử: lệch tới 35 m). Việc dồn vào giữa được vẽ ở giai đoạn 3 (1500 m còn 1260 m), ở hàng sau trong giai đoạn 4, và ở giai đoạn 5–6 (1260, 640, 440 m).
- **Hàng sau** (principes, bộ binh đồng minh hàng sau): mốc 3 dài bằng hàng đầu, cách 12 m; mốc 4 dồn vào sau trung quân, dài 300 m, sâu 90–100 m; mốc 5 đã quay ra hai sườn.
- **Hàng ba:** lính nhẹ lui qua hàng ngũ ở giai đoạn 3 rồi đứng sau hàng hai; triarii đứng sau cùng.
- **Giai đoạn 5–6, quân La Mã là một cái hộp.** Mặt trước nằm trên cung; principes ở sườn tây và bộ binh đồng minh hàng sau ở sườn đông, quay mặt ra ngoài; triarii quay đầu, khép mặt sau; lính nhẹ ở bên trong. Hộp ở mốc 5 rộng khoảng 600 m, sâu khoảng 430 m ở giữa; ở mốc 6 rộng khoảng 410 m, sâu khoảng 320 m.
- **Lính Libya** đứng yên tới hết giai đoạn 4, quay vào trong ở giai đoạn 5 và chạm sườn ở mốc 5. Ở mốc 5 họ đứng lệch về bắc 45 m so với sườn mà họ đánh, vì phải đi vòng ngoài đầu mút của lưỡi liềm. Không lệch nhiều hơn được: người chỉ ngã ở hàng dọc có địch trước mặt, nên một sườn chỉ bị che một nửa sẽ mất hết người ở nửa đó và không mất ai ở nửa kia (đã thử với 90 m: principes còn 0 trên 9 người đầu hàng có đối thủ ở 3/4 giai đoạn 6).
- **Kỵ binh Hasdrubal:** mốc 2 chạm kỵ binh La Mã ở y = 40; mốc 3 ở y = 120; mốc 4 đang ở sau lưng quân La Mã, (300, 420) và (−50, 470); mốc 5 và 6 chạm hàng triarii, hai khối đứng cạnh nhau.

### Quân số

Tổng của mỗi bên ở từng mốc cuối trận không đổi so với trước (La Mã còn 8 900 người trong vòng vây ở mốc 6). Cách chia giữa các đơn vị đổi để người ngã rơi vào chỗ có địch:

- Hàng sau và triarii không mất người khi chưa chạm địch (giai đoạn 4). Principes: 11 400, 11 400, 10 000, 500 ở mốc 3–6; bộ binh đồng minh hàng sau: 14 000, 14 000, 12 400, 600; triarii: 4 200 tới mốc 5, rồi 300.
- Lính nhẹ La Mã ở bên trong hộp, không chạm địch, nên mất ít hơn trước: 7 000 còn 3 300 và 6 300 còn 3 300 ở giai đoạn 6 (trước: còn 900 mỗi khối). Bù lại các khối ở vành ngoài mất nhiều hơn: hastati còn 400, bộ binh đồng minh hàng đầu còn 500.
- Hai khối Gaul ngoài cùng mất người ở giai đoạn 4 (5 000 còn 4 100) và 5 (còn 4 000), lúc còn đối mặt quân La Mã. Ở giai đoạn 5–6 họ ghi `advance`: mặt trận La Mã đã co vào giữa, trước mặt họ không còn địch.
- Kỵ binh La Mã: 2 400 còn 900 ở giai đoạn 3 (đang đánh), còn 300 ở giai đoạn 4 (tháo chạy).
- Số "còn lại" vẫn chỉ để cảnh biết vẽ bao nhiêu hình lính, không phải con số lịch sử (mục 5).

### Kiểm tra

- `npm run validate`: khối `fight` phải có ít nhất 15% bề ngang cách mép trước của một khối địch cũng `fight` không quá 8 m, ở mốc đầu và mốc cuối giai đoạn. Dữ liệu cũ sai quy tắc này ở mọi giai đoạn có `fight`.
- `check-overlap.mjs --min 0.04` từ giai đoạn 3: không còn chỗ nào hai phe chồng lên nhau. Cùng phe còn chồng thoáng qua, tối đa 18%: hàng sau dồn vào sau hàng đầu ở giai đoạn 4 (hastati với principes 18%), lính Libya lướt qua đầu mút khối Gaul ở đầu giai đoạn 5 (14%), principes xoay ra sườn qua chỗ lính nhẹ (10%).
- Đo bằng code của cảnh, mỗi 1/4 giai đoạn, số người đầu hàng có đối thủ trong tầm trên tổng số người đầu hàng:

| Khối | Giai đoạn 4 | Giai đoạn 5 | Giai đoạn 6 |
|---|---|---|---|
| Hastati | 91/94, 84/93, 73/94 | 49/79, 42/79, 44/79 | 28/33, 27/33, 25/32 |
| Gaul giữa | 48/49, 45/49, 38/49 | 31/41, 26/41, 32/40 | 30/37, 32/37, 29/36 |
| Principes (sườn tây) | | | 13/23, 16/25, 21/24 |
| Lính Libya trái | | | 18/29, 22/29, 17/28 |
| Triarii (mặt sau) | | | 43/50, 44/50, 37/40 |
| Kỵ binh Hasdrubal, khối sau | | | 25/25, 21/25, 17/25 |

  Ở giai đoạn 5, hai đầu của hastati không có đối thủ vì hai khối Gaul ngoài cùng đã thôi đánh trong lúc mặt trận La Mã co vào giữa.

### Còn lại

- Trong giai đoạn 5 các khối La Mã đổi chỗ nhiều (hàng sau ra sườn, lính nhẹ vào trong, triarii quay đầu), nên vẫn còn khối đi cắt qua nhau trong vài giây.
- Người ngã ở hai sườn trong giai đoạn 6 rất dày: mỗi hàng dọc của principes mất một người sau khoảng 2 giây phát.
- Lính Libya ở giai đoạn 6 vừa đánh vừa dịch 158 m, lệch 55° so với hướng mặt (`check-facing.mjs`): cái hộp của quân La Mã co chủ yếu từ phía bắc, nên sườn dịch dần về nam. `check-facing.mjs --min 0.25` in 53 dòng với dữ liệu mới (46 sau T-027), phần lớn ở giai đoạn 5–6.
- Lính nhẹ La Mã bên trong hộp vẫn mất người theo cách cũ (ngẫu nhiên, không ai đánh): 185 và 150 hình trong giai đoạn 6.

## 12. Phong cảnh (T-037, đợt H chặng 0)

Từ đợt H, cảnh vẽ cả những thứ nằm trên mặt đất ngoài hai đạo quân. Mục này ghi căn cứ cho từng thứ. Dữ liệu nằm trong `terrain.scenery` và hai trường `level`, `banks` của sông; kiểu dữ liệu ở `src/lib/battle.ts`, giải thích ở `docs/ARCHITECTURE.md`, mục "Phong cảnh".

Mỗi thứ mang một mức căn cứ (`evidence.basis`):

- `attested`: nguồn cổ nói có.
- `inferred`: nguồn không nói thẳng, nhưng suy ra được từ nguồn hoặc từ địa hình.
- `illustrative`: không có căn cứ nào ngoài việc hợp với vùng và thời ấy; vẽ để cảnh khỏi trống.

### Nguồn đã đọc lại (2026-11-18)

Polybius 3.107–117 (bản dịch Paton, LacusCurtius) và Livy 22.40–49 (bản Latin, The Latin Library). Các câu dùng được:

| Chỗ | Nội dung |
|---|---|
| Polybius 3.107 | Hannibal chiếm **thành** của Cannae, nơi quân La Mã trữ lúa và quân nhu của vùng quanh Canusium. **Thị trấn đã bị san phẳng từ trước.** Thành khống chế cả vùng xung quanh |
| Polybius 3.110 | Vùng quanh đó **"bằng phẳng và không có cây"** (bản Paton: "flat and treeless"), nên Paullus không muốn đánh ở đây vì địch hơn về kỵ binh. Paullus đóng trại với hai phần ba quân **bên bờ sông Aufidus**; lập trại thứ hai cho một phần ba quân ở bờ bên kia, phía đông chỗ lội qua, cách khoảng 10 stadion |
| Polybius 3.111 | Hannibal đóng trại, đào hào đắp luỹ, ở cùng bờ với trại lớn của La Mã |
| Polybius 3.112 | Kỵ binh Numidia chặn những người đi lấy nước của trại nhỏ |
| Polybius 3.113 | Sáng hôm giao chiến, ngay sau lúc mặt trời mọc, quân La Mã vượt sông; Hannibal vượt sông ở hai chỗ |
| Polybius 3.117 | Một vạn bộ binh La Mã ở lại trại lớn đã đánh vào trại của Hannibal; Hannibal để quân giữ trại |
| Livy 22.43 | Hannibal dời quân tới Apulia, nơi **mùa gặt đến sớm hơn** (*maturiora messibus Apuliae loca*). Ông đóng trại gần **làng** (*vicus*) Cannae, quay lưng về phía gió Volturnus, thứ gió **cuốn những đám bụi trên đồng bằng khô nẻ vì hạn** (*campis torridis siccitate nubes pulveris vehit*) |
| Livy 22.44 | Quân La Mã **đắp luỹ hai trại** (*bina castra communiunt*). Sông Aufidus chảy sát cả hai trại, người đi lấy nước của hai bên ra sông đều phải giao tranh |
| Livy 22.45 | Có đội canh đứng **trước luỹ** (*pro vallo*) của trại nhỏ |
| Livy 22.46 | Mặt trời chiếu xiên cả hai bên. **Gió Volturnus nổi lên ngược hướng quân La Mã, cuốn nhiều bụi vào mặt họ, che mất tầm nhìn** |
| Livy 22.49 | Sau trận, chừng hai nghìn người chạy vào chính làng Cannae và bị vây ngay, vì **làng không có công sự nào che** (*nullo munimento tegente vicum*) |

Polybius không nhắc tới gió và bụi; chỉ Livy có. Không nguồn nào tả hai bờ sông, cây cối, hay bên trong các trại.

### Từng thứ trong dữ liệu

| Thứ | Dữ liệu | Mức | Căn cứ và phần giả định |
|---|---|---|---|
| Mặt đất | `ground.cover: stubble` | `inferred` | "Không có cây" là lời Polybius (3.110). Ruộng đã gặt và cỏ khô là suy từ Livy 22.43 (gặt sớm, đồng khô nẻ) và mùa đánh trận (hè). Bao nhiêu phần đồng bằng là ruộng cày thì không rõ |
| Mực nước sông | `rivers[0].level.stage: low` | `inferred` | Cả hai đạo quân lội qua sông buổi sáng hôm ấy, giữa mùa hè |
| Hai bờ sông | `rivers[0].banks`: `reeds`, rộng 25 m mỗi bờ | `illustrative` | Không có nguồn. Ngày nay dọc sông Ofanto có lau sậy, liễu, dương |
| Trại lớn của La Mã | `roman-large-camp`, 1050 × 1050 m, tâm −1600, 1300 | `attested` | Có trại, bên bờ sông, có luỹ: Polybius 3.110, Livy 22.44–45. Kích thước, hình vuông và hướng là giả định (xem dưới) |
| Trại nhỏ của La Mã | `roman-small-camp`, 750 × 750 m, tâm 250, 1200 | `attested` | Polybius 3.110. Kích thước và hướng là giả định |
| Trại của Hannibal | `hannibal-camp`, 1000 × 1000 m, tâm −3975, −500 | `attested` | Có trại, có hào luỹ, cùng bờ với trại lớn, bị đánh hôm ấy: Polybius 3.111, 3.117. Không rõ trại Carthage bố trí thế nào: kích thước, hình dạng và bên trong là giả định |
| Thành Cannae | `cannae-citadel`, 160 m (đông–tây) × 100 m (bắc–nam), tâm −4765, −4015 | `attested` | Polybius 3.107. Kích thước đặt vừa đỉnh gò trong lưới độ cao; hình dáng không rõ |
| Làng Cannae | `cannae-village`, 240 m (đông–tây) × 160 m (bắc–nam), tâm −4530, −3990, `ruined` | `attested` | Polybius 3.107 (đã bị san phẳng), Livy 22.49 (làng không tường, hai nghìn người chạy vào). Vẽ đổ nát một phần. Vị trí so với thành là giả định |
| Gió | `wind`: từ 135° (đông nam), 8 m/s | `attested` | Livy 22.43, 22.46. Quân La Mã quay mặt về nam và gió thổi vào mặt họ, nên gió được vẽ từ đông nam. Hướng chính xác và sức gió là giả định |
| Bụi | `dust.level: 0,8` | `attested` | Livy 22.43, 22.46. Bụi dày tới đâu là giả định |

`areas` (các mảng đất có lớp phủ riêng, ví dụ bụi cây trên sườn đồi) còn để trống: sẽ thêm ở chặng thực vật, khi xem được trong cảnh thật.

**Cây và nhà minh hoạ.** Sau chặng 0, người dùng chọn cho cảnh có nhiều cây và nhà hơn, kể cả ở chỗ nguồn nói là trống (`docs/PLAN.md`, mục "Đợt H"). Những thứ đó sẽ thêm ở chặng công trình và chặng thực vật, đều mang mức `illustrative`, và ghi chú của từng thứ phải nói nó trái với Polybius 3.110 ("không có cây"). Bảng trên chỉ gồm những thứ có căn cứ, cộng dải lau sậy ven sông.

Mức `attested` nói rằng **thứ đó có thật** theo nguồn. Kích thước, vị trí chính xác và hình dáng của nó hầu hết vẫn là giả định; ghi chú (`evidence.note`) của từng thứ nói rõ phần nào.

### Kích thước các trại

Không nguồn nào cho kích thước trại ở Cannae. Cách tính:

- Trại của một đạo quân chấp chính (hai quân đoàn và đồng minh: 16 800 bộ binh, 1 800 kỵ binh) theo mô tả của Polybius 6.27–32 là một hình vuông mỗi cạnh 2 017 bộ La Mã, theo cách đọc trong từ điển của W. Smith (mục "Castra", [LacusCurtius](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/secondary/SMIGRA*/Castra.html)). Cũng theo mục đó: khoảng trống giữa luỹ và lều (*intervallum*) rộng 200 bộ, còn kích thước hào và luỹ thì Polybius không cho. Một bộ La Mã khoảng 0,296 m, nên cạnh khoảng 596 m, diện tích khoảng 35,6 ha: chừng 19 m² mỗi người.
- Trại lớn chứa hai phần ba của 86 200 người (khoảng 57 500): 110 ha, tức hình vuông cạnh khoảng 1 050 m.
- Trại nhỏ chứa một phần ba (khoảng 28 700): 55 ha, cạnh khoảng 750 m.
- Trại của Hannibal (50 000 người) được cho cùng mức đất: 96 ha, cạnh khoảng 1 000 m. Đây là chỗ yếu nhất: kỵ binh của Hannibal đông hơn nhiều và cách đóng trại của Carthage không được ai tả.

Các con số làm tròn tới 50 m. Trại vẽ vuông, cạnh theo hướng đông–tây và bắc–nam; hướng cổng chính (`facing`) là giả định.

### Đo trên lưới độ cao

| Công trình | Diện tích | Độ cao mặt đất bên dưới | Cách đường giữa sông |
|---|---|---|---|
| Trại lớn của La Mã | 110,3 ha | 0,7–6,3 m | 66 m |
| Trại nhỏ của La Mã | 56,3 ha | 0,3–3,3 m | 145 m |
| Trại của Hannibal | 100,0 ha | 8,0–10,4 m | 304 m |
| Thành Cannae | 1,6 ha | 47,0–60,7 m | 1 381 m |
| Làng Cannae | 3,8 ha | 45,3–59,5 m | 1 424 m |

- Tâm trại lớn dời 50 m về bắc so với nhãn (−1600, 1250) để luỹ phía nam không lấn vào bờ sông.
- Trại của Hannibal đặt sao cho luỹ phía đông nằm ngay trước mặt đạo quân La Mã đánh trại (`camp-force`, giai đoạn 3–5): tâm khối này cách luỹ 175–225 m, đầu phía tây của hàng trước cách luỹ khoảng 16 m. Nhãn "Trại của Hannibal" dời theo về tâm trại.
- Gò thành: đỉnh gò (cao từ 54 m trở lên) trải khoảng 180 m theo hướng đông–tây và 90 m theo hướng bắc–nam, quanh điểm −4770, −4015; sườn tây và bắc dốc xuống đồng bằng ven sông (14–25 m). Lưới Copernicus là mô hình bề mặt, có thể đã tính cả tàn tích hiện nay trên gò.

### Khối quân đứng trong trại

Lúc bắt đầu, vài khối quân còn đứng trong trại của mình: `camp-force` và `roman-cavalry` trong trại lớn; ba khối đồng minh trong trại nhỏ. Cuối trận, `roman-cavalry` (đang tháo chạy) và `camp-force` (rút về) lại ở trong trại lớn. Chặng công trình phải để trống chỗ các khối này đứng và đi qua (không dựng lều ở đó).

### Kiểm tra

`npm run validate` kiểm tra thêm (`checkScenery` trong `validate-battles.mjs`):

- mỗi `evidence` có mức hợp lệ, ghi chú đủ hai ngôn ngữ, và có nguồn nếu là `attested`;
- công trình nằm trọn trong vùng địa hình, không chồng lên nhau, không lấn vào sông và dải bờ sông;
- trại phải thuộc một bên (`side`);
- gió, bụi, mực nước, bề rộng dải bờ nằm trong khoảng cho phép; đường bao của một mảng đất có ít nhất ba điểm và có diện tích;
- cảnh báo khi nhãn của một trại hay thị trấn nằm ngoài mọi công trình cùng loại.

Đã thử bằng cách cố ý làm sai dữ liệu theo 16 kiểu: cả 16 đều bị bắt.

### Còn lại

- Chưa có khối quân Carthage nào giữ trại của Hannibal, dù Polybius 3.117 nói có: `camp-force` đang đánh vào một trại không người. Đề nghị thêm một khối giữ trại khi làm chặng công trình.
- Sông vẫn là dòng chảy ngày nay (mục 7); vị trí các trại bám theo dòng đó.
- Cách xếp lều, đường và cổng trong trại La Mã (Polybius 6.27–32) chưa đọc kỹ; chặng công trình cần đọc trước khi dựng. Kích thước hào và luỹ không có trong Polybius, phải lấy từ nguồn khác hoặc ghi là minh hoạ.

## 13. Vùng xa và biển (T-038, đợt H chặng 1)

### Lưới vùng xa

- File `public/data/terrain/battle-of-cannae-far.bin`, khai báo ở `terrain.far`: 271 × 271 điểm, cách nhau 400 m, phủ 54 km về mỗi phía quanh `origin`. Cùng định dạng với lưới chính.
- Dựng bằng `node scripts/battles/build-terrain.mjs` (lệnh này ghi cả hai lưới; lưới chính ra đúng từng byte như trước). Mỗi giá trị là trung bình của 25 mẫu trong ô 400 m quanh điểm lưới.
- Cần thêm ba ô Copernicus GLO-30 ngoài `N41E016`: `N41E015`, `N40E015`, `N40E016`, tải từ cùng kho AWS công khai ngày 2026-11-18, lưu ở `E:\World_History_Platform_assets\terrain\copernicus-glo30\`. Cùng giấy phép và cùng câu ghi công (mục 7); `terrain.sources` đã ghi thêm ba ô này.
- Độ cao tới 1 267 m (núi Vulture ở tây nam); 36,9% số điểm ở mực biển (biển Adriatic ở đông bắc). Phía bắc thấy mũi Gargano.

### Biển nằm ngay trong vùng chiến trường

- Trong lưới chính, 13 045 trên 92 411 điểm (14,1%) có độ cao từ 0,05 m trở xuống: cả góc đông bắc là **biển** trong dữ liệu ngày nay. Bờ biển chạy chéo từ khoảng (−600, 2700) tới (4200, −300); cửa sông Ofanto ở khoảng (−600, 2900). Mục 7 trước đây ghi nhầm chỗ này là "đồng bằng ven biển (0–1 m)", và cảnh vẽ nó thành đất.
- Từ T-038, cảnh vẽ chỗ đó là biển. **Bờ biển là bờ ngày nay**, như dòng sông: châu thổ sông Ofanto đã bồi và lở nhiều lần, bờ biển năm 216 TCN nằm ở đâu thì không rõ. Câu `uncertainty` của file trận đã nói thêm điều này.
- Vài vũng nhỏ sau bờ (độ cao từ 0 trở xuống) hiện thành bãi cát.

### Hai khối kỵ binh dời vào bờ

Ở mốc cuối giai đoạn 6, hai khối đứng đúng vào chỗ là biển:

| Khối | Trước | Sau | Ghi chú |
|---|---|---|---|
| `allied-cavalry` (tháo chạy) | tâm 2300, 1900; hướng 30° | tâm 1150, 1780; hướng 325° | Chạy về đông bắc tới gần bờ biển rồi rẽ dọc bờ về tây bắc |
| `numidians` (đuổi theo) | tâm 2100, 1650; bề ngang 600; hướng 30° | tâm 1290, 1540; bề ngang 400; hướng 325° | Đuổi theo sau |

Hướng chạy của kỵ binh đồng minh không có trong nguồn (Varro thoát về Venusia với một nhóm kỵ binh, Polybius 3.116–117); cả vị trí cũ lẫn mới đều là giả định. `check-facing.mjs` thêm một dòng cho `allied-cavalry` ở giai đoạn 6 (lệch 32° vì khối vừa chạy vừa đổi hướng); `check-overlap.mjs --min 0.04` không đổi.

### Kiểm tra

`npm run validate` kiểm tra thêm: `terrain.far` (kích thước, file, vượt ra ngoài lưới chính ít nhất hai ô); không khối quân nào có quá 10% diện tích nằm trên biển ở bất kỳ mốc nào; không địa danh hay công trình nào nằm trên biển. Đã thử bằng cách đặt một khối quân, một địa danh và một công trình xuống biển: cả ba bị bắt.

### Còn lại

- Giữa hai mốc, cảnh nội suy thẳng: phép kiểm tra chỉ xét các mốc, chưa xét đường đi giữa chúng. Đường đi của hai khối kỵ binh ở giai đoạn 6 đã xem bằng mắt (trên bờ).
- Bờ biển thời cổ: nếu tìm được nghiên cứu địa mạo về châu thổ Ofanto thì nên ghi vào đây và cân nhắc dời bờ.

## 14. Công trình trong cảnh và nhà nông minh hoạ (T-039, đợt H chặng 2)

### Cái gì theo tư liệu, cái gì là phỏng dựng

| Thứ trong cảnh | Căn cứ |
|---|---|
| Có ba trại, có luỹ | Polybius 3.110–111, Livy 22.44–45 (mục 12) |
| Hào, cọc rào, bốn cổng | Cách đóng trại của quân La Mã nói chung (Polybius 6.27–34); không nguồn nào tả riêng ở Cannae. Kích thước hào luỹ là giả định |
| Khoảng trống 200 bộ sau luỹ, đường lớn, lều xếp hàng trong trại La Mã | Polybius 6.27–32 qua từ điển của W. Smith (mục 12). Cảnh chỉ giữ ba ý đó; chỗ của từng loại quân trong trại thì không vẽ |
| Lều da | Lều của quân La Mã làm bằng da là điều quen thuộc trong các sách về quân đội La Mã; ở đây ghi theo hiểu biết chung, chưa dẫn nguồn cổ cụ thể |
| Bên trong trại của Hannibal (lều xếp lỏng, ba màu) | Không có nguồn: minh hoạ |
| Thành Cannae có tường, tháp, cổng, nhà kho | Có thành, có lương trữ trong đó: Polybius 3.107. Tường, tháp và nhà kho trông ra sao: minh hoạ |
| Làng Cannae đổ nát một phần, không tường | Polybius 3.107, Livy 22.49 (mục 12). Số nhà, kiểu nhà: minh hoạ |
| 12 nhà nông trên đồng | Không có nguồn: minh hoạ, theo lựa chọn của người dùng cho cảnh có nhiều nhà hơn tư liệu |

### Mười hai nhà nông

Mỗi cái 70 × 50 m, mức `illustrative`. Vị trí (x, y): (2700, −1000), (3400, −2300), (1500, −2500), (−300, −2900), (−2600, −2700), (3900, −900), (−4600, 1500), (−3300, 2300), (600, −1800), (2200, −3900), (−1500, −2100), (−3000, −3500).

Cách chọn: thử 24 điểm rải quanh chiến trường, giữ điểm nào có đất cao trên 1,5 m và chênh dưới 4 m trong phần đất, cách đường giữa sông trên 200 m, cách mọi đường đi của các khối quân trên 250 m (tính tới mép khối) và cách công trình khác trên 200 m; lấy 12 điểm trong số đạt. Không cái nào nằm trong vùng hai đạo quân dàn trận.

### Lều và chỗ quân đứng

Lều không được dựng ở nơi một khối quân đứng hay đi qua. Vì `camp-force` và `roman-cavalry` xuất phát từ trong trại lớn và đi chéo qua trại, góc tây nam của trại lớn gần như không có lều. Ba khối đồng minh xuất phát từ nửa nam của trại nhỏ, nên nửa đó cũng thưa lều.

### Còn lại

- Sửa đường ra của `camp-force` và `roman-cavalry` cho qua đúng cổng trại thì trại lớn mới đầy lều.
- Khối quân Carthage giữ trại của Hannibal (Polybius 3.117) vẫn chưa có.
- Câu về lều da cần một nguồn dẫn được trước khi đưa vào ghi chú cho người xem.
