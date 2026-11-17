# T-027: Tải sẵn cảnh trong lúc bay, và chỉnh dữ liệu Cannae sau T-026

- **Lane:** 2
- **Model đề xuất:** Opus 5.5, effort `high`.
- **Nhánh:** `lane2/T-027-prefetch-data` (tạo từ `main` mới nhất)
- **Phạm vi file:**
  - `src/components/map/`;
  - `src/data/battles/`, `docs/data/battles/`, `scripts/battles/`;
  - khoá `map.*` trong `src/lib/i18n/messages.ts`, cả `en` lẫn `vi`.

## Bối cảnh

Đã gộp T-024, T-025 và T-026. Khi gộp T-025, phiên chính làm hai việc:
- **Bỏ màn chờ ở lần mở đầu:** đúng như đề nghị 1 của bạn, `AppShell` giữ component khung xem trận khi code đã về trong lúc bay.
- **Nối cú hạ camera với cảnh bản đồ:** khung xem trận giờ mở ra nhìn thẳng xuống tâm vùng địa hình, đủ cao để thấy cả vùng, hướng bắc lên, rồi hạ xuống góc nhìn mở.

Người dùng duyệt cho bạn làm tiếp hai việc nhỏ:
1. **Tải sẵn tài nguyên của cảnh trong lúc bay**, theo đề nghị 2 của bạn ở T-025.
2. **Chỉnh dữ liệu Cannae** theo những gì T-026 (cảnh) và T-024 (mô hình) cho phép hoặc phát hiện.

Trong lúc bạn làm, lane 1 làm T-022 (kỵ binh và clip `jog`) trong `art/`. Riêng task này, lane 1 được sửa các file ngựa `art/blender/horse_*.py` nếu cần, vì bạn không đụng tới chúng.

## Đọc trước

- `docs/ARCHITECTURE.md`:
  - mục "Trạng thái chung", đoạn "Mở trận qua bản đồ (T-025)";
  - mục "Cảnh 3D": quay đầu từ 135°; nhãn bị che;
  - mục "Mô hình lính": `jog`.
- `docs/tasks/T-026-scene-fixes.md`, mục "Kết quả", phần "Ghi chú cho lane 2".
- `docs/tasks/T-024-model-polish.md`, mục "Kết quả", phần 1, đoạn "Ghi chú cho lane 3": các khối đi xiên ở pha 5–6.
- `src/components/battle/engine/BattleEngine.ts`, hàm `load`: cảnh tải những gì (địa hình, `index.json`, các file `.glb`). Chỉ đọc.

## Yêu cầu

Commit sau mỗi phần việc lớn.

### 1. Tải sẵn tài nguyên của cảnh trong lúc bay

Khi `battleRequest` khác `null` và đã có dữ liệu trận (`loadBattle`), tải sẵn vào cache của trình duyệt:
- file địa hình của trận;
- `public/battles/models/index.json`;
- các file `.glb` mà trận cần: mô hình của các loại lính trong trận (`unitTypes`), chỉ những mô hình có trong `index.json`.

Yêu cầu:
- Không kéo three.js vào trang chính: chỉ dùng `fetch` (hoặc `<link rel="prefetch">`). Code nằm trong `src/components/map/`, cạnh chuyến bay.
- Cảnh phải dùng lại được đúng các phản hồi đó từ cache. Kiểm tra bằng danh sách request: sau khi khung xem trận mở, không có lượt tải thứ hai, hoặc chỉ là phản hồi từ cache.
- Không tải gì khi người dùng chưa bấm xem trận.
- Đo thời gian từ lúc bấm tới lúc cảnh vẽ xong, trước và sau. Đo trên mạng giả lập chậm, ví dụ `Network.emulateNetworkConditions` khoảng 20 Mb/s và độ trễ 40 ms, vì trên localhost lợi ích rất nhỏ.

### 2. Dữ liệu Cannae

- **Triarii ở giai đoạn 6:** T-026 đã cho khối quay đầu tại chỗ. Cho triarii quay về hướng phù hợp với nguồn, như bạn đã định ở `docs/data/battles/cannae.md`, mục 9. Xem lại trong cảnh rồi cập nhật tài liệu.
- **Các khối đi xiên so với hướng mặt** (ghi chú của lane 1 ở T-024): ở pha 5–6, một số khối đi xiên so với hướng mặt, nên chân trụ trượt nhiều.
  - Viết một script nhỏ (hoặc thêm vào `check-overlap.mjs`) liệt kê các khối có hướng đi lệch hướng mặt quá 45° ở từng giai đoạn.
  - Khối nào nguồn cho phép thì chỉnh hướng mặt hay đường đi. Khối nào đúng là phải đi xiên (ví dụ người Libya bẻ hướng vào sườn quân La Mã) thì ghi lại để phiên chính xem phía cảnh.
