import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1 
        },
        // console.log("log1"),
        {
            name: "coverImage",
            maxCount: 1
        }
    ])
    ,registerUser
)

router.route("/login").post(loginUser)

router.route("/logout").post(
    verifyJWT,
    logoutUser)
// logout: middlewares extracts user from token and adds it to req.body, controller actually deletes token from user object

router.route("/refresh-tokens").post(refreshAccessToken)

export default router