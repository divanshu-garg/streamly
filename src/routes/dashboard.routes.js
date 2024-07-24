import { Router } from "express";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller";

const router = Router();

router.route("/:channelId").get(getChannelStats)
router.route("/videos/:channelId").get(getChannelVideos)

export default router;
