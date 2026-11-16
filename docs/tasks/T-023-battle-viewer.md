# T-023: Khung xem trận trong app chính

- **Lane:** 3
- **Model đề xuất:** Fable 5.2, effort `high`. Hết hạn mức thì dùng Opus 5.5, effort `xhigh`.
- **Nhánh:** `lane3/T-023-battle-viewer` (tạo từ `main` mới nhất)
- **Phạm vi file:**
  - `src/components/battle/`;
  - khoá `battle.*` trong `src/lib/i18n/messages.ts`, cả `en` lẫn `vi`;
  - **ngoại lệ chỉ cho task này** (lane 1 đang làm Blender nên không đụng tới):
    - `src/components/AppShell.tsx`: chỉ thêm phần nạp `BattleViewer`;
    - `src/components/panel/EventListItem.tsx`: chỉ thêm nút xem trận.

## Bối cảnh

Đợt A và T-018 đã gộp: cảnh 3D chạy tốt ở `/battle-lab`. Người dùng duyệt **bắt đầu đợt C**: đưa trận đánh vào app chính. Task này làm phần lớn nhất, **khung xem trận**:

1. Chọn trận Cannae trong panel sự kiện thì có nút xem trận 3D.
2. Bấm nút thì khung xem trận phủ kín trang: cảnh 3D, lời dẫn, nút điều khiển, thông tin hai bên, nguồn và ghi công.
3. Đóng khung thì về lại bản đồ, đúng chỗ cũ.

Để sau, không làm trong task này:
- chuyển cảnh từ bản đồ vào trận (bay tới `origin`): việc của lane 2 sau T-020;
- ghi công trong hộp thoại Giới thiệu;
- link chia sẻ mở thẳng vào trận.

Trong lúc bạn làm: lane 1 làm 6 mô hình bộ binh (T-021), lane 2 làm ngựa và chỉnh dữ liệu Cannae (T-020).

## Đọc trước

- `docs/ARCHITECTURE.md`:
  - mục "Trạng thái chung": `battleId`, `openBattle`, `closeBattle`, `battleTime`, `setBattleTime` đã có trong store;
  - mục "Khung xem trận (đợt C)": **mới**, hợp đồng cho task này;
  - mục "Mô hình lính": độ dài vòng `walk`/`run`, cách phát `die`.
- `src/app/battle-lab/BattleLab.tsx`: trang thử hiện có, cách phát theo `playSeconds` của từng giai đoạn.
- `src/data/index.ts`: `hasBattle`, `loadBattle`, `unitTypes`, `getEvent`.
- `src/components/shell/keyboard.ts`: phím tắt chung tự đứng ngoài khi có `dialog[open]`.
- `docs/tasks/T-019-animations-hastatus.md`, mục "Kết quả", "Đề nghị ngoài phạm vi" ý 3.

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Nút xem trận

- Trong `EventListItem`, khi sự kiện **đang được chọn** và `hasBattle(event.id)`: hiện nút "View the battle in 3D" / "Xem trận đánh 3D" (khoá `battle.open`).
- Chi tiết sự kiện hiện nằm bên trong một `<button>`. **Không lồng nút trong nút**: đặt nút xem trận ngay dưới nút của mục, trong cùng `<li>`.
- Bấm thì gọi `openBattle(event.id)`.

### 2. Nạp khung xem trận

- `AppShell`: khi `battleId` khác `null` thì hiện `BattleViewer`, nạp bằng `next/dynamic` với `ssr: false`, như trang thử.
- **Trang chính không được tải three.js trước khi mở trận.** Kiểm tra như phiên chính làm ở T-015: chunk nào chứa `WebGLRenderer` thì không được có trong `.next/server/app/index.html`. Kiểm tra thêm danh sách request của trang trước khi bấm nút.

### 3. `BattleViewer`

**Khung:**
- Một `<dialog>` mở bằng `showModal()`, phủ kín cửa sổ. Tên cho trình đọc màn hình: tên sự kiện (`getEvent(id).title`).
- **Đóng:** Esc hoặc nút đóng gọi `closeBattle()`. Focus trở về nút xem trận. Bản đồ, năm và sự kiện đang chọn giữ nguyên.
- **Đang tải:** hiện trạng thái tải. Không tải được dữ liệu hay cảnh thì hiện lỗi kèm nút đóng.
- Không tự phát khi mở. Người dùng bấm phát.

**Thanh điều khiển:**
- Phát / dừng. Phát theo `playSeconds` của từng giai đoạn, như trang thử. Phát hết thì dừng ở cuối; bấm phát lại thì chạy từ đầu.
- Thanh tua có vạch ở mốc giữa các giai đoạn.
- Giờ trong ngày (`hourAt`), số giai đoạn và tiêu đề giai đoạn.
- Nút giai đoạn trước và sau: nhảy tới mốc đầu giai đoạn.
- Có thể thêm tốc độ phát (ví dụ 1× và 2×) nếu gọn.