- Mọi thay đổi dữ liệu phải qua `npm run validate`, và ghi vào `docs/data/battles/cannae.md`.

## Ràng buộc

- Không sửa store, `src/lib/`, `src/data/index.ts`, `src/app/`, `src/components/battle/`. Cần đổi thì ghi đề nghị vào "Kết quả".
- Không thêm thư viện npm.
- Dev server dùng cổng 3102.

## Xong khi

- Bấm xem trận thì tài nguyên của cảnh tải trong lúc bay; cảnh dùng lại từ cache. Có số đo thời gian trước và sau trên mạng chậm.
- Trang chính vẫn không tải three.js trước khi bấm, và không tải tài nguyên cảnh trước khi bấm.
- Triarii quay đúng ở giai đoạn 6; có danh sách các khối đi xiên kèm cách xử lý.
- `npm run lint`, `npm run build`, `npm run validate` qua.

## Kết quả

Nhánh `lane2/T-027-prefetch-data`, 4 commit "T-027: …" trên `40de41e`. Xong cả hai việc. `npm run lint`, `npm run build`, `npm run validate` qua.

**Cần đọc trước:** khi làm việc 2 tôi tìm ra một lỗi của cảnh từ T-026: khối quay đầu không quay tại chỗ, mà từng người đi xuyên qua khối tới vị trí đối xứng (mục 2.1). Dữ liệu mới thêm 11 lần quay đầu, gồm cả triarii mà task yêu cầu. Cần gộp cùng bản sửa ở đề nghị 1 (khoảng 15 dòng trong `timeline.ts`, đã thử). Không có bản sửa thì các khối này co lại giữa giai đoạn.

### 1. Tải sẵn tài nguyên của cảnh trong lúc bay

**Cách làm** (`src/components/map/battlePrefetch.ts`, gọi từ `useBattleFlight` mỗi khi có `battleRequest` mới):
- dùng chung lượt nạp file trận với chuyến bay (`loadBattle`, cùng một lần import);
- tải sẵn file địa hình bằng `<link rel="prefetch" crossorigin>`;
- đọc `index.json` bằng `fetch`, vì phải biết mô hình nào có;
- tải sẵn các file `.glb` của những loại lính trong trận có mặt trong `index.json`. Với Cannae là 8 file; ba mô hình kỵ binh chưa có trong danh sách nên không bị hỏi.
- Trình duyệt không hỗ trợ `rel=prefetch` (Safari) thì dùng `fetch` ưu tiên thấp.
- Mỗi trận chỉ tải sẵn một lần mỗi lần mở trang; nếu file trận lỗi thì lần bấm sau thử lại.
- Vẫn chạy khi bản đồ chưa sẵn sàng hay người dùng bật giảm chuyển động (trận mở ngay): cảnh vẫn được lợi vì tài nguyên tải song song với code three.js.
- Không thêm thư viện, không thêm khoá i18n.

**Cache: cảnh không tải lại, nhưng vẫn hỏi lại máy chủ (304).**
- Next gửi file trong `public/` với `Cache-Control: public, max-age=0` kèm ETag, ở cả `next dev` lẫn `next start`.
- Tôi đã thử 5 cách `<link rel="prefetch">` (có và không có `crossorigin`, `as="fetch"`, `fetch` với `credentials: "include"` và `mode: "no-cors"`). Ở cả 5 cách, Chrome hiện tại đều hỏi lại máy chủ khi cảnh `fetch`, không dùng thẳng như quy tắc "5 phút sau prefetch" cũ.
- Kết quả: mỗi request của cảnh là một 304 khoảng 245 byte, không có nội dung. Request đến khi file đang tải dở thì chờ lượt tải đó xong, không tải lần hai.
- Danh sách request ở mọi lượt đo: **mỗi file đi qua mạng đúng một lần**, lượt còn lại là 304.
  - Thường thì lượt tải sẵn nhận 200, cảnh nhận 304.
  - Ở 4 trên 8 lượt đo chốt (và cả 2 lượt giảm chuyển động), với 1–2 file cuối: file thứ 7, 8 phải xếp hàng chờ kết nối (HTTP/1.1 tối đa 6 kết nối), nên request của cảnh (ưu tiên cao) vượt lên. Khi đó cảnh nhận 200, lượt tải sẵn nhận 304; vẫn không có lượt tải trùng.
