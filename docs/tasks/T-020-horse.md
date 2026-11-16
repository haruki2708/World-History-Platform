# T-020: Ngựa cho kỵ binh, và chỉnh dữ liệu Cannae trong cảnh thật

- **Lane:** 2
- **Model đề xuất:** Opus 5.5, effort `high` (`xhigh` cho phần Blender khó).
- **Nhánh:** `lane2/T-020-horse` (tạo từ `main` mới nhất, **sau khi T-017 đã gộp**)
- **Phạm vi file:**
  - **Ngựa:** `art/blender/horse_*.py`, `art/renders/horse/`, `art/build/horse/` (không vào git), mục ngựa trong `art/README.md` và `art/CREDITS.md`.
  - **Dữ liệu:** như T-016: `src/data/battles/`, `public/data/terrain/`, `scripts/battles/`, `docs/data/battles/`.

## Bối cảnh

Người dùng duyệt đợt B: đủ 10 loại mô hình cho trận Cannae. Ba loại là kỵ binh: `roman-cavalry`, `iberian-gallic-cavalry`, `numidian-cavalry`. Hợp đồng (`docs/ARCHITECTURE.md`, "Mô hình lính") yêu cầu:
- người và ngựa trong cùng một file;
- một khung xương;
- `LOD0` tối đa 8 000 tam giác cho cả người lẫn ngựa.

Task này dựng **con ngựa** làm nền. Lane 1 sẽ ghép người cưỡi lên ngựa trong T-022. Lane 1 đang làm T-021 (sáu loại bộ binh) trong `art/` cùng lúc với bạn, nên chỉ sửa các file ngựa nêu ở trên.

## Đọc trước

- `docs/data/battles/ASSETS.md`: khảo sát ngựa bạn đã làm ở T-016.
- `art/README.md`: quy trình Blender của lane 1 (cách chạy, các module `whp_*.py`, LOD, bake, xuất, kiểm tra).
- `docs/tasks/T-019-animations-hastatus.md`, mục "Thay đổi ở các module `whp_*.py` (cho lane 2)": lane 1 vừa thêm và đổi một số hàm. Ví dụ `whp_export.reimport` giờ thử tư thế người đứng trên mặt đất; với ngựa thì truyền `ground=()` hoặc ngưỡng riêng.
  - Được import các module chung, **không sửa chúng**. Cần đổi thì ghi đề nghị cho lane 1 trong mục "Kết quả".
- Blender 5.2.2 tại `D:\Tools\Blender\5.2.2\blender.exe`. Luôn chạy với `--background --factory-startup --disable-autoexec`.

## Yêu cầu

### Phần 1: Ngựa

**1. Chọn mô hình.**
- Đọc trực tiếp giấy phép của ứng viên số 1 (BlendSwap 28627, CC0). Đọc cả giấy phép của lưới gốc mà một bình luận nhắc tới (Tarnyloo, BlendSwap 17172).
- Lưới gốc không rõ giấy phép thì bỏ ứng viên này, chọn #4 hoặc #2/#3 (CC BY 4.0).
- Ghi lựa chọn và lý do vào `ASSETS.md`.

