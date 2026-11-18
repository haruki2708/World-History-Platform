# T-038: Phong cảnh, chặng 1 (mặt đất và sông)

- **Ai làm:** phiên chính (người dùng chọn 2026-11-18: phiên chính làm chặng 0 và 1 của đợt H; chặng 1 bắt đầu ngay sau khi gộp chặng 0).
- **Model:** Fable 5.2.
- **Nhánh:** `batch-h/stage1-ground-river` (tạo từ `main` ở `c3474ab`). Không commit thẳng vào `main`; commit sau mỗi phần lớn.
- **Trạng thái:** đang làm.
- **Phạm vi file:** `src/components/battle/engine/`, `src/lib/battle.ts`, `src/data/battles/`, `public/data/terrain/`, `scripts/battles/`, `src/lib/i18n/messages.ts`, `src/components/shell/AboutDialog.tsx`, `docs/`.
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
- Hộp thoại Giới thiệu có câu về phong cảnh (câu chữ do người dùng duyệt).
- `npm run lint`, `npm run validate`, `npm run build` qua; hồi quy lõi qua.

## Kết quả

Đang làm, 2026-11-18.

### Phần 1: mặt đất và sông (xong)

**Mặt đất (`engine/terrain.ts`).**

- Cảnh đọc `scenery.ground.cover`: mỗi lớp phủ có ba màu (chính, vùng xanh hơn, đất trống) và có bật ô ruộng hay không (`COVERS`). Trận không có `scenery` vẽ như trước đợt H (`PLAIN_COVER`).
- Với `stubble`, phần đất bằng (dốc dưới khoảng 5–12%) và cách sông trên 45–130 m là ruộng: các thửa dài 280 × 140 m xếp so le, một nửa số thửa chia đôi, mép thửa uốn nhẹ bằng nhiễu. Mỗi thửa là ruộng đã gặt (66%), đất bỏ hoá (24%) hoặc đất mới cày (10%), có sắc độ riêng. Giữa các thửa là bờ cỏ 2,5 m; ở xa bờ mảnh hơn một điểm ảnh thì vẽ rộng một điểm ảnh và nhạt đi tương ứng.
- Không phải chỗ nào cũng là ruộng: nhiễu tần số thấp chừa lại những khoảng đồng cỏ.
- Nhìn gần thấy từng hàng: hàng rạ cách nhau 1,15 m, luống cày 1,9 m, chạy dọc hoặc ngang thửa. Hàng hiện dần khi đủ gần để không răng cưa (`fwidth`).
- Độ gồ ghề nhỏ (hàng rạ, cục đất, bụi cỏ) bẻ pháp tuyến trong 30–190 m gần camera, nên luống bắt nắng và đổ bóng theo giờ.
- Dải xanh ven sông hẹp và nhạt hơn trước (150 m thay cho 400 m).
- Thuộc tính mới của lưới mặt đất: `aLie` (độ dốc, khoảng cách tới mép nước của sông gần nhất).

**Sông (`engine/river.ts`, file mới).**

- Một dải phủ cả lòng sông lẫn dải cây hai bờ, vẽ bằng shader từ giữa ra: nước, bãi sỏi, bờ.
- `level.stage: low`: lòng sông rộng gần gấp đôi bề rộng nước; dòng nước hẹp, uốn qua lại trong lòng, để lộ bãi sỏi; bãi sỏi sẫm lại ở mép nước và có cỏ dại ở chỗ xa nước. Không có `level` hoặc `full`: nước đầy lòng.
- Ở các địa danh loại `ford` (cách sông không quá 150 m): nước trải rộng gần hết lòng sông và nông, thấy đáy sỏi, gợn nhiều hơn.
- `banks`: dải lau sậy hai bờ rộng `width` mét, mép ngoài mờ dần vào mặt đất trong 8 m.
- Nước phản chiếu màu trời theo góc nhìn (Fresnel) và có vệt nắng; gợn chạy xuôi dòng.
- `Sky` thêm `lightDirection`; `Terrain.update(seconds, sky)` gọi mỗi khung.

Ảnh sau phần 1: `main-tools/shots/h1-c-*.png`, `h1-b-*.png`.

### Còn lại của chặng 1

- Phần 2: đồi núi và biển ở chân trời.
- Đo hiệu năng xen kẽ với `main`.
- Câu trong hộp thoại Giới thiệu.
- `scenery.areas` chưa được vẽ (Cannae để trống); làm ở chặng thực vật.
