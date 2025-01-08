import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Tweet content cannot be empty");
  }

  const tweet = await Tweet.create({
    userId: req.user._id,
    content,
    createdAt: new Date(),
  });

  return res.status(201).json(
    new ApiResponse(201, tweet, "Tweet created successfully")
  );
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const skip = (page - 1) * limit;
  const tweets = await Tweet.find({ userId })
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const totalTweets = await Tweet.countDocuments({ userId });

  return res.status(200).json(
    new ApiResponse(200, {
      tweets,
      totalTweets,
      currentPage: page,
      totalPages: Math.ceil(totalTweets / limit),
    },
    "User tweets fetched successfully")
  );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Updated content cannot be empty");
  }

  const tweet = await Tweet.findOneAndUpdate(
    { _id: tweetId, userId: req.user._id },
    { content, updatedAt: new Date() },
    { new: true }
  );

  if (!tweet) {
    throw new ApiError(404, "Tweet not found or you are not authorized to update this tweet");
  }

  return res.status(200).json(
    new ApiResponse(200, tweet, "Tweet updated successfully")
  );
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const tweet = await Tweet.findOneAndDelete({
    _id: tweetId,
    userId: req.user._id,
  });

  if (!tweet) {
    throw new ApiError(404, "Tweet not found or you are not authorized to delete this tweet");
  }

  return res.status(200).json(
    new ApiResponse(200, null, "Tweet deleted successfully")
  );
});

export {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet,
};
