import { Router } from "express";
import { getLikedVideos, toggleVideoLike } from "../controllers/like.controller";

const router = Router();

router.route("/:videoId/like").post(toggleVideoLike)
router.route("/:commentId/like").post(toggleCommentLike)
router.route("/:tweetId/like").post(toggleTweetLike)
router.route("/videos").get(getLikedVideos)

export default router;