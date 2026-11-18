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

(Lane 2 điền khi xong.)
