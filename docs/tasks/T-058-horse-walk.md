# T-058: Móng ngựa trượt và lún khi đi bước

- **Lane:** 2
- **Model đề xuất:** Opus 5.5, effort `high`.
- **Nhánh:** `lane2/T-058-horse-walk` (phiên chính đã tạo sẵn từ `main` trong worktree của bạn).
- **Phạm vi file:** `art/blender/horse_*.py`, `art/renders/horse/`, `art/README.md` (mục "Ngựa"). **Ngoại lệ cho task này**, như ở T-030: được chạy script dựng của lane 1 để xuất lại **bốn mô hình kỵ binh** (`roman-cavalry.glb`, `iberian-gallic-cavalry.glb`, `numidian-cavalry.glb`, `gallic-cavalry.glb` trong `public/battles/models/`) và ảnh duyệt của chúng. Không sửa script của lane 1.
- **Kế hoạch chung:** `docs/PLAN.md`, mục "Đợt L", việc B3.

## Bối cảnh

Người dùng xem hai trận trên bản production (2026-11-20) và chọn làm đẹp lính 3D, trong đó có ngựa. Việc còn ghi lại từ T-030 và T-020:

- Clip `walk` của ngựa là dáng đi gốc của bộ khung: móng trụ trượt tới 101–102% ở vài khung, vì móng lăn từ gót tới mũi lúc chạm đất nên điểm thấp nhất chạy dọc móng. T-030 thử khoá móng: sải ngắn đi mà vẫn trượt, nên để nguyên.
- `walk` để móng trước lún tối đa 3,2 cm xuống đất ở vài khung.

`jog` (nước kiệu) và `run` (phi nước đại) đã khoá móng ở T-030, trượt khoảng 1%. Task này đưa `walk` về cùng mức.

Sau task này lane 1 sẽ thêm clip `ridedown` (đánh lúc ngựa phi) vào bốn file kỵ binh, dựng trên `run` của ngựa. Vì vậy **không đổi `run` và `jog`** trong task này.

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Dựng lại `walk` của ngựa

- Cách làm do bạn chọn. Gợi ý: dựng lại như bạn đã dựng `run` ở T-030 (`horse_gallop.py`): đặt móng theo nhịp bốn tiếng của dáng đi bước, cho móng đặt phẳng suốt lúc trụ và chỉ lăn mũi lúc nhấc lên.
- **Móng trụ trượt không quá 3%**, đo như cảnh đo (`art/tools/gait_check.py`, trên LOD0 của file `.glb`).
- **Móng không lún quá 1 cm** dưới mặt đất ở bất kỳ khung nào.
- Sải và độ dài clip được phép đổi (cảnh đo sải từ chính clip lúc nạp). Giữ đúng dáng đi bước bốn nhịp: lúc nào cũng có ít nhất hai móng chạm đất, đầu và cổ gật nhẹ theo bước. Tốc độ tự nhiên nên gần mức hiện nay (1,08 m / 1,667 s ở cỡ mô hình), để chỗ cảnh đổi `walk` sang `jog` (quanh 3,6 m/s trên sân) không xê dịch nhiều; nếu đổi thì ghi số mới.
- Clip lặp liền mạch.

### 2. Xuất lại bốn mô hình kỵ binh

- Dựng ngựa, rồi chạy script của lane 1 cho bốn mô hình.
- Trong mỗi file, **mọi clip khác `walk` giống hệt từng byte** so với file trong `main`; lưới, skin và ảnh cũng vậy. Trước khi sửa, dựng lại một lần và so với file đã commit, để chắc môi trường dựng không đổi.
- Mỗi file vẫn dưới 4 MB.
- Ngựa Numidia thu còn 0,95 lần: đo riêng.

### 3. Kiểm tra và ảnh

