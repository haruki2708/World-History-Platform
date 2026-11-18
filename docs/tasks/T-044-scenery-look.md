# T-044: Nước, lều, nhà và cây có chất liệu thật

- **Ai làm:** phiên chính.
- **Model:** Opus 5.5.
- **Nhánh:** `batch-i/look-sample`, worktree `E:\World_History_Platform_assets\wt-stage3`, `next dev` cổng 3106.
- **Trạng thái:** nước xong; người dùng duyệt màu mới (bước 1 của "khớp số đo"); bước 2 (chi tiết trên cây, mặt đất, lều, nhà) xong; người dùng xem ảnh và duyệt (2026-11-19): "ok, đã đủ thật rồi". Số chi tiết đo được chưa tới đích của ảnh mẫu, nhưng người dùng thấy đủ; không làm thêm trừ khi được yêu cầu. Chưa gộp.
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

### Khớp số đo, bước 2: chi tiết trên cây, mặt đất, lều và nhà (2026-11-19)

Người dùng duyệt màu của bước 1 ("màu mới được nhé"). Bước 2 thêm chi tiết nhỏ, đích là 4–6 trên vùng xanh lá.

**Cây và lau sậy** (`engine/vegetation.ts`, `scripts/battles/build-foliage.py`, `public/battles/textures/foliage.webp`, 363 KB):

- Tấm lá của tán cây là ảnh ghép từ **lá chụp thật** (lá sồi của ambientCG `LeafSet016`, lá dài của `LeafSet005`): mỗi tấm là một chùm lá mọc trên cành con, lá phía sau sẫm hơn. Màu mỗi chiếc lá được chia cho màu trung bình của nó, nên cảnh vẫn tô màu theo loài cây; phần còn lại của ảnh là hình lá, gân lá và độ sáng tối.
- Thân cây phủ **vỏ cây chụp thật** (`Bark012`), tám cạnh, gốc xoè ra như rễ; thêm ba, bốn cành toả vào tán. Số tấm lá mỗi cây tăng 1,5 lần, mỗi tấm nhỏ đi.
- Lau sậy: lá dài và thân có bông, thay cho các nét vẽ.
- Bỏ hàm vẽ lá bằng canvas.

**Mặt đất và bụi cỏ** (`engine/grass.ts`, shader mặt đất trong `terrain.ts`):

- Bụi cỏ **sẫm hơn mặt đất** (gốc `#263f17`, ngọn `#5f8a38`), như ảnh mẫu; trước đây bụi cỏ sáng hơn đất nên gần như chìm vào nền.
- Ngoài tầm của bụi cỏ thật (145 m), mặt đất vẫn lốm đốm: mỗi ô 2,7 m một đốm sẫm, hiện từ 55 m và tắt dần khi đốm nhỏ hơn khoảng một điểm ảnh.
- Vân ảnh cỏ trên mặt đất mạnh hơn.

**Lều và nhà** (`engine/structures.ts`, `scripts/battles/build-materials.py`, ba ảnh xám `cloth.jpg`, `masonry.jpg`, `planks.jpg`, tổng 232 KB):

- Ba ảnh chụp (vải dệt `Fabric030`, tường gạch đá `Bricks085`, ván gỗ `Planks021`) đổi sang xám, trung bình 0,5; shader nhân màu của tường, mái, lều với hai lần giá trị ảnh. Ảnh cho mạch vữa, sợi vải, vân gỗ; cảnh cho màu.
- Lều: mỗi lều một sắc vải (mới, cũ, bạc nắng), tấm vải khâu rõ hơn, có nếp chảy từ nóc xuống.
- Tường đá là tường xây thật; tường trát vữa lộ gạch ở chỗ vữa bong và có vệt nước mưa; ngói mỗi viên một sắc, hàng ngói rõ hơn; gỗ và mái rạ có vân.
- **Hình dáng chưa đổi:** nhà vẫn là hộp có mái, làng đổ nát vẫn là tường không mái, chưa có gạch vụn, cửa sổ, đồ vật quanh lều.

**Ánh sáng sáng sớm** (`sky.ts`): nắng và ánh sáng trời lúc mặt trời thấp tăng nhẹ (8°: nắng 1,8 lên 2,4, trời 1,6 lên 1,9). Trên ảnh gần như không đổi; cảnh mở đầu lúc 6:45 vẫn tối hơn ảnh mẫu (độ sáng vùng xanh lá 0,26–0,40 so với 0,34–0,50).

