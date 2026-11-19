# T-054: Hộp thoại Giới thiệu khi app có hai trận 3D

- **Lane:** 1
- **Model đề xuất:** Opus 5.5, effort `high`. Task nhỏ, chủ yếu là chữ.
- **Nhánh:** `lane1/T-054-about-two-battles` (phiên chính đã tạo sẵn từ `main` trong worktree của bạn).
- **Phạm vi file:** `src/components/shell/` (hộp thoại Giới thiệu); khoá `about.*` trong `src/lib/i18n/messages.ts`, cả `en` lẫn `vi`.

## Bối cảnh

Đợt K đã đưa **trận 3D thứ hai, hồ Trasimene (217 TCN)** vào `main` (T-051, T-052, T-053, gộp 2026-11-19). Sự kiện `battle-of-lake-trasimene` đã có nút xem trận trong app.

Hộp thoại Giới thiệu (`AboutDialog.tsx`) lấy số trận và tên trận từ dữ liệu (`hasBattle`), nên phần đó tự đúng. Nhưng **năm khoá viết riêng cho Cannae** giờ nói sai hoặc nói thiếu, vì chúng nằm trong danh sách chung "Trận đánh 3D là phỏng dựng" và mục ghi công:

| Khoá | Vì sao phải sửa |
|---|---|
| `about.accuracy.battle.campGuard` | Chỉ nói về toán giữ trại ở Cannae |
| `about.accuracy.battle.time` | "Cannae, một trận khoảng 11 giờ…"; Trasimene dài sáu giờ trong cảnh |
| `about.accuracy.battle.scenery` | Ba trại, thành Cannae, đồng bằng mùa hè, "Polybius gọi vùng này là không có cây": đều là Cannae |
| `about.accuracy.battle.dust` | Bụi và gió Volturnus là của Cannae; Trasimene có sương mù |
| `about.credits.battleSources` | Chỉ ghi nguồn của Cannae |

Đọc trước:
- `docs/ARCHITECTURE.md`, mục "Link chia sẻ, giới thiệu và phím tắt" (ý "Giới thiệu") và mục "Trận đánh 3D": "Quân nấp", "Hồ", "Sương mù".
- `docs/data/battles/trasimene.md`: mục 3 (vị trí còn tranh cãi), mục 4 (bờ hồ), mục 6 (ngày và giờ), mục 7 (sương mù), mục 8 (cảnh vật).
- `docs/tasks/T-053-trasimene-scene.md`, mục "Kết quả", phần "Cho hộp thoại Giới thiệu ở chặng 3": lane 3 đề nghị lời cho sương mù, hồ và quân nấp. Dùng làm điểm xuất phát, sửa cho gọn và hợp giọng với các dòng hiện có.
- `src/data/battles/battle-of-lake-trasimene.json`: các trường `uncertainty` và ghi chú `evidence` của cảnh vật, để lời trong hộp thoại khớp với tab "Thông tin trận".

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Tách ý chung và ý riêng của từng trận

- Các ý đúng cho mọi trận giữ trong danh sách chung: `positions`, `figures`, `duels`, `pulses`, `colours`.
- Ý về thời lượng (`time`) viết lại cho đúng với mọi trận, không nêu tên một trận. Ví dụ hướng viết: một trận dài nhiều giờ được phát trong vài phút.
- Ý riêng của từng trận gom dưới tên trận đó. Tên trận lấy từ dữ liệu (`event.title[locale]`), không viết cứng. Một trận chỉ hiện khi `hasBattle` đúng với sự kiện của nó.
  - **Cannae:** toán giữ trại, cảnh vật, bụi. Giữ nội dung hiện có; được đổi tên khoá và chỉnh câu cho hợp chỗ mới.
  - **Hồ Trasimene:** viết mới, xem mục 2.
- Cách trình bày tuỳ bạn (danh sách con, tiêu đề nhỏ…), miễn hộp thoại vẫn gọn và dễ đọc. Khi thêm trận thứ ba, người làm chỉ cần thêm một nhóm khoá và một mục trong một bảng, không phải sửa bố cục.

### 2. Lời cho trận hồ Trasimene

Tự viết, song ngữ, ngắn như các dòng của Cannae. Phải có các ý sau, mỗi ý nói rõ phần nào theo nguồn và phần nào là giả định:

- **Vị trí:** chỗ diễn ra trận còn tranh cãi; cảnh theo giả thuyết lối hẹp Malpasso và đồng bằng Tuoro (`trasimene.md`, mục 3).
- **Hồ:** bờ hồ là bờ ngày nay theo dữ liệu vệ tinh; độ dốc của đáy hồ là giả định; nguồn kể có người ngập tới cổ, tới vai.
- **Sương mù:** có trong Polybius và Livy, dày ở đồng bằng hơn trên đồi; dày bao nhiêu và tan nhanh hay chậm là giả định.
- **Quân nấp:** khối phục kích vẫn được vẽ nhưng không có tên và màu phe cho tới lúc lao xuống; chỗ nấp cụ thể của từng toán là phỏng dựng.
- **Cảnh vật:** trại, làng, trang trại và rừng (xem ghi chú `evidence` trong file trận). Mặt đất xanh ở trận này không trái nguồn, khác với Cannae (`trasimene.md`, mục 8).

Không chép nguyên văn từ nguồn. Số liệu nêu trong lời (nếu có) phải khớp file trận.

### 3. Nguồn của trận, trong mục ghi công

- `about.credits.battleSources` hiện chỉ có Cannae. Sửa để mỗi trận có một dòng nguồn, kèm link mở trong thẻ mới như hiện nay:
  - Cannae: Polybius 3.107–118, Livy 22.36–52 (như cũ).
  - Hồ Trasimene: Polybius 3.80–85, Livy 22.3–7. Dùng cùng hai link như sự kiện trong `src/data/events.json` (`battle-of-lake-trasimene`, hai nguồn đầu).
- Giữ câu "mỗi trận ghi nguồn riêng ở tab Thông tin trận".

### 4. Kiểm tra

