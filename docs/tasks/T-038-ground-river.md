# T-038: Phong cảnh, chặng 1 (mặt đất, sông, vùng xa và biển)

- **Ai làm:** phiên chính (người dùng chọn 2026-11-18: phiên chính làm chặng 0 và 1 của đợt H; chặng 1 bắt đầu ngay sau khi gộp chặng 0).
- **Model:** Fable 5.2.
- **Nhánh:** `batch-h/stage1-ground-river` (tạo từ `main` ở `c3474ab`). Không commit thẳng vào `main`.
- **Trạng thái:** xong, chờ người dùng xem trong cảnh thật và duyệt gộp. Chưa có lane đọc lại.
- **Phạm vi file:** `src/components/battle/engine/`, `src/lib/battle.ts`, `src/data/battles/`, `public/data/terrain/`, `scripts/battles/`, `src/components/map/battlePrefetch.ts`, `src/lib/i18n/messages.ts`, `src/components/shell/AboutDialog.tsx`, `README.md`, `docs/`.
- **Kế hoạch chung:** `docs/PLAN.md`, mục "Đợt H".

File này vừa là đề bài vừa là nhật ký: phiên nào làm tiếp thì đọc mục "Kết quả" ở cuối trước.

## Vấn đề

Ảnh mốc trước khi làm (`main-tools/shots/h1-before-*.png`, chụp bằng `main-tools/drive/s-scenery.mjs`):

- Mặt đất là những mảng màu nhoè, nhìn gần hay nhìn xa đều như nhau; không có gì cho thấy đây là đồng ruộng.
- Sông là một dải xanh phẳng một màu, mép thẳng.
- Chân trời là một đường thẳng: ngoài vùng lưới độ cao, mặt đất kéo phẳng ra 40 km.

## Xong khi

- Hạ camera sát đất không còn thấy mảng màu trơn: thấy hàng rạ, luống cày, bụi cỏ.
- Nhìn từ trên cao thấy đồng bằng là ruộng và đồng cỏ.
- Sông có nước cạn, bãi sỏi, bờ; nước phản chiếu trời.
- Chân trời có đồi núi và biển thật thay cho nền phẳng.
- Cảnh đọc `terrain.scenery` (lớp phủ mặt đất) và `level`, `banks` của sông. Trận không có `scenery` vẫn vẽ được.
- Tốc độ khung hình vẫn trên mục tiêu 50 khi phát 1× (đo xen kẽ với `main`).
- Hộp thoại Giới thiệu có câu về phong cảnh (câu chữ do người dùng duyệt: đã duyệt 2026-11-18).
- `npm run lint`, `npm run validate`, `npm run build` qua; hồi quy lõi qua.

## Kết quả

Làm 2026-11-18. Ba commit trên nhánh: mặt đất và sông; vùng xa và biển; câu Giới thiệu và tài liệu.

### Đã làm

**Mặt đất (`engine/terrain.ts`).**

- Cảnh đọc `scenery.ground.cover`: mỗi lớp phủ có ba màu (chính, vùng xanh hơn, đất trống) và có bật ô ruộng hay không (`COVERS`). Trận không có `scenery` vẽ như trước đợt H (`PLAIN_COVER`).
- Với `stubble`, phần đất bằng (dốc dưới khoảng 5–12%) và cách sông trên 45–130 m là ruộng: các thửa dài 280 × 140 m xếp so le, một nửa số thửa chia đôi, mép thửa uốn bằng nhiễu. Mỗi thửa là ruộng đã gặt (66%), đất bỏ hoá (24%) hoặc đất mới cày (10%), có sắc độ riêng. Giữa các thửa là bờ cỏ 2,5 m; ở xa, khi bờ mảnh hơn một điểm ảnh, nó được vẽ rộng một điểm ảnh và nhạt đi tương ứng.
- Không phải chỗ nào cũng là ruộng: nhiễu tần số thấp chừa lại những khoảng đồng cỏ.
- Nhìn gần thấy từng hàng: hàng rạ cách nhau 1,15 m, luống cày 1,9 m, chạy dọc hoặc ngang thửa. Hàng hiện dần khi đủ gần để không răng cưa (`fwidth`).
- Độ gồ ghề nhỏ (hàng rạ, cục đất, bụi cỏ) bẻ pháp tuyến trong 30–190 m gần camera, nên luống bắt nắng theo giờ.
- Dải xanh ven sông hẹp và nhạt hơn trước (150 m thay cho 400 m).

