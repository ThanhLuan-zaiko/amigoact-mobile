# Đối chiếu với web

Web (`../amigoact-fe`) là nguồn của sự thật. Bảng này liệt kê từng màn hình của web và màn hình tương ứng bên di động. Cập nhật bảng khi web thêm hoặc đổi màn hình, và chuyển thay đổi đó sang app trong cùng đợt.

Trạng thái: `xong` là đã chuyển đủ luồng, trường, kiểm tra, trạng thái rỗng và chữ hiển thị; `chưa` là chưa làm. Hiện **cả 49 màn hình của web đều đã có bản di động**. "Đã chạy" nghĩa là đã qua typecheck, lint, test và build bundle (`expo export`); chưa thử từng màn hình trên máy thật với backend thật.

## Cách chuyển

- Logic thuần trong `../amigoact-fe/src/lib/` được chép nguyên (cùng tên, cùng test) sang `src/lib/`: kiểm tra dữ liệu, định dạng, quyền, realtime, chat, giờ, chứng nhận, bài viết, phân trang.
- Mỗi Server Action của web có hàm cùng tên trong `src/lib/*Api.ts` hoặc `src/lib/*Actions.ts`, trả về cùng dạng `FormState`. Chỗ web gọi `redirect()` thì hàm trả `next`, màn hình mở địa chỉ đó (`follow`). Chỗ web gọi `revalidatePath` thì hàm gọi `invalidate()` (`src/lib/refreshBus.ts`), mọi màn hình đang mở tải lại dữ liệu.
- Bộ lọc, trang, thẻ và phòng chat nằm trong tham số địa chỉ (`router.setParams`), giống web giữ chúng trong URL, nên liên kết sâu mở đúng trạng thái.
- Lớp Tailwind trong `src/components/ui.ts` lấy từ `ui.ts` của web, chỉ thêm lớp chữ riêng vì React Native không kế thừa kiểu chữ.

## Khác biệt bắt buộc do nền tảng

| Chủ đề | Web | Di động |
| ---- | ---- | ---- |
| Lưu phiên | cookie httpOnly | `expo-secure-store` |
| Gọi backend | Server Action trên máy chủ Next.js | qua cổng chuyển tiếp mỏng (`gateway/`), xem `docs/architecture.md` |
| Địa chỉ tổ chức | chủ sở hữu xem `/organizations/<slug>`, người khác `/org/<slug>` | một địa chỉ `/org/<slug>` cho mọi người; liên kết `/organizations/<slug>/...` được chuyển hướng. Điện thoại không có thanh địa chỉ nên không cần hai dạng |
| Thanh bên (SideNav) và tổ chức đã tham gia | cột trái từ `md` | trên điện thoại web cũng ẩn cột này. App đưa nội dung của nó vào menu tài khoản (nút hình người trên header) để vẫn tới được Giờ, Chứng nhận, Tổ chức của tôi |
| Cột phải trang chủ (RightRail) | hiện từ `lg` | hiện khi màn hình rộng từ 1024 điểm (máy tính bảng ngang), giống web; điện thoại không hiện |
| Bố cục nhiều cột từ `xl` | hai, ba cột | một cột theo thứ tự của web trên điện thoại; `md:` chỉ căn giữa nội dung |
| Menu thả xuống, hộp thoại | `details`, `dialog` | `Sheet` trượt từ dưới lên và `Modal`, phân tách bằng viền, không bóng |
| Ô chọn ngày giờ | `input type="date"` / `datetime-local` | bộ chọn ngày giờ gốc của hệ điều hành; giá trị vẫn là chuỗi giờ trên đồng hồ như web (`toLocalInput`, `fromLocalInput`), đọc theo múi giờ của máy. `ZoneNote` ghi múi giờ đó như web, nhưng không cần ô ẩn `time_zone` vì app tự gửi |
| Múi giờ người xem | cookie `tz` do trình duyệt ghi, máy chủ đọc bằng `viewerTimeZone()` (mặc định `Asia/Ho_Chi_Minh`) | múi giờ của máy qua `Intl`; gọi các hàm định dạng không truyền `timeZone`. Không có máy chủ vẽ trang nên không cần cookie |
| Chọn tệp | `input type="file"`, kéo thả, dán ảnh | thư viện ảnh (`expo-image-picker`); không có kéo thả hay dán |
| Tiến độ tải lên trong chat | phần trăm qua XHR | vòng xoay, vì `fetch` của React Native không báo tiến độ |
| Video | hls.js hoặc HLS của trình duyệt, MP4 dự phòng | `expo-video` phát HLS và MP4 trực tiếp |
| Biểu đồ giờ | canvas | `react-native-svg`, cùng hình học `chartGeometry.ts`; chạm vào cột để xem số |
| Mã QR điểm danh | máy chủ vẽ SVG | app vẽ bằng `qrcode` và `react-native-svg`, cùng địa chỉ `/checkin?token=` (`EXPO_PUBLIC_APP_URL`) |
| Điểm danh | camera điện thoại mở trang web | thêm máy quét QR trong app (`expo-camera`), vẫn cần một lần bấm "Điểm danh" như web; nhập mã tay giữ nguyên |
| In chứng nhận | `window.print()` và tải PDF | mở PDF trong trình xem của máy (in, chia sẻ từ đó); không có nút In riêng |
| Tải tệp chat | thẻ `a download` | mở tệp trong trình duyệt của máy |
| Phân trang bài viết (con trỏ) | "Xem bài cũ hơn" mở trang mới | "Xem bài cũ hơn" nối bài cũ vào cuối danh sách |
| Kéo để làm mới | tải lại trang | kéo xuống ở mỗi màn hình |
| Giao diện sáng/tối | nút trên header, lưu `localStorage` | nút trên header, lưu trong `expo-secure-store`; chưa chọn thì theo hệ thống |
| Thông báo đẩy | không có | chưa có (Expo Notifications khi cần) |
| Icon | `react-icons` (`fi`, cộng `BsQrCode`, `TbPin`, `TbPinnedOff`) | `Feather` của `@expo/vector-icons`; riêng QR và ghim dùng `MaterialCommunityIcons` (`qrcode`, `pin`, `pin-off`) |
| Hình dạng ảnh theo kích thước gốc | `width`/`height` của `img` | lớp `aspect-[...]` gần nhất trong `src/lib/aspectClasses.ts`, vì không được dùng `style` |

