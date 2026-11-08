# Build the Cosmic Ramen front end (Bun) and stage static files for ASP.NET Core.
# Does not run Vite/Bun on the server; output is copied into wwwroot for dotnet publish.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File deploy\build-production.ps1

#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$App = Join-Path $Root "app"
$Bun = "C:\Users\booba\.local\bun\bun-windows-x64\bun.exe"
$Web = Join-Path $Root "server\SciFiNoodles.Web"
$Www = Join-Path $Web "wwwroot"

if (-not (Test-Path $Bun)) {
  throw "Bun not found at $Bun"
}

Write-Host "Export sitemap paths from catalog..."
& $Bun (Join-Path $Root "deploy\export-sitemap-paths.mjs")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Front-end checks and build..."
Push-Location $App
try {
  & $Bun run typecheck
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  & $Bun run check:ui
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  & $Bun run build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}

Write-Host "Stage wwwroot..."
if (Test-Path $Www) {
  Remove-Item -Path $Www -Recurse -Force
}
New-Item -ItemType Directory -Path $Www | Out-Null

$Public = Join-Path $App "public"
Copy-Item -Path (Join-Path $Public "*") -Destination $Www -Recurse -Force

$ClientDist = Join-Path $App "dist\client"
if (Test-Path $ClientDist) {
  Copy-Item -Path (Join-Path $ClientDist "*") -Destination $Www -Recurse -Force
} else {
  throw "app\dist\client missing after build."
}

Write-Host "SPA shell and static route copies..."
$WwwIndex = Join-Path $Www "index.html"
& $Bun (Join-Path $Root "deploy\spa-shell.mjs") $WwwIndex
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $Bun (Join-Path $Root "deploy\prerender-static.mjs") $Www
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not (Test-Path $WwwIndex)) {
  throw "Missing wwwroot\index.html after spa-shell."
}

Write-Host "dotnet publish..."
Push-Location (Join-Path $Root "server")
try {
  dotnet publish SciFiNoodles.Web\SciFiNoodles.Web.csproj -c Release -o (Join-Path $Root "publish")
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}

Write-Host "Done. Deploy the publish/ folder to InterServer (see server/README.md)."
