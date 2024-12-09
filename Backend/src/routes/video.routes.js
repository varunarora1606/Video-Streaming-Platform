import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteVideo, getVideoById, publishAVideo, updateVideo } from "../controllers/video.controller.js";

const router = new Router();

router.route('/publish-a-video').post(verifyJWT,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishAVideo)
router.route('/watch/:videoId').get(getVideoById)
router.route('/update/:videoId').patch(verifyJWT, upload.single("thumbnail"), updateVideo)
router.route('/delete/:videoId').delete(verifyJWT, deleteVideo)


export default router