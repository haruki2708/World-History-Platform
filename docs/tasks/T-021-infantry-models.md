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

Xong cả sáu mô hình và bước 0. Nhánh `lane1/T-021-infantry-models`, mỗi bước một commit (bước 0, rồi mỗi mô hình một commit, cuối cùng là ảnh duyệt, ghi công, tài liệu).

### Bảng tóm tắt

| Mô hình | Tam giác LOD0 / LOD1 / LOD2 | Dung lượng | `attack` | Mô hình nền |
|---|---|---|---|---|
| `roman-legionary` (xuất lại) | 7 483 / 1 360 / 296 | 2 216 804 B | `sword-thrust` | lính La Mã |
| `roman-hastatus` (xuất lại) | 7 340 / 1 301 / 294 | 1 892 668 B | `sword-thrust` | lính La Mã |
| `roman-triarii` | 7 499 / 1 360 / 288 | 2 225 464 B | `spear-thrust` | lính La Mã |
| `roman-velites` | 6 615 / 1 240 / 264 | 1 809 156 B | `javelin-throw` | lính La Mã |
| `libyan-infantry` | 7 638 / 1 362 / 277 | 2 221 088 B | `sword-thrust` | lính La Mã |
| `iberian-infantry` | 6 185 / 1 165 / 271 | 1 737 716 B | `sword-thrust` | lính La Mã |
| `balearic-slinger` | 5 996 / 1 132 / 230 | 1 715 604 B | `sling` | lính La Mã |
| `gallic-infantry` | 6 144 / 1 083 / 235 | 1 831 368 B | `sword-slash` (mới) | Celt |

- **Tổng thư mục `public/battles/models/`:** 15 650 034 byte cho 8 file `.glb` (khoảng 14,9 MiB, trung bình 1,96 MB mỗi file), cộng `index.json`.
- Mọi file: một khung xương 67 xương, một vật liệu (ảnh màu 2048, ảnh pháp tuyến 1024, ảnh độ nhám/kim loại 1024), đủ năm clip, đứng trên y = 0, có tên trong `index.json`. Bước kiểm tra của script qua cho cả 8.
- Một vòng `walk` vẫn là 1,00 m trong 1,333 s, một vòng `run` 1,99 m trong 0,933 s, ở mọi mô hình (cùng thư viện, cùng khung xương).

### Đối chiếu "Xong khi"

- **Sáu file mới đúng hợp đồng, có trong `index.json`;** `roman-legionary`, `roman-hastatus` đã xuất lại với kim loại mới.
- **`/battle-lab?stats=1` với Cannae:** khung số đo ghi `file` cho cả 8 loại mô hình bộ binh (`roman-velites`, `roman-hastatus`, `roman-legionary`, `roman-triarii`, `libyan-infantry`, `iberian-infantry`, `gallic-infantry`, `balearic-slinger`); chỉ ba mô hình kỵ binh còn `placeholder`. Console sạch: không có lỗi, không có cảnh báo (chụp bằng Chrome không giao diện, điều khiển qua DevTools).
- **Chạy lại từ đầu ra file giống hệt từng byte:** `build_model.py -- --model all` dựng lại cả 8 mô hình từ file gốc (19 phút). Cả 8 file ra giống hệt từng byte các file đã commit, vốn được dựng ở những lần chạy riêng trước đó (`git status` không thấy thay đổi). SHA-256 (12 ký tự đầu):

  | File | SHA-256 |
  |---|---|
  | `balearic-slinger.glb` | `deb6b35c32b0` |
  | `gallic-infantry.glb` | `8260427ef9a7` |
  | `iberian-infantry.glb` | `2151b989e0c9` |
  | `libyan-infantry.glb` | `c2257e561c62` |
  | `roman-hastatus.glb` | `e6934f7599bc` |
  | `roman-legionary.glb` | `96f66a4009da` |
  | `roman-triarii.glb` | `594d989a26fb` |
  | `roman-velites.glb` | `7fe6802dfca8` |

- **Ảnh duyệt và ghi công:** đủ (xem dưới); `art/CREDITS.md` có mục cho từng mô hình mới.
- **`npm run validate`, `npm run lint`, `npm run build`:** đều qua. `validate` không còn cảnh báo nào (mô hình nào cũng có loại lính dùng).

### 0. Kim loại

