import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  // take user id and find channel.
  // $match: find all instances of video model with that userid as owner
  // $match: ispublished, apply query options to search video by title in match pipeline
  // video file thumbnail title views, duration
  // username fullname avatar as well
  // apply sort
  // apply pagination etc

  // check later: page and limit should be numbers
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  // frontend: sortType should be 'asc' or 'desc'

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const skip = (pageNum - 1) * limit;

  const channelExists = await User.findById(userId);

  if (!channelExists) {
    throw new ApiError(404, "channel does not exist");
  }

  const validSortFields = ['createdAt', 'duration', 'views'];
  if (!validSortFields.includes(sortBy)) {
    throw new ApiError(400, "Invalid parameter for sortBy");
  }

  const videos = await Video.aggregate([
    {
      $match: {
        isPublished: true,
        title: { $regex: query || "", $options: "i" },
        owner: mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        views: 1,
        duration: 1,
        "owner.username": 1,
        "owner.fullname": 1,
        "owner.avatar": 1,
      },
    },
    {
      $sort: { [sortBy]: sortType === "asc" ? 1 : -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limitNum,
    },
  ]);

  if (!videos.length) {
    throw new ApiError(
      500,
      "something went wrong while fetching all videos"
    );
  }

  const totalVideos = await Video.countDocuments({
    isPublished: true,
    title: { $regex: query || "", $options: "i" },
    owner: mongoose.Types.ObjectId(userId),
  })

  if(!totalVideos){
    throw new ApiError(500, "something went wrong while pagination, please try again")
  }

  const totalPages = Math.ceil(totalVideos / limit);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videos, totalPages, totalVideos, currentPage: page},
        "videos fetched successfully"
      )
    );
});

const publishAVideo = asyncHandler(async(req, res) => {
  // add the verifyJWT middleware
  // similar to create user
  // take video file and thumbnail in forms. error check
  // take title and description in req.body
  //  save files on local via multer. error check
  // upload files on cloudinary
  // create new video object
  // send sucess response

  const { title, description = "" } = req.body

  if(!title?.trim()){
    throw new ApiError(404, "please enter a video title")
  }

  const videoLocalPath = req.files?.video[0]?.path
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path

  if(!videoLocalPath){
      throw new ApiError(404, "please upload a video first")
  }
 
  if(!thumbnailLocalPath){
    throw new ApiError(404, "please upload a video first")
}

  const video = await uploadOnCloudinary(videoLocalPath)
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

  if(!video){
    throw new ApiError(500, "something went wrong while publishing the video")
  }
  
  if(!thumbnail){
    throw new ApiError(500, "something went wrong while uploading the thumbnail")
  }

  const publishedVideo = await Video.create({
      videoFile: video.url,
      thumbnail: thumbnail.url,
      title: title.trim(),
      description,
      isPublished: true,
      owner: mongoose.Types.ObjectId(req.user._id),
      duration: video.duration
  })

  if(!publishedVideo){
    throw new ApiError(500, "something went wrong while publishing video, during creation of video object")
  }

  return res
  .status(200)
  .json( new ApiResponse(
    200,
    publishedVideo,
    "video published successfully"
  ))

})

export { 
  getAllVideos,
  publishAVideo
 };
