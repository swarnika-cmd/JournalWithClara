import { Router, Response } from "express";
import multer from "multer";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { sttService } from "../services/stt.service";
import { llmService } from "../services/llm.service";
import { ttsService } from "../services/tts.service";
import { sentimentService } from "../services/sentiment.service";
import { embeddingService } from "../services/embedding.service";
import { ragService } from "../services/rag.service";
import prisma from "../lib/prisma";
import { deleteCachePattern, deleteCache, getCache, setCache } from "../lib/redis";
import { voiceUploadLimiter, askQueryLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

// Configure multer in-memory storage (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// POST /api/entries/voice (Protected)
router.post(
  "/voice",
  authMiddleware,
  voiceUploadLimiter,
  upload.single("audio"),
  async (req: AuthRequest, res: Response): Promise<any> => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Audio file upload is required" });
    }

    try {
      console.log(`[Entries Router] Audio received. Size: ${req.file.size} bytes. User: ${req.user.email}`);



      // 1. Call Deepgram STT
      const transcript = await sttService.transcribeAudio(
        req.file.buffer,
        req.file.mimetype || "audio/webm"
      );

      const cleanedTranscript = transcript || "(No speech detected)";

      let mrbrownResponseText = "";
      let mrbrownAudioBase64: string | null = null;

      if (cleanedTranscript === "(No speech detected)") {
        mrbrownResponseText = "I couldn't quite hear you — could you try speaking a little closer to the mic?";
      } else {
        // 2. Call LLM Service (OpenAI) to generate Mr Brown's text response
        mrbrownResponseText = await llmService.generateMrBrownResponse(
          req.user.userId,
          cleanedTranscript
        );

        // 3. Call TTS Service (ElevenLabs) to convert Mr Brown's response to audio bytes
        const mrbrownAudioBuffer = await ttsService.generateSpeech(mrbrownResponseText);
        mrbrownAudioBase64 = mrbrownAudioBuffer.length > 0
          ? mrbrownAudioBuffer.toString("base64")
          : null;
      }

      // 4. Call Sentiment Service to analyze emotional tone
      const sentiment = await sentimentService.analyzeSentiment(cleanedTranscript);

      // 5. Save Entry in database linked to the User
      const entry = await prisma.entry.create({
        data: {
          userId: req.user.userId,
          transcript: cleanedTranscript,
          mrbrownResponse: mrbrownResponseText,
          moodScore: sentiment.score,
          moodLabel: sentiment.label,
          moodReason: sentiment.reason,
        },
      });

      // 6. Generate and save embedding vector for RAG similarity search
      try {
        const embedding = await embeddingService.generateEmbedding(cleanedTranscript);
        await prisma.$executeRaw`
          UPDATE "Entry"
          SET embedding = ${JSON.stringify(embedding)}::vector
          WHERE id = ${entry.id}
        `;
        console.log(`[Entries Router] Saved vector embedding for Entry ID: ${entry.id}`);
      } catch (embErr) {
        console.error(`[Entries Router] Failed to save vector embedding for Entry ID: ${entry.id}:`, embErr);
      }

      console.log(`[Entries Router] Saved new Entry ID: ${entry.id} for User: ${req.user.email}`);

      // Evict caching keys for this user
      await deleteCachePattern(`entries:list:${req.user.userId}:*`);
      await deleteCache(`entries:stats:${req.user.userId}`);

      return res.json({ 
        entry,
        mrbrownAudio: mrbrownAudioBase64 
      });
    } catch (error: any) {
      console.error("[Entries Router Error]", error);
      return res.status(500).json({ error: error.message || "Failed to process audio entry" });
    }
  }
);

