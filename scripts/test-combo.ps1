#Requires -Version 5.1
# Usage: .\scripts\test-combo.ps1 [1|2|3|4|all]
#
# Compile + structure checks for the 4 Skapta launch combinations.
# No credentials required.  Auth round-trips and DB connectivity stay manual.
#
# Requires: Skapta API running on localhost:8000  *  Node.js  *  Python 3 (combo 4)

param([string]$Combo = "all")

$API = "http://localhost:8000"
$script:Pass = 0
$script:Fail = 0

function Pass([string]$M) { Write-Host "  PASS  $M" -ForegroundColor Green; $script:Pass++ }
function Fail([string]$M) { Write-Host "  FAIL  $M" -ForegroundColor Red;   $script:Fail++ }
function Skip([string]$M) { Write-Host "  SKIP  $M" -ForegroundColor Yellow }
function Ok([string]$D, [bool]$V) { if ($V) { Pass $D } else { Fail $D } }

# ── preflight ────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "Checking API health..."
try {
    $null = Invoke-WebRequest -Uri "$API/api/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "API ok."
} catch {
    Write-Host "ERROR: Skapta API is not running on $API" -ForegroundColor Red
    Write-Host "       cd api; venv\Scripts\activate; uvicorn main:app --reload"
    exit 1
}

# ── HTTP helpers ──────────────────────────────────────────────────────────────
# Invoke-WebRequest sends Content-Type: application/json correctly.
# We read the ZIP via RawContentStream (raw bytes) rather than Content
# (which decodes bytes as text and corrupts binary data).

function Get-ComboZip([string]$Payload, [string]$OutFile) {
    Write-Host "    [d1] payload length: $($Payload.Length)" -ForegroundColor DarkGray
    try {
        $r = Invoke-WebRequest -Uri "$API/api/generate" `
            -Method POST `
            -ContentType "application/json" `
            -Body $Payload `
            -UseBasicParsing `
            -ErrorAction Stop
        Write-Host "    [d2] IWR ok, status=$($r.StatusCode), rawlen=$($r.RawContentLength)" -ForegroundColor DarkGray
        $bytes = $r.RawContentStream.ToArray()
        Write-Host "    [d3] bytes=$($bytes.Length)" -ForegroundColor DarkGray
        [System.IO.File]::WriteAllBytes($OutFile, $bytes)
        Write-Host "    [d4] file written" -ForegroundColor DarkGray
        return $true
    } catch {
        Write-Host "    [FAIL] $($_.Exception.GetType().Name): $($_.Exception.Message)" -ForegroundColor DarkYellow
        return $false
    }
}

function Get-GenerateStatus([string]$Payload) {
    try {
        $r = Invoke-WebRequest -Uri "$API/api/generate" `
            -Method POST `
            -ContentType "application/json" `
            -Body $Payload `
            -UseBasicParsing `
            -ErrorAction Stop
        return [int]$r.StatusCode
    } catch {
        return [int]$_.Exception.Response.StatusCode.value__
    }
}

# ── client: Auth0 stacks (combos 1, 3, 4) ────────────────────────────────────

function Test-Auth0Client([string]$D) {
    Push-Location $D
    try {
        npm install --prefer-offline --silent *> $null
        if ($LASTEXITCODE -eq 0) { Pass "npm install (client)" } else { Fail "npm install (client)" }

        $env:VITE_AUTH0_DOMAIN    = "placeholder.auth0.com"
        $env:VITE_AUTH0_CLIENT_ID = "placeholder"
        $env:VITE_AUTH0_AUDIENCE  = "https://placeholder/"
        npm run build *> $null
        if ($LASTEXITCODE -eq 0) { Pass "vite build (client)" } else { Fail "vite build (client)" }
        npm run lint *> $null
        if ($LASTEXITCODE -eq 0) { Pass "eslint (client)" } else { Fail "eslint (client)" }
        $env:VITE_AUTH0_DOMAIN    = $null
        $env:VITE_AUTH0_CLIENT_ID = $null
        $env:VITE_AUTH0_AUDIENCE  = $null
    }
    finally { Pop-Location }
}

