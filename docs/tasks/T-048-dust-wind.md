# T-048: Bụi và gió (đợt H, chặng 4)

- **Ai làm:** phiên chính. Task viết cho lane 3; người dùng chuyển cho phiên chính (2026-11-19) vì lane 3 để dành cho việc khác. Nhánh `lane3/T-048-dust-wind` trong worktree của lane 3 không dùng.
- **Nhánh:** `batch-j/dust-wind` (tạo từ `main`, worktree riêng)
- **Phạm vi file:**
  - `src/components/battle/`;
  - khoá `battle.*` trong `src/lib/i18n/messages.ts`, cả `en` lẫn `vi`, nếu cần chuỗi mới;
  - lúc gộp: hộp thoại Giới thiệu, `docs/ARCHITECTURE.md` (người dùng duyệt câu chữ).

## Bối cảnh

Từ T-031 (đợt F), các thay đổi trong cảnh:

- **Đợt G, giáp lá cà (T-032 → T-036):** `melee.ts`, `blows.ts`. Hàng đầu đấu từng cặp, có clip đỡ đòn và trúng đòn.
- **Đợt H, phong cảnh (T-037 → T-040):** dữ liệu `terrain.scenery`. Mặt đất và sông (`terrain.ts`, `river.ts`), vùng xa và biển, công trình (`structures.ts`), cây (`vegetation.ts`, đã nghiêng và đung đưa theo `scenery.wind`).
- **Đợt I, đồ hoạ theo ảnh mẫu (T-041 → T-044):** đường cong màu (`grade.ts`), ánh sáng bù cho hình lính (`Sky.fill`), mặt nước (`water.ts`), 42 000 bụi cỏ quanh camera (`grass.ts`, cũng nhận hướng gió), hỗn chiến và vật bay (`missiles.ts`), chất liệu ảnh chụp.
- **T-046 (đợt J):** mảng màu phe dưới chân khối quân ẩn khi nhìn gần (`setFootprintLook` trong `units.ts`).

Chặng 4 của đợt H (bụi và gió) bị hoãn khi người dùng chuyển sang đợt I, rồi được giao ở đợt J.

**Tư liệu và dữ liệu** (`docs/data/battles/cannae.md`, mục 12):
- Livy 22.43 và 22.46: gió Volturnus cuốn bụi trên đồng khô vì hạn vào mặt quân La Mã, tới mức họ không thấy phía trước; Hannibal đóng trại quay lưng về phía gió. Polybius không nhắc tới.
- Dữ liệu Cannae: `scenery.dust.level` 0,8 (mức `attested`; bụi dày tới đâu là giả định). `scenery.wind`: thổi **từ** 135° (đông nam), 8 m/s. Quân La Mã quay mặt về nam, nên bụi bay vào mặt họ.
- Mặt đất trong cảnh màu xanh: người dùng chọn, mức `illustrative`, trái mùa của trận. Bụi vẫn vẽ theo dữ liệu.

Trong lúc làm, hai lane khác chạy song song, không ai đụng `src/components/battle/`:
- lane 1 làm T-047, xuất lại 11 mô hình (LOD ít đường nối UV, sửa kỵ binh) và **chạy Blender nhiều**;
- lane 2 làm T-045, sửa dữ liệu Cannae: thêm khối giữ trại Hannibal, đổi đường ra khỏi trại lớn.

## Đọc trước

- `docs/ARCHITECTURE.md`, mục "Trận đánh 3D": "Cảnh 3D" (hiệu năng), "Giáp lá cà (đợt G)" (đoạn "Vật bay": cách làm không giữ trạng thái giữa hai khung), "Phong cảnh (đợt H)" (gió, bụi), "Đồ hoạ theo ảnh mẫu (đợt I)".
- `docs/PLAN.md`, mục "Đợt H": bảng năm chặng và mục "Ràng buộc".
- `src/components/battle/engine/missiles.ts`: mẫu cho một lớp vẽ suy ra hết từ đồng hồ trận.
- `src/components/battle/engine/sky.ts`: màu nắng, độ sáng theo giờ, ánh sáng bù.

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Bụi theo khối quân

- Khối quân đi nhanh làm bụi bốc lên sau và quanh chân. Đi bước ít, chạy nhiều; kỵ binh phi nhiều nhất. Bụi bốc lên, loang ra và trôi theo gió, mờ dần sau vài giây.
- Lượng bụi nhân với `scenery.dust.level`. Trận không có `scenery.dust`, hay `level` 0, thì không có bụi.
- Giai đoạn kỵ binh xung phong phải thấy bụi cuốn: Cannae giai đoạn 3, kỵ binh Hasdrubal đánh kỵ binh La Mã. Đây là điều kiện "Xong khi" của chặng 4 trong `PLAN.md`.
- Có thể thêm một lớp bụi mỏng trôi theo gió trên cả đồng (Livy nói gió cuốn bụi suốt trận). Nếu làm thì phải mỏng: không che hình lính ở góc nhìn mở.

### 2. Suy ra từ đồng hồ trận

