# Bản đồ nền

`basemap.json` là dữ liệu bản đồ nền mà `src/components/map/` vẽ bằng lớp GeoJSON: biển, hồ tự nhiên và sông lớn. Không có biên giới, tên nước hay thành phố ngày nay.

- **Nguồn:** [Natural Earth](https://www.naturalearthdata.com/) tỉ lệ 1:10m, thuộc phạm vi công cộng (public domain). Lấy từ <https://github.com/nvkelso/natural-earth-vector/tree/master/geojson>: `ne_10m_ocean`, `ne_10m_lakes`, `ne_10m_rivers_lake_centerlines`.
- **Phạm vi:** kinh độ −40 đến 80, vĩ độ 5 đến 70 (Địa Trung Hải, châu Âu, Bắc Phi, Cận Đông). Bản đồ khoá khung nhìn trong vùng này.
- **Xử lý:** cắt theo phạm vi, đơn giản hoá (sai số 0,006°), làm tròn 3 chữ số thập phân, bỏ đảo và hồ dưới khoảng 1 km². Đã loại yếu tố hiện đại: hồ chứa (`Reservoir`), kênh đào, hồ Bitter (do kênh Suez tạo ra).
- **Định dạng:** một `FeatureCollection`, mỗi feature có `properties.kind` là `ocean`, `lake` hoặc `river`; sông có thêm `rank` (scalerank của Natural Earth, số nhỏ là sông lớn).

Tạo lại file:

```
node src/components/map/tools/build-basemap.mjs <thư mục chứa 3 file GeoJSON của Natural Earth>
```

Lưu ý: đường bờ biển và dòng sông là của ngày nay. Một số nơi khác đáng kể so với thời cổ đại (châu thổ sông Po và sông Nile, vịnh Utica, Thermopylae, vùng đất lấn biển ở Hà Lan).
