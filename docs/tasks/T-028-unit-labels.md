# T-028: Tên khối quân trên cảnh, và khối đi xiên

- **Lane:** 3
- **Model đề xuất:** Fable 5.2, effort `high`. Hết hạn mức thì dùng Opus 5.5, effort `xhigh`.
- **Nhánh:** `lane3/T-028-unit-labels` (tạo từ `main` mới nhất)
- **Phạm vi file:** `src/components/battle/`, khoá `battle.*` trong `src/lib/i18n/messages.ts` (cả `en` lẫn `vi`).

## Bối cảnh

Trong lúc bạn hết hạn mức, đã gộp:
- **T-023:** phiên chính làm nốt phần còn lại;
- **T-026:** phiên chính làm thay bạn. Đã có: quay đầu tại chỗ, mức chi tiết theo hình lính gần nhất, vùng màu và mũi tên vẽ trước lính, nhãn địa danh ẩn khi bị che (`engine/occlusion.ts`), cú hạ camera khi mở trận;
- **T-024:** chân trụ khoá trong clip;
- **T-025:** bản đồ bay tới chiến trường trước khi mở trận;
- **clip thứ sáu `jog`:** phiên chính thêm vào hợp đồng và engine. Cảnh chọn đi / chạy chậm / chạy nhanh theo tốc độ.

Đọc mục "Kết quả" của T-026 trước, vì đó là code của bạn mà người khác đã sửa.

Người dùng duyệt việc tiếp theo cho bạn:
1. **Tên khối quân trên cảnh:** người xem hiện chỉ thấy các khối màu đỏ và tím, không biết khối nào là hastati, khối nào là người Gaul hay kỵ binh Numidia. Đây là app học lịch sử, nên cần thấy được tên.
2. **Khối đi xiên:** khi khối quân đi xiên so với hướng mặt, chân trụ trượt nhiều. Lane 1 đo được 32–48% ở pha 5–6.

Trong lúc bạn làm:
- lane 1 làm T-022 (kỵ binh và clip `jog`) trong `art/`;
- lane 2 làm T-027: tải sẵn cảnh trong lúc bay, và chỉnh dữ liệu Cannae, trong đó có rà các khối đi xiên về phía dữ liệu.

## Đọc trước

- `docs/ARCHITECTURE.md`: mục "Cảnh 3D", "Khung xem trận", "Mô hình lính" (nhất là `jog`).
- `docs/tasks/T-026-scene-fixes.md`, mục "Kết quả".
- `docs/tasks/T-024-model-polish.md`, mục "Kết quả", phần 1, đoạn "Ghi chú cho lane 3" (khối đi xiên).
- `src/lib/battle.ts`: `BattleUnit` có `name` (song ngữ) và `men`; `UnitState` có `men`, `action`.

## Yêu cầu

Commit sau mỗi phần việc lớn. Nếu sắp hết hạn mức thì ghi bảng tiến độ vào "Kết quả" rồi commit.

### 1. Tên khối quân

- Mỗi khối còn người đứng có một nhãn: tên khối theo ngôn ngữ đang chọn (`unit.name`), kèm chấm màu phe.
- Nhãn bám theo khối khi khối di chuyển, đặt phía trên hàng lính.
- **Không rối:**
  - nhãn khối quân và nhãn địa danh không đè lên nhau, và cùng tránh các lớp phủ của khung (dùng chung `labelLayout`);
  - khi nhiều khối đứng sát nhau (lúc dàn trận có 22 khối), chỉ hiện những nhãn có chỗ, ưu tiên khối lớn hoặc gần camera. Tự đặt quy tắc, ghi lại;
  - nhìn chữ phải phân biệt được nhãn khối quân với nhãn địa danh.
- Nhãn bị che thì ẩn, theo quy tắc của `occlusion.ts`. Khối của chính nhãn không che nhãn đó.
- Có nút bật/tắt tên khối quân trong khung xem trận, mặc định bật. Ghi nhớ lựa chọn trong `localStorage` (bọc try/catch như mức chất lượng).

### 2. Bấm vào một khối quân

