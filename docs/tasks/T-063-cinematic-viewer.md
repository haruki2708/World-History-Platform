# T-063: Khung xem trận kiểu điện ảnh, thẻ chương khi sang giai đoạn

- **Lane:** Gemini Neon (Antigravity CLI, model Gemini 4 Neon). Task đầu tiên của lane, nên làm một bản, dừng cho người dùng xem, rồi mới hoàn thiện.
- **Nhánh:** `gemini/T-063-cinematic-viewer` (phiên chính đã tạo sẵn từ `main` trong worktree `E:\World_History_Platform_lanes\lane-gemini-neon`).
- **Phạm vi file:** `src/components/battle/BattleViewer.tsx`, `BattleViewerLoading.tsx`, `BattleScene.tsx` (chỉ phần lớp phủ HTML: nút, nhãn, thẻ, lời nhắc), `src/components/battle/viewer/`; thêm khoá `battle.*` vào `src/lib/i18n/messages.ts` (cả `en` lẫn `vi`). **Không sửa** `src/components/battle/engine/`, `src/lib/`, `src/store/`, `src/app/globals.css`.

## Bối cảnh

Khung xem trận (T-023, T-028) mở toàn màn hình khi người dùng bấm một trận trong panel sự kiện: bản đồ bay tới chiến trường, rồi cảnh 3D hiện ra. Hiện có hai trận, Cannae (216 TCN) và hồ Trasimene (217 TCN). Khung chạy đúng nhưng trông như một ứng dụng văn phòng:

- `BattleViewer.tsx`: header (tên trận, ngày, hai phe, nút ẩn panel, nút đóng), cảnh ở giữa, panel 22,5 rem bên phải có hai tab ("Diễn biến": các giai đoạn và lời dẫn, `viewer/StoryPanel.tsx`; "Thông tin": khối quân, `viewer/InfoPanel.tsx`), thanh điều khiển ở đáy (`viewer/ControlBar.tsx`, `Scrubber.tsx`). Mọi phần nền phẳng, kẻ viền.
- `BattleScene.tsx`: lớp phủ trên cảnh: nút "Tên khối quân" và "Chất lượng" ở góc trên phải, lời nhắc cách điều khiển camera ở góc dưới trái, nhãn khối quân, thẻ thông tin khi bấm một khối, bảng số đo (chỉ khi bật).

Người dùng muốn giao diện đẹp hơn và giao cho lane này vì thế mạnh về giao diện.

Đọc trước: `CLAUDE.md`, `docs/ARCHITECTURE.md` (mục "Trận đánh 3D", phần khung xem trận), `docs/tasks/README.md`, rồi toàn bộ các file trong phạm vi.

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Khung xem kiểu điện ảnh

- Cảnh 3D chiếm toàn bộ khung xem. Header, thanh điều khiển và panel lời dẫn nằm **nổi trên cảnh** (nền bán trong suốt theo token, bo góc, bóng nhẹ), không còn là các dải chia màn hình.
- Khi trận đang phát và chuột đứng yên khoảng 3 giây, các lớp phủ mờ dần và nhường chỗ cho cảnh. Rê chuột, bấm phím, hay khi focus bàn phím nằm trong một lớp phủ thì chúng hiện lại ngay. Khi đang dừng thì không bao giờ ẩn.
- Panel lời dẫn vẫn đọc được trong lúc phát (đây là nội dung chính); bạn quyết nó có tự mờ hay không, nhưng phải có cách mở và đóng rõ ràng (nút đã có).
- Giữ đủ chức năng hiện có: tên trận, ngày, hai phe và màu phe, hai tab, chọn khối quân (bấm trên cảnh hoặc chọn trong danh sách), nút Tên khối quân, Chất lượng, lời nhắc lần đầu, nút đóng.
- Bàn phím giữ nguyên: Space phát/dừng, ← → sang giai đoạn, Esc đóng (hoặc đóng thẻ khối quân trước), Tab đi qua mọi nút theo thứ tự hợp lý, viền focus luôn thấy được.

### 2. Thẻ chương khi sang giai đoạn mới

