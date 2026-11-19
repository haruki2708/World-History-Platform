# T-056: Bản đồ nền thiếu hồ Trasimene

- **Lane:** 2
- **Model đề xuất:** Opus 5.5, effort `medium`. Task nhỏ về dữ liệu bản đồ.
- **Nhánh:** `lane2/T-056-map-lake-trasimene` (phiên chính đã tạo sẵn từ `main` trong worktree của bạn).
- **Phạm vi file:** `public/map/`, `src/components/map/` (kể cả `tools/build-basemap.mjs`).

## Bối cảnh

Trận hồ Trasimene đã vào app chính (T-052 và T-053 gộp 2026-11-19). Bấm "Xem trận đánh 3D" ở sự kiện năm 217 TCN thì bản đồ bay tới chiến trường, và cú bay chạy đúng. Nhưng **bản đồ không vẽ hồ**: trong khung chiến trường chỉ có một mảng màu thế lực (ảnh `E:\World_History_Platform_assets\duyet\K-bay-ban-do\trk-1-flying.png`). Một trận đánh bên hồ mà bản đồ không có hồ thì người xem khó hiểu.

Phiên chính đã kiểm `public/map/basemap.json`: quanh miền trung Ý chỉ có một hồ, hồ Bolsena (11,86–12,00° Đ, 42,54–42,65° B). Hồ Trasimene (khoảng 12,03–12,20° Đ, 43,08–43,20° B, rộng chừng 128 km², lớn hơn Bolsena) không có, dù `public/map/README.md` ghi bản đồ nền có hồ tự nhiên từ khoảng 1 km². Hồ này là hồ tự nhiên, có từ thời cổ.

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Tìm vì sao thiếu, rồi thêm hồ Trasimene vào bản đồ nền

- Xem `tools/build-basemap.mjs` và dữ liệu Natural Earth: hồ không có trong `ne_10m_lakes`, hay bị bước lọc hoặc đơn giản hoá bỏ đi?
- Ưu tiên lấy từ Natural Earth (phạm vi công cộng, không thêm ghi công). Natural Earth có file bổ sung `ne_10m_lakes_europe`; nếu hồ nằm ở đó thì thêm file này vào bước dựng, vẫn lọc hồ chứa và yếu tố hiện đại như hiện nay.
- Nếu Natural Earth không có hồ này, **dừng và ghi vào "Kết quả"**, đừng tự lấy nguồn khác. Nguồn khác (ví dụ đường bờ Copernicus của file trận) kéo theo việc ghi công, là việc phiên chính và người dùng quyết.
- Dựng lại `basemap.json` bằng script, không sửa tay. Ghi vào `public/map/README.md` những gì đổi ở nguồn và bước xử lý.

### 2. Kiểm các hồ khác

- Nếu thêm một file nguồn mới, sẽ có thêm hồ khác trong vùng bản đồ. Liệt kê các hồ mới xuất hiện và loại bỏ hồ nhân tạo hay hồ không có ở thời cổ, theo đúng cách script đang làm.
- Ghi vào "Kết quả" kích thước `basemap.json` trước và sau. Nếu file lớn hơn 15%, nêu lý do và cách giảm.
- Không thêm hồ đã mất từ thời cổ (ví dụ hồ Fucinus) ở task này; thấy đáng làm thì ghi đề nghị.

### 3. Hồ thấy được trong cú bay

- Trong khung chiến trường lúc bay tới và lúc bay về, hồ phải thấy rõ dưới lớp màu thế lực và khung chiến trường, ở cả nền sáng lẫn nền tối.
- Đường bờ của bản đồ nền thô hơn bờ hồ trong cảnh 3D (cảnh dùng dữ liệu Copernicus 30 m); lệch nhau một ít là chấp nhận được. Nếu lệch tới mức chiến trường nằm trên nước hay hồ nằm ngoài khung, ghi vào "Kết quả" kèm ảnh.

### 4. Kiểm tra và ảnh

