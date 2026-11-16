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

_(Lane 3 điền khi xong: cách làm, số đo hiệu năng, giới hạn, đề nghị cho hợp đồng.)_
