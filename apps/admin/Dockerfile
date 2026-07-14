FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_BASE_PATH=/
ENV VITE_BASE_PATH=${VITE_BASE_PATH}

COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/backend/package.json ./apps/backend/package.json
RUN npm ci --workspace @dinhdung/admin --include-workspace-root

COPY apps/admin ./apps/admin
WORKDIR /app/apps/admin
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
COPY infra/nginx/admin.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
