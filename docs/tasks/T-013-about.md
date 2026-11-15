# T-013: Giới thiệu, cách dùng và ghi công

- **Lane:** 1
- **Nhánh:** `lane1/T-013-about` (đã tạo sẵn từ `main`)
- **Phạm vi file:** `src/components/shell/`, khoá `about.*` trong `src/lib/i18n/messages.ts`

## Mục tiêu

Trước khi đưa app ra Internet, người dùng cần một chỗ đọc: app này là gì, dùng thế nào, độ chính xác đến đâu, dữ liệu lấy từ đâu. Đây cũng là nơi ghi công đầy đủ các nguồn dữ liệu.

## Hiện trạng

- Header có nút phím tắt `?`, nút Chia sẻ và nút đổi ngôn ngữ (`src/components/shell/HeaderActions.tsx`). Đã có hộp thoại dùng chung `Modal.tsx`.
- Chú giải bản đồ có một dòng ghi công ngắn. Ghi công đầy đủ hiện chỉ có trong `README.md`.
- Nguồn và giấy phép: `docs/data/SOURCES.md`, `docs/data/BORDERS.md`, `public/map/README.md`. Cách gia sư hoạt động: `docs/ARCHITECTURE.md`, mục "AI tutor".

## Yêu cầu

1. **Nút "Giới thiệu" ở header** mở một hộp thoại, dùng `Modal.tsx`, gồm các phần:
   - **App này là gì:** khám phá Cộng hoà La Mã và thế giới Địa Trung Hải 509–27 TCN qua dòng thời gian, bản đồ và gia sư AI.
   - **Cách dùng:** kéo hoặc phát thanh thời gian; bấm sự kiện ở panel, trên bản đồ hoặc trên dòng thời gian; hỏi gia sư, câu hỏi luôn kèm năm và vùng đang xem; nút trong câu trả lời đưa tới đúng chỗ; link Chia sẻ. Có một nút mở bảng phím tắt.
   - **Độ chính xác:** biên giới là ước lượng và vẽ lại; bờ biển và sông là của ngày nay; nhiều mốc năm thời đầu Cộng hoà là theo truyền thống; gia sư AI có thể sai, nên đối chiếu với nguồn ghi ở từng sự kiện.
   - **Nguồn và ghi công:** Natural Earth (phạm vi công cộng); *Historical Atlas* của W. R. Shepherd (phạm vi công cộng); Cliopatria v0.2.1 của Seshat Global History Databank (Bennett J. S. và cộng sự, *Scientific Data* 12, 247, 2025) theo giấy phép CC BY 4.0, có link tới dữ liệu và giấy phép, ghi rõ là "đã đơn giản hoá và vẽ lại"; sử liệu cổ dẫn theo từng sự kiện. Lấy đúng nội dung từ `docs/data/SOURCES.md` và `README.md`, không tự thêm nguồn.
   - **Gia sư AI:** dùng Claude của Anthropic; mỗi câu hỏi được gửi kèm năm, sự kiện đang chọn và vùng bản đồ đang xem; app không lưu cuộc trò chuyện (lịch sử chỉ nằm trong trang, mất khi tải lại). Không viết gì về cách Anthropic xử lý dữ liệu.
2. **Lần đầu mở app:** một gợi ý nhỏ, không che nội dung chính, mời xem phần giới thiệu, kèm nút đóng. Đã đóng hoặc đã mở giới thiệu thì không hiện lại; nhớ bằng `localStorage`, mọi truy cập đặt trong `try/catch`.
3. Song ngữ, đọc rõ ở cả chế độ sáng lẫn tối, dùng được bằng bàn phím. Ưu tiên máy tính; trên điện thoại chỉ cần không vỡ trang.

## Ràng buộc

- Mọi thông tin về nguồn, giấy phép và cách gia sư hoạt động phải khớp với tài liệu trong repo. Chỗ nào không chắc thì ghi vào mục "Kết quả", không tự đoán.
- Trong `AppShell.tsx` chỉ được thêm dòng để gắn component mới, không sửa bố cục.
- Không thêm thư viện.

