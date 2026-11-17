# T-028: Tên khối quân trên cảnh, và khối đi xiên

- **Lane:** 3
- **Model đề xuất:** Fable 5.2, effort `high`. Hết hạn mức thì dùng Opus 5.5, effort `xhigh`.
- **Nhánh:** `lane3/T-028-unit-labels` (tạo từ `main` mới nhất)
- **Phạm vi file:** `src/components/battle/`, khoá `battle.*` trong `src/lib/i18n/messages.ts` (cả `en` lẫn `vi`).

## Bối cảnh

Trong lúc bạn hết hạn mức, đã gộp:
- **T-023:** phiên chính làm nốt phần còn lại;
- **T-026:** phiên chính làm thay bạn. Đã có: quay đầu tại chỗ, mức chi tiết theo hình lính gần nhất, vùng màu và mũi tên vẽ trước lính, nhãn địa danh ẩn khi bị che (`engine/occlusion.ts`), cú hạ camera khi mở trận;
- **T-024:** chân trụ khoá trong clip;
- **T-025:** bản đồ bay tới chiến trường trước khi mở trận;
- **clip thứ sáu `jog`:** phiên chính thêm vào hợp đồng và engine. Cảnh chọn đi / chạy chậm / chạy nhanh theo tốc độ.

Đọc mục "Kết quả" của T-026 trước, vì đó là code của bạn mà người khác đã sửa.

Người dùng duyệt việc tiếp theo cho bạn:
1. **Tên khối quân trên cảnh:** người xem hiện chỉ thấy các khối màu đỏ và tím, không biết khối nào là hastati, khối nào là người Gaul hay kỵ binh Numidia. Đây là app học lịch sử, nên cần thấy được tên.
2. **Khối đi xiên:** khi khối quân đi xiên so với hướng mặt, chân trụ trượt nhiều. Lane 1 đo được 32–48% ở pha 5–6.

Trong lúc bạn làm:
- lane 1 làm T-022 (kỵ binh và clip `jog`) trong `art/`;
- lane 2 làm T-027: tải sẵn cảnh trong lúc bay, và chỉnh dữ liệu Cannae, trong đó có rà các khối đi xiên về phía dữ liệu.

## Đọc trước

- `docs/ARCHITECTURE.md`: mục "Cảnh 3D", "Khung xem trận", "Mô hình lính" (nhất là `jog`).
- `docs/tasks/T-026-scene-fixes.md`, mục "Kết quả".
- `docs/tasks/T-024-model-polish.md`, mục "Kết quả", phần 1, đoạn "Ghi chú cho lane 3" (khối đi xiên).
- `src/lib/battle.ts`: `BattleUnit` có `name` (song ngữ) và `men`; `UnitState` có `men`, `action`.

## Yêu cầu

Commit sau mỗi phần việc lớn. Nếu sắp hết hạn mức thì ghi bảng tiến độ vào "Kết quả" rồi commit.

### 1. Tên khối quân

- Mỗi khối còn người đứng có một nhãn: tên khối theo ngôn ngữ đang chọn (`unit.name`), kèm chấm màu phe.
- Nhãn bám theo khối khi khối di chuyển, đặt phía trên hàng lính.
- **Không rối:**
  - nhãn khối quân và nhãn địa danh không đè lên nhau, và cùng tránh các lớp phủ của khung (dùng chung `labelLayout`);
  - khi nhiều khối đứng sát nhau (lúc dàn trận có 22 khối), chỉ hiện những nhãn có chỗ, ưu tiên khối lớn hoặc gần camera. Tự đặt quy tắc, ghi lại;
  - nhìn chữ phải phân biệt được nhãn khối quân với nhãn địa danh.
- Nhãn bị che thì ẩn, theo quy tắc của `occlusion.ts`. Khối của chính nhãn không che nhãn đó.
- Có nút bật/tắt tên khối quân trong khung xem trận, mặc định bật. Ghi nhớ lựa chọn trong `localStorage` (bọc try/catch như mức chất lượng).

