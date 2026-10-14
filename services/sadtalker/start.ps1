# Start the local SadTalker sidecar on http://127.0.0.1:8787
# Install first: powershell -ExecutionPolicy Bypass -File services/sadtalker/install.ps1

$ErrorActionPreference = "Stop"
$Root = Join-Path $env:LOCALAPPDATA "sci-fi-noodle\sadtalker"
$Python = Join-Path $Root ".venv\Scripts\python.exe"
if (-not (Test-Path $Python)) {
  Write-Error "SadTalker is not installed. Run: powershell -ExecutionPolicy Bypass -File services/sadtalker/install.ps1"
}

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:SADTALKER_HOME = Join-Path $Root "SadTalker"
$env:SADTALKER_PYTHON = $Python
Set-Location $Here
& $Python -m uvicorn server:app --host 127.0.0.1 --port 8787