- Bấm (không kéo) vào một khối trên cảnh thì hiện một thẻ nhỏ cạnh khối:
  - tên khối, màu phe;
  - loại lính (`unitTypes`);
  - quân số đầu trận và quân số lúc này (đổi theo thời gian, kể cả khi đang phát);
  - khối đang làm gì (`action` lúc này: đứng, tiến, xung phong, giao chiến, rút, tháo chạy, truy kích; thêm khoá `battle.action.*`).
- Bấm ra chỗ khác, Esc, hoặc nút đóng trên thẻ thì thẻ đóng. Esc đóng thẻ trước, lần Esc sau mới đóng khung xem trận.
- **Bàn phím và trình đọc màn hình:** trong tab "Thông tin trận", thêm danh sách các khối quân của mỗi bên (tên, quân số lúc này). Bấm một dòng thì camera bay tới khối đó và mở thẻ của nó. Như vậy không cần chuột vẫn xem được.
- Ở 390 px, thẻ không được tràn khỏi màn hình.

### 3. Khối đi xiên

- **Hiện tượng:** ở pha 5–6, khối đi xiên so với hướng mặt (ví dụ người Libya bẻ hướng vào sườn quân La Mã), nên chân trụ trượt 32–48% (lane 1 đo bằng `s-planted`). Clip chỉ có đi tới (và đi lùi khi giữ mặt về địch), không có đi ngang.
- **Cần làm:** khi khối đi theo hướng lệch nhiều so với hướng mặt (ví dụ quá 45°) mà không đang đánh, từng hình lính quay dần về hướng đi; khi khối dừng hay bắt đầu đánh thì quay lại hướng của khối.
  - Giữ cách đi lùi hiện có: khối lùi mà vẫn quay mặt về địch thì bước lùi, không quay lưng.
  - Tự đặt ngưỡng và tốc độ quay, ghi lại.
- Đo lại bằng `s-planted.mjs` ở pha 5–6, so trước và sau. Lane 2 có thể đồng thời chỉnh hướng của vài khối trong dữ liệu (T-027); engine phải xử lý được trường hợp chung.

### Kiểm tra chung

- Bản production:
  - trang chính không tải three.js trước khi bấm nút;
  - luồng mở/đóng (`s-open.mjs`) ở hai ngôn ngữ;
  - mở đóng 10 lần không rò (`s-memory.mjs`).
- **Hiệu năng:** đo xen kẽ với `main` trong cùng điều kiện (lane 1 hay chạy Blender), như mục "Kết quả" của T-026. Không được chậm hơn rõ rệt.
- **Ảnh chụp** (ngoài repo), lúc dàn trận và lúc giao chiến:
  - 1280×800, tiếng Anh nền sáng và tiếng Việt nền tối;
  - thẻ của một khối;
  - danh sách khối trong tab "Thông tin trận";
  - 390 px.

## Ràng buộc

- Không sửa store, `src/lib/` (trừ khoá `battle.*`), `src/data/`, `src/app/`. Cần đổi thì ghi đề nghị vào "Kết quả".
- Không import component của lane khác. Không thêm thư viện npm.
- Không sửa `public/battles/models/`.
- Dev server dùng cổng 3103. Dev server cũ của bạn có thể vẫn chạy ở cổng này: tắt trước.

## Xong khi

- Thấy tên các khối quân trên cảnh, không rối, ở cả hai ngôn ngữ; bật/tắt được.
- Bấm vào khối, hoặc chọn trong danh sách, thì thấy thẻ thông tin; quân số đổi theo thời gian.
- Khối đi xiên không còn trượt chân rõ: có số đo trước và sau.
- `npm run lint`, `npm run build`, `npm run validate` qua.

## Kết quả

Xong cả ba phần. Nhánh `lane3/T-028-unit-labels`, các commit "T-028 step …" và hai commit nhỏ.

**Tóm tắt:**
- Mỗi khối còn người đứng có nhãn tên trên cảnh. Nhãn khối quân và nhãn địa danh dùng chung `labelLayout`, không đè nhau, không đè lớp phủ. Khối nhỏ hoặc ở xa nhường chỗ cho khối lớn hoặc ở gần. Có nút "Tên khối quân" để bật/tắt, lựa chọn được ghi nhớ.
- Bấm vào một khối (hoặc vào tên của nó) thì hiện thẻ cạnh khối: tên, phe, loại lính, quân số đầu trận và lúc này, đang làm gì. Thẻ đổi theo thời gian, kể cả khi đang phát. Tab "Thông tin trận" có danh sách khối quân của mỗi bên; chọn một dòng thì camera bay tới khối và focus vào thẻ.
- Khối đi xiên: từng hình lính quay dần về hướng đi. Người Libya bẻ hướng ở pha 5 trượt chân từ 81–87% xuống 0%. Các hàng đang chờ của khối đang đánh được quay tối đa 45° (xem mục 3, đây là chỗ tôi tự quyết, khác câu chữ của task).

