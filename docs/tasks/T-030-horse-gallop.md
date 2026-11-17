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

Lane 2, nhánh `lane2/T-030-gallop`. Các commit: `95c43b0` (clip), `c894a34` (ba mô hình), `d7b0384` (ảnh ngựa), `267fe34` (ảnh kỵ binh), `98b9b92` (README, ảnh cảnh) và commit điền mục này.

### 1. Clip phi mới

`art/blender/horse_gallop.py` (mới); `horse_build.py` gọi nó ở giai đoạn `anim`. Cách làm ghi ở `art/README.md`, mục "Ngựa" → "Clip phi (T-030)". Tóm tắt:
- **Nhịp:** một vòng **13 khung = 0,433 s** (2,3 sải mỗi giây).
- **Sải:** **5,51 m ở cỡ thật** (12,7 m/s).
- **Móng trụ trượt 1%**, đo như cảnh (`gait_check.py`); clip gốc 270%.
- **Thứ tự chân:** bốn nhịp, giữ như clip gốc (nước đại tay phải): sau trái chạm ở khung 0, sau phải 2, trước trái 4, trước phải 6, rồi bay tới khung 13 (= khung 0). Chân sau trụ 2 khung, chân trước 3 khung.
- **Thân, cổ, đầu, đuôi:** lấy từ clip gốc, giãn 12 → 13 khung, nên nhún như gốc. Clip lặp liền: khung cuối là khung đầu.
- **Chân:**
  - Mỗi chân là chân của clip gốc, nắn lại thời gian, rồi IK phẳng (quay quanh trục ngang) đặt móng: khi chạm đất, móng nằm phẳng và lùi đều; khi bay, móng theo đường gốc cộng một độ lệch chuyển mượt (như `whp_clips.lock_shifts`) và cách đất ít nhất 3 cm.
  - Khuỷu và gối chân trước gần như không gập, nên chân trụ thẳng.
  - Sai số IK của móng chạm đất: 0,0 mm.

**`walk` và `trot`:**
- **`trot`** (`jog` của kỵ binh): đã khoá móng trụ (`horse_gallop.lock`). Trượt từ 88% còn 1%, sải giữ nguyên 1,82 m.
- **`walk`:** để nguyên (trượt 102% trên lưới chi tiết, 101% trên LOD0 của kỵ binh).
  - Khi đi bước, móng lăn từ gót tới mũi lúc chạm đất, nên điểm thấp nhất chạy dọc móng.
  - Khoá theo điểm thấp nhất thì sải cảnh đọc ngắn đi 8% mà vẫn trượt 31%; như vậy đổi sải mà không hết trượt.
- **`canter`:** không đổi, không mô hình nào dùng.

**Sải đo bằng `gait_check.py` trên file `.glb` (LOD0), trước → sau:**

| Mô hình | `walk` | `jog` | `run` |
|---|---|---|---|
| `roman-cavalry`, `iberian-gallic-cavalry` | 1,082 m / 1,667 s, 101% (không đổi) | 1,823 → 1,822 m / 0,833 s; trượt 88% → **1%** | 1,094 m / 0,400 s, 269% → **5,506 m / 0,433 s, 1%** |
| `numidian-cavalry` (ngựa 0,95 lần) | 1,027 m, 101% (không đổi) | 1,732 → 1,731 m; 88% → **1%** | 1,039 m, 269% → **5,231 m / 0,433 s, 1%** |

Vậy `run` mới đi 4,5–6 m mỗi vòng ở cả ba mô hình (Numidia 5,23 m vì ngựa nhỏ hơn).

### 2. Xuất lại ba mô hình kỵ binh

- **Dựng lại ngựa:** `horse_build.py -- --from rig`.
  - Không chạy giai đoạn `source`: mở file gốc 612 MB lúc máy thiếu RAM thì rủi ro. `source.npz` được chép từ bản dựng của lane 1, cùng mã băm, nên kết quả như chạy từ đầu.
- **Dựng lại mô hình:** `build_model.py -- --model <tên>` cho từng mô hình. Không sửa `whp_*.py` hay `unit_*.py`.
  - Lần dựng `roman-cavalry` đầu tiên bị Claude Code dừng ở giai đoạn `export` vì máy sắp hết RAM. Chạy lại với `--from export` từ các file giai đoạn đã lưu thì qua.
  - Ba mô hình đều qua `check_glb`; `index.json` không đổi.
