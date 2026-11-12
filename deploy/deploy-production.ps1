# Upload publish/ to Plesk via FTP credentials from Distro Hub (runtime only; never commit secrets).
#
# Default DistroHubPath tries distro_hub.json, then distro.json in the same folder.
# Canonical on disk today: C:\Users\booba\Downloads\distro_hub\distro.json
# Agents never run the live upload.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File deploy\deploy-production.ps1 -WhatIf
#   powershell -NoProfile -ExecutionPolicy Bypass -File deploy\deploy-production.ps1 -Build
#   powershell -NoProfile -ExecutionPolicy Bypass -File deploy\deploy-production.ps1 -Domain scifinoodles.com
#
# Distro Hub field names used (values never logged as secrets):
#   Sites / site.domain   — match Domain (exact host; www. stripped for compare)
#   Sites / site.dir      — remote deploy path under the FTP home (DLL parent / document root)
#   Sites / site.deploy   — optional local publish path hint (PublishDir param wins if set)
#   ftp.Host, ftp.Port, ftp.Username, ftp.Password — shared FTP account
# Optional hub keys if added later: ftp.Ssl / ftp.FTPS / ftp.Passive / ftp.UseSsl
# Parse order: ConvertFrom-Json when valid; regex fallback if duplicate site/mailbox keys still break JSON.

#Requires -Version 5.1
[CmdletBinding()]
param(
  [string]$Domain = "scifinoodles.com",
  [string]$DistroHubPath = "C:\Users\booba\Downloads\distro_hub\distro_hub.json",
  [string]$PublishDir = "",
  [switch]$Build,
  # Dry-run: list every remote path; do not upload.
  [switch]$WhatIf,
  # Hub has no SSL flag today; Plesk on :21 usually wants explicit FTPS. -PlainFtp forces clear FTP.
  [switch]$PlainFtp,
  [switch]$Ftps
)

$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrWhiteSpace($PublishDir)) {
  $PublishDir = Join-Path $Root "publish"
}

function Resolve-DistroHubFile {
  param([Parameter(Mandatory = $true)][string]$Path)
  if (Test-Path -LiteralPath $Path) { return (Resolve-Path -LiteralPath $Path).Path }
  $dir = Split-Path -Parent $Path
  $name = Split-Path -Leaf $Path
  $alts = @()
  if ($name -ieq "distro_hub.json") {
    $alts += (Join-Path $dir "distro.json")
  } elseif ($name -ieq "distro.json") {
    $alts += (Join-Path $dir "distro_hub.json")
  } else {
    $alts += (Join-Path $dir "distro.json")
    $alts += (Join-Path $dir "distro_hub.json")
  }
  foreach ($alt in $alts) {
    if (Test-Path -LiteralPath $alt) {
      Write-Host "Distro Hub path '$Path' missing; using '$alt'."
      return (Resolve-Path -LiteralPath $alt).Path
    }
  }
  throw "Distro Hub JSON not found at '$Path' (also checked distro.json / distro_hub.json in the same folder)."
}

function Get-Prop {
  param($Object, [string[]]$Names)
  if ($null -eq $Object) { return $null }
  foreach ($n in $Names) {
    $p = $Object.PSObject.Properties[$n]
    if ($null -ne $p -and $null -ne $p.Value -and "$($p.Value)".Trim() -ne "") {
      return $p.Value
    }
  }
  return $null
}

function Normalize-DomainHost {
  param([string]$Value)
  $h = ($Value -replace '^\s*https?://', '').Trim().TrimEnd('/').ToLowerInvariant()
  if ($h.StartsWith("www.")) { $h = $h.Substring(4) }
  return $h
}

