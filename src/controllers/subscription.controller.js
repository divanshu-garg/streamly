import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js"
import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  // get channelId in req.params. error handling
  // extract channel if it is subscribed
  // delete if we got return value. else create new object and store in db
  // verifyJWT in route middleware

  const { channelId } = req.params;

  const subscribed = await Subscription.findById({
    channel: channelId,
    subscriber: new mongoose.Types.ObjectId(req.user._id),
  });

  if (subscribed.length) {
    const unsubscribe = await Subscription.findByIdAndDelete(subscribed[0]._id);
    if (!unsubscribe) {
      throw new ApiError(
        500,
        "could not unsubscribe, please try again",
        error?.message
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, unsubscribe, "unsubscribed successfully"));
  } else {
    const subscribe = await Subscription.create({
      channel: channelId,
      subscriber: req.user._id,
    });

    if (!subscribe) {
      throw new ApiError(
        500,
        "could not subscribe, please try again",
        error?.message
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, subscribe, "subscribed successfully"));
  }
});

const getUserChannelSubscribers = asyncHandler(async(req, res) => {
    // error handling on channelId
    // fetch subscribers array, error handling
    // return subscribers array


    const { channelId } = req.params

    const channel = await User.findById(channelId)

    if(!channel){
        throw new ApiError(404, "channel not found", error?.message)
    }

    const subscribers = await Subscription.find({ channel: channelId })

    if(!subscribers){
        throw new ApiError(500, "an error occured while fetching subscribers", error?.message)
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {
        subscribers: subscribers.length
    }, 
    "subscribers fetched successfully"
))
    
})

const getSubscribedChannels = asyncHandler(async(req, res) => {

    const { subscriberId } = req.params

    const subscriber = await User.findById(subscriberId)

    if(!subscriber){
        throw new ApiError(404, "user not found", error?.message)
    }

    const subscribedChannels = await Subscription.find({ subscriber: subscriberId })

    if(!subscribedChannels){
        throw new ApiError(500, "something went wrong while finding subscribers", error?.message)
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {
        subscribedChannels: subscribedChannels
    }))

})


export { 
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
 };
