# T-034: Giáp lá cà, chặng 3 (kỵ binh đỡ đòn và trúng đòn; phản ứng theo nhát đánh thật)

- **Ai làm:** phiên chính (đợt G, người dùng chọn 2026-11-18).
- **Model:** Fable 5.2, effort `high` (người dùng đặt).
- **Nhánh:** `batch-g/stage3-cavalry` (tạo từ `main` sau khi gộp chặng 2).
- **Trạng thái:** xong 2026-11-18; lane 1 đã đọc lại thay lane 3 (`T-034-review.md`), đã sửa theo review (mục "Sau review của lane 1"); chờ người dùng duyệt gộp.
- **Phạm vi file:** `src/components/battle/engine/`, `src/app/battle-lab/`, `art/`, `public/battles/models/`, `docs/`.
- **Kế hoạch chung:** `docs/PLAN.md`, mục "Đợt G". Chặng 2: `T-033-melee-stage2.md`, review của lane 3: `T-033-review.md`.

File này vừa là đề bài vừa là nhật ký.

## Việc

1. **Clip `block` và `hit` cho ba mô hình kỵ binh** (`roman-cavalry`, `iberian-gallic-cavalry`, `numidian-cavalry`), theo hợp đồng của chặng 2: dài 1,0 giây, đòn chạm ở khung 9, bắt đầu và kết thúc ở thế ngồi như `idle`, không lặp. Sáu clip cũ của ba file phải giống hệt từng byte.
2. **Người bị đánh phản ứng theo nhát đánh thật của địch** (mục 3 trong review chặng 2): hết cảnh giơ khiên đỡ một đòn không tới.

Không làm trong chặng này: dữ liệu Cannae, hợp đồng `src/lib/battle.ts` (không đổi).

## Kết quả

### 1. Clip của kỵ binh (`art/blender/whp_cavalry.py`)

- **Ngựa:** đứng bốn chân như trong `attack`; lúc đòn chạm thì hất đầu lên (3° ở `block`, 10° ở `hit`).
- **`block`, người đeo khiên ở cẳng tay** (La Mã, Iberia/Gaul): tay trái rời dây cương, cẳng tay đưa ngang trước ngực, mặt khiên quay ra trước; thân xoay bên khiên về phía đòn 14° và chồm tới 6°. Đòn chạm thì khiên bị dội về ngực, thân bật ngửa 5°, rồi tay trở lại dây cương.
- **`block`, người cầm khiên trong tay** (Numidia): đẩy khiên ra trước như lính bộ binh, bị dội lại, rồi về chỗ cũ.
- **`hit`:** thân bật ngửa 18° và xoay 16°, nghiêng sang bên 7°, đầu gục tới rồi ngẩng lại. Tay trái vẫn giữ dây cương; khiên của người Numidia bị bật sang trái.
- **Dựng:** hai clip dựng sau `die`, nên sáu clip cũ không đổi. `whp_build.clips_of` giờ trả tám clip cho kỵ binh. Người Numidia phóng lao (kiểu tấn công trong `whp_clips.THROWN`) nhưng vẫn có hai clip, theo lựa chọn "kỵ binh làm đủ như bộ binh".
- **So với `main`** (`tools/glbdiff.mjs` của lane 3): ở cả ba file, sáu clip cũ (321 kênh mỗi clip), lưới `LOD0`–`LOD2`, khung xương, ba ảnh, vật liệu giống hệt; chỉ thêm `block` và `hit`.
- **Kích thước file** (trần 4 MB): `roman-cavalry` 2,55 MB, `iberian-gallic-cavalry` 2,25 MB, `numidian-cavalry` 2,20 MB. Mỗi file nặng thêm khoảng 0,09 MB.
- `build_model.py -- --model all --check` (cả 11 mô hình): qua.
- **Ảnh duyệt:** `render_review.py -- --model A --duel B` giờ chụp được hai kỵ binh đối mặt.
  - `art/renders/duel-roman-cavalry-iberian-gallic-cavalry.jpg`
  - `art/renders/duel-roman-cavalry-numidian-cavalry.jpg`

### 2. Phản ứng theo nhát đánh thật (`src/components/battle/engine/blows.ts`, file mới)

