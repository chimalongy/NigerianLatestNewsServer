import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import { API_KEYS } from "../lib/API_KEYS.js";

//const MODEL = "deepseek/deepseek-chat-v3.1:free";
const MODEL = "deepseek/deepseek-r1-0528:free";

export async function GetWPConent(blogConent) {
  const MAX_RETRIES = 4;

  for (let keyIndex = 0; keyIndex < API_KEYS.length; keyIndex++) {
    const currentKey = API_KEYS[keyIndex];
    console.log(`🔑 Using API Key ${keyIndex + 1}/${API_KEYS.length}`);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(
          `🚀 Attempt ${attempt}/${MAX_RETRIES} with key ${keyIndex + 1}`
        );

        const response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: MODEL,
            messages: [
              {
                role: "system",
                content: `
You are a professional SEO content rewriter and WordPress Gutenberg content generator for a news website called "Nigerian Latest News".

You will receive a blog title and raw article content.

Your job:
1. Carefully analyze and understand the provided raw blog content.
2. Rewrite the title to make it more SEO-friendly while keeping the same meaning.
3. Rewrite the entire article to improve readability, clarity, and SEO optimization.
   - Maintain the original meaning and logical structure but use diffrent wordings.
   - Use a natural, professional tone that fits a Nigerian news site.
   - Improve sentence flow and readability.
   - Ensure less than 10% of sentences exceed 20 words.
4. Generate valid **WordPress Gutenberg block code**:
   - Use appropriate tags like:
     <!-- wp:paragraph --><p>...</p><!-- /wp:paragraph -->
     <!-- wp:heading {"level":2} --><h2>...</h2><!-- /wp:heading -->
     <!-- wp:image {"alt":"...","caption":"..."} --><figure>...</figure><!-- /wp:image -->
5. Remove unnecessary elements (social links, unrelated titles, navigation, sources).
6. Keep linked text but remove source URLs.
7. Include SEO meta fields:
   - **focus_keyphrase:** The primary SEO keyword or phrase the article targets.
   - **meta_description:** A short, engaging summary (150–160 characters) optimized for click-through.
   - **tags:** 4–8 SEO-friendly tags relevant to the topic.
   - **keywords:** 4–8 main keywords relevant to the article.
   - **summary:** A concise summary (1–3 sentences) of the rewritten content.

📦 OUTPUT FORMAT (in YAML):

\`\`\`yaml
title: "SEO-friendly rewritten title"
focus_keyphrase: "Primary SEO focus phrase"
meta_description: "150–160 character meta description for SEO"
tags:
  - SEO
  - relevant
  - tags
  - about
  - the
  - topic
keywords:
  - seo
  - keyword
  - related
  - to
  - the
  - article
summary: "Short summary of the rewritten post"
content: |
  The rewritten article in valid WordPress Gutenberg block code.
\`\`\`
              `,
              },
              { role: "user", content: blogConent },
            ],
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${currentKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        const answer = response?.data?.choices?.[0]?.message?.content;

        if (!answer || !answer.trim()) {
          throw new Error("Empty response received from OpenRouter API.");
        }

        console.log("✅ Response received successfully!");
        return { success: true, answer };
      } catch (err) {
        const errorMessage =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          "Unknown error";

        const errorCode =
          err.response?.status || err.response?.data?.error?.code || null;

        console.error(`❌ Attempt ${attempt} failed: ${errorMessage}`);

        if (
          errorCode === 429 ||
          errorMessage.toLowerCase().includes("rate limit")
        ) {
          console.warn(
            `⚠️ Rate limit exceeded for key #${keyIndex + 1}. Switching to next API key...`
          );
          break;
        }

        if (attempt < MAX_RETRIES) {
          const waitTime = Math.pow(2, attempt - 1) * 1000;
          console.log(`⏳ Retrying in ${waitTime / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          console.warn("⚠️ Max retries reached for this key. Moving on..."); 
        }
      }
    }
  }

  console.error("🚫 All API keys exhausted. No successful response.");
  return { success: false, answer: null };
}
  