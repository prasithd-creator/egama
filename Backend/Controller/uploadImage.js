import { v2 as cloudinary } from 'cloudinary';
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

// export const uploadImage = async (req, res) => {
//     try {
//         const images = req.body.images;

//         const results = await Promise.all(
//             images.map((url) => uploadToCloudinary(url))
//         );

//         res.json({
//             success: true,
//             urls: results.map((r) => r.secure_url),
//         });

//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ error: err.message });
//     }
// };

export const uploadImage = async (req, res) => {
    try {
        const { images } = req.body;

        if (!Array.isArray(images)) {
            return res.status(400).json({
                success: false,
                message: "Images should be an array"
            });
        }

        const results = await Promise.all(
            images.map(async ({ sceneNumber, image }) => {

                if (!image || typeof image !== "string") {
                    return {
                        sceneNumber,
                        secure_url: null,
                        error: "Invalid image"
                    };
                }

                let secure_url;

                // Already uploaded to Cloudinary
                if (image.startsWith("https://res.cloudinary.com")) {
                    secure_url = image;
                } else {
                    const uploaded = await uploadToCloudinary(image);
                    secure_url = uploaded.secure_url;
                }

                return {
                    sceneNumber,
                    secure_url,
                };
            })
        );

        res.json({
            success: true,
            urls: results.filter(item => item.secure_url),
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};