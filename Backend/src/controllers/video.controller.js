import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteFromCloudinary, updateOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, isPublished } = req.body
    const user = req.user;
    // TODO: get video, upload to cloudinary, create video
    if (!title || !description || !isPublished) {
        throw new ApiError(499, "All fields are required")
    }

    if (!req.files?.videoFile) {
        throw new ApiError(499, "videoFile is required");
    }
    const videoFileLocalPath = req.files?.videoFile[0]?.path;

    if (!req.files?.thumbnail) {
        throw new ApiError(499, "videoFile is required");
    }
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    console.log("videoFile /n");
    console.log(videoFileLocalPath);
    console.log("thumbnail /n");
    console.log(thumbnailLocalPath);

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (!videoFile) {
        throw new ApiError(400, "could not upload videoFile")
    }
    if (!thumbnail) {
        throw new ApiError(400, "could not upload thumbnail")
    }
    console.log("videoFile cloudinary /n")
    console.log(videoFile)
    console.log("thumbnail cloudinary /n")
    console.log(thumbnail)

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        owner: user._id,
        title,
        description,
        duration: videoFile.duration,
        isPublished
    })

    return res.status(200)
        .json(new ApiResponse(200, video, "video Published"))
})


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.findById(videoId)
    return res
        .status(200)
        .json(new ApiResponse(200, video, "video fetched successfully"))
})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body

    const video = await Video.findById(videoId)

    const thumbnailLocalPath = req.file?.path
    if (!thumbnailLocalPath) {
        throw new ApiError(499, "Thumbnail is required")
    }
    // console.log(video.thumbnail)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (!thumbnail) {
        throw new ApiError(400, "could not upload thumbnail")
    }
    await deleteFromCloudinary(video.thumbnail)

    video.description = description
    video.title = title
    video.thumbnail = thumbnail.url

    await video.save({ validateBeforeSave: false })
    // const video = await Video.findByIdAndUpdate(
    //     videoId,
    //     {
    //         $set: { title, description, thumbnail: thumbnail.url }
    //     },
    //     { new: true }
    // )

    res
        .status(200)
        .json(new ApiResponse(200, video, "video updated"))
})


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    Video.findByIdAndDelete(videoId)
    return res
        .status(200)
        .json(new ApiResponse(200, videoId, "Video deleted"))
})


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findByIdAndUpdate(
        videoId,
        [
            { $set: { isPublished: { $not: "$isPublished" } } }
        ],
        {new: true}
    )
    return res
        .status(200)
        .json(new ApiResponse(200, video.isPublished, "isPublished toggled successfully"))
})


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}