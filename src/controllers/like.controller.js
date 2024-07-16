import { Comment } from "../models/comment.model";
import { Like } from "../models/like.model";
import { Video } from "../models/video.model";
import { Tweet } from "../models/tweet.model";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";


const toggleVideoLike = asyncHandler(async(req, res) => {
    // user should be logged in, get video id in params
    // check for invalid video url
    // check if video is liked already then remove it else create new like instance
    
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found", error?.message)
    }

    const alreadyLiked = await Like.findOne({
        video: videoId,
        likedBy: mongoose.Types.ObjectId(req.user._id)
    })

    if(alreadyLiked){
        const deletedLike = await Like.deleteOne({
            video: videoId,
            likedBy: mongoose.Types.ObjectId(req.user._id)
        })

        if(!deletedLike){
            throw new ApiError(500, "something went wrong while unliking the video", error?.message)
        }

        return res
        .status(200)
        .json(new ApiResponse(200, deletedLike, "like removed from video successfully"))
    }else{
        const videoLiked = await Like.create({
            video: videoId,
            likedBy: mongoose.Types.ObjectId(req.user._id)
        })

        if(!videoLiked){
            throw new ApiError(500, "something went wrong while liking the video", error?.message)
        }

        return res
        .status(200)
        .json(new ApiResponse(200, videoLiked, "video liked successfully"))
    }
})


const toggleCommentLike = asyncHandler(async(req, res) => {
    // user should be logged in, get comment id in params
    // check for invalid comment id
    // check if comment is liked already then remove it else create new like instance
    
    const { commentId } = req.params

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404, "comment not found", error?.message)
    }

    const alreadyLiked = await Like.findOne({
        comment: commentId,
        likedBy: mongoose.Types.ObjectId(req.user._id)
    })

    if(alreadyLiked){
        const deletedLike = await Like.deleteOne({
            comment: commentId,
            likedBy: mongoose.Types.ObjectId(req.user._id)
        })

        if(!deletedLike){
            throw new ApiError(500, "something went wrong while unliking the comment", error?.message)
        }

        return res
        .status(200)
        .json(new ApiResponse(200, deletedLike, "like removed from comment successfully"))
    }else{
        const commentLiked = await Like.create({
            comment: commentId,
            likedBy: mongoose.Types.ObjectId(req.user._id)
        })

        if(!commentLiked){
            throw new ApiError(500, "something went wrong while liking the comment", error?.message)
        }

        return res
        .status(200)
        .json(new ApiResponse(200, commentLiked, "comment liked successfully"))
    }
})

const toggleTweetLike = asyncHandler(async(req, res) => {

    const { tweetId } = req.params

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "tweet not found", error?.message)
    }

    const alreadyLiked = await Like.findOne({
        tweet: tweetId,
        likedBy: mongoose.Types.ObjectId(req.user._id)
    })

    if(alreadyLiked){
        const deletedLike = await Like.deleteOne({
            tweet: tweetId,
            likedBy: mongoose.Types.ObjectId(req.user._id)
        })

        if(!deletedLike){
            throw new ApiError(500, "something went wrong while unliking the tweet", error?.message)
        }

        return res
        .status(200)
        .json(new ApiResponse(200, deletedLike, "like removed from tweet successfully"))
    }else{
        const tweetLiked = await Like.create({
            tweet: tweetId,
            likedBy: mongoose.Types.ObjectId(req.user._id)
        })

        if(!tweetLiked){
            throw new ApiError(500, "something went wrong while liking the tweet", error?.message)
        }

        return res
        .status(200)
        .json(new ApiResponse(200, tweetLiked, "tweet liked successfully"))
    }
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,

}