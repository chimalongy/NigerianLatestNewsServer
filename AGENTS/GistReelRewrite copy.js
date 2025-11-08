import dotenv from "dotenv";
import axios from "axios";
import { getAllApiKeys } from "../lib/Database/dbFunctions.js";

dotenv.config();

// const MODEL = "deepseek/deepseek-chat-v3.1:free";
const MODEL = "deepseek/deepseek-r1-0528:free";

/**
 * Fetches rewritten and SEO-optimized WordPress content from OpenRouter API.
 * @param {string} blogContent - Raw HTML blog content to process.
 * @returns {Promise<{success: boolean, answer: string | null}>}
 */
export async function GetGistReelWPConent(blogContent, category) {
  let API_KEYS= await getAllApiKeys()
  console.log(blogContent)
  if (!blogContent){
    console.log("no blog content")
    return ;
  }
  const MAX_RETRIES = 4;

  for (let keyIndex = 0; keyIndex < API_KEYS.length; keyIndex++) {
    const currentKey = API_KEYS[keyIndex];
    console.log(`🔑 Using API Key ${keyIndex + 1}/${API_KEYS.length}`);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`🚀 Attempt ${attempt}/${MAX_RETRIES} with key ${keyIndex + 1}`);

        const response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: MODEL,
            messages: [
              {
                role: "system",
             content: `
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
   - tags: These should not be meaningless phrases. it should be seo friendly tags.
   - keywords: These should not be meaningless phrases. it should be seo friendly tags.
   - summary: seo friendly summary of the article.

Output in **YAML format** as follows:

\`\`\`yaml
original_title: "The original title of the post"
category:"${category}"
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
`

              },
              { role: "user", content: blogContent },
            ],
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${currentKey}`,
              "Content-Type": "application/json",
            },
            timeout: 60000, // 60 seconds timeout for each API call
          }
        );

        const answer = response?.data?.choices?.[0]?.message?.content?.trim();

        if (!answer) throw new Error("Empty response received from OpenRouter API.");

        console.log("✅ Response received successfully!");
        return { success: true, answer };
      } catch (err) {
        const errorMessage =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          "Unknown error";

        const statusCode = err.response?.status;

        console.error(`❌ Attempt ${attempt} failed: ${errorMessage}`);

        // Handle rate limiting
        if (statusCode === 429 || /rate.?limit/i.test(errorMessage)) {
          console.warn(`⚠️ Rate limit hit for key #${keyIndex + 1}. Switching to next key...`);
          break; // move to next API key
        }

        // Retry with exponential backoff
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

  console.error("🚫 All API keys exhausted. No successful response.");
  return { success: false, answer: null };
}