## Màn hình

### Tài khoản

| Web | Di động | Trạng thái |
| ---- | ---- | ---- |
| `/login` | `src/app/login.tsx` | xong, có `?next=` |
| `/register` | `src/app/register.tsx` | xong |
| `/forgot-password` | `src/app/forgot-password.tsx` | xong |
| `/reset-password` | `src/app/reset-password.tsx` | xong, `amigoact://reset-password?token=...` |
| `/verify-email` | `src/app/verify-email.tsx` | xong, `amigoact://verify-email?token=...` |
| `/account` | `src/app/account/index.tsx` | xong |
| `/account/security` | `src/app/account/security.tsx` | xong |
| `/account/notifications` | `src/app/account/notifications.tsx` | xong |

### Bảng tin, khám phá, thông báo, tin nhắn

| Web | Di động | Trạng thái |
| ---- | ---- | ---- |
| `/` (Tất cả chỉ có bài, hoạt động nằm trong bài; Tổ chức, thẻ, Tổ chức của tôi; `?tab=activities` là danh sách hoạt động) | `src/app/index.tsx`, `ActivityDirectory` | xong. Web chỉ có một ô tìm trên header ("Tìm hoạt động, thành phố"); ở độ rộng điện thoại web hiện ô đó trong danh sách hoạt động, nên app cũng hiện `SearchField` ở đó như tab "Tổ chức". |
| `/explore` (chuyển hướng sang `/?tab=activities`) | `src/app/explore.tsx` | xong, chuyển hướng như web, giữ `q`, `page` cho link `amigoact://explore` cũ; `city` đứng một mình được đọc như từ khóa tìm |
| `/compose` | `src/app/compose.tsx` | xong (chuyển hướng như web) |
| `/drafts` | `src/app/drafts.tsx` | xong |
| `/trash` | `src/app/trash.tsx` | xong |
| `/notifications` (và chuông trên header) | `src/app/notifications.tsx`, `NotificationBell` | xong, realtime |
| `/messages` | `src/app/messages.tsx` | xong: phòng chung, kênh, nhắn riêng, trả lời, cảm xúc, sửa, xóa, ghim, ảnh và video, đang nhập, realtime và hỏi lại mỗi 10 giây khi mất kết nối |

### Hoạt động và điểm danh

