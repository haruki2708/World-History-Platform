# T-018: Cảnh 3D: góc nhìn đầu, nhãn địa danh, danh sách mô hình, vật liệu kim loại

- **Lane:** 3
- **Model đề xuất:** Fable 5.2, effort `high`.
- **Nhánh:** `lane3/T-018-battle-scene-polish` (tạo từ `main` mới nhất)
- **Phạm vi file:** `src/components/battle/`, khoá `battle.scene.*` trong `src/lib/i18n/messages.ts`

## Bối cảnh

T-014, T-015, T-016 đã gộp vào `main`. Cảnh 3D giờ có dữ liệu Cannae thật (22 khối quân, 6 giai đoạn, địa hình 341×271) và mô hình lính La Mã thật (`public/battles/models/roman-legionary.glb`). Phiên chính đã thử cả ba cùng nhau: engine dùng mô hình thật mà không phải sửa code, khoảng 180–200 khung hình/giây trên RTX 3050. Task này sửa những gì review tìm thấy và chuẩn bị cho đợt B.

## Đọc trước

- `docs/ARCHITECTURE.md`, mục "Mô hình lính" (mới cập nhật: danh sách mô hình, ảnh độ nhám và kim loại, không có chuyển động gốc, tư thế gốc).
- `src/lib/battle.ts`: thêm `MODEL_INDEX_URL`, `ModelIndex`, `Battle.dayOfYear`.
- `art/README.md`, mục "Ghi chú cho cảnh 3D (lane 3)" do lane 1 viết.

## Yêu cầu

1. **Danh sách mô hình.** Đọc `MODEL_INDEX_URL` (`public/battles/models/index.json`) trước, rồi chỉ tải các mô hình có trong danh sách. Thiếu file danh sách hoặc file sai thì vẽ hình tạm cho mọi loại lính, không tải thử từng file. Kết quả: `/battle-lab` với Cannae không còn dòng 404 nào trong console.
2. **Góc nhìn khi mở cảnh.** Hiện engine bao trọn mọi vị trí trong cả ngày, gồm các trại và kỵ binh Numidia đuổi xa 6 km, nên hai chiến tuyến chỉ chiếm một mảng nhỏ giữa màn hình.
   - Mở vào vùng quân chủ lực đang đứng ở `battleTime` hiện tại. Bỏ qua các khối ở quá xa phần còn lại, ví dụ toán quân giữ trại.
   - Với Cannae ở 1280×800, hai chiến tuyến lúc dàn trận phải chiếm phần lớn bề ngang khung hình.
   - Lane tự chọn cách tính; ghi lại trong mục "Kết quả".
3. **Nhãn địa danh không đè nhau.** Ví dụ ở góc nhìn toàn cảnh Cannae: "Large Roman camp", "Roman crossing" và "Small Roman camp" chồng lên nhau. Áp dụng cho cả nhãn sông. Nhãn nào không có chỗ thì ẩn, hoặc dịch sang chỗ khác, miễn đọc được.
4. **Ngày trong năm.** Có `battle.dayOfYear` thì dùng để tính đường đi của mặt trời. Không có thì giữ cách hiện tại.
5. **Ảnh pháp tuyến, ảnh độ nhám và kim loại.**
   - File `.glb` của lính La Mã đã có ảnh pháp tuyến 1024×1024; đợt B sẽ thêm ảnh độ nhám và kim loại.
   - Ở chất lượng cao, dùng các ảnh này nếu file có, ít nhất cho LOD0, để mũ đồng và giáp trông như kim loại.
   - Chất lượng thấp giữ vật liệu đơn giản.
   - Vẫn phải đạt mục tiêu hiệu năng của T-015 (`?stress=7000` từ 50 khung hình/giây). Đo lại và ghi số.
   - Muốn thử ảnh độ nhám và kim loại khi lane 1 chưa xuất: thêm vào `tools/make-test-model.mjs`.
6. **Ảnh cận cảnh cho người dùng.** Lần review trước chưa chụp được mô hình thật ở LOD0 trong cảnh. Chụp:
   - một khối lính La Mã ở LOD0 và một ở LOD1, đang chơi `idle` và `attack`;
   - lúc trưa và lúc chiều tối;
   - trước và sau việc 5.

   Để ảnh ngoài repo, ghi đường dẫn trong "Kết quả".

## Ràng buộc

- Như T-015: chỉ dùng three.js đã cài; three.js chỉ nạp trong `src/components/battle/`; không sửa `src/lib/`, `src/store/`, `src/data/`, `src/app/`, `public/`. Hợp đồng chưa đủ thì ghi đề nghị.
- Lane 1 có thể đang chạy Blender. Khi đo hiệu năng, làm như T-015: kiểm tra `blender.exe` và ghi điều kiện đo.

