# backend/stt_service.py
import os
from pathlib import Path
from dotenv import load_dotenv
from deepgram import AsyncDeepgramClient

# Load environment variables from the root .env file
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

async def transcribe_audio(audio_bytes: bytes) -> str:
    """Take raw audio bytes, return transcribed text."""
    print(f"[Deepgram STT] Received {len(audio_bytes)} bytes of audio.")
    
    client = AsyncDeepgramClient(api_key=DEEPGRAM_API_KEY)

    response = await client.listen.v1.media.transcribe_file(
        request=audio_bytes,
        model="nova-2",
        language="en",
        smart_format=True,
    )

    print(f"[Deepgram STT] Raw response: {response}")
    
    transcript = response.results.channels[0].alternatives[0].transcript
    print(f"[Deepgram STT] Transcript: '{transcript}'")
    return transcript
