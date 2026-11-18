# T-039: Phong cảnh, chặng 2 (công trình)

- **Ai làm:** phiên chính (người dùng chọn 2026-11-18, sau khi xem chặng 1: chặng tiếp theo là công trình, phiên chính làm tiếp).
- **Model:** Fable 5.2.
- **Nhánh:** `batch-h/stage2-structures` (tạo từ `main` ở `5b2b28b`). Không commit thẳng vào `main`.
- **Trạng thái:** xong, chờ người dùng xem trong cảnh thật và duyệt gộp. Chưa có lane đọc lại.
- **Phạm vi file:** `src/components/battle/engine/`, `src/lib/battle.ts`, `src/data/battles/`, `scripts/battles/`, `src/lib/i18n/messages.ts`, `docs/`.
- **Kế hoạch chung:** `docs/PLAN.md`, mục "Đợt H".

File này vừa là đề bài vừa là nhật ký: phiên nào làm tiếp thì đọc mục "Kết quả" ở cuối trước.

## Vấn đề

Sau chặng 1, ba trại, thành và làng Cannae vẫn chỉ là nhãn tên trên mặt đất trống. Dữ liệu của chặng 0 đã có phần đất, hướng và căn cứ của từng công trình (`terrain.scenery.structures`); chặng này dựng chúng thành hình. Người dùng cũng đã chọn cho cảnh có nhiều nhà hơn tư liệu (mục "Đợt H" của kế hoạch), nên thêm nhà nông minh hoạ trên đồng.

## Xong khi

- Bay tới mỗi trại thấy lều (lúc đầu còn có hào, luỹ, cọc rào, cổng; người dùng yêu cầu bỏ).
- Thành Cannae có tường, tháp, cổng, nhà kho; làng Cannae có nhà, một phần đổ nát.
- Có nhà nông rải rác trên đồng, đánh dấu là minh hoạ.
- Không hình lính nào đi xuyên qua lều.
- Tốc độ khung hình vẫn trên mục tiêu 50 khi phát 1×.
- Hộp thoại Giới thiệu nói rõ phần nào của công trình theo tư liệu, phần nào là phỏng dựng.
- `npm run lint`, `npm run validate`, `npm run build` qua; hồi quy lõi qua.

## Kết quả

Làm 2026-11-18.

### Khác với đề xuất đã trình

Đề xuất và kế hoạch ghi công trình "dựng bằng Blender". **Phiên chính dựng toàn bộ bằng code trong cảnh (`engine/structures.ts`), không dùng Blender.** Lý do:

- Luỹ, hào, cọc rào và tường thành phải bám theo mặt đất và theo kích thước phần đất trong dữ liệu (trại rộng cả cây số), nên đằng nào cũng phải sinh ra lúc chạy.
- Lều và nhà là những khối đơn giản; sinh bằng code thì không thêm file phải tải, đổi dữ liệu là cảnh đổi theo, và cùng một trận luôn ra cùng một cảnh.

Cái giá: hình dáng đơn giản hơn mô hình Blender (lều là khối có mái, tháp cổng là hộp gỗ, không có dây căng lều, cờ hiệu hay đồ đạc). Nếu người dùng muốn chi tiết hơn, có thể thay riêng lều và cổng bằng mô hình Blender ở một task sau; phần xếp đặt vẫn dùng lại được.

### Đã làm

**Cảnh (`engine/structures.ts`, file mới; `BattleEngine.ts` nối vào).**

- Mỗi công trình trong `scenery.structures` được dựng trên phần đất của nó, bám theo mặt đất, bằng bộ sinh số ngẫu nhiên có hạt giống (id trận và id công trình).
- **Trại (`camp`):** chỉ có lều (bản đầu có hào, luỹ, cọc rào và cổng; đã bỏ theo nhận xét của người dùng, xem cuối file). Một lều cho chừng 20 người (`MEN_PER_FIGURE`), tính theo 19,1 m² đất mỗi người.
  - Trại của bên `rome` xếp theo quy tắc: lều cách mép phần đất 30 m, một đường lớn chạy ngang, một đường dọc giữa trại, khoảng sân của bộ chỉ huy có lều lớn, lối đi giữa các cụm lều.
  - Trại của bên khác (Hannibal) xếp lỏng: lều lệch chỗ, xoay đủ hướng, ba màu (da, vải lanh, len), lều lớn ở giữa.
  - **Chỗ quân đứng và đi qua không có lều:** một lưới 12 m ghi mọi chỗ các khối quân đứng ở các mốc và đi qua giữa hai mốc (đường thẳng, rộng hơn khối 8 m mỗi bên); lều rơi vào đó bị bỏ.
