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

Lane 2, 2026-11-16. Nhánh `lane2/T-009-map-labels`, chưa push, chưa gộp. Không sửa gì trong `src/data/` hay `public/data/`.

### Đã làm

**Nhãn tên thế lực** (`src/components/map/labels/`):

- **Vị trí nhãn:** là điểm của lãnh thổ xa biên nhất, chỉ tính phần đất liền. Lý do: polygon được phép tràn ra biển (lớp biển che đi), nên tính trên polygon gốc thì nhãn có thể rơi xuống biển.
  - Cách tính: dựng một lưới Web Mercator khoảng 0,05° (2400 × 1889 ô). Mặt nạ đất liền lấy từ chính polygon biển và hồ trong `public/map/basemap.json`, dựng một lần (`landMask.ts`).
  - Mỗi thế lực được raster hoá rồi giao với đất liền. Phép biến đổi khoảng cách Euclid (Felzenszwalb) cho ra ô xa biên nhất (`spots.ts`).
  - Không thêm thư viện, không thêm file dữ liệu. Không viết cứng tên hay vị trí thế lực nào; chạy với mọi thế lực và mọi mốc.
- **Nhiều mảnh:** thế lực có nhiều mảnh lớn tách rời được thêm nhãn ở từng mảnh, tối đa 3 nhãn. Một mảnh phụ phải rộng ít nhất 1/4 mảnh lớn nhất.
  - Nhãn chính đặt ở mảnh có nhiều chỗ nhất. Nhãn phụ xếp sau nhãn chính của mọi thế lực, nên không chiếm chỗ của thế lực khác.
  - Ví dụ năm 146 TCN: nhãn chính của La Mã ở Hispania, nhãn phụ ở Macedonia và Hy Lạp. Nếu chỉ có một nhãn, nó nằm ở Hispania, sau chú giải, còn vùng đỏ ở Hy Lạp thì không có tên.
- **Ẩn và hiện theo mức phóng:** nhãn chỉ hiện khi ít nhất 80% khung chữ (lấy mẫu 9 × 3 điểm) nằm trên đất của chính thế lực đó, ở mức phóng hiện tại.
  - Mỗi nhãn thử một dòng trước, không vừa thì thử tách hai dòng.
  - Xét lần lượt từ thế lực có diện tích lớn đến nhỏ; nhãn nào chồng lên nhãn đã đặt (cách nhau dưới 6 px) thì ẩn.
  - Chỉ tính lại khi đổi mức phóng, vì kéo bản đồ không đổi vị trí tương đối giữa các nhãn. Nhãn hiện và ẩn bằng chuyển cảnh độ mờ 300 ms.
- **Cách vẽ:** nhãn là phần tử HTML gắn qua `Marker` của MapLibre, giống điểm sự kiện, nên dùng được font Inter (đủ dấu tiếng Việt) và token màu, không cần file glyph.
  - Chữ in hoa 11 px, màu `foreground`, viền mờ bằng `text-shadow` màu `background`, nên đọc rõ ở cả hai chế độ sáng và tối.
  - `pointer-events: none`, `aria-hidden` (chú giải đã liệt kê các thế lực). `z-index` 0, dưới điểm sự kiện (1–3).
- **Chi phí tính:** mỗi mốc được tính một lần khi mốc xuất hiện, khoảng 35–50 ms; kết quả của 4 mốc gần nhất được giữ lại.

**Chuyển cảnh giữa các mốc** (`territoryFade.ts`, `mapStyle.ts`, `useTerritories.ts`):

- **Hai bộ lớp:** lãnh thổ được vẽ trên hai bộ lớp (fill + line) thay phiên nhau. Mốc mới được nạp vào bộ đang ẩn, chờ MapLibre nạp xong, rồi hiện dần trong 400 ms trong khi bộ cũ mờ dần. Hiệu ứng dùng transition `fill-opacity` / `line-opacity` có sẵn của MapLibre.
- **Không dồn chuyển cảnh:** chỉ giữ mốc đích mới nhất. Trong lúc đang chuyển cảnh, các mốc đến sau thay thế nhau; chuyển cảnh xong thì chuyển một lần tới mốc cuối cùng. Vì vậy kéo nhanh hay phát tự động không xếp hàng chuyển cảnh, và bản đồ luôn dừng ở đúng mốc của năm đang xem (trễ tối đa khoảng một lần chuyển cảnh).
- **Nhãn đổi theo:** nhãn của mốc mới hiện dần, nhãn cũ mờ dần. Nhãn được nhận diện theo vị trí, nên nhãn mà mốc mới đặt đúng chỗ cũ (ví dụ "Các bộ lạc Gaul") thì đứng yên, không nháy.
- **`prefers-reduced-motion`:** đổi ngay, không có chuyển cảnh cho cả lớp lãnh thổ lẫn nhãn.

