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

Lane 2, 2026-11-19. Ba commit trên `lane2/T-049-cavalry-split`: dữ liệu và script (`b49a3e0`), `cannae.md` mục 18 (`06b3559`), mục này. Chi tiết nguồn, quyết định, vị trí và số đo ở `docs/data/battles/cannae.md`, mục 18.

### 1. Nguồn

- Đọc lại Polybius 3.113–117 (bản Paton, LacusCurtius) và Livy 22.46–48 (bản Latin của Foster, Loeb 1929, và bản dịch Roberts, đều trên Perseus). Cả hai kể người Iberia và người Gaul **cùng** ở cánh trái sát sông, **cùng** đụng kỵ binh La Mã (Polybius 3.115, Livy 22.47.1). Không nguồn nào nói họ đứng thế nào với nhau hay chia 10 000 kỵ binh theo dân tộc. Đoạn tả khiên, kiếm, áo trắng viền tía, người Gaul cởi trần (Polybius 3.114, Livy 22.46.5–6) là về bộ binh ở giữa, không phải kỵ binh.
- Livy 22.48.5–6 đưa kỵ binh Iberia và Gaul tới hợp sức với lính châu Phi lúc cuối; chữ *equites* ở đó là chữ sửa của Gronovius (bản chép tay P ghi *pedites*), ghi trong `cannae.md`.
- **Ước lượng hiện đại:** cách chia duy nhất tìm được là 2 000 kỵ binh Iberia và 4 000 kỵ binh Gaul (cùng 4 000 Numidia), ở ô thông tin và mục "Armies" của bài Wikipedia "Battle of Cannae" (đọc mã nguồn của bài). Ô thông tin không dẫn nguồn; trong mục "Armies", chú thích Daly (2002) tr. 106 nằm ở cuối câu **sau**, nên không rõ con số là của Daly. Theo bài học T-045, ghi là "do Wikipedia nêu", không nêu tên Daly. Các nguồn khác (Goldsworthy 2001 qua Wikipedia; một trang đăng lại sách *Cannae* của loạt Cassell's Fields of Battle; bài Hasdrubal trên Wikipedia; Ars Bellica) chỉ cho tổng cánh trái 6 000–7 000, không chia. Chưa đối chiếu được với sách nào.
- Tự đối chiếu (suy luận, ghi rõ trong `cannae.md`): Polybius 3.56 (vào Ý với không quá 6 000 kỵ binh, chưa có người Gaul) và 3.72 (ở Trebia hơn 10 000 kể cả người Celt) cho chừng 4 000 kỵ binh Celt trở lên; với 4 000 Numidia thì kỵ binh Iberia nhiều lắm khoảng 2 000. Khớp với con số Wikipedia, nhưng khoảng sai rộng.

### 2. Loại lính và khối quân

- `unit-types.json`: `iberian-gallic-cavalry` thành `iberian-cavalry` ("Iberian cavalry" / "Kỵ binh Iberia", mô hình `iberian-gallic-cavalry`); thêm `gallic-cavalry` ("Gallic cavalry" / "Kỵ binh Gaul", mô hình `gallic-cavalry`). Đúng tên trong bảng của task.
- **Hai khối đứng cạnh nhau**, không giữ trước sau: `iberian-cavalry` 2 000 người, sát sông (phía tây); `gallic-cavalry` 4 000 người, phía trong. Bề ngang tỉ lệ với quân số (một phần ba, hai phần ba), cùng độ dày. Lý do chính: cả Polybius lẫn Livy kể hai dân tộc cùng đụng kỵ binh La Mã; chia trước sau thì một dân tộc đứng chờ suốt giai đoạn 3. Thêm nữa 2 000 và 4 000 không chia được thành hai hàng ngang nhau. Chỗ đứng (Iberia sát sông) là lựa chọn của tôi, nguồn không nói; chọn để hai khối giữ thứ tự trái phải suốt trận.
- **Diễn biến giữ nguyên:** giai đoạn 3 cả hai khối `fight` với kỵ binh La Mã bên sông (35 người đầu hàng đang đánh, trước 38); giai đoạn 4 khối Gaul dẫn đầu cú vòng ra sau lưng, khối Iberia theo sau, đúng chỗ của hai khối cũ; giai đoạn 5–6 hai khối đứng cạnh nhau đánh vào lưng triarii (57 người đầu hàng, trước 55). `npm run validate` qua, không cảnh báo.
- **Id khối:** `hasdrubal-cavalry-front` thành `iberian-cavalry`, `hasdrubal-cavalry-rear` thành `gallic-cavalry`; tên song ngữ "Iberian cavalry (Hasdrubal)" / "Kỵ binh Iberia (Hasdrubal)", "Gallic cavalry (Hasdrubal)" / "Kỵ binh Gaul (Hasdrubal)". Mũi tên và lời dẫn không nhắc id. Mũi tên giai đoạn 5 dời điểm cuối theo tâm mới.
- **Lời dẫn: không sửa.** Câu duy nhất nói "kỵ binh Iberia và Gaul" như một khối (giai đoạn 3, `en` và `vi`) vẫn đúng: cả hai khối cùng đâm vào kỵ binh La Mã.
- **Thương vong:** 200 kỵ binh của Polybius 3.117 vẫn là Numidia 40 cộng cánh trái 160; 160 chia theo bề ngang đang chạm địch: Iberia 20 + 20, Gaul 60 + 60 (giai đoạn 3 và 6). Giả định, ghi trong `cannae.md`.
- **Script:** `cannae-lines.mjs` dựng hai khối từ mốc 2 tới 6 (hàm `horseSideBySide`); đầu trận và mốc 1 sửa tay như trước. Tổng kỵ binh của Hannibal vẫn 10 000, tổng quân không đổi.

### 3. Kiểm tra và ảnh

- `npm run validate`, `npm run lint`, `npm run build`: qua.
- `check-overlap.mjs --min 0.04`: in ra y hệt trước T-049.
- `check-facing.mjs`: thêm một dòng, khối Iberia giai đoạn 4 đi ngang 26% (khối hàng sau cũ 21%, dưới ngưỡng 25%), cùng kiểu với khối dẫn đầu đã có (31%, trước 32%). Giai đoạn 5: 75% và 82% (trước 68% và 77%). Đều là kiểu đi xiên có chủ ý của cú vòng (`cannae.md` mục 10).
- `/battle-lab` ở cổng 3149, xem ở bốn thời điểm chụp ảnh dưới đây (cảnh đứng yên ở từng thời điểm, không phát liên tục); console không lỗi. Giai đoạn 3 và 6 đo thêm bằng code của cảnh (số người đầu hàng đang đánh, ở trên). Khối Gaul là hình tạm (hình khối màu phe) tới khi có `gallic-cavalry.glb`.
- Ảnh ở `E:\World_History_Platform_assets\duyet\T-049\`, mỗi thời điểm một cặp `…-A-truoc.png` / `…-B-sau.png`, cùng góc: `01-dan-tran` (cuối giai đoạn 1), `02-giua-giai-doan-3`, `03-giua-giai-doan-3-can-canh` (thấy hình tạm của khối Gaul), `04-giua-giai-doan-4`, `05-cuoi-tran`. Kịch bản chụp `s-t049.mjs` để cùng thư mục (chạy với `PORT=9362`).

### Tên cũ còn nhắc ở ngoài vùng của lane 2 (phiên chính sửa khi gộp)

- **`src/app/battle-lab/duelBattle.ts:29`**: cặp kỵ binh thứ tư có `south: ["iberian-gallic-cavalry"]`. Loại này không còn, nên `pick` rơi về loại đầu tiên (`roman-velites`): ở `?duel=1`, phía nam của cặp đó thành velites. Đề nghị `["iberian-cavalry"]`, và khi T-050 gộp thì thêm một cặp cho `gallic-cavalry`.
- **`README.md:30`** (ghi công: "riders of the cavalry models (Roman, Iberian and Gallic, Numidian)"): nói về mô hình, tên file mô hình không đổi nên vẫn đúng; khi T-050 gộp thì thêm kỵ binh Gaul. `src/lib/credits.ts` và hộp thoại Giới thiệu (`messages.ts`) không nhắc loại lính này.
- **`docs/ARCHITECTURE.md:217, 222`**: "Ba mô hình kỵ binh", khiên "của kỵ binh La Mã và Iberia/Gaul". Tên mô hình vẫn đúng; sửa khi T-050 gộp (bốn mô hình kỵ binh).
- **`docs/PLAN.md:41, 127, 227`**: nhắc `iberian-gallic-cavalry` và việc người Gaul trông như người Iberia.
- **Của lane 1, tên mô hình không đổi nên không cần sửa:** `art/README.md`, `art/CREDITS.md`, `art/blender/unit_iberian_gallic_cavalry.py` (docstring "Iberian and Celtic horse"), `art/blender/render_review.py:559`, `public/battles/models/index.json`.
- **Công cụ ngoài repo của phiên chính:** `main-tools/drive/s-cav.mjs:5` dùng id khối `hasdrubal-cavalry-front` (nay `iberian-cavalry` hoặc `gallic-cavalry`). `main-tools/melee/falls.mjs`, `react-check.mjs`, `blows-check.mjs` có bảng số theo tên mô hình: `iberian-gallic-cavalry` vẫn đúng, nhưng chưa có dòng cho `gallic-cavalry`.

### Đề nghị khác

- `uncertainty` của file trận đã nói "cách chia mỗi đạo quân thành các đơn vị là ước lượng hiện đại", nên không sửa. Nếu phiên chính muốn hộp thoại Giới thiệu nói riêng chuyện này, câu gợi ý: "The split of Hasdrubal's horse into 2,000 Iberians and 4,000 Gauls follows a modern estimate; the ancient sources give only the total." / "Việc chia kỵ binh của Hasdrubal thành 2.000 người Iberia và 4.000 người Gaul là theo một ước lượng hiện đại; các nguồn cổ chỉ cho tổng số."
- Còn lại: con số 2 000 / 4 000 chưa đối chiếu được với sách (Daly 2002, Goldsworthy 2001).
