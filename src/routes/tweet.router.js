import { Router } from "express";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller";
import { verifyJWT } from "../middlewares/auth.middleware"

const router = Router();

router.use(verifyJWT)

router.route("/").post(createTweet)
router.route("/user/:username").get(getUserTweets)
router.route("/:tweetId").patch(updateTweet)
router.route("/:tweetId").delete(deleteTweet)

export default router;