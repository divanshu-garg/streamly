import { v2 as cloudinary } from "cloudinary";

const deleteFromCloudinary = async (assetUrl) => {
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        if(!assetUrl) return null

        const publicId = assetUrl.split('/').slice(-1)[0].split('.')[0];
        const fileExtension = assetUrl.split('.').pop().toLowerCase()

        let resourceType;
        if (["jpg", "jpeg", "png", "gif"].includes(fileExtension)) {
          resourceType = "image";
        } else if (["mp4", "webm", "mov"].includes(fileExtension)) {
          resourceType = "video";
        } else {
          resourceType = "raw";
        }

        // check if assetUrl exists in cloudinary, if no then send success response with warning in log
        try {
          await cloudinary.api.resource(publicId, { resource_type: resourceType });
        } catch (error) {
          console.log("given asset didnt exist, sending success response, url: ", assetUrl);
        return { result: 'ok', success: true, message: 'Asset not found in Cloudinary' };
        }
        
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

        if (result.result === 'ok') {
          console.log('file deleted successfully');
          return result;
        } else {
          console.error('Failed to delete video:', result);
          return null;
        }
    } catch (error) {
      console.log("error: ", error)
        return null
    }
};

export { deleteFromCloudinary }