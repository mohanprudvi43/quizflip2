import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  startDomainLearning,
  markFlashcardViewed,
  generateQuiz,
  submitQuiz,
  getProgressByDomain,
  getStreakCalendar
} from "../controllers/learnerController.js";

const router = Router();

router.use(protect, authorize("learner", "admin"));

router.post("/start-domain", startDomainLearning);
router.post("/flashcard/view", markFlashcardViewed);
router.post("/quiz/generate", generateQuiz);
router.post("/quiz/submit", submitQuiz);
router.get("/progress/:domainId", getProgressByDomain);
router.get("/streak", getStreakCalendar);

export default router;