- Bỏ được cả 304 thì cần đổi header (đề nghị 3).

**Số đo thời gian từ lúc bấm tới lúc cảnh vẽ xong:**
- **Cách đo:**
  - bản production (`next start`, cổng 3102), Chrome không cửa sổ trên RTX 3050;
  - `Network.emulateNetworkConditions`: tải xuống 20 Mb/s, tải lên 10 Mb/s, độ trễ 40 ms;
  - mỗi lượt một hồ sơ trình duyệt mới (cache trống). Mở `/?year=-216&event=battle-of-cannae`, chờ mạng yên, bấm nút xem trận;
  - "vẽ xong" là lúc cảnh hiện nút chất lượng (`onReady`) cộng thêm hai khung hình.
- **Đo xen kẽ:** máy đang chạy cả việc của các lane khác (Blender), nên số dao động mạnh. Tôi đổi bản build sau từng lượt, xoay thứ tự mỗi vòng.

| | Trung vị | Khoảng | Số lượt |
|---|---|---|---|
| Trước (`main`) | **9,0 s** | 8,2–12,5 s | 8 |
| Sau | **6,9 s** | 6,1–9,3 s | 8 |

- Nhanh hơn khoảng 2,1 s (23%). Đợt đo trước đó (6 vòng) cho kết quả tương tự: 8,8 s và 6,6 s.
- **Dòng thời gian của một lượt (bản sau):**
  - khung xem trận mở lúc 2,1 s, như trước;
  - các file bắt đầu tải 0,18 s sau khi bấm; các file `.glb` (tổng 10,3 MB sau nén) về lúc 4,6–7,2 s;
  - bản trước chỉ bắt đầu tải sau 2,2 s.
- **Vì sao không nhanh hơn nữa:** 10,3 MB ở 20 Mb/s cần ít nhất 4,2 s, trong khi chuyến bay chỉ dài 2 s. Sau khi file về, cảnh còn mất 1–1,5 s dựng mô hình và biên dịch shader.
- **Giới hạn số file tải cùng lúc** (để kết nối rảnh cho cảnh): thử tối đa 2 và 3 file, trung vị 7,0 s và 7,6 s. Không hơn tải tất cả cùng lúc (6,6 s trong cùng đợt), nên giữ tải song song.
- **Mở lại lần hai:** 4,0 s cả trước lẫn sau (file đã nằm trong cache; 2 s bay cộng 2 s dựng cảnh).
- **Giảm chuyển động** (trận mở ngay, không bay): khung mở lúc 0,4–0,9 s; mỗi file vẫn chỉ tải một lần.

**Kiểm tra "Xong khi":**
- Trước khi bấm: 0 request tới địa hình, `index.json` hay `.glb`, ở mọi lượt. Trong 10 script trang chính tải trước khi bấm, không file nào chứa `WebGLRenderer`. Code tải sẵn nằm trong gói chính, chỉ dùng `fetch` và `<link>`.
- Console sạch (không lỗi, không cảnh báo) ở cả 16 lượt đo chốt, 2 lượt giảm chuyển động và các lần chụp `/battle-lab` trên dev server.

### 2. Dữ liệu Cannae

Chi tiết và lý do từng chỗ ở `docs/data/battles/cannae.md`, mục 10.

**Script mới:** `scripts/battles/check-facing.mjs` liệt kê các khối có lính đi lệch hướng mặt quá 45°.
- Lấy mẫu từng hình lính như cảnh di chuyển chúng, kể cả quay đầu.
- Tách đi ngang (45°–135°) và đi lùi (trên 135°).
- Số dòng từ 25% thời gian trở lên: 54 trước khi sửa, 46 sau khi sửa.

`check-overlap.mjs` giờ coi đổi hướng từ 135° trở lên là quay đầu tại chỗ, như cảnh. Trước đây nó xoay cả khối nên báo chồng sai. Danh sách chồng (`--min 0.05`) của dữ liệu mới giống hệt dữ liệu cũ.

