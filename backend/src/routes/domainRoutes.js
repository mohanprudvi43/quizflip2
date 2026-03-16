import { Router } from "express";
import {
  listDomains,
  createDomain,
  updateDomain,
  deleteDomain,
  uploadFlashcards,
  listFlashcardsByDomain
} from "../controllers/domainController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, listDomains);
router.get("/:domainId/flashcards", protect, listFlashcardsByDomain);

router.post("/", protect, authorize("admin"), createDomain);
router.put("/:domainId", protect, authorize("admin"), updateDomain);
router.delete("/:domainId", protect, authorize("admin"), deleteDomain);
router.post("/flashcards/upload", protect, authorize("admin"), uploadFlashcards);

export default router;
