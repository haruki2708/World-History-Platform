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

- `scripts/battles/cannae-lines.mjs` (vùng của lane 2, ngoài phạm vi task này) vẫn ghi `fight` cho `iberian-cavalry`, `gallic-cavalry` và `triarii` ở mốc 6. Chạy lại script với `--write` sẽ xoá thay đổi này. Đề nghị đổi ba dòng trong bảng `STATES` (mốc 6) sang `overrun`, `overrun`, `stand`, ở một task sau hoặc khi gộp.
- Chế độ xem trước `?overrun=1` (`src/app/battle-lab/overrunPreview.ts`) đổi mọi khối kỵ binh có bộ binh trước mặt, kể cả khối chỉ có một phần mặt trận trước bộ binh, và không đổi khối kỵ binh đối diện. Sau khi gộp, dữ liệu hai trận đã ghi `overrun` nên chế độ này chỉ còn để thử. Không cần sửa.
