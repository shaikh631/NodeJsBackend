import  { Router } from "express";
import {changeCurrentPassword,
    getCurrentUser,
    getUserChannelProfile, 
    getWatchHistory,
    loginUser,
    logout,
    refreshAccessToken, 
    resgisterUser, 
    UpdateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.js";
import { VerifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route('/register').post(
    upload.fields([
        {name : "avatar" , maxCount : 1},
        {name : "coverImage" , maxCount : 1},
    ]),
    resgisterUser)

    router.route('/login').post(loginUser)
    router.route('/logout').post(VerifyJWT , logout)
    router.route('/refresh-token').post(refreshAccessToken)

export default router;