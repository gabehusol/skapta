"""
Dev-only regression aid (not committed). Dumps the exact generated-file map for
the 4 verified combos + a few candidates by calling the generator directly (no
HTTP, no credentials). Use to diff engine-v2 refactor output against a baseline:

    python scripts/snapshot_combos.py baseline   # before changes
    python scripts/snapshot_combos.py current     # after changes
    git diff --no-index .snapshots/baseline .snapshots/current

Run from api/ with the venv python so models.* imports resolve.
"""
import sys
from pathlib import Path

# import from api/
API = Path(__file__).resolve().parent.parent / "api"
sys.path.insert(0, str(API))

from models.generate import StackSelection, GenerationOptions  # noqa: E402
from generators.composer import compose  # noqa: E402
from generators.shared_generator import generate_shared_files  # noqa: E402

COMBOS = {
    "1-pern": dict(frontend="React + Vite", backend="Node.js + Express",
                   database="PostgreSQL", auth="Auth0", deployment="Railway",
                   additional=["Docker + Docker Compose"]),
    "2-nextjs": dict(frontend="Next.js", backend="None", database="Supabase",
                     auth="Supabase Auth", deployment="Vercel", additional=[]),
    "3-mern": dict(frontend="React + Vite", backend="Node.js + Express",
                   database="MongoDB", auth="Auth0", deployment="Railway",
                   additional=[]),
    "4-fastapi": dict(frontend="React + Vite", backend="FastAPI",
                      database="PostgreSQL", auth="Auth0", deployment="Railway",
                      additional=[]),
    # --- engine v2 candidates (🟡) ---
    "5-mysql": dict(frontend="React + Vite", backend="Node.js + Express",
                    database="MySQL", auth="Auth0", deployment="Railway",
                    additional=["Docker + Docker Compose"]),
    "6-render": dict(frontend="React + Vite", backend="Node.js + Express",
                     database="PostgreSQL", auth="Auth0", deployment="Render",
                     additional=[]),
    "7-vue": dict(frontend="Vue + Vite", backend="Node.js + Express",
                  database="PostgreSQL", auth="Auth0", deployment="Railway",
                  additional=[]),
    "8-firebase": dict(frontend="React + Vite", backend="Node.js + Express",
                       database="PostgreSQL", auth="Firebase Auth", deployment="Railway",
                       additional=[]),
    "9-django": dict(frontend="React + Vite", backend="Django",
                     database="PostgreSQL", auth="Auth0", deployment="Railway",
                     additional=["Docker + Docker Compose"]),
    "10-nextauth": dict(frontend="Next.js", backend="None",
                        database="PostgreSQL", auth="NextAuth", deployment="Vercel",
                        additional=[]),
}


def main() -> None:
    label = sys.argv[1] if len(sys.argv) > 1 else "current"
    out = Path(__file__).resolve().parent.parent / ".snapshots" / label
    out.mkdir(parents=True, exist_ok=True)
    opts = GenerationOptions()
    for name, stack_kw in COMBOS.items():
        stack = StackSelection(**stack_kw)
        files = {**compose(stack, opts, "myapp"),
                 **generate_shared_files(stack, opts, "myapp")}
        lines = []
        for path in sorted(files):
            lines.append(f"\n===== {path} =====\n")
            lines.append(files[path])
        (out / f"{name}.txt").write_text("".join(lines), encoding="utf-8")
        print(f"  {name}: {len(files)} files")
    print(f"snapshot -> {out}")


if __name__ == "__main__":
    main()
