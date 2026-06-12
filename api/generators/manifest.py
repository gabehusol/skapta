"""Declarative snippet registry (engine v2, pillar 3).

The single source of truth for *which* snippet a given technology contributes and
*where* it lands. `composer.py` is a generic resolver that reads these tables —
adding a technology to an axis is a data edit here, not surgery across the
composer's functions.

What stays as data here:
- per-tech snippet directory + how to match a stack selection string to it,
- variant→destination mappings (auth guards, db clients),
- the small conditional matrices (docker image, railway/compose variant, gitignore)
  expressed as ordered (predicate, value) rules evaluated against a `Ctx`.

What stays as code in the composer: the two frontend *layout* strategies
(`tree` vs `split`) and the directory walk — genuine structure, not a tech ladder.
"""
from dataclasses import dataclass, field


# ---------------------------------------------------------------------------
# Stack classification — predicates the conditional rules below evaluate against.
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class Ctx:
    is_python: bool      # FastAPI/Django backend
    is_django: bool      # Django backend (a subset of is_python — gets its own tooling)
    is_mongo: bool       # MongoDB database
    is_next: bool        # Next.js frontend
    has_backend: bool    # a separate server process exists
    node_backend: bool   # has_backend and not is_python (Prisma/Express territory)


# ---------------------------------------------------------------------------
# Frontend
# ---------------------------------------------------------------------------
LAYOUT_TREE = "tree"     # copy the whole dir tree under client/ (Next.js app dir)
LAYOUT_SPLIT = "split"   # flat dir: config files → client/, source → client/src/


@dataclass(frozen=True)
class Frontend:
    match: str
    dir: str
    layout: str


FRONTENDS = (
    Frontend("next", "frontend/nextjs", LAYOUT_TREE),
    Frontend("vue", "frontend/vue-vite", LAYOUT_SPLIT),
    Frontend("react", "frontend/react-vite", LAYOUT_SPLIT),
)
FRONTEND_FALLBACK = FRONTENDS[-1]  # React + Vite

# Some (frontend, auth) pairs are irreducible glue — the whole frontend app differs
# by auth, not just a pluggable provider (e.g. Next.js's auth touches layout,
# middleware, route handlers). Maps (frontend match, auth match) -> alternative dir;
# layout is inherited from the matched Frontend spec.
FRONTEND_AUTH_DIR = {
    ("next", "nextauth"): "frontend/nextjs-nextauth",
}

# In a SPLIT layout, these files live at client/ (next to package.json); everything
# else is application source and goes to client/src/.
SPLIT_ROOT_FILES = {
    "vite.config.ts",
    "tsconfig.json",
    "package.json",
    "index.html",
    ".eslintrc.cjs",
    "prettier.config.cjs",
}


# ---------------------------------------------------------------------------
# Backend
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class Backend:
    match: str
    dir: str


BACKENDS = (
    Backend("fastapi", "backend/fastapi"),
    Backend("django", "backend/django"),
    Backend("express", "backend/express"),
)
BACKEND_FALLBACK = BACKENDS[-1]  # Express (matches "node.js + express")

# Manifest files are not copied verbatim — they are merged from base + fragments.
MANIFEST_TEMPLATES = {"package.json.template", "requirements.txt.template"}


# ---------------------------------------------------------------------------
# Auth — the layer contract (see DESIGN: Layer Contracts).
# backend_variants:  backend canonical match  -> (variant file, dest path)
# frontend_provider: frontend match (react|vue|next) -> (variant file, dest path)
# client_dep:        client package.json fragment filename in the auth dir (or None)
# glue:              irreducible combo files (frontend match, variant file, dest path)
# ---------------------------------------------------------------------------
_EXPRESS_GUARD = ("express.ts", "server/src/middleware/auth.ts")
_FASTAPI_GUARD = ("fastapi.py", "server/auth/provider.py")
_DJANGO_GUARD = ("django.py", "server/auth/provider.py")
_REACT_PROVIDER = ("react-provider.tsx", "client/src/providers/AuthProvider.tsx")
_NEXT_PROVIDER = ("nextjs-provider.tsx", "client/src/providers/AuthProvider.tsx")


@dataclass(frozen=True)
class Auth:
    match: str
    dir: str
    backend_variants: dict = field(default_factory=dict)
    frontend_provider: dict = field(default_factory=dict)
    client_dep: str | None = None   # client package.json fragment in the auth dir
    glue: tuple = ()


