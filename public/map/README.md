# Bản đồ nền

`basemap.json` là dữ liệu bản đồ nền mà `src/components/map/` vẽ bằng lớp GeoJSON: biển, hồ tự nhiên và sông lớn. Không có biên giới, tên nước hay thành phố ngày nay.

- **Nguồn:** [Natural Earth](https://www.naturalearthdata.com/) tỉ lệ 1:10m, thuộc phạm vi công cộng (public domain). Lấy từ <https://github.com/nvkelso/natural-earth-vector/tree/master/geojson>: `ne_10m_ocean`, `ne_10m_lakes`, `ne_10m_lakes_europe`, `ne_10m_rivers_lake_centerlines`.
- **Phạm vi:** kinh độ −40 đến 80, vĩ độ 5 đến 70 (Địa Trung Hải, châu Âu, Bắc Phi, Cận Đông). Bản đồ khoá khung nhìn trong vùng này.
- **Xử lý:** cắt theo phạm vi, đơn giản hoá (sai số 0,006°), làm tròn 3 chữ số thập phân, bỏ đảo và hồ dưới khoảng 1 km². Đã loại yếu tố hiện đại: hồ chứa (`Reservoir`), kênh đào, hồ Bitter (do kênh Suez tạo ra).
- **Hồ nhỏ ở châu Âu** (`ne_10m_lakes_europe`, thêm ở T-056): file bổ sung này có những hồ nhỏ mà `ne_10m_lakes` bỏ qua, trong đó có hồ Trasimene. Phân loại của nó không tách được hồ tự nhiên với hồ đập (nhiều hồ đập như La Serena, Kremasta, hồ Assad vẫn ghi là `Lake`), và một nửa số hồ không có tên. Vì thế script không lọc file này mà chỉ lấy những hồ có trong danh sách `EUROPE_LAKES` (theo `ne_id`): 110 hồ và đầm phá tự nhiên đã có nước từ thời cổ, xét từng hồ trong vùng kinh độ 11° T đến 45° Đ, vĩ độ 30° B đến 53° B. Hồ ngoài vùng này (Scandinavia, vùng Baltic, Nga, bờ bắc biển Caspi, Lưỡng Hà) chưa được xét nên chưa lấy. Một `ne_id` trong danh sách mà không còn trong file thì script dừng và báo.
- **Định dạng:** một `FeatureCollection`, mỗi feature có `properties.kind` là `ocean`, `lake` hoặc `river`; sông có thêm `rank` (scalerank của Natural Earth, số nhỏ là sông lớn).

Tạo lại file:

```
node src/components/map/tools/build-basemap.mjs <thư mục chứa 4 file GeoJSON của Natural Earth>
```

File hiện tại dựng từ bản trên nhánh `master` của kho trên: ba file đầu tải ngày 2026-11-15, `ne_10m_lakes_europe` tải ngày 2026-11-19.

Lưu ý:

- Đường bờ biển và dòng sông là của ngày nay. Một số nơi khác đáng kể so với thời cổ đại (châu thổ sông Po và sông Nile, vịnh Utica, Thermopylae, vùng đất lấn biển ở Hà Lan). Hồ Bafa thời cổ là vịnh Latmos, nước biển; bản đồ vẽ nó là hồ, vẫn là nước.
- Đường bờ hồ của Natural Earth thô ở tỉ lệ một trận đánh. Bờ bắc hồ Trasimene trên bản đồ nền nằm lệch về phía bắc 0,7–0,9 km so với bờ trong file trận (dữ liệu Copernicus 30 m), ngay từ dữ liệu gốc chứ không do bước đơn giản hoá; xem T-056.
