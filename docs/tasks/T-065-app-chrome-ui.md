# T-065: Làm đẹp trục thời gian, header và hộp thoại, chú giải và nút bản đồ

- **Lane:** Gemini Neon. **Mượn vùng của lane 1 và lane 2 cho riêng task này** (người dùng chọn 2026-11-24). Lane 1 và lane 2 không sửa các file trong phạm vi dưới đây cho tới khi task được gộp; gộp xong, vùng trả về chủ cũ.
- **Nhánh:** `gemini/T-065-app-chrome-ui` (phiên chính đã tạo sẵn từ `main` trong worktree `E:\World_History_Platform_lanes\lane-gemini-neon`).
- **Phạm vi file:**
  - Trục thời gian (lane 1): `src/components/timeline/TimelineBar.tsx`, `TimelineTrack.tsx`, `PlaybackControls.tsx`.
  - Header và hộp thoại (lane 1): `src/components/shell/HeaderActions.tsx`, `FirstVisitHint.tsx`, `ShareButton.tsx`, `Modal.tsx`, `AboutDialog.tsx`, `ShortcutsHelp.tsx`; `src/components/LocaleSwitch.tsx`; trong `src/components/AppShell.tsx` chỉ thẻ `<header>` và thẻ `<footer>` bọc trục thời gian.
  - Bản đồ (lane 2): `src/components/map/MapLegend.tsx`, `MapControls.tsx`, `EventMarkers.tsx` (chấm sự kiện và thẻ tên nổi trên chấm), `eventDot.ts`.
  - Khoá mới trong `src/lib/i18n/messages.ts` với tiền tố `timeline.*`, `about.*`, `shortcuts.*`, `share.*`, `app.*`, `locale.*`, `map.*` (cả `en` lẫn `vi`).
- **Không sửa:**
  - Logic trục thời gian: `timeline/layout.ts`, `usePlayback.ts`, `useElementWidth.ts`.
  - Logic vỏ app: `shell/keyboard.ts`, `UrlSync.tsx`, `urlState.ts`, `locale.ts`, `aboutSeen.ts`.
  - Phần còn lại của bản đồ: `MapView.tsx`, `labels/`, `useTerritories.ts`, `mapStyle.ts`, `theme.ts`, chuyến bay tới trận, `public/map/`.
  - `src/app/globals.css` (giữ nguyên token màu, kể cả màu bản đồ, và font), `src/store/`, `src/lib/` (trừ `messages.ts`), panel sự kiện và gia sư (vừa xong ở T-064), `src/components/battle/`.

## Bối cảnh

Người dùng muốn làm đẹp tiếp giao diện app chính (2026-11-24), sau khung xem trận (T-063) và panel sự kiện, gia sư (T-064). Ba phần còn lại vẫn mang kiểu cũ: viền mảnh, bo góc nhỏ, ít phân tầng. Ảnh hiện trạng ở cửa sổ thật của người dùng (1646×830, tỉ lệ điểm ảnh 1,75): `E:\World_History_Platform_assets\duyet\T-064\sau-sua\1-cannae-1646-sang.jpg` và `2-cannae-1646-toi.jpg`.

Người dùng chọn:
- Làm cả ba phần; lane Gemini Neon làm hết để đồng bộ một tay.
- **Làm thẳng một bản** theo phong cách đã chốt ở T-063 và T-064, rồi dừng cho người dùng xem ảnh trước/sau. Không làm nhiều phương án.
- Giữ token màu và font (đã chốt ở T-064).

**Phong cách đã chốt** (xem `SidePanel.tsx`, `EventDetailCard.tsx`, `battle/BattleViewer.tsx`, `battle/viewer/ControlBar.tsx`): khối bo góc `rounded-xl`/`rounded-2xl`, viền `border-line/80`, nền `bg-surface` nhiều mức đậm nhạt, tab dạng viên trong khay `bg-surface/85`, nút chính đỏ La Mã, chữ phân tầng rõ (tiêu đề đậm, phụ đề `text-muted` cỡ nhỏ), số năm `tabular-nums`.

