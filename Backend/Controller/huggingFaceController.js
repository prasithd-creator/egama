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

REQUIREMENT:
${requirement}

WEBSITE CONTENT:
${webContent}

WEBSITE INFORMATION:
- Company Name: ${text?.title}
- Company Description: ${text?.description}
- Website URL: ${text?.url}

MARKETING STRATEGY RULES:
- Analyze the requirement as a business goal (sales, awareness, lead generation, engagement).
- Use the website content to understand the brand identity, products, audience, and value proposition.
- Every prompt must focus on conversion and professional advertising quality.
- Create two completely different marketing concepts.

PROMPT LENGTH REQUIREMENTS:
- EACH "prompt" MUST contain between 600 and 700 words.
- Never generate fewer than 600 words.
- Write as one continuous descriptive paragraph.
- Every sentence should add new visual information.
- Avoid repetition and filler.
- Do not use bullet points.

EACH PROMPT MUST INCLUDE:
- Main product or service as the hero.
- Target audience.
- Customer pain points.
- Value proposition.
- Marketing objective.
- Premium commercial photography direction.
- Camera angle and composition.
- Foreground, middle ground, and background.
- Product placement.
- Human models if appropriate.
- Facial expressions and emotions.
- Wardrobe and styling.
- Color palette.
- Brand colors when applicable.
- Lighting setup.
- Depth of field.
- Lens type.
- Environmental details.
- Props.
- Motion or interaction.
- Lifestyle context.
- Call-to-action visual elements.
- Trust indicators.
- Premium advertising aesthetics.
- Ultra realistic commercial photography.
- High-end product advertising.
- Space for headline and CTA.
- Negative space for marketing copy.
- Composition optimized for Meta Ads, Google Ads, landing pages, and social media.

TEXT RULES:
- Do not generate unnecessary or decorative text.
- Do not add headlines, slogans, captions, CTA buttons, pricing, promotional copy, or watermarks.
- Do not generate random letters, gibberish, or unreadable typography.
- Official brand logos are allowed only if they naturally belong to the product or brand being advertised.
- Product packaging may include realistic branding if appropriate, but avoid excessive or incorrect text.
- The marketing message should be conveyed primarily through visuals rather than text.

STYLE FIELD:
The "style" field should contain 15–30 concise keywords describing the visual direction.

OUTPUT FORMAT (STRICT):

{
  "image_prompts": [
    {
      "prompt": "...400-600 words...",
      "style": "modern advertising, premium commercial photography, clean composition, luxury branding, ..."
    },
    {
      "prompt": "...400-600 words...",
      "style": "..."
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