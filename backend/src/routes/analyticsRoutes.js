import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { getLeaderboard } from "../controllers/analyticsController.js";

const router = Router();

router.get("/leaderboard", protect, getLeaderboard);

export default router;
