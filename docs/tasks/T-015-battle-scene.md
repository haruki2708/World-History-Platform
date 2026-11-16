# T-015: Cảnh trận đánh 3D (three.js)

- **Lane:** 3
- **Model đề xuất:** Fable 5.2, effort `high`.
- **Nhánh:** `lane3/T-015-battle-scene` (đã tạo sẵn từ `main`)
- **Phạm vi file:** `src/components/battle/`, khoá `battle.scene.*` trong `src/lib/i18n/messages.ts`

## Mục tiêu

Dựng engine cho cảnh trận đánh 3D. Engine vẽ chiến trường từ dữ liệu, và chứng minh vẽ được **khoảng 7 000 hình lính có hoạt hình** chạy mượt trên máy của người dùng.

Đây là đợt A. Engine chạy với **hình lính tạm** và **dữ liệu tạm**, vì mô hình thật (lane 1, T-014) và dữ liệu trận thật (lane 2, T-016) đang làm song song. Engine phải tự nhận mô hình và dữ liệu thật ngay khi chúng có mặt, không cần sửa code.

## Đọc trước

- `docs/ARCHITECTURE.md`, mục "Trận đánh 3D": dữ liệu, toạ độ, thời gian, địa hình, mô hình lính, cảnh 3D, trang thử.
- `src/lib/battle.ts`: toàn bộ hợp đồng, gồm `BattleSceneProps`, `phaseAt`, `hourAt`, `MEN_PER_FIGURE`, `UNIT_CLIPS`, `UNIT_LODS`.
- `src/app/battle-lab/BattleLab.tsx`: trang thử dùng component của lane thế nào.
- `src/store/useAppStore.ts`: `battleId`, `battleTime`.

## Hiện trạng

- three.js 0.187.0 và `@types/three` 0.187.0 đã cài. Các addon (`GLTFLoader`, `OrbitControls`…) dùng qua `three/addons/...`.
- `src/components/battle/BattleScene.tsx` hiện chỉ là chỗ giữ chỗ. Lane thay bằng engine thật, **giữ nguyên tên export `BattleScene` và props `BattleSceneProps`**.
- **Trang thử:** `npm run dev`, mở `http://localhost:3000/battle-lab`. Có `?stats=1` và `?stress=<số hình>`, xem `ARCHITECTURE.md`.
- **Dữ liệu tạm:** `src/data/battles/battle-of-cannae.json` có 2 đơn vị và 1 giai đoạn; địa hình là một lưới phẳng 64×48. Lane 2 sẽ thay bằng dữ liệu thật trong T-016.
- **Mô hình thật đầu tiên** sẽ là `public/battles/models/roman-legionary.glb` (lane 1, T-014). Hiện chưa có.

## Yêu cầu

1. **Khung cảnh.**
   - Renderer, camera, ánh sáng, vòng lặp vẽ.
   - Tự co giãn theo khung chứa. Giới hạn pixel ratio cho máy yếu.
   - **Giải phóng sạch khi đóng** (geometry, material, texture, WebGL context); mở và đóng nhiều lần không rò bộ nhớ.
2. **Địa hình.**
   - Dựng mặt đất từ lưới độ cao theo `BattleTerrain`: Int16 little-endian, decimet, hàng từ bắc xuống nam.
   - Tô màu theo độ cao và độ dốc, kiểu tự nhiên; không cần ảnh vệ tinh.
   - Vẽ mặt nước sông theo `rivers`, và đánh dấu nhẹ các địa danh trong `landmarks`.
3. **Bầu trời và ánh sáng theo giờ.**
   - Lấy giờ từ `hourAt(battle, battleTime)`.
   - Mặt trời đổi hướng và màu từ bình minh, trưa tới hoàng hôn, có bóng đổ.
   - Hỗ trợ cả đêm (trăng hoặc ánh sáng mờ) cho các trận sau. Cannae chỉ diễn ra ban ngày.