## Xong khi

- `/battle-lab` với Cannae:
  - console sạch;
  - mở cảnh thấy rõ hai chiến tuyến;
  - nhãn địa danh không đè nhau.
- `?stress=7000&stats=1` vẫn đạt mục tiêu, có số đo mới.
- `npm run lint` và `npm run build` qua.

## Kết quả

Lane 3, 2026-11-16. Nhánh `lane3/T-018-battle-scene-polish`, chưa gộp.

**Tóm tắt:** xong cả 6 việc. `/battle-lab` với Cannae: console không còn dòng nào (trước có 9 dòng 404); lúc dàn trận hai chiến tuyến kéo khoảng 92% bề ngang khung hình (trước khoảng 22%); nhãn địa danh không đè nhau. `?stress=7000` trên RTX 3050: 160 khung hình/giây khi đứng yên, 96 khi đang phát; trường hợp xấu nhất (mọi loại lính dùng mô hình ở trần hợp đồng, có ảnh pháp tuyến và kim loại) 119 và 80. `npm run lint`, `npm run build`, `npm run validate` qua.

Có một chỗ tôi hiểu yêu cầu khác chữ của task: góc nhìn mở theo vị trí lúc **kết thúc giai đoạn đang diễn ra**, không đúng `battleTime`. Lý do ở việc 2; đổi lại chỉ cần sửa một dòng.

### Đã làm

Mọi thứ nằm trong `src/components/battle/`. Không thêm khoá i18n nào.

| File | Việc |
|---|---|
| `engine/figures/loader.ts` | Đọc danh sách mô hình; lấy ảnh pháp tuyến, ảnh độ nhám và kim loại của file. |
| `engine/figures/model.ts` | Giữ tiếp tuyến của file; chọn dấu của `normalScale`. |
| `engine/figures/material.ts` | Vật liệu chi tiết (PBR) bên cạnh vật liệu đơn giản; phản chiếu bầu trời. |
| `engine/units.ts` | Mỗi lô chọn vật liệu theo chất lượng; tạo lưới để biên dịch shader trước. |
| `engine/framing.ts` (mới) | Chọn khối quân chủ lực, tính góc nhìn mở. |
| `engine/sky.ts` | Độ nghiêng mặt trời theo `dayOfYear`; màu bầu trời cho phản chiếu. |
| `engine/BattleEngine.ts` | Nối các phần trên; biên dịch shader trước khi hiện cảnh. |
| `labelLayout.ts` (mới), `BattleScene.tsx` | Xếp nhãn không đè nhau. |
| `tools/make-test-model.mjs` | Thêm `--maps`. |

**1. Danh sách mô hình.** Engine đọc `MODEL_INDEX_URL` trước, rồi chỉ tải các mô hình có tên trong đó; các loại lính còn lại vẽ hình tạm.

- Danh sách thiếu (404), sai kiểu (không phải `{ models: string[] }`) hoặc không phải JSON: in một cảnh báo, vẽ hình tạm cho mọi loại lính, không tải file `.glb` nào.
- Mô hình có trong danh sách mà tải hỏng: in cảnh báo, dùng hình tạm.
- Đã thử cả bốn trường hợp và đọc danh sách request của trang. Bình thường chỉ có `index.json` và `roman-legionary.glb`. Ở chế độ dev, `index.json` được gọi hai lần vì React StrictMode dựng cảnh hai lần.

**2. Góc nhìn khi mở cảnh** (`engine/framing.ts`).

- **Thời điểm.** Engine lấy vị trí các khối lúc kết thúc giai đoạn đang diễn ra (`phaseAt(battleTime)`), không phải đúng `battleTime`.
  - Với Cannae, lúc 0 là các cột quân đang rời ba trại, trải rộng 4,7 km. Nếu khung theo lúc 0 thì tới lúc dàn trận hai chiến tuyến chỉ còn chiếm khoảng một nửa bề ngang, tức đúng lỗi task cần sửa. Hơn nữa lúc 0 chưa có chiến tuyến nào để thấy.
  - Mở ở lúc 0 thì khung là chỗ hai bên sẽ dàn trận. Quân La Mã đã ở mép trên; quân Carthage đi vào từ bên trái, theo các mũi tên của giai đoạn 1 (ảnh `view/after-0530-open.png`).
  - Ở đúng một mốc giai đoạn (1, 2, ...) hai cách cho cùng kết quả.
  - Muốn theo đúng chữ của task: trong `BattleEngine.frameView`, thay `phaseAt(this.battle, this.options.getTime())` bằng `this.options.getTime()`.