- Khi trận đang phát và sang giai đoạn mới, hoặc khi người dùng bấm sang một giai đoạn (nút, phím ←/→, danh sách trong tab "Diễn biến"): hiện trên cảnh một thẻ lớn gồm số giai đoạn ("Giai đoạn 3/7"), tên giai đoạn và giờ (dùng `formatHour` có sẵn), giữ khoảng 3 giây rồi mờ đi.
- Không hiện liên tục khi người dùng đang kéo thanh tua; chỉ hiện khi dừng kéo ở một giai đoạn khác.
- Có `prefers-reduced-motion`: không trượt hay phóng, chỉ hiện và ẩn.
- Thẻ là trang trí: `aria-hidden`. Lời dẫn cho trình đọc màn hình đã có ở `StoryPanel` (`aria-live`), không đọc hai lần.

### 3. Dừng một lần cho người dùng xem

Khi có bản đầu chạy được: chụp ảnh rồi báo người dùng, chưa hoàn thiện tiếp. Ảnh đặt ở `E:\World_History_Platform_assets\duyet\T-063\`:

- Cannae: lúc vừa mở (đang dừng), lúc đang phát với lớp phủ hiện, lúc lớp phủ đã mờ, lúc thẻ chương đang hiện.
- Hồ Trasimene: lúc vừa mở.
- Mỗi ảnh ở cả chế độ sáng lẫn tối; khung 1646×926 (màn hình người dùng, tỉ lệ điểm ảnh 1,75) và 1280×800. Một ảnh ở bề ngang 390 px để thấy trang không vỡ.
- Ảnh trước khi sửa cho cùng các góc (từ `main`), đặt tên `…-A-truoc`, `…-B-sau`.

Người dùng có thể yêu cầu đổi hướng ở bước này.

## Ràng buộc

- **Hiệu năng.** Ở màn hình người dùng (2880×1620, phóng 175%) góc mở trận chỉ khoảng 47–53 khung/giây. Vì vậy:
  - Không dùng `backdrop-filter` (blur) cho lớp phủ nằm trên canvas: trình duyệt phải làm mờ lại cả vùng mỗi khung hình. Dùng nền bán trong suốt (ví dụ `bg-background/80`) và bóng.
  - Không làm React render lại theo từng khung hình. `battleTime` trong store đổi liên tục lúc phát; chỉ đăng ký những giá trị đổi hiếm (giai đoạn hiện tại, như `StoryPanel` làm với `phaseAt`). Bộ đếm "chuột đứng yên" dùng timer, không dùng vòng `requestAnimationFrame`.
  - Hoạt hình của lớp phủ chỉ dùng `opacity` và `transform`.
  - Phiên chính đo khung hình/giây khi review, trên màn hình người dùng. Chậm hơn `main` rõ rệt thì không gộp.
- **Giữ các thuộc tính `data-battle-*`** hiện có (`data-battle-viewer`, `data-battle-play`, `data-battle-close`, `data-battle-overlay`, `data-battle-card`, `data-battle-stats`, `data-battle-open` ở panel sự kiện). Script kiểm tra và đo của phiên chính dựa vào chúng.
- Màu chỉ qua token (`bg-background`, `bg-surface`, `text-foreground`, `text-muted`, `border-line`, `text-accent`, `bg-accent`, `text-on-accent`, có thể kèm độ trong như `/80`). Đúng ở cả chế độ sáng lẫn tối. Cần token mới thì ghi đề nghị vào "Kết quả", phiên chính thêm vào `globals.css`.
- Mọi chữ người dùng thấy qua `useT()`, khoá `battle.*`, có cả `en` lẫn `vi`.
- Ưu tiên máy tính (từ 1280×800). Trên điện thoại chỉ cần không vỡ, không cuộn ngang ở 390 px; không làm tính năng riêng cho điện thoại.
- Không thêm thư viện. Cần thì ghi đề nghị.
- Không đổi hợp đồng `src/lib/battle.ts` hay store. Cần thì ghi đề nghị.

## Chạy thử

- `npm run dev -- -p 3300` (cổng 3000, 3105, 3106, 3201 có thể đang dùng), mở http://localhost:3300, chọn năm 216 TCN, bấm trận Cannae trong panel sự kiện rồi nút xem trận 3D. Trang `/battle-lab` (chỉ khi `next dev`) mở thẳng cảnh, không có khung xem.
- Đặt `TUTOR_MOCK=1` khi chạy app.
- Máy người dùng ít RAM (thường còn 2–3 GB trống): chỉ chạy một server, tắt khi xong.

## Xong khi

- Người dùng đã xem ảnh ở bước 3 và duyệt hướng; các ý người dùng nêu đã sửa.
- `npm run lint`, `npm run validate`, `npm run build` qua.
- Mục "Kết quả" ghi: đã làm gì, kiểm tra thế nào, ảnh ở đâu, các đề nghị ngoài phạm vi.

## Review lượt 1 (phiên chính, 2026-11-23)

Bản đầu (tới `1a77bee`) đúng phạm vi, gộp với `main` không xung đột, lint, validate, build qua. Lớp phủ tự mờ dùng timer, thẻ chương chỉ đổi khi sang giai đoạn, không có `backdrop-filter`, nhãn trên cảnh tránh được lớp phủ mới nhờ `data-battle-overlay`. Hình ảnh đẹp. Có hai vấn đề:

1. **Khung hình/giây giảm khoảng 15%.** Đo ở màn hình người dùng (1646×926 CSS, tỉ lệ điểm ảnh 1,75), hai bản production, hai vòng xen kẽ, không có Godot hay Blender (`main-tools/perf/fps-servers-ab.sh`):

   | Góc | `main` | nhánh |
   |---|---|---|
   | Mở trận Cannae, đang dừng | 59,7 / 50,2 | 49,7 / 44,3 |
   | Giai đoạn 5 đang phát | 38,3 / 40,0 | 31,3 / 30,2 |
   | Giai đoạn 6 đang phát | 38,9 / 38,9 | 34,8 / 30,2 |
   | Camera 40 m | 42,0 / 40,9 | 35,9 / 34,3 |
   | Camera 110 m | 39,1 / 39,4 | 35,7 / 34,7 |

   Nguyên nhân: canvas giờ phủ cả khung xem, nhiều hơn khoảng 46% điểm ảnh, kể cả phần nằm dưới panel. Lỗi ở cách viết task (yêu cầu "cảnh chiếm toàn bộ khung xem"), không ở code.
2. **Panel che một phần trận.** Góc mở trận căn theo cả canvas, nên ở hồ Trasimene đầu đoàn quân và quân của Hannibal (bộ binh Libya, Iberia, núi Gualandro) nằm dưới panel và nhãn của họ bị ẩn (`duyet\T-063\so-sanh\05-…`). Ở Cannae kỵ binh đồng minh cánh phải sát mép panel.

**Người dùng chọn: panel nằm cạnh cảnh.**

### Yêu cầu lượt 2

1. **Trên máy tính, khi panel mở:** canvas (khung chứa `BattleScene`) chỉ chiếm phần bên trái panel; phía sau panel không có cảnh 3D. Panel có thể giữ dáng thẻ bo góc hay neo sát mép phải, tuỳ bạn, nhưng nền sau nó là `bg-background`, không phải cảnh. Header và thanh điều khiển vẫn nổi trên phần cảnh và tự mờ như bản đầu. **Khi panel đóng:** cảnh tràn cả khung xem như bản đầu.
2. **Không làm hoạt hình độ rộng của canvas** khi mở hay đóng panel. Engine đổi cỡ renderer mỗi lần khung chứa đổi cỡ (`ResizeObserver` trong `BattleEngine`), nên trượt độ rộng sẽ dựng lại bộ đệm mỗi khung hình. Đổi cỡ một lần; muốn mượt thì chỉ cho panel hiện dần bằng `opacity`/`transform`.
3. Góc mở trận phải thấy được đầu đoàn quân và quân của Hannibal ở hồ Trasimene khi panel mở. Nếu canvas đã đúng cỡ thì góc mở tự đúng như `main`; không sửa `engine/`.
4. Chữ lời dẫn trở lại `text-sm` (14 px) như `main`; bản đầu hạ còn 13,5 px.
5. Tuỳ chọn, nếu gọn: khi lớp phủ đã mờ hẳn, nhãn trên cảnh không cần tránh chỗ đó nữa (hiện các vùng `data-battle-overlay` vẫn được đo dù đã mờ, nên nhãn gần header và thanh điều khiển bị ẩn vô ích). Không được làm hỏng việc chờ cảnh sẵn sàng: lúc mở trận các lớp phủ vẫn có thuộc tính này.
6. Ghi vào "Kết quả" độ rộng canvas khi panel mở và khi đóng ở 1646×926 (`canvas.clientWidth` so với `innerWidth`).
7. Chụp lại 01, 02, 03 và 05 ở 1646×926, sáng và tối, đặt tên `…-C-luot2.png` cùng thư mục, rồi dừng và báo người dùng. Phiên chính đo lại khung hình sau lượt 2.

## Kết quả

### Đã làm

- **Khung xem trận kiểu điện ảnh và lớp phủ tự mờ** (`src/components/battle/BattleViewer.tsx`, `BattleViewerLoading.tsx`, `BattleScene.tsx`, `viewer/useIdleChrome.ts`, `viewer/ControlBar.tsx`, `viewer/Scrubber.tsx`, `viewer/StoryPanel.tsx`, `viewer/InfoPanel.tsx`):
  - **Lượt 1:** đưa header (tên trận, ngày, hai phe kèm chấm màu), nút ẩn/hiện panel, nút đóng, nút `Tên khối quân` / `Chất lượng`, gợi ý camera và thanh điều khiển thành các lớp phủ nổi bán trong suốt theo token (`bg-background/88`), bo góc, bóng nhẹ, không dùng `backdrop-filter`. Thêm `useIdleChrome` dùng `setTimeout` (không `requestAnimationFrame`) tự mờ lớp phủ nổi sau 3 giây chuột đứng yên lúc đang phát; rê chuột, bấm phím, dừng phát hoặc focus bàn phím (`:focus-visible`) trong lớp phủ/panel thì hiện lại ngay. Chỉ gắn `data-battle-overlay` cho lớp phủ khung xem sau khi `BattleScene` báo `onSceneReady` để tương thích `drive.mjs`.
  - **Lượt 2 (theo Review lượt 1):**
    1. Trên máy tính (`lg:` trở lên), khi panel mở, khung chứa cảnh (`BattleScene`) nằm bên trái panel (`lg:flex-row`, panel `lg:w-[22.5rem]` nằm trên nền `bg-background`, không có cảnh 3D phía sau). Header và thanh điều khiển nổi trong vùng cảnh và tự mờ khi phát; đóng panel thì cảnh tràn toàn khung xem. Dùng container query (`@container/stage`) cho biển tiêu đề để không chồng lên cụm nút góc trên phải ở 1280×800 khi panel mở.
    2. Không làm hoạt hình độ rộng canvas khi mở/đóng panel (`lg:hidden`), nên `BattleEngine` chỉ đổi cỡ renderer một lần.
    3. Góc mở trận hồ Trasimene khi panel mở hiện đủ núi Gualandro, lối hẹp Malpasso, trại của Hannibal, đầu đoàn quân La Mã và bộ binh Libya, Iberia của Hannibal (không sửa `engine/`).
    4. Trả cỡ chữ lời dẫn trong `StoryPanel` về `text-sm` (14 px).
    5. Khi lớp phủ nổi đã mờ hẳn trên máy tính (`data-battle-overlay-hidden`), `measureOverlays` trong `BattleScene.tsx` bỏ qua các vùng đó để nhãn gần header và thanh điều khiển không bị ẩn vô ích; lúc mở trận thuộc tính `data-battle-overlay` vẫn giữ nguyên.
- **Thẻ chương khi sang giai đoạn mới** (`src/components/battle/viewer/ChapterCard.tsx`, `viewer/Scrubber.tsx`):
  - Chỉ đăng ký chỉ số giai đoạn (`phaseAt`), hiện thẻ lớn (`aria-hidden="true"`) gồm số giai đoạn, khung giờ (`formatHour`) và tên giai đoạn trong 3 giây rồi mờ đi khi sang giai đoạn trong lúc phát hoặc khi bấm chuyển giai đoạn (nút, phím `←`/`→`, danh sách lời dẫn).
  - Chặn nháy thẻ liên tục khi đang kéo thanh tua; chỉ hiện khi thả chuột ở giai đoạn khác.
  - Hỗ trợ `prefers-reduced-motion` (`motion-reduce:transition-none motion-reduce:transform-none`).

### Độ rộng canvas ở 1646×926 (tỉ lệ điểm ảnh 1,75)

- **Khi panel mở:** `canvas.clientWidth = 1286` px, `canvas.clientHeight = 926` px (`window.innerWidth = 1646` px; panel rộng 360 px = `22.5rem`).
- **Khi panel đóng:** `canvas.clientWidth = 1646` px, `canvas.clientHeight = 926` px (`window.innerWidth = 1646` px, tràn toàn khung xem).

### Kiểm tra

- `npm run lint`, `npm run validate`, `npm run build`: qua sạch.
- Kiểm tra trên bản production bằng Chrome headless (GPU D3D11):
  - Số phần tử dùng `backdrop-filter` trong khung xem: `0`.
  - Cỡ chữ lời dẫn (`StoryPanel`): `14px` (`text-sm`).
  - Ở 1280×800 khi panel mở: `canvas.clientWidth = 920` px, khoảng trống giữa biển tiêu đề và cụm nút `Tên khối quân` / `Chất lượng` là `191` px, không chồng lấn.
  - Tự mờ khi phát sau >3 giây (`header` `opacity: 0`, 6 lớp phủ đánh dấu `data-battle-overlay-hidden` nhường chỗ cho nhãn cảnh); rê chuột hoặc bấm `Space` hiện lại ngay (`opacity: 1`); `Tab` giữ focus bàn phím giữ lớp phủ hiện.
  - Kéo thanh tua qua nhiều giai đoạn: ẩn trong lúc kéo, hiện thẻ chương ngay khi thả ở giai đoạn mới.
  - Ở bề ngang 390 px: không vỡ bố cục, `scrollWidth <= innerWidth` (không cuộn ngang).
- Đã tắt server local sau khi kiểm tra.

### Ảnh duyệt

Đặt tại `E:\World_History_Platform_assets\duyet\T-063\`:
- Lượt 1: 22 cặp `…-A-truoc.png` (từ `main`) và `…-B-sau.png` (Cannae 01–04, Hồ Trasimene 05 ở 1280×800 và 1646×926 sáng/tối; 390 px sáng/tối).
- Lượt 2: 8 ảnh `…-C-luot2.png` ở 1646×926 (tỉ lệ điểm ảnh 1,75), sáng và tối:
  - `01-cannae-mo-1646x926-{sang,toi}-C-luot2.png`
  - `02-cannae-phat-hien-1646x926-{sang,toi}-C-luot2.png`
  - `03-cannae-phat-mo-1646x926-{sang,toi}-C-luot2.png`
  - `05-trasimene-mo-1646x926-{sang,toi}-C-luot2.png`

### Đề nghị ngoài phạm vi

Không có. Mọi phần đều dùng token, thư viện và hợp đồng sẵn có.

## Review lượt 2 (phiên chính, 2026-11-23)

Đạt đủ 7 yêu cầu của lượt 2. Lint, validate, build qua; hồi quy lõi (`main-tools/reg-core.js`) qua 17/17 mục, không lỗi console. Góc mở trận hồ Trasimene giống hệt `main`. Một điểm nhỏ: nhãn "Núi Gualandro" lúc mở trận bị biển tiêu đề che (cách tránh lớp phủ ẩn nó đi), không phải "hiện đủ" như mục Kết quả ghi.

Khung hình ở cửa sổ thật của người dùng (1646×830, tỉ lệ điểm ảnh 1,75), hai bản production, chỉ tính các lần đo không có Blender chạy:

| Cảnh | `main` | Lượt 2 |
|---|---|---|
| Góc mở trận, đang dừng (trung vị 3 lần) | 60,3 | 49,8 |
| Giai đoạn 5 đang phát | 35,8 | 33,4 |
| Giai đoạn 6 đang phát | 35,6 | 34,7 |
| Nhìn gần 40 m / 110 m | 40,5 / 40,7 | 40,4 / 40,7 |

Phần chậm còn lại do header và thanh điều khiển nổi trên cảnh: canvas 1286×830 thay vì 1286×708 của `main` (thêm khoảng 17% điểm ảnh). `main` ở góc mở chạm trần 60 khung/giây nên chênh thật có thể khác. Người dùng được hỏi ba hướng (gộp; thanh điều khiển xuống dưới cảnh; cả hai ra ngoài cảnh) và chọn **gộp nguyên bản lượt 2**. Gộp vào `main` ngày 2026-11-23.
