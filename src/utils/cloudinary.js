import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // File has been uplaoded successfully
    // console.log("file is uploaded on cloudinary", response.url);

    fs.unlinkSync(localFilePath); // unlink the file
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // Remove the locally save file temporary as the upload operation got failed
    return null;
  }
};

// Helper to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url) return null;

  // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/avatar.jpg
  const regex = /\/v\d+\/(.+?)\.\w+$/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const deleteFromCloudinary = async (url) => {
  try {
    const publicId = getpublicIdFromUrl(url);
    if (!publicId) {
      throw new Error("invalid Public Id");
    }

    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === "ok") {
      console.log("File deleted successfully from cloudinary");
    } else {
      console.warn("Failed to delete file from cloudinary");
    }

    return result;
  } catch (error) {
    throw new Error("Failed to delete file from cloudinary", error.message);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary 
  
};
