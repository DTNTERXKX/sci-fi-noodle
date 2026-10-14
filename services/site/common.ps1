# Shared helpers for services/site/start.ps1 and services/site/stop.ps1.
# ASCII-only so Windows PowerShell 5.1 reads this without a BOM.

$ErrorActionPreference = "Stop"

$script:RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$script:AppDir = Join-Path $script:RepoRoot "app"
$script:RunDir = Join-Path $PSScriptRoot ".run"
$script:PidFile = Join-Path $script:RunDir "pids.json"
$script:BunExe = "C:\Users\booba\.local\bun\bun-windows-x64\bun.exe"
$script:SiteMarker = "SCI-FI NOODLES"
$script:PreferredSitePort = 5173
$script:SiteMutex = $null

function New-SidecarDef([string]$Key, [string]$Label, [int]$Port) {
  $dir = Join-Path $env:LOCALAPPDATA "sci-fi-noodle\$Key"
  return @{
    Key = $Key
    Label = $Label
    Port = $Port
    Script = Join-Path $script:RepoRoot "services\$Key\start.ps1"
    Install = "services\$Key\install.ps1"
    Home = $dir
    Python = Join-Path $dir ".venv\Scripts\python.exe"
    Marker = "$Key\start.ps1"
  }
}

# MuseTalk is the live lip-sync sidecar. SadTalker is optional and off by default.
$script:MuseTalkDef = New-SidecarDef "musetalk" "MuseTalk sidecar" 8788
$script:SadTalkerDef = New-SidecarDef "sadtalker" "SadTalker sidecar" 8787

function Enter-SiteLock {
  $created = $false
  $script:SiteMutex = New-Object System.Threading.Mutex($false, "sci-fi-noodle-local-site", [ref]$created)
  $acquired = $false
  try {
    $acquired = $script:SiteMutex.WaitOne(120000)
  } catch [System.Threading.AbandonedMutexException] {
    $acquired = $true
  }
  if (-not $acquired) {
    throw "Another SCI-FI NOODLES start or stop is still running."
  }
}

function Exit-SiteLock {
  if ($null -eq $script:SiteMutex) {
    return
  }
  try {
    $script:SiteMutex.ReleaseMutex() | Out-Null
  } catch {
    # Already released, or this process did not own the mutex.
  }
  $script:SiteMutex.Dispose()
  $script:SiteMutex = $null
}

function Ensure-RunDir {
  if (-not (Test-Path $script:RunDir)) {
    New-Item -ItemType Directory -Path $script:RunDir | Out-Null
  }
}

function Read-RunState {
  if (-not (Test-Path $script:PidFile)) {
    return $null
  }
  try {
    $raw = Get-Content -Path $script:PidFile -Raw -ErrorAction Stop
    if ([string]::IsNullOrWhiteSpace($raw)) {
      return $null
    }
    return ($raw | ConvertFrom-Json)
  } catch {
    throw "Could not read $script:PidFile. Stopped nothing. Fix or delete that file and run stop again."
  }
}

function Write-RunState($State) {
  Ensure-RunDir
  $json = $State | ConvertTo-Json -Depth 6
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($script:PidFile, $json, $utf8)
}

function Remove-RunState {
  if (Test-Path $script:PidFile) {
    Remove-Item -Path $script:PidFile -Force
  }
}

function ConvertTo-StringArray($Value) {
  if ($null -eq $Value) {
    return @()
  }
  if ($Value -is [string]) {
    return @($Value)
  }
  return @($Value)
}

function Get-ProcInfo([int]$ProcessId) {
  if ($ProcessId -le 0) {
    return $null
  }
  return Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
}

function Test-ProcessAlive([int]$ProcessId) {
  if ($ProcessId -le 0) {
    return $false
  }
  return $null -ne (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)
}

function Get-ProcessChain([int]$ProcessId) {
  $chain = @()
  $current = $ProcessId
  $seen = @{}
  for ($i = 0; $i -lt 8; $i++) {
    if ($current -le 0 -or $seen.ContainsKey($current)) {
      break
    }
    $seen[$current] = $true
    $info = Get-ProcInfo $current
    if ($null -eq $info) {
      break
    }
    $chain += $info
    $current = [int]$info.ParentProcessId
  }
  return $chain
}

