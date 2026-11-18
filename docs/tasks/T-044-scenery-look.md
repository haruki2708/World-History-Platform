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

**Sửa sau khi người dùng xem ảnh (2026-11-18):** người dùng nói nước "vẫn còn thiên hướng hoạt hình chút, chưa rất chân thực như ảnh mẫu". Phiên chính so với ảnh mẫu số 4 (sông xanh thẫm, lặng, bờ đất dốc) và sửa sông: nước thẫm hơn và lặng hơn (sóng còn khoảng 30%, chỗ lội vẫn gợn), bọt mép nước mảnh và nhạt hơn, bờ là đất nâu dốc xuống nước, sẫm ở chân bờ và có cỏ mọc, sỏi chỉ còn sát mép nước. Ảnh: `E:\World_History_Platform_assets\duyet\T-044-chang1-nuoc-lan2\`.

### Khớp số đo với ảnh mẫu, bước 1: màu và bóng (2026-11-18)

Sau lần sửa sông, người dùng vẫn thấy "đồ hoạ chưa chuẩn và thật như ảnh mẫu" và hỏi có lấy được thông tin gì từ ảnh mẫu để áp dụng không. Phiên chính đổi cách làm từ "sửa rồi nhìn bằng mắt" sang **"sửa rồi đo"**; người dùng đồng ý.

**Thước đo** (ngoài repo): `E:\World_History_Platform_assets\main-tools\look\measure.py` đo một ảnh; `check.sh <tiền tố>` chụp bảy góc chuẩn của cảnh mẫu rồi đo. Mỗi ảnh thu về bề ngang 1280, bỏ thanh điều khiển ở đáy ảnh chụp cảnh. Các số: độ sáng ở mức 5%, 50%, 95% và độ lệch; độ đậm màu trung bình (S của HSV); chi tiết nhỏ (độ lệch trung bình của mỗi điểm ảnh so với trung bình các điểm quanh nó, ×100); phần ảnh gần đen (độ sáng dưới 0,12); màu trung bình của vùng xanh lá và vùng xanh nước.

**Đo được gì** (năm ảnh mẫu so với bảy góc của cảnh, trước khi sửa):

| Số đo | Ảnh mẫu | Cảnh, trước | Cảnh, sau bước 1 |
|---|---|---|---|
| Độ đậm màu toàn ảnh | 0,31–0,57 | 0,63–0,82 | 0,42–0,54 |
| Độ đậm của vùng xanh lá | 0,50–0,66 | 0,91–0,97 | 0,55–0,61 |
| Độ sáng của vùng xanh lá | 0,34–0,50 | 0,32–0,53 | 0,34–0,53 |
| Sắc của vùng xanh lá (độ) | 71–82 | 73–86 | 74–84 |
| Độ sáng ở mức 5% | 0,07–0,23 | chưa đo đúng (dính thanh điều khiển) | 0,14–0,27 |
| Chi tiết nhỏ, toàn ảnh | 3,3–6,0 | 1,8–3,2 | 1,6–2,9 |
| Chi tiết nhỏ, trên vùng xanh lá | 3,8–6,4 | 1,3–3,3 | 1,2–3,1 |

Kết luận: cảm giác "hoạt hình" đến từ màu quá đậm (cỏ cây gần như xanh neon) và thiếu chi tiết nhỏ, không phải từ sắc màu. Lúc làm T-041 phiên chính tăng độ đậm vì nhìn ảnh mẫu thấy "tươi"; số đo cho thấy đã tăng quá tay.

**Đã sửa** (`engine/grade.ts`): sau đường cong màu, giữ lại 96% màu (trước là 116%) và bỏ phần tăng tương phản; nâng màu đen lên một chút (0,0028 trong ánh sáng tuyến tính) để nhìn được vào vùng bóng. Hai lần thử đầu quá tay (màu xám hẳn), ghi lại để khỏi lặp: phép nâng đen làm trong ánh sáng tuyến tính, 0,05 ở đó là 0,25 trên màn hình. Biển bớt đậm (`#1d3a4e`).

**Chưa đạt, là việc của bước 2:** chi tiết nhỏ vẫn chỉ bằng nửa ảnh mẫu (đích: 4–6 trên vùng xanh lá). Bước 1 còn làm nó giảm nhẹ vì tương phản giảm. Chi tiết phải đến từ chất liệu ảnh thật trên cây, lều, nhà và mặt đất xa: chính là chặng 2 và 3.

Ảnh trước và sau: `E:\World_History_Platform_assets\duyet\T-044-buoc1-mau\`.

**Chưa làm:** bờ sông vẫn phẳng (sỏi là hình vẽ, không có hòn đá nổi); không có đá lớn ở bờ biển; nước không trong suốt (không thấy đáy ở chỗ nông, chỉ đổi màu).

**Hai ảnh mới** trong `public/battles/textures/` (tổng 115 KB): `gravel.jpg`, `sand.jpg`; ghi công ở `art/CREDITS.md`.
