# Ghi công mô hình lính

Các mô hình trong `public/battles/models/` được dựng bằng script trong `art/blender/` từ những mô hình và thư viện dưới đây. Giấy phép CC BY 4.0 yêu cầu ghi tên tác giả, dẫn link, dẫn giấy phép và **nói rõ đã thay đổi gì**. Phần thay đổi liệt kê ở cuối mỗi mục.

## Thư viện hoạt hình (mọi mô hình)

**"Universal Animation Library"** và **"Universal Animation Library 2"**, tác giả **Quaternius**, bản Standard.
- Link: https://quaternius.com/packs/universalanimationlibrary.html, https://quaternius.com/packs/universalanimationlibrary2.html (tải từ https://quaternius.itch.io/universal-animation-library và https://quaternius.itch.io/universal-animation-library-2, ngày 2026-11-16).
- Giấy phép: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) (đọc trên hai trang và trong `License.txt` của mỗi file zip). CC0 không bắt ghi công; ghi ở đây cho minh bạch.
- Phần dùng: chuyển động của các clip `Idle_Loop`, `Walk_Loop`, `Jog_Fwd_Loop`, `Death01`, `Punch_Cross` (bản 1) và `OverhandThrow` (bản 2: phóng lao của velites, ném đá của lính Baleares, chém kiếm của người Gaul). Hình nộm và khung xương của thư viện không có trong file xuất.
- Đã thay đổi: đổi đích sang khung xương Celt (tư thế chữ A, tỉ lệ khác); chân giải lại bằng IK; tay trái giải lại để giữ khiên; tay phải đi theo đường đâm, đường chém hay vòng quay dây tự dựng trong `attack`; cổ tay xoay cho vũ khí chĩa đúng hướng; giáo dài cầm dựng đứng khi không đánh; `die` được nâng lên và cúi đầu cho người mặc giáp nằm trên mặt đất; ba kiểu dùng `OverhandThrow` giảm nửa biên độ thân; túi đá của dây ném đi theo một xương riêng. Chi tiết: `art/README.md`, mục "Thư viện hoạt hình".

## `roman-legionary.glb`: lính bộ binh La Mã thời Cộng hoà

### Mô hình nền

