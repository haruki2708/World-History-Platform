# T-025: Bay từ bản đồ vào trận

- **Lane:** 2
- **Model đề xuất:** Opus 5.5, effort `high`.
- **Nhánh:** `lane2/T-025-battle-flight` (tạo từ `main` mới nhất)
- **Phạm vi file:**
  - `src/components/map/`;
  - khoá `map.*` trong `src/lib/i18n/messages.ts`, cả `en` lẫn `vi`;
  - **ngoại lệ chỉ cho task này:** `src/components/panel/EventListItem.tsx`. Chỉ đổi nút xem trận từ `openBattle` sang `requestBattle`, không sửa gì khác. Lane 1 đang làm Blender nên không đụng tới file này.

## Bối cảnh

T-020 (ngựa, dữ liệu Cannae) và T-023 (khung xem trận) đã gộp. Hiện bấm "View the battle in 3D" thì khung xem trận phủ kín trang ngay lập tức. Người dùng duyệt việc tiếp theo: **trước khi mở trận, bản đồ bay tới chiến trường**, để người xem thấy trận nằm ở đâu.

Phiên chính đã thêm vào store (`src/store/useAppStore.ts`, `docs/ARCHITECTURE.md` mục "Trạng thái chung"):
- `battleRequest: string | null`: trận người dùng vừa xin mở mà chưa mở;
- `requestBattle(id)`: đặt `battleRequest`;
- `openBattle(id)`: giờ xoá luôn `battleRequest` về `null`.

`AppShell` đã tự tải sẵn code khung xem trận khi `battleRequest` khác `null`. Vì vậy trong lúc bản đồ bay, three.js đã bắt đầu tải.

Trong lúc bạn làm:
- lane 1 làm T-024 (sửa mô hình, trong `art/`);
- lane 3 làm T-026 (sửa cảnh, trong `src/components/battle/`). Lane 3 có thể thêm một đoạn camera hạ từ trên cao xuống khi khung xem trận mở, nối tiếp chuyến bay của bạn.

## Đọc trước

- `docs/ARCHITECTURE.md`:
  - mục "Trạng thái chung", nhất là đoạn "Mở trận qua bản đồ (T-025)";
  - mục "Khung xem trận (đợt C)".
- `src/data/index.ts`: `loadBattle(id)` trả về `Battle`, trong đó có `origin` (kinh độ, vĩ độ của gốc toạ độ chiến trường) và `terrain` (vùng địa hình, mét tính từ `origin`).
- `src/components/map/MapView.tsx`: cách bản đồ đang bay tới sự kiện được chọn.
- `src/components/map/territoryFade.ts`: hàm kiểm tra `prefers-reduced-motion`.
- `docs/tasks/T-023-battle-viewer.md`, mục "Kết quả": khung xem trận đóng thì focus trở về nút xem trận.

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Nút xem trận

Trong `EventListItem`, nút xem trận gọi `requestBattle(event.id)` thay cho `openBattle(event.id)`. Chỉ đổi đúng chỗ này.

### 2. Bay tới chiến trường

Khi `battleRequest` khác `null`:
1. Ghi lại góc nhìn hiện tại của bản đồ: tâm, mức phóng, hướng, độ nghiêng.
2. Lấy `origin` và vùng địa hình bằng `loadBattle(id)`.
3. Bay tới chiến trường:
   - khung hình vừa với vùng địa hình (Cannae khoảng 10×8 km), hướng bắc lên, không nghiêng;
   - bay khoảng 1,5–2,5 giây.
4. Bay xong thì gọi `openBattle(id)`.

Có thể thêm (tuỳ chọn): trong lúc bay, vẽ khung của vùng địa hình trên bản đồ, rồi bỏ đi khi trận đóng.

### 3. Trường hợp không bay được

