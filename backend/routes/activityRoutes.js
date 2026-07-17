import express from "express";
import requireAuth from "../middleware/authMiddleware.js";
import { getActivity, backfillActivity } from "../controllers/activityController.js";

const router = express.Router();

router.get("/", requireAuth, getActivity);
router.post("/backfill", requireAuth, backfillActivity);

export default router;
