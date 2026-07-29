
import progressStore from "../../utils/OllamaProgressStore.js";
import ImagePrompt from "../../Models/imagePrompt.ts";
import runningJobs from "../../utils/jobManager.js";
import { runOllamaJsonJob } from "../../utils/OllamaJsonRunner.js";

const buildMessages = ({ text, webContent, scene }) => ([
    {
        role: "system",
        content: `
                You are four experts merged into one: PROMPT ENGINEER (LTX-2.3 specialist), CREATIVE ART DIRECTOR, DP/CAMERAMAN, MARKETING MANAGER. Apply all four lenses internally, then output one unified photoreal image prompt set.
                        RULES: Return ONLY valid JSON. No markdown, no explanations, no extra text.
                        REQUIRED PROMPT COUNT: exactly ${scene.scene_number} image prompts, one per scene provided in "Scenes" below, in the same order. "scene_number" in each output object must match the source scene's scene_number.
                        SOURCE MATERIAL RULE: each scene is already story-locked (beat, narrative purpose, scene description, camera composition). Do not invent a new visual idea — translate the given scene_description and camera_composition into strict LTX-2.3 prompt format. Keep product geometry/material/color IDENTICAL across all ${scene.scene_number} prompts for visual continuity.
                        LTX-2.3 PROMPT RULES (apply to every "prompt" field):
                        Single flowing paragraph, present tense, 6-8 sentences. Order: Subject → Action → Lighting/Environment → Camera → Lens/DOF → Texture. Physical/behavioral cues only, no emotion words. No readable text, logos, or signage — carry brand via color, shape, material only. One dominant subject per prompt, smooth physically plausible composition. Real-camera anchor (e.g. Sony FX6 documentary feel) for natural grain, not synthetic-smooth.
                        ROLE LOGIC (apply internally before writing each prompt):
                        ENGINEER: lock product geometry/material/color as given; every element explicit, nothing implied.
                        ART DIRECTOR: name concrete light source, color temperature, surface texture (condensation, fabric weave, skin pores, dust in light) — no vague mood words.
                        DP: specify lens (35/50/85mm), aperture/DOF (f/1.8 shallow vs f/4 product clarity), framing (wide/medium/close/macro), one clear camera move resolved to final position — honor the scene's camera_composition, translate it into precise lens/aperture language.
                        MARKETING: tie each image to the conversion goal implied by its scene's narrative_purpose; push brand identity through visual elements since no text/logo is allowed.
                        CONTINUITY ENGINEER (Highest Priority)

                        All prompts represent consecutive shots from the SAME commercial film.

                        Every prompt must continue naturally from the previous prompt unless the source scene explicitly changes the location or timeline.

                        Maintain perfect continuity across every prompt:

                        • Same product geometry
                        • Same product dimensions
                        • Same product color
                        • Same product material
                        • Same product finish
                        • Same branding placement
                        • Same character identity
                        • Same age
                        • Same ethnicity
                        • Same hairstyle
                        • Same facial features
                        • Same clothing
                        • Same accessories
                        • Same environment
                        • Same architecture
                        • Same furniture
                        • Same props
                        • Same weather
                        • Same time of day
                        • Same lighting direction
                        • Same visual style
                        • Same color grading

                        Treat every prompt as the next camera shot, never as an unrelated image.

                        Characters, products, and environments should preserve all physical details from previous scenes.

                        Only alter elements that are intentionally changed by the source scene.

                        Do not redesign, restyle, or reinterpret the product in later prompts.

                        The generated prompts must feel like they were filmed in one continuous production with the same camera package, lighting crew, and art department.
                        NEGATIVE (avoid in every prompt): morphing, distortion, warped geometry, text, watermark, logo, cartoon, CGI look, plastic skin, fused fingers, floating shadows, inconsistent lighting, synthetic-smooth finish NEGATIVE (Apply to every prompt)

                        morphing,
                        identity changes,
                        different character,
                        different clothing,
                        different hairstyle,
                        different product,
                        incorrect product color,
                        incorrect product proportions,
                        warped geometry,
                        duplicate limbs,
                        extra fingers,
                        missing fingers,
                        floating objects,
                        floating shadows,
                        CGI,
                        cartoon,
                        anime,
                        plastic skin,
                        oversharpening,
                        low detail,
                        blurry,
                        noise,
                        watermark,
                        logo,
                        readable text,
                        caption,
                        subtitle,
                        distorted reflections,
                        inconsistent lighting,
                        incorrect perspective,
                        synthetic rendering,
                        hallucinated props,
                        environment changes without story justification.
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
                Scene: ${JSON.stringify(scene)}
                `
    }
]);

// Helper functions for parsing responses
const extractImagePromptResult = (parsed) => {
    let result = parsed?.image_prompts ?? parsed;
    if (Array.isArray(result)) {
        result = result[0];
    }
    return result;
};

// Helper functions for parsing responses
const isValidImagePrompt = (parsed) => {
    const result = extractImagePromptResult(parsed);
    return (
        !!result &&
        Object.keys(result).length > 0 &&
        typeof result.prompt === "string" &&
        result.prompt.trim().length > 0
    );
};