**"Roman Soldier - T pose - free download"**, tác giả **Andywoodhead**.
- Link: https://sketchfab.com/3d-models/none-61cd5cae148042c38048bff2bd206af3
- Giấy phép: [Creative Commons Attribution 4.0 (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
- Phần dùng: thân người, đầu, mắt, tay, chân, áo tunic, xăng đan, kiếm, bao kiếm và ảnh vật liệu của các phần đó.

### Khung xương

**"Celt - rigged for UE4/5"**, tác giả **Andywoodhead**.
- Link: https://sketchfab.com/3d-models/none-f727e3ecfe5642fdb85a2def36d57539
- Giấy phép: [Creative Commons Attribution 4.0 (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
- Phần dùng: khung xương 67 xương (thu nhỏ còn 0,8 lần) và trọng số gắn da. Lưới và ảnh vật liệu của mô hình Celt không có trong file của lính La Mã (có trong `gallic-infantry.glb`, xem mục đó).

### Những gì đã thay đổi so với mô hình nền

1. **Bỏ** các phần thời Đế chế và các phần không cần:
   - giáp lá lorica segmentata (`Armour_top`) và dây buộc của nó (`Ties`);
   - mũ kiểu Gallic thời Đế chế (`Helmet3`);
   - khiên chữ nhật (`Scutum_04_01`);
   - tạp dề đai lưng (`Dangles`);
   - bao cổ tay da (`Wrist_guard1`);
   - một mảng thân bị áo che hết (`Full_figure_42_T_pose`).
2. **Thêm** trang bị thời Cộng hoà, tự dựng bằng script, vật liệu tự tạo:
   - mũ đồng kiểu Montefortino có hai má che và ba lông cắm;
   - áo giáp lưới (lorica hamata) có lớp che vai và móc ngực bằng đồng;
   - đai lưng da;
   - khiên bầu dục cong (scutum) có gờ dọc, núm và tấm sắt, viền sắt ở hai đầu.
3. **Sửa** các phần giữ lại:
   - nắm hai bàn tay lại, đặt kiếm vào nắm tay phải;
   - chuyển bao kiếm từ hông trái sang hông phải; bao kiếm đi theo nửa hông, nửa đùi phải.
4. **Đổi tư thế và tỉ lệ:** từ tư thế chữ T sang tư thế chữ A của khung xương Celt; co giãn từng đoạn cho khớp chiều dài xương (thân ngắn đi 9%, cánh tay trên ngắn 14%, cẳng tay dài thêm 12%); cả người cao 1,67 m.
5. **Gắn khung xương:** trọng số chuyển từ mô hình Celt sang.
6. **Giảm chi tiết** cho cảnh có hàng nghìn lính:
   - LOD0 và LOD1: giảm số tam giác từ lưới gốc và bỏ các mặt bị che;
   - LOD2: một hình người đơn giản dựng mới theo khung xương.
7. **Ảnh vật liệu:** toàn bộ ảnh màu và ảnh pháp tuyến bake lại thành một ảnh màu 2048×2048 (đã nhân độ che khuất môi trường) và một ảnh pháp tuyến 1024×1024, xếp trên một atlas. Hai ảnh này có điểm ảnh lấy từ ảnh vật liệu gốc của mô hình nền. Thêm một ảnh độ nhám và kim loại 1024×1024 (T-019): đồng, sắt, giáp lưới và lưỡi kiếm là kim loại. T-021: màu gốc của kim loại sáng lên thành màu phản xạ của kim loại (đồng vàng đậm, sắt xám sáng).
8. **Hoạt hình** `idle`, `walk`, `run`, `attack`, `die`: lấy từ thư viện của Quaternius (xem mục đầu), đã chỉnh. Ba clip tạm tự làm của T-014 đã bỏ.

### Dòng ghi công gợi ý (cho hộp thoại Giới thiệu, README)

Dòng này dùng chung cho mọi mô hình lính (sửa ở T-021: mô hình Celt giờ là mô hình nền của người Gaul, không chỉ cho khung xương).

- Tiếng Việt: *Các mô hình lính dựa trên "Roman Soldier - T pose" và "Celt - rigged for UE4/5", cùng của Andywoodhead (Sketchfab, CC BY 4.0); đã sửa đổi. Hoạt hình từ Universal Animation Library của Quaternius (CC0).*
- English: *Soldier models based on "Roman Soldier - T pose" and "Celt - rigged for UE4/5", both by Andywoodhead (Sketchfab, CC BY 4.0); modified. Animations from the Universal Animation Library by Quaternius (CC0).*

## `roman-hastatus.glb`: lính hastatus (hàng đầu) thời Cộng hoà

### Mô hình nền và khung xương

Như `roman-legionary`: **"Roman Soldier - T pose - free download"** và khung xương của **"Celt - rigged for UE4/5"**, cùng của **Andywoodhead**, giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (link ở mục trên). Phần dùng như `roman-legionary`. Hoạt hình: thư viện của Quaternius (CC0).

### Những gì đã thay đổi so với mô hình nền

1. **Bỏ** như `roman-legionary` (mục 1 ở trên).
2. **Thêm**, tự dựng bằng script, vật liệu tự tạo:
   - mũ đồng Montefortino có má che và ba lông, khiên bầu dục, đai lưng da: như `roman-legionary`;
   - **không** có giáp lưới; thay vào đó một tấm đồng vuông 22 × 22 cm che ngực (*pectorale*), có gờ cuộn và núm tròn, buộc bằng dây da qua hai vai và một đai quanh ngực;
   - hai tấm che ống chân bằng đồng, ôm cẳng chân, hở phía sau;
   - hai cây *pilum* dài khoảng 2 m (một cây to: cán gỗ có khối vuông ở đầu, thân sắt chuôi dẹt; một cây mảnh: mũi sắt có ống tra cán), cầm dựng đứng trong tay trái sau khiên.
3. **Sửa** các phần giữ lại, **đổi tư thế và tỉ lệ**, **gắn khung xương**, **giảm chi tiết**, **ảnh vật liệu**: như `roman-legionary` (mục 3–7); áo tunic lộ hoàn toàn nên giữ nhiều tam giác hơn.
4. **Hoạt hình:** năm clip như `roman-legionary`.

### Dòng ghi công gợi ý

Dùng chung dòng của `roman-legionary` ("Lính La Mã dựa trên…").

## Sáu mô hình bộ binh của T-021

Năm mô hình đầu dựng trên cùng mô hình nền và khung xương như `roman-legionary`: **"Roman Soldier - T pose - free download"** và khung xương của **"Celt - rigged for UE4/5"**, cùng của **Andywoodhead**, giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (link ở trên). Mỗi mô hình đều **bỏ** các phần thời Đế chế như `roman-legionary` (mục 1), **đổi tư thế và tỉ lệ**, **gắn khung xương**, **giảm chi tiết**, **bake ảnh vật liệu** như mục 4–7, và có năm clip từ thư viện của Quaternius. Dưới đây chỉ ghi phần khác. Trang bị tự dựng đều bằng script, vật liệu tự tạo.

### `roman-triarii.glb`: triarii (hàng thứ ba)

- **Như `roman-legionary`:** mũ Montefortino có ngù, giáp lưới, khiên bầu dục, đai.
- **Thêm:** giáo đâm *hasta* dài 2,3 m (cán gỗ, mũi sắt hình lá có ống tra cán, đế sắt).
- **Sửa:** kiếm của mô hình nền cất vào bao ở hông phải (tay phải cầm giáo).
- **Hoạt hình:** giáo cầm dựng đứng cạnh đùi khi đứng, đi, chạy; `attack` là đâm giáo tầm hông qua mép phải khiên.

### `roman-velites.glb`: velites (lính nhẹ La Mã)

- **Bỏ thêm:** không giáp; mũ không ngù.
- **Thêm:** khiên tròn *parma* đường kính 0,9 m, có núm sắt và viền; tấm da sói phủ lên mũ (có tai và vạt sau gáy); bốn cây lao nhẹ (một trong tay phải, ba cây dựng sau khiên); đai.
- **Sửa:** kiếm cất vào bao.
- **Hoạt hình:** `attack` là phóng lao.

### `libyan-infantry.glb`: bộ binh Libya

- **Như `roman-legionary`:** giáp lưới, mũ, khiên bầu dục, kiếm (đồ La Mã thu được).
- **Bỏ thêm:** ngù lông trên mũ.
- **Sửa:** áo nhuộm lại màu nâu đất của len mộc (ảnh vật liệu gốc đổi màu, giữ nếp vải); mặt khiên màu da nhạt; da sẫm hơn (ảnh vật liệu da nhân thêm màu).
- **Thêm:** râu ngắn, dựng từ chính lưới đầu của mô hình nền (một lớp vỏ đẩy ra 4–5 mm).

### `iberian-infantry.glb`: bộ binh Iberia, cũng dùng cho lính giáo nhẹ

- **Bỏ thêm:** không giáp; không mũ đồng.
- **Sửa:** áo nhuộm trắng như vải lanh, có viền đỏ tía 5 cm ở gấu và tay áo; da màu ô liu.
- **Thêm:** mũ bằng gân; khiên bầu dục dài, gần phẳng, có gờ dọc, núm hình thoi và đai sắt ngang (kiểu La Tène), mặt bọc da bò; hai cây lao dài 1,55 m sau khiên; đai.
- **Giữ:** kiếm ngắn của mô hình nền trong tay phải.

### `balearic-slinger.glb`: lính ném đá Baleares

- **Bỏ thêm:** không giáp, không mũ, không khiên; bỏ cả kiếm và bao kiếm.
- **Sửa:** áo nhuộm màu len mộc, viền rộng 10 cm màu tía sẫm ở gấu; da màu ô liu.
- **Thêm:** ba dây ném đá (một quấn hai vòng quanh đầu, một quấn quanh bụng thay đai, một cầm tay có túi và hòn đá); túi đá bằng da ở hông trái; tóc và râu sẫm (vỏ dựng từ lưới đầu).
- **Hoạt hình:** `attack` là quay dây trên đầu rồi ném qua vai; dây cầm tay co giãn theo hòn đá.

### `gallic-infantry.glb`: bộ binh Gaul

**Mô hình nền:** **"Celt - rigged for UE4/5"**, tác giả **Andywoodhead**.
- Link: https://sketchfab.com/3d-models/none-f727e3ecfe5642fdb85a2def36d57539
- Giấy phép: [Creative Commons Attribution 4.0 (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
- Phần dùng: thân, đầu (tóc, ria mép), tay, chân và quần, đai, vòng cổ và vòng tay, ảnh vật liệu (màu, pháp tuyến, kim loại) của các phần đó, khung xương và trọng số.

**Những gì đã thay đổi:**
1. **Bỏ** khiên tròn và kiếm ngắn của mô hình nền (chỉ dùng để biết chỗ hai bàn tay cầm).
2. **Sửa ảnh vật liệu:**
   - xoá hình vẽ màu xanh trên ngực, lưng, tay và mặt: lấp bằng màu da lành xung quanh, làm phẳng ảnh pháp tuyến ở đó;
   - nhuộm lại quần sọc xanh lá và tím thành sọc vàng đất và nâu đỏ.
3. **Thêm**, tự dựng: kiếm dài chém, đầu tròn không mũi (lưỡi 0,78 m); khiên bầu dục dài kiểu La Tène như của người Iberia, mặt sơn xanh chàm.
4. **Thu nhỏ** còn 0,8 lần (cao 1,67 m), giữ nguyên tư thế (mô hình nền đã đứng đúng tư thế của khung xương).
5. **Giảm chi tiết**, **bake ảnh vật liệu** và **hoạt hình** như các mô hình khác; `attack` là chém bổ từ trên vai xuống.

## Ngựa (`art/build/horse/horse.blend`, cho kỵ binh ở T-022)

Ngựa không xuất thành file `.glb` riêng: T-022 ghép người cưỡi lên ngựa rồi mới xuất. Mục này ghi công cho phần ngựa trong các mô hình kỵ binh.

### Lưới ngựa

**"Horse"**, tác giả **Tarnyloo** (Blend Swap, blend số 17172; trong file tải về đánh số cũ 83562).
- Link: https://blendswap.com/blend/17172
- Giấy phép: [Creative Commons Attribution 3.0 (CC BY 3.0)](https://creativecommons.org/licenses/by/3.0/). Trang chỉ ghi "CC-BY", không ghi phiên bản. Tệp giấy phép trong file zip (`83562 - LICENSE.html`) ghi "Released under Creative Commons Attribution 3.0", kèm yêu cầu nêu tên tác giả trong bản sao và bản sửa đổi.
- Phần dùng: lưới thân ngựa (22 514 đỉnh), gồm cả mắt, răng và lợi; không dùng vật liệu nào (file gốc không có ảnh vật liệu).

### Khung xương và dáng đi

**"Horse Rigged All Gaits"**, tác giả **fdoss001** (Blend Swap, blend số 28627).
- Link: https://blendswap.com/blend/28627
- Giấy phép: CC0 ("Free to use. No need to credit me"). Không bắt ghi công; ghi ở đây cho minh bạch.
- File này dùng lưới của Tarnyloo, có sửa rất ít. Script đã so: cùng số đỉnh, và sau khi khớp tỉ lệ và vị trí, đỉnh lệch nhau nhiều nhất 1,2% kích thước con ngựa. Vì vậy lưới vẫn theo giấy phép CC BY của Tarnyloo.
- Phần dùng:
  - trọng số gắn da của 80 xương biến dạng;
  - vị trí các xương đó trong các action `horse.walk`, `horse.trot`, `horse.canter`, `horse.gallop`, `horse.head.shake`, `horse.tail.flick.left` và `horse.tail.flick.right`.
- Phần không dùng:
  - khung Rigify điều khiển (456 xương);
  - lông dạng hạt;
  - yên, bàn đạp, dây cương, hàm thiếc;
  - mọi ảnh vật liệu trong file: ảnh của các add-on thương mại "Extreme PBR" và "materialiq", và ảnh mắt `brown_eye.png`. Các ảnh này không rõ giấy phép.

### Những gì đã thay đổi

1. **Bỏ:**
   - yên kiểu hiện đại;
   - bàn đạp, chưa có vào năm 216 TCN;
   - dây cương có hàm thiếc của file gốc;
   - lông bờm, đuôi, mi và lông thân dạng hạt (lưới trong game không mang được);
   - ba khoá hình dạng chỉnh cổ;
   - toàn bộ vật liệu.
2. **Đổi tỉ lệ:** cao 1,40 m tới vai, xem `art/README.md`, mục "Ngựa".
3. **Khung xương mới:**
   - 40 xương tên `horse_*`;
   - xương sọ, hàm, mắt, mũi, tai, gốc bờm, ngực và hông được gộp vào xương cha, vì không dáng đi nào làm chúng chuyển động so với xương cha;
   - mỗi đoạn chân của file gốc gồm hai xương lệch nhau dưới 4°, nay gộp làm một;
   - thêm xương `horse_saddle` để gắn người cưỡi.
4. **Thêm**, tự dựng bằng script, vật liệu tự tạo:
   - **bờm** cắt ngắn dựng đứng và **đuôi**;
   - **vải lót yên** bằng len đỏ, có viền sẫm, và **đai bụng** da;
   - **dây cương đơn giản:** dây đầu, dây mũi, hai vòng sắt ở khoé miệng, dây cầm;
   - **dây quàng cổ** cho ngựa Numidia.
5. **Màu lông:** ngựa hồng (bay), tự tô:
   - thân nâu đỏ, bụng sáng hơn;
   - mõm sẫm;
   - cẳng chân đen.
6. **Hoạt hình:**
   - `walk`, `run` (từ `horse.gallop`), `trot`, `canter` lấy mẫu lại ở 30 khung/giây; vòng `walk` được khép lại ở đuôi;
   - `idle` ghép từ tư thế đứng, lắc đầu, vẫy đuôi và nhịp thở tự thêm;
   - `die` tự làm bằng keyframe.
7. **Giảm chi tiết:**
   - LOD0 và LOD1 giảm số tam giác từ lưới gốc;
   - LOD2 là hình đơn giản dựng mới theo khung xương;
   - màu, pháp tuyến, độ nhám và AO bake vào một atlas.

### Dòng ghi công gợi ý (cho hộp thoại Giới thiệu, README)

- Tiếng Việt: *Ngựa dựa trên "Horse" của Tarnyloo (Blend Swap, CC BY 3.0), khung xương và dáng đi từ "Horse Rigged All Gaits" của fdoss001 (Blend Swap, CC0); đã sửa đổi.*
- English: *Horse based on "Horse" by Tarnyloo (Blend Swap, CC BY 3.0), with the rig and gaits of "Horse Rigged All Gaits" by fdoss001 (Blend Swap, CC0); modified.*
