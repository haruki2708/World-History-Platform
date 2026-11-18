# T-037: Phong cảnh, chặng 0 (tư liệu và hợp đồng dữ liệu)

- **Ai làm:** phiên chính (người dùng chọn 2026-11-18: phiên chính làm chặng 0 và 1 của đợt H).
- **Model:** Fable 5.2.
- **Nhánh:** `batch-h/stage0-scenery-data` (tạo từ `main` ở `304206d`). Không commit thẳng vào `main`.
- **Trạng thái:** xong, chờ người dùng duyệt gộp.
- **Phạm vi file:** `src/lib/battle.ts`, `src/data/battles/battle-of-cannae.json`, `scripts/battles/validate-battles.mjs`, `docs/`.
- **Kế hoạch chung:** `docs/PLAN.md`, mục "Đợt H".

File này vừa là đề bài vừa là nhật ký: phiên nào làm tiếp thì đọc mục "Kết quả" ở cuối trước.

## Vấn đề

Cảnh trận Cannae chỉ có mặt đất tô màu, một dải sông phẳng và các khối quân. Người dùng muốn trận đánh trông chân thực hơn: có phong cảnh, nhà cửa, cây cối, sông; cảnh vật nào có tư liệu thì dựng thành hình.

Trước khi vẽ, phải biết vẽ cái gì và dựa vào đâu. Chặng này chưa vẽ gì: nó chốt tư liệu, kiểu dữ liệu và dữ liệu của Cannae, để bốn chặng sau chỉ việc vẽ theo.

## Xong khi

- Đã đọc lại Polybius và Livy về cảnh vật quanh Cannae; căn cứ của từng thứ ghi ở `docs/data/battles/cannae.md`.
- `src/lib/battle.ts` có kiểu dữ liệu phong cảnh; mỗi thứ mang mức căn cứ.
- File trận Cannae có dữ liệu phong cảnh.
- `npm run validate` kiểm tra dữ liệu mới.
- Trận không có dữ liệu phong cảnh vẫn hợp lệ; cảnh hiện tại không đổi.
- `npm run lint`, `npm run validate`, `npm run build` qua.
- `docs/ARCHITECTURE.md` có mục "Phong cảnh"; `docs/PLAN.md` có mục "Đợt H".

## Kết quả

Làm 2026-11-18.

### Đã làm

**Tư liệu.** Đọc lại Polybius 3.107–117 (bản Paton) và Livy 22.40–49 (bản Latin). Bảng các câu dùng được, căn cứ của từng thứ và cách tính kích thước trại ở `docs/data/battles/cannae.md`, mục 12. Ba điều đáng chú ý:

- Polybius 3.110 nói vùng quanh Cannae "bằng phẳng và không có cây". Cảnh Cannae vì vậy không có rừng; cây chỉ có thưa ở ven sông và là minh hoạ.
- Cannae có nhà cửa có tư liệu: một thành nhỏ chứa lương (Polybius 3.107) và một ngôi làng không tường, đã bị san phẳng từ trước (Polybius 3.107, Livy 22.49).
- Gió và bụi chỉ có ở Livy (22.43, 22.46); Polybius không nhắc.

**Hợp đồng (`src/lib/battle.ts`).**

- `SceneryBasis` (`attested`, `inferred`, `illustrative`) và `SceneryEvidence` (mức, ghi chú song ngữ, nguồn).
- `GroundCover`: `stubble`, `grass`, `scrub`, `reeds`, `woodland`, `bare`.
- `BattleRiver` thêm hai trường tuỳ chọn: `level` (mực nước `low` hay `full`) và `banks` (lớp phủ hai bờ và bề rộng dải).
- `SceneryArea` (mảng đất có lớp phủ riêng, cho bằng đường bao), `SceneryStructure` (`camp`, `citadel`, `village`; phần đất là hình chữ nhật cho như `Formation`), `BattleWind`, `BattleScenery`.
- `BattleTerrain.scenery` là tuỳ chọn.

**Dữ liệu Cannae (`src/data/battles/battle-of-cannae.json`).**

