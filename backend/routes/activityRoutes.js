import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getActivity, backfillActivity } from "../controllers/activityController.js";

const router = express.Router();

router.get("/", protect, getActivity);
router.post("/backfill", protect, backfillActivity);

export default router;