## Xong khi

- Mở hộp thoại bằng nút ở header, đọc đủ các phần ở cả hai ngôn ngữ; nút mở bảng phím tắt hoạt động; đóng bằng Esc.
- Gợi ý lần đầu hiện ra, đóng xong thì tải lại trang không hiện nữa.
- `npm run lint` và `npm run build` qua; không có lỗi console.

## Kết quả

Lane 1, 2026-11-16. Hai commit trên nhánh `lane1/T-013-about`: `0f004ae` (Modal), `5a3634e` (Giới thiệu và gợi ý lần đầu). Không đụng `AppShell.tsx`; mọi thứ được gắn qua `HeaderActions`.

### Đã làm

- **Nút "Giới thiệu" ở header** (biểu tượng ⓘ; dưới 768px chỉ còn biểu tượng), đặt trước nút phím tắt. Nút mở `AboutDialog.tsx`, gồm năm phần:
  - **App này là gì:** khoảng năm lấy từ `formatYearRange(YEAR_MIN, YEAR_MAX)`; số sự kiện (59) và số mốc biên giới (14) đếm thẳng từ dữ liệu, nên tự đúng khi dữ liệu đổi.
  - **Cách dùng:** thanh thời gian, sự kiện, gia sư, nút trong câu trả lời, link Chia sẻ, và nút "Xem phím tắt". Nút này mở bảng phím tắt chồng lên Giới thiệu; Esc đóng bảng phím tắt trước, focus trở về nút, Esc lần nữa mới đóng Giới thiệu.
  - **Độ chính xác:**
    - biên giới là ước lượng vẽ tay, mỗi mốc giữ tới mốc sau;
    - vùng không tô màu là của các dân tộc chưa có trong dữ liệu;
    - bờ biển và sông là của ngày nay (châu thổ sông Po, sông Nile);
    - mốc năm thời đầu Cộng hoà theo truyền thống, vị trí không chắc thì đánh dấu ước lượng;
    - gia sư có thể sai, nên đối chiếu với nguồn ở từng sự kiện.
  - **Nguồn và ghi công:**
    - Shepherd, *Historical Atlas* (1911 và 1923), phạm vi công cộng;
    - Cliopatria v0.2.1 của Seshat Global History Databank, kèm trích dẫn đầy đủ (Bennett J. S. và cộng sự, *Scientific Data* 12, 247, 2025), giấy phép CC BY 4.0, câu "Đã đơn giản hoá và vẽ lại, không sao chép nguyên", và link tới dữ liệu (GitHub), bài báo (doi) và giấy phép;
    - Natural Earth (phạm vi công cộng, có link);
    - sự kiện: tóm tắt tự viết, sử liệu cổ dẫn theo từng sự kiện.

    Link mở thẻ mới, có chữ ẩn "mở trong thẻ mới" cho trình đọc màn hình.
  - **Về gia sư AI:** dùng Claude của Anthropic; những gì được gửi kèm mỗi câu hỏi; app không lưu cuộc trò chuyện; có giới hạn số câu hỏi.
- **Gợi ý lần đầu** (`FirstVisitHint.tsx`): một dải nhỏ ngay trong hàng header, "Lần đầu ghé thăm? Xem app này làm được gì", có nút ×. Nó không nổi đè lên bản đồ hay panel.
  - Ở 1280×800 header vẫn một hàng, cả hai ngôn ngữ. Ở 390px dải này chiếm một dòng riêng trong header cho tới khi đóng.
  - Bấm × hoặc mở Giới thiệu (từ dải hay từ nút) thì ghi `localStorage["whp.aboutSeen"] = "1"` và dải biến mất. Bấm × xong thì focus chuyển sang nút Giới thiệu.
  - Cờ được đọc qua `useSyncExternalStore` (`aboutSeen.ts`). Khi dựng ở server, coi như "đã xem", nên người đã từng ghé không thấy dải chớp lên rồi tắt; người mới thấy dải ngay sau khi hydrate.
  - Mọi truy cập `localStorage` nằm trong `try/catch`. Nếu không dùng được, cờ chỉ nhớ trong trang đó. Đóng ở một thẻ thì các thẻ khác cũng ẩn (sự kiện `storage`).
