# T-032: Giáp lá cà, chặng 1 (cảnh và dữ liệu, clip sẵn có)

- **Ai làm:** phiên chính (người dùng chọn 2026-11-18, không giao lane).
- **Model:** Fable 5.2, effort `xhigh`.
- **Nhánh:** `batch-g/stage1-melee` (tạo từ `main`). Không commit thẳng vào `main`; commit sau mỗi phần lớn.
- **Trạng thái:** xong 2026-11-18, chờ lane 3 đọc lại nhánh và người dùng duyệt gộp.
- **Phạm vi file:** `src/lib/battle.ts`, `src/components/battle/`, `src/data/battles/`, `scripts/battles/`, `docs/data/battles/`, `src/app/battle-lab/`, `src/lib/i18n/messages.ts`, `src/components/shell/AboutDialog.tsx`, `docs/`.
- **Kế hoạch chung:** `docs/PLAN.md`, mục "Đợt G".

File này vừa là đề bài vừa là nhật ký: phiên nào làm tiếp thì đọc mục "Kết quả" ở cuối trước.

## Vấn đề

Đo bằng chính code của cảnh (`timeline.ts`, từng hình lính, mỗi 1/4 giai đoạn):

- Giai đoạn 4–6 của Cannae: người hàng đầu của các khối `fight` cách hình lính địch gần nhất 20–70 m (trung vị 30–50 m), không lúc nào dưới 8 m.
- Hai chiến tuyến chỉ gặp nhau đúng ở mốc cuối giai đoạn 4. Suốt giai đoạn 4 chúng còn đang tiến lại gần nhau (99 m ở 3/4 giai đoạn), vì cảnh nội suy thẳng giữa hai mốc.
- Lính Libya chạm sườn quân La Mã đúng ở mốc cuối giai đoạn 6, tức lúc trận kết thúc; kỵ binh Hasdrubal cũng vậy.
- Lưỡi liềm là năm khối thẳng xếp bậc thang, còn mặt trận La Mã là hai khối cong: hai đường không trùng nhau.
- Cảnh: hàng trước (`rank ≤ 0,34`) phát `attack` suốt giai đoạn `fight`; người ngã chọn ngẫu nhiên lúc dựng `UnitTrack`.

## Xong khi

- Cannae: ở giai đoạn 4–6, người đầu hàng của các khối đánh gần có đối thủ trong tầm (đo bằng script).
- Không khối nào đánh vào khoảng không; người ngã trong khối đang đánh là người đầu hàng, ngã đúng lúc đòn chạm.
- Tua tới cùng một thời điểm ra cùng người đứng, người ngã.
- Tốc độ khung hình không thấp hơn `main` khi đo xen kẽ.
- `npm run lint`, `npm run validate`, `npm run build` qua; hồi quy lõi qua.
- Hộp thoại Giới thiệu có câu: các cặp đấu là minh hoạ.
- `docs/ARCHITECTURE.md` (mục "Giáp lá cà"), `docs/data/battles/cannae.md` cập nhật.

## Kết quả

Làm 2026-11-18. Thiết kế đầy đủ ở `docs/ARCHITECTURE.md`, mục "Giáp lá cà (đợt G)"; căn cứ dữ liệu ở `docs/data/battles/cannae.md`, mục 11.

### Đã làm

**Hợp đồng (`src/lib/battle.ts`)**

- `UnitAction` thêm `skirmish` (đánh từ xa). `fight` từ nay là giáp lá cà: mép trước của khối phải nằm trên mép trước của một khối địch cũng `fight`, ở cả mốc đầu lẫn mốc cuối giai đoạn.
- Lúc đầu định thêm cờ `UnitType.ranged`; bỏ, vì cùng một loại lính có lúc đánh xa có lúc đánh gần.
- Nhãn trong thẻ khối quân: `battle.action.fight` thành "Giáp lá cà" / "Fighting hand to hand", thêm `battle.action.skirmish` ("Đánh từ xa" / "Skirmishing").

**Cảnh (`src/components/battle/engine/`)**

- `timeline.ts`: người ngã trong giai đoạn `fight` là người đầu hàng dọc, và chỉ ở hàng dọc có địch trước mặt (`opposition`); người sau bước lên; xếp lại hàng ở mỗi mốc theo vị trí đang đứng; hàng đầu sát mép trước của khối; mỗi hình có nhịp bị đánh (`beat`).
- `melee.ts` (mới): ghép cặp người đầu hàng hai bên mỗi khung hình.
- `units.ts`: hình lính có đối thủ thì bước tới, quay mặt và đánh theo nhịp của đối thủ; không có đối thủ thì không đánh; `Crowd.engage()`.
- `figures/model.ts`: đo từ clip `attack` lúc nạp mô hình thời điểm đòn chạm và tầm với (`UnitModel.strike`). Số đo được: đâm kiếm chạm ở 0,30 s, tầm 1,07 m; chém (Gaul) 0,50 s, 0,98 m; giáo triarii 1,93 m; kỵ binh 0,47 s, tầm 2,0 m, đầu ngựa nhô 1,47 m.
- `figures/material.ts`: thuộc tính `iStrike` cho từng hình.
- `stress.ts`: hai hàng khối đầu của trận tổng hợp chạm nhau.

