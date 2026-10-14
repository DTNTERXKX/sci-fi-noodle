"""Local MuseTalk 1.5 sidecar for the Katara host.

Bind address is 127.0.0.1. The MuseTalk clone and weights are not part of the
site repo. They default to %LOCALAPPDATA%\\sci-fi-noodle\\musetalk.

Each mode is a single still portrait. Models and the three avatars stay warm on
the GPU; POST /frames turns one sentence of speech into 25 fps mouth crops that
the browser draws over the still face.

Stream format (application/x-ndjson, one JSON object per line):
  {"type":"clip","fps":25,"frames":N,"bbox":[x,y,w,h],"size":[W,H]}
  {"type":"frames","start":i,"jpegs":["<base64 jpeg>", ...]}
  {"type":"end","frames":N,"ms":T,"fps":F}
  {"type":"error","error":"..."}

Start:
  powershell -ExecutionPolicy Bypass -File services/musetalk/start.ps1
"""

from __future__ import annotations

import base64
import io
import json
import math
import os
import queue
import sys
import threading
import time
import traceback
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

FPS = 25
SAMPLE_RATE = 16000
EXTRA_MARGIN = 10
CHEEK_WIDTH = 90
FIRST_BATCH = 4
BATCH = 12
JPEG_QUALITY = int(os.environ.get("MUSETALK_JPEG_QUALITY", "82"))
MODES = ("chill", "crunk", "glam")
REPO_ROOT = Path(__file__).resolve().parents[2]

app = FastAPI(docs_url=None, redoc_url=None)
# One persistent thread owns every CUDA call: load, warm-up, and renders.
# A fresh thread pays a large one-time CUDA setup cost on its first batches.
_gpu = ThreadPoolExecutor(max_workers=1, thread_name_prefix="musetalk-gpu")
_state: dict = {"ready": False, "reason": "loading", "fps": None, "mask": None}
_engine: "Engine | None" = None


def musetalk_root() -> Path:
    raw = os.environ.get("MUSETALK_ROOT", "").strip()
    if raw:
        return Path(raw)
    local = os.environ.get("LOCALAPPDATA", "").strip()
    if local:
        return Path(local) / "sci-fi-noodle" / "musetalk"
    return Path.home() / ".local" / "share" / "sci-fi-noodle" / "musetalk"


def portrait_path(mode: str) -> Path:
    return REPO_ROOT / "app" / "public" / "brand" / f"katara-{mode}-face.png"


class Avatar:
    """One still portrait prepared for MuseTalk: latents plus a blend region."""

    def __init__(self, image: np.ndarray, box: list[int], latents, alpha: np.ndarray, cut: list[int]):
        self.height, self.width = image.shape[:2]
        self.box = box
        self.latents = latents
        x0, y0, x1, y1 = cut
        self.cut = cut
        self.alpha = alpha
        self.base = image[y0:y1, x0:x1].astype(np.float32)
        self.base_u8 = image[y0:y1, x0:x1].copy()

    def compose(self, face: np.ndarray) -> np.ndarray:
        """Blend one generated 256x256 face into the cut region (BGR uint8)."""
        bx0, by0, bx1, by1 = self.box
        cx0, cy0, cx1, cy1 = self.cut
        resized = cv2.resize(face, (bx1 - bx0, by1 - by0), interpolation=cv2.INTER_LINEAR)
        large = self.base_u8.copy()
        ix0, iy0 = max(bx0, cx0), max(by0, cy0)
        ix1, iy1 = min(bx1, cx1), min(by1, cy1)
        if ix1 > ix0 and iy1 > iy0:
            large[iy0 - cy0 : iy1 - cy0, ix0 - cx0 : ix1 - cx0] = resized[
                iy0 - by0 : iy1 - by0, ix0 - bx0 : ix1 - bx0
            ]
        mixed = self.base + (large.astype(np.float32) - self.base) * self.alpha
        return np.clip(mixed + 0.5, 0, 255).astype(np.uint8)


