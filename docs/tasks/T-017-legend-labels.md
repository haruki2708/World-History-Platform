# T-017: Chú giải bản đồ không che nhãn tên thế lực

- **Lane:** 2
- **Model đề xuất:** Opus 5.5, effort `high`.
- **Nhánh:** `lane2/T-017-legend-labels` (tạo từ `main` mới nhất)
- **Phạm vi file:** `src/components/map/`, khoá `map.*` trong `src/lib/i18n/messages.ts`

## Mục tiêu

Chú giải bản đồ (`MapLegend.tsx`) nằm ở góc dưới bên trái. Ở các năm có nhiều thế lực, nó cao gần hết khung bản đồ và che nhãn tên thế lực ở nửa trái. Ví dụ: "Gallic tribes" năm 290 TCN, Mauretania năm 88 TCN. Sửa sao cho nhãn không bị che mà chú giải vẫn dùng được.

## Đọc trước

- `src/components/map/MapLegend.tsx`, `MapView.tsx`.
- `src/components/map/labels/`: cách đặt nhãn (`spots.ts`, `placement.ts`, `TerritoryLabels.tsx`).

## Yêu cầu

1. **Tái hiện trước khi sửa.** Ở 1280×800, chụp ảnh năm 290 và 88 TCN, chú giải mở. Tìm thêm các năm khác bị che, ví dụ năm có nhiều thế lực nhất.
2. **Chọn cách sửa.** Lane tự chọn, miễn là đạt yêu cầu ở mục 3. Một số hướng:
   - Chú giải gọn hơn: chia hai cột, hoặc giới hạn chiều cao rồi cuộn bên trong.
   - Khi đặt nhãn, coi khung chú giải là vùng cấm. Nhãn rơi vào đó thì chuyển sang chỗ khác trong lãnh thổ; không còn chỗ thì ẩn.
   - Kết hợp hai hướng trên.

   Ghi lý do chọn trong mục "Kết quả".
3. **Yêu cầu sau khi sửa:**
   - Ở 1280×800, chú giải mở, không nhãn nào bị chú giải che, ở mọi mốc biên giới.
   - Nhãn vẫn đúng khi mở hoặc thu chú giải, khi kéo hay phóng bản đồ, khi đổi kích thước cửa sổ, khi đổi ngôn ngữ (tên tiếng Việt dài hơn).
   - Chú giải vẫn đọc được đủ. Dòng ghi công Cliopatria là bắt buộc, không được ẩn khi chú giải mở.
   - Ở 390px không vỡ, không cuộn ngang. Không cần tinh chỉnh riêng cho điện thoại.
   - Đúng ở cả chế độ sáng lẫn tối, cả `en` lẫn `vi`.

## Ràng buộc

- Không sửa file ngoài phạm vi. Cần đổi store hay hợp đồng thì ghi đề nghị vào mục "Kết quả".
- Không thêm thư viện npm.

## Xong khi

- `npm run lint` và `npm run build` qua.
- Có ảnh trước và sau ở năm 290 và 88 TCN (1280×800), cùng một ảnh ở 390px. Để ảnh ngoài repo và ghi đường dẫn trong mục "Kết quả".

## Kết quả

_(Lane 2 điền khi xong.)_
