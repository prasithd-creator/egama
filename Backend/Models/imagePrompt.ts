import mongoose from "mongoose";

const imagePromptSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    topics: [
        {
            name: String,
            scene_prompts: { type: Array, default: [] },
            image_prompts: { type: Array, default: [] },
            video_prompts: { type: Array, default: [] }
        }
    ]
}, { timestamps: true, minimize: false });

const ImagePrompt = mongoose.models.ImagePrompt || mongoose.model("ImagePrompt", imagePromptSchema);

export default ImagePrompt;

