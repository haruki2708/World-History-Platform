# T-045: Quân giữ trại của Hannibal, và đường ra khỏi trại lớn

- **Lane:** 2
- **Model đề xuất:** Opus 5.5, effort `high`.
- **Nhánh:** `lane2/T-045-camp-guard` (phiên chính đã tạo sẵn từ `main`, trong worktree của bạn)
- **Phạm vi file:**
  - `src/data/battles/battle-of-cannae.json`;
  - `src/data/battles/unit-types.json`, chỉ khi thật cần (xem yêu cầu 1);
  - `docs/data/battles/`, `scripts/battles/`.

## Bối cảnh

Từ T-030 (đợt F) bạn chưa làm gì thêm ở trận đánh. Trong thời gian đó phiên chính làm ba đợt; những gì đổi với dữ liệu:

- **Đợt G, giáp lá cà (T-032 → T-036):** hành động `fight` từ nay là giáp lá cà, còn `skirmish` là đánh từ xa. `npm run validate` kiểm tra mỗi khối `fight` có mép trước nằm trên mép trước của một khối địch cũng `fight`, ở **cả mốc đầu lẫn mốc cuối** của giai đoạn. Bố cục các mốc 2–6 của những khối đánh gần được dựng bằng `scripts/battles/cannae-lines.mjs`.
- **Đợt H, phong cảnh (T-037 → T-040):** dữ liệu trận có `terrain.scenery`: mặt đất, công trình (ba trại, thành và làng Cannae, nhà nông), gió, bụi, mỗi thứ mang mức căn cứ. Cảnh dựng lều trong trại bằng code và **không dựng lều ở chỗ có khối quân đứng hay đi qua** (`occupancy` trong `src/components/battle/engine/structures.ts`). Trại chỉ có lều: hào, luỹ, cọc rào không được vẽ (người dùng chọn). `npm run validate` cấm khối quân đứng trong nước sông (quá 5%) hay trên biển (quá 10%).
- **Đợt I, đồ hoạ (T-041 → T-044):** không đổi gì về dữ liệu, trừ lớp phủ mặt đất `grass` (mức `illustrative`).

Người dùng chọn giao cho bạn hai việc dở của Cannae mà phiên chính đã ghi ở `docs/data/battles/cannae.md` (mục 12, phần "Còn lại") và ở T-039.

**1. Trại của Hannibal không có người giữ.** Polybius 3.117: một vạn bộ binh La Mã ở lại trại lớn (`camp-force`) đã đánh vào trại của Hannibal, và Hannibal có để quân giữ trại; sau trận, Hannibal tới giải vây và đánh lui toán La Mã về trại của họ. Dữ liệu hiện chưa có khối giữ trại (mục 5: "Toán giữ trại của Hannibal không rõ quân số nên không có đơn vị riêng"), nên `camp-force` đánh trại ở giai đoạn 3–5 bằng `skirmish`, ném vào một trại không người (mục 11).

**2. Trại lớn trống một mảng lều.** `camp-force` và `roman-cavalry` đứng trong trại lớn lúc đầu, rồi đi chéo qua trại ra ngoài. `camp-force` còn rút về trại ở giai đoạn 6. Cả dải đất họ đi qua không có lều, nên nhìn từ trên cao trại lớn thiếu lều ở góc tây nam. Phiên chính đo bằng một bản sao của `occupancy` (công cụ ở dưới): phần diện tích mỗi trại không được dựng lều hiện là:

| Trại | Không được dựng lều |
|---|---|
| `roman-large-camp` | 34,6% |
| `roman-small-camp` | 29,8% |
| `hannibal-camp` | 0,0% |

Trong lúc bạn làm: lane 1 và lane 3 không có task. Phiên chính sửa `src/components/battle/engine/units.ts` (T-046: mảng màu phe dưới chân khối quân mờ đi khi nhìn gần). Không ai khác đụng tới dữ liệu trận.

## Đọc trước

