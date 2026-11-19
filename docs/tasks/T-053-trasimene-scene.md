# T-053: Trận hồ Trasimene, chặng 2: mặt hồ, lội nước, sương mù, quân nấp

- **Lane:** 3
- **Model đề xuất:** Fable 5.2, effort `high`.
- **Nhánh:** `lane3/T-053-trasimene-scene` (phiên chính đã tạo sẵn từ `main` trong worktree của bạn).
- **Phạm vi file:**
  - `src/components/battle/`;
  - `src/lib/i18n/messages.ts`: chỉ khoá `battle.*`, cả `en` lẫn `vi`;
  - **ngoại lệ tạm**, xem mục 1: một file trận thử `src/data/battles/battle-of-lake-trasimene.json` và một dòng trong `battleLoaders` của `src/data/index.ts`.

## Bối cảnh

Người dùng duyệt **đợt K: trận 3D thứ hai, hồ Trasimene (217 TCN)** (`docs/PLAN.md`, mục "Đợt K") và chọn giao chặng cảnh cho bạn. Trận này dùng lại mọi mô hình lính của Cannae; việc mới của cảnh là hồ, đảo, lính lội nước, sương mù và quân phục kích.

Đọc trước:
- `docs/ARCHITECTURE.md`, mục "Trận đánh 3D": "Quân nấp" (trong "Dữ liệu"), "Hồ", "Sương mù", "Biển", "Lội sông", "Bụi trong cảnh", "Đồ hoạ theo ảnh mẫu".
- `src/lib/battle.ts`: `BattleLake` (có `islands`), `BattleScenery.mist`, `UnitState.concealed`.
- `docs/data/battles/trasimene.md` (T-051, lane 2): vị trí, mục 4 (bờ hồ, mực nước 254,5 m, đảo), mục 7 (sương mù theo nguồn), mục 10 (ý 2: hồ ở vùng xa).

Đã có trong `main`: lưới độ cao chính và vùng xa (`public/data/terrain/battle-of-lake-trasimene*.bin`), khối `terrain` nháp có hồ (`docs/data/battles/trasimene-terrain.json`). **Song song với bạn**, lane 2 viết file trận thật ([T-052](T-052-trasimene-battle.md)). Khi T-052 gộp, phiên chính báo qua người dùng.

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Trận thử tạm, trong lúc chờ T-052

- Dựng một file trận nhỏ `src/data/battles/battle-of-lake-trasimene.json` từ khối `terrain` nháp: thêm `islands` (vạch bằng `node scripts/battles/build-terrain.mjs --battle battle-of-lake-trasimene --lake out.json`), `scenery` có `mist` (`level` 0,8, `clearsAt` 9,75), vài khối đủ để thử: một khối đứng một phần trong hồ (tới 150 m từ bờ), một khối kỵ binh lội nước, vài khối `concealed` ở hai mốc đầu rồi lao xuống. `scripts/battles/test-lake-checks.mjs` đã có sẵn cách dựng một trận nhỏ trên địa hình này. File phải qua `npm run validate`.
- Thêm một dòng `battle-of-lake-trasimene` vào `battleLoaders` để mở ở `/battle-lab?battle=battle-of-lake-trasimene`.
- Đặt cả hai trong **một commit riêng**, lời commit bắt đầu bằng `TEMP:`. Không sửa chúng ở commit khác.
- **Khi phiên chính báo T-052 đã gộp:** `git revert` commit `TEMP:` đó, rồi gộp `main` vào nhánh của bạn và làm tiếp trên file trận thật. Trước khi báo xong, nhánh không được còn file trận thử.

### 2. Mặt hồ và đảo