- Phần chọn clip đè lên mỗi hình lính (nhát đánh của mình, `block`, `hit`) tách khỏi `units.ts` thành lớp `Blows`, thuần dữ liệu, chạy được bằng Node. `Crowd.update` gọi nó sau khi ghép cặp, trước khi vẽ.
- Mỗi khung hình chạy hai lượt trên mọi hình lính:
  1. **Đòn đánh ra:** như trước (`swingBeat`). Hình lính đang dở một nhát thì báo cho người mà nhát đó nhắm tới, cho tới lúc đòn chạm.
  2. **Đòn nhận vào:** hình lính được báo có đòn tới thì phát `block` hoặc `hit`, bắt đầu 0,3 giây trước khi đòn chạm. Trước đây nó phát theo nhịp bị đánh của chính mình, dù địch có đang đánh hay không.
- Các quy tắc "mỗi lúc một clip" của chặng 2 giữ nguyên. Cách chọn `block` hay `hit` giữ nguyên.
- `MeleeFigures.own` và `MeleeFigures.struck` không còn ai dùng, đã bỏ.
- `/battle-lab?duel=1` thêm cặp thứ sáu: kỵ binh đồng minh với kỵ binh Numidia đánh gần (ở Cannae người Numidia chỉ đánh từ xa).

### Số đo

Mô phỏng Node chạy code thật của nhánh (`timeline.ts`, `melee.ts`, `blows.ts`), 60 khung/giây cả trận: `main-tools/melee/blows-check.mjs`. Cột "chặng 2" lấy từ `T-033-melee-stage2.md` (bản chép của lane 3), kỵ binh khi đó chưa phản ứng.

| | Chặng 2 | Bây giờ |
|---|---|---|
| Cannae: lần `block`/`hit` mà không có đòn nào chạm | 789 trên 8 580 | 5 trên 8 761 |
| Trận thử: như trên | 149 trên 2 578 | 4 trên 3 467 (giờ có sáu cặp; năm cặp cũ: 1 trên 3 128) |
| Cannae: đòn chạm vào mô hình có hai clip, có người đỡ hoặc trúng | 9 373 trên 10 661 | 10 539 trên 11 824 (89%) |
| Cannae: đòn chạm vào mô hình không có hai clip | 1 025 | 0 |
| Cannae: clip phản ứng bị cắt ngang (nhát hạ gục) | 253 | 231 |
| Cannae: người ngã có đòn chạm đúng lúc | 2 557 trên 2 834 (90%) | 2 557 trên 2 834 (90%) |
| Trận thử: người ngã có đòn chạm đúng lúc | 615 trên 624 (99%) | 701 trên 711 (99%; năm cặp cũ: 615 trên 624) |

Đòn chạm mà không ai phản ứng ở Cannae (1 285 lần): 929 lần người bị đánh đang dở nhát của mình, 67 lần đang phản ứng với đòn khác, 289 lần không clip nào bắt đầu (nhát đánh kế tiếp của người đó sẽ cắt ngang, hoặc nhát hạ gục bắt đầu quá muộn).

Chi phí: `Blows.update` 0,14 ms mỗi khung ở Cannae (6 810 hình, đo bằng Node); phần việc này trước đây nằm trong vòng lặp vẽ của từng khối.

### Đã kiểm tra

- `npm run lint`, `npm run validate`, `npx tsc --noEmit`: qua.
- Trong trình duyệt (dev, đang phát), số hình phát `attack` / `block` / `hit` qua các lần chụp, console sạch:
  - `/battle-lab?duel=1`: cặp kỵ binh La Mã với Iberia/Gaul 45 / 13 / 17 và 47 / 23 / 7; ba cặp bộ binh vẫn đủ ba clip; cặp đồng minh với Numidia 43 / 22 / 7 và 54 / 2 / 0.
  - Cannae giai đoạn 3 (kỵ binh hai bên bờ sông): kỵ binh La Mã 56 / 27 / 11, kỵ binh Hasdrubal 82 / 39 / 8.
  - Cannae giai đoạn 6: hai khối kỵ binh Hasdrubal 61 / 20 / 12 và 42 / 34 / 7; các khối bộ binh đủ ba clip.
