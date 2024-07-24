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

        const result = await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });

        if (result.result === 'ok') {
          console.log('Video deleted successfully');
          return result;
        } else {
          console.error('Failed to delete video:', result);
          return null;
        }
    } catch (error) {
        return null
    }
};

export { deleteFromCloudinary }