## Yêu cầu

### 1. Trục thời gian

Hiện có: nút phát, năm đang xem kèm tên sự kiện đang chọn, ô chọn tốc độ, dãy chấm sự kiện xếp tối đa 4 làn (cụm "+n" khi chật), vạch và nhãn năm, tay nắm kéo năm.

- Làm lại phần nhìn cho hợp phong cách: cụm điều khiển (phát, năm, tốc độ), chấm sự kiện (phân biệt rõ mức quan trọng, sự kiện đang diễn ra, sự kiện đang chọn, sự kiện kéo dài nhiều năm), tay nắm, vạch năm.
- Năm đang xem là thông tin chính của cả app: phải nổi bật nhất trên thanh.
- **Không cao hơn hiện tại.** Đo chiều cao `<footer>` ở 1646×830 trước và sau, ghi vào Kết quả. Thấp hơn được thì tốt, vì bản đồ đang thiếu chỗ.
- Giữ nguyên hành vi: kéo và bấm trên thanh để đổi năm; `←`/`→`, `Shift`+`←`/`→`, `Home`/`End`, `Space`; bấm chấm để chọn sự kiện; focus bàn phím đi qua các chấm; thuộc tính `data-key` trên chấm; cụm "+n". Cách xếp làn và gộp cụm nằm trong `layout.ts`, không sửa; nếu cần đổi hằng số ở đó thì ghi đề nghị vào Kết quả.
- Lúc đang phát, năm đổi 10 lần mỗi giây trở lên: không thêm hiệu ứng làm cả thanh vẽ lại nặng hơn. Chuyển động chỉ dùng `opacity` và `transform`.

### 2. Header và hộp thoại

- Header: tên app và phụ đề, lời nhắc lần đầu, Giới thiệu, Phím tắt, Chia sẻ, chọn ngôn ngữ. Làm cho gọn và có phân tầng: việc chính (Chia sẻ, ngôn ngữ) rõ hơn việc phụ. **Không cao hơn hiện tại**; ở 1280×800 vẫn một hàng, ở cả hai ngôn ngữ, kể cả khi lời nhắc lần đầu đang hiện.
- Hộp thoại Giới thiệu và Phím tắt (`Modal.tsx` dùng chung): khung, tiêu đề, nút đóng, các mục, phím (`kbd`), danh sách ghi công. Hộp thoại Giới thiệu dài: phải dễ lướt (tiêu đề mục rõ, khoảng cách đều).
- Giữ nguyên: nội dung chữ (ghi công là bắt buộc theo giấy phép, không bỏ mục nào); `Esc` đóng; focus bị giữ trong hộp thoại và trả về nút đã mở; `data-autofocus`; thông báo "đã chép link" của nút Chia sẻ; lời nhắc lần đầu biến mất sau khi mở Giới thiệu hoặc bấm đóng.

### 3. Chú giải và nút bản đồ

- **Chú giải đang che khoảng 18% bản đồ** ở 1646×830 (cỡ 225×580 px trên vùng bản đồ khoảng 1230×580). Làm lại để khi mở, nó che **không quá khoảng 12%** mà vẫn đủ: danh sách thế lực của mốc biên giới đang xem kèm ô màu, dòng "Biên giới vào năm …", ba kiểu chấm sự kiện, dòng ghi công. Được cuộn bên trong, xếp hai cột, hay gom phần phụ lại; lane tự chọn cách. Dòng ghi công (Cliopatria, Natural Earth) phải thấy được mỗi khi chú giải mở, không nằm trong vùng phải cuộn mới thấy.
- Vẫn thu gọn được bằng một nút (`aria-expanded`), vẫn mặc định mở từ 1024 px và đóng ở màn hẹp.
- Nút phóng to, thu nhỏ, về vị trí: cùng phong cách.
- Thẻ tên nổi trên chấm sự kiện (tên và năm) và ba kiểu chấm: cùng phong cách. Ô màu trong chú giải phải khớp màu thật trên bản đồ như hiện nay.
- **Bắt buộc giữ:** `MapLegend` và `MapControls` nhận `ref` và gắn vào **khối ngoài cùng** của mình. Nhãn tên thế lực trên bản đồ đo hai khối đó để né (`labels/TerritoryLabels.tsx`, có `ResizeObserver`); mất `ref` hay bọc thêm khối lớn hơn bên ngoài thì nhãn sẽ chui xuống dưới chú giải. Kiểm lại sau khi làm: ở mốc 218 TCN và 133 TCN, không nhãn nào nằm dưới chú giải hay cụm nút.
- Không dùng `backdrop-filter` trên bản đồ.

