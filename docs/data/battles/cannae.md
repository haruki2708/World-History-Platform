# Trận Cannae (216 TCN): căn cứ dữ liệu

Cập nhật: 2026-11-20 (T-059, kỵ binh Hasdrubal xông qua lưng các quân đoàn ở giai đoạn 6: mục 19; T-049, kỵ binh của Hasdrubal tách thành kỵ binh Iberia và kỵ binh Gaul: mục 18; T-045, quân giữ trại của Hannibal và đường ra vào trại: mục 17; lập ở T-016). Từ T-032, bố cục các khối đánh giáp lá cà ở mục 9 và 10 được thay bằng mục 11. File dữ liệu: `src/data/battles/battle-of-cannae.json`. Lưới độ cao: `public/data/terrain/battle-of-cannae.bin`, dựng bằng `scripts/battles/build-terrain.mjs`.

Tài liệu này ghi nguồn đã đọc, các giả thuyết đã chọn và lý do, để người sau kiểm tra hoặc sửa.

## 1. Nguồn đã đọc

| Nguồn | Đọc ở đâu | Dùng cho |
|---|---|---|
| Polybius, *Histories* 3.107–118 (bản dịch Loeb 1922 của W. R. Paton) | [LacusCurtius](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/3*.html) | Trại, hướng quân, thứ tự dàn trận, diễn biến, quân số, thương vong |
| Livy, *Ab Urbe Condita* 22.36–52 (bản dịch Roberts) | [Wikisource](https://en.wikisource.org/wiki/From_the_Founding_of_the_City/Book_22) và Perseus (chương 40, 41, 45–48) | Hai trại, dàn trận, gió Volturnus, mưu 500 kỵ binh Numidia, thương vong, số người chạy thoát |
| Livy 22 (bản Latin) | [The Latin Library](https://www.thelatinlibrary.com/livy/liv.22.shtml) | Đối chiếu 22.36 (87.200 người), 22.46 (hướng quân), 22.49 (thương vong, Paullus trúng đá ném) |
| Livy 22 (bản Latin của B. O. Foster, Loeb 1929, có ghi chú văn bản) | [Perseus](https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.02.0200:book=22:chapter=46) (chương 46–48) | T-049: kỵ binh Gaul và Iberia ở cánh trái (mục 18) |
| Bài "Battle of Cannae" | [Wikipedia](https://en.wikipedia.org/wiki/Battle_of_Cannae) | Chỉ để tham khảo cách chia quân của Hannibal theo ước lượng hiện đại (bài dẫn Daly 2002 và Goldsworthy 2001), kể cả toán giữ trại (T-045, mục 17) và số kỵ binh Iberia, Gaul (T-049, mục 18). Không chép nội dung |
| Appian, *Hannibalica* 17–28 (bản dịch Horace White) | [Livius.org](https://www.livius.org/sources/content/appian/appian-war-against-hannibal/) | T-045: chuyện hai trại La Mã sau trận (mục 17) |
| Plutarch, *Fabius Maximus* 14–17 (bản dịch Loeb 1916) | [LacusCurtius](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Plutarch/Lives/Fabius_Maximus*.html) | T-045: số người bị bắt ở hai trại (16.8) |
| Cassius Dio, sách 15 (bản tóm của Zonaras) | [LacusCurtius](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Cassius_Dio/15*.html) | T-045: đối chiếu; không nhắc cuộc đánh trại |

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
- **Carthage: 50 000 – 58 000.** Polybius 3.114 và Livy 22.46 cùng ghi khoảng 40 000 bộ binh và 10 000 kỵ binh, trong đoạn tả thế trận: đó là quân ra trận. Toán giữ trại của Hannibal (Polybius 3.117) được tính riêng, ngoài 50 000; con số cao hơn cộng thêm 8 000 người của toán này. Quân số của toán, và việc nó nằm ngoài 50 000, là giả định (mục 17). Trước T-045 toán này không có đơn vị riêng.

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

### Đơn vị phía Hannibal (tổng 58 000: 50 000 ra trận, 8 000 giữ trại)

| Đơn vị | Loại | Người | Căn cứ |
|---|---|---|---|
| Lính ném đá Baleares | `balearic-slingers` | 2 000 | Polybius 3.113 và Livy 22.46 nhắc lính ném đá đi trước; số theo ước lượng hiện đại |
| Lính giáo nhẹ | `light-spearmen` (loại mới) | 6 000 | Polybius 3.113: lính ném đá và lính giáo đi trước; số theo ước lượng hiện đại |
| Kỵ binh Iberia (Hasdrubal) | `iberian-cavalry` | 2 000 | Cánh trái, sát sông. Số theo một ước lượng hiện đại do Wikipedia nêu. Từ T-049 (mục 18); trước đó cánh trái là hai khối hàng trước, hàng sau, mỗi khối 3 000, cùng loại `iberian-gallic-cavalry` |
| Kỵ binh Gaul (Hasdrubal) | `gallic-cavalry` | 4 000 | Cánh trái, đứng cạnh kỵ binh Iberia về phía trong. Như trên |
| Bộ binh Libya, cánh trái / cánh phải | `libyan-infantry` | 4 000 + 4 000 | Polybius 3.113: một nửa lính châu Phi ở mỗi bên. Tổng 8 000 theo ước lượng hiện đại |
| Lưỡi liềm: Gaul trái, Iberia lệch trái, Gaul giữa, Iberia lệch phải, Gaul phải | `gallic-infantry`, `iberian-infantry` | 5 000, 4 000, 6 000, 4 000, 5 000 | Polybius 3.114: Gaul và Iberia đứng xen kẽ từng toán. Gaul 16 000, Iberia 8 000 theo ước lượng hiện đại |
| Kỵ binh Numidia | `numidian-cavalry` | 4 000 | Cánh phải. Polybius ghi Hanno chỉ huy cánh phải, Livy ghi Maharbal |
| Quân giữ trại của Hannibal (`camp-guard`, T-045) | `gallic-infantry` | 8 000 | Polybius 3.117 nói có toán giữ trại nhưng không cho số. Số và thành phần theo một ước lượng hiện đại (Daly 2002, qua Wikipedia); không nằm trong 50 000 ra trận. Mục 17 |

Ước lượng hiện đại về cách chia quân của Hannibal lấy từ bài Wikipedia nói trên, bài này dẫn Daly (2002) và Goldsworthy (2001). Hộp thông tin của chính bài đó lại cho cách chia khác (21 000 Gaul, 3 000 Iberia); đây là chỗ chưa thống nhất.

**Lưỡi liềm** chia thành năm khối xen kẽ Gaul và Iberia, đặt theo một cung tròn, mỗi khối quay mặt theo cung. Cách này vừa đúng chi tiết "xen kẽ từng toán" của Polybius, vừa cho phép lưỡi liềm lồi lúc đầu rồi lõm vào ở giai đoạn 4 mà không cần kiểu dữ liệu mới.

### Thương vong (`casualties`, tính số chết)

- **La Mã: 48 200 – 70 000.** Livy 22.49: 45 500 bộ binh và 2 700 kỵ binh chết; 3 000 bộ binh và 1 500 kỵ binh bị bắt ngay trong trận. Polybius 3.117: khoảng 70 000 chết, khoảng 10 000 bị bắt (lực lượng ở trại), chỉ khoảng 3 000 bộ binh và 370 kỵ binh thoát.
- **Carthage: 5 700 – 8 000.** Polybius 3.117: khoảng 4 000 Gaul, 1 500 Iberia và Libya, 200 kỵ binh. Livy 22.52: tới 8 000.
- Trong file, số người của từng đơn vị giảm dần qua các giai đoạn. Các đơn vị ra trận của Carthage mất tổng cộng khoảng 6 000 người, chia theo Polybius: Gaul mất 4 000, Iberia và Libya 1 500, kỵ binh 200, lính nhẹ 350. Từ T-045 toán giữ trại mất thêm 1 300 người ở cổng trại (giả định, mục 17), nên phía Carthage mất tổng cộng 7 350, vẫn dưới con số 8 000 của Livy. Phía La Mã còn khoảng 9 300 người trên chiến trường ở cuối trận (gồm cả người chạy thoát) và 7 400 ở trại (trước T-045: 8 000); tức gần với con số của Polybius. Số "còn lại" chỉ để cảnh biết vẽ bao nhiêu hình lính, không phải một con số lịch sử.

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

**Từ T-045 (mục 17)**, quanh các trại:

| Giai đoạn | Thêm hay đổi |
|---|---|
| Lúc bắt đầu | Lực lượng ở trại lớn và kỵ binh La Mã đứng ngay sau cổng chính của trại lớn; ba khối đồng minh đứng thành cột sau cổng trại nhỏ. Toán giữ trại của Hannibal đứng ở cổng trại của ông |
| 1 | Các khối này ra khỏi trại qua cổng. Lực lượng ở trại lớn dàn hàng ngay ngoài cổng |
| 2 | Lực lượng ở trại lớn tới cổng trại Hannibal ở cuối giai đoạn |
| 3–5 | Đánh giáp lá cà với toán giữ trại ở cổng (trước đây là đánh từ xa vào một trại không người). Toán giữ trại trụ được ở giai đoạn 3–4, bị đẩy lùi 40 m vào trong trại ở giai đoạn 5 |
| 4–5 | Kỵ binh La Mã tháo chạy lên phía bắc giữa trại lớn và sông, không chạy qua trại |
| 6 | Lực lượng ở trại lớn quay đầu, rút về trại lớn qua cổng, mất 2 000 người; toán giữ trại đuổi theo 450 m |

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
- Đánh từ xa ghi `skirmish`: lính nhẹ ở giai đoạn 2, kỵ binh Numidia ở giai đoạn 3–4.
- Lực lượng ở trại lớn đánh trại Hannibal ở giai đoạn 3–5. Trước T-045 toán giữ trại không có đơn vị riêng, nên cuộc đánh trại được vẽ như đánh từ xa (`skirmish`). Từ T-045 đó là giáp lá cà (`fight`) với toán giữ trại ở cổng trại (mục 17).
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
- **Kỵ binh Hasdrubal:** mốc 2 chạm kỵ binh La Mã ở y = 40; mốc 3 ở y = 120; mốc 4 đang ở sau lưng quân La Mã, (300, 420) và (−50, 470); mốc 5 và 6 chạm hàng triarii, hai khối đứng cạnh nhau. Từ T-049 hai khối là kỵ binh Iberia và kỵ binh Gaul, đứng cạnh nhau cả ở mốc 2 và 3, nên cả hai cùng đánh kỵ binh La Mã (mục 18). Từ T-059, ở giai đoạn 6 hai khối xông qua hàng triarii thay vì đứng đấu từng cặp (mục 19).
- **Cổng trại Hannibal** (T-045, mục 17): lực lượng ở trại lớn và toán giữ trại đứng hai bên một đường bắc–nam là mặt trước (phía đông) của trại, x = −3475, cổng ở y = −500; bề ngang 200 m. Mốc 2 và 3 đường này nằm đúng ở cổng, mốc 4 lùi vào trong trại 10 m, mốc 5 lùi 40 m. Mốc 6: chỗ lực lượng ở trại lớn đứng sau cổng trại lớn (rút về theo đường thẳng qua cổng) và đoạn toán giữ trại đuổi theo cũng do script tính.

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
- Trại của Hannibal đặt sao cho luỹ phía đông nằm ngay trước mặt đạo quân La Mã đánh trại (`camp-force`, giai đoạn 3–5): tâm khối này cách luỹ 175–225 m, đầu phía tây của hàng trước cách luỹ khoảng 16 m. Nhãn "Trại của Hannibal" dời theo về tâm trại. Từ T-045, `camp-force` đánh ngay ở cổng, giữa luỹ phía đông (mục 17).
- Gò thành: đỉnh gò (cao từ 54 m trở lên) trải khoảng 180 m theo hướng đông–tây và 90 m theo hướng bắc–nam, quanh điểm −4770, −4015; sườn tây và bắc dốc xuống đồng bằng ven sông (14–25 m). Lưới Copernicus là mô hình bề mặt, có thể đã tính cả tàn tích hiện nay trên gò.

### Khối quân đứng trong trại

Lúc bắt đầu, vài khối quân còn đứng trong trại của mình: `camp-force` và `roman-cavalry` trong trại lớn; ba khối đồng minh trong trại nhỏ. Cuối trận, `roman-cavalry` (đang tháo chạy) và `camp-force` (rút về) lại ở trong trại lớn. Chặng công trình phải để trống chỗ các khối này đứng và đi qua (không dựng lều ở đó).

Từ T-045 (mục 17): các khối này đứng ngay sau cổng chính và ra qua cổng; `camp-force` về trại lớn cũng qua cổng; kỵ binh La Mã tháo chạy ở ngoài trại lớn, giữa trại và sông. Toán giữ trại của Hannibal đứng ở cổng trại của mình từ đầu trận.

### Kiểm tra

`npm run validate` kiểm tra thêm (`checkScenery` trong `validate-battles.mjs`):

- mỗi `evidence` có mức hợp lệ, ghi chú đủ hai ngôn ngữ, và có nguồn nếu là `attested`;
- công trình nằm trọn trong vùng địa hình, không chồng lên nhau, không lấn vào sông và dải bờ sông;
- trại phải thuộc một bên (`side`);
- gió, bụi, mực nước, bề rộng dải bờ nằm trong khoảng cho phép; đường bao của một mảng đất có ít nhất ba điểm và có diện tích;
- cảnh báo khi nhãn của một trại hay thị trấn nằm ngoài mọi công trình cùng loại.

Đã thử bằng cách cố ý làm sai dữ liệu theo 16 kiểu: cả 16 đều bị bắt.

### Còn lại

- ~~Chưa có khối quân Carthage nào giữ trại của Hannibal, dù Polybius 3.117 nói có: `camp-force` đang đánh vào một trại không người.~~ Đã thêm ở T-045 (mục 17).
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

Từ T-045 (mục 17) các khối ra vào qua cổng. Phần đất không được dựng lều: trại lớn 6,1% (trước 34,6%), trại nhỏ 14,4% (trước 29,8%), trại của Hannibal 3,7% (trước 0%, nay có toán giữ trại đứng ở cổng).

### Còn lại

- ~~Sửa đường ra của `camp-force` và `roman-cavalry` cho qua đúng cổng trại thì trại lớn mới đầy lều.~~ Đã sửa ở T-045.
- ~~Khối quân Carthage giữ trại của Hannibal (Polybius 3.117) vẫn chưa có.~~ Đã thêm ở T-045.
- Câu về lều da cần một nguồn dẫn được trước khi đưa vào ghi chú cho người xem.

### Sửa sau khi người dùng xem (T-039)

- **Trại không vẽ luỹ.** Nguồn có nói tới luỹ (Livy 22.44–45, mục 12), nhưng người dùng chọn không vẽ tường quanh trại: trại trong cảnh chỉ có lều. Dòng "Hào, cọc rào, bốn cổng" trong bảng trên vì thế không còn áp dụng cho cảnh.
- **Vị trí lúc bắt đầu của sáu khối quân** (trước đây đè lên dòng sông):

  | Khối | Trước | Sau |
  |---|---|---|
  | `roman-velites` | −525, 910 | −830, 930 |
  | `hastati` | −525, 1045 | −830, 1045 |
  | `principes` | −525, 1090 | −830, 1090 |
  | `triarii` | −525, 1132 | −830, 1132 |
  | `light-spearmen` | −1300, −440 | −1010, −440 |
  | `gauls-right` | −1260, −650 | −1170, −650 |
  | `gauls-left` | −2260, −650 | −2260, −600 |

  Bộ binh La Mã giờ bắt đầu ở bờ tây, ngay trước chỗ lội, và vượt sông trong giai đoạn 1 (Polybius 3.113: Varro dẫn quân từ trại lớn vượt sông). Các khối của Hannibal chỉ nhích khỏi đoạn sông chảy về bắc.

## 15. Cây cối (T-040, đợt H chặng 3)

**Mọi cây trong cảnh Cannae đều là minh hoạ.** Polybius 3.110 nói vùng quanh Cannae "bằng phẳng và không có cây"; không nguồn nào tả cây ven sông hay cây trên đồng. Người dùng đã chọn cho cảnh có nhiều cây hơn tư liệu (`docs/PLAN.md`, mục "Đợt H"), và hộp thoại Giới thiệu nói rõ điều này.

| Thứ | Dữ liệu | Ghi chú |
|---|---|---|
| Lau sậy, bụi, dương và liễu ven sông | `rivers[0].banks` (có từ chặng 0), dải 25 m mỗi bờ | Ngày nay dọc sông Ofanto có lau sậy, liễu, dương |
| Cây lẻ trên đồng | `scenery.trees.perSquareKm: 14` | Ô liu và sồi. Trái với Polybius 3.110 |
| Ba khu rừng nhỏ | `areas`: `wood-east` quanh (3600, −3000), `wood-south` quanh (−700, −3500), `wood-west` quanh (−4300, 2400), mỗi khu khoảng 300 × 220 m | Trái với Polybius 3.110. Đặt xa chỗ hai đạo quân dàn trận |
| Cây quanh nhà nông và làng | Không có dữ liệu riêng: cảnh tự trồng 5 cây quanh mỗi nhà nông, 9 cây quanh làng | Đi theo các nhà nông minh hoạ của mục 14 |
| Bụi trên sườn dốc | Không có dữ liệu riêng: cảnh tự trồng ở chỗ dốc từ 13% trở lên | Sườn gò Cannae và bậc đất phía nam |

Loại cây (ô liu, sồi, dương, liễu) là cây quen thuộc của vùng Địa Trung Hải, chọn theo hiểu biết chung; chưa đối chiếu với nghiên cứu nào về thảm thực vật Apulia thời đó.

Không cây nào đứng ở chỗ quân đứng hay đi qua (cây lùi 55 m so với mọi khối quân ở mọi thời điểm), nên vùng hai đạo quân dàn trận và giao chiến vẫn trống như lời Polybius.

## 16. Mặt đất xanh (T-041, T-044, đợt I)

Ngày 2026-11-18 người dùng chọn vẽ mặt đất **xanh tươi như ảnh mẫu**, dù biết trái mùa. `ground.cover` đổi từ `stubble` sang `grass`, mức căn cứ đổi từ `inferred` sang `illustrative`, và ghi chú nói rõ: theo Polybius (3.110) và Livy (22.43), ngày diễn ra trận đánh nơi đây là ruộng đã gặt và cỏ khô; cảnh vẽ xanh là lựa chọn cho vẻ ngoài. Bảng ở mục 12 ghi lớp phủ cũ. Hộp thoại Giới thiệu nói điều này trong dòng về cảnh vật (`about.accuracy.battle.scenery`).

Phần hỗn chiến ở các hàng sau và lao ném qua đầu hàng trước (T-043) không có trong dữ liệu trận: cảnh tự vẽ, và dòng `about.accuracy.battle.duels` của hộp thoại Giới thiệu nói đó là minh hoạ.

## 17. Quân giữ trại của Hannibal và đường ra vào trại (T-045)

Hai việc dở ghi ở mục 12 và 14: trại của Hannibal không có người giữ, và các khối quân đi chéo qua trại lớn nên trại thiếu lều.

### Nguồn đã đọc (2026-11-19)

| Nguồn | Nói gì về toán giữ trại và cuộc đánh trại |
|---|---|
| Polybius 3.117 (bản Paton) | Paullus để 10 000 bộ binh ở trại của ông (trại lớn), tính rằng nếu Hannibal dồn hết quân ra trận mà bỏ trống trại thì họ vào lấy hành lý, còn nếu ông để nhiều quân giữ trại thì quân ra trận của ông ít đi. Trận vừa bắt đầu, họ đánh vào trại Hannibal như đã được lệnh. Hannibal có để lại một toán đủ sức giữ trại, nhưng Polybius không nói bao nhiêu người hay là quân gì. Toán này lúc đầu trụ được, rồi bắt đầu núng; đúng lúc ấy Hannibal, đã thắng trên khắp chiến trường, kéo tới giúp, đánh tan quân La Mã và dồn họ vào trại của họ, giết 2 000 người, sau đó bắt hết số còn lại. Ở đầu chương Polybius ghi khoảng 10 000 bộ binh bị bắt khi đang đánh nhưng không ở trận chính; con số này không khớp hẳn với 10 000 trừ 2 000 bị giết |
| Polybius 3.113–114 | Hannibal cho lính ném đá và lính giáo vượt sông trước, rồi dẫn phần quân còn lại ra khỏi trại, vượt sông ở hai chỗ; không nói ông để lại ai. Con số khoảng 10 000 kỵ binh và hơn 40 000 bộ binh một chút nằm ngay trong đoạn tả thế trận |
| Livy 22.41–52 | Không nhắc cuộc đánh trại Hannibal hay toán giữ trại. Sau trận: 7 000 người chạy vào trại nhỏ, 10 000 vào trại lớn, chừng 2 000 vào làng Cannae (22.49). Đêm đó một toán do Sempronius Tuditanus dẫn phá vây từ trại nhỏ sang trại lớn rồi về Canusium (22.50). Hôm sau Hannibal chặn đường lấy nước của trại nhỏ và trại này đầu hàng; khoảng 4 000 bộ binh và 200 kỵ binh từ trại lớn thoát về Canusium, số còn lại nộp trại lớn với cùng điều kiện (22.52) |
| Appian, *Hannibalica* 17–28 | Không nhắc toán quân ở lại trại hay cuộc đánh trại Hannibal. Sau trận chừng 15 000 người chạy vào hai trại (24); khoảng 10 000 người ở trại lớn nửa đêm phá vây về Canusium, 5 000 người ở trại nhỏ bị bắt hôm sau (26) |
| Plutarch, *Fabius* 16.8 | Sau trận có không dưới 10 000 người bị bắt ở hai trại của hai chấp chính quan. Không nhắc cuộc đánh trại |
| Cassius Dio, sách 15 (bản Zonaras) | Không nhắc |
| Bài "Battle of Cannae" trên Wikipedia, mục "Armies" (đọc văn bản gốc của bài) | Bộ binh của Hannibal: 8 000 Libya, 5 500 Gaetuli, 16 000 Gaul (chủ yếu người Boii và Insubres, kèm chú thích rằng 8 000 người ở lại trại hôm giao chiến), 8 000 người các tộc ở Hispania; dẫn Daly (2002), tr. 94. Câu này không nói rõ 8 000 người ở trại nằm trong hay ngoài 16 000. Tôi chưa đọc được sách của Daly. Ô thông tin của chính bài đó ghi 21 000 Gaul, không dẫn nguồn |

Tóm lại: chỉ Polybius kể cuộc đánh trại. Các nguồn khác không nhắc, nhưng cũng không nói điều gì trái với nó.

### Quyết định

- **Khối `camp-guard`** ("Quân giữ trại của Hannibal", tiếng Anh "Guard of Hannibal's camp"), loại `gallic-infantry` có sẵn, mô hình `gallic-infantry`; không thêm loại lính. Lý do chọn lính Gaul: ước lượng hiện đại duy nhất tìm được (Daly, qua Wikipedia) nói toán ở lại trại là lính Gaul. Ngoài ra, kỵ binh, lính Libya, lính Iberia và lính nhẹ đều được Polybius 3.113–116 tả là có mặt trên chiến trường.
- **8 000 người**, giả định, theo con số của Daly. Polybius chỉ nói toán này đủ sức giữ trại và trụ được một lúc trước 10 000 quân La Mã.
- **Ngoài 50 000.** Polybius 3.114 và Livy 22.46 đưa con số 40 000 bộ binh và 10 000 kỵ binh trong đoạn tả thế trận, nên coi đó là quân ra trận; các đơn vị ra trận trong file cộng đúng 50 000. Toán giữ trại cộng thêm: `strength` của Carthage đổi từ 50 000 thành 50 000–58 000, `note` nói rõ con số cao hơn là giả định. Nếu đọc câu của Daly theo nghĩa 8 000 người ở trại nằm trong 16 000 Gaul, thì số Gaul ra trận chỉ còn 8 000, khác với bảng ở mục 5. Tôi không đổi bảng đó, vì chưa đọc được Daly, và vì Polybius đặt con số 50 000 trong thế trận.
- **`uncertainty`** của file trận thêm một câu: Polybius nói có toán giữ trại nhưng không cho quân số; quân số và thành phần là theo một ước lượng hiện đại. Ghi chú (`evidence.note`) của trại Hannibal thêm vế "trong lúc toán quân ông để lại giữ trại".
- **Đánh ở cổng.** Trại Hannibal quay mặt về đông (`facing` 90), nên cổng chính ở giữa mặt đông, khoảng (−3475, −500), quay về phía quân La Mã tới từ trại lớn. Toán giữ trại đứng ngay trong cổng, mặt quay ra; quân La Mã đứng ngoài, mặt quay vào. Bề ngang 200 m: hẹp hơn mặt trại nhiều, nên nhìn vào thấy một khoảng trống giữa các lều ở mép trại, hai bên đánh nhau ở đó. Cảnh không vẽ luỹ và cổng (mục 14).
- **Diễn biến theo Polybius 3.117.** Giai đoạn 2: quân La Mã tới cổng (Polybius: họ đánh khi trận bắt đầu). Giai đoạn 3–4: toán giữ trại trụ được, đường giáp chiến đứng yên ở cổng (giai đoạn 4 lùi 10 m). Giai đoạn 5: toán giữ trại núng thế, bị đẩy lùi 40 m vào trong trại. Giai đoạn 6: Hannibal kéo về giải vây; quân La Mã quay đầu, rút về trại lớn qua cổng và mất 2 000 người. Lời dẫn nói Hannibal về giải vây, nhưng cảnh không có khối nào đi từ chiến trường về trại, vì mọi khối của Hannibal đang vây quân La Mã suốt giai đoạn 6. Thay vào đó toán giữ trại đuổi theo 450 m. Chi tiết đuổi theo là suy ra, nguồn không nói.
- **Thương vong ở cổng**, giả định: quân La Mã mất 200 người mỗi giai đoạn (10 000 còn 9 400 ở mốc 5); toán giữ trại mất 300, 400, 600 (8 000 còn 6 700), nhiều dần khi bị ép. Giai đoạn 6 quân La Mã còn 7 400; toán giữ trại không mất thêm.
- **Ra vào qua cổng.** Cảnh dời khối quân theo đường thẳng giữa hai mốc, nên các khối bắt đầu ngay sau cổng, đi thẳng ra, và mốc cuối giai đoạn 6 của `camp-force` nằm ngay sau cổng trên đường thẳng từ cổng trại Hannibal. Trại lớn và trại nhỏ cùng quay mặt về nam, cổng chính ở giữa mặt nam: (−1600, 775) và (250, 825). Polybius 3.113 chỉ nói Varro đưa quân từ hai trại ra; không nguồn nào nói họ ra cổng nào.
- **Kỵ binh La Mã tháo chạy** (giai đoạn 4–5) lên phía bắc giữa trại lớn và sông, không chạy qua trại. Nguồn chỉ nói họ bị đánh tan và bị giết dọc bờ sông (Polybius 3.115–116, Livy 22.47); cả đường cũ lẫn đường mới đều là giả định.
- Lời dẫn các giai đoạn 1, 2, 3, 5, 6 (cả `en` và `vi`) nói tới toán giữ trại và cổng trại. Mũi tên của giai đoạn 1, 2, 4, 6 vẽ lại theo đường mới; thêm một mũi tên cho toán giữ trại đuổi theo ở giai đoạn 6.

### Vị trí

Các khối đánh nhau ở cổng do `scripts/battles/cannae-lines.mjs` dựng (mốc 2–6, mục 11); `initial`, mốc 1 và đường tháo chạy của kỵ binh La Mã sửa tay.

| Khối | Mốc | Trước | Sau |
|---|---|---|---|
| `camp-force` | đầu trận | (−1600, 1250), 220 × 220, hướng 180 | (−1600, 975), 140 × 110, hướng 180, sau cổng trại lớn |
| | 1 | như đầu trận, `stand` | (−1600, 680), hướng 225, ngay ngoài cổng, `advance` |
| | 2 | (−2900, 0), `advance` | (−3419,2, −500), 200 × 110, hướng 270, ở cổng trại Hannibal |
| | 3, 4, 5 | (−3250, −260) rồi (−3300, −300), `skirmish`, 9 500, 9 000, 8 500 | Ở cổng, lùi 0, 10, 40 m vào trong trại; `fight`, 9 800, 9 600, 9 400 |
| | 6 | (−1700, 1050), 300 × 200, hướng 45, 8 000 | (−1542,3, 814,6), 120 × 120, hướng 55,6, ngay sau cổng trại lớn; 7 400 |
| `camp-guard` | đầu trận đến 2 | | (−3515,7, −500), 200 × 80, hướng 90, ngay trong cổng, `stand`, 8 000 |
| | 3, 4, 5 | | Lùi 0, 10, 40 m; `fight`, 7 700, 7 300, 6 700 |
| | 6 | | (−3184,6, −245,5), hướng 55,6, `pursue`, 6 700 |
| `roman-cavalry` | đầu trận | (−1200, 1080), 300 × 70, hướng 180 | (−1570, 850), 160 × 90, hướng 160, sau cổng trại lớn |
| | 4 | (−1180, 820), trong góc đông nam của trại | (−850, 920), giữa trại và sông |
| | 5 | (−1150, 1120), trong trại | (−800, 1200), giữa trại và sông |
| `allied-light-infantry`, `allied-infantry-front`, `allied-infantry-rear` | đầu trận | (225, 910 / 1050 / 1105), rộng 450 | Ba khối nối nhau thành cột sau cổng trại nhỏ: (250, 851 / 920 / 1010), rộng 220, sâu 41 / 82 / 82 (cùng mật độ) |

Hướng 160 của kỵ binh La Mã lúc đầu trận: từ cổng trại lớn tới chỗ dàn trận bên sông, khối đi về hướng đông nam (khoảng 134°). Đứng hướng 180 thì cả giai đoạn 1 đi lệch hướng mặt 46°, `check-facing.mjs` báo; quay sẵn 20° thì không.

### Số đo

Phần đất mỗi trại không được dựng lều, đo bằng `E:\World_History_Platform_assets\T-045\tools\camp-occupancy.mjs` (bản sao của `occupancy` trong `structures.ts`):

| Trại | Trước | Sau |
|---|---|---|
| `roman-large-camp` | 34,6% | 6,1% |
| `roman-small-camp` | 29,8% | 14,4% |
| `hannibal-camp` | 0,0% | 3,7% |

- Trại lớn còn 6,1%: chỗ hai khối đứng lúc đầu trận sau cổng, và phần `camp-force` đi vào qua cổng rồi đứng lại ở cuối trận.
- Trại nhỏ còn 14,4%: ba khối đồng minh vừa đi vừa giãn bề ngang từ 220 m lên 750 m, nên phần đất chúng đi qua trong trại loe ra như hình thang. Muốn hẹp hơn thì khối phải ra hẳn khỏi trại rồi mới giãn, tức cần thêm một mốc giữa giai đoạn 1.
- Trại Hannibal 3,7%: chỗ toán giữ trại đứng và bị đẩy lùi.

Kiểm tra:

- `npm run validate` qua, không còn cảnh báo. Kiểm tra `fight` (mép trước chạm nhau ở mốc đầu và mốc cuối) qua ở giai đoạn 3, 4, 5 cho cả hai khối.
- `check-overlap.mjs --min 0.04`: in đúng như trước T-045. Chạy lại với bước 0,02 giai đoạn và ngưỡng 0,01%: không cặp nào có `camp-force`, `camp-guard`, `roman-cavalry` hay ba khối đồng minh chồng lên nhau trong giai đoạn 1, tức không khối nào đi xuyên khối khác lúc ra cổng. Suốt trận, `camp-force`, `camp-guard` và `roman-cavalry` không chồng lên khối nào; ba khối đồng minh chỉ còn những chỗ chồng có từ trước, từ giai đoạn 3 (mục 9 và 11).
- `check-facing.mjs`: thêm hai dòng, `camp-guard` ở giai đoạn 4 và 5 đi lùi (10 m và 30 m) khi bị đẩy vào trại. Đi lùi lúc giao chiến là có chủ ý, như lưỡi liềm (mục 10).
- Tốc độ (quãng đường chia cho giờ của giai đoạn): `camp-force` đi 2 168 m ở giai đoạn 2, 0,60 m/s (trước 0,5 m/s, mục 9); rút về 2 324 m ở giai đoạn 6, 0,14 m/s. Kỵ binh La Mã tháo chạy 796 m ở giai đoạn 4, 0,18 m/s.
- Không khối nào đứng trong nước sông ở một mốc. Đường đi của `camp-force` ở giai đoạn 2 và 6 không cắt sông; kỵ binh La Mã vẫn lội sông ở giai đoạn 1 và 4 như trước.

### Xem trong cảnh

`/battle-lab` (cả `?lang=vi`), dev server ở cổng 3102. Ảnh trước và sau ở `E:\World_History_Platform_assets\duyet\T-045\`, chụp bằng `s-scenery.mjs` của phiên chính, mỗi cặp cùng góc nhìn:

| Ảnh | Thời điểm | Góc |
|---|---|---|
| `01-trai-lon-tren-cao-dau-tran` | Đầu trận | Trại lớn từ trên cao |
| `02-trai-nho-tren-cao-dau-tran` | Đầu trận | Trại nhỏ từ trên cao |
| `03-cong-trai-lon-dau-tran` | Đầu trận | Cổng trại lớn |
| `04-ra-cong-trai-lon-giua-giai-doan-1` | Giữa giai đoạn 1 | Các khối ra cổng trại lớn |
| `05-cua-trai-hannibal-can-canh-giua-giai-doan-4` | Giữa giai đoạn 4 | Cận cảnh hàng đầu hai bên ở cổng trại Hannibal |
| `06-cua-trai-hannibal-tam-trung-giua-giai-doan-4` | Giữa giai đoạn 4 | Tầm trung, thấy lều sau lưng toán giữ trại |
| `07-trai-hannibal-tren-cao-giua-giai-doan-4` | Giữa giai đoạn 4 | Trại Hannibal từ trên cao |
| `08-rut-ve-giua-giai-doan-6` | Giữa giai đoạn 6 | Quân La Mã rút về, toán giữ trại đuổi theo |
| `09-ve-cong-trai-lon-cuoi-giai-doan-6` | Cuối giai đoạn 6 | Quân La Mã vào lại cổng trại lớn |

Hàng đầu hai bên ở cổng trại Hannibal đấu từng cặp; có người ngã và lao ném qua đầu các hàng trước. Console không có lỗi. Khi phát, cảnh chạy 56–73 khung hình/giây ở 1280×800 (máy có card RTX 3050).

### Còn lại

- Con số 8 000 của Daly mới đọc qua Wikipedia, chưa đối chiếu với sách. Phiên chính tìm thêm khi gộp (2026-11-19): câu "8 000 người ở lại trại" có trong bài Wikipedia, nhưng không xác nhận được nó nằm trong sách của Daly; có thể đến từ một sách khác cùng năm (Healy, *Cannae 216 BC*, Osprey 2002). Ghi chú `strength` của Carthage vì thế nói "ước lượng hiện đại do Wikipedia nêu", không nêu tên Daly. Nếu đọc được sách thì nên xem lại cả câu "8 000 người ở trại nằm trong hay ngoài 16 000 Gaul" (ở trên) lẫn bảng chia quân ở mục 5.
- Trại không vẽ luỹ và cổng: chỗ đánh nhau chỉ đọc ra là cổng trại nhờ khoảng trống trong lều.
- Hộp thoại Giới thiệu chưa nói toán giữ trại là phỏng dựng; đề nghị câu chữ ở mục "Kết quả" của `docs/tasks/T-045-camp-guard.md`.

## 18. Kỵ binh Iberia và kỵ binh Gaul của Hasdrubal (T-049)

Trước T-049, kỵ binh cánh trái của Hasdrubal là hai khối (hàng trước, hàng sau), mỗi khối 3 000 người, cùng một loại lính chung `iberian-gallic-cavalry` mặc đồ người Iberia (mục 5). Ở T-047 lane 1 nêu: người Gaul trong cảnh vì thế trông như người Iberia. Người dùng chọn tách thành hai loại lính; mô hình kỵ binh Gaul do lane 1 dựng ở T-050.

### Nguồn cổ đã đọc lại (2026-11-19)

| Nguồn | Đọc ở đâu | Nói gì về kỵ binh cánh trái |
|---|---|---|
| Polybius 3.113 | Bản Paton, LacusCurtius (mục 1) | Hannibal đặt kỵ binh Iberia và Celt ở cánh trái, sát sông, đối diện kỵ binh La Mã. Hai dân tộc được gọi trong một cụm, như một cánh quân; không nói họ đứng với nhau thế nào |
| Polybius 3.114 | Như trên | Khiên của người Iberia và người Celt gần giống nhau, kiếm khác hẳn; người Gaul cởi trần, người Iberia mặc áo ngắn viền tía. Đoạn này nói về bộ binh đứng xen kẽ từng toán ở giữa; trang phục của kỵ binh không được tả. Tổng khoảng 10 000 kỵ binh, không chia theo dân tộc. Hasdrubal chỉ huy cánh trái |
| Polybius 3.115 | Như trên | Kỵ binh Iberia và Celt ở cánh trái đụng kỵ binh La Mã; gặp nhau là xuống ngựa đánh từng người; cuối cùng giết phần lớn và dồn số còn lại dọc bờ sông. Vẫn gọi chung một cụm |
| Polybius 3.116 | Như trên | Hasdrubal từ cánh trái sang giúp kỵ binh Numidia, rồi dẫn các đội kỵ binh của ông tới chỗ bộ binh đang đánh và đánh vào lưng các quân đoàn. Không nêu tên dân tộc |
| Polybius 3.117 | Như trên | Phía Carthage chết khoảng 4 000 người Celt, 1 500 người Iberia và Libya, 200 kỵ binh. Số kỵ binh không chia theo dân tộc |
| Polybius 3.56, 3.67, 3.72 | Như trên | Hannibal vào Ý với không quá 6 000 kỵ binh, không chia theo dân tộc (3.56); lúc ấy chưa có người Gaul nào theo ông. Gần 200 kỵ binh Celt bỏ trại La Mã sang với ông (3.67). Ở sông Trebia cuối năm 218 TCN, kỵ binh của ông kể cả đồng minh Celt là hơn 10 000 (3.72) |
| Livy 22.46.2 | Bản Latin của Foster (Loeb 1929) và bản dịch Roberts, đều trên Perseus | Kỵ binh Gaul và Iberia (*Gallos Hispanosque equites*) đứng ở cánh trái, sát bờ sông, đối diện kỵ binh La Mã. Livy gọi tên người Gaul trước, Polybius gọi người Iberia trước |
| Livy 22.46.3–6 | Như trên | Khiên, kiếm, áo trắng viền tía, người Gaul cởi trần: tả bộ binh ở trung quân (22.46.3), không phải kỵ binh. 40 000 bộ binh và 10 000 kỵ binh, không chia theo dân tộc |
| Livy 22.47.1–3 | Như trên | Cánh trái gồm kỵ binh Gaul và Iberia đụng cánh phải của La Mã. Không có chỗ xoay trở, hai bên phải đánh giáp mặt, kéo nhau xuống ngựa, phần lớn thành đánh bộ; kỵ binh La Mã bị đẩy lui và bỏ chạy |
| Livy 22.48.5–6 | Như trên | Hasdrubal sai kỵ binh Numidia đuổi theo những người chạy trốn, còn kỵ binh Iberia và Gaul thì đưa tới hợp sức với lính châu Phi. Ghi chú văn bản của bản Foster: chữ *equites* (kỵ binh) ở câu này là chữ sửa của Gronovius; bản chép tay P ghi *pedites* (bộ binh) |

Tóm lại:

- Cả hai nguồn kể người Iberia và người Gaul **cùng** ở cánh trái sát sông và **cùng** đụng kỵ binh La Mã. Livy còn kể họ cùng được đưa vào trận chính lúc cuối. Không nguồn nào nói họ đứng thành hàng trước, hàng sau, hay dân tộc nào đứng sát sông.
- Không nguồn cổ nào chia 10 000 kỵ binh theo dân tộc.
- Trang phục trong Polybius 3.114 và Livy 22.46 là của bộ binh. Bộ đồ của kỵ binh Gaul dựa vào các nguồn khác, lane 1 ghi ở T-050.

### Ước lượng hiện đại

| Đọc ở đâu | Con số | Ghi chú |
|---|---|---|
| Bài "Battle of Cannae" trên Wikipedia tiếng Anh, đọc mã nguồn của bài ngày 2026-11-19: ô thông tin và mục "Armies" | Ô thông tin: 4 000 kỵ binh Numidia, 2 000 kỵ binh Hispania, 4 000 kỵ binh Gaul. Mục "Armies": 4 000 Numidia, 2 000 người bán đảo Iberia, 4 000 Gaul và 450 Libya-Phoenicia | Ô thông tin không dẫn nguồn. Trong mục "Armies", chú thích dẫn Daly (2002), tr. 106, nằm ở cuối câu **sau** (câu về lính ném đá và lính lao), nên không rõ con số kỵ binh có phải của Daly hay không. Tôi chưa đọc được sách của Daly. Vì vậy chỉ ghi là "do Wikipedia nêu" (rút kinh nghiệm từ T-045, mục 17) |
| Cùng bài, mục "Battle" | Hasdrubal có 6 000–7 000 kỵ binh, Hanno 3 000–4 000 kỵ binh Numidia | Dẫn Goldsworthy, *Cannae* (Cassell, 2001), tr. 108 và 112. Không chia Iberia và Gaul. Chưa đọc được sách |
| Một trang web đăng lại văn bản cuốn *Cannae* trong loạt *Cassell's Fields of Battle* (erenow.org; trang không ghi tác giả, có lẽ là sách của Goldsworthy nói trên; không phải bản phát hành chính thức, nên không đưa vào nguồn của file trận) | Toàn bộ kỵ binh Gaul và Iberia, khoảng 6 000–7 000 người, dồn ở cánh trái; kỵ binh Numidia có lẽ 3 000–4 000 | Sách nói thẳng là không có số liệu chính xác cho từng nhóm. Người Gaul đều được mộ từ các bộ tộc vùng Cisalpine sau khi Hannibal vào Ý; khá nhiều kỵ binh nặng của Hasdrubal là người Iberia. Không chia số |
| Bài "Hasdrubal (quartermaster)" trên Wikipedia tiếng Anh | Hasdrubal khoảng 6 500 kỵ binh, Hanno 3 500 kỵ binh Numidia | Câu này không có chú thích. Không chia |
| Bài về trận Cannae trên Ars Bellica (arsbellica.it) | Kỵ binh nặng Gaul và Iberia 6 500, kỵ binh Numidia 3 500 | Không dẫn nguồn. Không chia |

Cách chia duy nhất tìm được là 2 000 Iberia và 4 000 Gaul, trên Wikipedia, không rõ của ai.

**Đối chiếu với Polybius** (suy luận của tôi, không nguồn nào viết như vậy): Hannibal vào Ý với không quá 6 000 kỵ binh, gồm người Numidia và người Iberia, chưa có người Gaul (3.56). Cuối năm đó ở Trebia, kỵ binh kể cả người Celt hơn 10 000 (3.72), tức có chừng 4 000 kỵ binh Celt trở lên. Nếu ở Cannae có khoảng 4 000 kỵ binh Numidia như file này, thì kỵ binh Iberia nhiều lắm là khoảng 2 000. Cách chia của Wikipedia vì thế khớp với các con số của Polybius, nhưng khoảng sai rất rộng: hao hụt trong hai năm 218–217 TCN, người Gaul theo thêm sau Trebia, và chính số kỵ binh Numidia cũng là ước lượng.

### Quyết định

- **Loại lính** (`unit-types.json`; tên dùng chung với T-050 của lane 1):
  - `iberian-gallic-cavalry` đổi thành `iberian-cavalry` ("Iberian cavalry", "Kỵ binh Iberia"), vẫn dùng file mô hình `iberian-gallic-cavalry`, vốn đã mặc đồ người Iberia (áo trắng viền tía, T-022).
  - Thêm `gallic-cavalry` ("Gallic cavalry", "Kỵ binh Gaul"), mô hình `gallic-cavalry`. Tới khi T-050 gộp, cảnh vẽ hình tạm cho loại này; `npm run validate` vẫn qua.
- **Quân số: 2 000 kỵ binh Iberia, 4 000 kỵ binh Gaul**, giả định theo con số Wikipedia nêu. Tổng cánh trái vẫn 6 000, kỵ binh Numidia vẫn 4 000, tổng kỵ binh vẫn 10 000 như Polybius và Livy. Không thêm 450 kỵ binh Libya-Phoenicia của bài Wikipedia: nguồn cổ chỉ cho tổng 10 000.
- **Hai khối đứng cạnh nhau, không giữ hàng trước, hàng sau.** Lý do:
  1. Polybius 3.115 và Livy 22.47.1 kể cả người Iberia lẫn người Gaul đụng kỵ binh La Mã bên sông. Nếu chia trước sau theo dân tộc, một dân tộc sẽ đứng chờ suốt giai đoạn 3, trái với cả hai nguồn và với lời dẫn của giai đoạn 3.
  2. 2 000 và 4 000 không chia được thành hai khối trước sau ngang nhau; một khối 2 000 người đứng trước khối 4 000 người sẽ mỏng hẳn.
  3. Cú vòng ra sau lưng vẫn dễ thấy: ở giai đoạn 4 hai khối đi nối nhau (khối Gaul trước, khối Iberia sau); ở giai đoạn 5–6 lại đứng cạnh nhau ở lưng các quân đoàn, như trước.
- **Kỵ binh Iberia sát sông (phía tây), kỵ binh Gaul phía trong (phía đông).** Nguồn không nói. Chọn vậy để hai khối giữ thứ tự trái phải suốt trận, không cắt đường nhau: khối phía trong gần cánh bên kia hơn nên dẫn đầu cú vòng ở giai đoạn 4 và nhận chỗ phía đông ở lưng quân La Mã; khối sát sông theo sau và nhận chỗ phía tây. Trước T-049, khối hàng trước (khối đánh bên sông) cũng đi đầu và đứng phía đông.
- **Bề ngang theo quân số:** mỗi khối một phần mặt trận tỉ lệ với số người (một phần ba và hai phần ba), cách nhau 4 m, cùng chiều sâu, nên hai khối dày như nhau. Chiều sâu 100 m từ đầu trận tới mốc 3 (trước: hai khối sâu 50–60 m, tâm cách nhau 70–80 m), 60 m ở mốc 5–6 như trước. Ở mốc 4, khi hai khối đi nối nhau, khối Gaul sâu 80 m, khối Iberia hẹp lại còn 240 m.
- **Id và tên khối:** `hasdrubal-cavalry-front` thành `iberian-cavalry`, `hasdrubal-cavalry-rear` thành `gallic-cavalry`, theo kiểu `roman-cavalry`, `allied-cavalry`. Tên: "Iberian cavalry (Hasdrubal)" / "Kỵ binh Iberia (Hasdrubal)" và "Gallic cavalry (Hasdrubal)" / "Kỵ binh Gaul (Hasdrubal)". Mũi tên và lời dẫn không nhắc id khối.
- **Lời dẫn không sửa.** Câu duy nhất nói kỵ binh Iberia và Gaul như một khối nằm ở giai đoạn 3 ("kỵ binh Iberia và Gaul của Hasdrubal đâm thẳng vào kỵ binh La Mã"). Với hai khối đứng cạnh nhau, cả hai cùng đâm vào, nên câu vẫn đúng. Các giai đoạn khác chỉ nói "Hasdrubal" hay "kỵ binh của Hasdrubal".
- **Thương vong** (Polybius 3.117: 200 kỵ binh, không chia theo dân tộc). Kỵ binh Numidia vẫn mất 40 như trước; 160 người còn lại của cánh trái chia theo bề ngang đang chạm địch, làm tròn tới bội của 20 (một hình lính). Giai đoạn 3: Iberia 20, Gaul 60 (chạm kỵ binh La Mã khoảng 80 m và 225 m). Giai đoạn 6: Iberia 20, Gaul 60 (một phần ba và hai phần ba mặt trận đánh triarii). Iberia 2 000 → 1 980 → 1 960; Gaul 4 000 → 3 940 → 3 880. Trước T-049: hàng trước mất 80 rồi 20, hàng sau mất 60. Đây là giả định.

### Vị trí

Tâm (x, y), bề ngang × chiều sâu (m). Trước T-049, hàng trước đứng phía đông ở mốc 5–6.

| Mốc | Trước: hàng trước / hàng sau, mỗi khối 3 000 | Sau: `iberian-cavalry` | Sau: `gallic-cavalry` |
|---|---|---|---|
| Đầu trận | (−2850, −635) / (−2850, −705); 210 × 50 | (−2967,7, −660); 68,8 × 100 | (−2790,7, −660); 138,8 × 100 |
| 1 | (−1150, −255) / (−1150, −325); 350 × 50 | (−1267,7, −280); 114,7 × 100 | (−1090,7, −280); 231,3 × 100 |
| 2 | (−1100, 14,3) / (−1100, −55); 400 × 50 | (−1234,3, −10,7); 131,3 × 100 | (−1032,3, −10,7); 264,7 × 100 |
| 3 | (−1100, 89,3) `fight` / (−1100, 10) `advance`; 350 × 60 | (−1217,7, 69,3); 114,7 × 100; `fight` | (−1040,7, 69,3); 231,3 × 100; `fight` |
| 4 | (300, 420) / (−50, 470); 350 × 60; hướng 95 | (−50, 470); 240 × 60; hướng 95 | (300, 420); 350 × 80; hướng 95 |
| 5 | (87,7, −33,3) / (−209,7, −33,3); 293,3 × 60 | (−258,9, −33,3); 194,9 × 60 | (38,4, −33,3); 391,8 × 60 |
| 6 | (43,5, −157,4) / (−163,5, −157,4); 202,9 × 60 | (−197,6, −157,4); 134,6 × 60 | (9,3, −157,4); 271,2 × 60 |

- Đầu trận và mốc 1 sửa tay. Mốc 1 giữ đúng mặt trận cũ (x từ −1325 tới −975, mép trước ở y = −230). Đầu trận dời theo véc-tơ chung của quân Hannibal (−1700, −380) và hẹp còn 60% bề ngang, như mọi khối khác (mục 9), nên khối Iberia chìa ra phía tây 47 m so với trước; vẫn không đứng trong nước sông.
- Mốc 2–6 do `scripts/battles/cannae-lines.mjs` dựng (hàm `horseSideBySide`, hằng `IBERIAN_HORSE`, `GALLIC_HORSE`).
- Mũi tên của giai đoạn 5 dời theo tâm mới: điểm cuối (90, 20) thành (40, 20) và (−210, 20) thành (−260, 20). Các mũi tên khác vẽ đường đi của cả cánh, giữ nguyên.

### Kiểm tra

- `npm run validate` qua, không có cảnh báo. Kiểm tra `fight` qua ở giai đoạn 3 và 6 cho cả hai khối, ở mốc đầu lẫn mốc cuối, với ít nhất một nửa mặt trận chạm địch (dưới một nửa thì có cảnh báo).
- `check-overlap.mjs --min 0.04`: in ra y hệt trước T-049; không cặp nào có hai khối kỵ binh này.
- `check-facing.mjs`: thêm một dòng, khối Iberia ở giai đoạn 4 đi ngang 26% thời gian. Khối hàng sau trước đây 21%, dưới ngưỡng 25%; khối Iberia bắt đầu ở đầu sát sông, xa hơn về phía tây. Cùng kiểu với dòng đã có của khối dẫn đầu (Gaul 31%, trước 32%): đi về đông bắc trong khi quay mặt từ bắc sang đông (mục 10, "Còn đi xiên, có chủ ý"). Giai đoạn 1 như trước; giai đoạn 5 Iberia 75%, Gaul 82% (trước 68% và 77%).
- Đo bằng code của cảnh (`main-tools/melee/pairs.mjs` của phiên chính), mỗi 1/4 giai đoạn, số người đầu hàng đang đánh trên số người đầu hàng:

| Khối | Giai đoạn 3 | Giai đoạn 6 |
|---|---|---|
| Trước: hàng trước | 38/38, 37/38, 30/38, 25/38 | 30/30, 26/30, 28/30, 22/30, 15/30 |
| Trước: hàng sau | (không đánh) | 25/25, 25/25, 22/25, 20/25, 15/25 |
| Sau: kỵ binh Iberia | 12/12, 12/12, 11/12, 8/12 | 17/17, 17/17, 15/17, 14/17, 7/17 |
| Sau: kỵ binh Gaul | 23/23, 23/23, 21/23, 16/23 | 40/40, 38/40, 36/40, 28/40, 22/40 |

Giai đoạn 3: 35 người đầu hàng đánh kỵ binh La Mã (trước 38), giờ của cả hai dân tộc; kỵ binh La Mã không đổi (27/30, 24/30, 24/30, 15/30). Giai đoạn 6: 57 người (trước 55); triarii gần như không đổi.

### Xem trong cảnh

`/battle-lab`, dev server ở cổng 3149. Ảnh trước và sau ở `E:\World_History_Platform_assets\duyet\T-049\`, chụp bằng driver của phiên chính (`main-tools/drive/drive.mjs`, cổng 9362) với kịch bản `s-t049.mjs` (chép vào cùng thư mục), mỗi cặp cùng thời điểm và cùng góc nhìn:

| Ảnh | Thời điểm | Góc |
|---|---|---|
| `01-dan-tran` | Cuối giai đoạn 1 | Cánh trái của Hannibal, từ phía bắc |
| `02-giua-giai-doan-3` | Giữa giai đoạn 3 | Trận kỵ binh bên sông, từ phía đông nam |
| `03-giua-giai-doan-3-can-canh` | Giữa giai đoạn 3 | Cận cảnh; khối Gaul là hình tạm |
| `04-giua-giai-doan-4` | Giữa giai đoạn 4 | Hai khối vòng ra sau lưng quân La Mã |
| `05-cuoi-tran` | Cuối giai đoạn 6 | Lưng các quân đoàn, từ phía bắc |

Console không có lỗi. Khối Gaul vẽ hình tạm theo màu phe tới khi có `gallic-cavalry.glb` (T-050).

### Còn lại

- Con số 2 000 / 4 000 mới thấy trên Wikipedia, chưa đối chiếu được với sách nào. Nếu đọc được Daly (2002) hay Goldsworthy (2001), nên xem lại mục này cùng bảng chia quân ở mục 5.
- Chỗ đứng (kỵ binh Iberia sát sông) là lựa chọn, không có nguồn.
- Livy 22.48.5–6 đưa kỵ binh Iberia và Gaul tới hợp sức với lính châu Phi, còn Polybius 3.116 cho Hasdrubal đánh vào lưng các quân đoàn. Cảnh theo Polybius, như trước.

## 19. Kỵ binh Hasdrubal xông qua lưng các quân đoàn (T-059, đợt L)

Từ đợt L, kỵ binh gặp bộ binh có thể phi xuyên qua thay vì dừng lại đấu từng cặp (hành động `overrun`; `docs/ARCHITECTURE.md`, mục "Kỵ binh xông qua"). Trong trận này chỉ có một chỗ kỵ binh đánh giáp lá cà với bộ binh: kỵ binh Iberia và kỵ binh Gaul của Hasdrubal đánh hàng triarii ở giai đoạn 6. Các trận kỵ binh khác đều là ngựa đấu ngựa (giai đoạn 3, bên sông) hay đánh từ xa (kỵ binh Numidia, giai đoạn 3–4), nên giữ nguyên.

### Nguồn đã đọc lại (2026-11-20)

| Nguồn | Đọc ở đâu | Nói gì |
|---|---|---|
| Polybius 3.116 | Bản Paton, LacusCurtius (mục 1) | Hasdrubal thấy kỵ binh Numidia đủ sức lo kỵ binh đồng minh, liền giao việc đó cho họ, rồi dẫn các đội kỵ binh của ông tới chỗ bộ binh đang đánh để giúp lính châu Phi. Ông đánh vào lưng các quân đoàn, **xung phong nhiều lượt, ở nhiều chỗ cùng một lúc**; lính châu Phi phấn chấn, quân La Mã nao núng. Sau đó các hàng ngoài cứ ngã dần, số còn lại bị dồn vào giữa, bị vây, và bị giết tại chỗ |
| Polybius 3.115; Livy 22.47 | Như mục 18 | Trận kỵ binh bên sông: không có chỗ xoay trở, hai bên xuống ngựa đánh bộ. Ngựa đấu ngựa, không thuộc phần này |
| Livy 22.48 | Bản Latin, The Latin Library; bản Roberts | Hasdrubal sai kỵ binh Numidia đuổi người chạy trốn, còn người Iberia và người Gaul thì đưa tới hợp sức với lính châu Phi (bản chép tay ghi bộ binh, *pedites*; mục 18). Livy không tả họ đánh thế nào. 500 kỵ binh Numidia giả hàng rồi đánh vào lưng hàng quân La Mã cũng ở chương này (mục 6: không vẽ) |
| Livy 22.49 | Như trên | Paullus ngồi trên ngựa tới khi kiệt sức, rồi quân hộ vệ xuống ngựa đánh bộ. Không chỗ nào tả người cưỡi phi xuyên qua bộ binh |

Tóm lại: chỉ Polybius tả cách kỵ binh Hasdrubal đánh: **xung phong nhiều lượt, ở nhiều chỗ cùng lúc**, vào lưng các quân đoàn. Không nguồn nào nói kỵ binh dừng lại đấu với hàng sau của quân La Mã, và cũng không nguồn nào nói họ phi xuyên qua hàng ngũ. Cảnh vẽ `overrun` thành những vòng phi vào, quay lại, phi vào lần nữa, nên gần lời Polybius hơn `fight` (đứng tại chỗ đấu từng cặp). Phần "xuyên qua" là cách cảnh vẽ, như ARCHITECTURE đã nói: tư liệu chỉ nói kỵ binh đánh vào đâu.

### Đã đổi

| Giai đoạn | Khối | Trước | Sau | Lý do |
|---|---|---|---|---|
| 6 | `iberian-cavalry`, `gallic-cavalry` | `fight` | `overrun` | Polybius 3.116, như trên |
| 6 | `triarii` | `fight` | `stand` | Mặt trước của triarii (mặt sau của cái hộp, mục 11) chỉ nhìn ra hai khối kỵ binh này. Kỵ binh không đứng lại đấu, nên `fight` không còn đối thủ, và `npm run validate` sẽ báo lỗi. `stand` là đứng giữ hàng, mặt quay ra phía kỵ binh, hợp với lời Polybius: quân La Mã chống cự tới khi các hàng ngoài ngã. Không chọn `retreat` hay `rout`, vì Polybius nói họ bị giết tại chỗ |

Không đổi: vị trí, quân số, thương vong, mũi tên và lời dẫn. Lời dẫn giai đoạn 6 vốn đã viết kỵ binh của Hasdrubal "liên tục xung phong vào lưng quân La Mã". Hai khối ở hai sườn (principes, bộ binh đồng minh hàng sau) vẫn `fight` với lính Libya. Ngựa chạy vào đầu phía trong của hai khối này thì xô ngã người, rồi người đó gượng dậy; người chết vẫn là người đầu hàng dọc đấu với lính Libya.

**Không khựng:** giai đoạn 5 kết thúc bằng `charge` tới lưng quân La Mã. Đường đi trong giai đoạn 5 lệch hướng mặt ở mốc 5 là 22° (kỵ binh Iberia) và 30° (kỵ binh Gaul), dưới ngưỡng 45° của cảnh. Vì vậy sang giai đoạn 6, người cưỡi phi tiếp vào hàng triarii với tốc độ đang có (khoảng 21–22 m mỗi giây phát), rồi tăng dần lên tốc độ phi.

### Kiểm tra

- `npm run validate`: qua, không cảnh báo. Ở cả mốc 5 lẫn mốc 6, 21 trên 21 điểm của mép trước mỗi khối kỵ binh có triarii ngay phía trước (đo bằng `frontOnFoot` của cảnh, cùng phép thử với validate).
- Engine của cảnh chạy bằng Node (`overrun.ts`, `timeline.ts`; script `tools/check-data.mjs` trong thư mục ảnh, sửa từ `main-tools/overrun/check.mjs` của phiên chính để đọc file trận như đang có):
  - Kỵ binh Iberia: 99 trên 100 hình phi vòng (hình còn lại đã ngã ở giai đoạn 3), mỗi người khoảng 3,2 vòng. Kỵ binh Gaul: 197 trên 200 (3 hình đã ngã ở giai đoạn 3), 3,3 vòng. Không người cưỡi nào còn sống mà đứng yên.
  - Mọi người cưỡi phi tiếp từ cú xung phong của giai đoạn 5 (21,8 và 20,9 m mỗi giây phát); không ai xuất phát từ chỗ đứng.
  - Tốc độ phi tối đa 32 m mỗi giây phát (clip phi nước đại: 38,2); đoạn thẳng dài nhất 141 m; bộ binh phía trước sâu tới 90 m. Bước lớn nhất giữa hai khung hình (60 khung/giây) là 34 m/s, tức không ai nhảy chỗ; hai người cưỡi ngã giữa vòng thì nằm lại chỗ ngã.
  - Cả 195 hình triarii ngã trong giai đoạn 6 đều ngã lúc có ngựa trong vòng 4,5 m: người chết của triarii là người bị ngựa xô. Triarii bị xô ngã 395 lần và bị chém lúc đang đứng 157 lần, trên 170 trong 210 hình.
  - Ngựa còn xô ngã người ở đầu phía trong của hai sườn (principes 101 lần, bộ binh đồng minh hàng sau 173) và lính nhẹ trong lòng hộp (lính nhẹ La Mã 30, lính nhẹ đồng minh 28). Trước đây lính nhẹ chết ngẫu nhiên, không ai đánh (mục 11, "Còn lại"); nay 54 trên 185 hình lính nhẹ La Mã và 41 trên 150 hình lính nhẹ đồng minh ngã lúc có ngựa ở gần.
- Giáp lá cà của các khối khác không đổi (`tools/pairs.mjs`, sửa từ `main-tools/melee/pairs.mjs`: số người đầu hàng dọc có đối thủ, mỗi 1/4 giai đoạn 6). Giống hệt trước, trừ lính Libya phải ở đầu giai đoạn (25/29 thành 24/29). Triarii và hai khối kỵ binh không còn trong bảng vì không `fight`.
- Xem trong cảnh (`/battle-lab?battle=battle-of-cannae`, dev server): người cưỡi phi vòng qua hàng triarii; triarii ngã khi ngựa tới, người không đến lượt chết thì gượng dậy; không khối nào đánh vào khoảng không; không người cưỡi nào đứng yên.
- Ảnh trước (A) và sau (B) ở `E:\World_History_Platform_assets\duyet\T-059\`, chụp bằng driver của phiên chính (`main-tools/drive/drive.mjs`, cổng 9362) với kịch bản `tools/s-t059.mjs`, mỗi cặp cùng thời điểm và cùng góc nhìn:

| Ảnh | Thời điểm | Góc |
|---|---|---|
| `01-cannae-dau-giai-doan-6` | Đầu giai đoạn 6 (12:38) | Lưng quân La Mã, từ phía bắc |
| `02-cannae-giua-giai-doan-6` | 14:18 | Như trên |
| `03-cannae-can-canh` | 14:23 | Cận cảnh triarii và lính nhẹ |
| `04-cannae-dang-phat-00` tới `-05` | Đang phát, từ ngay trước mốc 5 | Kỵ binh đi tiếp từ cú xung phong vào hàng triarii |

- **Khung hình/giây** (`tools/s-t059-fps.mjs`): trang thử ở 1280×800, GPU rời, góc nhìn rộng 400 m từ phía bắc. Mỗi lượt phát 5 giây từ t = 5,02 (đầu giai đoạn 6) và từ t = 5,5 (giữa giai đoạn). Khung được đếm với một lệnh `readPixels` mỗi khung, để mỗi khung phải chờ GPU; p99 tính theo đồng hồ thật. Hai bản (trước, sau) chạy xen kẽ trên cùng máy, cùng một dev server. Blender của một phiên khác chạy từng đợt trên máy; cột Blender ghi nó có đang chạy lúc lượt đo kết thúc hay không. Lượt 5 chỉ có bản sau: Claude Code dừng lượt đo vì máy thiếu bộ nhớ.

| Lượt | Bản | Blender | Đầu giai đoạn 6: khung/giây (p99) | Giữa giai đoạn 6 |
|---|---|---|---|---|
| 1 | sau | có | 54,8 (24,2 ms) | 56,8 (21,4 ms) |
| 1 | trước | không | 60,4 (20,9 ms) | 62,4 (18,7 ms) |
| 2 | sau | không | 59,0 (22,8 ms) | 62,5 (19,8 ms) |
| 2 | trước | có | 56,3 (21,9 ms) | 56,1 (21,1 ms) |
| 3 | sau | có | 40,3 (50,1 ms) | 43,3 (54,8 ms) |
| 3 | trước | không | 57,6 (22,8 ms) | 62,4 (19,8 ms) |
| 4 | sau | có | 42,6 (47,3 ms) | 32,9 (64,4 ms) |
| 4 | trước | có | 54,8 (23,0 ms) | 54,8 (21,3 ms) |
| 5 | sau | có | 54,2 (24,7 ms) | 54,7 (22,5 ms) |

  - Khi không có Blender, hai bản như nhau: bản sau 59,0 và 62,5; bản trước 57,6–60,4 và 62,4.
  - Khi có Blender: hai lượt bản sau (1, 5) ngang hai lượt bản trước (54–57). Hai lượt bản sau khác (3, 4) chỉ còn 33–43, p99 47–64 ms.
  - Tôi không tách được phần do Blender (lúc nặng lúc nhẹ) và phần có thể do bản mới. Nên đo lại khi máy rảnh.

### Còn lại

- `scripts/battles/cannae-lines.mjs` vẫn ghi `fight` cho ba khối này ở mốc 6. Chạy lại script với `--write` sẽ xoá thay đổi này. Đề nghị sửa bảng `STATES` của script (ngoài phạm vi T-059, ghi ở file task).
- Clip `knockdown` (T-057) chưa có trong mô hình: bộ binh bị xô ngã theo clip `die`, nằm một lát, rồi gượng dậy bằng chính clip đó phát ngược.
- Người cưỡi đi sâu tới 90 m (giới hạn của cảnh), qua hàng triarii (sâu 40 m) vào cả đám lính nhẹ trong lòng hộp. Nguồn không nói kỵ binh vào sâu tới đâu.
