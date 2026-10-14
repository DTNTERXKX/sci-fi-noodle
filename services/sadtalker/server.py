"""Local SadTalker sidecar for the Katara host.

Bind address is 127.0.0.1. The SadTalker clone and checkpoints are not part of
the site repo. They default to %LOCALAPPDATA%\\sci-fi-noodle\\sadtalker.

Start:
  powershell -ExecutionPolicy Bypass -File services/sadtalker/start.ps1
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import threading
import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response

app = FastAPI(docs_url=None, redoc_url=None)
_lock = threading.Lock()
_cuda: bool | None = None


def sadtalker_home() -> Path:
    raw = os.environ.get("SADTALKER_HOME", "").strip()
    if raw:
        return Path(raw)
    local = os.environ.get("LOCALAPPDATA", "").strip()
    if local:
        return Path(local) / "sci-fi-noodle" / "sadtalker" / "SadTalker"
    return Path.home() / ".local" / "share" / "sci-fi-noodle" / "sadtalker" / "SadTalker"


def sadtalker_python() -> str:
    raw = os.environ.get("SADTALKER_PYTHON", "").strip()
    if raw and Path(raw).is_file():
        return raw
    sibling = sadtalker_home().parent / ".venv" / "Scripts" / "python.exe"
    if sibling.is_file():
        return str(sibling)
    nix = sadtalker_home().parent / ".venv" / "bin" / "python"
    if nix.is_file():
        return str(nix)
    return sys.executable


def work_root() -> Path:
    raw = os.environ.get("SADTALKER_WORK", "").strip()
    path = Path(raw) if raw else sadtalker_home().parent / "work"
    path.mkdir(parents=True, exist_ok=True)
    return path


def missing_checkpoints(home: Path) -> list[str]:
    needed = [
        "checkpoints/SadTalker_V0.0.2_256.safetensors",
        "checkpoints/mapping_00109-model.pth.tar",
        "checkpoints/mapping_00229-model.pth.tar",
    ]
    return [name for name in needed if not (home / name).is_file()]


def prepare_runtime(home: Path) -> None:
    """Make the upstream clone importable on current Python and PyTorch.

    GFPGAN is only required when --enhancer is set. The stock import pulls it
    in for every render, which fails when that extra stack is not installed.
    """
    awing = home / "src" / "face3d" / "util" / "my_awing_arch.py"
    if awing.is_file():
        text = awing.read_text(encoding="utf-8")
        patched = text.replace("astype(np.float,", "astype(np.float32,")
        if patched != text:
            awing.write_text(patched, encoding="utf-8")

    animate = home / "src" / "facerender" / "animate.py"
    if animate.is_file():
        text = animate.read_text(encoding="utf-8")
        marker = "from src.utils.face_enhancer import enhancer_generator_with_len, enhancer_list"
        if marker in text and "lipsync-lazy-enhancer" not in text:
            text = text.replace(
                marker,
                "# lipsync-lazy-enhancer: gfpgan loads only when --enhancer is set",
                1,
            )
            text = text.replace(
                "        if enhancer:\n",
                "        if enhancer:\n"
                "            from src.utils.face_enhancer import enhancer_generator_with_len, enhancer_list\n",
                1,
            )
            animate.write_text(text, encoding="utf-8")

    align = home / "src" / "face3d" / "util" / "preprocess.py"
    if align.is_file():
        text = align.read_text(encoding="utf-8")
        needle = "np.linalg.lstsq(A, b)"
        if needle in text and "lstsq(A, b, rcond=None)" not in text:
            text = text.replace(needle, "np.linalg.lstsq(A, b, rcond=None)", 1)
        assign = "k, _, _, _ = np.linalg.lstsq(A, b, rcond=None)"
        if assign in text and "np.asarray(k).reshape(-1)" not in text:
            text = text.replace(
                assign,
                assign + "\n    k = np.asarray(k).reshape(-1)",
                1,
            )
            align.write_text(text, encoding="utf-8")

    networks = home / "src" / "face3d" / "models" / "networks.py"
    if networks.is_file():
        text = networks.read_text(encoding="utf-8")
        old = "from kornia.geometry import warp_affine\n"
        if old in text and "kornia.geometry.transform import warp_affine" not in text:
            networks.write_text(
                text.replace(
                    old,
                    "try:\n"
                    "    from kornia.geometry import warp_affine\n"
                    "except ImportError:\n"
                    "    from kornia.geometry.transform import warp_affine\n",
                    1,
                ),
                encoding="utf-8",
            )


def cuda_available(home: Path) -> bool:
    global _cuda
    if os.environ.get("SADTALKER_CPU", "").strip() == "1":
        _cuda = False
        return False
    if _cuda is not None:
        return _cuda
    try:
        probe = subprocess.run(
            [sadtalker_python(), "-c", "import torch; raise SystemExit(0 if torch.cuda.is_available() else 1)"],
            cwd=home,
            capture_output=True,
            timeout=120,
            check=False,
        )
        _cuda = probe.returncode == 0
    except (OSError, subprocess.TimeoutExpired):
        _cuda = False
    return _cuda


def run_ffmpeg(args: list[str]) -> None:
    completed = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", *args],
        capture_output=True,
        timeout=60,
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError("ffmpeg failed")


def render(image_bytes: bytes, audio_bytes: bytes) -> bytes:
    home = sadtalker_home()
    if not (home / "inference.py").is_file():
        raise HTTPException(status_code=503, detail="sadtalker_missing")
    missing = missing_checkpoints(home)
    if missing:
        raise HTTPException(status_code=503, detail="checkpoints_missing")
    if shutil.which("ffmpeg") is None:
        raise HTTPException(status_code=503, detail="ffmpeg_missing")

    prepare_runtime(home)
    job = work_root() / uuid.uuid4().hex
    job.mkdir(parents=True, exist_ok=True)
    try:
        source = job / "source.png"
        speech = job / "speech.wav"
        source.write_bytes(image_bytes)
        audio_path = job / "speech.bin"
        audio_path.write_bytes(audio_bytes)
        scaled = job / "portrait.png"
        run_ffmpeg(
            [
                "-y",
                "-i",
                str(source),
                "-vf",
                "scale=1280:1280:force_original_aspect_ratio=decrease",
                str(scaled),
            ]
        )
        run_ffmpeg(["-y", "-i", str(audio_path), "-ac", "1", "-ar", "16000", str(speech)])
        result_dir = job / "out"
        result_dir.mkdir()
        command = [
            sadtalker_python(),
            "inference.py",
            "--driven_audio",
            str(speech),
            "--source_image",
            str(scaled),
            "--result_dir",
            str(result_dir),
            "--preprocess",
            "full",
            "--still",
            "--size",
            "256",
            "--batch_size",
            "1",
            "--expression_scale",
            "1.0",
        ]
        if not cuda_available(home):
            command.append("--cpu")
        completed = subprocess.run(
            command,
            cwd=home,
            capture_output=True,
            timeout=160,
            check=False,
        )
        if completed.returncode != 0:
            tail = (completed.stderr or completed.stdout or b"")[-1200:]
            print("SadTalker inference failed", tail.decode("utf-8", errors="replace"))
            raise HTTPException(status_code=500, detail="inference_failed")
        videos = sorted(result_dir.glob("*.mp4"), key=lambda path: path.stat().st_mtime)
        if not videos:
            raise HTTPException(status_code=500, detail="inference_failed")
        playable = job / "talk.mp4"
        run_ffmpeg(
            [
                "-y",
                "-i",
                str(videos[-1]),
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                "-c:a",
                "aac",
                "-movflags",
                "+faststart",
                str(playable),
            ]
        )
        payload = playable.read_bytes()
        if len(payload) < 1000:
            raise HTTPException(status_code=500, detail="inference_failed")
        return payload
    except subprocess.TimeoutExpired as error:
        raise HTTPException(status_code=504, detail="timeout") from error
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail="inference_failed") from error
    finally:
        shutil.rmtree(job, ignore_errors=True)


@app.get("/health")
def health():
    home = sadtalker_home()
    has_code = (home / "inference.py").is_file()
    missing = missing_checkpoints(home) if has_code else ["checkpoints"]
    ffmpeg = shutil.which("ffmpeg") is not None
    ready = has_code and not missing and ffmpeg
    reason = None
    if not has_code:
        reason = "sadtalker_missing"
    elif missing:
        reason = "checkpoints_missing"
    elif not ffmpeg:
        reason = "ffmpeg_missing"
    return {"ok": True, "ready": ready, "reason": reason}


@app.post("/talk")
def talk(image: UploadFile = File(...), audio: UploadFile = File(...)):
    if not _lock.acquire(blocking=False):
        raise HTTPException(status_code=409, detail="busy")
    try:
        image_bytes = image.file.read(12_000_000)
        audio_bytes = audio.file.read(8_000_000)
        if not image_bytes or not audio_bytes:
            raise HTTPException(status_code=400, detail="empty_input")
        if len(image_bytes) >= 12_000_000 or len(audio_bytes) >= 8_000_000:
            raise HTTPException(status_code=413, detail="input_too_large")
        video = render(image_bytes, audio_bytes)
        return Response(content=video, media_type="video/mp4")
    finally:
        _lock.release()