- **`Modal.tsx`:**
  - thêm `size="lg"` (rộng 42rem) cho phần đọc chữ;
  - hàng tiêu đề và nút đóng đứng yên, chỉ nội dung cuộn;
  - sửa một lỗi lộ ra khi nội dung dài: chữ `sr-only` trong link tràn ra ngoài vùng cuộn làm `<dialog>` có thanh cuộn thứ hai.

  Hộp thoại Chia sẻ và Phím tắt vẫn dùng cỡ cũ.
- **`ShortcutsHelp.tsx`** thành component được điều khiển từ ngoài (`open`, `onOpenChange`). `HeaderActions` giữ trạng thái của cả hai hộp thoại, nhờ vậy Giới thiệu mở được bảng phím tắt.
- **`messages.ts`:** 36 khoá `about.*` cho cả `en` lẫn `vi`.

### Nội dung đã đối chiếu với tài liệu nào

| Nội dung | Căn cứ |
|---|---|
| Shepherd, Cliopatria (trích dẫn, giấy phép, link, "simplified and redrawn, not copied"), Natural Earth, sự kiện | `README.md` mục "Data credits"; `docs/data/SOURCES.md` (bảng khảo sát nguồn, "Ghi chú về Cliopatria") |
| Tên các sử gia cổ (Livy, Polybius, Plutarch, Appian); phần lớn nguồn có link tới bản dịch hoặc bài tham khảo | `SOURCES.md` mục "Sử liệu cổ được dẫn" và bảng các trang dịch (có một nguồn không có link) |
| Biên giới vẽ tay, đúng về đại thể, mỗi mốc giữ tới mốc sau, vùng không thuộc thế lực nào để trống | `docs/data/BORDERS.md` mục "Cách dựng" và "Quy ước chung" |
| Bờ biển và sông của ngày nay, châu thổ sông Po và sông Nile | `public/map/README.md`, phần "Lưu ý" |
| Mốc năm theo truyền thống được nói rõ trong tóm tắt; vị trí ước lượng | `CLAUDE.md` mục "Nội dung lịch sử"; `SOURCES.md` mục "Toạ độ" |
| Gia sư dùng Claude; được gửi kèm năm, ngôn ngữ, vùng bản đồ, sự kiện đang chọn và các lượt trước; lịch sử chỉ nằm trong trang | `docs/ARCHITECTURE.md` mục "AI tutor"; `src/lib/tutor.ts` (`TutorContext`); `useTutorChat.ts` (lịch sử nằm trong state của component) |
| Không lưu cuộc trò chuyện | Đã đọc `src/server/tutor/`: log chỉ ghi model, số token, chi phí, mã lỗi; không ghi nội dung câu hỏi hay câu trả lời, không ghi địa chỉ IP. Bộ đếm giới hạn giữ IP trong bộ nhớ, không giữ nội dung |
| Có giới hạn số câu mỗi phút và mỗi ngày | `ARCHITECTURE.md` mục "Giới hạn" (không ghi con số vì cấu hình được qua biến môi trường) |

### Chỗ cần phiên chính xem lại