# ── client: Next.js + Supabase (combo 2) ─────────────────────────────────────

function Test-NextjsClient([string]$D) {
    Push-Location $D
    try {
        npm install --prefer-offline --silent *> $null
        if ($LASTEXITCODE -eq 0) { Pass "npm install (client)" } else { Fail "npm install (client)" }

        $env:NEXT_PUBLIC_SUPABASE_URL      = "https://placeholder.supabase.co"
        $env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "placeholder"
        npm run build *> $null
        if ($LASTEXITCODE -eq 0) { Pass "next build (client)" } else { Fail "next build (client)" }
        npm run lint *> $null
        if ($LASTEXITCODE -eq 0) { Pass "next lint (client)" } else { Fail "next lint (client)" }
        $env:NEXT_PUBLIC_SUPABASE_URL      = $null
        $env:NEXT_PUBLIC_SUPABASE_ANON_KEY = $null
    }
    finally { Pop-Location }
}

# ── server: PERN (combo 1) ────────────────────────────────────────────────────

function Test-NodePrismaServer([string]$D) {
    Push-Location $D
    try {
        npm install --prefer-offline --silent *> $null
        if ($LASTEXITCODE -eq 0) { Pass "npm install (server)" } else { Fail "npm install (server)" }
        npm run build *> $null
        if ($LASTEXITCODE -eq 0) { Pass "tsc build (server)" } else { Fail "tsc build (server)" }
        npx prisma generate *> $null
        if ($LASTEXITCODE -eq 0) { Pass "prisma generate" } else { Fail "prisma generate" }
    }
    finally { Pop-Location }
}

# ── server: MERN (combo 3) ────────────────────────────────────────────────────

function Test-NodeMongoServer([string]$D) {
    Push-Location $D
    try {
        npm install --prefer-offline --silent *> $null
        if ($LASTEXITCODE -eq 0) { Pass "npm install (server)" } else { Fail "npm install (server)" }
        npm run build *> $null
        if ($LASTEXITCODE -eq 0) { Pass "tsc build (server)" } else { Fail "tsc build (server)" }
    }
    finally { Pop-Location }
    Ok "no prisma/ in server" (-not (Test-Path "$D\prisma"))
}

# ── server: FastAPI (combo 4) ─────────────────────────────────────────────────

function Test-PythonServer([string]$D) {
    Push-Location $D
    try {
        pip install -r requirements.txt -q *> $null
        if ($LASTEXITCODE -eq 0) { Pass "pip install" } else { Fail "pip install" }
        python -m py_compile main.py routes/example.py auth/auth0.py db/connection.py *> $null
        if ($LASTEXITCODE -eq 0) { Pass "python syntax check" } else { Fail "python syntax check" }
    }
    finally { Pop-Location }
    Ok "no prisma/ in server" (-not (Test-Path "$D\prisma"))
}

# ── main combo runner ─────────────────────────────────────────────────────────

function Test-Combo([string]$Name, [string]$Payload, [string]$Type) {
    Write-Host ""
    Write-Host "━━━ $Name ━━━"

    $tmp = Join-Path $env:TEMP ([System.Guid]::NewGuid())
    New-Item -ItemType Directory -Path $tmp | Out-Null

    try {
        $zip = Join-Path $tmp "project.zip"
        if (Get-ComboZip $Payload $zip) {
            Pass "generate ZIP"
        } else {
            Fail "generate ZIP"
            Skip "all remaining"
            return
        }

        Expand-Archive -Path $zip -DestinationPath $tmp -Force
        $dir = (Get-ChildItem $tmp -Directory | Select-Object -First 1).FullName

        if ($Type -eq "node-prisma") {
            Test-Auth0Client      "$dir\client"
            Test-NodePrismaServer "$dir\server"
        }
        elseif ($Type -eq "node-mongo") {
            Test-Auth0Client     "$dir\client"
            Test-NodeMongoServer "$dir\server"
        }
        elseif ($Type -eq "python") {
            Test-Auth0Client  "$dir\client"
            Test-PythonServer "$dir\server"
        }
        elseif ($Type -eq "nextjs") {
            Test-NextjsClient "$dir\client"
            Ok "no server/ dir"            (-not (Test-Path "$dir\server"))
            Ok "lib/supabase/client.ts"    (Test-Path "$dir\client\lib\supabase\client.ts")
            Ok "lib/supabase/server.ts"    (Test-Path "$dir\client\lib\supabase\server.ts")
            Ok "lib/supabase/middleware.ts" (Test-Path "$dir\client\lib\supabase\middleware.ts")
        }
    }
    finally {
        Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
    }
}

