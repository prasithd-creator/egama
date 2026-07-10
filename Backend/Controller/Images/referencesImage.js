import { downloadImage } from "./imageDownloader.js";

const referenceimage = async (req, res) => {

    const { url, siteUrl } = req.body;

    if (!url) {
        return res.status(400).json({
            success: false,
            message: "Image URL required",
        });
    }

    try {

        const image = await downloadImage(url, siteUrl);

        res.setHeader(
            "Content-Type",
            image.contentType
        );

        return res.send(image.buffer);

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });

    }

};

export default referenceimage;