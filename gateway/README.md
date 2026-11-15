# AmigoACT - Gateway

Cổng chuyển tiếp mỏng giữa app di động và backend. Giữ `INTERNAL_API_KEY` thay cho app, chỉ cho đi qua các đường dẫn trong danh sách, giới hạn tốc độ và chuyển tiếp socket realtime. Viết bằng [Bun](https://bun.sh), không có thư viện chạy.

## Yêu cầu

- [Bun 1.4.2](https://bun.sh/docs/installation)
- Backend đang chạy (`../../amigoact-be`, mặc định cổng 8100)

## Cài đặt và chạy

```bash
bun install
```

Sao chép `.env.example` thành `.env`, điền `BACKEND_URL` (ví dụ `http://localhost:8100`) và `INTERNAL_API_KEY` (cùng giá trị với backend), rồi chạy:

```bash
bun run dev
```

Cổng nghe ở cổng 8200. Kiểm tra: `GET http://localhost:8200/healthz`.

## Lệnh thường dùng

```bash
bun run lint
bun run typecheck
bun test
```

## Tài liệu

- [Cổng làm gì, cấu hình, triển khai](docs/gateway.md)
- [Quy tắc cho AI agent](AGENTS.md)
- [Kiến trúc app và quyết định dùng cổng](../docs/architecture.md)
