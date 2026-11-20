# T-057: Clip `knockdown`, bộ binh bị ngựa xô ngã rồi gượng dậy

- **Lane:** 1
- **Model đề xuất:** Opus 5.5, effort `high`.
- **Nhánh:** `lane1/T-057-knockdown-clip` (phiên chính đã tạo sẵn từ `main` trong worktree của bạn).
- **Phạm vi file:** `art/` (script Blender, `art/renders/`, `art/README.md`), `public/battles/models/` (tám file `.glb` bộ binh). **Không xuất lại bốn file kỵ binh:** lane 2 đang xuất lại chúng ở T-058.
- **Kế hoạch chung:** `docs/PLAN.md`, mục "Đợt L". Hợp đồng: `docs/ARCHITECTURE.md`, mục "Kỵ binh xông qua" và phần hoạt hình của mục "Mô hình lính"; `UNIT_CLIPS`, `REACTION_IMPACT`, `KNOCKDOWN_SECONDS` trong `src/lib/battle.ts`.

## Bối cảnh

Người dùng chọn đợt L (2026-11-20): kỵ binh gặp bộ binh thì phi xuyên qua thay vì dừng lại đấu từng cặp, và bộ binh trên đường ngựa chạy bị xô ngã. Người dùng chọn: ai bị ngựa xô đều ngã; người đến lượt chết theo dữ liệu thì nằm lại (clip `die` sẵn có), **người khác gượng dậy sau vài giây**. Clip gượng dậy chưa có: đó là task này.

Phiên chính đã thêm `knockdown` vào cuối `UNIT_CLIPS` (chỉ số các clip cũ không đổi) và đang làm phần cảnh. Cho tới khi mô hình có clip, cảnh phát `hit` thay vào.

## Yêu cầu

Commit sau mỗi phần việc lớn.

### Clip `knockdown`

- Một con ngựa đang phi xô vào người lính từ phía trước mặt. Anh ta ngã ngửa ra sau, nằm một lát, lăn người, chống tay gượng dậy, rồi đứng lại thế thủ.
  - Cảnh xoay người lính quay mặt về phía con ngựa trước khi ngựa tới, nên clip chỉ cần một hướng ngã: ngửa ra sau (về phía −Z của mô hình).
- **Mốc thời gian** (cảnh canh giờ theo các số này, đổi là đổi hợp đồng):
  - bắt đầu và kết thúc ở thế đứng như `idle`, không lặp;
  - ngựa chạm ở giây thứ `REACTION_IMPACT` (0,3 giây, khung 9 ở 30 khung/giây), như `block` và `hit`: trước mốc này người lính mới chỉ kịp co người hay giơ khiên, sau mốc này mới bật ngửa;
  - dài tối đa `KNOCKDOWN_SECONDS` (4,0 giây). Gợi ý: 3,2 tới 3,8 giây, trong đó nằm dưới đất khoảng 1 giây.
- **Không có chuyển động gốc:** cảnh giữ hình lính tại chỗ. Lúc nằm, thân không ra xa chỗ đứng quá 1,5 m (cỡ mô hình), và ở khung cuối hai chân về đúng chỗ của khung đầu.
- Không phần nào của người, khiên hay vũ khí chìm dưới mặt đất quá 3 cm. Khiên và vũ khí ở lại trong tay, không văng ra.
- Hai cây *pilum* dự trữ của hastatus: **giữ nguyên trong tay** suốt clip, không thu nhỏ như trong `attack`, `block`, `hit`. Người bị xô thường ở hàng sau, đang cầm chúng; người đầu hàng đã cất thì cảnh tự giữ chúng ẩn.
- Lính ném đá Baleares và velites không có khiên lớn: ngã như người thường, dây ném và túi đá không xuyên qua người.

### Phần 1: một mô hình trước

