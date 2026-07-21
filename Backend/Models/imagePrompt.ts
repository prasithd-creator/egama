import mongoose from "mongoose";


const TopicSchema = new mongoose.Schema({
    name: String,

    scene_prompts: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },

    image_prompts: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },

    video_prompts: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    }
}, {_id: false,  id: false});

const imagePromptSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    topics: [TopicSchema],
}, { timestamps: true, minimize: false });

const ImagePrompt = mongoose.models.ImagePrompt || mongoose.model("ImagePrompt", imagePromptSchema);

export default ImagePrompt;

