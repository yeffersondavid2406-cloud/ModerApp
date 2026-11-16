
import { Router } from "express";
import { classifyCommentController } from "../controllers/moderationController.js";
import { getComments } from "../controllers/commentsController.js";

const router = Router();

router.get("/comments", getComments);
router.post("/classify", classifyCommentController);

export default router;