- Vẽ nước ở `level` trong `outline`, trừ các `islands`, trên lưới chính và **cả lưới vùng xa** (lưới xa không đánh dấu hồ bằng độ cao, vì mặt hồ ở trên mực biển). Đảo là đất: vẽ lưới độ cao trên đảo như mặt đất thường.
- Dùng lại `engine/water.ts` (sóng, nắng lấp lánh, phản chiếu trời) cho hợp với sông và biển của Cannae; mặt hồ lặng hơn biển. Mép nước chuyển dần sang đất (nước nông, bùn, cát ướt), không phải một đường cắt.
- Livy 22.6.6 gọi mép hồ là "chỗ nước nông của đầm": dải lau sậy ven bờ sẽ có trong dữ liệu (`areas` `reeds`, lane 2); thực vật mọc theo dữ liệu như Cannae, nhưng không mọc trong nước.

### 3. Lính lội nước

- Lính đứng trong hồ thì đứng trên đáy hồ, không đứng trên mặt nước: đáy hồ sâu dần theo khoảng cách tới bờ gần nhất, kể cả bờ đảo; khoảng 1,4–1,6 m ở 150 m từ bờ (giới hạn của `npm run validate`), để lính ở xa nhất ngập tới vai. Làm như `Terrain.footingAt` với sông.
- Bộ binh và kỵ binh đều phải trông đúng: nước che chân, ngựa ngập tới bụng hay ngực.

### 4. Sương mù

- Theo `scenery.mist`: dày hơn ở chỗ thấp (mặt hồ, đồng bằng) và mỏng trên đồi (Livy 22.4.6: các toán phục binh trên đồi vẫn thấy nhau); mỏng dần theo thời gian trận và hết vào giờ `clearsAt`; không có `clearsAt` thì giữ tới hết trận.
- Suy ra từ đồng hồ trận như bụi: tua tới đâu cũng ra cùng cảnh như khi phát tới đó.
- Sương phải che vừa đủ: người xem vẫn phải theo được trận. Nhãn và lớp phủ của khung xem không bị sương che.
- Mức chất lượng thấp: sương là một phần câu chuyện của trận này, nên không tắt hẳn; dùng cách rẻ hơn nếu cần.

### 5. Quân nấp

- Theo hợp đồng: khối ẩn trong một giai đoạn khi `concealed` ở cả hai mốc của giai đoạn đó. Lúc ẩn, vẫn vẽ lính; không vẽ nhãn tên và mảng màu phe dưới chân. Bấm vào khối vẫn mở thẻ, và thẻ ghi là đang nấp (khoá mới `battle.*`, song ngữ). Danh sách khối quân trong tab "Thông tin trận" có thể ghi giống thẻ; tuỳ bạn.
- Tua và phát phải ra cùng kết quả.

### 6. Hiệu năng

- Từ 50 khung hình/giây ở 1280×800 trên trận Trasimene thật (sau T-052; trước đó đo trên trận thử, kèm `?stress=` cho đủ số hình lính), ở góc nhìn mở và lúc sương dày nhất.
- Cannae không chậm hơn `main`: đo xen kẽ A-B-A-B trên cùng trang như ở đợt E và T-048.
- Ghi điều kiện máy mỗi lần đo (`tasklist` tìm `blender`): lane 1 có thể đang chạy Blender.

### 7. Ảnh cho người dùng duyệt

