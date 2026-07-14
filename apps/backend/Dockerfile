FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/backend/package.json ./apps/backend/package.json
RUN npm ci --workspace @dinhdung/backend --include-workspace-root

COPY apps/backend ./apps/backend
WORKDIR /app/apps/backend

RUN sed -i 's/\r$//' start.sh && chmod +x start.sh
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public" \
    DIRECT_DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public" \
    npx prisma generate

EXPOSE 8080
CMD ["./start.sh"]
