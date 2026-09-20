import {asyncHandler} from "../utils/asyncHandler.js"; 
import { User } from '../models/user.model.js';
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { pass } from "three/tsl";


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const RefreshToken = user.generateRefreshToken();
        const AccessToken = user.generateAccessToken();

        user.refreshToken = RefreshToken ;

        await user.save({ValidateBeforeSave : false})

        return {RefreshToken , AccessToken}

    } catch (error) {
        throw new ApiError(500 , "Something went wrong while creating Refresh and Access token")
    }
}
 
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

const loginUser = asyncHandler(async (req , res , next) => {
    // req -> body
    // user and email in data
    // if password valid
    // Tocken Generate 


    const {email , password , username } = req.body 

    if(!username || !email){
        throw new ApiError(400 , "Username And Email Required !!")
    }
    const user = await user.findOne({$or :[{username} , {email}]});

    if(!user){
        throw new ApiError(401 , "User is not Found...")
    }
    
    const isPasswordValid =  await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401 , "Invalid User Password")
    }

    const {AccessToken , RefreshToken} = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await user.findById(user._id).select("-password -refreshToken")
    
    const option = {
        httpOnly : true, 
        secure : true
    }

   return res.status(200)
    .cookie("accesstoken" , AccessToken)
    .cookie("refreshtoken" , RefreshToken)
    .json(new ApiResponse(200 , {user : loggedInUser , AccessToken , RefreshToken} , "Successfully login"));

})

const logout = asyncHandler(async (req , res ) => {
   await User.findByIdAndUpdate(
        req.user._id, 
        {
            $set :{refreshToken : undefined}
        },
        {
             new : true
        }
    )

    const option = {
        httpOnly : true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken" , option)
    .clearCookie("refreshToken" , option)
    .json(new ApiError(200 , {},'User logout'))
})

export {resgisterUser , loginUser , logout}