function Get-ListeningPids([int]$Port) {
  $found = New-Object System.Collections.Generic.List[int]
  $pattern = "^\s*TCP\s+\S+:${Port}\s+\S+\s+LISTENING\s+(\d+)\s*$"
  $lines = & netstat.exe -ano -p TCP
  foreach ($line in $lines) {
    if ($line -match $pattern) {
      $procId = [int]$Matches[1]
      if (-not $found.Contains($procId)) {
        $found.Add($procId) | Out-Null
      }
    }
  }
  return @($found.ToArray())
}

function Invoke-CurlText {
  param(
    [string]$Url,
    [int]$TimeoutSec = 8
  )
  # ProcessStartInfo keeps curl's nonzero exit from becoming a PowerShell
  # error. Windows PowerShell turns native stderr into a terminating error
  # when ErrorActionPreference is Stop.
  $token = [guid]::NewGuid().ToString("n")
  $stdout = Join-Path $env:TEMP "sfn-curl-$token.out"
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = "curl.exe"
  $psi.Arguments = "--silent --show-error --max-time $TimeoutSec --output `"$stdout`" --url `"$Url`""
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $psi.RedirectStandardError = $true
  $psi.RedirectStandardOutput = $true
  $proc = New-Object System.Diagnostics.Process
  $proc.StartInfo = $psi
  [void]$proc.Start()
  $null = $proc.StandardError.ReadToEnd()
  $proc.WaitForExit()
  $code = $proc.ExitCode
  $proc.Dispose()
  $text = ""
  if (Test-Path $stdout) {
    $text = [System.IO.File]::ReadAllText($stdout)
    Remove-Item $stdout -Force -ErrorAction SilentlyContinue
  }
  return @{ Ok = ($code -eq 0 -and -not [string]::IsNullOrWhiteSpace($text)); Text = $text; ExitCode = $code }
}

function Test-SidecarHealthText([string]$Text) {
  if ([string]::IsNullOrWhiteSpace($Text)) {
    return $false
  }
  return ($Text -match '"ok"\s*:\s*true' -and $Text -match '"ready"')
}

function Test-SidecarReadyText([string]$Text) {
  return ((Test-SidecarHealthText $Text) -and $Text -match '"ready"\s*:\s*true')
}

function Get-SidecarReason([string]$Text) {
  if ($Text -match '"reason"\s*:\s*"([^"]+)"') {
    return $Matches[1]
  }
  return ""
}

function Test-SitePageText([string]$Text) {
  if ([string]::IsNullOrWhiteSpace($Text)) {
    return $false
  }
  return $Text.Contains($script:SiteMarker)
}

function Get-CommandText($Info) {
  if ($null -eq $Info) {
    return ""
  }
  return (([string]$Info.CommandLine) + " " + ([string]$Info.ExecutablePath))
}

function Test-AppPathText([string]$Text) {
  if ([string]::IsNullOrWhiteSpace($Text)) {
    return $false
  }
  $folded = $Text.ToLowerInvariant()
  $app = $script:AppDir.ToLowerInvariant()
  return ($folded.Contains($app) -or $folded.Contains("sci-fi-noodle\app") -or $folded.Contains("sci-fi-noodle/app"))
}

function Test-ViteOrBunText([string]$Text) {
  if ([string]::IsNullOrWhiteSpace($Text)) {
    return $false
  }
  $folded = $Text.ToLowerInvariant()
  $bun = $script:BunExe.ToLowerInvariant()
  $isBun = $folded.Contains($bun) -and $folded.Contains("run") -and $folded.Contains("dev")
  $isVite = $folded.Contains("vite") -and $folded.Contains("dev")
  return ($isBun -or $isVite)
}

function Test-SidecarProcessText($Def, [string]$Text) {
  if ([string]::IsNullOrWhiteSpace($Text)) {
    return $false
  }
  $folded = $Text.ToLowerInvariant()
  if ($folded.Contains($Def.Python.ToLowerInvariant())) {
    return $true
  }
  $key = $Def.Key
  if ($folded.Contains("$key\start.ps1") -or $folded.Contains("$key/start.ps1")) {
    return $true
  }
  if ($folded.Contains($Def.Home.ToLowerInvariant()) -and $folded.Contains("uvicorn") -and $folded.Contains("server:app")) {
    return $true
  }
  return $false
}

function Test-UvicornText([string]$Text) {
  $folded = $Text.ToLowerInvariant()
  return ($folded.Contains("uvicorn") -and $folded.Contains("server:app"))
}

function Test-ChainHas([object[]]$Chain, [scriptblock]$Predicate) {
  foreach ($info in $Chain) {
    if (& $Predicate (Get-CommandText $info)) {
      return $true
    }
  }
  return $false
}

