import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import mongoose from "mongoose";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const video = await Video.aggregate([
    {
      $match: {
        _id: videoId,
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "totalComments",
        pipeline: [
          {
            $lookup: {
              from: "user",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullname: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: { $arrayElemAt: ["$owner", 0] },
            },
          },
        ],
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  if (!video[0]) {
    throw new ApiError(500, "video not found", error?.message);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video[0]?.totalComments,
        "all comments fetched succesfully"
      )
    );
});

const addComment = asyncHandler(async (req, res) => {
  // URL: POST /videos/:videoId/comments

  // need video, content and owner
  // check user logged in
  // videoId in url
  // get owner from req.user
  // check if content is not empty

  const { videoId } = req?.params;
  const { content } = req.body;

  const video = await Video.findById(videoId);

  if (!video?.trim()) {
    throw new ApiError(404, "video does not exist", error?.message);
  }

  if (!content) {
    throw new ApiError(
      404,
      "can not make an empty comment, please write something",
      error?.message
    );
  }

  const comment = await Comment.create({
    content,
    video,
    owner: new mongoose.Types.ObjectId(req.user._id),
  });

  if (!comment) {
    throw new ApiError(
      505,
      "something went wrong, try commenting again",
      error?.message
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "your comment was sent"));
});

const updateComment = asyncHandler(async (req, res) => {
  // find comment id from req.params, check if comment exists
  // get content from req.body. error check
  // check if user has authority to delete comment
  // update comment, error handling
  // success message

  const { commentId } = req.params;
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const { content } = req.body;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "comment does not exist", error?.message);
  }

  if (comment.owner.toString() !== userId.toString()) {
    throw new ApiError(
      404,
      "unauthorized request, you can't update this comment",
      error?.message
    );
  }

  if (!content) {
    throw new ApiError(404, "updated comment can't be empty", error?.message);
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: { content: content },
    },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(
      500,
      "something went wrong, please try again",
      error?.message
    );
  }

  updatedComment.save({ validateBeforeSave: false });


  return res
    .status(200)
    .json(200, updatedComment, "comment was updated successfully");
});

const deleteComment = asyncHandler(async (req, res) => {
  // get comment via comment id. comment id in params
  // check if that comment is yours only. match owner of comment and req.user._id
  // delete comment

  const userId = new mongoose.Types.ObjectId(req.user._id);
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "comment not found", error?.message);
  }

  // if i dont use .toString then I will compare two different object instances which can never be same
  if (comment.owner.toString() !== userId.toString()) {
    throw new ApiError(
      404,
      "unauthorized request, you can't delete this comment",
      error?.message
    );
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(
      500,
      "something went wrong, please try again",
      error?.message
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "comment deleted successfully"));
});

export { getVideoComments, addComment, deleteComment, updateComment };
