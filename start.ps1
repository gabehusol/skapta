# Skapta dev launcher: starts the API and the web client, each in its own window.
$root = $PSScriptRoot

Write-Host "Starting Skapta..." -ForegroundColor Cyan

# API (FastAPI / uvicorn)
Start-Process powershell -ArgumentList @(
  '-NoExit', '-Command',
  "Set-Location '$root\api'; .\venv\Scripts\python.exe -m uvicorn main:app --port 8000 --reload"
)

# Web client (Vite)
Start-Process powershell -ArgumentList @(
  '-NoExit', '-Command',
  "Set-Location '$root\client'; pnpm dev"
)

Write-Host ""
Write-Host "  API  ->  http://localhost:8000" -ForegroundColor Green
Write-Host "  Web  ->  http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Two windows opened (one per service). Close them or press Ctrl+C in each to stop." -ForegroundColor DarkGray
