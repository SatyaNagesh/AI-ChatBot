from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import uvicorn
import os
import tempfile

app = FastAPI()

class TTSRequest(BaseModel):
    text: str
    voice: str = ""
    language: str = "en"

# Try Coqui first (voice cloning), fall back to edge-tts
try:
    from TTS.api import TTS
    model = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)
    ENGINE = "coqui"
except:
    ENGINE = "edge"

VOICE_SAMPLE = os.path.expanduser("~/.ai-chatbot/my_voice.wav")

@app.post("/tts")
async def text_to_speech(req: TTSRequest):
    if not req.text.strip():
        raise HTTPException(400, "Text is required")

    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)

    if ENGINE == "coqui":
        if not os.path.exists(VOICE_SAMPLE):
            raise HTTPException(400, "Voice sample not found. Run: python server/record_voice.py")
        try:
            model.tts_to_file(
                text=req.text,
                file_path=tmp.name,
                speaker_wav=VOICE_SAMPLE,
                language=req.language,
            )
        except Exception as e:
            os.unlink(tmp.name)
            raise HTTPException(500, f"TTS failed: {e}")
    else:
        import edge_tts
        import asyncio
        voice = req.voice or "en-US-GuyNeural"
        try:
            comm = edge_tts.Communicate(req.text, voice)
            await comm.save(tmp.name)
        except Exception as e:
            os.unlink(tmp.name)
            raise HTTPException(500, f"TTS failed: {e}")

    with open(tmp.name, "rb") as f:
        audio = f.read()
    os.unlink(tmp.name)
    return Response(audio, media_type="audio/wav")

@app.get("/health")
async def health():
    return {
        "engine": ENGINE,
        "voice_loaded": os.path.exists(VOICE_SAMPLE),
        "voice_path": VOICE_SAMPLE if ENGINE == "coqui" else None,
    }

@app.get("/voices")
async def list_voices():
    if ENGINE != "edge":
        return {"voices": ["uses voice sample ~/.ai-chatbot/my_voice.wav"]}
    import edge_tts
    voices = await edge_tts.list_voices()
    return {"voices": [{"name": v["Name"], "locale": v["Locale"]} for v in voices]}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3457)
