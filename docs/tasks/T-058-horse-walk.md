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

(Lane 2 điền khi xong.)
