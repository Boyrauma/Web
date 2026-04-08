# Dinh Dung Transport

Monorepo full-stack cho website nhà xe Định Dung, gồm:

- `apps/frontend`: website public cho khách hàng
- `apps/admin`: giao diện quản trị
- `apps/backend`: API, auth, Prisma, PostgreSQL

## Chạy local

1. Sao chép `.env.example` thành `.env`
2. Cài dependencies bằng `npm install`
3. Chạy từng app:
   - `npm run dev:backend`
   - `npm run dev:frontend`
   - `npm run dev:admin`

## Chạy bằng Docker Compose

1. Sao chép `.env.example` thành `.env`
2. Chạy `docker compose up --build`
3. Backend container sẽ tự chạy:
   - `prisma generate`
   - `prisma migrate deploy`
   - khởi động API server

Lưu ý dữ liệu:

- `docker compose up --build` sẽ giữ nguyên dữ liệu cũ vì `PostgreSQL` và `uploads` đang dùng Docker volumes
- chỉ khi chạy `docker compose down -v` thì dữ liệu volume mới bị xóa
- `seed` không còn chạy tự động khi boot để tránh ghi đè dữ liệu vận hành cũ
- nếu cần seed thủ công cho máy mới, chạy `docker compose exec backend node prisma/seed.js`

## Deploy public trên Ubuntu

Các file production đã có sẵn:

- [docker-compose.prod.yml](/Users/LENOVO/Downloads/Web/docker-compose.prod.yml)
- [infra/nginx/nhaxedinhdung.info.vn.conf](/Users/LENOVO/Downloads/Web/infra/nginx/nhaxedinhdung.info.vn.conf)
- [apps/frontend/.env.production](/Users/LENOVO/Downloads/Web/apps/frontend/.env.production)

Luồng deploy khuyến nghị:

1. Cập nhật `.env` trên server:
   - `NODE_ENV=production`
   - `JWT_SECRET` đủ mạnh
   - `CORS_ORIGINS=https://nhaxedinhdung.info.vn,https://www.nhaxedinhdung.info.vn`
2. Chạy stack production:
   - `docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d`
   - hoặc cập nhật nhanh sau này:
     - `docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d`
3. Với DB hiện có:
   - `docker compose exec backend npx prisma migrate deploy`
   - `docker compose exec backend node prisma/seed.js`
4. Copy file Nginx domain vào Ubuntu:
   - `/etc/nginx/sites-available/nhaxedinhdung.info.vn`
5. Bật site:
   - `ln -s /etc/nginx/sites-available/nhaxedinhdung.info.vn /etc/nginx/sites-enabled/`
   - `nginx -t`
   - `systemctl reload nginx`
6. Cấp SSL bằng Certbot sau khi domain đã trỏ đúng về server

## Tài khoản admin seed mặc định

- Email: `admin@dinhdung.local`
- Mật khẩu: `Admin@123456`

## Migration

- Migration khởi tạo đã được đặt tại `apps/backend/prisma/migrations/20260401000000_init/migration.sql`
- Migration mới cho log thông báo đã được đặt tại `apps/backend/prisma/migrations/20260401123000_add_notification_log/migration.sql`
- Khi có thay đổi schema tiếp theo, tạo migration mới thay vì sửa migration cũ
- Trong môi trường deploy, dùng `prisma migrate deploy`
- Trong local development, có thể dùng `npm run db:migrate`
- Có thể chạy nhanh ở root:
  - `npm run db:generate`
  - `npm run db:migrate`
  - `npm run db:deploy`
  - `npm run db:seed`

## Telegram Notification

- Cấu hình trong admin tại khu vực `Nội dung web` > `Thông báo Telegram`
- Hệ thống hiện hỗ trợ:
  - một bot gửi tới nhiều `chat id`
  - nhập nhiều `chat id` bằng cách xuống dòng hoặc ngăn cách bằng dấu phẩy
  - chia nhóm nhận riêng cho:
    - mặc định
    - hệ thống / test
    - booking mới
    - booking cập nhật
    - booking bị xóa
  - bật / tắt riêng từng loại thông báo booking
  - giữ nguyên bot token cũ nếu để trống ô token khi lưu lại cấu hình
  - gửi Telegram khi có booking mới
  - gửi Telegram khi booking cập nhật trạng thái
  - gửi Telegram khi booking bị xóa
  - gửi test Telegram từ admin
  - queue gửi nền và debounce cập nhật booking để giảm spam
  - nhật ký gửi Telegram ngay trong admin
- Log gửi thông báo được lưu trong bảng `NotificationLog`

## Giai đoạn hiện tại

Project đã có skeleton cho:

- frontend public
- admin
- backend express
- prisma schema ban đầu
- docker-compose

## Logo nhà xe

- Quản lý trong admin tại `Nội dung web`
- Có thể tải logo ảnh trực tiếp từ admin
- Logo sẽ được dùng đồng bộ ở:
  - header/footer public
  - màn đăng nhập admin
  - sidebar admin
- Nếu chưa có logo ảnh, hệ thống sẽ tự fallback về tên nhà xe dạng text