**Sông (`engine/river.ts`, file mới).**

- Một dải phủ cả lòng sông lẫn dải cây hai bờ, vẽ bằng shader từ giữa ra: nước, bãi sỏi, bờ.
- `level.stage: low`: lòng sông rộng gần gấp đôi bề rộng nước; dòng nước hẹp, uốn qua lại trong lòng, để lộ bãi sỏi; bãi sỏi sẫm lại ở mép nước và có cỏ dại ở chỗ xa nước. Không có `level` hoặc `full`: nước đầy lòng.
- Ở các địa danh loại `ford` (cách sông không quá 150 m): nước trải rộng gần hết lòng sông và nông, thấy đáy sỏi, gợn nhiều hơn.
- `banks`: dải lau sậy hai bờ rộng `width` mét, mép ngoài mờ dần vào mặt đất trong 8 m. Đây mới là màu vẽ trên mặt đất; cây và lau sậy có hình là việc của chặng thực vật.
- Nước phản chiếu màu trời theo góc nhìn và có vệt nắng; gợn chạy xuôi dòng. `Sky` thêm `lightDirection`; `Terrain.update(seconds, sky)` gọi mỗi khung.
- Sông dừng ở bờ biển.

**Vùng xa (`terrain.far`).**

- Hợp đồng: `BattleFarTerrain` và `BattleTerrain.far` trong `src/lib/battle.ts`.
- Dữ liệu: `public/data/terrain/battle-of-cannae-far.bin` (147 KB): 271 × 271 điểm cách nhau 400 m, 54 km mỗi phía, từ bốn ô Copernicus GLO-30. `scripts/battles/build-terrain.mjs` ghi cả hai lưới; lưới chính không đổi một byte.
- Cảnh: `Terrain.buildFar` vẽ vùng xa bằng chính vật liệu của mặt đất gần, khoét lỗ cho lưới chính; vòng đỉnh ngoài của mặt đất gần nằm trên mép lỗ. Đỉnh vùng xa hạ theo độ cong trái đất. Đồi cao được phủ màu rừng, sườn dốc màu đá.
- Bản đồ tải sẵn file này cùng lúc với lưới chính (`battlePrefetch.ts`).

**Biển.**

- Đất có độ cao từ 0 trở xuống là biển, ở cả hai lưới; viền một dải cát; mặt nạ biển của lưới chính được làm mờ hai lượt để đường bờ tròn lại.
- **Phát hiện:** 14,1% lưới chính của Cannae (góc đông bắc) là biển trong dữ liệu ngày nay. Trước giờ cảnh vẽ nó thành đất, và tài liệu ghi nhầm là "đồng bằng ven biển". Bờ biển cách chỗ hai đạo quân dàn trận khoảng 2–3 km.
- Hai khối kỵ binh kết thúc trận ở đúng chỗ là biển: `allied-cavalry` và `numidians` ở mốc cuối giai đoạn 6 dời vào bờ (chạy dọc bờ về tây bắc thay vì thẳng về đông bắc). Bảng toạ độ ở `docs/data/battles/cannae.md`, mục 13.
- `uncertainty` của file trận nói thêm: bờ biển, như dòng sông, vẽ ở vị trí ngày nay.

**Kiểm tra dữ liệu (`validate-battles.mjs`).** `terrain.far` (kích thước, file, vượt ra ngoài lưới chính ít nhất hai ô); không khối quân nào có quá 10% diện tích nằm trên biển ở bất kỳ mốc nào; không địa danh hay công trình nào nằm trên biển.

**Hộp thoại Giới thiệu.** Thêm dòng `about.accuracy.battle.scenery` (hai ngôn ngữ) sau dòng về đánh theo từng đợt: cảnh vật có phần theo tư liệu, có phần minh hoạ; đồi núi, sông, bờ biển theo dữ liệu độ cao ngày nay; các thửa ruộng không phải ghi chép về ruộng thật. Người dùng đã duyệt câu chữ (2026-11-18). Khi chặng 2 và 3 thêm cây và nhà minh hoạ, câu này phải nói thêm chúng trái với lời Polybius.