`npm run lint`, `npm run build`, `npm run validate` qua.

### 1. Tên khối quân (`BattleScene.tsx`, `labelLayout.ts`, `engine/BattleEngine.ts`)

- **Hình thức:** viên thuốc tối, chữ sáng, đậm, cỡ 11 px, có chấm màu phe viền sáng. Ở nền tối thì ngược lại: viên sáng, chữ tối. Tên dài quá 240 px thì cắt bằng "…" (ví dụ "Gauls, centre of the crescent (Hannib…"); tên đầy đủ có trong thẻ và danh sách.
  - Nhãn địa danh giữ như cũ: hộp sáng (tối ở nền tối), chữ thường; địa danh có chấm neo trên mặt đất, sông chữ nghiêng.
  - Khác nhau ở màu nền (đảo ngược), hình (viên tròn hai đầu so với hộp góc vuông), độ đậm và chấm màu phe, nên nhìn là phân biệt được ở cả hai chế độ (ảnh `c-3-fight-en.png` nền sáng, `b-3-fight-vi.png` nền tối).
- **Vị trí:**
  - Điểm neo cao hơn đầu hình lính 10%, ở giữa mặt trận của khối. Lấy điểm cao hơn trên màn hình trong hai điểm ở hàng đầu và hàng cuối, để nhãn đứng trên cả khối. Nhãn đặt ngay trên điểm neo.
  - Nếu điểm giữa ra ngoài màn hình hay bị che thì thử điểm ở 30% về phía đầu trái, rồi đầu phải (`UNIT_LABEL_SHARES`).
  - Tính lại mỗi khung hình nên nhãn bám theo khối khi khối di chuyển.
- **Quy tắc khi chật** (ghi ở đầu `BattleScene.tsx`):
  - Thứ tự giành chỗ: thị trấn và sông trước (để định hướng), rồi tên khối quân, rồi trại, đồi, chỗ vượt sông.
  - Giữa các khối: khối trông lớn nhất trên màn hình trước. Độ lớn là căn bậc hai của (bề ngang × chiều sâu), chia cho khoảng cách tới camera. Cách này ưu tiên cả khối lớn lẫn khối gần.
  - Nhãn đã hiện ở khung trước được tính lớn gấp 1,6 lần, để hai nhãn cỡ ngang nhau không thay nhau nhấp nháy khi camera di chuyển. `labelLayout` cũng thử chỗ cũ trước như với nhãn địa danh.
  - Mỗi nhãn khối giữ thêm 3 px trống xung quanh để các tên không dính vào nhau. Nhãn không có chỗ thì ẩn.
  - Khối đang mở thẻ thì không hiện nhãn (thẻ đã ghi tên). Thẻ là vật cản của bố cục nhãn, nên không nhãn nào nằm dưới thẻ.
- **Bị che:** dùng `hidden()` của `occlusion.ts` với điểm ở giữa khối, cao hơn đầu 10%. Hộp của chính khối được bỏ qua (tham số mới `own`), nên khối không tự che nhãn của mình. Đồi và các khối khác vẫn che. Nhãn địa danh giữ quy tắc 15 m như cũ.
- **Nút bật/tắt:** "Tên khối quân" / "Unit names", nằm trên nút chất lượng, có `aria-pressed`, mặc định bật. Lựa chọn ghi vào `localStorage` khoá `whp.battleUnitNames` (`on`/`off`), bọc try/catch như mức chất lượng.
- **Đo được** (1280×800, khung bên mở, kiểm bằng hộp bao của từng nhãn: không cặp nào chạm nhau, không nhãn nào chạm lớp phủ hay thẻ, không nhãn nào ra ngoài cảnh):

  | Lúc | Tiếng Anh | Tiếng Việt |
  |---|---|---|
  | Góc nhìn mở | 6 khối, 2 địa danh | 8 khối, 1 địa danh |
  | Dàn trận xong (t = 1) | 12 khối, 5 địa danh | 9 khối, 5 địa danh |
  | Giao chiến (t = 3,5) | 12 khối, 4 địa danh | 12 khối, 4 địa danh |

  Tiếng Việt có tên dài hơn nên đôi khi ít nhãn hơn.

