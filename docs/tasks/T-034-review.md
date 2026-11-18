# T-034 review: đọc lại nhánh giáp lá cà, chặng 3 (kỵ binh đỡ đòn, trúng đòn; phản ứng theo nhát đánh thật)

- **Ai làm:** lane 1, **đọc lại thay lane 3** (người dùng giao), 2026-11-18.
- **Đọc:** nhánh `batch-g/stage3-cavalry` ở commit `f466aaf`, so với `main` ở `69a1d0c` (đã gộp chặng 2). Không sửa code của nhánh, không gộp.
- **Nhánh của file này:** `lane1/T-034-review` (tạo từ `batch-g/stage3-cavalry`, chỉ thêm file này).
- **Đọc trước:** `docs/tasks/T-034-melee-stage3.md`, `docs/ARCHITECTURE.md` mục "Giáp lá cà (đợt G)" (bản trên nhánh), `docs/tasks/T-033-review.md`.
- **Trọng tâm:** `engine/blows.ts` (mới), `engine/units.ts` (phần dùng `Blows`), `engine/melee.ts` (bỏ `own`, `struck`); `art/blender/whp_cavalry.py` (`_reaction`, `_stance`, `RiderPoser.frame`, `RiderPoser.clip`), `whp_build.py` (`clips_of`), `render_review.py` (`--duel` cho kỵ binh); `src/app/battle-lab/duelBattle.ts` (cặp thứ sáu).
- **Kịch bản đo, ảnh, số liệu thô:** `E:\World_History_Platform_assets\T-034-review\` (ngoài repo).

## Tóm tắt

Không thấy lỗi làm hỏng cảnh: không NaN, không ném lỗi, console sạch; dừng phát, khối hết người, chuyển `fight` sang `rout` đều đúng. **Sáu clip cũ của ba mô hình kỵ binh giống hệt `main` từng byte**, cả lưới, khung xương, ảnh và vật liệu; `block` và `hit` mới bắt đầu và kết thúc đúng thế ngồi của `idle` (lệch dưới 1,2°). Phản ứng theo nhát đánh thật chạy đúng như T-034 báo (chạy lại ra đúng từng số): lần đỡ hụt ở Cannae từ 789 xuống 5. Bộ binh vẫn như chặng 2, chỉ mất các lần đỡ hụt. Kỵ binh đỡ và trúng đòn đúng nhịp ở Cannae giai đoạn 3 và 6 và trong trận thử. **Tốc độ ngang `main`**: `crowd.update` 1,96 so với 1,99 ms mỗi khung (đo riêng phần CPU); khung hình 57,2 so với 57,7 (−0,9%, trong độ dao động của máy lúc đo).

Hai chỗ nên sửa, mỗi chỗ một dòng trong `blows.ts`:

1. **Ngay sau khi tua, 61% số người lẽ ra đang đỡ hay trúng đòn lại đứng thủ**: người đánh vào ngay giữa nhát đâm, người bị đánh không phản ứng. Thấy rõ nhất khi dừng rồi kéo thanh thời gian. Chặng 2 không bị; về mặt này nhánh kém cả chặng 1 lẫn chặng 2. Sửa: lúc tua thì báo cả nhát đã chạm mà chưa hết clip. Khi phát liên tục không đổi gì.
2. **Khối chuyển từ `fight` sang `skirmish` mà còn nhát của địch đang tới thì người ném vẫn có thể phát `block`/`hit`**, làm clip ném giật trong tối đa 0,3 giây. Dữ liệu hiện tại chưa có chuyển như vậy.

Thêm: kỵ binh Numidia đánh gần không đỡ đòn được là do độ dài clip, không chỉnh nhịp mà sửa được; chỉ thấy trong trận thử, để nguyên là hợp lý.

## Cách đọc lại

- Đọc diff của nhánh (18 file), nhất là ba file engine và ba script Blender ở trên. Đối chiếu từng dòng phần chọn clip cũ trong `UnitBlock.update` của `main` với `Blows.update`.
- **So file mô hình với `main`** (`tools/glbdiff.mjs` của lane 3): từng kênh của từng clip, lưới, khung xương, ảnh, vật liệu. Thêm `tools/glbpose.mjs`: khung đầu và khung cuối của `block`, `hit` lệch bao nhiêu so với khung 0 của `idle`.
- **Chạy code thật của nhánh bằng Node** (`timeline.ts`, `melee.ts`, `blows.ts`, 60 khung/giây suốt trận):
  - `main-tools/melee/blows-check.mjs` của phiên chính: chạy lại, ra đúng các số trong bảng "Số đo" của T-034. Bản sửa `tools/blows-check-v.mjs` (thêm biến `BLOWS` để chạy một bản `blows.ts` khác) và `tools/blows-check-model.mjs` (đếm theo mô hình thay vì theo giai đoạn).
  - `tools/blows-edge.mjs` (mới): các biến thể biên của trận thử (khối bị diệt mà vẫn ghi `fight`, quay đầu lúc đang đánh, cả hai bên ngã hết, khối một hình, giai đoạn `fight` dài 1 giây, chuyển `fight` sang `skirmish` hay `rout`, mô hình không có hai clip hoặc chỉ có một), và Cannae. Đếm: NaN, giá trị nhịp ngoài khoảng, một hình vừa đánh vừa phản ứng, clip trên hình đã ngã, phản ứng trên mô hình không có clip, người đang ném (`skirmish`) có clip đè lên; và so cảnh ngay sau một lần tua với cảnh lúc phát liên tục (mỗi 3 giây phát), cùng việc tua tới một lúc từ hai chỗ khác nhau có ra cùng một cảnh không.
  - `main-tools/melee/react-check.mjs` (`VARIANT=fix`, bản chép phần chọn clip của `main`) chạy trên `main`, để có số "sau khi tua" của chặng 2.
  - Các bản thử sửa nằm trong `variants/` (`blows-V1-seek.ts`, `blows-V2-seek-throw.ts`).
- **Trong trình duyệt:** Chrome không cửa sổ, RTX 3050. Bản production của `main` (`69a1d0c`, dựng trong thư mục tạm) và của nhánh (`f466aaf`, dựng trong worktree lane 1), cổng 3152 và 3153. Không đụng tới cổng 3000 và 3105 của phiên chính.

## Lỗi và chỗ nên sửa

Xếp theo mức ảnh hưởng.

### 1. Sau khi tua, phần lớn người bị đánh đứng thủ trong khi đòn của địch đã tới (nên sửa, một dòng)

`blows.ts:135`.

- **Cách xảy ra:** lượt "đòn đánh ra" chỉ báo cho người bị nhắm từ lúc nhát bắt đầu tới lúc đòn chạm (`swingInto(beat, clock, impact) <= impact`).
  - Lúc phát liên tục như vậy là đủ: phản ứng chỉ cần được báo trong 0,3 giây trước lúc chạm để bắt đầu, rồi tự phát nốt.
  - Sau một lần tua (`snap`), người đánh vào ngay khung của nhát đang diễn ra, kể cả sau lúc chạm. Người bị đánh thì chỉ phản ứng khi lúc tua rơi vào trước lúc đòn chạm. Tua vào 0,7 giây sau lúc chạm (phần lớn của clip `block`/`hit`) thì người đánh đang ở cuối nhát đâm còn người bị đánh đứng thủ.
  - Ở chặng 2 (`main`), phản ứng đi theo nhịp của chính người bị đánh, nên sau khi tua vẫn vào đúng khung (dù có lần đỡ hụt).
- **Thấy rõ nhất khi dừng phát rồi kéo thanh thời gian:** mỗi khung kéo là một lần tua, và cảnh đứng yên đó chính là cảnh người dùng ngắm. Phát tiếp thì sau một chu kỳ (2,4 giây) mọi thứ trở lại bình thường. T-034 đã ghi hiện tượng ở dòng cuối mục "Còn lại", nhưng chưa ghi là nó chiếm tới sáu phần mười số phản ứng đang hiện.
- **Đo** (Node, mỗi 3 giây phát, so cảnh của một lần tua tới đúng lúc đó với cảnh lúc phát liên tục; chỉ người còn đứng trong khối đang `fight`):

| | Cannae | Trận thử |
|---|---|---|
| Hình đang `block`/`hit` lúc phát liên tục | 2 272 | 1 028 |
| … trong đó sau khi tua không có clip nào | **1 384 (61%)** | 631 (61%) |
| Clip đè lên khác lúc phát, mọi clip: `main` / nhánh / sửa | 26% / **40%** / 28% | 21% (năm cặp) / 37% / 22% |

  - Số của `main` lấy từ `react-check.mjs` (`VARIANT=fix`). Cho kỵ binh không có hai clip (giống `main`) thì nhánh vẫn 39%, bản sửa 29%.
  - T-033 review ghi 26% cho chặng 2 và 29% cho chặng 1: về mặt này nhánh kém cả hai.
- **Đề nghị:** lúc tua thì báo cả nhát đã chạm mà chưa hết clip.

  ```ts
  if (enemy !== -1 && (snap || swingInto(beat, clock, impact) <= impact)) coming[enemy >> 16][enemy & 0xffff] = beat;
  ```

  - Chỉ đổi cảnh ngay sau khi tua. Khi phát liên tục, `swingBeat` chỉ bắt đầu phản ứng trong 0,3 giây đầu clip, nên có báo thêm sau lúc chạm cũng không đổi gì. Không nên báo thêm cả lúc phát: một nhát đã chạm có thể ghi đè trong `coming` nhát sắp tới của người khác nhắm cùng người đó.
  - Kết quả (`variants/blows-V1-seek.ts`): sau khi tua chỉ còn 166 trên 2 272 lần thiếu phản ứng ở Cannae (7%), 59 trên 1 028 ở trận thử. Mọi số của `blows-check.mjs` khi phát liên tục giống hệt nhánh, ở cả hai trận.
  - Sửa luôn câu "Sau khi tua…" trong `ARCHITECTURE.md` và dòng cuối mục "Còn lại" của T-034.

### 2. Khối chuyển sang `skirmish` vẫn có thể phát `block`/`hit` (nhỏ; dữ liệu chưa có; một dòng)

`blows.ts:139–148`, `units.ts:797–810`.

- **Ở `main`:** `UnitBlock.update` xoá `swing`, `react` của người đang ném và không đọc chúng (`if (throwing)`, `units.ts:823` trên `main`).
- **Trên nhánh:**
  - Lượt một xoá cả hai, nhưng lượt hai vẫn cho người ném phản ứng nếu còn một nhát của địch nhắm vào anh ta (nhát bắt đầu trước khi khối chuyển). Chú thích "(and the men who throw: cleared above)" ở `blows.ts:147` vì vậy không đúng.
  - `UnitBlock.update` đọc `blows` mà không xét `throwing`. Người ném ở hàng đầu có `iStrike >= 0`, nên clip `attack` của anh ta thôi lặp theo đồng hồ mà nhảy về giây 0–0,3 của clip (độ đậm của `block` thì bằng 0, vì phản ứng bị xoá rồi bắt đầu lại ở mỗi khung). Tay ném giật trong tối đa 0,3 giây.
- **Đo:** biến thể trận thử mà các khối phía nam chuyển sang `skirmish` ở giai đoạn cuối, phía bắc vẫn `fight`: 68 khung-hình có người ném mang `block`/`hit`. Khi cả hai bên cùng chuyển, hay chuyển sang `rout`: 0. Cannae và trận thử hiện không có khối nào chuyển `fight` sang `skirmish`.
- **Đề nghị:** bỏ qua khối đang ném ở lượt hai: `if (reaction <= 0 || track.actionAt(time) === "skirmish") continue;` (`variants/blows-V2-seek-throw.ts`, gồm cả mục 1): còn 0 khung; mọi số khác không đổi.

### 3. Kỵ binh Numidia đánh gần không đỡ đòn: chỉnh độ lệch nhịp không sửa được (để nguyên)

- T-034 đã ghi. Thêm một điều: với độ dài clip hiện tại, không có độ lệch nhịp nào cho cả hai người trong cặp đủ chỗ.
  - Gọi d là khoảng từ lúc đòn của người Numidia chạm tới lúc đòn của đối thủ chạm. Theo hai quy tắc "mỗi lúc một clip" (kể cả `REACT_OVERLAP`):
  - người Numidia (clip đánh 1,333 giây, chạm ở 0,733) cần d trong khoảng 1,38–1,50 giây;
  - kỵ binh đồng minh (1,0 giây, chạm ở 0,467) cần d trong khoảng 0,83–1,28 giây; hiện tại d = 1,2.
- Hai khoảng không giao nhau: muốn người Numidia đỡ đòn thì phải rút ngắn một clip hoặc cho phép cắt ngang. Chỉ thấy ở cặp thứ sáu của trận thử (ở Cannae người Numidia đánh từ xa), nên để nguyên là hợp lý.
- Ở trận thử, 549 trên 4 712 đòn chạm (12%) không ai phản ứng vì "không clip nào bắt đầu" (Cannae: 289 trên 11 824). Trong 549 lần đó, 395 lần người bị đánh là người Numidia: họ chỉ đỡ hoặc trúng 9 trên 431 đòn chạm vào mình. Trừ người Numidia, 92% đòn chạm ở trận thử có người phản ứng (3 921 trên 4 281).

### 4. Việc nhỏ

- **Tài liệu:**
  - `ARCHITECTURE.md`, "Sau khi tua, hình lính vào ngay nhát đánh mà đồng hồ trận cho nó; người bị đánh chỉ phản ứng với nhát còn kịp bắt đầu clip": thật ra là nhát chưa chạm. Sửa theo mục 1.
  - Đầu `blows.ts`: "a unit that fights at a distance (skirmish) drops them at once" chỉ đúng cho lượt một (mục 2).
- **`BlowFigures.through`** giữ giá trị cũ khi hình lính không phản ứng. Không ai đọc lúc đó (`units.ts` chỉ đọc khi `react >= 0`), nên không sai, nhưng nên ghi trong chú thích. Lúc đầu tôi so cả giá trị này khi kiểm tra tua và tưởng là tua không ổn định.

## Những điểm đã kiểm tra, không thấy lỗi

### Sáu clip cũ của ba mô hình kỵ binh

So từng kênh giữa file trên `main` và file trên nhánh, cho `roman-cavalry`, `iberian-gallic-cavalry`, `numidian-cavalry`:

- `idle`, `walk`, `run`, `attack`, `die`, `jog`: cả 321 kênh của mỗi clip giống hệt (nút đích, loại nội suy, byte của thời điểm và của giá trị).
- Lưới `LOD0`–`LOD2`, khung xương, ba ảnh, vật liệu, cây nút, `extras`: giống hệt.
- Chỉ thêm `block` và `hit`: 321 kênh, 1,000 giây, 31 khung mỗi clip.
- Tám mô hình còn lại không có trong diff (file giống hệt từng byte); `index.json` không đổi.

### Hai clip mới

- **Bắt đầu và kết thúc như `idle`** (`tools/glbpose.mjs`): khung 0 và khung 30 của `block`, `hit` lệch khung 0 của `idle` nhiều nhất 0,56° và 2,7 mm ở người cưỡi (`ik_hand_l`: dây cương của ngựa đứng hơi khác ngựa trong `idle`), 1,13° ở cổ và đầu ngựa (cái gật đầu của `_stance`, y như `attack`). Người Numidia: 0,05°. Để so: `block` của bộ binh lệch 3,0° và 7,4 mm ở khung cuối. Phần chuyển giữa `idle` và hai clip vì vậy không thấy giật.
- **`_reaction`:** ở khung 0 và 30, độ giơ khiên `raised` bằng 0 nên tay trái đi đúng `left_on_reins` như lúc không có `left`; khiên cầm tay về đúng `shield_carry`; cái hất đầu `toss` và bốn đường của thân (`REACT_TRUNK`) đều bằng 0. Phần trộn từ dây cương sang thế giơ khiên liên tục ở w = 0.
- **Dựng:** hai clip dựng sau `die`, `rp.clip` trả `_left`, `_right` về `None` sau mỗi clip, nên sáu clip cũ không bị ảnh hưởng (khớp với phép so ở trên). `clips_of` cho cả ba mô hình kỵ binh tám clip (kể cả người Numidia phóng lao), khớp với `stage_anim` luôn dựng cả hai.
- **`--duel`** cho kỵ binh: khung hình rộng và cao hơn, khoảng cách hai ngựa như cảnh dùng. Hai ảnh của nhánh không có lưới méo hay tư thế lạ; `block` đưa khiên lên trước ngực, `hit` ngả người ra sau; mũi giáo tới đầu ngựa địch như T-034 đã ghi.
- `whp_cavalry.py` chỉ thêm tham số tuỳ chọn (`_stance(toss=…)`, `clip(left=…)`); các file ngựa của lane 2 không gọi tới hai hàm này.

### Đúng sai trong cảnh

- **Đối chiếu với `main`:** lượt một của `Blows.update` là đúng phần "nhát đánh của mình" cũ trong `UnitBlock.update` (cùng `swingBeat`, cùng độ dài clip cắt ở 0,8 chu kỳ, cùng quy tắc chờ phản ứng, nhát hạ gục). Lượt hai là phần phản ứng cũ, chỉ thay "nhịp của chính mình khi có người đánh tới" bằng `coming`, cộng thêm khác biệt ở mục 2.
- **`snap`:** nhánh dùng `march.jumped`, `main` dùng `march.jumped || !placed`. Lần cập nhật đầu tiên của `Crowd` luôn là `jumped` (`lastClock` là NaN), nên như nhau.
- **Dừng phát:** `Blows.update` chỉ chạy khi đồng hồ trận đổi (`advance !== 0`), như `sample`; `UnitBlock.update` bỏ qua khung đứng yên. Cảnh đứng yên đúng như lúc dừng.
- **Bỏ `figures[unitOf[b]].engaged = true` trong `melee.ts`:** vô hại, vì b cũng là người đầu hàng nên khối của b tự đặt `engaged` ở vòng của mình.
- **Mã đối thủ:** `Melee` và `Blows` cùng dựng từ `Crowd.blocks` theo cùng thứ tự, nên `enemy >> 16` trỏ đúng khối.
- **Nhiều người đánh một người:** mọi người đánh đều canh nhát theo nhịp của người bị đánh (`beat = own[b]`), nên việc ghi đè trong `coming` không đổi nhịp; chỉ khác khi có nhát cũ (67 lần "đang phản ứng với đòn khác" ở Cannae).
- **Các biến thể biên** (`blows-edge.mjs`; khối bị diệt mà vẫn `fight`, quay đầu lúc đánh, cả hai bên ngã hết, khối một hình, giai đoạn `fight` 1 giây, chuyển sang `skirmish` hay `rout`, mô hình không có hai clip, chỉ có `block`, chỉ có `hit`):
  - không NaN, không ném lỗi, nhịp luôn trong [0; 2,4);
  - không lần nào một hình vừa đánh vừa phản ứng, không clip đè lên hình đã ngã, không phản ứng trên mô hình không có clip; mô hình chỉ có một clip luôn được clip đó;
  - tua tới cùng một lúc từ hai chỗ khác nhau ra cùng một cảnh (30 lần mỗi biến thể: 0 khác biệt);
  - chuyển `fight` sang `rout` (có ở Cannae: kỵ binh La Mã sang giai đoạn 4): nhát và phản ứng đang dở phát nốt. Chuyển sang `skirmish`: bị xoá ngay (cắt, không mờ dần, như `main`), trừ chỗ ở mục 2.
- **Các số trong bảng "Số đo" của T-034:** chạy lại `blows-check.mjs` ra đúng từng số (5 trên 8 761; 4 trên 3 467; 10 539 trên 11 824; 231; 2 557 trên 2 834; 701 trên 711; 929 + 67 + 289).
- **Phát 2×:** mỗi khung đồng hồ trận đi 0,033 giây, nhỏ hơn nhiều khoảng 0,3 giây để bắt đầu clip.

## Nhìn trong trình duyệt

Ảnh: `shots/` trong thư mục đo. Console sạch ở mọi trang.

- **Cannae, bản production của nhánh** (`tools/s-catch-cannae.mjs`): cho trận chạy; trong trang, mỗi khung tìm một người đầu hàng của khối đang ở giây 0,27–0,36 của `block` hay `hit` mà đối thủ đang ở lúc chạm của nhát đánh, bấm dừng đúng khung đó rồi chụp.
  - Giai đoạn 3 (hai khối kỵ binh bên bờ sông): bắt được `block` và `hit` của kỵ binh La Mã (người đánh là kỵ binh Hasdrubal) và của kỵ binh Hasdrubal (người đánh là kỵ binh La Mã). Người bị đánh ở giây 0,27–0,28, người đánh ở 0,44–0,45 (đòn của kỵ binh chạm ở 0,467): nhịp hai bên khớp. Lúc bắt, số hình phát `attack` / `block` / `hit`: kỵ binh La Mã 7–11 / 3 / 1–3, kỵ binh Hasdrubal 10–17 / 1–5 / 0–2.
  - Giai đoạn 6: kỵ binh Hasdrubal (cả hai khối) đỡ và trúng đòn của triarii; triarii đỡ và trúng đòn của kỵ binh (người đánh ở 0,44–0,45, tức bộ binh phản ứng đúng nhịp với nhát đâm dài hơn của kỵ binh); principes đỡ và trúng đòn của lính Libya. Mười hai khối đang `fight` đều có đủ ba clip qua các lần bắt (ví dụ triarii 22 / 10 / 8, kỵ binh Hasdrubal hàng sau 10 / 10 / 0).
  - Ảnh không có lưới méo hay tư thế lạ. Ở khoảng cách xem thường (40–110 m), hai ngựa đứng chạm mũi và mũi giáo dừng ở đầu ngựa địch, như T-034 đã ghi.
- **`/battle-lab?duel=1`** (chỉ có ở bản dev; dùng dev server 3105 của phiên chính, đang ở `f466aaf`, không có thay đổi chưa commit; `tools/s-catch.mjs` của lane 3): bắt được `block` và `hit` ở cả hai khối của cặp kỵ binh La Mã với Iberia/Gaul, cặp đồng minh với Numidia (kể cả một lần người Numidia đỡ đòn, hiếm) và cặp bộ binh La Mã với Gaul. Người đánh bằng đâm ở 0,28 (bộ binh) hay 0,44–0,47 (kỵ binh), lính Gaul ở 0,47, người Numidia ở 0,71: đều ngay trước lúc chạm của nhát mình.
- **Bộ binh có còn như chặng 2 không** (Node, Cannae, cho kỵ binh không có hai clip để so cùng điều kiện với `main`): đòn chạm có người đỡ hoặc trúng 9 563 trên 10 799 (88,6%; `main` 9 373 trên 10 661, 87,9%); lần `block`/`hit` hiện ra 7 955 (`main` 8 580, trong đó 789 lần không có đòn chạm; nhánh: 5). Tức là y như chặng 2, chỉ mất các lần đỡ hụt. Lính Libya chỉ phản ứng với 44% đòn chạm vào mình (`main` 43%), vì một nửa số đòn tới lúc họ đang dở nhát của mình; có từ chặng 2, không do nhánh.
- **Cảnh đứng yên ngay sau khi tua** (`tools/s-seekcount.mjs`, xác nhận mục 1 trong trình duyệt): tám thời điểm ở giai đoạn 3–6; ở mỗi thời điểm, tua tới lúc đang dừng và đếm số hình phát `attack` / `block` / `hit`, rồi phát 3 giây, dừng, đếm lại.

| | Ngay sau khi tua | Sau 3 giây phát |
|---|---|---|
| Nhánh | 900 / 119 / 102 (`block` + `hit` trên `attack`: **0,25**) | 961 / 339 / 196 (0,56) |
| `main` | 900 / 383 / 232 (0,68) | 971 / 325 / 186 (0,53) |

  Trên nhánh, cảnh dừng sau khi tua chỉ có chưa tới một nửa số người đỡ hay trúng đòn so với lúc đang phát; ở `main` thì ngược lại (thêm cả các lần đỡ hụt).

## Tốc độ khung hình giai đoạn 3 tới 6

**Điều kiện:**

- Bản production của `main` (`69a1d0c`) và của nhánh (`f466aaf`), cổng 3152 và 3153.
- Chrome không cửa sổ trên RTX 3050, bỏ trần khung hình, đọc một pixel mỗi khung, 1280×800, góc nhìn mở của khung xem trận (`tools/s-perf36.mjs` của lane 3, thêm đo `Blows.update`).
- Sáu lượt theo thứ tự `main`, nhánh, nhánh, `main`, `main`, nhánh (10:52–11:04). Mỗi lượt tám cửa sổ: đầu và giữa mỗi giai đoạn 3–6, phát 1× 1,5 giây rồi đo 6 giây. Cả 48 cửa sổ đều sạch (không có Blender hay Godot).
- Máy lúc đo còn 1,7–3,2 GB RAM trống, và các phiên khác (phiên chính, lane 2, lane 3) vẫn chạy: cả hai bản chỉ đạt 52–63 khung/giây, thấp hơn lần đo ở T-033 review (65–72), và dao động giữa các lượt tới 10–20 khung/giây. Không chạy Node song song trong lúc đo.

| Cửa sổ (phát 1×) | `main` (3 lượt) | Nhánh (3 lượt) | Chênh |
|---|---|---|---|
| Đầu giai đoạn 3 | 66,8 / 55,1 / 61,0 (TB 61,0) | 47,7 / 65,1 / 62,0 (TB 58,3) | −4,4% |
| Giữa giai đoạn 3 | 65,4 / 59,0 / 64,3 (TB 62,9) | 53,5 / 54,5 / 64,9 (TB 57,6) | −8,4% |
| Đầu giai đoạn 4 | 62,7 / 55,9 / 60,6 (TB 59,7) | 49,6 / 57,0 / 56,3 (TB 54,3) | −9,1% |
| Giữa giai đoạn 4 | 60,7 / 53,3 / 60,5 (TB 58,2) | 55,1 / 55,7 / 58,7 (TB 56,5) | −2,9% |
| Đầu giai đoạn 5 | 57,3 / 51,0 / 59,0 (TB 55,8) | 53,0 / 53,4 / 58,5 (TB 55,0) | −1,4% |
| Giữa giai đoạn 5 | 55,6 / 39,5 / 61,9 (TB 52,3) | 55,1 / 54,1 / 61,7 (TB 57,0) | +8,9% |
| Đầu giai đoạn 6 | 59,6 / 52,3 / 60,2 (TB 57,4) | 58,4 / 54,7 / 62,1 (TB 58,4) | +1,8% |
| Giữa giai đoạn 6 | 46,5 / 53,6 / 63,1 (TB 54,4) | 61,8 / 56,5 / 62,8 (TB 60,4) | +11,0% |

- **Tổng quát:** `main` 57,7, nhánh 57,2 khung/giây (−0,9%). So từng cặp lượt đứng cạnh nhau, nhánh thấp hơn ở 13 trên 24 cặp cửa sổ. Giai đoạn 3–4 nhánh thấp hơn, 5–6 cao hơn. Phần thấp hơn ở giai đoạn 3–4 nằm chủ yếu ở lượt đầu của nhánh (47,7–55,1); bỏ cặp lượt đầu thì bốn cửa sổ đó chênh +9,5%, −3,2%, −2,7%, +0,5%. Mức chênh nằm trong độ dao động, nên từ phép đo này không kết luận được nhánh chậm hơn.
- **Đo riêng phần CPU, không phụ thuộc GPU và nhịp khung** (`tools/s-bench.mjs`): dừng phát, rồi trong trang gọi thẳng `crowd.update` cho 6 giây trận ở 1×, 60 khung/giây, tại đúng tám cửa sổ trên, đo từng lần gọi. Sáu lượt xen kẽ như trên:
  - `crowd.update` trung bình mỗi khung: `main` 2,11 / 1,85 / 2,01 ms (TB 1,99), nhánh 2,03 / 1,98 / 1,88 ms (TB 1,96). **Ngang nhau.**
  - Trong đó `Blows.update` 0,13 ms ở nhánh (khớp số 0,14 ms của T-034); phần này trước nằm trong vòng vẽ của `UnitBlock.update`, nên tổng không tăng. `Melee.update` 0,14–0,16 ms ở cả hai.
- Số lệnh vẽ và tam giác trong khung giống hệt hai bản (95–98 lệnh, 3,88–4,18 triệu tam giác).
- Mỗi mô hình kỵ binh nặng thêm khoảng 0,09 MB (ba mô hình: 0,28 MB tải thêm lần đầu mở trận).

## Lệnh

- `npm run lint`, `npm run validate`, `npx tsc --noEmit` trên nhánh (`f466aaf`): qua.
- `next build` của nhánh (worktree lane 1) và của `main` (thư mục tạm, sau `npm ci`): qua.
- Không chạy lại hồi quy lõi `reg-core.js` (phiên chính đã chạy trên `2014587`: 17/17).

## Đề nghị

Cho phiên chính, theo thứ tự nên làm:

1. **Mục 1** (một dòng trong `blows.ts`), trước khi gộp; sửa luôn câu về tua trong `ARCHITECTURE.md` và mục "Còn lại" của T-034.
2. **Mục 2** (một dòng trong `blows.ts`, cùng chú thích ở `blows.ts:147` và đầu file): làm cùng lúc với mục 1. Bản thử gộp cả hai: `variants/blows-V2-seek-throw.ts`.
3. **Mục 3:** không làm gì; nếu muốn ghi thêm vào `ARCHITECTURE.md` thì ghi lý do (hai khoảng độ lệch nhịp không giao nhau).
4. **Hiệu năng:** không cần làm gì.