- Đặt ở `E:\World_History_Platform_assets\duyet\T-053\`. Driver chụp của phiên chính (`E:\World_History_Platform_assets\main-tools\drive`): đặt `PORT=9364`.
- **Dừng sớm một lần:** khi đã có mặt hồ, đảo và sương mù ở mức đầu tiên, chụp vài ảnh (góc nhìn mở lúc 5:00, lúc sương dày nhất ở giai đoạn 2–3, lúc sương tan) rồi báo người dùng xem trước khi làm tiếp. Người dùng sẽ chỉnh độ dày sương và màu nước ở bước này.
- Ảnh cuối: hồ và đảo nhìn từ đồng bằng; lính lội nước cận cảnh; khối phục kích lúc ẩn và lúc lộ ra; cùng một góc ở 5:00, 7:00, 9:00, 10:00 để thấy sương tan dần.

### 8. Người dùng duyệt bản đầu (2026-11-19)

Người dùng đã xem ảnh `duyet\T-053\dung-som` và chọn:

- **Sương mù:** giữ như ảnh 02–03, cả độ dày lẫn độ cao lớp sương (`SCALE_HEIGHT` 25 m). Đồng bằng cao hơn mặt hồ 0–25 m thì chìm trong sương; đồi phục kích cao hơn 90–130 m thì gần như quang, đúng với Livy 22.4.6.
- **Màu nước:** đục hơn và ngả lục hơn, để nhìn ra ngay là hồ nông chứ không phải biển. Hồ thật sâu nhất khoảng 6 m, nước thường xám lục. Cannae không đổi.
- **Dải bùn ở mép hồ:** giữ nguyên khi nhìn gần (ảnh 07, 10, 11). Nhạt dần khi nhìn xa: ở ảnh 09, dải bùn thành một đường viền nâu quanh hồ và quanh đảo.
- **Độ sâu nhân `FIGURE_SCALE`:** phiên chính đồng ý, và đã ghi vào `docs/ARCHITECTURE.md`, mục "Hồ".
- **Thêm vào task này hai lỗi lộ ra ở ảnh 09.** Cannae không lộ hai lỗi này vì phía xa chủ yếu là biển và đất phẳng.
  1. Lưới chính hiện thành một hình chữ nhật sáng hơn hẳn vùng xa xung quanh. Mặt đất phải nối liền giữa lưới chính và vùng xa.
  2. Một vệt nâu nằm giữa dãy đồi xa và bầu trời, ở mép trên ảnh. Tìm nguyên nhân và sửa: mép vùng xa, màu mù xa, hay thứ khác.

  Sửa xong thì chụp lại góc ảnh 09, và một góc Cannae nhìn xa để chắc Cannae không đổi.
- **Đo hiệu năng:** ghi cả Godot lẫn Blender trong điều kiện máy (`tasklist`). Khi máy không sạch thì đo xen kẽ A-B như mục 6.

### 9. File trận thật, trước khi T-052 vào `main` (2026-11-19)

Lane 2 đã xong T-052. Người dùng duyệt file trận, nhưng **chưa gộp vào `main`**: T-052 và T-053 sẽ vào `main` cùng một lượt khi T-053 xong, để app chính không hiện trận Trasimene khi cảnh còn dở. Vì vậy, thay cho ý cuối của mục 1:

- `git revert` commit `TEMP:`, rồi gộp thẳng nhánh `lane2/T-052-trasimene-battle` vào nhánh của bạn (không phải `main`). Gộp sẽ không vướng gì, vì sau khi revert nhánh của bạn không còn file trận thử.
- Làm tiếp và đo trên file trận thật. Cần biết về trận thật thì đọc mục "Cho lane 3 (T-053)" trong `docs/tasks/T-052-trasimene-battle.md` trên nhánh đó: 3 đảo, 10 khối nấp, quân La Mã lội tới 95 m, 3 750 hình lính.
- Không sửa file của lane 2. Thấy file trận cần đổi thì ghi vào "Kết quả".

## Ràng buộc

- Ngoài phạm vi trên, không sửa file của người khác. Cần đổi hợp đồng (`src/lib/battle.ts`) thì ghi đề nghị vào "Kết quả".
- Không chép dữ liệu trận thật vào code: cảnh đọc mọi thứ từ file trận.
- `npm run validate`, `npm run lint`, `npm run build` phải qua; hồi quy lõi (`main-tools`, như các lần trước) không hỏng.

## Xong khi

- Trận Trasimene thật (sau T-052) có mặt hồ, đảo, lính lội nước, sương mù tan theo giờ, khối phục kích ẩn rồi lộ ra.
- Từ 50 khung hình/giây; Cannae không chậm hơn `main`.
- Các điểm ở mục 8 đã làm; lưới chính nối liền vùng xa, không còn vệt nâu ở chân trời.
- Nhánh không còn file trận thử; có ảnh duyệt; mục "Kết quả" đã điền (cách làm, số đo, đề nghị cho hộp thoại Giới thiệu ở chặng 3).

## Kết quả

Lane 3, 2026-11-19. Đã xong mọi phần làm được trước khi T-052 gộp. **Còn một bước chờ T-052** (cuối mục này): nhánh vẫn còn commit trận thử `TEMP:` (`c2dca86`). Trong lúc chờ, tôi đã thử cảnh trên file trận thật của lane 2 (nhánh `lane2/T-052-trasimene-battle`, commit `782e115`): chép tạm file đó vào cây làm việc, không commit, không gộp, thử xong trả lại file trận thử. Số đo và ảnh cuối dưới đây lấy trên file đó.

### Cách làm

**1. Trận thử tạm** (commit `TEMP:` `c2dca86`): địa hình nháp của T-051, thêm ba đảo vạch bằng `build-terrain.mjs --lake`, `mist` 0,8 và `clearsAt` 9,75, sáu giai đoạn theo giờ của `trasimene.md`. Có một khối bị dồn xuống hồ (xa bờ tới 130 m), kỵ binh Numidia lội theo, ba khối `concealed` ở hai mốc đầu, một dải `reeds` vắt qua bờ. Qua `npm run validate`. Có một dòng trong `battleLoaders`.

**2. Mặt hồ và đảo** (`engine/lake.ts`, mới; `engine/terrain.ts`)
- `LakeField`: một lưới 10 m phủ cả hồ cộng 300 m đất quanh bờ, 1 byte mỗi ô. Mỗi ô ghi khoảng cách có dấu tới bờ gần nhất (dương trên nước, âm trên đất; đảo là đất), từ −256 tới +254 m, mỗi bước 2 m.
  - Khoảng cách tính đúng tới từng đoạn của đường bờ và bờ đảo.
  - Ô nào là nước thì xét theo số lần cắt các đường bao trên mỗi hàng.
  - Dựng mất khoảng vài chục ms lúc mở trận.
- Shader mặt đất (dùng chung cho lưới chính và vùng xa) đọc lưới này như một texture, nên mép nước sắc nét ở mọi khoảng cách. Bờ được vẽ cho lệch vài mét theo nhiễu để không thẳng như kẻ. Từ đất vào nước lần lượt là:
  - đất ẩm, rồi bùn và cát ướt;
  - chỗ nước nông, thấy đáy;
  - nước mở, dùng sóng của `water.ts` với `calm` 0,8 (lặng hơn biển), sóng gợn chạy theo hướng gió, mép nước có sóng vỗ nhẹ.
- **Màu nước** (người dùng chọn đục và xám lục hơn): sâu `#3c4f3d`, nông `#5b6447`, bùn `#5d5243`. Màu chuyển từ nông sang sâu trong 120 m từ bờ.
- **Dải đất ẩm và bùn nhạt dần khi nhìn xa:** khi một điểm ảnh phủ từ 3 tới 14 m mặt đất, dải này mờ đi còn 20%.
- **Vùng xa:** lưới xa là độ cao trung bình quanh mỗi điểm, nên ở hồ nó lẫn cả đất. Mọi đỉnh lưới xa nằm trên nước được đặt đúng `level`. Vòng đỉnh nối lưới chính với vùng xa cũng vậy.

