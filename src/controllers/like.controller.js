import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Toggle like on a video
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const userId = req.user.id; // Assuming user ID is attached to the request from middleware

    let like = await Like.findOne({ userId, videoId });

    if (like) {
        // Unlike the video
        await Like.findByIdAndDelete(like._id);
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Video unliked successfully"));
    } else {
        // Like the video
        like = new Like({ userId, videoId });
        await like.save();
        return res
            .status(200)
            .json(new ApiResponse(200, like, "Video liked successfully"));
    }
});

// Toggle like on a comment
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const userId = req.user.id;

    let like = await Like.findOne({ userId, commentId });

    if (like) {
        // Unlike the comment
        await Like.findByIdAndDelete(like._id);
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Comment unliked successfully"));
    } else {
        // Like the comment
        like = new Like({ userId, commentId });
        await like.save();
        return res
            .status(200)
            .json(new ApiResponse(200, like, "Comment liked successfully"));
    }
});

// Toggle like on a tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const userId = req.user.id;

    let like = await Like.findOne({ userId, tweetId });

    if (like) {
        // Unlike the tweet
        await Like.findByIdAndDelete(like._id);
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Tweet unliked successfully"));
    } else {
        // Like the tweet
        like = new Like({ userId, tweetId });
        await like.save();
        return res
            .status(200)
            .json(new ApiResponse(200, like, "Tweet liked successfully"));
    }
});

// Get all liked videos
const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const likedVideos = await Like.find({ userId, videoId: { $exists: true } });

    if (!likedVideos.length) {
        return res
            .status(404)
            .json(new ApiResponse(404, null, "No liked videos found"));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos retrieved successfully"));
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
};
