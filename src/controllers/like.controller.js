import mongoose, {isValidObjectId} from "mongoose"
import { Like } from "../models/like.models.js"
import { Video } from "../models/video.models.js"
import {Comment} from "../models/comment.models.js"
import {Tweet} from "../models/tweet.models.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import ApiResponse from "../utils/ApiResponse.js"


export const toggleVideoLike =asyncHandler(async(req,res)=>{
    //take the videoId
    const {videoId}=req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id")
    }
    //searching the video in db

    const video= await Video.findById(videoId);

    if(!video){
        throw new ApiError(400,"video not found")
    }
    //checking if the video is already liked

    const videoAlreadyLiked= await Like.findOne({
        video:video._id,
        likedBy:req.user?._id
    });

    if(videoAlreadyLiked){
        await Like.findByIdAndDelete(videoAlreadyLiked._id);
    

        return res.status(200)
        .json(new ApiResponse(200,{},"Video disliked Successfully"))
    }
    else{
        await Like.create({
            video:video._id,
            likedBy:req.user?._id
        });
    }

    //returning response
    return res.status(200)
    .json(new ApiResponse(200,{},"Video liked successfully"))

});


export const toggleCommentLike=asyncHandler(async(req,res)=>{
    const{commentId}=req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid comment id");
    }

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(400,"Comment Not Found")
    }

    const commentAlreadyLiked=await Like.findOne({
        comment:comment._id,
        likedBy:req.user?._id
    });

    if(commentAlreadyLiked){
        await Like.findByIdAndDelete(commentAlreadyLiked._id);
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment disliked successfully"));
    }

    else{
        await Like.create({
            comment:comment._id,
            likedBy:req.user?._id
        });
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment liked successfully"));

});


export const toggleTweetLike =asyncHandler(async(req,res)=>{
    const {tweetId}= req.params

    if(!isValidObjectId(tweetId)){

     const tweet= await  Tweet.findById(tweetId);

     if(!tweet){
        throw new ApiError(400,"Tweet not found");
     }

     const tweetAlreadyLiked= await Like.findOne({
        tweet:tweet._id,
        likedBy:req.user?._id
     });

     if(tweetAlreadyLiked){
        await Like.findByIdAndDelete(tweetAlreadyLiked._id);

    return res
    .status(200)
    .json(new ApiResponse(200,{},"tweet disliked successfully"))
     }

     else{
        await Like.create({
            tweet:tweet._id,
            likedBy:req.user?._id
        });
     }

    }

    return res.status(200)
    .json(new ApiResponse(200,{},"tweet liked successfully"))
});

export const getLikedVideos= asyncHandler(async(req,res)=>{

    const likedVideos= await Like.aggregate(
        [
        {
            $match:{
            likedBy: new mongoose.Types.ObjectId(req.user?._id),
            video:{$exists:true}//it excludes comments and tweets
            }

        },
        {
            $lookup:{
                from:"videos",
                foreignField:"_id",
                localField:"video",
                as:"likedVideo",

            }
        },
        {
            $project:{
                likedVideo:{
                    _id:1,
                    title:1,
                    owner:1,
                    views:1,
                    description:1
                }
            }
        }
    
]);

    if(!likedVideos?.length){
        throw new ApiError(404,"user has no liked videos");
    }

    return res.status(200,)
    .json(new ApiResponse(200,{},"Liked videos fetched successfully"));
});