import progressStore from "../../utils/OllamaProgressStore.js";
import runningJobs from "../../utils/jobManager.js";

const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const OLLAMA_MODEL = "qwen2.5vl:3b";

/**
 * Extracts from raw markdown TEXT (already converted/provided by the caller):
 *  - product name (from a "Product: X" / "Product Name: X" line, or falls back to the first H1)
 *  - all image URLs referenced via markdown image syntax ![alt](url)
 */
// URL path fragments that indicate a non-product image (logos, icons, UI chrome, broken placeholders)
const NON_PRODUCT_PATH_HINTS = [
    "icon", "logo", "placeholder", "/offers/", "badge", "background",
    "banner", "bkg", "chevron", "sprite", "button"
];

function isLikelyProductImage(url) {
    const lower = url.toLowerCase();
    if (NON_PRODUCT_PATH_HINTS.some((hint) => lower.includes(hint))) return false;
    return true;
}

function extractProductFromMarkdown(markdown) {
    // Product name: "Product: X" / "Product Name: X" line, else first H1 heading
    let productName = null;
    const nameLineMatch = markdown.match(/^#{0,6}\s*Product(?:\s*Name)?\s*:\s*(.+)$/im);
    if (nameLineMatch) {
        productName = nameLineMatch[1].trim();
    } else {
        // Tolerate extra whitespace between "#" and the heading text (e.g. "#    Mustang®")
        const headingMatch = markdown.match(/^#[ \t]+(.+)$/m);
        if (headingMatch) {
            productName = headingMatch[1]
                .replace(/[\u00ae\u2122]/g, "") // strip ® and ™ symbols
                .replace(/\s+/g, " ")           // collapse repeated whitespace
                .trim();
        }
    }

    // Image URLs: markdown image syntax ![alt](url)
    let imageUrls = [];
    const imageRegex = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
    let match;
    while ((match = imageRegex.exec(markdown)) !== null) {
        imageUrls.push(match[1]);
    }

    // Fallback: bare image links if no markdown-image syntax was found
    if (imageUrls.length === 0) {
        const bareUrlRegex = /https?:\/\/\S+\.(?:png|jpe?g|webp|gif)\b/gi;
        let bareMatch;
        while ((bareMatch = bareUrlRegex.exec(markdown)) !== null) {
            imageUrls.push(bareMatch[0]);
        }
    }

    // De-dupe and filter out logos/icons/placeholders
    imageUrls = [...new Set(imageUrls)].filter(isLikelyProductImage);

    if (!productName) {
        throw new Error("Could not find a product name in the markdown text");
    }
    if (imageUrls.length === 0) {
        throw new Error("Could not find any product image URLs in the markdown text (all candidates were filtered out as logos/icons/placeholders)");
    }

    return { productName, imageUrls };
}

/** Downloads an image and returns it as a base64 string (Ollama wants raw base64, no data: prefix) */
async function fetchImageAsBase64(imageUrl) {
    const res = await fetch(imageUrl, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
        }
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch image ${imageUrl} (status ${res.status})`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    return buffer.toString("base64");
}

function buildMessages(productName, imageBase64) {
    return [
        {
            role: "system",
            content: `# PRODUCT IMAGE ANALYZER

## ROLE
You are an AI Product Recognition and Validation system.
Your task is ONLY to inspect one uploaded image and determine whether the requested product is present.
Do NOT compare images.
Do NOT generate prompts.
Do NOT describe the image unless necessary.
Return ONLY valid JSON.

## VALIDATION
Check:
- Product exists
- Correct product type
- Main object occupies most of the image
- Not heavily cropped
- Not blurred
- Not hidden
- Not blocked by other objects

## RESPONSE
Return ONLY JSON, in exactly this shape:

{
  "product_detected": true,
  "confidence": 0.96,
  "status": "PASS",
  "issues": [],
  "summary": "The requested product is clearly visible."
}

No markdown. No explanations. No additional text. Only JSON.`
        },
        {
            role: "user",
            content: `Product Name: ${productName}`,
            images: [imageBase64]
        }
    ];
}

/** Calls Ollama's streaming chat endpoint and returns the fully assembled JSON response */
async function analyzeImage({ productName, imageBase64, signal }) {
    const response = await fetch(OLLAMA_URL, {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            stream: true,
            format: "json",
            messages: buildMessages(productName, imageBase64),
            options: {
                temperature: 0.1,
                num_predict: 300
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to connect to Ollama (status ${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";
    let content = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep partial line for next chunk

        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const chunk = JSON.parse(line);
                if (chunk.message?.content) {
                    content += chunk.message.content;
                }
            } catch {
                // ignore malformed partial chunk
            }
        }
    }

    try {
        return JSON.parse(content);
    } catch {
        return {
            product_detected: false,
            confidence: 0,
            status: "FAIL",
            issues: ["Model did not return valid JSON"],
            summary: content.slice(0, 500)
        };
    }
}

const OllamaImageAnalysis = async (req, res) => {
    console.log("OllamaImageAnalysis endpoint hit");
    const jobId = Date.now().toString();
    const controller = new AbortController();
    const startTime = Date.now();

    runningJobs.set(jobId, controller);
    progressStore.set(jobId, {
        progress: 0,
        characters: 0,
        scenes: 0,
        remaining: null,
        elapsed: 0,
        status: "running"
    });

    // The caller already converted the source file to markdown text and sends it directly
    const { markdown } = req.body;

    if (!markdown || typeof markdown !== "string") {
        return res.status(400).json({
            success: false,
            message: "Request body must include a 'markdown' text field"
        });
    }

    // Respond immediately with the jobId; the client polls /api/ollamaProgress/:jobId
    res.json({ success: true, jobId });

    try {
        const { productName, imageUrls } = extractProductFromMarkdown(markdown);

        progressStore.set(jobId, {
            progress: 0,
            characters: 0,
            scenes: imageUrls.length,
            remaining: imageUrls.length,
            elapsed: Math.round((Date.now() - startTime) / 1000),
            status: "running"
        });

        const results = [];

        for (let i = 0; i < imageUrls.length; i++) {
            const imageUrl = imageUrls[i];
            let analysis;

            // Keep `elapsed` ticking in the progress store while THIS image is still
            // being fetched/analyzed, so polling doesn't see a frozen value for the
            // whole duration of a single (possibly slow) Ollama call.
            const heartbeat = setInterval(() => {
                progressStore.set(jobId, {
                    progress: Math.round((i / imageUrls.length) * 100),
                    characters: i,
                    scenes: imageUrls.length,
                    remaining: imageUrls.length - i,
                    elapsed: Math.round((Date.now() - startTime) / 1000),
                    status: "running"
                });
            }, 1000);

            try {
                const imageBase64 = await fetchImageAsBase64(imageUrl);
                analysis = await analyzeImage({
                    productName,
                    imageBase64,
                    signal: controller.signal
                });
            } catch (imageError) {
                // Don't let one bad image URL (404, timeout, blocked by the host, etc.)
                // fail the entire job — record it as a failed result and keep going.
                analysis = {
                    product_detected: false,
                    confidence: 0,
                    status: "FAIL",
                    issues: [imageError.message],
                    summary: "Could not fetch or analyze this image."
                };
            } finally {
                clearInterval(heartbeat);
            }

            results.push({ imageUrl, ...analysis });

            progressStore.set(jobId, {
                progress: Math.round(((i + 1) / imageUrls.length) * 100),
                characters: i + 1,
                scenes: imageUrls.length,
                remaining: imageUrls.length - (i + 1),
                elapsed: Math.round((Date.now() - startTime) / 1000),
                status: "running"
            });
        }

        progressStore.set(jobId, {
            progress: 100,
            characters: imageUrls.length,
            scenes: imageUrls.length,
            remaining: 0,
            elapsed: Math.round((Date.now() - startTime) / 1000),
            status: "completed",
            data: { jobId, productName, results }
        });
    } catch (error) {
        progressStore.set(jobId, {
            progress: 0,
            characters: 0,
            scenes: 0,
            remaining: null,
            elapsed: Math.round((Date.now() - startTime) / 1000),
            status: "failed",
            error: error.message
        });
    } finally {
        runningJobs.delete(jobId);
    }
};

export default OllamaImageAnalysis;