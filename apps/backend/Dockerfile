FROM node:22-alpine
WORKDIR /app

COPY package.json ./
COPY apps/backend/package.json ./apps/backend/package.json
RUN npm install

COPY apps/backend ./apps/backend
WORKDIR /app/apps/backend

RUN chmod +x start.sh
RUN npx prisma generate

EXPOSE 8080
CMD ["./start.sh"]