**3. Lính lội nước**
- `Terrain.footingAt` lấy mặt đất trừ độ sâu của đáy hồ. Đáy sâu thêm 1 cm cho mỗi mét cách bờ gần nhất (kể cả bờ đảo), sâu nhất 1,65 m. Độ sâu nhân `FIGURE_SCALE` như phiên chính đã đồng ý.
  - Ở 150 m (giới hạn của `validate`), bộ binh ngập tới vai.
  - Kỵ binh cách bờ 60–100 m thì ngựa ngập tới bụng hay ngực.
  - Nước là mặt đất được tô màu, không trong suốt, nên phần ngập không nhìn thấy.
- Lau sậy mọc tới cách nước 1 m, cây lớn cách 10 m, bụi cỏ quanh camera cách 6 m. Lính đứng trong nước không bốc bụi.

**4. Sương mù** (`engine/mist.ts`, mới)
- **Cách vẽ:** sương theo độ cao, tính trong bước fog của three.js, nên mọi vật liệu có fog đều qua sương (mặt đất, lính, cây, lều, bụi). Các chunk fog được thay một lần cho cả trang. Mật độ giảm theo hàm mũ khi lên cao, nên tổng sương dọc đường nhìn có công thức đóng, mỗi điểm ảnh chỉ tốn vài phép tính.
- **Thông số** (người dùng giữ như ảnh 02–03 của đợt dừng sớm):
  - mật độ ở chân lớp sương là 0,02 mỗi mét nhân `level` nhân phần còn lại theo giờ;
  - chân lớp sương là mặt hồ (trận không có hồ thì lấy độ cao mà 5% điểm lưới thấp hơn);
  - độ cao giảm một nửa (`SCALE_HEIGHT`) 25 m;
  - từng đám dày mỏng chênh nhau 35%, trôi theo gió với tốc độ bằng 0,9 lần `wind.speed` (ít nhất 1,5 m mỗi giây phát).
