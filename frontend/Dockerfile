# --- Stage 1: build the SPA ---------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/auth/v1/api
ARG VITE_API_GXP_BASE_URL=/gxp/v1/api
ARG VITE_API_LIMS_BASE_URL=/lims/v1/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_GXP_BASE_URL=$VITE_API_GXP_BASE_URL
ENV VITE_API_LIMS_BASE_URL=$VITE_API_LIMS_BASE_URL

RUN npm run build

# --- Stage 2: serve static files with lightweight Nginx ----------------------
FROM nginx:alpine-slim AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo 'server { listen 4173; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 4173

CMD ["nginx", "-g", "daemon off;"]