4. **Hình lính hàng loạt.**
   - Vẽ theo lô (instancing). Cách làm hoạt hình do lane chọn, ví dụ "nướng" hoạt hình vào ảnh (vertex animation texture) để card đồ hoạ tự tính, miễn đạt mục tiêu hiệu năng.
   - Nhận **mọi file `.glb` đúng hợp đồng**: một khung xương, các lưới `LOD0..2`, các hoạt hình theo `UNIT_CLIPS`.
   - Mỗi hình lính lệch pha hoạt hình một chút để đám đông không cử động đồng loạt.
   - Thiếu file mô hình thì dùng **hình tạm** có hoạt hình đơn giản, theo màu của phe (lấy từ `polities.json` qua `polityId`). Hình tạm cũng phải đi qua đúng đường vẽ hàng loạt, để chứng minh hiệu năng trước khi có mô hình thật.
   - Mức chi tiết chọn theo khoảng cách, **cho từng khối quân** chứ không cho từng hình.
5. **Đội hình và chuyển động.**
   - Xếp hình lính trong khung `frontage × depth`, quay theo `facing`. `bulge` uốn cong hàng đầu (lưỡi liềm của Hannibal). Thêm chút lệch ngẫu nhiên nhưng cố định theo hạt giống, để mỗi lần mở cảnh ra cùng một kết quả.
   - Nội suy vị trí giữa hai mốc theo `battleTime`. Chọn hoạt hình theo `action`.
   - Khi `men` giảm, số hình giảm theo (`MEN_PER_FIGURE`): hình mất đi chơi `die` nếu có, còn không thì biến mất.
6. **Mũi tên** di chuyển của giai đoạn đang diễn ra, vẽ trên mặt đất theo màu phe.
7. **Camera.**
   - Xoay, lia, phóng; không chui xuống dưới đất.
   - Mở cảnh thì khung hình bao quát toàn trận.
8. **Chất lượng và đo đạc.**
   - Hai mức chất lượng (cao và thấp); tự hạ mức khi khung hình/giây thấp kéo dài.
   - Với `debug.showStats`: hiện khung hình/giây, số hình lính, số lệnh vẽ.
   - Với `debug.stressFigures`: thay quân của trận bằng một đám đông tổng hợp bằng đúng số hình đó.
9. **Chuỗi giao diện** (nếu có, ví dụ "Đang tải cảnh…") qua `useT()`, khoá `battle.scene.*`, đủ cả `en` lẫn `vi`.

## Mục tiêu hiệu năng

- `?stress=7000`: **từ 50 khung hình/giây** ở 1280×800, chất lượng cao, trên laptop của người dùng (GPU NVIDIA RTX 3050 Laptop). Ghi số đo thật vào mục "Kết quả".
- Chất lượng thấp chạy được trên GPU tích hợp. Máy có sẵn AMD Radeon tích hợp; nếu đo được thì ghi lại.
- **Lưu ý:** Edge hay Chrome chạy headless mặc định vẽ bằng CPU (SwiftShader), nên số khung hình/giây đo kiểu đó không đại diện. Phải đo trên GPU thật. Nếu cần mở cửa sổ trình duyệt trên màn hình người dùng thì báo trước.

## Ràng buộc

- Chỉ dùng three.js đã cài. Cần thư viện khác (ví dụ bộ giải nén cho `.glb` nén) thì ghi đề nghị vào mục "Kết quả", không tự cài.
- Không sửa `src/lib/`, `src/store/`, `src/data/`, `src/app/`. Hợp đồng chưa đủ dùng thì ghi đề nghị vào mục "Kết quả".
- three.js chỉ được nạp trong `src/components/battle/`, và chỉ qua trang dùng `next/dynamic` với `ssr: false`; không được để three.js lọt vào gói của trang chính. Kiểm tra bằng build: trang `/` không được kéo three.js theo.

## Xong khi

- `/battle-lab` vẽ được dữ liệu tạm: địa hình, hai khối quân, mũi tên. Tua và phát chạy đúng, ánh sáng đổi theo giờ.
- `/battle-lab?stress=7000&stats=1` đạt mục tiêu hiệu năng, có số đo.
- Khi có `public/battles/models/roman-legionary.glb` (thử bằng một file `.glb` đúng hợp đồng, kể cả tự tạo để thử), engine dùng mô hình đó thay hình tạm mà không phải sửa code.
- `npm run lint` và `npm run build` qua. Không có lỗi console.

## Kết quả

Lane 3, 2026-11-16. Nhánh `lane3/T-015-battle-scene`, chưa gộp.

