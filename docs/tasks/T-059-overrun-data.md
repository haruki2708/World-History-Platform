# T-059: Kỵ binh xông qua bộ binh trong hai trận thật (đợt L, chặng A3)

- **Lane:** 2
- **Model đề xuất:** Opus 5.5, effort `high`.
- **Nhánh:** `lane2/T-059-overrun-data` (phiên chính đã tạo sẵn từ `main` và chuyển worktree của bạn sang nhánh này). T-058 (ngựa đi bước) làm sau task này, trên nhánh `lane2/T-058-horse-walk`.
- **Phạm vi file:** `src/data/battles/battle-of-cannae.json`, `src/data/battles/battle-of-lake-trasimene.json`, `docs/data/battles/cannae.md`, `docs/data/battles/trasimene.md`.
- **Kế hoạch chung:** `docs/PLAN.md`, mục "Đợt L", chặng A3. Hợp đồng: `UnitAction` `overrun` trong `src/lib/battle.ts`; `docs/ARCHITECTURE.md`, mục "Kỵ binh xông qua".

## Bối cảnh

Người dùng chọn (2026-11-20): kỵ binh gặp bộ binh thì phi xuyên qua, hỗn loạn, thay vì dừng lại đấu từng cặp. Bộ binh trên đường ngựa chạy bị xô ngã; người đến lượt chết theo dữ liệu thì nằm lại, người khác gượng dậy.

Đã có trong `main`:

- **Hợp đồng (A0):** hành động `overrun`, chỉ cho loại lính `mounted`. Như `fight`, ở **cả mốc đầu lẫn mốc cuối** của giai đoạn, mép trước của khối phải có bộ binh địch ngay phía trước (21 điểm trên mép trước; từ ít nhất 15% số điểm, đường thẳng về phía trước nằm trong một khối bộ binh địch hay đi vào một khối trong vòng 12 m). `npm run validate` kiểm tra; dưới 50% thì cảnh báo. Khối bộ binh bị xông qua không được `fight` với chính khối kỵ binh đó, nhưng vẫn `fight` được với một khối địch khác ở mép trước của nó.
- **Cảnh (A1):** mỗi người cưỡi phi một vòng riêng xuyên qua bộ binh rồi vòng lại, nhiều lượt trong giai đoạn. Khối đang `charge` ở giai đoạn trước thì phi thẳng vào, không khựng. Người cưỡi đánh người đi bộ mình phi ngang. Người dùng đã xem và duyệt.
- **Hỗn chiến bộ binh (A4):** không đổi gì trong dữ liệu.

Dữ liệu hai trận vẫn ghi `fight` cho kỵ binh đấu với bộ binh, nên trong app kỵ binh vẫn đứng đấu từng cặp. Trang thử có chế độ xem trước, `/battle-lab?battle=<id>&overrun=1` (bản dev). Chế độ này **máy móc**: khối kỵ binh nào đang `fight` mà có bộ binh địch trước mặt thì đổi thành `overrun`, và bộ binh không còn ai đấu thì đổi thành `stand` (`src/app/battle-lab/overrunPreview.ts`). Nó đổi:

- **Cannae, giai đoạn 6:** `iberian-cavalry`, `gallic-cavalry` → `overrun`; `triarii` → `stand`.
- **Hồ Trasimene, giai đoạn 3 và 4:**
  - `gallic-cavalry` → `overrun`, `velites-2` → `stand`;
  - `allied-cavalry-right` (kỵ binh đồng minh **La Mã**) → `overrun`, `iberians-2` → `stand`.

Chế độ xem trước chỉ là gợi ý. Chỗ nào là kỵ binh xông vào bộ binh thì bạn quyết theo nguồn.

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Cannae

