import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload base64 image to Cloudinary
 * @param {string} fileStr Base64 image string (e.g., data:image/jpeg;base64,...)
 * @returns {Promise<string>} Secure URL of the uploaded image
 */
export const uploadImage = async (fileStr) => {
  try {
    if (!fileStr) return null;
    const uploadedResponse = await cloudinary.uploader.upload(fileStr, {
      folder: 'ecom_images',
    });
    return uploadedResponse.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Could not upload image to Cloudinary');
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} imageUrl Secure URL of the image
 * @returns {Promise<boolean>}
 */
export const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) return false;
    // Extract public_id from URL
    const splitUrl = imageUrl.split('/');
    const publicIdWithExt = splitUrl[splitUrl.length - 1];
    const publicId = `ecom_images/${publicIdWithExt.split('.')[0]}`;

    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
};