**Tóm tắt:** engine vẽ được dữ liệu tạm, tự dùng file `.glb` đúng hợp đồng khi có, và đạt mục tiêu hiệu năng: `?stress=7000` ở 1280×800, chất lượng cao, trên RTX 3050 cho **192 khung hình/giây khi đứng yên và 116 khi đang phát**, với cả 7 000 hình dùng mô hình ở mức trần của hợp đồng. `npm run lint` và `npm run build` qua. Còn một điểm chưa đạt đúng chữ của task: mỗi mô hình chưa có file sinh một dòng 404 trong console (xem "Giới hạn").

### Đã làm

Mọi thứ nằm trong `src/components/battle/`; three.js chỉ được nạp ở đây.

| File | Việc |
|---|---|
| `BattleScene.tsx` | Component React: tạo và huỷ engine, lớp phủ (đang tải, lỗi, nút chất lượng, bảng số đo, nhãn địa danh). Giữ nguyên tên export và props. |
| `engine/BattleEngine.ts` | Renderer, camera, vòng lặp vẽ, hai mức chất lượng, tự hạ mức, giải phóng. |
| `engine/terrain.ts` | Mặt đất từ lưới độ cao, màu đất, mặt nước sông, hàm `heightAt`. |
| `engine/sky.ts` | Mặt trời, mặt trăng, bầu trời, sương mù, bóng đổ theo giờ. |
| `engine/figures/model.ts` | Nướng hoạt hình của một mô hình vào một ảnh ma trận xương. |
| `engine/figures/loader.ts` | Nạp `public/battles/models/<model>.glb`. |
| `engine/figures/placeholder.ts` | Hình tạm: bộ binh và kỵ binh, có khung xương và đủ 5 hoạt hình. |
| `engine/figures/material.ts` | Vật liệu vẽ theo lô, skinning trong vertex shader. |
| `engine/units.ts` | Khối quân, chia lô, chọn LOD, bóng đổ, vệt màu dưới chân khối. |
| `engine/timeline.ts` | Vị trí từng hình lính theo `battleTime`; ai ngã, lúc nào. Không dùng three.js. |
| `engine/arrows.ts`, `engine/stress.ts`, `engine/rng.ts` | Mũi tên; đám đông tổng hợp; số ngẫu nhiên có hạt giống. |
| `tools/make-test-model.mjs` | Tạo một file `.glb` thử đúng hợp đồng (xem "Đã kiểm tra"). |

Ngoài thư mục trên chỉ thêm 17 khoá `battle.scene.*` vào `src/lib/i18n/messages.ts`, đủ `en` và `vi`.

### Cách làm

- **Hoạt hình hàng loạt.** Khi nạp một mô hình, engine chạy từng hoạt hình ở 30 khung/giây và ghi ma trận của mọi xương vào một ảnh số thực (mỗi khung một hàng, mỗi xương ba điểm ảnh). Vertex shader đọc ảnh này và tự skinning, nên card đồ hoạ làm hết phần hoạt hình. Mỗi hình lính chỉ gửi 9 số: vị trí, hướng, hoạt hình đang chơi và một số ngẫu nhiên để lệch pha, lệch cỡ và lệch màu.
  - Chọn cách này thay cho ảnh vị trí đỉnh (VAT) vì ảnh nhỏ hơn nhiều và dùng chung cho cả ba LOD.
  - Chuyển giữa hai hoạt hình có pha trộn 0,35 giây.
- **Hình tạm đi đúng đường của mô hình thật.** Hình tạm được dựng thành lưới có xương và hoạt hình như một file `.glb`, rồi qua cùng bước nướng và cùng vật liệu.
- **Mô hình `.glb`.** Lưới được nhận theo tên `LOD0..2` (tên của lưới hoặc của nút cha). Hoạt hình được nhận theo tên trong `UNIT_CLIPS`, chấp nhận cả dạng `Armature|walk`.
  - Thiếu một LOD thì dùng LOD kề bên. Thiếu `run` thì dùng `walk`. Thiếu `die` thì hình ngã biến mất ngay.
  - Hoạt hình đi bộ có dịch chuyển gốc (root motion) được tự khử.
  - File nén meshopt đọc được, vì bộ giải nén có sẵn trong three.js.
