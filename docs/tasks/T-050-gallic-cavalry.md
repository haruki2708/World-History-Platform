# T-050: Mô hình kỵ binh Gaul

- **Lane:** 1
- **Model đề xuất:** Fable 5.2, effort `high`.
- **Nhánh:** `lane1/T-050-gallic-cavalry` (phiên chính đã tạo sẵn từ `main`, trong worktree của bạn)
- **Phạm vi file:**
  - `art/` (script Blender, `art/renders/`, `art/CREDITS.md`, `art/README.md`);
  - `public/battles/models/` (file `.glb` mới và `index.json`).
  - Như ở T-047, được sửa các file ngựa `art/blender/horse_*.py` nếu cần.

## Bối cảnh

T-047 của bạn đã gộp. Về ý 9, người dùng chọn đề nghị của bạn: **tách kỵ binh cánh trái của Hasdrubal thành hai loại lính**, mỗi loại một mô hình. Kỵ binh Iberia giữ mô hình hiện có. Kỵ binh Gaul cần một mô hình riêng: đó là task này.

Lane 2 làm song song T-049: tách dữ liệu. Hai bên dùng chung các tên dưới đây; **không đổi tên** khi chưa hỏi phiên chính.

| Loại lính (`unit-types.json`, của lane 2) | Mô hình | Ghi chú |
|---|---|---|
| `iberian-cavalry` | `iberian-gallic-cavalry` | File hiện có. **Giữ nguyên tên file**, không đổi tên trong task này |
| `gallic-cavalry` | `gallic-cavalry` | File bạn dựng |

Cho tới khi T-049 gộp, không loại lính nào trong `main` trỏ tới `gallic-cavalry`. `npm run validate` vì thế cảnh báo "không phải mô hình của loại lính nào": chấp nhận được.

## Đọc trước

