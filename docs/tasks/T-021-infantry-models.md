# T-021: Sáu loại bộ binh còn lại cho trận Cannae

- **Lane:** 1
- **Model đề xuất:** Fable 5.2, effort `high`. Hết hạn mức thì dùng Opus 5.5, effort `xhigh`.
- **Nhánh:** `lane1/T-021-infantry-models` (tạo từ `main` mới nhất)
- **Phạm vi file:** `art/` (trừ các file ngựa của lane 2: `art/blender/horse_*.py`, `art/renders/horse/`, `art/build/horse/`), `public/battles/models/`

## Bối cảnh

T-019 đã gộp: thư viện hoạt hình chung, `roman-legionary` năm clip, `roman-hastatus`, quy trình `build_model.py` dùng lại được. Trong cảnh Cannae, hastati đã dùng mô hình mới.

Task này làm nốt **sáu mô hình bộ binh**. Tên mô hình đã có sẵn trong `src/data/battles/unit-types.json`, nên chỉ cần xuất đúng tên là cảnh tự dùng:

| Mô hình | Loại lính dùng nó | Phe |
|---|---|---|
| `roman-triarii` | triarii | La Mã |
| `roman-velites` | velites, bộ binh nhẹ đồng minh | La Mã |
| `libyan-infantry` | bộ binh Libya | Carthage |
| `gallic-infantry` | bộ binh Gaul | Carthage |
| `iberian-infantry` | bộ binh Iberia, lính giáo nhẹ | Carthage |
| `balearic-slinger` | lính ném đá Baleares | Carthage |

Sau task này còn T-022 (3 loại kỵ binh, ghép người cưỡi lên ngựa của lane 2). **Lane 2 đang làm ngựa (T-020) song song trong `art/`**, chỉ ở các file ngựa nêu trên.

## Đọc trước

- `docs/ARCHITECTURE.md`, mục "Mô hình lính" (mới thêm độ dài vòng `walk`/`run` và cách cảnh phát `die`).
- `art/README.md`, mục thêm mô hình mới, và `art/CREDITS.md`.
- `docs/tasks/T-019-animations-hastatus.md`, mục "Kết quả", nhất là "Còn chưa ưng ý".
- `docs/tasks/T-018-battle-scene-polish.md`, mục "Đề nghị ngoài phạm vi", ý 2: lane 3 góp ý màu kim loại.

## Yêu cầu

Commit sau mỗi mô hình. Nếu sắp hết hạn mức thì ghi bảng tiến độ vào mục "Kết quả" rồi commit.

### 0. Kim loại sáng đúng trong cảnh thật

Cả lane 1 (T-019) lẫn lane 3 (T-018) đều thấy màu gốc của kim loại quá tối.
- Theo cách làm kim loại của glTF, màu gốc ở chỗ kim loại chính là màu phản xạ. Lane 3 dẫn bảng tham khảo: sắt khoảng sRGB (196, 197, 199), đồng đỏ khoảng (250, 209, 194); đồng thau nằm giữa đồng đỏ và vàng.
- Độ nhám gợi ý: đồng bóng 0,3–0,45; giáp lưới 0,5–0,6.
- Sửa trong `whp_materials` để mọi mô hình dùng chung, xuất lại `roman-legionary` và `roman-hastatus`.
- **Xem trong cảnh three.js**, không chỉ ảnh EEVEE:
  - chạy `npm run dev -- -p 3101`, mở `/battle-lab`;
  - phóng gần hàng đầu quân La Mã lúc dàn trận (08:00) và lúc trưa;
  - chụp ảnh trước và sau, để ngoài repo hoặc trong `art/renders/<model>/`.

### 1. Sáu mô hình

Thứ tự đề xuất: từ dễ (dùng lại đồ La Mã) tới khó (mô hình nền khác).

**`roman-triarii`** (Polybius 6.23)
- Lính lâu năm. Trang bị như principes, nhưng cầm **giáo đâm *hasta*** thay cho *pilum*.
- Giáp lưới, mũ, khiên bầu dục như `roman-legionary`; kiếm vẫn đeo bên hông.
- `attack`: kiểu `spear-thrust`.

**`roman-velites`** (Polybius 6.21–22)
- Lính trẻ và nghèo nhất. Không giáp.
- **Khiên tròn *parma*** đường kính khoảng 3 bộ La Mã (khoảng 90 cm).
- **Vài cây lao nhẹ**: cán dài khoảng 2 cubit (khoảng 90 cm), to bằng ngón tay, mũi sắt mảnh dài khoảng một gang tay.
- Mũ trơn, một số người trùm da sói hay da thú lên mũ. Có kiếm.
- `attack`: kiểu `javelin-throw`.

**`libyan-infantry`** (Polybius 3.87, 3.114; Livy 22.46)
- Hannibal trang bị lại người Libya bằng vũ khí La Mã thu được ở Trebia và Trasimene. Livy viết rằng nhìn họ tưởng là quân La Mã.
- Dựng từ đồ La Mã, nhưng **phải phân biệt được với lính La Mã ở khoảng cách gần**: áo không nhuộm đỏ (vải mộc, màu đất hay màu khác có căn cứ), khiên không cùng màu với khiên La Mã. Ghi lý do chọn màu.
- Có giữ giáo hay không thì tự chọn theo nguồn, ghi lý do.

