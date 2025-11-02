// Requires: npm install axios cheerio
import axios from 'axios';
import * as cheerio from 'cheerio';


export async function scrapeGistReelRecentPostsGrid(url) {
  const links = [];

  try {
    // 1. Fetch the HTML content
    const { data: html } = await axios.get(url, {
      // Add headers to mimic a browser
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    // 2. Load the HTML into Cheerio
    const $ = cheerio.load(html);

    // 3. Manually format today's date to match the site's format (e.g., "Oct 23, 2025")
    
    let today = new Date();
let yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
today = yesterday

 

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const todayMonth = monthNames[today.getMonth()];
    const todayDay = today.getDate();
    const todayYear = today.getFullYear();
    const formattedDate = `${todayMonth} ${todayDay}, ${todayYear}`;

    console.log(formattedDate) 
 
    console.log(`\n--- SCRAPING SESSION ---`);
    console.log(`Targeting posts published on: ${formattedDate}`);

    let postsFound = 0;
    let linksExtracted = 0;

    // 4. Find all post elements using the inferred structural class
    $('.container-wrapper.post-element.tie-standard').each((index, element) => {
      postsFound++;
      const $post = $(element);

      // 5. Extract the date text
      // Selector: .post-meta .date
      const postDateText = $post.find('.post-meta .date').text().trim();
      
      // DEBUG: Log the date found in the post for verification
      console.log(`[DEBUG] Post #${postsFound} date found: "${postDateText}"`);
      
      // 6. Compare the post date with today's date
      if (postDateText === formattedDate) {
        
        // 7. Extract the link if the date matches
        // Selector: h2.entry-title a
        const linkElement = $post.find('h2.entry-title a');
        const link = linkElement.attr('href');

        if (link) {
          links.push(link);
          linksExtracted++;
          console.log(`[SUCCESS] Extracted link: ${link}`);
        }
      }
    });
    
    console.log(`\n--- SUMMARY ---`);
    console.log(`Total posts processed: ${postsFound}`);
    console.log(`Links extracted for ${formattedDate}: ${linksExtracted}`);

    return links;

  } catch (error) {
    console.error(`\n--- ERROR SCRAPING ---`);
    console.error(`Error scraping ${url}: ${error.message}`);
    // Return an empty array on error
    return [];
  }
}



export async function scrapeGistReelRecentPostsList(url) {
  const links = [];

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(html);

    const today = new Date();
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const formattedDate = `${monthNames[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;

    console.log(`\n--- SCRAPING SESSION ---`);
    console.log(`Targeting posts published on: ${formattedDate}`);

    let postsFound = 0;
    let linksExtracted = 0;

    // Adjusted selector for Gistreel’s structure
    $('article.post-element').each((i, el) => {
      postsFound++;

      const postDateText = $(el).find('.meta-item.date').text().trim();
      const link = $(el).find('h2.post-title a').attr('href');

      console.log(`[DEBUG] Post #${postsFound} date: "${postDateText}"`);

      if (postDateText === formattedDate && link) {
        links.push(link);
        linksExtracted++;
        console.log(`[SUCCESS] Extracted link: ${link}`);
      }
    });

    console.log(`\n--- SUMMARY ---`);
    console.log(`Total posts processed: ${postsFound}`);
    console.log(`Links extracted for ${formattedDate}: ${linksExtracted}`);

    return links;
  } catch (error) {
    console.error(`\n--- ERROR SCRAPING ---`);
    console.error(`Error scraping ${url}: ${error.message}`);
    return [];
  }
}


 

export async function extractPostContentHtml(url) {
  if (!url) {
    console.error("URL is required.");
    return '';
  }

  try {
    // 1. Fetch the HTML content using axios
    const { data: htmlContent } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      // Timeout is recommended for scraping
      timeout: 10000 
    });

    // 2. Load the HTML into Cheerio
    const $ = cheerio.load(htmlContent);

    // 3. Define candidate selectors for the main post component.
    const selectors = [
      '#the-post',             // Common ID for the single article container (high priority)
      '.entry-content',        // Often contains just the body text, but can be a good fallback
      '.single-content',       // Another common class for single post pages
      'article'                // The semantic HTML tag for an article (low priority)
    ];

    let postHtml = '';

    // 4. Iterate through selectors and use the first one that finds content
    for (const selector of selectors) {
      const $postElement = $(selector);
      
      if ($postElement.length) {
        // Use $.html($element) to get the outer HTML of the selected element, 
        // including its own tag, which provides the full context.
        postHtml = $.html($postElement.first());
        console.log(`Successfully extracted post content using selector: ${selector}`);
        break;
      }
    }

    if (!postHtml) {
      console.error("Could not find the main post section using standard selectors.");
    }
    
    // 5. Return the extracted HTML
    return postHtml;

  } catch (error) {
    console.error(`Error fetching or parsing URL (${url}): ${error.message}`);
    // Return an empty string on error
    return '';
  }
}

