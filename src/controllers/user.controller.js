import {asyncHandler} from "../utils/asyncHandler.js"; 
import { User } from '../models/user.model.js';
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const RefreshToken = user.generateRefreshToken();
        const AccessToken = user.generateAccessToken();

        user.refreshToken = RefreshToken ;

        await user.save({ validateBeforeSave: false })

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
        [fullName, email, username, password].some((field) => !field?.trim())
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

    if(coverImageLocalPath && !coverImage){
        throw new ApiError(500 , 'Cover image upload failed')
    }

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


    const {email , password , username } = req.body ?? {}

    if(!username && !email || !password){
        throw new ApiError(400 , "Username or email and password are required")
    }
    const user = await User.findOne({$or :[{username} , {email}]});

    if(!user){
        throw new ApiError(401 , "User is not Found...")
    }
    
    const isPasswordValid =  await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401 , "Invalid User Password")
    }

    const {AccessToken , RefreshToken} = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
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
            $unset :{refreshToken : 1}
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

const refreshAccessToken = asyncHandler(async (req , res ) => {
    const incomingRefreshToken = req.cookies?.refreshtoken || req.body?.refreshToken;

   if(!incomingRefreshToken){
    throw new ApiError( 401 ,"unauthorized request")
   }

    const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET);

   const user = await User.findById(decodedToken?._id)

   if(!user){
    throw new ApiError(401 , "Invalid Refresh Token")
   }

    if(incomingRefreshToken !== user?.refreshToken){
    throw new ApiError(401 , "Refresh Token is Expired or Used")
   }

   const option = {
    httpOnly : true , 
    secure : true
   }

   const {AccessToken , RefreshToken}  =await generateAccessAndRefreshTokens(user._id);

    return res.status(200)
    .cookie("accesstoken" , AccessToken , option)
    .cookie("refreshtoken" , RefreshToken , option)
    .json(new ApiResponse(200 , { AccessToken, RefreshToken }, "Access token refreshed"))

})

const changeCurrentPassword = asyncHandler(async(req , res) => {

    const {OldPassword , NewPassword , ConfirmPassword } = req.body

    if(!OldPassword || !NewPassword || !ConfirmPassword){
        throw new ApiError(400 ,"All Field is Required");
    }

    const user = await User.findById(req.user?._id);

    // const isPasswordValid =  await user.isPasswordCorrect(password);
    // if(!isPasswordValid){
    //     throw new ApiError(401 , "Invalid User Password")
    // }

    const isPasswordValid = await user.isPasswordCorrect(OldPassword);
    if(!isPasswordValid){
        throw new ApiError(401 , "Password is Inavlid || Enter Valid Password")
    }

    if(NewPassword !== ConfirmPassword ){
        throw new ApiError(401 , "Check the NewPassword and ConfirmPassword");
    }

    user.password = NewPassword ; 
    await user.save({validateBeforeSave : false});

    return res.status(400)
    .json(new ApiError(400 , {} , "Password Change Successfully" ))
    
})

const getCurrentUser = asyncHandler(async (req , res) => {
    return res.status(200)
    .json(200 , req.user , "Current User fetch succesfully")
})

const UpdateAccountDetails = asyncHandler(async (res , req ) => {

    const {fullName , email} = req.body 

    if(!fullName || !email) {
        throw new ApiError(200 , "Enter the Field to Update")
    }
    const user = await User.findOneAndUpdate(req.user?._id ,
        {
            $set : {
                fullName ,
                email
            }
        },
        {new : true}
    ).select("-password")

    return res.status(200)
    .json(new ApiError(200 , user , "Account Detail Add Successfully"))

})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async ( res , req) => {
    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400 , "User is Missing")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username : username
            }
        },
        // Subscriper
        {
            $lookup: {
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"

            }
        },
        // Channel 
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as : "subscribedTo "
            }
        },
        // Size of subscriber and SubscribedTo
        {
            $addFields:{
                subscribersCount : {
                    $size : "$subscribers"
                },
                 ChannelsSubscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed:{
                    $cond : {
                        if:{$in :[req.user?._id , "$subscribers.subscriber"]},
                        then : true,
                        else : false
                    }
                }

            }
        },
        {
            $project:{
                fullName: 1,
                username: 1, 
                subscribersCount: 1,
                ChannelsSubscribedToCount: 1,
                isSubscribed: 1,
                coverImage: 1,
                avatar: 1,
                email: 1

            }
        }

    ])

    if(!channel?.length){
        throw new ApiError(404 , "Channel doesn't Exists")
    }

    return res.status(200)
    .json(new ApiError(200 , channel[0], "User Channel fetched Success"))
     
})

const getWatchHistory = asyncHandler(async (req , res) => {
    const user = User.aggregate([
        {
            $match:{
                _id: mongoose.Types.ObjectId(req.user?._id),
            }
        },
        {
            $lookup:{
                from:"vedios",
                localField:"watchHistory",
                foreignField:"_id",
                as :"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"user",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        username: 1,
                                        fullName:1,
                                        avatar:1

                                    }
                                }
                            ]
                        }
                    },
                    {
                         $addFields :{
                            owner : {
                                $first :"$owner"
                                }
                            }
                    }
                ]
            }
        },
    ])

    return res.status(200)
    .json(new ApiError(200 , user[0].watchHistory , "Watch History fetch successfully..."))
})

export {resgisterUser , loginUser ,
     logout, refreshAccessToken ,
     changeCurrentPassword , getCurrentUser,
     UpdateAccountDetails, updateUserAvatar ,
     updateUserCoverImage ,getUserChannelProfile,
     getWatchHistory

}