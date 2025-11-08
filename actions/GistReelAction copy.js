import {
  scrapeGistReelRecentPostsGrid,
  scrapeGistReelRecentPostsList,
  extractPostContentHtml,
} from "../SCRAPPERS/GistReelScrapper.js";
import { GetGistReelWPConent } from "../AGENTS/GistReelRewrite.js";
import { POSTGISTREELTOWORDPRESS } from "../WORPRESSPOSTER/gistreelwordpressposter.js";
import { filterNewLinks, saveArticle } from "../lib/Database/dbFunctions.js";
import { safeParseYAML } from "../lib/globalfunctions.js";

export async function GistReelAction() {
  const gistreel_categories = [
    { category_name: "viral-news", category_type: "grid" },
    { category_name: "politics", category_type: "list" },
    { category_name: "entertainment-news", category_type: "list" },
  ];

  for (const gistreel_category of gistreel_categories) {
    try {
      // ✅ Normalize category names
      let category = "general";
      switch (gistreel_category.category_name) {
        case "viral-news":
          category = "viral";
          break;
        case "politics":
          category = "politics";
          break;
        case "entertainment-news":
          category = "entertainment";
          break;
      }

      const category_link = `https://www.gistreel.com/${gistreel_category.category_name}/`;
      console.log(`🔍 Scraping category: ${category} (${category_link})`);

      // ✅ Scrape based on type
      let links =
        gistreel_category.category_type === "list"
          ? await scrapeGistReelRecentPostsList(category_link)
          : await scrapeGistReelRecentPostsGrid(category_link);

      if (!Array.isArray(links) || links.length === 0) {
        console.warn(`⚠️ No links found for ${category}`);
        continue;
      }

      const filtered = await filterNewLinks(links);
      if (!filtered?.success || !Array.isArray(filtered.data)) {
        console.warn(`⚠️ Could not filter links for ${category}`);
        continue;
      }

      console.log(`📰 Found ${filtered.data.length} new articles for ${category}`);

      for (const current_link of filtered.data) {
        try {
          console.log(`➡️ Processing: ${current_link}`);

          const html = await extractPostContentHtml(current_link);
          if (!html) {
            console.warn(`⚠️ Failed to extract HTML for ${current_link}`);
            continue;
          }

          const wordpressdata = await GetGistReelWPConent(html, category);
          if (!wordpressdata?.answer) {
            console.warn(`⚠️ No rewrite data returned for ${current_link}`);
            continue;
          }

          const parsedresult = safeParseYAML(wordpressdata.answer);
          if (!parsedresult) {
            console.error(`❌ Failed to parse YAML for ${current_link}`);
            continue;
          }

          const wordpressresult = await POSTGISTREELTOWORDPRESS(parsedresult);
          if (!wordpressresult?.data) {
            console.error(`❌ Failed to upload post to WordPress for ${current_link}`);
            continue;
          }   

          const article = {
            source: "Gist Reel",
            original_link: current_link,
            original_title: parsedresult.original_title || "",
            original_date: new Date().toISOString(),
            original_featured_image: parsedresult.featured_image || "",
            original_blog_content: html,
            wp_content: parsedresult.content || "",
            new_title: parsedresult.title || "",
            keywords: JSON.stringify(parsedresult.keywords || []),
            tags: JSON.stringify(parsedresult.tags || []),
            summary: JSON.stringify(parsedresult.summary || ""),
            category,
            wp_permalink: wordpressresult.data.link || "",
            status: wordpressresult.data.status || "unknown",
            description: wordpressresult.data.status || "No description",
          };

          await saveArticle(article);
          console.log(`✅ NEW ARTICLE SAVED at ${new Date().toLocaleTimeString()}`);
        } catch (innerErr) {
          console.error(`❌ Error processing article ${current_link}:`, innerErr.message);
        }
      }

      console.log(`✅ Finished processing ${category} (${filtered.data.length} new posts)`);
    } catch (err) {
      console.error(`❌ Error processing category ${gistreel_category.category_name}:`, err.message);
    }
  }

  console.log("🎯 All categories processed successfully.");
}
 