import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  // Total videos
  const totalVideos = await Video.countDocuments({ channelId });

  // Total views
  const totalViews = await Video.aggregate([
    { $match: { channelId: mongoose.Types.ObjectId(channelId) } },
    { $group: { _id: null, totalViews: { $sum: "$views" } } },
  ]);

  // Total subscribers
  const totalSubscribers = await Subscription.countDocuments({ channelId });

  // Total likes
  const totalLikes = await Like.countDocuments({ channelId });

  return res.status(200).json(
    new ApiResponse(200, {
      totalVideos,
      totalViews: totalViews[0]?.totalViews || 0,
      totalSubscribers,
      totalLikes,
    },
    "Channel stats fetched successfully")
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const skip = (page - 1) * limit;

  const videos = await Video.find({ channelId })
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const totalVideos = await Video.countDocuments({ channelId });

  return res.status(200).json(
    new ApiResponse(200, {
      videos,
      totalVideos,
      currentPage: page,
      totalPages: Math.ceil(totalVideos / limit),
    },
    "Channel videos fetched successfully")
  );
});

export {
  getChannelStats,
  getChannelVideos,
};
