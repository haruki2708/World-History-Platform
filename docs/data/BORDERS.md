# Dữ liệu biên giới

Cập nhật: 2026-11-16. Đợt 1 (lane 3): các mốc 509, 264 và 146 TCN. Đợt 2 (phiên chính, vì lane 3 hết hạn mức): 11 mốc còn lại và 6 thế lực mới, xem mục "Đợt 2" ở cuối.

## Cách dựng

Biên giới được **vẽ tay**, dùng hai bộ nguồn mở làm tham chiếu: bản đồ phạm vi công cộng của Shepherd và dữ liệu Cliopatria (xem `SOURCES.md`). Không bộ dữ liệu polygon nào được ghép thẳng vào, vì hai lý do:

- Polygon của Cliopatria hụt bờ biển khoảng 0,1–0,3° (để lại dải đất không màu dọc bờ) và xê dịch nhẹ giữa các "năm khung". Ghép nguyên vào thì khi kéo thanh thời gian, một đường biên không đổi vẫn nhảy qua lại.
- Hai bộ có polygon chi tiết khác (historical-basemaps, AWMC) dùng giấy phép copyleft nên không dùng.

Nguồn vẽ nằm ở `scripts/borders/`:

- `arcs.mjs`: các **đường ranh giới dùng chung**, ví dụ sông Halycus ở Sicily, đường Rubicon, Fossa Regia, dãy Pindus. Mỗi đường vẽ một lần và được dùng cho cả hai thế lực hai bên, cho mọi mốc cần đến nó. Nhờ vậy đường biên chỉ dịch chuyển khi lịch sử nói nó dịch chuyển.
- `snapshots.mjs`: từng mốc, mỗi thế lực là một danh sách polygon. Vòng polygon ghép từ điểm `[kinh độ, vĩ độ]`, tên đường dùng chung (`"-tên"` là đi ngược chiều), và hai loại mảnh lấy từ bản đồ nền Natural Earth (phạm vi công cộng):
  - `{ island: [lng, lat] }`: nguyên hòn đảo chứa điểm đó, theo đúng đường bờ (Sicily, Sardinia, Crete, Euboea, các đảo Cyclades…).
  - `{ coast: [từ, đến] }`: một đoạn bờ đất liền. Chỉ dùng ở các eo hẹp, nơi hai bờ thuộc hai thế lực khác nhau: vịnh Euboea, bờ Epirus đối diện Corcyra, eo Hellespont và Bosporus, bờ Ionia đối diện Lesbos và Chios.

Ở những nơi khác, phía biển của polygon vẽ lấn hẳn ra biển. Lớp biển của bản đồ vẽ đè lên nên phần tràn ra không hiện; nhờ vậy bờ biển luôn được tô kín.

Tạo lại file:

```
node scripts/build-borders.mjs          # ghi public/data/borders/*.geojson và src/data/border-snapshots.json
node scripts/build-borders.mjs --check  # chỉ kiểm tra, không ghi
```

Script build kiểm tra: không có hai lãnh thổ nào chồng nhau trên đất liền (quét lưới 0,05°, dùng mặt nạ đất của bản đồ nền; chồng nhau ngoài biển thì cho phép), mỗi `polityId` có trong `polities.json` và còn tồn tại ở năm của mốc, mỗi mốc có ít nhất một nguồn. Script in kèm diện tích đất của từng thế lực để soát. Sau đó vẫn chạy `npm run validate`.

## Quy ước chung

