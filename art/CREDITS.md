# Ghi công mô hình lính

Các mô hình trong `public/battles/models/` được dựng bằng script trong `art/blender/` từ những mô hình dưới đây. Giấy phép CC BY 4.0 yêu cầu ghi tên tác giả, dẫn link, dẫn giấy phép và **nói rõ đã thay đổi gì**. Phần thay đổi liệt kê ở cuối mỗi mục.

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
   - chuyển bao kiếm từ hông trái sang hông phải.
4. **Đổi tư thế và tỉ lệ:** từ tư thế chữ T sang tư thế chữ A của khung xương Celt; co giãn từng đoạn cho khớp chiều dài xương (thân ngắn đi 9%, cánh tay trên ngắn 14%, cẳng tay dài thêm 12%); cả người cao 1,67 m.
5. **Gắn khung xương:** trọng số chuyển từ mô hình Celt sang.
6. **Giảm chi tiết** cho cảnh có hàng nghìn lính:
   - LOD0 và LOD1: giảm số tam giác từ lưới gốc và bỏ các mặt bị che;
   - LOD2: một hình người đơn giản dựng mới theo khung xương.
7. **Ảnh vật liệu:** toàn bộ ảnh màu và ảnh pháp tuyến bake lại thành một ảnh màu 2048×2048 (đã nhân độ che khuất môi trường) và một ảnh pháp tuyến 1024×1024. Hai ảnh này có điểm ảnh lấy từ ảnh vật liệu gốc của mô hình nền.
8. **Hoạt hình** `idle`, `walk`, `attack`: tự làm.

### Dòng ghi công gợi ý (cho hộp thoại Giới thiệu, README)

- Tiếng Việt: *Lính La Mã dựa trên "Roman Soldier - T pose" và khung xương của "Celt - rigged for UE4/5", cùng của Andywoodhead (Sketchfab, CC BY 4.0); đã sửa đổi.*
- English: *Roman soldier based on "Roman Soldier - T pose" and the rig of "Celt - rigged for UE4/5", both by Andywoodhead (Sketchfab, CC BY 4.0); modified.*
