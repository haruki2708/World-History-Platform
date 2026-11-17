# T-030: Clip phi nước đại mới cho ngựa

- **Lane:** 2 (người dựng ngựa ở T-020).
- **Model đề xuất:** Opus 5.5, effort `high`.
- **Nhánh:** `lane2/T-030-gallop` (tạo từ `main` mới nhất, đã có T-022)
- **Phạm vi file:** `art/blender/horse_*.py`, `art/renders/horse/`, `art/README.md` (mục "Ngựa"). Ngoại lệ cho task này: được chạy script dựng của lane 1 để xuất lại **ba mô hình kỵ binh** (`public/battles/models/roman-cavalry.glb`, `iberian-gallic-cavalry.glb`, `numidian-cavalry.glb`) và ảnh duyệt `art/renders/<ba mô hình kỵ binh>/` có clip `run`. Không sửa các module `whp_*.py` và `unit_*.py` của lane 1; cần đổi thì ghi đề nghị.

## Bối cảnh

T-022 đã đưa ba mô hình kỵ binh vào cảnh. Clip `run` (phi nước đại) của ngựa vẫn là clip lấy từ file gốc "Horse Rigged All Gaits": một vòng 0,400 s chỉ đi được **1,09 m** (2,73 m/s ở cỡ thật). Một con ngựa phi thật đi 4–7 m mỗi sải, 10–15 m/s.

Cảnh vẽ hình lính to gấp 3 lần (`FIGURE_SCALE` trong `src/components/battle/engine/units.ts`) và phát mỗi dáng đi nhanh nhất 1,5 lần tốc độ của nó (`MAX_RATE`). Với clip hiện tại, trần là khoảng 12,3 m/s trên sân. Trong trận Cannae, kỵ binh phi 9–72 m/s trên sân (trận 11 giờ phát trong vài phút), nên móng trượt rõ khi phóng gần ở giai đoạn 1, 3, 4–5. Clip gốc còn trượt móng ở vài khung ngay ở tốc độ của nó.

Người dùng chọn dựng lại clip phi (2026-11-17).

## Đọc trước

- `docs/tasks/T-022-cavalry.md`, mục "Kết quả": "Sải móng", "Còn chưa ưng ý" mục 1–3.
- `art/README.md`, mục "Ngựa" và "Kỵ binh (T-022)".
- `docs/ARCHITECTURE.md`, mục "Mô hình lính": "Bước chân", "Kỵ binh".
- `art/tools/gait_check.py`: cách đo sải chân như cảnh.
- Cách lane 1 khoá chân trụ cho người: `whp_clips.Builder.lock_feet` (chỉ đọc, không sửa).

## Yêu cầu

### 1. Clip phi mới

- Một vòng khoảng 0,40–0,45 s (nhịp phi thật khoảng 2,2–2,5 sải mỗi giây), đi được **4,5–6 m ở cỡ thật**.
- Móng trụ không trượt: dưới 5% quãng đường, đo bằng `gait_check.py` như cảnh đo.
- Dáng phi bốn nhịp đúng thứ tự chân (có thể lấy `run` hay `canter` có sẵn làm gốc rồi kéo dài sải, khoá móng bằng IK cho chân ngựa nhiều đoạn; hoặc dựng lại từ đầu). Ghi rõ cách làm trong `art/README.md`.
- Thân và cổ ngựa nhún theo nhịp như clip gốc; lặp liền mạch.
- Clip `walk` và `trot` (`jog` của kỵ binh): nếu cùng cách khoá móng sửa được chỗ trượt có sẵn (`walk` tới 101%, `trot` 88% ở vài khung) mà không đổi sải thì làm; không thì để nguyên và ghi lại.

### 2. Xuất lại ba mô hình kỵ binh

- Dựng lại ngựa (`horse_build.py`) rồi ba mô hình kỵ binh bằng script của lane 1 (`build_model.py -- --model <tên>`). Người cưỡi trong `run` phải theo được nhịp mới (giáo, khiên, dây cương vẫn đúng chỗ).
- Năm clip còn lại của ba file giống hệt từng byte so với bản trước (so dữ liệu hoạt hình như T-022 đã làm). Nếu không giữ được thì ghi lý do.
- Dựng lại lần hai ra file giống hệt từng byte.

### 3. Kiểm tra trong cảnh

- `/battle-lab?battle=battle-of-cannae&stats=1`: số đo khi nạp (sải `run` mới), console sạch.
- Xem gần kỵ binh phi ở giai đoạn 1 và 3 (tốc độ phát thường): móng không còn trượt rõ ở tốc độ dưới trần mới. Ghi trần mới (m/s trên sân) và phần thời gian kỵ binh Cannae còn vượt trần.
- Nước kiệu giờ có khoảng tốc độ rộng hơn (T-022 ghi chỉ khoảng 6,6–7,3 m/s trên sân): ghi khoảng mới.

### 4. Ảnh duyệt

- `art/renders/horse/`: ảnh dải khung của clip phi cũ và mới, nhìn nghiêng.
- Ảnh `run` của ba mô hình kỵ binh trong `art/renders/<model>/` render lại.

## Ràng buộc

- Không sửa `src/` (cảnh do lane 3 giữ). Cảnh tự đo sải từ clip, không cần đổi code. Nếu thấy cần (ví dụ trần nhịp riêng cho ngựa), ghi đề nghị.
- Không thêm thư viện npm. Mỗi file `.glb` vẫn dưới 4 MB.
- Chỉ dùng tài nguyên CC0 hoặc CC BY. Nếu lấy clip phi từ nguồn khác thì ghi công trong `art/CREDITS.md` và báo phiên chính (README, khung xem trận).
- Trước mỗi lần chạy Blender, kiểm tra `tasklist`; không chạy song song với Blender khác.
- Commit sau mỗi phần việc lớn: các lane hay hết hạn mức giữa chừng.

## Xong khi

- Clip phi mới: một vòng 4,5–6 m ở cỡ thật, móng trụ trượt dưới 5%.
- Ba mô hình kỵ binh xuất lại, các clip khác không đổi, dựng lại ra đúng từng byte.
- Cảnh Cannae: kỵ binh phi không còn trượt rõ; console sạch.
- `npm run validate`, `npm run lint`, `npm run build` qua.

## Kết quả

_(Lane điền khi xong.)_
