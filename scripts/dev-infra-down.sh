#!/usr/bin/env bash
# Stops whatever `dev-infra.sh` started — Docker Compose containers and/or
# the local redis-server fallback. Safe to run even if nothing is up.
set -uo pipefail
cd "$(dirname "$0")/.."

if docker compose version >/dev/null 2>&1; then
  docker compose -f docker-compose.local.yml down
elif command -v docker-compose >/dev/null 2>&1; then
  docker-compose -f docker-compose.local.yml down
fi

if [ -f redis/redis.pid ]; then
  kill "$(cat redis/redis.pid)" 2>/dev/null
  rm -f redis/redis.pid
  echo "redis: stopped local fallback instance"
fi
