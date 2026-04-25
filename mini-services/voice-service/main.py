"""
Voice Cloning Service - FastAPI Application

This service provides cross-lingual voice cloning capabilities using OpenVoice V2.
Currently implements mock endpoints; real OpenVoice V2 integration will be added later.

Endpoints:
  - POST /api/clone   : Clone a voice from reference audio and synthesize speech in a target language
  - POST /api/tts     : Simple text-to-speech endpoint
  - GET  /api/health  : Health check
  - GET  /api/languages : List supported languages
"""

import os
import uuid
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Application Setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Cross-Lingual Voice Cloning Service",
    description="FastAPI service for cross-lingual voice cloning powered by OpenVoice V2",
    version="1.0.0",
)

# CORS – allow all origins so the Next.js frontend can communicate freely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "./download/audio/uploads")
SUPPORTED_LANGUAGES = ["ar", "en", "es", "fr", "zh", "ja", "ko", "de"]

LANGUAGE_DATA = [
    {"code": "ar", "name": "العربية", "name_en": "Arabic"},
    {"code": "en", "name_en": "English", "name": "الإنجليزية"},
    {"code": "es", "name_en": "Spanish", "name": "الإسبانية"},
    {"code": "fr", "name_en": "French", "name": "الفرنسية"},
    {"code": "zh", "name_en": "Chinese", "name": "الصينية"},
    {"code": "ja", "name_en": "Japanese", "name": "اليابانية"},
    {"code": "ko", "name_en": "Korean", "name": "الكورية"},
    {"code": "de", "name_en": "German", "name": "الألمانية"},
]

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------


class TTSRequest(BaseModel):
    """Request body for the /api/tts endpoint."""

    text: str = Field(..., min_length=1, description="Text to synthesize")
    language: str = Field(default="en", description="Language code")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Speech speed")


class TTSResponse(BaseModel):
    """Response body for the /api/tts endpoint."""

    status: str
    message: str
    text: str
    language: str


class CloneResponse(BaseModel):
    """Response body for the /api/clone endpoint."""

    status: str
    message: str
    upload_path: str
    text: str
    target_language: str


# ---------------------------------------------------------------------------
# Startup Event
# ---------------------------------------------------------------------------


@app.on_event("startup")
async def startup() -> None:
    """Create required directories on application startup."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    print(f"[voice-service] Upload directory ready: {UPLOAD_DIR}")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/api/health")
async def health_check() -> dict:
    """Health check endpoint.

    Returns
    -------
    dict
        A simple status payload indicating the service is running.
    """
    return {"status": "ok", "service": "voice-cloning"}


@app.get("/api/languages")
async def get_languages() -> dict:
    """Return the list of supported languages with Arabic and English names.

    Returns
    -------
    dict
        A dictionary containing the ``languages`` key with a list of
        language objects (code, name, name_en).
    """
    return {"languages": LANGUAGE_DATA}


@app.post("/api/clone", response_model=CloneResponse)
async def clone_voice(
    audio_file: UploadFile = File(..., description="Reference voice audio file"),
    text: str = Form(..., description="Text to speak in the target language"),
    target_language: str = Form(..., description="Target language code"),
    speed: float = Form(default=1.0, description="Speech speed (0.5 – 2.0)"),
    emotion: str = Form(default="neutral", description="Emotion style"),
) -> CloneResponse:
    """Clone a voice from a reference audio file and synthesize speech.

    This endpoint accepts a reference audio sample, transcribes/clones the
    voice characteristics, and generates speech in the specified target
    language.

    Currently a **mock** implementation — the real OpenVoice V2 pipeline
    will be integrated here.

    Parameters
    ----------
    audio_file : UploadFile
        The reference voice audio file (wav, mp3, etc.).
    text : str
        The text content to synthesize.
    target_language : str
        Target language code (e.g. "ar", "en", "fr").
    speed : float
        Speech speed multiplier, clamped between 0.5 and 2.0.
    emotion : str
        Emotion style for the generated speech.

    Returns
    -------
    CloneResponse
        A payload confirming the audio was received and is being processed.
    """
    # --- Validate target language ---
    if target_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language '{target_language}'. "
            f"Supported: {SUPPORTED_LANGUAGES}",
        )

    # --- Validate speed ---
    if speed < 0.5 or speed > 2.0:
        raise HTTPException(
            status_code=400,
            detail=f"Speed must be between 0.5 and 2.0, got {speed}",
        )

    # --- Save uploaded audio ---
    try:
        file_ext = os.path.splitext(audio_file.filename or "audio.wav")[1] or ".wav"
        unique_name = f"{uuid.uuid4().hex}{file_ext}"
        upload_path = os.path.join(UPLOAD_DIR, unique_name)

        contents = await audio_file.read()
        with open(upload_path, "wb") as f:
            f.write(contents)

        print(f"[voice-service] Saved uploaded audio to {upload_path} ({len(contents)} bytes)")

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save uploaded audio: {str(exc)}",
        ) from exc

    # ------------------------------------------------------------------
    # TODO: Integrate OpenVoice V2 pipeline here
    # ------------------------------------------------------------------
    # 1. Load the uploaded audio as the reference voice:
    #    from openvoice.api import ToneColorConverter, BaseSpeakerTTS
    #    tone_color_converter = ToneColorConverter(...)
    #    source_se = tone_color_converter.extract_se(upload_path)
    #
    # 2. Generate base speaker audio for the target language:
    #    base_speaker = BaseSpeakerTTS(...)
    #    base_audio_path = base_speaker.synthesize(text, target_language, speed=speed)
    #
    # 3. Apply tone colour (voice cloning):
    #    target_se = tone_color_converter.extract_se(base_audio_path)
    #    output_path = tone_color_converter.convert(
    #        base_audio_path, source_se, target_se, ...
    #    )
    #
    # 4. Return the output audio URL / path to the caller.
    # ------------------------------------------------------------------

    return CloneResponse(
        status="processing",
        message="Audio received and being processed",
        upload_path=upload_path,
        text=text,
        target_language=target_language,
    )


@app.post("/api/tts", response_model=TTSResponse)
async def text_to_speech(request: TTSRequest) -> TTSResponse:
    """Simple text-to-speech endpoint.

    Accepts text, a language code, and an optional speed parameter, and
    returns a mock acknowledgement.  Real TTS synthesis will be
    integrated later.

    Parameters
    ----------
    request : TTSRequest
        The TTS request body containing text, language, and speed.

    Returns
    -------
    TTSResponse
        A payload confirming the TTS request was received.
    """
    # --- Validate language ---
    if request.language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language '{request.language}'. "
            f"Supported: {SUPPORTED_LANGUAGES}",
        )

    # ------------------------------------------------------------------
    # TODO: Integrate real TTS engine here
    # ------------------------------------------------------------------
    # Use a TTS library (e.g. edge-tts, gTTS, or OpenVoice V2 base
    # speaker) to synthesize audio from the given text and language, then
    # save the output to a file and return a download URL.
    # ------------------------------------------------------------------

    return TTSResponse(
        status="success",
        message="TTS request received",
        text=request.text,
        language=request.language,
    )