- Một mốc thể hiện biên giới **tại năm đó** và được giữ đến mốc sau. Mốc 264 là đầu năm 264, trước khi La Mã sang Sicily. Mốc 146 là cuối năm 146, sau khi Carthage và Corinth bị phá.
- Tô màu vùng **cai trị trực tiếp hoặc phụ thuộc rõ ràng**. Vùng không thuộc thế lực nào trong `polities.json` để trống: Ba Tư năm 509, Thrace, Illyria (trừ ven biển phía nam năm 146), Bithynia, Galatia, người Iberia và Celtiberia, Mauretania, vương quốc Bosporus, Armenia…
- **Các thành bang Hy Lạp** gồm thành bang, liên minh (Aetolia, Achaea) và các thuộc địa ven biển. Các vương quốc Hy Lạp hoá không có trong `polities.json` thì để trống. Đảo Aegean không thuộc vương quốc nào được tính là thành bang Hy Lạp.
- **La Mã và các đồng minh Ý** (264, 146): `rome` chỉ là lãnh thổ công dân La Mã (ager Romanus). Phần còn lại của nước Ý dưới quyền La Mã là `italian-allies`, gồm cả thuộc địa Latinh. Vẽ khái quát theo bản đồ "Growth of Roman Power in Italy" của Shepherd, không vẽ từng mảnh nhỏ. Diện tích tính ra năm 264: La Mã 26 nghìn km², đồng minh 104 nghìn km².
- Độ chính xác: đúng về đại thể (khoảng 0,1–0,3°). Ranh giới không có hiệp ước xác định đều là ước lượng.

## Từng mốc

### 509 TCN

| Thế lực | Phạm vi | Căn cứ |
|---|---|---|
| La Mã | Vùng quanh Rome hai bên sông Tiber, chưa tới Veii và chưa tới biển (khoảng 740 km²) | Shepherd, "Roman territory about 500 B.C."; Cliopatria "Roman Kingdom" (859 km²) |
| Liên minh Latinh | Latium từ hạ lưu sông Tiber tới Tarracina | Polybius 3.22: các thành Latinh ven biển (Ardea, Antium, Laurentum, Circeii, Tarracina) mà hiệp ước gọi là thần phục Rome vẫn vẽ là Latinh, vì đó là quan hệ bá quyền chứ không phải lãnh thổ |
| Etruscan | Etruria (giữa sông Arno và sông Tiber), đồng bằng sông Po (Etruria Padana), đồng bằng Campania quanh Capua và Nola | Wikipedia "Etruscan civilization" (phạm vi lớn nhất khoảng 500 TCN); Cliopatria |
| Samnite | Vùng núi Samnium | Shepherd (nhãn Samnium). Ước lượng, chưa có nguồn polygon |
| Thành bang Hy Lạp | Magna Graecia (mũi Calabria và bờ Ionia tới Taras), Cumae, Poseidonia và Elea, đông và nam Sicily, Himera, Massalia, Emporion, Hy Lạp từ Thessaly trở xuống, Chalcidice, Euboea, Corcyra, Crete, Cyclades, Cyrene, bờ tây Biển Đen, Olbia, Heraclea Pontica, Sinope | Shepherd, "Greek and Phoenician Settlements… about 550 B.C." |
| Carthage | Carthage và vùng phụ cận, tây nam Sardinia, Motya, Panormus và Soloeis ở tây Sicily, Ibiza | Polybius 3.22–23: Carthage coi Sardinia và Libya là của mình, ở Sicily chỉ phần thuộc quyền Carthage |
| Gaul | Gaul trừ dải ven Địa Trung Hải (người Ligures, người Iberia, Massalia) | Shepherd |
| Macedonia | Hạ Macedonia | Cliopatria "Macedonian Empire" (−550 đến −501) |

Để trống: Ionia, Aeolis, vùng Hellespont, Cyprus, ven biển Thrace, các đảo phía đông Aegean, Ai Cập và Cận Đông (thuộc Ba Tư, chưa có trong `polities.json`). Corsica cũng để trống.

### 264 TCN