**Gỡ dữ liệu thử:** đã xoá `src/components/map/__fixtures__/`, phần code dùng nó trong `borders.ts` (cùng trường `isFixture`), dòng "Dữ liệu thử" trên chú giải và khoá `map.legend.testData` (cả `en` lẫn `vi`). Dòng ghi công Cliopatria giữ nguyên.

### Đã kiểm tra

Chạy `next dev`, dùng Chrome headless qua DevTools Protocol, khung 1280×800, để chụp màn hình, đo vị trí nhãn và bắt lỗi console:

- **Nhãn ở góc nhìn ban đầu (zoom 4):** đúng thế lực, đúng ngôn ngữ, không nhãn nào chồng nhau. Mỗi điểm đặt nhãn đều nằm trên đất liền và trong lãnh thổ của chính thế lực đó (kiểm tra bằng Node trên ba mốc).
  - 509 TCN: Gaul.
  - 264 TCN: Seleukos, Gaul, Ai Cập, Pontus, Macedonia.
  - 146 TCN: Parthia, Gaul, Seleukos, Ai Cập, La Mã (Hispania và Hy Lạp), Numidia, Pergamon, Pontus.
- **Phóng to:** ở 264 TCN, số nhãn hiện tăng từ 4 lên 10 rồi 15 (thêm Carthage, đồng minh Ý, Macedonia, Hy Lạp, La Mã, Epirus, Pergamon, Syracuse), vẫn không chồng nhau.
- **Đổi ngôn ngữ** bằng nút ở header: nhãn đổi theo ngay.
- **Chuyển cảnh:** bấm → để đi qua 265 → 264 TCN và chụp liên tiếp từng khung hình: màu đổi dần qua các giá trị trung gian. Với `prefers-reduced-motion`: đổi ngay ở khung hình đầu tiên.
- **Phát tự động 50 năm/giây** từ 509 tới 27 TCN, chụp 80 khung hình:
  - không khung hình nào mất lớp lãnh thổ (kiểm tra màu điểm ảnh ở Tuscany và Peloponnese);
  - số nhãn không lần nào rơi về 0 khi qua mốc;
  - kết thúc ở mốc 146 TCN với đúng 9 nhãn.
- **Thao tác:**
  - bấm một điểm sự kiện vẫn chọn được sự kiện (URL đổi `event=`);
  - kéo bản đồ bắt đầu từ ngay trên một nhãn: bản đồ đi đúng 100 px;
  - không nhãn nào che tâm của điểm sự kiện nào.
- **Giao diện:** chế độ sáng và tối đều đọc rõ. Ở bề ngang 390 px không có cuộn ngang (`scrollWidth` 390).
- Không có lỗi hay cảnh báo nào trong console ở mọi lần chạy.
- `npm run lint` và `npm run build` qua.

### Giới hạn và ghi chú

- **Lần đầu mở trang** phải tải lại `basemap.json` (thường lấy từ cache của trình duyệt, vì MapLibre đã tải) và dựng mặt nạ đất liền, khoảng 170 ms trên luồng chính. Trên `next dev`, nhãn hiện sau khoảng 2,5 giây kể từ lúc mở trang.
- **Qua mốc lần đầu** mất thêm 35–50 ms để tính vị trí nhãn. Khi phát tự động có thể rơi một hai khung hình ở đúng lúc đó; tôi chưa thấy giật bằng mắt.
- **Mặt nạ đất liền dùng bờ biển ngày nay**, như bản đồ nền. Ở các vùng bờ biển đã đổi nhiều (châu thổ Po, Nile), "đất liền" là đất ngày nay.
- **Nhãn có thể nằm sau chú giải** khi chú giải đang mở, vì chú giải là lớp phủ trên bản đồ. Kéo bản đồ hoặc thu gọn chú giải thì thấy.
- **Nhãn chính đặt ở mảnh có nhiều chỗ nhất**, không nhất thiết ở thủ đô. Ví dụ La Mã năm 146 TCN: nhãn chính ở Hispania, vì Ý chia giữa `rome` và `italian-allies`. Hy Lạp năm 146 TCN: nhãn chính ở vùng Massalia.
- **Dữ liệu:** không thấy vấn đề gì trong ba mốc hiện có.

### Đề nghị ngoài phạm vi (phiên chính)

- `docs/ARCHITECTURE.md`, mục "File biên giới":
  - bỏ câu về dữ liệu thử trong `src/components/map/__fixtures__/` (đã xoá);
  - có thể thêm một dòng: bản đồ ghi tên thế lực trong lòng lãnh thổ (phần đất liền) và chuyển cảnh 400 ms giữa các mốc.
