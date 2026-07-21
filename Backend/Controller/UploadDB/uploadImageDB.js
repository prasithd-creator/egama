import ImagePrompt from "../../Models/imagePrompt.ts";

export const uploadImages = async (req, res) => {
    console.log(req.body);
    try {
        const { companyName, topicName, sceneNumber, imageUrl } = req.body;

        // Find category
        const imagePrompt = await ImagePrompt.findOne({
            category: companyName,
        });

        if (!imagePrompt) {
            return res.status(404).json({
                error: "Category not found",
            });
        }

        // Find topic
        const topic = imagePrompt.topics.find(
            (item) => item.name === topicName
        );

        if (!topic) {
            return res.status(404).json({
                error: "Topic not found",
            });
        }

        // Find scene
        const scene = topic.image_prompts.find(
            item => Number(item.scene_number) === Number(sceneNumber)
        );

        console.log(scene);

        if (!scene) {
            return res.status(404).json({
                error: "Scene not found",
            });
        }

        // Add image URL
        scene.image_url = imageUrl;
        imagePrompt.markModified("topics");
        await imagePrompt.save();

        return res.status(200).json({
            success: true,
            message: "Image URL updated",
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Server error",
        });
    }
};


export const uploadVideo = async (req, res) => {

    try {
    const { companyName, topicName, sceneNumber, videoPrompt, videoUrl } = req.body;

    // Find category
    const imagePrompt = await ImagePrompt.findOne({
        category: companyName,
    });

    if (!imagePrompt) {
        return res.status(404).json({
            error: "Category not found",
        });
    }

    // Find topic
    const topic = imagePrompt.topics.find(
        (item) => item.name === topicName
    );

    if (!topic) {
        return res.status(404).json({
            error: "Topic not found",
        });
    }

    // Find scene
    const scene = topic.video_prompts.find(
        item => Number(item.scene_number) === Number(sceneNumber)
    );


    if (!scene) {
        return res.status(404).json({
            error: "Scene not found",
        });
    }

    //add video Url
    scene.video_url = videoUrl;
    imagePrompt.markModified("topics");
    await imagePrompt.save();

    return res.status(200).json({
        success: true,
        message: "Video URL updated",
    });
} catch (error) {
    console.error(error);
    return res.status(500).json({
       success: false,
        error: `${error.message}`,
    });
}
}