Các trường hợp sau phải gọi `openBattle(id)` ngay, hoặc ngay khi biết không bay được:
- bản đồ chưa tải xong, hay lỗi WebGL;
- `loadBattle` lỗi. Khung xem trận sẽ tự báo lỗi;
- người dùng bật giảm chuyển động (`prefers-reduced-motion`). Khi đó nhảy thẳng tới chiến trường (không bay), hoặc bỏ qua bước bay;
- người dùng kéo hay phóng bản đồ giữa chừng: mở trận luôn, không bắt bay lại;
- chuyến bay không xong sau khoảng 4 giây, vì lý do bất kỳ: mở trận luôn.

Bấm nút xem trận lần nữa trong lúc đang bay thì bỏ qua.

### 4. Trở về khi đóng trận

Khi `battleId` chuyển từ một trận về `null`, nếu trận đó mở sau một chuyến bay thì bản đồ trở lại góc nhìn đã ghi:
- bay về, khoảng 1–1,5 giây;
- nếu người dùng bật giảm chuyển động thì nhảy thẳng về.

Năm, sự kiện đang chọn và địa chỉ trang giữ như trước khi mở trận. Riêng phần góc nhìn trong địa chỉ (nếu có) thì trở về như cũ.

### 5. Kiểm tra

Bằng Chrome không cửa sổ, qua DevTools Protocol, tiếng Anh và tiếng Việt:
- từ `/?year=-216&event=battle-of-cannae`, bấm nút xem trận:
  - tâm bản đồ đổi dần trong lúc bay (ghi vài mốc);
  - khung xem trận mở sau khi bay, trong khoảng 3 giây;
  - ghi thời gian từ lúc bấm tới lúc cảnh vẽ xong, so với trước T-025;
- đóng bằng Esc: bản đồ về đúng góc nhìn cũ (tâm và mức phóng lệch rất nhỏ), focus về nút xem trận;
- bật giả lập `prefers-reduced-motion: reduce`: trận mở ngay, đóng thì về ngay;
- mở đóng 3 lần liền: không lỗi, không có chuyến bay nào bị kẹt;
- trang chính vẫn không tải three.js trước khi bấm nút (danh sách request trước khi bấm);
- console sạch.

## Ràng buộc

- Không sửa store, `src/lib/`, `src/data/`, `src/app/`, `src/components/AppShell.tsx`. Cần đổi thì ghi đề nghị vào "Kết quả".
- Không import component của lane khác. Ở `EventListItem`, chỉ đổi đúng phần nêu ở việc 1.
- Không thêm thư viện npm.
- Dev server dùng cổng 3102.

## Xong khi

- Bấm nút xem trận thì bản đồ bay tới Cannae rồi mở trận; đóng thì bản đồ về chỗ cũ. Làm được ở cả tiếng Anh lẫn tiếng Việt.
- Các trường hợp ở việc 3 đều mở được trận.
- `npm run lint`, `npm run build`, `npm run validate` qua.

## Kết quả

**Tóm tắt:** xong. Bấm "View the battle in 3D" / "Xem trận đánh 3D" thì bản đồ bay 2 giây tới chiến trường Cannae, vẽ khung vùng địa hình, rồi mở trận. Đóng trận thì bản đồ bay về đúng góc nhìn cũ trong 1,2 giây (lệch 0). Mọi trường hợp ở việc 3 đều mở được trận. Chuyến bay làm trận mở chậm hơn khoảng 1,8 giây so với trước. `npm run lint`, `npm run validate`, `npm run build` qua.

### Đã làm

