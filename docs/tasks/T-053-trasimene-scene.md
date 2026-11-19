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

## Ràng buộc

- Ngoài phạm vi trên, không sửa file của người khác. Cần đổi hợp đồng (`src/lib/battle.ts`) thì ghi đề nghị vào "Kết quả".
- Không chép dữ liệu trận thật vào code: cảnh đọc mọi thứ từ file trận.
- `npm run validate`, `npm run lint`, `npm run build` phải qua; hồi quy lõi (`main-tools`, như các lần trước) không hỏng.

## Xong khi

- Trận Trasimene thật (sau T-052) có mặt hồ, đảo, lính lội nước, sương mù tan theo giờ, khối phục kích ẩn rồi lộ ra.
- Từ 50 khung hình/giây; Cannae không chậm hơn `main`.
- Nhánh không còn file trận thử; có ảnh duyệt; mục "Kết quả" đã điền (cách làm, số đo, đề nghị cho hộp thoại Giới thiệu ở chặng 3).

## Kết quả

(Lane 3 điền khi xong.)