- **Sửa trong `whp_materials`** (mọi mô hình dùng chung). Màu gốc của kim loại giờ là màu phản xạ của kim loại:
  - sắt: sRGB khoảng (197, 198, 201), như bảng lane 3 dẫn;
  - đồng: sRGB khoảng (231, 182, 115), nằm giữa đồng đỏ và vàng nhưng **đậm màu hơn** giá trị tham khảo. Lần đầu tôi đặt màu nhạt hơn, khoảng (238, 201, 156): trong cảnh three.js mũ trông như bạc, vì kim loại phản chiếu bầu trời xanh nhạt và màu nhạt bị rửa trôi;
  - giáp lưới: màu vòng lấy thẳng màu sắt (trước nhân thêm 1,45).
- **Độ nhám:** đồng 0,40, sắt 0,42, giáp lưới 0,55.
- **Xem trong cảnh three.js:** `/battle-lab` (cổng 3101), phóng gần hàng đầu quân La Mã lúc 08:00 và 12:00, cùng một góc camera trước và sau. Ảnh ghép: `art/renders/roman-legionary/15-scene-metal-before-after.jpg`.
  - Trước: mũ màu đồng sẫm, giáp lưới xám tối.
  - Sau: mũ vàng đồng sáng hơn, giáp lưới xám sáng, núm khiên sáng rõ.
- Ảnh EEVEE của hai mô hình La Mã đã render lại (`12-metal-before-after.jpg` giờ so "không có ảnh độ nhám/kim loại" với màu mới).

### 1. Sáu mô hình

**`roman-triarii`** (Polybius 6.23):
- Đồ như `roman-legionary` (giáp lưới, mũ có ngù, khiên bầu dục); kiếm của mô hình nền cất vào bao ở hông phải.
- Giáo *hasta* 2,3 m: cán gỗ, mũi sắt hình lá có ống tra cán, đế sắt nhọn. Tay phải cầm cách đế 0,72 m.
- Khi đứng, đi, chạy: giáo **cầm dựng đứng** cạnh đùi (cánh tay giải bằng IK, cẳng tay đưa ra trước), đế giáo cách đất vài cm, mũi cao khoảng 2,4 m. Khi ngã, giáo nằm ngang trên mặt đất.
- `attack`: `spear-thrust`, đã chỉnh để cán giáo chạy qua mép phải khiên (bản T-019 xuyên qua khiên).

**`roman-velites`** (Polybius 6.21–22):
- Không giáp; áo đỏ như các mô hình La Mã khác.
- Khiên tròn *parma* đường kính 0,9 m, mặt hơi lồi, núm sắt nhỏ, viền sắt.
- Mũ trơn (không ngù), phủ tấm da sói có hai tai và vạt da sau gáy.
- Bốn cây lao nhẹ đúng số đo Polybius: cán 0,9 m to 1,9 cm, mũi sắt mảnh. Một cây trong tay phải, ba cây dựng sau khiên. Kiếm trong bao.
- `attack`: `javelin-throw`.

**`libyan-infantry`** (Polybius 3.87, 3.114; Livy 22.46):
- Đồ La Mã thu được: giáp lưới, mũ Montefortino, khiên bầu dục, kiếm. Giữ kiếm và `sword-thrust`, **không cầm giáo**: Polybius và Livy đều nói họ được trang bị "theo kiểu La Mã" bằng vũ khí thu được, và cách đánh của lính La Mã năm 216 là kiếm và *pilum*; giáo đâm chỉ là của triarii.
- Khác lính La Mã ở khoảng cách gần:
  - **áo màu nâu đất của len không nhuộm** (ảnh vật liệu gốc nhuộm lại, giữ nếp vải): đồ thu được là vũ khí, áo là của họ;
  - **mặt khiên màu da nhạt**. Không có nguồn nào cho màu khiên của người Libya; chọn màu này để khác hẳn khiên đỏ La Mã (khiên thu được có thể bọc da hay sơn lại);
  - **mũ không có ngù lông**: ngù ba lông là dấu hiệu của lính La Mã (Polybius 6.23);
  - da sẫm hơn, râu ngắn sẫm màu.

