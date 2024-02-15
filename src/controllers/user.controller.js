import {asyncHandler} from "../utils/asyncHandler.js"
import ApiResponse from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";




const generateAccessAndRefereshTokens= async(userId)=>{
   
    try{
       const user= await User.findById(userId)
       const accessToken=user.generateAccessToken()
       const refreshToken=user.generateRefreshToken()

       user.refreshToken=refreshToken
       await user.save({ validateBeforeSave: false })//hamne object ke ander vlaue add ki h and db me b

       return {accessToken ,refreshToken}

       //ye values hamare pass abhi sirf method me hai redfresh token and acess token ki
    }

 catch (error) {
    throw new ApiError(500, "Something went wrong while generating referesh and access token")
}


}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);
    console.log(req.body)
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})



const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})


const changeCurrentPassword= asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body

    const user =await User.findById(req.user?._id)
    const isPasswordCorrect= await  user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password=password
    await user.save({validateBeforeSave:false})

    return res.status(200)
    .json(new ApiResponse(
        200,user,"User fetched Successfully"
    ))
})


const  getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(
        200, req.user,"Current user fetched Successfully"))
})




const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}= req.body

    if(!fullName || !email ){
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(
        200,user,"Account details updated successfully"))

});

//Checking for images:

const updateUserAvatar = asyncHandler(async (req, res) => {
   // taking the new avatar file
   const newAvatarLocalPath = req.file?.path; // we are writing "file" instead of "files" as we are changing only one file i.e. "avatar"

   if (!newAvatarLocalPath) {
       throw new ApiError(404, "Avatar file not found.");
   }

   // uploading new avatar on cloudinary
   const newAvatar = await uploadOnCloudinary(newAvatarLocalPath);

   if(!newAvatar.url) { // we only need the new avatar url not whole object
       throw new ApiError(404, "Avatar file not found");
   }

   // storing old avatar public_id from DB in a variable
   const oldAvatarPublicId = req.user?.avatar.public_id;

   // finding & updating the user on the DB
   const user = await User.findByIdAndUpdate(
       req.user?._id,
       {
           $set: {avatar: {url: newAvatar.url, public_id: newAvatar.public_id}}  // we only need the new avatar url & public_id not whole object
       },
       {new: true}
   ).select("-password -avatar._id -coverImage._id");  // we dont want password field
   
   // deleting old avatar on cloudinary
   const oldAvatarDeleted = await deleteOnCloudinary(oldAvatarPublicId);
   
   if(!oldAvatarDeleted) {
       throw new ApiError(404, "Old avatar not deleted");
   }

   // Returning response
   return res
   .status(200)
   .json(new ApiResponse(200, user, "Avatar updated successfully."));

} );
const updateUserCoverImage = asyncHandler(async(req, res) => {
    const newCoverImageLocalPath = req.file?.path; // we are writing "file" instead of "files" as we are changing only one file i.e. "avatar"

    if (!newCoverImageLocalPath) {
        throw new ApiError(404, "Cover Image file not found.");
    }

    // Uploading new cover-image on cloudinary
    const newCoverImage = await uploadOnCloudinary(newCoverImageLocalPath);

    if(!newCoverImage.url) { // we only need the new cover image url not whole object
        throw new ApiError(404, "Cover Image file not found");
    }

    // storing old coverImage public_id from DB in a variable
    const oldCoverImagePublicId = req.user?.coverImage.public_id;
    // Finding & updating the user on the DB
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {coverImage: {url: newCoverImage.url, public_id: newCoverImage.public_id}}  // we only need the new cover image url & public_id not whole object
        },
        {new: true}
    ).select("-password -avatar._id -coverImage._id");  // we dont want password field

    // deleting old coverImage on cloudinary
    const oldCoverImageDeleted = await deleteOnCloudinary(oldCoverImagePublicId);
    
    if(!oldCoverImageDeleted) {
        throw new ApiError(404, "Old CoverImage not deleted");
    }

    // Returning response
    return res
    .status(200)
    .json(new ApiResponse(200, user, "CoverImage updated successfully."));

} );




const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})


const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"// direct ke user ko 1st object dedeya ..ab woh dot use karke saare values access kar sakta hai.. 
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

export {registerUser
        ,refreshAccessToken
        ,loginUser
        ,logoutUser
        ,updateUserCoverImage
        ,updateUserAvatar
        ,updateAccountDetails
        ,getCurrentUser
        ,changeCurrentPassword
        ,getUserChannelProfile
        ,getWatchHistory
    
    };
//cap User mongoose ka object haiex:find one updateOne...
//small user hamara user hai jiska instance hamne db se wapis leya hai ..toh h
//hamrare banaye method sab is user ke pass hai..