- Bảng sải và độ trượt của `walk`, trước và sau, cho bốn mô hình. Độ lún sâu nhất của móng, trước và sau.
- Ảnh duyệt `art/renders/horse/` cho `walk` mới (dải khung nhìn ngang, có đường mặt đất). Chép vào `E:\World_History_Platform_assets\duyet\T-058\`.
- Trong cảnh (`/battle-lab`, bản dev; driver chụp của phiên chính ở `E:\World_History_Platform_assets\main-tools\drive`, đặt `PORT=9362`): một khối kỵ binh đang đi bước, chụp cận cảnh hai khung liên tiếp cách nhau một phần ba giây, trước và sau. Ở Cannae giai đoạn 1 có kỵ binh đi bước.
- `npm run validate`, `npm run lint`, `npm run build` qua.
- `art/README.md`, mục "Ngựa": số sải mới, cách dựng.

## Ràng buộc

- Chỉ sửa file trong phạm vi. Không sửa `src/` và script của lane 1.
- Không thêm thư viện, không thêm nguồn có điều kiện ghi công mà chưa hỏi.

## Xong khi

- `walk` của bốn mô hình kỵ binh trượt không quá 3% và không lún quá 1 cm; các clip khác không đổi từng byte.
- Có bảng số, ảnh trước và sau; mục "Kết quả" đã điền.
- Nếu không đạt được mức 3% mà vẫn giữ được dáng đi bước tự nhiên, dừng và ghi vào "Kết quả" mức đạt được và lý do, để phiên chính và người dùng quyết.

## Kết quả

Phiên chính làm thay lane 2 (người dùng giao việc của lane 1 và lane 2 cho phiên chính ở lượt này, 2026-11-20). Nhánh `lane2/T-058-horse-walk`, từ `main`.

### Trước khi sửa

Dựng lại ngựa từ file gốc (cả năm giai đoạn) và bốn mô hình kỵ binh bằng code của `main`: `horse-test.glb`, `horse-info.json` và cả bốn file `.glb` ra giống hệt từng byte bản đã commit (và bản lane 2 dựng trước đây). Môi trường dựng không đổi: Blender 5.2.2 ở `D:\Tools\Blender\5.2.2`.

### 1. `walk` của ngựa dựng lại (`art/blender/horse_walk.py`, mới)

Soi clip gốc từng chân (lưới chi tiết):
- Giữa mỗi lần chạm đất, móng đã nằm phẳng và lùi đều 24,1 mm mỗi khung (1,20 m mỗi vòng), 26–27 trên 50 khung; lúc nào cũng có hai hay ba móng chạm đất. Dáng đi bốn nhịp đúng.
- Lỗi chỉ ở hai đầu mỗi lần chạm: móng hạ bằng mũi rồi xoay phẳng trong khi vẫn trôi tới; lúc nhấc, móng xoay quanh đỉnh móng nên mũi cắm xuống đất (móng trước 3,2 cm trên lưới chi tiết, 3,4 cm trên LOD0) và trượt tới. Cảnh đọc ra sải 1,08 m và trượt 101%.

Cách dựng (`horse_walk.walk`, `horse_build.py` gọi ở giai đoạn `anim`):
- Giữ thân, cổ, đầu, đuôi của clip gốc (đầu vẫn gật theo bước) và chân lúc móng nằm phẳng; móng được đặt chính xác: phẳng, lùi đều đúng 24,1 mm mỗi khung.
- **Lúc nhấc:** móng lăn qua mép trước của đế theo đúng góc của móng trong clip gốc, tới khi góc đó qua 45° (chân sau 1 khung ở 31°, chân trước 2 khung ở 12° và 33°); mép trước nằm yên trên đất, lùi cùng mặt đất.
- **Lúc đặt:** ba khung trước mỗi lần chạm, móng đã nằm phẳng, lùi cùng mặt đất và hạ dần từ 3 cm xuống.
- **Trên không:** đường của clip gốc cộng một độ lệch chuyển mượt (cả góc móng, nên móng phẳng dần trước khi đặt), như clip phi của T-030; điểm thấp nhất của móng cao hơn đất ít nhất 3 cm.
- **Cổ chân:** lúc móng được đặt, xương cổ chân giữ góc nghỉ với móng; chân phía trên với tới nó bằng IK phẳng. Gần ba phần tư số đỉnh đế của lưới chi tiết gắn một phần vào xương cổ chân (tới 37% trọng số). Nếu cổ chân xoay trên móng khi chân quét, các đỉnh ấy trượt tới 6,5%.
- Thử lăn tới 60° (thêm một khung 56° ở chân trước) thì trên LOD0 trượt 2,5%, vì mép trước của LOD0 nằm trước mép của lưới chi tiết khoảng 3 mm. Dừng ở 45° thì còn 0,6%.

Trên lưới chi tiết (`horse-info.json`): sải 1,203 m, trượt 0,6%, không đỉnh nào xuống dưới mặt đất, độ cao yên không đổi (1,353..1,364 m). Bốn clip còn lại của ngựa (`idle`, `run`, `die` trong bản xuất thử; `trot`, `canter`) giống hệt từng byte.

**Tốc độ tự nhiên đổi:** 0,65 → 0,72 m/s ở cỡ thật (1,95 → 2,17 m/s trên sân), vì sải mới là quãng móng thật sự lùi trong clip gốc. Chỗ cảnh đổi `walk` sang `jog` (trung bình nhân hai tốc độ) dời từ khoảng 3,57 lên 3,77 m/s trên sân (+5%). Ghi ở `art/README.md`, mục "Ngựa".

### 2. Bốn mô hình kỵ binh

Dựng lại ngựa rồi chạy `build_model.py` của lane 1 cho bốn mô hình (không sửa script của lane 1). Đo bằng `art/tools/gait_check.py` trên LOD0; lún đo trên mọi đỉnh của móng ở LOD0:

| Mô hình | Sải `walk`, trước → sau | Trượt lớn nhất, trước → sau | Lún sâu nhất, trước → sau | File |
|---|---|---|---|---|
| `roman-cavalry` | 1,082 → 1,203 m | 101% → 0,6% | 3,4 → 0,0 cm | 2,46 MB |
| `iberian-gallic-cavalry` | 1,082 → 1,203 m | 101% → 0,6% | 3,4 → 0,0 cm | 2,15 MB |
| `numidian-cavalry` (ngựa 0,95 lần) | 1,027 → 1,143 m | 101% → 0,6% | 3,2 → 0,0 cm | 2,14 MB |
| `gallic-cavalry` | 1,082 → 1,203 m | 101% → 0,6% | 3,4 → 0,0 cm | 2,41 MB |

- Trong mỗi file, mọi clip khác `walk` giống hệt từng byte so với `main` (`main-tools/glb-clips.mjs`). Lưới ba mức, skin, ảnh và các nút cũng giống hệt (`main-tools/glb-parts.mjs`, công cụ mới của phiên chính).
- `build_model.py` không báo lỗi nào; bước kiểm tra mặt đất của bản xuất (`walk` khung 0) qua.

### 3. Ảnh

- `art/renders/horse/12-walk-before-after.jpg` (mới, `horse_render.py -- --only walk`): mỗi khung chẵn, nhìn từ bên trái, trên một dải tối ngay dưới mặt đất; hai hàng trên là clip gốc, hai hàng dưới là `walk` mới. `05-anim-walk.jpg` render lại; ba ảnh `anim` khác ra giống hệt từng byte.
- Chép vào `E:\World_History_Platform_assets\duyet\T-058\`, kèm ảnh phóng to móng ở khung 18, 20, 22 (trên: trước, móng trước cắm qua vạch đất lúc nhấc; dưới: sau).
- **Trong cảnh:** Cannae giai đoạn 3, kỵ binh đồng minh (mô hình `roman-cavalry`) đi bước khoảng 2,6 m/s trên sân. Chụp con ngựa ở đầu hàng phía tây từ bên cạnh, hai khung cách nhau một phần ba giây, trước và sau (`13-...png`, `13a`, `13b` trong thư mục ảnh; kịch bản `main-tools/drive/s-t058-walk.mjs`). Cỏ che một phần móng; ở ảnh sau móng nằm trên mặt đất. Task ghi giai đoạn 1, nhưng từ T-059 giai đoạn 1 dài 45 giây nên kỵ binh ở đó chạy kiệu; khối đi bước ở Cannae là kỵ binh đồng minh ở giai đoạn 3 và 4.

### 4. Kiểm tra

`npm run validate`, `npm run lint`, `npm run build` qua.

`art/README.md`: mục "Ngựa" (bảng clip, mục mới "Clip đi bước", lưu ý cho cảnh, ảnh, bảng file) và bảng sải của mục "Kỵ binh".