1. **Nút xem trận** (`src/components/panel/EventListItem.tsx`): gọi `requestBattle(event.id)` thay cho `openBattle(event.id)`. Chỉ đổi 2 dòng: dòng lấy hàm từ store và `onClick`.
2. **Bay tới chiến trường** (`src/components/map/battleFlight.ts`, lớp `BattleFlight`; hook `useBattleFlight.ts`, gọi trong `MapView`):
   - Ghi góc nhìn hiện tại: tâm, mức phóng, hướng, độ nghiêng.
   - Gọi `loadBattle(id)`, quy vùng địa hình (`terrain.minX…maxX`, `minY…maxY`, mét tính từ `origin`) ra kinh độ, vĩ độ. Phép chiếu giống `scripts/battles/build-terrain.mjs`.
   - Khung hình vừa với vùng địa hình (`cameraForBounds`), chừa lề bằng 8% cạnh ngắn của bản đồ. Hướng bắc lên, không nghiêng. Dùng `flyTo` trong 2,0 giây; bay xong thì gọi `openBattle(id)`.
   - **Giới hạn phóng:** bản đồ nền dừng ở mức 8 (`MAX_ZOOM`), mà muốn thấy vừa Cannae ở 1280×800 thì cần mức 11,75. Vì vậy trong lúc bay, giới hạn được nâng tạm lên 14, và trả về 8 khi bản đồ đã bay về.
   - **Khung vùng địa hình** (phần tuỳ chọn):
     - nét đứt màu `--accent`, nền mờ 12%; hai lớp `battle-frame-fill` và `battle-frame-line`, khai báo sẵn (rỗng) trong `mapStyle.ts`, nằm trên cùng;
     - hiện dần trong 300 ms khi bắt đầu bay, mờ dần trong lúc bay về, xoá khi về xong;
     - màu lấy từ token và đổi theo chế độ sáng/tối (`MapTheme` có thêm `accent`, `applyMapTheme` tô lại khung).
   - **Trình đọc màn hình:** trong lúc bay, một vùng `role="status"` (ẩn với mắt) đọc "Flying to the battlefield…" / "Đang bay tới chiến trường…" (khoá `map.flyingToBattle`). Thông báo này để người dùng hiểu vì sao trận chưa mở ngay.
   - Mỗi chuyến bay (đi hoặc về) gắn một mã riêng vào dữ liệu sự kiện của MapLibre. Chỉ `moveend` của chuyến đang chạy mới làm đổi trạng thái, nên một chuyến bị chuyến khác cắt ngang không thể tác động hai lần.
3. **Trường hợp không bay được:** trận vẫn luôn mở.
   - Bản đồ chưa tải xong, hoặc lỗi (cả lỗi WebGL): hook không có bản đồ thì gọi `openBattle` ngay.
   - `loadBattle` lỗi hoặc không trả về trận: mở ngay khi biết lỗi. Khung xem trận tự báo lỗi.
   - Giảm chuyển động: mở ngay, bản đồ đứng yên. Đây là cách "bỏ qua bước bay" mà task cho phép; khi đó khung xem trận phủ kín trang nên nhảy bản đồ tới chiến trường cũng không ai thấy.
   - Người dùng kéo hay phóng bản đồ:
     - giữa chuyến bay: MapLibre tự dừng chuyến bay, và việc dừng này được tính là "đã tới", nên trận mở luôn;
     - lúc dữ liệu trận còn đang tải, chưa bay: trận mở ngay khi nhận được `movestart` do người dùng tạo.
   - Sau 4 giây kể từ lúc bấm, vì bất kỳ lý do gì: mở trận luôn. Nếu chuyến bay chưa xong thì nó bay nốt phía sau khung xem trận.
   - Bấm nút lần nữa trong lúc đang bay: bỏ qua. `battleRequest` không đổi nên hook không phản ứng, và `BattleFlight` cũng bỏ qua mọi yêu cầu khi đang bay.
4. **Trở về khi đóng trận:**
   - Bay về góc nhìn đã ghi trong 1,2 giây. Nếu chuyến về chưa xong sau 2,7 giây thì nhảy thẳng về.
   - Giảm chuyển động: nhảy thẳng về.
   - Trận mở mà bản đồ chưa hề bay (dữ liệu lỗi, quá 4 giây trước khi bay, người dùng kéo lúc dữ liệu đang tải): đóng trận thì bản đồ ở nguyên chỗ.
   - Bấm xem trận lại trong lúc đang bay về: bay tới chiến trường từ chỗ bản đồ đang dừng. Góc nhìn được giữ là góc nhìn trước lần mở đầu tiên.
   - Người dùng cắt ngang chuyến bay về: giới hạn phóng trở về 8. Nếu lúc đó bản đồ đang ở mức sâu hơn 8 thì bị kéo về mức 8.
   - Năm, sự kiện đang chọn và địa chỉ trang không đổi. Địa chỉ không chứa góc nhìn nên không có gì phải trả về.
