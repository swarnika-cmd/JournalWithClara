import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.middleware";
import { insightService } from "../services/insight.service";

const router = Router();

// Apply auth middleware to all insights routes
router.use(requireAuth);

/**
 * @route POST /api/insights/generate
 * @desc Manually trigger weekly insight generation for the authenticated user
 */
router.post("/generate", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await insightService.generateWeeklyInsight(req.user.userId);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
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
router.get("/latest", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const insight = await insightService.getLatestInsight(req.user.userId);
    if (!insight) {
      return res.status(404).json({ message: "No insights generated yet. Talk to Clara a few times to get started!" });
    }
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
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const insights = await insightService.getAllInsights(req.user.userId);
    return res.json({ insights });
  } catch (err: any) {
    console.error("[Insights Router] Error getting insights history:", err);
    return res.status(500).json({ error: err.message || "Failed to retrieve insights history" });
  }
});

export default router;