// Main function for generating prompt
const ollama = async (req, res) => {
    const jobId = Date.now().toString();
    const controller = new AbortController();
    runningJobs.set(jobId, controller);

    let activeReader = null;

    const onAbort = () => {
        console.log(`Job ${jobId}: abort signal received — cancelling active reader`);
        if (activeReader) {
            activeReader.cancel().catch(() => { });
        }
    };
    controller.signal.addEventListener("abort", onAbort);

    console.log("CREATE JOB", jobId);

    progressStore.set(jobId, {
        progress: 0,
        characters: 0,
        scenes: 0,
        remaining: null,
        status: "running"
    });

    try {
        res.json({ jobId });

        console.log("Incoming Request:");
        console.dir(req.body, { depth: null });

        const { text, webContent, scenes } = req.body;

        const sceneList = scenes?.screenplay?.scenes ?? [];
        const totalScenes = scenes?.screenplay?.scene_count ?? sceneList.length;

        if (!totalScenes || !sceneList.length) {
            throw new Error("Invalid scenes payload: missing screenplay.scenes / screenplay.scene_count");
        }

        const estimatedCharsPerScene = 1000;
        const overallStartTime = Date.now();

        let completedCharacters = 0;

    
        // Generates the image prompt for ONE scene
        const generateOneScenePrompt = async (scene) => {
            const messages = buildMessages({ text, webContent, scene });
            const sceneWeight = 100 / totalScenes;
            const completedScenes = scene.scene_number - 1;

            let lastSceneCharacters = 0;

            const sceneProgressAdapter = {
                set(_id, data) {
                    lastSceneCharacters = data.characters ?? lastSceneCharacters;

                    const currentSceneProgress = (Math.min(data.progress, 99.9) / 100) * sceneWeight;
                    const progress = Math.min(completedScenes * sceneWeight + currentSceneProgress, 99.9);

                    progressStore.set(jobId, {
                        progress: Number(progress.toFixed(1)),
                        characters: completedCharacters + lastSceneCharacters,
                        scenes: completedScenes,
                        elapsed: data.elapsed,
                        remaining: null,
                        status: "running"
                    });
                }
            };

            const parsedResponse = await runOllamaJsonJob({
                jobId,
                controller,
                progressStore: sceneProgressAdapter,
                buildMessages: () => messages,
                model: "llama3.1:8b",
                estimatedChars: estimatedCharsPerScene,
                maxRetries: 3,
                isValid: isValidImagePrompt,
                overallStartTime,
                onReaderCreated: (reader) => {
                    activeReader = reader;
                }
            });

            completedCharacters += lastSceneCharacters;

            return extractImagePromptResult(parsedResponse);
        };

        const imagePrompts = [];

        for (let i = 0; i < sceneList.length; i++) {
            if (controller.signal.aborted) {
                throw new DOMException("Generation cancelled", "AbortError");
            }

            const scene = sceneList[i];

            console.log(`\n--- Generating prompt for scene ${scene.scene_number} (${i + 1}/${totalScenes}) ---\n`);

            const result = await generateOneScenePrompt(scene);
            imagePrompts.push(result);

            const elapsed = (Date.now() - overallStartTime) / 1000;

            progressStore.set(jobId, {
                progress: Number((((i + 1) / totalScenes) * 100).toFixed(1)),
                characters: completedCharacters,
                scenes: i + 1,
                elapsed: Number(elapsed.toFixed(1)),
                remaining: null,
                status: "running"
            });

            console.log(`--- Scene ${scene.scene_number} complete (${i + 1}/${totalScenes}) ---`);
        }

        const cleanImagePrompts = imagePrompts.flat();

        progressStore.set(jobId, {
            progress: 100,
            characters: completedCharacters,
            scenes: totalScenes,
            elapsed: Number(((Date.now() - overallStartTime) / 1000).toFixed(1)),
            remaining: null,
            status: "completed",
            data: { image_prompts: cleanImagePrompts }
        });

        const category = scenes.screenplay.company_name;
        const brand = scenes.screenplay.brand_name;
        const topic = scenes.screenplay.topic;

        let imagePrompt = await ImagePrompt.findOne({ category });

        if (!imagePrompt) {
            imagePrompt = new ImagePrompt({ category, brands: [] });
        }

        let brandFolder = imagePrompt.brands.find((item) => item.name === brand);

        if (!brandFolder) {
            brandFolder = { name: brand, topics: [] };
            imagePrompt.brands.push(brandFolder);
        }

        let topicsFolder = brandFolder.topics.find(t => t.name === topic);

        if (!topicsFolder) {
            brandFolder.topics.push({ name: topic, image_prompts: cleanImagePrompts });
        } else {
            topicsFolder.image_prompts = cleanImagePrompts;
        }

        await imagePrompt.save();
        console.log("imagePrompts", imagePrompts);
        console.log("All scene image prompts generated.");
    } catch (err) {
        const wasCancelled = err.name === "AbortError" || controller.signal.aborted;

        if (wasCancelled) {
            console.log(`Job ${jobId}: cancelled by user.`);
        } else {
            console.error(err);
        }

        progressStore.set(jobId, {
            progress: 0,
            status: wasCancelled ? "cancelled" : "failed",
            error: wasCancelled ? "Generation cancelled by user" : err.message
        });

        if (!res.headersSent) {
            return res.status(wasCancelled ? 200 : 500).json({
                success: wasCancelled,
                cancelled: wasCancelled,
                error: wasCancelled ? undefined : err.message
            });
        }
    } finally {
        controller.signal.removeEventListener("abort", onAbort);
        runningJobs.delete(jobId);
    }
};

export default ollama;