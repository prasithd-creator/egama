import fs from "fs";
import path from "path";
import axios from "axios";
import { mergeVideos } from "./merge.js";

async function downloadVideo(url, filename) {
    const outputDir = path.join(process.cwd(), "videos");

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, filename);

    const response = await axios({
        url,
        method: "GET",
        responseType: "stream"
    });

    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on("finish", () => resolve(filePath));
        writer.on("error", reject);
    });
}


export const mainMerge = async (req, res) => {
    try {

        const urls = req.body.videos;

        if (!Array.isArray(urls) || urls.length < 2) {
            return res.status(400).json({
                error: "Minimum 2 videos required"
            });
        }


        const videoPaths = [];

        for (let i = 0; i < urls.length; i++) {
            const filePath = await downloadVideo(
                urls[i],
                `video_${i}.mp4`
            );

            videoPaths.push(filePath);
        }


        const output = path.join(
            process.cwd(),
            "videos",
            "output.mp4"
        );
        

        await mergeVideos(videoPaths, output);

        const videoUrl =
            `${req.protocol}://${req.get("host")}/videos/output.mp4`;

            console.log(videoUrl);

        return res.json({
            success: true,
            output: videoUrl
        });


    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
};