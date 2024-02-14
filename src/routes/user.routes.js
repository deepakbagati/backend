import {Router} from "express";
import {registerUser,loginUser,logoutUser,refreshAccessToken} from "../controllers/user.controller.js"
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

export default router;