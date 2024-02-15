import {Router} from "express";
import {registerUser,loginUser,logoutUser,refreshAccessToken, changeCurrentPassword, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";


const router= Router()
router.route("/register").post(
    upload.fields([
        {
        name:"avatar",
        maxCount:1

        },
        {
        name:"coverImage",
        maxCount:1
        }

    ]),
    registerUser
    )



router.route("/login").post(loginUser)
 //secured routes
router.route("/logout").post(verifyJWT,  logoutUser)
//verifyJWT pehle hoga then woh next karke logoutUser karne boldega...
router.route("/refresh-token").post( refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,updateAccountDetails)

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)

export default router;