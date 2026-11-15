# Liên kết sâu (deep link)

Liên kết sâu mở thẳng một màn hình trong app từ bên ngoài, ví dụ liên kết trong email hay mã QR điểm danh. Mọi màn hình đều có địa chỉ giống web (Expo Router theo tên file), nên `amigoact://<đường dẫn web>` mở đúng màn hình đó.

## Đang chạy được

Scheme riêng của app là `amigoact` (khai báo trong `app.json`). Ba liên kết mang token:

| Liên kết | Màn hình | Token gửi tới |
| ---- | ---- | ---- |
| `amigoact://reset-password?token=<token>` | `src/app/reset-password.tsx` | `POST /auth/password/reset` |
| `amigoact://verify-email?token=<token>` | `src/app/verify-email.tsx` | `POST /auth/email/verify` |
| `amigoact://checkin?token=<token>` | `src/app/checkin.tsx` (cần đăng nhập) | `POST /attendance/check-in` |

- Mọi màn hình mở được khi chưa đăng nhập, giống web. Màn hình cần tài khoản tự chuyển sang `/login?next=<đường dẫn>` (`RequireUser`), đăng nhập xong quay lại, kể cả token điểm danh.
- Địa chỉ chủ sở hữu của web `/organizations/<slug>/...` được chuyển sang `/org/<slug>/...` (`src/app/organizations/[slug]/`), vì app chỉ có một địa chỉ cho mỗi tổ chức. Địa chỉ không có trong app mở màn hình "Không tìm thấy trang" (`+not-found.tsx`).
- Token chỉ đọc bằng `tokenFromParam` (`src/lib/deepLink.ts`): thiếu, rỗng hoặc dài quá 512 ký tự thì hiện "Liên kết không hợp lệ hoặc đã hết hạn". Backend mới là nơi quyết định token có đúng không. Màn hình cần một lần bấm để dùng token, nên mở liên kết không tự thay đổi dữ liệu.
- Token không được hiển thị, ghi log hay gửi đi đâu ngoài endpoint trong bảng.
- Máy quét QR trong app (`QrScanner`) chỉ nhận địa chỉ `/checkin?token=` (web hoặc scheme), xem `tokenFromScan` trong `src/lib/checkInLink.ts`. Mã QR app hiện ra dùng `EXPO_PUBLIC_APP_URL` (địa chỉ web) nếu có, để camera thường mở được; không có thì dùng `amigoact://checkin`.
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
   - `/.well-known/apple-app-site-association` cho iOS, chứa Team ID và bundle id, với các đường dẫn `/reset-password`, `/verify-email` và `/checkin`.
4. **Build app với `APP_LINK_HOST`**, ví dụ `APP_LINK_HOST=amigoact.example.com`. `app.config.ts` khi đó thêm `associatedDomains` cho iOS và `intentFilters` có `autoVerify` cho Android, giới hạn ở ba đường dẫn `/reset-password`, `/verify-email` và `/checkin` (`LINK_PATHS`). Khi chưa đặt biến này, app chỉ có scheme riêng. Giá trị phải là tên miền trần, không có `https://` hay đường dẫn, nếu không build dừng với lỗi.

Kiểm tra cấu hình sinh ra: `APP_LINK_HOST=amigoact.example.com bunx expo config --type public`.

Cách này chưa thử được trên máy thật vì chưa có tên miền, mã định danh và hai tệp trên. Phần cấu hình đã được kiểm tra bằng `expo config`.

### Cách 2: nút "Mở trong ứng dụng" trên trang web

Trang `/reset-password` của web có thêm nút trỏ tới `amigoact://reset-password?token=...`, chỉ hiện khi mở trên điện thoại. Không cần tên miền hay khoá ký, nhưng sửa web, và trình duyệt trong app email có thể chặn scheme lạ. Là phương án tạm.

Hai cách không loại trừ nhau.

## Bảo mật

- Token đặt lại mật khẩu dùng một lần và hết hạn, nhưng đi trong địa chỉ, nên mọi chỗ nhận liên kết đều thấy nó. Vì vậy app không ghi nó vào log và không đưa vào báo lỗi.
- Một ứng dụng khác trên máy có thể đăng ký cùng scheme `amigoact` và đọc liên kết. Đó là lý do nên dùng cách 1 (đã xác minh bằng tên miền) cho bản chính thức.
- Màn hình chỉ làm đúng một việc với token: gửi nó kèm mật khẩu mới. Không có liên kết sâu nào làm thay đổi dữ liệu mà không có người xác nhận trên màn hình.
