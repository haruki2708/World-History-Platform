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

(Phiên chính điền khi xong.)
