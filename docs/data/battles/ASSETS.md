# Nguồn cho đợt B: mô hình ngựa và thư viện hoạt hình

Cập nhật: 2026-11-16 (T-016). Chỉ tìm và đánh giá, chưa tải file nào vào repo.

## Yêu cầu nhắc lại

- **Giấy phép:** CC0 hoặc CC BY. Không NC (cấm thương mại), không ND (cấm sửa), không share-alike, không mô hình trích từ game.
- **Ngựa:** người và ngựa nằm chung một file, `LOD0` tối đa 8 000 tam giác cho cả hai (`docs/ARCHITECTURE.md`). Ngựa nên ở khoảng 3 000–4 000 tam giác ở `LOD0`, nên mô hình nặng hơn phải giảm lưới. Cần ít nhất đi (`walk`), nên có phi (`run`).
- **Hoạt hình người:** gắn được vào khung xương chuẩn Unreal (UE mannequin, 67 xương: `pelvis`, `spine_01..03`, `clavicle_l`, `upperarm_l`…, xem `docs/tasks/T-014-roman-legionary-model.md`). Cần: đứng, đi, chạy, đâm kiếm hoặc giáo, ngã. Giấy phép phải cho phép đưa hoạt hình vào file `.glb` công khai trong repo.

## Cách đọc thông tin

- **Sketchfab:** trang mô hình chỉ hiện nội dung khi chạy JavaScript, nên giấy phép, số mặt (`faceCount`, Sketchfab đếm theo tam giác) và số hoạt hình đọc từ API công khai `https://api.sketchfab.com/v3/models/<uid>`, cùng dữ liệu mà trang hiển thị. Tên các hoạt hình không có trong API: phải mở trình xem 3D trên trang để xem trước khi chọn.
- **Các trang khác:** đọc trực tiếp trên trang.

## Mô hình ngựa

