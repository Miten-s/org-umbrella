# Deploying the `test` branch to AWS

End-to-end runbook for a **single-EC2, lowest-cost** test environment.

One `t3.micro` runs everything under Docker Compose: nginx (serving the SPA and
reverse-proxying both APIs), the two Node services, and Postgres. There is no
load balancer, no NAT gateway, and no S3/CloudFront — those are the line items
that quietly turn a "test" environment into a $150/month bill.

---

## 0. What actually runs

```
                    Internet
                       │
                 :80 / :443
                       │
        ┌──────────────▼───────────────────────┐
        │  EC2 t3.micro (public subnet)        │
        │                                      │
        │  ┌────────────────────────────────┐  │
        │  │ web (nginx)                    │  │
        │  │   /            → SPA (static)  │  │
        │  │   /auth/*      → backend:9000  │  │
        │  │   /gxp/*       → gxp:9001      │  │
        │  └───────┬──────────────┬─────────┘  │
        │          │              │            │
        │   ┌──────▼─────┐  ┌─────▼────────┐   │
        │   │ backend    │  │ gxp-service  │   │
        │   │ :9000      │  │ :9001        │   │
        │   └──────┬─────┘  └─────┬────────┘   │
        │          └───────┬──────┘            │
        │            ┌─────▼──────┐            │
        │            │ postgres   │            │
        │            │ (EBS vol)  │            │
        │            └────────────┘            │
        └──────────────────────────────────────┘
```

Only port 80/443 is exposed. Postgres and both Node services are reachable only
inside the compose network.

**Databases:** `umbrella_auth_db` (backend) and `gxp_workflow_db` (gxp-service).
gxp-service connects to both — its own plus auth as a read-only reference.

> **Note:** MongoDB is *not* deployed. On the `test` branch all 26 models are
> Sequelize/Postgres; `backend/src/configs/db.config.ts` (mongoose) is dead code
> that `server.ts` never calls. Redis is likewise commented out in both `.env`
> files and `app.ts`. If you re-enable Redis later, add a `redis:7-alpine`
> service to the compose file — it does not need its own instance.

---

## 1. Your Postgres options

You asked what the choices are. Ranked by cost:

| Option | Cost | Backups | Verdict |
|---|---|---|---|
| **Container on the same EC2** *(used here)* | **$0** | Manual (`pg_dump` cron, §10) | Best for a test env. One box, one bill, no VPC/security-group wiring. |
| **RDS `db.t4g.micro`** | Free 12mo on legacy free tier, then **~$12–15/mo** + storage | Automated snapshots, PITR | Worth it the moment this data starts mattering. Migration is a `pg_dump`/`pg_restore` — §11. |
| **Neon / Supabase free tier** | **$0** | Automated | Genuinely free managed Postgres, but it lives outside your VPC and adds network latency per query. Fine for test. |
| **Aurora Serverless v2** | ~$45/mo floor | Automated | Overkill. Skip. |

This guide uses the **container** option. §11 has the switch-to-RDS steps when
you outgrow it — it's a two-line change to `deploy/.env`, not a rewrite.

---

## 2. Cost expectations

| Item | Legacy free tier (acct. created before ~Jul 2025) | Otherwise |
|---|---|---|
| EC2 t3.micro, 750 hrs/mo | $0 for 12 months | ~$7.50/mo |
| EBS 30 GB gp3 | $0 for 12 months | ~$2.40/mo |
| Public IPv4 address | $0 for 12 months | ~$3.60/mo |
| Data transfer out (100 GB/mo) | $0 | $0 |
| **Total** | **$0** | **~$13.50/mo** |

> ⚠️ AWS overhauled the free tier around **July 2025**. Newer accounts get a
> credit-based plan (signup credits, ~6-month window) rather than the classic
> 12-month always-free allowances. **Check your own account** at
> Billing → Free Tier in the console before assuming $0 — I can't verify which
> plan your account is on from here.

Set a billing alarm regardless — step 1.4.

---

## 3. Prerequisites

- An AWS account with console access
- An SSH key pair (or create one in step 1.2)
- The `test` branch pushed to your Git remote
- Locally: nothing. All builds happen on the server.

---

## 4. Create the EC2 instance

### 4.1 Launch

