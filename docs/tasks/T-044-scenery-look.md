# T-044: Nước, lều, nhà và cây có chất liệu thật

- **Ai làm:** phiên chính.
- **Model:** Opus 5.5.
- **Nhánh:** `batch-i/look-sample`, worktree `E:\World_History_Platform_assets\wt-stage3`, `next dev` cổng 3106.
- **Trạng thái:** chặng 1 (nước) xong, chờ người dùng xem; chặng 2 (lều và nhà) và 3 (cây) chưa làm.
- **Phạm vi file:** `src/components/battle/engine/` (`water.ts`, `river.ts`, `terrain.ts`, `structures.ts`, `vegetation.ts`), `public/battles/textures/`, `art/CREDITS.md`, `docs/`.

File này vừa là đề bài vừa là nhật ký: phiên nào làm tiếp thì đọc mục "Kết quả" trước.

## Vấn đề

Sau khi duyệt giáp lá cà hỗn chiến (T-043), người dùng chọn làm tiếp **"Cây, lều, nhà và nước"** (2026-11-18). Phiên chính chụp cảnh hiện có và thấy:

- **Lều:** một màu phẳng, không vân vải, trăm cái như nhau, trông như hộp.
- **Nhà và làng:** vân đá vẽ bằng code, mái phẳng một màu; làng đổ nát là tường hộp không mái, không gạch vụn.
- **Cây:** tán là mảng lá vẽ bằng code (đốm tròn), thân là ống trơn không cành; lau sậy như tấm bìa cắt.
- **Sông:** xanh phẳng, chỗ lấp lánh vỡ thành ô vuông; không bọt; bờ là dải cát phẳng.

**Người dùng duyệt kế hoạch (2026-11-18):** giữ hình dựng bằng code, phủ chất liệu ảnh chụp thật nguồn CC0 (ambientCG) và sửa hình dáng chỗ lộ; không tải mô hình 3D có sẵn. Ba chặng theo thứ tự **nước → lều và nhà → cây**, mỗi chặng xong gửi link cho người dùng xem. Đo lại hiệu năng sau cả ba chặng.

## Xong khi

Người dùng xem từng chặng và nói đạt; hiệu năng phát lúc đông nhất không dưới 50 khung hình mỗi giây.

## Kết quả

### Chặng 1: nước (2026-11-18)

**Xem ở đâu** (cổng 3106):

- Sông, nhìn gần: `http://localhost:3106/battle-lab?lang=vi&t=0.5&cam=-1350,120,70,14,110`
- Sông, nhìn về phía mặt trời: `http://localhost:3106/battle-lab?lang=vi&t=0.5&cam=-1350,120,60,9,230`
- Bờ biển và sóng vỗ: `http://localhost:3106/battle-lab?lang=vi&t=0.5&cam=1300,1900,140,18,230`
- Biển, vệt nắng: `http://localhost:3106/battle-lab?lang=vi&t=0.5&cam=1700,2300,400,10,80`

**Đã làm:**

- **Mặt nước dùng chung** (`engine/water.ts`, mới): sóng là tổng chín con sóng dài từ 9 m xuống dưới nửa mét, mỗi con chạy một hướng quanh hướng chính, với tốc độ của sóng thật cùng độ dài; độ cao sóng đổi theo từng mảng như có gió giật. Con sóng nào ngắn dưới khoảng hai điểm ảnh ở khoảng cách đó thì bỏ, nên mặt nước xa không nhấp nháy; phần bị bỏ biến thành độ nhám. Nắng phản chiếu thành đốm lấp lánh sắc ở gần và thành một vệt rộng ở xa, như ảnh mẫu số 5. Trời phản chiếu theo Fresnel.
- **Sông** (`river.ts`): sóng chạy xuôi dòng theo đúng hướng của dòng chảy ở từng đoạn; bọt trắng đứt quãng dọc hai mép nước, nhiều hơn ở chỗ lội. Lòng sông là ảnh chụp sỏi (ambientCG `Gravel022`, CC0), trải ở hai cỡ để không thấy lặp; sáng hơn trên bãi, sẫm hơn chỗ ướt.
- **Biển** (shader mặt đất trong `terrain.ts`): dùng cùng mặt nước, sóng dài hơn, chạy vào từ đông nam; màu xanh thẫm hơn. Bãi là ảnh chụp cát (ambientCG `Ground054`, CC0), sẫm ở dải cát ướt; sóng vỗ là những dải bọt chạy vào bờ rồi tan.

**Sửa sau khi người dùng xem ảnh (2026-11-18):** người dùng nói nước "vẫn còn thiên hướng hoạt hình chút, chưa rất chân thực như ảnh mẫu". Phiên chính so với ảnh mẫu số 4 (sông xanh thẫm, lặng, bờ đất dốc) và sửa sông: nước thẫm hơn và lặng hơn (sóng còn khoảng 30%, chỗ lội vẫn gợn), bọt mép nước mảnh và nhạt hơn, bờ là đất nâu dốc xuống nước, sẫm ở chân bờ và có cỏ mọc, sỏi chỉ còn sát mép nước. Ảnh: `E:World_History_Platform_assetsduyetT-044-chang1-nuoc-lan2`.

**Chưa làm:** bờ sông vẫn phẳng (sỏi là hình vẽ, không có hòn đá nổi); không có đá lớn ở bờ biển; nước không trong suốt (không thấy đáy ở chỗ nông, chỉ đổi màu).

**Hai ảnh mới** trong `public/battles/textures/` (tổng 115 KB): `gravel.jpg`, `sand.jpg`; ghi công ở `art/CREDITS.md`.