## Dừng cho người dùng xem

Làm xong cả ba phần thì dừng. Commit riêng từng phần (ba commit trở lên) để phiên chính có thể gộp từng phần nếu người dùng chỉ duyệt một số.

**Ảnh duyệt** đặt ở `E:\World_History_Platform_assets\duyet\T-065\`, tên `<số>-<cảnh>-<sang|toi>-<truoc|sau>` (`truoc` chụp từ `main`). Chụp với `TUTOR_MOCK=1`, URL gốc `/?year=-216&event=battle-of-cannae&lang=vi`. Luôn đặt rõ chế độ sáng hay tối khi chụp (Chrome không cửa sổ theo chế độ tối của Windows).

- `01-toan-trang`: 1646×830, tỉ lệ 1,75; sáng và tối.
- `02-phat`: trục thời gian lúc đang phát (không chọn sự kiện, `/?year=-150&lang=vi`); sáng.
- `03-gioi-thieu`, `04-phim-tat`: hai hộp thoại; sáng và tối.
- `05-chu-giai-dong`: chú giải thu gọn; sáng.
- `06-133`: `/?year=-133&lang=vi` (nhiều thế lực nhất), chú giải mở; sáng.
- `07-1280`: 1280×800, tỉ lệ 1; sáng. `08-1280-en`: như trên, tiếng Anh, lần ghé đầu (lời nhắc đang hiện).
- `09-390`: 390 px; sáng.

Ảnh PNG cỡ 2880×1452 có thể làm treo client DevTools; nếu treo thì chụp JPEG.

## Ràng buộc

- Màu dùng token trong `globals.css`, không viết mã màu trực tiếp (trừ màu thế lực lấy từ dữ liệu). Đúng ở cả sáng lẫn tối.
- Chuỗi mới qua `useT()`, đủ `en` và `vi`. Năm hiển thị qua `formatYear` / `formatYearRange`.
- Tôn trọng `prefers-reduced-motion`. Mọi nút có nhãn cho trình đọc màn hình và viền focus thấy được.
- Bề ngang 390 px vẫn dùng được, không cuộn ngang. Không tinh chỉnh riêng cho điện thoại.
- Không thêm thư viện, không đổi store hay hợp đồng. Cần thì ghi đề nghị vào mục "Kết quả".
- Đọc hướng dẫn trong `node_modules/next/dist/docs/` trước khi viết code Next.js.

## Chạy thử

- Một dev server duy nhất: `npm run dev -- -p 3300` với `TUTOR_MOCK=1`; tắt khi xong. Không tắt server của phiên khác (3000, 3105, 3106, 32xx).
- Máy người dùng ít RAM: không chạy hai bản build cùng lúc.

## Xong khi

- `npm run lint` và `npm run build` qua.
- Đủ ảnh trước/sau; mục "Kết quả" ghi: đã làm gì ở từng phần, chiều cao header và footer trước/sau, phần trăm bản đồ bị chú giải che trước/sau ở 1646×830, kết quả kiểm nhãn né chú giải; đã commit; dừng và báo người dùng.

## Kết quả

(Lane điền.)