- **Chia lô và LOD.** Mỗi khối quân chia thành các lô tối đa 256 hình đứng cạnh nhau; mỗi lô là một lệnh vẽ, có LOD và vùng bao riêng. LOD chọn theo chiều cao của hình trên màn hình: trên 110px là LOD0, trên 32px là LOD1. Nếu tổng tam giác vượt 2,5 triệu thì các lô xa nhất bị hạ LOD trước.
  - Đây là mức mịn hơn yêu cầu "cho từng khối quân": một khối rất lớn đứng sát camera không buộc cả khối lên LOD0.
- **Bóng đổ** của hình lính lấy từ lưới thô hơn lưới đang hiện (LOD0 đổ bóng bằng LOD1, còn lại bằng LOD2). Vùng bóng đổ bám theo điểm camera đang nhìn và rộng dần khi lùi ra.
- **Đội hình.** Ở mỗi mốc thời gian, các hình còn sống xếp theo hàng dọc trong khung `frontage × depth`; giữa hai mốc thì nội suy. Khi có hình ngã, các hình phía sau dồn lên, khối co dần theo bề ngang. Hàng đầu dễ ngã hơn. Mọi thứ ngẫu nhiên đều lấy từ hạt giống là id trận và id đơn vị.
  - Hình ngã chơi `die`, nằm 5 giây theo thời gian phát, rồi chìm xuống đất. Tua ngược thì hình đứng dậy lại, vì trạng thái chỉ phụ thuộc `battleTime`.
  - Khi `fight`, chỉ khoảng một phần ba phía trước chơi `attack`; phía sau đứng chờ.
  - Khi đồng hồ trận đứng yên, đơn vị đang `advance` hay `charge` chuyển sang `idle` thay vì đi tại chỗ.
- **Camera** dùng `MapControls`, giống bản đồ chính: kéo trái để lia, kéo phải để xoay, cuộn để phóng về phía con trỏ. Góc nghiêng tối đa 86°, camera luôn cao hơn mặt đất 3 m.
- **Hai mức chất lượng.**

  | | Cao | Thấp |
  |---|---|---|
  | Pixel ratio tối đa | 2 | 1 |
  | Bóng đổ | có, 2048×2048 | không |
  | LOD0 | từ 110px | không dùng |
  | Trần tam giác của hình lính | 2,5 triệu | 0,7 triệu |

  Dưới 30 khung hình/giây suốt 4 giây thì engine tự hạ xuống "thấp" và hiện thông báo. Nút ở góc phải trên cho người dùng tự chọn; lựa chọn đó được nhớ trong `localStorage` (`whp.battleQuality`), còn lần tự hạ thì không.

### Hai lựa chọn cần phiên chính biết

- **Hình lính vẽ to gấp 3 lần thật** (`FIGURE_SCALE` trong `engine/units.ts`). Một hình đại diện 20 người; ở cỡ thật, khối 4 000 người trong 400×40 m chỉ là 200 chấm cách nhau 9 m, nhìn từ xa không thấy gì. Đổi một hằng số là đổi được.
- **Vệt màu phe dưới chân mỗi khối quân**, không có trong yêu cầu. Nhìn toàn trận thì hình lính nhỏ hơn một điểm ảnh; vệt màu giúp thấy khối quân ở đâu. Vệt mờ dần khi camera lại gần, còn lại khoảng 10%.

### Đã kiểm tra

Chạy `/battle-lab` bằng Chrome headless điều khiển qua DevTools Protocol, chụp ảnh rồi xem từng ảnh. Không mở cửa sổ nào trên màn hình.

