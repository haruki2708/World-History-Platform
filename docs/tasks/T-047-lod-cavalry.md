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

**Trạng thái: xong, trừ ý 9 đang chờ người dùng xem ảnh** (2026-11-19). Lane 1 làm. Số liệu thô, kịch bản đo, log: `E:\World_History_Platform_assets\T-047\`. Ảnh duyệt: `E:\World_History_Platform_assets\duyet\T-047\` (26 cặp `A-truoc` / `B-sau`).

Commit: `2328712` (LOD1, LOD2), `651a178` (nhát chém Gaul), `aa79a32` (vạt áo bản đầu, tóc), `f266814` (bỏ mảnh vụn LOD1 để dựng lại ra đúng từng byte), `72ef734` (ảnh duyệt Baleares, Gaul), `50934ce` (vạt áo kéo theo tư thế ngồi), và commit điền mục này.

### 1. LOD1, LOD2 ít đường nối

Cách làm ở `art/README.md`, mục "Giai đoạn `lod`" (`whp_far.py`, `whp_palette.py`). Tóm tắt:

- **LOD2:** mỗi tam giác một màu phẳng như cũ, nhưng màu gom thành bảng màu nhỏ (12–20 màu, khoảng cách OKLab), mỗi màu một ô 32×32 điểm ảnh trong atlas; tam giác cùng màu dùng chung đỉnh. Ảnh pháp tuyến và độ nhám/kim loại mang giá trị của màu ở ô tương ứng.
- **LOD1:** mỗi mảnh chia thành ít vùng lớn (vùng lớn dần trong nón 90°, giữ là một đĩa), trải UV theo góc, xếp chung atlas với LOD0 ở mật độ 0,25; màu, độ nhám lấy từ điểm gần nhất của LOD0 (không bake lại).
- Cảnh không phải sửa: vẫn một vật liệu, một ảnh màu 2048×2048, cùng ba mức LOD.

**Số đỉnh / số vị trí khác nhau** (`glbverts.mjs`, khớp `s-lod2.mjs` đọc trong trang):

| Mô hình | LOD1 trước → sau | LOD2 trước → sau | Tam giác LOD1 / LOD2 | File |
|---|---|---|---|---|
| balearic-slinger | 2,89 → 1,76 | 3,61 → 1,39 | 1 127 / 230 | 1,68 → 1,64 MB |
| gallic-infantry | 3,42 → 2,16 | 3,48 → 1,24 | 1 080 / 235 | 1,89 → 1,83 MB |
| iberian-gallic-cavalry | 2,74 → 1,63 | 3,45 → 1,20 | 1 304 / 289 | 2,15 → 2,07 MB |
| iberian-infantry | 2,67 → 1,70 | 3,25 → 1,40 | 1 160 / 271 | 1,79 → 1,74 MB |
| libyan-infantry | 2,33 → 1,55 | 3,33 → 1,34 | 1 348 / 277 | 2,25 → 2,17 MB |
| numidian-cavalry | 2,89 → 1,71 | 3,54 → 1,30 | 1 354 / 276 | 2,10 → 2,04 MB |
| roman-cavalry | 2,54 → 1,62 | 3,43 → 1,32 | 1 353 / 288 | 2,43 → 2,35 MB |
| roman-hastatus | 2,48 → 1,68 | 3,14 → 1,30 | 1 282 / 294 | 1,95 → 1,90 MB |
| roman-legionary | 2,37 → 1,57 | 3,27 → 1,46 | 1 346 / 296 | 2,25 → 2,17 MB |
| roman-triarii | 2,36 → 1,56 | 3,26 → 1,44 | 1 346 / 288 | 2,25 → 2,17 MB |
| roman-velites | 2,55 → 1,59 | 3,15 → 1,29 | 1 233 / 264 | 1,77 → 1,71 MB |

- LOD2 đạt yêu cầu (không quá khoảng 1,5 lần) ở cả 11 mô hình. `gallic-infantry` LOD1 còn 2,16 lần: lưới Celt khép kín, pháp tuyến lổn nhổn sau khi giảm tam giác nên vùng nhỏ.
- Giới hạn tam giác (LOD1 tối đa 1 500, LOD2 tối đa 300) và cỡ file (tối đa 4 MB) vẫn giữ.

**Thời gian GPU vẽ một khung** (`s-gputime.mjs`, góc nhìn mở của Cannae, 1280×800):

- Điều kiện: bản production (`next build` + `next start`) của `main` trước task (cây `T-047\before`, cổng 3181) và của nhánh (cổng 3182); không có Blender chạy; xen kẽ trước/sau trong cùng lượt; RTX 3050 Laptop; khoảng 3–4 GB RAM trống; dev server của các phiên khác vẫn chạy.
- Góc nhìn mở: **6,73–6,77 → 5,45–5,48 ms (−19%)**, 8 lượt mỗi bên qua ba lần đo trong ngày (lần cuối 07:48, bản cuối của nhánh).
- Giai đoạn 4 (t = 3,55, hai cánh ép vào): 6,91–6,93 → 5,55–5,56 ms (−20%), đo trước khi bỏ mảnh vụn và làm lại vạt áo (hai sửa này đổi số đỉnh dưới 1%).

**Nhìn như cũ:** cặp ảnh `goc-mo-*`, `tam-xa-LOD2-*` (450 m, 700 m) và `tam-trung-LOD1-*` (120 m, 190 m), cùng góc, hai giai đoạn. Màu phần và màu phe đọc ra như trước; không thấy đường nối hay vệt màu sai ở LOD1. Các ảnh này chụp với mô hình ở `aa79a32`; về sau LOD chỉ đổi ở chỗ bỏ mảnh vụn và vạt áo kỵ binh.

**Cảnh đo `UnitModel.strike` trên LOD2:** đọc lại trong trang cho 11 mô hình, bản cuối: không đổi ở 10 mô hình, chỉ Gaul đổi (xem 3). Chiều cao `balearic-slinger` 1,648 → 1,657 m (tóc mới).

### 2. Kỵ binh

- **Ý 4, vạt áo** (`whp_cavalry.drape_skirts`, `apply_drape`):
  - Bản đầu (`aa79a32`) kéo vạt áo vào chân ở tư thế đứng; khi ngồi gần như không đổi gì, nên đã làm lại.
  - Bản cuối kéo ở đúng chỗ đùi nằm khi ngồi (clip `idle`, khung 0): dưới hông, phần cách chân quá 1,2 cm chỉ giữ 5%; làm mượt; đẩy ra ngoài da tối thiểu 8 mm; lớp giáp lưới của kỵ binh La Mã nằm ngoài lớp áo thêm 1,2 cm. Độ dời đổi ngược về tư thế đứng qua ma trận skin của từng đỉnh, nên mọi clip (người đều ngồi) thấy vạt áo rủ theo đùi.
  - Độ dời chỉ áp vào LOD0, LOD1 sau khi bake atlas. Nếu dời trước, mặt vải ở tư thế đứng không trơn và bake để lại tam giác xám trên vạt áo (đã gặp và đã sửa).
  - Đo ở Iberia/Gaul: 400 đỉnh chìa xa nhất sang hai bên cách chân trung vị 4,6 → 1,7 cm. Ảnh: `ky-binh-*-trong-canh-truoc-mat`, `-ben`, `*-truoc-ben-sau`. Rõ nhất ở Iberia/Gaul (hết dáng váy xoè) và mép nâu của Numidia.
  - Còn lại: vạt sau vẫn theo hông, rủ thành hình chuông trên lưng ngựa (cố ý, để không xuyên vào ngựa); một mảng xám nhỏ (mặt trong của vải) ở sườn trái vạt áo Iberia/Gaul, nhìn từ trước.
- **Ý 8, tóc Numidia** (cả lính Baleares, cùng lỗi): thay lớp tóc ôm sọ bằng tóc xoăn dày (`roman_faces.build_hair`: vỏ tóc chia nhỏ, lọn xoăn bằng nhiễu, chân tóc lởm chởm) với chất liệu mờ, có vệt sợi (`whp_materials.hair`). Ảnh: `toc-baleares-dau`, `numidia-truoc-ben-sau`, `ky-binh-numidia-trong-canh-*`.
- **Ý 9, người Gaul trong `iberian-gallic-cavalry`: chưa xuất vào cảnh, chờ người dùng xem ảnh** (theo đề bài). Xem mục "Ý 9" ngay dưới.

### Ý 9: phương án và đề nghị

**Phương án đã dựng thử, không xuất vào cảnh:** thêm hai dấu hiệu Gaul không trái với trang phục người Iberia.

- Quần (*bracae*) cùng màu nhuộm với bộ binh Gaul (`gallic-infantry`), có sọc. Nguồn: Polybius 2.28.7 (người Insubres và Boii mặc quần và áo choàng nhẹ); Diodorus 5.30.1 (quần, áo choàng sọc hay kẻ ô); Strabo 4.4.3 (quần bó).
- Vòng cổ *torc* bằng đồng, hở ở họng, bám theo cổ và cổ áo. Nguồn: Polybius 2.29.8, 2.31.5 (vòng cổ, vòng tay vàng của người Gaul). Kỵ binh Gaul thuộc tầng lớp quý tộc, là những người đeo torc.
- Ảnh: `y9-ky-binh-iberia-gaul-de-xuat-*` (trước-bên-sau, ba phần tư, cạnh legionary, cổ và đùi phóng to). `A-truoc` là mô hình hiện tại, `B-sau` là phương án.
- Bản vá và mô hình: `T-047\patch\gaul.py`, `patch\apply_gaul.py` (áp vào `roman_source.py`, `unit_iberian_gallic_cavalry.py`), `T-047\gaul\iberian-gallic-cavalry.proposal.glb`. Bản dựng thử qua bước kiểm tra; repo đã trả về bản không có phương án.
- **Hạn chế:** quần chỉ lộ ở đùi, giữa vạt áo và xà cạp (nền vàng đất gần màu xà cạp); torc rất nhỏ. Ở tầm LOD1, LOD2 (gần như mọi lúc trong trận) hai dấu hiệu này không đọc ra; chỉ thấy khi xem cận.

**Đề nghị (cách đúng hơn): tách thành hai loại lính**, việc dữ liệu của lane 2.

- Polybius 3.114.1 và Livy 22.46.1 kể kỵ binh Iberia và kỵ binh Gaul của Hasdrubal ở cánh trái là hai khối người khác nhau.
- Mỗi khối một mô hình: Iberia giữ mô hình hiện tại; Gaul một mô hình riêng (quần, áo choàng sọc hay kẻ ô thay cho áo trắng viền tía, torc, tóc dài và ria, khiên Celt), dựng từ người Celt của `gallic-infantry`. Phần mô hình là việc của lane 1 sau khi lane 2 tách dữ liệu.
- Nếu người dùng chọn phương án quần và torc: áp bản vá, dựng lại, thêm nguồn vào `art/CREDITS.md`.

### 3. Nhát chém Gaul (`gallic-infantry`, `attack`)

- Clip dựng lại (`whp_clips._cut`, `sword_slash`): lúc vươn xa nhất về trước, lưỡi kiếm nằm ngang ở cao 1,27–1,42 m (mép trên khiên legionary 1,38 m, 1,58 m khi giơ đỡ). Độ dài 1,333 s giữ nguyên.
- Cảnh đo: lúc đòn chạm 0,500 → 0,467 s; tầm 0,976 → 1,536 m.
- Khoảng đấu lấy theo người tầm ngắn hơn, nên cặp Gaul–legionary đứng xa hơn khoảng 10% (1,27 → 1,40, đơn vị mô hình).
- Ảnh: `chem-gaul-trong-canh` (`/battle-lab?duel=1` ở khung đòn chạm), `chem-gaul-blender`.

### 4. Xuất và kiểm tra

- **Clip** (`glbdiff.mjs`, so với `main` trước task): mọi clip, nút và skin của 11 mô hình giống hệt, trừ `attack` của `gallic-infantry` (59 trên 201 kênh). `block`, `hit` không đổi.
- **Dựng lại ra đúng từng byte:**
  - lần dựng lại thứ hai đầu tiên lệch ở `gallic-infantry` (pháp tuyến, tangent của ba đỉnh LOD1 thuộc một mảnh vụn một tam giác); đã sửa bằng cách bỏ mảnh rời dưới 3 mặt (`f266814`);
  - sau đó 11 mô hình dựng hai lần giống nhau và giống bản commit;
  - ba kỵ binh dựng thêm hai lần sau khi làm lại vạt áo, giống nhau và giống bản commit.
- **Ảnh duyệt trong repo** đã render lại: `balearic-slinger`, `iberian-gallic-cavalry`, `numidian-cavalry`, `roman-cavalry` (đủ bộ), `gallic-infantry` (`06-lods`, cùng ảnh trận thử `art/renders/duel-*`).
- `npm run lint`, `npm run validate`, `npm run build`: qua.
- `--hi` (thang LOD cũ): đường dựng không đổi, chỉ thêm `apply_drape` sau bake. Chưa chạy thử lại.

### Đề nghị cho phiên chính

- Không có nguồn hay chất liệu mới cần ghi công trong app: tóc, vạt áo, bảng màu LOD đều dựng bằng script. Nếu dùng phương án ý 9 thì thêm các nguồn cổ ở trên vào `art/CREDITS.md`.
- Ý 9: chọn giữa phương án quần và torc và việc tách loại lính (lane 2, rồi lane 1).
