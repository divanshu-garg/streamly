import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Subscription } from "../models/subscription.model.js";
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

export { toggleSubscription };