function Get-OutermostMatch([object[]]$Chain, [scriptblock]$Predicate) {
  $match = $null
  foreach ($info in $Chain) {
    if (& $Predicate (Get-CommandText $info)) {
      $match = $info
    }
  }
  return $match
}

function Test-PortIsThisSite([int]$Port) {
  $listeners = @(Get-ListeningPids $Port)
  if ($listeners.Count -eq 0) {
    return $false
  }
  $page = Invoke-CurlText -Url "http://127.0.0.1:$Port/" -TimeoutSec 20
  $pageOk = $page.Ok -and (Test-SitePageText $page.Text)
  foreach ($procId in $listeners) {
    $chain = @(Get-ProcessChain $procId)
    $pathOk = Test-ChainHas $chain { param($text) Test-AppPathText $text }
    $toolOk = Test-ChainHas $chain { param($text) Test-ViteOrBunText $text }
    if ($pathOk -and $toolOk) {
      return $true
    }
    if ($pageOk -and $toolOk) {
      return $true
    }
  }
  return $false
}

function Test-PortIsThisSidecar($Def) {
  $listeners = @(Get-ListeningPids $Def.Port)
  if ($listeners.Count -eq 0) {
    return $false
  }
  $health = Invoke-CurlText -Url "http://127.0.0.1:$($Def.Port)/health" -TimeoutSec 8
  if (-not $health.Ok -or -not (Test-SidecarHealthText $health.Text)) {
    return $false
  }
  foreach ($procId in $listeners) {
    $chain = @(Get-ProcessChain $procId)
    if (Test-ChainHas $chain { param($text) Test-SidecarProcessText $Def $text }) {
      return $true
    }
    if (Test-ChainHas $chain { param($text) Test-UvicornText $text }) {
      return $true
    }
  }
  return $false
}

function Get-SiteRootPid([int]$Port) {
  $listeners = @(Get-ListeningPids $Port)
  foreach ($procId in $listeners) {
    $chain = @(Get-ProcessChain $procId)
    $outer = Get-OutermostMatch $chain { param($text) (Test-AppPathText $text) -or (Test-ViteOrBunText $text) }
    if ($null -ne $outer) {
      return [int]$outer.ProcessId
    }
    return $procId
  }
  return 0
}

function Get-SidecarRootPid($Def) {
  $listeners = @(Get-ListeningPids $Def.Port)
  foreach ($procId in $listeners) {
    $chain = @(Get-ProcessChain $procId)
    $outer = Get-OutermostMatch $chain { param($text) (Test-SidecarProcessText $Def $text) -or (Test-UvicornText $text) }
    if ($null -ne $outer) {
      return [int]$outer.ProcessId
    }
    return $procId
  }
  return 0
}

function Find-FreeSitePort([int]$StartPort) {
  for ($port = $StartPort; $port -le ($StartPort + 20); $port++) {
    $listeners = @(Get-ListeningPids $port)
    if ($listeners.Count -eq 0) {
      return $port
    }
  }
  return 0
}

function Get-LogTail([string]$Path) {
  if (-not (Test-Path $Path)) {
    return ""
  }
  $lines = @(Get-Content -Path $Path -Tail 40 -ErrorAction SilentlyContinue)
  return ($lines -join [Environment]::NewLine)
}

function Wait-HttpReady {
  param(
    [string]$Url,
    [int]$TimeoutSec,
    [scriptblock]$Predicate,
    [System.Diagnostics.Process]$Process,
    [string]$ErrorLog
  )
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  do {
    if ($null -ne $Process) {
      $Process.Refresh()
      if ($Process.HasExited) {
        return $false
      }
    }
    $result = Invoke-CurlText -Url $Url -TimeoutSec 8
    if ($result.Ok -and (& $Predicate $result.Text)) {
      return $true
    }
    Start-Sleep -Seconds 1
  } while ((Get-Date) -lt $deadline)
  return $false
}

function Test-OwnedMarkers($Info, $Entry) {
  if ($null -eq $Info -or $null -eq $Entry) {
    return $false
  }
  $text = Get-CommandText $Info
  $markers = @(ConvertTo-StringArray $Entry.markers)
  if ($markers.Count -eq 0) {
    return $false
  }
  foreach ($marker in $markers) {
    if ([string]::IsNullOrWhiteSpace([string]$marker)) {
      return $false
    }
    if ($text.IndexOf([string]$marker, [StringComparison]::OrdinalIgnoreCase) -lt 0) {
      return $false
    }
  }
  return $true
}

