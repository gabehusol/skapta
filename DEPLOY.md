# Skapta — Deployment Plan

> **Status: plan only. Nothing here has been executed.**
> Execute it yourself — several steps need your accounts and create billable resources.
> Secrets are referred to by variable name only; never commit real values.

---

## 0. What we're deploying

| Piece | Where |
|---|---|
| `client/` — React + Vite SPA | **Vercel** (free, CDN, instant redeploys) |
| `api/` — FastAPI (RAG + generate) | **Railway** (persistent process, free tier) |
| Pinecone, Groq | External SaaS — api calls them, no change |

`https://skapta.dev` (Vercel) → calls `https://api.skapta.dev` (Railway) → calls Pinecone + Groq.

---

## 1. Read this first — the api is RAM-heavy

The api loads two ML models for `/api/recommend`:
- `all-mpnet-base-v2` (sentence-transformers, ~420 MB)
- `cross-encoder/ms-marco-MiniLM-L-6-v2` (reranker, ~90 MB)

Resident footprint once loaded: **~1.2–1.6 GB**.

These are cached as singletons via `@lru_cache` — they load once on first request and stay in memory. This is why serverless (Vercel Functions, Lambda) doesn't work for the api: cold starts would reload the models on every request.

Railway's free tier gives 512 MB RAM. **Upgrade to the $5/mo Starter plan (8 GB RAM)** before going live — the free tier will OOM on the first recommend call.

---

## 2. Backend — Railway

1. Push the repo to GitHub (if not done).
2. Go to https://railway.app → **New Project** → **Deploy from GitHub repo** → select `skapta`.
3. Railway auto-detects Python. Set the **root directory** to `api/` and the **start command** to:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
4. Add environment variables in Railway's dashboard (Settings → Variables):

   | Variable | Value |
   |---|---|
   | `PINECONE_API_KEY` | your key |
   | `PINECONE_INDEX_NAME` | `skapta-docs` |
   | `GROQ_API_KEY` | your key |
   | `ALLOWED_ORIGINS` | `https://skapta.dev,https://www.skapta.dev` |

5. Under Settings → Networking, generate a **public domain** or add a custom domain (`api.skapta.dev`).
6. Verify: `https://api.skapta.dev/api/health` should return all green once env vars are set.

**On redeploy:** Railway redeploys automatically on every push to `main`.

---

## 3. Frontend — Vercel

1. Go to https://vercel.com → **Add New Project** → import the GitHub repo.
2. Set the **root directory** to `client/` and the **framework preset** to Vite.
3. Add one environment variable:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://api.skapta.dev` |

4. Deploy. Vercel gives you a `*.vercel.app` URL immediately.
5. Add your custom domain `skapta.dev` in Vercel's domain settings.

**On redeploy:** push to `main` and Vercel redeploys automatically.

---

## 4. DNS

At your registrar (wherever `skapta.dev` is managed):

| Record | Type | Value |
|---|---|---|
| `skapta.dev` | A / ALIAS | Vercel's IP (shown in Vercel domain settings) |
| `www.skapta.dev` | CNAME | `cname.vercel-dns.com` |
| `api.skapta.dev` | CNAME | your Railway domain (e.g. `xyz.up.railway.app`) |

TLS is handled automatically by both Vercel and Railway.

---

## 5. CORS

The api reads allowed origins from the `ALLOWED_ORIGINS` env var (`config.py`). In production set:
```
ALLOWED_ORIGINS=https://skapta.dev,https://www.skapta.dev
```
If the exact frontend origin (scheme + host, no trailing slash) isn't in this list the browser blocks every api call.

---

## 6. Order of operations

1. Merge `feat/modular-generation` PR into `main`.
2. Deploy the **api** to Railway. Set env vars. Verify `/api/health` returns all green.
3. Deploy the **frontend** to Vercel. Set `VITE_API_URL`. Verify the UI loads.
4. Add custom domains (`skapta.dev` on Vercel, `api.skapta.dev` on Railway). Update `ALLOWED_ORIGINS`.
5. Run the full user flow end to end on prod: describe project → get recommendations → download ZIP → unzip → follow README.
6. Post on Product Hunt / HN.

---

## 7. Cost

| Service | Free tier | After free tier |
|---|---|---|
| Vercel | Free forever for hobby | Free forever (or Pro at $20/mo for teams) |
| Railway | 512 MB / $5 credit/mo | ~$5/mo Starter (8 GB RAM — needed for ML models) |
| Pinecone | Free tier (existing) | Pay as you grow |
| Groq | Free tier (existing) | Pay as you grow |
| Domain | ~$10/yr (existing) | ~$10/yr |

**Realistic cost at launch: ~$5/mo** (Railway Starter for the RAM).
