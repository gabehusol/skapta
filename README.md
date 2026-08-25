<div align="center">

<img src="client/public/logo.png" width="120" alt="Skapta" />

# Skapta (In Progress)

**Describe your project. Get the right stack, and a codebase that already runs.**

Skapta turns a plain-English project description into a grounded tech-stack recommendation,
then generates a configured, ready-to-run monorepo as a ZIP.

[![Status](https://img.shields.io/badge/status-alpha-FD6102?style=flat-square&labelColor=252024)](#)
[![API](https://img.shields.io/badge/API-FastAPI-7f93b8?style=flat-square&labelColor=252024&logo=fastapi&logoColor=7f93b8)](api/)
[![Client](https://img.shields.io/badge/Client-React%2019%20%2B%20Vite-7f93b8?style=flat-square&labelColor=252024&logo=react&logoColor=7f93b8)](client/)
[![ML](https://img.shields.io/badge/ML-RAG%20%2B%20Pinecone-7f93b8?style=flat-square&labelColor=252024&logo=python&logoColor=7f93b8)](ml/)
[![LLM](https://img.shields.io/badge/LLM-Llama%203.3%2070B%20via%20Groq-7f93b8?style=flat-square&labelColor=252024)](ml/pipeline/rag.py)

</div>

---

## What it does

Picking a stack is where beginners lose the most time, and the available advice is either
outdated blog posts or a confident LLM inventing APIs that don't exist.

Skapta does two things, and keeps them strictly separated:

**1. Recommend.** A RAG pipeline retrieves real documentation for 17 technologies, one filtered
query per stack category, reranks it per technology, and asks an LLM to pick a stack from a
fixed menu, with a reason and alternatives for every layer plus the doc sources it actually
read.

**2. Generate.** A deterministic engine assembles hand-written, compile-tested snippets into a
working monorepo: client, server, auth guards, database layer, Docker and deploy config,
`.env.example` files, setup scripts and a tailored README, streamed back as a ZIP.

> The LLM decides **what** to build with. Static, verified templates decide **how** it's wired.
> No generated code is ever written by the model.

## Using it

1. Describe your project in the input box. The more detail, the better the stack.
2. Skapta returns five cards (frontend, backend, database, auth, deployment), each with a
   reason and alternatives. Swap any choice you disagree with, and toggle off any add-ons
   you don't want.
3. Hit **Generate project**. You get a ZIP containing the whole monorepo. Unzip it, run
   `./setup.sh` (or `setup.bat` on Windows), fill in the `.env` files, and it runs.

Incompatible combinations are rejected before anything is generated, with an error naming
the supported alternatives.

## Running it locally

**Prerequisites:** Python 3.10+, Node 20+ with pnpm, a [Groq](https://console.groq.com) API
key, and a Pinecone index (768 dimensions, cosine metric).

```bash
# API
cd api
python -m venv venv && source venv/bin/activate     # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                 # fill in your keys
uvicorn main:app --port 8000 --reload

# Client (second terminal)
cd client
pnpm install
pnpm dev
```

The client runs at http://localhost:5173, the API at http://localhost:8000, and interactive
API docs at http://localhost:8000/docs. On Windows, `./start.ps1` launches both at once.

### Environment

`api/.env` covers both the API and the RAG pipeline when uvicorn runs from `api/`:

| Variable | Required | Purpose |
|---|:---:|---|
| `GROQ_API_KEY` | yes | LLM inference for recommendations |
| `PINECONE_API_KEY` | yes | Vector search over the ingested docs |
| `PINECONE_INDEX_NAME` | yes | Index holding the embedded doc chunks |
| `ALLOWED_ORIGINS` | no | Comma-separated CORS allowlist |

To rebuild the vector index from `ml/data/sources.json` (17 technologies, 85 doc URLs):
`pip install requests beautifulsoup4` then `python -m ingest.run_ingestion` from `ml/`.

## What it can build

| Layer | Options |
|---|---|
| Frontend | React + Vite, Next.js, Vue + Vite |
| Backend | Node.js + Express, FastAPI, Django, or none (Next.js API routes) |
| Database | PostgreSQL, MongoDB, Supabase, MySQL |
| Auth | Auth0, Supabase Auth, NextAuth, Firebase Auth |
| Deployment | Vercel, Railway, Render, AWS EC2 + Docker |
| Add-ons | Docker + Compose, GitHub Actions, Socket.io, Stripe, Cloudinary / Supabase Storage |

Four combinations are verified end to end (PERN + Auth0, Next.js + Supabase, MERN + Auth0,
FastAPI + PostgreSQL). Six more pass automated compile checks. Auth coverage is uneven by
design: Vue, FastAPI and Django are Auth0-only for now, and the validator blocks the gaps
rather than emitting a project that won't build.

## API

| Endpoint | Rate limit | Description |
|---|---|---|
| `GET /api/health` | none | Liveness, plus whether the Groq and Pinecone keys are configured |
| `POST /api/recommend` | 5/min, 50/day | Description to grounded stack recommendation |
| `POST /api/generate` | 20/min, 200/day | Stack to streamed project ZIP |

Limits are per client IP. `/recommend` is the expensive one, at one LLM call plus two local
model inferences, so it gets the tighter budget.

## Why it's built this way

**Retrieval instead of free-form prompting.** An LLM asked "what stack should I use" answers
from a training snapshot: confident, undated, and unfalsifiable. The failure mode isn't a
wrong opinion, it's a recommendation nobody can check. Grounding every answer in retrieved
docs makes the reasoning auditable and lets the index be updated without touching the model.

**The model picks from a closed menu.** `SUPPORTED_OPTIONS` enumerates every legal choice and
is injected into the prompt, so "recommended" and "buildable" are the same set by
construction. A recommendation the generator can't build is worse than none: the user gets
excited about a stack, clicks Generate, and hits a wall. The prompt asks for it and
`validate_recommendations()` enforces it, clamping any off-list choice back to a supported
one before the generator ever sees it, because a prompt rule is a request and a clamp is a
guarantee.

**Balanced retrieval, then rerank.** Raw vector similarity is a popularity contest decided by
documentation volume. A flat top-k for "real-time chat app" comes back as mostly Socket.io
chunks, and the model never sees a word about the database it's being asked to choose. So
retrieval runs one filtered query per stack category and the cross-encoder reranks within
each technology, which guarantees every category reaches the prompt grounded in its own
strongest evidence.

**Citations are assembled server-side.** The schema handed to the LLM contains only
`recommendations`. The sources come from the chunks that were actually retrieved, so a
fabricated citation is not expressible.

**Templates, never generated code.** This is the load-bearing decision. Code an LLM writes
for a scaffold is unverifiable at generation time, and the beginner it's written for has no
way to tell. Static templates give determinism, real CI-testability, and a bug that's fixed
once instead of re-rolled every request. The cost is that every new technology is real human
work, which is why the compatibility matrix is honest about what isn't built yet.

**A declarative registry instead of conditional ladders.** The first engine grew an
`if "fastapi" in backend` ladder in every function, so adding one technology meant editing
six of them. Now `manifest.py` holds technology selection as data and `composer.py` is a
generic resolver that knows only about layouts and directory walking. Adding a database is a
data edit.

**Fragments, not whole-file overrides.** Each technology contributes a fragment of
`package.json` or `requirements.txt` and the composer merges them. Whole-file override worked
for exactly one contributor and silently erased the other the moment two technologies both
needed dependencies.

**Validate before composing.** Incompatible stacks are rejected with a 400 listing every
problem at once, before a single file is assembled. The alternative is shipping a ZIP that
doesn't build, which is the worst possible outcome for someone who can't tell "this tool is
broken" from "I did something wrong".

**The env split is derived, not templated.** `VITE_*` and `NEXT_PUBLIC_*` mean "compiled into
the browser bundle", so routing variables by prefix makes secret leakage structurally
impossible instead of relying on whoever wrote the template getting it right.

## Testing

The contract that matters isn't "does the composer return the right dict", it's "does the ZIP
actually build". `python scripts/test_combo.py all` generates real projects over HTTP,
extracts them, and runs `npm install`, the framework build, the linter, `prisma generate` and
`py_compile` against the output, plus negative tests proving blocked combos return 400.

`cd ml && python evals/evaluate.py` scores 15 project descriptions against expected stacks.

<div align="center">
<br />

Built by [@gabehusol](https://github.com/gabehusol)

<sub>Skapta, from Old Norse <i>skapa</i>: "to create, to shape".</sub>

</div>