Console → **EC2** → **Launch instance**.

| Field | Value |
|---|---|
| Name | `umbrella-test` |
| AMI | **Ubuntu Server 24.04 LTS (x86_64)** |
| Instance type | **t3.micro** (free-tier eligible) |
| Key pair | Create new → `umbrella-test-key` → download the `.pem` |
| Network | Default VPC, **default (public) subnet** |
| Auto-assign public IP | **Enable** |
| Storage | **30 GiB gp3** (the free-tier maximum — take all of it) |

Keep it in a **public subnet**. Putting it in a private subnet forces a NAT
gateway on you, which alone costs ~$32/month — more than the rest of the stack
combined.

### 4.2 Security group

Create `umbrella-test-sg` with **inbound** rules:

| Type | Port | Source | Why |
|---|---|---|---|
| SSH | 22 | **My IP** | Admin access. Never `0.0.0.0/0`. |
| HTTP | 80 | `0.0.0.0/0` | The app |
| HTTPS | 443 | `0.0.0.0/0` | Only once you finish §9 |

Do **not** open 5432, 9000, or 9001. Nothing outside the box needs them, and
compose does not publish them to the host.

Leave outbound as the default allow-all (needed for `apt`, Docker Hub, npm).

### 4.3 Elastic IP

EC2 → **Elastic IPs** → Allocate → Associate with `umbrella-test`.

Without this the public IP changes on every stop/start, breaking your DNS and
your `CORS_ORIGINS`. Note the address — it's `EC2_IP` below.

### 4.4 Billing alarm (do this now, not later)

Billing → **Budgets** → Create budget → Cost budget → monthly limit `$5` →
alert at 80%. Two minutes of work that prevents a surprise.

---

## 5. Prepare the server

SSH in:

```bash
chmod 400 umbrella-test-key.pem
ssh -i umbrella-test-key.pem ubuntu@EC2_IP
```

### 5.1 Docker

```bash
sudo apt-get update && sudo apt-get upgrade -y

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker ubuntu
newgrp docker          # or log out and back in

docker --version && docker compose version
```

### 5.2 Swap — **required on t3.micro**

t3.micro has 1 GB of RAM. The Vite build of this frontend produces a ~1.1 MB
ag-grid chunk among others, and `tsc -b` plus rollup will exhaust 1 GB and get
OOM-killed mid-build. Swap is what makes a 1 GB box viable:

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h        # confirm 4Gi swap
```

Skip this and step 6.3 will fail with an unhelpful `Killed` message.

---

## 6. Deploy

### 6.1 Get the code

For a private repo, create a **read-only deploy key**:

```bash
ssh-keygen -t ed25519 -C "umbrella-test-deploy" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

Add that key under your repo → Settings → **Deploy keys** (read-only). Then:

```bash
cd ~
git clone -b test git@github.com:YOUR_ORG/org-umbrella.git
cd org-umbrella
git branch --show-current    # must print: test
```

### 6.2 Configure secrets

```bash
cp deploy/.env.example deploy/.env

# Generate real values
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24)"
echo "JWT_SECRET=$(openssl rand -hex 32)"

nano deploy/.env
```

Fill in the generated values and set `CORS_ORIGINS=http://EC2_IP`.

`deploy/.env` is already covered by the repo's `.gitignore` (`*/.env`) — keep it
that way. It is the only place secrets live on this box.

### 6.3 Build and start

```bash
cd ~/org-umbrella
docker compose -f deploy/docker-compose.yml up -d --build
```

First build takes **8–15 minutes** on a t3.micro (three npm installs plus the
Vite build). Watch it with:

```bash
docker compose -f deploy/docker-compose.yml logs -f
```

Both services run their Sequelize migrations automatically on boot — `connectDB`
in `db.sequelize.ts` calls `runMigrations` after `authenticate()`. There is no
separate migrate step. (The `migrate:*` npm scripts are migrate-mongo leftovers
and do not apply.)

### 6.4 Verify

```bash
docker compose -f deploy/docker-compose.yml ps        # all "Up", postgres "healthy"

curl -s localhost/auth/health   # {"message":...}
curl -s localhost/gxp/health    # {"message":...}
curl -s localhost/auth/readyz   # {"status":"ready"}  ← confirms DB connectivity
curl -sI localhost/ | head -1   # 200 OK  ← the SPA
```