**Lời dẫn:**
- Tiêu đề và lời dẫn của giai đoạn đang diễn ra (`phaseAt`), theo ngôn ngữ đang chọn. Đang phát thì đổi theo giai đoạn.
- Trên máy tính: khung bên, đủ rộng để đọc (khoảng 320–380 px), thu gọn được để xem cảnh rộng hơn.
- Phần còn lại của cảnh phải đủ rộng: kiểm tra góc nhìn mở (T-018) vẫn thấy cả hai chiến tuyến khi khung lời dẫn mở.

**Thông tin trận:** trong khung bên, có thể là một tab hay phần mở rộng.
- Ngày (`battle.date`).
- Mỗi bên:
  - tên và màu phe (lấy từ `polities.json` qua `polityId`, như cảnh);
  - chỉ huy;
  - quân số và thương vong. Đây là `NumberRange`: hiện khoảng số (một số nếu `min` bằng `max`), kèm `note` nếu có.
- `uncertainty`: những gì còn tranh cãi.
- Nguồn: `battle.sources` và `terrain.sources`, có link.

**Ghi công:** trong khung xem trận, ví dụ cuối phần thông tin.
- Mô hình lính: dựa trên mô hình của Andywoodhead (Sketchfab, CC BY 4.0), đã sửa; hoạt hình từ thư viện của Quaternius (CC0). Lấy câu gợi ý ở cuối mục `roman-legionary` trong `art/CREDITS.md`.
- Địa hình Copernicus: câu ghi công và câu miễn trách nhiệm **đúng như README**, mục "Data credits". Giấy phép bắt buộc giữ hai câu này.
- Chuỗi tiếng Việt dịch được, nhưng tên tác phẩm, tên tác giả và câu ghi công Copernicus giữ nguyên tiếng Anh.

**Phím:**
- Space: phát / dừng. ← / →: giai đoạn trước / sau. Esc: đóng.
- Không lấy phím khi focus đang ở chỗ tự xử lý phím đó: thanh tua (mũi tên), nút (Space), ô nhập.
- Ghi các phím này trong khung (ví dụ dòng gợi ý), không cần sửa hộp thoại phím tắt của lane 1.

**Bố cục:**
- Ưu tiên máy tính (từ 1280×800). Ở 390 px chỉ cần dùng được: lời dẫn xuống dưới cảnh, không cuộn ngang.
- Đúng cả chế độ sáng lẫn tối, chỉ dùng token màu.
- Nhãn địa danh của cảnh phải tránh các lớp phủ của khung (thanh điều khiển, khung bên, nút), như lane 2 đã làm cho chú giải bản đồ ở T-017.

**Bộ nhớ:** mở rồi đóng 10 lần liền. Không rò context WebGL hay bộ nhớ: đo JS heap và số context, so lần 1 với lần 10.

### 4. Sửa trong cảnh (đề nghị của lane 1 ở T-019)

- **Tốc độ bước chân:** chỉnh tốc độ phát `walk` và `run` theo tốc độ di chuyển của khối quân, để chân không trượt. Số liệu ở `docs/ARCHITECTURE.md`, công thức ở `art/README.md`, mục "Thư viện hoạt hình". Chọn `walk` hay `run` theo tốc độ, ghi ngưỡng.
- **`die`:** phát một lần rồi giữ khung cuối. Kiểm tra engine hiện làm gì và sửa nếu cần.
- Xem hastati (mô hình `roman-hastatus`, hai cây *pilum*) và mọi clip ở cự ly gần. Ghi những gì trông sai cho lane 1.

## Ràng buộc

- Không sửa store, `src/lib/`, `src/data/`, `src/app/`. Cần đổi thì ghi đề nghị vào "Kết quả".
- Không import component của lane khác. Ở `AppShell` và `EventListItem`, chỉ thêm đúng phần nêu trên.
- Không thêm thư viện npm.
- Không sửa `public/battles/models/`. Thử mô hình thì làm như T-018 rồi trả về như cũ.

## Xong khi

- Từ `/?year=-216&event=battle-of-cannae`: bấm nút xem trận, xem cả 6 giai đoạn có lời dẫn, đóng bằng Esc và bằng nút, về đúng chỗ cũ. Làm được ở cả tiếng Anh lẫn tiếng Việt.
- Trang chính không tải three.js trước khi mở trận.
- Mở đóng 10 lần không rò bộ nhớ.
- Bước chân khớp tốc độ đi; lính ngã nằm yên.
- `npm run lint`, `npm run build`, `npm run validate` qua.
- Ảnh chụp (ngoài repo): khung mở ở 1280×800 tiếng Anh nền sáng và tiếng Việt nền tối, lúc đang phát, phần thông tin trận, bề ngang 390 px.

## Kết quả

_(Lane 3 điền khi xong.)_
