# Đối chiếu với web

Web (`../amigoact-fe`) là nguồn của sự thật. Bảng này liệt kê từng màn hình của web và trạng thái bên di động. Cập nhật bảng khi làm xong một màn hình hoặc khi web thêm màn hình mới.

Trạng thái: `chưa` là chưa làm, `xong` là đã chuyển đủ hành vi và chữ hiển thị. Đã chuyển: đăng nhập, đăng ký, quên mật khẩu.

## Khác biệt bắt buộc do nền tảng

| Chủ đề | Web | Di động |
| ---- | ---- | ---- |
| Lưu phiên | cookie httpOnly | `expo-secure-store` |
| Gọi backend | Server Action trên máy chủ Next.js | qua cổng chuyển tiếp mỏng, xem `docs/architecture.md` (cổng ở `gateway/`) |
| Địa chỉ trang | URL, owner xem `/organizations/<slug>`, người khác xem `/org/<slug>` | Expo Router, cùng cấu trúc đường dẫn |
| Mã QR điểm danh | hiển thị mã QR do máy chủ vẽ | thêm quét bằng camera (`expo-camera`) |
| Thông báo | trong app | thêm push (Expo Notifications) khi cần |
| Icon | `react-icons` (`fi`, cộng `BsQrCode`, `TbPin`, `TbPinnedOff`) | `Feather` của `@expo/vector-icons`; riêng QR và ghim dùng `MaterialCommunityIcons` (`qrcode`, `pin`, `pin-off`) |
| Bố cục | một cột trên điện thoại, nhiều cột từ `xl` | một cột, `md:` chỉ căn giữa nội dung |

## Màn hình

### Tài khoản

| Web | Trạng thái |
| ---- | ---- |
| `/login` | xong |
| `/register` | xong |
| `/forgot-password` | xong |
| `/reset-password` | chưa (liên kết trong email mở trang web; cần liên kết sâu vào app mới mở được ở đây) |
| `/verify-email` | chưa |
| `/account` | chưa |
| `/account/security` | chưa |
| `/account/notifications` | chưa |

### Khám phá và bảng tin

| Web | Trạng thái |
| ---- | ---- |
| `/explore` | chưa |
| `/compose` | chưa |
| `/drafts` | chưa |
| `/trash` | chưa |
| `/notifications` | chưa |
| `/messages` | chưa |

### Hoạt động và điểm danh

| Web | Trạng thái |
| ---- | ---- |
| `/activities` | chưa |
| `/activities/[id]` | chưa |
| `/activities/[id]/edit` | chưa |
| `/activities/[id]/registrations` | chưa |
| `/activities/[id]/attendance` | chưa |
| `/activities/[id]/attendance/[sessionId]` | chưa |
| `/activities/[id]/hours` | chưa |
| `/activities/[id]/appeals` | chưa |
| `/checkin` | chưa |
| `/hours` | chưa |

### Chứng nhận

| Web | Trạng thái |
| ---- | ---- |
| `/certificates` | chưa |
| `/certificates/verify` | chưa |
| `/certificates/verify/[serial]` | chưa |

### Tổ chức

| Web | Trạng thái |
| ---- | ---- |
| `/organizations` | chưa |
| `/organizations/new` | chưa |
| `/org/[slug]` | chưa |
| `/org/[slug]/activities` | chưa |
| `/org/[slug]/activities/new` | chưa |
| `/org/[slug]/activities/drafts` | chưa |
| `/org/[slug]/activities/trash` | chưa |
| `/org/[slug]/applications` | chưa |
| `/org/[slug]/members` | chưa |
| `/org/[slug]/roles` | chưa |
| `/org/[slug]/settings` | chưa |
| `/org/[slug]/hours` | chưa |
| `/org/[slug]/certificates` | chưa |
| `/org/[slug]/certificates/new` | chưa |
| `/org/[slug]/certificates/[templateId]` | chưa |
| `/org/[slug]/posts` | chưa |
| `/org/[slug]/posts/new` | chưa |
| `/org/[slug]/posts/drafts` | chưa |
| `/org/[slug]/posts/trash` | chưa |
| `/org/[slug]/posts/[postId]` | chưa |
| `/org/[slug]/posts/[postId]/edit` | chưa |
