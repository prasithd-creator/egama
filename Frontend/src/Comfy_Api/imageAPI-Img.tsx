const workflow = {
    "76": {
        "inputs": {
            "image": "Car01.png"
        },
        "class_type": "LoadImage",
        "_meta": {
            "title": "Load Image"
        }
    },
    "81": {
        "inputs": {
            "image": "Car02.png"
        },
        "class_type": "LoadImage",
        "_meta": {
            "title": "Load Image"
        }
    },
    "94": {
        "inputs": {
            "filename_prefix": "Flux2_Klein_9b_kv",
            "images": [
                "124",
                0
            ]
        },
        "class_type": "SaveImage",
        "_meta": {
            "title": "Save Image"
        }
    },
    "122": {
        "inputs": {
            "sampler_name": "euler"
        },
        "class_type": "KSamplerSelect",
        "_meta": {
            "title": "KSamplerSelect"
        }
    },
    "123": {
        "inputs": {
            "noise": [
                "125",
                0
            ],
            "guider": [
                "138",
                0
            ],
            "sampler": [
                "122",
                0
            ],
            "sigmas": [
                "137",
                0
            ],
            "latent_image": [
                "129",
                0
            ]
        },
        "class_type": "SamplerCustomAdvanced",
        "_meta": {
            "title": "SamplerCustomAdvanced"
        }
    },
    "124": {
        "inputs": {
            "samples": [
                "123",
                0
            ],
            "vae": [
                "127",
                0
            ]
        },
        "class_type": "VAEDecode",
        "_meta": {
            "title": "VAE Decode"
        }
    },
    "125": {
        "inputs": {
            "noise_seed": 972498836329978
        },
        "class_type": "RandomNoise",
        "_meta": {
            "title": "RandomNoise"
        }
    },
    "126": {
        "inputs": {
            "unet_name": "flux-2-klein-9b-kv-fp8.safetensors",
            "weight_dtype": "default"
        },
        "class_type": "UNETLoader",
        "_meta": {
            "title": "Load Diffusion Model"
        }
    },
    "127": {
        "inputs": {
            "vae_name": "flux2-vae.safetensors"
        },
        "class_type": "VAELoader",
        "_meta": {
            "title": "Load VAE"
        }
    },
    "128": {
        "inputs": {
            "image": [
                "130",
                0
            ]
        },
        "class_type": "GetImageSize",
        "_meta": {
            "title": "Get Image Size"
        }
    },
    "129": {
        "inputs": {
            "width": [
                "128",
                0
            ],
            "height": [
                "128",
                1
            ],
            "batch_size": 1
        },
        "class_type": "EmptyFlux2LatentImage",
        "_meta": {
            "title": "Empty Flux 2 Latent"
        }
    },
    "130": {
        "inputs": {
            "upscale_method": "lanczos",
            "megapixels": 1,
            "resolution_steps": 1,
            "image": [
                "76",
                0
            ]
        },
        "class_type": "ImageScaleToTotalPixels",
        "_meta": {
            "title": "Scale Image to Total Pixels"
        }
    },
    "131": {
        "inputs": {
            "upscale_method": "lanczos",
            "megapixels": 1,
            "resolution_steps": 2,
            "image": [
                "81",
                0
            ]
        },
        "class_type": "ImageScaleToTotalPixels",
        "_meta": {
            "title": "Scale Image to Total Pixels"
        }
    },
    "133": {
        "inputs": {
            "clip_name": "qwen_3_8b_fp8mixed.safetensors",
            "type": "flux2",
            "device": "default"
        },
        "class_type": "CLIPLoader",
        "_meta": {
            "title": "Load CLIP"
        }
    },
    "135": {
        "inputs": {
            "text": "Dynamic cityscape scene: Premium Mahindra XEV 9e eSUV positioned on a modern urban street with LED lights highlighting its sleek design. Clean, futuristic styling with close-up details of the vehicle's charging port and 79 kWh battery iconography. A professional urbanite (attired in business-casual) is scanning a mobile app to book a test drive, with the tagline 'Drive the Future, Zero Emissions. 500+ km Range. Book Now!'. Style: ultra-modern ad design, high-impact lighting, premium branding aesthetics, urban environment.",
            "clip": [
                "133",
                0
            ]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
            "title": "CLIP Text Encode (Positive Prompt)"
        }
    },
    "137": {
        "inputs": {
            "steps": 6,
            "width": [
                "128",
                0
            ],
            "height": [
                "128",
                1
            ]
        },
        "class_type": "Flux2Scheduler",
        "_meta": {
            "title": "Flux2Scheduler"
        }
    },
    "138": {
        "inputs": {
            "cfg": 1,
            "model": [
                "139",
                0
            ],
            "positive": [
                "132:121",
                0
            ],
            "negative": [
                "132:119",
                0
            ]
        },
        "class_type": "CFGGuider",
        "_meta": {
            "title": "CFG Guider"
        }
    },
    "139": {
        "inputs": {
            "model": [
                "126",
                0
            ]
        },
        "class_type": "FluxKVCache",
        "_meta": {
            "title": "Flux KV Cache"
        }
    },
    "685": {
        "inputs": {
            "conditioning": [
                "135",
                0
            ]
        },
        "class_type": "ConditioningZeroOut",
        "_meta": {
            "title": "ConditioningZeroOut"
        }
    },
    "134:116": {
        "inputs": {
            "conditioning": [
                "685",
                0
            ],
            "latent": [
                "134:117",
                0
            ]
        },
        "class_type": "ReferenceLatent",
        "_meta": {
            "title": "ReferenceLatent"
        }
    },
    "134:117": {
        "inputs": {
            "pixels": [
                "130",
                0
            ],
            "vae": [
                "127",
                0
            ]
        },
        "class_type": "VAEEncode",
        "_meta": {
            "title": "VAE Encode"
        }
    },
    "134:118": {
        "inputs": {
            "conditioning": [
                "135",
                0
            ],
            "latent": [
                "134:117",
                0
            ]
        },
        "class_type": "ReferenceLatent",
        "_meta": {
            "title": "ReferenceLatent"
        }
    },
    "132:119": {
        "inputs": {
            "conditioning": [
                "134:116",
                0
            ],
            "latent": [
                "132:120",
                0
            ]
        },
        "class_type": "ReferenceLatent",
        "_meta": {
            "title": "ReferenceLatent"
        }
    },
    "132:120": {
        "inputs": {
            "pixels": [
                "131",
                0
            ],
            "vae": [
                "127",
                0
            ]
        },
        "class_type": "VAEEncode",
        "_meta": {
            "title": "VAE Encode"
        }
    },
    "132:121": {
        "inputs": {
            "conditioning": [
                "134:118",
                0
            ],
            "latent": [
                "132:120",
                0
            ]
        },
        "class_type": "ReferenceLatent",
        "_meta": {
            "title": "ReferenceLatent"
        }
    }
}

export default workflow;