# T-047: LOD nhẹ hơn, và các chỗ chưa ưng của kỵ binh

- **Lane:** 1
- **Model đề xuất:** Fable 5.2, effort `high`.
- **Nhánh:** `lane1/T-047-lod-cavalry` (phiên chính đã tạo sẵn từ `main`, trong worktree của bạn)
- **Phạm vi file:**
  - `art/` (script Blender, `art/renders/`, `art/CREDITS.md`, `art/README.md`);
  - `public/battles/models/` (các file `.glb` và `index.json`).
  - **Ngoại lệ cho task này:** được sửa các file ngựa `art/blender/horse_*.py` nếu cần cho LOD của ngựa trong ba mô hình kỵ binh, như ở T-022. Lane 2 đang làm T-045 (chỉ dữ liệu trận), không đụng tới các file này.

## Bối cảnh

Từ T-029 (đợt F) bạn chỉ đọc lại T-034. Trong thời gian đó phiên chính làm ba đợt; những gì đổi với mô hình:

- **Đợt G, giáp lá cà (T-032 → T-035):** chín mô hình đánh gần có thêm hai clip `block` và `hit` ở cuối `UNIT_CLIPS`, dài 1,0 s, đòn chạm ở giây `REACTION_IMPACT` (0,3). Cảnh đo khoảng cách đấu và lúc đòn chạm từ chính clip `attack` khi nạp (`UnitModel.strike`), và nhận ra xương bị thu nhỏ trong clip đánh để cất đồ cầm thêm (`UnitModel.stow`, hai cây *pilum* của hastatus). Kỵ binh có phản ứng ở `whp_cavalry._reaction`.
- **Đợt I, đồ hoạ theo ảnh mẫu (T-041 → T-044):**
  - Cảnh thêm ánh sáng bù cho riêng hình lính (`Sky.fill`, `figFill`) và đường cong màu riêng (`grade.ts`). Mô hình trong cảnh vì thế trông khác ảnh render của Blender: **xét hình dáng và màu trong cảnh** (`/battle-lab`), không chỉ trong ảnh render.
  - Ngưỡng mức chi tiết hạ xuống: LOD0 từ 58 điểm ảnh, LOD1 từ 17 điểm ảnh. Phần lớn hình lính ở góc nhìn mở là LOD2.
  - T-042 dựng thử thang chi tiết bốn mức `hi` (cờ `--hi` của `build_model.py` và `horse_build.py`), người dùng không dùng. Đừng làm hỏng cờ này; nếu việc của bạn làm nó không chạy được nữa thì ghi vào "Kết quả".
- Mô hình **không đổi** từ T-035 tới nay.

Người dùng chọn giao cho bạn ba việc. Hai việc đầu là đề nghị cũ còn treo trong `docs/PLAN.md`.

## Đọc trước

- `docs/ARCHITECTURE.md`, mục "Mô hình lính" (nhất là "Hoạt hình": `block`, `hit`; "Kỵ binh"), mục "Giáp lá cà (đợt G)" (khoảng cách đấu, nhịp đánh), mục "Đồ hoạ theo ảnh mẫu (đợt I)".
- `docs/tasks/T-031-scene-performance.md`: đoạn "Chỗ tốn GPU lớn nhất ở góc nhìn mở là LOD2…" và mục "Đề nghị", ý 1.
- `docs/tasks/T-022-cavalry.md`, mục "Còn chưa ưng ý", các ý 4, 8, 9.
- `docs/tasks/T-033-melee-stage2.md`, ý "Nhát chém của lính Gaul chạm khiên sớm hơn…" (khoảng dòng 102).

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. LOD1 và LOD2 ít đường nối UV

**Vấn đề (T-031):** mỗi mô hình ở LOD2 chỉ có 185–250 vị trí đỉnh khác nhau nhưng tới 650–840 đỉnh, vì đỉnh bị tách theo đường nối UV (tách khoảng 3,4 lần). Lane 3 thử gộp đỉnh ngay trên trang (màu sai ở đường nối, chỉ để đo): GPU vẽ một khung ở góc nhìn mở giảm từ 7,4 xuống 4,6 ms. LOD1 cũng tách 2–3 lần.