- **Màu sương:** ánh sáng của giờ đó (trời và một phần nắng) chiếu lên một mặt trắng mờ, rồi qua đường cong màu của cảnh (chép đường cong của `grade.ts` sang CPU).
- **Tan theo giờ:** phần còn lại bằng 1 − u³, với u chạy từ `startHour` tới `clearsAt`. Ở trận thật: 7:00 còn 89%, 7:45 còn 76%, 9:00 còn 37%, hết lúc 9:45. Không có `clearsAt` thì giữ nguyên tới hết trận.
- **Bầu trời:** khi camera ở trong sương, bầu trời cũng mờ dần về phía chân trời.
- **Suy ra từ đồng hồ trận:** giờ lấy từ `hourAt`, độ trôi lấy từ `BattleClock.seconds`. Tua tới đâu cũng ra cùng cảnh như khi phát tới đó; dừng phát thì sương đứng yên.
- **Không che giao diện:** nhãn và lớp phủ là HTML nên không bị sương che; mũi tên trên mặt đất cũng không bị sương phủ.
- **Mức chất lượng thấp:** vẽ sương y như mức cao, vì đo không thấy sương tốn đáng kể (mục "Số đo").
- **Cách truyền tham số:** các tham số của sương tới mọi vật liệu qua hai uniform là `Float32Array` gắn vào `ShaderLib`. `UniformsUtils.clone` chép mảng kiểu này theo tham chiếu, nên mọi vật liệu đọc chung một chỗ. Nếu một bản three.js sau này đổi cách chép, `installMist` cảnh báo trong console.

**5. Quân nấp**
- Luật ẩn nằm ở một chỗ, `unitState.ts` (`concealedKeys`, `concealedThrough`): khối ẩn trong giai đoạn đang diễn ra khi `concealed` ở cả hai mốc của giai đoạn đó; khối vắng mặt ở một giai đoạn giữ trạng thái cũ. `UnitTrack.hiddenAt` trong cảnh, thẻ khối và danh sách khối đều dùng luật này.
- Lúc ẩn: vẫn vẽ lính, không có mảng màu phe, không có nhãn tên. Bấm vào khối vẫn mở thẻ; dòng "Đang làm gì" ghi "Đang nấp, địch chưa thấy". Trong tab "Thông tin trận", khối đang ẩn có chữ "đang nấp" mờ cạnh tên.
- Khoá mới: `battle.card.hidden` và `battle.info.units.hidden`, có cả `en` lẫn `vi`.

**6. Sửa theo mục 8**
- **Lưới chính sáng hơn vùng xa:** vùng xa tô màu đồi (cây bụi, rừng) theo độ cao tuyệt đối. Trasimene cao 250 m trở lên nên cả đồng bằng ở vùng xa thành đồi sẫm. Giờ độ cao tính từ đất thấp của trận. Đất thấp của Cannae là 0 m nên Cannae không đổi.
  - Lưới chính cũng nhận cùng màu đồi đó, và ít màu đá hơn trên đồi. Lưới 30 m có dốc gắt hơn lưới 400 m nên trước đây đồi trong lưới chính xám đá hẳn.
  - 12 ô (360 m) ở mép lưới chính được nắn dần cho khớp với vùng xa, chỉ trên đất liền; bờ biển và bờ hồ giữ nguyên. Trước đó dải nối giữa hai lưới dựng đứng thành "bức tường" sọc trên đồi (ảnh `sua-anh-09/3`, `4`).