- Dựng `knockdown` cho `roman-legionary` và xuất lại file đó.
- Ảnh duyệt `art/renders/roman-legionary/knockdown.jpg`: một dải khoảng mười khung nhìn ngang và một dải nhìn chếch từ trước, có ghi giây của từng khung; khung ở giây 0,3 được đánh dấu. Chép thêm vào `E:\World_History_Platform_assets\duyet\T-057\`.
- Điền "Kết quả", commit, rồi **dừng và báo**. Người dùng xem ảnh rồi mới làm phần 2.

### Phần 2: bảy mô hình còn lại (sau khi người dùng duyệt phần 1)

- `roman-hastatus`, `roman-triarii`, `roman-velites`, `libyan-infantry`, `iberian-infantry`, `gallic-infantry`, `balearic-slinger`.
- Mỗi mô hình một ảnh duyệt như trên.

### Kiểm tra

- Các clip cũ của mỗi file **giống hệt từng byte** so với file đang có trong `main` (như bạn đã so ở T-033). Trước khi sửa script, dựng lại một mô hình và so với file đã commit, để chắc môi trường dựng không đổi.
- Mỗi file `.glb` vẫn dưới 4 MB. Ghi kích thước trước và sau.
- `build_model.py` kiểm tra chín clip cho bộ binh; kỵ binh giữ nguyên.
- `npm run validate`, `npm run lint`, `npm run build` qua.
- Mở `/battle-lab?duel=1` (bản dev): các cặp bộ binh vẫn đánh như cũ, console không lỗi. Cảnh chưa phát `knockdown` cho tới khi phiên chính gộp chặng A1; nếu lúc bạn làm xong mà A1 đã có trong `main` thì gộp `main` vào nhánh và xem clip chạy trong cặp thử kỵ binh xông qua.
- `art/README.md`: thêm clip mới vào bảng clip.

## Ràng buộc

- Chỉ sửa file trong phạm vi. Không sửa `src/`.
- Không thêm thư viện, không thêm nguồn hoạt hình có điều kiện ghi công mà chưa hỏi. Thư viện Quaternius (CC0) đang dùng thì cứ dùng; nếu lấy clip nào của nó làm gốc (ngã, đứng dậy) thì ghi tên clip vào "Kết quả".

## Xong khi

- Phần 1: `roman-legionary.glb` có `knockdown`, ảnh duyệt đã có, đã báo.
- Phần 2: cả tám mô hình bộ binh có `knockdown`; các kiểm tra trên qua; "Kết quả" đã điền.

## Kết quả

### Phần 1: `roman-legionary` (2026-11-20, chờ người dùng duyệt ảnh)

**Clip `knockdown`** (`whp_clips.KNOCK`, `Builder.knockdown`): 3,50 s (105 khung), không lặp. Gốc là ba clip của thư viện Quaternius (CC0) đang dùng: `Idle_Loop` (bản 1), `Hit_Knockback` và `LayToIdle` (bản 2). Không thêm nguồn mới.

| Giây | Việc |
|---|---|
| 0–0,30 | Đứng như `idle`, co người lại (15% tư thế đầu của `Hit_Knockback`), khiên giơ lên trước người. |
| 0,30 (khung 9) | Ngựa chạm (`REACTION_IMPACT`). |
| 0,30–1,17 | `Hit_Knockback` từ khung 3, chậm còn 0,64 lần tới lúc lưng chạm đất (0,67 s), rồi đúng nhịp: bị hất lên, hai chân bị quét khỏi mặt đất, ngã ngửa, nảy nhẹ. Khiên bị dội về ngực, rồi nằm trên ngực và bụng. |
| 0,67–1,73 | Nằm ngửa yên khoảng 1 s. |
| 1,73–3,27 | `LayToIdle` **soi gương**: ngồi dậy, lăn người sang phải, chống nắm tay phải (vẫn cầm kiếm, lưỡi kiếm nằm ngang trên đất), quỳ một gối, đứng lên, khiên lên thế thủ. Soi gương vì người của thư viện chống tay trái, mà tay trái lính ta cầm khiên. |
| 3,27–3,50 | Về khung đầu của `idle`, khiên về thế nghỉ. |

- **Không chìm xuống đất:** người mặc giáp nằm cao hơn hình nộm của thư viện, khiên lại to. Script dựng clip thử vài lượt, mỗi lượt đo điểm thấp nhất của bốn phần (thân; bàn chân và ống chân; thứ tay trái cầm; thứ tay phải cầm) ở từng khung, rồi nâng phần nào bị chìm, mượt qua các khung kề: thân bằng hông, chân bằng mắt cá, khiên và kiếm bằng cổ tay. Với `roman-legionary`: thân nâng tối đa 14 cm lúc nằm, khiên 16 cm lúc quỳ dậy, chân 5 cm, tay phải 2 cm.
- **Số đo trên LOD0 của file đã xuất**, ở mọi khung (bước kiểm tra mới `whp_export.check_knockdown`, chạy khi đọc lại file):
  - dài 3,50 s;
  - điểm thấp nhất −2,5 cm (giày, khung 77, lúc quỳ dậy; đứng như `idle` thì giày đã ở −1,8 cm);
  - mọi điểm trong vòng 1,40 m quanh chỗ đứng; lúc nằm, đầu cách chỗ đứng 0,77 m;
  - khung đầu và khung cuối trùng khung đầu của `idle` (lệch 0,0 mm), nên hai chân về đúng chỗ cũ.
- Khiên và kiếm ở trong tay suốt clip.

**Kiểm tra**

- Trước khi sửa script: dựng lại `roman-legionary` từ đầu, ra đúng file đã commit từng byte.
- Tám clip cũ (`idle`, `walk`, `run`, `attack`, `die`, `jog`, `block`, `hit`) **giống hệt từng byte** so với `main`: so từng kênh (nút đích, nội suy, byte của thời điểm và của giá trị). Lưới, khung xương, ảnh, vật liệu và các nút cũng giống hệt.
- Dựng hai lần với script mới ra cùng một file từng byte.
- Kích thước: 2 271 180 → 2 332 636 byte (2,17 → 2,22 MB, +60 KB).
- `build_model.py` kiểm tra chín clip cho sáu mô hình bộ binh đánh gần, bảy clip cho `roman-velites` và `balearic-slinger` (sáu clip cũ và `knockdown`, vì hai mô hình này không có `block`, `hit`), tám clip cho kỵ binh như cũ (`whp_build.clips_of`). Bước kiểm tra qua cho `roman-legionary`. **Lưu ý:** cho tới khi phần 2 dựng lại bảy mô hình còn lại, `build_model.py --check` sẽ báo thiếu `knockdown` ở bảy file đó (nội dung của chúng chưa đổi).
- `npm run validate`, `npm run lint`, `npm run build` qua.
- **Trong cảnh:** chặng A1 đã có trong `main` từ trước khi tạo nhánh, nên cảnh đã phát `knockdown` khi mô hình có clip. Mở `/battle-lab?duel=1&pair=8` (bản dev của worktree, Chrome không giao diện) với `t=1.3`. Cặp này dùng hastati, mà `roman-hastatus` chưa có clip, nên mình tạm chép `roman-legionary.glb` đè lên `roman-hastatus.glb` để xem, rồi trả lại bằng git, không commit.
  - Người bị ngựa xô nằm ngửa, khiên trên người, rồi quỳ sau khiên và đứng dậy.
  - Console chỉ có hai cảnh báo WebGL của Chrome không giao diện (`KHR_parallel_shader_compile`, `GPU stall due to ReadPixels`). Trước khi chép đè, lúc cặp này chưa dùng file nào đã đổi, trang cũng có đúng hai cảnh báo này.

**Ảnh duyệt**

- `art/renders/roman-legionary/knockdown.jpg`, render từ file `.glb` đã xuất (`render_review.py -- --model roman-legionary --knockdown`).
  - Dải trên nhìn từ bên phải người lính: anh ta ngã về bên trái ảnh. Dải dưới nhìn chếch từ trước bên phải, từ trên xuống.
  - Mười một khung: 0; 0,30; 0,43; 0,60; 1,20; 1,93; 2,20; 2,47; 2,80; 3,13; 3,50 s.
  - Mỗi khung ghi giây; khung 0,30 s viền đỏ.
- Chép thêm vào `E:\World_History_Platform_assets\duyet\T-057\`:
  - `roman-legionary-knockdown.jpg`;
  - `roman-legionary-trong-canh-pair8.png`: ảnh trong cảnh nói trên.

**Hai chỗ nhờ người dùng xem**

- Ở 0,43 s, hai chân bị hất lên khá cao (giữ nguyên `Hit_Knockback`). Nếu thấy quá tay thì giảm được.
- Lúc nằm, khiên úp trên ngực và bụng như trong `die`.

**Code** (chỉ trong `art/`):

- `whp_ual.py`: ghép tư thế của nhiều clip ở dạng biến đổi cục bộ (`local`, `mix`, `world`), soi gương tư thế (`mirrored`).
- `whp_retarget.py`: `ankle_lift`, để nâng mắt cá.
- `whp_clips.py`:
  - `KNOCK`, `Builder.knockdown`;
  - `Skin`: đo điểm thấp nhất theo phần người;
  - thế khiên `lying`.
- `whp_build.py`: `clips_of`, dòng log.
- `whp_export.py`: `check_knockdown`.
- `render_review.py`: `--knockdown`.
- `art/README.md` (bảng clip, mục `knockdown`, lệnh, ảnh duyệt, bảng script), `art/CREDITS.md` (thêm hai clip của thư viện).

Không có đề nghị thay đổi ngoài phạm vi.

### Phần 2

(Chưa làm: chờ người dùng duyệt phần 1.)
