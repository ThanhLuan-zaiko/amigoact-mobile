# Cổng chuyển tiếp

Cổng nằm giữa app di động và backend. Backend từ chối mọi HTTP không có `X-Internal-Key`, mà app di động là máy khách công khai nên không giữ được khoá. Cổng giữ khoá, gắn vào yêu cầu rồi chuyển tiếp. Cổng không có logic nghiệp vụ: không đọc, không sửa, không lưu nội dung, token hay người dùng.

```
app di động ──HTTPS──▶ cổng (giữ khoá) ──▶ backend (mạng nội bộ)
```

## Việc cổng làm

| Việc | Chi tiết |
| ---- | ---- |
| Gắn khoá | Mọi HTTP gửi tới backend đều có `X-Internal-Key`. Khoá do máy khách gửi lên bị bỏ |
| Danh sách cho phép | Chỉ chuyển các đường dẫn có đoạn đầu thuộc `FAMILIES` trong `src/allowlist.ts`. Đường dẫn khác trả `404 not_found`. `/docs`, `/openapi.json` luôn bị chặn |
| Chống lách đường dẫn | Từ chối `//`, `..`, `%2f`, `%2e`, `%5c`, `\`, NUL |
| Lọc header | Chỉ chuyển `accept`, `accept-language`, `authorization`, `content-type`, `if-modified-since`, `if-none-match`, `range`, `user-agent`. Không chuyển cookie. `Set-Cookie` của backend cũng bị bỏ |
| IP máy khách | Lấy từ kết nối và gửi cho backend bằng `X-Forwarded-For`, để giới hạn tốc độ của backend đúng theo người dùng thật |
| Giới hạn tốc độ | Theo IP, cửa sổ 1 phút. Đường dẫn tài khoản (`/auth/login`, `/auth/register`, mật khẩu, email) bị giới hạn chặt hơn. Quá giới hạn trả `429 rate_limited` kèm `Retry-After` |
| Giới hạn body | Quá `MAX_BODY_MB` trả `413 payload_too_large`. Body được truyền theo luồng, không nạp vào bộ nhớ |
| Hết thời gian | Chờ backend bắt đầu trả lời tối đa `UPSTREAM_TIMEOUT` giây, quá thì `504 upstream_timeout`. Tải xuống dài không bị cắt khi backend đã bắt đầu trả lời |
| Backend sập | `502 upstream_unavailable` |
| Socket | Chuyển tiếp `/ws` và `/ws/chat` |

Lỗi do cổng sinh ra có dạng `{"detail": "<mã>"}`, giống backend, để app dịch cùng một bảng. Mã lỗi của backend được chuyển nguyên trạng, cả mã HTTP.

## Socket

Backend không đòi khoá cho socket mà dùng vé dùng một lần từ `POST /realtime/tickets`. Cổng vẫn đứng trước để backend ở được mạng nội bộ.

- App gọi `POST /realtime/tickets` qua cổng, rồi mở `wss://<cổng>/ws?ticket=<vé>`.
- App di động không gửi `Origin`. Trình duyệt có gửi, và bị từ chối `403 origin_forbidden` trừ khi origin nằm trong `WS_ORIGINS`.
- Tối đa `MAX_SOCKETS_PER_IP` socket cho mỗi IP (`429 too_many_sockets`). Việc mở socket cũng tính vào giới hạn của đường dẫn tài khoản.
- Khung tối đa 64 KB. Khung gửi trước khi backend mở xong được xếp hàng (tối đa 16 khung).
- Vé sai: backend từ chối ngay lúc bắt tay nên không có mã đóng. Cổng báo cho app mã `4401`. Lưu ý: backend sập lúc mở socket cũng hiện thành `4401`, nên app nên lấy vé mới thử lại một lần, rồi mới coi là hết phiên.
- Mã đóng từ `4000` trở lên của backend (như `4408` hết 30 phút) được chuyển nguyên.

## Cấu hình

Đọc từ `.env` (hoặc biến môi trường của tiến trình khi triển khai). Giá trị sai làm cổng không khởi động. Xem `.env.example`.

| Biến | Mặc định | Ý nghĩa |
| ---- | ---- | ---- |
| `BACKEND_URL` | bắt buộc | Địa chỉ backend, không có đường dẫn |
| `INTERNAL_API_KEY` | bắt buộc | Ít nhất 32 ký tự, bằng giá trị trong `.env` của backend |
| `PORT` | 8200 | Cổng nghe |
| `RATE_LIMIT` | 300 | Số yêu cầu mỗi phút mỗi IP |
| `AUTH_RATE_LIMIT` | 20 | Như trên cho đường dẫn tài khoản và mở socket |
| `MAX_BODY_MB` | 52 | Backend nhận video tới 50 MB |
| `UPSTREAM_TIMEOUT` | 30 | Giây chờ backend |
| `MAX_SOCKETS_PER_IP` | 5 | Socket mở cùng lúc |
| `TRUST_PROXY` | false | Chỉ đặt `true` khi có đúng một reverse proxy tin cậy phía trước, đặt `X-Forwarded-For` |
| `WS_ORIGINS` | trống | Origin trình duyệt được mở socket. Không dùng `*` |

## Triển khai

- Đặt cổng sau HTTPS (reverse proxy hoặc nền tảng). Chính cổng không tự làm TLS. Khi đó đặt `TRUST_PROXY=true`.
- Cho backend chỉ nghe ở mạng nội bộ, để chỉ cổng và frontend tới được nó.
- Chạy một tiến trình, vì bộ đếm giới hạn nằm trong bộ nhớ. Nếu cần nhiều bản, đặt giới hạn tốc độ ở lớp phía trước.
- Đổi khoá: sửa `.env` của backend, frontend và cổng rồi khởi động lại cả ba.
- Thêm nhóm đường dẫn mới ở backend thì thêm đoạn đầu vào `FAMILIES` và viết test.

## Kiểm thử

`bun test` chạy một backend giả và cổng thật trên `127.0.0.1`: kiểm tra gắn khoá, chặn đường dẫn lạ, lọc header, giới hạn, hết thời gian, và chuyển tiếp socket. Chưa kiểm thử với backend thật.
