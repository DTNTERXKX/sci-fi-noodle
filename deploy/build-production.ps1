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

Write-Host "Prerender pages through the TanStack server bundle..."
$WwwIndex = Join-Path $Www "index.html"
& $Bun (Join-Path $Root "deploy\prerender-pages.mjs") $Www
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not (Test-Path $WwwIndex)) {
  throw "Missing wwwroot\index.html after prerender."
}

function Assert-HydratableShell {
  param([Parameter(Mandatory = $true)][string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing hydratable shell at ${Path}"
  }
  $html = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
  $tsrMarker = [string][char]36 + "_TSR"
  if ($html.IndexOf($tsrMarker) -lt 0) {
    throw "Refusing to ship ${Path}: missing SSR hydration payload (empty SPA shells paint black)."
  }
  if ($html.IndexOf('id="root"') -ge 0) {
    throw "Refusing to ship ${Path}: empty #root SPA shell (client hydrate needs the prerendered document)."
  }
  if ($html.Length -lt 2000) {
    throw "Refusing to ship ${Path}: only $($html.Length) bytes; prerendered homepage must be full HTML."
  }
}

Assert-HydratableShell -Path $WwwIndex

Write-Host "dotnet publish..."
Push-Location (Join-Path $Root "server")
try {
  dotnet publish SciFiNoodles.Web\SciFiNoodles.Web.csproj -c Release -o (Join-Path $Root "publish")
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}

# Kestrel serves the shell for any default-document name IIS forwards, and static
# files are read only from wwwroot, so the copies live there. None go next to the
# DLL: IIS default documents would remap / to that file, and on the Plesk host IIS
# answers files in the site folder itself with a 404 instead of forwarding them.
Write-Host "Copy prerendered shell for IIS default documents..."
$Publish = Join-Path $Root "publish"
$PublishWww = Join-Path $Publish "wwwroot"
$PublishWwwIndex = Join-Path $PublishWww "index.html"
Assert-HydratableShell -Path $PublishWwwIndex
$DefaultDocs = @("Default.htm", "Default.asp", "index.htm", "iisstart.htm", "default.aspx")
foreach ($name in $DefaultDocs) {
  Copy-Item -Path $PublishWwwIndex -Destination (Join-Path $PublishWww $name) -Force
}
foreach ($name in (@("index.html") + $DefaultDocs)) {
  $Stale = Join-Path $Publish $name
  if (Test-Path $Stale) { Remove-Item -Path $Stale -Force }
}

Assert-HydratableShell -Path (Join-Path $PublishWww "404.html")
Assert-HydratableShell -Path (Join-Path $PublishWww "watch\index.html")

Write-Host "Done. Brien copies publish/ onto the Plesk document root (see server/README.md)."
