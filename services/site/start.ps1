# Start the SCI-FI NOODLES site and the MuseTalk lip-sync sidecar together.
# Reuses a piece that is already running and healthy. Does not install weights.
# The site starts even while MuseTalk is still warming up; Katara just talks
# on the still face until MuseTalk reports ready.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File services\site\start.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File services\site\start.ps1 -SadTalker   (also start the old SadTalker sidecar)

#Requires -Version 5.1
param([switch]$SadTalker)
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

function New-ServiceEntry {
  param(
    [bool]$Owned,
    [int]$RootPid,
    [int]$Port,
    [string]$Url,
    [string[]]$Markers
  )
  if ($null -eq $Markers) {
    $Markers = @()
  }
  return @{
    owned = $Owned
    rootPid = $RootPid
    port = $Port
    url = $Url
    markers = @($Markers)
  }
}

function Test-PriorOwned($Entry) {
  if ($null -eq $Entry) {
    return $false
  }
  $owned = $false
  if ($null -ne $Entry.owned) {
    $owned = [bool]$Entry.owned
  }
  if (-not $owned) {
    return $false
  }
  $root = 0
  if ($null -ne $Entry.rootPid) {
    $root = [int]$Entry.rootPid
  }
  if ($root -le 0 -or -not (Test-ProcessAlive $root)) {
    return $false
  }
  $info = Get-ProcInfo $root
  return (Test-OwnedMarkers $info $Entry)
}

function Start-LoggedProcess {
  param(
    [string]$FilePath,
    [string]$ArgumentList,
    [string]$WorkingDirectory,
    [string]$OutLog,
    [string]$ErrLog
  )
  foreach ($log in @($OutLog, $ErrLog)) {
    if (Test-Path $log) {
      Remove-Item -Path $log -Force -ErrorAction SilentlyContinue
    }
  }
  return Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDirectory -WindowStyle Hidden -PassThru -RedirectStandardOutput $OutLog -RedirectStandardError $ErrLog
}

function Write-FailureLogs {
  param([string]$Label, [string]$OutLog, [string]$ErrLog)
  Write-Host "$Label did not become ready."
  $errTail = Get-LogTail $ErrLog
  $outTail = Get-LogTail $OutLog
  if (-not [string]::IsNullOrWhiteSpace($errTail)) {
    Write-Host "--- $ErrLog ---"
    Write-Host $errTail
  }
  if (-not [string]::IsNullOrWhiteSpace($outTail)) {
    Write-Host "--- $OutLog ---"
    Write-Host $outTail
  }
}