- `docs/ARCHITECTURE.md`, mục "Mô hình lính": giới hạn, "Kỵ binh", `block` và `hit`, LOD ít đường nối (T-047).
- `docs/tasks/T-047-lod-cavalry.md`, mục "Kết quả": phần 2 (vạt áo, tóc) và "Ý 9" (nguồn bạn đã tìm, bản vá quần và torc ở `E:\World_History_Platform_assets\T-047\patch\`).
- `docs/tasks/T-022-cavalry.md`, mục "Kết quả": cách dựng ba mô hình kỵ binh.

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Mô hình `gallic-cavalry`

- Dựng người cưỡi từ người Celt của `gallic-infantry`, trên ngựa của `horse.blend`, theo đúng quy trình của ba mô hình kỵ binh hiện có (107 xương, người và ngựa chung một atlas, một vật liệu).
- Trang bị theo nguồn. Bạn đã nêu ở T-047: quần (*bracae*), áo choàng sọc hay kẻ ô, torc, tóc dài và ria, khiên Celt. Kiểm lại từng món với nguồn (Polybius 2.28–31, Diodorus 5.28–30, Strabo 4.4, và hiện vật nếu có), ghi vào docstring của `unit_gallic_cavalry.py` và `art/CREDITS.md`. Món nào là lựa chọn của bạn chứ nguồn không nói về kỵ binh thì ghi rõ.
- Nhìn từ xa phải phân biệt được với kỵ binh Iberia (áo trắng viền tía) và với kỵ binh La Mã: xét ở cả LOD1 và LOD2, không chỉ cận cảnh. Ở T-047 bạn đã thấy quần và torc không đọc ra ở tầm xa; lần này màu và dáng tổng thể phải khác.
- Vũ khí và kiểu đánh: bạn chọn theo nguồn (giáo như kỵ binh Iberia, hay kiếm dài). Kiểu đánh quyết định độ dài `attack` (1,0 s cho đâm, 1,333 s cho chém); ghi rõ đã chọn gì.
- Đủ tám clip như ba mô hình kỵ binh kia: `idle`, `walk`, `jog`, `run`, `attack`, `die`, `block`, `hit`. `block` và `hit` dài 1,0 s, đòn chạm ở giây 0,3.
- LOD theo cách của T-047 (ít đường nối UV). Giới hạn: LOD0 tối đa 8 000 tam giác, LOD1 1 500, LOD2 300; file tối đa 4 MB.
- **Dựng xong ảnh render (trước, bên, sau; cạnh kỵ binh Iberia và kỵ binh La Mã) thì dừng lại báo người dùng xem**, rồi mới làm clip và LOD. Ảnh ở `E:\World_History_Platform_assets\duyet\T-050\`.

### 2. Việc nhỏ kèm theo

- Mảng xám nhỏ (mặt trong của vải) ở sườn trái vạt áo của `iberian-gallic-cavalry` khi nhìn từ trước, bạn ghi ở T-047: sửa nếu sửa được mà không đổi clip. Xuất lại thì so clip bằng `glbdiff.mjs` như ở T-047.

### 3. Xuất, kiểm tra và ảnh duyệt

- Dựng lại từ đầu ra đúng từng byte (chạy hai lần, so).
- Xem mô hình mới **trong cảnh**, dưới ánh sáng của cảnh. Vì chưa loại lính nào trỏ tới nó, sửa tạm `unit-types.json` trong worktree của bạn để một loại kỵ binh dùng `gallic-cavalry`, xem ở `/battle-lab` và `/battle-lab?duel=1`, rồi **trả file về như cũ, không commit** thay đổi đó.
- Ảnh duyệt trong repo: `art/renders/gallic-cavalry/`, đủ bộ như các mô hình kỵ binh khác.
- Ảnh cho người dùng ở `duyet\T-050\`: render, trong cảnh cận cảnh (trước và bên), tầm trung, tầm xa cạnh kỵ binh Iberia.
- Driver chụp của phiên chính ở `E:\World_History_Platform_assets\main-tools\drive\`. **Đặt `PORT=9363`** khi chạy (`PORT=9363 BASE=… node drive.mjs …`): cổng mặc định 9343 bị các phiên khác dùng chung, hai phiên chạy cùng lúc sẽ treo.
- `npm run validate`, `npm run lint`, `npm run build` phải qua.

## Ràng buộc

- Không sửa `src/` (kể cả `unit-types.json`: của lane 2). Cần đổi thì ghi đề nghị vào "Kết quả".
- Không đổi tên hay nội dung clip của các mô hình khác.
- Dòng ghi công trong app (`src/lib/credits.ts`, README) do phiên chính sửa khi gộp: đề nghị câu chữ trong "Kết quả".
- Cổng `next dev`: chọn cổng trống, không dùng 3000.

## Xong khi

- `public/battles/models/gallic-cavalry.glb` và `index.json` có mô hình mới, trong giới hạn.
- Người dùng đã xem ảnh render trước khi bạn làm clip và LOD.
- Từ xa phân biệt được với kỵ binh Iberia và kỵ binh La Mã.
- Dựng lại ra đúng từng byte; ảnh ở `duyet\T-050\`; mục "Kết quả" đã điền.

## Kết quả

**Trạng thái: xong** (2026-11-19). Lane 1 làm. Số liệu, log, kịch bản đo và chụp: `E:\World_History_Platform_assets\T-050\`. Ảnh cho người dùng: `E:\World_History_Platform_assets\duyet\T-050\`.

Commit: `07135d5` (bản đầu để duyệt), `5ed963c` (áo nhuộm theo yêu cầu của người dùng sau lần duyệt đầu), và commit điền mục này (clip, LOD, vạt áo Iberia, dựng lại, ảnh, tài liệu).

Người dùng xem ảnh render hai lần trước khi tôi làm clip và LOD:
- Lần đầu, người dùng duyệt hướng: kiếm dài, không mũ, tóc vàng, áo choàng kẻ ô xanh chàm, khiên xanh, vải yên len mộc viền đỏ. Kèm một thay đổi: thay ngực trần bằng áo nhuộm (Diodorus 5.30.1). Ảnh của bản ngực trần ở `duyet\T-050\ban-dau-nguc-tran\`.
- Lần hai, người dùng duyệt áo xanh lục viền vàng.

### Đối chiếu "Xong khi"

- **`public/battles/models/gallic-cavalry.glb` và `index.json`:** 2 409 256 byte (2,30 MB, giới hạn 4 MB). LOD0 7 749, LOD1 1 416, LOD2 285 tam giác (giới hạn 8 000 / 1 500 / 300). 107 xương, một vật liệu, tám clip. Có tên trong `index.json`.
- **Người dùng đã xem ảnh render trước khi làm clip và LOD:** có, hai lần (ở trên).
- **Từ xa phân biệt được với kỵ binh Iberia và La Mã:** xem mục 5, "Trong cảnh"; ảnh `09`, `10` (trong cảnh) và `03` (render).
- **Dựng lại ra đúng từng byte:** có. Ngựa và bốn mô hình kỵ binh được dựng từ đầu hai lần; mỗi file giống hệt từng byte giữa hai lần. `roman-cavalry` và `numidian-cavalry` cũng giống hệt bản trong `main`.
- **Ảnh ở `duyet\T-050\`; mục "Kết quả" đã điền:** có.

### 1. Mô hình `gallic-cavalry`

Người cưỡi là người Celt của `gallic-infantry` (nắm tay đã khép), ngựa của `horse.blend`, theo đúng quy trình của ba mô hình kỵ binh kia: 107 xương, người và ngựa chung một atlas, một vật liệu. Nguồn và lựa chọn của từng món ghi trong docstring của `unit_gallic_cavalry.py` và bảng ở `art/CREDITS.md`. Các nguồn cổ đọc trên bản dịch Loeb ở LacusCurtius (Polybius, Diodorus, Strabo); Livy đọc trên bản Roberts (Wikisource).

| Món | Nguồn | Phần nào là lựa chọn của tôi hay của người dùng |
|---|---|---|
| Quần (*bracae*) | Polybius 2.28.7; Diodorus 5.30.1; Strabo 4.4.3 | Màu sọc lấy theo `gallic-infantry` |
| Áo nhuộm, có tay, thắt đai | Diodorus 5.30.1 (áo nhuộm, thêu nhiều màu), 5.30.3 ("một số người thắt áo bằng đai bọc vàng hay bạc"); Strabo 4.4.3 (áo có tay, dài tới mông), 4.4.5 | Áo thay ngực trần là lựa chọn của người dùng. Polybius 3.114 và Livy 22.46 nói người Gaul ở Cannae cởi trần, nhưng câu đó tả bộ binh. Màu xanh lục viền vàng là lựa chọn của tôi; đai da trơn, không bọc kim loại |
| Áo choàng | Polybius 2.28.7 (người Insubres và Boii mặc quần và áo choàng nhẹ); Diodorus 5.30.1 (áo choàng sọc, gài khuy ở vai, kẻ ô dày nhiều màu); Strabo 4.4.3 | Dáng ngắn (để không chạm ngựa); màu xanh chàm, ô đỏ và vàng |
| *Torc*, vòng tay vàng | Polybius 2.29.8, 2.31.5; Diodorus 5.27.3; Strabo 4.4.5 | Của mô hình nền |
| Tóc vàng dài vuốt ra sau, ria | Diodorus 5.28.1–3; Strabo 4.4.3 | Độ dài tóc |
| Không đội mũ | Diodorus 5.30.2 có tả mũ đồng | Bỏ mũ, để thấy tóc vàng |
| Khiên bầu dục | Polybius 3.114; Livy 22.46; Strabo 4.4.3 | Cỡ cho người cưỡi (0,92 × 0,50 m, như kỵ binh Iberia), màu xanh chàm như bộ binh Gaul |
| Kiếm dài, chỉ để chém | Polybius 2.30.8, 2.33, 3.114.3; Livy 22.46; Diodorus 5.30.3 và Strabo 4.4.3 (đeo bên phải) | Chọn kiếm thay giáo (Diodorus 5.30.4 cũng nói có giáo *lancea*) |
| Chân trần, vải lót yên len mộc viền đỏ | Không có nguồn | Chân theo mô hình nền; màu vải yên để khác La Mã và Iberia |

Không nguồn nào tả trang phục hay vũ khí của chính kỵ binh Gaul ở Cannae. Polybius 3.113, 3.115 và Livy 22.46–47 chỉ nói họ đứng ở cánh trái cùng kỵ binh Iberia và đánh giáp lá cà, nhiều người xuống ngựa. Strabo 4.4.2 nói người Gaul đánh trên ngựa giỏi hơn đánh bộ.

**Cách dựng** (chi tiết ở `art/README.md`, mục "Kỵ binh Gaul"):
- Ba module mới: `celt_tunic.py` (áo, đai), `celt_cloak.py` (áo choàng; hàm `surface` dựng tấm vải rủ theo hình người, dùng chung cho tóc), `celt_hair.py` (lớp tóc từ những mặt có tóc của lưới đầu, chọn theo màu ảnh vật liệu, và mảng tóc rủ xuống gáy).
- **Chỗ ngồi:** đo khi người đã ngồi (`SEAT_MEASURE = "seated"`). Đo lúc đứng như ba mô hình kia thì mặt trong đùi của quần ống rộng lọt vào vùng đo và nhấc người cao hơn lưng ngựa khoảng 10 cm (hông ở 1,755 m). Sau khi sửa, hông ở 1,629 m (kỵ binh La Mã 1,649 m).
- **Chân:** đùi choãi hơn và cẳng chân hơi ra ngoài. Phần chân lọt vào thân ngựa giảm từ 1 061 đỉnh, sâu nhất 6,4 cm, xuống 31 đỉnh, sâu nhất 2,0 cm (ống quần ở bắp chân).
- **Vạt áo** kéo theo đùi khi ngồi, như các kỵ binh khác: `whp_cavalry.drape_skirts` nhận vạt áo và lưới chân của từng mô hình (`SKIRTS`, `LEGS_MESH`); ba mô hình cũ giữ mặc định.

**Vũ khí và kiểu đánh:** kiếm dài rút sẵn, `attack` là nhát chém (`sword-slash`, 1,333 s). Chọn kiếm vì ba lý do: kiếm Gaul là thứ nguồn tả kỹ nhất; trận kỵ binh ở Cannae đánh giáp lá cà; và kiếm làm dáng khác kỵ binh Iberia và La Mã, hai loại cầm giáo dựng cao 2,95–3,04 m.

### 2. Clip

Đủ tám clip: `idle` 4,967 s, `walk` 1,667 s, `jog` 0,833 s, `run` 0,433 s, `attack` 1,333 s, `die` 1,967 s, `block` 1,0 s, `hit` 1,0 s. `block` và `hit` đòn chạm ở khung 9 (0,3 s), như hợp đồng. Không có chuyển động gốc.

- **`attack`** (`whp_cavalry.SLASH`, đường tay tự dựng bằng IK theo khung khoá, không dùng clip thư viện):
  - người giơ kiếm qua vai phải, lưỡi chĩa lên và ra sau (khung 7–10);
  - chém tới qua bên phải đầu ngựa, rồi bổ xuống bên phải cổ ngựa (khung 18–23), rồi về;
  - thân xoay 22° ra sau rồi 18° tới, ngả tới 15°.

  Cảnh đo (`UnitModel.strike`): đòn chạm ở 0,500 s, tầm 1,488 m. `front` 1,467 m bằng các kỵ binh khác (mõm ngựa), nên hai con ngựa vẫn đứng chạm mũi, và mũi kiếm vươn tới mõm ngựa địch. Giáo của kỵ binh La Mã (tầm 2,01 m) vào sâu hơn khoảng nửa mét. Bản đầu đòn chạm ở 0,567 s; tôi đưa sớm lên 0,500 s, gần mức 0,467 s của bộ binh Gaul, để giữa hai nhát đánh còn chỗ cho `block` (chu kỳ 2,4 s, hai bên đánh lệch nhau 1,2 s).
- **`block`, `hit`:** dùng chung `_reaction` của kỵ binh (khiên đeo cẳng tay). Đã xem từng khung với áo choàng, tóc, kiếm (`E:\World_History_Platform_assets\T-050\clip-block.jpg`, `clip-hit.jpg`) và trong cảnh ở `?duel=1`.
- **`run`:** kiếm chĩa lên và ra trước, lệch sang phải (`SWORD_FORWARD`); bản đầu chĩa sát tai ngựa.
- **Lỗi điểm chìm ở khung cuối `die`:**
  - Nguyên nhân: áo choàng rủ thẳng từ bả vai nên cách lưng tới 13 cm ở thắt lưng và gấu. Khi người nằm ngửa, phần đó chĩa xuống đất. Độ nâng lúc nằm của `whp_clips` tối đa 12 cm, nên không bù hết.
  - Cách sửa: dưới bả vai, áo choàng thu vào lưng 0,3 m mỗi mét, gấu xoè 2,5 cm thay vì 4,5 cm.
  - Kết quả: điểm thấp nhất từ −5,7 cm (ngoài giới hạn ±5 cm) lên −3,8 cm, bước kiểm tra qua.

### 3. LOD

Cách của T-047 (LOD1 chia ít vùng UV, LOD2 tô theo bảng màu). Số đỉnh trên số vị trí đo bằng `glbverts.mjs`:

| | Tam giác | Đỉnh / vị trí |
|---|---|---|
| LOD0 | 7 749 (người 4 397: đầu 788, tóc 295, thân 256, áo 524, đai 28, tay 788, chân 836, áo choàng 554, khiên 256, kiếm 72; ngựa 3 352) | 10 399 đỉnh |
| LOD1 | 1 416 | 1 584 / 867 = 1,83 lần |
| LOD2 | 285 (bảng 22 màu) | 332 / 240 = 1,38 lần |

- Phần thân người nằm dưới áo bị bỏ ở LOD0 (`covers`).
- Đai lưng to của mô hình nền nằm dưới áo nên không có trong LOD.
- LOD2 của người là hình đơn giản như các kỵ binh khác. Áo choàng và tóc tính vào hình đó, nên phía trước hình tô màu áo, phía sau tô màu áo choàng; không có lưới áo choàng riêng ở LOD2.

### 4. Mảng xám trên vạt áo `iberian-gallic-cavalry`

- **Nguyên nhân:** áo của mô hình nền La Mã (`Tunic_1`) có hai lớp vải; dưới hông có 2 591 mặt quay vào trong. Lớp trong bake ra màu xám. Khi vạt áo kéo theo đùi, lớp này lộ thành mảng xám ở sườn trái. Trên LOD0 của file cũ có 24 mặt màu xám ở vạt áo bên trái.
- **Cách sửa:** `Part(drop=whp_cavalry.inner_skirt)` xoá khỏi bản ít tam giác của áo những mặt dưới hông quay vào giữa người (2 573 mặt), trước khi giảm tam giác. Tia bake của áo xuất phát xa hơn (3 cm thay vì 1,2 cm). `whp_unit_lod.Part` có thêm tham số `drop`, mặc định không làm gì.
- **Kết quả:** còn 0 mặt xám. Ảnh `12-vat-ao-ky-binh-iberia-A-truoc.jpg`, `12-…-B-sau.jpg`: hết các mảnh xám và mép rách ở gấu. Vệt mờ còn lại dưới bàn tay trái là bóng đổ lúc render, không nằm trong ảnh màu.
- **Clip:** `glbdiff.mjs` so với file trong `main`: cả tám clip giống hệt; nút, skin, vật liệu giống; lưới và ảnh khác.
- **Số liệu:** LOD0 7 217 → 7 216, LOD1 1 304 → 1 301, LOD2 289 tam giác. Đỉnh trên vị trí: LOD1 1,63 → 1,61 lần, LOD2 1,20 → 1,24 lần. File 2 168 692 → 2 149 436 byte.
- Không áp cho `roman-cavalry`, `numidian-cavalry`: đề bài chỉ nêu Iberia, và tôi không thấy lỗi này ở hai mô hình đó.

### 5. Xuất, kiểm tra

- **Dựng lại từ đầu, hai lần:** mỗi lượt dựng `horse_build.py` rồi bốn mô hình kỵ binh, mỗi mô hình chạy `build_model.py` từ đầu (kịch bản `T-050\tools\rebuild.sh`). Kết quả (SHA-256, 12 ký tự đầu; như nhau ở cả hai lượt):

  | File | Byte | SHA-256 | So với `main` |
  |---|---|---|---|
  | `gallic-cavalry.glb` | 2 409 256 | `fb894b5a0033` | mới |
  | `iberian-gallic-cavalry.glb` | 2 149 436 | `071bf22979fa` | lưới và ảnh khác (mục 4), tám clip giống hệt |
  | `roman-cavalry.glb` | 2 462 120 | `0cf5e31e94f5` | giống hệt |
  | `numidian-cavalry.glb` | 2 140 704 | `54246c8934c2` | giống hệt |

  Shell của lượt 2 bị Claude Code dừng giữa chừng vì máy thiếu bộ nhớ, lúc đang dựng `numidian-cavalry`. Tiến trình Blender đó vẫn chạy hết, qua bước kiểm tra, và ghi ra file giống hệt lượt 1. Không có gì phải chạy lại. Log của hai lượt: `T-050\rebuild-run1\`, `T-050\rebuild-run2\`.
- **Bước kiểm tra của script:** qua cho cả bốn. `gallic-cavalry`: `idle`, `walk` khung 0 thấp nhất 0,000 m, cao nhất 2,41 m; khung cuối `die` thấp nhất −0,038 m.
- **`npm run validate`:** qua. Có một cảnh báo đã biết trước: `gallic-cavalry` chưa là mô hình của loại lính nào, cho tới khi gộp T-049.
- **`npm run lint`, `npm run build`:** qua.
- **`--hi`:** chưa chạy thử. Đường dựng thường của kỵ binh cũ không đổi; `Part.drop` cũng áp ở thang `hi`.

**Trong cảnh** (`next dev` cổng 3150, Chrome có GPU qua driver của phiên chính, `PORT=9363`):
- **Bản sửa tạm:** `src/data/battles/unit-types.json`, loại `numidian-cavalry` dùng mô hình `gallic-cavalry`. Không sửa `battle-of-cannae.json`. Sau khi xem đã trả file về như cũ, không commit.
- Ở `/battle-lab?duel=1`, cặp 4 là kỵ binh La Mã đấu Iberia, cặp 6 là kỵ binh đồng minh đấu Gaul, cùng một hàng. Nhãn khối ghi "numidian-cavalry" là do bản sửa tạm.
- **Cảnh đo khi nạp** (`e.models`): `gallic-cavalry` cao 2,26 m; đòn chạm 0,500 s; tầm 1,488 m; có `block` và `hit`. Console không có lỗi.
- **Ảnh** ở `duyet\T-050\`:
  - `06`, `07`: cận cảnh trước và bên lúc tiến lên.
  - `08`: giáp lá cà nhìn từ bên, Gaul (trái) giơ kiếm chém kỵ binh đồng minh; Iberia (phải) đấu La Mã.
  - `09`: tầm trung 80 m (LOD1), Iberia trái, Gaul phải.
  - `10`: tầm xa 220 m (LOD2, khoảng 10 điểm ảnh), cắt và phóng to 2 lần không làm mượt từ ảnh 1280 × 800.
  - `11`: khối Numidia mặc mô hình Gaul trong trận Cannae (`/battle-lab`, giai đoạn 4).
- **Từ xa phân biệt được:**
  - LOD1: Iberia trắng, Gaul xanh lục.
  - LOD2 nhìn từ trước: Iberia trắng, Gaul xanh lục, vẫn đọc ra ở 220 m.
  - LOD2 nhìn từ sau: Iberia trắng, Gaul xanh chàm (áo choàng).
  - Kỵ binh La Mã đọc ra đỏ (khiên, vải yên) và xám (giáp).
  - Ảnh render `03` (Blender, khoảng 13 điểm ảnh) cho kết quả như trong cảnh, trừ hướng nhìn thẳng trước mặt ở góc ngang: ở đó đầu ngựa che gần hết người cưỡi, với cả ba loại. Camera của cảnh thường nhìn từ trên xuống, nên ít gặp góc này.

**Ảnh duyệt trong repo:**
- `art/renders/gallic-cavalry/`: đủ bộ như các kỵ binh khác (`01`–`10`), thêm `11-beside-cavalry.jpg` (Iberia, Gaul, La Mã cạnh nhau) và `12-far-cavalry.jpg` (tầm LOD1, LOD2).
- `art/renders/duel-roman-cavalry-gallic-cavalry.jpg` (`block`, `hit` quanh lúc đòn chạm).
- `art/renders/cavalry-lineup.jpg`: nay bốn kỵ binh.
- `art/renders/iberian-gallic-cavalry/01`–`03`: dựng lại sau khi sửa vạt áo.

### Thay đổi ở các module dùng chung

Mọi thay đổi chỉ thêm, có mặc định giữ hành vi cũ. Dựng lại `roman-cavalry`, `numidian-cavalry` ra file giống hệt từng byte.
- `whp_cavalry.py`: `SWORD_UP`, `SWORD_FORWARD`, `SLASH` (kiểu `sword-slash`, 40 khung); `RiderPoser._find_seated_height` (khi unit có `SEAT_MEASURE = "seated"`); `drape_skirts(armature, skirts, legs)`; `inner_skirt`.
- `whp_unit_lod.py`: `Part(drop=None)`.
- `render_review.py`: ảnh `beside-cavalry`, `far-cavalry` (danh sách `HORSEMEN` trong unit module); `CAVALRY_LINEUP` có thêm `gallic-cavalry`.
- `unit_iberian_gallic_cavalry.py`: phần `tunic` có `drop=whp_cavalry.inner_skirt`, extrusion 0,03, ray 0,06.

### Còn chưa ưng ý

1. **Chân lọt vào thân ngựa:** ống quần rộng ở bắp chân lọt vào thân ngựa tối đa 2 cm, 31 đỉnh; kỵ binh La Mã chỉ 0,1 cm. Đùi choãi thêm thì hết, nhưng hai gối sẽ dạng rộng quá.
2. **Khung cuối `die`:** gấu áo choàng vẫn nằm dưới mặt đất 3,8 cm, dưới thân người, nên không thấy.
3. **Tầm kiếm:** mũi kiếm vừa tới mõm ngựa địch, và nhát chém đi qua phía trên đầu ngựa địch. Cảnh đặt kỵ binh đứng chạm mũi ngựa, nên kiếm không bao giờ tới người cưỡi bên kia, cũng như giáo.
4. **Tóc nhìn từ sau** hơi thành một khối (mảng tóc rủ dựng như một tấm vải dày).
5. **Màu vải yên, áo, áo choàng, khiên** là lựa chọn, không có nguồn trực tiếp.

### Đề nghị cho phiên chính

1. **`docs/ARCHITECTURE.md`, mục "Mô hình lính":**
   - "Kỵ binh": bốn mô hình. `gallic-cavalry` (T-050) dựng trên người Celt của `gallic-infantry`, `attack` là chém kiếm 1,333 s, đòn chạm 0,500 s, tầm 1,49 m. `iberian-gallic-cavalry` nay là kỵ binh Iberia (tên file giữ).
   - "`block`, `hit`": có ở mười mô hình (sáu bộ binh, bốn kỵ binh).
   - "Độ dài `attack`": `sword-slash` có cả ở kỵ binh Gaul.
   - "Chiều cao": khung bao của `gallic-cavalry` ở tư thế gốc cao 2,26 m; kiếm giơ lên trong `attack` tới 3,02 m.
2. **`src/app/battle-lab/duelBattle.ts`:** cặp kỵ binh thứ tư chọn loại lính theo id `iberian-gallic-cavalry`. Khi T-049 đổi id thành `iberian-cavalry` mà không ai sửa danh sách này, `pick` sẽ lấy loại lính đầu tiên trong dữ liệu (velites), và cặp đó thành kỵ binh La Mã đấu velites. Đề nghị:
   - `south: ["iberian-cavalry", "iberian-gallic-cavalry"]`;
   - thêm một cặp kỵ binh La Mã đấu `gallic-cavalry`, để xem nhát chém, `block` và `hit` của kỵ binh Gaul.
3. **Ghi công trong app** (`src/lib/credits.ts`, README): không cần đổi. Dòng chung đã nêu mô hình Celt của Andywoodhead và con ngựa, và không có tài sản mới nào tải về.
4. **Sau khi gộp T-049:** cảnh báo "không phải mô hình của loại lính nào" của `npm run validate` sẽ hết.
