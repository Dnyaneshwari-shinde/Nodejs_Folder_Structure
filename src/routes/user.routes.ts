// Define user registration, login, and profile endpoints

import { Router } from "express";
import validate from "../middlewares/validate.middleware.js";
import { login, register } from "../controllers/user.controller.js";
import { loginSchema, registerSchema } from "../validators/user.validator.js";

const authRoutes = Router();

authRoutes.post("/register", validate(registerSchema), register);
authRoutes.post("/login", validate(loginSchema), login);

export default authRoutes;