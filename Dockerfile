FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN DATABASE_URL="postgresql://placeholder:5432" yarn prisma generate

COPY . .

RUN yarn build

# =========================

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json yarn.lock ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN yarn install --production --frozen-lockfile

RUN DATABASE_URL="postgresql://placeholder:5432" yarn prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["sh", "-c", "yarn prisma migrate deploy && node dist/server.js"]