### 2. Thẻ của một khối quân

- **Bấm:** bấm (nhấn và nhả, xê dịch dưới 5 px) lên cảnh thì chọn khối dưới con trỏ; kéo thì vẫn là di chuyển camera như cũ.
  - Cách tìm khối (`engine.pickUnit`, `occlusion.pick`): tia từ camera qua điểm bấm, gặp hộp của khối nào trước thì chọn khối đó. Hộp cao tới đỉnh đầu và nới thêm 6 px theo khoảng cách (ít nhất 4 m), để khối ở xa chỉ cao vài pixel vẫn bấm trúng. Khối sau đồi không bấm được.
  - Bấm lên tên khối cũng chọn khối đó.
  - Rê chuột lên một khối thì con trỏ thành bàn tay, để người xem biết bấm được.
- **Thẻ:** tên khối, chấm màu phe, tên phe, loại lính (`unitTypes`), quân số đầu trận, quân số lúc này, đang làm gì (khoá mới `battle.action.*`: đứng yên, tiến lên, xung phong, giao chiến, rút lui, tháo chạy, truy kích).
  - Quân số lúc này nội suy giữa các mốc như cảnh (`unitState.ts`, cùng quy tắc với `timeline.ts`), làm tròn tới hàng chục.
  - Thẻ đọc `battleTime` từ store nên đổi theo thời gian. Ví dụ hastati: 10 600 lúc t = 3,5, phát 2,5 giây thì còn 10 430.
- **Chỗ đặt** (`placeCard`): bên phải hộp của khối trên màn hình, không được thì bên trái, phía trên, phía dưới. Thẻ phải nằm trong cảnh và không đè lớp phủ. Không chỗ nào đủ (khối chiếm gần hết khung) thì đặt cạnh giữa khối và đẩy vào trong cảnh. Thẻ đi theo khối mỗi khung hình.
- **Đóng:**
  - bấm lên chỗ trống của cảnh, bấm nút đóng trên thẻ, hoặc Esc;
  - bấm khối khác thì chuyển sang thẻ của khối đó;
  - Esc đóng thẻ trước: cảnh bắt phím Esc ở pha capture rồi `preventDefault`, nên `<dialog>` không đóng. Lần Esc sau mới đóng khung xem trận. Đã thử bằng phím thật (CDP).
- **Bàn phím và trình đọc màn hình:**
  - Trong tab "Thông tin trận", mỗi bên có danh sách "Các khối quân": tên và quân số lúc này, mỗi dòng là một nút. Danh sách đầu có dòng gợi ý "Chọn một khối để xem trên chiến trường".
  - Chọn một dòng thì camera bay tới khối trong 1,2 giây (giữ hướng nhìn, đủ xa để thấy cả khối, ít nhất 150 m; nhảy thẳng nếu bật giảm chuyển động; người dùng kéo thì dừng), thẻ mở và nhận focus.
  - Thẻ là `<section>` có tên theo khối. Esc hay nút đóng trên thẻ thì focus về lại dòng đã mở.
  - Dòng đang mở thẻ có `aria-current`.
  - Nhãn trên cảnh có `aria-hidden`, vì danh sách đã nêu tên cho mọi người.
- **Ở 390 px:** thẻ rộng tối đa bằng cảnh trừ 16 px, luôn nằm trong cảnh; trang không cuộn ngang (`scrollWidth` 390).
- **`/battle-lab`:** không truyền `onSelectUnit` thì cảnh tự giữ khối đang chọn, nên bấm khối và Esc vẫn chạy ở trang thử.

### 3. Khối đi xiên (`engine/units.ts`)

