export class EmbeddingService {
  async generateEmbedding(text: string): Promise<number[]> {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.warn("[Embedding Service] Warning: GEMINI_API_KEY is not defined in env. Returning empty embedding.");
      return new Array(768).fill(0);
    }

    try {
      console.log(`[Embedding Service] Generating embedding for text length ${text.length}`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "models/gemini-embedding-001",
            content: {
              parts: [
                {
                  text: text,
                },
              ],
            },
            outputDimensionality: 768,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini Embedding API returned HTTP ${response.status}`);
      }

      const data = await response.json() as any;
      const values = data.embedding?.values;
      if (!values || !Array.isArray(values)) {
        throw new Error("Invalid embedding response format from Gemini API");
      }

      console.log(`[Embedding Service] Successfully generated vector of length ${values.length}`);
      return values;
    } catch (error) {
      console.error("[Embedding Service] Failed to generate embedding:", error);
      // Return zeroed fallback vector to prevent hard crashes
      return new Array(768).fill(0);
    }
  }
}

export const embeddingService = new EmbeddingService();