- Mặt đất: ruộng đã gặt (`inferred`).
- Sông Aufidus: nước cạn (`inferred`); hai bờ có lau sậy và cây thấp trong dải 25 m (`illustrative`).
- Năm công trình, đều `attested` về sự tồn tại: trại lớn của La Mã (1050 × 1050 m), trại nhỏ (750 × 750 m), trại của Hannibal (1000 × 1000 m), thành Cannae trên đỉnh gò (160 × 100 m), làng Cannae đổ nát cạnh gò (240 × 160 m).
- Gió từ đông nam, 8 m/s (`attested`, Livy); bụi mức 0,8 (`attested`, Livy).
- `areas` để trống, thêm ở chặng thực vật.
- Nhãn "Trại của Hannibal" dời từ (−3550, −400) về tâm trại (−3975, −500): trại được đặt để luỹ phía đông nằm ngay trước mặt đạo quân La Mã đánh trại, và nhãn cũ rơi ra ngoài luỹ. Đây là thay đổi duy nhất người xem thấy được trong chặng này.

**Kiểm tra (`scripts/battles/validate-battles.mjs`).** Hàm `checkScenery`: mức căn cứ, ghi chú, nguồn; công trình nằm trọn trong vùng địa hình, không chồng nhau, không lấn vào sông và dải bờ; trại phải có `side`; các số trong khoảng cho phép; cảnh báo khi nhãn của trại hay thị trấn nằm ngoài công trình cùng loại.

**Tài liệu.** `docs/ARCHITECTURE.md` mục "Phong cảnh (đợt H)"; `docs/PLAN.md` mục "Đợt H" và nhật ký; `docs/data/battles/cannae.md` mục 12 và dòng trại của Hannibal ở mục 4.

### Đã kiểm tra

- `npm run lint`, `npx tsc --noEmit`, `npm run validate`: qua.
- Cố ý làm sai dữ liệu phong cảnh theo 16 kiểu (thiếu nguồn, mức lạ, trại nằm trên sông, công trình chồng nhau, ra ngoài lưới, số ngoài khoảng...): cả 16 đều bị bắt; file được trả lại nguyên vẹn sau khi thử.
- Đo từng công trình trên lưới độ cao: khoảng cách tới sông, độ cao mặt đất bên dưới, khối quân nào đứng bên trong ở mỗi mốc (bảng ở `cannae.md`, mục 12).
- `npm run build` (worktree tạm, commit `d461fe4`, cài thư viện riêng bằng `npm ci` vì Turbopack không đi theo liên kết `node_modules` ra ngoài thư mục gốc): qua. Hồi quy lõi của app (`main-tools/reg-core.js`) trên bản production đó: 17/17, console sạch, trận Cannae mở được.
- Chưa xem bằng mắt vị trí mới của nhãn "Trại của Hannibal" trong cảnh.

### Khác với đề xuất đã trình

- Đề xuất nói mỗi thứ có nhãn "có tư liệu" hay "minh hoạ". Dữ liệu dùng **ba** mức, thêm `inferred` ở giữa cho những thứ suy ra được từ nguồn (ruộng đã gặt, nước sông cạn).
- Người dùng trả lời câu hỏi về thứ không có tư liệu bằng "vẽ 3d chân thực". Phiên chính hiểu là: vẫn vẽ, với hình dáng chân thực. Dữ liệu vẫn đánh dấu các thứ đó là `illustrative` và đồng bằng vẫn không có cây. Người dùng chưa xác nhận riêng cách hiểu này.

### Còn lại, và đề nghị cho các chặng sau

- **Cảnh chưa đọc `scenery`.** Chặng 1 bắt đầu dùng `ground`, `level`, `banks`.
- Hợp đồng viết trước khi có phần vẽ. Chặng 1 có thể phải thêm trường (ví dụ lưới độ cao thưa cho vùng xa, mực nước biển); khi đó sửa `battle.ts` và mục "Phong cảnh" cùng lúc.
- Vài khối quân đứng trong trại của mình lúc ra quân và lúc rút về; chặng công trình phải để trống chỗ đó.
- Chưa có khối quân Carthage giữ trại của Hannibal (Polybius 3.117).
- Cách xếp lều, đường, cổng của trại La Mã (Polybius 6.27–32) chưa đọc kỹ; kích thước hào và luỹ không có trong Polybius.
- Hộp thoại Giới thiệu chưa nói gì về phong cảnh: thêm ở chặng 1, khi cảnh bắt đầu vẽ.