- Giai đoạn 6: kỵ binh của Hasdrubal đánh vào lưng các quân đoàn (Polybius 3.116; xem `cannae.md`, các mục về giai đoạn 5 và 6). Đổi `iberian-cavalry` và `gallic-cavalry` sang `overrun` nếu nguồn cho phép. Nguồn tả cách đánh thế nào thì ghi lại, diễn đạt bằng lời của bạn.
- Bộ binh mà hai khối đó xông qua: không còn `fight` với chúng. Khối nào chỉ đấu với kỵ binh đó thì đổi sang hành động hợp lý, và ghi lý do. Khối nào vẫn đấu với bộ binh địch ở mặt khác thì giữ `fight`.
- Giai đoạn 5 kết thúc bằng `charge` tới lưng quân La Mã, nên sang giai đoạn 6 người cưỡi phi thẳng vào không khựng. Xem trong cảnh có đúng như vậy không.

### 2. Hồ Trasimene

- Xét từng chỗ kỵ binh đấu với bộ binh ở giai đoạn 2–5:
  - **Kỵ binh Gaul đánh vào phần sau đoàn quân, chỗ Flaminius** (Livy 22.6.3–4: Ducarius, kỵ sĩ Insubres, giết Flaminius): người cưỡi giữa đám bộ binh, nên `overrun` hợp.
  - **Kỵ binh đồng minh La Mã (`allied-cavalry-right`) đấu với lính Iberia từ đồi xuống:** đoàn quân bị đánh úp khi còn đang đi hàng dọc. Nguồn có nói kỵ binh La Mã xông vào bộ binh không? Không có thì giữ như hiện nay, hoặc đổi cho hợp hơn, và ghi lý do.
  - Kỵ binh Numidia đấu kỵ binh đồng minh cánh trái: ngựa đấu ngựa, giữ `fight`.
- Như ở Cannae: bộ binh bị xông qua không `fight` với khối kỵ binh đó.

### 3. Ghi chép

- `cannae.md` và `trasimene.md`: một mục ngắn nói khối nào đổi sang `overrun` ở giai đoạn nào, vì sao, theo nguồn nào; chỗ nào không đổi và vì sao.

### 4. Kiểm tra và ảnh

- `npm run validate` qua, không có cảnh báo mới. `npm run lint`, `npm run build` qua.
- **Xem trong cảnh** (`/battle-lab?battle=<id>`, bản dev) các giai đoạn đã đổi:
  - người cưỡi phi vòng qua bộ binh;
  - bộ binh ngã khi ngựa tới;
  - không khối nào đánh vào khoảng không;
  - không người cưỡi nào đứng yên vì phía trước không có bộ binh.
  
  Nếu `validate` cảnh báo chỉ một phần mép trước có bộ binh phía trước, cân nhắc dời đội hình. Bạn được dời vị trí khối trong hai giai đoạn đó, nhưng giữ đúng nguồn.
