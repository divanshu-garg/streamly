import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken";

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

export { registerUser, loginUser, logoutUser, refreshAccessToken };
