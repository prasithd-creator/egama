import axios from "axios";
import progressStore from "../../utils/OllamaProgressStore.js";
import ImagePrompt from "../../Models/imagePrompt.ts";

const buildPrompt = ({ requirements, companyDetails, webContent, scene, imagePrompt }) => `
                     You are an LTX-2.3 Cinematic Prompt Engineer.

                        Your task is to transform the supplied website information, scene data, and reference image into ONE production-ready, photorealistic 10-second Image-to-Video prompt following the official LTX-2.3 prompting guide.

                        Internally reason about:
                        • Story purpose
                        • Product continuity
                        • Motion design
                        • Cinematography
                        • Lighting
                        • Audio
                        • Marketing impact

                        Do NOT output your reasoning.

                        Output ONLY valid JSON.

                        RULES:
                        - Escape all quotes inside JSON strings.
                        - Output ONLY valid JSON.
                        - No markdown.
                        - No explanations.
                        - No extra text.
                        - No newline characters inside string values.
                        - Every field in the required schema MUST be present.
                        - Never leave fields empty.

                        INPUT

                        Requirement:
                        ${requirements}

                        Company:
                        ${companyDetails.title || "null"}

                        Description:
                        ${companyDetails.description || "null"}

                        Website:
                        ${companyDetails.url || "null"}

                        Website Content:
                        ${"Not provided"}

                        Scene:
                        ${JSON.stringify(scene)}

                        Reference Image Prompt:
                        ${JSON.stringify(imagePrompt || {})}

                        ------------------------------------------------------------
                        STORY PURPOSE
                        ------------------------------------------------------------

                        Read the Website Content, Requirement, Company Description and Scene.

                        Silently determine whether this is:

                        • Physical Product
                        • SaaS / Software / Mobile App
                        • Service

                        Then determine the purpose of THIS scene only.

                        Examples:

                        Hook

                        Problem

                        Feature

                        Benefit

                        Transformation

                        Proof

                        Trust

                        Hero Close

                        Call To Action

                        Do NOT output your reasoning.

                        The generated video must fully serve ONLY this scene's narrative purpose.

                        Do not introduce ideas from future scenes.

                        ------------------------------------------------------------
                        IMAGE-TO-VIDEO CONTINUITY
                        ------------------------------------------------------------

                        The supplied Reference Image already represents the FIRST FRAME of this video.

                        Treat it as locked.

                        Never redesign or restyle it.

                        Maintain identical:

                        • Product geometry

                        • Materials

                        • Colors

                        • Shape

                        • Size

                        • Surface finish

                        • Composition

                        • Character identity

                        • Clothing

                        • Hair

                        • Environment

                        Only describe:

                        • What begins moving

                        • How subjects move

                        • Camera movement

                        • Lighting interaction

                        • Environmental motion

                        • Audio

                        Do NOT re-describe appearance unless motion depends on it.

                        ------------------------------------------------------------
                        SINGLE CLIP RULE
                        ------------------------------------------------------------

                        This is ONE continuous 10-second shot.

                        There are:

                        NO cuts

                        NO scene transitions

                        NO edit transitions

                        NO angle changes

                        NO multiple shots

                        NO montage

                        NO time skips

                        The clip should naturally evolve from beginning to end.

                        ------------------------------------------------------------
                        CAST RULE
                        ------------------------------------------------------------

                        Only include humans if the story naturally requires one.

                        If humans appear:

                        Describe them naturally through physical characteristics.

                        Examples:

                        medium brown skin

                        dark hair

                        Indian office attire

                        Indian home

                        Indian workplace

                        Never explicitly label ethnicity.

                        ------------------------------------------------------------
                        PROMPT STRUCTURE
                        ------------------------------------------------------------

                        The "prompt" field MUST be ONE flowing paragraph.

                        6–8 complete sentences.

                        Present tense only.

                        Describe the entire 10-second clip continuously.

                        Follow this exact order.

                        1.

                        Establish the shot.

                        2.

                        Describe the subject.

                        3.

                        Describe the primary action.

                        4.

                        Describe supporting motion.

                        5.

                        Describe the environment.

                        6.

                        Describe lighting.

                        7.

                        Describe texture.

                        8.

                        Describe camera movement.

                        9.

                        Describe lens.

                        10.

                        Describe synchronized audio.

                        The action should naturally evolve over the entire clip.

                        Every sentence should continue the previous one.

                        Never create disconnected moments.

                        ------------------------------------------------------------
                        ACTION RULES
                        ------------------------------------------------------------

                        Use ONE dominant action.

                        Secondary motion may support it.

                        Avoid multiple unrelated actions.

                        Every movement must be physically possible.

                        Never imply actions.

                        Describe every visible movement explicitly.

                        ------------------------------------------------------------
                        SPATIAL RELATIONSHIPS
                        ------------------------------------------------------------

                        Clearly describe where objects exist.

                        Examples:

                        The product sits in the foreground.

                        The customer stands behind it.

                        Window light enters from the left.

                        Plants remain softly blurred in the background.

                        The camera remains chest height.

                        ------------------------------------------------------------
                        LIGHTING
                        ------------------------------------------------------------

                        Specify exactly ONE primary light source.

                        Specify:

                        Light source

                        Direction

                        Color temperature

                        Intensity

                        Shadow softness

                        Surface interaction

                        Examples:

                        Morning sunlight

                        5600K daylight

                        3200K tungsten

                        Large softbox

                        Window light

                        Practical lamp

                        Never use vague words such as:

                        beautiful

                        cinematic

                        moody

                        epic

                        Instead describe physical lighting.

                        ------------------------------------------------------------
                        TEXTURE
                        ------------------------------------------------------------

                        Always include physical detail.

                        Examples:

                        condensation

                        fabric weave

                        skin pores

                        metal brushing

                        glass reflections

                        wood grain

                        dust

                        mist

                        water droplets

                        ------------------------------------------------------------
                        CAMERA RULES
                        ------------------------------------------------------------

                        Choose EXACTLY ONE camera movement.

                        Examples:

                        Static tripod

                        Subtle push-in

                        Slow dolly

                        Gentle handheld follow

                        Very slow lateral drift

                        Locked-off shot with slight stabilization movement

                        The movement must remain identical for the entire clip.

                        Never switch movement.

                        Avoid:

                        Orbit

                        Whip pan

                        Fast dolly

                        Drone

                        Crane

                        Rapid zoom

                        Extreme handheld shake

                        ------------------------------------------------------------
                        LENS
                        ------------------------------------------------------------

                        Specify:

                        Lens

                        Depth of field

                        Camera reference

                        Examples:

                        35mm

                        50mm

                        85mm

                        f/2.8

                        f/4

                        Sony FX6

                        ARRI Alexa Mini

                        RED V-Raptor

                        Natural film grain.

                        Realistic motion blur.

                        ------------------------------------------------------------
                        AUDIO
                        ------------------------------------------------------------

                        Describe synchronized audio inside the prompt.

                        Include:

                        Ambient sounds

                        Object sounds

                        Footsteps

                        Fabric

                        Wind

                        Machinery

                        Room tone

                        Voice

                        Music (if appropriate)

                        Audio must naturally match visible action.

                        ------------------------------------------------------------
                        NO TEXT RULE
                        ------------------------------------------------------------

                        Never generate:

                        Readable text

                        Captions

                        Subtitles

                        Logos

                        Watermarks

                        Signs

                        Labels

                        UI text

                        HUD

                        Brand recognition must come only from:

                        Shape

                        Material

                        Color

                        Motion

                        ------------------------------------------------------------
                        MARKETING GOAL
                        ------------------------------------------------------------

                        Generate visuals that support the intended marketing purpose.

                        If this is:

                        Hook

                        Generate curiosity.

                        Problem

                        Generate recognition.

                        Feature

                        Generate understanding.

                        Benefit

                        Generate desire.

                        Proof

                        Generate trust.

                        Hero Close

                        Generate premium product recall.

                        CTA

                        Generate conversion intent.

                        Do not output these labels.

                        ------------------------------------------------------------
                        VOICE OVER
                        ------------------------------------------------------------

                        Generate one narrator.

                        Populate the voice_profile object completely.

                        Gender

                        Tone

                        Pitch

                        Pacing

                        Accent

                        Then generate ONE voice_over_segment.

                        Approximately 4–6 spoken words per second.

                        Natural narration.

                        No filler.

                        Only include a CTA if this scene itself is the final CTA scene.

                        ------------------------------------------------------------
                        SCENE IDENTIFIERS
                        ------------------------------------------------------------

                        DO NOT invent identifiers.

                        scene_number MUST exactly equal:

                        Scene.scene_number

                        beat MUST exactly equal:

                        Scene.beat

                        Never renumber.

                        Never guess.

                        Never modify.

                        ------------------------------------------------------------
                        STRICT SCHEMA
                        ------------------------------------------------------------

                        Return EXACTLY this JSON.

                        {
                        "scene_number": ${scene.scene_number},
                        "beat":"Copy Scene.beat exactly",

                        "prompt":"One continuous 6–8 sentence LTX-2.3 prompt following every rule above.",

                        "negative_prompt":"morphing, distortion, warping, flicker, jitter, temporal artifacts, duplicate limbs, anatomy errors, inconsistent identity, inconsistent lighting, low quality, CGI, cartoon, plastic skin, text, captions, subtitles, watermark, logo, UI, HUD, scene changes, camera cuts, transitions, montage, split screen, impossible physics, floating objects, sweeping camera movement, whip pan, orbit, drone, crane shot",

                        "voice_profile":{
                        "gender":"",
                        "tone":"",
                        "pitch":"",
                        "pacing":"",
                        "accent":""
                        },

                        "voice_over_segment":"",

                        "style":"premium, cinematic, photoreal, documentary-grade, direct response, single continuous take",

                        "ltx_settings_recommendation":"steps 36, CFG 3.2, 24fps",

                        "creative_rationale":[
                        "",
                        "",
                        ""
                        ]
                        }`;

