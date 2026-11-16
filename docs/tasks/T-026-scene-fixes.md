# T-026: Sửa cảnh 3D trước khi có kỵ binh

- **Lane:** 3
- **Model đề xuất:** Fable 5.2, effort `high`. Hết hạn mức thì dùng Opus 5.5, effort `xhigh`.
- **Nhánh:** `lane3/T-026-scene-fixes` (tạo từ `main` mới nhất)
- **Phạm vi file:** `src/components/battle/`, khoá `battle.*` trong `src/lib/i18n/messages.ts` (cả `en` lẫn `vi`).

## Bối cảnh

Đã gộp:
- T-021: đủ 8 mô hình bộ binh;
- T-020: ngựa, và dữ liệu Cannae chỉnh trong cảnh thật;
- T-023: khung xem trận. Phiên chính làm nốt sau khi bạn hết hạn mức; đọc mục "Kết quả" của file này để biết phần đã làm thêm.

Còn T-022 (lane 1, ba loại kỵ binh: người cưỡi trên ngựa của lane 2). Task này sửa những gì review và các lane khác thấy trong cảnh, và chuẩn bị cho kỵ binh.

Trong lúc bạn làm:
- lane 1 làm T-024 (sửa mô hình bộ binh, trong `art/`);
- lane 2 làm T-025 (bản đồ bay tới chiến trường trước khi mở trận, trong `src/components/map/`).

## Đọc trước

- `docs/ARCHITECTURE.md`, mục "Mô hình lính". Mới có:
  - độ dài `attack` theo kiểu đánh;
  - xương `ik_hand_gun`;
  - chiều cao giáo triarii;
  - ngựa.
- `docs/tasks/T-020-horse.md`, mục "Kết quả", phần "Đề nghị cho lane 3".
- `docs/tasks/T-021-infantry-models.md`, mục "Đề nghị ngoài phạm vi", ý 1–3.
- `docs/data/battles/cannae.md`, mục 9: vì sao triarii vẫn nhìn về nam ở giai đoạn 6.
- `art/README.md`, mục "Ngựa" và "Gắn người cưỡi".

## Yêu cầu

Commit sau mỗi việc. Nếu sắp hết hạn mức thì ghi bảng tiến độ vào mục "Kết quả" rồi commit.

### 1. Quay đầu tại chỗ (lane 2 đề nghị)

**Hiện tại:** khi `facing` của một khối đổi gần 180° mà tâm khối gần như đứng yên, cảnh xoay cả khối quanh tâm. Khối triarii rộng 820 m vì vậy quét ngang qua cả đạo quân.

**Cần làm:** trong trường hợp này, từng hình lính quay đầu tại chỗ, không xoay cả khối. Hàng đầu và hàng cuối đổi vai cho nhau là chấp nhận được.
- Tự đặt ngưỡng cho "gần 180°" và "gần như đứng yên", ghi lại trong code.
- Xong thì ghi vào "Kết quả" để lane 2 biết có thể cho triarii quay về bắc ở giai đoạn 6.

### 2. Chuẩn bị cho kỵ binh

- **Sải chân của ngựa:** `plantedStride` phải đo được bước chân bốn chân (móng), hoặc có cách khác hợp lý cho ngựa. Ghi cách làm.
- **Tốc độ phát `run` của kỵ binh:**
  - một vòng `run` của ngựa (phi nước đại) dài 0,4 s và chỉ không trượt chân quanh 3 m/s;
  - lane 2 đề nghị giới hạn tốc độ phát khoảng 1,5 lần;
  - kiểm tra ngưỡng chuyển `walk`/`run` hiện có có hợp với ngựa không.
- **Thử với ngựa thật:**
  - dùng `art/build/horse/horse-test.glb` (ngựa trần, 4 clip). File này không có trong git; dựng bằng `art/blender/horse_build.py`, khoảng 1 phút; xem `art/README.md`, mục "Ngựa";
  - tạm chép vào `public/battles/models/` dưới tên một mô hình kỵ binh và tạm thêm vào `index.json`, như cách làm ở T-018;
  - xem ở cự ly gần lúc đi, lúc phi, lúc ngã;
  - thử xong thì trả `public/battles/models/` về như cũ.

### 3. Mức chi tiết của khối dàn rộng

Mức chi tiết đang chọn theo lô 256 hình. Khối dàn rộng (velites, lính ném đá) có lô mà tâm nằm ở xa, nên nhìn gần 22 m vẫn thấy hình LOD2 (khiên thành hình bát giác).

Sửa để hình ở gần luôn đủ chi tiết, ví dụ chia lô theo vị trí hay chọn mức chi tiết theo hình gần nhất của lô. Ghi số đo hiệu năng trước và sau.

### 4. Vùng màu dưới chân lính

Khi nhìn gần, vùng màu đánh dấu khối quân trên mặt đất phủ lên chân lính. Sửa, ví dụ:
- cho vùng màu mờ dần khi camera lại gần;
- hoặc vẽ vùng màu nằm dưới hình lính.

### 5. Nhãn địa danh trước hàng lính

Nhãn là HTML phủ lên cảnh. Khi nhìn thấp, nhãn của địa danh ở phía sau vẫn hiện đè lên hàng lính phía trước. Sửa, ví dụ:
- ẩn hay làm mờ nhãn khi điểm của nó bị địa hình hay khối quân che;
- hoặc mờ dần khi camera xuống thấp.

### 6. Tuỳ chọn: hạ camera khi mở trận

Lane 2 cho bản đồ bay tới chiến trường, hướng bắc lên, nhìn thẳng xuống. Nếu gọn, khi khung xem trận vừa mở:
- camera bắt đầu từ trên cao, nhìn thẳng xuống, hướng bắc lên;
- trong khoảng 1,5 giây hạ dần xuống góc nhìn mở hiện có;
- bỏ qua nếu người dùng bật giảm chuyển động, hoặc khi người dùng chạm vào cảnh.

### Kiểm tra chung

- `/battle-lab` và khung xem trận: console sạch.
- Đo lại hiệu năng bằng `s-perf.mjs` trên bản production, máy sạch (không có `blender.exe`), so với số trong mục "Kết quả" của T-023: 63–72 khung hình/giây khi đang phát.
- Đo lại bộ nhớ bằng `s-memory.mjs`.
- Công cụ thử của bạn ở `E:\World_History_Platform_assets\T-023\tools\` vẫn dùng được.

## Ràng buộc

- Không sửa store, `src/lib/`, `src/data/`, `src/app/`. Cần đổi thì ghi đề nghị vào "Kết quả".
- Không import component của lane khác. Không thêm thư viện npm.
- Không để lại thay đổi nào trong `public/battles/models/`.
- Lane 1 và lane 2 có thể đang chạy Blender. Trước khi đo hiệu năng thì kiểm tra `blender.exe` và ghi điều kiện đo.
- Dev server dùng cổng 3103. Tắt dev server cũ của bạn trước.

## Xong khi

- Việc 1–5 xong, hoặc ghi rõ lý do nếu không làm được.
- Ngựa thử chạy được trong cảnh: chân không trượt rõ ở tốc độ hợp lý.
- Hiệu năng vẫn từ 50 khung hình/giây trở lên khi đang phát, máy sạch.
- `npm run lint`, `npm run build`, `npm run validate` qua.

## Kết quả

_(Lane 3 điền khi xong.)_
