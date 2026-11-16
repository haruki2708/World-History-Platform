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

Lane 3 làm bước 1–3 (3 commit "T-023 step 1–3") rồi hết hạn mức ở khoảng 80%. Phiên chính làm nốt theo yêu cầu của người dùng: kiểm tra bản production, đo hiệu năng và bộ nhớ, xem ảnh chụp, sửa một lỗi nhỏ ở bề ngang 390 px, viết mục này.

**Tóm tắt:** xong. Từ `/?year=-216&event=battle-of-cannae`, bấm "View the battle in 3D" mở khung xem trận phủ kín trang: cảnh 3D, thanh điều khiển, lời dẫn từng giai đoạn, thông tin hai bên, nguồn và ghi công. Đóng bằng Esc hay nút thì về đúng chỗ cũ. Trang chính không tải three.js trước khi mở trận. Mở đóng 10 lần không rò bộ nhớ. Lính bước theo quãng đường đi được, ngã thì nằm lại. `npm run lint`, `npm run build`, `npm run validate` qua.

### Đã làm

1. **Nút xem trận** trong `EventListItem`:
   - hiện khi sự kiện đang chọn có trận (`hasBattle`); khoá `battle.open`; thuộc tính `data-battle-open`;
   - nằm ngoài nút của mục, trong cùng `<li>`;
   - nằm trong một khối `sticky bottom-0`: ở 1280×800 phần tóm tắt dài hơn danh sách, nên nếu không dính đáy thì nút bị khuất.
2. **`AppShell`** nạp `BattleViewer` bằng `next/dynamic` (`ssr: false`) khi `battleId` khác `null`, và hiện `BattleViewerLoading` trong lúc tải code.
3. **`BattleViewer`** (`src/components/battle/BattleViewer.tsx` và `src/components/battle/viewer/`):
   - **Khung:**
     - `<dialog>` mở bằng `showModal()`, phủ kín; tên là tên sự kiện;
     - đang tải thì hiện trạng thái tải; lỗi thì hiện thông báo kèm nút đóng;
     - không tự phát; focus đầu tiên ở nút Phát.
   - **Thanh điều khiển** (`ControlBar`, `Scrubber`, `usePlayback`):
     - phát/dừng theo `playSeconds` từng giai đoạn; hết trận thì dừng ở cuối, bấm phát lại thì chạy từ đầu;
     - thanh tua tự dựng, có vạch ở mốc giai đoạn, vai trò `slider`, dùng được bằng phím;
     - giờ trong ngày, dòng "Giai đoạn 4/6 · tiêu đề";
     - nút giai đoạn trước/sau, tốc độ 1×/2×.
   - **Khung bên** rộng 360 px, thu gọn được bằng nút trên đầu khung. Có hai tab:
     - **Lời dẫn:** danh sách 6 giai đoạn. Giai đoạn đang diễn ra mở lời dẫn và tự cuộn tới. Bấm một giai đoạn để nhảy tới.
     - **Thông tin trận:** ngày; mỗi bên có màu phe, chỉ huy, quân số và thương vong (`NumberRange`, kèm `note`); điểm còn tranh cãi; nguồn trận và nguồn địa hình, có link; ghi công.
   - **Ghi công** (`viewer/credits.ts`):
     - mô hình lính dựa trên mô hình của Andywoodhead (CC BY 4.0), đã sửa; hoạt hình của Quaternius (CC0);
     - hai câu Copernicus đúng từng chữ như README, giữ tiếng Anh ở cả hai ngôn ngữ.
   - **Phím:**
     - Space phát/dừng; ←/→ giai đoạn trước/sau; Esc đóng;
     - không lấy phím khi focus ở thanh tua, nút, tab hay ô nhập;
     - dòng gợi ý phím nằm dưới thanh điều khiển, ẩn ở bề ngang hẹp.
   - Màu phe hiện ở đầu khung như chú giải. Chỉ dùng token màu.
4. **Bước chân** (`engine/units.ts`, `engine/figures/model.ts`):
   - `walk`/`run` chạy theo quãng đường từng hình lính đi được, không theo đồng hồ, nên chân không trượt.
   - Sải chân đo từ chính clip khi nạp mô hình (`plantedStride`), không lấy số trong tài liệu.
   - Chọn đứng, đi hay chạy theo tốc độ đo được của khối, không theo `action` trong dữ liệu. Ngưỡng ghi ở đầu `engine/units.ts` (ở `FIGURE_SCALE` 3):
     - đứng khi dưới 0,18 m/s, bắt đầu đi khi trên 0,36 m/s;
     - chạy khi trên 8,0 m/s, đi lại khi dưới 6,5 m/s.
   - Khối lùi mà vẫn quay mặt về địch thì bước lùi.
   - Khi tua hay kéo thanh tua, lính đứng yên, không bước.
   - Kiểm bằng `s-planted.mjs`: chân trụ lệch 0–2,5% khi chạy, khoảng 2% ở pha bàn chân đặt phẳng khi đi.
