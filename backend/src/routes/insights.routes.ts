import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { insightService } from "../services/insight.service";
import { deleteCache, getCache, setCache } from "../lib/redis";

const router = Router();

// Apply auth middleware to all insights routes
router.use(authMiddleware);

/**
 * @route POST /api/insights/generate
 * @desc Manually trigger weekly insight generation for the authenticated user
 */
router.post("/generate", async (req: AuthRequest, res: Response) => {
  try {
    const result = await insightService.generateWeeklyInsight(req.user!.userId);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    // Evict cached latest insight on generation
    await deleteCache(`insights:latest:${req.user!.userId}`);
    
    return res.status(201).json(result);
  } catch (err: any) {
    console.error("[Insights Router] Error generating insight:", err);
    return res.status(500).json({ error: err.message || "Failed to generate weekly insights" });
  }
});

/**
 * @route GET /api/insights/latest
 * @desc Retrieve the latest weekly insight report for the authenticated user
 */
router.get("/latest", async (req: AuthRequest, res: Response) => {
  const cacheKey = `insights:latest:${req.user!.userId}`;
  
  try {
    // Try serving from cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`[Insights Router] Serving latest insight from cache for User: ${req.user!.userId}`);
      return res.json(JSON.parse(cachedData));
    }

    const insight = await insightService.getLatestInsight(req.user!.userId);
    if (!insight) {
      return res.status(404).json({ message: "No insights generated yet. Talk to Mr Brown a few times to get started!" });
    }

    // Cache latest insight for 1 hour
    await setCache(cacheKey, JSON.stringify(insight), 3600);

    return res.json(insight);
  } catch (err: any) {
    console.error("[Insights Router] Error getting latest insight:", err);
    return res.status(500).json({ error: err.message || "Failed to retrieve the latest insight" });
  }
});

/**
 * @route GET /api/insights
 * @desc Retrieve all historical weekly insights for the authenticated user
 */
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const insights = await insightService.getAllInsights(req.user!.userId);
    return res.json({ insights });
  } catch (err: any) {
    console.error("[Insights Router] Error getting insights history:", err);
    return res.status(500).json({ error: err.message || "Failed to retrieve insights history" });
  }
});

export default router;
