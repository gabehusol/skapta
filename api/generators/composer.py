from pathlib import Path
from models.generate import StackSelection, GenerationOptions

SNIPPETS_DIR = Path(__file__).parent.parent / "snippets"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load(rel_path: str, project_name: str) -> str:
    content = _read(SNIPPETS_DIR / rel_path)
    return content.replace("{{PROJECT_NAME}}", project_name)


# Files that belong at the react-vite client root (not client/src/)
_REACT_VITE_ROOT_FILES = {
    "vite.config.ts",
    "tsconfig.json",
    "package.json",
    "index.html",
    ".eslintrc.cjs",
    "prettier.config.cjs",
}


def _frontend_snippets(stack: StackSelection, project_name: str) -> dict[str, str]:
    frontend = stack.frontend.lower()
    files: dict[str, str] = {}

    if "next" in frontend:
        # Next.js: preserve the full directory tree under client/ with no src/ remapping.
        base = "frontend/nextjs"
        src_dir = SNIPPETS_DIR / base
        if not src_dir.exists():
            return files
        for f in src_dir.rglob("*"):
            if f.is_file():
                rel = f.relative_to(src_dir)
                # Normalise Windows backslashes and strip .template suffix
                rel_posix = rel.as_posix().replace(".template", "")
                files[f"client/{rel_posix}"] = _load(f"{base}/{rel.as_posix()}", project_name)
        return files

    if "vue" in frontend:
        base = "frontend/vue-vite"
    else:
        base = "frontend/react-vite"

    src_dir = SNIPPETS_DIR / base
    if not src_dir.exists():
        return files

    # react-vite / vue-vite: flat dir; config files at client/, source files at client/src/
    for f in src_dir.iterdir():
        if f.is_file():
            dest_name = f.name.replace(".template", "")
            if dest_name in _REACT_VITE_ROOT_FILES:
                target = f"client/{dest_name}"
            else:
                target = f"client/src/{dest_name}"
            files[target] = _load(f"{base}/{f.name}", project_name)

    return files


def _backend_snippets(stack: StackSelection, project_name: str) -> dict[str, str]:
    backend = stack.backend.lower()

    # Next.js-only stacks have no separate backend process.
    if not backend or backend == "none":
        return {}

    if "fastapi" in backend:
        base = "backend/fastapi"
    elif "django" in backend:
        base = "backend/django"
    else:
        base = "backend/express"

    files: dict[str, str] = {}
    src_dir = SNIPPETS_DIR / base
    if not src_dir.exists():
        return files

    for f in src_dir.rglob("*"):
        if f.is_file():
            rel = f.relative_to(SNIPPETS_DIR / base)
            rel_posix = rel.as_posix().replace(".template", "")
            files[f"server/{rel_posix}"] = _load(f"{base}/{rel.as_posix()}", project_name)

    return files


def _auth_snippets(stack: StackSelection, project_name: str) -> dict[str, str]:
    auth = stack.auth.lower()
    backend = stack.backend.lower()
    frontend = stack.frontend.lower()

    files: dict[str, str] = {}

    if "supabase" in auth:
        auth_dir = "auth/supabase-auth"
        src_dir = SNIPPETS_DIR / auth_dir
        if not src_dir.exists():
            return files
        if "next" in frontend:
            # updateSession helper — imported by the root middleware.ts
            mw = src_dir / "nextjs.ts"
            if mw.exists():
                files["client/lib/supabase/middleware.ts"] = _load(
                    f"{auth_dir}/nextjs.ts", project_name
                )
        return files

    if "auth0" in auth:
        auth_dir = "auth/auth0"
    elif "nextauth" in auth:
        auth_dir = "auth/nextauth"
    elif "firebase" in auth:
        auth_dir = "auth/firebase-auth"
    else:
        return files

    src_dir = SNIPPETS_DIR / auth_dir
    if not src_dir.exists():
        return files

    # Backend middleware only when a server exists and the variant file is present
    # (Auth0 middleware for Express and FastAPI is baked into the backend snippet itself
    #  these slots are the planned home once auth is fully decoupled from the backend)
    if backend and backend != "none":
        if "fastapi" in backend:
            variant, dest_path = "fastapi.py", "server/src/middleware/auth.py"
        elif "django" in backend:
            variant, dest_path = "django.py", "server/middleware/auth.py"
        else:
            variant, dest_path = "express.ts", "server/src/middleware/auth.ts"

        bf = src_dir / variant
        if bf.exists():
            files[dest_path] = _load(f"{auth_dir}/{variant}", project_name)

    # Frontend provider only if the variant file is present.
    fe_variant = "nextjs-provider.tsx" if "next" in frontend else "react-provider.tsx"
    fe_file = src_dir / fe_variant
    if fe_file.exists():
        files["client/src/providers/AuthProvider.tsx"] = _load(
            f"{auth_dir}/{fe_variant}", project_name
        )

    return files