**2. Tải về.**
- Đặt ở `E:\World_History_Platform_assets\sources\horse-<tên>\`, ngoài repo. Ghi nguồn vào `E:\World_History_Platform_assets\README.txt`.
- BlendSwap và Sketchfab thường bắt đăng nhập để tải. **Không tự tạo tài khoản.** Khi cần đăng nhập thì dừng lại, báo người dùng link và thư mục đích. Người dùng sẽ tự tải bằng tài khoản của họ, như đã làm với mô hình lính.

**3. Dựng ngựa bằng script** `art/blender/horse_build.py` (và các module `horse_*.py` nếu cần). Chạy lại từ đầu phải ra cùng kết quả.
- **Kích thước.** Ngựa thời đó nhỏ hơn ngựa ngày nay: cao khoảng 1,35–1,45 m tới vai. Ghi nguồn cho con số chọn.
- **Yên cương đúng năm 216 TCN.**
  - Không có bàn đạp: thời này chưa có.
  - Bỏ yên kiểu hiện đại nếu mô hình có.
  - Dựng thêm một tấm vải lót yên và dây cương đơn giản thành **lưới riêng**, để T-022 bật tắt theo loại kỵ binh. Kỵ binh Numidia cưỡi không yên, không cương, chỉ có dây quàng cổ.
- **Mức chi tiết** (để T-022 còn chỗ cho người cưỡi): khoảng 3 500 / 700 / 150 tam giác cho LOD0 / LOD1 / LOD2. Dùng cách giảm lưới và bake của `whp_lod.py` nếu hợp.
- **Hoạt hình** của ngựa, không có chuyển động gốc, lặp liền mạch:
  - `idle`, `walk`, `run` (phi nước kiệu nhanh hoặc nước đại), `die` (ngã);
  - ghi độ dài một vòng `walk` và `run`.
  - Lấy từ mô hình gốc nếu có. Thiếu `die` thì tự làm bằng keyframe.
- **Đầu ra:** `art/build/horse/horse.blend`, gồm khung xương, lưới các LOD, vật liệu và clip.
  - **Không xuất ra `public/`.** Ngựa không phải một loại lính riêng.
  - Ghi rõ trong `art/README.md` cách T-022 dùng file này: tên xương lưng hay yên để gắn người cưỡi, chiều cao yên, hướng.
- **Ảnh duyệt** trong `art/renders/horse/`, JPEG, mỗi ảnh tối đa 400 KB:
  - nhìn nghiêng, trước, sau;
  - ba mức LOD cạnh nhau;
  - mỗi clip ba khung hình;
  - một ảnh đặt cạnh `roman-legionary` đứng, để so tỉ lệ.
- **Ghi công:** mục ngựa trong `art/CREDITS.md`, gồm giấy phép, link và những gì đã sửa.

### Phần 2: Dữ liệu Cannae trong cảnh thật

Cảnh 3D (T-015, T-018) đã gộp, nên giờ xem được dữ liệu của bạn trong cảnh thật: `npm run dev -- -p 3102`, mở `/battle-lab?stats=1`. Lane 3 đang làm khung xem trận (T-023) trong `src/components/battle/`; cảnh trong trang thử vẫn như cũ.

- Xem cả 6 giai đoạn, rồi chỉnh những gì trông sai:
  - tốc độ di chuyển (lính đi bộ khoảng 1 m/s, kỵ binh nhanh hơn);
  - độ dày khối quân;
  - mũi tên;
  - các khối xuyên vào nhau.
- Thêm `dayOfYear` cho Cannae (trường mới trong `Battle`).
  - Ngày 2 tháng 8 theo lịch La Mã năm 216 TCN không trùng mùa thật. Tìm cách các sử gia đổi ngày, chọn một con số và ghi lý do vào `docs/data/battles/cannae.md`.
- Ghi những gì đã chỉnh vào `cannae.md`.

## Ràng buộc

- Không đưa file gốc (`.blend` tải về, ảnh vật liệu gốc) hay `art/build/` vào repo.
- Không dùng tài sản chưa đọc giấy phép, tài sản NC hay ND, hay tài sản trích từ game.
- Không sửa `src/` ngoài `src/data/battles/`. Không thêm thư viện npm.
- Lane 3 có thể đang đo hiệu năng. Bake bằng Cycles thì giữ CPU, và không để `blender.exe` chạy khi không cần.

## Xong khi

- `art/build/horse/horse.blend` dựng lại được bằng một lệnh, có đủ LOD và 4 clip.
- Có ảnh duyệt trong `art/renders/horse/` và ghi công.
- Dữ liệu Cannae đã chỉnh, có `dayOfYear`.
- `npm run validate`, `npm run lint`, `npm run build` qua.

## Kết quả

Hai commit trên nhánh `lane2/T-020-horse`:

- `f5055fe`: dữ liệu Cannae chỉnh trong cảnh thật, `dayOfYear`, chọn ngựa;
- `a2ad9cb`: con ngựa.

### Phần 1: Ngựa

**Đầu ra:** `art/build/horse/horse.blend` (không vào git, không xuất ra `public/`). Dựng lại bằng một lệnh, khoảng 1 phút:

```powershell
& "D:\Tools\Blender\5.2.2\blender.exe" --background --factory-startup --disable-autoexec --python art/blender/horse_build.py
```

Hai lần dựng từ đầu cho file xuất thử `horse-test.glb` giống hệt từng byte. Bước cuối của script xuất thử con ngựa trần rồi kiểm tra bằng `whp_export.check_glb` và `reimport`: không có lỗi. Chi tiết và số đo nằm ở `art/README.md`, mục "Ngựa".

**Chọn mô hình và giấy phép** (`docs/data/battles/ASSETS.md`):

- "Horse Rigged All Gaits" của fdoss001 (Blend Swap 28627, CC0): khung xương và dáng đi.
- Lưới là "Horse" của Tarnyloo (Blend Swap 17172):
  - tệp giấy phép trong file zip ghi **CC BY 3.0**;
  - script đã so hai lưới: cùng số đỉnh, số mặt, lệch nhau nhiều nhất 1,2% kích thước sau khi khớp tỉ lệ.
- Ghi công cả hai trong `art/CREDITS.md`.
- Không dùng ảnh vật liệu nào của file gốc: có ảnh của add-on thương mại, có ảnh không rõ nguồn.
- Hai file người dùng tải về ban đầu nằm nhầm thư mục của nhau; tôi đã chuyển lại. Mã băm ghi ở `E:\World_History_Platform_assets\README.txt`.

**Kích thước:** cao 1,40 m tới vai.

- Nguồn: ngựa thời La Mã ở Hà Lan cao trung bình 132 cm (làng bản địa), 142 cm (trại lính) và 144 cm (villa); ngựa Celt 110–130 cm.
- Cả hai nguồn chỉ đọc được qua trích đoạn tìm kiếm, vì các trang chặn truy cập tự động. Đã ghi rõ trong `art/README.md`.

**Khung xương:** 40 xương tên `horse_*`, hậu tố `_l`/`_r`, từ 80 xương biến dạng của file gốc.

- Xương nào không chuyển động so với xương cha trong mọi dáng đi thì gộp vào cha: sọ, hàm, mắt, tai, gốc bờm, ngực, hông.
- Hai nửa của mỗi đoạn chân lệch nhau dưới 4°, nay gộp làm một.
- Xương `horse_saddle` (con của `horse_spine_3`) là chỗ gắn người cưỡi:
  - ma trận nghỉ chỉ là tịnh tiến;
  - đầu xương ở (0; −0,157; 1,351) m;
  - **yên cao 1,35 m** lúc đứng.
- Hướng: trong Blender ngựa nhìn về −Y, Z lên; trong glTF nhìn về +Z. Gốc toạ độ trên mặt đất, giữa móng trước và móng sau.
- Cách T-022 dùng: `art/README.md`, mục "Gắn người cưỡi".

**Yên cương 216 TCN:**

- không bàn đạp, bỏ yên hiện đại và dây cương có hàm thiếc của file gốc;
- dựng mới, mỗi món một lưới riêng:
  - vải lót yên bằng len đỏ, có đai bụng (`horse_cloth_LOD*`);
  - dây cương đơn giản (`horse_bridle_LOD0`);
  - dây quàng cổ cho ngựa Numidia (`horse_neckrope_LOD*`);
- bờm cắt ngắn và đuôi dựng thành lưới, thay cho lông dạng hạt.

**Số tam giác** (đủ yên cương / chỉ dây quàng cổ):

| | LOD0 | LOD1 | LOD2 |
|---|---|---|---|
| Đủ yên cương | 3 436 | 710 | 122 |
| Chỉ dây quàng cổ | 3 036 | 651 | 111 |

Một vật liệu, bake bằng Cycles trên CPU:

- ảnh màu 2048, đã nhân AO;
- ảnh pháp tuyến 1024;
- ảnh độ nhám/kim loại 1024.

LOD2 là hình thay thế dựng từ ống theo khung xương; trông thô, nhưng chỉ dùng ở xa.

**Clip:** 30 khung/giây, không chuyển động gốc.

| Clip | Nguồn | Độ dài | Một vòng |
|---|---|---|---|
| `idle` | tư thế đứng, cộng lắc đầu, vẫy đuôi của file gốc, thêm nhịp thở | 4,97 s, lặp | |
| `walk` | file gốc | 1,667 s | **1,20 m** |
| `run` | gallop của file gốc | 0,400 s | **1,21 m** |
| `die` | tự làm: khuỵu gối trước, lăn nghiêng, nằm yên | 1,97 s, không lặp | |
| `trot`, `canter` (thêm) | file gốc | | |

**Ảnh duyệt:** `art/renders/horse/`, 9 ảnh, mỗi ảnh 46–75 KB:

- nghiêng, trước, sau;
- ba kiểu yên cương;
- ba mức LOD;
- ba khung mỗi clip;
- cạnh `roman-legionary`;
- `trot` và `canter`.

**Còn chưa tốt:**

- `walk` của file gốc để móng trước lún tối đa 3,2 cm xuống đất trong vài khung.
- Gallop của file gốc có pha chạm đất ngắn: chỉ không trượt chân ở 3 m/s (xem đề nghị cho lane 3).
- Dây đầu trên má khó thấy ở gần.
- Đầu dây cương nằm ở chỗ tay người cưỡi giả định, không gắn vào tay thật.

### Phần 2: Dữ liệu Cannae

Xong ở commit `f5055fe`:

- **Tốc độ:** đổi tốc độ và hành động của từng khối cho khớp chuyển động.
- **Vị trí:** sửa chỗ hai đạo quân băng qua nhau lúc dàn quân; ép mặt trận La Mã theo lưỡi liềm để không khối nào xuyên vào nhau.
- **Mũi tên:** vẽ lại mũi tên giai đoạn 1, bỏ mũi tên thừa ở giai đoạn 6.
- **`dayOfYear`:** đặt bằng 178 (27 tháng 6 lịch Gregory đón trước), kèm lý do.
- **Công cụ mới:** `scripts/battles/check-overlap.mjs`, liệt kê các khối chồng lên nhau.
- **Tài liệu:** ghi chi tiết ở `docs/data/battles/cannae.md`, mục "Ngày trong năm" và mục 9.

### Đề nghị cho lane 1 (các module `whp_*.py`; tôi không sửa)

1. **Hàm dùng chung của `whp_unit_lod`.** `whp_unit_lod.build` gắn với khung người. Ngựa dùng lại các hàm bên trong nó:
   - `_finish_lod`;
   - `bake_selected_to_active`, `bake_ao`, với một đối tượng mô tả phần có các thuộc tính `name`, `bake`, `extrusion`, `ray`, `ao_alone`;
   - `compose_textures`, `compose_surface`.

   Đề nghị đổi `_finish_lod` thành hàm công khai và ghi rõ giao diện tối thiểu của `Part`, để đổi tên về sau không làm gãy `horse_lod.py`.
2. **Xuất clip.** `whp_export.export_glb` (chế độ ACTIONS) xuất **mọi** action trong file, không chỉ danh sách `clips`: bản xuất thử của ngựa có 6 action dù chỉ truyền 4. Với kỵ binh (T-022), file sẽ mang thêm `trot` và `canter` nếu không xoá. Đề nghị `export_glb` tạm bỏ fake user, hoặc tạm xoá, các action không có trong `clips`.
3. **Tên thuộc tính màu.** Không đặt tên `color` cho thuộc tính màu đỉnh: Cycles bake ra đen. Nên ghi vào `whp_lod` như một lưu ý.
4. **Ghép atlas người và ngựa (T-022).** Mỗi bên có một atlas 2048, mà hợp đồng chỉ cho một vật liệu. Cách đơn giản:
   - xếp UV của người vào nửa trái, của ngựa vào nửa phải, mỗi bên thu theo một trục và bake lại từ các lưới chi tiết;
   - hoặc gộp các phần thấp của cả hai vào một lần `unwrap_atlas` rồi bake một lượt. Các lưới chi tiết của ngựa vẫn nằm trong collection `detailed` của `horse.blend`, nên làm được.
5. **Kiểm tra trục.** `whp_export.check_glb` kiểm tra hướng bằng xương `foot_l`, `ball_l`, `head` của người, nên với ngựa trần thì phần đó tự bỏ qua. Mô hình kỵ binh có người cưỡi nên vẫn được kiểm tra.

### Đề nghị cho lane 3 (cảnh, T-023)

1. **Quay đầu 180°.** Khi `facing` của một khối đổi gần 180° mà tâm gần như đứng yên, cảnh đang xoay cả khối quanh tâm. Khối triarii rộng 820 m vì vậy quét ngang cả đạo quân. Đề nghị: trong trường hợp này, cho từng hình lính quay đầu tại chỗ, không xoay khối. Vì thế dữ liệu Cannae vẫn để triarii nhìn về nam ở giai đoạn 6 (`cannae.md`, mục 9).
2. **Tốc độ phát `run` của kỵ binh.** Một vòng `run` của ngựa (gallop) dài 0,4 s và chỉ không trượt chân ở 3,0 m/s. Nếu tăng tốc độ phát theo tốc độ khối quân thì nên giới hạn khoảng 1,5×, nếu không chân sẽ nhịp quá nhanh. Có thể dùng `canter` (2,11 m mỗi vòng 0,7 s) cho kỵ binh đi vừa.
3. **Dùng `dayOfYear`** (178 cho Cannae) để tính đường đi của mặt trời.

### Ghi chú quy trình

- Mọi lần chạy Blender của tôi đều chờ cho tới khi không còn `blender.exe` nào khác (script chờ kiểm tra `tasklist`).
- **Ngoại lệ:** một lần chạy chỉ đọc khoảng 6 giây, để xem cấu trúc file gốc, đã bắt đầu khi Blender của lane 1 đang chạy, trước khi tôi viết script chờ.
- Bake bằng Cycles trên CPU. Không để `blender.exe` nào chạy không.