Then open `http://EC2_IP` in a browser.

If `/readyz` returns `not-ready`, Postgres is up but the app can't reach it —
check `deploy/.env` credentials and `docker compose logs postgres`.

---

## 7. How requests are routed

The SPA and both APIs are served from **one origin**, so the browser never makes
a cross-origin request and CORS is a non-issue.

| Browser requests | nginx sends to | Express sees |
|---|---|---|
| `/` , `/dashboard`, … | static SPA, `try_files … /index.html` | — |
| `/auth/v1/api/users` | `backend:9000` | `/v1/api/users` |
| `/gxp/v1/api/...` | `gxp-service:9001` | `/v1/api/...` |
| `/auth/uploads/logo.png` | `backend:9000` | `/uploads/logo.png` |

The trailing slash in `proxy_pass http://backend_api/;` is what strips the
prefix. Don't remove it.

The upload path works because `getImageUrl()` in
`frontend/src/services/utils.service.ts` strips the `/v1/api` suffix off
`VITE_API_BASE_URL` (leaving `/auth`) and appends `/uploads/...`.

`VITE_API_BASE_URL` and `VITE_API_GXP_BASE_URL` are **baked in at build time** by
Vite — they're `args` in the compose file, not runtime `environment`. Changing
them requires a rebuild of the `web` image, not a restart.

---

## 8. Redeploying after a push

```bash
cd ~/org-umbrella
git pull origin test
docker compose -f deploy/docker-compose.yml up -d --build
```

Only changed services rebuild. Data in the `pgdata` and `uploads` volumes is
untouched by rebuilds.

Optional convenience script:

```bash
cat > ~/deploy.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd ~/org-umbrella
git pull origin test
docker compose -f deploy/docker-compose.yml up -d --build
docker image prune -f          # reclaim disk; 30GB fills up fast
docker compose -f deploy/docker-compose.yml ps
EOF
chmod +x ~/deploy.sh
```

`docker image prune` matters here — untagged intermediate images from repeated
builds will fill a 30 GB volume within a few weeks.

---

## 9. HTTPS (optional, needs a domain)

Skip if you're fine with `http://EC2_IP` for a test env. Browsers will flag it
as insecure, and some APIs (clipboard, geolocation) refuse to work without TLS.

1. Point an A record at your Elastic IP: `test.yourdomain.com → EC2_IP`
2. Open port 443 in the security group
3. Issue the certificate:

```bash
sudo apt-get install -y certbot
docker compose -f deploy/docker-compose.yml stop web
sudo certbot certonly --standalone -d test.yourdomain.com
```

4. Mount the certs into the `web` service in `deploy/docker-compose.yml`:

```yaml
  web:
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
```

5. Add a TLS server block to `frontend/nginx/app.conf` (listen 443 ssl,
   `ssl_certificate /etc/letsencrypt/live/test.yourdomain.com/fullchain.pem`,
   `ssl_certificate_key .../privkey.pem`) and redirect port 80 to it.
6. Update `CORS_ORIGINS=https://test.yourdomain.com` in `deploy/.env`, then
   rebuild: `docker compose -f deploy/docker-compose.yml up -d --build`
7. Auto-renew:
   `echo "0 3 * * * root certbot renew --quiet --pre-hook 'docker compose -f /home/ubuntu/org-umbrella/deploy/docker-compose.yml stop web' --post-hook 'docker compose -f /home/ubuntu/org-umbrella/deploy/docker-compose.yml start web'" | sudo tee /etc/cron.d/certbot-renew`

---

## 10. Backups

The container-Postgres option has **no automatic backups**. If the EBS volume or
the instance dies, the data is gone. For a test environment that may be
acceptable — decide deliberately rather than by accident.

Nightly dump, 7-day retention:

```bash
mkdir -p ~/backups
cat > ~/backup.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd ~/org-umbrella
STAMP=$(date +%F)
for DB in umbrella_auth_db gxp_workflow_db; do
  docker compose -f deploy/docker-compose.yml exec -T postgres \
    pg_dump -U "$POSTGRES_USER" "$DB" | gzip > ~/backups/"$DB"-"$STAMP".sql.gz
done
find ~/backups -name '*.sql.gz' -mtime +7 -delete
EOF
chmod +x ~/backup.sh
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup.sh") | crontab -
```