# Prefer ConvertFrom-Json when Distro Hub is valid. Fall back to per-"site" regex scrape
# when duplicate keys / missing commas still break the document (PS collapses duplicate keys).
function Read-DistroHubSitesAndFtp {
  param([Parameter(Mandatory = $true)][string]$Path)

  $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
  if ([string]::IsNullOrWhiteSpace($raw)) {
    throw "Distro Hub file is empty: $Path"
  }

  $rawSiteKeyCount = ([regex]::Matches($raw, '(?i)"site"\s*:')).Count

  function Add-SiteCandidates {
    param(
      [Parameter(Mandatory = $true)]$List,
      $Bucket
    )
    if ($null -eq $Bucket) { return }
    $candidates = @()
    if ($Bucket -is [System.Array]) {
      $candidates = $Bucket
    } else {
      $siteProp = Get-Prop $Bucket @("site", "Site")
      if ($null -ne $siteProp) {
        if ($siteProp -is [System.Array]) { $candidates = $siteProp } else { $candidates = @($siteProp) }
      } else {
        foreach ($p in $Bucket.PSObject.Properties) { $candidates += $p.Value }
      }
    }
    foreach ($c in $candidates) {
      if ($null -ne (Get-Prop $c @("domain", "Domain"))) { $List.Add($c) | Out-Null }
    }
  }

  function Try-ParseDistroDoc {
    param([string]$Text)
    try {
      return ($Text | ConvertFrom-Json)
    } catch {
      return $null
    }
  }

  $sites = New-Object System.Collections.Generic.List[object]
  $ftp = $null
  $parseMode = "regex-fallback"

  # 1) Clean path: valid JSON (optionally after inserting missing commas between "..." lines).
  $doc = Try-ParseDistroDoc -Text $raw
  if ($null -eq $doc) {
    $fixed = [regex]::Replace($raw, '"\s*\n\s*"', '",`n"')
    $fixed = $fixed -replace ',(\s*[}\]])', '$1'
    $doc = Try-ParseDistroDoc -Text $fixed
  }

  if ($null -ne $doc) {
    $cleanSites = New-Object System.Collections.Generic.List[object]
    Add-SiteCandidates -List $cleanSites -Bucket (Get-Prop $doc @("Sites", "sites"))
    # If the file still uses duplicate "site" keys, ConvertFrom-Json keeps only the last one —
    # treat that as incomplete and fall through to regex so every domain stays visible.
    $collapsed = ($rawSiteKeyCount -gt 1 -and $cleanSites.Count -lt $rawSiteKeyCount)
    if ($cleanSites.Count -gt 0 -and -not $collapsed) {
      foreach ($s in $cleanSites) { $sites.Add($s) | Out-Null }
      $ftp = Get-Prop $doc @("ftp", "Ftp", "FTP")
      $parseMode = "ConvertFrom-Json"
    }
  }

  # 2) Fallback: extract every "site": { ... } block + top-level "ftp" object.
  if ($sites.Count -eq 0) {
    $parseMode = "regex-fallback"
    $siteMatches = [regex]::Matches(
      $raw,
      '(?s)"site"\s*:\s*\{([^{}]*)\}'
    )
    foreach ($m in $siteMatches) {
      $body = "{" + $m.Groups[1].Value + "}"
      $normalized = [regex]::Replace($body, '"\s*\n\s*"', '",`n"')
      $normalized = $normalized -replace ',(\s*})', '$1'
      try {
        $obj = $normalized | ConvertFrom-Json
      } catch {
        $domain = $null; $dir = $null; $deploy = $null
        $dm = [regex]::Match($body, '"domain"\s*:\s*"([^"]*)"')
        if ($dm.Success) { $domain = $dm.Groups[1].Value }
        $drm = [regex]::Match($body, '"dir"\s*:\s*"([^"]*)"')
        if ($drm.Success) { $dir = $drm.Groups[1].Value }
        $dpm = [regex]::Match($body, '"deploy"\s*:\s*"([^"]*)"')
        if ($dpm.Success) { $deploy = $dpm.Groups[1].Value }
        if (-not $domain) { continue }
        $obj = [pscustomobject]@{ domain = $domain; dir = $dir; deploy = $deploy }
      }
      $sites.Add($obj) | Out-Null
    }

    if ($null -eq $ftp) {
      $ftpMatch = [regex]::Match($raw, '(?s)"ftp"\s*:\s*\{([^{}]*)\}')
      if ($ftpMatch.Success) {
        $ftpBody = "{" + $ftpMatch.Groups[1].Value + "}"
        $ftpNorm = [regex]::Replace($ftpBody, '"\s*\n\s*"', '",`n"')
        $ftpNorm = $ftpNorm -replace ',(\s*})', '$1'
        try {
          $ftp = $ftpNorm | ConvertFrom-Json
        } catch {
          $ftp = [pscustomobject]@{}
          foreach ($key in @("Host", "Port", "Username", "Password", "Ssl", "FTPS", "Passive", "UseSsl")) {
            $km = [regex]::Match($ftpBody, ('"' + $key + '"\s*:\s*"?([^",}\r\n]+)"?'), 'IgnoreCase')
            if ($km.Success) {
              $ftp | Add-Member -NotePropertyName $key -NotePropertyValue $km.Groups[1].Value.Trim() -Force
            }
          }
        }
      }
    }
  }

  Write-Host ("Distro Hub parse: {0} ({1} site entries)" -f $parseMode, $sites.Count)

  return [pscustomobject]@{
    Sites     = $sites
    Ftp       = $ftp
    Path      = $Path
    ParseMode = $parseMode
  }
}

