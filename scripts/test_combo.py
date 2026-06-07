"""
Usage:  python scripts/test_combo.py [1|2|3|4|all]

Compile + structure checks for the 4 Skapta launch combinations.
No credentials required — auth round-trips and DB stay manual.

Run from the project root with the Skapta API on localhost:8000.
Must be run inside the api venv (pip install requests is already satisfied).
"""

import io
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

import requests

API = "http://localhost:8000"

# ── counters ─────────────────────────────────────────────────────────────────

passed = 0
failed = 0


def ok(desc: str) -> None:
    global passed
    print(f"  \033[32mPASS\033[0m  {desc}")
    passed += 1


def fail(desc: str) -> None:
    global failed
    print(f"  \033[31mFAIL\033[0m  {desc}")
    failed += 1


def skip(desc: str) -> None:
    print(f"  \033[33mSKIP\033[0m  {desc}")


def check(desc: str, cmd: list[str], cwd: str, env: dict | None = None) -> bool:
    """Run a shell command, report PASS/FAIL. Shows last 3 error lines on failure."""
    merged_env = {**os.environ, **(env or {})}
    result = subprocess.run(
        cmd,
        cwd=cwd,
        env=merged_env,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",   # don't crash on prisma/npm emoji in output
        shell=True,         # required on Windows — npm/npx/pip are .cmd files
    )
    if result.returncode == 0:
        ok(desc)
        return True
    else:
        fail(desc)
        err = (result.stderr or result.stdout or "").strip()
        for line in err.splitlines()[-8:]:
            if line.strip():
                print(f"         {line.strip()}")
        return False


# ── HTTP helpers ──────────────────────────────────────────────────────────────

def generate_zip(payload: dict) -> bytes | None:
    """POST to /api/generate, return ZIP bytes or None on failure."""
    try:
        r = requests.post(f"{API}/api/generate", json=payload, timeout=30)
        if r.status_code == 200:
            return r.content
        return None
    except Exception:
        return None


def generate_status(payload: dict) -> int:
    """POST to /api/generate, return the HTTP status code."""
    try:
        r = requests.post(f"{API}/api/generate", json=payload, timeout=30)
        return r.status_code
    except Exception as e:
        print(f"         (request failed: {e})")
        return 0


# ── client checks ─────────────────────────────────────────────────────────────

AUTH0_ENV = {
    "VITE_AUTH0_DOMAIN":   "placeholder.auth0.com",
    "VITE_AUTH0_CLIENT_ID": "placeholder",
    "VITE_AUTH0_AUDIENCE": "https://placeholder/",
}

SUPABASE_ENV = {
    "NEXT_PUBLIC_SUPABASE_URL":      "https://placeholder.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "placeholder",
}


def test_auth0_client(client_dir: str) -> None:
    check("npm install (client)", ["npm", "install", "--prefer-offline", "--silent"], client_dir)
    check("vite build (client)",  ["npm", "run", "build"], client_dir, AUTH0_ENV)
    check("eslint (client)",      ["npm", "run", "lint"],  client_dir, AUTH0_ENV)


def test_nextjs_client(client_dir: str) -> None:
    # --legacy-peer-deps: Next 15 + React 19 has peer dep conflicts with some packages
    check("npm install (client)", ["npm", "install", "--legacy-peer-deps"], client_dir)
    check("next build (client)",  ["npm", "run", "build"], client_dir, SUPABASE_ENV)
    check("next lint (client)",   ["npm", "run", "lint"],  client_dir, SUPABASE_ENV)


def test_vue_client(client_dir: str) -> None:
    check("npm install (client)",       ["npm", "install", "--prefer-offline", "--silent"], client_dir)
    check("vue-tsc + vite build (client)", ["npm", "run", "build"], client_dir, AUTH0_ENV)
    check("eslint (client)",            ["npm", "run", "lint"],  client_dir, AUTH0_ENV)


# ── server checks ─────────────────────────────────────────────────────────────

