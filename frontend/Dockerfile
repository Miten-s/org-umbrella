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

# --- Stage 2: serve with vite preview ------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 4173

CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "4173"]
