import OpenAI from "openai";

interface SentimentResult {
  score: number;
  label: string;
  reason: string;
}

export class SentimentService {
  private openai: OpenAI | null = null;

  constructor() {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
  }

  async analyzeSentiment(transcript: string): Promise<SentimentResult> {
    console.log(`[Sentiment Service] Analyzing entry text: "${transcript.substring(0, 40)}..."`);
    
    if (!transcript || transcript.trim() === "" || transcript.includes("(No speech detected)")) {
      return { score: 3, label: "Neutral", reason: "Reflective moment with no speech detected." };
    }

    const systemPrompt = `Analyze the emotional tone of the following journal entry. 
You must respond with a JSON object containing exactly these fields:
{
  "score": <number 1 to 5>,
  "label": "<a one-word emotional descriptor like Happy, Anxious, Sad, Calm, Excited, Tired, Angry, Stressed>",
  "reason": "<a short one-sentence explanation of why you selected this mood>"
}
Scale:
1 = very negative (extreme sadness, anger, distress)
2 = negative (sadness, worry, frustration, stress)
3 = neutral (calm, reflective, general daily log)
4 = positive (happiness, peace, content)
5 = very positive (extreme joy, excitement, success)

Return ONLY this JSON object. Do not wrap it in markdown codeblocks. Do not add any text before or after the JSON.`;

    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: transcript }
          ],
          response_format: { type: "json_object" }
        });

        const reply = response.choices[0]?.message?.content?.trim() || "{}";
        return this.parseSentimentJSON(reply);
      } catch (err) {
        console.error("[Sentiment Service] OpenAI analysis error:", err);
        return this.localSentimentFallback(transcript);
      }
    } else if (process.env.GEMINI_API_KEY) {
      try {
        const geminiKey = process.env.GEMINI_API_KEY;
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: `${systemPrompt}\n\nJournal Entry:\n"${transcript}"` }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
              }
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Gemini API returned HTTP ${response.status}`);
        }

        const data = await response.json() as any;
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
        return this.parseSentimentJSON(reply);
      } catch (err) {
        console.error("[Sentiment Service] Gemini analysis error:", err);
        return this.localSentimentFallback(transcript);
      }
    }

    return this.localSentimentFallback(transcript);
  }

  private parseSentimentJSON(jsonText: string): SentimentResult {
    try {
      let cleaned = jsonText.trim();
      
      // Remove any potential markdown wrapping
      if (cleaned.startsWith("```")) {
        const match = cleaned.match(/```(?:json)?([\s\S]*?)```/);
        if (match) {
          cleaned = match[1].trim();
        }
      }

      const parsed = JSON.parse(cleaned);
      const score = Math.max(1, Math.min(5, parseInt(parsed.score) || 3));
      const label = parsed.label ? String(parsed.label).trim() : "Calm";
      const reason = parsed.reason ? String(parsed.reason).trim() : "Reflective entry.";

      return { score, label, reason };
    } catch (e) {
      console.error("[Sentiment Service] Failed to parse sentiment JSON:", e, "Raw response:", jsonText);
      return { score: 3, label: "Neutral", reason: "Reflective entry." };
    }
  }

  private localSentimentFallback(text: string): SentimentResult {
    const cleanText = text.toLowerCase();
    if (cleanText.includes("sad") || cleanText.includes("lonely") || cleanText.includes("crying") || cleanText.includes("down")) {
      return { score: 2, label: "Sad", reason: "Mentioned feelings of sadness or distress." };
    }
    if (cleanText.includes("angry") || cleanText.includes("mad") || cleanText.includes("hate") || cleanText.includes("annoyed")) {
      return { score: 2, label: "Angry", reason: "Detected elements of frustration or anger." };
    }
    if (cleanText.includes("stress") || cleanText.includes("tired") || cleanText.includes("exhausted") || cleanText.includes("anxious")) {
      return { score: 2, label: "Tired", reason: "Expressed fatigue or stress." };
    }
    if (cleanText.includes("happy") || cleanText.includes("excited") || cleanText.includes("glad") || cleanText.includes("great")) {
      return { score: 4, label: "Happy", reason: "Expressed feelings of happiness or success." };
    }
    if (cleanText.includes("peaceful") || cleanText.includes("calm") || cleanText.includes("relaxed") || cleanText.includes("good")) {
      return { score: 4, label: "Calm", reason: "Reflective and relaxed tone." };
    }
    return { score: 3, label: "Neutral", reason: "Reflection of standard daily details." };
  }
}

export const sentimentService = new SentimentService();