**Cách làm.** Mỗi hình lính tự quyết hướng quay của mình:
- Lấy vận tốc của chính hình lính trên mặt đất, làm mượt trong 0,25 s, rồi đo góc giữa hướng đi và hướng mặt mà đội hình cho nó. Nhờ vậy hai đầu của một khối đang bẻ hướng quay mỗi đầu một khác.
- **Ngưỡng:** lệch dưới 35° thì giữ hướng khối; từ 55° trở lên thì quay hẳn về hướng đi; từ 35° tới 55° thì quay một phần (đường cong mượt). Ở giữa khoảng đó là mốc 45° task gợi ý, và lính không giật khi góc đi qua ngưỡng.
- **Đi lùi giữ như cũ:** đi về phía sau nhiều hơn về phía trước thì vẫn bước lùi, mặt hướng về địch. Lính chỉ xoay đủ để bước thẳng về sau: lệch 120° thì xoay 60°, không xoay 120°. Chuyển giữa đi tới và đi lùi ở 90° ± 12°, nên lính đi ngang hẳn không lật qua lật lại.
- **Tốc độ quay:** tối đa 3 rad/s theo thời gian thật (khoảng một phần tư vòng trong nửa giây, như người quay), dù phát nhanh hay chậm.
- **Quay về hướng khối** khi: khối dừng (vận tốc của hình lính tụt dưới 0,36 m/s), hình lính đang đánh (các hàng đầu của khối đang giao chiến), đang quay đầu tại chỗ (T-026, `turningAbout` mới trong `timeline.ts`), hoặc sau khi tua (đặt lại ngay, không có cú quay).
- **Lúc tạm dừng,** lính giữ nguyên hướng đang quay: dừng là giữ khoảnh khắc như nó đang là.
- **Bước chân** tính theo hướng thật của thân, nên lính đã quay về hướng đi thì bước tới, không bước lùi.

**Chỗ tôi tự quyết, khác câu chữ của task:**
- Task ghi "mà không đang đánh … bắt đầu đánh thì quay lại hướng của khối". Đo trước khi sửa thì chỗ trượt nặng nhất ở pha 5–6 lại là các khối **đang đánh**: hastati, principes, bộ binh đồng minh, người Gaul (34–136%, xem bảng). Trong khối đang đánh, các hàng sau đi theo khối bằng `walk`.
- Vì vậy: các hàng đang đánh (hàng đầu) giữ hướng khối đúng như task. Các hàng đang chờ lượt được quay tối đa 45° về hướng đi (`WAITING_TURN`).
- Ảnh chụp gần một khối principes đang đánh, có và không có quay 45° (`waiting45-principes.png`, `waiting0-principes.png`), đều trông tự nhiên. Hàng sau không trông như bỏ đi, vì chỉ lệch tối đa 45° so với hướng về địch.
- Muốn giữ đúng câu chữ của task thì đặt `WAITING_TURN = 0`; bảng dưới có số đo của cả hai.

**Số đo** (`s-planted` của T-023, mở rộng: đo cả trượt ngang và góc giữa hướng mặt với hướng đi; mỗi dòng theo một hình lính trong 300 khung hình, bắt đầu 1,2 giây sau khi phát từ thời điểm ghi trong bảng). "Trượt dọc" là số lane 1 đo: chân trụ trượt theo hướng đi, tính theo quãng đường của hình lính. "Trượt ngang" là phần trượt vuông góc với hướng đi.

| Khối, lúc | Đang | Trước: lệch / dọc / ngang | Sau, đúng câu chữ task | Sau, bản giao (hàng chờ 45°) |
|---|---|---|---|---|
| Libya trái, t = 4,05 | xung phong, bẻ hướng | 79° / 81% / 98% | 0° / −0,5% / 0,2% | 0° / −0,1% / 0,2% |
| Libya phải, t = 4,05 | xung phong, bẻ hướng | 83° / 87% / 100% | 0° / 0% / 0,1% | 0° / −0,5% / 0,1% |
| Libya trái, t = 4,4 | xung phong | 50° / 37% / 76% | 3° / 0,3% / 5% | 4° / 1,1% / 8% |
| Velites, t = 4,2 | tiến | 47° / 31% / 73% | 18° / 5% / 31% | 18° / 4% / 31% |
| Bộ binh nhẹ đồng minh, t = 4,2 | tiến | 25° / 10% / 42% | không đổi (dưới ngưỡng) | không đổi |
| Hastati, t = 4,2 | đánh | 49° / 34% / 75% | không đổi | 11° / 1,4% / 19% |
| Principes, t = 4,2 | đánh | 111° / 136% / 94% | không đổi | bước lùi / 8,5% / 41% |
| Hastati, t = 5,2 | đánh | 62° / 54% / 89% | không đổi | 17° / chưa ghi / 30% |
| Bộ binh đồng minh hàng trước, t = 4,2 | đánh | 108° / 130% / 95% | không đổi | bước lùi / 11% / 46% |
| Gaul trái, t = 4,2 | đánh | 102° / 121% / 98% | không đổi | bước lùi / 16% / 54% |