- `docs/ARCHITECTURE.md`, mục "Trận đánh 3D": phần "Dữ liệu" (hành động `skirmish` và `fight`), "Giáp lá cà (đợt G)" (ai ngã, ghép cặp), "Phong cảnh (đợt H)" (công trình, đoạn "Khối quân có thể đứng trong trại của mình").
- `docs/data/battles/cannae.md`: mục 5 (quân số), mục 6 (giai đoạn), mục 11 (giáp lá cà, script dựng bố cục), mục 12 (phong cảnh, nhất là "Kích thước các trại", "Khối quân đứng trong trại", "Còn lại").
- `scripts/battles/cannae-lines.mjs`, phần đầu file: script chỉ ghi `formation`, `action`, `men` của những khối nó liệt kê; mọi thứ khác sửa tay trong file JSON. Khối nào do script dựng thì sửa trong script, không sửa tay rồi để script ghi đè.
- `src/components/battle/engine/structures.ts`, hàm `occupancy`: cách cảnh tính chỗ không dựng lều. Chỉ đọc.

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Khối quân giữ trại của Hannibal

- **Đọc nguồn trước:** Polybius 3.117 và Livy 22.49–52 về toán giữ trại; thêm nguồn khác nếu bạn tìm được (ví dụ Appian). Ghi vào `cannae.md` nguồn nói gì: ai giữ trại, bao nhiêu người, cuộc đánh trại diễn ra thế nào và kết thúc ra sao. Tóm tắt tự viết, không chép nguyên văn.
- **Thêm một khối Carthage giữ trại** (ví dụ id `camp-guard`), đứng trong trại Hannibal từ đầu trận. Tên khối song ngữ.
  - Loại lính: ưu tiên loại có sẵn trong `unit-types.json`. Nguồn không nói thành phần thì chọn loại hợp lý nhất và ghi lý do. Chỉ thêm loại lính mới khi thật cần, và loại mới phải dùng một mô hình đã có trong `public/battles/models/`.
  - Quân số: nếu nguồn không cho số thì chọn một số có lý, ghi rõ là giả định (`NumberRange.note` hay `uncertainty`). Quyết định và ghi lại: toán này nằm **trong** tổng 50 000 của Polybius 3.114 / Livy 22.46 hay **ngoài**. Sửa bảng quân số và tổng ở `cannae.md` mục 5 cho khớp.
- **Cuộc đánh trại thành giáp lá cà:** ở những giai đoạn `camp-force` đánh trại, cả hai khối ghi `fight` và phải qua kiểm tra `fight` của `npm run validate` (mép trước chạm nhau ở cả mốc đầu lẫn mốc cuối). Thương vong giảm dần theo giai đoạn; `men` chỉ giảm, không tăng.
  - Trại Hannibal có `facing` 90: mặt trước, tức cổng chính, quay về phía đông, về phía `camp-force`. Cảnh không vẽ luỹ, nên chọn chỗ hai khối gặp nhau sao cho nhìn vào thấy rõ là đánh nhau ở cửa trại.
  - Giai đoạn 6: giữ đúng Polybius 3.117 (Hannibal giải vây, toán La Mã rút về trại lớn). Nếu nguồn cho phép thì khối giữ trại có thể đuổi theo một đoạn.
- **Lời dẫn:** sửa lời dẫn các giai đoạn liên quan (cả `en` lẫn `vi`) để nói tới toán giữ trại. Giữ giọng văn hiện có.
- Tách giai đoạn 3–5 khỏi `skirmish` thì sửa luôn câu ở `cannae.md` mục 11 (dòng "toán giữ trại không có đơn vị riêng, nên cuộc đánh trại được vẽ như đánh từ xa").

### 2. Đi ra và về trại lớn qua cổng

- Trại lớn có `facing` 180, nên cổng chính ở giữa mặt nam: khoảng (−1600, 775).
- Cho `camp-force` và `roman-cavalry` **ra khỏi trại qua cổng**, không đi chéo qua trại. Cho `camp-force` cũng về trại qua cổng ở giai đoạn 6. Cảnh dời khối quân theo đường thẳng giữa hai mốc, nên phải dùng các mốc sẵn có:
  - ví dụ đặt khối ở gần cổng (bên trong) lúc đầu, tới cuối giai đoạn 1 thì đứng ngay ngoài cổng;
  - lời dẫn giai đoạn 1 đã nói Varro dẫn quân ra khỏi trại lớn.
