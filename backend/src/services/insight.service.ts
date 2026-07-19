import prisma from "../lib/prisma";

export interface WeeklyInsightResult {
  id?: string;
  summary: string;
  themes: string[];
  moodArc: string;
  highlight: string;
  suggestion: string;
  weekStart: Date;
  weekEnd: Date;
  createdAt?: Date;
  error?: string;
}

export class InsightService {
  async generateWeeklyInsight(userId: string): Promise<WeeklyInsightResult> {
    console.log(`[Insight Service] Initiating weekly insight generation for user: ${userId}`);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Fetch entries from the past 7 days
    const entries = await prisma.entry.findMany({
      where: {
        userId,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (entries.length < 3) {
      console.warn(`[Insight Service] Insufficient entries (${entries.length}) for weekly insights.`);
      return {
        summary: "",
        themes: [],
        moodArc: "",
        highlight: "",
        suggestion: "",
        weekStart: sevenDaysAgo,
        weekEnd: new Date(),
        error: `You need at least 3 journal entries in the last 7 days to generate weekly insights. Currently you have ${entries.length}.`,
      };
    }

    // 2. Format entries context
    const contextText = entries
      .map((e, idx) => {
        const dateStr = new Date(e.createdAt).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        return `Entry #${idx + 1} (Date: ${dateStr}):
User transcript: "${e.transcript}"
Clara's reply: "${e.claraResponse || ""}"`;
      })
      .join("\n\n");

    // 3. Build Prompt
    const systemPrompt = `You are Clara, a warm, thoughtful, and highly empathetic AI companion for a personal voice diary.
You are generating a weekly emotional review report for the user based on their journal entries from the past 7 days.
You must analyze the user's weekly entries and return a JSON object with this exact shape:
{
  "summary": "A warm, caring 2-3 sentence overview of their week, highlighting what they experienced, written in Clara's comforting persona.",
  "themes": ["theme 1", "theme 2", "theme 3"],
  "moodArc": "A 1-2 sentence description summarizing how their emotional state evolved during the week (e.g., starting stressed but ending on a hopeful note).",
  "highlight": "A specific positive breakthrough, moment of gratitude, or progress they mentioned (quote or reference it warmheartedly).",
  "suggestion": "One warm, actionable, non-preachy suggestion for next week to support their well-being."
}

Return ONLY this JSON object. Do not wrap it in markdown code blocks.`;

    const userPrompt = `Here are the user's journal entries for the last 7 days:\n\n${contextText}`;

    // 4. Query Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment configuration");
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: [
              {
                parts: [{ text: userPrompt }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.5,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned HTTP ${response.status} during insight generation`);
      }

      const data = await response.json() as any;
      const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
      const parsed = JSON.parse(jsonText);

      // 5. Save the generated insight to the database
      const insight = await prisma.insight.create({
        data: {
          userId,
          weekStart: sevenDaysAgo,
          weekEnd: new Date(),
          summary: parsed.summary || "A week of reflection and sharing.",
          themes: parsed.themes || ["Reflections"],
          moodArc: parsed.moodArc || "Steady mood throughout the week.",
          highlight: parsed.highlight || "Taking the time to record your thoughts.",
          suggestion: parsed.suggestion || "Continue checking in with yourself daily.",
        },
      });

      console.log(`[Insight Service] Generated and saved Insight ID: ${insight.id}`);

      return {
        id: insight.id,
        summary: insight.summary,
        themes: insight.themes as string[],
        moodArc: insight.moodArc,
        highlight: insight.highlight,
        suggestion: insight.suggestion,
        weekStart: insight.weekStart,
        weekEnd: insight.weekEnd,
        createdAt: insight.createdAt,
      };
    } catch (err: any) {
      console.error("[Insight Service] Error generating insight:", err);
      throw new Error(`Failed to generate insights: ${err.message}`);
    }
  }

  async getLatestInsight(userId: string): Promise<WeeklyInsightResult | null> {
    const insight = await prisma.insight.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!insight) return null;

    return {
      id: insight.id,
      summary: insight.summary,
      themes: insight.themes as string[],
      moodArc: insight.moodArc,
      highlight: insight.highlight,
      suggestion: insight.suggestion,
      weekStart: insight.weekStart,
      weekEnd: insight.weekEnd,
      createdAt: insight.createdAt,
    };
  }

  async getAllInsights(userId: string): Promise<WeeklyInsightResult[]> {
    const insights = await prisma.insight.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return insights.map((insight) => ({
      id: insight.id,
      summary: insight.summary,
      themes: insight.themes as string[],
      moodArc: insight.moodArc,
      highlight: insight.highlight,
      suggestion: insight.suggestion,
      weekStart: insight.weekStart,
      weekEnd: insight.weekEnd,
      createdAt: insight.createdAt,
    }));
  }
}

export const insightService = new InsightService();