- **Vệt nâu ở chân trời:** đó là màu "đất dưới chân trời" của vòm trời, lộ ra ở chỗ vùng xa hết (cách 54 km), giữa đồi xa và trời. Cannae cũng có vệt này khi nhìn từ trên cao. Sửa bằng hai việc:
  - nối thêm ra ngoài vùng xa một dải đất có hai vòng đỉnh, ở 4 km và 60 km (tới gần mặt phẳng cắt xa 120 km của camera). Mỗi đỉnh lấy trung bình mép vùng xa dọc cạnh đó, nên không thành vệt sọc;
  - bầu trời dưới chân trời lấy màu mù xa.

### Số đo

Máy là laptop RTX 3050, Chrome không cửa sổ (ANGLE D3D11), khung 1280×800. Mỗi số là khung hình/giây trong 5 giây, có đọc lại một điểm ảnh sau mỗi khung để khung nào cũng phải vẽ xong. **Godot chạy suốt mọi lần đo, Blender không chạy** (kiểm tra bằng `tasklist` trước và sau mỗi lần).

**Cannae, `main` (`fa02a05`) so với nhánh (`f1ad18a`)**: bản production, mở trận từ panel sự kiện. Đo xen kẽ 5 lượt theo thứ tự A-B, A-B, B-A, A-B, B-A.

| Lúc đo | `main` (trung bình) | Nhánh (trung bình) | Dao động giữa các lượt |
|---|---|---|---|
| Góc mở, dừng | 104,7 | 103,6 | 101–107 |
| Phát giai đoạn 1 | 66,7 | 67,4 | 64–68 |
| Phát giai đoạn 3 | 66,7 | 66,4 | 64–67 |
| Phát giai đoạn 4 | 63,2 | 62,3 (63,0 nếu bỏ một lượt 59,3) | 59–64 |

Chênh lệch nằm trong độ dao động: Cannae không chậm hơn `main`.

**Trasimene, trận thử với `?stress=`**: `/battle-lab`, server dev, khung 1280×753. Góc mở chụp lúc 5:00 (sương 0,8, dày nhất) và 6:15.

| Lúc đo | 3 840 hình lính | 6 720 hình lính |
|---|---|---|
| Góc mở 5:00 | 113,6 | 94,3 |
| Góc mở 6:15 | 111,9 | 91,8 |
| Phát giai đoạn 1 | 85,4 | 58,4 |
| Phát giai đoạn 3 | 84,3 | 60,5 |
| Góc thấp trong sương | 105,4 | 83,8 |

**Trasimene, file trận của lane 2** (3 750 hình lính lúc đầu): góc mở lúc 5:00 và 6:15 đạt 73–76; phát giai đoạn 1 đạt 58,5, giai đoạn 3 đạt 56,4, giai đoạn 5 đạt 58,1.
- Đo bật và tắt sương ngay trong cùng một lần chạy, mỗi bên hai lần: góc mở 72,5 và 66,3 có sương, 67,2 và 69,8 không sương; lúc phát 57,5 và 59,1 có sương, 59,7 và 59,1 không sương. Không thấy khác biệt đo được.
- Trận này chậm hơn trận thử vì có nhiều cây, lều, nhà hơn.

### Kiểm tra

- `npm run validate`, `npm run lint`, `npm run build` đều qua.
- Hồi quy lõi (`main-tools/reg-core.js`, chép sang cổng 9364, bản production, `TUTOR_MOCK=1`): qua cả 17 mục, không có lỗi console hay request hỏng.
- **Cannae không đổi:** so từng điểm ảnh cùng một góc, trước và sau phần sửa ở mục 6 (`T-053/tools/imgdiff.py`).
  - Chỉ dải trên cùng đổi, tức đúng chỗ vệt nâu ở chân trời đã sửa.
  - Phần còn lại dưới 3% số điểm ảnh: cây đung đưa theo thời gian thật, và một chút ở dải mép lưới đã nắn.

