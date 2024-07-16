import { Router } from "express";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT)

router.route("/create").post(createPlaylist)
router.route("/:userId").get(getUserPlaylists)
router.route("/:playlistId/view").get(getPlaylistById)
router.route("/:playlistId/:videoId/add").patch(addVideoToPlaylist)
router.route("/:playlistId/:videoId/remove").patch(removeVideoFromPlaylist)
router.route("/:playlistId/delete").delete(deletePlaylist)
router.route("/:playlistId/update").patch(updatePlaylist)

export default router;