- "Bước lùi": khối dạt về phía sau, hình lính bước lùi mặt vẫn hướng về địch (lệch khoảng 150° so với hướng đi).
- Phần trượt ngang còn lại ở velites và bộ binh nhẹ là do ngưỡng: lệch 25° thì chưa quay, lệch 45° thì quay một nửa. Hạ `TURN_FROM` xuống 20° thì hết, nhưng khi đó cả những khối chỉ dạt nhẹ cũng quay người.
- Bảng "sau" đo trước hai sửa nhỏ ở commit step 3 (quyết định quay theo vận tốc của từng hình lính thay vì dáng đi của khối; chờ quay đầu xong). Hai sửa này không đổi gì giữa lúc khối đang đi, nhưng tôi chưa đo lại được (xem "Còn dở").
- Ảnh: `waiting45-libyans-left.png` (người Libya giữa lúc bẻ hướng, hai đầu khối quay mỗi đầu một khác), `waiting45-principes.png`, `waiting0-principes.png`.

### Kiểm tra chung

Bản production (`next build` rồi `next start` ở cổng 3113), Chrome không cửa sổ, RTX 3050. Bản `main` để so là bản xem thử ở cổng 3000 của phiên chính, dựng từ commit `40de41e` (đúng gốc của nhánh này; các commit sau đó trên `main` chỉ đổi tài liệu).

- **Không tải three.js trước khi bấm nút:** trước khi bấm có 19 request, 10 script, không script nào chứa `WebGLRenderer`, không request dữ liệu trận. Sau khi mở trận: thêm một chunk có three.js, địa hình và 8 mô hình.
- **Luồng mở/đóng** (`s-open.mjs`), tiếng Anh và tiếng Việt: mọi mục đúng như T-023/T-026.
  - Ở lượt tiếng Việt, cú bấm vào giữa cảnh trong kịch bản trúng khối "Bộ binh nhẹ đồng minh" và mở thẻ của nó. Esc thứ nhất đóng thẻ, Esc thứ hai đóng khung xem trận, focus về nút xem trận. Tôi thêm vào kịch bản một bước cho trường hợp này.
- **Bộ nhớ** (`s-memory.mjs`), mở đóng 10 lần, so với `main` cùng lúc:

  | | Trước khi mở | Sau lần 1 | Sau lần 5 | Sau lần 10 |
  |---|---|---|---|---|
  | `main` | 12,7 MB | 17,9 | 18,9 | 19,5 |
  | T-028 | 12,8 MB | 18,0 | 19,1 | 19,7 |

  Cả hai chỉ còn 1 context WebGL, 1 canvas; số node DOM không đổi (1 121).
- **Hiệu năng** (`s-perf.mjs`, khung bên mở, đọc một pixel mỗi khung hình): đo xen kẽ `main` và T-028. Lúc bắt đầu máy sạch; Blender của lane 1 bật lên giữa vòng 1. Ở vòng 3, khi tới lượt T-028, hệ thống dừng lượt đo vì máy thiếu RAM (cùng lúc dừng cả dev server và server production của tôi). Chỉ so các cửa sổ đo sạch (không có Blender trước và sau cửa sổ), khung hình/giây:

  | Cửa sổ | `main` (các lượt sạch) | T-028 (lượt sạch duy nhất) |
  |---|---|---|
  | Góc nhìn mở, dừng | 89, 94 | 93 |
  | Đang phát giai đoạn 1, 1× | 60, 60 | 54 |
  | Đang phát giai đoạn 3, 1× | 60, 61 | 57 |
  | Đang phát giai đoạn 4, 1× | 66, 58, 62 | 56 |
  | Đang phát giai đoạn 6, 2× | 79, 92 | 89 |
  | Cuối trận, góc nhìn mở, dừng | 89, 92, 90 | 88 |
  | Cuối trận, nhìn gần vòng vây, dừng | 106, 84, 96 | 93 |
  | Đang phát giai đoạn 4, từ 90 m | 54 | 58 |

  - Lúc dừng và lúc phát 2× thì như `main`.
  - Lúc phát 1×, lượt sạch của T-028 thấp hơn 5–10% ở giai đoạn 1 và 3. Ở giai đoạn 4 thì nằm trong khoảng dao động của `main` (58–66).
  - Chỉ có một lượt sạch nên **chưa kết luận được**. Nếu chậm thật thì nhiều khả năng do phần quay người (một `atan2` cho mỗi hình lính đang đi, mỗi khung hình) hay việc đặt 20 nhãn mỗi khung hình. Cần đo lại, xem "Còn dở".
