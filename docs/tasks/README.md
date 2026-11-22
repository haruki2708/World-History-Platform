# Quy trình task

Mỗi task là một file `T-XXX-ten-ngan.md` trong thư mục này, do phiên chính viết.

## Lane nhận task

1. Đọc `CLAUDE.md`, `docs/ARCHITECTURE.md` và file task được giao.
2. Làm trên nhánh của mình, tên nhánh ghi trong file task. Không commit thẳng vào `main`.
3. Chỉ sửa file trong mục "Phạm vi file" của task.
4. Trước khi báo xong: `npm run lint` và `npm run build` phải qua (thêm `npm run validate` nếu đụng tới dữ liệu), và tự chạy thử phần mình làm trong trình duyệt.
5. Điền mục "Kết quả" ở cuối file task: đã làm gì, đã kiểm tra thế nào, còn gì chưa xong, và các đề nghị thay đổi ngoài phạm vi (kiểu dữ liệu, store, thư viện mới).
6. Commit trên nhánh của mình rồi báo người dùng. Không tự gộp vào `main`.

## Phiên chính

Review diff của nhánh, chạy lại lint và build, kiểm tra chéo dữ liệu lịch sử, rồi gộp vào `main` sau khi người dùng duyệt.

## Danh sách

| Task | Lane | Nội dung | Trạng thái |
|---|---|---|---|
| [T-001](T-001-timeline.md) | 1 | Dòng thời gian và panel sự kiện | Xong, đã gộp 2026-11-15 |
| [T-002](T-002-map.md) | 2 | Bản đồ lịch sử | Xong, đã gộp 2026-11-15 |
| [T-003](T-003-events-data.md) | 3 | Dữ liệu sự kiện và thế lực, script kiểm tra | Xong, đã gộp 2026-11-15 (phiên chính làm nốt) |
| [T-004](T-004-borders-data.md) | 3 | Dữ liệu biên giới | Xong, đã gộp 2026-11-16 (đợt 2 do phiên chính làm) |
| [T-005](T-005-tutor-api.md) | 2 | Route API của gia sư AI | Xong, đã gộp 2026-11-15 |
| [T-006](T-006-tutor-chat.md) | 1 | Khung chat của gia sư AI | Xong, đã gộp 2026-11-15 |
| [T-007](T-007-tutor-hardening.md) | 2 | Gia cố route của gia sư AI: giới hạn, trần chi phí, giữ kết nối | Xong, đã gộp 2026-11-16 |
| [T-008](T-008-desktop-ux.md) | 1 | Trải nghiệm trên máy tính: link chia sẻ, nhớ ngôn ngữ, phím tắt | Xong, đã gộp 2026-11-16 |
| [T-009](T-009-map-labels.md) | 2 | Nhãn tên thế lực trên bản đồ, chuyển cảnh giữa các mốc | Xong, đã gộp 2026-11-16 |
| [T-010](T-010-tutor-map-links.md) | 1 | Nút "xem trên bản đồ" trong câu trả lời của gia sư (giao diện) | Xong, đã gộp 2026-11-16 |
| [T-011](T-011-tutor-map-links-server.md) | 2 | Server tạo nút "xem trên bản đồ" từ câu trả lời của Claude | Xong, đã gộp 2026-11-16 |
| [T-012](T-012-borders-review.md) | 3 | Soát lại các mốc biên giới của đợt 2 | Xong, đã gộp 2026-11-16 |
| [T-013](T-013-about.md) | 1 | Giới thiệu, cách dùng và ghi công | Xong, đã gộp 2026-11-16 |
| [T-014](T-014-roman-legionary-model.md) | 1 | Trận đánh 3D: mô hình lính La Mã thời Cộng hoà (Blender) | Xong, đã gộp 2026-11-16 |
| [T-015](T-015-battle-scene.md) | 3 | Trận đánh 3D: cảnh 3D (three.js) | Xong, đã gộp 2026-11-16 |
| [T-016](T-016-cannae-data.md) | 2 | Trận đánh 3D: dữ liệu trận Cannae, địa hình, tìm mô hình ngựa và hoạt hình | Xong, đã gộp 2026-11-16 |
| [T-017](T-017-legend-labels.md) | 2 | Chú giải bản đồ không che nhãn tên thế lực | Xong, đã gộp 2026-11-16 |
| [T-018](T-018-battle-scene-polish.md) | 3 | Cảnh 3D: góc nhìn đầu, nhãn địa danh, danh sách mô hình, vật liệu kim loại | Xong, đã gộp 2026-11-16 |
| [T-019](T-019-animations-hastatus.md) | 1 | Trận đánh 3D: thư viện hoạt hình dùng chung, nâng lính La Mã, thêm hastatus | Xong, đã gộp 2026-11-16 |
| [T-020](T-020-horse.md) | 2 | Trận đánh 3D: ngựa cho kỵ binh, chỉnh dữ liệu Cannae trong cảnh thật | Xong, đã gộp 2026-11-17 |
| [T-021](T-021-infantry-models.md) | 1 | Trận đánh 3D: sáu loại bộ binh còn lại, kim loại sáng đúng trong cảnh | Xong, đã gộp 2026-11-17 |
| [T-022](T-022-cavalry.md) | 1 | Trận đánh 3D: ba loại kỵ binh (người cưỡi trên ngựa của T-020), clip `jog` cho bộ binh | Xong, đã gộp 2026-11-17 |
| [T-023](T-023-battle-viewer.md) | 3 | Trận đánh 3D: khung xem trận trong app chính, mở từ panel sự kiện | Xong, đã gộp 2026-11-17 (phiên chính làm nốt) |
| [T-024](T-024-model-polish.md) | 1 | Trận đánh 3D: sửa các chỗ chưa ưng ý của mô hình bộ binh (sải chân, tay người Gaul, vạt áo, *pilum*) | Xong, đã gộp 2026-11-17 |
| [T-025](T-025-battle-flight.md) | 2 | Trận đánh 3D: bản đồ bay tới chiến trường trước khi mở trận, bay về khi đóng | Xong, đã gộp 2026-11-17 |
| [T-026](T-026-scene-fixes.md) | 3 | Trận đánh 3D: sửa cảnh (quay đầu tại chỗ, chuẩn bị kỵ binh, mức chi tiết, vùng màu, nhãn) | Xong, đã gộp 2026-11-17 (phiên chính làm thay lane 3) |
| [T-027](T-027-prefetch-cannae-data.md) | 2 | Trận đánh 3D: tải sẵn tài nguyên cảnh trong lúc bay; triarii quay đầu, các khối đi xiên | Xong, đã gộp 2026-11-17 |
| [T-028](T-028-unit-labels.md) | 3 | Trận đánh 3D: tên khối quân trên cảnh, thẻ thông tin khi bấm, khối đi xiên | Xong, đã gộp 2026-11-17 |
| [T-029](T-029-about-battle-credits.md) | 1 | Trận đánh 3D trong hộp thoại Giới thiệu: cách dùng, độ chính xác, ghi công | Xong, đã gộp 2026-11-17 |
| [T-030](T-030-horse-gallop.md) | 2 | Trận đánh 3D: clip phi nước đại mới cho ngựa (sải 4,5–6 m), xuất lại ba mô hình kỵ binh | Xong, đã gộp 2026-11-17 |
| [T-031](T-031-scene-performance.md) | 3 | Trận đánh 3D: lấy lại hiệu năng của cảnh sau đợt E (nhãn khối quân, mức chi tiết của kỵ binh); việc dở của T-028 | Xong, đã gộp 2026-11-17 |
| [T-032](T-032-melee-stage1.md) | Phiên chính | Trận đánh 3D, đợt G chặng 1: giáp lá cà (hàng đầu áp sát, đấu từng cặp, người ngã là người vừa bị đánh), dùng clip sẵn có | Xong, đã gộp 2026-11-18 (lane 3 đọc lại: [T-032 review](T-032-review.md)) |
| [T-033](T-033-melee-stage2.md) | Phiên chính | Trận đánh 3D, đợt G chặng 2: clip đỡ đòn và trúng đòn cho bộ binh; hai người trong một cặp đánh luân phiên | Xong, đã gộp 2026-11-18 (lane 3 đọc lại: [T-033 review](T-033-review.md)) |
| [T-034](T-034-melee-stage3.md) | Phiên chính | Trận đánh 3D, đợt G chặng 3: kỵ binh đỡ đòn và trúng đòn; người bị đánh phản ứng theo nhát đánh thật của địch | Xong, đã gộp 2026-11-18 (lane 1 đọc lại thay lane 3: [T-034 review](T-034-review.md)) |
| [T-035](T-035-hastatus-pila.md) | Phiên chính | Trận đánh 3D: hastatus cất hai cây *pilum* khi giáp lá cà (người đầu hàng của khối đang đánh gần) | Xong, đã gộp 2026-11-18 (không có lane đọc lại, theo lựa chọn của người dùng) |
| [T-036](T-036-about-pulses.md) | Phiên chính | Hộp thoại Giới thiệu: thêm một dòng nói cảnh 3D vẽ đánh liên tục, còn trận thật nhiều khả năng đánh theo từng đợt | Xong, đã gộp 2026-11-18 (người dùng duyệt câu chữ) |
| [T-037](T-037-scenery-stage0.md) | Phiên chính | Trận đánh 3D, đợt H chặng 0: tư liệu về cảnh vật quanh Cannae, kiểu dữ liệu phong cảnh, dữ liệu Cannae, kiểm tra | Xong, đã gộp 2026-11-18 (không có lane đọc lại, theo lựa chọn của người dùng) |
| [T-038](T-038-ground-river.md) | Phiên chính | Trận đánh 3D, đợt H chặng 1: mặt đất là ruộng và đồng cỏ, sông có lòng sỏi và nước cạn, đồi núi và biển ở chân trời, biển trong vùng chiến trường | Xong, đã gộp 2026-11-18 (không có lane đọc lại, theo lựa chọn của người dùng) |
| [T-039](T-039-structures.md) | Phiên chính | Trận đánh 3D, đợt H chặng 2: ba trại (hào, luỹ, cọc rào, cổng, lều), thành và làng Cannae, nhà nông minh hoạ | Xong, đã gộp 2026-11-19 (người dùng duyệt từng phần; không có lane đọc lại) |
| [T-040](T-040-vegetation.md) | Phiên chính | Trận đánh 3D, đợt H chặng 3: cây, bụi và lau sậy (ven sông, trên đồng, quanh nhà, trên sườn dốc) | Xong, đã gộp 2026-11-19 (người dùng duyệt từng phần; không có lane đọc lại) |
| [T-041](T-041-look-sample.md) | Phiên chính | Trận đánh 3D, đợt I: cảnh mẫu đồ hoạ theo ảnh người dùng gửi (màu và nắng, mặt đất xanh, bụi cỏ có hình, lính cận cảnh) | Xong, đã gộp 2026-11-19 (người dùng duyệt từng phần; không có lane đọc lại) |
| [T-042](T-042-model-upgrade.md) | Phiên chính | Trận đánh 3D, đợt I: nâng lính La Mã và kỵ binh La Mã từ mô hình gốc (thang chi tiết bốn mức `hi`, bờm và đuôi ngựa bằng lọn lông), render ảnh so sánh | Dựng thử xong, **không dùng**: người dùng thấy sửa ánh sáng lính (T-041) là đủ. Script và ảnh đã gộp 2026-11-19, cảnh không đọc mô hình `hi` |
| [T-043](T-043-melee-press.md) | Phiên chính | Trận đánh 3D, đợt I: giáp lá cà hỗn chiến (hàng sau chen lấn, đâm với, giơ khiên; lao và đá bay) | Xong, đã gộp 2026-11-19 (người dùng duyệt từng phần; không có lane đọc lại) |
| [T-044](T-044-scenery-look.md) | Phiên chính | Trận đánh 3D, đợt I: nước, lều, nhà và cây có chất liệu ảnh thật (CC0) | Xong, đã gộp 2026-11-19 (người dùng duyệt từng phần; không có lane đọc lại) |
| [T-045](T-045-camp-guard.md) | 2 | Trận đánh 3D, đợt J: quân giữ trại của Hannibal (Polybius 3.117), `camp-force` giáp lá cà với nó; ra và về trại lớn qua cổng | Xong, đã gộp 2026-11-19 |
| [T-046](T-046-footprint-fade.md) | Phiên chính | Trận đánh 3D, đợt J: mảng màu phe dưới chân khối quân mờ đi khi nhìn gần | Xong, đã gộp 2026-11-19 (không có lane đọc lại, theo lựa chọn của người dùng) |
| [T-047](T-047-lod-cavalry.md) | 1 | Trận đánh 3D, đợt J: LOD1, LOD2 ít đường nối UV cho 11 mô hình; vạt áo, tóc Numidia, người Gaul trong kỵ binh Iberia/Gaul; nhát chém của lính Gaul | Xong, đã gộp 2026-11-19 (ý 9 làm sau: tách hai loại lính) |
| [T-048](T-048-dust-wind.md) | Phiên chính | Trận đánh 3D, đợt J (chặng 4 của đợt H): bụi theo khối quân và kỵ binh, trôi theo gió Volturnus | Xong, đã gộp 2026-11-19 (người dùng chuyển từ lane 3; không có lane đọc lại) |
| [T-049](T-049-cavalry-split.md) | 2 | Trận đánh 3D: tách kỵ binh của Hasdrubal thành kỵ binh Iberia và kỵ binh Gaul (loại lính, khối quân, lời dẫn) | Xong, đã gộp 2026-11-19 (cùng T-050) |
| [T-050](T-050-gallic-cavalry.md) | 1 | Trận đánh 3D: mô hình kỵ binh Gaul (`gallic-cavalry`), người dùng xem ảnh render trước | Xong, đã gộp 2026-11-19 (cùng T-049) |
| [T-051](T-051-trasimene-stage0.md) | 2 | Trận hồ Trasimene (đợt K), chặng 0: tư liệu, vị trí, bảng đơn vị, lưới độ cao, kiểm tra hồ và sương mù | Xong, đã gộp 2026-11-19 |
| [T-052](T-052-trasimene-battle.md) | 2 | Trận hồ Trasimene (đợt K), chặng 1: file trận (khối quân, lời dẫn, cảnh vật, đảo, quân nấp); kiểm tra `islands` và `concealed` | Xong, đã gộp 2026-11-19 (cùng T-053) |
| [T-053](T-053-trasimene-scene.md) | 3 | Trận hồ Trasimene (đợt K), chặng 2: mặt hồ và đảo, lính lội nước, sương mù, quân nấp; hiệu năng | Xong, đã gộp 2026-11-19 (cùng T-052) |
| [T-054](T-054-about-two-battles.md) | 1 | Trận hồ Trasimene (đợt K), chặng 3: hộp thoại Giới thiệu nói đúng về cả hai trận (ý riêng từng trận, nguồn của Trasimene) | Xong, đã gộp 2026-11-19 |
| [T-055](T-055-trasimene-dawn-load.md) | 3 | Trận hồ Trasimene: cảnh lúc mở trận (4:30) quá tối; cảnh tải chậm hơn Cannae 2,5–3 giây; hai chỗ nhỏ ở mép nước | Xong, đã gộp 2026-11-19 (phiên chính làm thay lane 3) |
| [T-056](T-056-map-lake-trasimene.md) | 2 | Bản đồ nền thiếu hồ Trasimene: thêm hồ, thấy được trong cú bay tới chiến trường | Xong, đã gộp 2026-11-19 |
| [T-057](T-057-knockdown-clip.md) | 1 | Đợt L (kỵ binh xông qua): clip `knockdown`, bộ binh bị ngựa xô ngã rồi gượng dậy; một mô hình trước, người dùng xem, rồi cả tám | Xong, đã gộp 2026-11-20 |
| [T-058](T-058-horse-walk.md) | 2 | Đợt L (làm đẹp lính): móng ngựa trượt và lún khi đi bước; xuất lại bốn mô hình kỵ binh | Xong, đã gộp 2026-11-21 (phiên chính làm thay lane 2) |
| [T-059](T-059-overrun-data.md) | 2 | Đợt L, chặng A3: kỵ binh xông qua bộ binh trong dữ liệu Cannae và hồ Trasimene, theo nguồn | Xong, đã gộp 2026-11-20; mục 6 gộp 2026-11-21 (phiên chính làm thay lane 2) |
| [T-060](T-060-ridedown-rider.md) | 1 | Đợt L: clip `ridedown` cho bốn mô hình kỵ binh; chân người cưỡi đung đưa, vạt áo thu gọn, cú ngã có đường bay | Xong, đã gộp 2026-11-21 (phiên chính làm thay lane 1) |
| [T-061](T-061-soldier-looks.md) | Phiên chính | Đợt L, B1: mỗi lính một vẻ (màu áo, tóc, râu, hoa văn khiên, màu lông ngựa) cho 12 mô hình | Xong, đã gộp 2026-11-21 |
| [T-062](T-062-lod-per-figure.md) | Phiên chính | Đợt L, B4: mỗi người một mức chi tiết; trần tam giác đo trên màn hình của người dùng | Phần chính gộp 2026-11-22; còn đo chốt khi máy yên và thử tỉ lệ điểm ảnh 1,5 cho góc mở trận |
