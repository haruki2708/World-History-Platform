# Mô hình lính cho cảnh trận đánh 3D

Thư mục này chứa script Blender dựng mô hình lính, ảnh render để duyệt và phần ghi công. File mô hình đã xuất nằm ở `public/battles/models/`. Hợp đồng của mô hình (hệ trục, khung xương, LOD, vật liệu, hoạt hình) ở `docs/ARCHITECTURE.md`, mục "Trận đánh 3D".

```
art/
  blender/      script Python chạy bằng Blender không giao diện
  renders/      ảnh render để người dùng duyệt
  build/        file trung gian (.blend, ảnh bake, ảnh xem thử); không đưa vào git
  CREDITS.md    ghi công mô hình gốc và những gì đã sửa
```

## Cần có

- **Blender 5.2.2** tại `D:\Tools\Blender\5.2.2\blender.exe` (không nằm trong PATH). Không cần cài thêm add-on nào.
- **File gốc** để ngoài repo, trong thư mục mà biến môi trường `WHP_ASSETS` trỏ tới. Mặc định là `E:\World_History_Platform_assets`. Cách tải và đặt file: xem `README.txt` trong thư mục đó.

  ```
  %WHP_ASSETS%\sources\
    roman-soldier-andywoodhead\source\Old man head 12 FBX test.fbx
    roman-soldier-andywoodhead\textures\*.jpeg
    celt-andywoodhead\source\unzipped\Celt 07.fbx
  ```

Không đưa file gốc (FBX, ảnh vật liệu gốc) hay file `.blend` trung gian vào repo.

## Cách chạy

Luôn chạy Blender với ba cờ `--background --factory-startup --disable-autoexec`. Chạy từ thư mục gốc của repo (PowerShell):

```powershell
$blender = "D:\Tools\Blender\5.2.2\blender.exe"

# Dựng lại toàn bộ từ file gốc
& $blender --background --factory-startup --disable-autoexec --python art/blender/build_roman_legionary.py

# Chạy lại từ một giai đoạn (dùng file .blend của giai đoạn trước trong art/build/)
& $blender --background --factory-startup --disable-autoexec --python art/blender/build_roman_legionary.py -- --from strip

# Kèm ảnh xem thử sau mỗi giai đoạn (art/build/roman-legionary/preview-*.png)
& $blender --background --factory-startup --disable-autoexec --python art/blender/build_roman_legionary.py -- --preview
```

Tham số của script đặt sau dấu `--`:

| Tham số | Ý nghĩa |
|---|---|
| `--from <giai đoạn>` | Bắt đầu từ giai đoạn này; cần file `.blend` của giai đoạn trước trong `art/build/roman-legionary/`. |
| `--to <giai đoạn>` | Dừng sau giai đoạn này. |
| `--preview` | Render ảnh xem thử (trước, nghiêng, sau) sau mỗi giai đoạn. |

Đổi chỗ để file gốc:

```powershell
$env:WHP_ASSETS = "D:\duong\dan\khac"
```

## Các giai đoạn của `build_roman_legionary.py`

| Giai đoạn | Việc làm | Script |
|---|---|---|
| `source` | Nhập mô hình 07 (lính La Mã, tư thế chữ T), áp scale và hướng, nối lại ảnh vật liệu theo tên file, sửa vật liệu (FBX nhập vào bị kim loại hoàn toàn). | `roman_source.py` |
| `strip` | Bỏ trang bị thời Đế chế. Danh sách và lý do nằm trong `REMOVED` của `roman_source.py`. | `roman_source.py` |

Mỗi giai đoạn lưu `art/build/roman-legionary/<số>-<tên>.blend`. Chạy lại từ đầu với cùng file gốc cho ra cùng kết quả: script không dùng số ngẫu nhiên không cố định hạt giống, không phụ thuộc giao diện.

## Các file script

| File | Nội dung |
|---|---|
| `whp_common.py` | Đường dẫn (`WHP_ASSETS`, `art/build/`), đọc tham số, nhập FBX, tiện ích chọn, gộp, nhân bản đối tượng. |
| `whp_render.py` | Đèn, camera, render ảnh tĩnh bằng EEVEE. |
| `roman_source.py` | Nhập mô hình 07 và bỏ trang bị thời Đế chế. |
| `build_roman_legionary.py` | Điểm vào: chạy các giai đoạn theo thứ tự. |
