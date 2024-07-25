import { Router } from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/:videoId").get(getVideoComments);
router.route("/c/:videoId").post(addComment);
router.route("/update/:commentId").patch(updateComment);
router.route("/delete/:commentId").delete(deleteComment);

export default router;