def _database_snippets(stack: StackSelection, project_name: str) -> dict[str, str]:
    db = stack.database.lower()
    backend = stack.backend.lower()

    files: dict[str, str] = {}

    if "supabase" in db:
        # Supabase client helpers live in the Next.js client no server involved
        db_dir = "database/supabase"
        src_dir = SNIPPETS_DIR / db_dir
        if not src_dir.exists():
            return files
        cf = src_dir / "client-nextjs.ts"
        if cf.exists():
            files["client/lib/supabase/client.ts"] = _load(
                f"{db_dir}/client-nextjs.ts", project_name
            )
        sf = src_dir / "server-nextjs.ts"
        if sf.exists():
            files["client/lib/supabase/server.ts"] = _load(
                f"{db_dir}/server-nextjs.ts", project_name
            )
        return files

    if "mongodb" in db or "mongo" in db:
        db_dir = "database/mongodb"
        src_dir = SNIPPETS_DIR / db_dir
        if not src_dir.exists():
            return files
        # These three overwrite the Prisma-based equivalents emitted by the express snippet
        conn = src_dir / "mongoose-express.ts"
        if conn.exists():
            files["server/src/db/connection.ts"] = _load(
                f"{db_dir}/mongoose-express.ts", project_name
            )
        ex = src_dir / "example-express.ts"
        if ex.exists():
            files["server/src/routes/example.ts"] = _load(
                f"{db_dir}/example-express.ts", project_name
            )
        pkg = src_dir / "package.json.template"
        if pkg.exists():
            files["server/package.json"] = _load(
                f"{db_dir}/package.json.template", project_name
            )
        return files

    if "postgresql" in db or "postgres" in db:
        db_dir = "database/postgresql"
        src_dir = SNIPPETS_DIR / db_dir
        if not src_dir.exists():
            return files
        # FastAPI uses raw SQL via psycopg2 (baked into the backend snippet)  skip Prisma
        if "fastapi" not in backend and "django" not in backend:
            schema = src_dir / "schema.prisma"
            if schema.exists():
                files["server/prisma/schema.prisma"] = _load(
                    f"{db_dir}/schema.prisma", project_name
                )
            conn = src_dir / "prisma-express.ts"
            if conn.exists():
                files["server/src/db/connection.ts"] = _load(
                    f"{db_dir}/prisma-express.ts", project_name
                )
        return files

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
    elif "mongo" in db or "mongodb" in db:
        # Stripped-down Node image with no Prisma generate step
        dockerfile = "Dockerfile.node-mongo"
    else:
        dockerfile = "Dockerfile.node"

    df = docker_dir / dockerfile
    if df.exists():
        # docker-compose build context is ./server, so Dockerfile lives there
        files["server/Dockerfile"] = _load(f"deployment/docker/{dockerfile}", project_name)

    if "mongo" in db or "mongodb" in db:
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
    backend = stack.backend.lower()
    db = stack.database.lower()

    files: dict[str, str] = {}

    # Docker: included when it's the deployment target, an additional selection, or AWS EC2.
    if "docker" in deployment or "aws" in deployment or "docker" in additional:
        files.update(_docker_snippets(stack, project_name))

    if "vercel" in deployment:
        vf = SNIPPETS_DIR / "deployment/vercel/vercel.json"
        if vf.exists():
            files["vercel.json"] = _load("deployment/vercel/vercel.json", project_name)

    elif "railway" in deployment:
        # Pick the right railway.toml variant for the backend/database combo.
        if "fastapi" in backend or "django" in backend:
            toml_name = "railway.python.toml"
        elif "mongo" in db or "mongodb" in db:
            toml_name = "railway.node-mongo.toml"
        else:
            toml_name = "railway.toml"

        rf = SNIPPETS_DIR / f"deployment/railway/{toml_name}"
        if rf.exists():
            files["railway.toml"] = _load(f"deployment/railway/{toml_name}", project_name)

    elif "render" in deployment:
        rf = SNIPPETS_DIR / "deployment/render/render.yaml"
        if rf.exists():
            files["render.yaml"] = _load("deployment/render/render.yaml", project_name)

    return files


def _shared_snippets(stack: StackSelection, project_name: str) -> dict[str, str]:
    frontend = stack.frontend.lower()
    backend = stack.backend.lower()
    shared_dir = SNIPPETS_DIR / "shared"

    files: dict[str, str] = {}

    if "next" in frontend:
        gi = shared_dir / "gitignore.next"
    elif "fastapi" in backend or "django" in backend:
        gi = shared_dir / "gitignore.python"
    else:
        gi = shared_dir / "gitignore.node"

    if gi.exists():
        files[".gitignore"] = _load(f"shared/{gi.name}", project_name)

    # tsconfig.base.json is only relevant for monorepos with a Node server.
    if "next" not in frontend:
        base = shared_dir / "tsconfig.base.json"
        if base.exists():
            files["tsconfig.base.json"] = _load("shared/tsconfig.base.json", project_name)

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
