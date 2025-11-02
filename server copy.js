// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GetWPConent } from "./AGENTS/GenerateWordPress.js";
import {
  scrapeRecentPosts,
  extractPostContent,
} from "./SCRAPPERS/NewsNaijaScrapper.js";
import {
  createArticlesTable,
  filterNewLinks,
  saveArticle,
} from "./lib/Database/dbFunctions.js";
import { safeParseYAML } from "./lib/globalfunctions.js";
import { POSTTOWORDPRESS } from "./WORPRESSPOSTER/wordpressposter.js";
import { getGistReelPostLinks } from "./SCRAPPERS/GistReelScrapper.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic routes
app.get("/", (req, res) => {
  res.send("✅ Server is running and background scraper is active...");
});

app.post("/api/data", (req, res) => {
  const { name } = req.body;
  res.json({ message: `Hello, ${name}!` });
});

// --- Categories to loop through ---
const categories = ["politics", "entertainment", "sports", "business"];

// --- Main Scraper Loop ---
async function runScraperLoop() {
  console.log("🔁 Starting background news scraper...");

  // Ensure DB table exists
  //await createArticlesTable();
  
  while (true) {
    for (const category of categories) {
      try {
        console.log(`📰 Fetching latest posts for category: ${category}`);

        const newsnaija_link = `https://www.naijanews.com/${category}/`;
        const content_links = await scrapeRecentPosts(newsnaija_link);

        const filtered = await filterNewLinks(content_links);
        if (!filtered.success) {
          console.log(`⚠️ Could not filter links for ${category}`);
          continue;
        }   

        for (const current_link of filtered.data) {
          console.log("🔗 Scraping post:", current_link);

          const blog_content = await extractPostContent(current_link);
          if (!blog_content?.content) continue;

          const agent_data = {
            title: blog_content.title,
            blog_post: blog_content.content,
          };

          // Generate rewritten content
          const rewritten = await GetWPConent(JSON.stringify(agent_data));
          if (!rewritten?.answer) continue;

          const parsed = safeParseYAML(rewritten.answer);
          if (!parsed) continue;
  
          parsed.category = category; 
          parsed.featured_image = blog_content.image;

          // Post to WordPress 
          const post_result = await POSTTOWORDPRESS(parsed);

          if (post_result?.success) {
            const article = {
              source: "Nigerian Latest News",
              original_link: current_link,
              original_title: blog_content.title,
              original_date: new Date().toISOString(),
              original_featured_image: blog_content.image,
              original_blog_content: blog_content.content,
              wp_content: parsed.content,
              new_title: parsed.title,
              keywords: JSON.stringify(parsed.keywords),
              tags: JSON.stringify(parsed.tags),
              summary: JSON.stringify(parsed.summary),
              category,
              wp_permalink: post_result.data.link,
              status: post_result.data.status,
              description: post_result.data.status,
            };

            console.log(`✅ NEW ARTICLE SAVED at ${new Date().toTimeString()}`);
            await saveArticle(article);
          }
        }
      } catch (err) {
        console.error(`❌ Error processing ${category}:`, err.message);
      }
    }

    console.log("⏰ Waiting 10 minutes before next scrape cycle...");
    await new Promise((resolve) => setTimeout(resolve, 10 * 60 * 1000)); // 10 mins
  }
}

// --- Start Server ---
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

  // Start the background scraper automatically
  // runScraperLoop().catch((err) =>
  //   console.error("🔥 Background scraper crashed:", err)
  // );


// Example usage:

  getGistReelPostLinks.then((links) => {
    console.log(`📰 Found ${links.length} post(s) from today:`);
    console.log(links);
  })
  .catch((err) => {
    console.error('Error fetching posts:', err.message);
  });




});
  