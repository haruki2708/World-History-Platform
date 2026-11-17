# T-033 review: đọc lại nhánh giáp lá cà, chặng 2 (đỡ đòn, trúng đòn)

- **Ai làm:** lane 3, 2026-11-18.
- **Đọc:** nhánh `batch-g/stage2-clips` ở commit `6cb27d8`, so với `main` ở `609b469` (đã gộp chặng 1). Không sửa code của nhánh, không gộp.
- **Nhánh của file này:** `lane3/T-033-review` (tạo từ `batch-g/stage2-clips`, chỉ thêm file này).
- **Đọc trước:** `docs/tasks/T-033-melee-stage2.md`, `docs/ARCHITECTURE.md` mục "Giáp lá cà (đợt G)".
- **Trọng tâm:** `engine/melee.ts`, `engine/units.ts`, `engine/timeline.ts` (`frontX`/`frontY`), `engine/figures/model.ts`, `engine/figures/material.ts`; `art/blender/whp_clips.py` (`REACT`, `Builder.block`, `Builder.hit`), `whp_build.py` (`clips_of`), `render_review.py` (`--duel`).
- **Kịch bản đo, ảnh, số liệu thô:** `E:\World_History_Platform_assets\T-033-review\` (ngoài repo).

## Tóm tắt

Không thấy lỗi làm hỏng cảnh: không NaN, không ném lỗi, console sạch, tua không tệ hơn `main`, mô hình thiếu hai clip và khối bị diệt hết vẫn chạy đúng. **Sáu clip cũ của sáu mô hình bộ binh giống hệt `main` từng byte**, cả lưới, khung xương, ảnh và vật liệu. **Tốc độ khung hình giai đoạn 3–6 ngang `main`**: trung bình +0,8% qua sáu lượt xen kẽ, nhánh thấp hơn ở 10 trên 24 cặp cửa sổ; `Crowd.update` tốn thêm 0,14 ms mỗi khung.

Ba chỗ nên sửa:

1. **Ghép theo chỗ ở hàng đầu sinh nhiều cặp không đánh tới nhau.** Ở giai đoạn 3, 5, 6 của Cannae, 14–25% người đầu hàng có đối thủ mà ngoài tầm (`main`: 4–7%). Đây là lý do thật của việc tỉ lệ người ngã có đòn chạm giảm từ 89% xuống 87%, không phải việc đánh luân phiên. Thêm một điều kiện (bốn dòng) thì tỉ lệ lên 90%, và số người đang đánh nhiều hơn cả `main` ở mọi giai đoạn.
2. **16% lần đỡ hay trúng đòn ở Cannae hiện ra giữa chừng hoặc bị cắt ngang** (giật hình), vì phản ứng vẫn chạy ngầm trong lúc người đó đang đánh. Hai quy tắc nhỏ trong `units.ts` giảm số lần giật từ 1 490 xuống 217.
3. **7% lần đỡ đòn không có đòn nào chạm**, chủ yếu vì người đánh còn dở nhát cũ. Sửa triệt để cần cho phản ứng đi theo nhát đánh thật; không gấp.

Nhỏ: `art/CREDITS.md` chưa ghi `Hit_Chest`.

## Cách đọc lại

- Đọc diff của nhánh (24 file), nhất là năm file engine và ba script Blender ở trên.
- **So file mô hình với `main`** (`tools/glbdiff.mjs`): tách từng file `.glb`, so từng kênh của từng clip (nút đích, loại nội suy, byte của thời điểm và giá trị), cùng lưới, khung xương, ảnh, vật liệu.
- **Chạy code thật của nhánh bằng Node** (`timeline.ts`, `melee.ts` qua `register.mjs`), 60 khung/giây suốt trận, ở Cannae và trận thử `duel`:
  - `tools/react-check.mjs` chép lại đúng phần `UnitBlock.update` chọn clip đè lên (nhát đánh của mình, `block`, `hit`, độ đậm khi hiện và tắt), rồi đếm: đòn chạm có ai đỡ không, lần đỡ nào không có đòn chạm, lần nào clip đè lên đổi đột ngột, và cảnh sau khi tua khác cảnh lúc phát ra sao. Chạy được trên cả `main` (khi đó không ai phản ứng).
  - `main-tools/melee/falls.mjs` của phiên chính (người ngã có đòn chạm, đổi đối thủ), chạy lại trên nhánh, trên `main` và trên các biến thể thử.
  - `tools/sanity.mjs`, `tools/frontoff.mjs`, `tools/idlepairs.mjs`: giá trị của `own`, `beat`, `struck`, `frontX/Y`; chỗ ở hàng đầu lệch bao xa so với chỗ đang đứng; tỉ lệ người đầu hàng đang đánh, có đối thủ mà ngoài tầm, không có đối thủ.
  - Các biến thể thử nằm trong `variants/` (bản `melee.ts` sửa một chỗ) và trong `react-check.mjs` (biến môi trường `VARIANT`).
- **Trong trình duyệt:** Chrome không cửa sổ, RTX 3050. Bản production của `main` và của nhánh để đo tốc độ khung hình; dev server của phiên chính (cổng 3105, đang ở `6cb27d8`, không có thay đổi chưa commit) cho `/battle-lab?duel=1` và ảnh Cannae.

## Lỗi và chỗ nên sửa

Xếp theo mức ảnh hưởng.

### 1. Ghép cặp theo chỗ ở hàng đầu sinh nhiều cặp không đánh tới nhau (nên sửa)

`melee.ts:271–304` (chọn đối thủ theo `nx/ny`), `melee.ts:335` (gặp nhau từ chỗ đang đứng), `timeline.ts:791–796`.

- **Chỗ ở hàng đầu thường xa chỗ đang đứng.** Ở Cannae, người đầu hàng đứng cách chỗ của mình ở hàng đầu hơn 3 m trong 19% số khung (trận thử: 15%), xa nhất 91 m (kỵ binh La Mã, giai đoạn 3), 70 m (bộ binh đồng minh hàng sau, giai đoạn 6). Hai nguyên nhân, góp gần bằng nhau:
  - người mới thành đầu hàng còn đang bước lên (mỗi người ngã phía trước tính dần trong 1,5 giây, nhiều người ngã liền nhau thì tụt lại vài hàng);
  - phần trôi về lưới của mốc sau (`drift`): người đầu hàng có thể được xếp vào hàng thứ hai, thứ ba của lưới mới, nên trôi lùi dần trong giai đoạn, trong khi `frontV` vẫn ở hàng đầu.
- **Hệ quả:** hai người chọn nhau theo chỗ ở hàng đầu, nhưng bước tới nhau từ chỗ đang đứng, mỗi người tối đa 5 m. Cách nhau quá xa thì vẫn thành cặp (quay mặt, bước ra khỏi hàng) mà không ai đánh tới ai, và cả hai không được ghép với một địch khác đánh tới được. Tỉ lệ người đầu hàng (Cannae, 30 khung/giây):

| Giai đoạn | Đang đánh: `main` / nhánh / sửa | Có đối thủ mà ngoài tầm: `main` / nhánh / sửa | Không có đối thủ: `main` / nhánh / sửa |
|---|---|---|---|
| 3 | 75,8% / 70,5% / 77,9% | 3,9% / **24,6%** / 4,4% | 20,3% / 4,9% / 17,6% |
| 4 | 86,2% / 88,9% / 91,5% | 5,6% / 9,4% / 4,7% | 8,2% / 1,7% / 3,8% |
| 5 | 64,3% / 62,7% / 70,4% | 6,0% / **23,6%** / 5,4% | 29,7% / 13,7% / 24,2% |
| 6 | 72,8% / 76,0% / 80,0% | 6,7% / **13,8%** / 4,8% | 20,4% / 10,2% / 15,1% |

- **Đây mới là lý do tỉ lệ người ngã có đòn chạm giảm từ 89% xuống 87%**, không phải việc đánh luân phiên như mục "Còn lại" của T-033 viết. Thử trên Cannae (`falls.mjs`):
  - nhánh bỏ luân phiên, giữ `frontX`: 2 472 trên 2 834, y như nhánh;
  - nhánh bỏ luân phiên, chọn theo chỗ đang đứng: 2 535, đúng bằng `main`;
  - nhánh, nhưng trong mỗi cặp người ngã trước giữ nhịp của mình suốt (không đổi nhịp lúc vào chu kỳ cuối): 2 470.

  Phần giảm nằm ở giai đoạn 6: "không ai chọn người ngã" từ 191 lên 233.
- **Cặp đổi ít hơn ở đâu:** ở trận thử, đổi đối thủ 20,8 giây một lần (`main` 11,6). Ở Cannae cả trận gần như không đổi (3,4 so với 3,3 giây); giai đoạn 6 ổn hơn nhiều (7,5 so với 3,5), giai đoạn 4 và 5 kém đi một chút (5,9 và 1,2 so với 6,5 và 1,5). Câu "cặp chỉ đổi khi hai hàng dọc trượt ngang qua nhau" trong `ARCHITECTURE.md` vì vậy chỉ đúng một phần.
- **Đề nghị (cột "sửa" ở bảng trên):** giữ cách chọn theo chỗ ở hàng đầu, nhưng bỏ ứng viên mà hai người không gặp được từ chỗ đang đứng. Thêm vào vòng chọn, sau dòng kiểm tra `reach`:

  ```ts
  const sx = px[b] - px[a];
  const sy = py[b] - py[a];
  const meet = this.strikingDistance(unit, other) * REACH_SLACK + 2 * MAX_STEP;
  if (sx * sx + sy * sy > meet * meet) continue;
  ```

  Kết quả (`variants/melee-M3-meet-from-where-they-stand.ts`):
  - người ngã có đòn chạm: Cannae 2 557 trên 2 834 (90%, hơn cả `main`), trận thử 615 trên 624 (99%);
  - người đầu hàng đang đánh nhiều hơn cả `main` lẫn nhánh ở cả bốn giai đoạn; cặp ngoài tầm về mức của `main`;
  - đổi đối thủ: Cannae 3,1 giây một lần (giai đoạn 6: 4,0, vẫn ổn hơn `main`), trận thử 15,8 giây. Tức là trả lại một phần độ ổn định của cặp để lấy thêm người đánh.

### 2. Clip đỡ đòn hiện ra giữa chừng hoặc bị cắt ngang (trông giật, nên sửa)

`units.ts:837–856`.

- **Cách xảy ra:**
  - Phản ứng được bắt đầu (`react[i]`) cả khi hình lính đang dở nhát đánh của mình, chỉ bị nhát đánh che đi. Nhát đánh hết thì phản ứng hiện ra ngay ở giữa clip, độ đậm 1 (vì `reactFrom` đã ở xa trong quá khứ): tư thế nhảy từ thế đứng sang khiên đang giơ trong một khung.
  - Ngược lại, đang phát `block`/`hit` mà nhát đánh của mình bắt đầu thì phản ứng mất ngay, còn nhát đánh mới hiện dần từ 0: tư thế cũng nhảy.
  - Tài liệu ghi "trừ khi nó đang dở nhát đánh của mình", nhưng code vẫn bắt đầu phản ứng trong lúc đó.
- **Đo trên cả trận** (`react-check.mjs`, 60 khung/giây):

| | Cannae | Trận thử |
|---|---|---|
| Lần `block`/`hit` hiện ra | 9 196 (4 808 `block`, 4 388 `hit`) | 2 764 |
| Hiện giữa chừng sau nhát đánh của mình | 986 | 184 |
| Bị nhát đánh của mình cắt ngang | 504 | 81 |
| Tổng số lần giật | **1 490 (16%)** | 265 (10%) |

- **Vì sao hai việc chồng nhau dù đã luân phiên:** trong 923 lần đòn chạm lúc người bị đánh đang dở nhát đánh của mình (Cannae), 629 lần người đó đang ở trong một cặp luân phiên đúng, nhưng nhát đánh đang dở là nhát cũ, canh theo đối thủ trước hoặc theo nhịp trước khi đổi; 346 lần trong số đó là lúc đối thủ sắp ngã (quy tắc "quay sang người sắp ngã" đổi đối thủ). Luân phiên chạy đúng khi cặp đứng yên; chồng nhau xảy ra ở lúc đổi đối thủ hay đổi nhịp. Hai thử khác không giúp gì: cho người ngã trước giữ nhịp suốt (1 561 lần giật), và cho cả người đánh kèm cũng luân phiên theo người mình đánh (1 534).
- **Đề nghị:** hai quy tắc nhỏ trong `units.ts`, bỏ qua khi `snap`:
  1. Không bắt đầu phản ứng khi đang dở nhát đánh của mình, hay khi nhát đánh kế tiếp sẽ bắt đầu trước lúc phản ứng kết thúc (đúng như tài liệu đã ghi).
  2. Không bắt đầu nhát đánh thường (không phải nhát hạ gục) khi phản ứng còn hơn 0,1 giây.

  ```ts
  // before the swingBeat of his own blow
  let wanted = engaged ? figures.beat[i] : -1;
  if (!snap && wanted >= 0 && swing[i] < 0 && figures.kill[i] !== 1 && react[i] >= 0 &&
      reactSeconds - swingInto(react[i], clock, REACTION_IMPACT) > 0.1) wanted = -1;
  // before the swingBeat of the blow he takes
  let incoming = struck ? figures.own[i] : -1;
  if (!snap && incoming >= 0 && react[i] < 0) {
    if (beat >= 0) incoming = -1;
    else if (engaged && figures.beat[i] >= 0) {
      const next = (STRIKE_PERIOD - swingInto(figures.beat[i], clock, strikeImpact)) % STRIKE_PERIOD;
      if (next < reactSeconds - swingInto(incoming, clock, REACTION_IMPACT) - 0.05) incoming = -1;
    }
  }
  ```

  Kết quả mô phỏng: số lần giật ở Cannae từ 1 490 xuống 217, trận thử từ 265 xuống 23. Phần còn lại là nhát hạ gục cắt ngang phản ứng (nhát này được phép bắt đầu muộn). Cái giá: số lần `block`/`hit` hiện ra giảm 9% (chính là những lần trước đây hiện giữa chừng), số đòn đánh ra giảm 1,6%; người ngã có đòn chạm không đổi (nhát hạ gục không bị giữ lại).

### 3. Đỡ đòn mà không có đòn nào chạm (trông sai nhẹ)

- **Đo:** lúc đòn "chạm" trong clip phản ứng (khung 9), không có nhát đánh nào của địch chạm vào hình lính đó:
  - Cannae: 617 trên 8 420 lần (7,3%; 405 `block`, 212 `hit`);
  - trận thử: 137 trên 2 649 lần (5,2%).
- **Nguyên nhân** (Cannae): 463 lần người đánh đang dở một nhát canh theo nhịp khác (đối thủ cũ, hay nhịp trước khi đổi); 83 lần nhát của người đánh không bắt đầu kịp (nhát chém của lính Gaul phải bắt đầu từ 0,5 tới 0,2 giây trước lúc chạm, còn phản ứng bắt đầu từ 0,3 tới 0 giây trước); 60 lần không còn ai đánh vào người đó; 11 lần nhịp đã đổi.
- **Chiều ngược lại ổn:** đòn chạm vào mô hình có hai clip mà không có phản ứng nào chỉ 1,4% (140 trên 10 331); 10,4% đòn chạm lúc người bị đánh đang dở nhát của mình, đúng như thiết kế.
- **Đề nghị (không gấp):** cho phản ứng đi theo nhát đánh thật thay vì theo nhịp `own`. Ví dụ `Crowd` giữ một mảng "đòn sắp tới" theo mã hình lính (như `opponent`); hình lính nào bắt đầu một nhát thì ghi nhịp của nhát đó vào ô của đối thủ, đối thủ phản ứng theo ô này, chậm nhất một khung. Cách này bỏ được cả lần đỡ hụt lẫn đòn chạm mà nhịp đã đổi.

### 4. Việc nhỏ

- **Ghi công thiếu `Hit_Chest`.** `art/CREDITS.md` dòng 10 liệt kê các clip của thư viện UAL đã dùng nhưng chưa có `Hit_Chest` (dùng cho `block` và `hit`). Giấy phép CC0 nên không bắt buộc, nhưng danh sách nên đủ. Dòng "Đã thay đổi" ngay dưới cũng nên thêm một câu về hai clip mới.
- **Người đánh kèm chọn bên theo chỗ ở hàng đầu, nhưng tính góc đứng theo chỗ đang đứng** (`melee.ts:356–379`). Khi hai chỗ lệch nhau, người được xếp "bên trái" có thể thật ra đứng bên phải, và hai người đánh kèm đứng cùng một bên. Tôi chỉ đọc code, chưa đo.
- **Ngọn giáo của triarii đâm xuyên qua lính Libya cả khi lính Libya đỡ** (`art/renders/duel-roman-triarii-libyan-infantry.jpg`, hàng 1 và 2). T-033 đã ghi ở mục "Còn lại".
- **Hai cây *pilum* của hastatus giờ biến đi rồi hiện lại tới hai lần mỗi chu kỳ 2,4 giây** (`SPARE_GONE` thêm `block`, `hit`): co lại trong 0,15 giây lúc clip hiện, lớn lại trong 0,25 giây lúc clip tắt, như với `attack` từ T-019. Tôi chỉ đọc code, chưa xem kỹ trong cảnh. Nếu thấy rõ khi xem gần, có thể cho hastatus không cầm *pilum* trong `idle` của giai đoạn `fight` (theo sử, *pilum* đã ném trước lúc giáp lá cà).

## Những điểm đã kiểm tra, không thấy lỗi

### Sáu clip cũ của sáu mô hình bộ binh

So từng kênh giữa file trên `main` và file trên nhánh, cho `roman-legionary`, `roman-hastatus`, `roman-triarii`, `libyan-infantry`, `iberian-infantry`, `gallic-infantry`:

- `idle`, `walk`, `run`, `attack`, `die`, `jog`: cả 201 kênh của mỗi clip giống hệt (nút đích, loại nội suy, byte của thời điểm và của giá trị).
- Lưới `LOD0`–`LOD2` (mọi thuộc tính và chỉ số), khung xương (ma trận bind), ba ảnh, vật liệu, cây nút: giống hệt.
- Chỉ thêm `block` và `hit`: 201 kênh, 1,000 giây, 31 khung mỗi clip.
- Năm mô hình còn lại (`roman-velites`, `balearic-slinger`, ba mô hình kỵ binh): file giống hệt từng byte.

### Đúng sai trong cảnh

- **Giá trị:** không có NaN hay Infinity ở `own`, `beat`, `frontX`, `frontY`; nhịp luôn trong [0; 2,4); `struck` chỉ khác 0 ở người đầu hàng (Cannae và trận thử, 60 khung/giây suốt trận).
- **Tua:** sau một lần tua, clip đè lên của 26% hình lính đang có clip khác với lúc phát liên tục tới đó (Cannae, tua tới các thời điểm cách nhau 3 giây suốt trận, 6 975 lượt hình lính). Ở `main` (chỉ có `attack`) con số là 29%, nên không tệ hơn. Cùng một nhát thì `block` hay `hit` được chọn như nhau khi tua và khi phát (theo hạt giống của hình và số thứ tự nhát); không lần nào `block` đổi thành `hit` giữa clip.
- **Mô hình không có `block`/`hit`** (kỵ binh, velites, lính ném đá): `reaction` bằng 0, không chạy phần phản ứng; `model.ts` nướng tư thế nghỉ một lần cho hai clip thiếu (thêm 2 dòng vào ảnh xương, không đáng kể). Ở Cannae 987 đòn chạm vào kỵ binh không có phản ứng, đúng như dự kiến cho tới chặng 3.
- **Khối hết người:** đơn vị không còn người đầu hàng thì không vào `Melee`, mảng của nó được xoá nhờ `engaged`; đối thủ của nó không còn ai để đánh, phản ứng đang dở phát nốt. Chạy lại các biến thể biên của lần đọc lại chặng 1 (`tools/edge-check.mjs`, sửa cho `update(now)`, `own`, `struck`, `frontX/Y`): khối bị diệt giữa `fight` mà vẫn ghi `fight`, quay đầu lúc đang đánh, cả hai bên ngã hết, khối một hình: không NaN, không nhảy chỗ, tua ra đúng cảnh (cả `own` và `struck`). Giai đoạn `fight` dài 1 hay 0 giây phát vẫn nhảy chỗ ở mốc cuối như ở chặng 1; tài liệu đã ghi "ít nhất 8 giây", dữ liệu hiện tại không có giai đoạn như vậy.
- **Chuyển `fight` sang `skirmish`:** Cannae và trận thử không có khối nào chuyển như vậy. Trong code, `swing` và `react` về -1 ngay, nên clip đang dở bị cắt không mờ dần (giống `attack` từ chặng 1). Chuyển `fight` sang `advance` hay `rout` (lính Gaul hai cánh ở giai đoạn 5, kỵ binh La Mã ở giai đoạn 4) thì clip đang dở phát nốt, đúng.
- **Ngã khi đang giơ khiên:** không lần nào (đòn hạ gục luôn là `hit`, mà `hit` đứng như `idle` tới lúc chạm, nên clip `die` nối tiếp không giật).
- **Blender:** `clips_of` khớp với `Builder.build` (bỏ hai clip cho kiểu tấn công trong `THROWN`); kỵ binh đi `whp_cavalry.stage_anim`, không qua `Builder.build`. `REACT["impact"]` 9 trên 30 khung khớp `REACTION_IMPACT` 0,3. `--duel` đặt hai mô hình đúng khoảng cách cảnh dùng (`max(tầm ngắn hơn × 1,3, khiên + khiên)`).

### Nhìn trong trình duyệt

- **`/battle-lab?duel=1`** (`tools/s-catch.mjs`): cho trận chạy; trong trang, mỗi khung tìm một người đầu hàng đang ở giây 0,27–0,36 của `block` hay `hit` mà đối thủ đang ở lúc chạm của nhát đánh, bấm dừng ngay khung đó (dừng giữ đúng cảnh đang phát), rồi đặt camera và chụp.
  - Bắt được đủ `block` và `hit` ở cả sáu khối bộ binh (ba cặp, hai chiều). Người bị đánh ở giây 0,27–0,30; người đánh bằng đâm ở 0,27–0,30, lính Gaul ở 0,47–0,48 (lúc chạm của nhát chém là 0,50). Nhịp của hai bên khớp nhau.
  - Ảnh: `shots/c2-*.jpg`, `shots/c3-*.jpg`. Không có lưới méo hay tư thế lạ. Lúc đòn chạm, lưỡi kiếm Gaul đã xuống thấp cạnh khiên người La Mã, đúng như T-033 đã ghi.
  - Phát liên tục và đọc clip của một cặp mỗi lần chụp (`tools/s-react.mjs`) thì thấy rõ đánh luân phiên: A đánh, B đỡ; nghỉ khoảng 0,1 giây; B đánh, A đỡ. Chụp liên tục làm trang chậm đi, nên tôi không dùng cách này để đếm; số lần giật ở mục 2 lấy từ mô phỏng Node.
- **Cannae** giai đoạn 3–6 (`tools/s-look.mjs`, cùng các khoảnh khắc như lần đọc lại chặng 1): hai tuyến chạm nhau, người ngã nằm trước hàng, không có gì vỡ. Ảnh: `shots/t033-*.png`.
- Console sạch ở cả hai trang.

## Tốc độ khung hình giai đoạn 3 tới 6

**Điều kiện:**

- Bản production của `main` (`609b469`, dựng trong thư mục tạm) và của nhánh (`6cb27d8`), cổng 3142 và 3143.
- Chrome không cửa sổ trên RTX 3050, bỏ trần khung hình, đọc một pixel mỗi khung, 1280×800, khung bên mở, góc nhìn mở của khung xem trận.
- Sáu lượt theo thứ tự `main`, nhánh, nhánh, `main`, `main`, nhánh (05:07–05:18), tức ba vòng xen kẽ. Mỗi lượt tám cửa sổ: đầu và giữa mỗi giai đoạn 3–6, phát 1× 1,5 giây rồi đo 6 giây. Cả 48 cửa sổ đều sạch (không có Blender hay Godot trước và sau mỗi cửa sổ).
- Máy lúc đo chỉ còn 1,6–1,8 GB RAM trống. Trong ba lượt đầu tôi chạy song song vài kịch bản Node (một lõi CPU), chia cho cả hai bản (một lượt `main`, hai lượt nhánh). Lượt thứ bảy bị Claude Code dừng giữa chừng vì máy thiếu RAM; tôi bỏ lượt đó và không chạy lại.

| Cửa sổ (phát 1×) | `main` (3 lượt) | Nhánh (3 lượt) | Chênh |
|---|---|---|---|
| Đầu giai đoạn 3 | 70,8 / 73,0 / 68,5 (TB 70,8) | 69,9 / 72,6 / 70,4 (TB 71,0) | +0,3% |
| Giữa giai đoạn 3 | 72,0 / 71,2 / 69,5 (TB 70,9) | 75,0 / 68,4 / 72,4 (TB 71,9) | +1,5% |
| Đầu giai đoạn 4 | 62,1 / 69,7 / 64,4 (TB 65,4) | 64,8 / 66,7 / 66,4 (TB 66,0) | +0,9% |
| Giữa giai đoạn 4 | 69,3 / 65,3 / 66,2 (TB 66,9) | 68,9 / 69,2 / 67,8 (TB 68,6) | +2,5% |
| Đầu giai đoạn 5 | 65,9 / 68,1 / 63,9 (TB 66,0) | 68,0 / 67,1 / 65,5 (TB 66,9) | +1,4% |
| Giữa giai đoạn 5 | 66,4 / 69,6 / 66,7 (TB 67,6) | 68,4 / 67,7 / 67,0 (TB 67,7) | +0,2% |
| Đầu giai đoạn 6 | 68,1 / 70,5 / 65,4 (TB 68,0) | 67,2 / 68,2 / 67,0 (TB 67,5) | −0,8% |
| Giữa giai đoạn 6 | 69,0 / 70,8 / 66,6 (TB 68,8) | 71,6 / 68,2 / 67,3 (TB 69,0) | +0,3% |

- **Tổng quát:** `main` 68,0, nhánh 68,6 khung/giây (+0,8%). So từng cặp lượt đứng cạnh nhau, nhánh thấp hơn ở 10 trên 24 cặp cửa sổ. Mức chênh nằm trong độ dao động giữa các lượt (3–7 khung/giây), nên kết luận là **không chậm hơn**.
- **p99 theo đồng hồ thật:** 17–23 ms ở cả hai bản, không khác.
- **Trong trang:** `Crowd.update` trung bình 2,41 ms ở `main`, 2,55 ms ở nhánh (+0,14 ms, phần chọn `block`/`hit` cho từng hình lính); `Melee.update` 0,05–0,3 ms ở cả hai. Số tam giác và lệnh vẽ trong khung giống hệt.
- Mỗi mô hình bộ binh nặng thêm khoảng 0,09 MB (sáu mô hình: 0,54 MB tải thêm lần đầu mở trận).

## Lệnh

- `npm run lint`, `npm run validate`, `npx tsc --noEmit` trên nhánh (`6cb27d8`): qua.
- `next build` của nhánh (trong worktree lane 3) và của `main` (thư mục tạm): qua.
- Không chạy lại hồi quy lõi `reg-core.js` (phiên chính đã chạy trên `3fb8cba`: 17/17).

## Đề nghị

Cho phiên chính, theo thứ tự nên làm:

1. **Mục 1** (bốn dòng trong `melee.ts`), trước khi gộp. Sửa luôn mục "Còn lại" của T-033 (lý do tỉ lệ giảm từ 89% xuống 87%) và câu "cặp chỉ đổi khi hai hàng dọc trượt ngang qua nhau" trong `ARCHITECTURE.md`.
2. **Mục 2** (khoảng mười dòng trong `units.ts`), trước khi gộp hoặc ngay sau, rồi cho người dùng xem lại `/battle-lab?duel=1`. Mô phỏng Cannae khi sửa cả mục 1 lẫn mục 2: 265 lần giật (nhánh: 1 490), 11 730 nhát đánh trúng (nhánh: 11 347); lần đỡ không có đòn chạm tăng nhẹ, 792 (nhánh: 617).
3. **Ghi công:** thêm `Hit_Chest` vào `art/CREDITS.md` (vùng của lane 1, hoặc phiên chính sửa luôn khi gộp).
4. **Mục 3** (phản ứng đi theo nhát đánh thật): làm cùng chặng 3, khi thêm `block`/`hit` cho kỵ binh.
5. **Hiệu năng:** không cần làm gì.