- **So dữ liệu hoạt hình với bản trước** (băm keyframe của từng kênh, như T-022):
  - lưới, skin, ảnh, `idle`, `walk`, `attack`, `die` giống hệt từng byte ở cả ba file;
  - `run` đổi, như task yêu cầu;
  - **`jog` cũng đổi**, vì nó là `trot` của ngựa và `trot` đã được khoá móng theo yêu cầu 1. Phần người cưỡi trong `jog` không đổi cách dựng; chỉ xương ngựa (và người theo yên) khác.
- **Dựng lại lần hai** (ngựa rồi ba mô hình): ba file `.glb` **giống hệt từng byte** (SHA-256):
  - `roman-cavalry.glb` `6c1a982f…a1ce03`;
  - `iberian-gallic-cavalry.glb` `50e3e89c…2cb153`;
  - `numidian-cavalry.glb` `8aaecac5…35c709`.

  `horse-test.glb` và `horse-info.json` của ngựa cũng giống hệt. `horse.blend` thì không giống từng byte giữa hai lần lưu, nhưng không ảnh hưởng đầu ra.
- **Cỡ file:** 2 456 256, 2 156 004 và 2 109 508 byte, đều dưới 4 MB.
- **Người cưỡi theo nhịp mới:**
  - giáo, khiên và dây cương vẫn đúng chỗ (`art/renders/<model>/07-anim-run.jpg`);
  - độ cao yên trong `run`: 1,309–1,428 m (trước 1,308–1,428 m), nên người nhấp nhô như trước.

### 3. Trong cảnh

`/battle-lab?battle=battle-of-cannae&stats=1`, dev server `TUTOR_MOCK=1`, Chrome không giao diện, RTX 3050 Laptop:
- **Bảng số đo khi nạp:**
  - cả 11 mô hình là `file` (không có hình thay thế);
  - 6 810 hình lính, 96–97 lệnh vẽ, 3,9–4,0 triệu tam giác khi nhìn toàn trận, 98–200 khung/giây.
  - Bảng này không hiện sải. Cảnh đo sải bằng `plantedStride`, cùng cách với `gait_check.py`, nên sải `run` cảnh dùng là 5,506 m / 0,433 s (Numidia 5,231 m).
- **Console:** sạch (không có lỗi hay cảnh báo) trong mọi lần nạp.
- **Cận cảnh** (`art/renders/horse/11-scene-cannae.jpg`; chụp liền nhiều khung khi phát ở tốc độ thường, nhìn ngang đường chạy):
  - **Giai đoạn 1:** kỵ binh đồng minh phi khoảng 31 m/s trên sân, LOD0. Clip phát ở 0,81 lần tốc độ của nó, dưới trần, nên móng không trượt.
  - **Giai đoạn 3:** kỵ binh La Mã chạy về phía sông, đang phi.
  - Ảnh tĩnh không cho thấy trượt; điều chắc chắn là cả hai khối đều dưới trần mới.
- **Trần phi mới:** 38,1 m/s tự nhiên trên sân (12,7 m/s × 3) × 1,5 = **57,2 m/s trên sân** (Numidia 54,4 m/s), trước là 12,3 m/s.
- **Phần thời gian kỵ binh Cannae còn vượt trần:**
  - **20%** thời gian di chuyển (trước T-030 là 81%). Ước tính theo tâm khối, nội suy thẳng giữa các giai đoạn, có tính chỗ đổi dáng đi như cảnh (`GAIT_SLACK`).
  - Vượt trần chỉ còn ở hai khối kỵ binh của Hasdrubal (giai đoạn 1 và 5, 62–70 m/s) và người Numidia (giai đoạn 1, 70 m/s): móng trượt 8–22% quãng đường, trước là khoảng 80%.
- **Khoảng tốc độ của nước kiệu** (trên sân):
  - Kiệu tự nhiên 6,56 m/s; trần kiệu (× 1,8) 11,8 m/s.
  - Cảnh đổi `walk` ↔ `jog` quanh 3,6 m/s (3,9 khi nhanh dần, 3,2 khi chậm dần). Khoảng này không đổi.
  - Cảnh đổi `jog` ↔ `run` quanh **15,8 m/s** (17,4 khi nhanh dần, 14,2 khi chậm dần); trước T-030 là 7,3 m/s.
  - Vậy nước kiệu giờ được dùng khoảng **3,6–15,8 m/s** (T-022 ghi 6,6–7,3 m/s), nhưng chỉ không trượt tới 11,8 m/s.
  - Từ 11,8 tới 15,8–17,4 m/s, móng trượt tới khoảng 30%. Ước tính khoảng **11%** thời gian di chuyển của kỵ binh Cannae rơi vào khoảng này: kỵ binh La Mã giai đoạn 3 (15,9 m/s) và 5 (12,1 m/s), khối sau của Hasdrubal giai đoạn 4 (14,3 m/s). Trước T-030 không có, vì khi đó cảnh đổi sang phi từ 7,3 m/s.
  - Trong ảnh cận cảnh giai đoạn 3, khối La Mã đang phi chứ không kiệu: tốc độ trong cảnh được làm mượt, mỗi người lại đuổi theo chỗ của mình, nên con số theo tâm khối chỉ là ước lượng.

