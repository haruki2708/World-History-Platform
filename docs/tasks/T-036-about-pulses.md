# T-036: Hộp thoại Giới thiệu nói rõ cảnh vẽ đánh liên tục

- **Ai làm:** phiên chính (người dùng chọn 2026-11-18, sau đợt G).
- **Nhánh:** `t036-about-pulses`.
- **Trạng thái:** xong 2026-11-18; chờ người dùng duyệt câu chữ và gộp.
- **Phạm vi file:** `src/lib/i18n/messages.ts`, `src/components/shell/AboutDialog.tsx`, `docs/`.

## Vì sao

Trong cảnh 3D, từ lúc hai tuyến chạm nhau, người đầu hàng ra đòn đều đặn cho tới hết giai đoạn. Nhiều nhà nghiên cứu cho rằng trận thật không như vậy: hai tuyến đánh từng đợt ngắn, giữa các đợt thì lùi ra nghỉ (Philip Sabin, "The Face of Roman Battle", *Journal of Roman Studies* 90, 2000; Adrian Goldsworthy, *The Roman Army at War 100 BC–AD 200*, 1996). Đây là suy luận từ thời lượng trận và tỉ lệ thương vong, chưa phải điều đã chứng minh, nên câu chữ dùng "nhiều khả năng". Hai tên sách ghi theo trí nhớ của phiên chính, chưa tra lại; chúng không hiện trong app.

Người dùng chọn chỉ nói rõ điều này trong hộp thoại Giới thiệu, không sửa cảnh. Sửa cảnh cho đánh theo từng đợt là việc cỡ một chặng của đợt G (lịch người ngã, vị trí hàng đầu, ghép cặp, tua) và làm phần đánh trong hai phút rưỡi của cảnh còn ngắn hơn.

## Đã làm

Thêm một dòng vào danh sách "Trận đánh 3D là phỏng dựng" (khoá `about.accuracy.battle.pulses`, sau dòng về thời lượng):

- Tiếng Anh: "the fighting is shown without a pause; in a real battle the lines probably fought in short bursts and drew apart to rest in between;"
- Tiếng Việt: "cảnh vẽ hai bên đánh liên tục; trong trận thật, nhiều khả năng hai tuyến đánh theo từng đợt ngắn, giữa các đợt thì lùi ra nghỉ;"

## Đã kiểm tra

- `npm run lint`, `npx tsc --noEmit`: qua.
- Trong trình duyệt (dev): mở hộp thoại ở cả hai ngôn ngữ, dòng mới hiện đúng chỗ, không vỡ bố cục (chế độ tối, 1280×800).
