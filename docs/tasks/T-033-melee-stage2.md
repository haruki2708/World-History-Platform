# T-033: Giáp lá cà, chặng 2 (clip đỡ đòn và trúng đòn cho bộ binh)

- **Ai làm:** phiên chính (đợt G, người dùng chọn 2026-11-18).
- **Model:** Fable 5.2, effort `xhigh` (người dùng đặt).
- **Nhánh:** `batch-g/stage2-clips` (tạo từ `main` sau khi gộp chặng 1).
- **Trạng thái:** xong 2026-11-18 (2a rồi 2b); chờ lane 3 đọc lại nhánh và người dùng duyệt gộp.
- **Phạm vi file:** `src/lib/battle.ts`, `src/components/battle/`, `src/app/battle-lab/`, `art/`, `public/battles/models/`, `docs/`.
- **Kế hoạch chung:** `docs/PLAN.md`, mục "Đợt G". Chặng 1: `T-032-melee-stage1.md`, review của lane 3: `T-032-review.md`.

File này vừa là đề bài vừa là nhật ký.

## Việc

Sau chặng 1, người bị đánh đứng yên cho tới lúc ngã. Chặng 2 cho họ phản ứng:

- **2a (đã làm):** hợp đồng; hai clip `block` (đỡ đòn) và `hit` (trúng đòn) cho cặp thử `roman-legionary` (đâm) và `gallic-infantry` (chém); cảnh phát hai clip đó; hai người trong một cặp đánh luân phiên; cặp đấu ổn định hơn (mục 3 của review chặng 1). Người dùng xem rồi mới làm tiếp.
- **2b (đã làm, sau khi người dùng xem và ưng cặp thử):** dựng lại bốn mô hình bộ binh đánh gần còn lại (`roman-hastatus`, `roman-triarii`, `libyan-infantry`, `iberian-infantry`) với hai clip mới; ảnh duyệt; ghi công nếu cần.
- Kỵ binh: chặng 3.

## Kết quả phần 2a

### Hợp đồng (`src/lib/battle.ts`)

- `UNIT_CLIPS` thêm `block`, `hit` ở cuối (chỉ số các clip cũ không đổi).
- `REACTION_IMPACT = 0,3` giây: trong `block` và `hit`, đòn của địch chạm ở giây thứ 0,3 của clip. Script dựng clip theo đúng số này (`REACT` trong `art/blender/whp_clips.py`: khung 9 trên 30).
- Mô hình thiếu hai clip thì nhận đòn mà không phản ứng, như sau chặng 1.

### Clip (`art/blender/whp_clips.py`)

- `block`, 1,0 giây: từ thế đứng như `idle`, khiên được nâng lên và đẩy ra trước mặt (thế `block` mới của `SHIELD_CARRY`), tới nơi 2 khung trước khi đòn chạm; lúc đòn chạm khiên bị dội về ngực và ngả vào người (`jolt`) trong 3 khung; rồi về thế thủ và thế nghỉ. Thân nhận 35% cú giật `Hit_Chest` của thư viện.
- `hit`, 1,0 giây: đứng như `idle` tới lúc đòn chạm; rồi cả cú giật `Hit_Chest`, tay khiên bị bật ra bên trái và xuống thấp (`open`); hồi lại trong 2/3 giây.
- Cả hai dựng sau `jog`, nên sáu clip cũ **giống hệt từng byte** (đã so từng clip giữa file cũ và file mới của hai mô hình).
- Hai cây *pilum* của hastatus cũng biến mất trong `block` và `hit` (`SPARE_GONE`), như trong `attack`.
- `whp_build.py`: mô hình bộ binh xuất và kiểm tra tám clip (`clips_of`); kỵ binh vẫn sáu.
- Dựng lại bằng Blender 5.2.2 không giao diện: `roman-legionary` 2,35 MB (trước 2,26), `gallic-infantry` 1,98 MB (trước 1,89); bước kiểm tra của `build_model.py` qua. Trước khi sửa script, dựng lại `roman-legionary` ra đúng file đã commit từng byte.
- Ảnh duyệt mới: `render_review.py -- --model A --duel B` vẽ hai mô hình đối mặt ở đúng khoảng cách cảnh đặt (1,28 m cho cặp này), 0,2 giây trước, đúng lúc và 0,17 giây sau khi đòn chạm; bốn hàng: A đánh B đỡ, A đánh B trúng, B đánh A đỡ, B đánh A trúng. File: `art/renders/duel-roman-legionary-gallic-infantry.jpg`.

### Cảnh (`src/components/battle/engine/`)

