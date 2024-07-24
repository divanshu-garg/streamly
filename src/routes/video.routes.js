import { Router } from "express";
import { deleteVideo, getAllVideos, getVideobyId, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller";
import { upload } from "../middlewares/multer.middleware";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT)

router.route("/videos").get(getAllVideos);
router.route("/publish").post(
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);

router.route("/:videoId").get(getVideobyId);
router.route("/update/:videoId").patch(upload.single("thumbnail"),updateVideo);
router.route("/delete/:videoId").delete(deleteVideo);
router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

export default router;
