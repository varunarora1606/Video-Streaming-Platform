import mongoose from "mongoose";
import { User } from "../models/user.model.js";
// import { Video } from "../models/video.model.js";
// import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"

const options = {
    httpOnly: true,
    secure: true,
}

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();

        user.refreshToken = refreshToken

        await user.save({ validateBeforeAccess: false })

        console.log(user)

        return { refreshToken, accessToken }
    } catch (error) {
        throw new ApiError("Refresh and Access token generation failed", error);
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const { username, email, password, fullname } = req.body
    console.log(username)

    if ([username, email, password, fullname].some((field) => field?.trim() === "")) {
        throw new ApiError(499, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User already exists")
    }

    if (!req.files?.avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path

    let coverImageLocalPath;
    if (req.files.coverImage) {
        coverImageLocalPath = req.files?.coverImage[0]?.path
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar not uploaded")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    user.password = ""
    user.refreshToken = ""
    // const createdUser = await User.findById(user._id).select(
    //     "-password -refreshToken"
    // )
    // if (!createdUser) {
    //     throw new ApiError(500, "Something went wrong while registering user")
    // }

    return res.status(201).json(
        new ApiResponse(200, user, "User registered successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {

    // Ask for username or email and password
    // check if the field is empty or not
    // find the user and check if it exists or not
    // check if the password is correct or not
    // assign refresh and access token
    // send cookies


    const { username, email, password } = req.body
    if (!username && !email) {
        throw new ApiError(499, "username or email is required")
    }

    if (!password) {
        throw new ApiError(499, "Enter password")
    }

    const user = await User.findOne({
        $or: [{ username: username }, { email: email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = user
    delete loggedInUser.password
    delete loggedInUser.refreshToken

    // console.log(loggedInUser.password)

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    loggedInUser
                },
                "User is logged in")
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            }
        },
        {
            new: true
        }
    )

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged out successfully")
        )

})

const refreshAccessToken = asyncHandler(async (req, res) => {

    // console.log(req.cookies)

    const refreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!refreshToken) {
        throw new ApiError(401, "Unauthorized request :: refresh token is missing")
    }

    const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken._id)

    if (!user) {
        throw new ApiError(401, "Invalid refresh token")
    }

    if (user?.refreshToken !== refreshToken) {
        throw new ApiError(401, "Refresh token expired or already used")
    }

    const accessToken = await user.generateAccessToken()

    res.status(200)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(
                200,
                { "accessToken": accessToken },
                "Access Token refreshed"
            )
        )

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword) {
        throw new ApiError(499, "Both fields are required")
    }

    const user = await User.findById(req.user._id)

    if (!user.isPasswordCorrect(oldPassword)) {
        throw new ApiError(400, 'Invalid password')
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    res
        .status(200)
        .json(new ApiResponse(200, {}, "Password updated successfully"))
})

const getUser = asyncHandler(async (req, res) => {
    const user = req.user
    user.password = null
    user.refreshToken = null

    res
        .status(200)
        .json(new ApiResponse(200, user, "user fetched successfully"))
})

const updateUserDetails = asyncHandler(async (req, res) => {
    const { email, fullname } = req.body

    if (!email || !fullname) {
        throw new ApiError(499, "Enter email address and fullname")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { fullname, email }
        },
        { new: true }
    ).select("-password -refreshToken")

    res
        .status(200)
        .json(new ApiResponse(200, user, "User details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file.path
    if (!avatarLocalPath) {
        throw new ApiError(499, "Avatar is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Could not upload avatar")
    }

    const user = User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        }
    ).select("-password -refreshToken")

    res
        .status(200)
        .json(new ApiResponse(200, user, "User avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file.path
    if (!coverImageLocalPath) {
        throw new ApiError(499, "coverImage is required")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage) {
        throw new ApiError(400, "Could not upload coverImage")
    }

    const user = User.findByIdAndUpdate(
        req.user._id, // Wrong it should be req.user._id but is written user.req
        {
            $set: {
                coverImage: coverImage.url
            }
        }
    ).select("-password -refreshToken")

    res
        .status(200)
        .json(new ApiResponse(200, user, "User coverImage updated successfully"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "channelsSubscribed"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                channelsSubscribedCount: {
                    $size: "$channelsSubscribed",
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelsSubscribedCount: 1,
                isSubscribed: 1
            }
        }
    ])

    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    res
        .status(200)
        .json(new ApiResponse(200, channel[0], "Channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
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
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        },
                    }
                ]
            }
        },
        {
            $project: {
                username: 1,
                watchHistory: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                fullname: 1
            }
        }
    ])

    res
        .status(200)
        .json(new ApiResponse(200, user, "Watch history fetched successfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getUser,
    updateUserDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}

// Check all controllers again specially for updateAvatar and Img