class Engine:
    def __init__(self, root: Path):
        import torch
        from diffusers import AutoencoderKL, UNet2DConditionModel
        from transformers import AutoFeatureExtractor, WhisperModel

        repo = root / "MuseTalk"
        if str(repo) not in sys.path:
            sys.path.insert(0, str(repo))
        from musetalk.models.unet import PositionalEncoding

        models = root / "models"
        if not torch.cuda.is_available():
            raise RuntimeError("cuda_unavailable")
        self.torch = torch
        self.device = torch.device("cuda")
        self.dtype = torch.float16
        clock = time.perf_counter()

        def mark(label: str) -> None:
            nonlocal clock
            now = time.perf_counter()
            print(f"load {label}: {now - clock:.1f}s", flush=True)
            clock = now

        with open(models / "musetalkV15" / "musetalk.json", "r", encoding="utf-8") as handle:
            unet_config = json.load(handle)
        with torch.device("meta"):
            unet = UNet2DConditionModel(**unet_config)
        weights = torch.load(
            models / "musetalkV15" / "unet.pth", map_location="cpu", weights_only=True, mmap=True
        )
        unet.load_state_dict(weights, assign=True)
        del weights
        if any(t.is_meta for t in [*unet.parameters(), *unet.buffers()]):
            raise RuntimeError("unet_incomplete")
        self.unet = unet.to(self.device, dtype=self.dtype).eval()
        self.pe = PositionalEncoding(d_model=384).to(self.device, dtype=self.dtype)
        mark("unet")

        vae = AutoencoderKL.from_pretrained(models / "sd-vae")
        self.vae = vae.to(self.device, dtype=self.dtype).eval()
        self.scale = self.vae.config.scaling_factor

        self.features = AutoFeatureExtractor.from_pretrained(models / "whisper")
        whisper = WhisperModel.from_pretrained(models / "whisper")
        self.whisper = whisper.to(self.device, dtype=self.dtype).eval()
        self.whisper.requires_grad_(False)
        self.timesteps = torch.tensor([0], device=self.device)
        mark("vae + whisper")

        self.parser = self._load_parser(repo, models)
        _state["mask"] = "bisenet" if self.parser is not None else "feathered"
        mark("face parsing")
        self.avatars = self._prepare_avatars()
        if self.parser is not None:
            del self.parser
            self.parser = None
        torch.cuda.empty_cache()
        mark("avatars")

    def _load_parser(self, repo: Path, models: Path):
        resnet = models / "face-parse-bisent" / "resnet18-5c106cde.pth"
        bisenet = models / "face-parse-bisent" / "79999_iter.pth"
        if not resnet.is_file() or not bisenet.is_file():
            return None
        torch = self.torch
        from musetalk.utils.face_parsing import FaceParsing

        class LocalFaceParsing(FaceParsing):
            def model_init(self, resnet_path=str(resnet), model_pth=str(bisenet)):
                from musetalk.utils.face_parsing.model import BiSeNet

                # The torchvision resnet18 file predates the zip format, so
                # weights_only cannot read it. It comes from download.pytorch.org.
                original = torch.load
                torch.load = lambda path, *a, **k: original(path, map_location="cpu", weights_only=False)
                try:
                    net = BiSeNet(resnet_path)
                finally:
                    torch.load = original
                net.load_state_dict(torch.load(model_pth, map_location="cpu", weights_only=True))
                return net.cuda().eval()

        try:
            return LocalFaceParsing(left_cheek_width=CHEEK_WIDTH, right_cheek_width=CHEEK_WIDTH)
        except Exception:
            traceback.print_exc()
            return None

    def _landmarks(self, images: dict[str, np.ndarray]) -> dict[str, np.ndarray]:
        import face_alignment

        kind = getattr(face_alignment.LandmarksType, "TWO_D", None) or getattr(face_alignment.LandmarksType, "_2D")
        try:
            # face_alignment 1.5 defaults to torch.compile, which needs Triton (absent on Windows).
            aligner = face_alignment.FaceAlignment(kind, device="cuda", flip_input=False, compile=False)
        except TypeError:
            aligner = face_alignment.FaceAlignment(kind, device="cuda", flip_input=False)
        found = {}
        for mode, image in images.items():
            points = aligner.get_landmarks_from_image(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            if not points:
                raise RuntimeError(f"no_face_{mode}")
            found[mode] = np.asarray(points[0], dtype=np.float32).astype(np.int32)
        del aligner
        self.torch.cuda.empty_cache()
        return found

    @staticmethod
    def _face_box(landmarks: np.ndarray, height: int) -> list[int]:
        # Same rule as MuseTalk get_landmark_and_bbox on the 68 iBUG points,
        # plus the v1.5 extra bottom margin.
        half_face = landmarks[29]
        half_dist = int(np.max(landmarks[:, 1]) - half_face[1])
        upper = max(0, int(half_face[1] - half_dist))
        x0, x1 = int(np.min(landmarks[:, 0])), int(np.max(landmarks[:, 0]))
        y1 = min(int(np.max(landmarks[:, 1])) + EXTRA_MARGIN, height)
        return [x0, upper, x1, y1]

    def _blend_mask(self, image: np.ndarray, box: list[int]) -> tuple[np.ndarray, list[int]]:
        """Return a uint8 mask over MuseTalk's expanded crop box and that box."""
        x0, y0, x1, y1 = box
        cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
        half = int(max(x1 - x0, y1 - y0) // 2 * 1.5)
        crop = [cx - half, cy - half, cx + half, cy + half]
        size = 2 * half
        if self.parser is not None:
            from musetalk.utils.blending import get_image_prepare_material

            mask, crop = get_image_prepare_material(image, box, fp=self.parser, mode="jaw")
            return mask, list(crop)

        # Feathered lower-face fallback when BiSeNet weights are missing.
        mask = np.zeros((size, size), dtype=np.uint8)
        fx0, fy0, fx1, fy1 = x0 - crop[0], y0 - crop[1], x1 - crop[0], y1 - crop[1]
        center = ((fx0 + fx1) // 2, int(fy0 + (fy1 - fy0) * 0.72))
        axes = (int((fx1 - fx0) * 0.36), int((fy1 - fy0) * 0.26))
        cv2.ellipse(mask, center, axes, 0, 0, 360, 255, -1)
        mask[: size // 2] = 0
        kernel = int(0.1 * size // 2 * 2) + 1
        mask = cv2.GaussianBlur(mask, (kernel, kernel), 0)
        return mask, crop

    def _prepare_avatars(self) -> dict[str, Avatar]:
        torch = self.torch
        images = {}
        for mode in MODES:
            image = cv2.imread(str(portrait_path(mode)), cv2.IMREAD_COLOR)
            if image is None:
                raise RuntimeError(f"portrait_missing_{mode}")
            images[mode] = image
        marks = self._landmarks(images)
        avatars = {}
        for mode, image in images.items():
            height, width = image.shape[:2]
            box = self._face_box(marks[mode], height)
            x0, y0, x1, y1 = box
            crop = cv2.resize(image[y0:y1, x0:x1], (256, 256), interpolation=cv2.INTER_LANCZOS4)
            with torch.inference_mode():
                latents = self._unet_latents(crop)
            mask, crop_box = self._blend_mask(image, box)
            alpha_full = mask.astype(np.float32) / 255.0
            ys, xs = np.nonzero(mask > 2)
            if len(xs) == 0:
                raise RuntimeError(f"empty_mask_{mode}")
            cut = [
                max(0, crop_box[0] + int(xs.min())),
                max(0, crop_box[1] + int(ys.min())),
                min(width, crop_box[0] + int(xs.max()) + 1),
                min(height, crop_box[1] + int(ys.max()) + 1),
            ]
            alpha = alpha_full[
                cut[1] - crop_box[1] : cut[3] - crop_box[1],
                cut[0] - crop_box[0] : cut[2] - crop_box[0],
            ][..., None]
            avatars[mode] = Avatar(image, box, latents, alpha, cut)
            print(f"avatar {mode}: face {box} cut {cut} ({cut[2] - cut[0]}x{cut[3] - cut[1]})", flush=True)
        return avatars

    def _encode(self, rgb: np.ndarray):
        torch = self.torch
        tensor = torch.from_numpy(rgb).to(self.device, dtype=torch.float32).permute(2, 0, 1)[None] / 255.0
        tensor = (tensor - 0.5) / 0.5
        dist = self.vae.encode(tensor.to(self.dtype)).latent_dist
        return self.scale * dist.sample()

    def _unet_latents(self, crop_bgr: np.ndarray):
        rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
        masked = rgb.copy()
        masked[128:] = 0
        return self.torch.cat([self._encode(masked), self._encode(rgb)], dim=1)

    def audio_prompts(self, samples: np.ndarray):
        torch = self.torch
        segment = 30 * SAMPLE_RATE
        feats = []
        for start in range(0, len(samples), segment):
            mel = self.features(
                samples[start : start + segment], return_tensors="pt", sampling_rate=SAMPLE_RATE
            ).input_features
            hidden = self.whisper.encoder(mel.to(self.device, dtype=self.dtype), output_hidden_states=True).hidden_states
            feats.append(torch.stack(hidden, dim=2))
        whisper = torch.cat(feats, dim=1)
        frames = math.floor(len(samples) / SAMPLE_RATE * FPS)
        actual = math.floor(len(samples) / SAMPLE_RATE * 50)
        # MuseTalk v1.5 get_whisper_chunk: 50 Hz features, 2 per video frame,
        # padding 2 frames left and 2 right, 10 feature steps per frame.
        whisper = whisper[:, :actual]
        _, _, layers, dim = whisper.shape
        whisper = torch.cat([whisper.new_zeros(1, 4, layers, dim), whisper, whisper.new_zeros(1, 12, layers, dim)], 1)
        width = 10
        clips = [whisper[:, i * 2 : i * 2 + width] for i in range(frames)]
        if not clips:
            return None
        prompts = torch.cat(clips, dim=0)
        return prompts.reshape(prompts.shape[0], -1, prompts.shape[-1])

    def render(self, samples: np.ndarray, mode: str):
        """Yield (start_index, [bgr crops]) batches."""
        torch = self.torch
        avatar = self.avatars[mode]
        with torch.inference_mode():
            prompts = self.audio_prompts(samples)
            if prompts is None:
                return
            total = prompts.shape[0]
            start = 0
            while start < total:
                size = FIRST_BATCH if start == 0 else BATCH
                chunk = prompts[start : start + size]
                count = chunk.shape[0]
                # face_alignment turns on cudnn.benchmark globally, so every new batch
                # shape costs seconds of autotuning; keep shapes to the two warmed sizes.
                if count < size:
                    chunk = torch.cat([chunk, chunk[-1:].expand(size - count, -1, -1)])
                audio = self.pe(chunk)
                latents = avatar.latents.expand(size, -1, -1, -1)
                pred = self.unet(latents, self.timesteps, encoder_hidden_states=audio).sample
                image = self.vae.decode(pred / self.scale).sample[:count]
                image = ((image / 2 + 0.5).clamp(0, 1) * 255).round().to(torch.uint8)
                faces = image.permute(0, 2, 3, 1).cpu().numpy()[..., ::-1]
                yield start, [avatar.compose(np.ascontiguousarray(face)) for face in faces]
                start += count


def read_audio(raw: bytes) -> np.ndarray:
    import librosa
    import soundfile

    data, rate = soundfile.read(io.BytesIO(raw), dtype="float32", always_2d=True)
    mono = data.mean(axis=1)
    if rate != SAMPLE_RATE:
        mono = librosa.resample(mono, orig_sr=rate, target_sr=SAMPLE_RATE)
    return np.ascontiguousarray(mono, dtype=np.float32)


def jpeg(frame: np.ndarray) -> str:
    ok, encoded = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
    if not ok:
        raise RuntimeError("jpeg_failed")
    return base64.b64encode(encoded.tobytes()).decode("ascii")


def benchmark(engine: Engine, seconds: float = 4.0) -> float:
    import soundfile

    rate = 24000
    rng = np.random.default_rng(7)
    t = np.arange(int(seconds * rate)) / rate
    voice = 0.3 * np.sin(2 * np.pi * 180 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 3 * t))
    wav = io.BytesIO()
    soundfile.write(wav, (voice + 0.02 * rng.standard_normal(len(t))).astype(np.float32), rate, format="WAV", subtype="PCM_16")
    # Warm the request path too: librosa resampling compiles on first use.
    samples = read_audio(wav.getvalue())
    for size in (SAMPLE_RATE, SAMPLE_RATE + SAMPLE_RATE // 5):
        for _ in engine.render(samples[:size], "crunk"):
            pass
    engine.torch.cuda.synchronize()
    began = time.perf_counter()
    frames = 0
    for _, batch in engine.render(samples, "crunk"):
        frames += len(batch)
        for frame in batch:
            jpeg(frame)
    return frames / (time.perf_counter() - began)


def load() -> None:
    global _engine
    root = musetalk_root()
    try:
        if not (root / "MuseTalk" / "musetalk" / "models" / "unet.py").is_file():
            raise RuntimeError("musetalk_missing")
        if not (root / "models" / "musetalkV15" / "unet.pth").is_file():
            raise RuntimeError("weights_missing")
        began = time.perf_counter()
        engine = Engine(root)
        fps = benchmark(engine)
        _engine = engine
        _state.update(ready=True, reason=None, fps=round(fps, 1))
        print(
            f"MuseTalk ready in {time.perf_counter() - began:.1f}s, {fps:.1f} frames/s, mask {_state['mask']}",
            flush=True,
        )
    except Exception as error:
        traceback.print_exc()
        _state.update(ready=False, reason=str(error) or "load_failed")


def render_job(engine: Engine, samples: np.ndarray, mode: str, out: queue.Queue, cancel: threading.Event) -> None:
    began = time.perf_counter()
    sent = 0
    try:
        for start, batch in engine.render(samples, mode):
            if cancel.is_set():
                return
            sent = start + len(batch)
            out.put({"type": "frames", "start": start, "jpegs": [jpeg(f) for f in batch]})
        ms = (time.perf_counter() - began) * 1000
        rate = sent / (ms / 1000) if ms > 0 else 0
        print(f"frames {mode}: {sent} in {ms:.0f} ms ({rate:.1f} fps)", flush=True)
        out.put({"type": "end", "frames": sent, "ms": round(ms), "fps": round(rate, 1)})
    except Exception:
        traceback.print_exc()
        out.put({"type": "error", "error": "render_failed"})
    finally:
        out.put(None)


@app.on_event("startup")
def startup() -> None:
    _gpu.submit(load)


@app.get("/health")
def health():
    body = {"ok": True, "ready": bool(_state["ready"]), "reason": _state["reason"]}
    if _state["fps"] is not None:
        body["fps"] = _state["fps"]
    if _state["mask"] is not None:
        body["mask"] = _state["mask"]
    return body


@app.post("/frames")
def frames(audio: UploadFile = File(...), mode: str = Form(...)):
    engine = _engine
    if engine is None or not _state["ready"]:
        raise HTTPException(status_code=503, detail=_state["reason"] or "not_ready")
    if mode not in MODES:
        raise HTTPException(status_code=400, detail="bad_mode")
    raw = audio.file.read(8_000_001)
    if not raw:
        raise HTTPException(status_code=400, detail="empty_input")
    if len(raw) > 8_000_000:
        raise HTTPException(status_code=413, detail="input_too_large")
    try:
        samples = read_audio(raw)
    except Exception as error:
        raise HTTPException(status_code=400, detail="bad_audio") from error
    if len(samples) < SAMPLE_RATE // FPS or len(samples) > SAMPLE_RATE * 60:
        raise HTTPException(status_code=400, detail="bad_length")

    avatar = engine.avatars[mode]
    total = math.floor(len(samples) / SAMPLE_RATE * FPS)
    x0, y0, x1, y1 = avatar.cut

    def stream():
        head = {
            "type": "clip",
            "fps": FPS,
            "frames": total,
            "bbox": [x0, y0, x1 - x0, y1 - y0],
            "size": [avatar.width, avatar.height],
        }
        yield json.dumps(head) + "\n"
        out: queue.Queue = queue.Queue()
        cancel = threading.Event()
        _gpu.submit(render_job, engine, samples, mode, out, cancel)
        try:
            while True:
                try:
                    record = out.get(timeout=30)
                except queue.Empty:
                    yield json.dumps({"type": "error", "error": "timeout"}) + "\n"
                    return
                if record is None:
                    return
                yield json.dumps(record) + "\n"
        finally:
            cancel.set()

    return StreamingResponse(stream(), media_type="application/x-ndjson")
