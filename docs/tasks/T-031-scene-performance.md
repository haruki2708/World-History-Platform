# T-031: Lấy lại hiệu năng của cảnh sau đợt E

- **Lane:** 3.
- **Model đề xuất:** Opus 5.5, effort `high`.
- **Nhánh:** `lane3/T-031-scene-perf` (tạo từ `main` mới nhất)
- **Phạm vi file:** `src/components/battle/`.

## Bối cảnh

Đợt E (gộp 2026-11-17) đưa vào cùng lúc T-022 (ba mô hình kỵ binh thật thay cho hình tạm, clip `jog`), T-027 (tải sẵn) và T-028 (tên khối quân, thẻ, đi xiên). Phiên chính đo xen kẽ ba vòng trên bản production, máy sạch (không Blender), RTX 3050, khung bên mở, `s-perf.mjs` của T-028:

| Lúc | Trước đợt E (`2a355b9`) | Sau đợt E |
|---|---|---|
| Phát 1×, giai đoạn 1 / 3 / 4 | 69 / 71 / 69 fps | 59 / 60 / 60 fps |
| p99 khi phát 1× | 17–19 ms | 34–36 ms |
| Phát 2×, giai đoạn 6 | 99 fps | 91 fps |
| Dừng, góc nhìn mở | 102–105 fps | 92–98 fps |

Vẫn trên mục tiêu 50 fps, nhưng khung chậm nhất dài gấp đôi: trên màn hình 60 Hz, cảnh sẽ giật khi phát. Người dùng chọn lấy lại phần chậm này.

**Phiên chính đã tách được** (đo bản sau đợt E, mỗi biến thể hai lượt, số dao động nhiều):
- Tắt nhãn khối quân (`whp.battleUnitNames` = `off`): lấy lại khoảng một nửa.
- Vẽ kỵ binh bằng hình tạm như trước (chặn `index.json` bỏ ba mô hình kỵ binh): lấy lại khoảng một nửa. Kỵ binh thật thêm khoảng 217 nghìn tam giác ở góc nhìn mở (4,04 so với 3,82 triệu).
- Tắt cả hai: ngang trước đợt E (67–70 fps, p99 18 ms).
- Profile CPU lúc phát giai đoạn 1: phần lớn mỗi khung là chờ GPU (`readPixels` khoảng 8,5 ms). JavaScript của cảnh chỉ nhiều hơn 0,5–0,8 ms (`UnitBlock.update` có phần quay người; phần đặt nhãn khoảng 0,2–0,3 ms). Nên phần đắt của nhãn nhiều khả năng là trình duyệt vẽ lại lớp nhãn đè lên canvas mỗi khung (nhãn dời theo khối, có nền trong mờ và bóng), cùng dùng GPU với cảnh.
- Thử nhanh `will-change: transform` cho `[data-unit-label]` (chèn CSS lúc chạy): chưa thấy rõ hiệu quả qua hai lượt.

