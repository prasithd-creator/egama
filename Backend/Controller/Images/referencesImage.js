
const referenceimage = async (req, res) => {
    const { url } = req.body;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            return res.status(400).send("Failed to fetch image");
        }

        const buffer = Buffer.from(await response.arrayBuffer());

        res.setHeader("Content-Type", response.headers.get("content-type"));
        res.send(buffer);
    } catch (err) {
        res.status(500).send("Proxy error");
    }
}

export default referenceimage;