**`iberian-infantry`** (Polybius 3.114; Livy 22.46; Strabo 3.3.6):
- Áo ngắn trắng như vải lanh, viền đỏ tía 5 cm ở gấu và hai tay áo. Viền là một thuộc tính đánh dấu trên lưới áo gốc, bake vào ảnh màu.
- Khiên bầu dục dài, gần phẳng, kiểu La Tène như của người Gaul (gờ dọc, núm hình thoi, đai sắt ngang), mặt bọc da bò.
- Kiếm ngắn của mô hình nền (dáng *gladius*, vừa đâm vừa chém) và `sword-thrust`.
- **Mũ bằng gân** theo Strabo 3.3.6 ("phần đông đội mũ làm bằng gân"): mũ tròn thấp, sát đầu, viền cuộn. Chọn mũ gân thay mũ đồng để khác hẳn lính La Mã và người Libya.
- Hai cây lao dài 1,55 m sau khiên, để cùng mô hình dùng được cho lính giáo nhẹ. Da màu ô liu.

**`balearic-slinger`** (Diodorus 5.17–18; Strabo 3.5.1):
- Không giáp, không mũ, không khiên, không kiếm.
- Áo len mộc với viền rộng 10 cm màu tía sẫm ở gấu (Strabo: áo có viền rộng).
- Ba dây ném đá màu đen (Strabo: bằng cói đen, lông hay gân): một quấn hai vòng quanh đầu, một quấn quanh bụng thay đai, một cầm tay có túi và hòn đá. Thêm túi đá bằng da ở hông trái. Tóc và râu sẫm, da ô liu.
- **Dây cầm tay không còn là vật cứng:** túi và hòn đá gắn vào xương `ik_hand_gun` (xương IK của khung, không lưới nào dùng); hai sợi dây có trọng số chuyển dần từ bàn tay sang xương đó. Mọi clip đặt xương vào chỗ hòn đá:
  - đứng, đi, chạy: dây treo thẳng dưới tay;
  - ngã: dây nằm dọc mặt đất;
  - `attack`: quay một vòng rưỡi trên đầu (hòn đá chạy sau bàn tay), vung lên sau vai, ném ra trước và lên, rồi dây rũ xuống.

**`gallic-infantry`** (Polybius 2.28–33, 3.114; Livy 22.46; Diodorus 5.28–30):
- Mô hình nền là chính mô hình Celt của khung xương (đã có trong thư mục nguồn, cùng giấy phép). Phép khớp vào khung là phép đồng nhất, trọng số là của chính mô hình.
- Mô hình Celt có sẵn những thứ đúng nguồn: cởi trần, quần dài, đai, vòng cổ và vòng tay bằng vàng (Polybius 2.29), ria mép và tóc vàng (Diodorus 5.28). Ảnh kim loại của mô hình nền được giữ, nên vòng vàng sáng ánh kim.
- **Đã sửa ảnh vật liệu bằng script:**
  - xoá hình vẽ màu xanh trên ngực, lưng, tay và mặt. Người Briton vẽ mình là chuyện của Caesar; không nguồn nào nói người Gaul ở Cannae vẽ mình. Vùng sơn được lấp bằng màu da lành xung quanh, ảnh pháp tuyến ở đó làm phẳng (đường viền hình vẽ được khắc nổi trong ảnh pháp tuyến);
  - quần sọc xanh lá và tím (màu nhuộm hoá học) nhuộm lại thành sọc vàng đất và nâu đỏ, màu nhuộm thực vật (Diodorus 5.30: quần áo nhuộm nhiều màu).
- **Thay** khiên tròn và kiếm ngắn của mô hình nền:
  - khiên bầu dục dài kiểu La Tène, sơn xanh chàm;
  - kiếm dài chém, lưỡi 0,78 m, đầu tròn không mũi (Polybius: kiếm Gaul chỉ chém được, không có mũi).
- `attack`: kiểu mới **`sword-slash`** trong `whp_clips.ATTACKS`: giơ kiếm qua vai phải rồi bổ xuống trước, chéo sang trái; khiên giữ yên. Thân lấy `OverhandThrow` với nửa biên độ. Không dùng các clip `Sword_*` của thư viện vì chúng xoay người, chém vòng và nhảy, không hợp với lính giữ đội hình.

### Khác mặt mũi

Làm được mà không tốn nhiều, cho bốn đạo quân không phải La Mã:
- **Màu da:** nhân thêm một màu vào ảnh vật liệu da của mô hình nền (`roman_faces.SKIN`): người Libya nâu sẫm, người Iberia và Baleares ô liu.
- **Râu và tóc:** dựng từ chính lưới đầu của mô hình nền (`roman_faces.build_shell`). Lấy các mặt ở vùng cằm, má, môi trên (hay vùng da đầu), đẩy ra 4–7 mm theo pháp tuyến, mép vuốt mỏng dần vào da, bỏ các mảnh lẻ. Người Libya có râu; người Baleares có râu và tóc sẫm.
- **Người Gaul:** mặt, tóc vàng và ria mép của chính mô hình Celt.
- **Dáng người** vẫn giống nhau ở năm mô hình dựng trên lính La Mã.

