# T-032 review: đọc lại nhánh giáp lá cà, chặng 1

- **Ai làm:** lane 3, 2026-11-18.
- **Đọc:** nhánh `batch-g/stage1-melee` ở commit `09b42e0`, so với `main` ở `2f7fbd8`. Không sửa code của nhánh, không gộp.
- **Nhánh của file này:** `lane3/T-032-review` (tạo từ `batch-g/stage1-melee`, chỉ thêm file này).
- **Đọc trước:** `docs/tasks/T-032-melee-stage1.md`, `docs/ARCHITECTURE.md` mục "Giáp lá cà (đợt G)".
- **Trọng tâm:** `engine/timeline.ts`, `engine/melee.ts`, `engine/units.ts`, `engine/figures/model.ts`, `engine/figures/material.ts`.
- **Kịch bản đo, ảnh, số liệu thô:** `E:\World_History_Platform_assets\T-032-review\` (ngoài repo).

## Tóm tắt

Không thấy lỗi làm hỏng cảnh: không NaN, không ném lỗi, tua tới đâu cũng ra đúng một cảnh, khối hết người và quay đầu lúc đang đánh đều chạy đúng. Hai tuyến giờ chạm nhau thật, và người ngã gần như luôn là người đầu hàng (98,9%).

Còn ba chỗ nên sửa trước hoặc ngay sau khi gộp:

1. **Xác trượt về chỗ cũ.** Người ngã khi đang bước khỏi hàng để đấu bị kéo về ô của mình trong lúc phát clip ngã: trung vị 2 m, tối đa 4,8 m, trong khoảng 0,35 giây.
2. **Khoảng 30% người ngã trong giáp lá cà không có đòn nào chạm vào họ** (Cannae 862 trên 2 834; trận thử 141 trên 624). Tiêu chí "ngã đúng lúc đòn chạm" của T-032 mới đạt 70%.
3. **Cặp đấu đổi liên tục.** Ở Cannae, trung bình 3,4 giây một người lại đổi đối thủ trong khi cả hai còn đứng, nên hình lính hay quay người và xê dịch.

Tốc độ khung hình giai đoạn 6: nhánh thấp hơn `main` khoảng 5% (trung bình 3,6 fps, thấp hơn ở 14 trên 16 cặp cửa sổ đo); p99 không tệ hơn. Phần ghép cặp chỉ tốn khoảng 0,5 fps. Phần còn lại vẫn thấy cả khi dừng, nên nhiều khả năng nằm ở phần vẽ (bố cục mới có thêm 1,3% tam giác trong khung, cộng thuộc tính `iStrike`), không ở code ghép cặp; tôi chưa tách được hai phần này. Tiêu chí "không thấp hơn `main`" của T-032 chưa đạt, nhưng mức chênh nhỏ.

## Cách đọc lại

- Đọc diff năm file trọng tâm, cùng `BattleEngine.ts`, `stress.ts`, `duelBattle.ts` và quy tắc mới trong `validate-battles.mjs`.
- **Chạy code thật của nhánh bằng Node** (`timeline.ts` và `melee.ts` qua `register.mjs`), từng khung 1/60 giây suốt trận, ở hai trận: Cannae và trận thử `duel`.
  - Kiểm tra NaN và những lần hình lính nhảy chỗ giữa hai khung.
  - Đếm cặp đấu, đòn chạm, người ngã.
  - Mô phỏng lại cách `units.ts` canh nhịp đòn đánh (một nhát chỉ bắt đầu trong 0,3 giây đầu clip) và cách nó dời hình lính tới chỗ đấu (6 m/s).
  - Kịch bản: `tools/melee-check.mjs`. Số `reach`/`front` lấy đúng giá trị `model.ts` đo được trong trình duyệt.
- **Trường hợp biên** (`tools/edge-check.mjs`), là các biến thể của trận thử:
  - một khối bị diệt hết giữa giai đoạn `fight` và vẫn ghi `fight` ở các giai đoạn sau;
  - một khối quay đầu 180° lúc đang đánh;
  - cả hai bên ngã hết;
  - khối một hình, mặt trận 1 m, chiều sâu 0,5 m;
  - giai đoạn `fight` dài 0, 1, 3, 6 giây phát;
  - 40 lần tua ngẫu nhiên, so với cảnh dựng mới rồi lấy mẫu một lần.
- **Trong trình duyệt:** Chrome không cửa sổ, RTX 3050. Bản production cho Cannae; `next dev` cho `/battle-lab?duel=1`. Theo dõi từng người ngã qua các khung (`tools/s-slide.mjs`) và chụp cận các tuyến đang đánh (`tools/s-look.mjs`, `tools/s-duel.mjs`).

## Lỗi và chỗ nên sửa

Xếp theo mức ảnh hưởng.

### 1. Xác trượt về chỗ cũ (trông sai, nên sửa)

`units.ts:643`, `units.ts:652`.

- **Cách lỗi xảy ra:** hình lính `DYING` không còn đối thủ, nên chỗ nó muốn đứng là ô trong đội hình. Đoạn dời chỗ (`offX`, `offY`, 6 m/s) vì vậy kéo xác về ô đó trong khi clip `die` đang phát.
- **Đo trong trình duyệt** (40 người đầu tiên ngã khi đang lệch khỏi ô):
  - giai đoạn 4: lệch trung vị 2,13 m, tối đa 4,82 m; về tới ô sau trung vị 0,36 giây, tối đa 0,82 giây;
  - giai đoạn 6: trung vị 2,0 m, tối đa 4,49 m.
- **Đo bằng Node trên cả trận Cannae:** trung vị 1,8 m, p90 3,9 m, tối đa 5 m (đúng `MAX_STEP`).
- **Hệ quả thêm:** tua tới sau lúc ngã thì xác nằm ở ô, còn khi phát thì xác ngã ở chỗ đấu rồi trượt về.
- **Đề nghị:** với hình `DYING`, giữ nguyên `offX`/`offY` (bỏ bước dời). Khi tua thì xác vẫn đặt ở ô, lệch vài mét so với lúc phát, nhưng không còn trượt.
  - Muốn cả hai khớp nhau thì phải biết chỗ đấu lúc ngã một cách tất định, ví dụ chạy `Melee` ở đúng thời điểm ngã khi dựng track. Cách này tốn hơn, nên để chặng 2.

### 2. Người ngã không có ai đánh (sai so với tiêu chí của T-032)

Đếm tại khung ngay trước lúc ngã, trên cả trận Cannae:

| Giai đoạn | Ngã trong `fight` | Có đòn chạm đúng lúc ngã | Không ai ghép cặp với người ngã | Người đánh đang dở nhát khác | Ngoài tầm | Không phải người đầu hàng |
|---|---|---|---|---|---|---|
| 3 (kỵ binh) | 79 | 71 (90%) | 8 | 0 | 0 | 0 |
| 4 | 324 | 243 (75%) | 77 | 3 | 1 | 0 |
| 5 | 336 | 191 (57%) | 127 | 16 | 2 | 0 |
| 6 | 2 095 | 1 467 (70%) | 313 | 259 | 25 | 31 |
| Cả trận | 2 834 | 1 972 (70%) | 525 | 278 | 28 | 31 |

Trận thử `duel`: 483 trên 624 (77%).

Nặng nhất:

- giai đoạn 5: hastati 54 người và allied-infantry-front 62 người ngã mà không ai ghép cặp;
- giai đoạn 6: allied-infantry-rear (141 không ai ghép cặp, 107 người đánh đang dở nhát khác) và principes (93 và 85).

Có hai nguyên nhân:

- **Hai mô hình khác nhau quyết định ai ngã và ai đánh.**
  - Người ngã được chọn lúc dựng track, theo đội hình (`opposition`, `timeline.ts:170-206`): đầu hàng dọc chỉ cần cách mép trước của một khối địch không quá 14 m, kể cả khi đứng ngoài sườn khối đó tới 14 m.
  - Người đánh do `melee.ts` chọn theo từng hình: chọn người gần nhất trong nón 70° của cả hai bên (`melee.ts:26`); mỗi người bị đánh có tối đa một người đánh kèm mỗi bên (`melee.ts:255`); ai thừa thì đứng không.
  - Vì vậy, người được chọn để ngã có thể không bị ai nhắm tới.
  - Ngoài ra, quy tắc "ba lần rút, chọn hàng dọc lâu nhất chưa mất người" (`timeline.ts:464`) ưu tiên hàng dọc chưa mất ai, kể cả hàng không có địch trước mặt. Theo cách đọc code, hàng không có địch được chọn khoảng ba lần nhiều hơn mức `UNOPPOSED` (2%) định ra. Tôi chưa đo riêng điểm này.
- **Nhát đánh không kịp bắt đầu.** Ở giai đoạn 6, mỗi hàng dọc mất một người sau khoảng 1–2 giây (T-032 đã ghi). Trong 278 người ngã thuộc loại này:
  - người ngã mới làm đầu hàng trung vị 1,08 giây;
  - người đánh mới nhắm vào họ trung vị 0,35 giây trước lúc ngã;
  - 270 trên 278 lần, người đánh còn đang dở nhát với người trước.

  Vì một nhát mới chỉ bắt đầu trong 0,3 giây đầu của clip (`units.ts:798`), đòn kết liễu bị bỏ qua.

Đề nghị (chọn một hay kết hợp):

- **Trong `melee.ts`:** ưu tiên người sắp ngã. Một đầu hàng sẽ ngã trong một `STRIKE_PERIOD` tới mà chưa ai nhắm tới thì giao cho đầu hàng địch gần nhất trong tầm, người có anh ta trong nón 70° của mình, kể cả khi người đó đang đánh kèm người khác. Kết quả vẫn chỉ phụ thuộc thời gian trận, vì `deathTime` có sẵn.
- **Trong `units.ts`:** nếu nhịp của đối thủ là lúc anh ta ngã thì cho nhát đánh bắt đầu muộn (tới trước `impact`), dù phải bỏ dở nhát cũ. Nhát nhảy vào giữa clip sẽ được lớp mờ dần `STRIKE_IN` che bớt.
- **Trong `timeline.ts`:** cho `opposition` dùng cùng tầm và nón với `melee.ts`, và bỏ phần 14 m ngoài sườn khối địch.

### 3. Cặp đấu đổi liên tục (trông sai, nên sửa ở chặng 2)

- **Số đo trên cả trận**, tính những lần cả hai người cùng còn đứng:
  - Cannae: trong 25 105 giây-hình đang có đối thủ, một người đổi đối thủ 6 107 lần và mất đối thủ 1 296 lần, tức trung bình 3,4 giây một lần;
  - trận thử `duel`: trung bình 12,2 giây một lần.
- **Hệ quả:** mỗi lần đổi, hình lính quay tối đa 80° (3 rad/s) và xê dịch tối đa 5 m (6 m/s).
- **Nguyên nhân:** `melee.ts` chọn lại người gần nhất ở mỗi khung, không có độ trễ (cố ý, để kết quả chỉ phụ thuộc thời gian). Đổi cặp xảy ra mỗi khi người phía sau bước lên làm khoảng cách thay đổi chút ít.
- **Đề nghị:** một cách giữ cặp mà vẫn tất định. Ví dụ, trong một giai đoạn, ưu tiên cặp theo chỉ số hàng dọc (hàng dọc thứ i của khối này đấu hàng dọc gần nhất của khối kia, chọn một lần ở đầu giai đoạn), và chỉ đổi khi người kia ra khỏi tầm hay khỏi nón.

### 4. Giai đoạn `fight` ngắn thì người nhảy chỗ ở mốc cuối (thấp, tiềm ẩn)

`timeline.ts:414`.

- **Cách lỗi xảy ra:** `span` không xuống dưới 0,75. Với giai đoạn ngắn hơn khoảng 7,6 giây phát, người ngã cuối cùng ngã ở 75% giai đoạn, còn ít hơn 1,9 giây để người sau bước lên. Ở mốc cuối, hàng được xếp lại như thể đã bước lên xong, nên người nhảy chỗ.
- **Đo trên trận thử, sửa giai đoạn 2:**

| Độ dài giai đoạn | Số lần nhảy quá 0,6 m | Nhảy lớn nhất |
|---|---|---|
| 6 giây | 29 | 2,1 m |
| 3 giây | 318 | 10 m |
| 1 giây | 659 | 22 m |

- **Phạm vi:** dữ liệu hiện tại không có giai đoạn như vậy (Cannae 20–30 giây, trận thử 20–25 giây).
- **Đề nghị:** bỏ trần 0,25 (`span = max(1 − 1,9 / seconds, 0)`), hoặc để `validate` đòi giai đoạn `fight` dài ít nhất 8 giây phát.

### 5. Nhịp đánh cũ còn lại sau `skirmish` (thấp, tiềm ẩn)

`units.ts:786`.

- **Cách lỗi xảy ra:** `swing[i]` chỉ được cập nhật khi khối không ném. Một khối đi `fight` → `skirmish` → `fight` sẽ quay lại với nhịp cũ, có thể bắt đầu giữa một nhát.
- **Phạm vi:** Cannae không có chuỗi hành động này.
- **Đề nghị:** đặt `swing[i] = -1` khi khối đang ném.

### 6. Quy tắc kiểm tra dữ liệu còn lỏng (thấp)

- **Cách lỗi xảy ra:** `validate-battles.mjs:242-243` cho qua khi 15% mặt trận cách mép địch không quá 8 m. Còn cảnh cần đầu hàng nằm trong tầm khoảng 14 m và trong nón 70°. Kết quả: ở đầu giai đoạn 5, 31 trên 82 đầu hàng hastati không có đối thủ, mà dữ liệu vẫn qua kiểm tra.
- **Đề nghị:** in cảnh báo (không phải lỗi) khi dưới khoảng một nửa mặt trận chạm địch.

### 7. Quan sát khác

- **Lính Libya đứng trên xác người La Mã.** Ở giai đoạn 6, lính Libya vừa đánh vừa tiến vào chỗ người La Mã đã ngã, nên đứng lẫn trên các xác (`shots/branch-p6-libyans-behind.png`). Nguyên nhân là đội hình dịch 158 m lệch hướng mặt, như T-032 đã ghi. Không phải lỗi code.
- **Dựng mọi `UnitTrack` của Cannae mất 41 ms**, so với 6 ms ở `main` (Node, trung vị bảy lần), chủ yếu do phần chọn người ngã. Chỉ chạy một lần lúc mở cảnh, không đáng kể.
- **Cách `model.ts` đo đòn đánh** (đo trên LOD2, theo đúng cách shader đọc xương) ra số khớp tài liệu. Số đo trong trình duyệt:
  - đâm kiếm: tầm 1,07 m, chạm ở 0,30 giây;
  - Gaul: tầm 0,98 m, chạm ở 0,50 giây;
  - giáo triarii: 1,93 m;
  - kỵ binh: 2,01 m và 1,92 m, đầu ngựa nhô 1,47 m;
  - phần thân bộ binh nhô 0,33 m.
- **Kỵ binh đấu nhau đứng cách 8,8 m (cỡ vẽ).** Ở khoảng cách này mũi giáo chỉ tới đầu ngựa địch, cách người cưỡi khoảng 2,8 m. Đây là hệ quả của `front` tính cả đầu ngựa, chấp nhận được.
- **Shader:** bóng đổ cũng nhận `iStrike`, vì `instanced()` gắn thuộc tính cho cả lưới vẽ bóng, nên bóng khớp với nhát đánh.

## Những gì đã kiểm tra và đúng

- **NaN và nhảy chỗ:** không có NaN hay Infinity ở vị trí, hướng của người đứng và ở kết quả của `Melee` (Cannae và trận thử, 60 khung/giây suốt trận). Không hình nào nhảy quá 0,6 m giữa hai khung, sau khi trừ chuyển động của cả khối; kể cả ở các mốc của giai đoạn `fight` và lúc người sau bước lên.
- **Tua:** 40 lần tua ngẫu nhiên (sau khi lấy mẫu ở một thời điểm khác) cho đúng vị trí, trạng thái, đầu hàng, chỗ đấu, nhịp và đối thủ như cảnh dựng mới. Đúng ở cả sáu biến thể của trận thử.
- **Trường hợp biên:** khối bị diệt hết mà vẫn ghi `fight`, quay đầu lúc đang đánh, cả hai bên ngã hết, khối một hình, mặt trận 1 m, chiều sâu 0,5 m: không lỗi, không NaN, không nhảy chỗ.
- **Chia cho 0:** đã đọc từng chỗ.
  - `melee.ts`: khoảng cách tối thiểu 0,001; bước của người đánh kèm chỉ chia khi lớn hơn `MAX_STEP`; ô lưới luôn dương.
  - `timeline.ts`: `frontage` và `depth` tối thiểu 1 qua `toKey`; có điều kiện `lost > 0`; `seconds` tối thiểu 0,001.
  - `units.ts`: chỉ chia khi `d > closeStep`; `stepFull > stepFrom`.
  - `model.ts`: số đo không hữu hạn thì dùng giá trị dự phòng.
- **Người ngã:** 2 803 trên 2 834 người ngã trong `fight` là người đầu hàng (98,9%). Theo code, những người không phải đầu hàng là người ngã trong 0,4 giây chờ, trước khi bắt đầu bước lên.
- **Đòn đánh:** 10 863 nhát chạm trong cả trận Cannae.
  - 7 454 nhát vào người địch còn đứng, trong tầm.
  - 2 685 nhát vào người ngã ngay lúc đó: đúng thiết kế, nhát cuối trùng lúc ngã.
  - 724 nhát (6,7%) chạm khi đối thủ còn ngoài 1,3 lần khoảng cách đấu, vì hai người còn đang tiến lại.
  - Không nhát nào vào người đã nằm.
- **Nhìn trong trình duyệt:**
  - Cannae giai đoạn 3–6: hai tuyến chạm nhau; ở `main`, giai đoạn 4 hai tuyến còn cách nhau vài chục mét (`shots/main-p4-hastati-behind.png`, `shots/branch-p4-*.png`).
  - `/battle-lab?duel=1`: các cặp đứng sát nhau, đúng kiểu đòn (đâm kiếm, chém, giáo dài); cặp thứ năm ném từ xa (`shots/duel-*.png`).
- **Lệnh và console:** `npm run lint`, `npm run validate` qua trên nhánh. `next build` của `09b42e0` qua (bản dùng để đo). Console sạch ở Cannae và `/battle-lab?duel=1`.

## Tốc độ khung hình giai đoạn 6

**Điều kiện:**

- Bản production của `main` (`2f7fbd8`, dựng trong worktree tạm) và của nhánh (`09b42e0`), cổng 3132 và 3133.
- Chrome không cửa sổ trên RTX 3050, bỏ trần khung hình, đọc một pixel mỗi khung, 1280×800, khung bên mở.
- Bốn vòng xen kẽ `main`, nhánh, 03:03–03:11. Cả 32 cửa sổ đều sạch (không có Blender hay Godot trước và sau mỗi cửa sổ).
- Mỗi cửa sổ: phát 1,5 giây rồi đo 6 giây. Không cửa sổ nào chạy tới hết trận.

| Cửa sổ | `main` (4 vòng) | Nhánh (4 vòng) | Chênh trung bình |
|---|---|---|---|
| Phát 1× từ đầu giai đoạn 6, góc nhìn mở | 66,4 / 66,3 / 75,4 / 75,3 (TB 70,9) | 65,9 / 63,2 / 68,5 / 73,0 (TB 67,7) | −3,2 fps (−4,5%) |
| Phát 1× giữa giai đoạn 6, góc nhìn mở | 67,8 / 68,4 / 76,7 / 75,6 (TB 72,1) | 67,5 / 65,6 / 71,0 / 74,4 (TB 69,6) | −2,5 fps (−3,5%) |
| Phát 1×, cận vòng vây (260 m) | 72,4 / 70,2 / 76,8 / 72,2 (TB 72,9) | 62,8 / 65,8 / 70,3 / 74,9 (TB 68,5) | −4,5 fps (−6,1%) |
| Phát 2×, nhìn rộng | 75,0 / 65,5 / 77,4 / 77,0 (TB 73,7) | 63,5 / 66,5 / 73,9 / 74,4 (TB 69,6) | −4,2 fps (−5,6%) |

- **Tổng quát:** nhánh thấp hơn ở 14 trên 16 cặp.
- **p99 theo đồng hồ thật:** 16,2–25,0 ms ở `main`, 16,2–24,8 ms ở nhánh. Không khác.
- **Máy trôi nhiều:** vòng 3–4 nhanh hơn vòng 1–2 khoảng 10% ở cả hai bản, nên chỉ nên so trong từng vòng.
- **`Crowd.update` mỗi khung:** 1,8–2,1 ms ở `main`, 2,1–2,4 ms ở nhánh (+0,2–0,35 ms). Trong đó `Melee.update` chiếm 0,21–0,30 ms.

Tách nguyên nhân:

- **Bật/tắt ghép cặp trong cùng một lượt** (nhánh, giai đoạn 6, 1×, năm vòng xen kẽ). Tắt nghĩa là bỏ `Crowd.melee` và `UnitBlock.fight`: không ai bước tới, không ai đánh, track giữ nguyên. Kết quả: bật 73,7 fps, tắt 74,2 fps. Ghép cặp và phần vẽ đi kèm chỉ tốn khoảng 0,5 fps (0,16 ms trong `Crowd.update`).
- **Dừng ở 5,5, góc nhìn mở**, không có việc nào của đám đông mỗi khung (ba vòng xen kẽ):
  - góc nhìn mở: `main` 112,5 fps, nhánh 107,9 fps (+0,38 ms mỗi khung);
  - cận 260 m: 110,2 và 109,5 fps;
  - tắt tên khối quân vẫn chênh như vậy, nên không do nhãn.
  - Ở góc nhìn mở, nhánh có 4,18 triệu tam giác trong khung, so với 4,12 triệu ở `main` (+1,3%).

  Như vậy phần chênh còn lại nằm ở phần vẽ cảnh theo bố cục mới, cộng thêm thuộc tính `iStrike` của shader. Tôi chưa tách được hai phần này.

So với bảng trong T-032 (giai đoạn 6 thấp hơn 7–18%, hai vòng), bốn vòng ở đây cho mức chênh nhỏ hơn: 3,5–6%.

## Đề nghị

Cho phiên chính, theo thứ tự nên làm:

1. Giữ chỗ của xác (mục 1): vài dòng trong `units.ts`, nên sửa trước khi gộp.
2. Để người sắp ngã có người đánh, và cho đòn kết liễu bắt đầu muộn (mục 2): có thể làm trước khi gộp, hoặc làm đầu chặng 2 cùng `block`/`hit`.
3. Giữ cặp đấu ổn định một cách tất định (mục 3): chặng 2.
4. Bỏ trần 0,25 của `span`, hoặc thêm quy tắc độ dài tối thiểu cho giai đoạn `fight` (mục 4); đặt lại `swing` khi ném (mục 5); thêm cảnh báo mức chạm trong `validate` (mục 6).
5. Hiệu năng: chưa cần làm gì. Nếu muốn lấy lại khoảng 5%:
   - đo GPU riêng phần `iStrike` (một lượt dựng thử bỏ thuộc tính này);
   - xem các khối của bố cục mới ở góc nhìn mở có bị đẩy lên mức chi tiết cao hơn không.