**Đã sửa** (2 commit; commit thứ hai có thể bỏ riêng):
1. **Triarii, giai đoạn 6: quay về bắc**, đối mặt kỵ binh Hasdrubal đánh vào lưng (Polybius 3.116). Khối đứng nguyên chỗ, chỉ co bề ngang như trước.
2. **Lính nhẹ La Mã, giai đoạn 6: quay về bắc.** Họ kẹt giữa triarii và kỵ binh Hasdrubal, đang đánh nhưng lại quay lưng về phía kỵ binh.
3. **Lính nhẹ Carthage, giai đoạn 6: đứng yên** (trước ghi `stand` mà vẫn trôi lùi 40 m).
4. **Kỵ binh đồng minh, giai đoạn 4: bị cầm chân, không bị đẩy lùi** (Polybius 3.116). Đoạn lùi 106 m còn 14 m.
5. (commit `e4c00df`) **Lính nhẹ hai bên lui qua hàng quân mình thì quay lưng mà đi** (giai đoạn 3; Polybius 3.115), rồi quay lại khi đã ra sau bộ binh nặng (giai đoạn 4 với La Mã, giai đoạn 5 với Carthage). Trước đây họ đi giật lùi 200–600 m.

Xem lại trong cảnh (`/battle-lab`, dev server cổng 3102):
- triarii quay mặt về nam ở 12:30 (khiên hướng về camera ở phía nam) và về bắc ở 16:55;
- hướng từng hình lính đo bằng chính `UnitTrack` là 359–366° ở cuối giai đoạn 6.

#### 2.1. Lỗi của cảnh: quay đầu không tại chỗ

- **Hiện tượng:** trong một giai đoạn quay đầu, mỗi hình lính nội suy từ ô (u, v) của mốc đầu tới ô (−u, 1 − v) của mốc cuối, biểu diễn ngược. Mà ô ở mốc cuối được xếp theo thứ tự id như mọi mốc khác, nên người đứng ở ô (u, v) đi tới vị trí đối xứng qua tâm khối. Giữa giai đoạn, cả khối dồn lại gần tâm.
- **Đo bằng chính `UnitTrack`** (chạy `timeline.ts` trong Node bằng bộ nạp của `tutor:check`):
  - triarii giai đoạn 6: hàng người còn sống trải 783 m lúc đầu, **59 m giữa giai đoạn**, 441 m lúc cuối. Người ở mép đông (x = 373) sang mép tây (x = −244);
  - lực lượng ở trại lớn, giai đoạn 6 (dữ liệu từ trước): co từ 308 m còn 105 m rồi giãn ra, thứ tự trước sau đảo ngược. Kỵ binh La Mã (giai đoạn 3) và kỵ binh đồng minh (giai đoạn 5) cũng bị.
- **Thấy trong cảnh:** chụp `/battle-lab` lúc 14:45. Triarii co thành một cụm dày giữa dải màu; lính nhẹ co về tâm mỗi khối.
- **T-026 không thấy** vì chỉ đo khung của khối (`formationAt`), không đo vị trí từng người.
- **Cách sửa:** xem đề nghị 1. Đã thử bằng cách áp tạm vào worktree, rồi trả file về nguyên trạng, không commit:
  - triarii co dần 783 → 613 → 442 m, người ở mép đông vẫn ở mép đông;
  - lực lượng ở trại giữ bề ngang khoảng 300 m suốt giai đoạn;
  - ảnh lúc 14:45: dải triarii và lính nhẹ trải đều.

#### 2.2. Các khối còn đi xiên (để phiên chính xem phía cảnh)

Bảng đầy đủ ở `cannae.md`, mục 10. Tóm tắt:

| Giai đoạn | Khối | Vì sao dữ liệu không sửa |
|---|---|---|
| 1 | Cả quân Hannibal (đi ngang 77°, 70 m/s) | Phải dàn lại thế đứng ban đầu thành hàng dọc; ở tốc độ này chân vẫn trượt |
| 4–6 | Lưỡi liềm Gaul, Iberia (đi lùi) | Vừa đánh vừa lùi, mặt hướng về quân La Mã (Polybius 3.115). Đúng nguồn |
| 5–6 | Bộ binh La Mã (đi ngang 50–75°) | Vòng vây khép: khối co lại, dồn vào giữa, mặt vẫn hướng ra ngoài |
| 5 | Lính Libya (đi ngang khoảng nửa thời gian) | Quay 85° và tiến 100–140 m trong cùng giai đoạn; cảnh xoay đều cả giai đoạn |
| 6 | Principes, bộ binh đồng minh hàng sau (khoảng 60°) | Như trên: quay 90° ra sườn và đi tới đó cùng lúc |
| 6 | Kỵ binh Hasdrubal (80–100°, 37 m/s) | Đi về tây nam trong khi quay mặt từ đông nam sang nam để đánh vào lưng |

### Đề nghị ngoài phạm vi

