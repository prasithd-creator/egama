import axios from "axios";
import https from "https";

const httpsAgent = new https.Agent({
    keepAlive: true,
    rejectUnauthorized: true,
    minVersion: "TLSv1.2",
});

const referenceimage = async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({
            success: false,
            message: "Image URL is required",
        });
    }

    try {
        console.log("Fetching image:", url);

        const response = await axios.get(url, {
            responseType: "arraybuffer",

            timeout: 120000,

            httpsAgent,

            maxRedirects: 10,

            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Safari/537.36",

                "Accept":
                    "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",

                "Accept-Encoding":
                    "gzip, deflate, br",

                "Connection":
                    "keep-alive",
            },

            validateStatus: (status) => {
                return status >= 200 && status < 400;
            },
        });


        const contentType =
            response.headers["content-type"] || "image/png";


        // Prevent downloading HTML pages
        if (!contentType.startsWith("image/")) {
            return res.status(400).json({
                success: false,
                message: "URL is not an image",
                contentType,
            });
        }


        console.log(
            "Fetched:",
            response.status,
            contentType,
            response.data.length,
            "bytes"
        );


        res.setHeader("Content-Type", contentType);
        res.setHeader(
            "Content-Length",
            response.data.length
        );

        return res.status(200).send(response.data);


    } catch (err) {

        console.error("Reference Image Error");

        if (axios.isAxiosError(err)) {
            console.error({
                message: err.message,
                code: err.code,
                status: err.response?.status,
            });
        } else {
            console.error(err);
        }


        return res.status(500).json({
            success: false,
            message: "Failed to fetch image",
        });
    }
};

export default referenceimage;