AUTHS = (
    Auth("supabase", "auth/supabase-auth",
         backend_variants={"express": _EXPRESS_GUARD},
         glue=(("next", "nextjs.ts", "client/lib/supabase/middleware.ts"),)),
    Auth("nextauth", "auth/nextauth",
         backend_variants={"express": _EXPRESS_GUARD},
         frontend_provider={"next": _NEXT_PROVIDER}),
    Auth("firebase", "auth/firebase-auth",
         backend_variants={"express": _EXPRESS_GUARD, "fastapi": _FASTAPI_GUARD},
         frontend_provider={"react": _REACT_PROVIDER, "next": _NEXT_PROVIDER},
         client_dep="client.package.deps.json"),
    Auth("auth0", "auth/auth0",
         backend_variants={"express": _EXPRESS_GUARD, "fastapi": _FASTAPI_GUARD, "django": _DJANGO_GUARD},
         frontend_provider={"react": _REACT_PROVIDER, "next": _NEXT_PROVIDER},
         client_dep="client.package.deps.json"),
)
# No auth fallback: an unrecognised auth contributes no files (matches v1 behaviour).


# ---------------------------------------------------------------------------
# Database — emits: (variant file, dest path, predicate attr on Ctx | None)
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class Database:
    match: str
    dir: str
    emits: tuple = ()


DATABASES = (
    Database("supabase", "database/supabase", (
        ("client-nextjs.ts", "client/lib/supabase/client.ts", None),
        ("server-nextjs.ts", "client/lib/supabase/server.ts", None),
    )),
    Database("mongo", "database/mongodb", (
        ("mongoose-express.ts", "server/src/db/connection.ts", None),
        ("example-express.ts", "server/src/routes/example.ts", None),
    )),
    Database("mysql", "database/mysql", (
        # Prisma (MySQL provider) — same shape as postgres, node backends only.
        ("schema.prisma", "server/prisma/schema.prisma", "node_backend"),
        ("prisma-express.ts", "server/src/db/connection.ts", "node_backend"),
    )),
    Database("postgres", "database/postgresql", (
        # FastAPI/Django use psycopg2 from the backend snippet — Prisma is node-only.
        ("schema.prisma", "server/prisma/schema.prisma", "node_backend"),
        ("prisma-express.ts", "server/src/db/connection.ts", "node_backend"),
    )),
)
DATABASE_FALLBACK = DATABASES[-1]  # PostgreSQL


# ---------------------------------------------------------------------------
# Deployment — ordered (predicate attr | None, filename) rules. First match wins.
# ---------------------------------------------------------------------------
# Django rules are listed before the generic python rules (is_python is also true
# for Django) so Django gets its own gunicorn/manage.py variants; FastAPI keeps the
# python variants unchanged.
DOCKERFILE_RULES = (
    ("is_django", "Dockerfile.django"),
    ("is_python", "Dockerfile.python"),
    ("is_mongo", "Dockerfile.node-mongo"),
    (None, "Dockerfile.node"),
)
COMPOSE_RULES = (
    ("is_django", "docker-compose.django-pg.yml"),
    ("is_mongo", "docker-compose.node-mongo.yml"),
    ("is_python", "docker-compose.python-pg.yml"),
    (None, "docker-compose.node-pg.yml"),
)
RAILWAY_RULES = (
    ("is_django", "railway.django.toml"),
    ("is_python", "railway.python.toml"),
    ("is_mongo", "railway.node-mongo.toml"),
    (None, "railway.toml"),
)
RENDER_RULES = (
    ("is_django", "render.django.yaml"),
    ("is_python", "render.python.yaml"),
    ("is_mongo", "render.node-mongo.yaml"),
    (None, "render.node.yaml"),
)

# Variant-picking deployment targets: deployment match -> (snippet dir, variant rules, dest).
DEPLOY_VARIANT = {
    "railway": ("deployment/railway", RAILWAY_RULES, "railway.toml"),
    "render": ("deployment/render", RENDER_RULES, "render.yaml"),
}

# Deployment targets that emit a single fixed file: deployment match -> (src, dest).
DEPLOY_FIXED = {
    "vercel": ("deployment/vercel/vercel.json", "vercel.json"),
}


# ---------------------------------------------------------------------------
# Shared
# ---------------------------------------------------------------------------
GITIGNORE_RULES = (
    ("is_next", "gitignore.next"),
    ("is_python", "gitignore.python"),
    (None, "gitignore.node"),
)
