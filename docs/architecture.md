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

Đã chọn hướng B. App gọi một địa chỉ cổng (`EXPO_PUBLIC_API_URL`, chỉ là địa chỉ, không phải bí mật) thay vì gọi backend trực tiếp. Cổng là dịch vụ riêng, chưa được xây dựng và chưa có repo. Yêu cầu tối thiểu:

- Gắn `X-Internal-Key` vào mọi yêu cầu tới backend. Khoá chỉ nằm trong cấu hình của cổng, không bao giờ nằm trong app.
- Chỉ chuyển tiếp các đường dẫn nằm trong danh sách cho phép. Mặc định chặn tất cả, và không chuyển tiếp các đường dẫn quản trị hay nội bộ.
- Giới hạn tốc độ theo IP của máy khách, và chuyển `X-Forwarded-For` đúng cách để backend vẫn giới hạn đúng (xem `--forwarded-allow-ips` ở backend).
- Chuyển tiếp cả socket `/ws`, vì backend miễn kiểm tra khoá cho socket nhưng kiểm tra `CORS_ORIGINS`. Kiểm tra lại phần Origin của app di động khi làm.
- Không ghi nội dung yêu cầu, token hay mật khẩu vào log.
- Phải dùng HTTPS ở môi trường thật.

Trong lúc cổng chưa có, mọi màn hình dựng trên dữ liệu mẫu có kiểu rõ ràng, đặt sau các hàm lấy dữ liệu (`src/lib/*Api.ts`), để khi có cổng chỉ thay một chỗ.

## Phiên đăng nhập

- Access token (JWT ngắn hạn) và refresh token chỉ lưu trong `expo-secure-store`.
- Refresh token xoay vòng sau mỗi lần dùng, dùng lại token cũ sau thời gian ân hạn sẽ kết thúc phiên. Nên chỉ cho một lần làm mới tại một thời điểm và lưu token mới trước khi gọi lại yêu cầu.
- Mã lỗi API là chuỗi cố định trong `detail`. App dịch sang tiếng Việt bằng cùng bảng với web.

## Thời gian thực

Một socket duy nhất ở gốc app. Lấy vé dùng một lần rồi nối `/ws`, giống web. Nối lại khi app quay về foreground, đóng khi vào nền. Tham khảo `../amigoact-fe/docs/realtime.md` và `../amigoact-be/docs/realtime.md`.

## Cấu trúc thư mục

```
src/
  app/          màn hình (Expo Router), đường dẫn giống web
  components/   thành phần giao diện dùng chung
  hooks/        hook dùng chung
  lib/          logic thuần chuyển từ web (kèm test), theme, gọi API
  global.css    chỉ có hai dòng import
```
