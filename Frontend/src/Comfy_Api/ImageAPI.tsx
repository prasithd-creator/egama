const workflow = {
    // Out Image
    "9": {
        "inputs": {
            "filename_prefix": "z-image",
            "images": [
                "57:8",
                0
            ]
        },
        "class_type": "SaveImage",
        "_meta": { "title": "Save Image" }
    },

    // MAIN PROMPT
    "58": {
        "inputs": {
            "value":
                `${prompt}`
        },
        "class_type": "PrimitiveStringMultiline",
        "_meta": { "title": "Prompt" }
    },

    // STYLE + PROMPT COMBINE
    "61": {
        "inputs": {
            "string_a": "Photorealistic, cinematic lighting, ultra detailed, ",
            "string_b": ["58", 0],
            "delimiter": ""
        },
        "class_type": "StringConcatenate",
        "_meta": { "title": "Concatenate" }
    },

    // CLIP
    "57:30": {
        "inputs": {
            "clip_name": "qwen_3_4b.safetensors",
            "type": "lumina2",
            "device": "default"
        },
        "class_type": "CLIPLoader",
        "_meta": { "title": "Load CLIP" }
    },

    // VAE
    "57:29": {
        "inputs": {
            "vae_name": "ae.safetensors"
        },
        "class_type": "VAELoader",
        "_meta": { "title": "Load VAE" }
    },

    // NEGATIVE
    "57:33": {
        "inputs": {
            "conditioning": ["57:27", 0]
        },
        "class_type": "ConditioningZeroOut",
        "_meta": { "title": "ConditioningZeroOut" }
    },

    // IMAGE DECODE
    "57:8": {
        "inputs": {
            "samples": ["57:3", 0],
            "vae": ["57:29", 0]
        },
        "class_type": "VAEDecode",
        "_meta": { "title": "VAE Decode" }
    },

    // UNET
    "57:28": {
        "inputs": {
            "unet_name": "z_image_turbo_bf16.safetensors",
            "weight_dtype": "default"
        },
        "class_type": "UNETLoader",
        "_meta": { "title": "Load Diffusion Model" }
    },

    "57:27": {
        "inputs": {
            "text": ["61", 0],
            "clip": ["57:30", 0]
        },
        "class_type": "CLIPTextEncode",
        "_meta": { "title": "CLIP Text Encode (Prompt)" }
    },

    // LATENT
    "57:13": {
        "inputs": {
            "width": 1280,
            "height": 720,
            "batch_size": 1
        },
        "class_type": "EmptySD3LatentImage",
        "_meta": { "title": "EmptySD3LatentImage" }
    },

    // SAMPLER
    "57:3": {
        "inputs": {
            "seed": 366234293422330,
            "steps": 20,
            "cfg": 3,
            "sampler_name": "res_multistep",
            "scheduler": "simple",
            "denoise": 1,
            "model": ["57:11", 0],
            "positive": ["57:27", 0],
            "negative": ["57:33", 0],
            "latent_image": ["57:13", 0]
        },
        "class_type": "KSampler",
        "_meta": { "title": "KSampler" }
    },

    "57:11": {
        "inputs": {
            "shift": 3,
            "model": ["57:28", 0]
        },
        "class_type": "ModelSamplingAuraFlow",
        "_meta": { "title": "ModelSamplingAuraFlow" }
    }
};

export default workflow;