import { Router } from "express";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller";
import { verifyJWT } from "../middlewares/auth.middleware";


const router = Router();

router.route("/toggle/:channelId").post(verifyJWT, toggleSubscription)
router.route("/subscribers/:channelId").get(getUserChannelSubscribers)
router.route("/subscribed-channels/:subscriberId").get(getSubscribedChannels)

export default router;