5. **Việc nhỏ khác:** hàm `prefersReducedMotion` chuyển sang `src/components/map/motion.ts`, dùng chung cho `territoryFade.ts` và chuyến bay.

### Kiểm tra

Chrome không cửa sổ qua DevTools Protocol, GPU RTX 3050, 1280×800. Chạy trên bản production (`next build`, `next start -p 3102`); luồng chính và mở đóng nhanh chạy lại trên dev server cổng 3102: kết quả như nhau, console sạch.

**Luồng chính**, từ `/?year=-216&event=battle-of-cannae`: tiếng Anh nền tối, tiếng Việt nền sáng.
- Tâm và mức phóng đổi dần trong lúc bay (tiếng Anh):

  | Sau khi bấm | Tâm | Mức phóng |
  |---|---|---|
  | 34 ms | 16,1519; 41,2967 | 5,50 |
  | 625 ms | 16,2043; 41,3256 | 8,66 |
  | 984 ms | 16,2049; 41,3259 | 10,37 |
  | 1 328 ms | 16,2049; 41,3260 | 11,22 |
  | 1 688 ms | 16,2049; 41,3260 | 11,64 |
  | 2 046 ms | 16,2049; 41,3260 | 11,75 |

  Tâm đi từ vị trí sự kiện Cannae tới tâm vùng địa hình. Tiếng Việt cho kết quả tương tự (bay xong ở 2 041 ms).
- Bay xong thì hướng 0, nghiêng 0. Vùng địa hình nằm trong x 149…747, y 45…521 của bản đồ 896×566, tức vừa khít chiều cao, chừa lề 45 px.
- Khung xem trận mở sau 2 356–2 358 ms, dưới 3 giây.
- Trình đọc màn hình đọc "Flying to the battlefield…" / "Đang bay tới chiến trường…".
- Đóng bằng Esc:
  - bản đồ về xong sau 1 231–1 236 ms;
  - tâm và mức phóng lệch 0 so với trước khi bấm; giới hạn phóng về 8; khung vùng địa hình đã xoá;
  - focus ở nút xem trận; địa chỉ giữ nguyên (`?year=-216&event=battle-of-cannae&lang=…`).

**Thời gian từ lúc bấm tới lúc cảnh vẽ xong** (lần mở đầu, profile trình duyệt trống; "vẽ xong" là hai khung hình sau khi cảnh báo sẵn sàng):
- Trước khi sửa code (bản `main`): 2 890, 3 152 và 3 742 ms.
- Lúc đo kết quả cuối, Blender của lane 1 đang chạy (CPU 100%), nên không so được với số trên. Vì vậy đã đo xen kẽ hai cách mở trong cùng điều kiện:
  - "bay": cách mở mới;
  - "mở thẳng": bật giảm chuyển động, trận mở ngay như trước T-025.

  | Lượt | Bay: bấm → cảnh vẽ xong | Mở thẳng: bấm → cảnh vẽ xong |
  |---|---|---|
  | 1 | 4 785 ms | 3 583 ms |
  | 2 | 5 832 ms | 3 494 ms |
  | 3 | 5 401 ms | 3 483 ms |
  | 4 | 5 294 ms | 3 493 ms |
  | Trung bình | 5 328 ms | 3 513 ms |

- Như vậy chuyến bay làm trận mở chậm thêm khoảng 1,8 giây:
  - bản thân chuyến bay mất 2,04 giây, cộng 0,3 giây khung tải (xem đề nghị 1);
  - bù lại khoảng 0,2 giây, vì code khung xem trận đã tải sẵn trong lúc bay: từ lúc hộp thoại mở tới lúc cảnh vẽ xong, trung bình 2 960 ms khi bay so với 3 175 ms khi mở thẳng;
  - code khung xem trận bắt đầu tải 37 ms sau khi bấm.