- **Thành (`citadel`):** tường đá cao 9 m quanh phần đất, đỉnh tường đi theo mặt đất; tháp ở bốn góc và hai bên cổng; cổng ở mặt trước; bên trong là các nhà kho dài mái ngói xếp hai dãy.
- **Làng (`village`):** nhà nhỏ xếp theo lối đi, tường đá, trát hoặc gạch bùn, mái ngói hoặc mái rạ. Với `ruined`, khoảng hai phần ba số nhà mất mái, tường nham nhở, có đống đá đổ bên cạnh.
- **Nhà nông (`farm`, loại mới):** một nhà chính mái ngói, một hoặc hai chuồng trại mái rạ, sân có tường thấp, lối vào ở mặt trước.
- Mọi thứ đứng trên mặt đất vẽ to gấp 3 như hình lính (lều cao 4,4 m, nhà cao 6–8 m tới mái hiên); phần đất của công trình giữ kích thước thật.
- Một vật liệu chung, mỗi bề mặt có vân riêng làm trong shader: đất, gỗ, da và vải (đường may), đá (hàng đá so le), tường trát, ngói, rạ. Công trình đổ bóng và nhận bóng.
- Số lượt vẽ: một lưới cho mọi nhà (thành, làng, nhà nông), mỗi trại một lưới cho hào luỹ và bốn lưới cho lều (mỗi góc phần tư một lưới). Tổng cộng 16 lưới. Bản đầu chia lều thành cụm nhỏ, hơn 100 lưới, và đo thấy chậm (xem dưới).

**Hợp đồng và dữ liệu.**

- `SceneryStructure.kind` thêm `farm`; `validate-battles.mjs` nhận loại này.
- Cannae thêm 12 nhà nông (`farm-1` tới `farm-12`, mỗi cái 70 × 50 m), mức `illustrative`. Vị trí chọn bằng script: đất khô và bằng, cách sông trên 200 m, cách mọi đường đi của các khối quân trên 250 m, cách công trình khác trên 200 m. Bảng ở `docs/data/battles/cannae.md`, mục 14.

**Hộp thoại Giới thiệu.** Dòng `about.accuracy.battle.scenery` viết lại, thêm: ba trại, thành và làng Cannae có trong sử liệu, nhưng kích thước, vị trí và mọi thứ bên trong là phỏng dựng; ruộng và nhà nông không phải ghi chép về ruộng hay nhà có thật. Người dùng đã duyệt câu chữ mới (2026-11-18).

**Tài liệu.** `docs/ARCHITECTURE.md` (mục "Phong cảnh"), `docs/data/battles/cannae.md` (mục 14), `docs/PLAN.md`.

### Đã kiểm tra

- `npm run lint`, `npx tsc --noEmit`, `npm run validate`: qua.
- Xem bằng ảnh chụp trên `next dev` (cổng 3105), RTX 3050, lúc 5:30 và 9:45: trại lớn (toàn cảnh, sát lều, cổng nam), trại nhỏ, trại của Hannibal (toàn cảnh và lúc đạo quân La Mã đánh trại), thành, làng, một nhà nông, toàn cảnh chiến trường. Ảnh ở `E:\World_History_Platform_assets\main-tools\shots\h2-a-*`, `h2-b-*`.
- Hiệu năng: đo xen kẽ giữa hai bản production (`main` ở `5b2b28b`, đã có chặng 1, và nhánh), `main-tools/drive/s-perf3.mjs`, không có Blender chạy. Số là khung hình mỗi giây.

  Bản đầu của nhánh (`02b1553`, hơn 100 lưới), ba vòng:

  | | Đứng yên lúc mở | Phát giai đoạn 3 | Phát giai đoạn 4 |
  |---|---|---|---|
  | `main` | 87,3 / 85,6 / 81,1 | 51,5 / 57,0 / 57,9 | 50,4 / 56,2 / 57,5 |
  | nhánh | 86,9 / 91,0 / 95,2 | 55,4 / 65,4 / 46,2 | 47,8 / 52,9 / 35,4 |

  Nhánh thấp hơn ở giai đoạn 4 trong cả ba vòng, hai lần dưới mục tiêu 50. Sau khi gom còn 16 lưới (`04b23ac`), bốn vòng:

  | | Đứng yên lúc mở | Phát giai đoạn 3 | Phát giai đoạn 4 |
  |---|---|---|---|
  | `main` | 89,5 / 96,9 / 90,5 / 91,6 | 55,9 / 64,6 / 63,0 / 50,3 | 58,3 / 61,2 / 48,1 / 48,9 |
  | nhánh | 93,4 / 89,8 / 82,0 / 98,2 | 54,1 / 59,3 / 48,8 / 66,8 | 50,0 / 54,0 / 49,6 / 64,5 |

  Trung bình: giai đoạn 3 là 58,5 (`main`) và 57,3 (nhánh); giai đoạn 4 là 54,1 và 54,5. Không còn khác biệt đo được. **Nhưng cả hai bản đều có lượt xuống 48–50**, tức sát hoặc dưới mục tiêu: hôm nay máy đo cho số thấp hơn buổi sáng khoảng 10% (sáng: `main` trước chặng 1 đạt 62 ở giai đoạn 3), và phần chậm đó có từ chặng 1 hoặc do máy, không phải do công trình. Chưa tách được hai nguyên nhân này.
- `npm run build` (worktree tạm): qua ở `02b1553` và `04b23ac`. Hồi quy lõi (`main-tools/reg-core.js`) trên bản production `04b23ac`: 17/17, console sạch.

