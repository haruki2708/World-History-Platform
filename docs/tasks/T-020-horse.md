# T-020: Ngựa cho kỵ binh, và chỉnh dữ liệu Cannae trong cảnh thật

- **Lane:** 2
- **Model đề xuất:** Opus 5.5, effort `high` (`xhigh` cho phần Blender khó).
- **Nhánh:** `lane2/T-020-horse` (tạo từ `main` mới nhất, **sau khi T-017 đã gộp**)
- **Phạm vi file:**
  - **Ngựa:** `art/blender/horse_*.py`, `art/renders/horse/`, `art/build/horse/` (không vào git), mục ngựa trong `art/README.md` và `art/CREDITS.md`.
  - **Dữ liệu:** như T-016: `src/data/battles/`, `public/data/terrain/`, `scripts/battles/`, `docs/data/battles/`.

## Bối cảnh

Người dùng duyệt đợt B: đủ 10 loại mô hình cho trận Cannae. Ba loại là kỵ binh: `roman-cavalry`, `iberian-gallic-cavalry`, `numidian-cavalry`. Hợp đồng (`docs/ARCHITECTURE.md`, "Mô hình lính") yêu cầu:
- người và ngựa trong cùng một file;
- một khung xương;
- `LOD0` tối đa 8 000 tam giác cho cả người lẫn ngựa.

Task này dựng **con ngựa** làm nền. Lane 1 sẽ ghép người cưỡi lên ngựa trong T-022. Lane 1 đang làm T-019 (thư viện hoạt hình, lính La Mã) trong `art/` cùng lúc với bạn, nên chỉ sửa các file ngựa nêu ở trên.

## Đọc trước

- `docs/data/battles/ASSETS.md`: khảo sát ngựa bạn đã làm ở T-016.
- `art/README.md`: quy trình Blender của lane 1 (cách chạy, các module `whp_*.py`, LOD, bake, xuất, kiểm tra).
  - Được import các module chung, **không sửa chúng**. Cần đổi thì ghi đề nghị cho lane 1 trong mục "Kết quả".
- Blender 5.2.2 tại `D:\Tools\Blender\5.2.2\blender.exe`. Luôn chạy với `--background --factory-startup --disable-autoexec`.

## Yêu cầu

### Phần 1: Ngựa

**1. Chọn mô hình.**
- Đọc trực tiếp giấy phép của ứng viên số 1 (BlendSwap 28627, CC0). Đọc cả giấy phép của lưới gốc mà một bình luận nhắc tới (Tarnyloo, BlendSwap 17172).
- Lưới gốc không rõ giấy phép thì bỏ ứng viên này, chọn #4 hoặc #2/#3 (CC BY 4.0).
- Ghi lựa chọn và lý do vào `ASSETS.md`.

**2. Tải về.**
- Đặt ở `E:\World_History_Platform_assets\sources\horse-<tên>\`, ngoài repo. Ghi nguồn vào `E:\World_History_Platform_assets\README.txt`.
- BlendSwap và Sketchfab thường bắt đăng nhập để tải. **Không tự tạo tài khoản.** Khi cần đăng nhập thì dừng lại, báo người dùng link và thư mục đích. Người dùng sẽ tự tải bằng tài khoản của họ, như đã làm với mô hình lính.

**3. Dựng ngựa bằng script** `art/blender/horse_build.py` (và các module `horse_*.py` nếu cần). Chạy lại từ đầu phải ra cùng kết quả.
- **Kích thước.** Ngựa thời đó nhỏ hơn ngựa ngày nay: cao khoảng 1,35–1,45 m tới vai. Ghi nguồn cho con số chọn.
- **Yên cương đúng năm 216 TCN.**
  - Không có bàn đạp: thời này chưa có.
  - Bỏ yên kiểu hiện đại nếu mô hình có.
  - Dựng thêm một tấm vải lót yên và dây cương đơn giản thành **lưới riêng**, để T-022 bật tắt theo loại kỵ binh. Kỵ binh Numidia cưỡi không yên, không cương, chỉ có dây quàng cổ.
- **Mức chi tiết** (để T-022 còn chỗ cho người cưỡi): khoảng 3 500 / 700 / 150 tam giác cho LOD0 / LOD1 / LOD2. Dùng cách giảm lưới và bake của `whp_lod.py` nếu hợp.
- **Hoạt hình** của ngựa, không có chuyển động gốc, lặp liền mạch:
  - `idle`, `walk`, `run` (phi nước kiệu nhanh hoặc nước đại), `die` (ngã);
  - ghi độ dài một vòng `walk` và `run`.
  - Lấy từ mô hình gốc nếu có. Thiếu `die` thì tự làm bằng keyframe.
- **Đầu ra:** `art/build/horse/horse.blend`, gồm khung xương, lưới các LOD, vật liệu và clip.
  - **Không xuất ra `public/`.** Ngựa không phải một loại lính riêng.
  - Ghi rõ trong `art/README.md` cách T-022 dùng file này: tên xương lưng hay yên để gắn người cưỡi, chiều cao yên, hướng.
- **Ảnh duyệt** trong `art/renders/horse/`, JPEG, mỗi ảnh tối đa 400 KB:
  - nhìn nghiêng, trước, sau;
  - ba mức LOD cạnh nhau;
  - mỗi clip ba khung hình;
  - một ảnh đặt cạnh `roman-legionary` đứng, để so tỉ lệ.
- **Ghi công:** mục ngựa trong `art/CREDITS.md`, gồm giấy phép, link và những gì đã sửa.

### Phần 2: Dữ liệu Cannae trong cảnh thật

Cảnh 3D (T-015) đã gộp, nên giờ xem được dữ liệu của bạn trong cảnh thật: `npm run dev`, mở `/battle-lab?stats=1`. Lane 3 đang sửa góc nhìn đầu và nhãn trong T-018.

- Xem cả 6 giai đoạn, rồi chỉnh những gì trông sai:
  - tốc độ di chuyển (lính đi bộ khoảng 1 m/s, kỵ binh nhanh hơn);
  - độ dày khối quân;
  - mũi tên;
  - các khối xuyên vào nhau.
- Thêm `dayOfYear` cho Cannae (trường mới trong `Battle`).
  - Ngày 2 tháng 8 theo lịch La Mã năm 216 TCN không trùng mùa thật. Tìm cách các sử gia đổi ngày, chọn một con số và ghi lý do vào `docs/data/battles/cannae.md`.
- Ghi những gì đã chỉnh vào `cannae.md`.

## Ràng buộc

- Không đưa file gốc (`.blend` tải về, ảnh vật liệu gốc) hay `art/build/` vào repo.
- Không dùng tài sản chưa đọc giấy phép, tài sản NC hay ND, hay tài sản trích từ game.
- Không sửa `src/` ngoài `src/data/battles/`. Không thêm thư viện npm.
- Lane 3 có thể đang đo hiệu năng. Bake bằng Cycles thì giữ CPU, và không để `blender.exe` chạy khi không cần.

## Xong khi

- `art/build/horse/horse.blend` dựng lại được bằng một lệnh, có đủ LOD và 4 clip.
- Có ảnh duyệt trong `art/renders/horse/` và ghi công.
- Dữ liệu Cannae đã chỉnh, có `dayOfYear`.
- `npm run validate`, `npm run lint`, `npm run build` qua.

## Kết quả

_(Lane 2 điền khi xong.)_
