import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Get all videos with query, sort, and pagination
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", userId } = req.query;
  const skip = (page - 1) * limit;
  const filter = userId ? { userId, title: new RegExp(query, "i") } : { title: new RegExp(query, "i") };

  const videos = await Video.find(filter)
    .skip(skip)
    .limit(Number(limit))
    .sort({ [sortBy]: sortType === "asc" ? 1 : -1 });

  const totalVideos = await Video.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(200, {
      videos,
      totalVideos,
      currentPage: page,
      totalPages: Math.ceil(totalVideos / limit),
    },
    "Videos fetched successfully")
  );
});

// Publish a video
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const file = req.file; // Assuming file is attached in request
  if (!file || !title) {
    throw new ApiError(400, "Video file and title are required");
  }

  const cloudinaryResponse = await uploadOnCloudinary(file.path, "video");

  const video = await Video.create({
    userId: req.user._id,
    title,
    description,
    url: cloudinaryResponse.url,
    publicId: cloudinaryResponse.public_id,
    createdAt: new Date(),
  });

  return res.status(201).json(
    new ApiResponse(201, video, "Video published successfully")
  );
});

// Get a video by ID
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res.status(200).json(
    new ApiResponse(200, video, "Video fetched successfully")
  );
});

// Update video details
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description, thumbnail } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const updateData = {};
  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (thumbnail) updateData.thumbnail = thumbnail;

  const video = await Video.findOneAndUpdate(
    { _id: videoId, userId: req.user._id },
    updateData,
    { new: true }
  );

  if (!video) {
    throw new ApiError(404, "Video not found or you are not authorized to update this video");
  }

  return res.status(200).json(
    new ApiResponse(200, video, "Video updated successfully")
  );
});

// Delete video
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findOneAndDelete({ _id: videoId, userId: req.user._id });
  if (!video) {
    throw new ApiError(404, "Video not found or you are not authorized to delete this video");
  }

  // Optionally, delete from Cloudinary if stored there
  if (video.publicId) {
    await uploadOnCloudinary(video.publicId, "destroy");
  }

  return res.status(200).json(
    new ApiResponse(200, null, "Video deleted successfully")
  );
});

// Toggle publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res.status(200).json(
    new ApiResponse(200, video, "Video publish status toggled successfully")
  );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