### 2. Tải thêm mô hình nền

Không cần tải gì. Mô hình Celt (thân, ảnh vật liệu) đã có sẵn trong `E:\World_History_Platform_assets\sources\celt-andywoodhead\`, giấy phép CC BY 4.0 đã đọc ở T-014.

### 3. Ảnh duyệt

- **Sáu mô hình mới**, mỗi mô hình 13 ảnh trong `art/renders/<model>/` (`roman-triarii`, `roman-velites`, `libyan-infantry`, `iberian-infantry`, `balearic-slinger`, `gallic-infantry`):
  - `01-front-side-back.jpg`: nhìn trước, nghiêng, sau;
  - `02-three-quarter.jpg`: nhìn chéch;
  - `03-head-front.jpg`, `04-head-side.jpg`: cận đầu;
  - `05-formation.jpg`: 20 lính dàn đội hình;
  - `06-lods.jpg`: ba mức LOD;
  - `07-anim-idle.jpg` … `11-anim-die.jpg`: ba khung hình mỗi clip, gồm `10-anim-attack.jpg` và `11-anim-die.jpg`;
  - `12-beside-roman-legionary.jpg`: đứng cạnh `roman-legionary`;
  - `13-test-poses.jpg`: tư thế thử khung xương.
- **Ảnh chung:** `art/renders/infantry-lineup.jpg`, tám mô hình bộ binh đứng thành hàng, nhìn trước.
- **Hai mô hình La Mã:** render lại toàn bộ ảnh (kim loại mới); thêm `roman-legionary/15-scene-metal-before-after.jpg` (ảnh cảnh three.js).
- **Đã xoá** `art/renders/animation-library/attack-styles.jpg`: cả năm kiểu tấn công giờ đều có mô hình thật, ảnh cũ cho thấy kiểu ném đá cũ. Lệnh `--attack-styles` vẫn còn để thử.
- Mọi ảnh dưới 400 KB, render từ chính file `.glb`.
- **Sửa một lỗi của T-019 trong `render_review.py`:** khi một ảnh nhập hai mô hình (ảnh đứng cạnh `roman-legionary`), mô hình thứ hai phát nhầm clip của mô hình thứ nhất (tên clip trùng nhau). Ảnh `14-beside-roman-legionary.jpg` của hastatus ở T-019 bị lỗi này: lính La Mã đứng theo clip `idle` của hastatus. Giờ mỗi lần nhập giữ clip của chính nó.

### 4. Ghi công

- `art/CREDITS.md`: mục cho từng mô hình mới (mô hình nền, giấy phép, những gì đã sửa); mục Celt ghi rõ lưới và ảnh vật liệu của Celt giờ có trong `gallic-infantry.glb`.
- **Dòng ghi công gợi ý đổi** (mô hình Celt giờ là mô hình nền, không chỉ khung xương): *"Các mô hình lính dựa trên "Roman Soldier - T pose" và "Celt - rigged for UE4/5", cùng của Andywoodhead (Sketchfab, CC BY 4.0); đã sửa đổi. Hoạt hình từ Universal Animation Library của Quaternius (CC0)."* (có bản tiếng Anh).
- **Nguồn tham khảo hình dáng:** `art/README.md`, mục "Tham khảo hình dáng", có phần cho sáu mô hình. Mục đó cũng ghi rõ những màu không có nguồn (khiên Libya, Iberia, Gaul; áo Libya; viền áo Baleares).

### Còn chưa ưng ý

1. **Tay người Gaul mở:** bàn tay của mô hình Celt không nắm. Chuôi kiếm nằm giữa các ngón hơi xoè, tay trái cầm khiên cũng vậy. Nhìn gần mới thấy.
2. **Vạt áo bị đùi chọc qua** khi vung người mạnh: velites lúc phóng lao, lính Baleares lúc ném. Đùi phải đưa ra trước vượt qua vạt áo trong vài khung.
3. **Râu và tóc dựng từ lưới đầu:**
   - nhìn rất gần, mép còn răng cưa;
   - tóc của lính Baleares trông giống một cái mũ da sẫm hơn là tóc.
4. **Dây ném đá:**
   - hai sợi dây thẳng (pha trộn giữa hai xương), không chùng;
   - khi đứng, túi đá treo cứng dưới tay, không đung đưa theo quán tính.
5. **Triarii:** nhìn nghiêng, giáo dựng hơi ngả ra trước (khoảng 10°).
6. **Những chỗ đơn giản:** tấm da sói của velites chỉ là chỏm có tai và vạt, không có đầu sói. Mũ gân của người Iberia khá phẳng và trơn. Người Iberia dùng kiếm của mô hình nền, chưa có *falcata*.
7. **Màu không có nguồn:** khiên của người Libya, Iberia, Gaul và một số màu áo là lựa chọn để phân biệt các đạo quân (ghi trong `art/README.md`).
8. **Dáng người:** năm mô hình trên lính La Mã cùng dáng người; ba mô hình La Mã cùng khuôn mặt.
9. **Còn từ T-019:**
   - mép khiên và đầu vũ khí chạm đất vài cm giữa lúc ngã;
   - bàn tay trái của LOD2 lòi qua khiên;
   - kiếm, xăng đan, áo đỏ theo mô hình nền.

### Thay đổi ở các module `whp_*.py` (cho lane 2)

Không đổi tên hay bỏ hàm nào; các chữ ký cũ giữ nguyên, chỉ thêm tham số tuỳ chọn.

- **`whp_materials`:**
  - giá trị `BRONZE`, `BRONZE_DARK`, `IRON`, `IRON_DARK` sáng hơn;
  - thêm `BRONZE_ROUGHNESS`, `IRON_ROUGHNESS`, `MAIL_ROUGHNESS`;
  - `shield_paint(color=SHIELD_RED, dark=SHIELD_RED_DARK)`;
  - thêm `plain(name, color, dark, ...)` và `fur()`.
- **`whp_clips`:**
  - `Kit(shield, attack, carry=None, lie_flat=False, sling=None)`;
  - thêm `SPEAR_CARRY`, `SLING_CARRY`, `SLING_BONE`, `SLING_T`, `SlingCord`, `Arms.hold`;
  - `ATTACKS` thêm `sword-slash`; `sling` viết lại; `spear-thrust` chỉnh hướng;
  - `_stroke(..., calm=None)`;
  - khi kit có dây ném, clip key thêm xương `ik_hand_gun` (cả vị trí).
- **`whp_build`:** `check_model` dùng `GROUND_CHECKS` của mô hình nếu có.
- **`whp_export`:** `check_glb` báo lỗi nếu lưới có `COLOR_n`.
- **`whp_lod`:** `SurfaceSwap` bake cả ảnh kim loại nối vào `Metallic` (trước chỉ đọc giá trị số).
- **`whp_unit_lod`:**
  - `LOD2["skirt"]` có thể là `None`;
  - `_finish_lod` xoá thuộc tính màu và thuộc tính `whp_*` khỏi LOD. Nếu ngựa cần màu đỉnh trong file thì báo tôi.
- **Không đổi:** `whp_common`, `whp_skeleton`, `whp_skin`, `whp_proxy`, `whp_render`, `whp_mesh`, `whp_anim`, `whp_ual`, `whp_retarget`.

### Đề nghị ngoài phạm vi

1. **Lane 3, xương của dây ném:** lính Baleares có xương `ik_hand_gun` chuyển động (vị trí và góc quay) trong mọi clip. Cảnh phải phát kênh của mọi xương. Nếu cảnh bake hoạt hình chỉ cho một số xương thì túi đá sẽ đứng yên ở tư thế gốc.
2. **Lane 3, chiều cao:** mũi giáo của triarii cao khoảng 2,4 m (các mô hình khác dưới 2,25 m). Nếu khung bao để cắt hình dựa vào chiều cao người thì nên nới.
3. **Lane 3, độ dài `attack`:** khác nhau theo mô hình: 1,0 s (`sword-thrust`, `spear-thrust`), 1,333 s (`javelin-throw`, `sling`, `sword-slash`).
4. **Phiên chính, khi trận đánh vào app:** dùng dòng ghi công gợi ý mới trong `art/CREDITS.md`.
5. **Phiên chính, `docs/ARCHITECTURE.md`, mục "Mô hình lính":** có thể ghi mũi giáo triarii cao khoảng 2,4 m, và lính Baleares dùng xương `ik_hand_gun` cho túi đá.
6. Không cần cài thêm gì cho Blender, không thêm thư viện npm.