- **Dữ liệu tạm của repo:** địa hình, hai khối quân, mũi tên, tua, phát, ánh sáng từ 07:00 tới 09:00, hình ngã rồi biến mất, đường lưỡi liềm (`bulge` dương và âm).
- **Dữ liệu thử tự tạo, không commit:** địa hình 160×120 có đồi 140 m và thung lũng sông, một con sông, ba địa danh, kỵ binh hai phe, ba giai đoạn từ 05:12 tới 21:30 với đủ `stand`, `advance`, `charge`, `fight`, `retreat`, `rout`, `pursue`. Đã xem: bình minh, giữa trưa, đêm có trăng, nhãn sông và địa danh, kỵ binh tạm, khối quân quay hướng, góc nhìn sát đất.
- **File `.glb` đúng hợp đồng:** `tools/make-test-model.mjs` tạo một hình nộm 67 xương, LOD 7 968 / 1 488 / 300 tam giác, mỗi đỉnh tới 4 xương, ảnh màu 2048×2048, đủ 5 hoạt hình. Đặt file vào `public/battles/models/roman-legionary.glb` thì engine dùng ngay, không sửa code; bảng số đo ghi `roman-legionary: file`. Đã xoá file sau khi thử.
- **File `.glb` thiếu `run` và `die`** (tạo bằng `--no-run --no-die`): nạp được, không lỗi; hình ngã của khối đó biến mất ngay, đúng như hợp đồng.
- **Mở và đóng cảnh 40 lần** (trang tạm, không commit; cảnh 3 000 hình, RTX 3050): bộ nhớ GPU giữ ở 136 đến 139 MiB, không còn canvas hay listener thừa, không có cảnh báo quá nhiều WebGL context. Heap JS tăng từ 9,6 lên 10,7 MB ở chế độ dev, tức khoảng 0,03 MB mỗi lần; tôi chưa tìm phần tăng nhỏ này đến từ đâu.
- **Tự hạ chất lượng:** chạy bằng bộ vẽ phần mềm (SwiftShader) cho 1,8 khung hình/giây; sau khoảng 7 giây engine chuyển sang "thấp" và hiện thông báo.
- **Build:** three.js và engine nằm trong một chunk riêng 736 KB. Trang `/` nạp 9 chunk, không chunk nào chứa three.js.
- **Giao diện:** lớp phủ đúng ở chế độ sáng và tối. Ở bề ngang 390px trang không cuộn ngang.
- **Chưa kiểm tra bằng mắt:** chuỗi tiếng Việt. Trang thử không đổi ngôn ngữ theo `?lang=vi`, nên tôi chỉ thấy bản tiếng Anh; TypeScript bảo đảm đủ khoá `vi`.

### Số đo hiệu năng

**Điều kiện đo.**

- `/battle-lab?stats=1&stress=7000`, canvas 1280×800, pixel ratio 1, `npm run dev`.
- Chrome headless, không giới hạn tốc độ khung hình. RTX 3050 chọn bằng cờ `--use-angle=d3d11 --force_high_performance_gpu`; không có cờ thì Chrome dùng AMD Radeon tích hợp. Tên GPU đọc lại từ WebGL ở mỗi lượt.
- Sau mỗi khung hình có đọc lại một điểm ảnh, để GPU phải vẽ xong khung đó rồi mới sang khung sau. Không làm vậy thì số đếm được cao gấp đôi mà không đúng.
- Mỗi số là trung bình 6 giây. Script kiểm tra `blender.exe` và Godot ngay trước và sau từng cửa sổ đo. Blender của lane khác bật tắt từng đợt ngắn suốt buổi; Godot không chạy.
- Đo ngày 2026-11-16, 18:36 đến 18:42. "Đang phát" gồm cả việc trang thử vẽ lại thanh tua ở mỗi khung hình.

**RTX 3050, chất lượng cao, 7 000 hình.**

| Hình lính | Trạng thái | Khung hình/giây | 1% khung chậm nhất | Tam giác mỗi khung | Blender |
|---|---|---|---|---|---|
| File `.glb` thử (mức trần hợp đồng) | toàn cảnh, đứng yên | **192** | 7,4 ms | 4,2 triệu | không chạy |
| File `.glb` thử | toàn cảnh, đang phát | **116** | 11,8 ms | 4,1 triệu | không chạy |
| File `.glb` thử | toàn cảnh, đang phát | 78 | 34,7 ms | 4,1 triệu | đang chạy |
| File `.glb` thử | phóng gần, 3 400 hình trong khung | 137 | 14,7 ms | 3,4 triệu | đang chạy |
| Hình tạm | toàn cảnh, đứng yên | 212 | 10 ms | 1,0 triệu | đang chạy |
| Hình tạm | toàn cảnh, đang phát | 75 | 34,3 ms | 1,0 triệu | đang chạy |

Cả 7 000 hình đều trong khung hình, 87 lệnh vẽ, có bóng đổ. Lượt chậm nhất, kể cả khi Blender đang chạy, là 74 khung hình/giây. Trận tạm 400 hình của repo: 465 đứng yên, 264 đang phát.

