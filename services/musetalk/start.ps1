# Start the local MuseTalk sidecar on http://127.0.0.1:8788
# Install first: powershell -ExecutionPolicy Bypass -File services/musetalk/install.ps1
# /health reports ready once models and all three Katara avatars are warm on the GPU.

$ErrorActionPreference = "Stop"
$Root = Join-Path $env:LOCALAPPDATA "sci-fi-noodle\musetalk"
$Python = Join-Path $Root ".venv\Scripts\python.exe"
if (-not (Test-Path $Python)) {
  Write-Error "MuseTalk is not installed. Run: powershell -ExecutionPolicy Bypass -File services/musetalk/install.ps1"
}

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:MUSETALK_ROOT = $Root
$env:PYTHONUNBUFFERED = "1"
Set-Location $Here
& $Python -m uvicorn server:app --host 127.0.0.1 --port 8788
