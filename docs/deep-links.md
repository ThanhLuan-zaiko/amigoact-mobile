# Liên kết sâu (deep link)

Liên kết sâu mở thẳng một màn hình trong app từ bên ngoài, ví dụ liên kết đặt lại mật khẩu trong email. Hiện có một màn hình dùng nó: `/reset-password`.

## Đang chạy được

Scheme riêng của app là `amigoact` (khai báo trong `app.json`). Expo Router tự đưa liên kết tới đúng file trong `src/app/`:

| Liên kết | Màn hình |
| ---- | ---- |
| `amigoact://reset-password?token=<token>` | `src/app/reset-password.tsx` |

- Màn hình này nằm ngoài hai nhóm `signedIn` và `signedOut` trong `src/app/_layout.tsx`, nên mở được cả khi đã đăng nhập, giống trang web.
- Token chỉ đọc bằng `tokenFromParam` (`src/lib/deepLink.ts`): thiếu, rỗng hoặc dài quá 512 ký tự thì hiện "Liên kết không hợp lệ hoặc đã hết hạn" và nút "Gửi lại liên kết". Backend mới là nơi quyết định token có đúng không.
- Token không được hiển thị, ghi log hay gửi đi đâu ngoài `POST /auth/password/reset`.
- Đặt lại xong, backend kết thúc mọi phiên đăng nhập, kể cả của máy này. Nếu máy đang đăng nhập, app xoá token đã lưu ngay (`signOut`) thay vì chờ lỗi 401.
- Thử trên Android: `adb shell am start -a android.intent.action.VIEW -d "amigoact://reset-password?token=abc"`. Với Expo Go dùng scheme `exp://`, xem `bunx uri-scheme`.

## Cái chưa có: liên kết trong email

Email do backend gửi chứa địa chỉ web: `{FRONTEND_URL}/reset-password?token=...` (`amigoact-be/src/auth/recovery.py`). Địa chỉ web đó **không** mở app. Có hai cách để email mở được app:

### Cách 1: liên kết địa chỉ web (universal link, app link). Nên dùng.

Cùng một liên kết `https` mở app nếu app đã cài và được xác minh, nếu không thì mở trang web. Cần:

1. **Tên miền thật** của web cho `FRONTEND_URL` (HTTPS, không dùng `localhost`).
2. **Mã định danh app**, hiện chưa đặt trong `app.json`: `ios.bundleIdentifier` và `android.package`. Đây là danh tính cố định trên cửa hàng ứng dụng, nên cần chủ dự án quyết định.
3. **Web phục vụ hai tệp** ở tên miền đó (việc của `amigoact-fe`, chưa làm):
   - `/.well-known/assetlinks.json` cho Android, chứa tên gói và dấu vân tay SHA-256 của khoá ký app.
   - `/.well-known/apple-app-site-association` cho iOS, chứa Team ID và bundle id, với đường dẫn `/reset-password`.
4. **Build app với `APP_LINK_HOST`**, ví dụ `APP_LINK_HOST=amigoact.example.com`. `app.config.ts` khi đó thêm `associatedDomains` cho iOS và `intentFilters` có `autoVerify` cho Android, giới hạn ở đường dẫn `/reset-password`. Khi chưa đặt biến này, app chỉ có scheme riêng. Giá trị phải là tên miền trần, không có `https://` hay đường dẫn, nếu không build dừng với lỗi.

Kiểm tra cấu hình sinh ra: `APP_LINK_HOST=amigoact.example.com bunx expo config --type public`.

Cách này chưa thử được trên máy thật vì chưa có tên miền, mã định danh và hai tệp trên. Phần cấu hình đã được kiểm tra bằng `expo config`.

### Cách 2: nút "Mở trong ứng dụng" trên trang web

Trang `/reset-password` của web có thêm nút trỏ tới `amigoact://reset-password?token=...`, chỉ hiện khi mở trên điện thoại. Không cần tên miền hay khoá ký, nhưng sửa web, và trình duyệt trong app email có thể chặn scheme lạ. Là phương án tạm.

Hai cách không loại trừ nhau.

## Bảo mật

- Token đặt lại mật khẩu dùng một lần và hết hạn, nhưng đi trong địa chỉ, nên mọi chỗ nhận liên kết đều thấy nó. Vì vậy app không ghi nó vào log và không đưa vào báo lỗi.
- Một ứng dụng khác trên máy có thể đăng ký cùng scheme `amigoact` và đọc liên kết. Đó là lý do nên dùng cách 1 (đã xác minh bằng tên miền) cho bản chính thức.
- Màn hình chỉ làm đúng một việc với token: gửi nó kèm mật khẩu mới. Không có liên kết sâu nào làm thay đổi dữ liệu mà không có người xác nhận trên màn hình.
