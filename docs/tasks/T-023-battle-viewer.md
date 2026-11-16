# T-023: Khung xem trận trong app chính

- **Lane:** 3
- **Model đề xuất:** Fable 5.2, effort `high`. Hết hạn mức thì dùng Opus 5.5, effort `xhigh`.
- **Nhánh:** `lane3/T-023-battle-viewer` (tạo từ `main` mới nhất)
- **Phạm vi file:**
  - `src/components/battle/`;
  - khoá `battle.*` trong `src/lib/i18n/messages.ts`, cả `en` lẫn `vi`;
  - **ngoại lệ chỉ cho task này** (lane 1 đang làm Blender nên không đụng tới):
    - `src/components/AppShell.tsx`: chỉ thêm phần nạp `BattleViewer`;
    - `src/components/panel/EventListItem.tsx`: chỉ thêm nút xem trận.

## Bối cảnh

Đợt A và T-018 đã gộp: cảnh 3D chạy tốt ở `/battle-lab`. Người dùng duyệt **bắt đầu đợt C**: đưa trận đánh vào app chính. Task này làm phần lớn nhất, **khung xem trận**:

1. Chọn trận Cannae trong panel sự kiện thì có nút xem trận 3D.
2. Bấm nút thì khung xem trận phủ kín trang: cảnh 3D, lời dẫn, nút điều khiển, thông tin hai bên, nguồn và ghi công.
3. Đóng khung thì về lại bản đồ, đúng chỗ cũ.

Để sau, không làm trong task này:
- chuyển cảnh từ bản đồ vào trận (bay tới `origin`): việc của lane 2 sau T-020;
- ghi công trong hộp thoại Giới thiệu;
- link chia sẻ mở thẳng vào trận.

Trong lúc bạn làm: lane 1 làm 6 mô hình bộ binh (T-021), lane 2 làm ngựa và chỉnh dữ liệu Cannae (T-020).

## Đọc trước

- `docs/ARCHITECTURE.md`:
  - mục "Trạng thái chung": `battleId`, `openBattle`, `closeBattle`, `battleTime`, `setBattleTime` đã có trong store;
  - mục "Khung xem trận (đợt C)": **mới**, hợp đồng cho task này;
  - mục "Mô hình lính": độ dài vòng `walk`/`run`, cách phát `die`.
- `src/app/battle-lab/BattleLab.tsx`: trang thử hiện có, cách phát theo `playSeconds` của từng giai đoạn.
- `src/data/index.ts`: `hasBattle`, `loadBattle`, `unitTypes`, `getEvent`.
- `src/components/shell/keyboard.ts`: phím tắt chung tự đứng ngoài khi có `dialog[open]`.
- `docs/tasks/T-019-animations-hastatus.md`, mục "Kết quả", "Đề nghị ngoài phạm vi" ý 3.

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Nút xem trận

- Trong `EventListItem`, khi sự kiện **đang được chọn** và `hasBattle(event.id)`: hiện nút "View the battle in 3D" / "Xem trận đánh 3D" (khoá `battle.open`).
- Chi tiết sự kiện hiện nằm bên trong một `<button>`. **Không lồng nút trong nút**: đặt nút xem trận ngay dưới nút của mục, trong cùng `<li>`.
- Bấm thì gọi `openBattle(event.id)`.

### 2. Nạp khung xem trận

- `AppShell`: khi `battleId` khác `null` thì hiện `BattleViewer`, nạp bằng `next/dynamic` với `ssr: false`, như trang thử.
- **Trang chính không được tải three.js trước khi mở trận.** Kiểm tra như phiên chính làm ở T-015: chunk nào chứa `WebGLRenderer` thì không được có trong `.next/server/app/index.html`. Kiểm tra thêm danh sách request của trang trước khi bấm nút.

### 3. `BattleViewer`

