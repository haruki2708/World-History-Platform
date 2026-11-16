# Ghi công mô hình lính

Các mô hình trong `public/battles/models/` được dựng bằng script trong `art/blender/` từ những mô hình và thư viện dưới đây. Giấy phép CC BY 4.0 yêu cầu ghi tên tác giả, dẫn link, dẫn giấy phép và **nói rõ đã thay đổi gì**. Phần thay đổi liệt kê ở cuối mỗi mục.

## Thư viện hoạt hình (mọi mô hình)

**"Universal Animation Library"** và **"Universal Animation Library 2"**, tác giả **Quaternius**, bản Standard.
- Link: https://quaternius.com/packs/universalanimationlibrary.html, https://quaternius.com/packs/universalanimationlibrary2.html (tải từ https://quaternius.itch.io/universal-animation-library và https://quaternius.itch.io/universal-animation-library-2, ngày 2026-11-16).
- Giấy phép: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) (đọc trên hai trang và trong `License.txt` của mỗi file zip). CC0 không bắt ghi công; ghi ở đây cho minh bạch.
- Phần dùng: chuyển động của các clip `Idle_Loop`, `Walk_Loop`, `Jog_Fwd_Loop`, `Death01`, `Punch_Cross` (bản 1) và `OverhandThrow` (bản 2, cho kiểu phóng lao và ném đá, chưa có trong file `.glb` nào). Hình nộm và khung xương của thư viện không có trong file xuất.
- Đã thay đổi: đổi đích sang khung xương Celt (tư thế chữ A, tỉ lệ khác); chân giải lại bằng IK; tay trái giải lại để giữ khiên; tay phải đi theo đường đâm tự dựng trong `attack`; cổ tay xoay cho vũ khí chĩa đúng hướng; `die` được nâng lên và cúi đầu cho người mặc giáp nằm trên mặt đất; `javelin-throw` và `sling` giảm biên độ thân, `sling` có đường tay tự dựng. Chi tiết: `art/README.md`, mục "Thư viện hoạt hình".

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
- Phần dùng: khung xương 67 xương (thu nhỏ còn 0,8 lần) và trọng số gắn da. Lưới và ảnh vật liệu của mô hình Celt không có trong file xuất.

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
7. **Ảnh vật liệu:** toàn bộ ảnh màu và ảnh pháp tuyến bake lại thành một ảnh màu 2048×2048 (đã nhân độ che khuất môi trường) và một ảnh pháp tuyến 1024×1024, xếp trên một atlas. Hai ảnh này có điểm ảnh lấy từ ảnh vật liệu gốc của mô hình nền. Thêm một ảnh độ nhám và kim loại 1024×1024 (T-019): đồng, sắt, giáp lưới và lưỡi kiếm là kim loại.
8. **Hoạt hình** `idle`, `walk`, `run`, `attack`, `die`: lấy từ thư viện của Quaternius (xem mục đầu), đã chỉnh. Ba clip tạm tự làm của T-014 đã bỏ.

### Dòng ghi công gợi ý (cho hộp thoại Giới thiệu, README)

- Tiếng Việt: *Lính La Mã dựa trên "Roman Soldier - T pose" và khung xương của "Celt - rigged for UE4/5", cùng của Andywoodhead (Sketchfab, CC BY 4.0); đã sửa đổi. Hoạt hình từ Universal Animation Library của Quaternius (CC0).*
- English: *Roman soldiers based on "Roman Soldier - T pose" and the rig of "Celt - rigged for UE4/5", both by Andywoodhead (Sketchfab, CC BY 4.0); modified. Animations from the Universal Animation Library by Quaternius (CC0).*

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
