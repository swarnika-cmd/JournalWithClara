# backend/stt_service.py
import os
from deepgram import DeepgramClient, PrerecordedOptions

# Free tier: 200 mins/month — more than enough
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

async def transcribe_audio(audio_bytes: bytes) -> str:
    """Take raw audio bytes, return transcribed text."""
    client = DeepgramClient(DEEPGRAM_API_KEY)

    payload = {"buffer": audio_bytes}
    options = PrerecordedOptions(
        model="nova-2",        # Deepgram's best model
        language="en",
        smart_format=True,     # Adds punctuation
    )

    response = await client.listen.asyncrest.v("1").transcribe_file(
        payload, options
    )

    transcript = response.results.channels[0].alternatives[0].transcript
    return transcript
