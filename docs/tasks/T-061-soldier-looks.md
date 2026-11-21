# T-061: Mỗi lính một vẻ (B1)

- **Lane:** phiên chính. Người dùng chọn 2026-11-21: phiên chính làm hết, cả phần mô hình (vùng của lane 1) lẫn phần cảnh (vùng của lane 3).
- **Nhánh:** `batch-l/B1-looks`, từ `main`.
- **Phạm vi file:**
  - `src/lib/battle.ts` (kiểu `ModelLooks`), `docs/ARCHITECTURE.md`;
  - `src/components/battle/engine/figures/` (`model.ts`, `material.ts`), `src/components/battle/engine/units.ts` (lượt vẽ bóng);
  - `art/` (script Blender, ảnh duyệt, README), `public/battles/models/` (12 file `.glb`).
- **Kế hoạch chung:** `docs/PLAN.md`, mục "Đợt L", việc B1.

## Bối cảnh

- Hiện lính cùng loại giống hệt nhau, chỉ khác độ sáng (±15%, cả người, kể cả kim loại) và cỡ người (±6%).
- Ảnh thử (`E:\World_History_Platform_assets\duyet\B1\`, script `main-tools/b1/b1_mock.py`): hastati và bộ binh Gaul ở ba bản: hiện tại, mức A (khác vừa phải), mức B (khác rõ).
- Người dùng chọn **theo từng dân tộc**:
  - quân La Mã ở mức A: áo và khiên là các sắc của cùng một màu, vì quân đội cấp quần áo rồi trừ vào lương (Polybius 6.39.15);
  - quân của Hannibal ở mức B: nhiều màu, khiên mỗi người một kiểu (Diodorus 5.30);
  - chỗ nào nguồn tả rõ thì giữ nguyên, ví dụ áo lanh trắng viền tía của người Iberia (Polybius 3.114).

## Yêu cầu

### 1. Hợp đồng

Viết vào `docs/ARCHITECTURE.md` (mục "Mô hình lính", phần "Mỗi lính một vẻ") và `src/lib/battle.ts`. Mọi thứ đều tuỳ chọn: mô hình không có thì trông như cũ.

- **Ô màu.** Mỗi mô hình có tối đa 6 ô màu (áo, quần, tóc, da, lông mũ, sơn khiên...). Mỗi ô có một cách nhuộm và tối đa 8 màu, mỗi màu một trọng số.
  - Cách `tint`: màu atlas nhân với màu đã chọn.
  - Cách `dye`: độ sáng của màu atlas, chia cho độ sáng trung bình của ô, nhân với màu đã chọn. Dùng khi phải đổi hẳn sắc (áo đỏ thành áo len mộc).
- **Thuộc tính đỉnh `_LOOK`** (ba số) trên cả ba lưới LOD:
  - ô chính của đỉnh;
  - ô phụ (0 nếu không có);
  - kiểu hình: 0 là luôn hiện; số khác là một kiểu râu hay tóc, chỉ hiện ở người rút trúng kiểu đó.
- **Mặt nạ nhuộm.** Kênh R (đang bỏ trống) của ảnh độ nhám/kim loại cho biết điểm ảnh nào được nhuộm:
  - 1: theo ô chính;
  - 0,5: theo ô phụ;
  - 0: giữ màu atlas (sắt, đồng, da thuộc, viền áo tía...).

  Mặt nạ được bake như độ nhám, nên luôn khớp với ảnh màu, kể cả chỗ bake làm sơn lem sang mặt sắt.
- **Hoa văn khiên.**
  - Vài mẫu vẽ (mặt nạ xám) nằm trong một ô dành riêng của atlas màu.
  - Mặt sơn của khiên có bộ UV thứ hai (`TEXCOORD_1`), trải từ 0 tới 1 trên mặt khiên.
  - Hoa văn chỉ phủ lên chỗ có mặt nạ nhuộm, với một màu riêng.
- **Bảng vẻ** (`scenes[0].extras.whp_looks`, chuỗi JSON): các ô màu và màu của chúng, các nhóm kiểu hình, các hoa văn và màu hoa văn.
- **Cảnh.**
  - Mỗi người rút cố định một lựa chọn cho mỗi ô, mỗi nhóm kiểu hình và hoa văn, theo số ngẫu nhiên riêng của người đó (`iSeed`). Lựa chọn giống nhau ở mọi mức LOD và mọi lúc tua.
  - Kiểu hình không được chọn bị thu về một điểm, kể cả trong lượt vẽ bóng.
  - Vẫn một vật liệu, vẽ theo lô như cũ.

### 2. Đường dựng mô hình (`art/blender/`)

- Gắn `_LOOK` theo phần (part).
- Bake mặt nạ nhuộm vào kênh R.
- LOD1 chép cả kênh R (đã có).
- Bảng màu LOD2 không gộp hai tam giác khác `_LOOK` hay khác mức nhuộm; ô màu của bảng mang mặt nạ.
- Thân tạm LOD2 lấy `_LOOK` của phần gần nhất.
- Chừa chỗ trong atlas cho hoa văn; tính UV hoa văn cho mặt khiên ở LOD0 và LOD1.
- Xuất thuộc tính `_LOOK`, UV thứ hai và bảng vẻ.
- Bước kiểm tra của bản xuất đọc lại bảng vẻ.
- Kiểu râu, tóc là các phần riêng, bake độ che khuất riêng (`ao_alone`), để mặt người không râu không bị in bóng râu.

### 3. Bảng vẻ của 12 mô hình

- Theo lựa chọn "theo từng dân tộc".
- Mỗi lựa chọn dựa trên nguồn ghi trong `art/README.md`.
- Ít nhất: màu áo hoặc quần, da, tóc hoặc râu cho từng loại lính; lông mũ tím hoặc đen cho lính nặng La Mã (Polybius 6.23.12); hoa văn khiên cho quân Gaul và Iberia.
- Khiên La Mã để trơn: không nguồn nào tả hoa văn khiên La Mã năm 216 TCN.

### 4. Kiểm tra

- `build_model.py` không lỗi; các clip giống hệt từng byte so với `main` (`main-tools/glb-clips.mjs`).
- Mỗi file dưới 4 MB.
- Trong cảnh (`/battle-lab?duel=1`, Cannae, Trasimene): mỗi người một vẻ ở mọi mức LOD, không đổi màu khi chuyển LOD; không lỗi console.
- Khung hình/giây đo trước và sau: không giảm đáng kể.
- `npm run validate`, `npm run lint`, `npm run build` qua.
- Làm bộ binh Gaul trước, cho người dùng xem trong app, rồi mới làm 11 mô hình còn lại.

## Kết quả

**Trạng thái:** xong trên nhánh `batch-l/B1-looks` (phiên chính làm), chờ người dùng duyệt gộp. Người dùng đã xem và duyệt bộ binh Gaul trong app trước khi làm 11 mô hình còn lại.

### Đã làm

- **Hợp đồng** (`docs/ARCHITECTURE.md`, mục "Mỗi lính một vẻ"; `src/lib/battle.ts`: `ModelLooks`, `LOOKS_EXTRAS`, `LOOK_LIMITS`). Khác với phần Yêu cầu ở trên:
  - 7 ô màu chứ không phải 6. Kỵ binh cần thêm lông ngựa và vải lót yên; cách gói ô chính và ô phụ vẫn vừa (mỗi ô dưới 8).
  - `_LOOK` là một số chứ không phải ba: ô chính + 8 × ô phụ + 64 × hình biến thể. File nhỏ hơn.
  - Hình trên khiên không dùng UV thứ hai, mà đặt theo khung của khiên (tâm, hai trục, tầm) ghi trong JSON. Bản thử có `TEXCOORD_1` làm file bộ binh Gaul từ 2,07 lên 2,22 MB.
  - Lựa chọn của mỗi người được bốc **một lần trên CPU** lúc dựng khối (`figures/looks.ts`, `lookChoices`), gói vào hai số cuối của `iStrike`. Không bốc trong vertex shader nữa (xem "Khung hình").
  - LOD2 bỏ ô màu da (`near_only`). Ở tầm đó không thấy khác biệt, mà ô màu lại tách đỉnh.
- **Đường dựng** (`art/blender/`; chi tiết trong `art/README.md`, mục "Mỗi lính một vẻ"):
  - module mới: `whp_look.py`, `whp_beard.py`, `celt_beard.py`, `roman_beard.py`, `celt_looks.py`, `roman_looks.py`, `iberian_looks.py`, `cavalry_looks.py`;
  - mặt nạ nhuộm nướng vào kênh R qua `SurfaceSwap(dye=)`;
  - bảng màu LOD2 tách theo (ô màu, mức mặt nạ);
  - râu dựng ở đầu giai đoạn `lod` (`before_lod`, gọi cho cả kỵ binh), chừa má che của mũ và cổ áo;
  - giới hạn tam giác tính theo số một người vẽ, kiểm cả lúc dựng lẫn trong file.
  - Mô hình không có `LOOKS` dựng ra file giống hệt từng byte (đã thử với `roman-hastatus` ở bước đầu; các thay đổi về sau chỉ chạy khi có `LOOKS`). Bộ binh Gaul và Iberia dựng lại sau khi tách các file `*_looks.py` cũng giống hệt từng byte.
- **Mười hai mô hình:**
  - quân La Mã ở mức A: áo, khiên đỏ đổi sắc, mào tía hoặc đen, râu (hastati ít, triarii nhiều, có râu bạc), velites khoảng 6/10 người có da sói;
  - quân Hannibal ở mức B: nhiều màu, hình trên khiên cho Gaul, Iberia và Libya, áo lanh trắng viền tía của người Iberia giữ nguyên;
  - ngựa của cả bốn mô hình kỵ binh có lông hồng, nâu sẫm, hạt dẻ, đen, xám, vàng xám.
  - Nguồn của từng lựa chọn ghi trong comment của `unit_*.py` và `*_looks.py`, tóm tắt ở ARCHITECTURE.

### Kiểm tra

- 12 mô hình dựng không lỗi, bước kiểm tra của bản xuất qua. Mọi clip giống hệt `main` (`main-tools/glb-clips.mjs`, 7–9 clip mỗi mô hình).
- File 1,93–2,72 MB, đều dưới 4 MB. Mỗi file tăng 131–212 KB (râu, thuộc tính `_LOOK`, vùng hình khiên).
- Số đỉnh so với `main`: LOD0 +4–16%, LOD1 +2–12%, LOD2 +1–19%. Số tam giác LOD2 không đổi.
- Trong cảnh (`/battle-lab?duel=1`, cặp 1–8; Cannae; hồ Trasimene): mỗi người một vẻ ở mọi mức chi tiết, không lỗi console. Kỵ binh xông qua (cặp 8) vẫn đúng (người cưỡi đánh xuống, ngựa vẫn phi).
- `npm run lint`, `npm run validate` qua; `npm run build` qua (build trong worktree tạm); hồi quy lõi 17/17, không lỗi console hay request hỏng.

### Khung hình

Máy người dùng (RTX 3050 laptop, Chrome qua ANGLE/Direct3D 11). Đo ở cảnh Cannae: cảnh mở đang dừng, rồi giai đoạn 5 và 6 đang phát (`s-perf56.mjs`). Dùng file của `main` và của nhánh xen kẽ, trên cùng code của nhánh.

- **Bản đầu** (bốc lựa chọn trong vertex shader, 18 giá trị nội suy, hai thuộc tính mới): cảnh mở 103 → 87 khung/giây (−16%), lúc phát khoảng 59 → 53 (−10%).
- **Đo bật/tắt phần này ngay trong một trang** (`main-tools/drive/s-b1-toggle.mjs`, cùng file mô hình) để tách nguyên nhân:
  - bỏ vòng lặp bốc thăm trong shader: không đổi đáng kể;
  - bỏ phần tính màu ở shader điểm ảnh: không đổi đáng kể;
  - chỉ còn đọc hai **thuộc tính** mới (`aLook`, `iLook`, mỗi cái một luồng riêng): vẫn tốn khoảng 4–6%;
  - nhiều **giá trị nội suy**: tốn phần lớn chỗ còn lại.
  - Dùng `flat` cho các giá trị không đổi trên tam giác thì chậm hẳn (cảnh mở 41 khung/giây): ANGLE trên Direct3D giả lập đỉnh quy định (provoking vertex) cho `flat` bằng một đường chậm.
- **Đã sửa:**
  - bốc thăm trên CPU;
  - `_LOOK` vào số thứ hai của `aPart` (thay `aMount`), lựa chọn vào `iStrike.zw`: không thêm luồng thuộc tính nào;
  - chỉ chuyển một giá trị nội suy, cộng toạ độ hình khiên cho mô hình có hình khiên (`FIG_DESIGNS`); màu tra ở shader điểm ảnh;
  - LOD2 bỏ ô da; lưới bóng chỉ giữ số hình biến thể; râu ở LOD1 ít tam giác hơn.
  - Phần shader còn tốn khoảng 2% (trung vị của sáu lần bật/tắt: 98,2 so với 100,1 khung/giây).
- **So với `main`** (hai file mô hình xen kẽ, 3 vòng): cảnh mở 103,1 → 97,7 khung/giây (−5%); giai đoạn 5 58,6 → 56,9 (−3%); giai đoạn 6 58,8 → 55,9 (−5%).
- Phần chênh còn lại chủ yếu do mô hình có thêm đỉnh: râu nằm sẵn ở LOD0/LOD1, và LOD2 tách đỉnh ở ranh giới áo, khiên.
- Phát hiện này có thể giải thích mức chậm 5% chưa tách được của T-032 (thuộc tính `iStrike` khi đó cũng thêm một luồng); chưa đo lại. Từ nay mỗi thuộc tính mới của hình lính nên gộp vào luồng sẵn có.

### Ảnh duyệt

`E:\World_History_Platform_assets\duyet\B1\`: B1-01..04 là ảnh thử phương án, B1-05..07 là bộ binh Gaul trong cảnh, B1-08..B1-12 là mười hai mô hình khi xong (hàng đầu nhìn gần, khối quân ở 16 và 45 m, kỵ binh).