function Stop-OwnedEntry($Entry, [string]$Label) {
  if ($null -eq $Entry) {
    return "missing"
  }
  $owned = $false
  if ($null -ne $Entry.owned) {
    $owned = [bool]$Entry.owned
  }
  $root = 0
  if ($null -ne $Entry.rootPid) {
    $root = [int]$Entry.rootPid
  }
  $url = [string]$Entry.url
  if (-not $owned) {
    if ($root -gt 0 -and (Test-ProcessAlive $root)) {
      Write-Host "$Label was already running and was not started by this script. Left PID $root ($url)."
      return "left"
    }
    Write-Host "$Label had no process started by this script."
    return "absent"
  }
  if ($root -le 0 -or $root -eq $PID) {
    Write-Host "Refusing to stop $Label because its PID is missing or is this script."
    return "refused"
  }
  $info = Get-ProcInfo $root
  if ($null -eq $info) {
    Write-Host "$Label PID $root is already gone."
    return "gone"
  }
  if (-not (Test-OwnedMarkers $info $Entry)) {
    Write-Host "$Label PID $root is no longer the process this script started. Left it alone."
    return "refused"
  }
  & taskkill.exe /PID $root /T /F 1>$null 2>$null
  $killCode = $LASTEXITCODE
  Start-Sleep -Milliseconds 400
  if (Test-ProcessAlive $root) {
    Write-Host "Failed to stop $Label PID $root (taskkill exit $killCode)."
    return "failed"
  }
  Write-Host "Stopped $Label PID $root ($url)."
  return "stopped"
}

function Stop-ClearSidecar($Def) {
  $port = $Def.Port
  $label = $Def.Label
  $listeners = @(Get-ListeningPids $port)
  if ($listeners.Count -eq 0) {
    Write-Host "No $label listener on port $port."
    return @()
  }
  if (-not (Test-PortIsThisSidecar $Def)) {
    Write-Host "Port $port is in use, but it is not the $label. Left it alone."
    return @()
  }
  $stopped = @()
  $roots = @{}
  foreach ($procId in $listeners) {
    $chain = @(Get-ProcessChain $procId)
    $outer = Get-OutermostMatch $chain { param($text) (Test-SidecarProcessText $Def $text) -or (Test-UvicornText $text) }
    $root = $procId
    if ($null -ne $outer) {
      $root = [int]$outer.ProcessId
    }
    if ($root -eq $PID -or $roots.ContainsKey($root)) {
      continue
    }
    $roots[$root] = $true
    $info = Get-ProcInfo $root
    $name = "process"
    if ($null -ne $info) {
      $name = [string]$info.Name
    }
    & taskkill.exe /PID $root /T /F 1>$null 2>$null
    Start-Sleep -Milliseconds 400
    if (Test-ProcessAlive $root) {
      Write-Host "Found $label $name PID $root, but could not stop it."
    } else {
      Write-Host "No PID file. Stopped $label $name PID $root (http://127.0.0.1:$port/health)."
      $stopped += $root
    }
  }
  return $stopped
}

function Stop-ClearSite {
  $stopped = @()
  $roots = @{}
  for ($port = $script:PreferredSitePort; $port -le ($script:PreferredSitePort + 20); $port++) {
    if (-not (Test-PortIsThisSite $port)) {
      continue
    }
    foreach ($procId in @(Get-ListeningPids $port)) {
      $chain = @(Get-ProcessChain $procId)
      $outer = Get-OutermostMatch $chain { param($text) (Test-AppPathText $text) -or (Test-ViteOrBunText $text) }
      $root = $procId
      if ($null -ne $outer) {
        $root = [int]$outer.ProcessId
      }
      if ($root -eq $PID -or $roots.ContainsKey($root)) {
        continue
      }
      $roots[$root] = $true
      $info = Get-ProcInfo $root
      $name = "process"
      if ($null -ne $info) {
        $name = [string]$info.Name
      }
      & taskkill.exe /PID $root /T /F 1>$null 2>$null
      Start-Sleep -Milliseconds 400
      if (Test-ProcessAlive $root) {
        Write-Host "Found site $name PID $root on port $port, but could not stop it."
      } else {
        Write-Host "No PID file. Stopped site $name PID $root (http://127.0.0.1:$port/)."
        $stopped += $root
      }
    }
  }
  if ($stopped.Count -eq 0) {
    Write-Host "No SCI-FI NOODLES vite/bun listener found."
  }
  return $stopped
}