| # | Mô hình | Tác giả | Giấy phép | Tam giác | Khung xương, hoạt hình | Nhận xét |
|---|---|---|---|---|---|---|
| 1 | [Horse Rigged All Gaits](https://blendswap.com/blend/28627) (BlendSwap) | fdoss001 | **CC0** (trường Licence trên trang; mô tả: "Free to use. No need to credit me") | Trang không ghi | Có ("It's fully rigged"); **đi, chạy nước kiệu, phi nước kiệu, phi nước đại** (walk, trot, canter, gallop) | Đủ dáng đi nhất, giấy phép thoáng nhất. File Blender 2.9x nặng 584 MB, chắc chắn phải giảm lưới. **Cần kiểm tra thêm:** một bình luận dưới trang nói lưới ngựa gốc là của Tarnyloo ([blend 17172](https://blendswap.com/blend/17172)); phải đọc giấy phép của mô hình gốc đó trước khi dùng |
| 2 | [Horse](https://sketchfab.com/3d-models/6d0f9c1ce82f41048a282b6c47a50684) (Sketchfab) | MAXDESIGN-3D | **CC BY 4.0** | 14 646 | Có, 1 hoạt hình (mô tả: "Horse animated Ready for games") | Tả thực mức trung bình. Chỉ một hoạt hình: thiếu dáng nào thì phải tự làm |
| 3 | [Horse](https://sketchfab.com/3d-models/d9af6902210645d995e37ba4319957b6) (Sketchfab, ngựa trắng) | MAXDESIGN-3D | **CC BY 4.0** | 14 796 | Có, 1 hoạt hình | Bản màu khác của #2, cùng lưới; hữu ích để có nhiều màu lông |
| 4 | [Rigged Mid Poly Horse](https://sketchfab.com/3d-models/fea999c1d8d64eb4a9c2bb1fac1e7d83) (Sketchfab) | antemeossa | **CC BY 4.0** | 5 162 | Có, 4 hoạt hình | Nhẹ nhất trong nhóm tả thực, gần mức cần cho `LOD0`. Phong cách đơn giản hơn mô hình lính của Andywoodhead |
| 5 | [Horse](https://sketchfab.com/3d-models/041e84c8a0c34944a38b948a2c58fc0f) (Sketchfab) | kenchoo | **CC BY 4.0** | 42 631 | Có, 1 hoạt hình | Chi tiết hơn, phải giảm lưới mạnh |

### Lựa chọn (T-020, 2026-11-16)

**Chọn #1, "Horse Rigged All Gaits" (BlendSwap 28627), dùng theo giấy phép CC BY của lưới gốc.** Đọc trực tiếp trên trang:

- **BlendSwap 28627 (fdoss001):** trường License ghi **CC0**; mô tả: "Free to use. No need to credit me". Có khung xương, các dáng đi, nước kiệu, nước kiệu nhanh, nước đại; có yên, bàn đạp, cương (sẽ bỏ: thời 216 TCN chưa có bàn đạp); lông bằng hệ hạt (sẽ bỏ). Hai bình luận (Ailuros) nói lưới ngựa gốc là của Tarnyloo, dẫn link [blend 17172](https://blendswap.com/blend/17172).
- **BlendSwap 17172 "Horse" (Tarnyloo):** trường License ghi **CC-BY**, trang tải ghi "Please credit Tarnyloo when you use it". Mô tả: "100% medium poly original model made entirely by me from assorted references". Trang không ghi phiên bản CC BY, và điều khoản chung của BlendSwap (`/terms`) cũng không ghi.
- **Kết luận:** lưới gốc có giấy phép rõ ràng (CC BY), nên không cần bỏ ứng viên này. Một bản dẫn xuất không thể gỡ nghĩa vụ ghi công của lưới gốc, nên coi cả mô hình là **CC BY**: ghi công Tarnyloo (lưới) và fdoss001 (khung xương, hoạt hình, CC0) trong `art/CREDITS.md`. Khi có file, so lưới của hai mô hình để xác nhận lời bình luận; nếu 28627 hoá ra là lưới khác thì vẫn ghi công cả hai, không hại gì.
- **Vì sao không chọn #4 hay #2/#3:** #1 là mô hình duy nhất có đủ các dáng đi cần cho `walk` và `run`, lại cùng phong cách tả thực; #4 nhẹ nhưng chỉ có 4 hoạt hình chưa rõ tên, #2/#3 chỉ có một hoạt hình.
- **Tải về:** cả hai trang bắt đăng nhập ("Sign in to download"). Người dùng tự tải, đặt vào `E:\World_History_Platform_assets\sources\horse-fdoss001\` và `...\horse-tarnyloo\`; nguồn ghi trong `README.txt` của thư mục đó.

**Đề xuất ở T-016:** thử #1 trước (đủ dáng, CC0) nếu giấy phép của lưới gốc Tarnyloo ổn; nếu không, #4 (nhẹ, 4 hoạt hình) hoặc #2/#3 (đẹp hơn, ít hoạt hình). Với mô hình CC BY: ghi công tác giả, link mô hình, link giấy phép và ghi rõ đã sửa gì trong `art/CREDITS.md`.

### Đã xem và loại

| Mô hình | Lý do loại |
|---|---|
| [HORSE - Realistic 3D Model (DEMO FREE)](https://sketchfab.com/3d-models/65d6a70a6721495f938c93e80a5998e4), WildMesh 3D | CC BY-NC (cấm thương mại) |
| Horse Walk, Horse Trot, Horse Run (creatureanimator) | CC BY-ND (cấm sửa) |
| [Star Equestrian - Base Horse Animations](https://sketchfab.com/3d-models/38b9735c999640678840fba8eb5c8506) | Mô tả ghi "Extracted By": trích từ game |
| Horse Walking (daxnorman) | CC BY-NC-SA |
| [Animated Rigged Horse With Saddle](https://sketchfab.com/3d-models/b08743c2c4734fb98a4e0a2f5767c318), Ayan | CC BY 4.0, 32 124 tam giác, nhưng yên cương kiểu hiện đại; phải gỡ yên. Giữ làm phương án phụ |
| [Draft Horse Walk](https://sketchfab.com/3d-models/0541f4f11cb44383bf32b906aac5288e), Bazsi1986 | CC BY 4.0 nhưng 74 492 tam giác, ngựa kéo xe (sai giống), tác giả tự nhận hoạt hình chưa tốt |
| Các ngựa low-poly hoạt hình (flairetic, jungle_jim, Yanez Designs…) | Phong cách hoạt hình, không hợp với mô hình lính tả thực |
| [Ultimate Animated Animals](https://quaternius.com/packs/ultimateanimatedanimals.html), Quaternius | CC0, nhưng phong cách low-poly; trang không ghi rõ có ngựa |

## Thư viện hoạt hình người

| # | Thư viện | Tác giả | Giấy phép (đọc ở đâu) | Nội dung | Khung xương | Nhận xét |
|---|---|---|---|---|---|---|
| 1 | [Universal Animation Library](https://quaternius.com/packs/universalanimationlibrary.html) ([itch.io](https://quaternius.itch.io/universal-animation-library)) | Quaternius | **CC0**: trang Quaternius ("Free to use in personal, educational and commercial projects. (CC0 License)") và itch.io ("Creative Commons Zero v1.0 Universal") | 120+ hoạt hình: di chuyển 8 hướng, chạy bộ, chạy nhanh, ngã chết, chiến đấu… Bản Standard miễn phí (OBJ, FBX, glTF) | "Universal humanoid rig, compatible with Unreal Engine, Godot and Unity, ready for retargeting". Trang **không nói** dùng đúng tên xương của UE mannequin | **Đề xuất hàng đầu.** CC0 nên đưa vào `.glb` công khai thoải mái. Việc trước tiên của lane 1: tải bản Standard, so tên xương với khung 67 xương của mô hình Celt; nếu khác thì đổi đích (retarget) trong Blender |
| 2 | [Universal Animation Library 2](https://quaternius.com/packs/universalanimationlibrary2.html) | Quaternius | **CC0** (trang Quaternius, cùng câu như trên) | 130+ hoạt hình, có **combo cận chiến có vũ khí** (3 và 4 đòn), parkour… | Cùng khung xương với #1 | Bổ sung cho #1 phần đâm, chém. Chưa rõ có động tác đâm giáo riêng không; nếu thiếu thì tự làm `attack` bằng keyframe như T-014 |
| 3 | Mixamo | Adobe | **Chưa đọc được.** Trang FAQ chính thức trả lỗi 403. Theo kết quả tìm kiếm, nhân viên Adobe trên diễn đàn cộng đồng nói được dùng cho dự án cá nhân và thương mại nhưng **không được phân phối lại nội dung gốc**; điều khoản bổ sung nằm ở file "Mixamo-Addl-Terms" mà tôi chưa đọc | Thư viện lớn, có đủ mọi động tác cần | Khung xương riêng của Mixamo, phải đổi đích sang UE mannequin | **Không đề xuất** khi chưa đọc điều khoản. Đưa hoạt hình vào `.glb` công khai trong repo, ai cũng tải được, rất có thể bị coi là phân phối lại. Nếu muốn dùng, phiên chính cần đọc điều khoản bổ sung của Adobe trước |
| 4 | CMU Graphics Lab Motion Capture Database | Đại học Carnegie Mellon | **Chưa đọc được**: trang FAQ lỗi chứng chỉ TLS khi tải | Dữ liệu quay chuyển động thô (BVH/ASF) | Phải đổi đích và làm sạch | Không đề xuất ở đợt B: nhiều việc, giấy phép chưa kiểm |

**Đề xuất:** dùng Universal Animation Library (bản 1 cho đứng, đi, chạy, ngã; bản 2 cho đòn đánh). Cả hai CC0, không bắt ghi công, nhưng vẫn nên ghi trong `art/CREDITS.md` cho minh bạch. Việc còn phải kiểm: tên xương có khớp UE mannequin không, và có động tác đâm giáo không.

## Việc còn mở

- Đọc giấy phép của mô hình ngựa gốc Tarnyloo (BlendSwap 17172) trước khi dùng ngựa #1.
- Mở trình xem của các mô hình Sketchfab để xem tên và chất lượng hoạt hình.
- Lane 1 tải bản Standard của Universal Animation Library để so tên xương.
- Nếu cần Mixamo hay CMU: đọc điều khoản trên trang chính thức trước.