| Thế lực | Phạm vi | Căn cứ |
|---|---|---|
| La Mã | Dải ager Romanus: nam Etruria, Latium, bắc Campania, xứ Sabine, Picenum và ager Gallicus | Shepherd, "Growth of Roman Power in Italy" (khái quát) |
| Đồng minh Ý | Phần còn lại của bán đảo phía nam sông Arno và sông Rubicon | Shepherd, "Roman territory at the beginning of the 1st Punic War"; Wikipedia "First Punic War" (La Mã chinh phục bán đảo phía nam sông Arno năm 272) |
| Gaul | Gaul ngoài dãy Alps (trừ Massalia) và Gaul trong dãy Alps: đồng bằng sông Po từ sông Sesia tới sông Adige | Shepherd |
| Carthage | Bắc Phi từ Đại Tây Dương tới bàn thờ Philaeni (vùng lõi Tunisia và dải ven biển), nam Tây Ban Nha, Balearic, Sardinia, Corsica, Malta, Sicily phía tây sông Halycus | Wikipedia "First Punic War"; Livius.org "Sicily (5)" (sông Halycus là biên giới với Carthage); Cliopatria |
| Syracuse | Đông nam Sicily và bờ đông tới Tauromenium | Wikipedia "Hiero II of Syracuse" (lãnh thổ được xác nhận năm 263) |
| Thành bang Hy Lạp | Hy Lạp phía nam Thessaly, Corcyra, Crete, Rhodes, Lesbos, Chios, Cyclades, Massalia, Emporion, Byzantium, bờ tây Biển Đen, Olbia, Chersonesos, Heraclea, Sinope | Cliopatria "Greek Colonies" (−264 đến −257) cho các thuộc địa; Lesbos, Chios, Cyclades theo quy ước chung |
| Macedonia | Macedonia, Paeonia, Thessaly, Chalcidice, Euboea | Cliopatria "Antigonid Macedonia". Không lấy phần Thrace phía đông sông Nestos mà Cliopatria gán cho Macedonia |
| Epirus | Epirus phía bắc vịnh Ambracia, tới dãy Pindus | Shepherd (bản đồ Diadochi). Ước lượng |
| Ai Cập Ptolemaios | Ai Cập, bắc Sinai, Judaea, Phoenicia và Coele-Syria (tới khoảng 35,3° Bắc), Cyprus, nam Caria, Lycia, Pamphylia và Cilicia Tracheia | Cliopatria. Phần Cilicia của Cliopatria kéo sâu vào nội địa tới tận Commagene; ở đây chỉ giữ dải ven biển |
| Đế quốc Seleukos | Phần lớn Tiểu Á, Syria phía bắc Coele-Syria, Lưỡng Hà, Iran tới Bactria | Cliopatria |
| Pergamon | Vùng nhỏ quanh Pergamon | Cliopatria |
| Pontus | Bờ nam Biển Đen từ Amastris tới Colchis, trừ Sinope | Cliopatria |

Để trống: Messana (người Mamertine) và miền trung Sicily, Cyrenaica (Cliopatria tách thành vương quốc riêng của Magas), Bithynia, Galatia, Armenia, Thrace, Illyria, các bộ lạc Numidia (chưa thống nhất thành vương quốc), Liguria, Veneti.

### 146 TCN

| Thế lực | Phạm vi | Căn cứ |
|---|---|---|
| La Mã | Ager Romanus như năm 264, thêm Gaul bên này sông Po (Cispadana); Sicily, Sardinia, Corsica, Malta; Hispania Citerior và Ulterior; tỉnh Africa; Macedonia cùng Epirus, Thessaly, Achaea và ven biển nam Illyria; Euboea, Corcyra | Shepherd (bản đồ năm 264 đến thời Diocletian: các vùng có năm 146, 229, 238); Wikipedia "Fossa regia", "Hispania Citerior". Cliopatria (−144 đến −127) còn tính Dalmatia, ven biển Thrace, Lycia và Caria là của La Mã; ở đây không theo |
| Đồng minh Ý | Etruria, Umbria, Liguria, Gaul bên kia sông Po (Transpadana), người Veneti, và miền nam Ý | Shepherd, "Roman allies about 100 B.C." |
| Gaul | Gaul ngoài dãy Alps (trừ Massalia) | Shepherd |
| Numidia | Từ sông Mulucha tới Fossa Regia, cùng dải ven biển Syrtis tới bàn thờ Philaeni | Cliopatria "Kingdom of Numidia"; Wikipedia "Fossa regia" |
| Thành bang Hy Lạp | Crete, Rhodes, Lesbos, Chios, Cyclades, Massalia, Byzantium, bờ tây Biển Đen, Olbia, Chersonesos, Heraclea | Cliopatria "Greek City-States" (−164 đến −145) |
| Ai Cập Ptolemaios | Ai Cập, Cyrenaica, Cyprus | Cliopatria |
| Đế quốc Seleukos | Syria, Phoenicia, Judaea, Lưỡng Hà, Babylonia | Cliopatria (−164 đến −145). Judaea gộp vào Seleukos, vì Cliopatria chỉ tách Judaea từ năm −144 |
| Parthia | Cao nguyên Iran | Cliopatria |
| Pergamon | Tây Tiểu Á từ Propontis tới Pamphylia, phía bắc sông Maeander | Cliopatria |
| Pontus | Bờ nam Biển Đen, có Sinope | Cliopatria |

