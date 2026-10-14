# Install MuseTalk 1.5 outside the git repo and OneDrive.
# Clone, virtualenv, and weights go to %LOCALAPPDATA%\sci-fi-noodle\musetalk.
# Re-run safely. Already downloaded weights are left in place.
# No mmcv / mmpose / mmdet: face landmarks come from face_alignment instead of DWPose.

$ErrorActionPreference = "Stop"
$Root = Join-Path $env:LOCALAPPDATA "sci-fi-noodle\musetalk"
$Repo = Join-Path $Root "MuseTalk"
$Venv = Join-Path $Root ".venv"
$Python = Join-Path $Venv "Scripts\python.exe"
$Models = Join-Path $Root "models"
$Log = Join-Path $Root "install.log"

New-Item -ItemType Directory -Force -Path $Root | Out-Null
Start-Transcript -Path $Log -Append | Out-Null

if (-not (Test-Path (Join-Path $Repo "musetalk\models\unet.py"))) {
  git clone --depth 1 https://github.com/TMElyralab/MuseTalk.git $Repo
  if ($LASTEXITCODE -ne 0) { throw "MuseTalk clone failed" }
}

if (-not (Test-Path $Python)) {
  py -3.12 -m venv $Venv
}

& $Python -m pip install -U pip wheel
$ErrorActionPreference = "Continue"
& $Python -c "import torch, sys; sys.exit(0 if torch.cuda.is_available() else 1)" 2>$null
$HasTorch = $LASTEXITCODE -eq 0
$ErrorActionPreference = "Stop"
if (-not $HasTorch) {
  & $Python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
  if ($LASTEXITCODE -ne 0) { throw "cu128 torch install failed" }
}

& $Python -m pip install `
  "numpy==1.26.4" scipy "librosa>=0.10" soundfile opencv-python pillow einops omegaconf `
  "diffusers>=0.30" "transformers>=4.45" accelerate safetensors face-alignment gdown `
  fastapi "uvicorn[standard]" python-multipart
if ($LASTEXITCODE -ne 0) { throw "dependency install failed" }

function Save-Model($Url, $Dest, [long]$MinBytes = 1000) {
  if ((Test-Path $Dest) -and ((Get-Item $Dest).Length -gt $MinBytes)) {
    Write-Output "keep $Dest"
    return $true
  }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Dest) | Out-Null
  Write-Output "download $Url"
  & curl.exe -L --fail --retry 5 --retry-all-errors -C - -o $Dest $Url
  if ($LASTEXITCODE -ne 0) {
    Remove-Item $Dest -Force -ErrorAction SilentlyContinue
    return $false
  }
  return $true
}

function Require-Model($Url, $Dest, [long]$MinBytes = 1000) {
  if (-not (Save-Model $Url $Dest $MinBytes)) { throw "download failed: $Url" }
}

$Hf = "https://huggingface.co"
Require-Model "$Hf/TMElyralab/MuseTalk/resolve/main/musetalkV15/unet.pth" (Join-Path $Models "musetalkV15\unet.pth") 100000000
Require-Model "$Hf/TMElyralab/MuseTalk/resolve/main/musetalkV15/musetalk.json" (Join-Path $Models "musetalkV15\musetalk.json")
Require-Model "$Hf/stabilityai/sd-vae-ft-mse/resolve/main/config.json" (Join-Path $Models "sd-vae\config.json")
Require-Model "$Hf/stabilityai/sd-vae-ft-mse/resolve/main/diffusion_pytorch_model.safetensors" (Join-Path $Models "sd-vae\diffusion_pytorch_model.safetensors") 10000000
Require-Model "$Hf/openai/whisper-tiny/resolve/main/config.json" (Join-Path $Models "whisper\config.json")
Require-Model "$Hf/openai/whisper-tiny/resolve/main/preprocessor_config.json" (Join-Path $Models "whisper\preprocessor_config.json")
Require-Model "$Hf/openai/whisper-tiny/resolve/main/model.safetensors" (Join-Path $Models "whisper\model.safetensors") 10000000

# Face parsing (BiSeNet) gives the jaw blend mask. If it cannot be fetched the
# sidecar falls back to a feathered lower-face mask.
$ParseDir = Join-Path $Models "face-parse-bisent"
Save-Model "https://download.pytorch.org/models/resnet18-5c106cde.pth" (Join-Path $ParseDir "resnet18-5c106cde.pth") 10000000 | Out-Null
$Bisenet = Join-Path $ParseDir "79999_iter.pth"
if (-not ((Test-Path $Bisenet) -and ((Get-Item $Bisenet).Length -gt 10000000))) {
  $ErrorActionPreference = "Continue"
  & $Python -m gdown 154JgKpzCPW82qINcVieuPH3fZ2e0P812 -O $Bisenet
  $ErrorActionPreference = "Stop"
  if (-not ((Test-Path $Bisenet) -and ((Get-Item $Bisenet).Length -gt 10000000))) {
    Remove-Item $Bisenet -Force -ErrorAction SilentlyContinue
    Write-Output "BiSeNet weights unavailable; the sidecar will use a feathered lower-face mask."
  }
}

& $Python -c "import torch; print('torch', torch.__version__, 'cuda', torch.cuda.is_available())"
Write-Output "MuseTalk install finished. Start the sidecar with services/musetalk/start.ps1"
Stop-Transcript | Out-Null
