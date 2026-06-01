import os
from pathlib import Path
from models.generate import StackSelection, GenerationOptions

SNIPPETS_DIR = Path(__file__).parent.parent / "snippets"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load(rel_path: str, project_name: str) -> str:
    content = _read(SNIPPETS_DIR / rel_path)
    return content.replace("{{PROJECT_NAME}}", project_name)


# Frontend files that belong at the client root; everything else goes under client/src/
_FRONTEND_ROOT_FILES = {
    "vite.config.ts",
    "tsconfig.json",
    "package.json",
    "index.html",
}


def _frontend_snippets(stack: StackSelection, project_name: str) -> dict[str, str]:
    frontend = stack.frontend.lower()

    if "next" in frontend:
        base = "frontend/nextjs"
        dest = "client"
    elif "vue" in frontend:
        base = "frontend/vue-vite"
        dest = "client"
    else:
        base = "frontend/react-vite"
        dest = "client"

    files: dict[str, str] = {}
    src_dir = SNIPPETS_DIR / base

    if not src_dir.exists():
        return files

    for f in src_dir.iterdir():
        if f.is_file():
            dest_name = f.name.replace(".template", "")
            if dest_name in _FRONTEND_ROOT_FILES:
                target = f"{dest}/{dest_name}"
            else:
                target = f"{dest}/src/{dest_name}"
            files[target] = _load(f"{base}/{f.name}", project_name)

    return files


def _backend_snippets(stack: StackSelection, project_name: str) -> dict[str, str]:
    backend = stack.backend.lower()

    if "fastapi" in backend:
        base = "backend/fastapi"
        dest = "server"
    elif "django" in backend:
        base = "backend/django"
        dest = "server"
    else:
        base = "backend/express"
        dest = "server"

    files: dict[str, str] = {}
    src_dir = SNIPPETS_DIR / base

    if not src_dir.exists():
        return files

    for f in src_dir.rglob("*"):
        if f.is_file():
            rel = f.relative_to(SNIPPETS_DIR / base)
            dest_name = str(rel).replace(".template", "")
            files[f"{dest}/{dest_name}"] = _load(f"{base}/{rel}", project_name)

    return files


def _auth_snippets(stack: StackSelection, project_name: str) -> dict[str, str]:
    auth = stack.auth.lower()
    backend = stack.backend.lower()
    frontend = stack.frontend.lower()

    files: dict[str, str] = {}

    if "auth0" in auth:
        auth_dir = "auth/auth0"
    elif "supabase" in auth:
        auth_dir = "auth/supabase-auth"
    elif "nextauth" in auth:
        auth_dir = "auth/nextauth"
    elif "firebase" in auth:
        auth_dir = "auth/firebase-auth"
    else:
        return files

    src_dir = SNIPPETS_DIR / auth_dir
    if not src_dir.exists():
        return files

    # Backend middleware variant
    if "fastapi" in backend:
        variant = "fastapi.py"
        dest_path = "server/src/middleware/auth.py"
    elif "django" in backend:
        variant = "django.py"
        dest_path = "server/middleware/auth.py"
    else:
        variant = "express.ts"
        dest_path = "server/src/middleware/auth.ts"

    backend_file = src_dir / variant
    if backend_file.exists():
        files[dest_path] = _load(f"{auth_dir}/{variant}", project_name)

    # Frontend provider variant
    if "next" in frontend:
        fe_variant = "nextjs-provider.tsx"
        fe_dest = "client/src/providers/AuthProvider.tsx"
    else:
        fe_variant = "react-provider.tsx"
        fe_dest = "client/src/providers/AuthProvider.tsx"

    fe_file = src_dir / fe_variant
    if fe_file.exists():
        files[fe_dest] = _load(f"{auth_dir}/{fe_variant}", project_name)

    return files