**Dữ liệu Cannae**

- `scripts/battles/cannae-lines.mjs` (mới) dựng bố cục các mốc 1–6 và ghi vào file trận.
- Lời dẫn giai đoạn 2–5 và mũi tên giai đoạn 2–6 sửa theo bố cục mới (bảng trong `cannae.md`, mục 6).
- `scripts/battles/validate-battles.mjs`: quy tắc khối `fight` phải chạm địch ở cả hai mốc. Dữ liệu cũ sai quy tắc này.

**Khác**

- `/battle-lab?duel=1` (`src/app/battle-lab/duelBattle.ts`).
- Hộp thoại Giới thiệu: thêm dòng `about.accuracy.battle.duels`.

### Đã kiểm tra

- `npm run lint`, `npm run validate`, `npx tsc --noEmit`, `npm run build` (dựng trong worktree tạm): qua.
- Số người đầu hàng có đối thủ trong tầm, mỗi 1/4 giai đoạn: bảng ở `cannae.md`, mục 11. Giai đoạn 4: hastati 73–91 trên 93–94.
- Hai phe không còn chồng lên nhau từ giai đoạn 3 (`check-overlap.mjs --min 0.04`).
- Hồi quy lõi của app (`main-tools/reg-core.js`) trên bản production của commit `539ae73`: 17/17 qua, console sạch.
- Trong trình duyệt (Chrome không cửa sổ, RTX 3050): `/battle-lab?duel=1` và Cannae, lúc dừng và lúc phát, qua từng mốc 3–6; trận tổng hợp `?stress=7000`. Console sạch.
- Chi phí tính mỗi khung (Node, Cannae): lấy vị trí mọi hình 0,17–0,19 ms, ghép cặp 0,09–0,12 ms. Dựng mọi `UnitTrack` lúc nạp: 65 ms.
- Tốc độ khung hình, bản production, đo xen kẽ với `main`, hai vòng, không có Blender chạy:

| Lúc | `main` | Nhánh |
|---|---|---|
| Mở cảnh, dừng | 101, 111 | 109, 110 |
| Phát giai đoạn 3 | 70, 72 | 68, 72 |
| Phát giai đoạn 4 | 65, 73 | 69, 65 |
| Phát giai đoạn 5 | 55, 61 | 66, 61 |
| Phát giai đoạn 6 | 73, 68 | 60, 64 |

  Giai đoạn 6 thấp hơn 7–18% ở phép đo này. Đo lại bằng cách khác (số khung trong 7 giây, không đọc pixel): 848 và 764 khung ở `main`, 798 và 840 ở nhánh; thời gian `Crowd.update` mỗi khung 2,1 và 2,9 ms ở `main`, 3,0 và 2,7 ms ở nhánh. Hai phép đo trái chiều nhau, nên chưa kết luận được là giai đoạn 6 chậm hơn; cần đo thêm vài vòng khi review.

### Chưa làm, còn lại

- Hai người trong một cặp đánh lệch nhịp ngẫu nhiên, chưa luân phiên đều. Người bị đánh không phản ứng cho tới khi ngã. Cả hai thuộc chặng 2 (clip `block`, `hit`).
- Lính nhẹ La Mã trong hộp ở giai đoạn 6 vẫn mất người theo cách cũ (335 hình, không ai đánh).
- Hai sườn ở giai đoạn 6: mỗi hàng dọc mất một người sau khoảng 2 giây phát, người mới vừa bước lên đã ngã.
- Giai đoạn 5: các khối La Mã đổi chỗ nhiều, còn khối cùng phe đi cắt qua nhau vài giây (tối đa 18%).
- Lính giáo nhẹ của Hannibal dùng mô hình `iberian-infantry` (đâm kiếm), nên ở giai đoạn 2 (`skirmish`) vẫn đâm kiếm từ xa như trước. Có từ trước đợt G.
- Khối đi xiên nhiều hơn trước: `check-facing.mjs --min 0.25` in 53 dòng (46 sau T-027), phần lớn ở giai đoạn 5–6, lúc quân La Mã dồn thành hộp. Lính Libya ở giai đoạn 6 vừa đánh vừa dịch 158 m lệch 55° so với hướng mặt.
- Câu lời dẫn giai đoạn 2–5 đã đổi: người dùng nên đọc lại.

### Đề nghị cho chặng 2

- Hợp đồng: thêm `block`, `hit` vào cuối `UNIT_CLIPS`; quy ước thời điểm đòn chạm trong hai clip này.
- Cảnh: cho hai người trong một cặp luân phiên (hiện nhịp của mỗi người là riêng, neo vào lúc ngã).
