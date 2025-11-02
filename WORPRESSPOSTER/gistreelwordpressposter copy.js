import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";

/**
 * Uploads a single image to WordPress and returns its new URL.
 */
async function uploadImageToWordPress(imageUrl, blogUrl, authHeader, altText = "") {
  try {
    console.log(`🖼️ Uploading image: ${imageUrl}`);
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const fileName = path.basename(imageUrl.split("?")[0]) || "image.jpg";
    const tempPath = path.join(process.cwd(), fileName);
    fs.writeFileSync(tempPath, Buffer.from(response.data, "binary"));

    const formData = new FormData();
    formData.append("file", fs.createReadStream(tempPath));
    formData.append("alt_text", altText);

    const uploadRes = await axios.post(`${blogUrl}/wp-json/wp/v2/media`, formData, {
      headers: { Authorization: authHeader, ...formData.getHeaders() },
    });

    fs.unlinkSync(tempPath);
    console.log(`✅ Uploaded image to WP: ${uploadRes.data.source_url}`);
    return uploadRes.data.source_url;
  } catch (err) {
    console.error(`❌ Failed to upload ${imageUrl}:`, err.message);
    return imageUrl; // fallback to original
  }
}

export async function POSTGISTREELTOWORDPRESS(data) {
  console.log("📤 Posting article to WordPress...");

  const username = "chimalongy";
  const password = process.env.WPAPPASSWORD21;
  const blogUrl = process.env.BLOG_URL;
  const authHeader = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

  try {
    // 🖼️ 1️⃣ Upload featured image
    let featuredMediaId = null;
    let featuredImageUrl = data.featured_image;
    if (featuredImageUrl) {
      console.log("🖼️ Uploading featured image...");
      const uploadedFeaturedUrl = await uploadImageToWordPress(
        featuredImageUrl,
        blogUrl,
        authHeader,
        data.title
      );

      // Fetch uploaded media ID for use in post payload
      const mediaRes = await axios.get(
        `${blogUrl}/wp-json/wp/v2/media?search=${encodeURIComponent(path.basename(uploadedFeaturedUrl))}`,
        { headers: { Authorization: authHeader } }
      );
      if (mediaRes.data.length > 0) {
        featuredMediaId = mediaRes.data[0].id;
        featuredImageUrl = uploadedFeaturedUrl;
      }
    }

    // 🧠 2️⃣ Replace and upload images inside content
    let content = data.content;
    const imageUrls = [...content.matchAll(/<img\s+[^>]*src="([^"]+)"/g)].map((m) => m[1]);
    if (imageUrls.length > 0) {
      console.log(`🧩 Found ${imageUrls.length} images in content...`);
      for (const url of imageUrls) {
        const newUrl = await uploadImageToWordPress(url, blogUrl, authHeader, data.title);
        content = content.replaceAll(url, newUrl);
      }
    }

    // 📂 3️⃣ Handle category
    let categoryId = null;
    if (data.category) {
      const catRes = await axios.get(
        `${blogUrl}/wp-json/wp/v2/categories?search=${encodeURIComponent(data.category)}`,
        { headers: { Authorization: authHeader } }
      );
      if (catRes.data.length > 0) {
        categoryId = catRes.data[0].id;
      } else {
        const newCat = await axios.post(
          `${blogUrl}/wp-json/wp/v2/categories`,
          { name: data.category },
          {
            headers: {
              Authorization: authHeader,
              "Content-Type": "application/json",
            },
          }
        );
        categoryId = newCat.data.id;
      }
    }

    // 🏷️ 4️⃣ Handle tags
    let tagIds = [];
    if (Array.isArray(data.tags) && data.tags.length > 0) {
      for (const tagName of data.tags) {
        const tagRes = await axios.get(
          `${blogUrl}/wp-json/wp/v2/tags?search=${encodeURIComponent(tagName)}`,
          { headers: { Authorization: authHeader } }
        );
        if (tagRes.data.length > 0) {
          tagIds.push(tagRes.data[0].id);
        } else {
          const newTag = await axios.post(
            `${blogUrl}/wp-json/wp/v2/tags`,
            { name: tagName },
            {
              headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
              },
            }
          );
          tagIds.push(newTag.data.id);
        }
      }
    }

    // 📝 5️⃣ Create the post with SEO metadata
    const focusKeyword = Array.isArray(data.keywords)
      ? data.keywords[0]
      : data.keywords || "";

    const seoDescription = data.meta_description || data.summary || "";
    const seoTitle = data.title || "";

    const postPayload = {
      title: data.title,
      content,
      status: "publish",
      featured_media: featuredMediaId,
      categories: categoryId ? [categoryId] : [],
      tags: tagIds,
      meta: {
        // Rank Math SEO
        _rank_math_focus_keyword: focusKeyword,
        _rank_math_description: seoDescription,
        _rank_math_title: seoTitle,
        // Yoast SEO
        _yoast_wpseo_focuskw: focusKeyword,
        _yoast_wpseo_metadesc: seoDescription,
        _yoast_wpseo_title: seoTitle,
      },
    };

    const postResponse = await axios.post(`${blogUrl}/wp-json/wp/v2/posts`, postPayload, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("✅ Post published successfully:", postResponse.data.link);
    return { success: true, data: postResponse.data };
  } catch (error) {
    if (error.response) {
      console.error("❌ WordPress API error:", error.response.data);
    } else {
      console.error("❌ Error posting to WordPress:", error.message);
    }
    return { success: false, data: null };
  }
}
