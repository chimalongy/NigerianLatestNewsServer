// POSTTOWORDPRESS.js
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";

/**
 * Uploads an image from any URL to WordPress and returns the new image URL.
 */
async function uploadImageToWordPress(imageUrl, blogUrl, authHeader, altText = "") {
  try {
    console.log(`🖼️ Downloading image: ${imageUrl}`);
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });

    const fileName = path.basename(imageUrl.split("?")[0]) || "image.jpg";
    const tempPath = path.join(process.cwd(), `tmp_${Date.now()}_${fileName}`);
    fs.writeFileSync(tempPath, response.data);

    const formData = new FormData();
    formData.append("file", fs.createReadStream(tempPath));
    if (altText) formData.append("alt_text", altText);

    const uploadRes = await axios.post(`${blogUrl}/wp-json/wp/v2/media`, formData, {
      headers: { Authorization: authHeader, ...formData.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    fs.unlinkSync(tempPath);
    const newUrl = uploadRes.data.source_url;
    console.log(`✅ Uploaded to WordPress: ${newUrl}`);
    return { id: uploadRes.data.id, url: newUrl };
  } catch (err) {
    console.error(`❌ Failed uploading image: ${imageUrl}`, err.message);
    return { id: null, url: imageUrl };
  }
}

/**
 * Posts article (with rewritten images) to WordPress.
 */
export async function POSTGISTREELTOWORDPRESS(data) {
  console.log("📤 Posting article to WordPress...");

  const username = "chimalongy";
  const password = process.env.WPAPPASSWORD21;
  const blogUrl = process.env.BLOG_URL;
  const authHeader = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

  try {
    // 1️⃣ Upload featured image
    let featuredMediaId = null;
    if (data.featured_image) {
      const uploaded = await uploadImageToWordPress(data.featured_image, blogUrl, authHeader, data.title);
      featuredMediaId = uploaded.id;
      data.featured_image = uploaded.url;
    }

    // 2️⃣ Upload inline images and replace URLs
    let content = data.content;
    const imageUrls = [...content.matchAll(/<img[^>]*src="([^"]+)"/g)].map(m => m[1]);

    if (imageUrls.length > 0) {
      console.log(`🧩 Found ${imageUrls.length} inline images`);
      for (const oldUrl of imageUrls) {
        const uploaded = await uploadImageToWordPress(oldUrl, blogUrl, authHeader, data.title);
        content = content.replaceAll(oldUrl, uploaded.url);
      }
    }

    // 3️⃣ Create / find category
    let categoryId = null;
    if (data.category) {
      const res = await axios.get(`${blogUrl}/wp-json/wp/v2/categories?search=${encodeURIComponent(data.category)}`, {
        headers: { Authorization: authHeader },
      });
      if (res.data.length > 0) categoryId = res.data[0].id;
      else {
        const newCat = await axios.post(
          `${blogUrl}/wp-json/wp/v2/categories`,
          { name: data.category },
          { headers: { Authorization: authHeader, "Content-Type": "application/json" } }
        );
        categoryId = newCat.data.id;
      }
    }

    // 4️⃣ Tags
    let tagIds = [];
    if (Array.isArray(data.tags)) {
      for (const tag of data.tags) {
        const tagRes = await axios.get(`${blogUrl}/wp-json/wp/v2/tags?search=${encodeURIComponent(tag)}`, {
          headers: { Authorization: authHeader },
        });
        if (tagRes.data.length > 0) tagIds.push(tagRes.data[0].id);
        else {
          const newTag = await axios.post(
            `${blogUrl}/wp-json/wp/v2/tags`,
            { name: tag },
            { headers: { Authorization: authHeader, "Content-Type": "application/json" } }
          );
          tagIds.push(newTag.data.id);
        }
      }
    }

    // 5️⃣ Publish Post
    const payload = {
      title: data.title,
      content,
      status: "publish",
      featured_media: featuredMediaId,
      categories: categoryId ? [categoryId] : [],
      tags: tagIds,
      meta: {
        _rank_math_focus_keyword: data.focus_keyphrase,
        _rank_math_description: data.meta_description ,
        _rank_math_title: data.title || "",

        _yoast_wpseo_focuskw: data.focus_keyphrase,
        _yoast_wpseo_metadesc: data.meta_description,
        _yoast_wpseo_title: data.title,
      },
    };

    const postRes = await axios.post(`${blogUrl}/wp-json/wp/v2/posts`, payload, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log(`✅ Published: ${postRes.data.link}`);
    return { success: true, data: postRes.data };
  } catch (err) {
    if (err.response) {
      console.error("❌ WordPress API error:", err.response.data);
    } else {
      console.error("❌ Post error:", err.message);
    }
    return { success: false, data: null };
  }
}
