import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const VerifyJWT = asyncHandler(async (req , res , next) => {
    try {
        const token = req.cookies?.accesstoken || req.header("Authorization")?.replace("Bearer " ,"")
    
        if(!token){
            throw new ApiError(401 , "UnAuthorized Token")
        }
    
        const decodedtoken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
    const user = await User.findById(decodedtoken?._id).select("-password -refreshToken")
    
    if(!user){
        throw new ApiError(404 , "Invalid Access Token ")
       }
    
       req.user = user ;
       next();
    } catch (error) {
        throw new ApiError(401 , "Invalid Access Token" )
    }

}) 