Để trống: Carthage (bị phá năm 146), Mauretania, người Lusitania và Celtiberia, Balearic, Thrace, Dalmatia, Bithynia, Galatia, Cappadocia, Cilicia, Lycia và Caria, Armenia, Nabataea.

## Hạn chế đã biết

- Bờ biển và sông là của ngày nay (xem `public/map/README.md`).
- Biên giới trong lục địa (Gaul, nội địa Tây Ban Nha và Numidia, phía đông Đế quốc Seleukos) chỉ là ước lượng.
- Ranh giới giữa ager Romanus và đồng minh đã được khái quát mạnh: các thuộc địa nhỏ và đất bị tịch thu rải rác không được vẽ.
- Thuộc địa Hy Lạp vẽ thành dải ven biển rộng khoảng 0,2–0,4°, rộng hơn lãnh thổ thật để còn nhìn thấy ở mức zoom của bản đồ.

## Đợt 2 (phiên chính, 2026-11-16)

### Cách làm

Cùng phương pháp và cùng script với đợt 1. Mốc nào có đường biên không đổi thì dùng lại nguyên hình của đợt 1 (hàm `polygonOf` trong `snapshots.mjs` lấy hình theo thế lực và thứ tự, kèm kiểm tra điểm đầu để không lấy nhầm). Các đường biên mới được khái quát từ các bài Wikipedia ghi trong `sources` của từng mốc (đọc ngày 2026-11-16) và hiểu biết lịch sử phổ thông. Chúng **không** được đối chiếu từng nét với các bản đồ của Shepherd như đợt 1, nên độ chính xác thấp hơn đợt 1; nên được soát lại khi có thời gian.

### Thế lực mới

| Thế lực | Năm | Ghi chú |
|---|---|---|
| Đế quốc Ba Tư (`achaemenid-empire`) | 550–330 | Có ở 509 và 338: Tiểu Á cùng các đảo phía đông Aegean, Cận Đông, Ai Cập, Lưỡng Hà, Iran tới sông Ấn; năm 509 thêm Cyprus và dải Thrace ven biển (sau chiến dịch năm 513) |
| Vương quốc Armenia | từ 331 | Orontid tự chủ từ 331, nhà Artaxias từ 189; một hình từ 290 tới 201, một hình khác từ 168 |
| Vương quốc Bithynia | 297–74 | Tây bắc Tiểu Á, phía đông eo Bosporus; năm 88 bị Mithridates chiếm (tính vào Pontus); năm 74 để lại cho La Mã |
| Vương quốc Cappadocia | từ 331 | Có ở 290 và từ 241; năm 264 vẫn theo đợt 1 (thuộc Seleukos); năm 88 bị Pontus chiếm |
| Người Galatia | 275–25 | Quanh Ancyra, Pessinus, Tavium; năm 88 bị Pontus chiếm |
| Vương quốc Mauretania | — | Từ Đại Tây Dương tới sông Mulucha (201–129); từ 88 thêm miền tây Numidia (sau Jugurtha); năm 30 do La Mã trực tiếp cai quản (33–25), tô màu La Mã |

Không thêm Thrace (chia nhỏ sau thế kỷ 4; năm 338 thuộc Macedonia) và Nabataea (nằm ở rìa bản đồ). Màu Numidia đổi sang `#5f9e6e` để tách khỏi Ai Cập.

### Các mốc

