import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getUser,
    updateUserDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = new Router();

router.route('/register').post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)
router.route('/login').post(loginUser)

// Secured routes
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').post(verifyJWT, changeCurrentPassword)
router.route("/get-user").get(verifyJWT, getUser)
router.route('/update-account').post(verifyJWT, updateUserDetails) //Patch can be used
router.route('/avatar').post(verifyJWT, upload.single("avatar"), updateUserAvatar) //Patch can be used but understand why??
router.route('/cover-image').post(verifyJWT, upload.single("avatar"), updateUserCoverImage) //Patch can be used but understand why??
router.route('/channel/:username').get(verifyJWT, getUserChannelProfile)
router.route("/watch-history").get(verifyJWT, getWatchHistory)

// Inme instead of post, patch try kariyo ek baar


export default router