- **Ảnh trước và sau** cho mỗi trận ở `E:\World_History_Platform_assets\duyet\T-059\`. Driver chụp của phiên chính ở `E:\World_History_Platform_assets\main-tools\drive`, đặt `PORT=9362`:
  - `s-overrun.mjs`: chụp đứng hình. Tham số: query, battle time, x, y, khoảng cách, độ cao, phương vị, tiền tố tên file, số ảnh, bước thời gian.
  - `s-overrun-play.mjs`: chụp lúc đang phát. Tham số như trên, nhưng tham số cuối là số mili giây giữa hai ảnh.
- **Khung hình/giây:** đo ở các giai đoạn đã đổi, trước và sau, xen kẽ hai bản trên cùng máy. Ghi máy có đang chạy Blender không.

### 5. Thời lượng các giai đoạn đi quá nhanh, và script của Cannae (thêm sau review, 2026-11-20)

Phiên chính đã review phần 1–4: đạt. Đã kiểm lại:
- `validate` qua.
- **Cannae:** cả 195 hình triarii chết ở giai đoạn 6 đều ngã khi có ngựa sát bên.
- **Hồ Trasimene:** 34 trên 34 hình velites-2 chết ở giai đoạn 3–4 cũng vậy. Không người cưỡi nào đang sống bị giật vị trí.
- **Giáp lá cà ở Cannae:** 91% người ngã có đòn chạm đúng lúc.

Làm tiếp mục này trên cùng nhánh, rồi T-059 gộp một lượt.

**Trước khi làm:**
- Worktree của bạn còn hai file trận chưa commit. Đó là bản "trước khi sửa" bạn dựng tạm để đo khung hình/giây (triarii và hai khối kỵ binh ở Cannae về lại `fight`, v.v.). Bản đã commit mới là đúng: bỏ hai file đó bằng `git restore src/data/battles/`.
- Gộp `main` vào nhánh (`git merge main`): có mục này.

**a) Thời lượng.** Người dùng chọn sửa chân trượt khi chạy (việc B2 trong `docs/PLAN.md`, mục "Đợt L") bằng hai cách cùng lúc:
- Phiên chính cho clip chạy của bộ binh phát tới 2,2 lần tốc độ của nó (nhánh `batch-l/gait-cap`, gộp cùng T-059).
- Kéo dài các giai đoạn mà các khối đi quá nhanh: sửa `playSeconds` như sau.

| Trận | Giai đoạn | `playSeconds` cũ | mới | Khối nhanh nhất lúc này |
|---|---|---|---|---|
| Cannae | 1 | 25 | 45 | quân Carthage dàn trận, khoảng 70 m/giây |
| Cannae | 6 | 30 | 39 | `camp-force`, khoảng 77 m/giây |
| Hồ Trasimene | 1 | 25 | 34 | đoàn quân hành quân, khoảng 52 m/giây |
| Hồ Trasimene | 2 | 20 | 37 | quân phục kích xung phong, 60–76 m/giây |
| Hồ Trasimene | 5 | 20 | 34 | quân La Mã tháo chạy, tới 87 m/giây |
| Hồ Trasimene | 6 | 15 | 26 | toán đầu rút về làng, khoảng 67 m/giây |

- Không đổi `endHour`, vị trí, hành động hay quân số. Sửa cột thời lượng trong bảng các giai đoạn của `cannae.md` và `trasimene.md`.
- **Số đo của phiên chính:** `E:\World_History_Platform_assets\main-tools\gait\slide.mjs`. Script mô phỏng đúng cách cảnh chọn dáng đi; cách chạy ghi ở đầu file; sải chân đo từ cảnh nằm ở `main-tools\gait-cannae.json` và `gait-trasimene.json`.
  - Với tuỳ chọn `run=2.2 runHorse=1.5` và các thời lượng mới, chân trượt hơn 5% còn khoảng 3% thời gian di chuyển ở Cannae, 1% ở Trasimene (trước khi sửa: 20% và 29%).
  - Chạy lại script trên dữ liệu của bạn và ghi số vào "Kết quả". Không cần tuỳ chọn `slow=`, vì thời lượng đã nằm trong file.
- Ở Trasimene giai đoạn 3, kỵ binh Gaul lao vào velites với tốc độ xung phong của giai đoạn 2 (khoảng 80 m/giây trong giây đầu, nhanh hơn nhịp phi của ngựa). Giai đoạn 2 dài ra thì tốc độ này còn khoảng 40 m/giây.

**b) `scripts/battles/cannae-lines.mjs`** (ngoại lệ phạm vi cho mục này): sửa bảng `STATES` cho giai đoạn 6 khớp với file trận (triarii `stand`, kỵ binh Iberia và Gaul `overrun`). Chạy `node scripts/battles/cannae-lines.mjs` (không `--write`) phải báo 0 dòng sẽ đổi.

**c) Tuỳ chọn: `camp-force` ở Cannae.** Ở giai đoạn 2, khối này đi khoảng 2,2 km trong 15 giây (tới 145 m/giây), nên phương án nào cũng còn trượt chân. Xét theo nguồn: nó có thể xuất phát sớm hơn (từ giai đoạn 1), hay đi đường ngắn hơn không? Được thì sửa, cả trong `cannae-lines.mjs` nếu script đặt khối này; không thì ghi lý do.

**d) Khung hình/giây:** đo lại Cannae giai đoạn 6 và Trasimene giai đoạn 3, trước và sau, khi máy không chạy Blender. Lane 1 đang dựng mô hình bằng Blender (T-057 phần 2). Nếu máy chưa rảnh thì ghi lại; phiên chính sẽ đo khi gộp.

**e)** `npm run validate`, `npm run lint`, `npm run build` qua. Điền mục 5 vào "Kết quả", commit, rồi báo.

### 6. Kéo dài thêm hai giai đoạn (thêm khi gộp, 2026-11-20)

T-059 đã gộp vào `main` cùng T-057 và B2; người dùng xem bản thử và duyệt. Phiên chính đo lại khung hình/giây lúc máy rảnh, hai vòng xen kẽ: không giảm (Cannae giai đoạn 6 60,7 → 59,8; Trasimene giai đoạn 3–4 82,1 → 80,6; trong mức nhiễu).

Còn hai khối trượt chân. Người dùng chọn kéo dài hai giai đoạn đó cho hết:

| Trận | Giai đoạn | `playSeconds` hiện tại | mới | Khối còn trượt |
|---|---|---|---|---|
| Cannae | 6 | 39 | 60 | `camp-force` rút về trại lớn, 2,3 km (59,6 m/giây, trượt 35%) |
| Hồ Trasimene | 5 | 34 | 45 | `allied-right-rear` tháo chạy (51 m/giây, trượt 25%) |

- Gộp `main` vào nhánh trước (`git merge main`), rồi làm trên cùng nhánh `lane2/T-059-overrun-data`.
- Không đổi gì khác. Sửa cột thời lượng và các câu về tốc độ trong `cannae.md`, `trasimene.md`.
- Chạy lại `slide.mjs` (`run=2.2 runHorse=1.5`): hai khối này phải ra khỏi danh sách trượt; ghi số mới vào "Kết quả". Chạy lại `main-tools/overrun/check.mjs` cho Cannae: người cưỡi ở giai đoạn 6 vẫn không giật chỗ, triarii chết vẫn ngã dưới vó ngựa. Giai đoạn dài hơn thì mỗi người cưỡi chạy nhiều vòng hơn.
- `npm run validate`, `npm run lint`, `npm run build` qua. Ghi "Mục 6" vào "Kết quả", commit, rồi báo. Xong thì làm T-058.

## Ràng buộc

- Chỉ sửa file trong phạm vi: không sửa cảnh, hợp đồng hay chuỗi giao diện.
- Không đổi quân số và thương vong. Nếu thấy cần đổi thì ghi đề nghị.
- Chỗ nào nguồn không ủng hộ kỵ binh xông vào bộ binh thì giữ `fight` và ghi lại.

## Xong khi

- Mỗi chỗ kỵ binh đấu với bộ binh ở hai trận đã được xét và quyết theo nguồn. `validate`, `lint`, `build` qua.
- Có ảnh trước và sau, số khung hình/giây; mục "Kết quả" đã điền.

Phiên chính sẽ nói thêm về kỵ binh xông qua trong câu về giáp lá cà ở hộp thoại Giới thiệu khi gộp.

## Kết quả

Lane 2, 2026-11-20. Ba commit trên `lane2/T-059-overrun-data`: hai commit dữ liệu (mỗi trận một commit), một commit ghi chép và kết quả.

### Đã làm

**Cannae** (`cannae.md` mục 19):

- Giai đoạn 6: `iberian-cavalry` và `gallic-cavalry` từ `fight` sang `overrun`. Căn cứ: Polybius 3.116 (bản Paton) tả Hasdrubal đánh vào lưng các quân đoàn, xung phong nhiều lượt, ở nhiều chỗ cùng một lúc. Không nguồn nào nói kỵ binh dừng lại đấu với hàng sau của quân La Mã. Livy 22.48–49 không tả cách đánh (và bản chép tay của 22.48 ghi bộ binh, mục 18).
- `triarii` (giai đoạn 6) từ `fight` sang `stand`: mặt trước của khối chỉ nhìn ra hai khối kỵ binh đó. Không chọn `retreat` hay `rout`, vì Polybius nói quân La Mã bị giết tại chỗ. Hai khối ở hai sườn vẫn `fight` với lính Libya.
- Không đổi vị trí, quân số, thương vong, lời dẫn, mũi tên. Giai đoạn 5 kết thúc bằng `charge` (lệch hướng mặt 22° và 30°), nên trong cảnh người cưỡi phi thẳng vào hàng triarii với tốc độ đang có (21–22 m mỗi giây phát), không khựng.

**Hồ Trasimene** (`trasimene.md` mục 13):

- **Kỵ binh Gaul**, giai đoạn 3–4: từ `fight` sang `overrun`. Căn cứ: Livy 22.6.3–4, Ducarius thúc ngựa xông qua chỗ quân địch dày đặc nhất (*per confertissimam hostium turbam*) tới chỗ Flaminius. `velites-2`, vốn chỉ đấu với kỵ binh Gaul, từ `fight` sang `stand`.
- **Phải dời hai khối** (mốc 2, 3, 4). Trong file cũ, 150 trên 310 m mặt trận của kỵ binh Gaul chạm kỵ binh La Mã cùng Flaminius, không phải bộ binh. Nếu chỉ đổi hành động thì 126 trên 200 người cưỡi đứng yên, và kỵ binh La Mã không còn ai đấu (`validate` báo lỗi).
  - Kỵ binh Gaul thu về đúng mặt trận của `velites-2`: 120 × 134 m, cùng diện tích (trước 310 × 52).
  - `gauls-2` kéo dài từ principes quân đoàn I tới kỵ binh La Mã và đánh cả kỵ binh La Mã: 430 × 16 m, cùng diện tích (trước 240 × 28).
  - Điểm cuối mũi tên xung phong của kỵ binh Gaul ở giai đoạn 2 dời theo.
  - Mốc 5–6 giữ nguyên.
  - Quanh Flaminius nay có bộ binh Gaul đánh nhóm kỵ binh của ông (Polybius 3.84.6: một nhóm người Celt), còn kỵ binh Gaul phi qua đám lính đi bộ ngay cạnh (Livy).
- **Kỵ binh đồng minh cánh phải** (phía La Mã) đấu với `iberians-2`: giữ `fight`. Không nguồn nào nói kỵ binh La Mã xông vào bộ binh: Livy 22.4–7 và Polybius 3.82–85 không cho kỵ binh La Mã làm gì trong trận. Đoàn quân bị đánh úp khi còn đi hàng dọc, chưa kịp dàn trận (Polybius 3.84.3–4, Livy 22.5). Trong file, khối này vừa quay tại chỗ sang hàng ngang thì bị đánh, không có đà.
- **Kỵ binh Numidia** đấu với kỵ binh đồng minh cánh trái: ngựa đấu ngựa, giữ `fight`.
- Không đổi quân số, thương vong, lời dẫn (lời dẫn giai đoạn 4 đã viết Ducarius "phi qua hàng ngũ La Mã").

### Đã kiểm tra

- `npm run validate`: qua, không cảnh báo (trước cũng không có). Mọi khối `overrun` có 21/21 điểm mép trước nhìn thẳng vào bộ binh địch ở cả hai mốc.
- `npm run lint`, `npm run build`: qua.
- Engine của cảnh chạy bằng Node trên dữ liệu mới: mọi người cưỡi còn sống đều phi vòng, không ai đứng yên, không ai nhảy chỗ. Mọi người cưỡi phi tiếp từ cú xung phong của giai đoạn trước. Cả 195 hình triarii chết ở giai đoạn 6 và cả 34 hình `velites-2` chết ở giai đoạn 3–4 đều ngã lúc có ngựa trong vòng 4,5 m. Ở cả hai trận, giáp lá cà của các khối khác không đổi (lệch một hình ở lính Libya phải, Cannae).
- `check-overlap.mjs`, `check-facing.mjs` (Trasimene): không có dòng mới. Cặp `velites-2` và kỵ binh Gaul chạm mép 7% không còn trong danh sách chồng lấn; `check-facing` bớt một dòng (kỵ binh Gaul truy đuổi ở giai đoạn 5).
- Xem trong cảnh (`/battle-lab`, dev server cổng 3159) cả hai trận: người cưỡi phi vòng qua bộ binh; bộ binh ngã khi ngựa tới (clip `knockdown` chưa có nên ngã theo `die` rồi dậy); không khối nào đánh vào khoảng không; không người cưỡi nào đứng yên.
- Ảnh trước (A) và sau (B): `E:\World_History_Platform_assets\duyet\T-059\` (`01`–`04` Cannae, `05`–`10` Trasimene; `04` và `10` là sáu ảnh lúc đang phát qua mốc có `charge`). Kịch bản chụp và các script kiểm bằng Node ở `tools/` trong cùng thư mục.
- **Khung hình/giây** (1280×800, GPU rời, góc nhìn rộng; bảng đầy đủ ở hai file ghi chép). Hai bản chạy xen kẽ trên cùng máy. Blender của một phiên khác chạy từng đợt, nên tôi ghi từng lượt có Blender hay không.
  - Khi không có Blender: Cannae giai đoạn 6 như nhau (bản sau 59,0 và 62,5; bản trước 57,6–60,4 và 62,4). Trasimene giai đoạn 3–4: bản sau chậm hơn khoảng 3–4 khung/giây (khoảng 4%), vẫn trên 74.
  - Khi có Blender: số dao động mạnh. Hai lượt bản sau ở Cannae chỉ còn 33–43 khung/giây, và một lượt ở Trasimene còn 46. Hai lượt bản sau khác, cùng có Blender, ngang bản trước (54–57).
  - Tôi không tách được phần do Blender và phần có thể do bản mới. Lượt đo thứ ba (chỉ đo khi Blender tắt) và dev server đã bị Claude Code dừng vì máy thiếu bộ nhớ, sau một lượt đo. Theo lưu ý của hệ thống, tôi không tự chạy lại. **Đề nghị đo lại Cannae giai đoạn 6 khi máy rảnh** (kịch bản `tools/s-t059-fps.mjs`, `tools/fps-run3.sh`).

### Còn lại

- `velites-2` (Trasimene) bị xô ngã liên tục: 200 hình kỵ binh qua một dải 120 × 16 m, trung bình 7–8 lần mỗi hình trong 50 giây phát. Tôi giữ nguyên quân số và chỗ đứng.
- Cú xung phong của kỵ binh Gaul ở giai đoạn 2 (Trasimene) nhanh khoảng 78 m mỗi giây phát, quá trần phi (57). Người cưỡi mang tốc độ đó vào giai đoạn 3 trong khoảng một giây đầu, nên móng trượt. Có từ T-052; tôi không sửa.

### Đề nghị ngoài phạm vi

- `scripts/battles/cannae-lines.mjs` (vùng của lane 2, ngoài phạm vi task này) vẫn ghi `fight` cho `iberian-cavalry`, `gallic-cavalry` và `triarii` ở mốc 6. Chạy lại script với `--write` sẽ xoá thay đổi này. Đề nghị đổi ba dòng trong bảng `STATES` (mốc 6) sang `overrun`, `overrun`, `stand`, ở một task sau hoặc khi gộp. (Đã làm ở mục 5b.)
- Chế độ xem trước `?overrun=1` (`src/app/battle-lab/overrunPreview.ts`) đổi mọi khối kỵ binh có bộ binh trước mặt, kể cả khối chỉ có một phần mặt trận trước bộ binh, và không đổi khối kỵ binh đối diện. Sau khi gộp, dữ liệu hai trận đã ghi `overrun` nên chế độ này chỉ còn để thử. Không cần sửa.

### Mục 5 (sau review, 2026-11-20)

Bốn commit trên cùng nhánh, sau khi gộp `main` (`23b172e`): `57d3254` (5a), `61836fe` (5b), `516055d` (5c), và commit này (5d, 5e).

**Trước khi làm.** Hai file trận chưa commit là do `fps-run3.sh`, script đo của lượt ba. Khi Claude Code dừng lệnh vì thiếu bộ nhớ, tiến trình bash của script vẫn sống và tiếp tục đổi qua lại hai file trận. Tôi đã dừng tiến trình đó, rồi `git restore src/data/battles/`. Sau đó các lần đo đều chạy ở tiền cảnh và luôn chép lại bản đúng khi xong.

**a) Thời lượng.**
- `playSeconds` đổi đúng như bảng: Cannae 1: 45, 6: 39; Trasimene 1: 34, 2: 37, 5: 34, 6: 26. Không đổi `endHour`, vị trí, hành động, quân số.
- Bảng các giai đoạn và các câu về tốc độ trong `cannae.md` (mục 6, mục 19 "Thời lượng") và `trasimene.md` (mục 6, 12, mục 13 "Thời lượng") đã sửa.
- `main-tools/gait/slide.mjs` trên dữ liệu của nhánh, phần thời gian di chuyển mà chân trượt hơn 5%:

| | Cannae | Trasimene |
|---|---|---|
| Thời lượng cũ, trần cũ | 20,2% | 29,1% |
| Thời lượng cũ, `run=2.2 runHorse=1.5` | 11,0% | 19,8% |
| Thời lượng mới, trần cũ | 12,3% | 24,7% |
| Thời lượng mới, `run=2.2 runHorse=1.5` | 2,6% | 1,0% |
| Thêm 5c (đường đi của `camp-force`), `run=2.2 runHorse=1.5` | **1,8%** | |
| Thêm 5c, trần cũ | 14,7% | |

- Chỗ còn trượt: Cannae chỉ còn `camp-force` rút về trại ở giai đoạn 6 (59,6 m/s, trượt 35%); Trasimene là bộ binh đồng minh cánh phải phần sau tháo chạy ở giai đoạn 5 (51 m/s, 25%).
- Kỵ binh Gaul ở Trasimene nay lao vào velites với tốc độ 42 m/s (trước 78), dưới trần phi, nên hết chuyện móng trượt ở đầu giai đoạn 3 (mục "Còn lại" ở trên).
- Kỵ binh xông qua vẫn như trước (Node): không người cưỡi nào đứng yên hay nhảy chỗ. Cả 195 triarii và 34 velites quân đoàn II chết ở các giai đoạn đó vẫn ngã dưới vó ngựa. Ở Cannae, người cưỡi chạy 4,2–4,3 vòng thay vì 3,2–3,3.

**b) `cannae-lines.mjs`.** Bảng `STATES` của mốc 6: triarii `stand`, kỵ binh Iberia và Gaul `overrun`, kèm chú thích nguồn. Chạy không có `--write`: "0 lines would change".

**c) `camp-force` ở Cannae: đã sửa** (`cannae.md` mục 19, "Đường đi của lực lượng ở trại lớn").
- Polybius 3.117 cho lực lượng này đánh trại Hannibal "khi trận bắt đầu", và Paullus để họ lại để vào trại khi Hannibal kéo hết quân ra. Với một trại cách 2,2 km, họ phải lên đường trong lúc hai bên dàn trận. Đây là suy luận, nguồn không viết. Không có đường ngắn hơn: ra cổng nào cũng khoảng 2,2 km đường thẳng.
- Lúc bắt đầu, khối đứng ngay ngoài cổng trại lớn (chỗ mốc 1 cũ), hướng 237. Đứng sau cổng rồi đi chéo thì nó cắt ngang đường của kỵ binh La Mã ra cùng cổng.
- Mốc 1 ở (−2964,4, −205), ba phần tư đường tới cổng trại Hannibal. Giai đoạn 1 và 2 đều 36,1 m/s (trước 7 và 145).
- Đi kèm: thêm mũi tên ở giai đoạn 1, dời đầu mũi tên giai đoạn 2, sửa lời dẫn giai đoạn 1 (`en` và `vi`). Mốc 2–6 và `cannae-lines.mjs` không đổi.
- Kiểm tra: `validate` qua. `check-overlap` và `check-facing` in như trước. Không có chồng lấn nào với `camp-force` hay kỵ binh La Mã, kể cả ở ngưỡng 0,01%. Không cắt sông. Phần đất trại lớn không dựng lều còn 3,8% (trước 6,1%).
- Ảnh trong cảnh: `11`–`13-cannae-camp-force-*-B-sau.png` trong thư mục ảnh.
- **Còn lại:** `camp-force` rút về trại ở giai đoạn 6 (2,3 km trong 39 giây). Mốc 6 phải ở trại lớn theo Polybius. Muốn hết trượt thì giai đoạn 6 cần khoảng 60 giây phát; để phiên chính quyết.

**d) Khung hình/giây: máy chưa rảnh**, phiên chính đo khi gộp.
- Suốt buổi chiều Blender của lane 1 chạy từng đợt, và có thêm Godot. Mỗi lượt đã chờ tới 150 giây cho Blender tắt, và một tiến trình phụ ghi lại Blender có chạy không, nhưng không lượt nào sạch.
- Cặp đo ở Cannae giai đoạn 6, cả hai có Blender: bản sau 42 và 49 khung/giây, bản trước 59 và 57.
- Vì vậy tôi đo thêm thời gian CPU của luồng chính bằng hồ sơ CPU của Chrome, bốn lượt mỗi trận (bảng ở `cannae.md` mục 19):
  - Phần việc JS mỗi khung (trừ lúc chờ GPU) của hai bản như nhau: Cannae 8,7–10,9 ms, Trasimene 12,0–18,4 ms.
  - Số này tăng giảm theo việc Blender có chạy hay không, không theo bản, và không hàm nào của phần xông qua nằm trong nhóm tốn nhiều nhất.
  - Những lần bản sau tụt xuống 33–43 khung/giây nhiều khả năng là do máy bận.
- Kịch bản để đo lại: `tools/fps-run4.sh` (cần dev server ở cổng 3159, hoặc đặt `BASE`).

**e)** `npm run validate` (không cảnh báo), `npm run lint`, `npm run build`: qua.

### Mục 6 (phiên chính làm thay lane 2, 2026-11-20)

Người dùng giao phiên chính làm luôn việc của lane 1 và lane 2 ở lượt này. Nhánh `batch-l/T-059-s6` từ `main`.

- `playSeconds`: Cannae giai đoạn 6 39 → 60 (cả trận 169 → 190 giây), Trasimene giai đoạn 5 34 → 45 (181 → 192 giây). Không đổi gì khác.
- `main-tools/gait/slide.mjs` (`run=2.2 runHorse=1.5`): chân trượt hơn 5% còn 0,0% thời gian di chuyển ở Cannae (trước 1,8%), 0,6% ở Trasimene (trước 1,0%). `camp-force` và `allied-right-rear` không còn trong danh sách trượt; còn `extraordinarii` ở Trasimene giai đoạn 4, trượt tối đa 6%.
- `main-tools/overrun/check.mjs` cho Cannae: người cưỡi chạy 6,5–6,8 vòng ở giai đoạn 6, bước lớn nhất 31 m/s; cả 195 triarii chết vẫn ngã lúc có ngựa trong vòng 4,5 m. Phần tính trước lúc nạp trận 437 ms thay vì 372 ms.
- `main-tools/melee/falls.mjs` cho Cannae: 94% người ngã có đòn chạm đúng lúc (trước 91%).
- `cannae.md` mục 19 và `trasimene.md` mục 13: bảng thời lượng, tốc độ, phần mới ở cuối mục; dòng "Còn lại" về `knockdown` sửa lại vì T-057 đã gộp.
- `npm run validate`, `npm run lint`, `npm run build`: qua.

