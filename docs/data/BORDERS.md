# Dữ liệu biên giới

Cập nhật: 2026-11-16. Đợt 1 (lane 3): các mốc 509, 264 và 146 TCN. Đợt 2 (phiên chính, vì lane 3 hết hạn mức): 11 mốc còn lại và 6 thế lực mới, xem mục "Đợt 2". Soát lại đợt 2 (lane 3, T-012): xem mục "Soát lại đợt 2" ở cuối.

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
npm run borders                         # ghi public/data/borders/*.geojson và src/data/border-snapshots.json
node scripts/build-borders.mjs --check  # chỉ kiểm tra, không ghi
```

Script build kiểm tra:

- Không có hai lãnh thổ nào chồng nhau trên đất liền (quét lưới 0,05°, dùng mặt nạ đất của bản đồ nền; chồng nhau ngoài biển thì cho phép).
- Mỗi `polityId` có trong `polities.json` và còn tồn tại ở năm của mốc; mỗi mốc có ít nhất một nguồn.
- **Màu** (từ T-012): hai thế lực có đất liền chạm nhau ở một mốc (kể cả chạm chéo ô lưới) phải chênh màu CIE76 ΔE từ 12 trở lên. Màu đem so là màu bản đồ thực vẽ: màu thế lực ở độ mờ của lớp tô (`TERRITORY_OPACITY.fill` trong `src/components/map/mapStyle.ts`) đè lên màu đất `--map-land` của cả chế độ sáng lẫn tối (đọc từ `src/app/globals.css`). Script in số cặp láng giềng và cặp có ΔE nhỏ nhất.

Script in kèm diện tích đất của từng thế lực để soát. Sau đó vẫn chạy `npm run validate`.

**Gộp polygon** (từ T-012): khi ghi file, các polygon chạm nhau của cùng một thế lực được gộp làm một, để bản đồ không vẽ đường kẻ giữa chúng (ví dụ các tỉnh La Mã từ năm 241). Cách gộp: bỏ các cạnh xuất hiện ở cả hai chiều (đường biên chung vẽ từ cùng một arc hay cùng các điểm), rồi nối phần còn lại thành vòng. Kết quả chỉ được dùng nếu phủ đúng các ô lưới như các mảnh rời (chênh tối đa 2 ô có tâm nằm đúng trên đường kẻ); nếu không, giữ các mảnh rời. Các kiểm tra ở trên chạy trên các mảnh như đã vẽ.

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

## Soát lại đợt 2 (T-012, lane 3, 2026-11-16)

### Cách soát

- Mỗi mốc được chồng lên dòng Cliopatria chứa năm của mốc (ảnh so sánh: tô màu là dữ liệu dự án, nét đứt là Cliopatria), và đối chiếu với các bản đồ Shepherd đã dùng ở đợt 1, thêm bản đồ "The Macedonian Empire, 336–323 B.C." cùng atlas. Chỗ nào hai bên khác nhau thì tra bài Wikipedia tương ứng (link nằm trong `sources` của mốc; chỉ dẫn link, không chép).
- Ưu tiên vùng Địa Trung Hải trước, rồi tới Tiểu Á và phía đông.
- Mọi đường biên mới vẽ theo phương pháp cũ: đường dùng chung đặt trong `arcs.mjs` (`senones`, `rubicon-west`, `saldae`, `pergamon-attalid`), các hình mới nằm trong khối "T-012" của `snapshots.mjs`.

### Kết quả từng mốc

| Năm | Kết quả | Căn cứ |
|---|---|---|
| 509 | Đã soát, giữ nguyên. Ba Tư khớp Cliopatria ở Tiểu Á và Cận Đông. Cliopatria vẽ theo năm khung −530 nên Ai Cập còn độc lập; ở đây Ai Cập thuộc Ba Tư từ 525 như đợt 2 đã ghi | Cliopatria; Wikipedia "Achaemenid Empire" |
| 338 | **Sửa:** người Senones giữ bờ Adriatic từ Ariminum tới Ancona (sông Aesis), tô màu Gaul liền với Gaul trong dãy Alps. Phần còn lại giữ nguyên: Macedonia gồm Thrace tới dãy Haemus và Thessaly khớp bản đồ Shepherd năm 336 | Wikipedia "Senones" (định cư giữa Ariminum và Ancona, bị khuất phục năm 283); Shepherd "The Macedonian Empire, 336–323 B.C." |
| 290 | **Sửa:** Etruria (từ đất La Mã tới sông Arno) tô Etruscan thay vì đồng minh; Picenum là đồng minh; Umbria để trống; người Senones như năm 338. Phía đông giữ nguyên | Wikipedia "Roman–Etruscan Wars" (chinh phục Etruria xong năm 265–264), "Picentes" (hiệp ước năm 299), "Umbri" (chinh phục xong khoảng năm 260); Cliopatria "Etruscans" (−291 đến −272) |
| 264 | Đã soát phần đợt 2 thêm (Bithynia, Galatia, Armenia): khớp Cliopatria (−279 đến −257). Giữ nguyên | Cliopatria |
| 241 | Đã soát, giữ nguyên. Pergamon vẫn là hình nhỏ: Attalus I mới lên ngôi năm 241, và Cliopatria (−279 đến −226) cũng vẽ nhỏ. Cyrenaica về lại Ai Cập và Parthia tách riêng khớp Cliopatria (−247 đến −240) | Cliopatria |
| 218 | **Sửa:** Gaul trong dãy Alps tô màu Gaul (người Cenomani vẫn theo La Mã nhưng không vẽ tách riêng); Liguria để trống; thêm vùng bảo hộ của La Mã ở nam Illyria (Apollonia, Epidamnus, người Parthini và Atintani, từ năm 229); Pergamon của Attalus I theo Cliopatria (−223 đến −213), từ vịnh Adramyttium tới Ephesus. Giữ nguyên Tây Ban Nha của nhà Barca: Cliopatria vẽ rộng hơn vào nội địa, nhưng chưa nguồn văn bản nào đã đọc cho ranh giới, nên giữ hình khái quát | Wikipedia "Cisalpine Gaul" (năm 218 người Boii và Insubres theo Carthage, La Mã bỏ Cisalpina tới sau năm 202, chinh phục xong năm 191), "Ligures" (khuất phục 187–155), "Illyrian Wars"; Cliopatria |
| 201 | **Sửa:** Gaul trong dãy Alps, Liguria, Illyria như năm 218; Pergamon theo Cliopatria (−212 đến −189); Tây Ban Nha của La Mã bỏ thung lũng thượng Ebro, phần còn lại giữ hình năm 146 | Wikipedia "Celtiberian Wars" (sau năm 201 hai tỉnh ứng với Aragon, Catalonia, Valencia và Andalusia; thượng Ebro giành được trong chiến tranh 181–179); Shepherd (vùng "acquired up to the end of the 2nd Punic War") |
| 168 | **Sửa:** Rhodes giữ Caria phía nam sông Maeander và Lycia (tô màu thành bang Hy Lạp); Seleukos giữ Cilicia; vùng bảo hộ Illyria mở tới Lissus. Giữ nguyên: Tây Ban Nha hình năm 146 (hoà ước của Gracchus năm 179 đem lại 24 năm yên ổn); Macedonia để trống; Liguria là đồng minh (kháng cự chính chấm dứt năm 175) | Wikipedia "Treaty of Apamea" (Antiochus giữ Cilicia, phần lớn Lycia và Caria về Rhodes), "Illyrian Wars", "Celtiberian Wars", "Ligures"; Cliopatria "Rhodes" (−170 đến −165) |
| 146 | Đã soát phần đợt 2 thêm (Bithynia, Galatia, Cappadocia, Armenia, Mauretania): khớp Cliopatria. Giữ nguyên | Cliopatria |
| 129 | **Sửa:** Caria thuộc tỉnh Asia (Lycia vẫn tự do). Giữ nguyên: Judaea trong hình Syria (Antiochus VII vây Jerusalem năm 134; nhà Hasmonean nộp tiền và gửi quân theo ông); Đại Phrygia được giao cho Pontus năm 129–116, nhưng các nguồn đã đọc không cho ranh giới để vẽ | Wikipedia "Asia (Roman province)", "Antiochus VII Sidetes" |
| 88 | **Sửa:** Judaea nhà Hasmonean để trống; Seleukos chỉ còn Syria và Phoenicia; Armenia nhỏ lại ở phía đông; ranh giới Mauretania–Numidia dời về Saldae (khoảng 5,3° Đông); Caria thuộc Pontus cùng tỉnh Asia. Ranh giới Mauretania–Numidia là **lỗi rõ ràng**: đường cũ ở khoảng 1,5° Đông đặt Iol, kinh đô phía đông của Mauretania năm 49, sang phía Numidia | Cliopatria (Judea, Seleukos −91 đến −78; Armenia −91 đến −88; Mauretania và Numidia −91 đến −43); Wikipedia "Tigranes the Great" (nhường "bảy mươi thung lũng" ở Caspiane cho Parthia, là chư hầu Parthia tới cuối thập niên 80), "Mauretania" |
| 63 | **Sửa:** chỉ dải bờ Pontus là của La Mã, nội địa để trống (vua chư hầu); Caria thuộc La Mã; ranh giới Mauretania–Numidia như năm 88 | Wikipedia "Bithynia et Pontus" (phần phía đông là nước chư hầu của Deiotarus); Cliopatria "Kingdom of Pontus" (−63 đến −26) |
| 50 | **Sửa:** thêm Illyricum (bờ Dalmatia từ sông Timavus tới Lissus); Pontus, Caria, Mauretania như năm 63 | Wikipedia "Illyricum (Roman province)" (vùng chỉ huy của Caesar từ năm 59); Shepherd (Dalmatia tô màu "up to the death of Caesar"); Cliopatria |
| 30 | **Sửa:** Illyricum, Pontus, Caria như năm 50 | Như năm 50 |

### Các đơn giản hoá của đợt 2

| Đơn giản hoá | Kết quả |
|---|---|
| Gaul trong dãy Alps tô theo hình năm 146 từ năm 218; Liguria tô từ năm 218 | Đã sửa (218, 201). Từ năm 168: Gaul bên này sông Po là của La Mã, bên kia sông Po và Liguria là đồng minh, như đợt 1 |
| Tây Ban Nha của La Mã năm 201 và 168 dùng lại hình năm 146 | 201: đã sửa. 168: giữ nguyên (hoà ước năm 179) |
| Pergamon từ 241 tới 201 dùng hình nhỏ năm 264 | 218, 201: đã sửa. 241: giữ nguyên (Attalus I mới lên ngôi) |
| Armenia năm 88 dùng hình năm 146 | Đã sửa, nhưng theo hướng ngược lại: năm 88 Armenia **nhỏ hơn** năm 146 (đã nhường bảy mươi thung lũng); đế quốc lớn của Tigranes là từ năm 83, không có mốc nào trùng |
| Từ năm 63, toàn bộ hình Pontus tô màu La Mã | Đã sửa |
| Judaea nằm trong hình Syria | 88: đã sửa. 129, 63, 50, 30: giữ nguyên (chư hầu của Seleukos, rồi của La Mã) |
| Commagene, Osroene, Atropatene, Nabataea, Thrace để trống | Giữ nguyên: không có trong `polities.json` |
| Illyria để trống | Đã sửa: vùng bảo hộ năm 218–168, Illyricum năm 50 và 30. Năm 146–63 nam Illyria vẫn nằm trong Macedonia như đợt 1 |

### Còn lại

- Gaul trong dãy Alps bị La Mã chinh phục năm 222 rồi mất năm 218. Không có mốc nào giữa 241 và 218, nên giai đoạn 222–218 không hiện trên bản đồ.
- Tây Ban Nha của nhà Barca năm 218 và Đại Phrygia năm 129 (xem bảng trên).
- Người Veneti để trống tới năm 168, như đợt 1 đã vẽ; chưa đối chiếu thời điểm họ thành đồng minh.

### Kiểm tra

- `npm run borders`: 14 mốc, không chồng lấn trên đất liền; 54 cặp thế lực có đất liền chạm nhau, ΔE nhỏ nhất 13,5 (thành bang Hy Lạp và Syracuse, năm 338 và 290); 61 polygon được gộp vào mảnh cùng thế lực bên cạnh; mỗi file 19–45 KB.
- Cả 35 link nguồn trong `border-snapshots.json` đều phản hồi (kiểm tra ngày 2026-11-16).
- Đã xem cả 14 mốc trên app (`npm run dev`, chế độ tối, 1440×900): chú giải đúng từng năm, console không có cảnh báo, không còn đường kẻ bên trong lãnh thổ La Mã.