**Số đo sau bước 2** (bảy góc chuẩn; "trước" là trước bước 1):

| Góc | Chi tiết trên vùng xanh lá: trước | sau | Chi tiết toàn ảnh: trước | sau |
|---|---|---|---|---|
| Nhìn từ trên (field) | 2,2 | 3,5 | 2,8 | 3,6 |
| Bộ binh phía khuất nắng (inf) | 3,3 | 3,1 | 3,2 | 3,0 |
| Bộ binh phía có nắng (infsun) | 3,1 | 2,9 | 3,2 | 2,8 |
| Sông (river) | 2,9 | 2,5 | 2,6 | 2,3 |
| Làng (village) | 1,9 | 2,0 | 1,9 | 2,4 |
| Bờ biển (shore) | 1,3 | 1,5 | 1,8 | 1,7 |
| Lều (tents) | 2,6 | 2,2 | 3,0 | 2,6 |

**Chưa đạt đích.** Ảnh mẫu là 3,8–6,4 trên vùng xanh lá và 3,3–6,0 toàn ảnh. Chỉ góc nhìn từ trên tới gần (3,5). Lý do đọc từ số và ảnh:

- Bước 1 hạ tương phản và độ đậm, làm số chi tiết của mọi góc giảm khoảng 10%; bước 2 mới bù lại được ở góc nhìn từ trên.
- Ở các góc nhìn thấp, phần lớn vùng xanh là mặt đất ở xa nhìn xiên: đốm cỏ tắt ở đó để khỏi nhấp nháy, nên đất xa vẫn trơn.
- Thước đo lấy trung bình cả ảnh, nên cây và lều (ít điểm ảnh) kéo số lên rất ít dù nhìn bằng mắt đổi nhiều.

**Kiểm tra** (commit ce59b9e, bản production dựng ở worktree tạm): `npm run lint`, `npm run validate`, `next build` qua; hồi quy lõi 17/17, không lỗi console. Số khung hình, hai lượt `s-perf3.mjs` (lúc mở; phát giai đoạn 3; giai đoạn 4): 86,2; 62,2; 58,9 và 84,9; 59,0; 51,7. Lượt trước đó (T-043): 78,7; 51,9; 55,4 và 90,9; 62,0; 55,3. Không thấy chậm đi; giai đoạn 4 có lượt xuống 51,7, sát mục tiêu 50. Chưa xem ở mức chất lượng thấp.

Ảnh trước và sau: `E:\World_History_Platform_assets\duyet\T-044-buoc2-chi-tiet\`.

**Chưa làm (nước):** bờ sông vẫn phẳng (sỏi là hình vẽ, không có hòn đá nổi); không có đá lớn ở bờ biển; nước không trong suốt (không thấy đáy ở chỗ nông, chỉ đổi màu).

**Hai ảnh mới** trong `public/battles/textures/` (tổng 115 KB): `gravel.jpg`, `sand.jpg`; ghi công ở `art/CREDITS.md`.

### Trước khi gộp (2026-11-19)

Người dùng chọn hoàn thiện để gộp. Đã làm: ghi chú căn cứ của `ground` (Cannae) viết lại cho lớp phủ xanh, mức `illustrative`; hai dòng của hộp thoại Giới thiệu viết lại (cảnh vật: mặt đất xanh trái mùa, bỏ chữ "ruộng"; giáp lá cà: hàng sau chen lấn và lao ném qua đầu là minh hoạ), cả tiếng Anh và tiếng Việt; `docs/ARCHITECTURE.md` thêm mục "Đồ hoạ theo ảnh mẫu (đợt I)"; `docs/data/battles/cannae.md` thêm mục 16.

**Kiểm tra bản cuối** (commit 1c34d1e, bản production dựng ở worktree tạm): `npm run lint`, `npm run validate`, `next build` qua; hồi quy lõi 17/17, không lỗi console; hộp thoại Giới thiệu hiện hai dòng mới ở cả hai ngôn ngữ. Số khung hình, hai lượt `s-perf3.mjs` (lúc mở; phát giai đoạn 3; giai đoạn 4): 93,3; 64,6; 61,2 và 93,4; 65,2; 60,6. Mức chất lượng thấp: xem ảnh chụp bốn góc, cây, nước, bụi cỏ và lều đều hiện đúng, không shader nào lỗi. Nhánh đứng thẳng trên `main` (5b2b28b), gộp được bằng fast-forward.