function Find-SiteEntry {
  param(
    [Parameter(Mandatory = $true)]$Sites,
    [Parameter(Mandatory = $true)][string]$Domain
  )
  $want = Normalize-DomainHost $Domain
  $exact = @()
  $www = @()
  $listed = New-Object System.Collections.Generic.List[string]

  foreach ($s in $Sites) {
    $d = Get-Prop $s @("domain", "Domain", "host", "Host")
    if (-not $d) { continue }
    $listed.Add([string]$d) | Out-Null
    $norm = Normalize-DomainHost $d
    if ($norm -eq $want) {
      if (([string]$d).ToLowerInvariant().StartsWith("www.")) { $www += $s } else { $exact += $s }
    }
  }

  if ($exact.Count -ge 1) { return $exact[0] }
  if ($www.Count -ge 1) { return $www[0] }

  $available = if ($listed.Count -gt 0) { ($listed | Select-Object -Unique) -join ", " } else { "(none parsed)" }
  throw "No Distro Hub site entry for domain '$Domain'. Domains found: $available"
}

function ConvertTo-FtpRemotePath {
  param([string]$Dir)
  if ([string]::IsNullOrWhiteSpace($Dir)) {
    throw "Site entry has empty 'dir' (remote deploy path). Set Sites.site.dir to the FTP folder that is the document root (parent of SciFiNoodles.Web.dll), e.g. scifinoodles.com/publish — not wwwroot alone."
  }
  $p = $Dir.Trim() -replace '\\', '/'
  $p = $p.Trim('/')
  if ([string]::IsNullOrWhiteSpace($p)) {
    throw "Site entry 'dir' resolved empty after normalize."
  }
  return $p
}

function Test-HubWantsFtps {
  param($Ftp, [switch]$PlainFtp, [switch]$Ftps)
  if ($PlainFtp) { return $false }
  if ($Ftps) { return $true }
  $flag = Get-Prop $Ftp @("Ssl", "FTPS", "UseSsl", "ExplicitSsl", "ssl", "ftps")
  if ($null -eq $flag) {
    # Hub has no SSL field today; Plesk :21 → prefer explicit FTPS.
    return $true
  }
  $t = "$flag".Trim().ToLowerInvariant()
  return @("1", "true", "yes", "on", "ftps", "explicit") -contains $t
}

function Ensure-RemoteDirsWithCurl {
  param(
    [string]$Curl,
    [string[]]$BaseArgs,
    [string]$RemoteRootUrl,  # e.g. ftp://host:21/scifinoodles.com/publish
    [string[]]$RelativeDirs,
    [switch]$DryRun
  )
  $created = New-Object 'System.Collections.Generic.HashSet[string]'
  foreach ($rel in ($RelativeDirs | Sort-Object { $_.Length })) {
    if ([string]::IsNullOrWhiteSpace($rel)) { continue }
    $parts = $rel -split '/'
    $acc = ""
    foreach ($part in $parts) {
      if ($acc) { $acc = "$acc/$part" } else { $acc = $part }
      if (-not $created.Add($acc)) { continue }
      $url = "$RemoteRootUrl/$acc/"
      if ($DryRun) {
        Write-Host "[WhatIf] MKD $acc"
        continue
      }
      & $Curl @BaseArgs --ftp-create-dirs -Q "NOOP" $url 2>$null | Out-Null
      # Directory may already exist; ignore non-zero here. File uploads use --ftp-create-dirs.
    }
  }
}

