# Skapta — Deployment Plan (AWS, free-tier first)

> **Status: plan only. Nothing here has been executed.** This is the cheapest/easiest path
> to host Skapta under an existing domain (`skapta.dev`) on AWS, biased toward the 12-month
> free tier. Execute it yourself — several steps need your AWS login and create billable
> resources. Secrets are referred to by **variable name only**; never commit real values.

---

## 0. What we're deploying

| Piece | What it is | Where it goes |
|-------|------------|---------------|
| **client/** | React + Vite SPA — static HTML/JS/CSS after `npm run build` | S3 + CloudFront (static, ~free) |
| **api/** | FastAPI — `/api/recommend` (RAG) + `/api/generate` (ZIP) | EC2 `t3.micro` (free tier) behind nginx + TLS |
| **ml/** | Not deployed as a service. The api imports the RAG pipeline in-process. | (runs inside the api) |
| **Pinecone** | Managed vector DB (already provisioned, free tier) | external SaaS — api calls it |
| **Groq** | Managed LLM (already provisioned) | external SaaS — api calls it |

Target topology: `https://skapta.dev` (frontend, CloudFront) → calls `https://api.skapta.dev`
(EC2) → which calls Pinecone + Groq over the network.

---

## 1. ⚠️ Read this before sizing the instance — the api is RAM-heavy

The api loads two local models for `/api/recommend`:
- `all-mpnet-base-v2` (sentence-transformers embedder, ~420 MB)
- `cross-encoder/ms-marco-MiniLM-L-6-v2` (reranker, ~90 MB)
plus PyTorch (CPU). Resident footprint once loaded ≈ **1.2–1.6 GB**.

**Two things to fix before/at deploy (cheap wins, big impact):**
1. **Cache the models as module-level singletons.** Today `ml/retrieval/query.py` (`embed_query`)
   and `ml/retrieval/reranker.py` (`load_reranker`) construct a *new* `SentenceTransformer` /
   `CrossEncoder` **on every request**. On a small instance that means a multi-second model
   load per `/api/recommend` call and repeated RAM spikes. Load each once at module import (or
   via `functools.lru_cache`) so they stay resident. This is the single highest-leverage change
   for making a free-tier box viable. (Logged as tech debt — do this first.)
2. **`/api/generate` and `/api/health` don't need the models.** Only `/api/recommend` does. If
   you ever split services, the generate path can run on something tiny.

**Sizing verdict:**
- `t3.micro` (2 vCPU, **1 GB RAM**, free 12 months) **+ a 4 GB swap file + the singleton fix**
  works for a low-traffic launch. First recommend call after boot is slow (model load); later
  calls are fast. Watch for OOM under concurrency.
- If you see OOM kills, step up to `t3.small` (2 GB, ~$15/mo) — not free, but the safe choice.

---

## 2. DNS (use the domain you already own — keep it free)

You already own `skapta.dev`. **Don't pay for a Route 53 hosted zone** unless you want AWS to
manage DNS. Cheapest path: add records at your current registrar/DNS:
- `skapta.dev` and `www` → CloudFront distribution domain (CNAME/ALIAS).
- `api.skapta.dev` → EC2 Elastic IP (A record).

(If you'd rather centralize in Route 53: a hosted zone is ~$0.50/mo. Optional, not required.)

TLS is free either way: ACM cert for CloudFront (frontend), Let's Encrypt/certbot on EC2 (api).

---

## 3. Frontend → S3 + CloudFront (effectively free at this scale)

1. **Build** locally with the prod API URL baked in:
   ```bash
   cd client
   echo "VITE_API_URL=https://api.skapta.dev" > .env.production
   npm ci && npm run build        # outputs client/dist/
   ```
2. **S3 bucket** (e.g. `skapta-frontend`), private; upload `dist/`. Don't use S3 website
   hosting — serve via CloudFront with Origin Access Control (OAC).
3. **ACM certificate** for `skapta.dev` + `www.skapta.dev` in **us-east-1** (CloudFront requires
   us-east-1 certs). Validate via DNS.
4. **CloudFront distribution**: origin = the S3 bucket (OAC), default root object `index.html`,
   alternate domain names `skapta.dev` + `www`, attach the ACM cert. Add an SPA error mapping:
   403/404 → `/index.html` (200) so client-side routes work.
5. **Point DNS** `skapta.dev`/`www` at the CloudFront domain.
6. **Redeploys:** re-`npm run build`, `aws s3 sync dist/ s3://skapta-frontend --delete`, then a
   CloudFront cache invalidation (`/*`).

Cost: S3 storage pennies; CloudFront has a perpetual free-tier allowance that easily covers a
launch. No always-on charge.

---

## 4. API → EC2 t3.micro + nginx + certbot

1. **Launch** an EC2 `t3.micro`, Amazon Linux 2023 or Ubuntu 22.04, free-tier AMI.
   - Allocate + associate an **Elastic IP** (so `api.skapta.dev` stays stable).
   - Security group inbound: 80, 443 from anywhere; 22 from **your IP only**.
2. **Add swap** (covers the model-load RAM spike on 1 GB):
   ```bash
   sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
   sudo mkswap /swapfile && sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
3. **Install** Python 3.12+, git, nginx. Clone the repo. Create the api venv and install:
   ```bash
   cd skapta/api
   python3 -m venv venv && . venv/bin/activate
   pip install -r requirements.txt
   ```
   (The api also needs `ml/`'s deps — it imports the RAG pipeline. Install `ml/requirements.txt`
   into the same venv, or merge them. Verify `uvicorn main:app` boots and `/api/health` is OK.)
4. **Env vars** — create `api/.env` on the instance (see §6 for the variable list). `chmod 600`.
   Do **not** commit it; it's already gitignored.
5. **systemd service** `skapta-api.service` running
   `venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000` (bind localhost; nginx fronts it).
   `Restart=always`, `WorkingDirectory=/.../api`, `EnvironmentFile=/.../api/.env`.
6. **nginx** reverse proxy: `server_name api.skapta.dev;` → `proxy_pass http://127.0.0.1:8000;`
   (proxy headers + a generous `proxy_read_timeout`, since the first recommend call loads models).
7. **TLS**: `sudo certbot --nginx -d api.skapta.dev` (free Let's Encrypt, auto-renew).
8. **Point DNS** `api.skapta.dev` → the Elastic IP, then verify `https://api.skapta.dev/api/health`.

---

## 5. CORS (the gotcha that bites every split frontend/api)

The api reads allowed origins from the `ALLOWED_ORIGINS` env var (`config.py` →
`allowed_origins_list`, comma-split). In production set:
```
ALLOWED_ORIGINS=https://skapta.dev,https://www.skapta.dev
```
If this doesn't include the exact frontend origin (scheme + host, no trailing slash), the
browser blocks every api call. Localhost default (`http://localhost:5173`) is dev-only.

---

## 6. Environment variable wiring (names only — fill real values yourself)

**`api/.env` on the EC2 instance** (server-side; never shipped to the browser):
| Variable | Purpose |
|----------|---------|
| `PINECONE_API_KEY` | Pinecone auth (already provisioned) |
| `PINECONE_INDEX_NAME` | `skapta-docs` |
| `GROQ_API_KEY` | Groq LLM auth (already provisioned) |
| `ALLOWED_ORIGINS` | `https://skapta.dev,https://www.skapta.dev` (CORS) |

**`client/.env.production` at build time** (baked into the static bundle — only put public values here):
| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | `https://api.skapta.dev` |

> The Pinecone/Groq keys live **only** on the server (EC2). They must never appear in any
> `VITE_*` var or the client build — those ship to the browser. Keep them in `api/.env`
> (mode `600`, loaded by systemd `EnvironmentFile`).

---

## 7. Order of operations (suggested)

1. (Pre-work) Apply the **model-singleton** fix in `ml/retrieval/*` and confirm `/api/recommend`
   loads models once. Re-run `scripts/test_combo.py` — generation is unaffected.
2. Stand up the **API** (EC2 → swap → deps → env → systemd → nginx → certbot → DNS). Verify
   `/api/health` then `/api/recommend` over HTTPS.
3. Build + ship the **frontend** (S3 → ACM → CloudFront → DNS) with `VITE_API_URL` pointed at
   the live api.
4. Set `ALLOWED_ORIGINS` to the real frontend origins; restart the api; test end to end from
   `https://skapta.dev` (analyze → recommend → generate → ZIP download).

---

## 8. Cheaper / simpler alternatives (if AWS friction isn't worth it)

- **Frontend on a free static host** (Cloudflare Pages / Vercel hobby) + **api on Render or
  Railway free/cheap tier** is the lowest-effort path and matches what Skapta itself generates.
  The RAM caveat (§1) still applies — pick an api plan with ≥2 GB or apply the singleton fix.
- **AWS Lightsail** ($5/mo, 1 GB, or $10/mo 2 GB) is a simpler single-box alternative to raw EC2
  with predictable pricing and a built-in static-IP + firewall UI.

Estimated steady-state cost on the AWS free-tier path: **~$0/mo for the first 12 months**
(t3.micro 750h + CloudFront/S3 free allowances), then roughly **$8–15/mo** depending on whether
you stay on t3.micro or move to t3.small.
