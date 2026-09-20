import {asyncHandler} from "../utils/asyncHandler.js"; 
import { User } from '../models/user.model.js';
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
 
const resgisterUser = asyncHandler(async (req , res , next) => {
    // res.status(200).json({
    //     success : true , 
    //     message : "User Register Successfully"
    // })

    const {fullName , email , password , username} = req.body ?? {}
    console.log("user Email :: " , email );
    
    // if(!fullName || !email || !password || !username){
    //     return res.status(400).json({
    //         success : false , 
    //         message : "All Fields are Required"
    //     })
    // }
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({ $or : [ { email } , { username } ]});
    if(existingUser){
        throw new ApiError(409 , "Email or username is already registered")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400 , 'Avatar file is required')
    }

    const avatar = await uploadCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath
        ? await uploadCloudinary(coverImageLocalPath)
        : null;

    if(!avatar){
        throw new ApiError(500 , 'Avatar upload failed')
    }

    // if(coverImageLocalPath && !coverImage){
    //     throw new ApiError(500 , 'Cover image upload failed')
    // }

    const user = await User.create({
        fullName , 
        avatar : avatar.secure_url || avatar.url,
        password , 
        email , 
        username : username.toLowerCase() , 
        coverImage : coverImage?.secure_url || coverImage?.url || ""

    })
    const createdUser = await User.findById(user._id).select("-password -refreshToken ") 

    if(!createdUser){
        throw new ApiError(500 , "Something Went Wrong while creating User")
    }
    return res.status(201).json(
        new ApiResponse(201 , createdUser , "User Created Successfully")
    )

})

export {resgisterUser}