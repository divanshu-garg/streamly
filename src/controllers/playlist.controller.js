import { Playlist } from "../models/playlist.model";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model";

const createPlaylist = asyncHandler(async (req, res) => {
  // check user logged in: auth middleware
  // take playlist name desc
  // see if playlist with this name already exists
  // create a playlist

  const { name, description } = req.body;

  const playlist = await Playlist.find({
    owner: req.user._id,
    name: name,
  });

  if (playlist.length) {
    throw new ApiError(
      404,
      "playlist with this name already exists",
      error?.message
    );
  }

  const newPlaylist = await Playlist.create({
    name: name,
    owner: req.user._id,
    description: description || "",
  });

  if(!newPlaylist){
    throw new ApiError(500, "something went wrong while creating the playlist", error?.message)
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
        throw new ApiError(404, "user not found", error?.message)
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
        throw new ApiError(404, "playlist with this id does not exist", error?.message)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,
        playlist,
        "playlist found successfully")
    )
})




export { 
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
 };
