import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import { ApiResponse } from "../utils/ApiResponse.js";

//Generate AccessToken And RefreshTokens  
const generateAccessTokenAndRefreshTokens = async(userId)=>{
  try {
   const user =  await User.findById(userId)
  const accesToken =  user.generateAccessToken()
  const refreshToken =  user.generateRefreshToken()

  user.refreshToken = refreshToken
  await user.save({ validateBeforeSave: false })

  return { accesToken, refreshToken }

  } catch (error) {
    throw new ApiError(500, "Something went wrong")
  }
}

// Controller function to handle user registration
const registerUser = asyncHandler(async (req, res) => {
  // Extract user details from the request body
  const { fullName, email, username, password } = req.body;
 // console.log("email:", email);

  //console.log(req.body)
  // Check if any required fields are empty
  if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if a user with the same username or email already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists with this username or email");
  }
 // console.log(req.files)

  // Get the local paths of the uploaded avatar and cover image
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
   
  // Ensure that an avatar image is provided
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // Upload images to Cloudinary and get their URLs
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

    // Alternative of uploading coverimage
  //  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
  //   coverImageLocalPath = req.files?.coverImage[0].path
  //  }


  // Ensure that the avatar upload was successful
  if (!avatar) {
    throw new ApiError(500, "Failed to upload avatar");
  }

  // Create a new user in the database
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password, // Note: In a real application, ensure to hash the password before storing
    username: username.toLowerCase(),
  });

  // Retrieve the created user, excluding sensitive fields
  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  // Alternativecode for excluding passwordand refreshtoken
// User.findById(user._id).select({ password: 0, refreshToken: 0 });

  // Ensure that the user was created successfully
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong");
  }

  // Send a success response with the created user data
  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully")
  );
});

//Login user
const loginUser = asyncHandler(async(req, res) =>{
  //req body -> data
  //username or email 
  //find the user
  //password check 
  //acces and refresh token 
  //send cookies

  const {email, username, password} = req.body

  if(!username && !email){
    throw new ApiError(400, "Please enter either username or email")
  }
  //check if user exists
   const user = await User.findOne({
    $or: [{username}, {email}]
  })

  if(!user){
    throw new ApiError(404, "User not found")
  }

  //Password check 
  const isPasswordValid = await user.isPasswordCorrect (password)

  if(!isPasswordValid){
    throw new ApiError(401, "Invalid password")
  }

  const {accesToken,refreshToken} = await generateAccessTokenAndRefreshTokens(user._id)

  //send cookies
  const loggedInUser = await  User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true
  }
  return res
  .status(200)
  .cookie("accessToken", accesToken,options)
  .cookie("refreshToken", refreshToken,options)
  .json(
    new ApiResponse(200,{
      user: loggedInUser,accesToken,refreshToken
    },
    "User logged in successfully"
  )
  )
})

