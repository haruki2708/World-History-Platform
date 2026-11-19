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

(Lane 1 điền khi xong.)
