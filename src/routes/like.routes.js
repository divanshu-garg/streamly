import { Router } from "express";
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT)

router.route("/v/:videoId/like").post(toggleVideoLike)
router.route("/c/:commentId/like").post(toggleCommentLike)
router.route("/t/:tweetId/like").post(toggleTweetLike)
router.route("/videos").get(getLikedVideos)

export default router;