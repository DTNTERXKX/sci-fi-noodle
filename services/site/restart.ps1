# Stop then start the SCI-FI NOODLES site. MuseTalk stays off unless -MuseTalk.
# Same options as start.ps1. PIDs: services\site\.run\pids.json
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File services\site\restart.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File services\site\restart.ps1 -MuseTalk
#   powershell -NoProfile -ExecutionPolicy Bypass -File services\site\restart.ps1 -SadTalker

#Requires -Version 5.1
param(
  [switch]$MuseTalk,
  [switch]$SadTalker
)
$ErrorActionPreference = "Stop"

$here = $PSScriptRoot
$stopScript = Join-Path $here "stop.ps1"
$startScript = Join-Path $here "start.ps1"

Write-Host "Stopping SCI-FI NOODLES local stack..."
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $stopScript
$stopCode = $LASTEXITCODE
if ($stopCode -ne 0) {
  Write-Host "Stop reported exit code $stopCode. Continuing with start anyway."
}

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Starting SCI-FI NOODLES local stack..."
$startArgs = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $startScript)
if ($MuseTalk) {
  $startArgs += "-MuseTalk"
}
if ($SadTalker) {
  $startArgs += "-SadTalker"
}
& powershell.exe @startArgs
exit $LASTEXITCODE