**Tài liệu.** `docs/ARCHITECTURE.md` (mục "Phong cảnh": vùng xa, biển, mặt đất và sông trong cảnh), `docs/data/battles/cannae.md` (mục 13, sửa mục 7), `docs/PLAN.md`, `README.md` (dòng ghi công địa hình).

### Đã kiểm tra

- `npm run lint`, `npx tsc --noEmit`, `npm run validate`: qua.
- Phép kiểm tra biển: đặt thử một khối quân, một địa danh và một công trình xuống biển, cả ba bị bắt; file được trả lại nguyên vẹn.
- `check-overlap.mjs --min 0.04`: số dòng như `main` (45). `check-facing.mjs`: thêm một dòng (`allied-cavalry` giai đoạn 6, lệch 32° vì vừa chạy vừa đổi hướng).
- Xem bằng ảnh chụp trên `next dev` (cổng 3105), RTX 3050: toàn cảnh, tầm trung, sát đất, sông, chỗ lội, cửa sông, bờ biển lúc cuối trận, bốn hướng chân trời, chỗ nối hai lưới. Ảnh ở `E:\World_History_Platform_assets\main-tools\shots\`: `h1-before-*` (trước), `h1-c-*`, `h1-d-*`, `h1-f-*` (sau).
- Hiệu năng: đo xen kẽ ba vòng giữa hai bản production (`main` ở `c3474ab` và nhánh ở `18fa583`), `main-tools/drive/s-perf3.mjs`, không có Blender chạy:

  | | Đứng yên lúc mở | Phát giai đoạn 3 | Phát giai đoạn 4 |
  |---|---|---|---|
  | `main` | 94,0 / 97,6 / 106,3 | 65,7 / 56,4 / 65,0 | 63,7 / 56,6 / 63,8 |
  | nhánh | 96,1 / 87,7 / 101,7 | 50,5 / 57,9 / 66,7 | 54,9 / 64,5 / 57,3 |

  Trung bình nhánh thấp hơn 4–6%, nhỏ hơn dao động giữa các lượt (10–20%). Mọi lượt đều từ 50 trở lên; lượt thấp nhất của nhánh là 50,5, sát mục tiêu. Số tam giác tăng khoảng 173 nghìn (dải sông và vùng xa).
- `npm run build` (worktree tạm): qua ở commit `18fa583` (trước câu Giới thiệu) và ở commit `0ce9342` (có câu Giới thiệu và tài liệu). Hồi quy lõi (`main-tools/reg-core.js`) trên cả hai bản production: 17/17, console sạch.

### Chưa làm, hoặc chưa ưng

- **Chưa xem ban đêm và lúc hoàng hôn**: nước và biển lấy màu trời theo giờ, nhưng mới xem ở 9:45 và 17:00.
- **Chưa xem ở mức chất lượng thấp** (`Quality: Low`) và chưa đo trên máy yếu. Shader mặt đất nặng hơn trước (thêm khoảng mười lần lấy nhiễu mỗi điểm ảnh).
- Bờ biển, vũng nước sau bờ và dải cát đều suy từ lưới 30 m: nhìn sát sẽ thấy mềm và thiếu chi tiết (không có sóng vỗ bờ).
- Mặt biển một màu, không có sóng.
- Chỗ sông đổ ra biển còn hơi bậc thang.
- Một vệt tối nhỏ trên mặt đất gần sông (điểm khoảng −1340, −300, nhìn sát đất) có từ trước, là nếp gấp của lưới độ cao; rõ hơn một chút sau khi có độ gồ ghề.
- `scenery.areas` chưa được vẽ (Cannae để trống); gió và bụi chưa dùng.
- Các thửa ruộng kiểu ô chữ nhật là hình dung của phiên chính về đồng ruộng, không dựa vào nghiên cứu nào về cách chia ruộng ở Apulia thế kỷ 3 TCN.
- Phép kiểm tra biển chỉ xét các mốc, không xét đường đi giữa hai mốc.