//Logout user
const logoutUser = asyncHandler(async(req, res) => {
  await User.findByIdAndUpdate(
      req.user._id,
      {
          $set: {
              refreshToken: undefined // this removes the field from document
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

// Refresh Acces Token
const refreshAccessToken = asyncHandler(async(req, res)=>{
 const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken


 if(!incomingRefreshToken){
  throw new ApiError(401,"unauthorized requet")
 }

try {
  const decodedToken =  jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
   )
  
   const user = await User.findById(decodedToken?._id)
  
   if(!user){
    throw new ApiError(401,"Invalid refresh Token")
   }
  
   if(incomingRefreshToken !== user?.refreshToken){
    throw new ApiError(401,"Invalid refresh Token")
   }
  
  const options = {
    httpOnly: true,
    secure: true
  }
  
  const {accesToken,newRefreshToken} = await generateAccessTokenAndRefreshTokens(user._id)
  
  return res
  .status(200)
  .cookie("accessToken",accesToken,options)
  .cookie("refreshToken",newRefreshTokenefreshToken,options)
  .json(
    new ApiResponse(
      200,
      {accesToken,refreshToken: newRefreshToken},
      "Access Token  refreshed"
  
    )
  )
  
} catch (error) {
  throw new ApiError(401, error?.message || "Invalid refresh Token")
}
})

// Change Current Password
const changeCurrentPassword = asyncHandler(async(req,res)=>{
  if (!oldPassword || !newPassword || !confirmPassword) {
    throw new ApiError(400, "Please provide all fields (oldPassword, newPassword, confirmPassword)");
  }

  // Check if newPassword matches confirmPassword
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New password and confirm password do not match");
  }


  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if(!isPasswordCorrect){
    throw new ApiError(401,"Invalid old password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false})

 return res
 .status(200)
 .json(new ApiResponse(200,{},"Password change succesfully"))
})

//Get Current User
const getCurrentUser = asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(new ApiResponse(200,req.user,"Current user found Succesfully"))
})

//Update Account Details
const updateAccountDetails = asyncHandler(async(req,res)=>{
  const {fullName, email} = req.body
  if(!fullName || !email){
    throw new ApiError(400,"Please provide all fields")
  }
  const user =
   await User.findByIdAndUpdate
   (
    req.user?._id,
    {
      $set:{
        fullName,
        email:email
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200,user, "Account Details updated succesfully"))
})

// Update User Avatar
const updateUserAvatar = asyncHandler(async(req,res)=>{
  const {avatarLocalPath} = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"Please provide avatar")
  }

const avatar = await uploadOnCloudinary(avatarLocalPath)

if(!avatar.url){
  throw new ApiError(400,"Avatar upload failed")
}

const user = await User.findByIdAndUpdate(
  req.user?._id,
  {
    $set:{
      avatar:avatar.url
    }
  },
  {new:true}
).select("-password")

return res
.status(200)
.json(
  new ApiResponse(200,user, "Avatar updated succesfully")
)


})

//Update User CoverImage 
const updateUserCoverImage = asyncHandler(async(req,res)=>{
  const {coverImageLocalPath} = req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(400,"Please provide coverImage")
  }

const coverImage = await uploadOnCloudinary(coverImageLocalPath)

if(!coverImage.url){
  throw new ApiError(400,"coverImage upload failed")
}

const user = await User.findByIdAndUpdate(
  req.user?._id,
  {
    $set:{
      coverImage:coverImage.url
    }
  },
  {new:true}
).select("-password")

return res
.status(200)
.json(
  new ApiResponse(200,user, "Cover image updated succesfully")
)

})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
  const {username} =req.params

  if(!username?.trim()){
    throw new ApiError(400,"Please provide username")
  }

  const channel = await  User.aggregate([
    {
      $match:{
        username:username?.toLowerCase()
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscribers"
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscribers",
        as:"subscribedTo"
      }
    },
    {
      $addFields:{
        subscribersCount:{
          $size:"$subscribers"
        },
        channelsSubscribedTOCount:{
          $size:"$subscribedTo"
        },
        isSubscribed:{
          $cond:{
            if:{$in:[req.user?._id,"$Subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
    },
    {
      $project:{
        fullName:1,
        username:1,
        subscribersCount:1,
        channelsSubscribedTOCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1
      }
    }
  ])

  if(!channel?.length){
    throw new ApiError(404,"Channel does not exits")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200, channel[0],"User channel fetched succesfully")
  )

})

const getWatchHistory = asyncHandler(async(req,res)=>{
  const user = await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id)
      },
    },
      {
        $lookup:{
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
          pipeline:[
            {
              $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                  {
                    $project:{
                      fullName:1,
                      username:1,
                      avatar:1
                    }
                  }
                ]
              }
            },
            {
              $addFields:{
                owner: {
                  $first: "$owner"
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
    200,
    user[0].watchHistory,
    "Watch histroy fetched succesfully"

  )
})



export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile
 }