**AMD Radeon tích hợp, 7 000 hình.**

| Chất lượng | Hình lính | Trạng thái | Khung hình/giây | Blender |
|---|---|---|---|---|
| Thấp | file `.glb` thử | đứng yên | 91 | không chạy |
| Thấp | file `.glb` thử | đang phát | 51 đến 60 | chạy một phần cửa sổ đo |
| Thấp | hình tạm | đứng yên | 109 | không chạy |
| Thấp | hình tạm | đang phát | 70 | không chạy |
| Cao | file `.glb` thử | đứng yên | 72 | không chạy |
| Cao | file `.glb` thử | đang phát | 51 | không chạy |

**Chưa đo trên cửa sổ thật.** Headless không qua màn hình nên không có giới hạn 60 Hz và không có chi phí ghép hình của Windows. Nếu cần số trên cửa sổ thật thì phải mở trình duyệt trên màn hình người dùng; tôi chưa làm vì chưa hỏi.

### Giới hạn

- **Dòng 404 trong console.** Engine chỉ biết một mô hình có hay không bằng cách tải thử. Mỗi mô hình chưa có file sinh một dòng `Failed to load resource: 404` do trình duyệt tự ghi, không chặn được từ code. Với dữ liệu tạm là 2 dòng; ngoài ra không có lỗi hay cảnh báo nào. Xem đề nghị 1.
- **Giờ mặt trời.** `Battle.date` là văn bản, engine không đọc được ngày. Mặt trời hiện chạy theo vĩ độ của `origin` và một độ nghiêng cố định (+14°, mùa chinh chiến). Xem đề nghị 2.
- **Ảnh pháp tuyến bị bỏ qua.** Hình lính dùng vật liệu Lambert với ảnh màu. Ở cỡ hình hiện tại khó thấy khác biệt; cần thì làm thêm cho LOD0.
- **File nén Draco không đọc được.** Cần đặt bộ giải nén vào `public/`. Xuất không nén hoặc nén meshopt thì được.
- **Một vật liệu cho mỗi mô hình**, đúng hợp đồng. Nếu một LOD xuất thành nhiều mảnh thì các mảnh được gộp và dùng vật liệu của mảnh đầu.
- **Không có biển.** Hợp đồng không cho biết ô nào là biển; ô cao 0 m được vẽ như đất.
- **Không có nhãn tên đơn vị** và chưa bấm chọn được khối quân. Task không yêu cầu.
- **Ban đêm** mới chỉnh cho nhìn được (trăng tròn, sao). Chưa có trận nào dùng nên chưa tinh chỉnh.
- **Hình tạm là các khối hộp**, khoảng 144 tam giác cho bộ binh. Nó chứng minh đường vẽ, không chứng minh tải của mô hình thật; vì vậy số đo chính dùng file `.glb` thử.

### Đề nghị cho hợp đồng và ngoài phạm vi

1. **Danh sách mô hình đã có.** Ví dụ lane 1 ghi `public/battles/models/index.json` từ script xuất, hoặc thêm cờ vào `unit-types.json`. Engine sẽ không tải thử file chưa có, và console sạch.
2. **Ngày của trận ở dạng máy đọc được**, ví dụ `Battle.dayOfYear` (tuỳ chọn). Engine sẽ tính đúng độ cao mặt trời theo mùa.
3. **Mức chất lượng trong store hoặc trong props.** Hiện nút nằm trong cảnh và chỉ cảnh biết. Nếu lane 1 làm bảng điều khiển ở đợt C thì nên đưa vào `useAppStore`.
4. **Trang thử không đọc `?lang=vi`**, nên không xem được bản tiếng Việt của cảnh trên `/battle-lab`.
5. **`.gitattributes`.** Repo đang để `core.autocrlf=true`; mỗi lần commit file mới git cảnh báo đổi LF thành CRLF. Một dòng `* text=auto eol=lf` sẽ hết.

### Cách chạy lại

```
npm run dev                                   # /battle-lab?stats=1&stress=7000
node src/components/battle/tools/make-test-model.mjs public/battles/models/roman-legionary.glb
```

Xoá file `.glb` thử sau khi dùng: thư mục đó là của mô hình thật (lane 1). Thêm `--no-die` hoặc `--no-run` để thử trường hợp thiếu hoạt hình.
