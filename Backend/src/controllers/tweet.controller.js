import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    const user = req.user
    const imageLocalPath = req.file?.path
    if (!content && !imageLocalPath) {
        throw new ApiError(499, "Tweet is missing content")
    }
    if (imageLocalPath) {
        const image = await uploadOnCloudinary(imageLocalPath)
        if (!image) {
            throw new ApiError(400, "Upload on cloudinary failed")
        }
    }

    const tweet = await Tweet.create({
        owner: user._id,
        content,
        image
    })

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const user = req.user
    const tweet = await Tweet.find(user._id)

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "All user tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { content } = req.body
    const user = req.user
    let tweet;
    const imageLocalPath = req.file?.path
    if (!content && !imageLocalPath) {
        throw new ApiError(499, "Tweet is missing content")
    }
    if (imageLocalPath) {
        const image = await uploadOnCloudinary(imageLocalPath)
        if (!image) {
            throw new ApiError(400, "Upload on cloudinary failed")
        }
        tweet = await Tweet.findByIdAndUpdate(
            tweetId,
            {
                $set: {
                    content,
                    image
                }
            },
            { new: true }
        )
    } else {
        tweet = await Tweet.findByIdAndUpdate(
            tweetId,
            {
                $set: {
                    content
                }
            },
            { new: true }
        )
    }


    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params
    await Tweet.findByIdAndDelete(tweetId)
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}


// tweetId checkingis missing in all controllers, checkk if it is there and if there a tweet with this tweet id

// Need to correct controllers, right now anyone can update it there is no check for authorised users to update or delete tweet

// Check all controllers on postman