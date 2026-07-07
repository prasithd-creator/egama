import axios from "axios";

const ollamaVideoPrompt = async (req, res) => {
    try {
        const {
            images = [],
            requirements = "",
            webContent = "",
            companyDetails = {},
        } = req.body;

        if (!Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Images array is required",
            });
        }

        const processImage = async (imageUrl) => {
            try {
                console.log("Processing:", imageUrl);

                // Download image from Cloudinary
                const imageResponse = await axios.get(imageUrl, {
                    responseType: "arraybuffer",
                    timeout: 60000,
                    headers: {
                        "User-Agent": "Mozilla/5.0"
                    }
                });

                const base64 = Buffer.from(imageResponse.data).toString("base64");
                console.log("Base64 Start:", base64.substring(0, 30));

                const prompt = `
                                    You are FIVE roles merged into one pass: STORY ARCHITECT, PROMPT ENGINEER (LTX-2.3 specialist), CREATIVE ART DIRECTOR, DP/CAMERAMAN, MARKETING MANAGER.

                                    RULES: Output ONLY valid JSON. Must start with { end with }.

                                    INPUT:
                                    Requirement: ${requirements}
                                    Company: ${companyDetails.title || "null"}
                                    Description: ${companyDetails.description || "null"}
                                    Website: ${companyDetails.url || "null"}
                                    Website Content: ${webContent || "Not provided"}

                                    CAST RULE: Any human shown must be Indian...

                                    "You are FIVE roles merged into one pass: STORY ARCHITECT, PROMPT ENGINEER (LTX-2.3 specialist), CREATIVE ART DIRECTOR, DP/CAMERAMAN, MARKETING MANAGER. Apply all five lenses internally, then output one unified 10-second photoreal video ad concept.

                                    RULES: Escape all quotes inside strings. Output ONLY valid JSON. No markdown, no explanations, no extra text. No newline characters inside string values.

                                    INPUT:
                                    WEBSITE CONTENT: ${webContent || "Not provided"}

                                    CAST RULE: Any human shown must be Indian — describe them through physical/regional cues (skin tone, hair, features, attire if relevant to context e.g. casual Indian office wear, everyday Indian home setting) without naming ethnicity as a label. Keep it natural and contextual, not a checklist. If the story doesn't require a human, skip this entirely — do not force a person into the frame.

                                    LTX-2.3 PROMPT RULES (apply to "prompt" field):
                                    Single flowing paragraph, present tense, 6-8 sentences covering full 10s timeline. Order: Subject → Action → Lighting/Environment → Camera → Lens → Audio. Use physical/behavioral cues, not emotion words (e.g. "shoulders slumped" not "sad"). No readable text, logos, or signage — carry brand via color, shape, material only. One dominant action per beat, smooth physically plausible motion, no chaotic/stacked movement. The camera move must resolve on the product/subject by the end.

                                    ROLE LOGIC (in order):

                                    STORY ARCHITECT (runs first, silently): Read WEBSITE CONTENT + Requirement to classify what is being sold — physical product, SaaS/software/app, or service. Choose the narrative arc that fits that classification instead of defaulting to a generic hero-shot:
                                    Physical product → tactile hero-shot (surface, material, light interacting with the object)
                                    SaaS/tool/app → workflow-in-action or before/after transformation, shown through human hands/posture/environment, never through screen text or UI
                                    Service → human-outcome moment (a person experiencing the result of the service)
                                    Do not output this classification. Let it silently shape what happens in each beat below. If a human appears, they follow CAST RULE above.

                                    ENGINEER: Lock product/subject geometry, material, color, and identity from the input; keep background flexible. Make every action explicit — nothing implied. Translate the Story Architect's chosen arc into concrete, filmable actions.

                                    ART DIRECTOR: Define one concrete light source, color temperature, and texture detail (condensation, fabric weave, skin, dust, glare) consistent with the locked identity. No vague mood words ("moody," "sleek") — only physical descriptors.

                                    DP: Choose exactly ONE camera move for the entire 10 seconds, and keep the move MINIMAL in distance/speed — a subtle push-in, a slight drift, a gentle settle, or a near-lock-off with barely-perceptible motion. Cinematic quality must come from lens choice, depth of field, framing, and light — not from a big or fast move. No sweeping dolly, no wide orbit, no whip or rapid reframe. There are no cuts and no move-changes. The three story beats (hook / value / CTA) must emerge from what enters or exits frame and from where the minimal move resolves — not from separate shots. Name the lens (35/50/85mm), aperture/DOF, and a real-camera anchor (e.g. Sony FX6 documentary feel) for natural grain and motion, not synthetic-smooth CGI motion. State explicitly where the move resolves at the end (must land on the product/subject).

                                    MARKETING: Define the viewer's feeling and intended action, tied to a conversion goal. Since no on-screen text is allowed, push brand recall entirely through visual identity — color, material, shape, motion signature — not slogans.

                                    STRUCTURE (folded into ONE minimal continuous camera move — no cuts between beats):
                                    0-3s hook (one clear action, camera begins its minimal move) → 3-7s product/benefit beat (material + light become visible as the move continues barely) → 7-10s CTA beat (the same minimal move settles and resolves on the product/subject).
                                    All three beats occur within the single minimal camera move defined by DP. Beats are reframing moments within one take, not shot boundaries.

                                    VOICE OVER: 25-35 words max, Hook→Value→CTA, punchy, no filler, human narrator pacing, CTA in final line."

                                    OUTPUT JSON:
                                    {
                                    "video_prompt": {
                                        "headline": "string",
                                        "marketing_angle": "string",
                                        "prompt": "single flowing paragraph per LTX-2.3 rules above, 6-8 sentences, full 10s timeline, one minimal continuous camera move only, Indian cast if humans present",
                                        "negative_prompt": "morphing, distortion, warping, flicker, jitter, stutter, shaky camera, temporal artifacts, low quality, text, watermark, logo, cartoon, CGI, plastic skin, fused fingers, inconsistent lighting, jump cuts, scene changes, multiple angles, edit transitions, camera cuts, sweeping camera movement, fast dolly, whip pan, wide orbit, excessive camera motion",
                                        "voice_over_10s": "25-35 word script",
                                        "style": "premium, cinematic, photoreal, documentary-grade, direct response, single minimal continuous take",
                                        "cta": "1 short line",
                                        "ltx_settings_recommendation": "steps 30-40, CFG 3.0-3.5, 24fps",
                                        "creative_rationale": ["bullet1", "bullet2", "bullet3"]
                                    }
                                    }`



                // Send the request and model for the Ollama
                const body = {
                    model: "llava:latest",
                    stream: false,
                    format: "json",

                    options: {
                        temperature: 0.1,
                        num_predict: 1500
                    },

                    messages: [
                        {
                            role: "user",
                            content: prompt,
                            images: [base64]
                        }
                    ]
                };

                console.log("Sending request to Ollama...");

                ///Ollama API
                const response = await axios.post(
                    "http://127.0.0.1:11434/api/chat",
                    body,
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                console.dir(response.data, { depth: null });

                const raw = response.data?.message?.content;

                if (!raw) {
                    throw new Error("No content returned from Ollama");
                }

                console.log("Raw Model Output:");
                console.log(raw);

                let cleanJson = raw
                    .replace(/```json/g, "")
                    .replace(/```/g, "")
                    .replace(/\\_/g, "_")
                    .trim();


                // Extract only JSON
                const start = cleanJson.indexOf("{");
                const end = cleanJson.lastIndexOf("}");

                cleanJson = cleanJson.substring(start, end + 1);


                // Fix bad control characters
                cleanJson = cleanJson.replace(/[\u0000-\u001F]+/g, " ");

                try {

                    const parsed = JSON.parse(cleanJson);

                    return parsed.video_prompt;

                } catch (err) {

                    console.log("JSON FAILED");

                    console.log(cleanJson);

                    return {
                        success: false,
                        error: "Invalid JSON",
                        raw: cleanJson
                    };
                }
            } catch (err) {
                console.error(err.response?.data || err);

                return {
                    success: false,
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
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};

export default ollamaVideoPrompt;