# Install SadTalker outside the git repo and OneDrive.
# Clone, virtualenv, and checkpoints go to %LOCALAPPDATA%\sci-fi-noodle\sadtalker.
# Re-run safely. Already downloaded weights are left in place.

$ErrorActionPreference = "Stop"
$Root = Join-Path $env:LOCALAPPDATA "sci-fi-noodle\sadtalker"
$Repo = Join-Path $Root "SadTalker"
$Venv = Join-Path $Root ".venv"
$Python = Join-Path $Venv "Scripts\python.exe"
$Log = Join-Path $Root "install.log"

New-Item -ItemType Directory -Force -Path $Root | Out-Null
Start-Transcript -Path $Log -Append | Out-Null

if (-not (Test-Path (Join-Path $Repo "inference.py"))) {
  git clone --depth 1 https://github.com/OpenTalker/SadTalker.git $Repo
}

if (-not (Test-Path $Python)) {
  py -3.12 -m venv $Venv
}

& $Python -m pip install -U pip wheel
try {
  & $Python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
  if ($LASTEXITCODE -ne 0) { throw "cu128 torch install failed" }
} catch {
  Write-Output "CUDA 12.8 wheel failed; trying the default PyTorch index."
  & $Python -m pip install torch torchvision torchaudio
}

& $Python -m pip install `
  "numpy==1.26.4" scipy "librosa>=0.10" numba resampy pydub "kornia>=0.7" `
  yacs pyyaml joblib "scikit-image>=0.22" imageio imageio-ffmpeg safetensors av `
  opencv-python tqdm pillow face-alignment facexlib fastapi "uvicorn[standard]" python-multipart

$CheckpointDir = Join-Path $Repo "checkpoints"
$WeightDir = Join-Path $Repo "gfpgan\weights"
New-Item -ItemType Directory -Force -Path $CheckpointDir, $WeightDir | Out-Null

function Save-Model($Url, $Dest) {
  if ((Test-Path $Dest) -and ((Get-Item $Dest).Length -gt 1000000)) {
    Write-Output "keep $Dest"
    return
  }
  Write-Output "download $Url"
  & curl.exe -L --fail --retry 5 --retry-all-errors -C - -o $Dest $Url
  if ($LASTEXITCODE -ne 0) { throw "download failed: $Url" }
}

Save-Model "https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/mapping_00109-model.pth.tar" (Join-Path $CheckpointDir "mapping_00109-model.pth.tar")
Save-Model "https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/mapping_00229-model.pth.tar" (Join-Path $CheckpointDir "mapping_00229-model.pth.tar")
Save-Model "https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/SadTalker_V0.0.2_256.safetensors" (Join-Path $CheckpointDir "SadTalker_V0.0.2_256.safetensors")
Save-Model "https://github.com/xinntao/facexlib/releases/download/v0.1.0/alignment_WFLW_4HG.pth" (Join-Path $WeightDir "alignment_WFLW_4HG.pth")
Save-Model "https://github.com/xinntao/facexlib/releases/download/v0.1.0/detection_Resnet50_Final.pth" (Join-Path $WeightDir "detection_Resnet50_Final.pth")

& $Python -c "import torch; print('torch', torch.__version__, 'cuda', torch.cuda.is_available())"
Write-Output "SadTalker install finished. Start the sidecar with services/sadtalker/start.ps1"
Stop-Transcript | Out-Null
