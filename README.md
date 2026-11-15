# AmigoACT - Mobile

Ứng dụng di động của AmigoACT, xây dựng bằng [Expo](https://expo.dev) (React Native), Expo Router, [Uniwind](https://uniwind.dev) (Tailwind 4) và [Bun](https://bun.sh). Giao diện web (`../amigoact-fe`) là nguồn của sự thật, app này chuyển nó sang native.

> Expo thay đổi nhiều giữa các phiên bản. Trước khi viết code, hãy đọc [AGENTS.md](AGENTS.md).

## Yêu cầu

- [Bun 1.4.2](https://bun.sh/docs/installation)
- Ứng dụng Expo Go trên điện thoại, hoặc Android Studio / Xcode

## Cài đặt và chạy

```bash
bun install
```

```bash
bun run start
```

Quét mã QR bằng Expo Go, hoặc chạy `bun run android`.

## Lệnh thường dùng

```bash
bun run lint
bun run typecheck
bunx expo-doctor
```

## Tài liệu

- [Kiến trúc và cách gọi backend](docs/architecture.md)
- [Đối chiếu từng màn hình với web](docs/web-parity.md)
- [Quy tắc cho AI agent](AGENTS.md)
