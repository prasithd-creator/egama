import axios from "axios";
import fs from "fs";
import path from "path";

const textToSpeech = async (req, res) => {
    try {
        console.log(req.body);
        const { text, voice } = req.body;
        const url = "https://api.lmnt.com/v1/ai/speech/bytes";
        const LMNT_API_KEY = process.env.LMNT_API_KEY;

        const response = await axios({
            method: "POST",
            url,
            headers: {
                "Content-Type": "application/json",
                "x-api-key": LMNT_API_KEY,
                "lmnt-version": "1.1",
            },
            data: {
                "text": text,
                voice: voice,       // Voice ID
                format: "mp3",
                language: "en",
                temperature: 0.7
            },
            responseType: "arraybuffer"
        });

        // const voiceDir = path.join(process.cwd(), "voice");

        // if (!fs.existsSync(voiceDir)) {
        //     fs.mkdirSync(voiceDir, { recursive: true });
        // }

        // const fileName = `voice-${Date.now()}.mp3`;
        // const filePath = path.join(voiceDir, fileName);
        // fs.writeFileSync(filePath, response.data);
        // console.log("Speech saved!");
        // res.json({
        //     success: true,
        //     fileName,
        //     filePath,
        // });

        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Content-Length", response.data.length);

        return res.send(response.data);

    } catch (err) {
        console.log(err);
        console.log("Status:", err.response?.status);

        const data = err.response?.data;

        if (Buffer.isBuffer(data)) {
            console.log(data.toString());
        } else {
            console.log(data);
        }
        res.status(500).json({
            success: false,
            message: err.response?.data || err.message
        });
    }
}

export default textToSpeech;