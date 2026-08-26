# --- Stage 1: production dependencies only -----------------------------------
# bcrypt is a native module, so the build toolchain has to be present while npm
# compiles it. We do that in a throwaway stage so the toolchain never ships.
FROM node:20-slim AS deps
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Stage 2: compile TypeScript ---------------------------------------------
FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Stage 3: runtime ---------------------------------------------------------
FROM node:20-slim AS runner
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
