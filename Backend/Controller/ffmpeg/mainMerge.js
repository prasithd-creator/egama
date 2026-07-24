import fs from "fs";
import path from "path";
import axios from "axios";
import { mergeAudioVideo, mergeVideos } from "./merge.js";

async function downloadVideo(url, filename) {
    const outputDir = path.join(process.cwd(), "videos");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const filePath = path.join(outputDir, filename);
    const response = await axios({ url, method: "GET", responseType: "stream" });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on("finish", () => resolve(filePath));
        writer.on("error", reject);
    });
}

// Replaces downloadAudio — writes a base64 string sent from the frontend to disk
function writeAudioFromBase64(base64Data, filename) {
    const outputDir = path.join(process.cwd(), "audio");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const filePath = path.join(outputDir, filename);
    const buffer = Buffer.from(base64Data, "base64");
    fs.writeFileSync(filePath, buffer);

    return filePath;
}

export const mainMerge = async (req, res) => {
    try {
        const videos = req.body.video;
        const audios = req.body.audio; // now expects [{ base64 }, ...]


        if (!Array.isArray(videos) || videos.length === 0) {
            return res.status(400).json({ success: false, message: "Videos are required" });
        }
        if (!Array.isArray(audios) || audios.length !== videos.length) {
            return res.status(400).json({ success: false, message: "Audio count must match video count" });
        }

        const mergedSceneVideos = [];

        for (let i = 0; i < videos.length; i++) {
            const videoPath = await downloadVideo(videos[i], `video_${i}.mp4`);
            const audioPath = writeAudioFromBase64(audios[i].base64, `audio_${i}.mp3`);

            const sceneOutput = path.join(process.cwd(), "videos", `scene_${i}.mp4`);
            await mergeAudioVideo(videoPath, audioPath, sceneOutput);

            mergedSceneVideos.push(sceneOutput);
        }

        const finalOutput = path.join(process.cwd(), "videos", "output.mp4");
        await mergeVideos(mergedSceneVideos, finalOutput);

        const videoUrl = `${req.protocol}://${req.get("host")}/videos/output.mp4`;
        return res.json({ success: true, output: videoUrl });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err.message });
    }
};