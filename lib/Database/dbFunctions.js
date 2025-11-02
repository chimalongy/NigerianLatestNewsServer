import { connectToSupabase } from "./db.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Creates the "articles" table in Supabase PostgreSQL if it doesn't exist.
 */
export async function createArticlesTable() {
  const pool = await connectToSupabase(); // <-- ensure you await the connection if it's async

  const tableName = process.env.ARTICLES || "articles"; // fallback name

  const query = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id SERIAL PRIMARY KEY,
      source VARCHAR(255),
      original_link TEXT,
      original_title TEXT,
      original_date VARCHAR(100),
      original_featured_image TEXT,
      original_blog_content TEXT,
      wp_content TEXT,
      new_title TEXT,
      keywords TEXT,
      wp_permalink TEXT,
      status TEXT,
      description TEXT,
      tags TEXT,
      category TEXT,
      summary TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await pool.query(query);
    console.log(`✅ Table '${tableName}' created (or already exists).`);
  } catch (error) {
    console.error("❌ Error creating table:", error.message);
  }
}

export async function saveArticle(article) {
  const pool = await connectToSupabase();

  const tableName = process.env.ARTICLES || "articles";

  const query = `
    INSERT INTO ${tableName} (
      source,
      original_link,
      original_title,
      original_date,
      original_featured_image,
      original_blog_content,
      wp_content,
      new_title,
      keywords,
      tags,
      category,
      created_at,
      wp_permalink,
      status,
      description
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12, $13, $14
    )
    RETURNING *;
  `;

  const values = [
    article.source || null,
    article.original_link || null,
    article.original_title || null,
    article.original_date || null,
    article.original_featured_image || null,
    article.original_blog_content || null,
    article.wp_content || null,
    article.new_title || null,
    article.keywords || null,
    article.tags || null,
    article.category || null,
    article.wp_permalink || null,
    article.status || null,
    article.description || null,
  ];

  try {
    const result = await pool.query(query, values);
    console.log("✅ Article saved:", result.rows[0].id);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error("❌ Error saving article:", error.message);
    return { success: false, error: error.message };
  }
}


// export async function filterNewLinks(links) {
//   const pool = await connectToSupabase(); // ✅ make sure connection is awaited
//   const tableName = process.env.ARTICLES || "articles";

//   // ✅ Validate input
//   if (!Array.isArray(links) || links.length === 0) {
//     return { success: true, data: [] };
//   }

//   try {
//     // ✅ Fetch existing links from DB
//     const query = `
//       SELECT original_link
//       FROM ${tableName}
//       WHERE original_link = ANY($1);
//     `;
//     const result = await pool.query(query, [links]);

//     // ✅ Convert to Set for fast lookup
//     const existingLinks = new Set(result.rows.map(r => r.original_link));

//     // ✅ Keep only links not in DB
//     const newLinks = links.filter(link => !existingLinks.has(link));

//     console.log(`✅ Found ${links.length - newLinks.length} existing link(s).`);
//     console.log(`✅ Returning ${newLinks.length} new link(s).`);

//     return { success: true, data: newLinks };
//   } catch (error) {
//     console.log("❌ Error filtering links:", error.message);
//     return { success: false, data: [] };
//   }
// }

export async function filterNewLinks(links) {
  const pool = await connectToSupabase();
  const tableName = process.env.ARTICLES || "articles";

  if (!Array.isArray(links) || links.length === 0) {
    return { success: true, data: [] };
  }

  try {
    // Use PostgreSQL EXCEPT to return only new links
    const query = `
      SELECT unnest($1::text[]) AS link
      EXCEPT
      SELECT original_link FROM ${tableName};
    `;

    const result = await pool.query(query, [links]);

    const newLinks = result.rows.map((r) => r.link);

    console.log(`✅ Returning ${newLinks.length} new link(s). Out of  ${links.length} passed.`);
    return { success: true, data: newLinks };
  } catch (error) {
    console.error("❌ Error filtering links:", error.message);
    return { success: false, data: [] };
  }
}
 