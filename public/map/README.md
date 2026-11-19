# Bản đồ nền

`basemap.json` là dữ liệu bản đồ nền mà `src/components/map/` vẽ bằng lớp GeoJSON: biển, hồ tự nhiên và sông lớn. Không có biên giới, tên nước hay thành phố ngày nay.

- **Nguồn:** [Natural Earth](https://www.naturalearthdata.com/) tỉ lệ 1:10m, thuộc phạm vi công cộng (public domain). Lấy từ <https://github.com/nvkelso/natural-earth-vector/tree/master/geojson>: `ne_10m_ocean`, `ne_10m_lakes`, `ne_10m_lakes_europe`, `ne_10m_rivers_lake_centerlines`. Riêng bờ hồ Trasimene lấy từ file trận, theo Copernicus DEM (xem mục dưới).
- **Phạm vi:** kinh độ −40 đến 80, vĩ độ 5 đến 70 (Địa Trung Hải, châu Âu, Bắc Phi, Cận Đông). Bản đồ khoá khung nhìn trong vùng này.
- **Xử lý:** cắt theo phạm vi, đơn giản hoá (sai số 0,006°), làm tròn 3 chữ số thập phân, bỏ đảo và hồ dưới khoảng 1 km². Đã loại yếu tố hiện đại: hồ chứa (`Reservoir`), kênh đào, hồ Bitter (do kênh Suez tạo ra).
- **Hồ nhỏ ở châu Âu** (`ne_10m_lakes_europe`, thêm ở T-056): file bổ sung này có những hồ nhỏ mà `ne_10m_lakes` bỏ qua, trong đó có hồ Trasimene. Phân loại của nó không tách được hồ tự nhiên với hồ đập (nhiều hồ đập như La Serena, Kremasta, hồ Assad vẫn ghi là `Lake`), và một nửa số hồ không có tên. Vì thế script không lọc file này mà chỉ lấy những hồ có trong danh sách `EUROPE_LAKES` (theo `ne_id`): 110 hồ và đầm phá tự nhiên đã có nước từ thời cổ, xét từng hồ trong vùng kinh độ 11° T đến 45° Đ, vĩ độ 30° B đến 53° B. Hồ ngoài vùng này (Scandinavia, vùng Baltic, Nga, bờ bắc biển Caspi, Lưỡng Hà) chưa được xét nên chưa lấy. Một `ne_id` trong danh sách mà không còn trong file thì script dừng và báo.
- **Hồ Trasimene** (thêm ở T-056): bờ hồ không lấy của Natural Earth mà lấy đường bao `terrain.lakes[0].outline` trong `src/data/battles/battle-of-lake-trasimene.json`. Đường bao này dò từ mặt nạ nước của Copernicus DEM GLO-30 (30 m), bao trọn cả hồ. Lý do: bờ bắc của Natural Earth lệch lên phía bắc tới 0,9 km, đặt cả đoàn quân La Mã trên con đường ven hồ xuống nước.
  - Script đọc thẳng file trận lúc dựng, không chép toạ độ: file trận đổi bờ hồ thì chỉ cần dựng lại. Hồ vẫn đứng đúng chỗ của hồ Trasimene (`ne_id` 1159109725) trong danh sách hồ, nên `ne_id` này vẫn phải có trong `ne_10m_lakes_europe`.
  - Đổi mét ra kinh độ, vĩ độ bằng đúng phép chiếu của file trận (mét về phía đông và phía bắc tính từ `origin`, mặt phẳng tiếp xúc ellipsoid WGS84), như `scripts/battles/build-terrain.mjs` và `fieldToLngLat` trong `battleFlight.ts`.
  - Đơn giản hoá theo mét (sai số 25 m) và giữ 4 chữ số thập phân. Không dùng sai số chung 0,006° (khoảng 500 m), và làm tròn 3 chữ số thôi cũng đã xê dịch bờ tới gần 70 m. Script đo khoảng cách lớn nhất giữa bờ trên bản đồ và đường bao của file trận, quá 50 m thì dừng và báo. Hiện tại: 162 điểm, lệch tối đa 27,6 m.
  - Đảo theo cùng quy tắc với phần còn lại (bỏ đảo dưới khoảng 1 km²): ba đảo của hồ (Polvese 0,79 km², Maggiore 0,23 km², Minore 0,06 km²) đều bị bỏ.
  - Ghi công: dòng nguồn ở chú giải bản đồ (`map.legend.basemap`) nói hồ Trasimene theo Copernicus DEM và chỉ sang phần Giới thiệu, nơi có đủ lời ghi công mà giấy phép Copernicus DEM yêu cầu.
- **Định dạng:** một `FeatureCollection`, mỗi feature có `properties.kind` là `ocean`, `lake` hoặc `river`; sông có thêm `rank` (scalerank của Natural Earth, số nhỏ là sông lớn).

Tạo lại file:

```
node src/components/map/tools/build-basemap.mjs <thư mục chứa 4 file GeoJSON của Natural Earth>
```

Script tự đọc file trận Trasimene trong repo, không cần chỉ đường dẫn.

File hiện tại dựng từ bản trên nhánh `master` của kho trên: ba file đầu tải ngày 2026-11-15, `ne_10m_lakes_europe` tải ngày 2026-11-19.

Lưu ý:

- Đường bờ biển và dòng sông là của ngày nay. Một số nơi khác đáng kể so với thời cổ đại (châu thổ sông Po và sông Nile, vịnh Utica, Thermopylae, vùng đất lấn biển ở Hà Lan). Hồ Bafa thời cổ là vịnh Latmos, nước biển; bản đồ vẽ nó là hồ, vẫn là nước.
- Đường bờ hồ của Natural Earth thô ở tỉ lệ một trận đánh. Với hồ Trasimene đã thay bằng bờ của file trận (xem trên). Bờ hồ là bờ ngày nay, mực nước 254,5 m; thời La Mã hồ có những lúc thấp hơn.
