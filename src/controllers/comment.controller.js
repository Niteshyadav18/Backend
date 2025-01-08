import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const skip = (page - 1) * limit;
  const comments = await Comment.find({ videoId })
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const totalComments = await Comment.countDocuments({ videoId });

  return res.status(200).json(
    new ApiResponse(200, {
      comments,
      totalComments,
      currentPage: page,
      totalPages: Math.ceil(totalComments / limit),
    },
    "Comments fetched successfully")
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content cannot be empty");
  }

  const newComment = new Comment({
    videoId,
    userId: req.user._id,
    content,
  });

  await newComment.save();

  return res.status(201).json(
    new ApiResponse(201, newComment, "Comment added successfully")
  );
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content cannot be empty");
  }

  const updatedComment = await Comment.findOneAndUpdate(
    { _id: commentId, userId: req.user._id },
    { content, updatedAt: Date.now() },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(404, "Comment not found or not authorized");
  }

  return res.status(200).json(
    new ApiResponse(200, updatedComment, "Comment updated successfully")
  );
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const deletedComment = await Comment.findOneAndDelete({
    _id: commentId,
    userId: req.user._id,
  });

  if (!deletedComment) {
    throw new ApiError(404, "Comment not found or not authorized");
  }

  return res.status(200).json(
    new ApiResponse(200, deletedComment, "Comment deleted successfully")
  );
});

export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
};
//[FILEPATH] src/api/v1/controllers/video.controller.js [/FILEPATH]