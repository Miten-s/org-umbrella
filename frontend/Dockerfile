# --- Stage 1: build the SPA ---------------------------------------------------
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines import.meta.env.* at BUILD time, so these must be build args, not
# runtime env. They default to same-origin paths because nginx (stage 2) serves
# the SPA and reverse-proxies the APIs from the same host — which also means the
# browser never makes a cross-origin request, so CORS never comes into play.
ARG VITE_API_BASE_URL=/auth/v1/api
ARG VITE_API_GXP_BASE_URL=/gxp/v1/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_GXP_BASE_URL=$VITE_API_GXP_BASE_URL

RUN npm run build

# --- Stage 2: serve + reverse proxy ------------------------------------------
FROM nginx:1.27-alpine AS runner

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/app.conf /etc/nginx/conf.d/app.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
