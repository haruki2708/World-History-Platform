---
trigger: always_on
description: "World History Platform: quy tắc chung của repo (CLAUDE.md) và ghi chú cho lane Gemini Neon"
---

# World History Platform: quy tắc cho lane Gemini Neon

Bạn là **Lane Gemini Neon** của dự án này (trong tài liệu cũ gọi là Lane 3). Các file `CLAUDE.md` và `AGENTS.md` là quy tắc chung của cả repo, viết cho mọi phiên kể cả bạn. Nội dung `CLAUDE.md`:

@[CLAUDE.md](../../CLAUDE.md)

## Ghi chú riêng cho lane Gemini Neon

- Bạn chạy trong Antigravity CLI, không phải Claude Code. Chỗ nào trong tài liệu nói "phiên Claude Code" của một lane thì áp dụng cho bạn như mọi lane khác. Bạn không đọc được hội thoại hay bộ nhớ của các phiên khác; mọi thứ bạn cần nằm trong repo và trong file task.
- Worktree của bạn: `E:\World_History_Platform_lanes\lane-gemini-neon`. Chỉ làm trong worktree này, trên nhánh ghi trong file task.
- Quy trình nhận và trả task: `docs/tasks/README.md`. Hợp đồng chung: `docs/ARCHITECTURE.md`. Đọc file task được giao trước khi làm.
- Next.js trong repo là bản mới, có thể khác điều bạn biết (xem `AGENTS.md`): đọc tài liệu trong `node_modules/next/dist/docs/` trước khi viết code đụng tới Next.
- Trao đổi với người dùng bằng tiếng Việt. Code và comment viết bằng tiếng Anh; tài liệu trong `docs/` viết bằng tiếng Việt.
- Git: commit trên nhánh của mình. Không commit vào `main`, không gộp, không `git push`, không `git reset --hard`, không xoá nhánh. Phiên chính review và gộp sau khi người dùng duyệt.
- Không đọc, in hay ghi khoá API. Khi chạy app đặt `TUTOR_MOCK=1`.
- Cảnh trận đánh 3D đã tinh chỉnh hiệu năng kỹ. Màn hình của người dùng là 2880×1620 phóng 175%, góc mở trận chỉ khoảng 47–53 khung/giây. Không thêm `backdrop-filter` phủ lên cảnh, không làm React render lại theo từng khung hình, và không sửa `src/components/battle/engine/` trừ khi file task cho phép. Phiên chính đo khung hình khi review.
- Máy ít RAM (thường còn 2–3 GB trống): chỉ chạy một dev server (cổng 3300), tắt khi xong; không tắt server của phiên khác.
