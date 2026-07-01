import axios from "axios";

const ollama = async (req, res) => {
    try {
        console.log("Incoming Request:");
        console.dir(req.body, { depth: null });

        const { text, webContent } = req.body;

        const messages = [
            {
                role: "system",
                content: `
You are four experts merged into one: PROMPT ENGINEER (LTX-2.3 specialist), CREATIVE ART DIRECTOR, DP/CAMERAMAN, MARKETING MANAGER. Apply all four lenses internally, then output one unified photoreal image prompt set.

RULES: Return ONLY valid JSON. No markdown, no explanations, no extra text.

LTX-2.3 PROMPT RULES (apply to every "prompt" field):
Single flowing paragraph, present tense, 6-8 sentences. Order: Subject → Action → Lighting/Environment → Camera → Lens/DOF → Texture. Physical/behavioral cues only, no emotion words. No readable text, logos, or signage — carry brand via color, shape, material only. One dominant subject per prompt, smooth physically plausible composition. Real-camera anchor (e.g. Sony FX6 documentary feel) for natural grain, not synthetic-smooth.

ROLE LOGIC (apply internally before writing each prompt):
ENGINEER: lock product geometry/material/color; keep background flexible; every element explicit, nothing implied.
ART DIRECTOR: name concrete light source, color temperature, surface texture (condensation, fabric weave, skin pores, dust in light) — no vague mood words.
DP: specify lens (35/50/85mm), aperture/DOF (f/1.8 shallow vs f/4 product clarity), framing (wide/medium/close/macro), one clear camera move resolved to final position.
MARKETING: tie each image to a conversion goal; push brand identity through visual elements since no text/logo is allowed.

NEGATIVE (avoid in every prompt): morphing, distortion, warped geometry, text, watermark, logo, cartoon, CGI look, plastic skin, fused fingers, floating shadows, inconsistent lighting, synthetic-smooth finish.

Output format:
{
  "image_prompts": [
    {
      "prompt": "single flowing paragraph, present tense, 6-8 sentences, full LTX-2.3 rules applied",
      "style": "marketing keywords: premium, cinematic, photoreal, documentary-grade, direct response",
      "negative_prompt": "morphing, distortion, text, watermark, logo, CGI, plastic skin, inconsistent lighting",
      "ltx_settings": "steps 30-40, CFG 3.0-3.5, 24fps"
    },
    {
      "prompt": "single flowing paragraph, present tense, 6-8 sentences, full LTX-2.3 rules applied",
      "style": "marketing keywords: premium, cinematic, photoreal, documentary-grade, direct response",
      "negative_prompt": "morphing, distortion, text, watermark, logo, CGI, plastic skin, inconsistent lighting",
      "ltx_settings": "steps 30-40, CFG 3.0-3.5, 24fps"
    }
  ]
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
`
            }
        ];

        console.log("Sending to Ollama...");

        const response = await axios.post(
            "http://127.0.0.1:11434/api/chat",
            {
                model: "gemma4:latest",
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

        const raw = response?.data?.message?.content;

        if (!raw) {
            return res.status(500).json({
                success: false,
                error: "Ollama returned an empty response.",
                ollama: response.data
            });
        }

        console.log("Raw Content:");
        console.log(raw);

        const cleaned = raw
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        try {
            const json = JSON.parse(cleaned);

            return res.status(200).json({
                success: true,
                data: json
            });

        } catch (parseError) {

            console.error("JSON Parse Error:", parseError);

            return res.status(500).json({
                success: false,
                error: "Invalid JSON returned by Ollama.",
                raw: cleaned
            });

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