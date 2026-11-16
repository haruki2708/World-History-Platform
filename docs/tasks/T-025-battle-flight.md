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

_(Lane 2 điền khi xong.)_
