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

- `docker-compose.prod.yml`
- `.env.production.example`
- `infra/nginx/nhaxedinhdung.vn.conf`

Luồng deploy khuyến nghị:

1. Tạo `.env` trên server từ `.env.production.example`, sau đó cập nhật:
   - `NODE_ENV=production`
   - `JWT_SECRET` đủ mạnh
   - `DATABASE_URL`
   - `DIRECT_DATABASE_URL`
   - `CORS_ORIGINS=https://nhaxedinhdung.vn,https://www.nhaxedinhdung.vn`
   - `VITE_API_URL=/api`
   - `RUN_SEED_ON_BOOT=false`
2. Chạy stack production:
   - `docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d`
3. Với DB hiện có:
   - `docker compose exec backend npx prisma migrate deploy`
   - chỉ chạy `docker compose exec backend node prisma/seed.js` khi cần seed máy mới
4. Copy file Nginx domain vào Ubuntu:
   - `/etc/nginx/sites-available/nhaxedinhdung.vn`
5. Bật site:
   - `ln -s /etc/nginx/sites-available/nhaxedinhdung.vn /etc/nginx/sites-enabled/`
   - `nginx -t`
   - `systemctl reload nginx`
6. Cấp SSL bằng Certbot sau khi domain đã trỏ đúng về server

Lưu ý khi public:

- Frontend và admin hiện gọi API same-origin qua `/api`, không nên hard-code `http://localhost:8080/api` trên server public.
- Ảnh upload được gọi qua URL public `/image/...`, vì vậy Nginx public phải proxy `/image/` về backend.
- Backend vẫn lưu file vật lý trong thư mục `uploads`, nhưng website chỉ nên dùng URL `/image/...`.
- Admin production hiện chạy tại `https://nhaxedinhdung.vn/admin`, vì vậy build production của admin phải dùng base path `/admin/`.

## Seed admin an toàn

- Không còn seed sẵn tài khoản admin mặc định.
- Muốn tạo admin khi seed, hãy đặt biến môi trường:
  - `SEED_ADMIN_EMAIL`
  - `SEED_ADMIN_PASSWORD`
- Ví dụ:
  - `SEED_ADMIN_EMAIL=admin@example.com`
  - `SEED_ADMIN_PASSWORD=<mat-khau-manh-rieng>`

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
