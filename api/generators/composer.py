"""Generic composition engine (engine v2, pillar 3).

Reads the declarative registry in `manifest.py` and assembles the file map for a
stack. There are no `if "fastapi" in backend` ladders here — technology selection
is data (the registry); this module only knows the *structural* operations
(directory walk, the two frontend layouts, manifest merging).
"""
from pathlib import Path

from models.generate import StackSelection, GenerationOptions
from generators import manifest as M
from generators.fragments import merge_package_json, merge_requirements

SNIPPETS_DIR = Path(__file__).parent.parent / "snippets"


def _load(rel_path: str, project_name: str) -> str:
    content = (SNIPPETS_DIR / rel_path).read_text(encoding="utf-8")
    return content.replace("{{PROJECT_NAME}}", project_name)


def _exists(rel_path: str) -> bool:
    return (SNIPPETS_DIR / rel_path).exists()


# ---------------------------------------------------------------------------
# Registry resolution
# ---------------------------------------------------------------------------
def _match(selection: str, table, fallback=None):
    """First registry entry whose `match` substring is in the selection, else fallback."""
    s = (selection or "").lower()
    for spec in table:
        if spec.match in s:
            return spec
    return fallback


def _has_backend(backend: str) -> bool:
    b = (backend or "").strip().lower()
    return bool(b) and b != "none"


def _ctx(stack: StackSelection) -> M.Ctx:
    backend = stack.backend.lower()
    is_django = "django" in backend
    is_python = "fastapi" in backend or is_django
    has_backend = _has_backend(stack.backend)
    return M.Ctx(
        is_python=is_python,
        is_django=is_django,
        is_mongo="mongo" in stack.database.lower(),
        is_next="next" in stack.frontend.lower(),
        has_backend=has_backend,
        node_backend=has_backend and not is_python,
    )


def _select(ctx: M.Ctx, rules) -> str | None:
    """First (predicate, value) rule whose predicate holds. `None` predicate = always."""
    for pred, value in rules:
        if pred is None or getattr(ctx, pred):
            return value
    return None


# ---------------------------------------------------------------------------
# Frontend
# ---------------------------------------------------------------------------
def _frontend_snippets(stack: StackSelection, project_name: str) -> dict[str, str]:
    spec = _match(stack.frontend, M.FRONTENDS, M.FRONTEND_FALLBACK)
    files: dict[str, str] = {}
    if not _exists(spec.dir):
        return files

    if spec.layout == M.LAYOUT_TREE:
        # Preserve the full directory tree under client/ (e.g. Next.js app dir).
        for f in (SNIPPETS_DIR / spec.dir).rglob("*"):
            if f.is_file():
                rel = f.relative_to(SNIPPETS_DIR / spec.dir).as_posix()
                files[f"client/{rel.replace('.template', '')}"] = _load(f"{spec.dir}/{rel}", project_name)
        return files

    # SPLIT: flat dir — config files at client/, application source at client/src/.
    # package.json is composed from base + the auth provider's client fragment (so the
    # auth frontend dep — e.g. @auth0/auth0-react vs firebase — isn't hardcoded in the base).
    for f in (SNIPPETS_DIR / spec.dir).iterdir():
        if f.is_file() and f.name != "package.json.template":
            name = f.name.replace(".template", "")
            target = f"client/{name}" if name in M.SPLIT_ROOT_FILES else f"client/src/{name}"
            files[target] = _load(f"{spec.dir}/{f.name}", project_name)

    if _exists(f"{spec.dir}/package.json.template"):
        base = _load(f"{spec.dir}/package.json.template", project_name)
        fragments = _client_dep_fragments(stack, spec, project_name)
        files["client/package.json"] = (
            merge_package_json(base, *fragments) if fragments else base
        )
    return files


def _client_dep_fragments(stack: StackSelection, fe_spec, project_name: str) -> list[str]:
    """Client package.json fragments the auth provider contributes — only for the
    React SPA contract (`react-provider.tsx`). Vue keeps its Auth0 dep baked into its
    own package.json (it isn't part of the pluggable React frontend contract)."""
    if fe_spec.match != "react":
        return []
    auth = _match(stack.auth, M.AUTHS)
    if auth is None or not auth.client_dep:
        return []
    rel = f"{auth.dir}/{auth.client_dep}"
    return [_load(rel, project_name)] if _exists(rel) else []


# ---------------------------------------------------------------------------
# Backend (+ merged server manifest)
# ---------------------------------------------------------------------------
def _manifest_fragments(stack: StackSelection, project_name: str, filename: str) -> list[str]:
    """Fragments contributing to a merged server manifest (package.json /
    requirements.txt): the database's and the auth provider's, if present."""
    dirs: list[str] = [_match(stack.database, M.DATABASES, M.DATABASE_FALLBACK).dir]
    auth = _match(stack.auth, M.AUTHS)
    if auth is not None:
        dirs.append(auth.dir)
    return [_load(f"{d}/{filename}", project_name) for d in dirs if _exists(f"{d}/{filename}")]


