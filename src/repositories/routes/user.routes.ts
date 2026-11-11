import { Router } from "express";
import { deleteUser, getUser, registerUser, updateUser } from "../controllers/user.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { registerSchema, updateUserSchema } from "../validators/user.validator.js";
import { userRateLimiter } from "../middlewares/rate.middleware.js";

const userRouter = Router();

userRouter.post("/register", validateBody(registerSchema), userRateLimiter, registerUser);
userRouter.get("/:id", getUser);
userRouter.patch("/:id", validateBody(updateUserSchema), updateUser);
userRouter.delete("/:id", deleteUser);

export default userRouter;
