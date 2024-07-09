import { Router } from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT);

router.route("/:videoId/comments").get(getVideoComments);
router.route("/:videoId/comment").post(addComment);
router.route("/comment/:commentId").patch(updateComment);
router.route("/comment/:commentId").delete(deleteComment);

export default router;