def _database_snippets(stack: StackSelection, project_name: str) -> dict[str, str]:
    db = stack.database.lower()
    backend = stack.backend.lower()

    files: dict[str, str] = {}

    if "postgresql" in db or "postgres" in db or "supabase" in db:
        db_dir = "database/postgresql"
    elif "mongodb" in db or "mongo" in db:
        db_dir = "database/mongodb"
    elif "mysql" in db:
        db_dir = "database/mysql"
    else:
        return files

    src_dir = SNIPPETS_DIR / db_dir
    if not src_dir.exists():
        return files

    # Schema file (Prisma)
    schema = src_dir / "schema.prisma"
    if schema.exists():
        files["server/prisma/schema.prisma"] = _load(f"{db_dir}/schema.prisma", project_name)

    # Connection file variant
    if "fastapi" in backend:
        conn_variant = "psycopg2-fastapi.py"
        conn_dest = "server/db/connection.py"
    else:
        conn_variant = "prisma-express.ts"
        conn_dest = "server/src/db/connection.ts"

    conn_file = src_dir / conn_variant
    if conn_file.exists():
        files[conn_dest] = _load(f"{db_dir}/{conn_variant}", project_name)

    return files


def _docker_snippets(stack: StackSelection, project_name: str) -> dict[str, str]:
    backend = stack.backend.lower()
    db = stack.database.lower()
    docker_dir = SNIPPETS_DIR / "deployment/docker"

    files: dict[str, str] = {}
    if not docker_dir.exists():
        return files

    if "fastapi" in backend or "django" in backend:
        dockerfile = "Dockerfile.python"
    else:
        dockerfile = "Dockerfile.node"

    df = docker_dir / dockerfile
    if df.exists():
        # docker-compose builds with context ./server, so the Dockerfile lives there
        files["server/Dockerfile"] = _load(f"deployment/docker/{dockerfile}", project_name)

    if "mongo" in db:
        compose = "docker-compose.node-mongo.yml"
    elif "fastapi" in backend or "django" in backend:
        compose = "docker-compose.python-pg.yml"
    else:
        compose = "docker-compose.node-pg.yml"

    cf = docker_dir / compose
    if cf.exists():
        files["docker-compose.yml"] = _load(f"deployment/docker/{compose}", project_name)

    return files


def _deployment_snippets(stack: StackSelection, project_name: str) -> dict[str, str]:
    deployment = stack.deployment.lower()
    additional = " ".join(stack.additional).lower()

    files: dict[str, str] = {}

    # Docker can be the deployment target or an "additional" selection
    if "docker" in deployment or "aws" in deployment or "docker" in additional:
        files.update(_docker_snippets(stack, project_name))

    if "vercel" in deployment:
        vf = SNIPPETS_DIR / "deployment/vercel/vercel.json"
        if vf.exists():
            files["vercel.json"] = _load("deployment/vercel/vercel.json", project_name)

    elif "railway" in deployment:
        rf = SNIPPETS_DIR / "deployment/railway/railway.toml"
        if rf.exists():
            files["railway.toml"] = _load("deployment/railway/railway.toml", project_name)

    elif "render" in deployment:
        rf = SNIPPETS_DIR / "deployment/render/render.yaml"
        if rf.exists():
            files["render.yaml"] = _load("deployment/render/render.yaml", project_name)

    return files


def _shared_snippets(stack: StackSelection, project_name: str) -> dict[str, str]:
    backend = stack.backend.lower()
    shared_dir = SNIPPETS_DIR / "shared"

    files: dict[str, str] = {}

    if "fastapi" in backend or "django" in backend:
        gi = shared_dir / "gitignore.python"
    else:
        gi = shared_dir / "gitignore.node"

    if gi.exists():
        files[".gitignore"] = _load(f"shared/{gi.name}", project_name)

    for name in ("prettier.config.js", "eslint.config.js", "tsconfig.base.json"):
        f = shared_dir / name
        if f.exists():
            files[name] = _load(f"shared/{name}", project_name)

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
