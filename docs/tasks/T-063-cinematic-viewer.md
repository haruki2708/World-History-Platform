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

## Kết quả

(Lane điền.)