# Starts the sidecar process and waits until its HTTP server answers /health.
# Model warm-up (ready=true) is awaited separately so the site is not held up.
function Start-SidecarService($Def, $Prior) {
  $port = $Def.Port
  $label = $Def.Label
  $url = "http://127.0.0.1:$port/health"
  $outLog = Join-Path $script:RunDir "$($Def.Key).out.log"
  $errLog = Join-Path $script:RunDir "$($Def.Key).err.log"

  if (Test-PriorOwned $Prior) {
    $up = Wait-HttpReady -Url $url -TimeoutSec 30 -Predicate { param($text) Test-SidecarHealthText $text } -Process $null -ErrorLog $errLog
    if ($up) {
      Write-Host "$label already running: $url"
      $entry = New-ServiceEntry -Owned $true -RootPid ([int]$Prior.rootPid) -Port $port -Url $url -Markers @(ConvertTo-StringArray $Prior.markers)
      $entry.up = $true
      return $entry
    }
  }

  if (Test-PortIsThisSidecar $Def) {
    $root = Get-SidecarRootPid $Def
    Write-Host "$label already running: $url"
    $entry = New-ServiceEntry -Owned $false -RootPid $root -Port $port -Url $url -Markers @()
    $entry.up = $true
    return $entry
  }

  $listeners = @(Get-ListeningPids $port)
  if ($listeners.Count -gt 0) {
    $other = $listeners[0]
    throw "Port $port is already used by PID $other, and it is not the $label. Left that process alone."
  }

  if (-not (Test-Path $Def.Script)) {
    throw "Missing $($Def.Script)"
  }
  if (-not (Test-Path $Def.Python)) {
    throw "$label is not installed. Run: powershell -ExecutionPolicy Bypass -File $($Def.Install)"
  }

  Ensure-RunDir
  Write-Host "Starting ${label}: $url"
  $argument = "-NoProfile -ExecutionPolicy Bypass -File `"$($Def.Script)`""
  $proc = Start-LoggedProcess -FilePath "powershell.exe" -ArgumentList $argument -WorkingDirectory $script:RepoRoot -OutLog $outLog -ErrLog $errLog
  $markers = @($Def.Marker)
  $entry = New-ServiceEntry -Owned $true -RootPid $proc.Id -Port $port -Url $url -Markers $markers
  $up = Wait-HttpReady -Url $url -TimeoutSec 120 -Predicate { param($text) Test-SidecarHealthText $text } -Process $proc -ErrorLog $errLog
  if (-not $up) {
    Write-FailureLogs -Label $label -OutLog $outLog -ErrLog $errLog
    $entry.up = $false
    return $entry
  }
  Write-Host "$label started: $url (PID $($proc.Id))"
  $entry.up = $true
  return $entry
}

function Wait-SidecarWarm($Def, $Entry) {
  if ($null -eq $Entry -or -not [bool]$Entry.up) {
    return $false
  }
  $label = $Def.Label
  $url = [string]$Entry.url
  $deadline = (Get-Date).AddSeconds(360)
  $said = $false
  do {
    $health = Invoke-CurlText -Url $url -TimeoutSec 8
    if ($health.Ok -and (Test-SidecarReadyText $health.Text)) {
      $fps = ""
      if ($health.Text -match '"fps"\s*:\s*([0-9.]+)') {
        $fps = " ($($Matches[1]) frames/s)"
      }
      Write-Host "$label ready$fps."
      return $true
    }
    $reason = Get-SidecarReason $health.Text
    if ($health.Ok -and $reason -and $reason -ne "loading") {
      Write-Host "$label is up but not ready: $reason. Katara will talk without lip-sync."
      return $false
    }
    if (-not $health.Ok -and [bool]$Entry.owned -and -not (Test-ProcessAlive ([int]$Entry.rootPid))) {
      Write-FailureLogs -Label $label -OutLog (Join-Path $script:RunDir "$($Def.Key).out.log") -ErrLog (Join-Path $script:RunDir "$($Def.Key).err.log")
      return $false
    }
    if (-not $said) {
      Write-Host "Waiting for $label to load models and avatars (about two minutes)..."
      $said = $true
    }
    Start-Sleep -Seconds 3
  } while ((Get-Date) -lt $deadline)
  Write-Host "$label is still warming up. Katara talks on the still face until it is ready."
  return $false
}

function Start-SiteService($Prior) {
  $outLog = Join-Path $script:RunDir "site.out.log"
  $errLog = Join-Path $script:RunDir "site.err.log"

  if (Test-PriorOwned $Prior) {
    $port = [int]$Prior.port
    if ($port -le 0) {
      $port = $script:PreferredSitePort
    }
    $url = "http://127.0.0.1:$port/"
    $ready = Wait-HttpReady -Url $url -TimeoutSec 30 -Predicate { param($text) Test-SitePageText $text } -Process $null -ErrorLog $errLog
    if ($ready -or (Test-PortIsThisSite $port)) {
      Write-Host "Site already running: $url"
      return (New-ServiceEntry -Owned $true -RootPid ([int]$Prior.rootPid) -Port $port -Url $url -Markers @(ConvertTo-StringArray $Prior.markers))
    }
  }

  $port = $script:PreferredSitePort
  $startedByUs = $false
  $root = 0
  $markers = @()
  $reused = $false

  if (Test-PortIsThisSite $port) {
    $root = Get-SiteRootPid $port
    $stillListening = @(Get-ListeningPids $port).Count -gt 0
    if ($root -gt 0 -and $stillListening -and (Test-ProcessAlive $root)) {
      $reused = $true
      Write-Host "Site already running: http://127.0.0.1:$port/"
    } else {
      $root = 0
    }
  }

  if (-not $reused) {
    $busy = @(Get-ListeningPids $port)
    if ($busy.Count -gt 0) {
      Write-Host "Port $port is in use by another process (PID $($busy[0])). Choosing the next free port."
      $port = Find-FreeSitePort ($port + 1)
      if ($port -eq 0) {
        throw "No free port from $($script:PreferredSitePort) through $($script:PreferredSitePort + 21)."
      }
    }
    if (-not (Test-Path $script:BunExe)) {
      throw "Bun was not found at $script:BunExe"
    }
    Ensure-RunDir
    $urlPreview = "http://127.0.0.1:$port/"
    Write-Host "Starting site: $urlPreview"
    $proc = Start-LoggedProcess -FilePath $script:BunExe -ArgumentList "run dev --host 127.0.0.1 --port $port" -WorkingDirectory $script:AppDir -OutLog $outLog -ErrLog $errLog
    $startedByUs = $true
    $root = $proc.Id
    $markers = @("bun-windows-x64\bun.exe", "run dev", "--port $port")
    $url = "http://127.0.0.1:$port/"
    $ready = Wait-HttpReady -Url $url -TimeoutSec 180 -Predicate { param($text) Test-SitePageText $text } -Process $proc -ErrorLog $errLog
    if (-not $ready) {
      Write-FailureLogs -Label "Site" -OutLog $outLog -ErrLog $errLog
      $failed = New-ServiceEntry -Owned $true -RootPid $root -Port $port -Url $url -Markers $markers
      $failed.ready = $false
      return $failed
    }
    Write-Host "Site started: $url (PID $root)"
  }

  $url = "http://127.0.0.1:$port/"
  for ($other = $script:PreferredSitePort; $other -le ($script:PreferredSitePort + 20); $other++) {
    if ($other -eq $port) {
      continue
    }
    $others = @(Get-ListeningPids $other)
    if ($others.Count -eq 0) {
      continue
    }
    if (Test-PortIsThisSite $other) {
      Write-Host "Another SCI-FI NOODLES dev server is already listening on http://127.0.0.1:$other/. Left it running."
    }
  }

  $entry = New-ServiceEntry -Owned $startedByUs -RootPid $root -Port $port -Url $url -Markers $markers
  $entry.ready = $true
  return $entry
}

Enter-SiteLock
$exitCode = 0
try {
  $prior = $null
  if (Test-Path $script:PidFile) {
    $prior = Read-RunState
  }

  # Version 1 files tracked the SadTalker sidecar under "sidecar".
  $priorSad = $prior.sadtalker
  if ($null -eq $priorSad -and $null -ne $prior.sidecar -and [int]$prior.sidecar.port -eq $script:SadTalkerDef.Port) {
    $priorSad = $prior.sidecar
  }

  $state = @{ version = 2 }
  $musetalk = $null
  try {
    $musetalk = Start-SidecarService $script:MuseTalkDef $prior.musetalk
    $state.musetalk = $musetalk
  } catch {
    Write-Host $_.Exception.Message
    Write-Host "Continuing without lip-sync."
  }

  if ($SadTalker) {
    try {
      $state.sadtalker = Start-SidecarService $script:SadTalkerDef $priorSad
    } catch {
      Write-Host $_.Exception.Message
    }
  } elseif (Test-PriorOwned $priorSad) {
    $state.sadtalker = $priorSad
  }

  $site = Start-SiteService $prior.site
  $state.site = $site
  Write-RunState $state

  $siteReady = $false
  if ($null -ne $site.ready) {
    $siteReady = [bool]$site.ready
  } else {
    $siteReady = Test-SitePageText (Invoke-CurlText -Url $site.url -TimeoutSec 20).Text
  }

  $warm = Wait-SidecarWarm $script:MuseTalkDef $musetalk

  Write-Host ""
  Write-Host "Site:     $($site.url)"
  if ($null -ne $musetalk) {
    $status = "warming up or unavailable"
    if ($warm) {
      $status = "ready"
    }
    Write-Host "MuseTalk: $($musetalk.url) ($status)"
  } else {
    Write-Host "MuseTalk: not started"
  }
  if ($null -ne $state.sadtalker) {
    Write-Host "SadTalker: $($state.sadtalker.url)"
  }

  if (-not $siteReady -or -not $warm) {
    Write-Host "Start is incomplete. Run services\site\stop.ps1 to stop anything this script launched."
    $exitCode = 1
  }
} catch {
  Write-Host $_.Exception.Message
  $exitCode = 1
} finally {
  Exit-SiteLock
}

exit $exitCode
