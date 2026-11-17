# T-027: Tải sẵn cảnh trong lúc bay, và chỉnh dữ liệu Cannae sau T-026

- **Lane:** 2
- **Model đề xuất:** Opus 5.5, effort `high`.
- **Nhánh:** `lane2/T-027-prefetch-data` (tạo từ `main` mới nhất)
- **Phạm vi file:**
  - `src/components/map/`;
  - `src/data/battles/`, `docs/data/battles/`, `scripts/battles/`;
  - khoá `map.*` trong `src/lib/i18n/messages.ts`, cả `en` lẫn `vi`.

## Bối cảnh

Đã gộp T-024, T-025 và T-026. Khi gộp T-025, phiên chính làm hai việc:
- **Bỏ màn chờ ở lần mở đầu:** đúng như đề nghị 1 của bạn, `AppShell` giữ component khung xem trận khi code đã về trong lúc bay.
- **Nối cú hạ camera với cảnh bản đồ:** khung xem trận giờ mở ra nhìn thẳng xuống tâm vùng địa hình, đủ cao để thấy cả vùng, hướng bắc lên, rồi hạ xuống góc nhìn mở.

Người dùng duyệt cho bạn làm tiếp hai việc nhỏ:
1. **Tải sẵn tài nguyên của cảnh trong lúc bay**, theo đề nghị 2 của bạn ở T-025.
2. **Chỉnh dữ liệu Cannae** theo những gì T-026 (cảnh) và T-024 (mô hình) cho phép hoặc phát hiện.

Trong lúc bạn làm, lane 1 làm T-022 (kỵ binh và clip `jog`) trong `art/`. Riêng task này, lane 1 được sửa các file ngựa `art/blender/horse_*.py` nếu cần, vì bạn không đụng tới chúng.

## Đọc trước

- `docs/ARCHITECTURE.md`:
  - mục "Trạng thái chung", đoạn "Mở trận qua bản đồ (T-025)";
  - mục "Cảnh 3D": quay đầu từ 135°; nhãn bị che;
  - mục "Mô hình lính": `jog`.
- `docs/tasks/T-026-scene-fixes.md`, mục "Kết quả", phần "Ghi chú cho lane 2".
- `docs/tasks/T-024-model-polish.md`, mục "Kết quả", phần 1, đoạn "Ghi chú cho lane 3": các khối đi xiên ở pha 5–6.
- `src/components/battle/engine/BattleEngine.ts`, hàm `load`: cảnh tải những gì (địa hình, `index.json`, các file `.glb`). Chỉ đọc.

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Tải sẵn tài nguyên của cảnh trong lúc bay

Khi `battleRequest` khác `null` và đã có dữ liệu trận (`loadBattle`), tải sẵn vào cache của trình duyệt:
- file địa hình của trận;
- `public/battles/models/index.json`;
- các file `.glb` mà trận cần: mô hình của các loại lính trong trận (`unitTypes`), chỉ những mô hình có trong `index.json`.

Yêu cầu:
- Không kéo three.js vào trang chính: chỉ dùng `fetch` (hoặc `<link rel="prefetch">`). Code nằm trong `src/components/map/`, cạnh chuyến bay.
- Cảnh phải dùng lại được đúng các phản hồi đó từ cache. Kiểm tra bằng danh sách request: sau khi khung xem trận mở, không có lượt tải thứ hai, hoặc chỉ là phản hồi từ cache.
- Không tải gì khi người dùng chưa bấm xem trận.
- Đo thời gian từ lúc bấm tới lúc cảnh vẽ xong, trước và sau. Đo trên mạng giả lập chậm, ví dụ `Network.emulateNetworkConditions` khoảng 20 Mb/s và độ trễ 40 ms, vì trên localhost lợi ích rất nhỏ.

### 2. Dữ liệu Cannae

- **Triarii ở giai đoạn 6:** T-026 đã cho khối quay đầu tại chỗ. Cho triarii quay về hướng phù hợp với nguồn, như bạn đã định ở `docs/data/battles/cannae.md`, mục 9. Xem lại trong cảnh rồi cập nhật tài liệu.
- **Các khối đi xiên so với hướng mặt** (ghi chú của lane 1 ở T-024): ở pha 5–6, một số khối đi xiên so với hướng mặt, nên chân trụ trượt nhiều.
  - Viết một script nhỏ (hoặc thêm vào `check-overlap.mjs`) liệt kê các khối có hướng đi lệch hướng mặt quá 45° ở từng giai đoạn.
  - Khối nào nguồn cho phép thì chỉnh hướng mặt hay đường đi. Khối nào đúng là phải đi xiên (ví dụ người Libya bẻ hướng vào sườn quân La Mã) thì ghi lại để phiên chính xem phía cảnh.
- Mọi thay đổi dữ liệu phải qua `npm run validate`, và ghi vào `docs/data/battles/cannae.md`.

## Ràng buộc

- Không sửa store, `src/lib/`, `src/data/index.ts`, `src/app/`, `src/components/battle/`. Cần đổi thì ghi đề nghị vào "Kết quả".
- Không thêm thư viện npm.
- Dev server dùng cổng 3102.

## Xong khi

- Bấm xem trận thì tài nguyên của cảnh tải trong lúc bay; cảnh dùng lại từ cache. Có số đo thời gian trước và sau trên mạng chậm.
- Trang chính vẫn không tải three.js trước khi bấm, và không tải tài nguyên cảnh trước khi bấm.
- Triarii quay đúng ở giai đoạn 6; có danh sách các khối đi xiên kèm cách xử lý.
- `npm run lint`, `npm run build`, `npm run validate` qua.

## Kết quả

_(Lane 2 điền khi xong.)_
