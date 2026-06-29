import { v2 as cloudinary } from 'cloudinary';
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

export const uploadImage = async (req, res) => {
    try {
        const images = req.body.images;

        const results = await Promise.all(
            images.map((url) => uploadToCloudinary(url))
        );

        res.json({
            success: true,
            urls: results.map((r) => r.secure_url),
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
};