5. **`die`:** phát một lần rồi giữ khung cuối; lính ngã nằm lại đến hết trận (trước đây chìm xuống đất sau 5 giây). Cuối trận còn 3 067 hình đứng, 3 743 hình nằm.
6. **Nhãn địa danh tránh lớp phủ:** `labelLayout` nhận thêm vật cản; cảnh đo mọi phần tử có `data-battle-overlay` (thanh gợi ý, nút chất lượng...). Quét 144 góc nhìn: 0 lần đè.
7. **Sửa của phiên chính:** ở 390 px, chuyển từ tab Lời dẫn sang Thông tin trận thì tab mới mở ở vị trí cuộn cũ, vì lời dẫn tự cuộn tới giai đoạn đang phát; dòng "Ngày" bị cắt. Giờ mỗi tab có khung cuộn riêng (`key={tab}`).

### Kiểm tra

Chrome không cửa sổ, GPU RTX 3050 (`--use-angle=d3d11`), bản production (`next build` rồi `next start`).

**Không tải three.js trước khi mở trận:**
- Chunk duy nhất chứa `WebGLRenderer` là `21brd65ttm4ev.js` (766 KB). Chunk này không có trong `.next/server/app/index.html`.
- Trang `/?year=-216&event=battle-of-cannae`, trước khi bấm nút: 19 request, trong đó 10 script, không script nào chứa `WebGLRenderer`. Không có request dữ liệu trận, địa hình hay mô hình. Chỉ có 1 canvas (bản đồ).
- Sau khi bấm: thêm 3 chunk (có chunk three.js), `battle-of-cannae.bin`, `index.json`, `roman-hastatus.glb`, `roman-legionary.glb`.

**Luồng mở/đóng** (`s-open.mjs`), cả `en` lẫn `vi`, console sạch:
- tên hộp thoại đúng: "Battle of Cannae" / "Trận Cannae";
- mở ở thời điểm 0, focus ở nút Phát; phát 4 giây thì tới 0,17; dừng thì đứng yên;
- → → ← chuyển đúng giai đoạn; bấm vào cảnh rồi Space vẫn phát; mũi tên trên tab chỉ đổi tab;
- Esc đóng; focus về nút xem trận; địa chỉ và vị trí cuộn danh sách giữ nguyên;
- mở lại thì về 0, có 2 canvas; đóng bằng nút thì còn 1 canvas.

**Bộ nhớ** (`s-memory.mjs`, production): mở, phát, rồi đóng 10 lần; lần lẻ đóng bằng Esc, lần chẵn bằng nút.
- Heap sau GC: 12,6 MB trước khi mở; 15,9 MB sau lần 1; 17,2 MB sau lần 10 (đứng ở 16,9 MB từ lần 5 đến lần 8).
- Sau mỗi lần đóng: chỉ còn 1 context WebGL sống (của bản đồ), 1 canvas; số node DOM không đổi (1 118).

**Hiệu năng** (`s-perf.mjs`): 1280×800, khung bên mở, cảnh 920×678, chất lượng cao, bỏ giới hạn 60 khung hình/giây. Mỗi khung hình đọc 1 điểm ảnh để chỉ đếm khung đã vẽ xong.

Máy sạch (không có `blender.exe`; Godot, Chrome và các dev server khác vẫn chạy):

| Lúc | Khung hình/giây | p99 (ms) | Hình đứng / nằm |
|---|---|---|---|
| Góc nhìn mở, dừng (thời điểm 0) | 124 | 10,8 | 6 810 / 0 |
| Đang phát giai đoạn 1 (dàn trận), 1× | 66 | 19,2 | 6 810 / 0 |
| Đang phát giai đoạn 3 (tiến quân), 1× | 64 | 20,5 | 6 668 / 142 |
| Đang phát giai đoạn 4 (giao chiến, lính ngã), 1× | 68 | 17,8 | 6 339 / 471 |
| Đang phát giai đoạn 6 (vòng vây), 2× | 108 | 17,1 | 4 988 / 1 822 |
| Cuối trận, góc nhìn mở, dừng | 114 | 11,9 | 3 067 / 3 743 |
| Cuối trận, giữa đám lính ngã (120 m), dừng | 114 | 11,4 | 3 067 / 3 743 |
| Đang phát giai đoạn 4 từ 90 m (hình LOD0) | 59 | 36,7 | 6 318 / 492 |

Mọi trường hợp đều trên mục tiêu 50 khung hình/giây. Lúc Blender của lane 1 đang render, các số khi đang phát xuống còn 40–59.

