import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {User} from "../models/user.models.js"
import {Video} from "../models/video.models.js"
import ApiError from "../utils/ApiError.js"
import asyncHandler from "../utils/asyncHandler.js"
import ApiResponse from "../utils/ApiResponse.js"


export const createPlaylist =asyncHandler(async(req,res)=>{

    const {name,description}= req.body;

    if(name ==="" && description ===""){
        throw new ApiError(400,"Invalid name or description.")
    }
    

    //creating the playlist

    const playlist= await Playlist.create({
        name,
        description,
        owner:req.user?._id
    });

    if(!playlist){
        throw new ApiError(400,"Error while creating Playlist")
    }

    //returning response
    return res
    .status(200)
    .json(new ApiResponse(200, playlist,"Playlist created successfully"))
});

export const getUserPlaylists = asyncHandler(async(req,res)=>{

    const {userId}=req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"User not Found");
    }

    // checking for the user in DB
    const user = await User.findById(userId);

    if (!user) {
        throw new apiError(404, "User not found.");
    }


    const playlists = await Playlist.aggregate([
        {
            $match:{   // returning only those playlists where owner & user._id are same
                owner:new mongoose.Types.ObjectId(user._id)
            }
        }

    ]);
    if(playlists.length===0){
        return res
        .status(404)
        .json(new apiResponse(400, playlists, "User has no playlists.")); 
    }


    return res.status(200)
    .json(new ApiResponse(200,playlists,"playlists fetched successfully"));
});


export const getPlaylistById =asyncHandler(async(req,res)=>{
    const {playlistId}=req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playListId")
    }
    //searching for the playlist in db

    const searchedPlayList= await Playlist.findById(playlistId);

    if(!searchedPlayList){
        throw new ApiError(400,"Playlist not found in DB")

    }

    //returning response
    return res.status(200)
    .json(new ApiResponse(200,searchedPlayList,"Playlist fetched successfully"))
});

export const addVideoToPlayList=asyncHandler(async(req,res)=>{
    //taking playlistId  and videoId

    const {playlistId,videoId}=req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid Playlist Id")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Video Id")
    }

    //seaching for playlist and video in db

    const playlist= await Playlist.findById(playlistId);
    const video=await Video.findById(videoId);

    if (!playlist) {
        throw new apiError(400, "Playlist not found");
    }

    if (!video) {
        throw new apiError(400, "Video not found");
    }

    //adding video to playlist if the playlist owner is currently logged In

    let videoPlaylist;

    if(playlist.owner.toString()=== req.user._id.toString()){
        videoPlaylist=await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $addToSet:{videos:video._id}
            },

            {new:true}
        )
    }else{
        throw new ApiError(40,"Unauthorised access to playlist")
    }

    //returning response

    return res
    .status(200)
    .json(new ApiResponse(200,videoPlaylist,"Video added to playlist successfully."))


});

export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // TODO: remove video from playlist

    // taking playlist & video id's 
    const {playlistId, videoId} = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    // searching for playlist & video in DB
    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    if (!playlist) {
        throw new ApiError(400, "Playlist not found");
    }

    if (!video) {
        throw new ApiError(400, "Video not found");
    }

    // remove video to playlist if the playlist owner is currently logged in
    let videoPlaylist;
    if (playlist.owner.toString() === req.user._id.toString()) {
        videoPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
               $pull: {videos: video._id}   // pulling the video from  the "videos" array of the playlist
            },
            {new: true}
        )
    }else {
        throw new ApiError(400, "Unauthorized access to playlist");
    }

    // returning response
    return res
    .status(200)
    .json(new ApiResponse(200, videoPlaylist, "Video removed from playlist successfully."))


} );

export const deletePlayList=asyncHandler(async(req,res)=>{

    const {playlistId}=req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400," Inavlid PlayListId")

    }


    //searching for playlist in db

    const deletePlaylist= await Playlist.findById(playlistId);

    if(!deletePlayList){
        throw new ApiError(400,"Playlist not found")
    }

    //delete the playlist if owner of the playlist and loggedin user are same
    if(deletePlayList.owner.toString()===req.user._id.toString()){
        await findByIdAndDelete(playlistId)
    }
    else{
        throw new ApiError(400,"playlist not deleted,error occur")
    }

    //returning response

    return res
    .status(200)
    .json(new ApiResponse(200,"PlayList deleted successfully"))
})



export const updatePlaylist = asyncHandler(async (req, res) => {
    //TODO: update playlist

    // get the name, description, plylistID
    const {playlistId} = req.params;
    const {name, description} = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId.");
    }

    if (name === "" || description === "") {
        throw new ApiError(400, "name or description must not be specified.")
    }

    // search for the playlist in the DB
    const updatePlaylist = await Playlist.findById(playlistId);

    if (!updatePlaylist) {
        throw new ApiError(400, "Playlist not found.")
    }

    // update the playlist if logged in user is the playlist owner
    let updatedPlaylist;
    if (updatePlaylist.owner.toString() === req.user?._id.toString()) {
        updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set: {
                    name,
                    description
                }
        
            },
            {new: true}
        )
    }

    // returning response
    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Plsylist updated successfully."))
    
} );