import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // channel id in params(invalid id check), user should be logged in

  // total subscribers: subscription controller logic
  // total likes: from like model
  // total videos: from video model with channel as owner in instance
  // total video views: find videos with owner in video model and access the views and sum it

  const { channelId } = req.params;

  const channelExists = await User.findById(channelId.trim().toLowerCase());

  if (!channelExists) {
    throw new ApiError(404, "channel does not exist");
  }

  const subscribers = await Subscription.find({
    channel: channelId,
  });

  const totalSubscribers = subscribers.length; // got one

  // total likes: fetch all videos from channelId by lookup and then find likes for each video in like model

  const totalVideosLikesAndViews = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(channelId.trim().toLowerCase()),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videos",
        pipeline: [
          {
            $match: {
              isPublished: true,
            },
          },
        ],
      },
    },
    {
      $unwind: "$videos",
    },
    {
      $lookup: {
        from: "likes",
        localField: "videos._id",
        foreignField: "video",
        as: "videos.likes",
      },
    },
    {
      $addFields: { "videos.totalLikes": { $size: "$videos.likes" } },
    },
    {
      $group: {
        _id: "$_id",
        totalViews: { $sum: "$videos.views" },
        totalLikes: { $sum: "$videos.totalLikes" },
        totalVideos: { $sum: 1 },
      },
    },
    {
      $project: {
        totalViews: 1,
        totalLikes: 1,
        totalVideos: 1,
      },
    },
  ]);

  if (!(subscribers && totalVideosLikesAndViews.length)) {
    throw new ApiError(500, "something went wrong while fetching the data");
  }

  return res.status(
    new ApiResponse(
      200,
      {
        totalSubscribers: totalSubscribers,
        totalLikes: totalVideosLikesAndViews[0].totalLikes,
        totalVideos: totalVideosLikesAndViews[0].totalVideos,
        totalViews: totalVideosLikesAndViews[0].totalViews,
      },
      "dashboard data fetched successfully"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const channelExists = await User.findById(channelId.trim().toLowerCase());

  if (!channelExists) {
    throw new ApiError(404, "channel not found");
  }

  const channelVideos = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(channelId.trim().toLowerCase()),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videos",
        // pipeline: [
        //   {
        //     $match: {
        //       isPublished: true,
        //     },
        //   },
        // ],
      },
    },
    {
      $project: {
        avatar: 1,
        username: 1,
        fullname: 1,
        videos: 1,
        "videos.thumbnail": 1,
        "videos.title": 1,
        "videos.views": 1,
        "videos.duration": 1,
      },
    },
  ]);

  if (!channelVideos.length) {
    throw new ApiError(
      500,
      "something went wrong while fetching channel videos"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channelVideos[0],
        "channel videos fetched successfully"
      )
    );
});

export { 
    getChannelStats, 
    getChannelVideos
 };