- **Chọn khối.** Hai khối cách nhau không quá 400 m, tính từ mép tới mép, thì thuộc một nhóm. Engine giữ nhóm nào có từ 15% số quân đang đứng trở lên, cộng nhóm lớn nhất của mỗi phe, để luôn thấy cả hai phe.
  - Lúc dàn trận: bỏ toán giữ trại lớn (10 000 người, cách chiến tuyến khoảng 800 m).
  - Lúc vòng vây khép: bỏ toán giữ trại, kỵ binh Numidia và kỵ binh đồng minh đang đuổi nhau cách vòng vây hơn 2 km, và tàn quân kỵ binh La Mã.
- **Hướng nhìn.** Camera nghiêng 52° như trước, nhìn từ phía nam, bắc ở phía trên giống bản đồ. Engine chỉ quay sang một hướng chính khác khi hướng đó cho camera gần hơn ít nhất 20%. Ví dụ màn hình đứng 390px: chiến tuyến xoay dọc màn hình.
- **Khoảng cách.** Tính thẳng từ các góc của mọi khối được giữ, bằng cách giải các mặt phẳng của khung nhìn, không dùng hình cầu bao như trước. Chiều rộng của các khối lấp 92% bề ngang, chiều cao tối đa 80%.
- **Kết quả với Cannae ở 1280×800** (khung vẽ 1280×760 vì trang thử có thanh tua): lúc 08:00 hai chiến tuyến, kể cả kỵ binh hai cánh, trải từ x ≈ 50 tới x ≈ 1230 px.

**3. Nhãn địa danh** (`labelLayout.ts`, không dùng three.js hay DOM; `BattleScene.tsx` đo nhãn và gắn vị trí).

- **Thứ tự ưu tiên:** thành, sông, trại, đồi, chỗ lội, còn lại. Cùng loại thì theo thứ tự trong dữ liệu.
- **Địa danh** có một chấm nhỏ đánh dấu đúng chỗ. Chữ thử lần lượt phía trên, dưới, phải, trái của chấm.
- **Sông:** tên nằm trên dòng sông. Engine thử 7 điểm dọc sông, điểm giữa trước, nên tên sông vẫn hiện khi điểm giữa ra ngoài khung.
- **Không có chỗ** (đè nhãn hay chấm khác, hoặc tràn khung) thì nhãn ẩn.
- **Không nhảy khi kéo camera:** mỗi nhãn thử lại chỗ của khung hình trước trước tiên.
- **Chi phí:** kích thước nhãn đo bằng `ResizeObserver` (đổi ngôn ngữ thì tự đo lại), không đo ở mỗi khung hình. Style chỉ được ghi khi vị trí đổi.
- **Đã xem:** góc nhìn mở, lúc dàn trận, lùi xa toàn cảnh (tiếng Anh và tiếng Việt), bề ngang 390px.

**4. Ngày trong năm.** `solarDeclination(dayOfYear)` trong `sky.ts`, sai số dưới 1°. Không có `dayOfYear`, hoặc số nằm ngoài 1–366, thì giữ +14° như cũ.

- Đã kiểm tra độ cao mặt trời lúc giữa trưa ở vĩ độ Cannae: 72,1° ngày 172 (hạ chí), 25,2° ngày 355 (đông chí), 47,7° ngày 79 (xuân phân).
- Dữ liệu Cannae hiện chưa có `dayOfYear`, nên cảnh Cannae chưa đổi.

**5. Ảnh pháp tuyến, ảnh độ nhám và kim loại.**

- **Vật liệu chi tiết.** `MeshStandardMaterial`, dùng chung phần skinning trong vertex shader với vật liệu đơn giản. Có ảnh pháp tuyến, ảnh độ nhám và kim loại (kênh G và B của glTF), và hệ số độ nhám, kim loại của file.
- **Phản chiếu.** Cảnh không có env map. Phản chiếu lấy dải màu của chính vòm trời (đỉnh, chân trời, mặt đất) theo hướng tia phản xạ, và mờ dần theo độ nhám; màu đổi theo giờ cùng bầu trời. Nhờ vậy kim loại bóng có nửa trên sáng màu trời, nửa dưới màu đất, cộng đốm sáng mặt trời.
  - Lần thử đầu tôi lấy màu của đèn bán cầu chia π. Kim loại tối như sơn nâu, nên bỏ cách đó.
