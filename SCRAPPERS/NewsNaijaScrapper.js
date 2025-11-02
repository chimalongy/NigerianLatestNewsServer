


// scrapeRecentPosts.js
import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Scrape links to posts published less than a day ago from NaijaNews Politics
 * @returns {Promise<string[]>} - Array of URLs
 */ 
export async function scrapeRecentPosts(url) {
  try {
    
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const posts = [];

    // Example selector: adjust if needed after inspecting site
    $(".mvp-blog-story-wrap, .mvp-blog-story-out, article").each((_, el) => {
      const link = $(el).find("a").attr("href");
      const dateText = $(el).find("time, .mvp-cd-date, .mvp-blog-story-date").text().trim();

      if (!link || !dateText) return;

      // Normalize the date text and check if it's within 24 hours
      const now = new Date();
      let postDate;

      // Handle relative dates like "5 hours ago", "12 mins ago"
      if (dateText.includes("hour") || dateText.includes("min")) {
        postDate = new Date(now - 1000 * 60 * 60 * 24 + 1000); // within 1 day
      } else {
        // Try parsing actual date
        postDate = new Date(dateText);
      }

      const hoursAgo = (now - postDate) / (1000 * 60 * 60);

      if (!isNaN(postDate) && hoursAgo <= 24) {
        posts.push(link);
      }
    });

    return posts;
  } catch (err) {
    console.error("Error scraping posts:", err.message);
    return [];
  }
}



// export async function extractPostContent(url) {
//   try {
//     // Fetch the HTML from the given URL
//     const { data: html } = await axios.get(url, {
//       headers: {
//         "User-Agent":
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
//       },
//     });

//     const $ = cheerio.load(html);

//     // Extract title
//     const title =
//       $("meta[property='og:title']").attr("content") ||
//       $("title").text().trim();

//     // Extract author
//     const author =
//       $("meta[name='author']").attr("content") ||
//       $("meta[property='article:author']").attr("content");

//     // Extract publication date
//     const published =
//       $("meta[property='article:published_time']").attr("content");

//     // Extract main image
//     const image =
//       $("meta[property='og:image']").attr("content") ||
//       $("meta[name='twitter:image']").attr("content");

//     // Extract full article body
//     const articleText =
//       $("#mvp-content-main p, article p")
//         .map((_, el) => $(el).text().trim())
//         .get()
//         .join("\n\n") || "Content not found";

//     return {
//       title,
//       author,
//       published,
//       image,
//       content: articleText,
//     };
//   } catch (err) {
//     console.error("Error extracting post content:", err.message);
//     return null;
//   }
// }


 

export async function extractPostContent(url) {
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(html);

    // 🧹 Remove unwanted sections (related posts, ads, footer, etc.)
    $(
      `
      .mvp-related-posts,
      .mvp-post-tags,
      .mvp-post-add-main,
      .mvp-post-gallery-text,
      .mvp-more-posts,
      .mvp-author-info-wrap,
      .mvp-soc-mob-list,
      #mvp-foot-copy,
      footer,
      .footer,
      .site-footer
    `
    ).remove();

    // Extract metadata
    const title =
      $("meta[property='og:title']").attr("content") ||
      $("title").text().trim();

    const author =
      $("meta[name='author']").attr("content") ||
      $("meta[property='article:author']").attr("content");

    const published =
      $("meta[property='article:published_time']").attr("content");

    const image =
      $("meta[property='og:image']").attr("content") ||
      $("meta[name='twitter:image']").attr("content");

    // 📝 Extract article text
    let articleText = $("#mvp-content-main p, article p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(
        (text) =>
          text &&
          !/You may like/i.test(text) &&
          !/Naija News/i.test(text) &&
          !/Polance Media/i.test(text) &&
          !/Contact us/i.test(text) &&
          !/^©/i.test(text)
      )
      .join("\n\n");

    // 🔪 In case footer slipped into one long string, cut it off safely
    const footerIndex = articleText.search(
      /©.*Naija News.*Polance Media|Contact us|Naija News, a division/i
    );
    if (footerIndex !== -1) {
      articleText = articleText.slice(0, footerIndex).trim();
    }

    return {
      title,
      author,
      published,
      image,
      content: articleText || "Content not found",
    };
  } catch (err) {
    console.error("Error extracting post content:", err.message);
    return null;
  }
}