**Khung:**
- Một `<dialog>` mở bằng `showModal()`, phủ kín cửa sổ. Tên cho trình đọc màn hình: tên sự kiện (`getEvent(id).title`).
- **Đóng:** Esc hoặc nút đóng gọi `closeBattle()`. Focus trở về nút xem trận. Bản đồ, năm và sự kiện đang chọn giữ nguyên.
- **Đang tải:** hiện trạng thái tải. Không tải được dữ liệu hay cảnh thì hiện lỗi kèm nút đóng.
- Không tự phát khi mở. Người dùng bấm phát.

**Thanh điều khiển:**
- Phát / dừng. Phát theo `playSeconds` của từng giai đoạn, như trang thử. Phát hết thì dừng ở cuối; bấm phát lại thì chạy từ đầu.
- Thanh tua có vạch ở mốc giữa các giai đoạn.
- Giờ trong ngày (`hourAt`), số giai đoạn và tiêu đề giai đoạn.
- Nút giai đoạn trước và sau: nhảy tới mốc đầu giai đoạn.
- Có thể thêm tốc độ phát (ví dụ 1× và 2×) nếu gọn.

**Lời dẫn:**
- Tiêu đề và lời dẫn của giai đoạn đang diễn ra (`phaseAt`), theo ngôn ngữ đang chọn. Đang phát thì đổi theo giai đoạn.
- Trên máy tính: khung bên, đủ rộng để đọc (khoảng 320–380 px), thu gọn được để xem cảnh rộng hơn.
- Phần còn lại của cảnh phải đủ rộng: kiểm tra góc nhìn mở (T-018) vẫn thấy cả hai chiến tuyến khi khung lời dẫn mở.

**Thông tin trận:** trong khung bên, có thể là một tab hay phần mở rộng.
- Ngày (`battle.date`).
- Mỗi bên:
  - tên và màu phe (lấy từ `polities.json` qua `polityId`, như cảnh);
  - chỉ huy;
  - quân số và thương vong. Đây là `NumberRange`: hiện khoảng số (một số nếu `min` bằng `max`), kèm `note` nếu có.
- `uncertainty`: những gì còn tranh cãi.
- Nguồn: `battle.sources` và `terrain.sources`, có link.

**Ghi công:** trong khung xem trận, ví dụ cuối phần thông tin.
- Mô hình lính: dựa trên mô hình của Andywoodhead (Sketchfab, CC BY 4.0), đã sửa; hoạt hình từ thư viện của Quaternius (CC0). Lấy câu gợi ý ở cuối mục `roman-legionary` trong `art/CREDITS.md`.
- Địa hình Copernicus: câu ghi công và câu miễn trách nhiệm **đúng như README**, mục "Data credits". Giấy phép bắt buộc giữ hai câu này.
- Chuỗi tiếng Việt dịch được, nhưng tên tác phẩm, tên tác giả và câu ghi công Copernicus giữ nguyên tiếng Anh.

**Phím:**
- Space: phát / dừng. ← / →: giai đoạn trước / sau. Esc: đóng.
- Không lấy phím khi focus đang ở chỗ tự xử lý phím đó: thanh tua (mũi tên), nút (Space), ô nhập.
- Ghi các phím này trong khung (ví dụ dòng gợi ý), không cần sửa hộp thoại phím tắt của lane 1.

**Bố cục:**
- Ưu tiên máy tính (từ 1280×800). Ở 390 px chỉ cần dùng được: lời dẫn xuống dưới cảnh, không cuộn ngang.
- Đúng cả chế độ sáng lẫn tối, chỉ dùng token màu.
- Nhãn địa danh của cảnh phải tránh các lớp phủ của khung (thanh điều khiển, khung bên, nút), như lane 2 đã làm cho chú giải bản đồ ở T-017.

**Bộ nhớ:** mở rồi đóng 10 lần liền. Không rò context WebGL hay bộ nhớ: đo JS heap và số context, so lần 1 với lần 10.

### 4. Sửa trong cảnh (đề nghị của lane 1 ở T-019)

