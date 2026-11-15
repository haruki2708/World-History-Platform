# T-009: Nhãn tên thế lực và chuyển cảnh giữa các mốc biên giới

- **Lane:** 2
- **Nhánh:** `lane2/T-009-map-labels` (đã tạo sẵn từ `main`)
- **Phạm vi file:** `src/components/map/`, `public/map/`, khoá `map.*` trong `src/lib/i18n/messages.ts`

## Mục tiêu

Người xem đọc được ngay ai đang giữ vùng nào mà không phải dò chú giải, và khi kéo thanh thời gian qua một mốc thì biên giới đổi một cách êm, không giật.

## Hiện trạng

- Biên giới thật đã có cho 509, 264 và 146 TCN (T-004 đợt 1). Lane 3 đang làm thêm 11 mốc và thêm vài thế lực (Ba Tư, Armenia, Bithynia, Cappadocia, Mauretania…) **song song** với task này. Vì vậy không được viết cứng tên hay vị trí của thế lực nào: mọi thứ phải chạy với bất kỳ thế lực và mốc nào trong dữ liệu.
- Lớp lãnh thổ hiện đổi tức thì khi năm đi qua một mốc (`useTerritories.ts`).
- Chú giải có dòng ghi công Cliopatria (CC BY 4.0) do phiên chính thêm. Dòng này bắt buộc theo giấy phép: giữ nguyên.
- Dữ liệu thử trong `src/components/map/__fixtures__/` đã tự tắt vì có dữ liệu thật.
- Dự án ưu tiên máy tính (xem `CLAUDE.md`).

## Yêu cầu

1. **Nhãn tên thế lực** trên bản đồ, theo ngôn ngữ đang chọn.
   - Đặt nhãn trong lòng lãnh thổ, không đặt ngoài biển hay sát biên. Gợi ý: điểm xa biên nhất (pole of inaccessibility) của mảnh lớn nhất; tự viết thuật toán nhỏ, không thêm thư viện. Tính một lần cho mỗi mốc.
   - Ẩn nhãn khi lãnh thổ quá nhỏ so với nhãn ở mức phóng hiện tại, và không để hai nhãn chồng lên nhau (ưu tiên thế lực có diện tích lớn hơn). Phóng to thì nhãn của các vùng nhỏ hiện dần.
   - Nhãn không chặn thao tác: kéo bản đồ, bấm điểm sự kiện vẫn như cũ. Nhãn nằm dưới điểm sự kiện.
   - Đọc rõ ở cả chế độ sáng lẫn tối (ví dụ chữ có viền hoặc bóng theo token màu).
   - Gợi ý cách vẽ: dùng phần tử HTML đặt trên bản đồ, như cách làm điểm sự kiện, để dùng font Inter (có đủ dấu tiếng Việt) và token màu sẵn có, không cần file glyph của MapLibre. Nếu chọn lớp chữ của MapLibre thì phải tự lưu file glyph có đủ dấu tiếng Việt và giấy phép rõ ràng; ghi lý do trong mục "Kết quả".
2. **Chuyển cảnh giữa các mốc:** khi đổi mốc, lớp lãnh thổ cũ mờ dần và lớp mới hiện dần (khoảng 300–500 ms), nhãn đổi theo.
   - Kéo nhanh hoặc phát tự động qua nhiều mốc liên tiếp thì không dồn chuyển cảnh, không nháy, bản đồ luôn kết thúc ở đúng mốc của năm đang xem.
   - Người dùng bật `prefers-reduced-motion` thì đổi ngay, không có chuyển cảnh.
3. **Gỡ dữ liệu thử:** xoá `src/components/map/__fixtures__/` cùng phần code dùng nó trong `borders.ts`, và khoá `map.legend.testData` nếu không còn dùng.

## Ràng buộc

- Không sửa dữ liệu (`src/data/`, `public/data/`): đó là vùng của lane 3, đang thay đổi song song. Thấy dữ liệu có vấn đề thì ghi vào mục "Kết quả".
- Không thêm thư viện.
- Không gỡ dòng ghi công trên chú giải.

## Xong khi

- Kéo thanh thời gian qua 509 → 264 → 146 TCN: nhãn đúng thế lực, đúng ngôn ngữ, nằm trong lãnh thổ; biên giới chuyển cảnh êm; phát tự động ở 50 năm/giây không nháy.
- Ở góc nhìn ban đầu (zoom 4) không có nhãn nào chồng nhau; phóng to thì thấy thêm nhãn của các vùng nhỏ.
- Kéo bản đồ và bấm điểm sự kiện vẫn hoạt động như trước.
- `npm run lint` và `npm run build` qua; không có lỗi console; trang không vỡ ở bề ngang 390px.

## Kết quả

_(Lane 2 điền khi xong.)_