### 4. Ảnh duyệt

- `art/renders/horse/`:
  - `10-run-before-after.jpg` (mới): mọi khung của clip phi cũ và mới, nhìn nghiêng;
  - `06-anim-run.jpg` render lại (khung 0, 3, 6);
  - `09-extra-trot-canter.jpg` render lại (`trot` đã khoá);
  - `11-scene-cannae.jpg` (mới): cận cảnh trong cảnh Cannae.

  Các ảnh khác render lại ra giống hệt từng byte.
- `art/renders/<ba mô hình kỵ binh>/`:
  - `07-anim-run.jpg` render lại;
  - `06-anim-jog.jpg` cũng render lại vì `jog` đổi;
  - các ảnh hoạt hình khác (`idle`, `walk`, `attack`, `die`) render ra giống hệt từng điểm ảnh, chỉ khác byte của JPEG, nên giữ bản cũ.
- `horse_render.py` có thêm `--only` để render một số ảnh.

### Kiểm tra

`npm run validate`, `npm run lint`, `npm run build`: qua.

### Đề nghị (phiên chính, lane 3, lane 1)

1. **Kiệu nhanh quá trần (lane 3, `src/components/battle/engine/units.ts`).** Nay `run` nhanh gấp gần 6 lần `jog`, nên chỗ đổi theo trung bình nhân (15,8 m/s) nằm cao hơn trần kiệu (11,8 m/s). Ba cách:
   - **Nên làm:** đổi sang dáng nhanh hơn khi vượt trần của dáng hiện tại, tức chỗ đổi là `min(trung bình nhân, tốc độ × MAX_RATE)`. Khi đó ngựa đổi sang phi ở 11,8 m/s, phát `run` ở 0,31 lần (phi chậm) thay vì kiệu trượt. Sửa vài dòng, không cần dựng lại mô hình.
   - Hoặc tăng `MAX_RATE` của `jog` cho kỵ binh lên khoảng 2,4–2,7 lần. Kiệu 0,31–0,35 s một vòng trông rất gấp.
   - Hoặc thêm `canter` (nước phi nhỏ) làm dáng thứ tư. Phải khoá móng `canter` (hiện trượt 44%) và đổi cảnh cùng hợp đồng; nặng hơn.
2. **Trần phi (lane 3, tuỳ chọn).** 20% thời gian vượt trần, chỉ ở các đoạn 62–70 m/s trên sân (khoảng 21–23 m/s ở cỡ thật, nhanh hơn ngựa thật do trận được nén thời gian). Có thể:
   - để vậy (móng trượt 8–22%);
   - hoặc cho ngựa `MAX_RATE` của `run` khoảng 1,8–1,9: vòng phi 0,23–0,24 s, nhanh nhưng còn coi được.
3. **`docs/ARCHITECTURE.md` (phiên chính), mục "Kỵ binh"**, dòng "Sải móng đo như cảnh (T-022)", đổi thành:
   - `walk` 1,08 m / 1,667 s; `jog` 1,82 m / 0,833 s; `run` (phi nước đại, T-030) 5,51 m / 0,433 s; ngựa Numidia ngắn hơn 5%.
   - Câu về móng trượt khi phi: "trần phi khoảng 57 m/s trên sân; kỵ binh Cannae vượt trần khoảng 20% thời gian di chuyển (Hasdrubal, Numidia, 62–70 m/s)".
4. **`art/README.md`, mục "Kỵ binh (T-022)" (lane 1).** Các số dưới đây là trước T-030; mục "Ngựa" đã ghi chú điều này.
   - Bảng clip: `run` thành 0,433 s (13 khung).
   - Bảng sải: `jog` trượt 1%; `run` 5,51 m / 0,433 s, 12,7 m/s, trượt 1%.
   - Bỏ đoạn "Sải phi chưa dài hơn".
   - Dòng ghi chú cho cảnh về `jog` và `run` gần nhau về tốc độ: nay `run` 12,7 m/s, `jog` 2,19 m/s.
5. **`walk` vẫn trượt 101%.** Nếu cần, làm một task riêng để dựng lại cách móng lăn khi đi bước. Ở tốc độ đi bước của cảnh, chỗ trượt này nhỏ và khó thấy.
6. **Không cần đổi `whp_*.py` hay `unit_*.py`.**
