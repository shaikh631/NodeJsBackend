import  { Router } from "express";
import {loginUser, logout, refreshAccessToken, resgisterUser} from "../controllers/user.controller.js";
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