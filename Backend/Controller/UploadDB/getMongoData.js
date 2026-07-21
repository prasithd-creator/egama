import ImagePrompt from "../../Models/imagePrompt.ts";

export const getMongoData = async (req, res) => {
    try {
        const data = await ImagePrompt.find({});
        res.status(200).json({
            sucess: true,
            data: data
        });

    } catch {
        res.status(500).json(
            {
                sucess: false,
                error: err.message
            });
    }
}