# T-052: Trận hồ Trasimene, chặng 1: file trận

- **Lane:** 2
- **Model đề xuất:** Opus 5.5, effort `high`.
- **Nhánh:** `lane2/T-052-trasimene-battle` (phiên chính đã tạo sẵn từ `main` trong worktree của bạn).
- **Phạm vi file:**
  - `src/data/battles/battle-of-lake-trasimene.json` (file mới);
  - `docs/data/battles/` (`trasimene.md`; xoá `trasimene-terrain.json` khi file trận đã thay nó);
  - `scripts/battles/` (`validate-battles.mjs`, `test-lake-checks.mjs`, `build-terrain.mjs` nếu cần);
  - **ngoại lệ:** được thêm đúng một dòng `battle-of-lake-trasimene` vào `battleLoaders` trong `src/data/index.ts`, để mở trận ở `/battle-lab`.

## Bối cảnh

T-051 của bạn đã gộp vào `main` ngày 2026-11-19 (merge `ef8c618`). Phiên chính review đạt; dựng lại bốn lưới độ cao ra đúng từng byte.

**Người dùng đã duyệt phương án trong `trasimene.md`:** vị trí lối hẹp Malpasso và đồng bằng Tuoro; La Mã 25 000 người trong 16 khối theo thứ tự hành quân của Polybius 6.40, Hannibal 50 000; sáu giai đoạn 4:30–10:30; `dayOfYear` 131; sương mù `level` 0,8, `clearsAt` 9,75. Làm theo các mục 5–8 của `trasimene.md`.

**Người dùng chọn hai thay đổi hợp đồng** (`src/lib/battle.ts`, phiên chính đã sửa khi gộp; ARCHITECTURE đã ghi):

- **`BattleLake.islands?: FieldPoint[][]`**: mỗi đảo một đường bao, nằm trong `outline`, không chồng nhau. Cảnh vẽ nước trong `outline` trừ các đảo. Người dùng chọn cách có dữ liệu đảo riêng, không phải cách "nước chỉ ở chỗ đất thấp".
- **`UnitState.concealed?: boolean`**: khối đang phục kích. Khối chỉ ẩn trong một giai đoạn khi `concealed` ở cả hai mốc của giai đoạn đó, nên nó lộ ra ngay từ đầu giai đoạn nó rời chỗ nấp. Lúc ẩn, cảnh vẫn vẽ lính nhưng không vẽ nhãn tên và mảng màu phe; thẻ khối ghi là đang nấp. Khối đang nấp không `fight` hay `skirmish`. Mũi tên của giai đoạn không nên chỉ vào khối đang ẩn.

**Song song với bạn:** lane 3 làm chặng 2 ([T-053](T-053-trasimene-scene.md)): vẽ mặt hồ và đảo, lính lội nước, sương mù, khối đang nấp. Trong lúc chờ file của bạn, lane 3 dùng một file trận thử tạm trong nhánh của họ. Bạn không cần làm gì cho lane 3, nhưng hai điều trong file của bạn sẽ là thứ lane 3 dựa vào để đo hiệu năng và chụp ảnh: hồ có `islands`, và các khối phục kích có `concealed`.

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Kiểm tra cho hai trường mới (`validate-battles.mjs`)

- `islands`: là danh sách nếu có; mỗi đảo từ ba điểm (số `x`, `y`), có diện tích, nằm trong `outline` của hồ, không chồng đảo khác.
- Điểm nằm trên đảo **không** tính là nằm trong hồ: địa danh và công trình được đặt trên đảo. Khoảng cách lội tính tới bờ gần nhất, kể cả bờ đảo.
- Trung vị độ cao lưới trong hồ (cảnh báo hiện có) chỉ tính phần nước, không tính đảo.
- `concealed`: là boolean nếu có; khối có `concealed` ở một mốc thì `action` của mốc đó không phải `fight` hay `skirmish`.
- Thêm ca vào `test-lake-checks.mjs` cho các kiểm tra mới; ca cũ vẫn phải đúng.