1. **"Câu trả lời có thể kèm nút":** với Claude thật, server chưa tạo nút cho tới khi T-011 xong. Tôi dùng chữ "có thể" để câu này đúng cả trước và sau T-011.
2. **"App không lưu cuộc trò chuyện"** đúng với code của app. Nhưng nền tảng chạy app (máy chủ, proxy, dịch vụ hosting) có thể tự ghi log yêu cầu, và tôi không biết app sẽ chạy ở đâu. Trước khi đưa ra Internet nên kiểm tra lại câu này với cấu hình thật.
3. **Ngoài các ý task yêu cầu, tôi thêm ba câu**, đều có căn cứ trong repo:
   - "vùng không tô màu…" (`BORDERS.md`);
   - "kèm ngôn ngữ giao diện và các câu hỏi, trả lời trước đó" (gửi kèm thật, nên nói rõ);
   - "có giới hạn số câu hỏi" (giúp người dùng hiểu lỗi `limit_reached`).

   Không cần thì xoá các khoá tương ứng.
4. **Wikipedia:** `SOURCES.md` có dùng một số bài Wikipedia để kiểm tra mốc thời gian của biên giới (chỉ dẫn link, không chép), nhưng `README.md` không ghi công Wikipedia. Theo yêu cầu "không tự thêm nguồn", tôi không đưa vào. Nếu muốn thì nên thêm vào cả `README.md` lẫn hộp thoại.
5. **Không có link cho Shepherd:** `README.md` không có link; `SOURCES.md` dẫn bốn file cụ thể trên Wikimedia Commons. Cần link thì có thể chọn một trong số đó.
6. Đề nghị thêm vào `docs/ARCHITECTURE.md`: khoá `localStorage` mới `whp.aboutSeen`, và một dòng nhắc rằng đổi nguồn hay giấy phép thì sửa cả `README.md`, `SOURCES.md` và `AboutDialog.tsx`. Đầu file `AboutDialog.tsx` đã có comment nhắc điều này.

### Đã kiểm tra

- `npm run lint`, `npm run build` qua.
- Chạy `npm run dev` (`TUTOR_MOCK=1`), điều khiển Chrome headless bằng script tạm qua DevTools Protocol, không thêm thư viện vào dự án. Lần chạy cuối qua đủ 35 kiểm tra, console không có lỗi hay cảnh báo:
  - Lần đầu mở thì có gợi ý; header vẫn một hàng ở 1280px (en và vi).
  - Nút ở header mở Giới thiệu: đủ năm phần, đúng khoảng năm, số sự kiện, số mốc, đúng chữ ghi công và bốn link (`target="_blank"`, `rel="noreferrer"`).
  - Focus bắt đầu ở nút đóng; Tab và Shift+Tab không ra khỏi hộp thoại; chính `<dialog>` không cuộn.
  - Bảng phím tắt mở chồng lên Giới thiệu và nhận focus; Esc đóng từng lớp, focus trở về đúng chỗ. Phím tắt của trang tắt khi hộp thoại mở. Bấm ra ngoài thì đóng.
  - Mở Giới thiệu thì ghi cờ, gợi ý biến mất, tải lại không hiện nữa. Bấm × cũng vậy, và focus chuyển sang nút Giới thiệu. Nút trên dải gợi ý mở được Giới thiệu.
  - Nội dung tiếng Việt đầy đủ.
  - Khi `localStorage` bị chặn (giả lập ném lỗi): trang vẫn chạy, gợi ý vẫn hiện và vẫn đóng được.
  - Ở 390px: không cuộn ngang, hộp thoại vừa màn hình.
- Đã xem ảnh chụp: sáng và tối, en và vi, 1280×800 và 390px, cả phần đầu lẫn cuối hộp thoại, cả lúc hai hộp thoại chồng nhau.
- **Một lần chạy hỏng không rõ nguyên nhân.** Hộp thoại Giới thiệu tự đóng giữa hai bước, không do lệnh nào của script. Dev server không ghi lần tải lại nào. Tôi đã chạy lại 8 lần liên tiếp (trong đó 6 lần có đánh dấu tài liệu và phần tử `<dialog>` để phát hiện dựng lại) và không lặp lại được. Nếu ai thấy hộp thoại tự đóng thì xin báo lại.
- Chưa thử với người thao tác thật, chưa thử trình đọc màn hình thật, chưa thử Firefox/Safari.
