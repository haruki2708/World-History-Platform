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

(Lane 1 điền khi xong.)
