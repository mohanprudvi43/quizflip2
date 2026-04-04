import { Router } from "express";
import multer from "multer";
import { protect, authorize } from "../middleware/auth.js";
import {
	getAdminDashboard,
	seedDomainFlashcardsAsAdmin,
	generateDomainFlashcardsFromPdfAsAdmin,
	saveEditedDomainFlashcardsAsAdmin,
	generateDomainFlashcardsFromTextAsAdmin,
	listDomainConceptCardQuizAsAdmin,
	updateConceptCardQuizAsAdmin
} from "../controllers/adminController.js";

const router = Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 50 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		if (file.mimetype !== "application/pdf") {
			return cb(new Error("Only PDF files are supported"));
		}
		return cb(null, true);
	}
});

router.get("/dashboard", protect, authorize("admin"), getAdminDashboard);
router.post("/flashcards/seed-default", protect, authorize("admin"), seedDomainFlashcardsAsAdmin);
router.post(
	"/domains/:domainId/flashcards/upload-pdf",
	protect,
	authorize("admin"),
	upload.single("pdf"),
	generateDomainFlashcardsFromPdfAsAdmin
);
router.post(
	"/domains/:domainId/conceptcards/upload-pdf",
	protect,
	authorize("admin"),
	upload.single("pdf"),
	generateDomainFlashcardsFromPdfAsAdmin
);
router.post(
	"/domains/:domainId/conceptcards/generate-text",
	protect,
	authorize("admin"),
	generateDomainFlashcardsFromTextAsAdmin
);
router.post(
	"/domains/:domainId/flashcards/save-generated",
	protect,
	authorize("admin"),
	saveEditedDomainFlashcardsAsAdmin
);
router.post(
	"/domains/:domainId/conceptcards/save-generated",
	protect,
	authorize("admin"),
	saveEditedDomainFlashcardsAsAdmin
);
router.get(
	"/domains/:domainId/conceptcards/quiz",
	protect,
	authorize("admin"),
	listDomainConceptCardQuizAsAdmin
);
router.put(
	"/conceptcards/:cardId/quiz",
	protect,
	authorize("admin"),
	updateConceptCardQuizAsAdmin
);

export default router;
