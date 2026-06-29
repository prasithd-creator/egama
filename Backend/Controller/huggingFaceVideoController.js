import hf from "../Config/huggingface.js";

// const imageToVideoPrompt = async (req, res) => {
//     try {
//         const { images, webContent } = req.body;
//   console.log(images);
//         if (!images) {
//             return res.status(400).json({
//                 success: false,
//                 error: "Image is required",
//             });
//         }

//         // ----------------------------
//         // 1. Prompt (IMAGE → VIDEO AD)
//         // ----------------------------
//         const prompt = `
// You are a senior AI video marketing director.

// CRITICAL RULES:
// - Output ONLY valid JSON
// - No markdown, no explanation, no extra text
// - Must start with { and end with }
// - No trailing commas
// - Must be strictly valid JSON

// TASK:
// Analyze the given IMAGE and convert it into 2 HIGH-CONVERSION MARKETING VIDEO AD PROMPTS.

// The video ads must be based ONLY on what is seen in the image.

// If website content is provided, use it only to improve branding context.

// WEBSITE CONTENT (optional context):
// ${webContent || "Not provided"}

// ---

// VIDEO GENERATION GOAL:
// Turn the image into a short advertising video concept that can be used for:
// - Meta Ads (Instagram/Facebook)
// - YouTube Ads
// - Landing page hero video
// - Product marketing videos

// ---

// VIDEO REQUIREMENTS:

// Each video prompt MUST include:

// 1. Image Understanding
//    - What is in the image (objects, people, UI, product, environment)

// 2. Marketing Angle
//    - What is being sold or promoted
//    - Target audience

// 3. Video Flow (IMPORTANT)
//    - Hook (first 3 seconds attention grabber)
//    - Problem or context
//    - Solution demonstration
//    - Product/service highlight
//    - Call To Action

// 4. Motion Design
//    - Camera movement (zoom, pan, tracking, dolly)
//    - Object movement (UI, product interaction, human actions)
//    - Scene transitions

// 5. Ad Style
//    - Modern commercial style (NOT cinematic storytelling)
//    - Clean, high conversion, brand-focused visuals

// ---

// STYLE RULES:
// - Real-world advertising (Apple, Meta Ads, SaaS ads style)
// - Simple, clear, conversion-focused
// - No artistic cinema storytelling
// - No fantasy or abstract visuals unless image contains it

// ---

// OUTPUT FORMAT (STRICT JSON ONLY):

// {
//   "video_prompts": [
//     {
//       "prompt": "string (full marketing video ad script derived from image)",
//       "style": "string (e.g. 'modern SaaS ad, clean corporate branding, high conversion')"
//     },
//     {
//       "prompt": "string (different marketing angle of same image)",
//       "style": "string (different ad direction)"
//     }
//   ]
// }
// `;

//         // ----------------------------
//         // 2. Hugging Face Vision Model Call
//         // ----------------------------
//         const response = await hf.chatCompletion({
//             model: "Qwen/Qwen2-VL-72B-Instruct",
//             messages: [
//                 {
//                     role: "user",
//                     content: [
//                         {
//                             type: "text",
//                             text: prompt,
//                         },
//                         {
//                             type: "image_url",
//                             image_url: {
//                                 url: images, // base64 or public URL
//                             },
//                         },
//                     ],
//                 },
//             ],
//             max_tokens: 3000,
//         });

//         let raw = response.choices[0].message.content;

//         // ----------------------------
//         // 3. Clean response
//         // ----------------------------
//         raw = raw
//             .replace(/```json/g, "")
//             .replace(/```/g, "")
//             .trim();

//         const start = raw.indexOf("{");
//         const end = raw.lastIndexOf("}");

//         if (start === -1 || end === -1) {
//             return res.status(500).json({
//                 success: false,
//                 error: "Invalid JSON response",
//                 raw,
//             });
//         }

//         const jsonString = raw.slice(start, end + 1);

//         let parsed;
//         try {
//             parsed = JSON.parse(jsonString);
//         } catch (err) {
//             return res.status(500).json({
//                 success: false,
//                 error: "JSON parse failed",
//                 raw,
//             });
//         }

//         // ----------------------------
//         // 4. Combine prompts (optional)
//         // ----------------------------
//         const combinedVideoPrompts = parsed.video_prompts.map((p) => {
//             return `${p.prompt} | Style: ${p.style}`;
//         });

