# backend/tts_service.py
import os
from elevenlabs.client import ElevenLabs

# Free tier: 10,000 chars/month
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

def text_to_speech(text: str) -> bytes:
    """Convert text to speech audio bytes."""
    client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

    audio_generator = client.text_to_speech.convert(
        voice_id="JBFqnCBsd6RMkjVDRZzb",  # "George" — clear, mentor-like
        text=text,
        model_id="eleven_multilingual_v2",
    )

    # Collect the generator into bytes
    audio_bytes = b"".join(audio_generator)
    return audio_bytes
