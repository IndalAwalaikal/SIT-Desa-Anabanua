FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Semua NEXT_PUBLIC_* dan variabel server wajib tersedia saat `next build`
# karena .dockerignore mengecualikan file .env*, variabel hanya lewat ARG/ENV.
ARG NEXT_PUBLIC_API_BASE_URL=/api
ARG API_INTERNAL_URL=http://backend:8080
ARG NEXT_PUBLIC_APP_NAME="Website Desa Anabanua"
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_MOCK_DELAY_MS=0
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV API_INTERNAL_URL=$API_INTERNAL_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_MOCK_DELAY_MS=$NEXT_PUBLIC_MOCK_DELAY_MS
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
# Salin aset statis publik (logo, favicon, dll) — Next.js `output: standalone`
# TIDAK otomatis menyalin folder public/ ke output, jadi harus disalin manual.
COPY --from=build /app/public ./public
COPY --from=build /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
