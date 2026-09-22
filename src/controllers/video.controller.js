import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js"; 
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.module.js";
import { Like } from "../models/like.module.js";
import { Playlist } from "../models/playlist.module.js";


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

const deleteWatchHistory = asyncHandler(async(req , res) => {
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                watchHistory: []
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200 , user , "Watch History Deleted Successfully"))
})

const commentOnVideo = asyncHandler(async(req , res) => {
    const {videoId} = req.params;
    const {content} = req.body;

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400 , "Invalid Video Id")
    }

    if(!content?.trim()){
        throw new ApiError(400 , "Comment Content is Required")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })

    return res.status(201)
    .json(new ApiResponse(201 , comment , "Comment Added Successfully"))
})

const likeVideoOrComment = asyncHandler(async(req , res) => {
    const {videoId , commentId} = req.params;

    if(!videoId && !commentId){
        throw new ApiError(400 , "Video Id or Comment Id is Required")
    }

    if(videoId && !mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400 , "Invalid Video Id")
    }

    if(commentId && !mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400 , "Invalid Comment Id")
    }

    const like = await Like.create({
        video: videoId,
        comment: commentId,
        likedBy: req.user?._id
    })

    return res.status(201)
    .json(new ApiResponse(201 , like , "Like Added Successfully"))
})

const playlistVideoAdd = asyncHandler(async(req , res) => {
    const {playlistId , videoId} = req.params;
    if(!playlistId || !videoId){
        throw new ApiError(400 , "Playlist Id or Video Id is Required")
    }
    if(playlistId && !mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400 , "Invalid Playlist Id")
    }
    if(videoId && !mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400 , "Invalid Video Id")
    }
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404 , "Playlist Not Found")
    }
    if(playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403 , "You are not authorized to add video to this playlist")
    }
    if(playlist.videos.includes(videoId)){
        throw new ApiError(400 , "Video already exists in the playlist")
    }
    playlist.videos.push(videoId);
    await playlist.save();
    return res.status(200)
    .json(new ApiResponse(200 , playlist , "Video Added to Playlist Successfully"))
})

const getUserPlaylists = asyncHandler(async(req , res) => {
    const playlists = await Playlist.find({owner: req.user?._id}).populate("videos").select("-owner -__v").sort({createdAt : -1});
    return res.status(200)
    .json(new ApiResponse(200 , playlists , "User Playlists Fetched Successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async(req , res) => {
    const {playlistId , videoId} = req.params;
    if(!playlistId || !videoId){
        throw new ApiError(400 , "Playlist Id or Video Id is Required")
    }
    if(playlistId && !mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400 , "Invalid Playlist Id")
    }
    if(videoId && !mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400 , "Invalid Video Id")
    }
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404 , "Playlist Not Found")
    }
    if(playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403 , "You are not authorized to remove video from this playlist")
    }
    if(!playlist.videos.includes(videoId)){
        throw new ApiError(400 , "Video does not exist in the playlist")
    }
    playlist.videos.pull(videoId);
    await playlist.save();
    return res.status(200)
    .json(new ApiResponse(200 , playlist , "Video Removed from Playlist Successfully"))
})

const getPlaylistVideos = asyncHandler(async(req , res) => {
    const {playlistId} = req.params;
    if(!playlistId){
        throw new ApiError(400 , "Playlist Id is Required")
    }
    if(playlistId && !mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400 , "Invalid Playlist Id")
    }
    const playlist = await Playlist.findById(playlistId).populate({path: "videos", 
        populate: {
            path: "owner", select: "username fullName avatar"}
        });

        if (!playlist) {
        throw new ApiError(404, "Playlist Not Found");
        }

        return res.status(200)
        .json(new ApiResponse(200 , playlist.videos , "Playlist Videos Fetched Successfully"))

})

export{
    getWatchHistory,
    deleteWatchHistory,
    commentOnVideo,
    likeVideoOrComment,
    playlistVideoAdd,
    getUserPlaylists,
    removeVideoFromPlaylist,
    getPlaylistVideos
}