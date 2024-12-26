import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

/**
 * Middleware to verify JWT tokens and authenticate requests
 * Extracts token from cookies or Authorization header
 * Verifies token validity and attaches user to request object
 */
export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        // Extract token from cookies or Authorization header
        // For Authorization header, remove "Bearer " prefix
        // Example: "Bearer eyJhbGciOiJIUzI1NiIs..."
        const token = req.cookies?.accesToken || 
                     req.header("Authorization")?.replace("Bearer ", "")
        
        // Check if token exists
        if(!token){
            throw new ApiError(
                401,
                "Access denied. No token provided"
            )
        }

        // Verify and decode the token
        // This will throw an error if token is invalid or expired
        const decodedToken = jwt.verify(
            token, 
            process.env.ACCESS_TOKEN_SECRET
        )

        // Find user by ID from decoded token
        // Exclude password and refreshToken from user data
        const user = await User.findById(decodedToken?._id)
                              .select("-password -refreshToken")

        // Check if user exists
        if(!user){
            throw new ApiError(
                401, 
                "Invalid Access Token"
            )
        }

        // Attach user object to request for use in subsequent middleware
        req.user = user;

        // Pass control to next middleware
        next()
        
    } catch (error) {
        // Handle any JWT verification errors or other issues
        // Pass along the error message or default to "Invalid accessToken"
        throw new ApiError(
            401, 
            error?.message || "Invalid accessToken"
        )
    }
})