- **Tiếp tuyến.** Nếu mọi LOD của file có `TANGENT` thì engine dùng; lính La Mã của lane 1 có. Thiếu thì shader tự tính từ uv và đảo dấu y của `normalScale`, như GLTFLoader làm.
- **Chất lượng cao dùng vật liệu chi tiết cho cả ba LOD;** chất lượng thấp giữ vật liệu Lambert như cũ.
  - Lý do: tôi đã thử chỉ LOD0, rồi LOD0 và LOD1. Kim loại ở vật liệu chi tiết có màu xám ánh trời, còn ở vật liệu đơn giản thì vàng nâu, nên mỗi khi một lô đổi LOD thì thấy đổi màu.
  - Đo cả ba cách trên cùng góc nhìn: chênh nhau trong mức nhiễu, dưới 10%.
  - Với mô hình thật hiện nay (độ nhám 0,72, không kim loại), hai vật liệu trông gần như nhau.
- **Biên dịch shader trước** (`compileAsync`) trong lúc còn hiện "Đang tải cảnh", để lần phóng gần đầu tiên không bị khựng.
- **`tools/make-test-model.mjs --maps`** thêm hai ảnh 1024×1024:
  - ảnh pháp tuyến: vòng giáp lưới ở thân, đường may ở tay chân;
  - ảnh độ nhám và kim loại: đầu là kim loại bóng (độ nhám 0,3), thân là kim loại nhám (0,5), tay chân không kim loại.
  - Lưới không có tiếp tuyến, để thử nhánh còn lại của engine.

