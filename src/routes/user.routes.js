import  { Router } from "express";
import {loginUser, logout, resgisterUser} from "../controllers/user.controller.js";
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

export default router;