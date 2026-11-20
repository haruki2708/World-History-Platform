# Trận hồ Trasimene (217 TCN): căn cứ dữ liệu

Cập nhật: 2026-11-20 (T-059, kỵ binh Gaul xông qua velites quân đoàn II ở giai đoạn 3–4: mục 13; T-051, chặng 0 của đợt K; T-052, chặng 1). File trận: `src/data/battles/battle-of-lake-trasimene.json` (T-052; khối `terrain` nháp `trasimene-terrain.json` của T-051 đã xoá, file trận thay nó). Cách đặt khối quân trong file trận: mục 12. Lưới độ cao: `public/data/terrain/battle-of-lake-trasimene.bin` và `battle-of-lake-trasimene-far.bin`, dựng bằng `scripts/battles/build-terrain.mjs --battle battle-of-lake-trasimene`.

Tài liệu này ghi nguồn đã đọc, vị trí đã chọn và lý do, bảng đơn vị và các giai đoạn đề nghị cho chặng 1, cảnh vật kèm mức căn cứ, và những gì hợp đồng (`src/lib/battle.ts`) chưa tả được. Cách trình bày theo `cannae.md`.

## 1. Nguồn đã đọc

Đọc ngày 2026-11-19.

| Nguồn | Đọc ở đâu | Dùng cho |
|---|---|---|
| Polybius, *Histories* 3.77–86 (bản dịch Loeb của W. R. Paton) | [LacusCurtius](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/3*.html) | Đường hành quân, địa thế, bố trí phục kích, sương, diễn biến, thương vong |
| Polybius, *Histories* 6.40 (cùng bản dịch) | [LacusCurtius](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/6*.html) | Thứ tự hành quân của một đạo quân La Mã (mục 5) |
| Livy, *Ab Urbe Condita* 22.1–7 (bản Latin) | [The Latin Library](https://www.thelatinlibrary.com/livy/liv.22.shtml) | Địa thế, phục kích, sương, Flaminius tử trận, số người chạy thoát |
| Livy 22 (bản dịch Roberts) | [Wikisource](https://en.wikisource.org/wiki/From_the_Founding_of_the_City/Book_22) | Đối chiếu với bản Latin; có hai chỗ dịch thiếu hoặc sai (dưới đây) |
| Ovid, *Fasti* 6.763–770 (bản Latin) | [The Latin Library](https://www.thelatinlibrary.com/ovid/ovid.fasti6.shtml) | Ngày của trận theo lịch La Mã (mục 6) |
| C. F. Konrad, "Das Datum der Schlacht am Trasumenischen See", *Rheinisches Museum* 166 (2023) 312–313 | [journals.ub.uni-koeln.de](https://journals.ub.uni-koeln.de/index.php/rhm/article/download/12275/12279/25835) | Ngày theo lịch La Mã và các ước lượng độ lệch của lịch năm 217 (mục 6) |
| L. Borgia và cộng sự, "First results of waterborne geophysical surveys around the Malpasso site (Tuoro sul Trasimeno, Italy)", kỷ yếu GNGTS 2013, tr. 186–188 | [gngts.ogs.it](https://gngts.ogs.it/atti/GNGTS2013/1049/) (ba trang 1048–1050) | Mực nước hồ thời cổ, lối hẹp Malpasso, vị trí trận (mục 3, 4) |
| Bài "Battle of Lake Trasimene" | [Wikipedia tiếng Anh](https://en.wikipedia.org/wiki/Battle_of_Lake_Trasimene) | Chỉ để tham khảo ước lượng hiện đại về quân số. Không chép nội dung |
| Bài "Battaglia del lago Trasimeno", mục "Identificazione del sito della battaglia" | [Wikipedia tiếng Ý](https://it.wikipedia.org/wiki/Battaglia_del_lago_Trasimeno) | Tóm tắt các giả thuyết về vị trí (mục 3). Không chép nội dung |

Mọi tiêu đề, lời dẫn và ghi chú trong file trận sẽ tự viết. Chỉ dẫn link, không chép văn bản.

**Bài học ở T-045:** điều gì chỉ thấy trên Wikipedia thì không ghi tên tác giả, vì không kiểm được với sách. Tài liệu này nêu tên Brizzi và Gambini (2008) và Cattuto và cộng sự (2011) vì bài GNGTS 2013, tôi đọc trực tiếp, dẫn họ; các chi tiết của từng giả thuyết chỉ thấy trên Wikipedia tiếng Ý thì ghi là "theo Wikipedia tiếng Ý", không gắn tên người.

### Đối chiếu bảng của phiên chính trong T-051

Bảng tóm tắt trong file task đúng ở phần lớn các dòng. Những chỗ cần sửa hoặc thêm:

| Dòng | Bảng ghi | Sửa |
|---|---|---|
| Địa thế, Livy | "một khoảng bằng nhỏ có đồi hai bên" | Đây là cách dịch của Roberts. Bản Latin 22.4.2: *via tantum interest perangusta…; deinde paulo latior patescit campus; inde colles adsurgunt*: chỉ có một lối rất hẹp, rồi một khoảng đất bằng rộng hơn một chút mở ra, rồi các đồi nhô lên. Không có chữ "hai bên" |
| Người Phi và Iberia, Livy | "ở khoảng đất bằng nhỏ nơi Hannibal đóng trại" | 22.4.3: *ibi castra in aperto locat*: đóng trại **ở chỗ trống, nhìn thấy được**, nơi các đồi nhô lên ở cuối khoảng đất bằng. Quân La Mã chỉ thấy toán địch trước mặt này (22.4.4) |
| Quân La Mã vào, Livy | "vào lối hẹp không cho trinh sát đi trước" | Thêm: *angustiis superatis, postquam in patentiorem campum pandi agmen coepit* (22.4.4): đã qua chỗ hẹp, đoàn quân bắt đầu dàn ra ở khoảng đất bằng rộng hơn thì mới thấy địch |
| Sương, Polybius | "84.13: sương tan sau trận" | 84.13 nói cụ thể hơn: sương tan lúc toán 6 000 người lên tới đỉnh đồi |
| Dồn xuống hồ, Livy | "lội tới vai" | Đúng; bản Latin 22.6.6 còn có *per prima vada paludis*: đi qua chỗ nước nông đầu tiên **của đầm**. Bản Roberts bỏ chữ "đầm". Mép hồ là đầm nông (mục 8) |
| Toán 6 000, Livy | "hôm sau hàng Maharbal" | Thêm: Maharbal đuổi theo **trong đêm với toàn bộ kỵ binh** (22.6.11). Polybius 3.84.14 lại nói Maharbal đem lính Iberia và lính giáo đi vây làng. Hai nguồn khác nhau |
| Thương vong, Livy 22.7 | "số người chạy tản mát: xem ghi chú" | **10 000.** Bản Latin 22.7.2: *decem milia sparsa fuga per omnem Etruriam… urbem petiere*. Bản Roberts trên Wikisource ghi "1000": lỗi của bản đó. Livy nói ông theo Fabius Pictor, người cùng thời (22.7.4) |
| Ngày tháng | Polybius, Livy không cho ngày | Đúng. Ngày duy nhất có trong nguồn cổ là của Ovid (mục 6) |
| Quân số La Mã | không cho | Đúng, nhưng suy được một mức dưới (mục 5) |

Những chi tiết khác trong nguồn, không có trong bảng của task:

- Polybius 3.82.9: Hannibal tiến về phía Roma qua Etruria, **thành Cortona và các đồi của nó bên trái, hồ bên phải**. Tức là đi dọc bờ bắc hồ, về phía đông.
- Polybius 3.82.3, 3.82.10: Hannibal đốt phá vùng quê trên đường để khiêu khích; "khói bốc lên khắp nơi". Livy 22.4.1: ông tàn phá vùng đất giữa Cortona và hồ.
- Polybius 3.82.8: theo sau đạo quân La Mã là một đám người đi kiếm của cướp, đông hơn cả quân lính, mang theo xích và cùm.
- Polybius 3.79.12: Hannibal qua đầm lầy trên con voi cuối cùng còn sống. Nguồn không nói con voi có mặt ở trận.
- Polybius 3.85.1: số tù binh, gồm cả những người đầu hàng có điều kiện, là hơn 15 000.
- Polybius 3.85.5: Hannibal chôn khoảng 30 người có địa vị cao nhất trong số người chết của mình.

## 2. Hệ toạ độ

- **Gốc toạ độ** `origin` = 12,055 Đ, 43,200 B: giữa đồng bằng ven hồ phía tây Tuoro, cách bờ hồ ngày nay khoảng 1 km. Bản đồ bay tới khung của lưới địa hình (mục 9), không phải tới điểm này.
- Đổi kinh vĩ độ ra mét như Cannae: mặt phẳng tiếp xúc tại gốc, bán kính cong của elipxoit WGS84 ở vĩ độ gốc: 111 097 m mỗi độ vĩ, 81 276 m mỗi độ kinh.
- Toạ độ sự kiện trong `events.json` (12,07 Đ, 43,2 B) nằm ở x = 1 219, y = 0: giữa đồng bằng, ngay dưới đồi Tuoro.
- Vị trí các địa danh ngày nay, tra bằng công cụ tìm địa danh của OpenStreetMap (Nominatim) **chỉ để định hướng**; điểm địa danh trong dữ liệu lấy từ chính lưới độ cao (đỉnh đồi, chỗ hẹp), không chép dữ liệu OSM:

  | Nơi | x, y (m) |
  |---|---|
  | Tuoro sul Trasimeno (thị trấn) | 1 594, 761 |
  | Borghetto (làng ở góc tây bắc hồ) | −2 525, −1 459 |
  | Sanguineto (xóm ở đầu thung lũng) | −148, 2 009 |
  | Núi Gualandro (điểm OSM, trên sườn đông nam) | −1 364, 592 |
  | Núi Castelluccio | 2 547, 3 799 |
  | Đảo Maggiore | 2 957, −2 741 |
  | Passignano sul Trasimeno | 6 651, −1 695 |
  | Cortona (ngoài lưới chính) | −5 689, 8 332 |

## 3. Vị trí trận đánh

**Đây là chỗ còn tranh cãi.** Nguồn cổ chỉ tả địa thế, không đặt tên nơi nào ngoài hồ và Cortona.

### Nguồn tả gì

- Polybius 3.82.9: đi từ Cortona về phía Roma, đồi bên trái, hồ bên phải: bờ bắc.
- Polybius 3.83.1: con đường chạy qua một dải đất bằng hẹp, dọc hai bên có đồi cao; phía trước có một đồi dốc, khó leo, chắn ngang; phía sau là hồ, và lối vào giữa hồ với sườn đồi rất hẹp.
- Polybius 3.83.2–4: Hannibal chiếm đồi phía trước, đóng trại ở đó với lính Iberia và châu Phi; lính ném đá và lính giáo đi vòng lên phía đầu, dàn hàng dài dưới các đồi bên phải; kỵ binh và người Celt vòng qua các đồi bên trái, dàn liền dưới chân đồi, toán cuối ở ngay lối vào, giữa sườn đồi và hồ.
- Livy 22.4.1–3: chỗ các núi của Cortona xuống sát hồ Trasimene nhất; một lối rất hẹp, rồi khoảng đất bằng rộng hơn một chút, rồi đồi; trại của Hannibal ở chỗ trống nhìn thấy được, chỉ có người châu Phi và Iberia; lính Baleares và lính nhẹ được dẫn vòng ra sau các núi; kỵ binh ở ngay cửa lối hẹp, nấp sau những gò đất.

"Phải" và "trái" ở Polybius 3.83.3–4 không nói rõ là nhìn từ phía nào. Nhìn từ đoàn quân La Mã đi về phía đông thì bên trái là đồi (bắc), bên phải là hồ (nam), nên "dưới các đồi bên phải" khó hiểu theo nghĩa đen. Các phỏng dựng đọc câu này mỗi người một khác.

### Các giả thuyết chính

Theo bản tóm của Wikipedia tiếng Ý (mục "Identificazione del sito della battaglia"), các giả thuyết cách nhau tới 20 km. Bốn nhóm:

1. **Thung lũng Sanguineto và đồng bằng Tuoro.** Lối hẹp là Malpasso, chỗ sườn núi Gualandro xuống sát hồ, gần Borghetto; vào trong là khoảng đất bằng Sanguineto–Tuoro, chắn phía đông bởi đồi Tuoro. Theo Wikipedia tiếng Ý, cách đọc này có từ bản đồ thế kỷ 16, và phần lớn các địa danh dân gian gắn với trận (như "Sanguineto") nằm quanh Tuoro. Bài GNGTS 2013 (đọc trực tiếp) viết rằng nhiều phỏng dựng đặt trận ở vùng này, nhất là ở đồng bằng Tuoro, và một nghiên cứu năm 2008 của Brizzi và Gambini coi đây là vị trí khả dĩ nhất, dựa trên chứng cứ mới về mực nước hồ và cách đọc lại nguồn.
2. **Cả thung lũng ven hồ phía bắc, từ núi Gualandro tới Montigeto** (phía đông Tuoro). Trại của Hannibal ở Montigeto hoặc trên đồi Tuoro; quân La Mã đi dọc hồ khoảng 6 km. Theo Wikipedia tiếng Ý, cách đọc này bị phê bình vì phục binh phải trải gần 10 km, bị mỏm Tuoro cắt đôi.
3. **Dải đất hẹp giữa Passignano và Montecolognola** (bờ đông bắc). Dựa trên giả định nước hồ thời đó cao hơn, làm ngập lối Malpasso, nên quân phải đi đường khác. Theo Wikipedia tiếng Ý, các khảo sát về mực nước sau này không ủng hộ giả định đó.
4. **Thung lũng Val di Chiana gần Cortona**, dọc suối Esse, cách xa hồ. Theo Wikipedia tiếng Ý, giả thuyết này khó khớp với nguồn.

### Giả thuyết đã chọn

**Thung lũng Sanguineto và đồng bằng Tuoro, lối hẹp ở Malpasso.** Lý do:

1. Khớp Livy 22.4.1: "chỗ núi xuống sát hồ nhất". Đo trên lưới độ cao: ở Malpasso, đất cao hơn mặt hồ 15 m chỉ cách bờ ngày nay **45–110 m** (x ≈ −650 tới −100, y ≈ −1 300 tới −1 050). Dọc bờ hồ trong lưới không có chỗ nào hẹp hơn; chỗ hẹp kế tiếp là một gò nhỏ đứng riêng ở Borghetto (100 m).
2. Khớp trình tự của Livy 22.4.2–4: lối rất hẹp (Malpasso), rồi khoảng đất bằng rộng hơn (đồng bằng ven hồ, khoảng 2 km theo hướng đông–tây, 2–2,5 km từ bờ tới chân đồi, cao 255–280 m), rồi đồi (đồi Tuoro chắn phía đông, đỉnh 343 m). Đồi Tuoro chạy bắc–nam, cắt ngang đường đi về phía đông: "đồi dốc chắn ngang phía trước" của Polybius 3.83.1.
3. Khớp Polybius 3.83.4: toán cuối của quân phục kích bên trái đứng "ngay lối vào, giữa sườn đồi và hồ". Ở Malpasso có một gò cao 381 m trên mỏm núi (x −740, y −375), ngay sau lối hẹp: chỗ nấp hợp với "những gò đất" của Livy 22.4.3.
4. Đây là giả thuyết bài GNGTS 2013 coi là hiện hành, và cũng là cách Wikipedia tiếng Anh tả trận (bờ bắc, trại của Hannibal ở chỗ đồi xuống gần hồ nhất, quân La Mã nhìn thấy trại).
5. Bằng chứng về mực nước hồ (mục 4) làm giả thuyết 3 yếu đi; giả thuyết 4 xa hồ.

Mọi địa danh, trại và vị trí các khối quân sẽ đặt `approximate: true`, và `uncertainty` của file trận nói rõ vị trí còn tranh cãi.

### Địa danh

Trong `terrain.landmarks` của file trận (T-051 ghi trong khối nháp; T-052 dời trại của Hannibal, xem bảng). Tên núi và đồi là tên ngày nay.

| Địa danh | Loại | x, y (m) | Căn cứ |
|---|---|---|---|
| Lối hẹp (Malpasso) | `other` | −450, −1 200 | Chỗ hẹp nhất giữa sườn đồi và bờ ngày nay (đo trên lưới). Polybius 3.83.1, Livy 22.4.2 |
| Núi Gualandro | `hill` | −1 640, 1 440 | Đỉnh 486 m trên lưới |
| Đồi Tuoro | `hill` | 1 326, 1 361 | Đỉnh 343 m trên lưới |
| Trại của Hannibal | `camp` | 1 290, 1 320 | Trên đồi Tuoro, nhìn xuống đồng bằng (Polybius 3.83.2: Hannibal chiếm ngọn đồi và đóng trại trên đó; Livy 22.4.3: trại ở chỗ thấy được). T-051 đặt ở 1 366, 1 090 trên sườn nam; T-052 dời khoảng 240 m lên phía bắc, vào giữa trại 550 × 550 m (mục 8) trùm cả đỉnh đồi, để toán đầu phá vây đi được sát góc đông nam trại mà không qua trại. Vị trí là giả định |
| Trại của Flaminius | `camp` | −2 700, −900 | Polybius 3.83.7: đóng trại sát hồ, rất muộn. Đặt trên đồng bằng Borghetto (259–266 m), cách lối hẹp 2,3 km. Vị trí là giả định |
| Núi Castelluccio | `hill` | 2 530, 3 809 | Đỉnh 746 m trên lưới |
| Làng Etruria | `town` | 3 140, 3 309 | Polybius 3.84.13: toán 6 000 người rút vào một làng Etruria. Theo Wikipedia tiếng Ý, người ta tìm thấy dấu vết một làng gần đỉnh núi Castelluccio; đặt trên chỗ đất ít dốc nhất cách đỉnh dưới 1,2 km (cao 601 m, chênh 8 m trên 120 m). Vị trí là giả định |

## 4. Bờ hồ và mực nước

### Nguồn nói gì

- Hồ Trasimene rất nông, đáy phẳng, không có sông thoát tự nhiên, nên từ thời cổ đã hay ngập lụt; các cửa thoát nhân tạo chỉ đỡ được một phần (GNGTS 2013).
- GNGTS 2013, dẫn Cattuto và cộng sự (2011): đồ gốm có niên đại cho thấy trong những quãng dài thời Etruria và La Mã, **nước hồ thường thấp hơn ngày nay**. Bờ hồ ngày nay chỉ để lại một lối ngắn giữa hồ và Malpasso, còn thời cổ lối này phải rộng hơn để những đạo quân lớn đi qua. Khảo sát địa chấn và điện trở trên mặt hồ gần bờ bắc thấy dưới lớp trầm tích một mặt tiếp giáp hình vòm, có thể là bờ hồ cũ (kết quả sơ bộ).
- Wikipedia tiếng Ý: các khảo sát địa chất của CNR cho thấy thời đó hồ trung bình nhỏ hơn ngày nay một chút; giả định nước cao hơn (giả thuyết 3) là sai.
- Livy 22.6.6: những người bị dồn xuống nước đi qua "chỗ nước nông đầu tiên của đầm" (*prima vada paludis*): mép hồ khi ấy là đầm nông.

### Cảnh vẽ bờ hồ ngày nay

Như task yêu cầu: cảnh vẽ bờ ngày nay và nói rõ điều đó trong `evidence` của hồ. Bờ thời cổ có lẽ nằm xa hơn ra phía hồ, tức dải đất bằng ven hồ, nhất là lối hẹp Malpasso, rộng hơn trong cảnh.

`evidence` nháp của hồ: mức `attested` (Polybius 3.82–84, Livy 22.4–6 đều nói trận ở bờ hồ), kèm ghi chú: bờ vẽ là bờ ngày nay theo dữ liệu Copernicus (đo 2010–2015), mặt nước ở 254,5 m; thời Etruria và La Mã nước hồ nhiều lúc thấp hơn nên dải đất bằng có lẽ rộng hơn một chút. Nguồn: Polybius, Livy (bản Latin), GNGTS 2013.

### Đo từ dữ liệu

- **Đường bờ** vạch từ mặt nạ nước (*water body mask*, WBM) đi kèm từng ô Copernicus (thư mục `AUXFILES` của cùng kho, cùng giấy phép): giá trị 2 là hồ. Script lấy mẫu mặt nạ trên toàn hồ mỗi 15 m, giữ mảng hồ lớn nhất, chạy đường bờ qua giữa các cạnh ô ven bờ rồi rút gọn: sai lệch tối đa 15 m trong lưới chính và 500 m quanh nó, 60 m ở phần bờ xa. Kết quả: **239 điểm**, bao cả hồ, chạy ra ngoài lưới chính (hợp đồng cho phép). Diện tích trong đường bờ 120,3 km²; bài GNGTS 2013 ghi hồ rộng khoảng 120 km².
- **Mực nước** `level` = **254,5 m**: Copernicus là mô hình bề mặt, trên mặt hồ nó cho đúng mặt nước, phẳng. Trung vị của 60 501 ô hồ trong lưới chính, cách bờ từ một ô trở lên, là 254,5 m; 5% thấp nhất và 5% cao nhất cũng là 254,5 m.
- **Độ khớp với lưới chính:** chỉ 19 điểm lưới ở ngoài đường bờ thấp hơn mặt nước + 0,5 m, đều cách bờ dưới 8 m. Trong đường bờ, các điểm cao hơn mặt nước là hai đảo và dải sát bờ mà đường rút gọn cắt qua.
- **So với mực nước chuẩn:** mực nước chuẩn của hồ (mức 0 của trạm đo) ghi trên Wikipedia là 257,33 m, cao hơn số đo trên lưới 2,8 m. Chưa rõ bao nhiêu là do hệ cao độ của Copernicus (theo mặt geoid EGM2008) khác hệ cao độ của Ý, bao nhiêu là do lúc đo nước hồ thấp. Với cảnh thì không quan trọng: cảnh chỉ cần mặt nước khớp với lưới, và 254,5 m khớp.
- **Đảo** (từ một hecta trở lên): Polvese 79,5 ha, cao tới 317 m (ngoài lưới chính); Maggiore 22,8 ha, 309 m, và Minore 6,4 ha, 290 m, cả hai **trong lưới chính**, cách bờ phía Tuoro khoảng 1–2 km, nhìn rõ từ chiến trường. Hợp đồng chưa có cách tả đảo (mục 10).
- Lệnh: `node scripts/battles/build-terrain.mjs --battle battle-of-lake-trasimene --lake out.json` ghi `level`, `outline`, các đảo và số đo vào `out.json`.

## 5. Quân số và đơn vị

### Tổng quân số (`strength`)

- **La Mã: 25 000 – 31 000** (giả định). Nguồn cổ không cho tổng. Mức trên suy từ chính nguồn: Polybius có khoảng 15 000 chết (3.84.7) và hơn 15 000 tù binh (3.85.1), tức trên 30 000; Livy, theo Fabius Pictor, có 15 000 chết, 10 000 chạy tản mát về Roma (22.7.2) và 6 000 người ở đầu đoàn quân đầu hàng hôm sau (22.6.8–11), tức khoảng 31 000. Mức dưới là ước lượng hiện đại do Wikipedia tiếng Anh nêu: bốn quân đoàn, hai La Mã và hai đồng minh, khoảng 25 000 người, kỵ binh mạnh hơn thường lệ. Số người đi theo để cướp (Polybius 3.82.8) không tính.
- **Carthage: 50 000 – 55 000** (giả định). Nguồn cổ không cho. Wikipedia tiếng Anh: thường được cho là trên 50 000; một năm sau ở Cannae, Polybius và Livy ghi 40 000 bộ binh và 10 000 kỵ binh, và theo bài đó Hannibal không được tiếp viện giữa hai trận. Cộng số mất ở Trasimene và trong năm ấy thì mức trên khoảng 55 000.

### Thương vong (`casualties`, tính số chết)

- **La Mã: 15 000.** Polybius 3.84.7 và Livy 22.7.2 cùng một số. Ngoài ra hơn 15 000 tù binh theo Polybius, 6 000 đầu hàng và 10 000 chạy thoát theo Livy. Hai nguồn không cộng lại khớp nhau; ghi trong `note`.
- **Carthage: 1 500 – 2 500.** Polybius 3.85.5: khoảng 1 500, phần lớn là người Celt. Livy 22.7.3: 2 500 chết trong trận, nhiều người chết sau vì vết thương.

### Thứ tự hành quân

Polybius 6.40.4–7 tả thứ tự hành quân thường lệ: **toán *extraordinarii*** (quân tinh nhuệ của đồng minh: một phần năm bộ binh, một phần ba kỵ binh đồng minh, Polybius 6.26) đi đầu, rồi **cánh phải đồng minh** và hành lý của họ, **quân đoàn thứ nhất** và hành lý, **quân đoàn thứ hai**, cuối cùng là **cánh trái đồng minh**; kỵ binh đi sau đơn vị của mình hoặc hai bên đoàn hành lý. Polybius 6.40.10–14 còn tả cách đi ba hàng song song khi gặp nguy trên đất trống. Wikipedia tiếng Anh nói quân La Mã có lẽ đi theo cách này ở Trasimene; nhưng đường qua lối hẹp Malpasso chỉ đủ cho một đoàn dọc, nên chọn thứ tự thường lệ, và để đoàn quân dàn rộng ra khi vào đồng bằng (Livy 22.4.4: *pandi agmen coepit*).

Toán 6 000 người phá vây ở đầu đoàn quân (Polybius 3.84.11, Livy 22.6.8) vì thế là *extraordinarii* cùng phần đầu của cánh phải đồng minh. Đây là suy luận của tôi, không nguồn nào nói thẳng.

### Đơn vị phía La Mã (đề nghị, tổng 25 000)

Theo thứ tự trong đoàn quân, từ đầu tới cuối. Chỉ dùng loại lính đã có trong `unit-types.json`. Lính nhẹ của đồng minh không có loại riêng nên gộp vào `socii-infantry`. Chia nhiều khối ngắn để đoàn quân uốn theo bờ hồ (mục 10).

| Khối | Loại | Người | Căn cứ |
|---|---|---|---|
| Toán đi đầu: *extraordinarii* | `socii-infantry` | 3 000 | Polybius 6.40.4. Cùng khối sau là toán 6 000 người phá vây |
| Cánh phải đồng minh, phần đầu | `socii-infantry` | 3 000 | Polybius 6.40.4 |
| Cánh phải đồng minh, phần sau | `socii-infantry` | 2 000 | |
| Kỵ binh đồng minh (*extraordinarii* và cánh phải) | `allied-cavalry` | 1 200 | Polybius 6.40.7: đi sau đơn vị của mình |
| Quân đoàn I: velites, hastati, principes, triarii | `roman-velites`, `roman-hastati`, `roman-principes`, `roman-triarii` | 1 200, 1 400, 1 400, 600 | Quân đoàn 4 600 bộ binh, giữa mức 4 200 và 5 000 (Polybius 6.21). Livy 22.6.4: triarii che xác Flaminius, nên chấp chính quan đi với quân đoàn |
| Kỵ binh La Mã, cùng Flaminius | `roman-cavalry` | 600 | 300 mỗi quân đoàn |
| Quân đoàn II: velites, hastati, principes, triarii | như trên | 1 200, 1 400, 1 400, 600 | |
| Cánh trái đồng minh, hai khối | `socii-infantry` | 2 400 + 2 400 | Polybius 6.40.6: đi cuối đoàn quân |
| Kỵ binh cánh trái đồng minh | `allied-cavalry` | 1 200 | |

Tổng: bộ binh đồng minh 12 800, kỵ binh đồng minh 2 400, bộ binh La Mã 9 200, kỵ binh La Mã 600: **25 000**, trong 16 khối. Cách chia là giả định của tôi sao cho tổng khớp ước lượng 25 000 và kỵ binh đồng minh nhiều hơn thường lệ; Polybius 6.26.7–8: bộ binh đồng minh thường bằng bộ binh La Mã, kỵ binh gấp ba; *extraordinarii* lấy một phần ba kỵ binh và một phần năm bộ binh đồng minh.

### Đơn vị phía Hannibal (đề nghị, tổng 50 000)

Lấy theo cách chia quân ở Cannae một năm sau (`cannae.md`, mục 5, 18), vì cùng một đạo quân và không có tiếp viện giữa hai trận; không có toán giữ trại riêng (toán Libya và Iberia đứng ở trại).

| Khối | Loại | Người | Chỗ phục kích | Căn cứ |
|---|---|---|---|---|
| Bộ binh Libya, hai khối | `libyan-infantry` | 4 000 + 4 000 | Đồi Tuoro, trước trại | Polybius 3.83.2, Livy 22.4.3: cùng Hannibal ở đồi phía trước |
| Bộ binh Iberia, hai khối | `iberian-infantry` | 4 000 + 4 000 | Đồi Tuoro | Như trên |
| Bộ binh Gaul, năm khối (T-051 đề nghị bốn khối 4 000) | `gallic-infantry` | 5 × 3 200 | Dưới các đồi phía bắc và tây bắc đồng bằng: mỏm núi trên lối hẹp, sườn đông núi Gualandro, cửa thung lũng Sanguineto, chân phía tây đồi Tuoro | Polybius 3.83.4: người Celt dàn liền dưới chân các đồi bên trái. Năm khối để mỗi khối đánh một hay hai khối La Mã nằm trên một đường thẳng (mục 12) |
| Lính ném đá Baleares | `balearic-slingers` | 2 000 | Sau mỏm Tuoro, thung lũng phía đông | Polybius 3.83.3; Livy 22.4.3: sau các núi |
| Lính giáo nhẹ | `light-spearmen` | 6 000 | Như trên | Polybius 3.83.3: "lính giáo" (*lonchophoroi*) |
| Kỵ binh Numidia | `numidian-cavalry` | 4 000 | Sườn tây nam mỏm núi Malpasso, sau các gò đất ở cửa tây lối hẹp (T-051 đề nghị sau gò 381 m: từ đó xuống lối hẹp phải vượt sườn núi) | Polybius 3.83.4, Livy 22.4.3: kỵ binh ở ngay cửa lối hẹp, nấp sau các gò đất |
| Kỵ binh Iberia | `iberian-cavalry` | 2 000 | Như trên, xa hơn về phía tây | |
| Kỵ binh Gaul | `gallic-cavalry` | 4 000 | Giữa các khối bộ binh Gaul | Livy 22.6.3: Ducarius, người giết Flaminius, là **kỵ sĩ** Insubres (người Gaul) |

Chỗ đứng của lính nhẹ theo bản tóm của Wikipedia tiếng Ý về phỏng dựng năm 2008: nấp ở thung lũng sau mỏm Tuoro, rồi ra chặn khoảng giữa đồi và bờ hồ, bịt đường thoát về phía đông. Các chỗ khác theo Polybius và Livy như trên. Cảnh phác ở ảnh `2-phuong-an-bo-tri.jpg` (mục 9).

**Không cần loại lính mới.** Có hai thứ trong nguồn mà không có loại lính: con voi cuối cùng (Polybius 3.79.12; nguồn không nói nó có mặt ở trận) và đoàn hành lý cùng đám người theo quân (Polybius 3.82.8, 6.40). Đề nghị không vẽ cả hai.

## 6. Thời gian và các giai đoạn

### Ngày trong năm (`dayOfYear`)

- **Ngày theo lịch La Mã:** Ovid, *Fasti* 6.767–768: *quintus ab extremo mense bis ille dies*, "ngày thứ mười kể từ cuối tháng" Sáu, tức *a.d. X Kal. Quinct.* Konrad (2023): theo lịch trước cải cách của Caesar ngày đó là 21 tháng 6, và hay được ghi như vậy; ông cho rằng 22 tháng 6 có khả năng hơn. Vài bản chép tay ghi *quartus* (24 tháng 6), Konrad bác. Livy và Polybius không cho ngày; Polybius 3.77.1 chỉ nói Flaminius tiến quân "đầu xuân".
- **Lịch La Mã lệch với mùa bao nhiêu** năm 217 thì chưa ngã ngũ (Konrad, chú thích 1): theo Brind'Amour (1983), lịch đi trước mặt trời nhiều nhất hai tuần, có khi không lệch; theo Derow (1976) và Fronda (2011), đi trước năm đến sáu tuần; Miltner (1943) đề nghị ba hay bốn tuần.
- **Chọn:** theo Derow và Fronda, như Cannae theo Derow (`cannae.md`, mục 6). 21–22 tháng 6 lịch La Mã lùi năm đến sáu tuần là 10–17 tháng 5 lịch Julius; lấy giữa, **14 tháng 5 năm 217 TCN (lịch Julius)**, tức **10 tháng 5** theo lịch Gregory nối ngược. Năm −216 là năm nhuận theo lịch Gregory nối ngược, nên **`dayOfYear` = 131**. Tôi chưa đọc bài của Derow, Fronda hay Brind'Amour; độ lệch lấy theo chú thích của Konrad.
- Nếu theo Brind'Amour thì ngày ra khoảng 3–18 tháng 6 Gregory (`dayOfYear` 155–169); theo Miltner thì 20–27 tháng 5 (141–148). Ở vĩ độ 43,2°, mặt trời mọc lúc 4:45 (ngày 131) hay khoảng 4:18 (ngày 169) giờ mặt trời địa phương: chênh chưa tới nửa giờ.
- Cả hai cách đều là cuối xuân, hợp với Polybius 3.77.1 và 3.78.6 (Hannibal lên đường khi thời tiết vừa đổi).

### Giờ

Theo công thức mặt trời của cảnh (`sky.ts`), ở ngày 131 và vĩ độ 43,2°: trời bắt đầu sáng (mặt trời dưới chân trời 6°) lúc 4:13, mặt trời mọc 4:45, lên cao 10° lúc 5:49, 20° lúc 6:45 (giờ mặt trời địa phương, như cảnh dùng). Nguồn: Polybius 3.83.7, "vừa rạng sáng" Flaminius dẫn tiền quân đi dọc hồ; Livy 22.4.4, "trời còn chưa sáng rõ". Livy 22.6.1: đánh nhau gần ba giờ.

### Các giai đoạn (đề nghị cho chặng 1)

`startHour` = 4,5 (4:30). Hai luật của cảnh: giai đoạn `fight` dài ít nhất 8 giây phát; khối chỉ tới chỗ địch ở cuối một giai đoạn thì giai đoạn sau mới ghi `fight`.

Bảng dưới là đề nghị của T-051, người dùng đã duyệt. **T-052 đổi ba chỗ** (lý do ở mục 12): lúc 4:30 đầu đoàn quân đã qua lối hẹp, không còn ở trại; giai đoạn 2 dài 20 giây phát thay vì 12; toán 6 000 người phá vây ở giai đoạn 4, lên chỗ cao ở giai đoạn 5, rút về làng ở giai đoạn 6.

| Giai đoạn | Bắt đầu – kết thúc | Phát (giây) | Diễn ra | Căn cứ |
|---|---|---|---|---|
| Lúc bắt đầu (`initial`) | 4:30 | | Đoàn quân La Mã đang hành quân dọc hồ: đầu đoàn đã qua lối hẹp và ở giữa đồng bằng, cuối đoàn ở ngoài cửa tây lối hẹp (T-051 đề nghị: đầu đoàn vừa ra khỏi trại). Quân Hannibal đã ở chỗ nấp | Polybius 3.83.5: dàn quân phục kích trong đêm. Polybius 3.83.7; Livy 22.4.4: qua lối hẹp khi trời còn chưa sáng rõ |
| 1. Vào lối hẹp | 4:30 – 6:00 | 25 | Đoàn quân đi dọc hồ, qua Malpasso, dàn rộng ra ở đồng bằng; đầu đoàn tới chân đồi Tuoro, chạm toán Libya và Iberia ở cuối giai đoạn. Phần lớn đoàn quân đã vào trong. Phục binh đứng yên | Polybius 3.84.1; Livy 22.4.4. Đầu đoàn đi khoảng 4,5 km trong 1,5 giờ |
| 2. Hiệu lệnh | 6:00 – 6:15 | 20 (T-051: 12) | Hannibal ra hiệu; mọi toán phục binh lao xuống cùng lúc và tới sát đoàn quân ở cuối giai đoạn; kỵ binh bịt lối hẹp sau lưng. Các khối La Mã quay về phía tiếng hò (đổi từ hàng dọc sang hàng ngang). Đầu đoàn và toán Libya, Iberia đã chạm nhau từ đầu giai đoạn nên đánh ngay (`fight`) | Polybius 3.84.1–3; Livy 22.4.6–7, 22.5.1 |
| 3. Đánh trong sương | 6:15 – 7:45 | 25 | Đánh khắp nơi (`fight`); quân La Mã bị đánh từ trước, sau và hai bên, phần lớn chưa kịp dàn trận | Polybius 3.84.3–5; Livy 22.5.2–7 |
| 4. Flaminius tử trận | 7:45 – 9:00 | 25 | Vẫn đánh (`fight`). Toán 6 000 người ở đầu mở được đường, đi lên đồi (`advance`). Cuối giai đoạn Flaminius bị kỵ sĩ Ducarius giết | Livy 22.6.1–4 (gần ba giờ, tính từ 6:00); Polybius 3.84.6, 3.84.11–12 |
| 5. Bị dồn xuống hồ | 9:00 – 9:45 | 20 | Quân La Mã tan chạy (`rout`); nhiều khối bị dồn xuống hồ, đứng trong nước; kỵ binh đuổi xuống nước (`pursue`) | Polybius 3.84.8–10; Livy 22.6.5–7 |
| 6. Sương tan | 9:45 – 10:30 | 15 | Toán 6 000 người trên đỉnh đồi thấy đạo quân đã thua, rút về làng Etruria; quân Hannibal làm chủ chiến trường | Polybius 3.84.12–13; Livy 22.6.8–10 |

Tổng 130 giây phát (T-051: 122). Không vẽ thành chuyển động riêng: động đất (Livy 22.5.8, lời dẫn nói), Maharbal vây làng và toán 6 000 người đầu hàng hôm sau (Polybius 3.84.14, Livy 22.6.11, lời dẫn nói).

**Quân số qua các giai đoạn:** 15 000 người chết chia cho các khối ngoài toán đi đầu (19 000 người), dồn vào giai đoạn 3–5; toán đi đầu mất vài trăm khi phá vây. Phía Hannibal mất 1 500–2 500, phần lớn là bộ binh Gaul. Cuối trận còn khoảng 4 000 người La Mã ngoài toán đi đầu, tượng trưng cho những người bị bắt hay chạy thoát; như ở Cannae, số "còn lại" chỉ để cảnh biết vẽ bao nhiêu hình lính.

## 7. Sương mù

| Chỗ | Nội dung |
|---|---|
| Polybius 3.84.1 | Sáng hôm ấy sương mù dày khác thường |
| Polybius 3.84.2 | Vì sương, quân La Mã rất khó nhìn; các sĩ quan không hiểu chuyện gì đang xảy ra |
| Polybius 3.84.11–13 | Toán 6 000 người không thấy gì; lên tới đỉnh đồi thì sương đã tan |
| Livy 22.4.6 | Sương từ hồ bốc lên, **ở đồng bằng dày hơn trên núi**; các toán phục binh trên các đồi vẫn thấy nhau, nên lao xuống cùng lúc |
| Livy 22.5.3 | Trong sương mù dày như thế, tai dùng được hơn mắt |
| Livy 22.6.8–9 | Toán 6 000 người trên gò không thấy được trận vì sương; khi trận đã ngã ngũ, nắng ấm lên làm tan sương |

Đề nghị cho `scenery.mist`: `level` **0,8** (dày, nhưng cảnh vẫn phải cho thấy trận; người dùng duyệt ở chặng 2), `clearsAt` **9,75** (9:45, cuối giai đoạn 5: trận ngã ngũ thì sương tan), mức `attested`, nguồn Polybius 3.84 và Livy 22.4–6. Hợp đồng đã tả được: cảnh vẽ sương dày ở chỗ thấp, đúng như Livy 22.4.6. Một số sử gia hiện đại cho rằng sương bị thêm vào hay nói quá để biện hộ cho quân La Mã (Wikipedia tiếng Anh nêu); cả hai nguồn cổ đều có, nên giữ `attested`.

## 8. Cảnh vật

Áp dụng lựa chọn của người dùng cho Cannae (`docs/PLAN.md`, mục "Đợt H" và "Đợt K"): mặt đất xanh, có cây và nhà minh hoạ, thứ nào trái nguồn thì nói rõ.

| Thứ | Đề nghị cho chặng 1 | Mức | Căn cứ và phần giả định |
|---|---|---|---|
| Hồ | `terrain.lakes[0]`, `trasimene` (đã có trong khối nháp) | `attested` | Polybius 3.82–84, Livy 22.4–6. Bờ ngày nay (mục 4) |
| Mép hồ đầm lầy | `areas`: dải `reeds` dọc bờ bắc từ x −1 500 tới 1 200, từ 15 m ngoài nước vào 45 m trên bờ (22 m trong lối hẹp, chừa con đường) | `inferred` | Livy 22.6.6: "chỗ nước nông của đầm". Lau sậy là suy ra; rộng bao nhiêu là giả định |
| Sương | `scenery.mist` (mục 7) | `attested` | Polybius 3.84, Livy 22.4–6 |
| Đồi, lối hẹp | Lưới độ cao; địa danh | (địa hình) | Polybius 3.83.1, Livy 22.4.2; vị trí theo giả thuyết đã chọn (mục 3) |
| Trại của Hannibal | `structures`: `camp`, `side` Carthage, 550 × 550 m trên đồi Tuoro (T-051 ghi 450 × 450 m, không khớp với phép tính bên cạnh: 450 × 450 m chỉ là 20 ha) | `attested` | Polybius 3.83.2, Livy 22.4.3. Chỉ có lính Libya và Iberia ở đó (16 000 người, khoảng 19 m² mỗi người như Cannae: 30 ha, tức cạnh khoảng 550 m). Kích thước và vị trí là giả định; đất dốc |
| Trại của Flaminius | `structures`: `camp`, `side` La Mã, khoảng 700 × 700 m ở đồng bằng Borghetto | `attested` | Polybius 3.83.7: đóng trại sát hồ. 25 000 người × 19 m² ≈ 48 ha. Vị trí và kích thước là giả định. Lúc trận bắt đầu trại còn hành lý và người theo quân, không vẽ |
| Làng Etruria | `structures`: `village` nhỏ, khoảng 200 × 150 m | `attested` | Polybius 3.84.13–14 (có làng); vị trí là giả định (mục 3) |
| Mặt đất | `ground.cover`: `grass` | `inferred` | Khác Cannae: trận giữa tháng 5 lịch Julius, lúa và cỏ còn xanh, nên đất xanh **không** trái nguồn. Livy 22.3.3 tả đồng bằng Etruria giữa Faesulae và Arretium, trên đường Hannibal đi tới, giàu lúa và gia súc |
| Nhà nông, phần lớn bị đốt | `structures`: tám `farm`, sáu cái `ruined`, đặt ngoài đường đi của các khối quân | `illustrative` cho nhà còn nguyên; `inferred` cho nhà bị đốt | Polybius 3.82.3, 3.82.10, Livy 22.4.1: Hannibal đốt phá vùng quê dọc đường. Số nhà và chỗ đặt: minh hoạ |
| Cây | `trees` (16 cây mỗi km²); ba `areas` `woodland` trên phần cao của núi Gualandro, sườn bắc đồi Tuoro và núi Castelluccio; một mảng `scrub` trên mỏm núi Malpasso | `illustrative` | Nguồn không nhắc cây. Livy 22.4.3 nói kỵ binh nấp sau gò, không nói sau rừng. Sườn đồi ngày nay có rừng sồi và ô liu; loại cây chọn theo hiểu biết chung |
| Gió | `wind`: từ hướng 20°, 1 m/s | `inferred` | Nguồn không nhắc gió. Sương dày đọng lại trên đồng bằng thường đi với trời lặng. Hướng gió là giả định |
| Bụi | `dust.level` 0,15 | `inferred` | Buổi sáng có sương, đất ẩm. Nguồn không nhắc bụi |
| Con đường ven hồ | Không vẽ (hợp đồng chưa có đường, mục 10) | | Polybius 3.83.1: "con đường chạy qua…" |
| Khói từ vùng bị đốt | Không vẽ (hợp đồng chưa có khói) | | Polybius 3.82.3 |

## 9. Địa hình

### Nguồn độ cao

Như Cannae (`cannae.md`, mục 7): **Copernicus DEM GLO-30**, kho AWS công khai `copernicus-dem-30m`, không cần tài khoản.

- Ô đã tải ngày 2026-11-19: `N43E012` (lưới chính; riêng cột ngoài cùng phía tây, x = −4 500, kinh độ 11,99963, rơi vào ô `N43E011`), `N43E011`, `N42E012`, `N42E011` (cả bốn cho lưới vùng xa), cùng bốn mặt nạ nước `*_WBM.tif` đi kèm (thư mục `AUXFILES`). Lưu ngoài repo ở `E:\World_History_Platform_assets\terrain\copernicus-glo30\`.
- **Giấy phép:** file `INFO/eula_F.pdf` của ô `N43E012` giống từng byte với file của ô Cannae đã đọc ở T-016. Cùng câu ghi công bắt buộc và câu miễn trách nhiệm như Cannae; câu ghi công nằm trong `terrain.sources` của khối nháp. Mặt nạ nước nằm trong cùng gói dữ liệu, cùng giấy phép.

### Lưới chính

- Vùng phủ: x từ −4 500 tới 5 100 m, y từ −3 000 tới 5 100 m (9,6 × 8,1 km). Gồm trại của Flaminius và đồng bằng Borghetto ở phía tây, lối hẹp, đồng bằng Sanguineto–Tuoro, núi Gualandro, đồi Tuoro và thung lũng sau nó, núi Castelluccio và làng ở phía bắc, và 1,5–2 km mặt hồ, đủ cho phần hồ quân La Mã bị dồn xuống (giới hạn 150 m, mục 11) cùng đảo Maggiore và Minore.
- 321 × 271 điểm, cách nhau 30 m, nội suy song tuyến; `width` 321, `height` 271. Cùng cách đặt điểm như Cannae.
- Độ cao từ 254,5 m (mặt hồ) tới 772,1 m.

### Lưới vùng xa

- 271 × 271 điểm, cách nhau 400 m, phủ 54 km về mỗi phía quanh `origin`, như Cannae. Mỗi giá trị là trung bình của 25 mẫu trong ô 400 m.
- Độ cao tới 1 678 m (dãy Apennine phía đông). Không có biển (0% điểm ở mực 0).
- Mặt hồ trong lưới xa là đất phẳng ở 254,5 m: cảnh phải dùng đường bờ của hồ để vẽ nước ở vùng xa (đường bờ đã phủ cả hồ). Xem mục 10.

### Xem trước

Ảnh duyệt ở `E:\World_History_Platform_assets\duyet\T-051\`:

| Ảnh | Nội dung |
|---|---|
| `1-vung-luoi-chinh.jpg` | Lưới chính, đường đồng mức 10 m, hồ, địa danh nháp |
| `2-phuong-an-bo-tri.jpg` | Phác phương án bố trí cho chặng 1: đường đoàn quân La Mã, các chỗ phục kích, đường toán 6 000 người phá vây. Chỉ là phác, chưa phải dữ liệu |
| `3-loi-hep.jpg` | Lối hẹp Malpasso và đồng bằng ven hồ, ô 6 m, đường đồng mức 5 m |
| `4-vung-xa.jpg` | Lưới vùng xa, khung lưới chính, Cortona, Perugia |

Lệnh dựng ảnh gốc (nhãn chữ được thêm bằng một script ngoài repo). Đây là lệnh của T-051, khi còn khối nháp; khối nháp nay đã xoá, bỏ `--terrain` thì script vẽ theo file trận:

```
node scripts/battles/build-terrain.mjs --battle battle-of-lake-trasimene --extent -4500,5100,-3000,5100 --spacing 15 --contour 10 --range 254,620 --terrain docs/data/battles/trasimene-terrain.json --preview out.png
```

Ảnh phác từng giai đoạn của T-052 (`E:\World_History_Platform_assets\duyet\T-052\`, nhãn chữ cũng thêm ngoài repo):

```
node scripts/battles/build-terrain.mjs --battle battle-of-lake-trasimene --extent -3200,3400,-1900,3500 --spacing 6 --contour 10 --range 254,560 --phase n --preview out.png
```

`--terrain` vẽ địa danh và hồ của khối nháp khi chưa có file trận; khi đã có file trận, script vẽ theo file trận như với Cannae. Từ T-052 ảnh xem trước vẽ cả bờ các đảo, và với `--phase n` vẽ khối đang nấp (`concealed`) màu xám.

### Thay đổi trong `build-terrain.mjs`

- Đọc được ảnh GeoTIFF 8 bit có bộ dự đoán ngang (mặt nạ nước).
- `--lake out.json`: vạch đường bờ và đo mực nước của hồ (mục 4). Vùng lấy mẫu nằm ở `lake` trong cấu hình của trận.
- Ảnh xem trước: `--contour` (khoảng đường đồng mức), `--points` (điểm thêm), `--terrain` (khối nháp), tô hồ; lưới 10 km khi ô từ 100 m trở lên.
- Dựng lại lưới Cannae ra đúng từng byte như trước.

## 10. Những gì hợp đồng hiện nay chưa tả được

| # | Chuyện | Đề nghị |
|---|---|---|
| 1 | **Đảo trong hồ.** `BattleLake` chỉ có một đường bờ, không có lỗ, và hợp đồng nói cảnh không vẽ lưới độ cao bên trong đường bờ. Đảo Maggiore và Minore (trong lưới chính, cao hơn mặt nước 35–55 m, nhìn thẳng từ chiến trường) sẽ biến mất | **Đã quyết (người dùng chọn, khi gộp T-051):** thêm `BattleLake.islands`. File trận có ba đảo vạch bằng `--lake`: Polvese (51 điểm, ngoài lưới chính, để lưới vùng xa có đảo), Maggiore (25 điểm, vắt qua mép nam lưới chính), Minore (17 điểm) |
| 2 | **Hồ ở vùng xa.** Lưới xa có mặt hồ ở 254,5 m, không phải ≤ 0, nên nếu chỉ dựa vào lưới thì vẽ thành đất | Không cần đổi hợp đồng (hợp đồng đã cho đường bờ chạy ra ngoài lưới). Ghi cho lane 3 ở chặng 2: vẽ nước theo `outline` ở cả vùng xa |
| 3 | **Quân phục kích nấp sau đồi.** Không có cách nói một khối "đang nấp"; người xem thấy mọi khối từ đầu | **Đã quyết (người dùng chọn, khi gộp T-051):** thêm `UnitState.concealed`. Trong file trận, mười khối phục kích (năm khối bộ binh Gaul, kỵ binh Gaul, kỵ binh Numidia, kỵ binh Iberia, lính giáo nhẹ, lính ném đá) có `concealed` ở `initial` và cuối giai đoạn 1; lính Libya và Iberia đứng ở trại, nhìn thấy được, nên không có |
| 4 | **Cột hành quân uốn theo bờ hồ.** Khối quân là hình chữ nhật, đi thẳng giữa hai mốc | Không đổi hợp đồng. Làm ở T-052 (mục 12): qua lối hẹp chỉ có một đường thẳng không leo sườn núi, nên khối nào còn ở phía tây lối hẹp ở một mốc thì mốc sau vẫn nằm trên đường thẳng ấy. Cái giá: lúc 4:30 đầu đoàn đã qua lối hẹp. Muốn đầu đoàn bắt đầu ở trại thì cần thêm một giai đoạn, hoặc `UnitState.path?: FieldPoint[]` (khối đi theo đường gấp khúc giữa hai mốc) |
| 5 | **Bị đánh vào sườn khi đang hành quân.** Cảnh chỉ ghép cặp những người đối mặt nhau trong 70°; một khối hàng dọc bị đánh từ bên hông thì người đầu hàng không có ai để đánh | Không đổi hợp đồng. Ở giai đoạn 2 các khối La Mã quay về phía địch, đổi từ hàng dọc sang hàng ngang (đổi `frontage`, `depth`, xoay 90°); Livy 22.5.1 nói Flaminius cố dàn lại hàng ngũ. Cảnh nội suy thẳng nên khối xoay quanh tâm; khối ngắn thì hai đầu chỉ quét 75–125 m |
| 6 | **Bị đánh từ nhiều phía cùng lúc** (Polybius 3.84.3: trước, sau, hai bên) | Không đổi hợp đồng. Một khối chỉ đánh ở mép trước (hay mép sau nếu quay đầu). Chỗ cần, chia một nhóm thành hai khối quay lưng vào nhau |
| 7 | **Người lội xuống hồ** | Hợp đồng đã cho phép. `npm run validate` giới hạn 150 m tính từ bờ (mục 11) |
| 8 | **Con đường ven hồ** | Không bắt buộc. Nếu muốn vẽ: `scenery.roads?: { points, width, evidence }[]`. Không có thì đoàn quân vẫn đọc được là đi dọc hồ |
| 9 | **Khói từ vùng bị đốt phá** (Polybius 3.82.3) | Không đề nghị. Nhà nông `ruined` đủ để gợi chuyện đó |
| 10 | **Đầu hàng, bị bắt, chạy thoát** | Không đổi. `men` chỉ giảm, cảnh không phân biệt chết hay bị bắt; lời dẫn nói |
| 11 | **Hành lý, người theo quân, con voi** | Không có loại lính; không vẽ (mục 5) |
| 12 | **Ngày đánh kéo sang hôm sau** (Maharbal vây làng, toán 6 000 người đầu hàng) | Ngoài phạm vi một ngày của cảnh; lời dẫn nói |

## 11. Kiểm tra (`npm run validate`)

`scripts/battles/validate-battles.mjs` kiểm tra thêm:

- **`terrain.lakes`**: là một danh sách nếu có; mỗi hồ có `id` dạng kebab-case không trùng, tên đủ hai ngôn ngữ, `level` là số, `outline` từ ba điểm trở lên (mỗi điểm có `x`, `y` là số) và có diện tích, `evidence` đúng dạng (có nguồn nếu `attested`). Đường bờ được phép chạy ra ngoài lưới.
- **Không gì nằm trong hồ:** địa danh, công trình.
- **Mực nước khớp lưới** (cảnh báo): trung vị độ cao của các điểm lưới trong đường bờ chênh với `level` quá 1 m thì báo. Copernicus cho đúng mặt nước nên hai số phải khớp; lệch là gõ sai hoặc nhầm đường bờ.
- **Lội hồ:** khối quân được đứng trong hồ ở một mốc, nhưng không điểm nào của khối được xa bờ quá **150 m**. Căn cứ: Polybius 3.84.9 (đứng ngập tới cổ), Livy 22.6.6 (tới vai, ở chỗ nước nông đầu tiên); hồ nông và đáy thoải (GNGTS 2013: dọc một tuyến từ bờ bắc ra giữa hồ, nước sâu trung bình khoảng 3 m). Đề nghị cho chặng 2: cảnh cho nước sâu khoảng 1,4–1,6 m ở 150 m từ bờ, để giới hạn này đúng là "ngập tới vai". Như với biển và sông, chỉ xét các mốc, không xét đường đi giữa hai mốc.
- **`scenery.mist`**: `level` từ 0 tới 1; `clearsAt` (nếu có) là số, **sau** `startHour` và **không muộn hơn** giờ kết thúc giai đoạn cuối; `evidence` đúng dạng.
- Trận không có hồ hay sương (Cannae) qua như cũ.
- `validate-battles.mjs` nhận thêm đường dẫn file trận: `node scripts/battles/validate-battles.mjs path/to/<id>.json` chỉ kiểm các file đó.

Thêm ở T-052:

- **`islands`**: là danh sách nếu có; mỗi đảo từ ba điểm (số `x`, `y`), có diện tích, nằm trong `outline` (mọi đỉnh ở trong, không cạnh nào cắt bờ), không chồng đảo khác (không cạnh nào cắt nhau, không đỉnh nào nằm trong đảo kia).
- **Trên đảo không phải trong hồ:** địa danh và công trình đặt được trên đảo; khoảng cách lội tính tới bờ gần nhất, kể cả bờ đảo; trung vị độ cao lưới (cảnh báo) chỉ tính phần nước.
- **`concealed`**: là boolean nếu có; khối có `concealed` ở một mốc thì `action` của mốc đó không phải `fight` hay `skirmish`.
- **Mũi tên** (cảnh báo): mũi tên của một giai đoạn bắt đầu hay kết thúc trong (hay cách không quá 30 m) một khối ẩn suốt giai đoạn đó, tức có `concealed` ở cả hai mốc.

**Thử:** `node scripts/battles/test-lake-checks.mjs` dựng một trận nhỏ trên địa hình của file trận, làm sai theo từng kiểu và chạy kiểm tra từ một thư mục tạm, không đụng tới `src/data/battles/`. 45 ca (25 ca của T-051, 20 ca của T-052): 9 ca phải qua (thêm: địa danh và trang trại trên đảo Maggiore, một khối lội cách bờ đảo 55–100 m nhưng cách bờ hồ 1,2 km, trung vị bỏ qua một "đảo" đất cao, quân nấp rời chỗ nấp ở giai đoạn 2 có mũi tên), 36 ca phải bị bắt (gồm ba cảnh báo). Cả 45 ca cho đúng kết quả.

## 12. File trận (T-052)

Đã viết `src/data/battles/battle-of-lake-trasimene.json` theo mục 5–8, qua `npm run validate` không có cảnh báo. File được sinh bằng một script tạm ngoài repo (hình học tính từ lưới độ cao, chữ viết tay), rồi kiểm bằng các công cụ trong `scripts/battles/`; sửa về sau thì sửa thẳng file JSON.

### Đi qua lối hẹp bằng đường thẳng

Cảnh di chuyển mỗi khối theo đường thẳng giữa hai mốc. Đo trên lưới: mọi đường thẳng qua lối hẹp Malpasso đều lên tới ít nhất **16,7 m** trên mặt hồ, ở chỗ yên ngựa tự nhiên gần x −450 (dải đất sát bờ ở đó cũng cao như vậy). Đường thấp nhất đi qua (−450, −1 175), hướng **67°**; tôi gọi nó là con đường ven hồ. Đường thẳng nào lệch khỏi nó vài độ là leo lên sườn núi: từ trại của Flaminius tới đồng bằng Tuoro thì lên 50–90 m.

Từ đó:

- **Khối nào ở phía tây lối hẹp ở một mốc thì mốc kế tiếp vẫn nằm trên con đường ven hồ** (kéo dài sang đồng bằng). Đoàn quân rẽ về phía đồi Tuoro ở điểm K = (563, −745), giữa đồng bằng, rồi đi thẳng tới chân đồi H = (1 250, 690), hướng 25,6°.
- Vì vậy **lúc 4:30 đầu đoàn đã qua lối hẹp** (khối đi đầu ở (974, 113)), cuối đoàn ở ngoài cửa tây lối hẹp (−1 734, −1 720), cách bờ hơn 100 m; trong giai đoạn 1 mỗi khối tiến khoảng 1,1–1,3 km. Khớp với Livy 22.4.4 (qua lối hẹp khi trời còn chưa sáng rõ), nhưng khác đề nghị của T-051 (đầu đoàn vừa ra khỏi trại). Muốn giữ đề nghị cũ thì cần thêm một giai đoạn, hoặc một đường gấp khúc cho khối (`UnitState.path`, mục 10 ý 4).
- Kiểm bằng một script tạm: lấy mẫu mỗi 10 m dọc đường đi của tâm và hai đầu mặt trận của mọi khối La Mã, ở mọi giai đoạn. Trong lối hẹp (x < 0), chỗ cao nhất là 18 m trên mặt hồ (yên ngựa 16,7 m). Đường đi giữa hai mốc của mọi khối (cả hai bên) xuống hồ xa nhất 92 m, lúc quân La Mã chạy ra hồ ở giai đoạn 5; trong lúc hành quân qua lối hẹp thì không xuống nước.

### Đoàn quân và thứ tự hành quân

- 16 khối theo mục 5. Hàng dọc rộng 16 m; dài theo quân số, 1,6 m² mỗi người đi bộ, 4 m² mỗi kỵ binh; cách nhau 40 m. Không khối nào vắt qua chỗ rẽ K.
- Cuối giai đoạn 1: hai khối đi đầu (toán *extraordinarii* và phần đầu cánh phải đồng minh, 6 000 người) đã dàn hàng ngang (250 × 24 m) trước lính Libya ở chân đồi Tuoro, chạm mặt trận của họ; phần còn lại nằm trên đường K–H và con đường ven hồ, khối cuối (kỵ binh đồng minh cánh trái) ở trong lối hẹp.
- Giai đoạn 2: các khối quay về phía bị đánh ngay tại chỗ, từ hàng dọc sang hàng ngang (đổi `frontage` và `depth`, xoay 90°): quay trái về phía quân Gaul, hai khối ngay sau đầu đoàn quay phải về phía lính Iberia; khối cuối trong lối hẹp quay đầu về phía kỵ binh và đứng chắn ngang dải đất (50 × 96 m).

### Ai đánh ai

Mỗi khối phục kích đánh một hay hai khối La Mã nằm trên một đường thẳng, mặt trận trùng khít mặt trận của họ (validator đòi điều này ở cả hai mốc của giai đoạn `fight`):

| Khối của Hannibal | Đánh | Nấp ở (lúc đầu) | Tới chỗ địch |
|---|---|---|---|
| Libya (2 khối) | hai khối đi đầu | trước trại, nhìn thấy được | cuối giai đoạn 1 |
| Iberia phía bắc, phía nam | cánh phải đồng minh phần sau; kỵ binh đồng minh | đứng ở phía đông đầu đoàn, nhìn thấy được | cuối giai đoạn 2 |
| Gaul dưới đồi Tuoro | velites và hastati quân đoàn I | (800, 1 250), chân phía tây đồi Tuoro | cuối giai đoạn 2 |
| Gaul ở cửa thung lũng Sanguineto | principes và triarii quân đoàn I; từ T-059 cả kỵ binh La Mã cùng Flaminius (mục 13) | (300, 1 050) | cuối giai đoạn 2 |
| Kỵ binh Gaul | kỵ binh La Mã cùng Flaminius, velites quân đoàn II; từ T-059 chỉ velites quân đoàn II, và xông qua (mục 13) | (−150, 750) | cuối giai đoạn 2 |
| Gaul dưới núi Gualandro (bắc) | hastati và principes quân đoàn II | (−380, 320) | cuối giai đoạn 2 |
| Gaul dưới núi Gualandro (nam) | triarii quân đoàn II, cánh trái đồng minh phần đầu | (−420, −120) | cuối giai đoạn 2 |
| Gaul trên lối hẹp | cánh trái đồng minh phần sau | (−430, −560), sườn đông mỏm núi | cuối giai đoạn 2 |
| Kỵ binh Numidia | kỵ binh đồng minh cánh trái (đi cuối) | (−1 150, −1 000), sườn tây nam mỏm núi | bịt cửa tây lối hẹp cuối giai đoạn 2; men bờ vào lối hẹp, tới khối cuối ở cuối giai đoạn 3; đánh ở giai đoạn 4 |
| Kỵ binh Iberia | (chặn cửa tây lối hẹp) | (−1 450, −850) | đứng chặn từ giai đoạn 2 |
| Lính giáo nhẹ, lính ném đá | `skirmish` vào sườn phải đoàn quân ở giai đoạn 4 | thung lũng sau đồi Tuoro, (1 880, 1 180) và (1 850, 1 400) | ra chặn đường về phía đông ở giai đoạn 2, tới tầm ném ở giai đoạn 3 |

Kỵ binh Gaul đánh đúng chỗ Flaminius đi (Livy 22.6.3–4: Ducarius là kỵ sĩ Insubres). Hai giai đoạn `fight` (3, 4) mỗi bên bị đẩy lùi về phía hồ 30 m, cả hai cùng dời nên vẫn chạm nhau.

### Giai đoạn 4–6

- **Giai đoạn 4:** hai khối đi đầu chuyển sang hàng dọc và phá vây về phía đông bắc, đi sát góc đông nam trại của Hannibal (khối gần nhất cách mép trại 3 m, đo cả lúc đang đổi đội hình), tới thung lũng sau đồi Tuoro; lính Libya dạt sang hai bên. Hết giai đoạn, kỵ binh La Mã cùng Flaminius còn 42% người.
- **Giai đoạn 5:** mỗi khối La Mã quay lưng về phía địch ngay tại chỗ (quay đầu, không xoay cả khối) và chạy thẳng ra hồ: phần ven con đường theo hướng 157°, phần trên đường K–H chạy về phía nam và toả ra dọc bờ theo thứ tự đang đứng; dừng khi tâm khối ở 45 m ngoài bờ (điểm xa bờ nhất của một khối ở một mốc là 95 m, dưới giới hạn 150 m). Quân Gaul ở phần gần bờ theo sát sau lưng tới mép nước; ở phần xa bờ chỉ theo 40% quãng đường (Iberia 25%), để hai bên không chạy song song đè lên nhau. Toán đầu lên chỗ cao quanh (2 650, 2 250), 420–440 m trên mặt biển, 160–180 m trên mặt hồ.
- **Giai đoạn 6:** toán đầu rút về làng Etruria, dừng ngay dưới làng; mọi khối khác đứng yên.
- **Tốc độ trên sân** (mét mỗi giây phát): giai đoạn 1 khoảng 50; quân phục kích xung phong ở giai đoạn 2 từ 47 tới 76 (kỵ binh Gaul); tan chạy ở giai đoạn 5 tới 87; toán đầu lên chỗ cao ở giai đoạn 5 và rút về làng ở giai đoạn 6, 60–67. Cannae có 30–70. Giai đoạn 2 vì thế dài 20 giây thay vì 12: với 12 giây, quân Gaul phải chạy 110–130 m/s.

### Quân số

- La Mã 25 000 → 9 546 (mất 15 454): toán đầu mất 480; các khối khác còn 70% cuối giai đoạn 3, 42% cuối giai đoạn 4, 22% cuối giai đoạn 5, 21% cuối trận; khối đi cuối mất người từ giai đoạn 4.
- Hannibal 50 000 → 47 870 (mất 2 130, trong khoảng 1 500–2 500): bộ binh Gaul 1 200, kỵ binh Gaul 200, Libya 400, Iberia 200, Numidia 100, lính giáo nhẹ 30.

### Kiểm tra đã chạy

- `npm run validate`: qua, không cảnh báo.
- `node scripts/battles/check-overlap.mjs battle-of-lake-trasimene --min 0.05`: các cặp đánh nhau chạm mép 7% (mặt trận trùng khít); không có chồng lấn nào khác từ 5% trở lên, kể cả giữa các mốc.
- `node scripts/battles/test-lake-checks.mjs`: 45 trên 45 ca đúng.
- Xem trong cảnh ở `/battle-lab?battle=battle-of-lake-trasimene` qua cả sáu giai đoạn (cảnh chưa vẽ hồ, sương và quân nấp: chặng 2 của lane 3). Ảnh duyệt ở `E:\World_History_Platform_assets\duyet\T-052\`: `0`–`6-phac-giai-doan-*.jpg` (ảnh phác từng mốc, `build-terrain.mjs --preview --phase n`, có tên địa danh tiếng Việt) và `7`–`16-canh-*.jpg` (ảnh chụp cảnh: qua lối hẹp, toàn cảnh lúc 6:00, phục binh lao xuống, giáp mặt, kỵ binh trong lối hẹp, chỗ Flaminius, phá vây, bị dồn xuống hồ, cuối giai đoạn 5, rút về làng).

## 13. Kỵ binh xông qua (T-059, đợt L)

Từ đợt L, kỵ binh gặp bộ binh có thể phi xuyên qua thay vì dừng lại đấu từng cặp (hành động `overrun`; `docs/ARCHITECTURE.md`, mục "Kỵ binh xông qua"). Ở giai đoạn 2–5 của file trận có ba chỗ kỵ binh đánh giáp lá cà, cả ba ở giai đoạn 3–4. Giai đoạn 2 chỉ có xung phong (`charge`) và đứng yên; giai đoạn 5 chỉ có tan chạy và truy đuổi.

| Kỵ binh | Đấu với (trước T-059) |
|---|---|
| Kỵ binh Gaul | Kỵ binh La Mã cùng Flaminius (kỵ binh) và velites quân đoàn II (bộ binh) |
| Kỵ binh đồng minh cánh phải (`allied-cavalry-right`, phía La Mã) | Lính Iberia phía nam (`iberians-2`, bộ binh) |
| Kỵ binh Numidia (giai đoạn 4) | Kỵ binh đồng minh cánh trái (kỵ binh) |

### Nguồn đã đọc lại (2026-11-20)

Cùng các bản như mục 1.

| Nguồn | Nói gì về kỵ binh |
|---|---|
| Livy 22.6.1–4 (bản Latin; đối chiếu bản Roberts) | Đánh nhau gần ba giờ. Flaminius có những người khoẻ nhất trong quân đi theo; Livy không nói họ đi bộ hay cưỡi ngựa. Ducarius, kỵ sĩ người Insubres, nhận ra mặt chấp chính quan, thúc ngựa **xông qua chỗ quân địch dày đặc nhất** (*per confertissimam hostium turbam*), giết người mang giáp vừa lao ra chắn đường, rồi đâm giáo xuyên người Flaminius. Các triarii giơ khiên che thi thể, không cho hắn lột giáp |
| Polybius 3.83.4; 3.84.6 | Kỵ binh và người Celt cùng dàn liền một dải dưới các đồi bên trái. Flaminius bị một nhóm người Celt đánh và giết; Polybius không nói họ cưỡi ngựa hay đi bộ |
| Polybius 3.84.3–4 | Quân La Mã bị đánh cùng lúc từ phía trước, phía sau và hai bên, phần lớn bị giết khi vẫn còn trong đội hình hành quân. Không nêu tên kỵ binh |
| Livy 22.4.6–7; 22.5 | Quân La Mã không kịp dàn hàng, mỗi người đánh ở chỗ mình đứng. Không nhắc kỵ binh của bên nào trong lúc đánh |
| Livy 22.3; Polybius 3.82.4 | Kỵ binh La Mã chỉ có trong lời bàn trước trận (dùng kỵ binh chặn quân địch cướp phá) và trong lời can Flaminius coi chừng kỵ binh đông của địch |
| Polybius 3.84.9–10; Livy 22.6.7 | Kỵ binh Carthage phi xuống nước giết những người chạy ra hồ. Đây là giai đoạn 5, ghi `pursue`, không thuộc phần này |

Tóm lại: chỉ có một chỗ nguồn tả người cưỡi ở giữa đám bộ binh: Ducarius phi qua hàng ngũ La Mã tới chỗ Flaminius (Livy). Không nguồn nào nói kỵ binh La Mã hay kỵ binh đồng minh xông vào bộ binh địch.

### Quyết định

- **Kỵ binh Gaul, giai đoạn 3–4: `fight` → `overrun`** (Livy 22.6.3–4). Lời dẫn giai đoạn 4 đã viết Ducarius "phi qua hàng ngũ La Mã"; không sửa.
- **Velites quân đoàn II (`velites-2`), giai đoạn 3–4: `fight` → `stand`.** Đối thủ giáp lá cà duy nhất của họ là kỵ binh Gaul. Người chết của khối (1 200 → 840 → 504, không đổi) nay là người ngã dưới vó ngựa.
- **Kỵ binh đồng minh cánh phải: giữ `fight`.** Không nguồn nào nói kỵ binh La Mã xông vào bộ binh. Họ là bên bị đánh úp: Polybius 3.84.3–4 và Livy 22.5 tả đoàn quân bị đánh khi còn đang đi hàng dọc, chưa kịp dàn trận. Trong file trận, khối này vừa quay tại chỗ từ hàng dọc sang hàng ngang (giai đoạn 2, `stand`) thì lính Iberia đã tới; không có đà và chỗ để xông. Đứng đánh tại chỗ hợp với nguồn hơn. Chế độ xem trước của trang thử (`?overrun=1`) đổi khối này sang `overrun` chỉ vì nó là kỵ binh có bộ binh địch trước mặt.
- **Kỵ binh Numidia và kỵ binh đồng minh cánh trái: giữ `fight`** (ngựa đấu ngựa).

### Dời hai khối ở mốc 2, 3, 4

Trong file trận cũ, mặt trận kỵ binh Gaul (310 m) chạm kỵ binh La Mã cùng Flaminius trên 150 m và velites quân đoàn II trên 120 m. `overrun` chỉ phi qua bộ binh, nên nếu chỉ đổi hành động:

- người cưỡi ở trước mặt kỵ binh La Mã đứng yên: 126 trên 200 hình ở giai đoạn 3, 120 ở giai đoạn 4 (đo với chế độ xem trước của trang thử);
- kỵ binh La Mã không còn ai đấu với mình, vì kỵ binh Gaul không còn `fight`; `npm run validate` báo lỗi.

Vì vậy tôi dời hai khối, ở cả ba mốc 2, 3, 4. Mốc 2 là mốc đầu của giai đoạn 3, nên điểm tới của cú xung phong ở giai đoạn 2 cũng đổi theo.

| Khối | Trước | Sau |
|---|---|---|
| Kỵ binh Gaul | 310 × 52 m; tâm (604, −581), (631, −594), (658, −607) | 120 × 134 m, cùng diện tích (khoảng 4 m² mỗi người, như mục 12); mép trước trùng mép trước của velites quân đoàn II; tâm (525, −649), (552, −662), (579, −675) |
| Bộ binh Gaul ở cửa thung lũng Sanguineto (`gauls-2`) | 240 × 28 m; tâm (751, −301), (778, −314), (805, −327) | 430 × 16 m, cùng diện tích; mép trước chạy từ đầu đông bắc của principes quân đoàn I tới đầu tây nam của kỵ binh La Mã; tâm (715, −390), (742, −403), (769, −416) |

- Hai khối vẫn dời 30 m về phía hồ mỗi giai đoạn, cùng với quân La Mã, như mục 12.
- `gauls-2` nay đánh principes, triarii quân đoàn I và kỵ binh La Mã cùng Flaminius.
- Mũi tên xung phong của kỵ binh Gaul ở giai đoạn 2 kết thúc sau chỗ đứng mới: điểm cuối (540, −520) thành (447, −611).
- Mốc 5 (truy đuổi) và mốc 6 giữ nguyên: trong giai đoạn 5 kỵ binh Gaul dàn rộng lại thành 310 × 52 m, còn `gauls-2` thu về 240 × 28 m.
- Không đổi quân số, thương vong và lời dẫn.

Như vậy quanh Flaminius có cả hai điều nguồn nói tới: bộ binh Gaul đánh nhóm kỵ binh của ông (Polybius: một nhóm người Celt), còn kỵ binh Gaul phi qua đám lính đi bộ ngay bên cạnh (Livy: Ducarius phi qua chỗ quân địch dày nhất). Vị trí của từng khối vẫn là phỏng dựng, như mục 12.

**Không khựng:** kỵ binh Gaul xung phong ở giai đoạn 2. Đường đi lệch hướng mặt ở mốc 2 là 39° (trước khi dời: 35°), dưới ngưỡng 45° của cảnh, nên sang giai đoạn 3 người cưỡi phi tiếp vào velites với tốc độ đang có.

### Kiểm tra

- `npm run validate`: qua, không cảnh báo. Ở mốc 2, 3, 4, 21 trên 21 điểm của mép trước kỵ binh Gaul có velites quân đoàn II ngay phía trước. Kỵ binh La Mã vẫn qua kiểm tra `fight`, nay với `gauls-2`.
- `check-overlap.mjs battle-of-lake-trasimene --min 0.05`: không thêm chồng lấn nào. Cặp velites quân đoàn II và kỵ binh Gaul (chạm mép 7%, mục 12) không còn trong danh sách: sau khi làm tròn toạ độ, hai mép trước nằm sát nhau mà không chồng lên nhau.
- `check-facing.mjs`: bớt một dòng. Trong giai đoạn 5, kỵ binh Gaul không còn đi xiên quá ngưỡng; `gauls-2` đi 218 m, lệch 52° (trước: 302 m, 63°).
- Engine của cảnh chạy bằng Node (`tools/check-data.mjs` trong thư mục ảnh, như ở `cannae.md` mục 19):
  - Kỵ binh Gaul: 200 trên 200 hình phi vòng ở giai đoạn 3 (3,1 vòng mỗi người), 196 trên 200 ở giai đoạn 4 (4 hình đã ngã); không ai đứng yên. Mọi người cưỡi phi tiếp từ cú xung phong của giai đoạn 2, không khựng. Đoạn thẳng dài nhất 165 m (người cưỡi ở cuối khối sâu 134 m).
  - Velites quân đoàn II: 18 hình ngã ở giai đoạn 3 và 16 ở giai đoạn 4, tất cả lúc có ngựa trong vòng 4,5 m. Họ bị xô ngã 360 lần, bị chém lúc đang đứng 102 lần, trên 57 trong 60 hình.
  - Để so: với chế độ xem trước của trang thử trên file cũ, chỉ 74 trên 200 người cưỡi phi vòng ở giai đoạn 3, còn 126 đứng yên.
- Giáp lá cà (`tools/pairs.mjs`: người đầu hàng dọc có đối thủ trên số người đầu hàng, mỗi 1/4 giai đoạn 3–4). Kỵ binh La Mã 15/15, 15/15, 15/15, 15/15, 21/21, 19/19, 17/17, 15/15, như trước; nay đối thủ là bộ binh Gaul. Principes và triarii quân đoàn I như trước. `gauls-2` 67/80 tới 62/77 (trước: 35/40 tới 35/39): khoảng 80 m trong 430 m mặt trận là hai khoảng trống giữa ba khối La Mã.
- Xem trong cảnh (`/battle-lab?battle=battle-of-lake-trasimene`, dev server): người cưỡi phi vòng qua velites, ra phía bờ hồ rồi quay lại; velites ngã khi ngựa tới, người không đến lượt chết thì gượng dậy; không khối nào đánh vào khoảng không; không người cưỡi nào đứng yên. Sương mù của giai đoạn 3–4 làm ảnh chụp xa bị mờ.
- Ảnh trước (A) và sau (B) ở `E:\World_History_Platform_assets\duyet\T-059\`, chụp như ở `cannae.md` mục 19:

| Ảnh | Thời điểm | Góc |
|---|---|---|
| `05-trasimene-dau-giai-doan-3` | Đầu giai đoạn 3 (6:18) | Velites quân đoàn II, từ phía bờ hồ (đông nam) |
| `06-trasimene-giua-giai-doan-3` | 6:51 | Như trên |
| `07-trasimene-giua-giai-doan-4` | 8:22 | Như trên |
| `08-trasimene-can-canh` | 8:24 | Cận cảnh |
| `09-trasimene-toan-canh` | 8:08 | Từ trên cao: kỵ binh Gaul, velites, kỵ binh La Mã và `gauls-2` |
| `10-trasimene-dang-phat-00` tới `-05` | Đang phát, từ ngay trước mốc 2 | Kỵ binh đi tiếp từ cú xung phong vào velites |

- **Khung hình/giây**: đo như ở `cannae.md` mục 19, góc nhìn rộng 400 m từ phía bờ hồ; phát 5 giây từ t = 2,05 (đầu giai đoạn 3) và từ t = 3,05 (đầu giai đoạn 4). Hai bản chạy xen kẽ trên cùng máy. Blender của một phiên khác chạy từng đợt; cột Blender ghi nó có đang chạy lúc lượt đo kết thúc hay không.

| Lượt | Bản | Blender | Giai đoạn 3: khung/giây (p99) | Giai đoạn 4 |
|---|---|---|---|---|
| 1 | sau | có | 71,4 (19,0 ms) | 74,3 (17,1 ms) |
| 1 | trước | không | 83,0 (16,1 ms) | 85,4 (15,0 ms) |
| 2 | sau | không | 80,5 (15,5 ms) | 81,4 (15,9 ms) |
| 2 | trước | có | 73,0 (17,5 ms) | 74,9 (17,6 ms) |
| 3 | sau | có | 46,1 (33,2 ms) | 66,2 (20,8 ms) |
| 3 | trước | không | 80,0 (16,6 ms) | 84,3 (14,6 ms) |
| 4 | sau | không | 74,8 (19,3 ms) | 81,5 (15,6 ms) |
| 4 | trước | có | 74,2 (17,1 ms) | 75,6 (17,2 ms) |

  - Khi không có Blender, bản sau chậm hơn khoảng 3–4 khung/giây (khoảng 4%): 74,8–80,5 và 81,4–81,5, so với 80,0–83,0 và 84,3–85,4. p99 cao hơn 0–3 ms. Mọi lượt không có Blender đều trên 74 khung/giây.
  - Khi có Blender: lượt 1 của bản sau ngang bản trước (71–74 so với 73–76); lượt 3 tụt còn 46 ở giai đoạn 3.

### Còn lại

- Velites quân đoàn II bị xô ngã liên tục: 200 hình kỵ binh phi qua một dải bộ binh 120 × 16 m, nên trung bình mỗi hình lính bị xô hay bị chém 7–8 lần trong 50 giây phát (mỗi lần nằm tới 4 giây, rồi được yên 5 giây). Muốn thưa hơn thì phải đổi quân số hay chỗ đứng của các khối; tôi giữ nguyên.
- Cú xung phong của kỵ binh Gaul ở giai đoạn 2 nhanh khoảng 78 m mỗi giây phát (T-052: 76), quá trần phi của ngựa (khoảng 57 m/s, `docs/ARCHITECTURE.md`, mục "Kỵ binh"). Người cưỡi mang tốc độ đó vào giai đoạn 3, rồi chậm dần về tốc độ phi trong 1,2 giây, nên móng ngựa trượt trong giây đầu. Có từ trước T-059 (cả cú xung phong đã như vậy). Muốn bớt thì phải kéo dài giai đoạn 2 hay dời chỗ nấp, ngoài phạm vi task này.
- Clip `knockdown` (T-057) chưa có trong mô hình: bộ binh bị xô ngã theo clip `die`, nằm một lát, rồi gượng dậy bằng chính clip đó phát ngược.
