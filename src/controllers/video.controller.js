import mongoose,{isValidObjectId} from "mongoose";
import {Video} from "../models/video.models.js";
import {User} from "../models/user.models.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteOnCloudinary,deleteOnCloudinaryVideo} from "../utils/cloudinary.js"
import {Like} from "../models/like.models.js"
import {Comment} from "../models/comment.models.js"
import {Playlist} from "../models/playlist.models.js"



export const getAllVideos = asyncHandler(async(req,res)=>{

    const {page=1,limit=10,query,sortBy,sortType,userId}=req.query;


    if(page<1 && limit>10){
        throw new ApiError(400,"Invalid Page number Or limit")
    }

    if(!query && query?.trim()){
        throw new ApiError(400,"Provide spicefic query")
    }

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid UserId ")
    }

    const user =await User.findById(userId);

    if(!user){
        throw new ApiError(400,"User not found")
    }

    //define seacrh criteria
    const searchCriteria={};
    if (sortBy &&sortType){
        searchCriteria[sortBy]==sortType==="asc"?1:-1;

    }
    else{
        searchCriteria["createdAt"]=-1;
    }

    //defining options for aggregatePaginate
    const options ={
        page:parseInt(page,10),
        limit:parseInt(limit,10),
        sort:searchCriteria
    };

    //define the pipeline

    const videosAggregation=Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(user)
            }
        },
        {
            $match:{
                title:{
                    $regex:query
                }
            }
        },
    ]);
    //using the aggregatePaginate

    const videos=await Video.aggregatePaginate(
        videosAggregation,
        options,
    );

    if(videos.totalDocs===0){
        throw new ApiError(400,"No videos matched the searched query")
    }

    //returning response
    return res.status(200)
    .json(new ApiResponse(200,videos,"videos fetched successfully"))

});


export const publishVideo=asyncHandler(async(req,res)=>{
    const {title,description}=req.body

    if(title===""){
        throw new ApiError(400,"Title is reqd")

    }

   if(description===""){
        throw new ApiError(400,"description is required")
   }

   //taking the video path and checking its validation
   let videoFileLocalPath;
   if(req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length>0){
        videoFileLocalPath=req.files?.videoFile[0].path
   }

   if(!videoFileLocalPath){
    throw new ApiError(400,"Video file not found")
   }

   let thumbnailLocalPath;
   if(req.files && Array.isArray(req.files.thumbnail ) && req.files.thumbnail.length>0){
        thumbnailLocalPath=req.files.thumbnail[0].path;
   }

   if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail file not found")
   }

   //uplaoding the thumbNail and video to cloudinary

   const videoPulished= await uploadOnCloudinary(videoFileLocalPath);
   if(!videoPulished){
        throw new ApiError(400,"Video is reqd")
   }

   const thumbnailPulished= await uploadOnCloudinary(videoFileLocalPath);
   if(!thumbnailPulished){
        throw new ApiError(400,"thumbnail is reqd")
   }

   //save the video & its details to db
   const video = await Video.create({
       title,
       description,
       videoFile:{url: videoPulished.url, public_id:videoPulished.public_id},
       thumbnail:{url:thumbnail.url, public_id:thumbnail.public_id},
       duration:videoPulished.duration,
       owner:req.user?._id//as user is already login if he is uploading a video


   });

   if(!video){
      throw new ApiError(400,"Video is not uploaded")
   }

   return res.
   status(200)
   .json(new ApiResponse(200,video,"Video uploaded Successfully"))
});

export const getVideoById = asyncHandler(async(req,res)=>{
    //getting video id from the user through parameter

    const {videoId}= req.params
    if(!isValidObjectId(videoId) && !videoId?.trim()){
        throw new ApiError(400,"Inavild videoId");
    }

    //searching for video in db

    if(seacrhedVideo){
        await User.findByIdAndUpdate(
            req.user?._id,
            {
                $addToSet:{watchHistory:seacrhedVideo._id}  // "$addToSet method" only pushes unique value to an array i.e. it will not push a video in watchHistory if it already exists in the watchHistory.
            },
            {new :true}
        );
    }

    else{
        throw new ApiError(400, "video not found");
    }

    return res.status(200)
    .json(new ApiResponse(200,seacrhedVideo,"Video fetched successfully"))
});


