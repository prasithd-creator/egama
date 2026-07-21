import axios from "axios";
import fixJson from "./jsonFix.ts";
import progressStore from "../../utils/OllamaProgressStore.js";
import ImagePrompt from "../../Models/imagePrompt.ts";
import runningJobs from "../../utils/jobManager.js";

const ollamaScences = async (req, res) => {
    const jobId = Date.now().toString();
    const controller = new AbortController();
    runningJobs.set(jobId, controller);

    progressStore.set(jobId, {
        progress: 0,
        characters: 0,
        scenes: 0,
        remaining: null,
        status: "running"
    });

    try {
        res.json({ jobId });

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

                            CONTINUITY DIRECTOR (Highest Priority)

                        All scenes belong to ONE continuous film, not separate images.

                        Maintain continuity across every scene unless the assigned beat explicitly requires a change.

                        Keep consistent:
                        - Same main character(s)
                        - Same facial features
                        - Same hairstyle
                        - Same clothing
                        - Same accessories
                        - Same product appearance
                        - Same product size, color, material and proportions
                        - Same location family
                        - Same architecture
                        - Same furniture and props
                        - Same weather
                        - Same time of day
                        - Same lighting direction
                        - Same color palette
                        - Same visual style
                        - Same camera realism
                        - Same cinematic quality

                        If Scene 1 introduces a person holding the product in a modern kitchen, Scene 2 should naturally continue from that environment unless the beat specifically transitions elsewhere.

                        Every scene should feel like it happens seconds after the previous one.

                        Characters should preserve body proportions, age, ethnicity, skin tone, hairstyle, clothing condition, accessories, and emotional progression.

                        Objects introduced in earlier scenes should remain where they logically belong unless they are intentionally moved by the action.

                        The product must never change its design, geometry, material, finish, color, branding placement, or scale.

                        Environmental continuity is mandatory:
                        - Keep consistent wall colors
                        - Floor materials
                        - Furniture
                        - Windows
                        - Background objects
                        - Outdoor conditions
                        - Lighting direction
                        - Shadows

                        Camera continuity:
                        Each shot should naturally connect to the previous shot using professional film grammar.
                        The camera may change framing, lens, and movement, but should feel like it belongs to the same filming session.

                        Only change environments when the beat explicitly requires a new location (for example: Before → After, Factory → Home, Outdoor → Indoor).

                        Think like a Hollywood continuity supervisor reviewing every frame.

                            MARKETING MANAGER:
                            - Tie each scene to the conversion goal implied by its beat.
                            - Push brand identity purely through visual elements (color, shape, material, environment) since no text or logo will ever appear on screen.

                            HARD CONSTRAINTS FOR EVERY SCENE: no text overlays, no captions, no logos, no readable signage, no watermarks, no CGI/cartoon look, no distorted or warped geometry, no inconsistent lighting between the product and its environment.

                            Output format (exactly this shape, ${scene.sceneCount} entries in "scenes", in beat order):
                           OUTPUT JSON FORMAT:

                                  IMPORTANT:
                                        Every value must contain ONLY its own information.
                                        Never put camera information inside scene_description.
                                        Never put duration inside beat.
                                        Never put narrative_purpose inside scene_description.
                                        
                                        Return exactly:

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

        const MAX_RETRIES = 3;

        const generateScreenplay = async (messages, retry = 0) => {
            const response = await fetch("http://127.0.0.1:11434/api/chat", {
                method: "POST",
                signal: controller.signal,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "gemma3:4b",
                    stream: true,
                    format: "json",
                    messages,
                    options: {
                        temperature: 0.7,
                        num_predict: 12000
                    }
                })
            });


            if (!response.ok) {
                throw new Error("Failed to connect to Ollama");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let raw = "";
            let buffer = "";
            let generatedScenes = 0;
            let totalCharacters = 0;

            const startTime = Date.now();

            console.log("\nOllama Generation Started...\n");
            if (retry > 0) {
                console.log(`(retry attempt ${retry}/${MAX_RETRIES})`);
            }

            const estimatedTotalCharacters = scene.sceneCount * 1450;

            progressStore.set(jobId, {
                progress: 0,
                characters: 0,
                scenes: 0,
                remaining: null,
                status: "running",
                retry
            });

            const progressTimer = setInterval(() => {
                controller.signal.addEventListener("abort", () => {
                    console.log("Stopping progress timer");

                    clearInterval(progressTimer);
                    return;
                });
                const elapsed = (Date.now() - startTime) / 1000;

                let progress = (totalCharacters / estimatedTotalCharacters) * 100;
                progress = Math.min(progress, 99);

                const estimatedTotal = progress > 0 ? elapsed / (progress / 100) : 0;
                const remaining = estimatedTotal - elapsed;

                const barLength = 30;
                const filled = Math.round((progress / 100) * barLength);
                const bar = "█".repeat(filled) + "░".repeat(barLength - filled);

                console.clear();

                progressStore.set(jobId, {
                    progress: Number(progress.toFixed(1)),
                    characters: totalCharacters,
                    scenes: generatedScenes,
                    elapsed: Number(elapsed.toFixed(1)),
                    remaining: remaining > 0 ? Number(remaining.toFixed(1)) : null,
                    status: "running"
                });

                console.log("====================================");
                console.log("       OLLAMA GENERATION STATUS");
                console.log("====================================");
                console.log(`Progress : ${progress.toFixed(1)} %`);
                console.log(`[${bar}]`);
                console.log(`Loaded   : ${totalCharacters} chars`);
                console.log(`Scenes   : ${generatedScenes}/${scene.sceneCount}`);
                console.log(`Elapsed  : ${elapsed.toFixed(1)} sec`);
                console.log(`Remaining: ${remaining > 0 ? remaining.toFixed(1) : "--"} sec`);
                console.log("====================================");
            }, 1000);

            while (true) {
                if (controller.signal.aborted) {
                    clearInterval(progressTimer);

                    try {
                        await reader.cancel();
                    } catch (e) {
                        console.log("Reader cancel error:", e.message);
                    }

                    throw new Error("Generation cancelled");
                }
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (!line.trim()) continue;

                    try {
                        const json = JSON.parse(line);

                        if (json.message?.content) {
                            raw += json.message.content;
                            totalCharacters += json.message.content.length;

                            generatedScenes =
                                (raw.match(/"scene_number"\s*:/g) || []).length;
                        }

                        if (json.done) {
                            clearInterval(progressTimer);

                            const totalTime = (Date.now() - startTime) / 1000;

                            console.clear();
                            console.log("====================================");
                            console.log("       ✅ GENERATION COMPLETE");
                            console.log("====================================");
                            console.log("Progress : 100%");
                            console.log(`[${"█".repeat(30)}]`);
                            console.log(`Scenes   : ${scene.sceneCount}/${scene.sceneCount}`);
                            console.log(`Total Time : ${totalTime.toFixed(2)} sec`);
                            console.log(`Prompt Tokens    : ${json.prompt_eval_count}`);
                            console.log(`Generated Tokens : ${json.eval_count}`);
                            console.log(
                                `Generation Time  : ${(json.eval_duration / 1_000_000_000).toFixed(2)} sec`
                            );
                            console.log(
                                `Tokens / Second  : ${(
                                    json.eval_count / (json.eval_duration / 1_000_000_000)
                                ).toFixed(2)}`
                            );
                            console.log("====================================");
                        }
                    } catch {
                        // Ignore incomplete JSON
                    }
                }
            }

            // Empty response regeneration
            if (!raw || raw.trim().length === 0) {

                if (retry < MAX_RETRIES) {

                    console.log(
                        `Empty response from Ollama. Retrying ${retry + 1}/${MAX_RETRIES}`
                    );


                    return generateScreenplay(messages, retry + 1);
                }


                throw new Error(
                    "Ollama returned empty response after retries"
                );
            }

            let cleanJson = raw
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            const start = cleanJson.indexOf("{");
            const end = cleanJson.lastIndexOf("}");

            cleanJson = cleanJson.substring(start, end + 1);
            cleanJson = cleanJson.replace(/[\u0000-\u001F]+/g, " ");
            cleanJson = fixJson(cleanJson);

            try {
                return JSON.parse(cleanJson);
            } catch (err) {
                if (retry < MAX_RETRIES) {
                    console.log(
                        `Invalid JSON from Ollama. Retrying ${retry + 1}/${MAX_RETRIES}...`
                    );

                    // Tell the model exactly why it is being retried
                    messages.push({
                        role: "user",
                        content:
                            "Your previous response was invalid JSON. Regenerate the ENTIRE response. Return ONLY valid JSON matching the required schema. Do not include markdown or explanations."
                    });

                    return generateScreenplay(messages, retry + 1);
                }

                console.log("JSON FAILED after retries");
                console.log(cleanJson);
                throw new Error("Failed to generate valid JSON after retries.");
            }
        };

        generateScreenplay(messages)
            .then(async (parsed) => {
                if (controller.signal.aborted) {
                    throw new Error("Generation cancelled");
                }
                progressStore.set(jobId, {
                    progress: 100,
                    status: "completed",
                    data: parsed
                });

                const category = text.title;
                const topic = parsed.screenplay.topic; // testimonials
                runningJobs.delete(jobId);

                let imagePrompt = await ImagePrompt.findOne({
                    category
                });

                if (!imagePrompt) {
                    imagePrompt = new ImagePrompt({
                        category,
                        topics: []
                    });
                }

                // Check topic folder
                let topicFolder = imagePrompt.topics.find(
                    (item) => item.name === topic
                );

                if (!topicFolder) {
                    imagePrompt.topics.push({
                        name: topic,
                        scene_prompts: [parsed]
                    });
                } else {
                    topicFolder.scene_prompts = [parsed];
                }

                await imagePrompt.save();

                console.log("Saved successfully");

                console.log("Generation finished");
            })
            .catch((err) => {

                if (controller.signal.aborted) {
                    console.log("Generation cancelled by user");

                    progressStore.set(jobId, {
                        progress: 0,
                        status: "cancelled"
                    });

                } else {
                    console.error(err);

                    progressStore.set(jobId, {
                        progress: 0,
                        status: "failed",
                        error: err.message
                    });
                }

                runningJobs.delete(jobId);
            });
    } catch (err) {
        console.error(err);
        runningJobs.delete(jobId);
        progressStore.set(jobId, {
            progress: 0,
            status: "failed",
            error: err.message
        });

        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
    }
};

export default ollamaScences;