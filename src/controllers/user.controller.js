import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import { ApiResponse } from "../utils/ApiResponse.js";

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


export { registerUser,
  loginUser,
  logoutUser
 }