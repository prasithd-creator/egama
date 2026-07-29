import progressStore from "../../utils/OllamaProgressStore.js";
import ImagePrompt from "../../Models/imagePrompt.ts";
import runningJobs from "../../utils/jobManager.js";
import { runOllamaJsonJob } from "../../utils/OllamaJsonRunner.js";

const buildRegenerateMessages = ({ prompt, changes }) => [
    {
        role: "system",
        content: `You are an expert image prompt editor for LTX-2.3.
            Your task is to update an image prompt by applying a specific user request while leaving all other details untouched.

            ### STICK TO THESE GUIDELINES:
            - Output valid JSON containing a single key: "prompt".
            - Modify ONLY the specific detail requested in the change instruction.
            - Preserve all existing camera settings, lighting, style, composition, and subjects not mentioned in the change instruction.
            - Do not wrap the JSON in Markdown code blocks (e.g., no \`\`\`json). Output raw JSON only.

            ### EXAMPLES

            Example 1:
            Existing Prompt: "A high-resolution photo of a black cat sitting on a wooden bench, dramatic side lighting, 85mm lens, f/1.8."
            Requested Change: "Change the cat color to orange."
            Output: {"prompt": "A high-resolution photo of a orange cat sitting on a wooden bench, dramatic side lighting, 85mm lens, f/1.8."}

            Example 2:
            Existing Prompt: "Cinematic wide shot of a cyberpunk street at night, neon reflections on wet pavement, foggy atmosphere, 35mm film."
            Requested Change: "Add a flying car in the sky."
            Output: {"prompt": "Cinematic wide shot of a cyberpunk street at night with a flying car in the sky, neon reflections on wet pavement, foggy atmosphere, 35mm film."}`
    },
    {
        role: "user",
        content: `[EXISTING PROMPT]
            ${prompt}

            [REQUESTED CHANGE]
            ${changes}

            Apply the requested change to the existing prompt and output the raw JSON object.`
    }
];

const isValidRegeneratedPrompt = (result) =>
    !!result && typeof result.prompt === "string" && result.prompt.trim().length > 0;

const reGenerateOllamaPrompt = async (req, res) => {
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
        status: "running"
    });

    const overallStartTime = Date.now();

    try {
        // Respond immediately with the jobId — client polls /api/ollamaProgress/:jobId for updates
        res.json({ success: true, jobId });

        const { prompt, changes, category, brand, topic, sceneNumber, generation_type } = req.body;
        console.log("Prompt:", prompt, "Changes:", changes, "Category:", category, "Brand:", brand, "Topic:", topic, "Scene Number:", sceneNumber);

        if (!prompt || !changes) {
            progressStore.set(jobId, {
                progress: 0,
                status: "failed",
                error: "prompt and changes are required"
            });
            return;
        }

        const result = await runOllamaJsonJob({
            jobId,
            controller,
            progressStore,
            overallStartTime,
            model: "llama3.1:8b",
            estimatedChars: 500,
            maxRetries: 3,
            buildMessages: () => buildRegenerateMessages({ prompt, changes }),
            isValid: isValidRegeneratedPrompt,
            onReaderCreated: (reader) => {
                activeReader = reader;
            }
        });

        progressStore.set(jobId, {
            progress: 100,
            characters: result.prompt.length,
            elapsed: Number(((Date.now() - overallStartTime) / 1000).toFixed(1)),
            remaining: null,
            status: "completed",
            data: result
        });

        console.log(result);

        const doc = await ImagePrompt.findOneAndUpdate(
            {
                category: category,
                "brands.name": brand,
                "brands.topics.name": topic,
                [`brands.topics.${generation_type}.scene_number`]: sceneNumber
            },
            {
                $set: {
                    [`brands.$[brand].topics.$[topic].${generation_type}.$[img].prompt`]: result.prompt
                }
            },
            {
                arrayFilters: [
                    { "brand.name": brand },
                    { "topic.name": topic },
                    { "img.scene_number": sceneNumber }
                ],
                returnDocument: "after"
            }
        );

        if (doc) {
            console.log(`Job ${jobId}: updated prompt in database.`);
        } else {
            console.log(`Job ${jobId}: no matching document found.`);
        }

        console.log(`Job ${jobId}: regenerated prompt complete.`);
    } catch (error) {
        const wasCancelled = error.name === "AbortError" || controller.signal.aborted;

        if (wasCancelled) {
            console.log(`Job ${jobId}: cancelled by user.`);
        } else {
            console.log(error);
        }

        progressStore.set(jobId, {
            progress: 0,
            status: wasCancelled ? "cancelled" : "failed",
            error: wasCancelled ? "Generation cancelled by user" : error.message
        });
    } finally {
        controller.signal.removeEventListener("abort", onAbort);
        runningJobs.delete(jobId);
    }
};

export default reGenerateOllamaPrompt;