- Như `missiles.ts`: bụi ở một thời điểm là hàm của thời gian trận và đường đi của các khối, không giữ trạng thái giữa hai khung. Tua tới đâu cũng ra cùng một cảnh như khi phát tới đó.
- Khi dừng phát, bụi đứng theo đồng hồ trận. Nếu bạn thấy cần cho bụi trôi nhẹ theo thời gian thật thì ghi lý do.

### 3. Ánh sáng và màu

- Bụi nhận màu nắng và độ sáng theo giờ từ `Sky`: bình minh 5:30 mặt trời cao khoảng 8°, cuối trận 17:00 khoảng 26°. Ngược nắng thì bụi sáng lên.
- Bụi đi qua đường cong màu của cảnh như mọi thứ khác.
- Màu bụi là màu đất khô, không phải xám khói.
- Chuẩn hình ảnh là năm ảnh mẫu của người dùng, ở `E:\World_History_Platform_assets\ảnh`. Thước đo ảnh của phiên chính ở `E:\World_History_Platform_assets\main-tools\look\` (`measure.py`, `check.sh`). Bụi không được kéo độ đậm màu hay độ tương phản của cảnh lệch khỏi những gì người dùng đã duyệt ở đợt I.

### 4. Hiệu năng và mức chất lượng

- Mức chất lượng thấp: tắt bụi (ràng buộc của đợt H).
- Mức cao: giữ từ **50 khung hình/giây** khi phát 1× ở giai đoạn 3 và 4 trên máy của người dùng (RTX 3050). `main` lần đo gần nhất (2026-11-19, bản production): 61–65.
- **Đo xen kẽ A-B-A-B** với `main` trên bản production, ít nhất hai vòng, và ghi điều kiện máy cho mỗi lần đo (`tasklist | findstr blender`). Lane 1 chạy Blender trong lúc bạn làm, mà Blender làm số khung hình tụt 30–40%.
- Công cụ: `s-perf.mjs` của bạn ở `E:\World_History_Platform_assets\T-031\tools\` (biến `APP`), hoặc `s-perf3.mjs` của phiên chính ở `main-tools\drive\` (biến `BASE`).

### 5. Gió

Cây và bụi cỏ đã nghiêng theo hướng gió. Nếu rẻ thì thêm cơn gió: cây và bụi cỏ lay mạnh lên theo nhịp, cùng nhịp với bụi. Không bắt buộc.

### 6. Ảnh cho người dùng duyệt

- Đặt ở `E:\World_History_Platform_assets\duyet\T-048\`, đặt tên `…-A-truoc.png` (`main`) / `…-B-sau.png` (nhánh), mỗi cặp cùng góc và cùng thời điểm. Ít nhất có:
  - góc nhìn mở;
  - cú xung phong của kỵ binh ở giai đoạn 3, tầm trung và cận cảnh;
  - giáp lá cà cận cảnh ở giai đoạn 4;
  - lúc 5:30 và lúc 17:00;
  - mức chất lượng thấp.
- **Xong bản cắt đầu thì chụp ảnh và báo người dùng xem**, rồi mới tinh chỉnh tiếp. Người dùng duyệt đồ hoạ bằng mắt và từng chê những bản trông "hoạt hình".
- Driver chụp của phiên chính: `E:\World_History_Platform_assets\main-tools\drive\`, kịch bản `s-scenery.mjs <tiền tố> <thời điểm> "tên:x,y,khoảng cách,độ cao,phương vị"` (phương vị 0 là camera ở phía nam điểm nhìn) và `s-fill.mjs` (chụp ở một mức chất lượng).

## Ràng buộc

- Không sửa `src/lib/` (hợp đồng), store, `src/data/`, `src/app/`, `public/`. Cần đổi thì ghi đề nghị vào "Kết quả".
- Nếu cần ảnh chất liệu, ưu tiên sinh bằng code. Dùng ảnh ngoài thì chỉ lấy loại CC0, và ghi đề nghị ghi công vào "Kết quả" (`art/CREDITS.md` là của lane 1).
- Hộp thoại Giới thiệu sẽ cần một câu về bụi (có tư liệu, độ dày là giả định). Không sửa nó: đề nghị câu chữ trong "Kết quả", phiên chính viết khi gộp và người dùng duyệt.
- `docs/ARCHITECTURE.md` do phiên chính sửa. Ghi những gì cần thêm vào mục "Phong cảnh" trong "Kết quả".
- `npm run lint`, `npm run build` phải qua; hồi quy lõi (mở/đóng trận, 390 px) không lỗi console.
- Cổng `next dev`: chọn cổng trống. Không dùng 3000 (bản xem thử của `main`) hay 3106.

## Xong khi

- Khối đi nhanh và kỵ binh phi làm bụi trôi theo gió; giai đoạn 3 thấy bụi cuốn.
- Tua và phát ra cùng một cảnh.
- Mức thấp không có bụi; mức cao từ 50 khung hình/giây ở giai đoạn 3–4, có số đo xen kẽ với `main`.
- Người dùng đã xem ảnh bản cắt đầu; ảnh trước và sau ở `duyet\T-048\`.
- Mục "Kết quả" đã điền, kèm đề nghị câu Giới thiệu và phần cần thêm vào ARCHITECTURE.

## Kết quả

(Phiên chính điền khi xong.)