Backups on the same disk as the database protect against `DROP TABLE`, not
against losing the volume. To survive that, push them off-box — create an S3
bucket and append `aws s3 cp ~/backups/ s3://your-bucket/ --recursive` (S3
storage for a few dumps is cents per month). Also take periodic **EBS snapshots**
via Data Lifecycle Manager.

---

## 11. Moving to RDS later

When the data starts mattering:

1. RDS → Create database → PostgreSQL → **Free tier** template → `db.t4g.micro`,
   20 GB gp3, **not** publicly accessible.
2. Put it in the same VPC; give its security group an inbound rule on 5432
   whose **source is `umbrella-test-sg`**.
3. Create both databases, then migrate:
   ```bash
   docker compose -f deploy/docker-compose.yml exec -T postgres \
     pg_dump -U "$POSTGRES_USER" umbrella_auth_db | psql "$RDS_URI/umbrella_auth_db"
   ```
4. In `deploy/docker-compose.yml`, replace the `AUTH_POSTGRES_URI` /
   `GXP_POSTGRES_URI` values with the RDS endpoint, and delete the `postgres`
   service plus the `depends_on` blocks.
5. `docker compose -f deploy/docker-compose.yml up -d`

The application code needs no changes — both services read their connection
strings straight from those env vars.

---

## 12. Known limitations

Honest accounting of what this setup is and isn't:

- **Single point of failure.** One instance. A reboot is downtime; a lost EBS
  volume is lost data. Appropriate for test, not for production.
- **Uploads are on a local Docker volume.** Per your decision, `multer` is
  unchanged — it still writes to `/app/uploads` on disk
  (`backend/src/middlewares/multer.middleware.ts`). The named volume keeps files
  across container rebuilds, but they are **not** replicated and won't survive
  the instance. Moving to more than one instance (ECS/autoscaling) requires
  switching to S3 first, since two containers would each hold half the files.
- **No CDN.** Assets are served by nginx off the instance. Fine at test traffic.
- **Builds happen on the production box.** Simple, but a build failure and a
  running app compete for the same 1 GB. If this becomes painful, move builds to
  GitHub Actions → ECR and have the box only pull images.
- **`t3.micro` is burstable.** Sustained CPU drains the credit balance and the
  instance throttles hard. Watch the `CPUCreditBalance` CloudWatch metric; if it
  trends to zero, move to `t3.small` (~$15/mo).

---

## 13. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Build dies with `Killed` | Out of memory. Confirm swap is on (§5.2): `free -h`. |
| `502 Bad Gateway` | An API container isn't up. `docker compose -f deploy/docker-compose.yml logs backend`. |
| `/readyz` → `not-ready` | App can't reach Postgres. Check `deploy/.env` and `logs postgres`. |
| SPA loads, API calls 404 | The `/auth/` or `/gxp/` prefix is wrong, or the `web` image wasn't rebuilt after changing the Vite vars (§7). |
| `413 Request Entity Too Large` | Upload over 25 MB. Raise `client_max_body_size` in `frontend/nginx/app.conf`. |
| Disk full | `docker system prune -af --volumes` — **`--volumes` deletes your database**. Use plain `docker image prune -f` unless you mean it. |
| `gxp_workflow_db does not exist` | `deploy/postgres/init.sql` only runs on **first** cluster init. Create it by hand: `docker compose -f deploy/docker-compose.yml exec postgres createdb -U "$POSTGRES_USER" gxp_workflow_db` |

Useful commands:

```bash
cd ~/org-umbrella
C="docker compose -f deploy/docker-compose.yml"
$C ps                              # status
$C logs -f --tail=100 backend      # follow one service
$C restart backend                 # restart without rebuild
$C exec postgres psql -U "$POSTGRES_USER" -d umbrella_auth_db   # psql
$C down                            # stop all (volumes survive)
```

Reaching Postgres from your laptop, without exposing it publicly:

```bash
ssh -i umbrella-test-key.pem -L 5432:localhost:5432 ubuntu@EC2_IP
# then point your client at localhost:5432
```