- **Tốc độ bước chân:** chỉnh tốc độ phát `walk` và `run` theo tốc độ di chuyển của khối quân, để chân không trượt. Số liệu ở `docs/ARCHITECTURE.md`, công thức ở `art/README.md`, mục "Thư viện hoạt hình". Chọn `walk` hay `run` theo tốc độ, ghi ngưỡng.
- **`die`:** phát một lần rồi giữ khung cuối. Kiểm tra engine hiện làm gì và sửa nếu cần.
- Xem hastati (mô hình `roman-hastatus`, hai cây *pilum*) và mọi clip ở cự ly gần. Ghi những gì trông sai cho lane 1.

## Ràng buộc

- Không sửa store, `src/lib/`, `src/data/`, `src/app/`. Cần đổi thì ghi đề nghị vào "Kết quả".
- Không import component của lane khác. Ở `AppShell` và `EventListItem`, chỉ thêm đúng phần nêu trên.
- Không thêm thư viện npm.
- Không sửa `public/battles/models/`. Thử mô hình thì làm như T-018 rồi trả về như cũ.

## Xong khi

- Từ `/?year=-216&event=battle-of-cannae`: bấm nút xem trận, xem cả 6 giai đoạn có lời dẫn, đóng bằng Esc và bằng nút, về đúng chỗ cũ. Làm được ở cả tiếng Anh lẫn tiếng Việt.
- Trang chính không tải three.js trước khi mở trận.
- Mở đóng 10 lần không rò bộ nhớ.
- Bước chân khớp tốc độ đi; lính ngã nằm yên.
- `npm run lint`, `npm run build`, `npm run validate` qua.
- Ảnh chụp (ngoài repo): khung mở ở 1280×800 tiếng Anh nền sáng và tiếng Việt nền tối, lúc đang phát, phần thông tin trận, bề ngang 390 px.

## Kết quả

_(Đang làm, khoảng 80%. Ghi chú tiến độ dưới đây để phiên sau làm tiếp; khi xong sẽ thay bằng bản kết quả đầy đủ.)_

### Tiến độ tính đến 2026-11-17

**Đã xong và đã commit** (nhánh `lane3/T-023-battle-viewer`, 3 commit "T-023 step 1–3"):

1. **Nút xem trận** trong `EventListItem` (khoá `battle.open`, thuộc tính `data-battle-open`). Nút nằm trong một khối `sticky bottom-0`, vì ở 1280×800 phần tóm tắt dài hơn danh sách nên nút bị khuất nếu không dính đáy.
2. **`AppShell`** nạp `BattleViewer` bằng `next/dynamic` (`ssr: false`), có `BattleViewerLoading` trong lúc tải.
3. **`BattleViewer`** (`src/components/battle/BattleViewer.tsx` và `viewer/`): `<dialog>` `showModal()` phủ kín, thanh điều khiển (phát/dừng, giai đoạn trước/sau, thanh tua tự dựng có vạch, giờ, tốc độ 1×/2×), tab Lời dẫn (danh sách 6 giai đoạn, bấm để nhảy) và tab Thông tin trận (ngày, hai bên, quân số, thương vong, điểm chưa chắc, nguồn, ghi công), phím Space, ←/→, Esc. Đã thử bằng Chrome không cửa sổ: mở, phát, dừng, chuyển giai đoạn, bấm vào cảnh rồi Space, mũi tên trên tab, đóng bằng Esc và bằng nút, focus về nút xem trận, địa chỉ và vị trí cuộn giữ nguyên.
4. **Bước chân:** `walk`/`run` chạy theo quãng đường từng hình lính đi được (không theo đồng hồ). Sải chân đo từ chính clip khi nạp mô hình (`plantedStride` trong `engine/figures/model.ts`). Chọn đứng/đi/chạy theo tốc độ đo được của khối, ngưỡng ghi ở đầu `engine/units.ts`. Kiểm bằng `s-planted.mjs`: chân trụ lệch 0–2,5% khi chạy, 2% ở pha bàn chân đặt phẳng khi đi.
5. **`die`:** phát một lần, giữ khung cuối, lính ngã nằm lại đến hết trận (trước đây chìm xuống đất sau 5 giây). Cuối trận: 3.067 hình đứng, 3.743 hình nằm.
6. **Nhãn địa danh tránh lớp phủ:** `labelLayout` nhận vật cản; cảnh đo mọi phần tử có `data-battle-overlay`. Quét 144 góc nhìn: 0 lần đè.
7. **Bộ nhớ** (bản dev): mở đóng 10 lần, heap sau GC 23,6 MB ở lần 1 và 25,1 MB ở lần 10; chỉ còn 1 context WebGL sống (của bản đồ) sau mỗi lần đóng.

