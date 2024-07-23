import { Playlist } from "../models/playlist.model";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model";
import { Video } from "../models/video.model"
import mongoose from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
  // check user logged in: auth middleware
  // take playlist name desc
  // see if playlist with this name already exists
  // create a playlist

  const { name, description } = req.body;

  const playlist = await Playlist.findOne({
    owner: req.user._id,
    name: name,
  });

  if (playlist.length) {
    throw new ApiError(
      404,
      "playlist with this name already exists"
    );
  }

  const newPlaylist = await Playlist.create({
    name: name,
    owner: req.user._id,
    description: description || "",
  });

  if(!newPlaylist){
    throw new ApiError(500, "something went wrong while creating the playlist")
  }

  return res
  .status(200)
  .json(new ApiResponse(
    200,
    newPlaylist,
    "playlist created successfully"
  ))

});

const getUserPlaylists = asyncHandler(async(req, res) => {
    // ensure user logged in: auth middleware
    // take userId in params and make sure it exists (can do in pipeline)
    // use aggregation pipelines to find user and lookup for playlists and add them back in our user object
    // throw error if user not found else return playlists
    // we need playlists not videos so dont need to apply logic on videos of a playlist

    const { userId } = req.params;
    
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "playlists",
                localField: "_id",
                foreignField: "owner",
                as: "playlists"
            }
        },
        {
            $project: {
                username: 1,
                fullname: 1,
                avatar: 1,
                playlists: 1,
            }
        }
    ])


    if(!user.length){
        throw new ApiError(404, "user not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, user.playlists, "playlists fetched successfully"))

})

const getPlaylistById = asyncHandler(async(req, res) => {
    // take playlistId in params
    // search playlist, error if it does not exist
    // success message

    const { playlistId } = req.params

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "playlist with this id does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,
        playlist,
        "playlist found successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async(req, res) => {
    // check user logged in & take videoId, plaaylistId in params
    // see if video exists and playlist exists for user that is logged in, error handling
    // authority check
    // push the video id to playlist
    // error handling and send success message

    const { videoId, playlistId } = req.params

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    const playlist = await Playlist.findOne({
        _id: playlistId,
        owner: new mongoose.Types.ObjectId(req.user._id)
    })

    if(!playlist){
        throw new ApiError(404, "invalid playlist, it doesnt exist for your account")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {videos: new mongoose.Types.ObjectId(videoId)}
        },
        {
            new: true
        }
    )

    if(!updatedPlaylist){
        throw new ApiError(500, "something went wrong while adding video to the playlist")
    }

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        updatedPlaylist,
        "video added to playlist successfully"
    ))
})

const removeVideoFromPlaylist = asyncHandler(async(req, res) => {
    // check user logged in & take videoId, plaaylistId in params
    // handle case if video or playlist doesnt exist.
    // authority check
    // push the video id to playlist
    // error handling and send success message

    const { videoId, playlistId } = req.params

    const playlist = await Playlist.findOne({
        owner: new mongoose.Types.ObjectId(req.user._id),
        _id: playlistId
    })

    if(!playlist){
        throw new ApiError(404, "invalid playlist, it doesnt exist in your account")
    }

    const existingVideo = await Playlist.findOne({
        owner: new mongoose.Types.ObjectId(req.user._id),
        videos: new mongoose.Types.ObjectId(videoId)
    })

    if(!existingVideo){
        throw new ApiError(404, "video does not exist in playlist")
    }

    const removedVideoFromPlayist = await Playlist.findByIdAndUpdate(
        playlistId,
        {$pull: { videos: mongoose.Types.ObjectId(videoId) }},
        {new: true}
    )

    if(!removedVideoFromPlayist){
        throw new ApiError(500, "something went wrong while deleting video from playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, removedVideoFromPlayist, "video deleted successfully")
    )
})

const deletePlaylist = asyncHandler(async(req,res) => {
    // see if playlist exists
    // authority check
    // delete and success message

    const { playlistId } = req.params

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "playlist does not exist")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(404, "you can not delete this playlist")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)

    if(!deletedPlaylist){
        throw new ApiError(500, "something went wrong while deleting playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, deletedPlaylist, "playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async(req, res) => {
    // see if playlist doesnt exist
    // authority check
    // error handling, update and success response

    const { playlistId } = req.params
    const { name, description } = req.body;

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "playlist does not exist")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(404, "you can not delete this playlist")
    }

    if(!name){
        throw new ApiError(404, "name field can not be empty")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            name: name,
            description: description || ""
        },
        {new: true}
    )

    if(!updatedPlaylist){
        throw new ApiError(404, "something went wrong while updating playlist details")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        updatedPlaylist,
        "playlist has been updated successfully"
    ))

})

export { 
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist

 };
