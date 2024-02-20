import mongoose, {isValidObjectId} from "mongoose"
import { User } from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


export const toggleSubscription = asyncHandler(async(req,res)=>{

    const {channelId}= req.params;

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Channel not Found")
    }
    //search for channel in DB

    const channel = await User.findById(channelId);

    if(!channel){
        throw new ApiError(400,"Channel not found")
    }

//if (channel._id.toString() === req.user?._id.toString()): Compares the string representations of the channel's owner ID and the currently authenticated user's ID.
    if (channel._id.toString() === req.user?._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel.");
    }


    const channelAlreadySubscribed=await Subscription.findOne({
        subscriber:req.user?._id,
        channel:channel._id
    })

    if(channelAlreadySubscribed){
        await Subscription.findByIdAndDelete(channelAlreadySubscribed);

        return res.status(200)
        .json(new ApiResponse(200,{},"Channel unsubscribed successfully"));
    }
    else{
        await Subscription.create({
            subscriber: req.user?._id,
            channel: channel._id
        }) 
    }

      // returning response
      return res
      .status(200)
      .json(new ApiResponse(200, {}, "Channel subscribed successfully"));


});


//controller to return subscriber list of a channel

export const getUserChannelSubscribers=asyncHandler(async(req,res)=>{
    const {channelId}=req.params;

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Inavalid ChannelId")
    }

    //search for channel in db

    const channel=await User.findById(channelId);

    if(!channel){
        throw new ApiError(404,"Channel not found");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
            }
        },

        {
            $lookup:{
               from:"users",
               localField:"subscriber",
               foreignField:"_id" ,
               as:"subscriber"
            }
        },

        {
            $project:{
                subscriber: {
                    _id: 1,
                    username: 1,
                    email: 1
                }
            }
        }
    ]);

      // returning response
      return res
      .status(200)
      .json(new apiResponse(200, subscribers, "Subscribers fetched successfully."));
});

// controller to return channel list to which user has subscribed
export const getSubscribedChannels=asyncHandler(async(req,res)=>{
    //get the subscriberId

    const {subscriberId}= req.params
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(404, "Invalid subscriber Id");
    }

    // search for channel in DB

    const subscriber = await User.findById(subscriberId);

    if(!subscriber){
        throw new ApiError(404, "Subscriber not found");

    }

    // if subscriber is found fetched the channels he has subscribed

    const subscribedChannels= await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(subscriber)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"subscribedChannel"
            }
        },

        {

            $project:{
                subscribedChannel:{
                    _id: 1,
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                    coverImage : 1
                }
                
            }
        }
    ]);




    if (!subscribedChannels.length) {
        throw new ApiError(404, "No channels subscribed");
    }

    // returning response
    return res
    .status(200)
    .json(new ApiResponse(200, subscribedChannels, "Channels subscribed successfully fetched"));

} );
//owner: ...: This is specifying the field to be matched. In the context of the code, it's likely that the owner field is used to store the ObjectId of the owner of a channel in a collection.


