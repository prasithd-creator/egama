import { useState, useEffect } from "react";
import logo from "../../assets/egama_logo.png";

export default function ChatGPTUrlScreen() {
    const [url, setUrl] = useState("");
    const [submittedUrl, setSubmittedUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [responseData, setResponseData] = useState<any>(null);
    const [content, setContent] = useState("");

    // ----------------------------
    // ✅ FIXED WORKFLOW
    // ----------------------------
    const workflow = {
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
                    "Photorealistic black Range Rover parked near mountains during sunset, cinematic automotive photography, luxury SUV advertisement, ultra realistic reflections, golden hour lighting, HDR, shallow depth of field, 8K"
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

        // ✅ FIXED: USE 61 HERE (IMPORTANT)
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

    // ----------------------------
    // SUBMIT WORKFLOW
    // ----------------------------
    const handleSubmit = async () => {
        if (!url.trim()) return alert("Please paste a URL");

        try {
            setLoading(true);
            setSubmittedUrl(url);

            const res = await fetch(
                "https://spa-assisted-unable-summit.trycloudflare.com/prompt",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: workflow })
                }
            );

            const data = await res.json();
            console.log("Submit Response:", data);

            const promptId = data.prompt_id;

            // wait for generation
            await new Promise(r => setTimeout(r, 8000));

            // fetch history
            const historyRes = await fetch(
                `https://spa-assisted-unable-summit.trycloudflare.com/history/${promptId}`
            );

            const history = await historyRes.json();
            console.log("History:", history);

            // extract image safely
            const outputs = history[promptId]?.outputs;
            const imageObj = outputs?.["9"]?.images?.[0];

            const imageUrl = imageObj
                ? `https://spa-assisted-unable-summit.trycloudflare.com/view?filename=${imageObj.filename}`
                : null;

            setResponseData({
                imageUrl,
                raw: history
            });

        } catch (err) {
            console.error(err);
            alert("Failed to generate image");
        } finally {
            setLoading(false);
        }
    };

    // ----------------------------
    // SEND RESPONSE
    // ----------------------------
    const sendResponse = async () => {
        if (!content) return alert("Enter requirement");

        try {
            const res = await fetch("https://prasithd.app.n8n.cloud/webhook-test/xxx", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content,
                    responseData
                })
            });

            if (res.ok) alert("Sent successfully");
        } catch (err) {
            console.log(err);
        }
    };

    // ----------------------------
    // UI
    // ----------------------------
    return (
        <div className="min-h-screen bg-gray-900 text-white p-10">

            <img src={logo} className="w-20 mb-6" />

            <h1 className="text-3xl font-bold mb-6">
                AI Workflow Generator
            </h1>

            {/* INPUT */}
            <div className="flex gap-3">
                <input
                    className="p-3 w-full rounded bg-gray-800"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste URL"
                />

                <button
                    onClick={handleSubmit}
                    className="bg-green-500 px-6 py-3 rounded"
                >
                    {loading ? "Loading..." : "Generate"}
                </button>
            </div>

            {/* IMAGE RESULT */}
            {responseData?.imageUrl && (
                <div className="mt-8">
                    <img
                        src={responseData.imageUrl}
                        className="rounded-xl border"
                    />
                </div>
            )}

            {/* SEND TO N8N */}
            {responseData && (
                <div className="mt-6 flex gap-3">
                    <input
                        className="p-3 w-full rounded bg-gray-800"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="User requirement"
                    />

                    <button
                        onClick={sendResponse}
                        className="bg-blue-500 px-6 py-3 rounded"
                    >
                        Send
                    </button>
                </div>
            )}
        </div>
    );
}