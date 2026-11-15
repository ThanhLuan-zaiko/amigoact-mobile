# Kiến trúc ứng dụng di động

Ứng dụng di động là bản chuyển thể của web (`../amigoact-fe`). Web là nguồn của sự thật về hành vi, màn hình, chữ hiển thị, quyền và giao diện. Backend (`../amigoact-be`) là nơi giữ quy tắc nghiệp vụ.

## Công nghệ

| Phần | Lựa chọn | Tương ứng trên web |
| ---- | ---- | ---- |
| Nền tảng | Expo SDK 58, React Native 0.88, React 19 | Next.js 16, React 19 |
| Điều hướng | Expo Router (file trong `src/app/`) | App Router |
| Kiểu dáng | Uniwind (Tailwind 4), chỉ dùng `className` | Tailwind 4 |
| Icon | `Feather` của `@expo/vector-icons` | `react-icons/fi` (cùng bộ Feather) |
| Font | Be Vietnam Pro (`@expo-google-fonts`) | Be Vietnam Pro |
| Lưu token | `expo-secure-store` | cookie httpOnly |
| Lint và format | Biome 2.4.2 | Biome 2.4.2 |
| Gói | Bun | Bun |

## Vấn đề cần quyết định: cách gọi backend

Backend từ chối mọi yêu cầu HTTP không có header `X-Internal-Key`. Trên web, khoá này chỉ nằm trên máy chủ Next.js, trình duyệt không bao giờ thấy nó. Ứng dụng di động là máy khách công khai: mọi thứ đóng gói vào app (kể cả biến `EXPO_PUBLIC_*`) đều có thể bị trích ra. Vì vậy **không được nhúng `INTERNAL_API_KEY` vào app**.

Ba hướng, cần chọn một:

| Hướng | Mô tả | Ưu | Nhược |
| ---- | ---- | ---- | ---- |
| A. Dùng Next.js làm BFF | Thêm Route Handler HTTP trong `amigoact-fe` cho app, gắn khoá rồi chuyển tiếp | Không đổi backend | Phải viết lại từng Server Action thành HTTP route, thêm một chặng, hai nơi cùng bảo trì |
| B. Cổng chuyển tiếp mỏng | Một proxy nhỏ trước backend: chỉ cho đường dẫn trong danh sách cho phép, gắn khoá, giới hạn tốc độ | Không đổi code backend và frontend, app gọi API gần như trực tiếp | Thêm một thành phần phải vận hành. Khoá vẫn chỉ nằm ở proxy |
| C. Backend nhận kênh di động | Thêm cách xác thực riêng cho app (ví dụ chứng thực thiết bị bằng Play Integrity và App Attest) thay cho khoá chung | Đúng bản chất máy khách công khai | Đổi backend, nhiều việc nhất, cần tài khoản cửa hàng ứng dụng |

Khuyến nghị: **B** để bắt đầu, vì app có thể dùng chính API backend và web không phải đổi. Bảo vệ thật sự vẫn là JWT và kiểm tra quyền ở backend, khoá nội bộ chỉ ngăn truy cập tuỳ tiện.

### Quyết định: hướng B (cổng chuyển tiếp mỏng)

Đã chọn hướng B và đã xây cổng ở repo `../amigoact-gateway` (xem `docs/gateway.md` ở đó). App gọi địa chỉ cổng (`EXPO_PUBLIC_API_URL`, chỉ là địa chỉ, không phải bí mật) thay vì gọi backend trực tiếp. Cổng làm các việc sau:

- Gắn `X-Internal-Key` vào mọi yêu cầu tới backend. Khoá chỉ nằm trong cấu hình của cổng, không bao giờ nằm trong app.
- Chỉ chuyển tiếp các đường dẫn nằm trong danh sách cho phép. Mặc định chặn tất cả, và không chuyển tiếp các đường dẫn quản trị hay nội bộ.
- Giới hạn tốc độ theo IP của máy khách, và chuyển `X-Forwarded-For` đúng cách để backend vẫn giới hạn đúng (xem `--forwarded-allow-ips` ở backend).
- Chuyển tiếp cả socket `/ws`. App di động không gửi `Origin` nên qua được kiểm tra của backend. Cổng từ chối socket của trình duyệt trừ khi origin nằm trong `WS_ORIGINS`. Để backend giới hạn tốc độ đúng IP máy khách, chạy uvicorn với `--forwarded-allow-ips` là địa chỉ của cổng.
- Không ghi nội dung yêu cầu, token hay mật khẩu vào log.
- Phải dùng HTTPS ở môi trường thật.

Khi viết code gọi API, dùng các hàm trong `src/lib/*Api.ts` và địa chỉ từ `EXPO_PUBLIC_API_URL`. Lỗi do cổng sinh ra (`not_found`, `rate_limited`, `payload_too_large`, `upstream_unavailable`, `upstream_timeout`, `too_many_sockets`, `origin_forbidden`) cũng có dạng `{"detail": "<mã>"}`, nên phải có trong bảng dịch lỗi của app. Cổng mới được kiểm thử với backend giả, chưa thử với backend thật.
