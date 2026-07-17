from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pathlib import Path
from dotenv import load_dotenv
from rag_service import RAGService

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

rag = RAGService()
@app.post("/upload-doc")
async def upload_doc(file: UploadFile = File(...)):
    # Save file temporarily in a directory outside backend to avoid triggering uvicorn reload
    import os
    temp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp")
    os.makedirs(temp_dir, exist_ok=True)
    path = os.path.join(temp_dir, file.filename)
    with open(path, "wb") as f:
        f.write(await file.read())
    rag.ingest_document(path)
    return {"status": "Document ingested successfully"}
@app.post("/voice-ask")
async def voice_ask(audio: UploadFile = File(...)):
    # Step 1: STT — Voice to Text
    audio_bytes = await audio.read()
    question = await transcribe_audio(audio_bytes)
    # Step 2: RAG — Text to Answer
    answer = rag.ask(question)
    # Step 3: TTS — Answer to Voice
    audio_response = text_to_speech(answer)
    # Return both text and audio
    import base64
    return {
        "question": question,
        "answer": answer,
        "audio": base64.b64encode(audio_response).decode()
    }