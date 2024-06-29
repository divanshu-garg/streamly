import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
// fs is a file handling library of nodejs which helps us peform any operation on the files

// take file from user and store to our local server using multer then move it from local storage to cloudinary




const uploadOnCloudinary = async (localfilepath) => {

    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        if(!localfilepath) return null

        // uploading file on cloudinary
        const response = await cloudinary.uploader.upload(localfilepath, {
            resource_type:"auto",
        })
        console.log("file has been uploaded successfully", response.url);
        fs.unlinkSync(localfilepath)
        return response;
    } catch (error) {
        // file will be left on our server if upload to cloudinary fail
        // unlink to remove from our local server
        fs.unlinkSync(localfilepath)
        return null
    }
}

export {uploadOnCloudinary}