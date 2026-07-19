import { DeepgramClient } from "@deepgram/sdk";

export class STTService {
  private deepgram: DeepgramClient;

  constructor() {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      console.warn("[Deepgram STT] Warning: DEEPGRAM_API_KEY is not defined in env.");
    }
    // Initialize using options object for SDK v5
    this.deepgram = new DeepgramClient({ apiKey: apiKey || "" });
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
    console.log(`[Deepgram STT] Transcribing buffer of size ${audioBuffer.length} bytes, mimeType: ${mimeType}`);
    try {
      // Use standard v3 SDK FileSource wrapper for Buffer objects
      const response = await this.deepgram.listen.v1.media.transcribeFile(
        {
          data: audioBuffer,
          contentType: mimeType,
        },
        {
          model: "nova-2",
          language: "en",
          smart_format: true,
        }
      );

      const transcript = (response as any).results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
      console.log(`[Deepgram STT] Completed. Transcript: "${transcript}"`);
      return transcript;
    } catch (error) {
      console.error("[Deepgram STT] Error transcribing file:", error);
      throw new Error("Speech-to-text transcription failed");
    }
  }
}

export const sttService = new STTService();
