# T-054: Hộp thoại Giới thiệu khi app có hai trận 3D

- **Lane:** 1
- **Model đề xuất:** Opus 5.5, effort `high`. Task nhỏ, chủ yếu là chữ.
- **Nhánh:** `lane1/T-054-about-two-battles` (phiên chính đã tạo sẵn từ `main` trong worktree của bạn).
- **Phạm vi file:** `src/components/shell/` (hộp thoại Giới thiệu); khoá `about.*` trong `src/lib/i18n/messages.ts`, cả `en` lẫn `vi`.

## Bối cảnh

Đợt K đã đưa **trận 3D thứ hai, hồ Trasimene (217 TCN)** vào `main` (T-051, T-052, T-053, gộp 2026-11-19). Sự kiện `battle-of-lake-trasimene` đã có nút xem trận trong app.

Hộp thoại Giới thiệu (`AboutDialog.tsx`) lấy số trận và tên trận từ dữ liệu (`hasBattle`), nên phần đó tự đúng. Nhưng **năm khoá viết riêng cho Cannae** giờ nói sai hoặc nói thiếu, vì chúng nằm trong danh sách chung "Trận đánh 3D là phỏng dựng" và mục ghi công:

| Khoá | Vì sao phải sửa |
|---|---|
| `about.accuracy.battle.campGuard` | Chỉ nói về toán giữ trại ở Cannae |
| `about.accuracy.battle.time` | "Cannae, một trận khoảng 11 giờ…"; Trasimene dài sáu giờ trong cảnh |
| `about.accuracy.battle.scenery` | Ba trại, thành Cannae, đồng bằng mùa hè, "Polybius gọi vùng này là không có cây": đều là Cannae |
| `about.accuracy.battle.dust` | Bụi và gió Volturnus là của Cannae; Trasimene có sương mù |
| `about.credits.battleSources` | Chỉ ghi nguồn của Cannae |

Đọc trước:
- `docs/ARCHITECTURE.md`, mục "Link chia sẻ, giới thiệu và phím tắt" (ý "Giới thiệu") và mục "Trận đánh 3D": "Quân nấp", "Hồ", "Sương mù".
- `docs/data/battles/trasimene.md`: mục 3 (vị trí còn tranh cãi), mục 4 (bờ hồ), mục 6 (ngày và giờ), mục 7 (sương mù), mục 8 (cảnh vật).
- `docs/tasks/T-053-trasimene-scene.md`, mục "Kết quả", phần "Cho hộp thoại Giới thiệu ở chặng 3": lane 3 đề nghị lời cho sương mù, hồ và quân nấp. Dùng làm điểm xuất phát, sửa cho gọn và hợp giọng với các dòng hiện có.
- `src/data/battles/battle-of-lake-trasimene.json`: các trường `uncertainty` và ghi chú `evidence` của cảnh vật, để lời trong hộp thoại khớp với tab "Thông tin trận".

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Tách ý chung và ý riêng của từng trận

- Các ý đúng cho mọi trận giữ trong danh sách chung: `positions`, `figures`, `duels`, `pulses`, `colours`.
- Ý về thời lượng (`time`) viết lại cho đúng với mọi trận, không nêu tên một trận. Ví dụ hướng viết: một trận dài nhiều giờ được phát trong vài phút.
- Ý riêng của từng trận gom dưới tên trận đó. Tên trận lấy từ dữ liệu (`event.title[locale]`), không viết cứng. Một trận chỉ hiện khi `hasBattle` đúng với sự kiện của nó.
  - **Cannae:** toán giữ trại, cảnh vật, bụi. Giữ nội dung hiện có; được đổi tên khoá và chỉnh câu cho hợp chỗ mới.
  - **Hồ Trasimene:** viết mới, xem mục 2.
- Cách trình bày tuỳ bạn (danh sách con, tiêu đề nhỏ…), miễn hộp thoại vẫn gọn và dễ đọc. Khi thêm trận thứ ba, người làm chỉ cần thêm một nhóm khoá và một mục trong một bảng, không phải sửa bố cục.

