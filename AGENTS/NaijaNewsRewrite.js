import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAllApiKeys } from "../lib/Database/dbFunctions.js";
import { NaijaNewsPrompt } from "./agentPrompts.js";

const OPENROUTER_MODEL = "deepseek/deepseek-r1-0528:free";
const GEMINI_MODEL = "gemini-2.5-flash";

export async function NaijaNewsRewrite(blogContent) {
  const API_KEYS = await getAllApiKeys();
  const MAX_RETRIES = 4;

  if (!blogContent) {
    console.error("⚠️ No blog content provided.");
    return { success: false, answer: null };
  }

  if (!API_KEYS.length) {
    console.error("🚫 No API keys found in the database.");
    return { success: false, answer: null };
  }

  // Iterate through available keys
  for (let keyIndex = 0; keyIndex < API_KEYS.length; keyIndex++) {
    const currentKeyObj = API_KEYS[keyIndex];
    const currentKey = currentKeyObj.api_key;
    const source = currentKeyObj.api_source?.toLowerCase() || "unknown";

    if (!currentKey) {
      console.warn(`⚠️ Skipping empty API key entry at index ${keyIndex}`);
      continue;
    }

    console.log(`🔑 Using API Key #${keyIndex + 1} (${source})`);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(
          `🚀 Attempt ${attempt}/${MAX_RETRIES} with key #${keyIndex + 1}`
        );

        let answer = "";

        if (source === "open router") {
          // 🧠 Use OpenRouter API (DeepSeek or similar)
          const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
              model: OPENROUTER_MODEL,
              messages: [
                {
                  role: "system",
                  content: NaijaNewsPrompt,
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
              timeout: 60000,
            }
          );

          answer = response?.data?.choices?.[0]?.message?.content?.trim();
        } else if (source === "gemini") {
          // 💎 Use Gemini API
          const genAI = new GoogleGenerativeAI(currentKey);
          const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `${NaijaNewsPrompt}\n\n${blogContent}` }] }],
          });

          answer = result?.response?.text()?.trim();
        } else {
          console.warn(
            `⚠️ Unknown API source: '${source}'. Skipping this key.`
          );
          break;
        }

        if (!answer) throw new Error("Empty response from API.");

        console.log(`✅ Successfully received response from ${source} API.`);
        return { success: true, answer };
      } catch (err) {
        const errorMessage =
          err.response?.data?.error?.message ||
          err.message ||
          "Unknown API error";

        const statusCode = err.response?.status;
        console.error(`❌ Attempt ${attempt} failed: ${errorMessage}`);

        // Handle rate limits and switch API key
        if (statusCode === 429 || /rate.?limit/i.test(errorMessage)) {
          console.warn(
            `⚠️ Rate limit hit for key #${keyIndex + 1} (${source}).`
          );
          break;
        }

        if (attempt < MAX_RETRIES) {
          const waitTime = Math.pow(2, attempt - 1) * 1000;
          console.log(`⏳ Retrying in ${waitTime / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          console.warn(
            "⚠️ Max retries reached for this key. Moving to next one..."
          );
        }
      }
    }
  }

  console.error("🚫 All API keys exhausted. No successful response.");
  return { success: false, answer: null };
}
