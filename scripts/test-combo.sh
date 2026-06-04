#!/usr/bin/env bash
# Usage: bash scripts/test-combo.sh [1|2|3|4|all]
#
# Compile + structure checks for the 4 Skapta launch combinations.
# No credentials required — auth round-trips and DB connectivity are manual.
#
# Requires: Skapta API running on localhost:8000 · Node.js · Python 3 (combo 4)

set -euo pipefail

API="http://localhost:8000"
COMBO="${1:-all}"
PASS=0
FAIL=0

# ── helpers ────────────────────────────────────────────────────────────────

green() { printf '\033[32m  PASS\033[0m  %s\n' "$1"; }
red()   { printf '\033[31m  FAIL\033[0m  %s\n' "$1"; }
skip()  { printf '\033[33m  SKIP\033[0m  %s\n' "$1"; }

run() {
  local desc="$1"; shift
  if "$@" >/dev/null 2>&1; then
    green "$desc"; ((PASS++))
  else
    red   "$desc"; ((FAIL++))
  fi
}

# ── preflight ──────────────────────────────────────────────────────────────

echo ""
echo "Checking API health..."
if ! curl -sf "$API/api/health" >/dev/null; then
  echo "ERROR: Skapta API is not running on $API"
  echo "       Start it with: cd api && uvicorn main:app --reload"
  exit 1
fi
echo "API ok."

# ── generate + extract ─────────────────────────────────────────────────────

fetch_zip() {
  local payload="$1"
  local zipfile="$2"
  curl -sf -X POST "$API/api/generate" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    -o "$zipfile"
}

# Run a combo's test suite inside a fresh temp dir.
# $1 = display name  $2 = JSON payload  $3 = type (node-prisma|node-mongo|nextjs|python)
test_combo() {
  local name="$1"
  local payload="$2"
  local type="$3"

  echo ""
  echo "━━━ $name ━━━"

  local tmp
  tmp=$(mktemp -d)
  # shellcheck disable=SC2064
  trap "rm -rf '$tmp'" RETURN

  local zip="$tmp/project.zip"
  run "generate ZIP" fetch_zip "$payload" "$zip"
  if [ ! -f "$zip" ]; then
    skip "all remaining (ZIP failed)"
    return
  fi

  unzip -q "$zip" -d "$tmp"
  local dir
  dir=$(find "$tmp" -mindepth 1 -maxdepth 1 -type d | head -1)

  # ── client checks (all combos) ───────────────────────────────────────────

  run "npm install (client)" \
    bash -c "cd '$dir/client' && npm install --prefer-offline --silent"

  case "$type" in
    node-prisma|node-mongo)
      run "vite build (client)" \
        bash -c "cd '$dir/client' && \
          VITE_AUTH0_DOMAIN=x.auth0.com \
          VITE_AUTH0_CLIENT_ID=placeholder \
          VITE_AUTH0_AUDIENCE=https://placeholder/ \
          npm run build"
      run "eslint (client)" \
        bash -c "cd '$dir/client' && npm run lint"
      ;;
    nextjs)
      run "next build (client)" \
        bash -c "cd '$dir/client' && \
          NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
          NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder \
          npm run build"
      run "next lint (client)" \
        bash -c "cd '$dir/client' && \
          NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
          NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder \
          npm run lint"
      ;;
    python)
      run "vite build (client)" \
        bash -c "cd '$dir/client' && \
          VITE_AUTH0_DOMAIN=x.auth0.com \
          VITE_AUTH0_CLIENT_ID=placeholder \
          VITE_AUTH0_AUDIENCE=https://placeholder/ \
          npm run build"
      run "eslint (client)" \
        bash -c "cd '$dir/client' && npm run lint"
      ;;
  esac

  # ── server checks ────────────────────────────────────────────────────────

  case "$type" in
    node-prisma)
      run "npm install (server)" \
        bash -c "cd '$dir/server' && npm install --prefer-offline --silent"
      run "tsc build (server)" \
        bash -c "cd '$dir/server' && npm run build"
      run "prisma generate" \
        bash -c "cd '$dir/server' && npx prisma generate"
      ;;
    node-mongo)
      run "npm install (server)" \
        bash -c "cd '$dir/server' && npm install --prefer-offline --silent"
      run "tsc build (server)" \
        bash -c "cd '$dir/server' && npm run build"
      run "no prisma/ in server" \
        bash -c "[ ! -d '$dir/server/prisma' ]"
      ;;
    python)
      run "pip install" \
        bash -c "cd '$dir/server' && pip install -r requirements.txt -q"
      run "python syntax check" \
        bash -c "cd '$dir/server' && \
          python -m py_compile main.py \
            routes/example.py \
            auth/auth0.py \
            db/connection.py"
      run "no prisma/ in server" \
        bash -c "[ ! -d '$dir/server/prisma' ]"
      ;;
    nextjs)
      run "no server/ dir" \
        bash -c "[ ! -d '$dir/server' ]"
      run "lib/supabase files present" \
        bash -c "[ -f '$dir/client/lib/supabase/client.ts' ] && \
                 [ -f '$dir/client/lib/supabase/server.ts' ] && \
                 [ -f '$dir/client/lib/supabase/middleware.ts' ]"
      ;;
  esac
}

