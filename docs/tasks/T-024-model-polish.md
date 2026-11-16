# T-024: Sửa các chỗ chưa ưng ý của mô hình bộ binh

- **Lane:** 1
- **Model đề xuất:** Fable 5.2, effort `high`. Hết hạn mức thì dùng Opus 5.5, effort `xhigh`.
- **Nhánh:** `lane1/T-024-model-polish` (tạo từ `main` mới nhất)
- **Phạm vi file:** `art/` (trừ các file ngựa của lane 2: `art/blender/horse_*.py`, `art/renders/horse/`, `art/build/horse/`), `public/battles/models/`

## Bối cảnh

T-021 và T-023 đã gộp ngày 2026-11-17: cảnh Cannae có đủ 8 mô hình bộ binh, và trận đã xem được từ app chính (khung xem trận). Còn T-022 (kỵ binh), nhưng task đó phải chờ ngựa của lane 2 (T-020 đang làm).

Trong lúc chờ, task này sửa những chỗ chưa ưng ý đã được ghi lại ở hai nơi:
- lane 1, mục "Còn chưa ưng ý" của T-021;
- lane 3, mục "Ghi chú cho lane 1" của T-023.

## Đọc trước

- `docs/tasks/T-021-infantry-models.md`, mục "Còn chưa ưng ý".
- `docs/tasks/T-023-battle-viewer.md`, mục "Ghi chú cho lane 1".
- `docs/ARCHITECTURE.md`, mục "Mô hình lính". Mới có:
  - cảnh tự đo sải chân từ clip;
  - chiều cao tối đa của hình lính;
  - xương `ik_hand_gun`.
- `src/components/battle/engine/figures/model.ts`, hàm `plantedStride`: cách cảnh đo sải chân. Chỉ đọc, không sửa.

## Yêu cầu

Commit sau mỗi việc. Nếu sắp hết hạn mức thì ghi bảng tiến độ vào mục "Kết quả" rồi commit.

### 1. Sải chân và clip `walk`, `run` (ưu tiên cao nhất)

Lane 3 đo trên clip đã bake và ra số khác tài liệu:

| Clip | Lane 3 đo được | `art/README.md` ghi |
|---|---|---|
| `walk` | 1,31 m mỗi vòng | 1,00 m |
| `run` | 5,5 m mỗi vòng (5,9 m/s ở cỡ người thật, gần chạy nước rút) | 1,99 m |

Clip nguồn của `run` là `Jog_Fwd_Loop` (chạy chậm). Theo lane 3, số của lane 1 chỉ cộng quãng trượt lúc chân chạm đất.

- **Đo lại theo cách của cảnh:** lấy tốc độ lùi của bàn chân trụ trong pha chân chạm đất, rồi tính ra quãng đường một vòng. Tìm vì sao hai cách đo khác nhau. Có thể dùng lại kịch bản `s-planted.mjs` và `s-stride.mjs` của lane 3 trong `E:\World_History_Platform_assets\T-023\tools\` (ngoài repo; cách chạy ghi ở cuối mục "Kết quả" của T-023).
- **Nếu `run` sau khi đổi đích thật sự là chạy nước rút** (ví dụ do đổi đích làm sai tỉ lệ chuyển động): sửa lại thành chạy chậm, hợp với lính giữ đội hình, khoảng 2,5–3,5 m/s ở cỡ người thật. Nếu clip nguồn vốn như vậy thì ghi lại và đề xuất cách xử lý.
- **Clip `walk`:** quanh lúc gót chạm đất và lúc mũi chân rời đất (khung 0–4 và 20–24), bàn chân trượt khoảng 32%. Sửa nếu không tốn nhiều công.
- Sửa các số trong `art/README.md` cho đúng.
- Cảnh tự đo sải chân, nên đổi clip không phải sửa code. Kiểm tra trong `/battle-lab` (`npm run dev -- -p 3101`) rằng chân không trượt rõ khi đi và khi chạy.

### 2. Tay người Gaul

Bàn tay của mô hình Celt không nắm lại: chuôi kiếm nằm giữa các ngón xoè, tay trái cầm khiên cũng vậy. Làm cho hai bàn tay nắm chặt, ví dụ:
- giữ một tư thế ngón tay nắm cố định cho mô hình này trong mọi clip;
- hoặc sửa trọng số.

### 3. Đùi chọc qua vạt áo

Velites lúc phóng lao và lính Baleares lúc ném: đùi phải đưa ra trước, chọc qua vạt áo trong vài khung. Sửa, ví dụ:
- giảm biên độ chân trong hai kiểu tấn công này;
- hoặc thêm trọng số cho vạt áo theo đùi.

### 4. Hastati và *pilum*

Lane 3 thấy ở cự ly gần: hastati đánh bằng kiếm trong khi tay trái vẫn cầm hai cây *pilum*. Theo Polybius, hastati phóng *pilum* trước rồi mới rút kiếm. Chọn cách ít tốn công nhất mà vẫn trông hợp lý, và ghi lý do. Ví dụ:
- trong `attack`, hai cây *pilum* nằm sau khiên, khuất khỏi mặt trước;
- hoặc một kiểu `attack` mới là phóng *pilum*. Lưu ý: cảnh chỉ có một clip `attack` cho mỗi mô hình, nên không thể vừa phóng lao vừa đâm kiếm.

### 5. Nếu còn hạn mức (tuỳ chọn, theo thứ tự)

1. Khi nhìn nghiêng, giáo của triarii ngả ra trước khoảng 10°.
2. Ở LOD2, bàn tay trái lòi qua khiên.
3. Tóc lính Baleares trông giống mũ da.
4. Lúc ngã, mép khiên và đầu vũ khí chạm đất vài cm.

### Chung

- Đúng hợp đồng như T-021:
  - 67 xương;
  - LOD trong giới hạn tam giác;
  - một vật liệu;
  - năm clip;
  - khoảng 2 MB mỗi file.
- Mô hình nào bị ảnh hưởng thì xuất lại. Chạy lại từ đầu phải ra file giống hệt từng byte.
- Ảnh duyệt:
  - cập nhật những ảnh trong `art/renders/<model>/` có thay đổi;
  - thêm ảnh trước và sau cho từng việc 1–4.
- Nếu đổi tên hay chữ ký hàm trong `whp_*.py` thì ghi vào "Kết quả", vì lane 2 đang import các module này.

## Ràng buộc

- Như T-021:
  - không đưa file gốc hay `art/build/` vào repo;
  - không dùng tài sản chưa đọc giấy phép, tài sản NC hay ND, hay tài sản trích từ game;
  - không sửa `src/`;
  - không thêm thư viện npm.
- Không sửa các file ngựa của lane 2.
- Lane 2 cũng chạy Blender. Trước mỗi lần chạy Blender, kiểm tra bằng `tasklist | findstr blender`; nếu có Blender khác đang chạy thì chờ nó xong.
- Bake bằng Cycles thì dùng CPU. Không để `blender.exe` chạy khi không cần.

## Xong khi

- Việc 1–4 xong. Việc nào không làm được thì ghi rõ lý do.
- `/battle-lab?stats=1`: cả 8 loại bộ binh ghi `file`, console sạch.
- Chân không trượt rõ khi đi và khi chạy. Ghi cách đã kiểm.
- Chạy lại script từ đầu ra file giống hệt từng byte.
- `npm run validate`, `npm run lint`, `npm run build` qua.

## Kết quả

_(Lane 1 điền khi xong.)_
