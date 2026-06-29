import FirecrawlApp from "@mendable/firecrawl-js";


const firecrawl = new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY
});

const firecrawlController = async (req, res) => {
    try {
        const { url } = req.body;
        const result = await firecrawl.scrapeUrl(url);
        res.status(200).json({success: true, data: result});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
};

export default firecrawlController;