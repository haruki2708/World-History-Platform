# T-040: Phong cảnh, chặng 3 (thực vật)

- **Ai làm:** phiên chính (người dùng chọn 2026-11-18: chặng tiếp theo là thực vật, làm trước việc nâng cấp đồ hoạ lính).
- **Model:** Fable 5.2.
- **Nhánh:** `batch-h/stage3-vegetation`, **xếp chồng lên** `batch-h/stage2-structures` (chặng 2 chưa gộp lúc bắt đầu: người dùng đang xem lại). Làm ở worktree riêng `E:\World_History_Platform_assets\wt-stage3`, `next dev` cổng 3106, để không làm xáo trộn bản chặng 2 người dùng đang xem ở cổng 3105.
- **Trạng thái:** xong, chờ người dùng xem và duyệt gộp (sau chặng 2). Chưa có lane đọc lại.
- **Phạm vi file:** `src/components/battle/engine/`, `src/lib/battle.ts`, `src/data/battles/`, `scripts/battles/`, `src/lib/i18n/messages.ts`, `docs/`.
- **Kế hoạch chung:** `docs/PLAN.md`, mục "Đợt H".

File này vừa là đề bài vừa là nhật ký: phiên nào làm tiếp thì đọc mục "Kết quả" ở cuối trước.

## Vấn đề

Sau chặng 2 cảnh có ruộng, sông, biển, trại, thành, làng và nhà nông, nhưng không có một cái cây nào: bờ sông chỉ là dải màu xanh vẽ trên đất. Người dùng đã chọn cho cảnh có nhiều cây hơn tư liệu (Polybius 3.110 nói vùng này không có cây), và sau khi xem chặng 2 đã chê công trình "như hình khối": cây phải trông như cây thật.

## Xong khi

- Ven sông có lau sậy, bụi và cây.
- Trên đồng có cây lẻ và vài khu rừng nhỏ; quanh nhà nông và làng có cây; sườn dốc có bụi.
- Không cây nào mọc ở chỗ quân đứng hay đi qua, trên sông, trên biển hay trên phần đất của công trình.
- Mọi cây thêm vào trái với Polybius đều mang mức `illustrative` và ghi chú nói rõ.
- Tốc độ khung hình vẫn trên mục tiêu 50 khi phát 1×.
- Hộp thoại Giới thiệu nói rõ cây trên đồng trái với lời Polybius.
- `npm run lint`, `npm run validate`, `npm run build` qua; hồi quy lõi qua.

## Kết quả

Làm 2026-11-18.

### Đã làm

**Cảnh (`engine/vegetation.ts`, file mới; `BattleEngine.ts` nối vào).**

- Một cái cây gồm thân (cột sáu cạnh thuôn dần, hơi nghiêng) và tán: 22–30 tấm phẳng mang hình lá có lỗ hổng, xếp quanh một khối hình trứng, tấm ở trong sẫm hơn tấm ở ngoài, mỗi tấm được chiếu sáng như mặt cong của tán ở chỗ đó. Nhờ vậy tán có độ dày và bắt nắng theo giờ.
- Hình lá được vẽ một lần lúc mở trận vào một ảnh 512 × 512 (lá to, lá nhỏ, lá sậy, một ô đặc cho thân cây): không có file ảnh nào phải tải.
- Năm loại: ô liu (thấp, xám bạc), sồi (tròn, xanh sẫm), dương (cao, hẹp), liễu (rộng, xanh vàng), bụi cây. Lau sậy là ba tấm lá đứng chéo nhau. Cây vẽ to hơn thật như hình lính: ô liu cao khoảng 11 m, sồi 20 m, dương 33 m.
- Cây đung đưa: nghiêng chậm theo hướng gió của trận (`scenery.wind`) và rung nhanh hơn ở ngọn. Cây đổ bóng theo hình lá.
- **Chỗ mọc:**
  - dọc sông có `banks`: lau sậy ở mép nước và bãi sỏi, bụi phía sau, rồi hàng dương và liễu, trong dải rộng `banks.width`;
  - cây lẻ trên đồng theo `scenery.trees.perSquareKm` (trường mới): mỗi ô vuông một cây, 60% ô liu, 40% sồi; không mọc trên dốc quá 20% và cách sông dưới 60 m;
  - các mảng `scenery.areas`: `woodland` (sồi, ô liu, bụi, cách nhau khoảng 15 m), `scrub` (bụi), `reeds` (lau sậy). Lần đầu `areas` được vẽ;
  - quanh mỗi nhà nông 5 cây, quanh làng 9 cây;
  - bụi trên đất dốc từ 13% trở lên, dốc càng nhiều càng dày.
- **Chỗ không mọc:** biển và đất thấp sát mực biển; lòng sông (trừ lau sậy); phần đất của công trình; chỗ quân đứng hay đi qua, với khoảng lùi 55 m cho cây và 14 m cho bụi và lau sậy (`occupancy` của `structures.ts`, giờ nhận tham số khoảng lùi).
- Cây được gom theo ô 700 m để trình duyệt chỉ vẽ ô nằm trong khung nhìn.

**Hợp đồng và dữ liệu.**

- `BattleScenery.trees` (số cây lẻ trên mỗi km², kèm căn cứ); `validate-battles.mjs` kiểm tra.
- Cannae: 14 cây lẻ mỗi km² và ba khu rừng nhỏ (`wood-east`, `wood-south`, `wood-west`, mỗi khu khoảng 300 × 220 m), đều mức `illustrative`, ghi chú nói thẳng chúng trái với Polybius 3.110. Cây ven sông đi theo `banks` đã có từ chặng 0 (cũng `illustrative`).

**Hộp thoại Giới thiệu.** Dòng `about.accuracy.battle.scenery` thêm ý: cây và rừng nhỏ trên đồng trái với lời Polybius rằng vùng này không có cây, được vẽ để cảnh sinh động hơn. **Câu chữ mới chưa được người dùng duyệt.**

**Tài liệu.** `docs/ARCHITECTURE.md` (mục "Phong cảnh"), `docs/data/battles/cannae.md` (mục 15), `docs/PLAN.md`.

### Đã kiểm tra

- `npm run lint`, `npx tsc --noEmit`, `npm run validate`: qua.
- Xem bằng ảnh chụp trên `next dev` (cổng 3106), RTX 3050, lúc 9:45: bờ sông, sát mép nước, một nhà nông, một khu rừng, một cây đứng riêng, toàn cảnh, tầm trung. Ảnh ở `E:\World_History_Platform_assets\main-tools\shots\h3-a-*`.
- Hiệu năng, build và hồi quy lõi: ghi ở cuối mục này.

### Chưa làm, hoặc chưa ưng

- Mép lá hơi răng cưa khi nhìn thật sát: hình lá chỉ 256 điểm ảnh mỗi ô.
- Cây ở xa không có mức chi tiết thấp hơn: mọi cây luôn vẽ đủ tấm lá.
- Loại cây và hình dáng là hiểu biết chung về cây vùng Địa Trung Hải, không dựa vào nghiên cứu nào về thảm thực vật Apulia thế kỷ 3 TCN.
- Chưa có cỏ và bụi rạ có hình ở sát chân lính: mặt đất gần vẫn là hình vẽ phẳng.
- Chưa xem ban đêm, hoàng hôn và ở mức chất lượng thấp.
- Gió và bụi (chặng 4) chưa làm; cây mới chỉ dùng hướng gió.