### 2. File trận `src/data/battles/battle-of-lake-trasimene.json`

- Khối `terrain` lấy từ `trasimene-terrain.json`, thêm `islands` cho hồ (vạch bằng `build-terrain.mjs --lake`; giữ các đảo nằm trong hoặc sát lưới chính, đảo ngoài xa thì tuỳ bạn) và `scenery` theo mục 8.
- Đơn vị theo mục 5; quân số qua các giai đoạn theo mục 6; `strength`, `casualties`, `uncertainty` nói rõ chỗ nào là giả định và vị trí còn tranh cãi; mọi địa danh, trại và khối đặt `approximate` như tài liệu nói.
- Các khối phục kích có `concealed` từ `initial` tới hết giai đoạn 1; ở giai đoạn 2 (hiệu lệnh) chúng rời chỗ nấp.
- Lời dẫn song ngữ, mỗi giai đoạn hai tới năm câu, tự viết. Những chuyện không vẽ được (động đất, Maharbal vây làng, đầu hàng hôm sau) nói trong lời dẫn.
- Hai luật của cảnh: giai đoạn `fight` dài ít nhất 8 giây phát; khối chỉ tới chỗ địch ở cuối một giai đoạn thì giai đoạn sau mới ghi `fight`.
- Đoàn quân qua Malpasso: đặt mốc sao cho đường thẳng giữa hai mốc không cắt sườn núi và không xuống hồ quá 150 m (mục 10, ý 4 của `trasimene.md`). Xem bằng `build-terrain.mjs --preview --phase n` và `check-overlap.mjs`.
- Xoá `trasimene-terrain.json`; `test-lake-checks.mjs` dùng địa hình của file trận.

### 3. Xem trong cảnh

- Thêm dòng vào `battleLoaders` rồi mở `/battle-lab?battle=battle-of-lake-trasimene` (chỉ chạy với `npm run dev`). Driver chụp của phiên chính (`E:\World_History_Platform_assets\main-tools\drive`): đặt `PORT=9362`.
- Cảnh chưa vẽ hồ, đảo, sương mù và khối đang nấp (lane 3 đang làm): hồ còn là mặt đất phẳng, khối đang nấp vẫn có tên. Bạn chỉ xem đội hình, đường đi, chỗ giáp mặt, lính đứng ở đâu so với bờ hồ và sườn đồi; sửa dữ liệu nếu thấy khối đi xuyên sườn núi, chồng nhau hay đánh nhau sai chỗ.
- Ảnh duyệt ở `E:\World_History_Platform_assets\duyet\T-052\`: ảnh phác từng giai đoạn (`--preview --phase n`) và vài ảnh chụp cảnh ở những lúc chính (đoàn quân qua lối hẹp, lúc phục binh lao xuống, bị dồn xuống hồ).

## Ràng buộc

- Không sửa `src/lib/`, `src/components/`, `src/data/events.json`; trong `src/data/index.ts` chỉ được thêm đúng một dòng nói trên. Cần đổi hợp đồng thì ghi đề nghị vào "Kết quả".
- Không cần loại lính mới. Nếu thấy cần thì dừng lại và hỏi qua mục "Kết quả".
- `npm run validate`, `npm run lint`, `npm run build` phải qua.

## Xong khi

- Có `battle-of-lake-trasimene.json` qua `npm run validate`, gồm hồ có đảo, sương mù, cảnh vật, khối phục kích có `concealed`.
- `validate-battles.mjs` kiểm `islands` và `concealed`; `test-lake-checks.mjs` có ca mới và đúng hết.
- Xem được trận ở `/battle-lab?battle=battle-of-lake-trasimene` qua cả sáu giai đoạn; có ảnh duyệt.
- `trasimene.md` cập nhật theo những gì đã đổi khi viết file trận.
- Mục "Kết quả" đã điền.

## Kết quả

(Lane 2 điền khi xong.)
