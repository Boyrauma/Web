# Ubuntu Deploy Note

IP server: `157.10.196.89`  
Project path on Ubuntu: `/opt/nhaxedinhdung`

## 1. File nao lay tu git, file nao copy rieng

### 1.1. Di theo git

Sau khi `git clone`, tren Ubuntu phai co:

- `/opt/nhaxedinhdung/docker-compose.yml`
- `/opt/nhaxedinhdung/docker-compose.prod.yml`
- `/opt/nhaxedinhdung/.env.example`
- `/opt/nhaxedinhdung/.env.production.example`
- `/opt/nhaxedinhdung/README.md`
- `/opt/nhaxedinhdung/BACKUP_RESTORE.md`
- `/opt/nhaxedinhdung/infra/nginx/nhaxedinhdung.vn.conf`
- `/opt/nhaxedinhdung/apps/backend`
- `/opt/nhaxedinhdung/apps/frontend`
- `/opt/nhaxedinhdung/apps/admin`
- `/opt/nhaxedinhdung/Image`
- `/opt/nhaxedinhdung/apps/frontend/public/assets`

Ghi nho:

- `Image/` la anh tinh co trong git
- `apps/frontend/public/assets/` la asset tinh co trong git
- `apps/backend/uploads/` trong git chi la placeholder, thuong chi co `.gitkeep`

### 1.2. Khong di theo git, phai copy rieng

Nhung file nay phai tu local copy sang server:

- `.env`
- SQL backup, vi du: `/root/dinhdung_transport.sql`
- uploads backup, vi du: `/root/uploads.zip`
- hoac thu muc `backup-uploads/` neu khong dung file zip

Tren local Windows, thuong nam o:

- `D:\Web\.env`
- `D:\Web\dinhdung_transport.sql`
- `D:\Web\uploads.zip`
- `D:\Web\backup-uploads\`

### 1.3. Copy tu local len Ubuntu

SQL:

```powershell
scp D:\Web\dinhdung_transport.sql root@157.10.196.89:/root/
```

Uploads zip:

```powershell
scp D:\Web\uploads.zip root@157.10.196.89:/root/
```

Hoac copy ca thu muc backup:

```powershell
scp -r D:\Web\backup-uploads root@157.10.196.89:/root/
```

### 1.4. Kiem tra tren Ubuntu

```bash
cd /opt/nhaxedinhdung
ls -la
ls -la Image
ls -la apps/frontend/public/assets
ls -la apps/backend/uploads
ls -lh /root/*.sql
ls -lh /root/uploads.zip
```

## 2. Cai dat Ubuntu

### 2.1. Package co ban

```bash
sudo apt update
sudo apt install -y git nginx unzip curl ca-certificates openssl
```

### 2.2. Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

## 3. Clone code va tao .env

### 3.1. Clone moi

```bash
cd /opt
sudo git clone YOUR_GIT_REPO_URL nhaxedinhdung
sudo chown -R $USER:$USER /opt/nhaxedinhdung
cd /opt/nhaxedinhdung
git checkout main
```

### 3.2. Pull code moi

```bash
cd /opt/nhaxedinhdung
git pull origin main
```

### 3.3. Tao JWT secret

```bash
openssl rand -hex 32
```

### 3.4. Tao `.env`

```bash
cd /opt/nhaxedinhdung
cp .env.production.example .env
nano .env
```

Noi dung toi thieu:

```env
NODE_ENV=production
FRONTEND_PORT=5173
ADMIN_PORT=5174
BACKEND_PORT=8080
VITE_API_URL=/api
POSTGRES_PASSWORD=P@ssw0rd123456
DATABASE_URL=postgresql://postgres:P@ssw0rd123456@postgres:5432/dinhdung_transport?schema=public
DIRECT_DATABASE_URL=postgresql://postgres:P@ssw0rd123456@postgres:5432/dinhdung_transport?schema=public
JWT_SECRET=YOUR_GENERATED_SECRET
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
CORS_ORIGINS=https://nhaxedinhdung.vn,https://www.nhaxedinhdung.vn
UPLOAD_DIR=/app/uploads
RUN_SEED_ON_BOOT=false
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
```

Quy tac bat buoc:

- `POSTGRES_PASSWORD`
- password trong `DATABASE_URL`
- password trong `DIRECT_DATABASE_URL`

phai giong nhau 100%.

## 4. Restore database

Nguyen tac:

- restore vao DB sach
- khong import de len DB da co schema cu

### 4.1. Xoa stack va volume cu

```bash
cd /opt/nhaxedinhdung
docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v
docker rm -f dinhdung-postgres dinhdung-backend dinhdung-admin dinhdung-frontend 2>/dev/null || true
```

### 4.2. Tao lai Postgres sach

```bash
cd /opt/nhaxedinhdung
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d postgres
sleep 10
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### 4.3. Kiem tra Postgres da san sang

```bash
docker exec -e PGPASSWORD='P@ssw0rd123456' -it dinhdung-postgres psql -U postgres -d dinhdung_transport -c "SELECT now();"
```

### 4.4. Restore SQL

```bash
docker cp /root/dinhdung_transport.sql dinhdung-postgres:/tmp/dinhdung_transport.sql
docker exec -it dinhdung-postgres psql -U postgres -d dinhdung_transport -f /tmp/dinhdung_transport.sql
```

### 4.5. Check du lieu sau restore

```bash
docker exec -it dinhdung-postgres psql -U postgres -d dinhdung_transport -c 'SELECT COUNT(*) FROM "SiteSetting";'
docker exec -it dinhdung-postgres psql -U postgres -d dinhdung_transport -c 'SELECT COUNT(*) FROM "Vehicle";'
docker exec -it dinhdung-postgres psql -U postgres -d dinhdung_transport -c 'SELECT COUNT(*) FROM "VehicleImage";'
docker exec -it dinhdung-postgres psql -U postgres -d dinhdung_transport -c 'SELECT COUNT(*) FROM "VehicleCategory";'
```

## 5. Restore uploads

Luu y: `down -v` se xoa luon volume uploads.

### 5.1. Giai nen uploads

```bash
rm -rf /root/uploads-unpacked
mkdir -p /root/uploads-unpacked
unzip -o /root/uploads.zip -d /root/uploads-unpacked
find /root/uploads-unpacked -maxdepth 3 -type f
```

### 5.2. Start app

```bash
cd /opt/nhaxedinhdung
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d frontend admin
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### 5.3. Copy uploads vao backend

```bash
docker cp /root/uploads-unpacked/. dinhdung-backend:/app/uploads/
docker exec -it dinhdung-backend sh -c "find /app/uploads -maxdepth 3 -type f"
docker compose -f /opt/nhaxedinhdung/docker-compose.yml -f /opt/nhaxedinhdung/docker-compose.prod.yml restart backend
```

## 6. Check he thong sau restore

### 6.1. Check stack

```bash
cd /opt/nhaxedinhdung
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### 6.2. Check localhost

```bash
curl -s http://127.0.0.1:8080/health
curl -I http://127.0.0.1:5173
curl -I http://127.0.0.1:5174
```

### 6.3. Check public domain

```bash
curl -I https://nhaxedinhdung.vn
curl -I https://nhaxedinhdung.vn/admin/
curl -I https://nhaxedinhdung.vn/api/site-settings
```

### 6.4. Check API du lieu

```bash
curl -s https://nhaxedinhdung.vn/api/site-settings
curl -s https://nhaxedinhdung.vn/api/vehicle-categories
curl -s https://nhaxedinhdung.vn/api/services
curl -s https://nhaxedinhdung.vn/api/vehicles/santafe
curl -s https://nhaxedinhdung.vn/api/vehicles/huyndai-county
```

Luu y:

- co `GET /api/vehicles/:slug`
- khong co `GET /api/vehicles`

### 6.5. Check image public

```bash
curl -I https://nhaxedinhdung.vn/image/vehicles/1775734761356-xe45cho2.webp
curl -I https://nhaxedinhdung.vn/image/vehicles/1775734589342-xecountybonghoi.webp
curl -I https://nhaxedinhdung.vn/image/branding/1776257446496-logo.webp
```

## 7. Update code tu local -> git -> Ubuntu

### 7.1. Tren local Windows

```powershell
cd D:\Web
git status
git add .
git commit -m "Cap nhat moi"
git push origin main
```

### 7.2. Tren Ubuntu

```bash
cd /opt/nhaxedinhdung
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate backend frontend admin
```

### 7.3. Check ngay sau update

```bash
cd /opt/nhaxedinhdung
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
curl -I http://127.0.0.1:5173
curl -I http://127.0.0.1:5174
curl -s http://127.0.0.1:8080/health
curl -I https://nhaxedinhdung.vn
curl -I https://nhaxedinhdung.vn/admin/
```

### 7.4. Neu co migration moi

```bash
cd /opt/nhaxedinhdung
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

## 8. Turnstile / booking anti-spam

Code da co:

- rate limit IP
- captcha challenge
- proof of work
- cooldown
- honeypot `website`
- Cloudflare Turnstile support

### 8.1. Check env

```bash
cd /opt/nhaxedinhdung
grep -E 'TURNSTILE_SITE_KEY|TURNSTILE_SECRET_KEY' .env
```

### 8.2. Check API captcha

```bash
curl -s https://nhaxedinhdung.vn/api/booking-captcha
```

Neu Turnstile bat dung, JSON phai co:

```json
"turnstile":{"enabled":true,"siteKey":"..."}
```

### 8.3. Bat Turnstile sau khi lay key tu Cloudflare

```bash
cd /opt/nhaxedinhdung
nano .env
```

Them:

```env
TURNSTILE_SITE_KEY=YOUR_SITE_KEY
TURNSTILE_SECRET_KEY=YOUR_SECRET_KEY
```

Sau do:

```bash
cd /opt/nhaxedinhdung
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
curl -s https://nhaxedinhdung.vn/api/booking-captcha
```

## 9. Loi thuong gap

### 9.1. `502 Bad Gateway` sau `up -d --build`

Dau hieu:

- `docker compose ps` van thay app `Up`
- nhung `PORTS` khong co:
  - `127.0.0.1:5173->80/tcp`
  - `127.0.0.1:5174->80/tcp`
  - `127.0.0.1:8080->8080/tcp`
- `curl` vao localhost `5173`, `5174`, `8080` bi loi

Check:

```bash
cd /opt/nhaxedinhdung
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
sudo ss -ltnp | grep -E '8080|5173|5174'
```

Sua:

```bash
cd /opt/nhaxedinhdung
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate backend frontend admin
```

### 9.2. `P1000: Authentication failed`

Check:

```bash
cd /opt/nhaxedinhdung
grep -E 'POSTGRES_PASSWORD|DATABASE_URL|DIRECT_DATABASE_URL' .env
```

Ba password phai giong nhau.

### 9.3. `P1001: Can't reach database server`

Thuong do Postgres chua healthy. Hay cho Postgres len xong roi moi start backend hoac restore SQL.

### 9.4. Restore SQL bi `relation already exists`

Ban dang import vao DB da co schema cu. Phai:

- `down -v`
- tao Postgres sach
- restore lai

### 9.5. Mat uploads sau khi restore

Nguyen nhan:

- da chay `docker compose down -v`
- volume uploads bi xoa

Sua:

```bash
docker cp /root/uploads-unpacked/. dinhdung-backend:/app/uploads/
docker compose -f /opt/nhaxedinhdung/docker-compose.yml -f /opt/nhaxedinhdung/docker-compose.prod.yml restart backend
```

### 9.6. Admin trang trang

Neu:

```bash
curl -s https://nhaxedinhdung.vn/admin/ | grep assets
```

ra:

```html
/assets/...
```

thi sai base path.

Dung phai la:

```html
/admin/assets/...
```

Cach sua:

```bash
cd /opt/nhaxedinhdung
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache admin
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate admin
curl -s https://nhaxedinhdung.vn/admin/ | grep assets
```

## 10. Backup khi server dang on

### 10.1. Backup DB

```bash
docker exec -it dinhdung-postgres pg_dump -U postgres -d dinhdung_transport -f /tmp/dinhdung_transport_ok.sql
docker cp dinhdung-postgres:/tmp/dinhdung_transport_ok.sql /root/dinhdung_transport_ok.sql
```

### 10.2. Backup uploads

```bash
docker exec -it dinhdung-backend sh -c "tar -czf /tmp/uploads_ok.tar.gz -C /app uploads"
docker cp dinhdung-backend:/tmp/uploads_ok.tar.gz /root/uploads_ok.tar.gz
```

## 11. Checklist cuc ngan

Neu da co san:

- `/root/dinhdung_transport.sql`
- `/root/uploads.zip`
- `.env` dung

thi chay:

```bash
cd /opt/nhaxedinhdung
docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v
docker rm -f dinhdung-postgres dinhdung-backend dinhdung-admin dinhdung-frontend 2>/dev/null || true
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d postgres
sleep 10
docker cp /root/dinhdung_transport.sql dinhdung-postgres:/tmp/dinhdung_transport.sql
docker exec -e PGPASSWORD='P@ssw0rd123456' -it dinhdung-postgres psql -U postgres -d dinhdung_transport -c "SELECT now();"
docker exec -it dinhdung-postgres psql -U postgres -d dinhdung_transport -f /tmp/dinhdung_transport.sql
rm -rf /root/uploads-unpacked
mkdir -p /root/uploads-unpacked
unzip -o /root/uploads.zip -d /root/uploads-unpacked
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d frontend admin
docker cp /root/uploads-unpacked/. dinhdung-backend:/app/uploads/
docker compose -f /opt/nhaxedinhdung/docker-compose.yml -f /opt/nhaxedinhdung/docker-compose.prod.yml restart backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
curl -s http://127.0.0.1:8080/health
curl -I https://nhaxedinhdung.vn
curl -I https://nhaxedinhdung.vn/admin/
curl -I https://nhaxedinhdung.vn/image/branding/1776257446496-logo.webp
```