| Web | Di động | Trạng thái |
| ---- | ---- | ---- |
| `/activities` | `src/app/activities/index.tsx` | xong |
| `/activities/[id]` | `src/app/activities/[id]/index.tsx` | xong |
| `/activities/[id]/edit` | `src/app/activities/[id]/edit.tsx` | xong, gồm ca |
| `/activities/[id]/registrations` | `src/app/activities/[id]/registrations.tsx` | xong |
| `/activities/[id]/attendance` | `src/app/activities/[id]/attendance/index.tsx` | xong |
| `/activities/[id]/attendance/[sessionId]` | `src/app/activities/[id]/attendance/[sessionId].tsx` | xong |
| `/activities/[id]/hours` | `src/app/activities/[id]/hours.tsx` | xong |
| `/activities/[id]/appeals` | `src/app/activities/[id]/appeals.tsx` | xong |
| `/checkin` | `src/app/checkin.tsx` | xong, thêm máy quét QR |
| `/hours` | `src/app/hours.tsx` | xong |

### Chứng nhận

| Web | Di động | Trạng thái |
| ---- | ---- | ---- |
| `/certificates` | `src/app/certificates/index.tsx` | xong |
| `/certificates/verify` | `src/app/certificates/verify/index.tsx` | xong |
| `/certificates/verify/[serial]` | `src/app/certificates/verify/[serial].tsx` | xong |

### Tổ chức

| Web | Di động | Trạng thái |
| ---- | ---- | ---- |
| `/organizations` | `src/app/organizations/index.tsx` | xong |
| `/organizations/new` | `src/app/organizations/new.tsx` | xong |
| `/org/[slug]` | `src/app/org/[slug]/index.tsx` | xong |
| `/org/[slug]/activities` | `src/app/org/[slug]/activities/index.tsx` | xong |
| `/org/[slug]/activities/new` | `src/app/org/[slug]/activities/new.tsx` | xong |
| `/org/[slug]/activities/drafts` | `src/app/org/[slug]/activities/drafts.tsx` | xong |
| `/org/[slug]/activities/trash` | `src/app/org/[slug]/activities/trash.tsx` | xong |
| `/org/[slug]/applications` | `src/app/org/[slug]/applications.tsx` | xong |
| `/org/[slug]/members` | `src/app/org/[slug]/members.tsx` | xong |
| `/org/[slug]/roles` | `src/app/org/[slug]/roles.tsx` | xong |
| `/org/[slug]/settings` | `src/app/org/[slug]/settings.tsx` | xong, gồm bộ sưu tập, quy tắc giờ, thùng rác |
| `/org/[slug]/hours` | `src/app/org/[slug]/hours.tsx` | xong |
| `/org/[slug]/certificates` | `src/app/org/[slug]/certificates/index.tsx` | xong |
| `/org/[slug]/certificates/new` | `src/app/org/[slug]/certificates/new.tsx` | xong |
| `/org/[slug]/certificates/[templateId]` | `src/app/org/[slug]/certificates/[templateId].tsx` | xong |
| `/org/[slug]/posts` | `src/app/org/[slug]/posts/index.tsx` | xong |
| `/org/[slug]/posts/new` | `src/app/org/[slug]/posts/new.tsx` | xong |
| `/org/[slug]/posts/drafts` | `src/app/org/[slug]/posts/drafts.tsx` | xong |
| `/org/[slug]/posts/trash` | `src/app/org/[slug]/posts/trash.tsx` | xong |
| `/org/[slug]/posts/[postId]` | `src/app/org/[slug]/posts/[postId]/index.tsx`, `PostSidePanel` | xong: tab Hoạt động, Bình luận, Bài viết khác dưới bài (`?tab=`). Bình luận kiểu mạng xã hội như web (ảnh đại diện, tim, trả lời một cấp, thời gian tương đối theo múi giờ của máy); ô nhập nằm cuối danh sách thay vì dính đáy, vì màn hình là một ScrollView và bàn phím đẩy ô lên. Hàng ngắn của tổ chức nằm trên vùng cuộn (`Page` `top`), tương đương sticky trên web |
| `/org/[slug]/posts/[postId]/edit` | `src/app/org/[slug]/posts/[postId]/edit.tsx` | xong |

Trang lỗi của web (`not-found.tsx`) có bản `src/app/+not-found.tsx`; trang không tìm thấy tổ chức và hoạt động nằm trong `OrgScreen` và `ActivityScreen`.