- `units.ts`: hình lính bị địch trong tầm đánh thì phát `block` hoặc `hit` một lần, bắt đầu 0,3 giây trước khi đòn chạm, theo nhịp bị đánh của chính nó; không phát khi đang dở nhát đánh của mình. Ba trên mười đòn lọt qua (`hit`), và đòn hạ gục luôn lọt qua; cố định theo từng hình và từng đòn, nên tua lại vẫn ra như cũ.
- `figures/material.ts`: thuộc tính `iStrike` giờ dùng cho cả ba clip `attack`, `block`, `hit`.
- `figures/model.ts`: `UnitModel.reaction` (độ dài hai clip, 0 nếu mô hình không có).
- `melee.ts`:
  - **Chọn đối thủ theo chỗ ở hàng đầu** (`UnitTrack.frontX/Y`), không theo chỗ đang đứng: người vừa thành đầu hàng, còn đang bước lên, đã là đối thủ của người mà người trước đấu. Hai người vẫn bước tới gặp nhau từ chỗ đang đứng.
  - **Đánh luân phiên:** hai người chọn nhau thì nhịp bị đánh lệch nhau nửa chu kỳ (1,2 giây). Người sắp ngã giữ nhịp riêng, là lúc ngã.
  - Thêm cho mỗi hình: `own` (nhịp bị đánh), `struck` (số địch trong tầm đang đánh mình).
- `/battle-lab?duel=1`: cặp đầu tiên giờ là cặp thử (`roman-principes`, dùng mô hình `roman-legionary`, với `gallic-infantry`).

### Số đo

Bằng `main-tools/melee/falls.mjs` (code của nhánh, 60 khung/giây cả trận):

| | Sau chặng 1 | Bây giờ |
|---|---|---|
| Trận thử: người ngã có đòn chạm đúng lúc | 610 trên 624 (98%) | 610 trên 624 (98%) |
| Trận thử: một người đổi đối thủ khi cả hai còn đứng | 11,6 giây một lần | 20,8 giây một lần |
| Cannae: người ngã có đòn chạm đúng lúc | 2 535 trên 2 834 (89%) | 2 472 trên 2 834 (87%) |
| Cannae: đổi đối thủ | 3,3 giây một lần | 3,4 giây một lần |

Cannae theo giai đoạn, đổi đối thủ: giai đoạn 3: 7,8 giây một lần; 4: 5,9; **5: 1,2**; 6: 7,5. Giai đoạn 5 là lúc mặt trận La Mã co từ 1260 m xuống 640 m trong khi đang đánh, nên hàng dọc hai bên trượt ngang qua nhau; phần này do dữ liệu, không sửa được trong cảnh (xem "Còn lại").

Trong trình duyệt (`/battle-lab?duel=1`, đang phát, sáu lần chụp cách nhau 0,4 giây): ở cặp thử, số hình đang phát `attack` / `block` / `hit` là 54 / 33 / 22 (lính La Mã) và 79 / 29 / 18 (lính Gaul); các cặp khác chỉ có `attack` vì mô hình chưa có clip mới. Console sạch.

### Đã kiểm tra

- `npm run lint`, `npm run validate`, `npx tsc --noEmit`: qua.
- `npm run build` (worktree tạm, commit `01def40`): qua. Hồi quy lõi của app (`main-tools/reg-core.js`) trên bản đó: 17/17, console sạch.
- Tốc độ khung hình, bản production, hai vòng xen kẽ với bản `main` trước đợt G (cổng 3000), không có Blender chạy: mở cảnh 116,6 và 115,8 so với 116,4 và 117,0; phát giai đoạn 5: 71,9 và 71,5 so với 72,6 và 72,4; phát giai đoạn 6: 72,9 và 73,7 so với 75,4 và 74,7 (thấp hơn 2–3%).
- Cannae trong trình duyệt, đang phát giai đoạn 4: `allied-infantry-front` (mô hình `roman-legionary`) và ba khối Gaul có đủ `attack`, `block`, `hit`; hastati và lính Iberia chỉ có `attack` (chờ 2b). Console sạch.

## Kết quả phần 2b

Người dùng xem cặp thử và chọn "Ưng, làm tiếp 2b" (2026-11-18).

