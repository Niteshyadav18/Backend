import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

/**
 * Generates both access and refresh tokens for a user
 * @param {string} userId - The user's ID
 * @returns {Object} Object containing access token and refresh token
 */
const generateAccessTokenAndRefreshTokens = async(userId) => {
    try {
        // Find user by ID
        const user = await User.findById(userId)
        
        // Generate new tokens using methods defined in user model
        const accesToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // Save refresh token to user document
        // validateBeforeSave: false skips mongoose validation
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accesToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}

/**
 * Controller for handling user registration
 * Handles file uploads, user creation, and response
 */
const registerUser = asyncHandler(async (req, res) => {
    // 1. Extract user details from request body
    const { fullName, email, username, password } = req.body;

    // 2. Validate required fields
    // Checks if any field is empty or just whitespace
    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // 3. Check for existing user
    // Uses MongoDB $or operator to check both username and email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User already exists with this username or email");
    }

    // 4. Handle file uploads
    // Get local paths of uploaded files
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    
    // Validate avatar presence
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    // 5. Upload images to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath
        ? await uploadOnCloudinary(coverImageLocalPath)
        : null;

    // Verify avatar upload success
    if (!avatar) {
        throw new ApiError(500, "Failed to upload avatar");
    }

    // 6. Create new user in database
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password, // Note: Password should be hashed in the user model
        username: username.toLowerCase(),
    });

    // 7. Fetch created user (excluding sensitive data)
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    // 8. Verify user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    // 9. Send success response
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});

/**
 * Controller for handling user login
 * Validates credentials, generates tokens, and sets cookies
 */
const loginUser = asyncHandler(async(req, res) => {
    // 1. Extract login credentials
    const {email, username, password} = req.body

    // 2. Validate input
    if(!username && !email){
        throw new ApiError(400, "Please enter either username or email")
    }

    // 3. Find user in database
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User not found")
    }

    // 4. Verify password
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid password")
    }

    // 5. Generate authentication tokens
    const {accesToken, refreshToken} = await generateAccessTokenAndRefreshTokens(user._id)

    // 6. Get user data without sensitive fields
    const loggedInUser = User.findById(user._id).select("-password -refreshToken")

    // 7. Configure cookie options
    const options = {
        httpOnly: true,  // Prevents JavaScript access to cookies
        secure: true     // Cookies only sent over HTTPS
    }

    // 8. Send response with cookies and user data
    return res
        .status(200)
        .cookie("accessToken", accesToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accesToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        )
})

/**
 * Controller for handling user logout
 * Clears tokens and cookies
 */
const logOutUser = asyncHandler(async(req, res) => {
    // 1. Remove refresh token from user document
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true  // Returns updated document
        }
    )

    // 2. Configure cookie options
    const options = {
        httpOnly: true,
        secure: true
    }

    // 3. Clear cookies and send response
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out"))
})

export {
    registerUser,
    loginUser,
    logOutUser
};