1. **(Cần, gộp cùng dữ liệu) Lane 3 hoặc phiên chính, `src/components/battle/engine/timeline.ts`:** trong constructor của `UnitTrack`, ngay trước khối `// About-faces: …`, thêm:
   ```ts
   // After an about-face the men keep their places: the old rear rank is the
   // front and the files run the other way. Fill every keyframe after an odd
   // number of about-faces mirrored, so the end of an about-face, seen from
   // behind, lands where each man stood.
   let mirrored = false;
   for (let k = 1; k < this.keys.length; k++) {
     if (Math.abs(angleDelta(this.keys[k - 1].facing, this.keys[k].facing)) >= ABOUT_FACE) {
       mirrored = !mirrored;
     }
     if (!mirrored) continue;
     const slots = this.slots[k];
     for (let i = 0; i < n; i++) {
       slots[i * 2] = -slots[i * 2];
       slots[i * 2 + 1] = 1 - slots[i * 2 + 1];
     }
   }
   ```
   - Ô (u, v) và (−u, 1 − v) là cùng một đội hình, vì `bulge` đối xứng theo u; ô của người đã ngã (`NaN`) vẫn là `NaN`.
   - Vị trí người ngã tính sau đoạn này, nên vẫn khớp.
   - Sau khi quay, `rank` (`1 - v`) vẫn cho hàng cuối cũ thành hàng đầu.
   - Không gộp bản sửa này thì nên bỏ commit `e4c00df` (thêm 6 lần quay đầu cho lính nhẹ). Triarii và lính nhẹ La Mã ở giai đoạn 6 (commit `04677c2`) cũng sẽ co lại giữa giai đoạn.
2. **Phiên chính, `src/lib/battle.ts`:** thêm hai hàm dựng đường dẫn, ví dụ `terrainUrl(terrain)` và `modelUrl(model)`, cho cả cảnh (`terrain.ts`, `figures/loader.ts`) lẫn bản đồ dùng. Hiện `battlePrefetch.ts` phải chép lại đúng cách cảnh dựng URL (có ghi chú ở cả hai hàm); lệch một ký tự là tải sẵn vô ích.
3. **(Tuỳ chọn) Phiên chính, `next.config.ts`:** header `Cache-Control: public, max-age=300, stale-while-revalidate=86400` cho `/battles/models/:path*` và `/data/terrain/:path*`.
   - Được: cảnh dùng thẳng phản hồi đã tải sẵn, bỏ được 10 lượt 304. Mỗi lượt 50–100 ms nếu kết nối rảnh, chạy song song; khi file còn đang tải dở thì không thấy được.
   - Mất: tên file không có mã băm, nên khi lane 1 xuất lại mô hình, người dùng có thể thấy bản cũ vài phút. Lợi ích nhỏ, nên tôi không gấp.
4. **Lane 3 hoặc phiên chính, phía cảnh, cho các khối ở mục 2.2:**
   - (a) Khối đi lùi quá 135° so với hướng mặt: phát dáng đi ngược (tốc độ âm), cho lưỡi liềm vừa đánh vừa lùi.
   - (b) Đổi hướng lớn mà dưới 135°: từng người quay sớm trong giai đoạn như khi quay đầu, còn vị trí vẫn nội suy. Hợp với lính Libya, principes, bộ binh đồng minh hàng sau.
   - (c) Khối đi nhanh (dàn quân 70 m/s, kỵ binh 37 m/s): hướng của từng người theo hướng đi, rồi chuyển về hướng của đội hình khi khối chậm lại.
   - (d) Bước ngang chậm khi khối co lại: đứng (`idle`) hay dáng bước ngang, thay vì bước tới trong khi trượt ngang.
5. **Phiên chính, `docs/ARCHITECTURE.md`:**
   - mục "Mở trận qua bản đồ (T-025)": thêm "bản đồ tải sẵn địa hình, `index.json` và các file `.glb` của trận vào cache của trình duyệt khi có `battleRequest` (`src/components/map/battlePrefetch.ts`), mỗi trận một lần mỗi lần mở trang";
   - bảng store: cột "Ai đọc" của `battleRequest` thêm việc tải sẵn của bản đồ;
   - mục "Cảnh 3D", "Quay đầu": sau khi sửa (đề nghị 1) thì ghi rõ từng người giữ chỗ của mình.
6. Không đổi store, `src/data/index.ts`, `src/app/`. Không sửa file ngựa. `timeline.ts` chỉ được sửa tạm để thử rồi trả lại.