- `npm run build` (worktree tạm, commit `2014587`): qua. Hồi quy lõi của app (`main-tools/reg-core.js`) trên bản production đó: 17/17, console sạch.
- Tua tới giữa giai đoạn 3 của trận thử (dev): cảnh hiện đúng, console sạch.
- **Chưa đo tốc độ khung hình** so với `main`; phần thêm vào là một lượt duyệt 0,14 ms mỗi khung. Nhờ lane 3 đo khi đọc lại.

## Còn lại, chưa ưng ý

- **Kỵ binh Numidia đánh gần hầu như không đỡ đòn.** Clip phóng lao của họ lấy đà lâu (đòn chạm ở giây 0,73 của clip dài 1,33 giây), nên khi đánh luân phiên, nhát kế tiếp của họ bắt đầu trước khi clip đỡ đòn phát xong, và quy tắc "mỗi lúc một clip" bỏ lần đỡ đó. Chỉ thấy ở cặp thứ sáu của trận thử; ở Cannae họ đánh từ xa.
- **Mũi giáo của kỵ binh chạm tới đầu ngựa của địch, chưa tới người cưỡi** (hai ảnh duyệt): hai con ngựa đứng chạm mũi nhau, người ngồi lùi sau 1,45 m. Có từ chặng 1 (khoảng cách đấu của kỵ binh tính theo thân ngựa).
- **Lúc đỡ đòn, tay trái rời dây cương** nhưng dây cương vẫn nằm ở cổ ngựa (dây là lưới của ngựa, không gắn vào tay).
- **Nhát hạ gục cắt ngang phản ứng** (231 lần ở Cannae) và cắt ngang nhát đang dở (650 lần), như chặng 1 và 2.
- **Hai cây *pilum* của hastatus** vẫn biến đi rồi hiện lại mỗi lần phát `attack`, `block`, `hit`; chưa quyết (xem `T-033-melee-stage2.md`).
- ~~Sau khi tua, người bị đánh chỉ phản ứng với nhát nào còn kịp bắt đầu clip.~~ Đã sửa, xem mục "Sau review của lane 1".

## Sau review của lane 1 (2026-11-18)

Lane 3 hết hạn mức, nên người dùng giao lane 1 đọc lại thay (Opus 5.5): `docs/tasks/T-034-review.md`, nhánh ở commit `f466aaf`. Không có lỗi làm hỏng cảnh; sáu clip cũ của ba mô hình kỵ binh giống hệt `main`; các số của bảng "Số đo" chạy lại ra đúng; tốc độ ngang `main` (`crowd.update` 1,96 so với 1,99 ms mỗi khung; khung hình 57,2 so với 57,7, máy lúc đo dao động lớn). Hai chỗ nên sửa, đã sửa cả hai trong `blows.ts`:

- **Sau khi tua, người bị đánh đứng thủ trong khi đòn đã tới.** Một nhát chỉ được báo cho người bị nhắm tới lúc đòn chạm, nên tua vào sau lúc chạm thì người đó không phản ứng. Giờ lúc tua thì báo cả nhát đã chạm mà chưa hết clip. Đo bằng `tools/blows-edge.mjs` của lane 1 (so cảnh ngay sau một lần tua với cảnh lúc phát liên tục, mỗi 3 giây phát): số hình đang `block`/`hit` lúc phát mà sau khi tua không có clip nào giảm từ 1 384 xuống 166 trên 2 272 ở Cannae (61% xuống 7%), từ 631 xuống 59 trên 1 028 ở trận thử.
- **Khối chuyển từ `fight` sang `skirmish` vẫn có thể phát `block`/`hit`** nếu còn nhát của địch đang tới. Giờ khối đang ném bị bỏ qua ở lượt "đòn nhận vào". Dữ liệu hiện tại không có khối nào chuyển như vậy.

Sau khi sửa, mọi số của `blows-check.mjs` khi phát liên tục giống hệt trước (Cannae và trận thử), và các biến thể biên của lane 1 không còn người ném nào mang clip phản ứng.

Để nguyên theo review: kỵ binh Numidia đánh gần không đỡ đòn (lane 1 tính ra hai khoảng độ lệch nhịp không giao nhau; đã ghi vào `ARCHITECTURE.md`).
