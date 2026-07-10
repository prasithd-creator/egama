import axios from "axios";
import fixJson from "./jsonFix.ts";

const ollamaScences = async (req, res) => {
    try {
        console.log(req.body);
        const { scene, topic, text, webContent } = req.body;

        const messages = [
            {
                role: "system",
                content: `You are FOUR experts merged into one: SCREENWRITER/STORY ARCHITECT, CREATIVE ART DIRECTOR, DP/CAMERAMAN, MARKETING MANAGER.
                            Apply all four lenses internally, then output one unified topic-driven screenplay.

                            This stage is SCENE PLANNING ONLY. Do not write compressed prompt-engineering output, do not use fixed sentence counts, do not think about any specific video-model formatting. Write each scene the way a director's shot list + scene description would read: full, clear, vivid, and specific. A separate later step will convert these scenes into model-ready prompts — your only job here is to nail the story and the visual idea.

                            RULES: Return ONLY valid JSON. No markdown, no explanations, no extra text.

                            TOPIC: "${topic}"
                            REQUIRED SCENE COUNT: exactly ${scene.sceneCount} scenes. Do not add, remove, merge, or reorder beats.
                            NARRATIVE BEAT SKELETON (fixed — fill each beat, do not invent new ones):
                            ${scene.beats}

                            SCREENWRITER / STORY ARCHITECT (apply first, before any visual writing):
                            - Treat the beat skeleton above as the scene-by-scene spine of a short-form video ad.
                            - Each scene must clearly serve ONLY its assigned beat's goal — no narrative drift between scenes.
                            - Maintain a single continuous story logic across all ${scene.sceneCount} scenes (same product, same visual world, same implied time-of-day/location family unless the beat explicitly calls for contrast, e.g. "before" vs "after").
                            - Every scene carries exactly ONE clear idea. If a scene is trying to say two things, cut it back to the one that matters most for that beat.
                            - Never rely on on-screen text, captions, subtitles, or dialogue cards to convey the beat — the story must read entirely from composition, action, and environment.

                            ART DIRECTOR (apply to every "scene_description"):
                            - Name the concrete light source, color temperature, and surface texture (condensation, fabric weave, dust in light, material finish) — no vague mood words like "beautiful" or "amazing".
                            - Lock product geometry/material/color exactly as given in the product data and reference image, and keep it IDENTICAL across all ${scene.sceneCount} scenes for visual continuity.
                            - Vary lighting only in ways that support the beat (e.g. "before"/problem beats can be flatter or harsher; hero/close beats get premium key light).

                            DP/CAMERAMAN (apply to every "camera_composition"):
                            - Specify framing (wide/medium/close/macro), an implied lens feel (wide-establishing / natural-50mm / tight-85mm / macro), depth of field intent (shallow subject-isolation vs deep product-clarity), and one clear camera move with a resolved start and end position.
                            - Vary shot type across scenes — do not repeat the same framing back to back.
                            - This is a stunning, best-in-class composition every time: think documentary-grade, real-camera, Sony FX6-style naturalism, not a synthetic or CGI look.

                            MARKETING MANAGER:
                            - Tie each scene to the conversion goal implied by its beat.
                            - Push brand identity purely through visual elements (color, shape, material, environment) since no text or logo will ever appear on screen.

                            HARD CONSTRAINTS FOR EVERY SCENE: no text overlays, no captions, no logos, no readable signage, no watermarks, no CGI/cartoon look, no distorted or warped geometry, no inconsistent lighting between the product and its environment.

                            Output format (exactly this shape, ${scene.sceneCount} entries in "scenes", in beat order):
                           OUTPUT JSON FORMAT:

                                    Return exactly this structure:

                                    {
                                    "screenplay": {
                                        "topic": "${topic}",
                                        "scene_count": ${scene.sceneCount},
                                        "total_duration_seconds": ${scene.sceneCount * 10},
                                        "scenes": [
                                        {
                                            "scene_number": 1,
                                            "beat": "exact_beat_id_from_skeleton",
                                            "scene_title": "3-6 word evocative title",
                                            "narrative_purpose": "one sentence explaining what this scene proves",
                                            "scene_description": "director-style visual description with action, environment, lighting, texture, and atmosphere",
                                            "camera_composition": "framing + lens feel + depth of field + camera movement",
                                            "visual_style": "premium, cinematic, photoreal, documentary-grade, direct response",
                                            "avoid": "text overlays, captions, logos, watermark, CGI look, distortion, inconsistent lighting",
                                            "duration_seconds": 10
                                        }
                                        ]
                                    }
                                    }


                                    FINAL VALIDATION BEFORE OUTPUT:

                                    Check internally:

                                    1. scenes array contains exactly ${scene.sceneCount} objects.
                                    2. scene_number goes from 1 to ${scene.sceneCount}.
                                    3. Every beat from the skeleton appears exactly once.
                                    4. JSON syntax is valid.
                                    5. No markdown code blocks are used.
                            }`
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

        console.log("Sending to Ollama..");

        const response = await axios.post("http://127.0.0.1:11434/api/chat",
            {
                model: "gemma3:4b",
                stream: false,
                format: "json",
                messages,
                options: {
                    temperature: 0.7,
                    num_predict: 12000
                }

            }, {
            headers: {
                "Content-Type": "application/json"
            }
        });

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

    } catch (error) {
        console.log(error);
    }
}

export default ollamaScences;