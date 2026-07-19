import OpenAI from "openai";
import prisma from "../lib/prisma";

export class LLMService {
  private openai: OpenAI | null = null;

  constructor() {
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
      console.log("[LLM Service] Configured with OpenAI API Key.");
    } else if (geminiKey) {
      console.log("[LLM Service] Configured with Gemini API Key.");
    } else {
      console.warn("[LLM Service] Warning: Neither OPENAI_API_KEY nor GEMINI_API_KEY is defined. Using mock fallback responses.");
    }
  }

  async generateClaraResponse(userId: string, currentTranscript: string): Promise<string> {
    console.log(`[LLM Service] Generating Clara response for user ${userId}. Prompt length: ${currentTranscript.length}`);
    
    // Fetch last 5 entries for conversation memory context
    let pastContext = "";
    try {
      const pastEntries = await prisma.entry.findMany({
        where: { userId, claraResponse: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          transcript: true,
          claraResponse: true,
          createdAt: true
        }
      });
      
      // Sort chronologically (oldest to newest)
      const sorted = pastEntries.reverse();
      
      pastContext = sorted.map(e => 
        `Journal Entry: "${e.transcript}"\nClara's Response: "${e.claraResponse}"`
      ).join("\n\n");
    } catch (e) {
      console.error("[LLM Service] Failed to load user history context:", e);
    }

    // Fallback if no OpenAI key, check if Gemini key is available
    if (!this.openai) {
      if (process.env.GEMINI_API_KEY) {
        return this.generateGeminiResponse(currentTranscript, pastContext);
      }
      return this.generateMockResponse(currentTranscript);
    }

    try {
      const systemPrompt = `You are Clara, a warm, thoughtful, and highly empathetic AI companion for a personal voice diary. 
The user speaks to you to write down their thoughts, feelings, and memories.
Your role is to respond naturally, like a close, caring friend who genuinely listens.
Keep your response concise: 2 to 3 sentences maximum.
Acknowledge their emotions or achievements. Refer to their recent past entries when relevant.
Do not sound clinical, preachy, or robotic. Do not mention that you are an AI.`;

      const promptMessages = [];
      
      // System instructions
      promptMessages.push({ role: "system" as const, content: systemPrompt });

      // Add conversation memory history context if available
      if (pastContext) {
        promptMessages.push({ 
          role: "system" as const, 
          content: `Here is the context of the user's recent past entries to help you remember details they mentioned:\n\n${pastContext}` 
        });
      }

      // Add current transcription prompt
      promptMessages.push({ 
        role: "user" as const, 
        content: `I just recorded this voice entry: "${currentTranscript}"` 
      });

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: promptMessages,
        max_tokens: 300,
        temperature: 0.7,
      });

      const reply = response.choices[0]?.message?.content?.trim() || "";
      console.log(`[LLM Service] Response generated: "${reply}"`);
      return reply;
    } catch (error) {
      console.error("[LLM Service] OpenAI API error:", error);
      return this.generateMockResponse(currentTranscript);
    }
  }

  private async generateGeminiResponse(currentTranscript: string, pastContext: string): Promise<string> {
    const geminiKey = process.env.GEMINI_API_KEY;
    try {
      const systemPrompt = `You are Clara, a warm, thoughtful, and highly empathetic AI companion for a personal voice diary. 
The user speaks to you to write down their thoughts, feelings, and memories.
Your role is to respond naturally, like a close, caring friend who genuinely listens.
Keep your response concise: 2 to 3 sentences maximum.
Acknowledge their emotions or achievements. Refer to their recent past entries when relevant.
Do not sound clinical, preachy, or robotic. Do not mention that you are an AI.`;

      let fullPrompt = systemPrompt + "\n\n";
      if (pastContext) {
        fullPrompt += `Context of user's recent past entries:\n${pastContext}\n\n`;
      }
      fullPrompt += `User's current voice entry: "${currentTranscript}"\n\nClara's Response:`;

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
                  { text: fullPrompt }
                ]
              }
            ],
            generationConfig: {
              maxOutputTokens: 300,
              temperature: 0.7,
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned HTTP ${response.status}`);
      }

      const data = await response.json() as any;
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      console.log(`[LLM Service] Gemini response generated: "${reply}"`);
      return reply;
    } catch (error) {
      console.error("[LLM Service] Gemini API error:", error);
      return this.generateMockResponse(currentTranscript);
    }
  }

  private generateMockResponse(transcript: string): string {
    const text = transcript.toLowerCase();
    if (text.includes("sad") || text.includes("down") || text.includes("tired") || text.includes("stress")) {
      return "I hear you, and it sounds like you've been carrying a lot lately. Please remember to be gentle with yourself today—you're doing the best you can.";
    }
    if (text.includes("happy") || text.includes("excited") || text.includes("good") || text.includes("great")) {
      return "That sounds wonderful! I'm so happy to hear things are going well. Thanks for sharing this bright moment with me.";
    }
    return "Thank you for sharing your thoughts with me today. I'm here listening, keeping your memories safe for whenever you want to look back.";
  }
}

export const llmService = new LLMService();
