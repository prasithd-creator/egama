import axios from "axios";
import streamifier from "streamifier";
import { v2 as cloudinary } from "cloudinary";

export const uploadToCloudinary = async (url) => {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
  });

  const buffer = Buffer.from(response.data, "binary");

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "comfyui" },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};