//         // ----------------------------
//         // 5. Response
//         // ----------------------------
//         return res.status(200).json({
//             success: true,
//             data: parsed,
//             combinedVideoPrompts,
//         });
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             success: false,
//             error: error.message,
//         });
//     }
// };
const imageToVideoPrompt = async (req, res) => {
    try {
        const { images = [], webContent = "" } = req.body;

        if (!Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Images array is required",
            });
        }

        const processImage = async (imageUrl) => {
            try {
                console.log("Processing image:", imageUrl);

                if (!imageUrl || typeof imageUrl !== "string") {
                    throw new Error("Invalid image URL");
                }

                const prompt = `
You are a senior marketing strategist, creative director, and video advertising expert.

CRITICAL RULES:
- Output ONLY valid JSON
- No markdown
- No explanations
- No extra text
- Must start with { and end with }
- Must be valid JSON

TASK:
Generate ONE high-converting 10-second marketing video advertisement.

IMAGE ANALYSIS:
${images}

WEBSITE CONTENT:
${webContent || "Not provided"}

OBJECTIVE:
Create a premium 10-second marketing video concept based entirely on the image analysis.

VIDEO GOALS:
- Increase conversions
- Generate leads
- Improve brand awareness
- Drive engagement
- Promote product/service effectively

VIDEO DURATION RULE:
- TOTAL VIDEO LENGTH MUST BE EXACTLY 10 SECONDS
- Fast-paced commercial style
- Every second must be intentional

VIDEO STRUCTURE (10s breakdown):
- 0–3s: Powerful Hook (attention grab, problem/curiosity)
- 3–7s: Product/Benefit showcase (value + transformation)
- 7–10s: Strong CTA (urgency + action)

MOTION INSTRUCTIONS:
- Fast cinematic cuts
- Smooth zoom-ins on product
- Dynamic transitions every 1–2 seconds
- Clean commercial pacing
- Focus-driven camera movement
- Premium ad aesthetic

VISUAL STYLE:
- High-end commercial advertising
- Modern brand identity
- Social media ad optimized
- Meta Ads / YouTube Ads quality
- Clean, premium, conversion-focused visuals

VOICE OVER INSTRUCTIONS:
- MUST be strictly for a 10-second video
- Total script length: 25–35 words maximum
- Must follow structure: Hook → Value → CTA
- Extremely punchy and emotional
- No filler words
- Sound like a professional ad narrator
- Every word must drive conversion
- Must match fast visual cuts
- CTA must be included in final line
- High urgency and persuasive tone

OUTPUT FORMAT:

{
  "video_prompt": {
    "headline": "string (short, high-impact marketing headline)",
    "marketing_angle": "string (core advertising strategy)",
    "prompt": "detailed 10-second cinematic video generation prompt with scene breakdown and motion direction",
    "voice_over_10s": "ultra-short 10-second voice-over script (25–35 words max, fully aligned to visuals)",
    "style": "marketing keywords like premium, cinematic, UGC-style, direct response, etc.",
    "cta": "strong call to action (1 short line)"
  }
}
`;


                const response = await hf.chatCompletion({
                    model: "zai-org/GLM-4.5V",
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: imageUrl,
                                    },
                                },
                                {
                                    type: "text",
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                    max_tokens: 3000,
                    temperature: 0.7,
                });

                console.log(
                    "HF RESPONSE:",
                    JSON.stringify(response, null, 2)
                );

                const raw = response?.choices?.[0]?.message?.content;

                if (!raw) {
                    throw new Error(
                        "No content returned from model"
                    );
                }

                const cleaned = raw
                    .replace(/```json/gi, "")
                    .replace(/```/g, "")
                    .trim();

                const start = cleaned.indexOf("{");
                const end = cleaned.lastIndexOf("}");

                if (start === -1 || end === -1) {
                    throw new Error(
                        `No JSON found in response: ${cleaned}`
                    );
                }

                const jsonText = cleaned.slice(
                    start,
                    end + 1
                );

                const parsed = JSON.parse(jsonText);

                return (
                    parsed.video_prompt || {
                        prompt: "No prompt generated",
                        style: "unknown",
                    }
                );
            } catch (err) {
                console.error("\n========== IMAGE FAILED ==========");
                console.error("Image:", imageUrl);

                if (err.httpResponse) {
                    console.error(
                        "HF STATUS:",
                        err.httpResponse.status
                    );

                    console.error(
                        "HF BODY:",
                        JSON.stringify(
                            err.httpResponse.body,
                            null,
                            2
                        )
                    );
                }

                console.error(err);

                return {
                    prompt: "Failed to generate prompt",
                    style: "error",
                    error: err.message,
                };
            }
        };

        const results = await Promise.all(
            images.map(processImage)
        );

        return res.status(200).json({
            success: true,
            total: results.length,
            data: results,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

export default imageToVideoPrompt;