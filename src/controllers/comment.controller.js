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
        _id: new mongoose.Types.ObjectId(videoId),
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

  if (!video.length) {
    throw new ApiError(500, "video not found");
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

  if (!video) {
    throw new ApiError(404, "video does not exist");
  }

  if (!content) {
    throw new ApiError(
      404,
      "can not make an empty comment, please write something"
    );
  }

  const comment = await Comment.create({
    content,
    video,
    owner: new mongoose.Types.ObjectId(req.user._id),
  });

  const commentCreated = await Comment.findById(comment._id);

  if (!commentCreated) {
    throw new ApiError(
      505,
      "something went wrong, try commenting again"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, commentCreated, "your comment was sent"));
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
    throw new ApiError(404, "comment does not exist");
  }

  if (comment.owner.toString() !== userId.toString()) {
    throw new ApiError(
      404,
      "unauthorized request, you can't update this comment"
    );
  }

  if (!content) {
    throw new ApiError(404, "updated comment can't be empty");
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
      "something went wrong while updating comment, please try again"
    );
  }

  console.log("content: ", updatedComment);

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedComment, "comment was updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // get comment via comment id. comment id in params
  // check if that comment is yours only. match owner of comment and req.user._id
  // delete comment

  const userId = new mongoose.Types.ObjectId(req.user._id);
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "comment not found");
  }

  // if i dont use .toString then I will compare two different object instances which can never be same
  if (comment.owner.toString() !== userId.toString()) {
    throw new ApiError(
      404,
      "unauthorized request, you can't delete this comment"
    );
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(
      500,
      "something went wrong, please try again"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "comment deleted successfully"));
});

export { getVideoComments, addComment, deleteComment, updateComment };
