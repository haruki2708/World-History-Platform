# World History Platform

Web app khám phá lịch sử: kéo thanh thời gian để xem các thế lực hưng thịnh và suy tàn trên bản đồ, kèm một gia sư AI biết người dùng đang xem năm nào, vùng nào, sự kiện nào. MVP: Cộng hoà La Mã, 509–27 TCN, vùng Địa Trung Hải, song ngữ Anh/Việt.

@AGENTS.md

## Đọc trước khi làm

- `docs/ARCHITECTURE.md`: hợp đồng chung (kiểu dữ liệu, store, định dạng dữ liệu). Bắt buộc đọc.
- `docs/PLAN.md`: các giai đoạn và trạng thái.
- `docs/OVERVIEW.md`: tổng quan sản phẩm, phạm vi MVP và lý do chọn công nghệ.
- `docs/tasks/README.md`: quy trình nhận và trả task.

## Mô hình làm việc

- **Phiên chính** điều phối: viết task, giữ hợp đồng chung, review và gộp code.
- **Lane 1, 2, 3** thực thi. Mỗi lane là một phiên Claude Code riêng, không chia sẻ hội thoại hay bộ nhớ với phiên khác. Mọi thứ cần truyền đạt phải nằm trong repo.
- Người dùng duyệt ở cuối mỗi giai đoạn.

| Ai | Sở hữu |
|---|---|
| Lane 1 | `src/components/timeline/`, `src/components/panel/`, `src/components/tutor/` |
| Lane 2 | `src/components/map/`, `public/map/`, `src/app/api/tutor/`, `src/server/tutor/` |
| Lane 3 | `src/data/*.json`, `public/data/`, `docs/data/`, `scripts/` |
| Phiên chính | Mọi thứ còn lại, gồm `src/lib/`, `src/store/`, `src/data/index.ts`, `src/app/`, `package.json`, `docs/` |

Quy tắc cho lane:

- Chỉ sửa file trong vùng mình sở hữu. Cần đổi file ngoài vùng (kiểu dữ liệu, store, thêm thư viện) thì không tự sửa: ghi đề nghị vào mục "Kết quả" của file task.
- Ngoại lệ: được thêm khoá vào `src/lib/i18n/messages.ts`, chỉ với tiền tố của mảng mình (`timeline.*`, `events.*`, `tutor.*`, `map.*`), và phải thêm cho cả `en` lẫn `vi`.
- Timeline, bản đồ và tutor chỉ giao tiếp qua `useAppStore`. Không import component của mảng khác.
- Khung chat và route của tutor chỉ giao tiếp qua hợp đồng trong `src/lib/tutor.ts`.
- Không bao giờ đưa khoá API vào code, commit, log hay tài liệu. Khoá chỉ nằm trong `.env.local`. Khi phát triển, dùng `TUTOR_MOCK=1`.

## Quy ước code

- TypeScript strict. Component tương tác là Client Component (`"use client"`).
- Năm là số nguyên, âm là TCN (509 TCN = `-509`). Hiển thị năm luôn qua `formatYear` / `formatYearRange` trong `src/lib/years.ts`.
- Mọi chuỗi người dùng nhìn thấy đều song ngữ: chuỗi giao diện qua `useT()`, nội dung lịch sử qua `LocalizedText` (`{ en, vi }`).
- Màu dùng token trong `src/app/globals.css` (`bg-surface`, `text-muted`, `border-line`, `text-accent`...), không viết mã màu trực tiếp. Giao diện phải đúng ở cả chế độ sáng lẫn tối.
- **Ưu tiên máy tính.** Thiết kế và kiểm tra chính ở màn hình máy tính (từ 1280×800). Trên điện thoại chỉ cần dùng được: trang không vỡ, không cuộn ngang (kiểm tra nhanh ở bề ngang 390px). Không làm tính năng hay tinh chỉnh riêng cho điện thoại.
- Code và comment viết bằng tiếng Anh. Tài liệu trong `docs/` viết bằng tiếng Việt.

## Lệnh

```
npm run dev      # chạy local tại http://localhost:3000
npm run lint
npm run validate # kiểm tra dữ liệu lịch sử (src/data, public/data/borders)
npm run build    # phải qua trước khi báo xong task
```

## Nội dung lịch sử

- Mỗi sự kiện và mỗi mốc biên giới phải có ít nhất một nguồn.
- Mốc năm còn tranh cãi hoặc theo truyền thống thì nói rõ trong phần tóm tắt. Vị trí không chắc thì đặt `approximate: true`.
- Tóm tắt tự viết, không chép nguyên văn từ nguồn.
