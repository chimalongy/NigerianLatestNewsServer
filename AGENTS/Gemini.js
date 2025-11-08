import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAllApiKeys } from "../lib/Database/dbFunctions.js";

export async function GetGistReelWPConent(blogContent, category) {
  const API_KEYS = await getAllApiKeys();

  if (!blogContent) {
    console.log("❌ No blog content provided.");
    return { success: false, answer: null };
  }

  if (!API_KEYS.length) {
    console.error("🚫 No API keys found in the database.");
    return { success: false, answer: null };
  }

  const MAX_RETRIES = 4;
  const MODEL = "gemini-2.5-flash"; // or "gemini-1.5-flash" for faster/cheaper runs

  for (let keyIndex = 0; keyIndex < API_KEYS.length; keyIndex++) {
    const currentKeyObj = API_KEYS[keyIndex];
    const currentKey = currentKeyObj.api_key; // ✅ Access the api_key property

    if (!currentKey) {
      console.warn(`⚠️ Skipping empty API key entry at index ${keyIndex}`);
      continue;
    }

    console.log(
      `🔑 Using Gemini API Key ${keyIndex + 1}/${API_KEYS.length}` +
      (currentKeyObj.api_source ? ` (source: ${currentKeyObj.api_source})` : "")
    );

    // ✅ Initialize Gemini client with the actual key string
    const genAI = new GoogleGenerativeAI(currentKey);
    const model = genAI.getGenerativeModel({ model: MODEL });

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`🚀 Attempt ${attempt}/${MAX_RETRIES} with key ${keyIndex + 1}`);

        const prompt = `
You are a helpful HTML parser and WordPress content generator.

Your task:
1. Parse the provided raw HTML blog content and extract ONLY the article body (ignore menus, ads, footers, and unrelated links).
2. Rewrite the article using different wording while preserving meaning, structure, and SEO friendliness.
   - Maintain a professional, informative tone.
   - Ensure less than 10% of sentences exceed 20 words.
   - Rephrase subheadings while keeping meaning.
   - Use synonyms and semantically rich phrasing.
3. Convert the rewritten article into valid WordPress Gutenberg block code using:
   <!-- wp:paragraph --><p>...</p><!-- /wp:paragraph -->
   <!-- wp:heading {"level":2} --><h2>...</h2><!-- /wp:heading -->
   <!-- wp:image {"alt":"...","caption":"..."} --><figure>...</figure><!-- /wp:image -->
4. Exclude navigation links, ads, and unrelated sections.
5. Images should be large and centered.
6. Tables should be compact and centered.
7. Remove all external URLs but keep anchor text.
8. Add SEO metadata:
   - featured_image (URL or path to main image)
   - focus_keyphrase
   - meta_description
   - tags: These should be SEO-friendly and relevant.
   - keywords: These should be meaningful and SEO optimized.
   - summary: Short SEO-friendly summary.

Output in **YAML format** as follows:

\`\`\`yaml
original_title: "The original title of the post"
category: "${category}"
title: "SEO-friendly rewritten title"
featured_image: "https://example.com/path/to/featured-image.jpg"
focus_keyphrase: "Primary SEO focus phrase"
meta_description: "150–160 character meta description"
tags:
  - example
  - tags
  - related
keywords:
  - keyword
  - list
summary: "Short summary of the rewritten post"
content: |
  The rewritten article in valid WordPress Gutenberg block code.
\`\`\`
        `;

        // ✅ Generate content using Gemini
        const result = await model.generateContent({
          contents: [
            { role: "user", parts: [{ text: `${prompt}\n\n${blogContent}` }] },
          ],
        });

        const answer = result?.response?.text()?.trim();
        if (!answer) throw new Error("Empty response received from Gemini API.");

        console.log("✅ Gemini response received successfully!");
        return { success: true, answer };

      } catch (err) {
        const errorMessage = err.message || "Unknown Gemini API error";
        console.error(`❌ Attempt ${attempt} failed: ${errorMessage}`);

        // Retry logic with exponential backoff
        if (attempt < MAX_RETRIES) {
          const waitTime = Math.pow(2, attempt - 1) * 1000;
          console.log(`⏳ Retrying in ${waitTime / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          console.warn("⚠️ Max retries reached for this key. Moving to next one...");
        }
      }
    }
  }

  console.error("🚫 All Gemini API keys exhausted. No successful response.");
  return { success: false, answer: null };
}
