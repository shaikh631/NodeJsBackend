import  { Router } from "express";
import {changeCurrentPassword,
    getCurrentUser,
    getUserChannelProfile,
    loginUser,
    logout,
    refreshAccessToken, 
    resgisterUser, 
    UpdateAccountDetails, 
    deleteUserAccount,
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
    router.route('/change-password').post(VerifyJWT ,changeCurrentPassword )
    router.route('/current-user').get(VerifyJWT , getCurrentUser)
    router.route('/update-account').patch(VerifyJWT , UpdateAccountDetails)
    router.route('/update-avatar').patch(VerifyJWT , upload.single('avatar') , updateUserAvatar),
    router.route('/update-coverImage').patch(VerifyJWT , upload.single('coverImage') , updateUserCoverImage),
    router.route('/c/:username').get(VerifyJWT , getUserChannelProfile),
    router.route('/delete-account').delete(VerifyJWT , deleteUserAccount)

export default router;