### Chưa làm, hoặc chưa ưng

- **Trại lớn trống gần một nửa.** Đạo quân ở lại trại (`camp-force`) và kỵ binh La Mã đứng trong trại rồi đi chéo qua trại ra ngoài; cả dải đất họ đi qua không có lều. Đúng yêu cầu "không ai đi xuyên lều", nhưng nhìn từ trên cao trại lớn thiếu lều ở góc tây nam. Muốn đầy hơn thì phải sửa đường đi của hai khối này cho ra đúng cổng (việc dữ liệu).
- **Hình dáng còn đơn giản**: xem mục "Khác với đề xuất". Tháp cổng là hộp gỗ trơn; lều không có dây căng; không có cờ hiệu, chuồng ngựa, bếp lửa.
- **Trại của Hannibal vẫn chưa có quân giữ** (Polybius 3.117): đạo quân La Mã đang đánh vào một trại không người. Thêm một khối quân là việc dữ liệu, đụng tới quân số và lời dẫn; chưa làm.
- Cách xếp lều La Mã là giản lược (lưới đều có đường lớn và lối đi), không phải sơ đồ trại của Polybius 6.27–32 với chỗ của từng loại quân.
- Thành nằm trùm cả sườn gò: phần đất 160 × 100 m rộng hơn đỉnh gò bằng, nên tường phía tây và nam đi xuống dốc.
- Tường sân nhà nông và nhà trong làng không tránh ruộng: luống cày chạy xuyên qua sân.
- Chưa xem ban đêm, hoàng hôn và ở mức chất lượng thấp. Chưa có mức chi tiết theo khoảng cách cho công trình (mọi lều luôn vẽ đủ).
- `scenery.areas`, gió và bụi vẫn chưa được vẽ (chặng 3 và 4).

### Sửa theo nhận xét của người dùng (2026-11-18, sau khi xem lần đầu)

Người dùng xem nhánh và nêu bốn điều. Nguyên văn, lược bớt: quân La Mã "đứng trên sông"; khi quân từ trại đi ra thì "đi xuyên qua tường của doanh trại"; "doanh trại nhìn xấu quá, lều như khối đá hình tam giác, ý tôi là doanh trại không cần xây tường đâu"; và hỏi có nên nâng cấp đồ hoạ lính không vì "nhìn trông đơn giản như hình khối quá, không như thật".

- **Quân đứng trên sông.** Lúc bắt đầu, bốn khối bộ binh La Mã (velites, hastati, principes, triarii) và hai khối của Hannibal (lính giáo nhẹ, người Gaul bên phải) được đặt đè lên dòng sông; lỗi có từ T-016, tới khi sông có lòng và nước rõ ràng mới lộ ra. Đã dời: bộ binh La Mã sang bờ tây, sắp vượt sông (tâm x từ −525 thành −830; velites y từ 910 thành 930); lính giáo nhẹ từ x −1300 thành −1010; người Gaul bên phải từ x −1260 thành −1170; người Gaul bên trái từ y −650 thành −600 (ra khỏi bãi sỏi). `check-overlap.mjs --min 0.04` không đổi.
  - `validate-battles.mjs` thêm luật: ở mỗi mốc, không khối quân nào có quá 5% diện tích nằm trong nước của một con sông. Đã thử với dữ liệu cũ: bắt đủ sáu khối. Vượt sông **giữa** hai mốc thì được.
  - Khi đi qua sông, hình lính giờ **lội nước**: chân họ đứng ở đáy sông, sâu tới 1,5 m ở giữa dòng (ngang đầu gối ở cỡ hình lính). `Terrain.footingAt` dùng một lưới độ sâu 5 m dựng từ đường sông; cảnh dùng nó thay cho `heightAt` khi đặt hình lính.
- **Đi xuyên tường trại, và trại không cần tường.** Đã bỏ hẳn hào, luỹ, cọc rào và cổng: trại giờ chỉ có lều. Lều vẫn không dựng ở chỗ quân đứng hay đi qua. Phiên chính có nói với người dùng rằng Livy 22.44–45 nhắc tới luỹ của hai trại La Mã; cảnh không vẽ là theo lựa chọn của người dùng, còn ghi chú căn cứ trong dữ liệu vẫn nói nguồn viết gì.
- **Lều như khối đá.** Lều làm lại: vách thấp, mái võng giữa nóc và mép, nóc hơi trũng giữa hai cột, cửa mở ở mặt trước, cột nhô ở hai đầu nóc, bốn dây căng ở góc; màu da sáng hơn; shader vẽ các tấm da khâu lại, mỗi tấm một sắc độ. Khoảng 56 tam giác mỗi lều.
- **Đồ hoạ lính.** Chưa đổi gì; phiên chính trả lời câu hỏi bằng nhận định và các phương án (xem `docs/PLAN.md`, mục "Việc cho trận đánh 3D").

Ảnh sau khi sửa: `main-tools/shots/h2-e-*`, `h2-f-*`.
