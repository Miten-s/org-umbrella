# Local development

One-time setup, then one command starts everything.

## One-time setup

1. Create `redis/redis.conf` (gitignored) with:

   ```
   requirepass rock@1812002
   ```

2. Install dependencies once in each workspace:

   ```
   npm install --prefix backend
   npm install --prefix gxp-service
   npm install --prefix lims-service
   npm install --prefix frontend
   npm install
   ```

3. Make sure `backend/.env`, `gxp-service/.env`, `lims-service/.env` point at
   the local Postgres/Redis started below (`localhost:5433` / `localhost:6379`).

## Start everything

```
npm run dev
```

This brings up Postgres + Redis via Docker Compose (`docker-compose.local.yml`,
waiting until both report healthy), then starts backend (`:9001`),
gxp-service (`:9002`), lims-service (`:9003`) and the frontend (`:3000`)
together, each with its own colored/labeled log prefix in one terminal.
`Ctrl+C` stops all of them.

Other useful scripts (see root `package.json`):

- `npm run dev:infra` — just bring up Postgres + Redis.
- `npm run dev:infra:down` — stop them (data persists in the `postgres` volume).
- `npm run dev:backend` / `dev:gxp` / `dev:lims` / `dev:frontend` — run a
  single service on its own, e.g. while the others are already running.

## Notes for Windows / Docker DNS issues

If `docker compose` can't resolve images on Windows:

```
docker run --rm busybox nslookup google.com
docker pull redis:7-alpine
docker pull postgres:16-alpine
```
then retry `npm run dev:infra`.
