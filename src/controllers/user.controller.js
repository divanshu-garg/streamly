import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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


    const existedUser = User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User already exists")
    }
    
    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Please upload an avatar image")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Please upload an avatar image")
    }

    const user = await User.create({
        fullname,
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase()
    })

    const userCreated = User.findById(user._id).select(
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