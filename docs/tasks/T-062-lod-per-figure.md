# T-062: Mỗi người một mức chi tiết (B4)

- **Lane:** phiên chính. Người dùng chọn 2026-11-22: phiên chính làm hết (phần cảnh thuộc vùng của lane 3).
- **Nhánh:** `batch-l/B4-lod`, từ `main` (sau khi gộp T-061).
- **Phạm vi file:**
  - `src/components/battle/engine/units.ts` (lô lính, chọn mức chi tiết), `src/components/battle/engine/BattleEngine.ts` (mức chất lượng `high`);
  - `src/lib/i18n/messages.ts` (khoá `battle.scene.stats.lods`, cả `en` lẫn `vi`);
  - `docs/` (ARCHITECTURE, PLAN, danh sách task, task này).
- **Kế hoạch chung:** `docs/PLAN.md`, mục "Đợt L", việc B4.

## Bối cảnh

Dòng B4 của PLAN: dùng mức chi tiết cao từ xa hơn, làm lại mức thấp cho bớt giống hình khối, giữ từ 50 khung hình/giây trên máy người dùng (RTX 3050).

Phiên chính đo trước khi làm (2026-11-22, Cannae giai đoạn 5, camera cách khối hastati 40–400 m; script ở `E:\World_History_Platform_assets\main-tools\drive\s-b4-*.mjs`):

- **Giữa trận, LOD0 không bao giờ hiện, kể cả khi camera cách khối quân 40 m.** Cảnh chọn mức chi tiết cho cả lô (tối đa 256 người) theo người gần camera nhất của lô. Các lô lại trải rộng: trung vị 330 m, 10% dài trên 1,1 km (người ngã nằm rải dọc đường đi, khối giãn ra khi đánh). Một người đứng gần là cả lô đòi LOD0. Ở 40 m, cảnh muốn 11,6 triệu tam giác cho lính, gần gấp năm trần 2,5 triệu, nên bước hạ cấp đẩy cả các lô gần nhất về LOD1 và LOD2: 0 người ở LOD0, 1 340 ở LOD1, 950 ở LOD2. Chọn theo từng người thì cùng ngưỡng chỉ cần 5,5 triệu (427 người ở LOD0).
- **Màn hình của người dùng:** 2880×1620, phóng 175% (khung nhìn 1646×926 điểm ảnh CSS, tỉ lệ điểm ảnh 1,75). Các số đo hiệu năng trước đây chụp ở 1280×800, tỉ lệ 1, tức khoảng một phần tư số điểm ảnh. Ở đúng màn hình người dùng, góc mở trận (cả chiến trường, mọi người ở LOD2) chạy khoảng 53 khung/giây (ở 1280×800 là 95). Góc này nặng nhất vì phần lớn là mặt đất, cây, cỏ phủ kín màn hình; số tam giác của lính không đổi nó.
- **Ba bản lính ở cùng khoảng cách** (ảnh `duyet/B4/B4-01-ba-ban-linh.jpg`): LOD2 (ống và elip, màu phẳng) lộ rõ dạng khối ở 60–105 m; từ khoảng 250 m (lính cao chừng 43 điểm ảnh thật) ba bản gần như không phân biệt được. LOD1 và LOD0 khác rõ chỉ khi lính cao từ khoảng 100 điểm ảnh thật. Tức cái "hình khối" chủ yếu do lỗi chọn mức ở trên: LOD2 bị dùng ngay sát camera.
- **Chi phí theo trần** (bản thử chọn theo từng người, màn hình người dùng, trung vị 3 vòng): mỗi triệu tam giác của lính tốn khoảng 2 ms một khung. Camera cách khối quân 40 m: trần 2,5 triệu 86 khung/giây (74 người ở LOD0), 4 triệu 67 (235), 6 triệu 52 (479), 9 triệu 41. Ở 110 m gần như vậy.

Người dùng chọn (2026-11-22, câu hỏi chọn phương án, sau khi xem `B4-01` và `B4-02-truoc-sau.jpg`):

- **trần 4,5 triệu tam giác** (góc gần khoảng 60–65 khung/giây; hai phương án khác: 3,5 triệu, 6 triệu);
- **không làm lại các bản thấp** (LOD1, LOD2): sau khi sửa, LOD2 chỉ còn dùng khi lính cao dưới khoảng 20–40 điểm ảnh thật, tầm mà ba bản gần như như nhau;
- phiên chính làm hết.

## Yêu cầu

1. **Mỗi người một mức.** Mỗi hình lính chọn mức chi tiết theo chiều cao của chính nó trên màn hình, không theo lô. Lô vẫn là đơn vị cắt theo khung nhìn (một khung bao) và vẫn được ghi từng khung như cũ; mỗi lô vẽ mỗi mức đang dùng bằng một lượt vẽ.
2. **Trần tam giác.** Khi tam giác của lính trong khung nhìn vượt trần, giãn cả hai ngưỡng theo cùng một hệ số, nhỏ nhất vừa trần: người nhỏ nhất trên màn hình (xa nhất) bị hạ trước, và tỉ lệ giữa hai ngưỡng giữ nguyên nên không mức nào bị rút cạn cho mức kia.
3. **Không nhấp nháy.** Một người giữ mức cũ tới khi qua ngưỡng 12% (như cũ, nay cho từng người). Hệ số giãn tăng ngay khi cần (không khung nào vượt trần lâu) và giảm dần khi bớt người.
4. **Bóng** như cũ: người ở LOD0 đổ bóng từ LOD1, người khác từ LOD2; lô ngoài khung nhìn vẫn đổ bóng vào khung nhìn.
5. **Mức chất lượng thấp** giữ nguyên (không LOD0, LOD1 khi cao trên 70 điểm ảnh, trần 0,7 triệu, không bóng).
6. **Số đo:** ở màn hình người dùng (`W=1646 H=830 DSF=1.75`), so xen kẽ với `main`: góc mở trận không chậm đi; góc gần từ 50 khung/giây trở lên; CPU thêm cho bước chọn mức dưới 1 ms một khung.

## Kết quả

(điền khi xong)
