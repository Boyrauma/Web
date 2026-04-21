# Backup And Restore

Muc tieu cua bo repo nay la:

- `git` giu `code + config mau + migration`
- backup rieng giu `database + uploads + .env`

Neu thieu 1 trong 3 phan backup rieng nay, server moi se khong dong nhat du lieu voi server cu.

## 1. Nhung gi co san trong repo

Repo da du de dung lai code va config nen:

- `docker-compose.yml`
- `docker-compose.prod.yml`
- `.env.example`
- `.env.production.example`
- `infra/nginx/nhaxedinhdung.vn.conf`
- source code `frontend`, `admin`, `backend`
- `Prisma schema` va `migrations`
- `apps/backend/uploads/.gitkeep`

## 2. Nhung gi khong nam trong git

Day la 3 phan bat buoc phai backup rieng:

1. `Database PostgreSQL`
2. `Uploads` trong backend
3. File `.env` that cua moi moi truong

Khong co 3 phan nay thi server moi chi giong `code`, khong giong `du lieu`.

## 3. Local backup truoc khi deploy hoac restore

### 3.1. Day code len git

```powershell
cd D:\Web
git add .
git commit -m "Cap nhat moi"
git push origin main
```

### 3.2. Backup database tu local Docker

Khuyen dung cach nay de tranh loi encoding tren Windows PowerShell:

```powershell
cd D:\Web
docker compose exec -T postgres sh -lc "pg_dump -U postgres -d dinhdung_transport -f /tmp/dinhdung_transport.sql"
docker cp dinhdung-postgres:/tmp/dinhdung_transport.sql D:\Web\dinhdung_transport.sql
```

### 3.3. Backup uploads tu local Docker

```powershell
New-Item -ItemType Directory -Force -Path D:\Web\backup-uploads
docker cp dinhdung-backend:/app/uploads D:\Web\backup-uploads
Compress-Archive -Path D:\Web\backup-uploads\uploads\* -DestinationPath D:\Web\uploads.zip -Force
```

### 3.4. Backup file `.env`

Khong dua `.env` len git. Luu rieng o noi an toan:

```powershell
Copy-Item D:\Web\.env D:\Web\.env.local.backup
```

Neu la production thi backup file `.env` tren server, khong lay file local de ghi de.

## 4. Chuyen backup len Ubuntu

```powershell
scp D:\Web\dinhdung_transport.sql root@YOUR_SERVER_IP:/root/
scp D:\Web\uploads.zip root@YOUR_SERVER_IP:/root/
```

File `.env` production nen tao tren server tu `.env.production.example` va dien secret that, khong nen copy file local development len production.

## 5. Dung server moi giong server cu

### 5.1. Clone code

```bash
cd /opt
git clone YOUR_GIT_REPO_URL nhaxedinhdung
cd /opt/nhaxedinhdung
```

Hoac neu repo da co san:

```bash
cd /opt/nhaxedinhdung
git pull origin main
```

### 5.2. Tao `.env`

```bash
cd /opt/nhaxedinhdung
cp .env.production.example .env
nano .env
```

Bat buoc kiem tra 4 dong nay khop logic:

```env
POSTGRES_PASSWORD=your_real_password
DATABASE_URL=postgresql://postgres:your_real_password@postgres:5432/dinhdung_transport?schema=public
DIRECT_DATABASE_URL=postgresql://postgres:your_real_password@postgres:5432/dinhdung_transport?schema=public
JWT_SECRET=your_strong_secret
```

### 5.3. Khoi tao PostgreSQL sach

```bash
cd /opt/nhaxedinhdung
docker compose down -v 2>/dev/null || true
docker rm -f dinhdung-postgres dinhdung-backend dinhdung-frontend dinhdung-admin 2>/dev/null || true
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d postgres
```

Cho toi khi `postgres` healthy:

```bash
docker compose ps
docker compose logs postgres --tail=50
```

### 5.4. Restore database

```bash
docker cp /root/dinhdung_transport.sql dinhdung-postgres:/tmp/dinhdung_transport.sql
cd /opt/nhaxedinhdung
docker compose exec -T postgres psql -U postgres -d dinhdung_transport -f /tmp/dinhdung_transport.sql
```

Luu y:

- chi restore vao DB sach
- khong restore lai lan 2 len DB da co schema, neu khong se gap loi `already exists`

### 5.5. Chay backend va migrate

```bash
cd /opt/nhaxedinhdung
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d backend
docker compose exec backend npx prisma migrate deploy
```

### 5.6. Restore uploads

```bash
mkdir -p /root/uploads-unpacked
unzip -o /root/uploads.zip -d /root/uploads-unpacked
docker cp /root/uploads-unpacked/. dinhdung-backend:/app/uploads/
docker compose restart backend
```

### 5.7. Chay frontend va admin

```bash
cd /opt/nhaxedinhdung
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d frontend admin
```

### 5.8. Kiem tra

```bash
docker compose ps
curl http://127.0.0.1:8080/health
curl -I http://127.0.0.1:5173
curl -I http://127.0.0.1:5174
```

Neu dung Nginx public:

```bash
sudo cp /opt/nhaxedinhdung/infra/nginx/nhaxedinhdung.vn.conf /etc/nginx/sites-available/nhaxedinhdung.vn
sudo ln -sfn /etc/nginx/sites-available/nhaxedinhdung.vn /etc/nginx/sites-enabled/nhaxedinhdung.vn
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Khi update server dang chay

Neu chi thay doi code, khong doi du lieu:

### Local

```powershell
cd D:\Web
git add .
git commit -m "Cap nhat moi"
git push origin main
```

### Ubuntu

```bash
cd /opt/nhaxedinhdung
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
docker compose exec backend npx prisma migrate deploy
```

## 6.1. Backup nhanh tren Ubuntu

Neu server dang chay on dinh va ban muon backup nhanh ca `DB + uploads + .env`:

```bash
chmod +x /opt/nhaxedinhdung/scripts/backup-prod.sh
/opt/nhaxedinhdung/scripts/backup-prod.sh
```

Backup se nam o:

```bash
/root/backups/nhaxedinhdung/<timestamp>/
```

Trong do co:

- `dinhdung_transport.sql`
- `uploads.tar.gz`
- `.env`

## 7. Kiem tra cuoi cung

Server duoc coi la dong nhat voi server cu khi ban da co du:

- code moi nhat tu `git`
- `.env` dung
- `DB dump` da restore thanh cong
- `uploads` da restore thanh cong

Neu thieu `DB` hoac `uploads`, web van chay nhung se thieu du lieu, thieu anh, hoac mat cau hinh admin.
