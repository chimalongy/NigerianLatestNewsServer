import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { NaijaNewsRewrite } from "../AGENTS/NaijaNewsRewrite.js";
import {
  scrapeRecentPosts,
  extractPostContent,
} from "../SCRAPPERS/NewsNaijaScrapper.js";
import {
  createArticlesTable,
  filterNewLinks,
  saveArticle,
} from "../lib/Database/dbFunctions.js";
import { safeParseYAML } from "../lib/globalfunctions.js";
import { POSTTOWORDPRESS } from "../WORPRESSPOSTER/wordpressposter.js";


dotenv.config();


export async function NaijaNewsAction() {
  const categories = ["politics", "entertainment", "sports", "business"];
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
        const rewritten = await NaijaNewsRewrite(JSON.stringify(agent_data));
      
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
}