- Mở hộp thoại ở cả hai ngôn ngữ, nền sáng và nền tối, 1280×800: không vỡ bố cục, không có thanh cuộn thứ hai.
- Ở 390 px: không cuộn ngang.
- Mọi link mới mở trong thẻ mới, có `rel="noreferrer"`.
- Mọi khoá mới có cả `en` lẫn `vi`; không còn khoá nào bị bỏ không dùng.
- `npm run lint`, `npm run validate`, `npm run build` qua.
- Ảnh cho người dùng duyệt câu chữ: chụp phần "Độ chính xác" và phần ghi công, cả hai ngôn ngữ, đặt ở `E:\World_History_Platform_assets\duyet\T-054\`. Driver chụp của phiên chính (`E:\World_History_Platform_assets\main-tools\drive`): đặt `PORT=9363`.

## Ràng buộc

- Chỉ sửa file trong phạm vi. `README.md`, `docs/` và `src/lib/credits.ts` là của phiên chính: thấy cần đổi thì ghi đề nghị vào "Kết quả".
- Không import component hay dữ liệu trận của mảng khác vào hộp thoại. Hộp thoại không được tải file trận (file lớn, chỉ tải khi mở trận); chỉ dùng `events`, `hasBattle` như hiện nay.
- Không đổi câu ghi công Copernicus và các dòng ghi công mô hình.

## Xong khi

- Hộp thoại nói đúng về cả hai trận, ở cả hai ngôn ngữ; không còn câu nào viết riêng cho Cannae nằm trong phần chung.
- Các kiểm tra ở mục 4 qua; có ảnh duyệt.
- Mục "Kết quả" đã điền: danh sách khoá thêm, đổi tên, bỏ; nguyên văn lời mới ở cả hai ngôn ngữ, để người dùng duyệt câu chữ; đề nghị cho phiên chính (nếu có).

## Kết quả

Lane 1, 2026-11-19. Ba commit trên nhánh: phần 1 tách ý chung và ý riêng (`9b46881`), phần 2 lời cho hồ Trasimene (`d8456fc`), phần 3 nguồn từng trận (`ea60945`). Chỉ sửa `src/components/shell/AboutDialog.tsx` và khoá `about.*` trong `src/lib/i18n/messages.ts`.

### Đã làm

- **Bảng ghi chú theo trận** `BATTLE_NOTES` trong `AboutDialog.tsx`, khoá là id sự kiện. Mỗi mục có `accuracy` (danh sách khoá, đã định kiểu `MessageKey` nên gõ sai tên khoá thì TypeScript báo) và `sources` (nhãn và link). Thêm trận thứ ba: thêm một nhóm khoá `about.accuracy.<trận>.*` và một mục trong bảng; bố cục không phải sửa.
- Một trận chỉ hiện khi `hasBattle` đúng với sự kiện của nó, theo thứ tự danh sách sự kiện, dưới tên trận lấy từ dữ liệu (`event.title[locale]`). Vì vậy hồ Trasimene (217 TCN) đứng trước Cannae (216 TCN), ở cả phần độ chính xác lẫn phần nguồn.
- Khi chạy `npm run dev`, nếu có trận 3D mà bảng chưa có mục thì console báo `[about] The 3D battle "<id>" has no entry in BATTLE_NOTES`. Bản production không báo.
- **Trình bày phần độ chính xác:** dòng "Trận đánh 3D là phỏng dựng:" giữ danh sách sáu ý chung (`positions`, `figures`, `duels`, `time`, `pulses`, `colours`). Dưới đó, mỗi trận có một dòng tên in đậm vừa ("Trận hồ Trasimene:") và danh sách con của nó, cùng mức thụt lề với danh sách ý chung. Không thêm mức lồng nào.
- **Phần nguồn:** dòng cuối của mục "Trận đánh 3D" giữ câu "Mỗi trận ghi nguồn riêng ở tab “Thông tin trận”…", kèm danh sách con mỗi trận một dòng, link mở thẻ mới như cũ. Hai link nối bằng `Intl.ListFormat` theo ngôn ngữ ("và", "and").

### Khoá

| Thay đổi | Khoá |
|---|---|
| Đổi tên, giữ nội dung | `about.accuracy.battle.campGuard` → `about.accuracy.cannae.campGuard`; `about.accuracy.battle.scenery` → `about.accuracy.cannae.scenery`; `about.accuracy.battle.dust` → `about.accuracy.cannae.dust` (dấu `;` cuối thành `.`, vì giờ là dòng cuối của nhóm) |
| Sửa nội dung | `about.accuracy.battle.time` (không còn nêu tên Cannae); `about.credits.battleSources` (bỏ hai chỗ trống `{polybius}`, `{livy}`; nguồn chuyển xuống danh sách con) |
| Thêm | `about.accuracy.battleName`, `about.credits.battleSource`; `about.accuracy.trasimene.site`, `.lake`, `.mist`, `.ambush`, `.scenery` |
| Bỏ | Không có khoá nào bị bỏ hẳn (ba khoá cũ của Cannae được đổi tên) |

Mọi khoá có cả `en` lẫn `vi` (227 khoá mỗi bên). Mọi khoá `about.*` đều được dùng; hai khoá `about.what.battles.one/other` được gọi động như trước.

### Nguyên văn lời mới

**Ý chung về thời lượng** (`about.accuracy.battle.time`):
- EN: each battle lasted many hours, but plays in a few minutes;
- VI: mỗi trận thật kéo dài nhiều giờ, nhưng chỉ được phát trong vài phút;

(Cannae 5:30–17:00 phát trong 140 giây; Trasimene 4:30–10:30 phát trong 130 giây.)

**Tên trận** (`about.accuracy.battleName`): `{battle}:` ở cả hai ngôn ngữ, ra "Battle of Lake Trasimene:", "Trận hồ Trasimene:".

**Trận hồ Trasimene** (`about.accuracy.trasimene.*`), theo thứ tự hiển thị:

| Khoá | EN | VI |
|---|---|---|
| `site` | Polybius and Livy describe the ground but do not say exactly where it was, and the site is disputed, with proposals up to 20 km apart; the scene follows the reading that puts the battle in the plain between the narrows at Malpasso and Tuoro hill, on the north shore; | Polybius và Livy tả địa thế nhưng không nói chính xác là ở đâu, nên vị trí trận đánh vẫn còn tranh cãi, các giả thuyết cách nhau tới 20 km; cảnh theo cách đọc đặt trận ở đồng bằng giữa lối hẹp Malpasso và đồi Tuoro, bên bờ bắc hồ; |
| `lake` | the shore is today’s, traced from satellite data; the lake often stood lower in antiquity, so the level strip along it was probably a little wider; Polybius and Livy tell of men wading in up to their necks and shoulders, but how steeply the bed falls, and so how deep they stand in the scene, is assumed; | bờ hồ là bờ ngày nay, vạch theo dữ liệu vệ tinh; thời cổ nước hồ nhiều lúc thấp hơn, nên dải đất bằng ven hồ có lẽ rộng hơn một chút; Polybius và Livy kể có người lội ra tới khi nước ngập tới cổ, tới vai, nhưng đáy hồ dốc tới đâu, tức người trong cảnh đứng sâu bao nhiêu, là giả định; |
| `mist` | the mist is in Polybius and Livy, and Livy says it lay thicker on the plain than on the hills, as the scene draws it; how thick it is drawn and how fast it lifts are assumed, and some modern historians think the mist was made more of to excuse the Romans; | sương mù có trong Polybius và Livy, và Livy kể sương ở đồng bằng dày hơn trên đồi, như cảnh vẽ; sương dày bao nhiêu và tan nhanh hay chậm là giả định, và một số sử gia hiện đại cho rằng chuyện sương mù đã bị nói quá lên để biện hộ cho quân La Mã; |
| `ambush` | the units lying in ambush are drawn, so you can see where they wait, but without their names or the colour of their side until they charge; Polybius and Livy say roughly where each part of Hannibal’s army lay, but the spot of each party is reconstructed; | các khối phục kích vẫn được vẽ để bạn thấy chỗ họ chờ, nhưng không có tên và màu phe cho tới lúc lao xuống; Polybius và Livy kể đại thể từng cánh quân của Hannibal nấp ở đâu, còn chỗ nấp cụ thể của từng toán là phỏng dựng; |
| `scenery` | the country around the armies is part evidence and part illustration: the camps of Hannibal and Flaminius and the Etruscan village are in the ancient sources, but their size and place are reconstructed; the farms are illustration, though most are drawn burned, as the sources say Hannibal laid the country waste; the woods and the lone trees are illustration too; unlike at Cannae, the green ground agrees with the sources: the battle was fought in late spring, while the grain and grass were still green. | cảnh vật quanh hai đạo quân có phần theo tư liệu, có phần minh hoạ: trại của Hannibal, trại của Flaminius và ngôi làng ở Etruria có trong sử liệu, nhưng kích thước và vị trí là phỏng dựng; các trang trại là minh hoạ, nhưng phần lớn được vẽ đã bị đốt, vì sử liệu kể Hannibal đốt phá vùng quê dọc đường; rừng và cây đứng lẻ cũng là minh hoạ; khác với Cannae, mặt đất xanh ở đây không trái nguồn: trận diễn ra vào cuối xuân, khi lúa và cỏ còn xanh. |

Đối chiếu với file trận và tư liệu: "tới 20 km" và vị trí theo `uncertainty`; bờ hồ ngày nay và dải đất bằng rộng hơn theo `evidence` của hồ; cổ (Polybius 3.84.9) và vai (Livy 22.6.6) theo `trasimene.md` mục 11; dày ở đồng bằng hơn trên đồi là của Livy (22.4.6), câu sử gia hiện đại theo `evidence` của `mist`; hai trại và làng là `attested`; tám trang trại có sáu cái `ruined` (`inferred`), hai cái còn nguyên (`illustrative`); rừng, cây lẻ, bụi thấp là `illustrative`; mặt đất xanh theo `evidence` của `ground` và `trasimene.md` mục 8. Lời không nêu số nào không có trong file trận (không nêu 150 m hay độ dốc 1 cm/m của cảnh). Lau sậy ven hồ (`inferred`) không đưa vào, để dòng cảnh vật không quá dài.

**Trận Cannae:** ba dòng giữ nguyên chữ, chỉ đổi dấu cuối của dòng bụi.

**Nguồn** (`about.credits.battleSources`, `about.credits.battleSource`):
- EN: Each battle lists its own sources in the “{tab}” tab of the battle view. The main ones: / `{battle}: {sources}.`
- VI: Mỗi trận ghi nguồn riêng ở tab “{tab}” trong khung xem trận. Các nguồn chính: / `{battle}: {sources}.`
- Hiển thị: "Trận hồ Trasimene: Polybius 3.80–85 và Livy 22.3–7." và "Trận Cannae: Polybius 3.107–118 và Livy 22.36–52." Link giống sự kiện `battle-of-lake-trasimene` (hai nguồn đầu), cũng là hai link Cannae vẫn dùng.

### Kiểm tra

- `npm run lint`, `npm run validate` (60 sự kiện, 2 trận), `npm run build`: qua.
- Bản production (`next start`, `TUTOR_MOCK=1`), driver của phiên chính với `PORT=9363`, kịch bản riêng để ngoài repo. Ở cả hai ngôn ngữ:
  - 1280×800, nền sáng và nền tối: chỉ vùng nội dung cuộn (thẻ `<dialog>` không tràn, `scrollHeight − clientHeight = 0`), không tràn ngang; màu nền và chữ đổi đúng theo chế độ.
  - 390 px: trang và hộp thoại không tràn ngang (`scrollWidth − clientWidth = 0` ở trang, hộp thoại và vùng cuộn).
  - 16 link trong hộp thoại đều có `target="_blank"` và `rel="noreferrer"`.
  - Console sạch, không có cảnh báo `[about]`.
- Ảnh ở `E:\World_History_Platform_assets\duyet\T-054\`:
  - Để duyệt câu chữ: `duyet-do-chinh-xac-tieng-anh.png`, `duyet-do-chinh-xac-tieng-viet.png`, `duyet-ghi-cong-tieng-anh.png`, `duyet-ghi-cong-tieng-viet.png` (cắt đúng từng phần, chụp trong khung cao để mỗi phần nằm trọn một ảnh).
  - Bố cục: `1280x800-{en,vi}-{sang,toi}.png` và `…-do-chinh-xac.png` (cuộn tới phần độ chính xác), `390-{en,vi}-do-chinh-xac.png`, `390-{en,vi}-ghi-cong.png`.

### Đề nghị cho phiên chính

1. **`docs/ARCHITECTURE.md`, ý "Giới thiệu":** câu "riêng bốn khoá viết cho Cannae (…) phải sửa tay khi thêm trận thứ hai" đã hết đúng. Đề nghị thay bằng: ý riêng và nguồn chính của từng trận nằm trong bảng `BATTLE_NOTES` của `AboutDialog.tsx` (khoá `about.accuracy.<trận>.*`, nhãn và link nguồn); thêm trận thì thêm một nhóm khoá và một mục; thiếu mục thì console cảnh báo khi chạy dev.
2. **`README.md`, dòng "Battle terrain":** đang ghi "see `docs/data/battles/cannae.md`". Có thể thêm `trasimene.md`, vì lưới của hồ Trasimene lấy từ các ô Copernicus khác (N43 E012, N43 E011 và vùng xa) cùng mặt nạ nước. Câu ghi công Copernicus trong hộp thoại không phải đổi: nó không nêu ô nào.
3. **Khoảng chương của nguồn chưa theo một quy tắc.** Cannae: hộp thoại ghi Livy 22.36–52, giống file trận; sự kiện ghi Livy 22.43–51. Trasimene: hộp thoại ghi Polybius 3.80–85, Livy 22.3–7 theo task, giống sự kiện; file trận ghi 3.77–86 và 22.1–7. Hộp thoại gọi là "các nguồn chính" nên không sai. Nếu muốn thống nhất, có thể chọn một nơi làm gốc (sự kiện hay file trận) và ghi quy tắc ấy vào ARCHITECTURE.
4. **Hai ý chung gắn với hai trận hiện có.** `positions` nêu tên Polybius và Livy: đúng cho cả Cannae lẫn Trasimene, nhưng trận thứ ba dựa vào tác giả khác thì phải viết lại câu này. `time` ("vài phút") đúng với 130–140 giây phát hiện nay.
5. Link Livy trỏ tới bản dịch Roberts trên Wikisource. `trasimene.md` mục 1 ghi bản này có hai chỗ dịch sai hoặc thiếu ở quyển 22 (ví dụ "1000" thay cho 10 000 người chạy thoát). Task yêu cầu dùng cùng link với sự kiện nên tôi giữ nguyên; phiên chính có thể cân nhắc thêm link bản Latin (The Latin Library), như nguồn thứ ba của sự kiện.
