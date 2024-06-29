import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from 'fs';

const registerUser = asyncHandler( async (req, res) => { 
    // get user details from frontend
    // validation- not empty
    // check if use already exists
    // check for images, check for avatar
    // upload them to cloudinary(avatar)
    // create user object- create entry in db
    // remove password and refresh token field from db
    // check for user creation
    // return res

    const {username, email, fullname, password} = req.body
    console.log("username: ", username);
    console.log("email: ", email);


    if(fullname === ""){
        throw new ApiError(400, "fullname field is empty")
    }
    if(username === ""){
        throw new ApiError(400, "username field is empty")
    }
    if(email === ""){
        throw new ApiError(400, "email field is empty")
    }
    if(password === ""){
        throw new ApiError(400, "password field is empty")
    }

    if(password.length < 8){
        throw new ApiError(400, "password should have at least 8 characters")
    }

    if(password.length < 8){
        throw new ApiError(400, "password should have at least 8 characters")
    }

    if(!( password.includes('@') && password.includes('#'))){
        throw new ApiError(400, "password should include '@' and '#'")
    }

    if(/\d/.test(password) === false){
        throw new ApiError(400, "password should include a number as well")
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if(emailPattern.test(email) === false){
        throw new ApiError(400, "invalid email")
    }


  const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath = '';
    if(req.files && req.files.coverImage && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }

    if(existedUser){
        fs.unlinkSync(avatarLocalPath)
        fs.unlinkSync(coverImageLocalPath)
        throw new ApiError(409, "User already exists, plese try using a different username/email")
    }
    
    if(!avatarLocalPath){
        throw new ApiError(400, "Please upload a avatar image")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Please upload to an avatar image")
    }

    const user = await User.create({
        fullname,
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase()
    })

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!userCreated){
        throw new ApiError(500, "something went wrong, please try again")
    }


    return res.status(201).json(
        new ApiResponse(200, userCreated, "User created Successfully")
    )
 })

export {registerUser}