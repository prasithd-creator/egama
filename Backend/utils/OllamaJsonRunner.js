
import fixJson from "../Controller/Ollama/jsonFix.ts";

export async function runOllamaJsonJob({
    jobId,
    controller,
    progressStore,
    buildMessages,
    model,
    estimatedChars = 500,
    maxRetries = 3,
    isValid = (result) => !!result,
    overallStartTime = Date.now(),
    onReaderCreated
}) {
    async function retryOrThrow(retry, message) {
        if (controller.signal.aborted) {
            throw new DOMException("Generation cancelled", "AbortError");
        }
        if (retry < maxRetries) {
            console.log(`Job ${jobId}: ${message}. Retrying ${retry + 1}/${maxRetries}...`);
            return generateAttempt(retry + 1);
        }
        throw new Error(`${message} after ${maxRetries} retries.`);
    }

    async function finalizeAttempt(raw, retry) {
        if (!raw || raw.trim().length === 0) {
            return retryOrThrow(retry, "Empty response from Ollama");
        }

        let cleanJson = raw
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const start = cleanJson.indexOf("{");
        const end = cleanJson.lastIndexOf("}");

        if (start === -1 || end === -1) {
            return retryOrThrow(retry, "No JSON object found");
        }

        cleanJson = cleanJson.substring(start, end + 1).replace(/[\u0000-\u001F]+/g, " ");

        let result;
        try {
            result = JSON.parse(fixJson(cleanJson));
        } catch (err) {
            console.log(`Job ${jobId}: JSON PARSE FAILED`);
            console.log(cleanJson);
            return retryOrThrow(retry, "JSON parse failed");
        }

        if (!isValid(result)) {
            return retryOrThrow(retry, "Result failed validation");
        }

        return result;
    }

    async function generateAttempt(retry = 0) {
        if (controller.signal.aborted) {
            throw new DOMException("Generation cancelled", "AbortError");
        }

        const messages = buildMessages();

        const response = await fetch("http://127.0.0.1:11434/api/chat", {
            method: "POST",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
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
            throw new Error("Failed to reach Ollama");
        }

        const reader = response.body.getReader();
        if (onReaderCreated) onReaderCreated(reader);

        const decoder = new TextDecoder();
        let raw = "";
        let buffer = "";
        let attemptCharacters = 0;

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
                            const progress = Math.min((attemptCharacters / estimatedChars) * 99, 99.9);
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
                        // incomplete JSON line — ignore, wait for more chunks
                    }
                }
            }
        } finally {
            if (onReaderCreated) onReaderCreated(null);
        }

        return finalizeAttempt(raw, retry);
    }

    return generateAttempt();
}