function Publish-WithCurl {
  param(
    [string]$LocalRoot,
    [string]$HostName,
    [int]$Port,
    [string]$Username,
    [string]$Password,
    [string]$RemoteDir,
    [bool]$UseFtps,
    [bool]$DryRun
  )

  $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
  if (-not $curl) { throw "curl.exe not found on PATH (needed for FTP upload)." }

  $scheme = "ftp"
  $baseArgs = @(
    "--silent", "--show-error", "--fail",
    "--connect-timeout", "30",
    "--user", "${Username}:${Password}"
  )
  if ($UseFtps) {
    # Explicit TLS (AUTH TLS) on the control port — typical Plesk FTPS.
    $baseArgs += @("--ssl-reqd", "--ftp-ssl")
  }

  $remoteRootUrl = "${scheme}://${HostName}:${Port}/${RemoteDir}"
  $files = Get-ChildItem -LiteralPath $LocalRoot -Recurse -File
  if ($files.Count -eq 0) {
    throw "Publish directory has no files: $LocalRoot"
  }

  $relDirs = @(
    $files |
      ForEach-Object {
        $rel = $_.FullName.Substring($LocalRoot.Length).TrimStart('\', '/')
        $parent = Split-Path -Parent $rel
        if ($parent) { ($parent -replace '\\', '/') } else { $null }
      } |
      Where-Object { $_ } |
      Select-Object -Unique
  )

  Write-Host ("Uploading {0} files to {1}/ (FTPS={2})" -f $files.Count, $RemoteDir, $UseFtps)

  Ensure-RemoteDirsWithCurl -Curl $curl.Source -BaseArgs $baseArgs -RemoteRootUrl $remoteRootUrl -RelativeDirs $relDirs -DryRun:$DryRun

  $i = 0
  foreach ($f in $files) {
    $i++
    $rel = $f.FullName.Substring($LocalRoot.Length).TrimStart('\', '/')
    $relUnix = $rel -replace '\\', '/'
    $destUrl = "$remoteRootUrl/$relUnix"
    if ($DryRun) {
      Write-Host ("[WhatIf] {0}/{1}  {2}  ({3:N0} bytes)" -f $i, $files.Count, $relUnix, $f.Length)
      continue
    }
    Write-Host ("[{0}/{1}] {2}" -f $i, $files.Count, $relUnix)
    & $curl.Source @baseArgs --ftp-create-dirs -T $f.FullName $destUrl
    if ($LASTEXITCODE -ne 0) {
      throw "curl upload failed (exit $LASTEXITCODE) for $relUnix → $RemoteDir/$relUnix"
    }
  }
}

# --- main ---

$hubFile = Resolve-DistroHubFile -Path $DistroHubPath

if ($Build) {
  $buildScript = Join-Path $PSScriptRoot "build-production.ps1"
  Write-Host "Running $buildScript ..."
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $buildScript
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if (-not (Test-Path -LiteralPath $PublishDir)) {
  throw "publish/ missing at '$PublishDir'. Run deploy\build-production.ps1 first (or pass -Build)."
}

$dll = Join-Path $PublishDir "SciFiNoodles.Web.dll"
$wwwIndex = Join-Path $PublishDir "wwwroot\index.html"
if (-not (Test-Path -LiteralPath $dll)) {
  throw "Missing SciFiNoodles.Web.dll under '$PublishDir'. Document root must be the DLL parent (contents of publish/), not wwwroot alone."
}
if (-not (Test-Path -LiteralPath $wwwIndex)) {
  throw "Missing wwwroot\index.html under '$PublishDir'."
}

$hub = Read-DistroHubSitesAndFtp -Path $hubFile
if ($null -eq $hub.Ftp) {
  throw "Distro Hub has no top-level 'ftp' object (expected ftp.Host / ftp.Port / ftp.Username / ftp.Password)."
}

$site = Find-SiteEntry -Sites $hub.Sites -Domain $Domain
$remoteDir = ConvertTo-FtpRemotePath -Dir (Get-Prop $site @("dir", "Dir", "remote", "path", "Path"))

# Optional: hub site.deploy can point at a different local folder; only use if PublishDir was left default.
$hubDeploy = Get-Prop $site @("deploy", "Deploy")
if ($hubDeploy -and $PublishDir -eq (Join-Path $Root "publish") -and (Test-Path -LiteralPath $hubDeploy)) {
  $resolvedHub = (Resolve-Path -LiteralPath $hubDeploy).Path
  $resolvedDefault = (Resolve-Path -LiteralPath $PublishDir).Path
  if ($resolvedHub -ne $resolvedDefault) {
    Write-Host "Note: hub site.deploy is '$hubDeploy'; using -PublishDir / repo publish instead: $PublishDir"
  }
}

$ftpHost = [string](Get-Prop $hub.Ftp @("Host", "host", "Server", "server"))
$ftpUser = [string](Get-Prop $hub.Ftp @("Username", "User", "username", "user"))
$ftpPass = [string](Get-Prop $hub.Ftp @("Password", "password", "Pass", "pass"))
$ftpPortRaw = Get-Prop $hub.Ftp @("Port", "port")
$ftpPort = 21
if ($null -ne $ftpPortRaw -and "$ftpPortRaw".Trim() -ne "") {
  $ftpPort = [int]$ftpPortRaw
}

if ([string]::IsNullOrWhiteSpace($ftpHost) -or [string]::IsNullOrWhiteSpace($ftpUser) -or [string]::IsNullOrWhiteSpace($ftpPass)) {
  throw "FTP credentials empty in Distro Hub 'ftp' block (need Host, Username, Password)."
}

$useFtps = Test-HubWantsFtps -Ftp $hub.Ftp -PlainFtp:$PlainFtp -Ftps:$Ftps
$localRoot = (Resolve-Path -LiteralPath $PublishDir).Path

Write-Host "Distro Hub : $hubFile"
Write-Host "Domain     : $Domain"
Write-Host "Local      : $localRoot"
Write-Host "Remote dir : $remoteDir   (document root = parent of SciFiNoodles.Web.dll)"
Write-Host "FTP host   : $ftpHost`:$ftpPort  user=$ftpUser  FTPS=$useFtps"
Write-Host "(Password read from hub at runtime; not printed.)"

if ($WhatIf) {
  Write-Host "WhatIf: listing files only (no FTP upload)."
}

try {
  Publish-WithCurl `
    -LocalRoot $localRoot `
    -HostName $ftpHost `
    -Port $ftpPort `
    -Username $ftpUser `
    -Password $ftpPass `
    -RemoteDir $remoteDir `
    -UseFtps $useFtps `
    -DryRun:([bool]$WhatIf)
} catch {
  if ($useFtps -and -not $PlainFtp -and -not $WhatIf) {
    Write-Warning "FTPS upload failed ($($_.Exception.Message)). Retrying once with clear FTP (-PlainFtp). Prefer fixing FTPS if the host requires it."
    Publish-WithCurl `
      -LocalRoot $localRoot `
      -HostName $ftpHost `
      -Port $ftpPort `
      -Username $ftpUser `
      -Password $ftpPass `
      -RemoteDir $remoteDir `
      -UseFtps $false `
      -DryRun:$false
  } else {
    throw
  }
}

$tsrMarker = [string][char]36 + "_TSR"
Write-Host ""
Write-Host "Upload finished (or listed with -WhatIf)."
Write-Host "Next (Brien, not agents): recycle the Plesk app pool / stop+start the site so the new DLL loads,"
Write-Host "then confirm wwwroot/index.html is ~62KB and contains $tsrMarker (hydratable shell)."
Write-Host "Agents never deploy the live site."
