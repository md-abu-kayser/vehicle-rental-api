import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validate } from "../../middleware/validation.middleware";
import { signupSchema, signinSchema } from "./auth.validation";

const router = Router();

router.post("/signup", validate(signupSchema), AuthController.signup);
router.post("/signin", validate(signinSchema), AuthController.signin);

export default router;
