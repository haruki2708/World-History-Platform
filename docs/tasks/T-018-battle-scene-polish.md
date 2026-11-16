# T-018: Cảnh 3D: góc nhìn đầu, nhãn địa danh, danh sách mô hình, vật liệu kim loại

- **Lane:** 3
- **Model đề xuất:** Fable 5.2, effort `high`.
- **Nhánh:** `lane3/T-018-battle-scene-polish` (tạo từ `main` mới nhất)
- **Phạm vi file:** `src/components/battle/`, khoá `battle.scene.*` trong `src/lib/i18n/messages.ts`

## Bối cảnh

T-014, T-015, T-016 đã gộp vào `main`. Cảnh 3D giờ có dữ liệu Cannae thật (22 khối quân, 6 giai đoạn, địa hình 341×271) và mô hình lính La Mã thật (`public/battles/models/roman-legionary.glb`). Phiên chính đã thử cả ba cùng nhau: engine dùng mô hình thật mà không phải sửa code, khoảng 180–200 khung hình/giây trên RTX 3050. Task này sửa những gì review tìm thấy và chuẩn bị cho đợt B.

## Đọc trước

- `docs/ARCHITECTURE.md`, mục "Mô hình lính" (mới cập nhật: danh sách mô hình, ảnh độ nhám và kim loại, không có chuyển động gốc, tư thế gốc).
- `src/lib/battle.ts`: thêm `MODEL_INDEX_URL`, `ModelIndex`, `Battle.dayOfYear`.
- `art/README.md`, mục "Ghi chú cho cảnh 3D (lane 3)" do lane 1 viết.

## Yêu cầu

1. **Danh sách mô hình.** Đọc `MODEL_INDEX_URL` (`public/battles/models/index.json`) trước, rồi chỉ tải các mô hình có trong danh sách. Thiếu file danh sách hoặc file sai thì vẽ hình tạm cho mọi loại lính, không tải thử từng file. Kết quả: `/battle-lab` với Cannae không còn dòng 404 nào trong console.
2. **Góc nhìn khi mở cảnh.** Hiện engine bao trọn mọi vị trí trong cả ngày, gồm các trại và kỵ binh Numidia đuổi xa 6 km, nên hai chiến tuyến chỉ chiếm một mảng nhỏ giữa màn hình.
   - Mở vào vùng quân chủ lực đang đứng ở `battleTime` hiện tại. Bỏ qua các khối ở quá xa phần còn lại, ví dụ toán quân giữ trại.
   - Với Cannae ở 1280×800, hai chiến tuyến lúc dàn trận phải chiếm phần lớn bề ngang khung hình.
   - Lane tự chọn cách tính; ghi lại trong mục "Kết quả".
3. **Nhãn địa danh không đè nhau.** Ví dụ ở góc nhìn toàn cảnh Cannae: "Large Roman camp", "Roman crossing" và "Small Roman camp" chồng lên nhau. Áp dụng cho cả nhãn sông. Nhãn nào không có chỗ thì ẩn, hoặc dịch sang chỗ khác, miễn đọc được.
4. **Ngày trong năm.** Có `battle.dayOfYear` thì dùng để tính đường đi của mặt trời. Không có thì giữ cách hiện tại.
5. **Ảnh pháp tuyến, ảnh độ nhám và kim loại.**
   - File `.glb` của lính La Mã đã có ảnh pháp tuyến 1024×1024; đợt B sẽ thêm ảnh độ nhám và kim loại.
   - Ở chất lượng cao, dùng các ảnh này nếu file có, ít nhất cho LOD0, để mũ đồng và giáp trông như kim loại.
   - Chất lượng thấp giữ vật liệu đơn giản.
   - Vẫn phải đạt mục tiêu hiệu năng của T-015 (`?stress=7000` từ 50 khung hình/giây). Đo lại và ghi số.
   - Muốn thử ảnh độ nhám và kim loại khi lane 1 chưa xuất: thêm vào `tools/make-test-model.mjs`.
6. **Ảnh cận cảnh cho người dùng.** Lần review trước chưa chụp được mô hình thật ở LOD0 trong cảnh. Chụp:
   - một khối lính La Mã ở LOD0 và một ở LOD1, đang chơi `idle` và `attack`;
   - lúc trưa và lúc chiều tối;
   - trước và sau việc 5.

   Để ảnh ngoài repo, ghi đường dẫn trong "Kết quả".

## Ràng buộc

- Như T-015: chỉ dùng three.js đã cài; three.js chỉ nạp trong `src/components/battle/`; không sửa `src/lib/`, `src/store/`, `src/data/`, `src/app/`, `public/`. Hợp đồng chưa đủ thì ghi đề nghị.
- Lane 1 có thể đang chạy Blender. Khi đo hiệu năng, làm như T-015: kiểm tra `blender.exe` và ghi điều kiện đo.

## Xong khi

- `/battle-lab` với Cannae:
  - console sạch;
  - mở cảnh thấy rõ hai chiến tuyến;
  - nhãn địa danh không đè nhau.
- `?stress=7000&stats=1` vẫn đạt mục tiêu, có số đo mới.
- `npm run lint` và `npm run build` qua.

## Kết quả

_(Lane 3 điền khi xong.)_
