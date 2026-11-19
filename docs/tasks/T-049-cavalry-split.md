# T-049: Tách kỵ binh của Hasdrubal thành kỵ binh Iberia và kỵ binh Gaul (dữ liệu)

- **Lane:** 2
- **Model đề xuất:** Opus 5.5, effort `high`.
- **Nhánh:** `lane2/T-049-cavalry-split` (phiên chính đã tạo sẵn từ `main`, trong worktree của bạn)
- **Phạm vi file:**
  - `src/data/battles/battle-of-cannae.json`, `src/data/battles/unit-types.json`;
  - `docs/data/battles/`, `scripts/battles/`.

## Bối cảnh

Đợt J đã gộp hết (T-045 của bạn, T-046, T-047, T-048). Khi gộp T-045, phiên chính sửa một chỗ: ghi chú `strength` của Carthage không nêu tên Daly nữa, vì câu "8 000 người ở lại trại" có trên Wikipedia nhưng không xác nhận được trong sách của Daly (`cannae.md`, mục 17, "Còn lại").

Ở T-047, lane 1 nêu: kỵ binh cánh trái của Hasdrubal trong cảnh là một loại lính chung (`iberian-gallic-cavalry`), mặc đồ người Iberia, nên người Gaul trông như người Iberia. Polybius 3.114 và Livy 22.46 kể đó là hai nhóm người khác nhau. Người dùng chọn **tách thành hai loại lính**.

Hiện trạng dữ liệu: hai khối `hasdrubal-cavalry-front` và `hasdrubal-cavalry-rear`, mỗi khối 3 000 người, cùng loại `iberian-gallic-cavalry`. Lý do chia hai khối ghi ở `cannae.md` mục 5: để dễ thấy cú vòng ra sau lưng.

Lane 1 làm song song T-050: dựng mô hình kỵ binh Gaul. Hai bên dùng chung các tên dưới đây; **không đổi tên** khi chưa hỏi phiên chính.

| Loại lính (`unit-types.json`) | Mô hình | Ghi chú |
|---|---|---|
| `iberian-cavalry` (thay cho `iberian-gallic-cavalry`) | `iberian-gallic-cavalry` | File mô hình hiện có, giữ nguyên tên file |
| `gallic-cavalry` (mới) | `gallic-cavalry` | File chưa có tới khi gộp T-050; trong lúc đó cảnh vẽ hình tạm cho loại này, `npm run validate` vẫn qua |

## Đọc trước

- `docs/data/battles/cannae.md`: mục 5 (quân số, bảng đơn vị phía Hannibal), mục 9–11 (chỉnh trong cảnh, giáp lá cà, script dựng bố cục).
- `docs/tasks/T-047-lod-cavalry.md`, mục "Ý 9: phương án và đề nghị".
- `scripts/battles/cannae-lines.mjs`: khối nào do script dựng thì sửa trong script.

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Nguồn

- Đọc lại Polybius 3.113–116 và Livy 22.46–48 về kỵ binh cánh trái của Hannibal: ai, đứng thế nào, có tả riêng người Iberia và người Gaul không.
- Nguồn cổ cho tổng 10 000 kỵ binh, không chia theo dân tộc. Tìm ước lượng hiện đại về số kỵ binh Iberia và Gaul. Ghi rõ đọc ở đâu, đã đối chiếu được với sách gốc hay chưa. Rút kinh nghiệm từ T-045: không ghi tên một tác giả cho con số mới chỉ thấy trên Wikipedia.
- Tóm tắt tự viết vào một mục mới của `cannae.md`.

### 2. Loại lính và khối quân

- `unit-types.json`: đổi `iberian-gallic-cavalry` thành `iberian-cavalry`, thêm `gallic-cavalry`, theo bảng ở trên. Tên hiển thị song ngữ.
- Chia 6 000 kỵ binh cánh trái thành khối Iberia và khối Gaul. Bạn quyết định cách chia và ghi lý do:
  - giữ hai khối hiện có (trước, sau) và gán mỗi khối một dân tộc, hay dựng lại thành các khối đứng cạnh nhau;
  - quân số mỗi bên, ghi rõ là giả định nếu nguồn không cho.
- Giữ được những gì đã có: cú đánh tan kỵ binh La Mã bên sông (giai đoạn 3), cú vòng ra sau lưng (giai đoạn 4–5), đánh vào lưng các quân đoàn (giai đoạn 6); mọi khối `fight` vẫn qua kiểm tra của `npm run validate`.
- Id khối quân đổi thì sửa theo ở mũi tên, lời dẫn và mọi chỗ nhắc tới. Tên khối song ngữ.
- Lời dẫn (cả `en` lẫn `vi`): sửa chỗ nào nói "kỵ binh Iberia và Gaul" như một khối, nếu cách chia mới làm câu đó sai.
- Thương vong của kỵ binh (Polybius 3.117: khoảng 200) chia lại cho các khối mới.

### 3. Kiểm tra và ảnh

- `npm run validate`, `check-overlap.mjs`, `check-facing.mjs`; `npm run lint`, `npm run build`.
- Xem trong `/battle-lab` ở một cổng trống (không dùng 3000). Khối Gaul sẽ là hình tạm cho tới khi có mô hình: không sao.
- Ảnh trước và sau ở `E:\World_History_Platform_assets\duyet\T-049\`, đặt tên `…-A-truoc.png` / `…-B-sau.png`: lúc dàn trận, giữa giai đoạn 3, giữa giai đoạn 4, cuối trận.
- Driver chụp của phiên chính ở `E:\World_History_Platform_assets\main-tools\drive\`. **Đặt `PORT=9362`** khi chạy (`PORT=9362 BASE=… node drive.mjs …`): cổng mặc định 9343 bị các phiên khác dùng chung, hai phiên chạy cùng lúc sẽ treo.

## Ràng buộc

- Không sửa `src/components/`, `src/lib/`, store, `src/app/`, `src/data/index.ts`, `messages.ts`, `public/`. Cần đổi thì ghi đề nghị vào "Kết quả".
- Tên loại lính cũ `iberian-gallic-cavalry` có thể còn được nhắc ở ngoài vùng của bạn (ví dụ `src/app/battle-lab/duelBattle.ts`, hộp thoại Giới thiệu, ghi công). Liệt kê các chỗ đó trong "Kết quả"; phiên chính sửa khi gộp.
- Không thêm quân: tổng kỵ binh của Hannibal vẫn 10 000.

## Xong khi

- Hai loại lính mới trong `unit-types.json`; các khối kỵ binh cánh trái mang đúng loại.
- `npm run validate` qua; diễn biến trận như trước.
- `cannae.md` có mục mới với nguồn và quyết định.
- Ảnh ở `duyet\T-049\`; mục "Kết quả" đã điền.

## Kết quả

(Lane 2 điền khi xong.)
