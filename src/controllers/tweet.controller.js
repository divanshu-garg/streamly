import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model";
import { User } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";

const createTweet = asyncHandler(async (req, res) => {
  // check user logged in
  // check content is not empty

  const { content } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "you are not logged in", error?.message);
  }

  if (!content) {
    throw new ApiError(404, "please write something first", error?.message);
  }

  const tweet = await Tweet.create({
    content,
    owner: new mongoose.Types.ObjectId(user._id),
  });

  const tweetCreated = await Tweet.findById(tweet._id);

  if (!tweetCreated) {
    throw new ApiError(
      500,
      "something went wrong, please try again",
      error?.message
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        tweetCreated,
        "tweet has been published successfully"
      )
    );
});

const getUserTweets = asyncHandler(async (req, res) => {
  // aggregation pipeline. match username from req.parmas,
  // lookup from tweets and store as total tweets
  // project user details and tweets
  // pagination
  // error handling: no user found

  const { username } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  if (!username?.trim()) {
    throw new ApiError(404, "please enter a username", error?.message);
  }

  const user = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "tweets",
        localField: "_id",
        foreignField: "owner",
        as: "allTweets",
      },
    },
    {
      $project: {
        username: 1,
        fullname: 1,
        avatar: 1,
        allTweets: 1,
      },
    },
    { $skip: skip },
    { $limit: limit },
  ]);

  //   user not found: empty array
  if (!user.length) {
    throw new ApiError(404, "user not found", error?.message);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { user: user[0] }, "tweets fetched successfully")
    );
});

const updateTweet = asyncHandler(async (req, res) => {
    // tweet id in req.params
    // content in req.body. error handling
    // check tweet exists or not
    // authorization check. req.user._d & tweet.owner
    // update content. error handling
    // save
    // success message

    const { tweetId } = req.params
    const { content } = req.body

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "tweet does not exist ", error?.message)
    }

    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(401, "authorization error: you can't update this tweet", error?.message)
    }

    if(!content){
        throw new ApiError(404, "updated tweet can not be empty", error?.message)
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, 
        {$set: { content:content }},
        { new: true }
    )

    if(!updatedTweet){
        throw new ApiError(500, "something went wrong while updating tweet, please try again", error?.message)
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "tweet was updated successfully"))
});

const deleteTweet = asyncHandler(async(req, res) => {
    // get tweetId in req.params, check if it does not exist
    // check if user has authority
    // delete tweetid. erorr handling
    // success message

    const { tweetId } = req.params

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "tweet not found", error?.message)
    }

    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(401, "unauthrized request, you can't delete this tweet", error?.message)
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    if(!deletedTweet){
        throw new ApiError(500, "something went wrong while deleting tweet, please try again", error?.message)
    }

    return res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "tweet was deleted successfully"))
})

export { createTweet, 
    getUserTweets, 
    updateTweet,
    deleteTweet
     };