### 2. Lời cho trận hồ Trasimene

Tự viết, song ngữ, ngắn như các dòng của Cannae. Phải có các ý sau, mỗi ý nói rõ phần nào theo nguồn và phần nào là giả định:

- **Vị trí:** chỗ diễn ra trận còn tranh cãi; cảnh theo giả thuyết lối hẹp Malpasso và đồng bằng Tuoro (`trasimene.md`, mục 3).
- **Hồ:** bờ hồ là bờ ngày nay theo dữ liệu vệ tinh; độ dốc của đáy hồ là giả định; nguồn kể có người ngập tới cổ, tới vai.
- **Sương mù:** có trong Polybius và Livy, dày ở đồng bằng hơn trên đồi; dày bao nhiêu và tan nhanh hay chậm là giả định.
- **Quân nấp:** khối phục kích vẫn được vẽ nhưng không có tên và màu phe cho tới lúc lao xuống; chỗ nấp cụ thể của từng toán là phỏng dựng.
- **Cảnh vật:** trại, làng, trang trại và rừng (xem ghi chú `evidence` trong file trận). Mặt đất xanh ở trận này không trái nguồn, khác với Cannae (`trasimene.md`, mục 8).

Không chép nguyên văn từ nguồn. Số liệu nêu trong lời (nếu có) phải khớp file trận.

### 3. Nguồn của trận, trong mục ghi công

- `about.credits.battleSources` hiện chỉ có Cannae. Sửa để mỗi trận có một dòng nguồn, kèm link mở trong thẻ mới như hiện nay:
  - Cannae: Polybius 3.107–118, Livy 22.36–52 (như cũ).
  - Hồ Trasimene: Polybius 3.80–85, Livy 22.3–7. Dùng cùng hai link như sự kiện trong `src/data/events.json` (`battle-of-lake-trasimene`, hai nguồn đầu).
- Giữ câu "mỗi trận ghi nguồn riêng ở tab Thông tin trận".

### 4. Kiểm tra

- Mở hộp thoại ở cả hai ngôn ngữ, nền sáng và nền tối, 1280×800: không vỡ bố cục, không có thanh cuộn thứ hai.
- Ở 390 px: không cuộn ngang.
- Mọi link mới mở trong thẻ mới, có `rel="noreferrer"`.
- Mọi khoá mới có cả `en` lẫn `vi`; không còn khoá nào bị bỏ không dùng.
- `npm run lint`, `npm run validate`, `npm run build` qua.
- Ảnh cho người dùng duyệt câu chữ: chụp phần "Độ chính xác" và phần ghi công, cả hai ngôn ngữ, đặt ở `E:\World_History_Platform_assets\duyet\T-054\`. Driver chụp của phiên chính (`E:\World_History_Platform_assets\main-tools\drive`): đặt `PORT=9363`.

## Ràng buộc

- Chỉ sửa file trong phạm vi. `README.md`, `docs/` và `src/lib/credits.ts` là của phiên chính: thấy cần đổi thì ghi đề nghị vào "Kết quả".
- Không import component hay dữ liệu trận của mảng khác vào hộp thoại. Hộp thoại không được tải file trận (file lớn, chỉ tải khi mở trận); chỉ dùng `events`, `hasBattle` như hiện nay.
- Không đổi câu ghi công Copernicus và các dòng ghi công mô hình.

## Xong khi

- Hộp thoại nói đúng về cả hai trận, ở cả hai ngôn ngữ; không còn câu nào viết riêng cho Cannae nằm trong phần chung.
- Các kiểm tra ở mục 4 qua; có ảnh duyệt.
- Mục "Kết quả" đã điền: danh sách khoá thêm, đổi tên, bỏ; nguyên văn lời mới ở cả hai ngôn ngữ, để người dùng duyệt câu chữ; đề nghị cho phiên chính (nếu có).

## Kết quả

(Lane 1 điền khi xong.)