def test_node_prisma_server(server_dir: str) -> None:
    check("npm install (server)", ["npm", "install", "--prefer-offline", "--silent"], server_dir)
    # Generate the Prisma client BEFORE tsc — src/db/connection.ts imports @prisma/client,
    # which has no types until `prisma generate` runs (npm's postinstall is unreliable).
    check("prisma generate",      ["npx", "prisma", "generate"], server_dir)
    check("tsc build (server)",   ["npm", "run", "build"], server_dir)


def test_node_mongo_server(server_dir: str) -> None:
    check("npm install (server)", ["npm", "install", "--prefer-offline", "--silent"], server_dir)
    check("tsc build (server)",   ["npm", "run", "build"], server_dir)
    no_prisma = not os.path.isdir(os.path.join(server_dir, "prisma"))
    ok("no prisma/ in server") if no_prisma else fail("no prisma/ in server")


def test_python_server(server_dir: str) -> None:
    # Don't pip install into the Skapta venv — version conflicts with the API's
    # own deps would corrupt it.  Check file presence + syntax instead.
    req = os.path.join(server_dir, "requirements.txt")
    ok("requirements.txt present") if os.path.isfile(req) else fail("requirements.txt present")
    check("python syntax check", [
        "python", "-m", "py_compile",
        "main.py", "routes/example.py", "auth/provider.py", "db/connection.py",
    ], server_dir)
    no_prisma = not os.path.isdir(os.path.join(server_dir, "prisma"))
    ok("no prisma/ in server") if no_prisma else fail("no prisma/ in server")


# ── combo runner ──────────────────────────────────────────────────────────────

def test_combo(name: str, payload: dict, combo_type: str) -> None:
    print(f"\n━━━ {name} ━━━")

    zip_bytes = generate_zip(payload)
    if zip_bytes is None:
        fail("generate ZIP")
        skip("all remaining")
        return
    ok("generate ZIP")

    # Use a short base path on Windows to avoid the 260-char path limit
    # that breaks npm install for Next.js's deeply nested node_modules.
    if sys.platform == "win32":
        base = Path("C:/t")
        base.mkdir(parents=True, exist_ok=True)
        tmp = tempfile.mkdtemp(dir=base)
    else:
        tmp = tempfile.mkdtemp()
    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
            zf.extractall(tmp)

        # The ZIP nests everything under the project name dir
        contents = os.listdir(tmp)
        project_dir = os.path.join(tmp, contents[0])
        client_dir  = os.path.join(project_dir, "client")
        server_dir  = os.path.join(project_dir, "server")

        if combo_type == "node-prisma":
            test_auth0_client(client_dir)
            test_node_prisma_server(server_dir)

        elif combo_type == "node-mongo":
            test_auth0_client(client_dir)
            test_node_mongo_server(server_dir)

        elif combo_type == "python":
            test_auth0_client(client_dir)
            test_python_server(server_dir)

        elif combo_type == "nextjs":
            test_nextjs_client(client_dir)
            no_server = not os.path.isdir(server_dir)
            ok("no server/ dir") if no_server else fail("no server/ dir")
            for f in ["lib/supabase/client.ts", "lib/supabase/server.ts", "lib/supabase/middleware.ts"]:
                path = os.path.join(client_dir, *f.split("/"))
                ok(f) if os.path.isfile(path) else fail(f)

        elif combo_type == "vue":
            test_vue_client(client_dir)
            test_node_prisma_server(server_dir)

    finally:
        shutil.rmtree(tmp, ignore_errors=True)


# ── validation ────────────────────────────────────────────────────────────────

def test_validation() -> None:
    print("\n━━━ Compatibility validation ━━━")
    try:
        requests.get(f"{API}/api/health", timeout=5).raise_for_status()
    except Exception:
        skip("API unreachable — restart uvicorn and re-run")
        return

    bad_mongo = {
        "stack": {
            "frontend": "React + Vite", "backend": "Node.js + Express",
            "database": "MongoDB",      "auth": "Supabase Auth",
            "deployment": "Railway",    "additional": [],
        },
        "project_name": "test",
    }
    bad_vercel = {
        "stack": {
            "frontend": "React + Vite", "backend": "FastAPI",
            "database": "PostgreSQL",   "auth": "Auth0",
            "deployment": "Vercel",     "additional": [],
        },
        "project_name": "test",
    }

    s1 = generate_status(bad_mongo)
    ok("MongoDB + Supabase Auth → 400") if s1 == 400 else fail(f"MongoDB + Supabase Auth → 400 (got {s1})")

    s2 = generate_status(bad_vercel)
    ok("Vercel + FastAPI → 400") if s2 == 400 else fail(f"Vercel + FastAPI → 400 (got {s2})")