- Xuất lại LOD2 và LOD1 của **cả 11 mô hình** với ít đường nối hơn, sao cho số đỉnh gần với số vị trí khác nhau. Mục tiêu: LOD2 không quá khoảng 1,5 lần số vị trí.
  - Cách làm do bạn chọn. Lane 3 gợi ý: cho LOD2 một vùng riêng trong atlas với UV liền (ít mảnh), hoặc tô màu theo từng phần. Ràng buộc của hợp đồng: một vật liệu, một ảnh màu cho cả mô hình (ảnh màu tối đa 2048×2048).
  - Cảnh không được phải sửa. Nếu cách tốt nhất cần cảnh đọc thêm thứ gì (ví dụ màu theo đỉnh), dừng lại và ghi đề nghị vào "Kết quả".
- **Nhìn phải như cũ:**
  - ở góc nhìn mở (hình lính dưới 17 điểm ảnh), màu từng phần và màu phe phải đọc ra như trước;
  - ở tầm trung (LOD1, 17–58 điểm ảnh), không thấy đường nối hay vệt màu sai.
  - So bằng ảnh chụp cảnh cùng góc, trước và sau.
- Giới hạn tam giác không đổi: LOD1 tối đa 1 500, LOD2 tối đa 300. Mỗi file tối đa 4 MB.
- **Đo trước và sau:**
  - số đỉnh và số vị trí khác nhau của LOD1, LOD2: `s-lod2.mjs`;
  - thời gian GPU vẽ một khung ở góc nhìn mở: `s-gputime.mjs`.
  - Hai script ở `E:\World_History_Platform_assets\T-031\tools\`, driver `drive.mjs` cùng thư mục (biến `APP` là địa chỉ app).
  - Đo khi không có Blender nào chạy (`tasklist | findstr blender`). Lane 3 cũng đang đo hiệu năng cho T-048, nên ghi điều kiện máy cho mỗi lần đo.

### 2. Các chỗ chưa ưng của kỵ binh (T-022, "Còn chưa ưng ý")

- **Ý 4, vạt áo người cưỡi** xoè ra hai bên khi nhìn thẳng từ trước. Sửa cho vạt áo rủ theo đùi.
- **Ý 8, tóc người Numidia** trông như mũ da. Nếu cách sửa dùng chung được cho tóc lính Baleares (T-024 ghi cùng lỗi) thì sửa cả hai.
- **Ý 9, người Gaul trong `iberian-gallic-cavalry`** trông như người Iberia, vì bộ đồ chung theo người Iberia.
  - Một loại lính chỉ có một mô hình, nên tìm cách cho mô hình chung đọc ra có cả người Gaul, theo nguồn bạn đã dùng ở T-022: Polybius 3.114, Livy 22.46, và nguồn khác về kỵ binh Gaul nếu có.
  - Nếu cách đúng là tách thành hai loại lính (việc dữ liệu của lane 2), ghi đề nghị vào "Kết quả" thay vì làm.
  - **Riêng ý này, dựng xong ảnh render thì dừng lại báo người dùng xem** (ảnh ở `duyet\T-047\`, xem mục 4) trước khi xuất vào cảnh.
- Các ý khác của danh sách đó (chân đung đưa, cú ngã, sải phi) không thuộc task này.

### 3. Nhát chém của lính Gaul (`gallic-infantry`)

- **Vấn đề (T-033):** cảnh lấy lúc đòn chạm là lúc vũ khí vươn xa nhất về trước (giây 0,5 của `attack`). Với nhát bổ từ trên xuống, lưỡi kiếm đi qua mép trên khiên của đối thủ sớm hơn khoảng 2–3 khung, nên ở khung "đòn chạm" lưỡi kiếm đã xuống thấp bên cạnh khiên.
- Sửa trong clip để lúc vươn xa nhất trùng với lúc lưỡi kiếm ở ngang mép trên khiên đối thủ. Giữ độ dài `attack` 1,333 s.
  - Khoảng cách đấu đo từ clip sẽ đổi theo; ghi số trước và sau.
  - Nếu không sửa được trong clip mà không làm nhát chém trông sai, ghi đề nghị cho cảnh vào "Kết quả".
- Xem trong `/battle-lab?duel=1`: cặp `roman-legionary` với `gallic-infantry`. Công cụ chụp khung clip của phiên chính: `E:\World_History_Platform_assets\main-tools\blender\clip_sheet.py` (cách chạy ở đầu file).

### 4. Xuất, kiểm tra và ảnh duyệt

- Dựng mô hình: `"D:/Tools/Blender/5.2.2/blender.exe" --background --factory-startup --disable-autoexec --python art/blender/build_model.py -- --model <id>`, chạy từ thư mục repo, khoảng 2,5 phút mỗi mô hình. Ba mô hình kỵ binh cần `art/build/horse/horse.blend`: chạy `horse_build.py` trước (2–3 phút), vì `art/build/` trong worktree của bạn có thể đã cũ.
- **Clip không được đổi**, trừ `attack` (và nếu cần `block`, `hit`) của `gallic-infantry`. So bằng `glbdiff.mjs` ở `E:\World_History_Platform_assets\T-033-review\tools\`. Ghi kết quả so cho từng mô hình.
- Dựng lại từ đầu ra đúng từng byte (chạy hai lần, so).
- Ảnh cho người dùng duyệt ở `E:\World_History_Platform_assets\duyet\T-047\`, đặt tên `…-A-truoc.png` / `…-B-sau.png`, mỗi cặp cùng góc. Ít nhất có:
  - góc nhìn mở của trận, để thấy LOD2 nhìn như cũ;
  - tầm trung, để thấy LOD1;
  - cận cảnh từng loại kỵ binh trong cảnh, từ trước và từ bên;
  - nhát chém Gaul ở khung đòn chạm.
- Ảnh duyệt trong repo (`art/renders/<model>/`) cập nhật cho mô hình nào đổi hình dáng.
- Driver chụp cảnh của phiên chính: `E:\World_History_Platform_assets\main-tools\drive\` (`drive.mjs`, biến `BASE`; kịch bản `s-lab-close.mjs` chụp cận từng loại lính, `s-duel.mjs` chụp trận thử).

## Ràng buộc

- Không sửa `src/` (cảnh, hợp đồng, dữ liệu). Cần đổi thì ghi đề nghị vào "Kết quả".
- Không đổi tên, thứ tự hay độ dài clip, không đổi khung xương.
- Thêm nguồn hay chất liệu mới thì ghi vào `art/CREDITS.md`. Dòng ghi công trong app (`src/lib/credits.ts`, README) do phiên chính sửa khi gộp: ghi đề nghị.
- `npm run validate` (kiểm tra `index.json` khớp các file `.glb`), `npm run lint`, `npm run build` phải qua.
- Cổng `next dev`: chọn cổng trống. Không dùng 3000 (bản xem thử của `main`) hay 3106.

## Xong khi

- 11 mô hình xuất lại; LOD2 không quá khoảng 1,5 lần số vị trí; có số đỉnh và thời gian GPU trước và sau.
- Vạt áo, tóc Numidia, người Gaul trong kỵ binh Iberia/Gaul đã sửa. Riêng người Gaul: người dùng đã xem ảnh render.
- Nhát chém Gaul chạm mép khiên đúng khung đòn chạm.
- Các clip khác giống hệt từng byte; dựng lại ra đúng từng byte.
- Ảnh trước và sau ở `duyet\T-047\`; mục "Kết quả" đã điền.

## Kết quả

**Trạng thái: làm dở** (hết lượt dùng giữa chừng, 2026-11-19). Ba commit: `2328712` (LOD), `651a178` (nhát chém Gaul), `aa79a32` (vạt áo, tóc). Số liệu thô, kịch bản, ảnh: `E:\World_History_Platform_assets\T-047\`.

### Đã xong

- **Môi trường:** dựng lại ngựa và 11 mô hình bằng script cũ ra đúng từng byte như `main`.
- **1. LOD ít đường nối** (`whp_far.py`, `whp_palette.py`; cách làm ở `art/README.md`, mục "Giai đoạn `lod`"). Số đỉnh trên số vị trí (`glbverts.mjs`, khớp `s-lod2.mjs` trong trang):
  - LOD2: trước 3,1–3,6 lần, sau 1,19–1,47 lần (ví dụ legionary 775 → 344 đỉnh);
  - LOD1: trước 2,3–3,4 lần, sau 1,54–1,76 lần; `gallic-infantry` 3,42 → 2,15 (lưới Celt khép kín, vùng nhỏ).
  - GPU vẽ một khung (`s-gputime.mjs`, bản production, không Blender, xen kẽ trước/sau, RTX 3050, 1280×800, khoảng 3–4 GB RAM trống, dev server của phiên khác vẫn chạy): góc nhìn mở 6,73–6,77 → 5,47–5,48 ms (−19%, 8 lượt); giai đoạn 4: 6,91–6,93 → 5,55–5,56 ms (−20%).
  - Cảnh đo `UnitModel.strike` trên LOD2: không đổi ở 10 mô hình (chỉ Gaul đổi, xem 3). Chiều cao `balearic-slinger` 1,648 → 1,657 m (tóc).
  - Clip: `glbdiff.mjs`, mọi clip của 11 mô hình giống hệt `main`, trừ `attack` của `gallic-infantry`.
  - `--hi`: đường dựng không đổi (không có vùng LOD1 riêng hay bảng màu); chưa chạy thử lại.
- **2. Kỵ binh:** vạt áo kéo sát đùi, vạt sau theo hông (`whp_cavalry.drape_skirts`); tóc Numidia và Baleares xoăn, dày, mờ (`roman_faces.build_hair`, `whp_materials.hair`).
- **3. Nhát chém Gaul:** lúc vươn xa nhất lưỡi kiếm nằm ngang ở 1,27–1,42 m (mép trên khiên La Mã 1,38 m, 1,58 m khi giơ đỡ). Cảnh đo: lúc đòn chạm 0,500 → 0,467 s, tầm 0,976 → 1,536 m. Vì tầm lấy theo người tầm ngắn hơn, cặp Gaul–legionary đứng xa hơn khoảng 10% (1,27 → 1,40 m cỡ mô hình).
- `npm run lint`, `npm run validate`, `next build`: qua.

### Còn lại

- **Ý 9 (người Gaul trong `iberian-gallic-cavalry`):** đã soạn phương án (quần sọc như bộ binh Gaul, vòng cổ torc; `patch/gaul.py`, `patch/apply_gaul.py` trong thư mục số liệu), chưa dựng, chưa render. Theo đề bài phải cho người dùng xem ảnh render trước khi xuất. Đề nghị thêm: tách thành hai loại lính (Iberia / Gaul, cho hai khối của Hasdrubal) là cách đúng hơn, việc dữ liệu của lane 2.
- Dựng lại từ đầu lần hai để xác nhận ra đúng từng byte (chưa chạy với code đã commit).
- Ảnh duyệt trong repo của `balearic-slinger`, `numidian-cavalry`, `roman-cavalry`, `iberian-gallic-cavalry` chưa render lại (trừ ảnh trước-nghiêng-sau của Iberia/Gaul).
- Ảnh duyệt cho người dùng ở `duyet\T-047\`: mới có các ảnh "A-truoc"; chưa chụp "B-sau" (kịch bản `drive/s-t047.mjs`, `drive/s-slash.mjs` sẵn).
- Mép vạt trước của người cưỡi còn vài mảng xám nhỏ (mặt trong của vải) trong ảnh render; chưa xem trong cảnh.