**`gallic-infantry`** (Polybius 2.28–30, 3.114; Livy 22.46)
- Ở Cannae, người Gaul đánh **cởi trần từ thắt lưng trở lên**, mặc quần dài (*bracae*).
- **Kiếm dài chém**, không mũi nhọn; **khiên bầu dục dài**.
- Mô hình nền gợi ý: "Celt - rigged for UE4/5" của Andywoodhead. Lưới đã có trong `E:\World_History_Platform_assets\sources\celt-andywoodhead\`, cùng giấy phép CC BY 4.0, cùng khung xương.
- `attack`: một kiểu chém kiếm mới, thêm vào `whp_clips.ATTACKS` (ví dụ dựa trên các clip `Sword_*` của thư viện). Polybius nói người Gaul chỉ chém được, không đâm được.

**`iberian-infantry`** (Polybius 3.114; Livy 22.46)
- **Áo ngắn bằng vải lanh trắng viền đỏ tía**.
- Khiên giống khiên người Gaul; **kiếm ngắn dùng được cả đâm lẫn chém**.
- Mũ: chọn theo hiện vật (mũ đồng, hay mũ bằng gân như Strabo 3.3.6 tả), ghi nguồn.
- Lính giáo nhẹ cũng dùng mô hình này, nên mô hình nên trông được cho cả hai.
- `attack`: `sword-thrust` hoặc kiểu khác hợp với kiếm, tự chọn.

**`balearic-slinger`** (Diodorus 5.18; Strabo 3.5.1)
- Gần như không giáp, áo nhẹ.
- **Ba dây ném đá**: một quấn quanh đầu, một quanh bụng, một cầm tay. Túi đá.
- `attack`: kiểu `sling`. T-019 ghi kiểu này mới chỉnh sơ và dây là vật cứng, nên phải chỉnh lại cho đúng mô hình.

**Chung cho cả sáu:**
- Đúng hợp đồng: một khung xương 67 xương; `LOD0..2` trong giới hạn tam giác; một vật liệu; năm clip; ảnh pháp tuyến và ảnh độ nhám/kim loại nếu có kim loại.
- **Dung lượng:** cố giữ mỗi file khoảng 2 MB. Cannae dùng cả 8 mô hình bộ binh, cộng 3 kỵ binh sau này. Ghi tổng dung lượng thư mục `public/battles/models/` trong "Kết quả".
- **Khác mặt mũi:** mọi mô hình hiện cùng một khuôn mặt và dáng người. Nếu làm được không tốn nhiều, đổi chút cho người Gaul, Iberia, Libya, Baleares (tóc, râu, màu da theo nguồn), ghi cách làm.
- Hình dáng chỉ tham khảo hiện vật bảo tàng, văn bản cổ và tranh thuộc phạm vi công cộng. Ghi nguồn tham khảo cho từng mô hình.
- Mỗi mô hình chạy lại từ đầu ra file giống hệt từng byte.

### 2. Tải thêm mô hình nền (nếu cần)

- Ưu tiên dùng lại mô hình đã tải (lính La Mã, Celt). Cần mô hình khác thì đọc giấy phép trước; chỉ dùng CC0 hay CC BY.
- Sketchfab và trang khác thường bắt đăng nhập để tải. **Không tự tạo tài khoản.** Khi cần đăng nhập thì dừng lại, ghi link và thư mục đích (`E:\World_History_Platform_assets\sources\<tên>\`) rồi báo người dùng. Người dùng sẽ tự tải.

### 3. Ảnh duyệt

Trong `art/renders/<model>/`, JPEG, mỗi ảnh tối đa 400 KB, render từ chính file `.glb`. Mỗi mô hình ít nhất:
- nhìn trước, nghiêng, sau;
- nhìn chéch;
- ba mức LOD;
- `attack` ba khung hình, `die` ba khung hình;
- đứng cạnh `roman-legionary` để so tỉ lệ.

Thêm một ảnh chung `art/renders/infantry-lineup.jpg`: cả 8 mô hình bộ binh đứng thành hàng, nhìn trước.

### 4. Ghi công

Cập nhật `art/CREDITS.md`: mục cho từng mô hình mới (mô hình nền, giấy phép, những gì đã sửa), và dòng ghi công gợi ý nếu có thay đổi.

## Ràng buộc

- Như T-019:
  - không đưa file gốc hay `art/build/` vào repo;
  - không dùng tài sản chưa đọc giấy phép, tài sản NC hay ND, hay tài sản trích từ game;
  - không sửa `src/`;
  - không thêm thư viện npm.
- Không sửa các file ngựa của lane 2. Đổi tên hay chữ ký hàm trong `whp_*.py` thì ghi vào "Kết quả", vì lane 2 đang import các module này.
- Lane 3 có thể đang đo hiệu năng. Bake bằng Cycles thì giữ CPU, và không để `blender.exe` chạy khi không cần.

## Xong khi

- Sáu file `.glb` mới đúng hợp đồng, có trong `index.json`. `roman-legionary` và `roman-hastatus` đã xuất lại với kim loại mới.
- `/battle-lab` với Cannae: khung số đo (`?stats=1`) ghi `file` cho cả 8 loại bộ binh, console sạch.
- Chạy lại script từ đầu ra file giống hệt từng byte.
- Có đủ ảnh duyệt và ghi công.
- `npm run validate`, `npm run lint`, `npm run build` qua.

## Kết quả

_(Lane 1 điền khi xong.)_