- **Ảnh chụp** (ngoài repo, `E:\World_History_Platform_assets\T-028\shots\`):
  - 1280×800, tiếng Anh nền sáng: `c-1-open-en.png`, `c-2-deployed-en.png` (dàn trận), `c-3-fight-en.png` (giao chiến), `c-4-card-en.png` (thẻ), `c-5-list-en.png` (danh sách), `c-6-from-list-en.png` (chọn từ danh sách);
  - 1280×800, tiếng Việt nền tối: `b-1` tới `b-6`, cùng thứ tự;
  - 390 px: `m-1-scene-en.png`, `m-2-card-hastati-en.png`, `m-3-list-en.png`, `m-4-from-list-en.png`;
  - kịch bản đo và chụp: `E:\World_History_Platform_assets\T-028\tools\` (`s-units.mjs`, `s-oblique.mjs`, `s-planted.mjs`, `s-mobile.mjs`, `s-three.mjs`, `s-fightlook.mjs`, `s-hidden.mjs`, `perf-ab.sh`).

### Còn dở

Lúc 12:33, hệ thống dừng dev server (3103), server production (3113) và lượt đo hiệu năng vì máy thiếu RAM (Blender của lane 1 đang dùng 1,2 GB). Theo quy tắc, tôi không tự chạy lại. Còn ba việc cần server:
1. Đo lại hiệu năng xen kẽ với `main`, ít nhất ba lượt sạch cho mỗi bên. Nếu lúc phát 1× vẫn chậm hơn rõ, đo xem phần nào tốn và giảm.
2. Đo lại trượt chân với code cuối (sau commit step 3).
3. Kiểm tra `/battle-lab`: bấm khối, Esc đóng thẻ (cảnh tự giữ khối đang chọn); kiểm tra nhãn bị khối khác che khi camera thấp (`s-hidden.mjs`, đã viết, chưa chạy).

### Đề nghị ngoài phạm vi

1. **`docs/ARCHITECTURE.md`** (phiên chính):
   - mục "Cảnh 3D": nhãn khối quân (thứ tự giành chỗ, bị che theo `occlusion.ts`, khối không tự che nhãn của mình); bấm khối mở thẻ; quy tắc đi xiên (ngưỡng 35–55°, quay 3 rad/s, hàng đang chờ trong khối đang đánh quay tối đa 45°);
   - mục "Khung xem trận": nút "Tên khối quân" (`localStorage` khoá `whp.battleUnitNames`), Esc đóng thẻ trước rồi mới đóng khung, danh sách khối quân trong tab "Thông tin trận".
2. **Props mới của `BattleScene`** nằm ngoài `BattleSceneProps` của hợp đồng, như `introFromAbove`: `selectedUnit`, `onSelectUnit`, `unitFocusRequest`. Không truyền thì cảnh tự giữ khối đang chọn (trang thử). Phiên chính có thể đưa vào hợp đồng nếu muốn.
3. **Quyết định cần người dùng duyệt:** hàng đang chờ của khối đang đánh quay tối đa 45° (mục 3). Muốn đúng câu chữ task thì đặt `WAITING_TURN = 0` trong `engine/units.ts`.
4. Không cần đổi store, `src/lib/battle.ts`, `src/data/`. Khoá i18n mới: `battle.scene.unitNames`, `battle.info.units`, `battle.info.units.hint`, `battle.card.*`, `battle.action.*`; sửa `battle.scene.hint` (thêm "bấm vào một khối quân để xem thông tin").