const ollamaVideoPrompt = async (req, res) => {
    const jobId = Date.now().toString();
    progressStore.set(jobId, {
        progress: 0,
        characters: 0,
        scenes: 0,
        remaining: null,
        status: "running"
    });
    console.log(req.body);

    try {
        const {
            images = [],
            requirements = "",
            webContent = "",
            companyDetails = {},
            scenes = [],
            imagePrompts = [],
        } = req.body;

        if (!Array.isArray(images) || images.length === 0) {
            progressStore.set(jobId, {
                progress: 0,
                status: "failed",
                error: "Images array is required"
            });
            return res.status(400).json({
                success: false,
                error: "Images array is required",
            });
        }

        res.json({
            success: true,
            jobId,});

        console.log(scenes);

        const MAX_RETRIES = 3;
        const totalImages = images.length;
        const startTime = Date.now();

        // Estimate expected output size PER video-clip JSON object, so
        // progress climbs continuously as tokens stream in, not just in a
        // single jump when each image finishes.
        const estimatedCharsPerImage = 2000;
        const estimatedTotalCharacters = totalImages * estimatedCharsPerImage;

        let overallCharacters = 0; // cumulative chars across ALL images so far
        let completedImages = 0;

        const emitProgress = () => {
            const elapsed = (Date.now() - startTime) / 1000;

            let progress = (overallCharacters / estimatedTotalCharacters) * 100;
            progress = Math.min(progress, 99);

            const estimatedTotal = progress > 0 ? elapsed / (progress / 100) : 0;
            const remaining = estimatedTotal - elapsed;

            progressStore.set(jobId, {
                progress: Number(progress.toFixed(1)),
                characters: overallCharacters,
                scenes: completedImages,
                elapsed: Number(elapsed.toFixed(1)),
                remaining: remaining > 0 ? Number(remaining.toFixed(1)) : null,
                status: "running"
            });
        };

        const processImage = async (imageUrl, scene, imagePrompt, retry = 0) => {
            try {
                console.log("Processing:", imageUrl);
                console.log("Scene:", scene);
                console.log("Reference image prompt:", imagePrompt);

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

                const prompt = buildPrompt({ requirements, companyDetails, webContent, scene, imagePrompt });

                const response = await fetch("http://127.0.0.1:11434/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: "qwen2.5vl:3b",
                        stream: true,
                        format: "json",
                        options: {
                            num_ctx: 32768,
                            temperature: 0.1,
                            num_predict: 1200
                        },
                        messages: [
                            {
                                role: "user",
                                content: prompt,
                                images: [base64]
                            }
                        ]
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();

                    console.log("Status:", response.status);
                    console.log("Ollama Error:", errorText);

                    throw new Error(
                        `Ollama ${response.status}: ${errorText}`
                    );
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                let raw = "";
                let buffer = "";

                while (true) {
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
                                overallCharacters += json.message.content.length;
                                emitProgress();
                            }
                        } catch {
                            // Ignore incomplete JSON line
                        }
                    }
                }

                console.log("Raw Model Output:");
                console.log(raw);

                let cleanJson = raw
                    .replace(/```json/g, "")
                    .replace(/```/g, "")
                    .replace(/\\_/g, "_")
                    .trim();

                const start = cleanJson.indexOf("{");
                const end = cleanJson.lastIndexOf("}");

                cleanJson = cleanJson.substring(start, end + 1);
                cleanJson = cleanJson.replace(/[\u0000-\u001F]+/g, " ");

                // Throws if invalid -> caught below and retried
                return JSON.parse(cleanJson);

            } catch (err) {
                if (retry < MAX_RETRIES) {
                    console.log(
                        `Scene ${scene?.scene_number ?? "?"}: attempt ${retry + 1} failed (${err.message}). Retrying ${retry + 1}/${MAX_RETRIES}...`
                    );
                    return processImage(imageUrl, scene, imagePrompt, retry + 1);
                }

                console.log(`Scene ${scene?.scene_number ?? "?"}: failed after ${MAX_RETRIES} retries`);
                console.error(err.response?.data || err);

                return {
                    success: false,
                    error: err.message,
                };
            }
        };

        const results = [];

        for (let i = 0; i < images.length; i++) {
            results.push(
                await processImage(images[i], scenes[i], imagePrompts[i])
            );

            completedImages = i + 1;
            emitProgress();

            console.log(`--- Video prompt ${completedImages}/${totalImages} complete ---`);
        }

        progressStore.set(jobId, {
            progress: 100,
            characters: overallCharacters,
            scenes: totalImages,
            elapsed: Number(((Date.now() - startTime) / 1000).toFixed(1)),
            remaining: null,
            status: "completed",
            data: {
                success: true,
                total: results.length,
                data: results
            }
        });

        const category = companyDetails.title;
        const topic = requirements;

        let imagePrompt = await ImagePrompt.findOne({
            category
        });

        if (!imagePrompt) {
            imagePrompt = new ImagePrompt({
                category,
                topics: []
            });
        }

        let topicsFolder = imagePrompt.topics.find(t => t.name === topic);
        if (!topicsFolder) {
            imagePrompt.topics.push({
                name: topic,
                video_prompts: results
            });
        } else {
            topicsFolder.video_prompts = results;
        }

        await imagePrompt.save();
        console.log("imagePrompts", imagePrompts);
        console.log("All scene video prompts generated.");

    } catch (err) {
        console.error(err);

        progressStore.set(jobId, {
            progress: 0,
            status: "failed",
            error: err.message
        });

        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                error: err.message,
            });
        }
    }
};

export default ollamaVideoPrompt;