| Năm | Điểm chính |
|---|---|
| 509 (sửa) | Thêm Ba Tư |
| 338 | La Mã sau Chiến tranh Latinh (nam Etruria, Latium, bắc Campania); Etruria, Samnium; Macedonia của Philip II gồm cả Thrace và Thessaly; Syracuse ở đông Sicily, Carthage ở tây (ranh giới sông Halycus); Ba Tư |
| 290 | La Mã thêm xứ Sabine tới Adriatic; đồng minh: Etruria, Umbria, Picenum, Samnium, Campania, Apulia; Lucania và Bruttium để trống; Tiểu Á phía tây (của Lysimachus) để trống; Seleukos từ Syria tới Ấn Độ |
| 264 (sửa) | Thêm Bithynia, Galatia, Armenia vào các khoảng trống |
| 241 | La Mã có Sicily trừ vương quốc Syracuse; Carthage mất Sicily, vẫn giữ Sardinia và Corsica; Parthia tách khỏi Seleukos; Cyrenaica về lại Ai Cập |
| 218 | La Mã có Sardinia, Corsica, Corcyra, Gaul trong dãy Alps; Tây Ban Nha của nhà Barca tới sông Ebro |
| 201 | Sau Zama: La Mã có cả Sicily, Tây Ban Nha; Carthage chỉ còn vùng lõi và các thành Syrtis; Numidia của Masinissa; Mauretania |
| 168 | Sau Pydna: Macedonia để trống (bốn nước cộng hoà dưới quyền bảo trợ của La Mã); Thessaly tính vào các thành bang Hy Lạp; Pergamon lớn sau hoà ước Apamea; Seleukos mất Tiểu Á nhưng có Coele-Syria |
| 146 (sửa) | Thêm Bithynia, Galatia, Cappadocia, Armenia, Mauretania |
| 129 | Tỉnh Asia; Tây Ban Nha gần hết bán đảo; Seleukos chỉ còn Syria; Parthia có Lưỡng Hà |
| 88 | Cả nước Ý là La Mã (sau Chiến tranh Đồng minh); Gallia Narbonensis; Pontus của Mithridates chiếm Bithynia, Cappadocia, Galatia, tỉnh Asia, Chersonesos và Bosporus; Cyrenaica để trống (các thành tự do, 96–74) |
| 63 | Sau Pompey: La Mã có Bithynia và Pontus, Cilicia, Syria (gồm Judaea), Crete, Cyrenaica; Armenia, Cappadocia, Galatia là vương quốc chư hầu (vẫn tô màu riêng) |
| 50 | Toàn bộ Gaul và Cyprus thuộc La Mã |
| 30 | Ai Cập, Numidia, Mauretania, Massalia thuộc La Mã |

### Đơn giản hoá đã biết

- Gaul trong dãy Alps (Cisalpina) tô theo hình năm 146 từ năm 218, dù người Gaul nổi dậy trong Chiến tranh Punic lần hai và chỉ bị khuất phục hẳn khoảng năm 191. Liguria cũng tô từ 218, dù bị chinh phục dần trong thế kỷ 2.
- Tây Ban Nha của La Mã năm 201 và 168 dùng lại hình năm 146.
- Pergamon từ 241 tới 201 dùng lại hình nhỏ năm 264, dù Attalus I có lúc nắm vùng rộng hơn.
- Năm 88, Armenia dùng hình năm 146; đế quốc lớn nhất của Tigranes (gồm cả Syria) là từ năm 83.
- Năm 63 trở đi, toàn bộ hình Pontus năm 146 tô màu La Mã, kể cả phần phía đông được giao cho các vua chư hầu.
- Judaea (nhà Hasmonean, tự chủ khoảng 140–63) nằm trong hình Syria; Commagene, Osroene, Atropatene, Nabataea, Illyria, Thrace để trống hoặc gộp vào nước lớn bên cạnh.

### Kiểm tra

- `node scripts/build-borders.mjs`: 14 mốc, không chồng lấn trên đất liền; diện tích tính ra hợp lý (Ba Tư năm 509 khoảng 5,3 triệu km², La Mã năm 290 khoảng 19 nghìn km², Pontus năm 88 khoảng 430 nghìn km², La Mã năm 30 khoảng 3,1 triệu km²).
- Độ chênh màu giữa mọi cặp thế lực có chung đường biên (59 cặp, cả hai chế độ sáng và tối, màu tô 45% trên nền đất): ΔE nhỏ nhất 13,5 (các thành bang Hy Lạp và Syracuse).
- Đã xem bản đồ trong app ở 12 năm.