**Giảm chuyển động** (`prefers-reduced-motion: reduce`), cả tiếng Anh lẫn tiếng Việt:
- Trận mở 11–14 ms sau khi bấm. Bản đồ không dịch chuyển khung hình nào.
- Đóng thì bản đồ vẫn đúng góc nhìn cũ; focus về nút.
- Kéo bản đồ đi chỗ khác rồi bấm: trận mở sau 11–15 ms, bản đồ vẫn ở chỗ đã kéo tới.

**Mở đóng 3 lần liền:**
- Chờ bản đồ về hẳn rồi mới bấm lại (tiếng Anh): mỗi lần hộp thoại mở sau 2 035–2 370 ms, bản đồ về đúng chỗ cũ.
- Bấm lại ngay khi bản đồ đang bay về, lúc đang ở mức phóng 8,6–8,8 (tiếng Việt): mỗi lần bay tiếp từ chỗ đang dừng, hộp thoại mở sau 2 037–2 367 ms.
- Cả hai cách: sau lần đóng cuối, bản đồ về đúng góc nhìn ban đầu (lệch 0), giới hạn phóng 8, không còn chuyển động, khung đã xoá, hộp thoại đóng. Mở đúng 3 lần, console sạch.
- Lần đầu bấm hai lần cách nhau 300 ms: chỉ có một chuyến bay (mức phóng chỉ tăng, không bắt đầu lại) và một lần mở.

**Các trường hợp ở việc 3:**

| Trường hợp | Cách giả lập | Kết quả |
|---|---|---|
| Kéo bản đồ giữa chuyến bay | kéo chuột lúc bay được 0,7 s | mở 73 ms sau khi bắt đầu kéo; đóng thì bay về góc nhìn cũ |
| Lăn chuột giữa chuyến bay | lăn chuột lúc bay được 0,7 s | mở sau 49 ms; đóng thì bay về |
| Kéo lúc dữ liệu còn đang tải | giữ mọi script sau khi bấm, kéo ở 0,5 s | mở sau 35 ms; bản đồ ở nguyên chỗ đã kéo tới |
| Quá 4 giây | giữ mọi script sau khi bấm trong 6 s (dữ liệu trận, code khung xem trận) | mở ở 4 013 ms; bản đồ không bay; đóng thì ở nguyên |
| `loadBattle` lỗi | làm hỏng chunk chứa dữ liệu Cannae | mở ở 419 ms, sau khi trình tải chunk thử lại xong; khung xem trận báo "The battle could not be loaded…" |
| Bản đồ chưa tải xong | giữ `basemap.json` | mở sau 58 ms; cảnh vẫn chạy |
| Lỗi WebGL | Chrome chạy với `--disable-webgl --disable-3d-apis` | bản đồ báo lỗi; mở sau 53 ms; khung xem trận báo lỗi WebGL |

Ở cả bảy trường hợp, focus đều về nút khi đóng. Hai ca cố ý làm hỏng (chunk lỗi, tắt WebGL) có lỗi ở console, đúng như dự kiến; các ca còn lại console sạch.

**Không tải three.js trước khi bấm:** trước khi bấm có 31 request, trong đó 11 script, không script nào chứa `WebGLRenderer`. Chunk three.js chỉ được tải sau khi bấm.

**390 px** (tiếng Việt): bay được; vùng địa hình vừa bản đồ 390×265; không cuộn ngang.

