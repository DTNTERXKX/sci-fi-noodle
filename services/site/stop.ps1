# Stop the SCI-FI NOODLES site and the sidecars that start.ps1 launched.
# Saved PIDs live in services\site\.run\pids.json. Unrelated listeners are left alone.
# With no PID file, only a vite/bun process for this app and the MuseTalk sidecar's python are stopped.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File services\site\stop.ps1

#Requires -Version 5.1
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

function New-ObservedSite {
  for ($port = $script:PreferredSitePort; $port -le ($script:PreferredSitePort + 20); $port++) {
    if (-not (Test-PortIsThisSite $port)) {
      continue
    }
    $root = Get-SiteRootPid $port
    if ($root -gt 0 -and (Test-ProcessAlive $root)) {
      return @{
        owned = $false
        rootPid = $root
        port = $port
        url = "http://127.0.0.1:$port/"
        markers = @()
      }
    }
  }
  return $null
}

function New-ObservedSidecar($Def) {
  if (-not (Test-PortIsThisSidecar $Def)) {
    return $null
  }
  $root = Get-SidecarRootPid $Def
  if ($root -le 0 -or -not (Test-ProcessAlive $root)) {
    return $null
  }
  return @{
    owned = $false
    rootPid = $root
    port = $Def.Port
    url = "http://127.0.0.1:$($Def.Port)/health"
    markers = @()
  }
}

# Stops one tracked entry. Returns the entry to keep in the PID file, or $null.
function Stop-Tracked($Entry, [string]$Label, [scriptblock]$Observe, [ref]$Failed) {
  $result = Stop-OwnedEntry $Entry $Label
  if ($result -eq "failed") {
    $Failed.Value = $true
    return $Entry
  }
  if ($result -eq "left") {
    return $Entry
  }
  $observed = & $Observe
  if ($null -ne $observed -and $null -ne $Entry) {
    Write-Host "Left an already-running $Label at $($observed.url) (PID $($observed.rootPid))."
  }
  return $observed
}

Enter-SiteLock
$exitCode = 0
try {
  if (-not (Test-Path $script:PidFile)) {
    Write-Host "No PID file at $script:PidFile."
    Write-Host "Stopping only listeners that are clearly this site and the MuseTalk sidecar."
    Stop-ClearSidecar $script:MuseTalkDef | Out-Null
    Stop-ClearSite | Out-Null
    exit 0
  }

  $state = Read-RunState
  $sadEntry = $state.sadtalker
  if ($null -eq $sadEntry -and $null -ne $state.sidecar -and [int]$state.sidecar.port -eq $script:SadTalkerDef.Port) {
    $sadEntry = $state.sidecar
  }

  $failed = $false
  $keep = @{ version = 2 }
  $keepAny = $false

  $site = Stop-Tracked $state.site "Site" { New-ObservedSite } ([ref]$failed)
  if ($null -ne $site) { $keep.site = $site; $keepAny = $true }

  $musetalk = Stop-Tracked $state.musetalk $script:MuseTalkDef.Label { New-ObservedSidecar $script:MuseTalkDef } ([ref]$failed)
  if ($null -ne $musetalk) { $keep.musetalk = $musetalk; $keepAny = $true }

  if ($null -ne $sadEntry) {
    $sad = Stop-Tracked $sadEntry $script:SadTalkerDef.Label { New-ObservedSidecar $script:SadTalkerDef } ([ref]$failed)
    if ($null -ne $sad) { $keep.sadtalker = $sad; $keepAny = $true }
  }

  if ($keepAny) {
    Write-RunState $keep
    Write-Host "PID file kept so a second stop does not shut down servers this script did not start."
    Write-Host "To stop those, delete $script:PidFile and run stop again."
  } else {
    Remove-RunState
  }

  if ($failed) {
    $exitCode = 1
  }
} catch {
  Write-Host $_.Exception.Message
  $exitCode = 1
} finally {
  Exit-SiteLock
}

exit $exitCode