**6. Ảnh cận cảnh.** Để ở `E:\World_History_Platform_assets\T-018\` (22 MB, ngoài repo).

| Thư mục | Nội dung |
|---|---|
| `closeup-before\`, `closeup-after\` | Lính La Mã thật, cùng góc máy trước và sau việc 5. `noon-*`: 12:00 (giai đoạn 5). `eve-*`: 17:00, giờ muộn nhất của dữ liệu. `lod0`, `lod1`: khối ở LOD0 hoặc LOD1. `attack`: mặt trước một khối đang đánh (hàng đầu chơi `attack`, phía sau `idle`). `idle`: sau lưng khối principes đang đánh (12:00), hoặc toán giữ trại đang rút, đứng yên vì đồng hồ dừng (17:00). |
| `metal-before\`, `metal-after\` | Mô hình thử `--maps`, đặt tạm làm `roman-velites`: cách kim loại hiện ra khi file có ảnh độ nhám và kim loại. "Trước" là engine trước task này. |
| `view\` | Góc nhìn mở và nhãn: trước và sau lúc dàn trận, mở lúc 05:30, lùi xa (tiếng Anh, tiếng Việt), bề ngang 390px, nhiều LOD cùng lúc ở 12:00. |
| `tools\` | Script chụp và đo (Chrome headless qua DevTools Protocol) và mô hình thử có ảnh. |

Nhận xét về ảnh:

- Mô hình thật hiện chỉ có ảnh pháp tuyến. Ảnh "sau" khác "trước" ở chỗ: thấy gờ giữa và núm khiên, vòng giáp lưới ở vai, mặt khiên hơi bóng. Mũ vẫn như cũ vì file ghi kim loại bằng 0; khi lane 1 xuất ảnh kim loại thì mũ sẽ như đầu hình nộm trong `metal-after\`.
- Hai ảnh `eve-lod*-idle` có cả một lô LOD0 và một lô LOD1, vì toán giữ trại (400 hình) chia làm hai lô.
- "Chiều tối" chỉ là 17:00, lúc mặt trời còn cao khoảng 20°: dữ liệu kết thúc ở đó. Ánh sáng thấp thì xem ảnh 05:30.

### Đã kiểm tra

- `/battle-lab` với Cannae, Chrome headless trên RTX 3050: console trống. Đã xem các ảnh ở trên.
- Bốn trường hợp của danh sách mô hình (việc 1).
- Mở cảnh lúc 0 và lúc 1; lùi xa; tiếng Việt (`?lang=vi`); bề ngang 390px không cuộn ngang.
- `npm run lint`, `npm run build`, `npm run validate` qua.
- Sau khi thử, đã trả `public/battles/models/` về đúng như repo (`git status` sạch).

### Số đo hiệu năng

**Điều kiện đo.** Như T-015.

- `/battle-lab?stats=1&stress=7000`, khung vẽ 1280×800, pixel ratio 1, `npm run dev`, chất lượng cao.
- Chrome headless không giới hạn khung hình. Sau mỗi khung hình đọc lại một điểm ảnh, để GPU phải vẽ xong. Mỗi số là trung bình 6 giây.
- Script kiểm tra `blender.exe` và Godot ngay trước và ngay sau từng cửa sổ đo. Blender của lane 1 bật tắt nhiều lần trong buổi; các số dưới đây đều đo lúc nó không chạy.
- Ngày 2026-11-16, 20:49 đến 21:10.
- "Toàn cảnh" là góc nhìn mở, cả 7 000 hình trong khung. "Gần" là camera cách 140 m, cao 20°, nhìn hàng đầu quân La Mã: 940 đến 1 500 hình trong khung, đa số ở LOD1, có lô LOD0.

**RTX 3050, khung hình/giây:**

| Mô hình | Toàn cảnh, đứng yên | Toàn cảnh, đang phát | Gần, đứng yên | Gần, đang phát |
|---|---|---|---|---|
| Như repo: lính La Mã thật, còn lại hình tạm | 160 | 96 | 132 | 79 |
| Xấu nhất: mọi loại lính dùng mô hình thử ở trần hợp đồng, có ảnh pháp tuyến và kim loại | 119 | 80 | 116 | 74 |

- **So với mã trước task**, đo cùng buổi, cùng góc nhìn, mô hình như repo: 146 khi đứng yên và 88 khi đang phát, tức không chậm hơn.
- Các số thấp hơn T-015 (192 và 116) cũng thấp như vậy với mã cũ đo hôm nay, nên phần chênh không do task này. Tôi chưa tìm ra nguyên nhân.

**AMD Radeon tích hợp, mô hình như repo:**

- Chất lượng cao: 51 đến 54 khi đứng yên, 36,5 đến 40 khi đang phát (3 lượt). Mã trước task đo cùng lúc: 58 và 34,5.
- Chất lượng thấp: 80 và 62.
- Ở chất lượng cao vẫn trên ngưỡng 30 khung hình/giây, nên engine không tự hạ chất lượng.

### Giới hạn

- **Nhãn có thể nằm dưới** nút chất lượng hoặc bảng số đo: phần xếp nhãn chưa tránh các lớp phủ.
- **Phản chiếu chỉ có dải màu trời.** Mặt kim loại không phản chiếu lính bên cạnh hay đồi.
- **Mặt trời theo `dayOfYear`** không tính phương trình thời gian: giờ trong dữ liệu được coi là giờ mặt trời tại chỗ.
- **Vật liệu chi tiết ở LOD2** dùng chung ảnh của file. Nếu ảnh pháp tuyến chỉ nướng cho LOD0 thì ở LOD2 bóng có thể lệch nhẹ; hình dưới 32px nên khó thấy.
- **Biên dịch shader trước** làm lần tải đầu lâu thêm một chút. Tôi chưa đo riêng phần này.

### Đề nghị ngoài phạm vi

1. **Góc nhìn mở:** phiên chính chọn giữa "kết thúc giai đoạn đang diễn ra" (hiện tại) và "đúng `battleTime`" (xem việc 2).
2. **Cho lane 1, khi xuất ảnh kim loại (đợt B):**
   - Theo cách làm kim loại của glTF, màu gốc ở chỗ kim loại chính là màu phản xạ, nên thường sáng hơn ảnh màu hiện nay. Bảng tham khảo thường ghi sắt khoảng sRGB (196, 197, 199) và đồng đỏ khoảng (250, 209, 194); đồng thau nằm giữa đồng đỏ và vàng. Nếu giữ màu tối như ảnh màu hiện nay, mũ sẽ trông xỉn.
   - Đồng bóng nên để độ nhám khoảng 0,3 đến 0,45, giáp lưới khoảng 0,5 đến 0,6.
   - Nên giữ `TANGENT` như hiện nay.
3. **`.gitattributes`** (nhắc lại đề nghị ở T-015): repo vẫn để `core.autocrlf=true`, nên file vừa ghi bằng LF, `git checkout` xong lại thành CRLF, và script sửa file theo mẫu dễ trượt. Một dòng `* text=auto eol=lf` sẽ hết.

### Cách chạy lại

```
npm run dev -- -p 3103          # /battle-lab, /battle-lab?stats=1&stress=7000
node src/components/battle/tools/make-test-model.mjs public/battles/models/roman-velites.glb --maps
```

Muốn thấy mô hình thử thì thêm `"roman-velites"` vào `public/battles/models/index.json`. Thử xong thì xoá file `.glb` và trả `index.json` về như cũ: thư mục đó là của lane 1, và `npm run validate` kiểm tra danh sách khớp với các file.