# ── bad-stack validation (runs once regardless of combo selection) ──────────

test_validation() {
  echo ""
  echo "━━━ Compatibility validation ━━━"

  run "MongoDB + Supabase Auth → 400" \
    bash -c "
      status=\$(curl -sf -o /dev/null -w '%{http_code}' -X POST '$API/api/generate' \
        -H 'Content-Type: application/json' \
        -d '{\"stack\":{\"frontend\":\"React + Vite\",\"backend\":\"Node.js + Express\",\"database\":\"MongoDB\",\"auth\":\"Supabase Auth\",\"deployment\":\"Railway\",\"additional\":[]},\"project_name\":\"test\"}')
      [ \"\$status\" = '400' ]
    "

  run "Vercel + FastAPI → 400" \
    bash -c "
      status=\$(curl -sf -o /dev/null -w '%{http_code}' -X POST '$API/api/generate' \
        -H 'Content-Type: application/json' \
        -d '{\"stack\":{\"frontend\":\"React + Vite\",\"backend\":\"FastAPI\",\"database\":\"PostgreSQL\",\"auth\":\"Auth0\",\"deployment\":\"Vercel\",\"additional\":[]},\"project_name\":\"test\"}')
      [ \"\$status\" = '400' ]
    "
}

# ── combo payloads ─────────────────────────────────────────────────────────

P1='{"stack":{"frontend":"React + Vite","backend":"Node.js + Express","database":"PostgreSQL","auth":"Auth0","deployment":"Railway","additional":["Docker + Docker Compose"]},"project_name":"test-pern"}'
P2='{"stack":{"frontend":"Next.js","backend":"None","database":"Supabase","auth":"Supabase Auth","deployment":"Vercel","additional":[]},"project_name":"test-nextjs"}'
P3='{"stack":{"frontend":"React + Vite","backend":"Node.js + Express","database":"MongoDB","auth":"Auth0","deployment":"Railway","additional":[]},"project_name":"test-mern"}'
P4='{"stack":{"frontend":"React + Vite","backend":"FastAPI","database":"PostgreSQL","auth":"Auth0","deployment":"Railway","additional":[]},"project_name":"test-fastapi"}'

# ── dispatch ───────────────────────────────────────────────────────────────

case "$COMBO" in
  1) test_combo "Combo 1 — PERN + Auth0"         "$P1" "node-prisma" ;;
  2) test_combo "Combo 2 — Next.js + Supabase"   "$P2" "nextjs"      ;;
  3) test_combo "Combo 3 — MERN + Auth0"         "$P3" "node-mongo"  ;;
  4) test_combo "Combo 4 — FastAPI + PostgreSQL"  "$P4" "python"      ;;
  all)
    test_combo "Combo 1 — PERN + Auth0"         "$P1" "node-prisma"
    test_combo "Combo 2 — Next.js + Supabase"   "$P2" "nextjs"
    test_combo "Combo 3 — MERN + Auth0"         "$P3" "node-mongo"
    test_combo "Combo 4 — FastAPI + PostgreSQL"  "$P4" "python"
    ;;
  *)
    echo "Usage: bash scripts/test-combo.sh [1|2|3|4|all]"
    exit 1
    ;;
esac

test_validation

# ── summary ────────────────────────────────────────────────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
printf "Results: \033[32m%d passed\033[0m  \033[31m%d failed\033[0m\n" "$PASS" "$FAIL"
echo ""
echo "Not covered (manual):"
echo "  - Auth login round-trip"
echo "  - Protected route rejects anon"
echo "  - DB connectivity (prisma db push / mongoose connect / psql)"
echo "  - Docker end to end"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

[ "$FAIL" -eq 0 ]
