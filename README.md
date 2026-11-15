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

Sao chép `.env.example` thành `.env` và điền `EXPO_PUBLIC_API_URL` bằng địa chỉ cổng (xem bên dưới). Đây chỉ là địa chỉ, không phải bí mật: mọi giá trị `EXPO_PUBLIC_*` đều đọc được trong app.

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

## Cổng chuyển tiếp (`gateway/`)

App không gọi backend trực tiếp mà qua cổng trong thư mục `gateway/`, vì backend đòi `X-Internal-Key` mà app không được giữ khoá. Cổng là một server riêng, cài và chạy riêng:

```bash
cd gateway
bun install
bun run dev
```

Xem [gateway/README.md](gateway/README.md).

## Tài liệu

- [Kiến trúc và cách gọi backend](docs/architecture.md)
- [Đối chiếu từng màn hình với web](docs/web-parity.md)
- [Quy tắc cho AI agent](AGENTS.md)