Để biết code bước chân mới có làm chậm hay không, đã đo xen kẽ `/battle-lab` (bản dev) của `main` và của nhánh này, 3 lượt, cùng điều kiện máy. Trung bình giai đoạn 3: `main` 63, nhánh này 58,5; giai đoạn 4: `main` 62, nhánh này 65. Chênh lệch nằm trong độ dao động, nên code mới không làm chậm rõ rệt.

Theo CPU profile lúc đang phát (giai đoạn 4), phần lớn thời gian mỗi khung hình là chờ GPU. Phần JS cập nhật đám đông tốn khoảng 3,5 ms; React gần như không tốn gì.

**Ảnh chụp** (ngoài repo, `E:\World_History_Platform_assets\T-023\shots\`):
- `en-light-*`: 1280×800, tiếng Anh, nền sáng;
- `vi-dark-*`: tiếng Việt, nền tối;
- `m390-vi-light-*`: 390 px.

Mỗi bộ có: panel sự kiện, lúc vừa mở, giai đoạn 2, đang phát giai đoạn 4, thông tin trận, nguồn và ghi công; bộ 1280×800 có thêm ảnh khung bên thu gọn. Có thêm bộ `m390-vi-dark-*`. Góc nhìn mở thấy cả hai chiến tuyến khi khung lời dẫn mở. Ở 390 px: cảnh ở trên, rồi thanh điều khiển, rồi khung lời dẫn và thông tin; không cuộn ngang.

### Ghi chú cho lane 1 (mô hình và clip)

- **Số sải chân trong `docs/ARCHITECTURE.md` và `art/README.md` sai.** Đo trên clip đã bake:
  - `walk`: bàn chân trụ lùi 0,98 m/s, tức một vòng 1,333 s đi 1,31 m (tài liệu ghi 1,00 m);
  - `run`: bàn chân trụ lùi 5,9 m/s, tức một vòng 0,933 s đi 5,5 m (tài liệu ghi 1,99 m).

  Số cũ chỉ cộng quãng trượt lúc chân chạm đất, bỏ pha hai chân rời đất. Cảnh tự đo nên không phụ thuộc số trong tài liệu.
- Clip `run` thực chất là chạy nước rút (5,9 m/s ở cỡ người thật), không phải chạy chậm.
- Clip `walk`: quanh lúc gót chạm đất và lúc mũi chân rời đất (khung 0–4 và 20–24), bàn chân không lùi theo mặt đất mà trượt khoảng 32% trong các khung đó.
- Hastati đánh bằng kiếm trong khi tay trái vẫn cầm hai cây *pilum*. Chưa có clip phóng *pilum*.

### Ghi chú khác

- Dữ liệu Cannae (lane 2): ở giai đoạn 1, mọi đơn vị có `action: "stand"` dù đi 0,6–5 km. Cảnh giờ chọn clip theo tốc độ thật nên lính vẫn đi hay chạy; `action` chỉ còn quyết định lúc đánh (`fight`).
- Trận dài 11,5 giờ được phát trong khoảng 140 giây. Khối nào đi nhanh hơn 26,6 m/s trên màn hình (ví dụ lúc dàn trận) thì chân vẫn trượt: chân giữ nhịp chạy nhanh nhất mà vẫn còn trông giống chạy.
- Ghi công trong khung mới chỉ có dòng cho mô hình La Mã (`viewer/credits.ts`). Khi gộp T-021 (6 mô hình bộ binh) và T-022 (kỵ binh, ngựa) phải thêm dòng, và giữ khớp với README và `art/CREDITS.md`.
- `/battle-lab` vẫn chỉ chạy ở `next dev`; bản production trả 404, như trước.

### Đề nghị ngoài phạm vi

1. Phiên chính sửa số sải chân trong `docs/ARCHITECTURE.md` (mục "Mô hình lính") theo số đo ở trên, hoặc ghi rằng cảnh tự đo sải chân từ clip.
2. Vẫn để sau, như task đã ghi: chuyển cảnh từ bản đồ vào trận (lane 2), ghi công trong hộp thoại Giới thiệu, link chia sẻ mở thẳng vào trận.

**Công cụ thử** (ngoài repo): `E:\World_History_Platform_assets\T-023\tools\`. Chạy `GPU=1 node drive.mjs <kịch bản>.mjs`.
- Kịch bản: `s-open` (luồng mở/đóng), `s-planted` (chân trụ), `s-stride` (bảng từng khung của clip), `s-labels`, `s-fallen`, `s-close`, `s-attack`, `s-memory`, `s-perf`, `s-profile`, `s-shots`.
- Dev server: `TUTOR_MOCK=1 npx next dev -p 3103`.
