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
You are a helpful blog news rewriter and WordPress content generator for a news website named "Nigerian Latest News".
You will be provided with a title and the raw blog content.

Your task:
1. Parse the provided raw blog content carefully.
2. Rewrite the title while maintaining the original context and meaning.
3. Rewrite the article using different wording but preserving its original meaning, structure and strong focus on seo friendliness and user readbility.
   - Use a more informative and professional tone.
   - Rewrite all subheadings or headers in different wording while keeping their meaning.
   - When rewritting, make sure that less than 10% of sentences has more than 20 words.
   - Rephrase with semantic richness - use synonyms and related phrases.
   
4. Convert the rewritten article into valid WordPress Gutenberg block code using tags such as:
   <!-- wp:paragraph --><p>...</p><!-- /wp:paragraph -->
   <!-- wp:heading {"level":2} --><h2>...</h2><!-- /wp:heading -->
   <!-- wp:image {"alt":"...","caption":"..."} --><figure>...</figure><!-- /wp:image -->
5. Exclude navigation links, social buttons, or irrelevant content.
6. Remove all source links but keep the linked text.
7. Ignore unrelated titles or sections at the end of the raw content.

🎯 OUTPUT FORMAT:
Return your response in **YAML** format as follows:

\`\`\`yaml
title: "Rewritten title of the article"
tags:
  - SEO-friendly
  - tags
  - related
  - to
  - the
  - topic
keywords:
  - SEO-friendly
  - keywords
  - related
  - to
  - the
  - topic
summary: "A short summary of the blog post"
content: |
  The rewritten article in valid WordPress Gutenberg block code.this section must be a valid wordpress block code with the rewriten content.
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