- Ba khối đồng minh trong trại nhỏ (trại nhỏ cũng `facing` 180): làm theo cùng nguyên tắc nếu không trái nguồn. Không bắt buộc.
- **Đo trước và sau** bằng `E:\World_History_Platform_assets\T-045\tools\camp-occupancy.mjs`. Chạy từ thư mục repo: `node <đường dẫn tới file>`. File chứa một bản sao của `occupancy`, vì `structures.ts` dùng cú pháp TypeScript mà Node không tự bỏ được. Mục tiêu: phần không được dựng lều của trại lớn giảm rõ so với 34,6%. Ghi số của cả ba trại vào "Kết quả".
- Mọi khối đã dời phải vẫn qua `scripts/battles/check-overlap.mjs` và `check-facing.mjs`. Kiểm tra lại không khối nào đi xuyên qua khối khác lúc ra cổng.

### 3. Xem trong cảnh và ảnh duyệt

- Chạy `npm run dev` ở một cổng trống (không dùng 3000 hay 3106: cổng 3000 là bản xem thử của `main`). Xem `/battle-lab` (thêm `?lang=vi` để xem tiếng Việt).
- Ảnh cho người dùng duyệt đặt ở `E:\World_History_Platform_assets\duyet\T-045\`, theo cách đặt tên `…-A-truoc.png` (dữ liệu cũ) và `…-B-sau.png` (dữ liệu mới), mỗi cặp cùng góc nhìn. Ít nhất có:
  - trại lớn nhìn từ trên cao lúc đầu trận (lều phủ kín hơn);
  - cuộc đánh ở cửa trại Hannibal ở giữa giai đoạn 4, cận cảnh và tầm trung (thấy hàng đầu hai bên đấu từng cặp);
  - giai đoạn 6, khi toán La Mã rút về.
- Có thể dùng driver của phiên chính để chụp: `E:\World_History_Platform_assets\main-tools\drive\drive.mjs` với kịch bản `s-scenery.mjs`. Ví dụ, chạy từ thư mục `drive`: `BASE=http://localhost:<cổng> GPU=1 node drive.mjs s-scenery.mjs <tiền tố> <thời điểm> "tên:x,y,khoảng cách,độ cao,phương vị"`. Phương vị 0 là camera ở phía nam điểm nhìn. Ảnh ra ở `main-tools/shots/`.

### 4. Tài liệu

- `docs/data/battles/cannae.md`:
  - mục 5: bảng đơn vị, tổng quân số;
  - mục 6: giai đoạn, nếu đổi;
  - mục 11: câu về cuộc đánh trại;
  - mục 12: hai dòng "Còn lại" về toán giữ trại và đường ra của `camp-force`, `roman-cavalry`;
  - một mục mới cho task này: nguồn đã đọc, quyết định, số đo.

## Ràng buộc

- Không sửa `src/components/`, `src/lib/`, store, `src/app/`, `src/data/index.ts`, `src/lib/i18n/messages.ts`. Cần đổi thì ghi đề nghị vào "Kết quả".
- Hộp thoại Giới thiệu có thể cần một câu về toán giữ trại (nó là phỏng dựng). Không sửa nó: đề nghị câu chữ trong "Kết quả", phiên chính viết khi gộp và người dùng duyệt.
- Không đổi kiểu dữ liệu. Thiếu trường nào thì ghi đề nghị.
- `npm run validate`, `npm run lint`, `npm run build` phải qua trước khi báo xong.

## Xong khi