def _backend_snippets(stack: StackSelection, project_name: str) -> dict[str, str]:
    if not _has_backend(stack.backend):
        return {}  # e.g. Next.js with built-in API routes
    spec = _match(stack.backend, M.BACKENDS, M.BACKEND_FALLBACK)
    files: dict[str, str] = {}
    if not _exists(spec.dir):
        return files

    for f in (SNIPPETS_DIR / spec.dir).rglob("*"):
        if f.is_file() and f.name not in M.MANIFEST_TEMPLATES:
            rel = f.relative_to(SNIPPETS_DIR / spec.dir).as_posix()
            files[f"server/{rel.replace('.template', '')}"] = _load(f"{spec.dir}/{rel}", project_name)

    # Server manifest is composed: backend base merged with db + auth fragments.
    if _exists(f"{spec.dir}/package.json.template"):
        files["server/package.json"] = merge_package_json(
            _load(f"{spec.dir}/package.json.template", project_name),
            *_manifest_fragments(stack, project_name, "package.deps.json"),
        )
    if _exists(f"{spec.dir}/requirements.txt.template"):
        files["server/requirements.txt"] = merge_requirements(
            _load(f"{spec.dir}/requirements.txt.template", project_name),
            *_manifest_fragments(stack, project_name, "requirements.frag.txt"),
        )
    return files


# ---------------------------------------------------------------------------
# Auth (layer contract)
# ---------------------------------------------------------------------------
def _emit(files: dict[str, str], snippet_dir: str, variant: str, dest: str, project_name: str) -> None:
    if _exists(f"{snippet_dir}/{variant}"):
        files[dest] = _load(f"{snippet_dir}/{variant}", project_name)


def _auth_snippets(stack: StackSelection, project_name: str) -> dict[str, str]:
    spec = _match(stack.auth, M.AUTHS)
    files: dict[str, str] = {}
    if spec is None or not _exists(spec.dir):
        return files

    # Backend guard (the requireAuth/require_auth contract), keyed on the backend.
    if _has_backend(stack.backend):
        backend = _match(stack.backend, M.BACKENDS, M.BACKEND_FALLBACK)
        variant_dest = spec.backend_variants.get(backend.match)
        if variant_dest:
            _emit(files, spec.dir, *variant_dest, project_name)

    # Frontend provider, keyed on the frontend framework (react | vue | next) so a
    # React provider never leaks into a Vue project (and vice-versa).
    fe = _match(stack.frontend, M.FRONTENDS, M.FRONTEND_FALLBACK)
    variant_dest = spec.frontend_provider.get(fe.match)
    if variant_dest:
        _emit(files, spec.dir, *variant_dest, project_name)

    # Irreducible combo glue (e.g. Supabase Auth's Next.js middleware).
    frontend = stack.frontend.lower()
    for fmatch, variant, dest in spec.glue:
        if fmatch in frontend:
            _emit(files, spec.dir, variant, dest, project_name)

    return files


# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
def _database_snippets(stack: StackSelection, project_name: str) -> dict[str, str]:
    spec = _match(stack.database, M.DATABASES, M.DATABASE_FALLBACK)
    files: dict[str, str] = {}
    if not _exists(spec.dir):
        return files
    ctx = _ctx(stack)
    for variant, dest, pred in spec.emits:
        if pred and not getattr(ctx, pred):
            continue
        _emit(files, spec.dir, variant, dest, project_name)
    return files


# ---------------------------------------------------------------------------
# Deployment
# ---------------------------------------------------------------------------
def _docker_snippets(stack: StackSelection, project_name: str) -> dict[str, str]:
    files: dict[str, str] = {}
    if not _exists("deployment/docker"):
        return files
    ctx = _ctx(stack)

    dockerfile = _select(ctx, M.DOCKERFILE_RULES)
    if dockerfile:
        # docker-compose build context is ./server, so the Dockerfile lives there.
        _emit(files, "deployment/docker", dockerfile, "server/Dockerfile", project_name)
    compose = _select(ctx, M.COMPOSE_RULES)
    if compose:
        _emit(files, "deployment/docker", compose, "docker-compose.yml", project_name)
    return files


def _deployment_snippets(stack: StackSelection, project_name: str) -> dict[str, str]:
    deployment = stack.deployment.lower()
    additional = " ".join(stack.additional).lower()
    files: dict[str, str] = {}

    # Docker: included when it's the deployment target, AWS EC2, or an additional pick.
    if "docker" in deployment or "aws" in deployment or "docker" in additional:
        files.update(_docker_snippets(stack, project_name))

    ctx = _ctx(stack)
    for key, (snippet_dir, rules, dest) in M.DEPLOY_VARIANT.items():
        if key in deployment:
            variant = _select(ctx, rules)
            if variant:
                _emit(files, snippet_dir, variant, dest, project_name)
            return files
    for key, (src, dest) in M.DEPLOY_FIXED.items():
        if key in deployment:
            rel_dir, fname = src.rsplit("/", 1)
            _emit(files, rel_dir, fname, dest, project_name)
    return files


# ---------------------------------------------------------------------------
# Shared (computed-adjacent: gitignore + vestigial tsconfig base)
# ---------------------------------------------------------------------------
def _shared_snippets(stack: StackSelection, project_name: str) -> dict[str, str]:
    ctx = _ctx(stack)
    files: dict[str, str] = {}

    gitignore = _select(ctx, M.GITIGNORE_RULES)
    if gitignore:
        _emit(files, "shared", gitignore, ".gitignore", project_name)

    # tsconfig.base.json is emitted for human reference on monorepos with a Node server.
    if not ctx.is_next:
        _emit(files, "shared", "tsconfig.base.json", "tsconfig.base.json", project_name)
    return files


def compose(
    stack: StackSelection,
    options: GenerationOptions,
    project_name: str,
) -> dict[str, str]:
    files: dict[str, str] = {}
    files.update(_frontend_snippets(stack, project_name))
    files.update(_backend_snippets(stack, project_name))
    files.update(_auth_snippets(stack, project_name))
    files.update(_database_snippets(stack, project_name))
    files.update(_deployment_snippets(stack, project_name))
    files.update(_shared_snippets(stack, project_name))
    return files