**Còn lại:**

1. Ảnh chụp theo yêu cầu: `s-shots.mjs` đang lỗi ở dòng 23 (bấm nút Phát sau khi bấm "Giai đoạn sau"), chưa tìm nguyên nhân. Cần xem cả nền sáng, tiếng Việt và bề ngang 390 px (chưa nhìn lần nào).
2. Đo hiệu năng lúc máy sạch. Lần đo đầu: 144,7 khung hình/giây khi đứng yên (sạch); các số đang phát 60–68 đo lúc `blender.exe` của lane khác chạy, phải đo lại (`s-perf.mjs`).
3. Bản production: `npm run build`, kiểm chunk chứa `WebGLRenderer` không có trong `.next/server/app/index.html`, và danh sách request của trang trước khi bấm nút.
4. `npm run lint`, `npm run build`, `npm run validate`.
5. Viết mục "Kết quả" đầy đủ, kèm ghi chú cho lane 1 và các đề nghị bên dưới.

**Phát hiện cần báo (đưa vào bản kết quả):**

- **Số sải chân trong `docs/ARCHITECTURE.md` và `art/README.md` sai.** Đo trên clip đã bake: bàn chân trụ của `walk` lùi 0,98 m/s, tức một vòng 1,333 s đi 1,31 m (tài liệu ghi 1,00 m); của `run` lùi 5,9 m/s, một vòng 0,933 s đi 5,5 m (tài liệu ghi 1,99 m). Số của lane 1 chỉ cộng quãng trượt lúc chân chạm đất, bỏ pha hai chân rời đất. Cảnh tự đo nên không phụ thuộc số trong tài liệu.
- Clip `run` thực chất là chạy nước rút (5,9 m/s ở cỡ người thật), không phải chạy chậm.
- Clip `walk`: quanh lúc gót chạm đất và mũi chân rời đất (khung 0–4 và 20–24) bàn chân không lùi theo mặt đất, trượt khoảng 32% trong các khung đó.
- Dữ liệu Cannae: giai đoạn 1 mọi đơn vị có `action: "stand"` dù đi 0,6–5 km. Cảnh giờ chọn clip theo tốc độ thật nên vẫn đi/chạy.
- Các khối đi nhanh hơn 26,6 m/s trên màn hình (ví dụ lúc dàn trận) thì chân vẫn trượt: trận 11,5 giờ được phát trong khoảng 140 giây.
- Hastati đánh bằng kiếm trong khi tay trái vẫn cầm hai cây *pilum*; chưa có clip phóng *pilum*.
- Ghi công trong khung mới có dòng cho hai mô hình La Mã (`viewer/credits.ts`); thêm mô hình ở T-021 thì phải thêm dòng.

**Công cụ thử** (ngoài repo): `E:\World_History_Platform_assets\T-023\tools\`, chạy `GPU=1 node drive.mjs <kịch bản>.mjs`. Kịch bản: `s-open` (luồng mở/đóng), `s-planted` (chân trụ), `s-stride` (bảng từng khung của clip), `s-labels`, `s-fallen`, `s-close`, `s-attack`, `s-memory`, `s-perf`, `s-shots`. Ảnh ở `E:\World_History_Platform_assets\T-023\shots\`. Dev server: `TUTOR_MOCK=1 npx next dev -p 3103`.
