import prisma from "../lib/prisma";
import { embeddingService } from "./embedding.service";

export interface RAGSource {
  id: string;
  transcript: string;
  mrbrownResponse: string | null;
  createdAt: Date;
}

export interface RAGResult {
  answer: string;
  sources: RAGSource[];
}

export class RAGService {
  async answerQuestion(userId: string, question: string): Promise<RAGResult> {
    console.log(`[RAG Service] Answering question for user ${userId}: "${question}"`);

    try {
      // 1. Generate query embedding vector
      const embeddingVector = await embeddingService.generateEmbedding(question);

      // 2. Perform Cosine Similarity vector search on pgvector (ordering by distance ascending)
      // We limit to 4 sources to fit nicely in context and avoid bloating token usage
      const sources: any[] = await prisma.$queryRaw`
        SELECT 
          id, 
          transcript, 
          "mrbrownResponse", 
          "createdAt"
        FROM "Entry"
        WHERE "userId" = ${userId} AND embedding IS NOT NULL
        ORDER BY embedding <=> ${JSON.stringify(embeddingVector)}::vector
        LIMIT 4
      `;

      if (!sources || sources.length === 0) {
        return {
          answer: "I couldn't find any recorded journal entries in your memories to search through. Try writing or speaking a few thoughts first!",
          sources: [],
        };
      }

      console.log(`[RAG Service] Retrieved ${sources.length} matching memory contexts`);

      // 3. Format context string from retrieved entries
      const contextText = sources.map((s, idx) => {
        const dateStr = new Date(s.createdAt).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        return `Memory #${idx + 1} (Date: ${dateStr}):
User's entry: "${s.transcript}"
Mr Brown's reply: "${s.mrbrownResponse || ""}"`;
      }).join("\n\n");

      // 4. Construct System instructions + Context prompts for Gemini
      const systemPrompt = `You are Mr Brown, a warm, thoughtful, and highly empathetic AI companion for a personal voice diary.
The user is asking you a question about their past logs or memories.
Their question is: "${question}"

Below are the most relevant past journal entries you retrieved from their memory database:
---
${contextText}
---

Instructions:
- Answer their question based ONLY on the context entries provided above.
- Speak directly to the user as Mr Brown, their close, caring friend who remembers their journey.
- Reference specific dates, details, achievements, or struggles mentioned in the retrieved logs.
- Keep your response warm, conversational, and concise (3 to 5 sentences maximum).
- If the retrieved context does not contain the answer to their question, explain gently that you looked through their logs but couldn't find any mention of it.`;

      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        console.warn("[RAG Service] Warning: GEMINI_API_KEY is not defined in env. Returning fallback mock response.");
        return {
          answer: "I can see your past logs, but my Gemini API key is missing, so I can't summarize them for you right now.",
          sources: sources.map(s => ({
            id: s.id,
            transcript: s.transcript,
            mrbrownResponse: s.mrbrownResponse,
            createdAt: s.createdAt,
          })),
        };
      }

      // 5. Query Gemini for the final response
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
                  { text: systemPrompt }
                ]
              }
            ],
            generationConfig: {
              maxOutputTokens: 350,
              temperature: 0.4, // lower temperature for high factual recall
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned HTTP ${response.status} during RAG generation`);
      }

      const data = await response.json() as any;
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      console.log(`[RAG Service] Answer generated successfully: "${answer.substring(0, 50)}..."`);

      return {
        answer,
        sources: sources.map(s => ({
          id: s.id,
          transcript: s.transcript,
          mrbrownResponse: s.mrbrownResponse,
          createdAt: s.createdAt,
        })),
      };

    } catch (error) {
      console.error("[RAG Service] Error answering query:", error);
      return {
        answer: "I'm sorry, I ran into an issue looking up your past entries. Please try again in a moment.",
        sources: [],
      };
    }
  }
}

export const ragService = new RAGService();
