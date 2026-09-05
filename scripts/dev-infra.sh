#!/usr/bin/env bash
# Brings up local Postgres (:5433) and Redis (:6379) for `npm run dev`.
# Prefers docker-compose.local.yml; falls back to a locally-installed
# redis-server when the Docker Compose plugin isn't available, since
# Postgres is comparatively awkward to run outside a container but Redis
# is not.
set -euo pipefail
cd "$(dirname "$0")/.."

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -f docker-compose.local.yml "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f docker-compose.local.yml "$@"
  else
    return 127
  fi
}

port_open() {
  (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && exec 3>&-
}

if port_open 5433; then
  echo "postgres: already running on :5433"
elif compose up -d postgres --wait; then
  echo "postgres: started via docker compose"
else
  echo "postgres: not running and Docker Compose is unavailable — start it manually (see readme.md)" >&2
  exit 1
fi

if port_open 6379; then
  echo "redis: already running on :6379"
elif compose up -d redis --wait; then
  echo "redis: started via docker compose"
elif [ -f redis/redis.conf ] && command -v redis-server >/dev/null 2>&1; then
  redis-server redis/redis.conf --daemonize yes \
    --pidfile "$(pwd)/redis/redis.pid" --logfile "$(pwd)/redis/redis.log"
  echo "redis: started locally via redis-server (Docker Compose unavailable)"
else
  echo "redis: not running, Docker Compose unavailable, and no local redis-server/redis.conf — see readme.md" >&2
  exit 1
fi
