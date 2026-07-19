import { ElevenLabsClient } from "elevenlabs";

export class TTSService {
  private client: ElevenLabsClient | null = null;

  constructor() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (apiKey) {
      this.client = new ElevenLabsClient({ apiKey });
    } else {
      console.warn("[TTS Service] Warning: ELEVENLABS_API_KEY is not defined. Using silence fallback.");
    }
  }

  async generateSpeech(text: string): Promise<Buffer> {
    console.log(`[TTS Service] Converting text to speech: "${text}"`);
    if (!this.client) {
      return Buffer.alloc(0);
    }

    try {
      // Use ElevenLabs convert endpoint matching the Python George voice ID
      const audioStream = await this.client.textToSpeech.convert(
        "JBFqnCBsd6RMkjVDRZzb", // "George" Clear, mentor-like
        {
          text,
          model_id: "eleven_multilingual_v2",
          output_format: "mp3_44100_128",
        }
      );

      const chunks: Buffer[] = [];
      // Read chunks from the readable stream
      for await (const chunk of audioStream as any) {
        chunks.push(Buffer.from(chunk));
      }

      const audioBuffer = Buffer.concat(chunks);
      console.log(`[TTS Service] Completed. Audio buffer size: ${audioBuffer.length} bytes`);
      return audioBuffer;
    } catch (error) {
      console.error("[TTS Service] ElevenLabs API error:", error);
      return Buffer.alloc(0);
    }
  }
}

export const ttsService = new TTSService();
