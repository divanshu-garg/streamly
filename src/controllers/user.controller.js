import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { lookup } from "dns";

const generateAcessRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "something went wrong while generating JWTs");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation- not empty
  // check if use already exists
  // check for images, check for avatar
  // upload them to cloudinary(avatar)
  // create user object- create entry in db
  // remove password and refresh token field from db
  // check for user creation
  // return res

  const { username, email, fullname, password } = req.body;
  console.log("username: ", username);
  console.log("email: ", email);

  if (fullname === "") {
    throw new ApiError(400, "fullname field is empty");
  }
  if (username === "") {
    throw new ApiError(400, "username field is empty");
  }
  if (email === "") {
    throw new ApiError(400, "email field is empty");
  }
  if (password === "") {
    throw new ApiError(400, "password field is empty");
  }

  if (password.length < 8) {
    throw new ApiError(400, "password should have at least 8 characters");
  }

  if (!(password.includes("@") && password.includes("#"))) {
    throw new ApiError(400, "password should include '@' and '#'");
  }

  if (/\d/.test(password) === false) {
    throw new ApiError(400, "password should include a number as well");
  }

  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (emailPattern.test(email) === false) {
    throw new ApiError(400, "invalid email");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath = "";
  if (req.files && req.files.coverImage && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  if (existedUser) {
    fs.unlinkSync(avatarLocalPath);
    fs.unlinkSync(coverImageLocalPath);
    throw new ApiError(
      409,
      "User already exists, plese try using a different username/email"
    );
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Please upload a avatar image");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Please upload to an avatar image");
  }

  const user = await User.create({
    fullname,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
  });

  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!userCreated) {
    throw new ApiError(500, "something went wrong, please try again");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, userCreated, "User created Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // take data from req.body
  // username or email based login
  // check user in db, send error if doesnt
  // password check
  // generate access and refesh token
  // send cookie and success message

  const { username, email, password } = req.body;

  console.log("email: ", email);

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }
  if (!username) {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (emailPattern.test(email) === false) {
      throw new ApiError(400, "please enter a valid email");
    }
  }
  if (!password) {
    throw new ApiError(400, "please enter a password");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!existingUser) {
    throw new ApiError(
      404,
      "user does not exist, please create an account first"
    );
  }

  const isPasswordValid = await existingUser.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "password is incorrect");
  }

  const { accessToken, refreshToken } = await generateAcessRefreshToken(
    existingUser._id
  );
  console.log("access token: ", accessToken);
  const loggedInUser = await User.findById(existingUser._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // delete cookies from user
  // delete refresh token value in user db

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // extract token from cookies, in mobile we get it in req.body or header
  // throw error if no token found. decode this token using jwt
  // find user in db from this jwt. throw error if none found
  // match the refresh token we extracted and the one stored in this db.
  // if both refresh tokens match, generate new tokens and send a response

  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "unauthorized request, no refresh token received");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(404, "invalid refresh token, no user found");
    }

    const existingRefreshToken = await user.refreshToken;

    if (incomingRefreshToken !== existingRefreshToken) {
      throw new ApiError(400, "refresh token is incorrect or expired");
    }

    const { accessToken, refreshToken } = await generateAcessRefreshToken(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "something went wrong while generating new token"
    );
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  const verifyPassword = user.isPasswordCorrect(oldPassword);

  if (!verifyPassword) {
    throw new ApiError(404, "your password is incorrect");
  }

  if (newPassword === "") {
    throw new ApiError(400, "new password field is empty");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "new password should have at least 8 characters");
  }

  if (!(newPassword.includes("@") && newPassword.includes("#"))) {
    throw new ApiError(400, "new password should include '@' and '#'");
  }

  if (/\d/.test(newPassword) === false) {
    throw new ApiError(400, "new password should include a number as well");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(400, "no user found, please login first");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "fetched user details successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!(fullName && email)) {
    throw new ApiError(
      400,
      "please enter both full name and password to update"
    );
  }

  const user = await User.findByIdAndUpdate(
    res.user?._id,
    {
      $set: { fullName: fullName, email },
    },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new ApiError(400, "something went wrong");
  }

  user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "full name and email updated successfully")
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // get new avatar and store to local using multer
  // upload it to cloudinary
  // update in user object and save

  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "please upload a new avatar");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(500, "something went wrong while saving new avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar changed successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  // get new avatar and store to local using multer
  // upload it to cloudinary
  // update in user object and save

  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "please upload a new cover image");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(
      500,
      "something went wrong while saving new cover image"
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "cover image changed successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "error 404, no channel name received");
  }

  const channelData = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "$subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "$subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "channelsSubscribedTo",
      },
    },
    {
      $addFields: {
        toalSubscribers: { $sum: "$subscribers" },
        totalChannelsSubscribedTo: { $sum: "$channelsSubscribedTo" },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
            // subscribers is a field containing all objects of subscription model where channel name is our username object's _id
            // "".subscriber" to look for subscriber named key in object
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        toalSubscribers: 1,
        totalChannelsSubscribedTo: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  // returns an array

  if (!channelData.length) {
    throw new ApiError(400, "channel does not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channelData[0], "channel data fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.Objectid(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
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
                    fullName: 1,
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
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