- Dựng lại `roman-hastatus`, `roman-triarii`, `libyan-infantry`, `iberian-infantry` với `block` và `hit`. Mỗi mô hình: bước kiểm tra của `build_model.py` qua; sáu clip cũ giống hệt từng byte; lưới không đổi kích thước.
- Kích thước file (trần 4 MB): `roman-legionary` 2,35 MB, `roman-triarii` 2,36, `libyan-infantry` 2,36, `roman-hastatus` 2,04, `gallic-infantry` 1,98, `iberian-infantry` 1,88. Mỗi file nặng thêm khoảng 0,09 MB.
- **Hai mô hình đánh từ xa không có hai clip này** (`roman-velites`, `balearic-slinger`): `whp_clips.THROWN` liệt kê các kiểu tấn công từ xa, `Builder.build` và `whp_build.clips_of` bỏ qua `block`, `hit` cho các mô hình đó, nên dựng lại chúng vẫn ra đúng file cũ.
- `build_model.py -- --model all --check` (cả 11 mô hình): qua.
- Ảnh duyệt thêm: `art/renders/duel-roman-hastatus-iberian-infantry.jpg`, `art/renders/duel-roman-triarii-libyan-infantry.jpg`.
- Trong trình duyệt, đang phát, số hình phát `attack` / `block` / `hit` qua các lần chụp:
  - `/battle-lab?duel=1`: ba cặp bộ binh đều có đủ (ví dụ cặp hastatus với Iberia: 46 / 27 / 14 và 58 / 20 / 18); cặp kỵ binh chỉ có `attack`.
  - Cannae giai đoạn 4: hastati 159 / 83 / 43, bộ binh đồng minh hàng đầu 154 / 92 / 39, ba khối Gaul và hai khối Iberia đều có đủ.
  - Cannae giai đoạn 6: thêm principes 40 / 2 / 16, triarii 78 / 33 / 27, lính Libya 54 / 17 / 5; kỵ binh Hasdrubal chỉ có `attack`. Ở hai sườn, phần lớn đòn là `hit` vì đó là đòn hạ gục.
  - Console sạch.

### Kiểm tra cuối chặng 2 (commit `3fb8cba`)

- `npm run lint`, `npm run validate`, `npx tsc --noEmit`: qua. `npm run build` (worktree tạm): qua. Hồi quy lõi của app trên bản đó: 17/17, console sạch.
- Tốc độ khung hình, bản production, đo xen kẽ với bản `main` trước đợt G (cổng 3000), không có Blender chạy. Máy lúc đo dao động nhiều (lúc mở cảnh: 89 tới 114 khung/giây ở cả hai bản):

| Lúc | `main` trước đợt G | Nhánh (2b) |
|---|---|---|
| Phát giai đoạn 3 (bốn vòng) | 75,2 / 61,8 / 69,3 / 73,3 | 66,5 / 62,1 / 67,3 / 71,5 |
| Phát giai đoạn 4 (bốn vòng) | 69,9 / 66,5 / 59,4 / 72,1 | 59,4 / 63,8 / 66,0 / 69,3 |
| Phát giai đoạn 5 (hai vòng) | 61,5 / 55,1 | 57,8 / 56,4 |
| Phát giai đoạn 6 (hai vòng) | 62,4 / 58,5 | 63,5 / 63,0 |

  Trung bình giai đoạn 3 và 4 thấp hơn khoảng 4%; giai đoạn 5 và 6 ngang nhau. Mức chênh nằm trong độ dao động giữa các vòng, nên chưa kết luận được là chậm hơn.

### Còn lại, chưa ưng ý

- **Nhát chém của lính Gaul chạm khiên sớm hơn thời điểm cảnh coi là đòn chạm.** Cảnh lấy lúc vũ khí vươn xa nhất về trước (0,5 giây); với nhát bổ từ trên xuống, lưỡi kiếm đi qua mép trên khiên sớm hơn khoảng 2–3 khung, nên ở khung "đòn chạm" lưỡi kiếm đã xuống thấp bên cạnh khiên (hàng 3 của ảnh duyệt).
- **Giai đoạn 5 của Cannae đổi đối thủ 1,2 giây một lần.** Muốn giảm thì sửa dữ liệu: giữ bề ngang mặt trận La Mã trong lúc đang đánh, cho việc dồn vào giữa xảy ra giữa các giai đoạn hoặc ở hàng sau.
- Cannae: tỉ lệ người ngã có đòn chạm giảm từ 89% xuống 87% so với cuối chặng 1 (giai đoạn 6: 87% xuống 84%), do nhịp của một người đổi khi anh ta bước vào chu kỳ cuối trước lúc ngã.
- Giáo của triarii dài hơn kiếm của đối thủ: hai người đứng theo tầm của vũ khí ngắn hơn, nên lúc đòn chạm mũi giáo đi quá khiên của đối thủ (ảnh duyệt triarii với Libya).
- Kỵ binh chưa có `block`, `hit` (chặng 3).
