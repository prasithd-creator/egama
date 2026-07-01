import axios from "axios";
import https from "https";

const referenceimage = async (req, res) => {
    const { url } = req.body;

    try {
        console.log("Fetching image:", url);

        const response = await axios.get(url, {
            responseType: "arraybuffer",
            httpsAgent: new https.Agent({
                rejectUnauthorized: false, // Development only
            }),
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0 Safari/537.36",
                Accept: "image/*,*/*",
            },
            maxRedirects: 5,
        });

        console.log(
            "Status:",
            response.status,
            response.headers["content-type"]
        );

        res.setHeader(
            "Content-Type",
            response.headers["content-type"] || "image/png"
        );

        res.status(200).send(response.data);
    } catch (err) {
        console.error("Reference Image Error:");

        if (axios.isAxiosError(err)) {
            console.error({
                message: err.message,
                code: err.code,
                status: err.response?.status,
                data: err.response?.data,
            });
        } else {
            console.error(err);
        }

        res.status(500).json({
            success: false,
            message: "Failed to fetch image",
        });
    }
};

export default referenceimage;