Kịch bản đo của phiên chính: `E:\World_History_Platform_assets\main-tools\drive\` (`s-perfvar.mjs`: bật/tắt nhãn, kỵ binh thật hay hình tạm, chèn CSS; `s-cpuprof.mjs`).

## Việc dở của T-028 (làm trước)

1. Đo lại trượt chân với code cuối (`s-oblique.mjs`, `s-planted.mjs`), điền vào mục "Kết quả" của T-028 nếu khác bảng cũ.
2. `/battle-lab`: bấm khối, Esc đóng thẻ; nhãn bị khối khác che khi camera thấp (`s-hidden.mjs`).

## Yêu cầu

1. **Tìm chỗ tốn** bằng số đo, không đoán: trace của Chrome (Performance: paint, composite, GPU), profile CPU, so có và không có nhãn.
2. **Nhãn khối quân:** giảm chi phí khi đang phát mà người xem không thấy khác. Gợi ý, thử rồi chọn theo số đo:
   - không vẽ lại khi nhãn chưa dời đủ một pixel (đã có, kiểm tra lại cả phần `text`);
   - lớp compositor riêng cho từng nhãn, hay một lớp chung chỉ dời bằng `transform`;
   - bỏ bóng hay nền trong mờ nếu chúng làm vẽ lại tốn (giữ được độ dễ đọc ở cả nền sáng lẫn tối);
   - giảm cấp phát mỗi khung trong `unitViews` và bố cục nhãn (`new Map`, mảng và đối tượng mới mỗi khung) nếu GC góp vào khung chậm.
3. **Kỵ binh:** xem mức chi tiết. Cảnh chọn LOD theo chiều cao trên màn hình (`model.height`, kỵ binh cao 2,24–2,67 m nên giữ LOD0 lâu hơn bộ binh). Cân nhắc ngưỡng theo kích thước thật của hình (ví dụ chiều cao của người, hay căn bậc hai diện tích khung bao), sao cho kỵ binh ở xa xuống LOD1 sớm như bộ binh cùng cỡ trên màn hình. Không làm kỵ binh gần camera xấu đi.
4. **Đi xiên:** nếu profile cho thấy phần quay người đáng kể thì giảm (ví dụ bỏ qua khối đứng yên, tránh `atan2` khi vận tốc không đổi).
5. Không đổi hình ảnh: nhãn vẫn bám khối, không trễ thấy được; kỵ binh gần camera như cũ.

## Đo

- So xen kẽ với bản trước đợt E (`2a355b9`, dựng trong worktree tạm) và bản `main` lúc nhận task, ít nhất ba lượt sạch mỗi bên (ghi Blender có chạy hay không).
- Các cửa sổ của `s-perf.mjs`, thêm p99 và số khung trên 25 ms.
- Máy thiếu RAM thì đóng dev server của mình trước khi chạy bản production.

## Ràng buộc

- Chỉ sửa trong `src/components/battle/`. Không thêm thư viện npm.
- Không đổi hợp đồng `src/lib/battle.ts`; cần thì ghi đề nghị.
- Commit sau mỗi phần việc lớn.

## Xong khi

- Lúc phát 1×, giai đoạn 1 / 3 / 4: lấy lại ít nhất một nửa phần chậm so với trước đợt E (khoảng 64 fps trở lên trong cùng điều kiện đo), p99 gần mức trước đợt E. Nếu không đạt, ghi rõ phần còn lại tốn ở đâu.
- Hình ảnh không đổi (ảnh chụp so trước/sau ở cùng góc nhìn: nhãn, kỵ binh gần và xa).
- Việc dở của T-028 xong.
- `npm run lint`, `npm run build`, `npm run validate` qua; console sạch.

## Kết quả

Xong. Nhánh `lane3/T-031-scene-perf`, hai commit: "T-031 part 1" (việc dở của T-028) và "T-031 part 2" (hiệu năng).

**Tóm tắt.** Lúc phát 1×, giai đoạn 1 / 3 / 4, bản T-031 đạt trung bình 64,4 / 66,5 / 65,8 khung hình/giây, so với 57,7 / 57,3 / 56,7 của `main` và 67,5 / 67,4 / 67,4 của bản trước đợt E. Như vậy lấy lại 68% / 91% / 85% phần chậm. p99 về 18–21 ms, bản trước đợt E 17–19 ms, `main` 34–41 ms. Lúc dừng thì nhanh hơn cả bản trước đợt E (góc nhìn mở 106,7 so với 102,8). Hình ảnh không đổi: so từng pixel ở sáu góc nhìn.

Chỗ lấy lại được nhiều nhất không nằm ở nhãn hay mức chi tiết của kỵ binh như dự đoán, mà ở **bóng đổ**. Các mô hình tách mỗi đỉnh thành 3–4 đỉnh theo đường nối UV, nên lượt vẽ bóng tô bóng nhiều gấp ba mức cần. Bóng giờ vẽ từ lưới đã gộp đỉnh, ra đúng bóng cũ mà rẻ hơn. Phần tiết kiệm được bù cho phần kỵ binh thật thêm vào.

### Việc dở của T-028

- **Trượt chân với code cuối** (`s-oblique.mjs`, `s-planted.mjs`): mọi dòng lệch không quá 1,5 điểm phần trăm so với bảng cũ. Đã điền ô còn thiếu (hastati ở t = 5,2: trượt dọc 3,9%) và sửa ghi chú trong T-028.

  | Khối, lúc | Lệch / dọc / ngang (code cuối) |
  |---|---|
  | Libya trái, t = 4,05 | 0° / −1,7% / 0,2% |
  | Libya phải, t = 4,05 | 0° / 0,9% / 0,1% |
  | Libya trái, t = 4,4 | 4° / 0% / 7% |
  | Velites, t = 4,2 | 18° / 4,9% / 31% |
  | Bộ binh nhẹ đồng minh, t = 4,2 | 25° / 9% / 43% |
  | Hastati, t = 4,2 | 10° / 1,4% / 18% |
  | Principes, t = 4,2 | bước lùi / 8,7% / 41% |
  | Hastati, t = 5,2 | 17° / 3,9% / 30% |
  | Bộ binh đồng minh hàng trước, t = 4,2 | bước lùi / 11% / 46% |
  | Gaul trái, t = 4,2 | bước lùi / 16% / 54% |

  Thêm vài khối đi thẳng (`s-planted`):
  - hastati tiến ở t = 2,4 (`jog`): trượt dọc −1,5%, ngang 5%;
  - Libya trái giao chiến ở t = 5,5 (`jog`): 1,7% / 6%;
  - Gaul trái giao chiến ở t = 5,65: 13% / 50%. Hàng chờ ở đây lệch 30°, dưới ngưỡng quay 35°, nên không quay (như đã ghi ở T-028).
- **`/battle-lab`** (`s-lab.mjs`, tiếng Anh và tiếng Việt):
  - bấm vào tên một khối thì mở thẻ của khối đó;
  - Esc đóng thẻ mà vẫn ở lại trang;
  - bấm vào giữa một khối thì mở đúng khối mà `pickUnit` trả về;
  - bấm chỗ trống hay nút đóng thì đóng thẻ.

  Console sạch. Ảnh: `lab-1-card-en.png`, `lab-1-card-vi.png`, `lab-2-block-en.png`, `lab-2-block-vi.png`.
- **Nhãn bị khối khác che:**
  - Kịch bản cũ (`s-hidden.mjs`) đặt camera ở 3°, nhưng camera không xuống dưới 4° so với điểm nhìn. Ở khoảng cách đó, camera cao hơn đầu lính nhiều mét, nên không nhãn nào bị che. Nhãn khối nằm cao hơn đỉnh hộp che của khối khác khoảng 1,5 m (giữa nhãn và vai), nên ở 4° chỉ một khối đứng trong khoảng 20 m trước điểm nhãn mới che được nó.
  - Kịch bản mới (`s-hidden2.mjs`): ở t = 3,5, camera cao khoảng 4 m, cách một khối 55 m, đứng về phía khối bên cạnh.
    - Camera lọt vào giữa một khối thì mọi nhãn bị che: đúng, vì lính đứng quanh camera.
    - Nhìn qua bộ binh đồng minh hàng trước sang hàng sau: điểm giữa của nhãn hàng sau bị che, nên nhãn dời sang điểm ở đầu khối.
    - Khối không tự che nhãn của mình: camera sát sau một khối, cả ba điểm nhãn của khối đó vẫn thấy.
  - Ảnh: `h2-1` … `h2-8`.

### Đo để tìm chỗ tốn

Kịch bản đo ở `E:\World_History_Platform_assets\T-031\tools\`:
- `s-trace.mjs`: trace của Chrome, theo từng luồng;
- `s-cpuprof.mjs`: profile CPU;
- `s-gputime.mjs`: thời gian GPU của `renderer.render`, đo bằng `EXT_disjoint_timer_query_webgl2`, ẩn từng phần lần lượt;
- `s-ab-labels.mjs`: so A/B ngay trong một lượt, các cửa sổ 3 giây xen kẽ;
- `s-layers.mjs`: các lớp compositor và số lần vẽ lại.

Máy có lúc bận lúc rảnh, nên chỉ so những gì đo trong cùng một lượt hay đo xen kẽ.

- **Một khung trong `s-perf` gồm:** JS của cảnh, cộng thời gian chờ GPU vẽ xong (`readPixels` đợi luồng GPU), cộng các bước dựng trang (style, paint, layerize, commit: khoảng 1,5 ms, có cả ở bản trước đợt E, vì thanh tua và đồng hồ đổi mỗi khung). Trên luồng GPU, WebGL và raster lớp DOM chạy nối nhau.
- **Phần đắt thêm của đợt E**, ở giai đoạn 1 và 4, so với bản trước đợt E:
  - **WebGL +0,8–0,9 ms**, do kỵ binh thật. Timer GPU, dừng ở t = 0,5: 810 kỵ binh tốn khoảng 0,75 ms, trong đó bóng khoảng 0,55 ms. Để so: 800 bộ binh Gaul tốn khoảng 0,45 ms. Kỵ binh đắt hơn đúng theo cỡ và số đỉnh, không có gì bất thường.
  - **Raster trên luồng GPU +0,36–0,46 ms**, do nhãn khối quân. Nhãn nằm trên canvas nên bị gom vào 2–3 lớp "Overlap"; nhãn nào dời 1 pixel thì cả lớp được vẽ lại. Mỗi khung khoảng 0,45 lần dời.
  - **JS +0,6–0,7 ms**: `UnitBlock.update` (phần quay người) thêm khoảng 0,4–0,6 ms. Phần đặt nhãn khoảng 0,3–0,5 ms, nhưng chạy sau `render`, trong lúc GPU đang vẽ, nên phần lớn không cộng vào khung.
  - **GC không đáng kể**: khoảng 0,03 ms/khung, cứ khoảng 20 khung có một lần dọn nhỏ chừng 0,6 ms.
- **Vì sao p99 gấp đôi:** `s-perf` lấy dấu thời gian của `requestAnimationFrame`. Trình duyệt phát `BeginFrame` khoảng 145 lần/giây, còn khung chính bị hoãn khi lần commit trước chưa xong. Khi khung dài quá khoảng 16,7 ms, nhiều khung có dấu thời gian cách nhau 33–38 ms, dù đo bằng đồng hồ thật (`performance.now()` lúc callback chạy) p99 chỉ 20–24 ms. Vì vậy p99 nhảy vọt khi khung vượt ngưỡng, và về lại 17–20 ms khi khung xuống quanh 15 ms. `s-perf.mjs` giờ in cả hai loại p99 và số khung trên 25 ms.
- **Nhãn: các cách thử, đều so A/B trong cùng lượt:**

  | Cách | fps (so với nhãn như cũ cùng lượt) | Kết luận |
  |---|---|---|
  | Tắt nhãn | 62,5 / 60,3; 60,1 / 60,8; 64,6 / 63,1 | Nhãn tốn 0–2 fps |
  | Lớp riêng cho từng nhãn (`will-change: transform`) | 56,1 / 60,3; 63,9 / 63,1 | Không nhanh hơn, nhiều khung chậm hơn (layerize đắt lên) |
  | Lớp riêng, vẽ sau cùng (`z-index`) | 63,4 / 63,1 | Không hơn, nhiều khung chậm hơn |
  | Một lớp chung cỡ cảnh | 57,9 / 60,8 | Chậm hơn (mỗi lần dời phải raster lại ô 256×256) |
  | Bỏ bóng mờ của nhãn | 59,5 / 60,8 | Không hơn |

  Nên tôi giữ nguyên cách vẽ nhãn. Chỉ giảm JS của nhãn: `unitViews` không cấp phát gì mỗi khung, và chỉ tính khung bao trên màn hình cho khối đang mở thẻ (chỉ thẻ dùng tới).
- **Mức chi tiết của kỵ binh** (`s-lodsim.mjs`): ở mọi cửa sổ của `s-perf` (góc nhìn mở), mọi hình lính, cả kỵ binh, đều đã ở LOD2, nên ngưỡng không ảnh hưởng tới các số đo. Tôi tính thử chặn chiều cao dùng để chọn mức theo chiều cao người (2,33 / 2,09 / 1,87 m), ở các góc nhìn cách kỵ binh của Hasdrubal 120 / 200 / 300 / 450 / 700 m: không khối hình nào đổi mức. Mức được chọn cho cả khối hình (tối đa 256 hình) theo hình gần camera nhất, nên chênh 10–20% chiều cao không đẩy khối nào qua ngưỡng. Vì vậy tôi **không đổi ngưỡng**, và kỵ binh gần camera giữ nguyên.
- **Chỗ tốn GPU lớn nhất ở góc nhìn mở là LOD2 có quá nhiều đỉnh.** Mỗi mô hình ở LOD2 chỉ có 185–250 vị trí khác nhau nhưng 650–840 đỉnh, vì đỉnh bị tách theo đường nối UV. Các UV bị tách cách nhau từ 64 texel trở lên, tức là đường nối thật. Thử gộp đỉnh theo vị trí ngay trên trang (`s-weld.mjs`, chỉ để đo, màu sai ở đường nối): GPU vẽ một khung mất 4,6 ms thay vì 7,4 ms. Với lượt vẽ hình thì không làm được mà giữ nguyên hình, xem "Đề nghị". Với lượt vẽ bóng thì được, vì lượt này không đọc UV.

### Đã sửa (`src/components/battle/engine/`)

1. **Bóng vẽ từ lưới đã gộp đỉnh** (`units.ts`, `depthGeometry`): cùng các tam giác, chỉ giữ `position`, `aBoneIndex`, `aBoneWeight`, gộp các đỉnh trùng vị trí và trùng xương. LOD2 còn khoảng 30% số đỉnh, LOD1 khoảng 30–45%. Bóng ra y hệt: `s-shadowcheck.mjs` vẽ trong cùng trang, cùng trạng thái, chỉ khác lưới bóng, ở bốn góc nhìn. Lệch tối đa 5 pixel, mỗi pixel 1 mức màu; vẽ cùng một khung hai lần cũng lệch tới 9 pixel như vậy.
2. **Lưới chỉ để đổ bóng nằm ở layer riêng** (`SHADOW_LAYER`): camera của bóng thấy layer này, camera chính thì không. Trước đây mỗi khung, lượt vẽ chính vẫn đặt chương trình shader, uniform và VAO cho một lệnh vẽ 0 hình ứng với mỗi khối hình (vài chục lệnh). Hình không đổi (`s-shadowcheck.mjs`: lệch tối đa 57 pixel, mỗi pixel 1 mức màu).
3. **Đi xiên, cùng quy tắc mà rẻ hơn** (`units.ts`):
   - Hình lính đi trong khoảng 35° quanh hướng thẳng tới hay thẳng lùi (gần như mọi hình) được nhận ra bằng tích vô hướng so với cos²(35°), không cần `atan2`. Chỉ hình nằm trong dải đi xiên mới tính góc.
   - `sin`/`cos` của hướng chỉ tính một lần, dùng chung cho phần quay và phần bước chân.
   - `Math.sqrt` thay `Math.hypot`; không còn phép chia cho từng hình.
   - Bảng trượt chân ở trên đo trên code này.
4. **Bớt việc lặp lại mỗi khung** (`units.ts`):
   - hình lính chưa dời chỗ thì không lấy lại độ cao mặt đất;
   - khối có đội hình không đổi thì không tính lại vùng màu dưới khối;
   - lượng giác được đưa ra ngoài vòng lặp của vùng màu.
5. **`unitViews`** (`BattleEngine.ts`): không cấp phát mỗi khung (không `Map`, không mảng hay đối tượng mới); khung bao chỉ tính cho khối đang mở thẻ (`unitViews(boxFor)`); `BattleScene` truyền thẳng các điểm neo cho `layoutLabels`, không chép.

Không đổi `src/lib/battle.ts`, store, dữ liệu, mô hình. Không thêm thư viện.

### Số đo cuối

**Điều kiện:**
- Windows 11, RTX 3050 Laptop (ANGLE D3D11), Chrome không cửa sổ với `--disable-frame-rate-limit --disable-gpu-vsync`, đọc một pixel mỗi khung, 1280×800, khung bên mở, `s-perf.mjs` của T-028 (thêm số khung trên 25 ms và p99 theo đồng hồ thật).
- Ba bản production chạy cùng lúc nhưng đo lần lượt, xen kẽ:
  - bản trước đợt E `2a355b9`, dựng trong worktree tạm, cổng 3121;
  - `main` `ea8e2df`, worktree tạm, cổng 3122;
  - T-031, cổng 3113.

  Dev server của tôi đã tắt trước đó.
- Ba vòng (18:43–19:03), mọi cửa sổ đều sạch: kiểm tra `blender.exe` ngay trước và sau từng cửa sổ, không lần nào có. Hai worktree tạm đã gỡ sau khi đo xong.

Khung hình/giây, ba vòng rồi trung bình; p99 theo dấu thời gian của `requestAnimationFrame` như bảng của task; số khung trên 25 ms:

| Cửa sổ | Trước đợt E | `main` | T-031 |
|---|---|---|---|
| Góc nhìn mở, dừng | 106 / 106 / 97 → **102,8** | 95 / 96 / 90 → **93,5** | 111 / 105 / 104 → **106,7** |
| Phát 1×, giai đoạn 1 | 69,3 / 69,3 / 64,0 → **67,5** | 58,5 / 59,6 / 54,9 → **57,7** | 67,0 / 63,0 / 63,1 → **64,4** |
| p99; khung > 25 ms | 17–19 ms; 0–1 | 34–38 ms; 5–35 | 19–20 ms; 1 |
| Phát 1×, giai đoạn 3 | 68,4 / 69,8 / 64,1 → **67,4** | 60,4 / 56,2 / 55,2 → **57,3** | 69,7 / 65,4 / 64,3 → **66,5** |
| p99; khung > 25 ms | 18 / 18 / 35 ms; 0–6 | 37–40 ms; 8–29 | 18 / 34 / 20 ms; 1–6 |
| Phát 1×, giai đoạn 4 | 68,3 / 69,8 / 64,2 → **67,4** | 60,1 / 55,0 / 54,9 → **56,7** | 68,7 / 64,4 / 64,4 → **65,8** |
| p99; khung > 25 ms | 17 / 17 / 33 ms; 0–5 | 38–41 ms; 12–34 | 19–21 ms; 1–5 |
| Phát 2×, giai đoạn 6 | **100,8** | **89,6** | **100,8** |
| Cuối trận, góc nhìn mở, dừng | **99,1** | **87,8** | **100,0** |
| Cuối trận, nhìn gần vòng vây, dừng | **108,8** | **96,0** | **109,4** |
| Cuối trận, giữa người ngã (120 m), dừng | **106,2** | **94,8** | **104,3** |
| Phát giai đoạn 4, từ 90 m | **75,9** | **67,3** | **72,6** |

- Vòng 3 máy chậm hơn chung (bản trước đợt E cũng tụt xuống 64), nên so trong từng vòng. Trong từng vòng, T-031 chậm hơn bản trước đợt E 2,3 / 6,3 / 0,9 fps ở giai đoạn 1. Ở giai đoạn 3–4 thì từ nhanh hơn 1 fps tới chậm hơn 5 fps.
- p99 theo đồng hồ thật: T-031 18–20 ms, bản trước đợt E 17–21, `main` 20–25.
- Số liệu thô: `perf-round2.txt`, `perf-round34.txt`. `perf-round1.txt` là một vòng đo code giữa chừng (mới có phần JS, chưa có bóng gộp đỉnh): 61 / 65 / 61 fps.

**Phần còn lại tốn ở đâu** (giai đoạn 1, trace mỗi bên một lượt: bản trước đợt E 65,3 fps, T-031 64,6 fps). Mỗi khung, T-031 so với bản trước đợt E:
- WebGL ít hơn 0,35 ms (bóng gộp đỉnh rẻ hơn phần kỵ binh thêm vào);
- raster trên luồng GPU nhiều hơn 0,46 ms (nhãn);
- JS nhiều hơn 0,36 ms (quay người và nhãn);
- các bước dựng trang nhiều hơn 0,15 ms (nhãn).

Tức là phần chậm còn lại chủ yếu là nhãn khối quân, khoảng 0,6 ms mỗi khung. Muốn bớt nữa thì phải đổi cách vẽ nhãn (ví dụ vẽ ngay trong WebGL), mà việc đó đổi hình ảnh và nằm ngoài task này.

### Hình ảnh không đổi

- **`s-same.mjs`:** sáu góc nhìn chụp trên `main` và trên T-031: góc nhìn mở có tên khối, kỵ binh cách 70 / 200 / 600 m, trận đánh từ 90 m, trận đánh có tên khối. Trước khi chụp, đồng hồ hoạt hình và mũi tên được giữ cố định, và nhãn được tắt rồi bật lại để bố cục chỉ phụ thuộc khung hiện tại. So pixel của canvas bằng `same-diff.mjs`:
  - năm góc nhìn trùng từng pixel (lệch tối đa 1 mức màu ở vài pixel);
  - góc nhìn mở lệch 0,077% số pixel. `main` so với chính nó, chạy lần hai, cũng lệch đúng mức đó (0,076%), tức là nhiễu giữa các lượt chạy, không phải do code;
  - vị trí mọi nhãn trùng nhau ở cả sáu góc nhìn.
- **Ảnh:** `E:\World_History_Platform_assets\T-031\shots\same-main-*.png` và `same-t031-*.png` (`2-cavalry-near` là kỵ binh gần camera, `4-cavalry-far` là kỵ binh ở xa). Pixel thô: thư mục `same\`.

### Kiểm tra khác

- Bộ nhớ (`s-memory.mjs`, mở đóng 10 lần): `main` 19,6 MB, T-031 19,6 MB. Cả hai còn 1 context WebGL, 1 canvas, 1 121 node DOM.
- Luồng mở/đóng (`s-open.mjs`), tiếng Anh và tiếng Việt: mọi bước đúng như T-028, kể cả Esc đóng thẻ trước rồi mới đóng khung. Console sạch ở mọi lượt chạy.
- `npm run lint`, `npm run validate`, `npm run build` qua.

### Đề nghị ngoài phạm vi

1. **Lane 1, mô hình:** xuất LOD2 (và LOD1) với ít đường nối UV hơn. Có thể cho LOD2 một atlas nhỏ riêng với UV liền, hoặc màu theo đỉnh thay cho ảnh màu. Hiện đỉnh của LOD2 bị tách gấp khoảng 3,4 lần. Đo thử gộp đỉnh: GPU vẽ một khung ở góc nhìn mở giảm từ 7,4 xuống 4,6 ms (−38%), nhiều hơn toàn bộ phần chậm của đợt E. Cảnh không cần sửa gì thêm khi có file mới.
2. **Phiên chính, `docs/ARCHITECTURE.md`, mục "Cảnh 3D → Hiệu năng":**
   - ghi rằng bóng vẽ từ lưới đã gộp đỉnh (`depthGeometry`), và lưới chỉ để đổ bóng nằm ở `SHADOW_LAYER`;
   - ghi lưu ý khi đo: p99 theo dấu thời gian của `requestAnimationFrame` nhảy lên khoảng 35 ms khi khung vượt khoảng 16,7 ms, nên đọc kèm p99 theo đồng hồ thật.
3. **Có thể làm sau, nếu cần nhanh hơn ở góc nhìn gần:** mức chi tiết đang chọn cho cả khối hình (tối đa 256 hình) theo hình gần camera nhất. Ở góc nhìn cách kỵ binh 120 m, 150 kỵ binh ở LOD0 chiếm 1,1 triệu tam giác. Khối hình nhỏ hơn, hoặc chọn mức theo từng phần của khối, sẽ giảm phần này. Việc này đổi lúc chuyển mức, nên cần ảnh duyệt.
