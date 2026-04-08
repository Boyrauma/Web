FROM node:22-alpine AS build
WORKDIR /app

COPY package.json ./
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN npm install

COPY apps/frontend ./apps/frontend
WORKDIR /app/apps/frontend
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
COPY infra/nginx/frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