**Ảnh chụp** (ngoài repo, `E:\World_History_Platform_assets\T-025\shots\`):
- `en-flight-*`, `en-battle-open`, `en-after-close`: tiếng Anh, nền tối;
- `vi-*`: tiếng Việt, nền sáng;
- `m390-vi-flight-mid`: 390 px.

**Công cụ thử** (ngoài repo): `E:\World_History_Platform_assets\T-025\tools\`. Chạy bằng `GPU=1 node drive.mjs <kịch bản>.mjs`.
- Kịch bản: `s-flight` (luồng chính), `s-timing`, `s-compare`, `s-prefetch` (thời gian và thứ tự request), `s-reduced`, `s-repeat`, `s-edge` (các trường hợp ở việc 3), `s-mobile-shot`.
- Kết quả lượt chạy cuối: `E:\World_History_Platform_assets\T-025\final-run.txt`.

### Ghi chú cho lane 3 (camera hạ xuống khi khung xem trận mở)

Lúc gọi `openBattle`, bản đồ nhìn thẳng xuống, hướng bắc lên:
- Tâm khung hình là tâm vùng địa hình, `((minX + maxX) / 2, (minY + maxY) / 2)`, không phải `origin`. Với Cannae là (−300, −750) m.
- Vùng địa hình vừa với **vùng bản đồ**, không phải cả trang, và chừa lề bằng 8% cạnh ngắn.
- Ở 1280×800:
  - vùng bản đồ rộng 896×566 px, bắt đầu từ toạ độ (0, 65) của trang;
  - vùng địa hình chiếm 598×476 px, tâm ở toạ độ (448, 348) của trang.

Đoạn camera hạ xuống nối liền nhất nếu bắt đầu từ góc nhìn thẳng xuống, tâm ở tâm vùng địa hình, độ cao đủ thấy cả vùng.

### Đề nghị ngoài phạm vi

1. **Phiên chính, `AppShell`: khung tải 0,3 giây ở lần mở đầu.**
   - Hiện tượng: code khung xem trận đã tải xong trong lúc bay, nhưng lần mở đầu vẫn hiện `BattleViewerLoading` khoảng 315 ms rồi hộp thoại mới mở. Lần mở thứ hai thì hộp thoại mở sau 14–26 ms.
   - Nguyên nhân: `next/dynamic` (React.lazy) vẫn treo một nhịp ở lần render đầu tiên, và React giữ phần chờ của Suspense ít nhất 300 ms.
   - Đề nghị: khi `loadBattleViewer()` xong, `AppShell` giữ component vào state và render thẳng component đó; chỉ hiện `BattleViewerLoading` khi chưa có. Làm vậy thì lần mở đầu nhanh hơn khoảng 0,3 giây.
2. **Lane 3 hoặc phiên chính: tải sẵn tài nguyên của cảnh trong lúc bay.**
   - Từ lúc hộp thoại mở tới lúc cảnh vẽ xong mất 2,1–3,4 giây: tải địa hình và 8 file `.glb`, dựng cảnh, biên dịch shader. Trong 2 giây bay, mạng gần như không dùng tới.
   - Có thể có một hàm nhẹ, không kéo theo three.js, tải sẵn `terrain.file`, `index.json` và các file `.glb` vào cache khi `battleRequest` khác `null`.
   - Trên localhost thì lợi ít, vì phần lớn thời gian là CPU; trên mạng thật thì lợi hơn.
3. **Phiên chính, `docs/ARCHITECTURE.md`, đoạn "Mở trận qua bản đồ (T-025)":**
   - đang ghi "bay tới `origin`", thực tế là bay tới khung vùng địa hình;
   - nên thêm các trường hợp: người dùng kéo hay phóng bản đồ, quá 4 giây, `loadBattle` lỗi;
   - với giảm chuyển động, ghi rõ là bản đồ không nhảy tới chiến trường, trận mở ngay;
   - ghi việc giới hạn phóng của bản đồ được nâng tạm lên 14 trong lúc có trận.
4. Chỉ ảnh hưởng khi phát triển: nếu Fast Refresh nạp lại `battleFlight.ts` trong lúc trận đang mở, thì khi đóng, bản đồ không bay về và giới hạn phóng giữ ở 14 cho tới khi tải lại trang. Bản production không bị.
