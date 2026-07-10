import axios from "axios";
import fixJson from "./jsonFix.ts";

const ollama = async (req, res) => {
    try {
        console.log("Incoming Request:");
        console.dir(req.body, { depth: null });

        const { text, webContent, scenes } = req.body;

        const messages = [
            {
                role: "system",
                content: `
                        You are four experts merged into one: PROMPT ENGINEER (LTX-2.3 specialist), CREATIVE ART DIRECTOR, DP/CAMERAMAN, MARKETING MANAGER. Apply all four lenses internally, then output one unified photoreal image prompt set.
                        RULES: Return ONLY valid JSON. No markdown, no explanations, no extra text.
                        REQUIRED PROMPT COUNT: exactly ${scenes.scene_number} image prompts, one per scene provided in "Scenes" below, in the same order. "scene_number" in each output object must match the source scene's scene_number.
                        SOURCE MATERIAL RULE: each scene is already story-locked (beat, narrative purpose, scene description, camera composition). Do not invent a new visual idea — translate the given scene_description and camera_composition into strict LTX-2.3 prompt format. Keep product geometry/material/color IDENTICAL across all ${scenes.scene_number} prompts for visual continuity.
                        LTX-2.3 PROMPT RULES (apply to every "prompt" field):
                        Single flowing paragraph, present tense, 6-8 sentences. Order: Subject → Action → Lighting/Environment → Camera → Lens/DOF → Texture. Physical/behavioral cues only, no emotion words. No readable text, logos, or signage — carry brand via color, shape, material only. One dominant subject per prompt, smooth physically plausible composition. Real-camera anchor (e.g. Sony FX6 documentary feel) for natural grain, not synthetic-smooth.
                        ROLE LOGIC (apply internally before writing each prompt):
                        ENGINEER: lock product geometry/material/color as given; every element explicit, nothing implied.
                        ART DIRECTOR: name concrete light source, color temperature, surface texture (condensation, fabric weave, skin pores, dust in light) — no vague mood words.
                        DP: specify lens (35/50/85mm), aperture/DOF (f/1.8 shallow vs f/4 product clarity), framing (wide/medium/close/macro), one clear camera move resolved to final position — honor the scene's camera_composition, translate it into precise lens/aperture language.
                        MARKETING: tie each image to the conversion goal implied by its scene's narrative_purpose; push brand identity through visual elements since no text/logo is allowed.
                        NEGATIVE (avoid in every prompt): morphing, distortion, warped geometry, text, watermark, logo, cartoon, CGI look, plastic skin, fused fingers, floating shadows, inconsistent lighting, synthetic-smooth finish.
                        Output format:
                        {
                        "image_prompts": 
                           {
                            "scene_number": 0,
                            "prompt": "single flowing paragraph, present tense, 6-8 sentences, full LTX-2.3 rules applied",
                            "style": "marketing keywords: premium, cinematic, photoreal, documentary-grade, direct response",
                            "negative_prompt": "morphing, distortion, text, watermark, logo, CGI, plastic skin, inconsistent lighting",
                            "ltx_settings": "steps 30-40, CFG 3.0-3.5, 24fps"
                }
                        }
                        `
            },
            {
                role: "user",
                content: `
                        Requirement: ${text.requirements}
                        Company: ${text.title}
                        Description: ${text.description}
                        Website: ${text.url}
                        Website Content: ${webContent}
                        Scenes: ${JSON.stringify(scenes)}
                        `
            }
        ];

        console.log("Sending to Ollama...");

        const response = await axios.post(
            "http://127.0.0.1:11434/api/chat",
            {
                model: "gemma3:4b",
                stream: false,
                messages
            },
            {
                headers: {
                    "Content-Type": "application/json"
                },
                timeout: 300000
            }
        );

        console.log("Raw Ollama Response:");
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


        // Extract JSON only
        const start = cleanJson.indexOf("{");
        const end = cleanJson.lastIndexOf("}");

        if (start === -1) {
            throw new Error("No JSON found");
        }

        cleanJson = cleanJson.substring(
            start,
            end !== -1 ? end + 1 : cleanJson.length
        );


        // Remove invalid control characters
        cleanJson = cleanJson.replace(/[\u0000-\u001F]+/g, " ");


        // Repair missing brackets
        cleanJson = fixJson(cleanJson);


        try {

            const parsed = JSON.parse(cleanJson);

            return res.status(200).json({
                success: true,
                data: parsed
            });

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

        console.error("Ollama Error:");

        if (err.response) {
            console.dir(err.response.data, { depth: null });

            return res.status(err.response.status).json({
                success: false,
                error: err.response.data
            });
        }

        console.error(err.message);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

export default ollama;