# --- Stage 1: production dependencies only -----------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Stage 2: compile TypeScript ---------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Stage 3: runtime ---------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

# multer writes here. In docker-compose this path is a bind mount onto the EBS
# volume, so uploads survive container replacement and image rebuilds.
RUN mkdir -p /app/uploads && chown -R node:node /app

# Install pm2 globally
RUN npm install -g pm2

USER node
EXPOSE 9000

# start the application using pm2
CMD ["pm2-runtime", "dist/server.js"]
