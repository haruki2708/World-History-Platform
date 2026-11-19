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

Lane 2, 2026-11-19. Bốn commit trên `lane2/T-052-trasimene-battle`. `npm run validate` (không cảnh báo), `npm run lint`, `npm run build` đều qua. `test-lake-checks.mjs` đúng 45 trên 45 ca. Căn cứ và cách đặt khối quân ghi ở `docs/data/battles/trasimene.md`, mục 12 (mới) và các mục 3, 5, 6, 8, 10, 11 (đã sửa).

### 1. Kiểm tra `islands` và `concealed` (`validate-battles.mjs`)

- `islands`: phải là danh sách; mỗi đảo từ ba điểm có số `x`, `y`, có diện tích; nằm trong `outline` (mọi đỉnh ở trong, không cạnh nào cắt bờ); không chồng đảo khác (không cạnh nào cắt nhau, không đảo nào nằm trong đảo kia). Đảo sai thì bị bỏ ra khỏi các kiểm tra sau.
- Điểm trên đảo không tính là trong hồ: địa danh và công trình đặt được trên đảo. Khoảng cách lội tính tới bờ gần nhất, kể cả bờ đảo. Trung vị độ cao lưới (cảnh báo) chỉ lấy phần nước.
- `concealed`: phải là boolean; ở mốc nào có `concealed` thì `action` của mốc đó không được là `fight` hay `skirmish`.
- Thêm một cảnh báo hợp đồng có nói mà task không đòi: mũi tên của một giai đoạn bắt đầu hay kết thúc trong (hay cách không quá 30 m) một khối ẩn suốt giai đoạn ấy.
- `test-lake-checks.mjs`: 20 ca mới, tổng 45 ca. Trong đó 5 ca phải qua: địa danh và trang trại trên đảo Maggiore; khối lội cách bờ đảo 55–100 m nhưng cách bờ hồ 1,2 km; trung vị bỏ qua một "đảo" đất cao; quân nấp rời chỗ nấp có mũi tên. 15 ca phải bị bắt (2 ca là cảnh báo). Script đọc địa hình của file trận.

### 2. File trận

- **Địa hình:** lấy từ khối nháp, thêm `islands` vạch bằng `--lake`. Lấy cả ba đảo: Minore; Maggiore (vắt qua mép nam lưới chính); Polvese (ngoài lưới chính, để vùng xa không vẽ một đảo cao 60 m thành mặt nước). Hai lưới độ cao dựng lại ra đúng từng byte. `trasimene-terrain.json` đã xoá.
- **Đơn vị:** La Mã 16 khối, 25 000 người, theo thứ tự hành quân. Hannibal 14 khối, 50 000 người. Mười khối phục kích có `concealed` ở `initial` và cuối giai đoạn 1, rời chỗ nấp ở giai đoạn 2. Lính Libya và Iberia đứng ở trại, nhìn thấy được, nên không có `concealed`.
- **Quân số:** La Mã mất 15 454, Hannibal mất 2 130 (mục 12 của `trasimene.md`). `strength`, `casualties` và `uncertainty` ghi rõ chỗ nào là giả định và vị trí còn tranh cãi. Địa danh, trại và vị trí khối quân đều là phỏng đoán, `uncertainty` nói vậy.
- **Lời dẫn:** sáu giai đoạn, song ngữ, mỗi giai đoạn 4–5 câu, tự viết. Lời dẫn có động đất (Livy 22.5), Ducarius và các triarii, người La Mã xin tha dưới nước, Maharbal vây làng và điều kiện đầu hàng theo cả Polybius lẫn Livy. Các chi tiết này đã đối chiếu lại với nguyên văn: Polybius 3.84–85 trên LacusCurtius, Livy 22.5–6 bản Latin.
- **Cảnh vật:** sương (0,8; tan lúc 9:45), gió, bụi, dải lau sậy ven bờ, ba mảng rừng, một mảng bụi, hai trại, làng Etruria và tám trang trại (sáu trang trại bị đốt). Mỗi thứ có ghi chú căn cứ.
- **Hai luật của cảnh:** giai đoạn `fight` dài 20 và 25 giây phát. Khối nào tới chỗ địch thì giai đoạn sau mới ghi `fight`: quân phục kích `charge` ở giai đoạn 2 rồi đánh ở giai đoạn 3; kỵ binh Numidia vào lối hẹp ở giai đoạn 3 rồi đánh ở giai đoạn 4.
- **Qua Malpasso:** mọi đường thẳng qua lối hẹp đều lên ít nhất 16,7 m trên mặt hồ, đó là chỗ yên ngựa tự nhiên. Chỉ có một hướng không leo sườn núi, 67° qua (−450, −1 175). Đường đi của mọi khối La Mã trong lối hẹp cao nhất 18 m; khi hành quân qua lối hẹp không khối nào xuống nước. `check-overlap.mjs` cho thấy các cặp đánh nhau chạm mép 7% (hai mặt trận trùng nhau) và không có chồng lấn nào khác từ 5% trở lên, kể cả giữa hai mốc.

**Ba chỗ khác phương án người dùng đã duyệt.** Lý do ghi ở `trasimene.md` mục 6 và 12. Người dùng xem lại giúp:

1. **Lúc 4:30 đầu đoàn quân đã qua lối hẹp**, không phải "vừa ra khỏi trại". Cảnh đi thẳng giữa hai mốc, nên khối nào còn ở phía tây lối hẹp ở một mốc thì mốc sau phải nằm trên đường ven hồ hướng 67°. Muốn đầu đoàn bắt đầu ở trại thì phải thêm một giai đoạn (chia giai đoạn 1 làm hai), hoặc đổi hợp đồng: `UnitState.path`, mục 10 ý 4. Cách này vẫn khớp Livy 22.4.4: qua lối hẹp khi trời còn chưa sáng rõ.
2. **Giai đoạn 2 dài 20 giây phát thay vì 12** (tổng 130 giây). Đồng bằng rộng chừng 2 km, quân Gaul phải xung phong 0,9–1,5 km từ chân núi. Với 12 giây, họ phải chạy 110–130 m/s trên sân; với 20 giây là 47–76 m/s (Cannae: 30–70).
3. **Bộ binh Gaul chia năm khối 3 200 người thay vì bốn khối 4 000**, để mỗi khối đánh đúng một hay hai khối La Mã nằm trên một đường thẳng.

Ngoài ra có hai chỗ đổi nhỏ. Trại của Hannibal rộng 550 × 550 m: T-051 ghi 450 × 450 m, không khớp với phép tính 30 ha của chính nó. Trại được dời lên đỉnh đồi Tuoro để toán đầu phá vây đi sát góc trại (cách 3 m) mà không qua trại. Kỵ binh Numidia và Iberia nấp ở sườn tây nam mỏm núi, sau các gò đất ở cửa tây lối hẹp, không nấp sau gò 381 m: từ gò đó xuống lối hẹp phải vượt sườn núi.

### 3. Xem trong cảnh

- Thêm một dòng vào `battleLoaders`. Đã mở `/battle-lab?battle=battle-of-lake-trasimene` với `next dev` cổng 3152 và driver `PORT=9362`, xem qua cả sáu giai đoạn. Console không có lỗi. Đã sửa những chỗ thấy chưa ổn: các khối đi xuyên qua nhau, quân đuổi xoay người quét vào khối đang chạy, hai toán lính nhẹ cắt đường nhau, chỗ nấp còn lộ, đường phá vây đi qua trại.
- Ảnh duyệt ở `E:\World_History_Platform_assets\duyet\T-052\`:
  - `0`–`6-phac-giai-doan-*.jpg`: ảnh phác từng mốc (`--preview --phase n`), có tên địa danh tiếng Việt; khối đang nấp màu xám.
  - `7`–`16-canh-*.jpg`: ảnh chụp cảnh bằng tiếng Việt: qua lối hẹp, toàn cảnh lúc 6:00, phục binh lao xuống, giáp mặt, kỵ binh trong lối hẹp, chỗ Flaminius, phá vây, bị dồn xuống hồ, cuối giai đoạn 5, rút về làng.
- Cảnh chưa vẽ hồ, sương và quân nấp (T-053), nên trong ảnh hồ còn là mặt đất, khối nấp vẫn có tên.

### Thay đổi nhỏ khác trong phạm vi

- `build-terrain.mjs --preview` vẽ bờ các đảo. Với `--phase n`, khối đang nấp vẽ màu xám.

### Cho lane 3 (T-053)

- Hồ có 3 đảo: Polvese 51 điểm, Maggiore 25, Minore 17. Có 10 khối `concealed` (ẩn suốt giai đoạn 1).
- Lúc tan chạy, quân La Mã đứng trong nước cách bờ tới 95 m, ở dọc bờ bắc từ x −240 tới 1 185 và trong lối hẹp. Kỵ binh Numidia theo khối đi cuối xuống nước.
- Toàn trận có 3 750 hình lính.

### Đề nghị ngoài phạm vi (cho phiên chính)

1. **Dòng `battleLoaders` làm trận hiện cả trong app chính.** Panel sự kiện sẽ có nút xem trận Trasimene, trong khi cảnh chưa có hồ và sương. Hộp thoại Giới thiệu đếm trận bằng `hasBattle`, và bốn khoá viết riêng cho Cannae (`about.accuracy.battle.time`, `about.accuracy.battle.campGuard`, `about.accuracy.battle.dust`, `about.credits.battleSources`) sẽ nói sai khi có hai trận (ARCHITECTURE, mục "Link chia sẻ, giới thiệu và phím tắt"). Đề nghị: chặng 3 xử lý, hoặc tạm ẩn trận khỏi app chính cho tới khi T-053 xong.
2. **`docs/ARCHITECTURE.md`**, mục "Phong cảnh", ý "Kiểm tra": thêm kiểm tra `islands`, `concealed` và cảnh báo mũi tên; đổi "25 ca" của `test-lake-checks.mjs` thành 45 ca.
3. **`/battle-lab`**: tên giai đoạn ở thanh dưới vẫn hiện tiếng Anh khi có `?lang=vi` (ví dụ "1/6 · Through the narrows"). Không ảnh hưởng tới dữ liệu.
4. Nếu người dùng muốn giữ "đầu đoàn vừa ra khỏi trại" lúc 4:30, có hai cách: thêm `UnitState.path?: FieldPoint[]` (đường gấp khúc giữa hai mốc), hoặc tách giai đoạn 1 làm hai. Cách sau không cần đổi hợp đồng.

### Còn lại

- Script dùng để sinh file trận là script tạm, không đưa vào repo. File JSON là bản gốc; muốn sửa thì sửa thẳng file, rồi kiểm bằng `validate-battles.mjs`, `check-overlap.mjs` và `build-terrain.mjs --preview --phase n`.