# ── validation ────────────────────────────────────────────────────────────────

function Test-Validation {
    Write-Host ""
    Write-Host "━━━ Compatibility validation ━━━"

    $m = '{"stack":{"frontend":"React + Vite","backend":"Node.js + Express","database":"MongoDB","auth":"Supabase Auth","deployment":"Railway","additional":[]},"project_name":"test"}'
    $v = '{"stack":{"frontend":"React + Vite","backend":"FastAPI","database":"PostgreSQL","auth":"Auth0","deployment":"Vercel","additional":[]},"project_name":"test"}'

    Ok "MongoDB + Supabase Auth → 400" ((Get-GenerateStatus $m) -eq 400)
    Ok "Vercel + FastAPI → 400"         ((Get-GenerateStatus $v) -eq 400)
}

# ── payloads ──────────────────────────────────────────────────────────────────

$P1 = '{"stack":{"frontend":"React + Vite","backend":"Node.js + Express","database":"PostgreSQL","auth":"Auth0","deployment":"Railway","additional":["Docker + Docker Compose"]},"project_name":"test-pern"}'
$P2 = '{"stack":{"frontend":"Next.js","backend":"None","database":"Supabase","auth":"Supabase Auth","deployment":"Vercel","additional":[]},"project_name":"test-nextjs"}'
$P3 = '{"stack":{"frontend":"React + Vite","backend":"Node.js + Express","database":"MongoDB","auth":"Auth0","deployment":"Railway","additional":[]},"project_name":"test-mern"}'
$P4 = '{"stack":{"frontend":"React + Vite","backend":"FastAPI","database":"PostgreSQL","auth":"Auth0","deployment":"Railway","additional":[]},"project_name":"test-fastapi"}'

# ── dispatch ──────────────────────────────────────────────────────────────────

switch ($Combo) {
    "1"     { Test-Combo "Combo 1 — PERN + Auth0"         $P1 "node-prisma" }
    "2"     { Test-Combo "Combo 2 — Next.js + Supabase"   $P2 "nextjs"      }
    "3"     { Test-Combo "Combo 3 — MERN + Auth0"         $P3 "node-mongo"  }
    "4"     { Test-Combo "Combo 4 — FastAPI + PostgreSQL"  $P4 "python"      }
    "all"   {
        Test-Combo "Combo 1 — PERN + Auth0"         $P1 "node-prisma"
        Test-Combo "Combo 2 — Next.js + Supabase"   $P2 "nextjs"
        Test-Combo "Combo 3 — MERN + Auth0"         $P3 "node-mongo"
        Test-Combo "Combo 4 — FastAPI + PostgreSQL"  $P4 "python"
    }
    default { Write-Host "Usage: .\scripts\test-combo.ps1 [1|2|3|4|all]"; exit 1 }
}

Test-Validation

# ── summary ───────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ("Results: " + $script:Pass + " passed  " + $script:Fail + " failed")
Write-Host ""
Write-Host "Not covered (manual):"
Write-Host "  - Auth login round-trip"
Write-Host "  - Protected route rejects anon"
Write-Host "  - DB connectivity (prisma db push / mongoose connect / psql)"
Write-Host "  - Docker end to end"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ($script:Fail -gt 0) { exit 1 }
