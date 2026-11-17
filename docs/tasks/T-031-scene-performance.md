# T-031: Lấy lại hiệu năng của cảnh sau đợt E

- **Lane:** 3.
- **Model đề xuất:** Opus 5.5, effort `high`.
- **Nhánh:** `lane3/T-031-scene-perf` (tạo từ `main` mới nhất)
- **Phạm vi file:** `src/components/battle/`.

## Bối cảnh

Đợt E (gộp 2026-11-17) đưa vào cùng lúc T-022 (ba mô hình kỵ binh thật thay cho hình tạm, clip `jog`), T-027 (tải sẵn) và T-028 (tên khối quân, thẻ, đi xiên). Phiên chính đo xen kẽ ba vòng trên bản production, máy sạch (không Blender), RTX 3050, khung bên mở, `s-perf.mjs` của T-028:

| Lúc | Trước đợt E (`2a355b9`) | Sau đợt E |
|---|---|---|
| Phát 1×, giai đoạn 1 / 3 / 4 | 69 / 71 / 69 fps | 59 / 60 / 60 fps |
| p99 khi phát 1× | 17–19 ms | 34–36 ms |
| Phát 2×, giai đoạn 6 | 99 fps | 91 fps |
| Dừng, góc nhìn mở | 102–105 fps | 92–98 fps |

Vẫn trên mục tiêu 50 fps, nhưng khung chậm nhất dài gấp đôi: trên màn hình 60 Hz, cảnh sẽ giật khi phát. Người dùng chọn lấy lại phần chậm này.

**Phiên chính đã tách được** (đo bản sau đợt E, mỗi biến thể hai lượt, số dao động nhiều):
- Tắt nhãn khối quân (`whp.battleUnitNames` = `off`): lấy lại khoảng một nửa.
- Vẽ kỵ binh bằng hình tạm như trước (chặn `index.json` bỏ ba mô hình kỵ binh): lấy lại khoảng một nửa. Kỵ binh thật thêm khoảng 217 nghìn tam giác ở góc nhìn mở (4,04 so với 3,82 triệu).
- Tắt cả hai: ngang trước đợt E (67–70 fps, p99 18 ms).
- Profile CPU lúc phát giai đoạn 1: phần lớn mỗi khung là chờ GPU (`readPixels` khoảng 8,5 ms). JavaScript của cảnh chỉ nhiều hơn 0,5–0,8 ms (`UnitBlock.update` có phần quay người; phần đặt nhãn khoảng 0,2–0,3 ms). Nên phần đắt của nhãn nhiều khả năng là trình duyệt vẽ lại lớp nhãn đè lên canvas mỗi khung (nhãn dời theo khối, có nền trong mờ và bóng), cùng dùng GPU với cảnh.
- Thử nhanh `will-change: transform` cho `[data-unit-label]` (chèn CSS lúc chạy): chưa thấy rõ hiệu quả qua hai lượt.

Kịch bản đo của phiên chính: `E:\World_History_Platform_assets\main-tools\drive\` (`s-perfvar.mjs`: bật/tắt nhãn, kỵ binh thật hay hình tạm, chèn CSS; `s-cpuprof.mjs`).

## Việc dở của T-028 (làm trước)

1. Đo lại trượt chân với code cuối (`s-oblique.mjs`, `s-planted.mjs`), điền vào mục "Kết quả" của T-028 nếu khác bảng cũ.
2. `/battle-lab`: bấm khối, Esc đóng thẻ; nhãn bị khối khác che khi camera thấp (`s-hidden.mjs`).

## Yêu cầu

1. **Tìm chỗ tốn** bằng số đo, không đoán: trace của Chrome (Performance: paint, composite, GPU), profile CPU, so có và không có nhãn.
2. **Nhãn khối quân:** giảm chi phí khi đang phát mà người xem không thấy khác. Gợi ý, thử rồi chọn theo số đo:
   - không vẽ lại khi nhãn chưa dời đủ một pixel (đã có, kiểm tra lại cả phần `text`);
   - lớp compositor riêng cho từng nhãn, hay một lớp chung chỉ dời bằng `transform`;
   - bỏ bóng hay nền trong mờ nếu chúng làm vẽ lại tốn (giữ được độ dễ đọc ở cả nền sáng lẫn tối);
   - giảm cấp phát mỗi khung trong `unitViews` và bố cục nhãn (`new Map`, mảng và đối tượng mới mỗi khung) nếu GC góp vào khung chậm.
3. **Kỵ binh:** xem mức chi tiết. Cảnh chọn LOD theo chiều cao trên màn hình (`model.height`, kỵ binh cao 2,24–2,67 m nên giữ LOD0 lâu hơn bộ binh). Cân nhắc ngưỡng theo kích thước thật của hình (ví dụ chiều cao của người, hay căn bậc hai diện tích khung bao), sao cho kỵ binh ở xa xuống LOD1 sớm như bộ binh cùng cỡ trên màn hình. Không làm kỵ binh gần camera xấu đi.
4. **Đi xiên:** nếu profile cho thấy phần quay người đáng kể thì giảm (ví dụ bỏ qua khối đứng yên, tránh `atan2` khi vận tốc không đổi).
5. Không đổi hình ảnh: nhãn vẫn bám khối, không trễ thấy được; kỵ binh gần camera như cũ.

## Đo

- So xen kẽ với bản trước đợt E (`2a355b9`, dựng trong worktree tạm) và bản `main` lúc nhận task, ít nhất ba lượt sạch mỗi bên (ghi Blender có chạy hay không).
- Các cửa sổ của `s-perf.mjs`, thêm p99 và số khung trên 25 ms.
- Máy thiếu RAM thì đóng dev server của mình trước khi chạy bản production.

## Ràng buộc

- Chỉ sửa trong `src/components/battle/`. Không thêm thư viện npm.
- Không đổi hợp đồng `src/lib/battle.ts`; cần thì ghi đề nghị.
- Commit sau mỗi phần việc lớn.

## Xong khi

- Lúc phát 1×, giai đoạn 1 / 3 / 4: lấy lại ít nhất một nửa phần chậm so với trước đợt E (khoảng 64 fps trở lên trong cùng điều kiện đo), p99 gần mức trước đợt E. Nếu không đạt, ghi rõ phần còn lại tốn ở đâu.
- Hình ảnh không đổi (ảnh chụp so trước/sau ở cùng góc nhìn: nhãn, kỵ binh gần và xa).
- Việc dở của T-028 xong.
- `npm run lint`, `npm run build`, `npm run validate` qua; console sạch.

## Kết quả

_(Lane điền khi xong.)_