- Có khối giữ trại Hannibal; `camp-force` giáp lá cà với nó; `npm run validate` qua.
- `camp-force` và `roman-cavalry` ra (và `camp-force` về) qua cổng trại lớn; phần trại lớn không được dựng lều giảm rõ, có số trước và sau.
- Lời dẫn và `cannae.md` cập nhật, cả hai ngôn ngữ.
- Ảnh trước và sau ở `duyet\T-045\`.
- Mục "Kết quả" bên dưới đã điền.

## Kết quả

Lane 2, 2026-11-19. Chi tiết ở `docs/data/battles/cannae.md`, mục 17 (mới); mục 1, 5, 6, 11, 12, 14 sửa cho khớp.

### 1. Khối quân giữ trại của Hannibal

**Nguồn.**

- **Polybius 3.117** là nguồn duy nhất kể cuộc đánh trại:
  - Hannibal có để lại một toán đủ sức giữ trại, nhưng không nói bao nhiêu người hay là quân gì.
  - Toán này trụ được một lúc rồi núng thế.
  - Hannibal thắng xong thì kéo về giải vây, dồn quân La Mã vào trại của họ, giết 2 000 người, sau đó bắt hết số còn lại.
- **Không nhắc cuộc đánh trại:** Livy 22.41–52, Appian (*Hannibalica* 17–28), Plutarch (*Fabius* 16.8), Dio/Zonaras. Livy, Appian và Plutarch chỉ kể số người chạy vào hai trại La Mã sau trận và chuyện hai trại đầu hàng.
- **Ước lượng hiện đại:** bài Wikipedia, dẫn Daly (2002, tr. 94), ghi 16 000 lính Gaul kèm chú thích "8 000 người ở lại trại hôm giao chiến". Câu này không rõ 8 000 nằm trong hay ngoài 16 000. Tôi chưa đọc được sách của Daly.

**Quyết định.**

- **Khối mới:** `camp-guard`, tên "Quân giữ trại của Hannibal" / "Guard of Hannibal's camp".
- **Loại lính:** `gallic-infantry`, loại có sẵn, không thêm loại mới. Ước lượng duy nhất tìm được nói đó là lính Gaul.
- **Quân số:** 8 000 người, giả định theo Daly.
- **Ngoài tổng 50 000:** Polybius 3.114 và Livy 22.46 đưa con số này trong đoạn tả thế trận, và các đơn vị ra trận trong file đã cộng đúng 50 000.
  - `strength` của Carthage đổi thành 50 000–58 000.
  - `note` của `strength` và `uncertainty` của trận nói rõ phần nào là giả định.
  - Mục 5 của `cannae.md` có thêm dòng cho toán giữ trại. Tổng ghi 58 000: 50 000 ra trận, 8 000 giữ trại.

**Cuộc đánh ở cổng trại.**

- **Chỗ gặp:** cổng chính ở giữa mặt đông của trại Hannibal (−3475, −500). Bề ngang 200 m, toán giữ trại đứng trong cổng, quân La Mã đứng ngoài.
- **Giai đoạn 2:** quân La Mã tới cổng ở cuối giai đoạn.
- **Giai đoạn 3–5:** cả hai khối ghi `fight`.
  - Đường giáp chiến đứng ở cổng ở mốc 3; lùi vào trong trại 10 m ở mốc 4 và 40 m ở mốc 5.
  - Quân số (giả định), quân La Mã: 10 000 → 9 800 → 9 600 → 9 400. Toán giữ trại: 8 000 → 7 700 → 7 300 → 6 700.
- **Giai đoạn 6:** quân La Mã quay đầu, rút về trại lớn qua cổng và còn 7 400 người (mất 2 000 như Polybius kể). Toán giữ trại đuổi theo 450 m.
  - Hannibal về giải vây chỉ có trong lời dẫn, vì mọi khối của ông đang vây quân La Mã suốt giai đoạn này.
  - Chi tiết đuổi theo là suy ra, nguồn không nói.
- **Dựng bằng `scripts/battles/cannae-lines.mjs`:** mốc 2–6 của hai khối, thêm một phần "The fight at the gate of Hannibal's camp".
- **Lời dẫn:** sửa các giai đoạn 1, 2, 3, 5, 6, cả `en` lẫn `vi`.
- **Câu ở mục 11 về đánh từ xa:** đã sửa.

### 2. Ra và về trại qua cổng

- **`camp-force`:**
  - lúc đầu trận đứng ngay sau cổng nam của trại lớn (−1600, 975);
  - cuối giai đoạn 1 đứng ngay ngoài cổng (−1600, 680);
  - giai đoạn 6 về qua cổng, dừng ngay sau cổng (−1542, 815).
- **`roman-cavalry`:**
  - lúc đầu trận đứng ngay sau cổng, quay sẵn 20° về hướng đi để `check-facing.mjs` không báo đi xiên;
  - lúc tháo chạy (giai đoạn 4–5) chạy lên phía bắc giữa trại lớn và sông, không chạy qua trại nữa.
- **Ba khối đồng minh** (không bắt buộc, nguồn không cấm) đứng thành cột sau cổng trại nhỏ.
- **Phần đất không được dựng lều**, đo bằng `camp-occupancy.mjs`:

| Trại | Trước | Sau |
|---|---|---|
| `roman-large-camp` | 34,6% | 6,1% |
| `roman-small-camp` | 29,8% | 14,4% |
| `hannibal-camp` | 0,0% | 3,7% (chỗ toán giữ trại đứng) |

Trại nhỏ còn 14,4% vì ba khối vừa đi vừa giãn từ 220 m lên 750 m nên vệt đi loe ra. Muốn hẹp hơn thì cần thêm một mốc giữa giai đoạn 1.

### 3. Kiểm tra

- **`npm run validate`:** qua, không còn cảnh báo. Kiểm tra `fight` qua cho cả hai khối ở giai đoạn 3, 4, 5.
- **`npm run lint`, `npm run build`:** qua.
- **`check-overlap.mjs --min 0.04`:** in đúng như trước.
- **Chạy thêm với bước 0,02 giai đoạn:**
  - `camp-force`, `camp-guard` và `roman-cavalry` không chồng lên khối nào suốt trận.
  - Ba khối đồng minh không chồng nhau lúc ra cổng.
- **`check-facing.mjs`:** thêm hai dòng, `camp-guard` đi lùi khi bị đẩy vào trại ở giai đoạn 4–5. Đây là có chủ ý, như lưỡi liềm.
- **Xem trong `/battle-lab` (cả `?lang=vi`):**
  - console không có lỗi;
  - 56–73 khung hình/giây;
  - hàng đầu hai bên ở cổng trại Hannibal đấu từng cặp, có người ngã.

### 4. Ảnh duyệt

Ảnh ở `E:\World_History_Platform_assets\duyet\T-045\`, 9 cặp, mỗi cặp gồm `…-A-truoc.png` và `…-B-sau.png`:

| Ảnh | Nội dung |
|---|---|
| 01–02 | Trại lớn và trại nhỏ nhìn từ trên cao lúc đầu trận |
| 03 | Cổng trại lớn lúc đầu trận |
| 04 | Các khối ra cổng trại lớn, giữa giai đoạn 1 |
| 05–06 | Cửa trại Hannibal giữa giai đoạn 4: cận cảnh và tầm trung |
| 07 | Trại Hannibal nhìn từ trên cao, giữa giai đoạn 4 |
| 08 | Giữa giai đoạn 6: quân La Mã rút về, toán giữ trại đuổi theo |
| 09 | Cuối giai đoạn 6: quân La Mã vào lại cổng trại lớn |

### 5. Đề nghị

1. **Hộp thoại Giới thiệu:** thêm một dòng nói toán giữ trại là phỏng dựng. Ví dụ đặt sau `about.accuracy.battle.positions`, khoá `about.accuracy.battle.campGuard`:
   - en: "Polybius says that Hannibal left a guard in his camp, which the Romans left in their large camp attacked during the battle, but he gives no number: the guard's size (8,000) and make-up (Gauls) follow a modern estimate, and the fight at the camp gate is reconstructed;"
   - vi: "Polybius kể Hannibal để lại một toán quân giữ trại và toán quân La Mã ở lại trại lớn đã đánh vào trại trong lúc diễn ra trận, nhưng không cho quân số: quân số (8.000) và thành phần (lính Gaul) của toán này theo một ước lượng hiện đại, còn cuộc đánh ở cổng trại là phỏng dựng;"
2. **Không bắt buộc, cho `structures.ts`:** cảnh không vẽ luỹ và cổng, nên cổng trại chỉ đọc ra được nhờ khoảng trống trong lều. Trại Carthage xếp lều lỏng, không có đường vào. Nếu muốn cổng rõ hơn, trại này có thể chừa một lối thẳng từ cổng chính vào giữa trại, như đường giữa của trại La Mã.
3. **Không cần đổi kiểu dữ liệu** hay file ngoài vùng của lane 2.

### Commit

`ca576f3` (dữ liệu và script), `7f17e9c` (bỏ một mũi tên đè lên kỵ binh), `83da90b` (`cannae.md`), và commit điền mục này.
