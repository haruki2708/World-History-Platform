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

## Ràng buộc

- Chỉ sửa file trong phạm vi: không sửa cảnh, hợp đồng hay chuỗi giao diện.
- Không đổi quân số và thương vong. Nếu thấy cần đổi thì ghi đề nghị.
- Chỗ nào nguồn không ủng hộ kỵ binh xông vào bộ binh thì giữ `fight` và ghi lại.

## Xong khi

- Mỗi chỗ kỵ binh đấu với bộ binh ở hai trận đã được xét và quyết theo nguồn. `validate`, `lint`, `build` qua.
- Có ảnh trước và sau, số khung hình/giây; mục "Kết quả" đã điền.

Phiên chính sẽ nói thêm về kỵ binh xông qua trong câu về giáp lá cà ở hộp thoại Giới thiệu khi gộp.

## Kết quả

(Lane 2 điền khi xong.)
