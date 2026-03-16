import { Router } from "express";
import {
	login,
	logout,
	refreshAccessToken,
	registerLearner
} from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../schemas/authSchemas.js";

const router = Router();

router.post("/register", validate(registerSchema), registerLearner);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);

export default router;
