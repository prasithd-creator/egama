import fixJson from "./jsonFix.ts";
import progressStore from "../../utils/OllamaProgressStore.js";
import ImagePrompt from "../../Models/imagePrompt.ts";
import runningJobs from "../../utils/jobManager.js";


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

    const MAX_RETRIES = 3;
    const estimatedChars = 500; // a single prompt rewrite is short — tune as needed
    const overallStartTime = Date.now();

    try {
        // Respond immediately with the jobId — client polls /api/ollamaProgress/:jobId for updates
        res.json({ success: true, jobId });

        const { prompt, changes, scenes } = req.body;

        if (!prompt || !changes) {
            progressStore.set(jobId, {
                progress: 0,
                status: "failed",
                error: "prompt and changes are required"
            });
            return;
        }

        const generateRegeneratedPrompt = async (retry = 0) => {
            if (controller.signal.aborted) {
                throw new DOMException("Generation cancelled", "AbortError");
            }

            const messages = buildRegenerateMessages({ prompt, changes });

            let attemptCharacters = 0;

            const response = await fetch("http://127.0.0.1:11434/api/chat", {
                method: "POST",
                signal: controller.signal,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "llama3.1:8b",
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
                throw new Error("Failed to regenerate prompt");
            }

            const reader = response.body.getReader();
            activeReader = reader;
            const decoder = new TextDecoder();

            let raw = "";
            let buffer = "";

            try {
                while (true) {
                    if (controller.signal.aborted) {
                        console.log(`Job ${jobId}: aborted — cancelling reader and stopping stream`);
                        await reader.cancel().catch(() => { });
                        throw new DOMException("Generation cancelled", "AbortError");
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
                                attemptCharacters += json.message.content.length;

                                const elapsed = (Date.now() - overallStartTime) / 1000;

                                const progress = Math.min(
                                    (attemptCharacters / estimatedChars) * 99,
                                    99.9
                                );

                                const estimatedTotal = progress > 0 ? elapsed / (progress / 100) : 0;
                                const remaining = estimatedTotal - elapsed;

                                progressStore.set(jobId, {
                                    progress: Number(progress.toFixed(1)),
                                    characters: attemptCharacters,
                                    elapsed: Number(elapsed.toFixed(1)),
                                    remaining: remaining > 0 ? Number(remaining.toFixed(1)) : null,
                                    status: "running"
                                });
                            }
                        } catch {
                            // Ignore incomplete JSON line
                        }
                    }
                }
            } finally {
                activeReader = null;
            }

            if (!raw || raw.trim().length === 0) {
                if (controller.signal.aborted) {
                    throw new DOMException("Generation cancelled", "AbortError");
                }

                if (retry < MAX_RETRIES) {
                    console.log(`Job ${jobId}: Empty response from Ollama. Retrying ${retry + 1}/${MAX_RETRIES}...`);
                    return generateRegeneratedPrompt(retry + 1);
                }

                throw new Error(`Ollama returned an empty response after ${MAX_RETRIES} retries.`);
            }

            let cleanJson = raw
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            const start = cleanJson.indexOf("{");
            const end = cleanJson.lastIndexOf("}");

            if (start === -1 || end === -1) {
                if (controller.signal.aborted) {
                    throw new DOMException("Generation cancelled", "AbortError");
                }

                if (retry < MAX_RETRIES) {
                    console.log(`Job ${jobId}: No JSON object found. Retrying ${retry + 1}/${MAX_RETRIES}...`);
                    return generateRegeneratedPrompt(retry + 1);
                }

                throw new Error(`No JSON object found after ${MAX_RETRIES} retries.`);
            }

            cleanJson = cleanJson.substring(start, end + 1);
            cleanJson = cleanJson.replace(/[\u0000-\u001F]+/g, " ");

            let result;

            try {
                result = JSON.parse(fixJson(cleanJson));
            } catch (err) {
                if (controller.signal.aborted) {
                    throw new DOMException("Generation cancelled", "AbortError");
                }

                if (retry < MAX_RETRIES) {
                    console.log(`Job ${jobId}: JSON parse failed. Retrying ${retry + 1}/${MAX_RETRIES}...`);
                    return generateRegeneratedPrompt(retry + 1);
                }

                console.log(`Job ${jobId}: JSON PARSE FAILED`);
                console.log(cleanJson);
                throw err;
            }

            if (!result || typeof result.prompt !== "string" || result.prompt.trim().length === 0) {
                if (controller.signal.aborted) {
                    throw new DOMException("Generation cancelled", "AbortError");
                }

                if (retry < MAX_RETRIES) {
                    console.log(`Job ${jobId}: Empty prompt returned. Retrying ${retry + 1}/${MAX_RETRIES}...`);
                    return generateRegeneratedPrompt(retry + 1);
                }

                throw new Error(`Prompt missing after ${MAX_RETRIES} retries.`);
            }

            return result;
        };

        const result = await generateRegeneratedPrompt();

        progressStore.set(jobId, {
            progress: 100,
            characters: result.prompt.length,
            elapsed: Number(((Date.now() - overallStartTime) / 1000).toFixed(1)),
            remaining: null,
            status: "completed",
            data: result
        });

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