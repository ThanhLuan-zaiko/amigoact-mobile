# AmigoACT - Mobile

Ứng dụng di động của AmigoACT, nền tảng kết nối tổ chức và tình nguyện viên. App là bản chuyển thể native của web [`amigoact-fe`](https://github.com/ThanhLuan-zaiko/amigoact-fe): cùng màn hình, cùng luồng, cùng chữ tiếng Việt, cùng quyền và cùng giao diện (teal, phẳng, sáng/tối). Cả 49 màn hình của web đã có bản di động, xem [đối chiếu với web](docs/web-parity.md).

Xây bằng [Expo](https://expo.dev) SDK 58 (React Native 0.88), Expo Router, [Uniwind](https://uniwind.dev) (Tailwind 4) và [Bun](https://bun.sh). Repo gồm hai phần:

- `src/`: ứng dụng.
- `gateway/`: cổng chuyển tiếp mỏng giữa app và backend [`amigoact-be`](https://github.com/ThanhLuan-zaiko/amigoact-be). Backend đòi `X-Internal-Key`, mà app là máy khách công khai nên không được giữ khoá; cổng giữ khoá thay app, chỉ cho đường dẫn trong danh sách, giới hạn tốc độ và chuyển tiếp socket realtime.

> Expo thay đổi nhiều giữa các phiên bản. Trước khi viết code, hãy đọc [AGENTS.md](AGENTS.md).

## Yêu cầu

- [Bun 1.4.2](https://bun.sh/docs/installation)
- Backend `amigoact-be` đang chạy (mặc định cổng 8100)
- Expo Go trên điện thoại, hoặc Android Studio / Xcode cho máy ảo hay bản dựng phát triển

## Chạy

1. Cổng chuyển tiếp, trong một cửa sổ terminal:

   ```bash
   cd gateway
   bun install
   cp .env.example .env    # điền BACKEND_URL và INTERNAL_API_KEY (cùng giá trị với backend)
   bun run dev             # nghe ở cổng 8200
   ```

2. App, trong cửa sổ khác:

   ```bash
   bun install
   cp .env.example .env    # điền EXPO_PUBLIC_API_URL là địa chỉ cổng
   bun run start           # quét mã QR bằng Expo Go, hoặc bun run android
   ```

`EXPO_PUBLIC_API_URL`: máy ảo Android dùng `http://10.0.2.2:8200`, điện thoại thật dùng `http://<IP LAN của máy>:8200`. Đây chỉ là địa chỉ, không phải bí mật: mọi giá trị `EXPO_PUBLIC_*` đều đọc được trong app. Không bao giờ đặt `INTERNAL_API_KEY` vào `.env` của app.

`EXPO_PUBLIC_APP_URL` (không bắt buộc) là địa chỉ web, để mã QR điểm danh mở được bằng camera thường.

## Lệnh thường dùng

```bash
bun run lint          # Biome, cho cả app và gateway
bun run format
bun run typecheck
bun run test          # test logic thuần (bun:test)
bunx expo-doctor
bunx expo export --platform android --output-dir <thư mục ngoài repo>   # kiểm tra build bundle
```

Cổng có lệnh riêng trong `gateway/` (`bun run typecheck`, `bun test`). CI chạy 14 cổng kiểm tra, liệt kê trong [AGENTS.md](AGENTS.md).

## Tài liệu

- [Đối chiếu từng màn hình với web](docs/web-parity.md)
- [Kiến trúc, cách gọi backend và cấu trúc code](docs/architecture.md)
- [Liên kết sâu](docs/deep-links.md)
- [Cổng chuyển tiếp](gateway/README.md)
- [Quy tắc cho AI agent](AGENTS.md)

## Đóng góp

- [Hướng dẫn đóng góp](.github/CONTRIBUTING.md)
- [Quy tắc ứng xử](.github/CODE_OF_CONDUCT.md)
- [Chính sách bảo mật](.github/SECURITY.md)

## Giấy phép

[MIT](LICENSE)
