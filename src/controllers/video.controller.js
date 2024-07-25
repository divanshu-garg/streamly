import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";

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
        owner: new mongoose.Types.ObjectId(userId),
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

  if (!videos) {
    console.log("userId: ", mongoose.Types.ObjectId.isValid(userId));
    throw new ApiError(
      500,
      "something went wrong while fetching all videos"
    );
  }

  const totalVideos = await Video.countDocuments({
    isPublished: true,
    title: { $regex: query || "", $options: "i" },
    owner: new mongoose.Types.ObjectId(userId),
  })

  // edge case: totalVideos can be zero which will make it false in if statement
  if(totalVideos === null || totalVideos === undefined){
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

  const uploadedVideo = await uploadOnCloudinary(videoLocalPath)
  const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath)

  if(!uploadedVideo){
    console.log("video: ", uploadedVideo);
    if(uploadedThumbnail){
      await deleteFromCloudinary(uploadedThumbnail)
    }
    throw new ApiError(500, "something went wrong while publishing the video")
  }
  
  if(!uploadedThumbnail){
    throw new ApiError(500, "something went wrong while uploading the thumbnail")
  }

  const publishedVideo = await Video.create({
      videoFile: uploadedVideo.url,
      thumbnail: uploadedThumbnail.url,
      title: title.trim(),
      description,
      isPublished: true,
      owner: new mongoose.Types.ObjectId(req.user._id),
      duration: uploadedVideo.duration
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

const getVideobyId = asyncHandler(async(req,res) => {

  const { videoId } = req.params

  if(!videoId){
    throw new ApiError(404, "please enter a video id")
  }

  const video = await Video.aggregate([
    {
      $match: {
        "_id": new mongoose.Types.ObjectId(videoId)
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner"
      }
    },
    {
      $unwind: "$owner"
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        createdAt: 1,
        "owner.avatar": 1,
        "owner.username": 1,
        "owner.fullname": 1
      }
    }
  ])

  if(!video.length){
    throw new ApiError(404, "video does not exist")
  }

  return res
  .status(200)
  .json( new ApiResponse(200,
    video[0],
    "video fetched successfully")
  )
})

const updateVideo = asyncHandler(async(req,res) => {
  // use verifyJWT middleware

  const { videoId } = req.params;
  const { title, description = "" } = req.body;

  const video = await Video.findOne({
    _id: videoId,
    owner: req.user._id,
  });
  if (!video) {
    throw new ApiError(404, "video does not exist or unauthorized request");
  }

  if (!title.trim()) {
    throw new ApiError(404, "please add a new title to be updated");
  }

  // making thumbnail an optional thing in this logic
  const thumbnailLocalPath = req.file?.path;
  let updatedThumbnail = "";
  if (!thumbnailLocalPath) {
    updatedThumbnail = video.thumbnail;
  } else {
    updatedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (updatedThumbnail === "") {
      throw new ApiError(500, "something went wrong while updating thumbnail");
    }
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title.trim(),
        description,
        thumbnail: updatedThumbnail?.url,
      },
    },
    { new: true }
  );

  // if succeed: delete old thumbnail from cloud if a new thumbnail was added, if fail & had a new thumbnail then delete new thumbnail from cloud
  if (!updatedVideo) {
    if (thumbnailLocalPath) {
      await deleteFromCloudinary(updatedThumbnail);
    }
    throw new ApiError(
      500,
      "something went wrong while updating video details"
    );
  }
  await deleteFromCloudinary(video.thumbnail);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "video updated successfully"));
})

const deleteVideo = asyncHandler(async(req, res) => {
  // try adjusting case: found video id but not cloudinary url
  const { videoId } = req.params

  const videoExists = await Video.findOne({
    "_id": videoId,
    owner: req.user._id
  })

  if(!videoExists){
    throw new ApiError(404, "video does not exist")
  }

  let videoDeletedFromCloud = false;

try {
    // delete video from cloudinary
    const deletedVideoFromCloud = await deleteFromCloudinary(videoExists.videoFile)
  
    if(!deletedVideoFromCloud){
      throw new ApiError(500, "something went wrong while deleting video from cloud")
    }
    
    videoDeletedFromCloud = true;
  
    const deletedThumbnailFromCloud = await deleteFromCloudinary(videoExists.thumbnail)
    

    if(!deletedThumbnailFromCloud){
      console.error("thumbnail was not deleted, url: ", videoExists.thumbnail);
    }
    
    const deletedVideo = await Video.findByIdAndDelete(videoId)
  
    if(!deletedVideo){
      throw new ApiError(500, "task completed partially: video has been deleted from cloud but not from the db")
    }
  
    return res
    .status(200)
    .json( new ApiResponse(
      200, deletedVideo, "video deleted successfully"
    ) )
} catch (error) {
  if (videoDeletedFromCloud) {
    console.error("CRITICAL: Video deleted from Cloudinary but not from database. VideoId:", videoId, "CloudinaryUrl:", videoExists.videoFile);
  }
  return res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error?.message));
}
})

const togglePublishStatus = asyncHandler(async(req, res) => {
  const { videoId } = req.params

  const video = await Video.findOne({
    "_id": videoId,
    owner: req.user._id
  })

  if(!video){
    throw new ApiError(400, "video does not exist")
  }

  let toggleStatus = !(video.isPublished);

  const changedPublishToggle = await Video.findByIdAndUpdate(
    videoId,
    {
      isPublished: toggleStatus
    },
    {new: true}
  )

  if(!changedPublishToggle){
    throw new ApiError(500, "something went wrong while changing publish status")
  }

  return res
  .status(200)
  .json(new ApiResponse(
    200, changedPublishToggle, "publish status changed successfully"
  ))
})

export { 
  getAllVideos,
  publishAVideo,
  getVideobyId,
  updateVideo,
  deleteVideo,
  togglePublishStatus
 };