// GET /api/entries/mood-stats (Protected) - Fetch entry mood summary statistics and calendar map
router.get("/mood-stats", authMiddleware, async (req: AuthRequest, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  const cacheKey = `entries:stats:${req.user.userId}`;
  
  try {
    // Attempt to serve from cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`[Entries Router] Serving mood-stats from cache for User: ${req.user.email}`);
      return res.json(JSON.parse(cachedData));
    }

    const entries = await prisma.entry.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        moodScore: true,
        createdAt: true,
      },
    });

    const totalCount = entries.length;

    // Calculate average score (excluding any entries where moodScore wasn't recorded)
    const validScores = entries.map(e => e.moodScore).filter((s): s is number => s !== null);
    const avgMood = validScores.length > 0
      ? Math.round((validScores.reduce((sum, s) => sum + s, 0) / validScores.length) * 10) / 10
      : 3.0;

    // Calculate consecutive journaling streak
    const getStreak = (): number => {
      if (entries.length === 0) return 0;
      
      const uniqueDatesStr = Array.from(
        new Set(
          entries.map(e => e.createdAt.toISOString().split("T")[0])
        )
      ).sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

      if (uniqueDatesStr.length === 0) return 0;

      const todayStr = new Date().toISOString().split("T")[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const latestDate = uniqueDatesStr[0];
      if (latestDate !== todayStr && latestDate !== yesterdayStr) {
        return 0; // Streak broke
      }

      let streak = 1;
      for (let i = 0; i < uniqueDatesStr.length - 1; i++) {
        const current = new Date(uniqueDatesStr[i]);
        const prev = new Date(uniqueDatesStr[i + 1]);
        const diffTime = Math.abs(current.getTime() - prev.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          streak++;
        } else if (diffDays > 1) {
          break; // Streak broke
        }
      }

      return streak;
    };

    const streak = getStreak();

    // Map daily data { "YYYY-MM-DD": { avgScore: number, count: number } }
    const dailyMap: { [key: string]: { avgScore: number; count: number; totalScore: number } } = {};
    
    entries.forEach(e => {
      const dayStr = e.createdAt.toISOString().split("T")[0];
      const score = e.moodScore || 3;
      if (!dailyMap[dayStr]) {
        dailyMap[dayStr] = { avgScore: 0, count: 0, totalScore: 0 };
      }
      dailyMap[dayStr].count += 1;
      dailyMap[dayStr].totalScore += score;
      dailyMap[dayStr].avgScore = Math.round((dailyMap[dayStr].totalScore / dailyMap[dayStr].count) * 10) / 10;
    });

    // Clean up dailyMap for transfer (remove totalScore helper key)
    const dailyData: { [key: string]: { avgScore: number; count: number } } = {};
    Object.keys(dailyMap).forEach(k => {
      dailyData[k] = {
        avgScore: dailyMap[k].avgScore,
        count: dailyMap[k].count,
      };
    });

    const statsResult = {
      totalCount,
      avgMood,
      streak,
      dailyData,
    };

    // Store in cache for 10 minutes
    await setCache(cacheKey, JSON.stringify(statsResult), 600);

    return res.json(statsResult);
  } catch (error) {
    console.error("[Entries Mood Stats Error]", error);
    return res.status(500).json({ error: "Failed to calculate mood statistics" });
  }
});

// GET /api/entries (Protected) - List user's journal entries with pagination and search
router.get("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || "";
  
  const cacheKey = `entries:list:${req.user.userId}:page_${page}:limit_${limit}:search_${search}`;

  try {
    // Attempt to serve from cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`[Entries Router] Serving entries list from cache for User: ${req.user.email}`);
      return res.json(JSON.parse(cachedData));
    }

    const where: any = {
      userId: req.user.userId,
    };

    if (search) {
      where.OR = [
        { transcript: { contains: search } },
        { mrbrownResponse: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    const [entries, totalCount] = await prisma.$transaction([
      prisma.entry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.entry.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const listResult = {
      entries,
      totalCount,
      page,
      totalPages,
    };

    // Store in cache for 5 minutes
    await setCache(cacheKey, JSON.stringify(listResult), 300);

    return res.json(listResult);
  } catch (error) {
    console.error("[Entries List Error]", error);
    return res.status(500).json({ error: "Failed to fetch entries" });
  }
});

// DELETE /api/entries/:id (Protected) - Delete a journal entry
router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  const { id } = req.params;

  try {
    const entry = await prisma.entry.findUnique({
      where: { id },
    });

    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    if (entry.userId !== req.user.userId) {
      return res.status(403).json({ error: "Unauthorized to delete this entry" });
    }

    await prisma.entry.delete({
      where: { id },
    });

    // Evict caching keys for this user
    await deleteCachePattern(`entries:list:${req.user.userId}:*`);
    await deleteCache(`entries:stats:${req.user.userId}`);

    return res.json({ success: true, message: "Entry successfully deleted" });
  } catch (error) {
    console.error("[Entries Delete Error]", error);
    return res.status(500).json({ error: "Failed to delete entry" });
  }
});

// POST /api/entries/ask (Protected) - Ask Mr Brown a question about past entries (RAG search)
router.post("/ask", authMiddleware, askQueryLimiter, async (req: AuthRequest, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  const { question } = req.body;
  if (!question || question.trim() === "") {
    return res.status(400).json({ error: "Question query is required" });
  }

  try {
    const result = await ragService.answerQuestion(req.user.userId, question);
    return res.json(result);
  } catch (error) {
    console.error("[RAG Search Route Error]", error);
    return res.status(500).json({ error: "Failed to answer search query" });
  }
});

export default router;
