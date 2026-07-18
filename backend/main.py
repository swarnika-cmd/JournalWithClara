from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables before importing services that read from os.environ
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from stt_service import transcribe_audio
from tts_service import text_to_speech

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/")
async def read_root():
    return {"status": "running", "service": "Clara Voice Agent API"}

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
    
    # Save a diagnostic copy of the audio to the backend folder
    with open("test_recording.webm", "wb") as f:
        f.write(audio_bytes)
    print("[Debug] Saved diagnostic recording to: backend/test_recording.webm")
    
    text = await transcribe_audio(audio_bytes)
    return {"transcript": text}

@app.post("/speak")
async def speak(request: dict):
    text = request["text"]
    audio_bytes = text_to_speech(text)
    return Response(content=audio_bytes, media_type="audio/mpeg")