### Ảnh duyệt

Tất cả ở `E:\World_History_Platform_assets\duyet\T-053\`.
- `dung-som\`: bộ ảnh đợt dừng sớm, chụp trên trận thử.
- `01`–`04`: cùng một góc lúc 5:00, 7:00, 9:00 và 10:00, thấy sương tan dần.
- `05`–`06`: hồ và đảo nhìn từ đồng bằng, lúc 7:00 (đảo nhô lên trên sương) và 10:00.
- `07`–`08`: khối phục kích lúc ẩn (5:45) và lúc lộ ra (6:10).
- `09`–`10`: bộ binh và kỵ binh lội nước cận cảnh.
- `11`: mức chất lượng thấp lúc 6:15, vẫn có sương.
- `12`–`13`: thẻ khối và danh sách khối của khối đang nấp, trong khung xem trận của app.
- `sua-anh-09\`: trước và sau phần sửa ở mục 6.
  - 1–2: góc của ảnh 09 cũ.
  - 3–4: mép lưới chính nhìn từ trên cao. Ảnh 3 chụp sau khi sửa màu vùng xa, trước khi nắn mép lưới.
  - 5–8: Cannae nhìn xa, hai hướng.

`01`–`13` chụp trên file trận của lane 2. Script chụp, đo và so ảnh nằm ở `E:\World_History_Platform_assets\T-053\tools\` (`s-look.mjs`, `s-lab53.mjs`, `s-perf53.mjs`, `s-card.mjs`, `imgdiff.py`). Driver chụp đặt `PORT=9364`.

### Còn lại khi phiên chính báo T-052 đã gộp

1. `git revert c2dca86` (commit `TEMP:`), rồi `git merge main`.
2. Chạy lại `validate`, `lint`, `build`.
3. Đo lại hiệu năng trên trận thật, và chụp lại `01`–`13` với đúng các góc camera đã dùng (ghi trong lời gọi `s-look.mjs`). Nếu file trận thật không khác `782e115` thì số đo và ảnh sẽ như trên.

### Đề nghị

**Cho phiên chính:**
- `docs/ARCHITECTURE.md`, mục "Hồ" và "Sương mù": bỏ câu "Cảnh chưa vẽ…" và ghi cách cảnh vẽ (mục 2–4 ở trên).
- `docs/ARCHITECTURE.md`, mục "Vùng xa": thêm dải đất nối thêm, vòng ngoài cùng, màu đồi tính từ đất thấp, và dải mép lưới chính được nắn.
- Không cần đổi hợp đồng `src/lib/battle.ts`.

**Cho hộp thoại Giới thiệu ở chặng 3** (đề nghị lời, tự viết):
- *Sương mù:* "Polybius và Livy đều kể sáng hôm ấy có sương dày, bốc lên từ hồ, dày hơn ở đồng bằng so với trên đồi. Cảnh vẽ đúng như vậy: sương dày nhất ở mặt hồ, mỏng dần lên đồi, rồi tan khi trận đã ngã ngũ. Sương dày bao nhiêu, tan nhanh hay chậm và các đám sương trôi theo gió là giả định của cảnh."
- *Hồ:* "Bờ hồ là bờ ngày nay, theo dữ liệu vệ tinh Copernicus; thời La Mã nước hồ có lẽ thấp hơn một chút. Đáy hồ trong cảnh sâu thêm 1 cm cho mỗi mét cách bờ, nên người bị dồn xuống nước ngập tới vai ở khoảng 150 m. Polybius và Livy kể có người ngập tới cổ; độ dốc của đáy là giả định."
- *Quân nấp:* "Khối quân đang phục kích vẫn được vẽ để người xem thấy chỗ nấp, nhưng không có tên và màu phe cho tới lúc lao xuống. Chỗ nấp cụ thể của từng toán là phỏng dựng."
