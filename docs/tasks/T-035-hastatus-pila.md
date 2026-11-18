# T-035: Hastatus cất hai cây *pilum* khi giáp lá cà

- **Ai làm:** phiên chính (người dùng chọn "làm ngay sau khi gộp" đợt G, 2026-11-18).
- **Model:** Fable 5.2, effort `high`.
- **Nhánh:** `batch-g/pila` (tạo từ `main` sau khi gộp chặng 3 của đợt G).
- **Trạng thái:** xong 2026-11-18; chờ người dùng duyệt gộp.
- **Phạm vi file:** `src/components/battle/engine/figures/model.ts`, `figures/material.ts`, `engine/units.ts`, `docs/`. Không đổi file mô hình, không đổi hợp đồng `src/lib/battle.ts`.

## Vấn đề

Hai cây *pilum* hastatus cầm ở tay khiên nằm trên một xương riêng. Các clip `attack`, `block`, `hit`, `die` thu xương đó còn 1% (`SPARE_GONE` trong `art/blender/whp_clips.py`); `idle`, `walk`, `jog`, `run` thì không. Khi giáp lá cà, người đầu hàng đổi qua lại giữa `idle` và ba clip kia, nên hai cây *pilum* biến đi rồi hiện lại tới hai lần mỗi 2,4 giây (review chặng 2 của lane 3, mục 4).

## Cách làm

Không dựng lại mô hình. Cảnh tự giữ hai cây *pilum* ở trạng thái "đã cất" cho người đang đánh gần:

- **`figures/model.ts`:** lúc nạp mô hình, tìm xương mà khung đầu của `hit` nhỏ hơn một phần năm so với khung đầu của `idle` (`findStowed`). Có đúng một xương như vậy thì ghi vào `UnitModel.stow`: số của xương và điểm nó co về (đầu xương ở tư thế gốc, tức cổ tay). Mô hình không có `hit`, hoặc không có xương nào như vậy: `null`.
- **`figures/material.ts`:** thuộc tính `iStrike` của từng hình thành hai số: giây của clip đè lên (như cũ) và mức đã cất, 0 tới 1. Shader kéo các đỉnh gắn vào xương đó về điểm co theo mức đã cất (uniform `uStow`), ở cả vật liệu thường, vật liệu chi tiết và vật liệu bóng đổ.
- **`engine/units.ts`:** người **đầu hàng dọc** của khối đang `fight` cất trong 0,3 giây thật (`STOW_SECONDS`); hết là đầu hàng, hay khối thôi `fight`, thì lấy ra lại. Người ngã giữ nguyên mức đang có. Sau khi tua, mức đặt ngay theo trạng thái lúc đó. Hàng sau vẫn cầm *pilum*.

Chỉ `roman-hastatus` có xương như vậy; mười mô hình còn lại ra `stow: null` và shader bỏ qua nhánh này.

## Đã kiểm tra

- `npm run lint`, `npm run validate`, `npx tsc --noEmit`: qua.
- Trong trình duyệt (dev, `main-tools/drive/s-stow.mjs`, `s-stow1.mjs`):
  - `/battle-lab?duel=1`: cảnh nhận `stow` cho `roman-hastatus` (xương số 5, điểm co ở cổ tay trái) và `null` cho mười một khối còn lại. Giữa giai đoạn giáp lá cà, 25 người đầu hàng của hastati đều đã cất (cộng 2–3 người vừa ngã), 139 người đang đứng. Ảnh nhìn dọc hàng đầu: hàng sau còn *pilum* cạnh khiên, người đang đánh thì không.
  - Cannae giai đoạn 4: 95 người đầu hàng của hastati đã cất (521 người đang đứng); giai đoạn 5: 82 (387).
  - Console sạch.
- `npm run build` (worktree tạm, commit `c49eded`): qua. Hồi quy lõi của app (`main-tools/reg-core.js`) trên bản production đó: 17/17, console sạch (trận Cannae mở được, tức shader mới biên dịch được ở cả ba vật liệu).
- Chưa đo tốc độ khung hình: phần thêm là một số thực cho mỗi hình lính và một nhánh theo uniform trong shader, mười mô hình không có đồ cất thì bỏ qua.

## Còn lại

- Người đầu hàng lấy *pilum* ra lại khi khối thôi `fight` (ví dụ sang `rout`): theo sử thì đã ném rồi, nhưng cảnh không ghi ai đã ném.
- Người ở hàng sau bước lên thành đầu hàng thì cất *pilum* lúc đó, không ném.