### 2. Bấm vào một khối quân

- Bấm (không kéo) vào một khối trên cảnh thì hiện một thẻ nhỏ cạnh khối:
  - tên khối, màu phe;
  - loại lính (`unitTypes`);
  - quân số đầu trận và quân số lúc này (đổi theo thời gian, kể cả khi đang phát);
  - khối đang làm gì (`action` lúc này: đứng, tiến, xung phong, giao chiến, rút, tháo chạy, truy kích; thêm khoá `battle.action.*`).
- Bấm ra chỗ khác, Esc, hoặc nút đóng trên thẻ thì thẻ đóng. Esc đóng thẻ trước, lần Esc sau mới đóng khung xem trận.
- **Bàn phím và trình đọc màn hình:** trong tab "Thông tin trận", thêm danh sách các khối quân của mỗi bên (tên, quân số lúc này). Bấm một dòng thì camera bay tới khối đó và mở thẻ của nó. Như vậy không cần chuột vẫn xem được.
- Ở 390 px, thẻ không được tràn khỏi màn hình.

### 3. Khối đi xiên

- **Hiện tượng:** ở pha 5–6, khối đi xiên so với hướng mặt (ví dụ người Libya bẻ hướng vào sườn quân La Mã), nên chân trụ trượt 32–48% (lane 1 đo bằng `s-planted`). Clip chỉ có đi tới (và đi lùi khi giữ mặt về địch), không có đi ngang.
- **Cần làm:** khi khối đi theo hướng lệch nhiều so với hướng mặt (ví dụ quá 45°) mà không đang đánh, từng hình lính quay dần về hướng đi; khi khối dừng hay bắt đầu đánh thì quay lại hướng của khối.
  - Giữ cách đi lùi hiện có: khối lùi mà vẫn quay mặt về địch thì bước lùi, không quay lưng.
  - Tự đặt ngưỡng và tốc độ quay, ghi lại.
- Đo lại bằng `s-planted.mjs` ở pha 5–6, so trước và sau. Lane 2 có thể đồng thời chỉnh hướng của vài khối trong dữ liệu (T-027); engine phải xử lý được trường hợp chung.

### Kiểm tra chung

- Bản production:
  - trang chính không tải three.js trước khi bấm nút;
  - luồng mở/đóng (`s-open.mjs`) ở hai ngôn ngữ;
  - mở đóng 10 lần không rò (`s-memory.mjs`).
- **Hiệu năng:** đo xen kẽ với `main` trong cùng điều kiện (lane 1 hay chạy Blender), như mục "Kết quả" của T-026. Không được chậm hơn rõ rệt.
- **Ảnh chụp** (ngoài repo), lúc dàn trận và lúc giao chiến:
  - 1280×800, tiếng Anh nền sáng và tiếng Việt nền tối;
  - thẻ của một khối;
  - danh sách khối trong tab "Thông tin trận";
  - 390 px.

## Ràng buộc

- Không sửa store, `src/lib/` (trừ khoá `battle.*`), `src/data/`, `src/app/`. Cần đổi thì ghi đề nghị vào "Kết quả".
- Không import component của lane khác. Không thêm thư viện npm.
- Không sửa `public/battles/models/`.
- Dev server dùng cổng 3103. Dev server cũ của bạn có thể vẫn chạy ở cổng này: tắt trước.

## Xong khi

- Thấy tên các khối quân trên cảnh, không rối, ở cả hai ngôn ngữ; bật/tắt được.
- Bấm vào khối, hoặc chọn trong danh sách, thì thấy thẻ thông tin; quân số đổi theo thời gian.
- Khối đi xiên không còn trượt chân rõ: có số đo trước và sau.
- `npm run lint`, `npm run build`, `npm run validate` qua.

## Kết quả

_(Lane 3 điền khi xong.)_
