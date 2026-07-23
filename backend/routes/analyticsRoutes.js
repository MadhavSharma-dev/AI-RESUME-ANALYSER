import express from "express";
import requireAuth from "../middleware/authMiddleware.js";
import {
  getScoreTrends,
  getMissedKeywords,
  getRecurringIssues,
  getDashboardOverview
} from "../controllers/analyticsController.js";

const router = express.Router();

// All analytics routes are protected
router.get("/overview", requireAuth, getDashboardOverview);
router.get("/trends", requireAuth, getScoreTrends);
router.get("/keywords", requireAuth, getMissedKeywords);
router.get("/recurring-issues", requireAuth, getRecurringIssues);

export default router;