export const updateVideo = asynchandler(async(req,res)=>{
    //TODO: update video details like title, description, thumbnail
    //getting the videoId from the user
    const {videoId}= req.params
    const{title,description}=req.body;

    const newThumbnailLocalPath = req.file?.path;

    if(!newThumbnailLocalPath){
        throw new ApiError(404,"Thumbnail file not found")
    }

    if(!isValidObjectId(videoId) && !videoId?.trim()){
        throw new ApiError(400,"Invalid Id");
    }

    if(!title || !description){

        throw new ApiError(400,"Invalid title or description")
    }

    //upload the new thumbnail on cloudinary

    const newThumbnail = await uploadOnCloudinary(newThumbnailLocalPath);

    if(!newThumbnail){
        throw new ApiError(404,"Thumbnail file not found");
    }
    //searching  for the video in db
    const updateVideo= await Video.findById(videoId)

    if(!updateVideo){
        throw new ApiError(404,"Video not found")
    }

    const oldThumbnailPublicId= updateVideo?.thumbnail.public_id;

    // check if video owner is the current logged in user then update it
    let updatedVideo;  //writing it outside due to scope

    if (updateVideo.owner.toString() === req.user._id.toString()) { // converted id object to string for comparison
        updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {title, description, thumbnail: {url: newThumbnail.url, public_id: newThumbnail.public_id}}
            },
            {new: true}     
        )
    }

    else{
        await deleteOnCloudinary(newThumbnail.public_id)
        throw new ApiError(404," Unauthorized access. You are not the creator of the video.")
    }

    //deleting old thumbnail from cloudinary
    const oldThumbnailDeleted = await deleteOnCloudinary(oldThumbnailPublicId);
    
    if (!oldThumbnailDeleted) {
        throw new ApiError(404, "Old thumbnail not deleted");
    }

       // returning response
       return res
       .status(200)
       .json(new ApiResponse(201, updatedVideo, "Video updated successfully."));
   });
   
   export const deleteVideo = asyncHandler(async(req,res)=>{

    // taking the videoId from the user through params

    const {videoId}= req.params

    if(!isValidObjectId(videoId) && !videoId?.trim()){
        throw new ApiError(404," Invalid VideoId ")

    }
    //searching for video in DB

    const deleteVideo= await Video.findById(videoId);

    if(!deleteVideo){
        throw new ApiError(400,"Video not found")
    }

        // taking out the thumbnail and video file

    const deleteVideoThumbnail=deleteVideo.thumbnail.public_id;
    const deleteVideoFile= deleteVideo.videoFile.public_id;

     // if the video owner and current logged in user are same the delete the video & its assets

     if(deleteVideo.owner.toString()==req.user._id.toString()){
        await deleteOnCloudinary(deleteVideoFile);
        await deleteOnCloudinary(deleteVideoThumbnail);

        const deletedVideo=await Video.findByIdAndDelete(videoId);
        const comments= await Comment.find({video:deletedVideo._id});
        const commentsIds= comments.map((comment)=>comment._id);

          // if video is deleted delete everything related to the video: likes, comments, remove it fom playlist, comment likes, remove it from watchHistory
        if (deletedVideo) {
            await Like.deleteMany({video: deletedVideo._id});
            await Like.deleteMany({comment:{$in: commentsIds}});
            await Comment.deleteMany({video:deletedVideo._id});
            const playlists = await Playlist.find({videos: deletedVideo._id});
            const users = await User.find({watchHistory: deletedVideo._id});

            for (const playlist of playlists) {
                await Playlist.findByIdAndUpdate(
                    playlist._id,
                    {
                        $pull:{videos:deletedVideo._id}
                    },
                    {new:true}
                )
            }

            for (const user of users){
                await User.findByIdAndUpdate(
                    user._id,
                    {
                        $pull:{watchHistory:deletedVideo._id}
                    },
                    {new:true}
                )
            }



        }

        else {
            throw new ApiError(400,"Something went wrong while deleteing the video")
        }

    }

    else{
        throw new ApiError(400,"Unauthorized access. You are not the owner of the video")
    }

    //returning response
    return res.status(200)
    .json( new ApiResponse(200,{},"Video deleted successfully"))





   });


 export const togglePublishStatus= asyncHandler(async(req,res)=>{

    //taking the videoID from the user

    const {videoId}=req.params;

    if (!isValidObjectId(videoId) && !videoId?.trim()) {
        throw new ApiError(400, "Invalid videoId.");
    }

    //searching for the video in db

    const toggleVideo =await Video.findById(videoId);

    if(!toggleVideo){
        throw new ApiError(400,"Video not found")

    }
    let toggledVideo;

    if(toggleVideo.owner.toString()===req.user._id.toString()){
        toggledVideo =await Video.findByIdAndUpdate(
            videoId,
            {
                $set:{isPublished:!toggleVideo.isPublished}
            },
            {new :true}
        )
    }

    else{
        throw new ApiError(400,"Unauthorised access")
    }

    //returning response
    return res.status(200)
    .json(new ApiResponse(200,toggledVideo,"toggled successfully"))
 });





