import axios from "axios";
import { chromium } from "playwright";
import https from "https";

const httpsAgent = new https.Agent({
    keepAlive: true,
});

export async function downloadImage(url, siteUrl = "") {

    // ---------------------------
    // First Try Axios
    // ---------------------------
    try {

        console.log("Trying Axios...");

        const response = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 30000,
            maxRedirects: 10,
            httpsAgent,

            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Safari/537.36",

                "Accept":
                    "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",

                "Accept-Language": "en-US,en;q=0.9",

                "Referer": siteUrl || url,

                "Origin": new URL(siteUrl || url).origin,
            },
        });

        return {
            success: true,
            contentType: response.headers["content-type"],
            buffer: Buffer.from(response.data),
        };

    } catch (err) {

        console.log("Axios Failed:", err.code || err.message);

    }

    // ---------------------------
    // Fallback Playwright
    // ---------------------------

    console.log("Trying Playwright...");

    const browser = await chromium.launch({
        headless: true,
    });

    try {

        const page = await browser.newPage({

            userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Safari/537.36",

        });

        // Visit the website first (helps with cookies)
        if (siteUrl) {
            await page.goto(siteUrl, {
                waitUntil: "networkidle",
                timeout: 60000,
            });
        }

        const response = await page.goto(url, {
            waitUntil: "networkidle",
            timeout: 60000,
        });

        if (!response)
            throw new Error("No response received.");

        const buffer = await response.body();

        const headers = await response.allHeaders();

        return {
            success: true,
            contentType:
                headers["content-type"] || "image/png",
            buffer,
        };

    } finally {

        await browser.close();

    }

}