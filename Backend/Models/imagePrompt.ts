import mongoose from "mongoose";


const TopicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

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
}, { _id: false, id: false });

const BrandSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        topics: {
            type: [TopicSchema],
            default: []
        }
    },
    { _id: false, id: false }
);

const imagePromptSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    brands: [BrandSchema],
}, { timestamps: true, minimize: false });

const ImagePrompt = mongoose.models.ImagePrompt || mongoose.model("ImagePrompt", imagePromptSchema);

export default ImagePrompt;

