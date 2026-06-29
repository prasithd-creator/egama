import hf from "../Config/huggingface.js";

const huggingFace = async (req, res) => {
    try {
        const { text, webContent } = req.body;
        console.log(text);

        // ----------------------------
        // 1. Normalize inputs
        // ----------------------------
        const content =
            typeof text?.content === "string"
                ? text.content
                : JSON.stringify(text?.content || text);

        const requirement =
            text?.matadata?.requirements ||
            text?.requirements ||
            "Null";
        console.log(requirement);

        // ----------------------------
        // 2. Prompt (STRICT JSON MODE)
        // ----------------------------
        const prompt = `
                You are a STRICT JSON generator and a senior marketing creative director.

                CRITICAL RULES:
                - Output ONLY valid JSON (no markdown, no explanation, no extra text)
                - Must start with { and end with }
                - All strings must be properly escaped
                - Do NOT include trailing commas
                - Do NOT break JSON format under any condition

                TASK:
                Generate 2 high-conversion marketing image prompts based on the requirement and website content.

                These prompts will be used for:
                - Ads (Google Ads / Meta Ads)
                - Landing pages
                - Brand campaigns
                - Social media marketing creatives

                REQUIREMENT:
                ${requirement}

                WEBSITE CONTENT:
                ${webContent}

                WEBSITE INFORMATION:
                - Company Name: ${text?.title}
                - Company Description: ${text?.description}
                - Website URL: ${text?.url}

                MARKETING STRATEGY RULES:
                - Analyze the requirement as a business goal (sales, awareness, lead generation, engagement)
                - Use website content to understand brand identity and target audience
                - If requirement is missing, generate based on brand positioning only
                - Every prompt must focus on conversion and marketing impact

                CREATIVE RULES FOR EACH PROMPT:
                - Each prompt must represent a HIGH-IMPACT ADVERTISEMENT SCENE
                - Focus on product/service value, not cinematic storytelling
                - Must include target audience context (business users, consumers, startups, etc.)
                - Include emotional marketing triggers (trust, urgency, desire, success, growth)
                - Include brand positioning (premium, affordable, innovative, luxury, etc.)
                - Include environment relevant to business usage (office, mobile, real-world usage, ecommerce, etc.)
                - Include lighting and style only if it supports marketing appeal (clean, modern, professional, vibrant)
                - Must feel like a professional AD CREATIVE used in Meta Ads or Landing Pages
                - Avoid artistic or movie-style storytelling

                OUTPUT FORMAT (STRICT):

                {
                "image_prompts": [
                    {
                    "prompt": "string (detailed marketing ad creative description focused on conversion)",
                    "style": "string (marketing visual style keywords like 'modern ad, clean UI, corporate branding')"
                    },
                    {
                    "prompt": "string (different marketing angle: trust / urgency / lifestyle / product usage)",
                    "style": "string (different marketing style direction)"
                    }
                ]
                }
        `;

        // ----------------------------
        // 3. Hugging Face Call
        // ----------------------------
        const response = await hf.chatCompletion({
            model: "Qwen/Qwen3-32B",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            max_tokens: 3000
        });

        let raw = response.choices[0].message.content;

        // ----------------------------
        // 4. Clean response (VERY IMPORTANT)
        // ----------------------------
        raw = raw
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");

        if (start === -1 || end === -1) {
            return res.status(500).json({
                success: false,
                error: "No valid JSON found in response",
                raw,
            });
        }

        const jsonString = raw.slice(start, end + 1);

        let parsed;

        try {
            parsed = JSON.parse(jsonString);
        } catch (err) {
            console.log("JSON PARSE FAILED:", err.message);
            return res.status(500).json({
                success: false,
                error: "Invalid JSON format from model",
                raw,
            });
        }

        const combinedPrompts = parsed.image_prompts.map((item) => {
            return `${item.prompt}. Style: ${item.style}. Camera: ${item.camera}.`;
        });

        // ----------------------------
        // 5. Response
        // ----------------------------
        return res.status(200).json({
            success: true,
            data: parsed,
            combinedPrompts,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

export default huggingFace;