# ── payloads ──────────────────────────────────────────────────────────────────

P1 = {
    "stack": {
        "frontend": "React + Vite", "backend": "Node.js + Express",
        "database": "PostgreSQL",   "auth": "Auth0",
        "deployment": "Railway",    "additional": ["Docker + Docker Compose"],
    },
    "project_name": "test-pern",
}
P2 = {
    "stack": {
        "frontend": "Next.js", "backend": "None",
        "database": "Supabase", "auth": "Supabase Auth",
        "deployment": "Vercel", "additional": [],
    },
    "project_name": "test-nextjs",
}
P3 = {
    "stack": {
        "frontend": "React + Vite", "backend": "Node.js + Express",
        "database": "MongoDB",      "auth": "Auth0",
        "deployment": "Railway",    "additional": [],
    },
    "project_name": "test-mern",
}
P4 = {
    "stack": {
        "frontend": "React + Vite", "backend": "FastAPI",
        "database": "PostgreSQL",   "auth": "Auth0",
        "deployment": "Railway",    "additional": [],
    },
    "project_name": "test-fastapi",
}
# --- engine v2 candidate combos (🟡 — snippets exist, not yet hand-tested) ---
P5 = {
    "stack": {
        "frontend": "React + Vite", "backend": "Node.js + Express",
        "database": "MySQL",        "auth": "Auth0",
        "deployment": "Railway",    "additional": ["Docker + Docker Compose"],
    },
    "project_name": "test-mysql",
}
P6 = {
    "stack": {
        "frontend": "React + Vite", "backend": "Node.js + Express",
        "database": "PostgreSQL",   "auth": "Auth0",
        "deployment": "Render",     "additional": [],
    },
    "project_name": "test-render",
}
P7 = {
    "stack": {
        "frontend": "Vue + Vite",   "backend": "Node.js + Express",
        "database": "PostgreSQL",   "auth": "Auth0",
        "deployment": "Railway",    "additional": [],
    },
    "project_name": "test-vue",
}

# ── dispatch ──────────────────────────────────────────────────────────────────

def main() -> None:
    combo = sys.argv[1] if len(sys.argv) > 1 else "all"

    print("\nChecking API health...")
    try:
        r = requests.get(f"{API}/api/health", timeout=5)
        r.raise_for_status()
        print("API ok.")
    except Exception:
        print(f"ERROR: Skapta API is not running on {API}")
        print("       cd api && venv\\Scripts\\activate && uvicorn main:app --reload")
        sys.exit(1)

    if combo in ("1", "all"):
        test_combo("Combo 1 — PERN + Auth0",         P1, "node-prisma")
    if combo in ("2", "all"):
        test_combo("Combo 2 — Next.js + Supabase",   P2, "nextjs")
    if combo in ("3", "all"):
        test_combo("Combo 3 — MERN + Auth0",         P3, "node-mongo")
    if combo in ("4", "all"):
        test_combo("Combo 4 — FastAPI + PostgreSQL",  P4, "python")
    if combo in ("5", "all"):
        test_combo("Combo 5 — MERN-style MySQL (🟡)", P5, "node-prisma")
    if combo in ("6", "all"):
        test_combo("Combo 6 — PERN on Render (🟡)",   P6, "node-prisma")
    if combo in ("7", "all"):
        test_combo("Combo 7 — Vue + Vite + Auth0 (🟡)", P7, "vue")

    test_validation()

    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"Results: {passed} passed  {failed} failed")
    print("\nNot covered (manual):")
    print("  - Auth login round-trip")
    print("  - Protected route rejects anon")
    print("  - DB connectivity (prisma db push / mongoose connect / psql)")
    print("  - Docker end to end")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    sys.exit(1 if failed > 0 else 0)


if __name__ == "__main__":
    main()