- `npm run validate`, `npm run lint`, `npm run build` qua.
- Ảnh ở `E:\World_History_Platform_assets\duyet\T-056\`: bản đồ quanh miền trung Ý năm 217 TCN trước và sau (nền sáng và nền tối), và một ảnh lúc bay tới chiến trường. Driver chụp của phiên chính (`E:\World_History_Platform_assets\main-tools\drive`; kịch bản bay có sẵn: `s-transition-k.mjs`): đặt `PORT=9362`.
- Bản đồ ở các năm khác và các vùng khác không đổi ngoài các hồ mới.

### 5. Bờ hồ Trasimene theo file trận (người dùng chọn 2026-11-19, sau review)

Phiên chính đã review phần 1–4: đạt. Người dùng chọn cách (b) trong đề nghị 1 của bạn: hồ Trasimene trên bản đồ nền lấy đường bờ trong file trận, không lấy của Natural Earth. Làm tiếp trên cùng nhánh, rồi T-056 gộp một lượt.

- **Script** (`build-basemap.mjs`): thay hồ `ne_id` 1159109725 của Natural Earth bằng `terrain.lakes[0].outline` trong `src/data/battles/battle-of-lake-trasimene.json`.
  - Đọc thẳng file trận, không chép toạ độ vào script: file trận đổi bờ hồ thì dựng lại là xong.
  - Đổi mét ra kinh độ và vĩ độ bằng đúng phép đổi mà dự án đang dùng cho file trận (`origin`; x về phía đông, y về phía bắc), như `build-terrain.mjs`.
- **Đảo:** theo cùng quy tắc với phần còn lại của bản đồ nền (bỏ đảo dưới khoảng 1 km²). Ghi vào "Kết quả" đảo nào giữ, đảo nào bỏ.
- **Đơn giản hoá:** không dùng sai số chung 0,006° cho hồ này. Sai số đó khoảng 500 m, sẽ làm mất cái vừa sửa được. Bờ sau khi đơn giản hoá phải nằm trong khoảng 50 m so với đường bao của file trận. Ghi số điểm và kích thước `basemap.json` sau khi sửa.
- **Ghi công Copernicus:** bờ này lấy từ mặt nạ nước của Copernicus DEM, nên phải ghi nguồn.
  - Sửa khoá `map.legend.basemap` (cả `en` lẫn `vi`): nói thêm hồ, và nói hồ Trasimene theo Copernicus. Ví dụ: "Đường bờ biển, sông và hồ ngày nay (Natural Earth; hồ Trasimene theo Copernicus DEM, xem phần Giới thiệu)". Giữ ngắn như dòng hiện có.
  - `public/map/README.md`: ghi nguồn mới và cách dựng.
  - Phiên chính sửa README gốc, `docs/data/SOURCES.md` và dòng bản đồ nền trong hộp thoại Giới thiệu khi gộp.
- **Kiểm tra:**
  - Làm lại ảnh 13 với bờ mới: đoàn quân La Mã lúc đầu trận không còn nằm trên nước.
  - Chụp lại ảnh bay tới, và miền trung Ý ở hai mức phóng (sau khi sửa), cả hai nền.
  - Biển, sông và các hồ khác giống hệt từng byte so với bản phần 1–4.
  - `npm run validate`, `npm run lint`, `npm run build` qua.
- Điền thêm vào "Kết quả", commit, rồi báo.

## Ràng buộc

- Chỉ sửa file trong phạm vi. Không sửa file trận và cảnh 3D.
- Không thêm thư viện. Không thêm nguồn dữ liệu có điều kiện ghi công mà chưa hỏi.

## Xong khi

- Hồ Trasimene có trên bản đồ nền và thấy được trong cú bay, hoặc mục "Kết quả" nói rõ vì sao Natural Earth không đủ và đề nghị nguồn khác.
- Các kiểm tra ở mục 4 qua; có ảnh; mục "Kết quả" đã điền.

## Kết quả

Lane 2, 2026-11-19. Hồ Trasimene đã có trên bản đồ nền, thấy rõ khi bay tới và bay về ở cả nền sáng lẫn nền tối. Bờ bắc của hồ trên bản đồ nền lệch 0,7–0,9 km so với bờ thật, nên đoàn quân La Mã trên con đường ven hồ nằm trên nước của bản đồ nền (xem mục "Lệch bờ" và đề nghị 1). `npm run validate`, `npm run lint`, `npm run build` qua.

### Vì sao thiếu

- `ne_10m_lakes` không có hồ Trasimene. Không phải do bước lọc hay đơn giản hoá: dựng lại từ bản Natural Earth đã dùng (tải 2026-11-15) ra đúng từng byte `basemap.json` cũ.
- File này chỉ có các hồ lớn. Quanh Ý nó còn ghi nhầm tên hai hồ: hồ ở chỗ Bolsena mang tên "Lago di Bracciano", hồ ở chỗ Maggiore mang tên "Lago di Como". Bản đồ không hiện tên hồ nên không ảnh hưởng gì.
- Hồ có trong file bổ sung `ne_10m_lakes_europe`: tên "Trasimeno", `ne_id` 1159109725, 20 điểm, không có đảo (đảo nào cũng dưới 1 km²).

### Đã làm

- `src/components/map/tools/build-basemap.mjs` đọc thêm `ne_10m_lakes_europe` (tải 2026-11-19 từ nhánh `master` của natural-earth-vector, sha256 `b4dd9e7a…0369769`).
  - Hồ của file bổ sung được nối vào sau các hồ cũ.
  - Một `ne_id` trong danh sách mà không còn trong file thì script dừng và báo tên hồ.
- `public/map/basemap.json` dựng lại bằng script.
  - So với file cũ: biển, 9 lớp sông và 304 hồ cũ giống hệt từng byte.
  - Chỉ thêm 110 hồ, nằm sau các hồ cũ trong cùng feature `lake`.
- `public/map/README.md`: thêm nguồn mới, cách chọn hồ, ngày tải, và hai lưu ý (hồ Bafa, bờ hồ Trasimene thô).

**Khác yêu cầu: chọn theo danh sách, không lọc.** Task bảo lọc như script đang làm (bỏ `Reservoir` và một danh sách tên). Với file bổ sung, cách này không đủ:

- Trong vùng bản đồ file có 767 hồ từ 1 km² trở lên, một nửa không có tên.
- Nhiều hồ đập vẫn ghi là `Lake`, kể cả trường `lke_type`: La Serena, Orellana, Kremasta, Polyfytos, Mornos, Hirfanlı, hồ Assad, Mosul, Buško Blato, Fierza. Lọc theo phân loại thì những hồ này lên bản đồ thời cổ.
- Vì vậy script lấy theo danh sách `EUROPE_LAKES` (110 hồ, mỗi hồ một dòng ghi tên).
  - Tôi xét từng hồ trong vùng kinh độ 11° T–45° Đ, vĩ độ 30° B–53° B: 204 hồ, gồm Địa Trung Hải, Gaul, miền nam Germania và Biển Đen.
  - Hồ không tên được nhận ra theo toạ độ và hình dạng.
  - Hồ nào không chắc là hồ tự nhiên có từ thời cổ thì không lấy: thiếu một hồ đỡ hại hơn vẽ một hồ đập thế kỷ 20 lên bản đồ thời cổ.
- 563 hồ ngoài vùng đó chưa được xét nên chưa lấy: Scandinavia, Phần Lan, vùng Baltic, Nga, Ireland phía bắc 53° B (Corrib, Mask, Conn), bờ bắc biển Caspi, Lưỡng Hà phía đông 45° Đ.

### Hồ mới (110)

- **Iberia và Gaul (9):** Albufera de València, Grand-Lieu, Biscarrosse-Parentis, Cazaux-Sanguinet, Hourtin-Carcans, Thau, Vaccarès, Bourget, Annecy.
- **Dãy Alps (18):** Neuchâtel, Murten, Biel, Thun, Brienz, Lucerne, Zug, Zürich, Walensee, Lugano, Como (hồ Como thật), Iseo, Starnberg, Ammersee, Chiemsee, Attersee, Traunsee, Wörthersee.
- **Ý và bờ Adriatic (7):** Trasimene, Bracciano (hồ Bracciano thật), Lesina, Varano, đầm Salpi (Salapia, nay là ruộng muối, gần Cannae), Vrana, Prokljan.
- **Pannonia và hạ lưu sông Danube (14):** Neusiedl, Bistreț, Oltina, Brateș, Manta, Kagul, Yalpug–Kugurlui, Katlabukh, Kytai, một hồ trong châu thổ Danube, Dranov, Isacov, Babadag, Tașaul.
- **Hy Lạp và Thrace (11):** Pamvotis (Ioannina), Orestiada (Kastoria), Trichonida, Vegoritida, Dojran, Koroneia, Volvi, Yliki, Vistonida, Burgas (Vaya), Mandra.
- **Anatolia và Kavkaz (24):**
  - Terkos, İznik, Sapanca, Uluabat, Manyas, Marmara (hồ Gygaea), Bafa, Köyceğiz.
  - Salda, Acıgöl, Işıklı, Burdur, Akşehir, Eber, một hồ muối ở bồn địa Konya, Seyfe, Yay.
  - Hazar, Nazik, Erçek, Balık, Çıldır, Aktaş, Paravani.
- **Syria (2):** Sabkhat al-Jabbul, hai phần.
- **Bờ bắc Biển Đen và biển Azov (21):**
  - Các liman Kuchurhan, Khadzhibey, Kuyalnik, Tiligul.
  - Sasyk-Sivash, bốn hồ ở Perekop.
  - Molochnyi, Aktash, Uzunlar, Tobechik, Kiziltash, Vityazevo, Akhtanizovsky, hai liman ở châu thổ Kuban, Akhtarsky, Beysug, Manych-Gudilo.
- **Phía bắc thế giới La Mã (4):** Lough Leane, Steinhuder Meer, Gopło, Svitiaz.

Vài hồ là quyết định riêng, đã ghi trong comment của script:

- **Bafa:** thời cổ là vịnh Latmos, nước biển. Bờ biển của bản đồ là bờ ngày nay, nên vẽ nước ở đó vẫn đúng với thời cổ hơn là vẽ đất.
- **Salpi, Mandra, Kuchurhan, Sasyk, Terkos, Işıklı, Manych-Gudilo:** hồ hay đầm tự nhiên có từ thời cổ, về sau mới đắp đập hay làm ruộng muối, nên bờ ngày nay rộng hơn hoặc khác bờ thời cổ.

### Hồ đã xét mà không lấy (94)

- **Hồ đập, hồ chứa hiện đại (phần lớn):**
  - Tây Ban Nha: 11 hồ embalse.
  - Pháp: Sainte-Croix, Serre-Ponçon, Orient, hồ Der (ghi là "Étang de Bonnevais").
  - Balkan: Buško Blato, Bileća, Vau i Dejës, Fierza, Kremasta, Kastraki, Pineios, Plastiras, Polyfytos, Mornos, Kerkini, Iskar, Dospat, Batak, Studen Kladenets, Zhrebchevo, Ticha, Bicaz, các hồ trên sông Siret, Stânca-Costești.
  - Hungary và Trung Âu: Tisza (Kisköre), Lipno, Orlík, Nové Mlýny, Orava, Jeziorsko, Włocławek, Sulejów, Zemplínska šírava, Solina, Siemianówka.
  - Thổ Nhĩ Kỳ: Demirköprü, Ömerli, Porsuk, Sarıyar, Hirfanlı, hai hồ trên sông Kızılırmak, Seyhan, Çatalan, Almus.
  - Syria và Iraq: hồ Assad, Haditha (ghi là "Qadisiyah"), Mosul, Dukan, Hamrin.
  - Nga và Ukraina: Krasnodar, Veselovskoe, Proletarsk (ghi là "Manych Reservoir"), Dubăsari, và mấy hồ chứa trên đồng cỏ Kuban, Stavropol, Kryvyi Rih.
- **Có từ sau thời cổ:**
  - Valli di Comacchio: nghĩa địa của Spina nằm dưới Valle Trebba và Valle Pega, tức thời cổ chỗ đó là đất.
  - Hai hồ than bùn ở Friesland (Heegermeer, Tjeukemeer), do đào than bùn thời trung cổ.
- **Hồ nhân tạo dù có từ thời cổ:** hồ Homs (Qattinah). Đập có từ thời cổ, nhưng vẫn là hồ nhân tạo.
- **Không chắc là hồ gì:**
  - Đầm lầy Brière.
  - Một vùng gần Aigues-Mortes, có lẽ là ruộng muối.
  - Mostiștea; bốn hồ tròn trên đồng cỏ phía nam Yeysk (hình dạng giống các hồ chứa bên cạnh); phần tây thung lũng Manych.
  - Bahr al-Najaf; một hồ gần Eğirdir (có lẽ là hồ chứa Karacaören); một hồ ở Belarus.
- **Trùng hồ đã có:** Bolsena (`ne_10m_lakes` đã có, chỉ ghi nhầm tên).

### Kích thước `basemap.json`

| | Trước | Sau | Tăng |
|---|---|---|---|
| File | 1 362 101 byte | 1 381 223 byte | +19 122 byte (+1,4%) |
| Nén gzip | 441 580 byte | 447 794 byte | +1,4% |

### Cú bay

- Hồ thấy rõ dưới lớp màu thế lực và khung chiến trường, ở cả hai nền.
  - Nền sáng: hồ màu xám xanh.
  - Nền tối: hồ gần đen.
- Trong khung, lớp phủ màu accent 12% làm nước ngả xám (nền sáng) hay nâu sẫm (nền tối), vẫn tách rõ khỏi màu thế lực.
- Lúc bay về, khung mờ dần nên hồ càng rõ.

### Lệch bờ (task yêu cầu báo kèm ảnh)

- Bờ bắc hồ Trasimene của Natural Earth nằm lệch về phía bắc 0,7–0,9 km so với bờ trong file trận (Copernicus 30 m).
  - Đo ở ba đỉnh bờ bắc của đường bao gốc: 0,9 km ở phía tây lối hẹp Malpasso, 0,7 km ở đồng bằng Tuoro, 0,8 km giữa Tuoro và Passignano.
  - Tính trên mọi điểm bờ thật trong khung: trung bình 0,73 km, xa nhất 1,8 km.
  - Nước chiếm 24% khung trên bản đồ nền, 18% theo file trận.
- Lỗi nằm ở dữ liệu gốc, không phải bước đơn giản hoá: 101 trên 210 vị trí khối quân của file trận nằm trong nước của đường bao gốc (20 điểm), 103 trên 210 sau khi đơn giản hoá (9 điểm).
- Trên bản đồ nền, cả đoàn quân La Mã trên con đường ven hồ ở lúc đầu trận nằm trên nước. Đúng là trường hợp "chiến trường nằm trên nước" task dặn ghi lại.
- Hồ không nằm ngoài khung: hồ chiếm nửa dưới của khung.
- Ảnh 13 vẽ bờ thật (đường xanh đậm), các đảo, khung chiến trường và vị trí các khối quân lúc đầu trận (đỏ: La Mã, tím: quân Hannibal) chồng lên bản đồ nền, ở đúng mức phóng lúc cú bay kết thúc.

### Ảnh

Trong `E:\World_History_Platform_assets\duyet\T-056\`:

- `01`–`04`: miền trung Ý năm 217 TCN, trước và sau, nền sáng và nền tối (mức phóng 6,2). Ở ảnh "sau" thấy Trasimene, Bolsena và Bracciano.
- `05`–`08`: quanh hồ, trước và sau, hai nền (mức phóng 8).
- `09`–`11`: bay tới chiến trường (nền sáng ở 0,7 giây và 1,3 giây, nền tối ở 0,7 giây).
- `12`: bay về, nền tối. Ở nền sáng không chụp kịp giữa cú bay về (cú bay về chỉ dài 1,2 giây, mỗi ảnh chụp mất vài trăm mili giây). Bay về đi qua cùng các mức phóng như bay tới, mà ảnh 09–10 cho thấy hồ rõ trên nền sáng ở những mức phóng đó.
- `13`: lệch bờ so với file trận.

### Ghi chú

- Nhãn tên thế lực tránh nước theo một lưới 0,05° dựng từ hồ và biển của `basemap.json` (`labels/landMask.ts`). Gần các hồ mới, nhãn có thể dời đi một chút; ví dụ nhãn "Các đồng minh Ý" ở ảnh 05 và 06. Ngoài ra bản đồ ở các năm và các vùng khác không đổi.
- Không sửa code vẽ bản đồ; chỉ sửa script dựng, dữ liệu và README.

### Đề nghị cho phiên chính

1. **Bờ hồ Trasimene** (cần phiên chính và người dùng quyết vì kéo theo ghi công). Ba cách:
   - (a) Để nguyên. Cú bay chỉ 2 giây, sau đó cảnh 3D hiện đúng bờ.
   - (b) Script dựng thay hồ Trasimene của Natural Earth bằng đường bờ trong file trận. Đường này bao trọn cả hồ (`terrain.lakes[0].outline`, 239 điểm, kèm 3 đảo) và đã có trong repo. Phải thêm Copernicus vào dòng nguồn ở chú giải bản đồ ("Đường bờ biển và sông ngày nay (Natural Earth)"). Tôi nghiêng về cách này: ít việc, hồ đúng hình ở mọi mức phóng.
   - (c) Chỉ trong cú bay mới vẽ hồ của file trận lên khung. Cách này phức tạp hơn vì phải che phần nước thừa của bản đồ nền bằng màu đất cộng màu thế lực.
2. **Hồ đã mất từ thời cổ**, nếu muốn thêm (Natural Earth không có, cần nguồn tái dựng và ghi công riêng):
   - Hồ Fucinus (khoảng 140 km², tháo cạn năm 1878; đường hầm của Claudius).
   - Hồ Copais ở Boeotia (khoảng 200 km², tháo cạn những năm 1880).
   - Hồ Velinus (Curius Dentatus tháo nước năm 271 TCN).
   - Đầm Ligustinus ở cửa sông Guadalquivir.
   - Fucinus và Copais đáng làm nhất.
3. **Hồ ngoài vùng đã xét** (Scandinavia, Ireland phía bắc, Nga, Caspi): khi bản đồ cần tới các vùng đó thì xét tiếp theo cùng cách, thêm `ne_id` vào `EUROPE_LAKES`.
