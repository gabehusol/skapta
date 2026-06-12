import io
from models.generate import GenerateRequest, StackSelection

from generators.composer import compose
from generators.shared_generator import generate_shared_files
from generators.zip_builder import build_zip

# --- Compatibility matrix from DESIGN.md ---

_DB_AUTH = {
    "postgresql": {"auth0", "nextauth", "firebase auth", "supabase"},
    "mongodb": {"auth0", "firebase auth", "nextauth"},
    "supabase": {"supabase", "auth0"},
    "mysql": {"auth0", "nextauth", "firebase auth"},
}

_FRONTEND_BACKEND = {
    "next.js": {None, "node.js + express"},
    "react + vite": {"node.js + express", "fastapi", "django"},
    "vue + vite": {"node.js + express", "fastapi", "django"},
}

# Auth options supported by each frontend (where the frontend has hardcoded
# provider coupling). Vue + Vite wires Auth0 directly in main.ts / DashboardView.vue;
# other providers would require a separate auth layer contract implementation.
_FRONTEND_AUTH = {
    "vue + vite": {"auth0"},
}

# Auth options that have a server-side auth middleware for each backend.
# Combos not listed here would generate a backend that imports requireAuth/require_auth
# but no middleware file exists -- causing a build/import failure at startup.
_BACKEND_AUTH = {
    "fastapi": {"auth0"},           # auth0/fastapi.py exists
    "django": {"auth0"},            # auth0/django.py exists
    # Express supports: auth0, supabase, firebase auth (nextauth/express.ts missing)
    "node.js + express": {"auth0", "supabase", "firebase auth"},
}
_BACKEND_AUTH_HINT = {
    "fastapi": "Auth0",
    "django": "Auth0",
    "node.js + express": "Auth0, Supabase, or Firebase Auth",
}

_BLOCKED = [
    ("mongodb", "supabase auth", "MongoDB is not compatible with Supabase Auth"),
    ("next.js", "django", "Next.js with a Django backend is redundant -- Next.js has built-in API routes"),
    ("vercel", "fastapi", "Vercel does not support FastAPI (serverless Python has caveats -- use Railway or Render)"),
    ("vercel", "django", "Vercel does not support Django (use Railway or Render)"),
]


def _normalize(s: str) -> str:
    return s.lower().strip()


def _no_backend(backend: str) -> bool:
    """True when the stack has no separate backend service (e.g. Next.js API routes)."""
    b = backend.strip()
    if b in ("", "none", "n/a", "-", "--"):
        return True
    return "api route" in b or "built-in" in b or "built in" in b


def validate_stack(stack: StackSelection) -> list[str]:
    """Returns a list of error messages. Empty list = valid."""
    errors: list[str] = []

    frontend = _normalize(stack.frontend)
    backend = _normalize(stack.backend)
    db = _normalize(stack.database)
    auth = _normalize(stack.auth)
    deployment = _normalize(stack.deployment)

    # Explicit blocked combinations
    db_auth_blocked = False
    for blocked_a, blocked_b, msg in _BLOCKED:
        if blocked_a in db and blocked_b in auth:
            errors.append(msg)
            db_auth_blocked = True
        if blocked_a in frontend and blocked_b in backend:
            errors.append(msg)
        if blocked_a in deployment and blocked_b in backend:
            errors.append(msg)

    # DB -> Auth compatibility (skip if an explicit block already covered this pair)
    db_key = next((k for k in _DB_AUTH if k in db), None)
    if db_key and not db_auth_blocked:
        allowed_auths = _DB_AUTH[db_key]
        auth_matched = any(a in auth for a in allowed_auths)
        if not auth_matched:
            errors.append(
                f"{stack.database} is not compatible with {stack.auth}. "
                f"Supported auth options: {', '.join(sorted(allowed_auths))}"
            )

    # Frontend -> Backend compatibility
    fe_key = next((k for k in _FRONTEND_BACKEND if k in frontend), None)
    if fe_key:
        allowed_backends = _FRONTEND_BACKEND[fe_key]
        if _no_backend(backend):
            # A frontend with no separate backend is valid iff None is allowed
            # (e.g. Next.js, which has built-in API routes).
            backend_matched = None in allowed_backends
        else:
            backend_matched = any(
                b is not None and b in backend for b in allowed_backends
            )
        if not backend_matched:
            errors.append(
                f"{stack.frontend} is not compatible with {stack.backend}."
            )

    # Frontend -> Auth compatibility (where the frontend couples to a specific provider)
    fe_auth_key = next((k for k in _FRONTEND_AUTH if k in frontend), None)
    if fe_auth_key:
        allowed_auths = _FRONTEND_AUTH[fe_auth_key]
        if not any(a in auth for a in allowed_auths):
            errors.append(
                f"{stack.frontend} currently supports Auth0 only. "
                f"Support for {stack.auth} with Vue + Vite is coming soon."
            )

    # Backend -> Auth compatibility (auth middleware must exist for the backend)
    be_auth_key = next((k for k in _BACKEND_AUTH if k in backend), None)
    if be_auth_key and not _no_backend(backend):
        allowed_auths = _BACKEND_AUTH[be_auth_key]
        if not any(a in auth for a in allowed_auths):
            hint = _BACKEND_AUTH_HINT.get(be_auth_key, "Auth0")
            errors.append(
                f"{stack.backend} currently supports {hint} only. "
                f"{stack.auth} auth middleware for {stack.backend} is not yet implemented."
            )

    # Dedupe while preserving order
    seen: set[str] = set()
    unique: list[str] = []
    for e in errors:
        if e not in seen:
            seen.add(e)
            unique.append(e)
    return unique


def generate_project(request: GenerateRequest) -> io.BytesIO:
    errors = validate_stack(request.stack)
    if errors:
        raise ValueError("; ".join(errors))

    project_name = request.project_name.strip() or "my-app"

    snippet_files = compose(request.stack, request.options, project_name)
    shared_files = generate_shared_files(request.stack, request.options, project_name)

    all_files = {**snippet_files, **shared_files}
    return build_zip(all_files, project_name)
