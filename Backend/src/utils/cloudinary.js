import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

// cloudinary.config({
//     cloudinary_url: process.env.CLOUDINARY_URL
//   });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const extractPublicId = (url) => {
    const parts = url.split('/');
    // console.log(parts)
    const uploadIndex = parts.indexOf('upload')
    // console.log(uploadIndex)
    if (uploadIndex == -1) return null;

    return parts[uploadIndex + 2].split('.')[0]
}

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })

        fs.unlinkSync(localFilePath)
        return response

    } catch (error) {
        fs.unlinkSync(localFilePath)
        console.log(error)
        return null;
    }
}

const updateOnCloudinary = async (localFilePath, url) => {
    // try {
    //     if (!localFilePath) return null
    //     const publicId = extractPublicId(url)
    //     if (!publicId) return null
    //     console.log(publicId)
    //     const response = await cloudinary.uploader.upload(
    //         localFilePath,
    //         {
    //             resource_type: "auto",
    //             public_id: publicId,
    //             overwrite: true,
    //         }
    //     )

    //     fs.unlinkSync(localFilePath)
    //     return response

    // } catch (error) {
    //     fs.unlinkSync(localFilePath)
    //     console.log(error)
    //     return null
    // }
}

const deleteFromCloudinary = async (url) => {
    try {
        if (!url) return null
        const publicId = extractPublicId(url)
        const response = await cloudinary.uploader.destroy(publicId)

        return response
    } catch (error) {
        console.log(error)
        return null
    }
}

export { uploadOnCloudinary, updateOnCloudinary, deleteFromCloudinary }