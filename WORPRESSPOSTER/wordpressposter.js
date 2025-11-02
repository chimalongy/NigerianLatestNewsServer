import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";

export async function POSTTOWORDPRESS(data) {
  console.log("📤 Posting article to WordPress...");

  console.log(data)
  const username = "chimalongy";
  const password = process.env.WPAPPASSWORD21;
  const blogUrl = process.env.BLOG_URL;

  const authHeader =
    "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

  try {
    // 1️⃣ Download featured image
    console.log("🖼️ Downloading featured image...");
    const imageResponse = await axios.get(data.featured_image, {
      responseType: "arraybuffer",
    });
    const tempFilePath = path.join(process.cwd(), "temp_image.jpg");
    fs.writeFileSync(tempFilePath, Buffer.from(imageResponse.data, "binary"));

    // 2️⃣ Upload image to WordPress
    console.log("📸 Uploading image to WordPress...");
    const formData = new FormData();
    formData.append("file", fs.createReadStream(tempFilePath));
    formData.append("alt_text", data.feautured_image_alt || data.title);

    const uploadResponse = await axios.post(
      `${blogUrl}/wp-json/wp/v2/media`,
      formData,
      {
        headers: { Authorization: authHeader, ...formData.getHeaders() },
      }
    );

    const featuredMediaId = uploadResponse.data.id;
    fs.unlinkSync(tempFilePath);
    console.log("✅ Image uploaded (ID:", featuredMediaId, ")");

    // 3️⃣ Handle category
    let categoryId = null;
    if (data.category) {
      const catRes = await axios.get(
        `${blogUrl}/wp-json/wp/v2/categories?search=${encodeURIComponent(
          data.category
        )}`,
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
 
    // 4️⃣ Handle tags
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

    // 5️⃣ Create post with BOTH Rank Math + Yoast SEO meta fields
    console.log("📝 Creating post...");

    const focusKeyword = Array.isArray(data.keywords)
      ? data.keywords[0]
      : data.keywords || "";

    const seoDescription = data.summary || "";
    const seoTitle = data.seo_title || data.title || "";

    const postPayload = {
      title: data.title,
      content: data.content,
      status: "publish",
      featured_media: featuredMediaId,
      categories: categoryId ? [categoryId] : [],
      tags: tagIds,

      // 🧠 SEO meta fields for BOTH Rank Math + Yoast
      meta: {
        // Rank Math
        _rank_math_focus_keyword: data.focus_keyphrase,
        _rank_math_description: data.meta_description,
        _rank_math_title: seoTitle,

        // Yoast SEO
        _yoast_wpseo_focuskw: data.focus_keyphrase,
        _yoast_wpseo_metadesc:  data.meta_description,
        _yoast_wpseo_title: seoTitle,
      },
    };

    const postResponse = await axios.post(
      `${blogUrl}/wp-json/wp/v2/posts`,
      postPayload,
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log("✅ Post published successfully:", postResponse.data.link);
    return { success: true, data: postResponse.data };
  } catch (error) {
    if (error.response) {
      console.error("❌ WordPress API error:", error.response.data);
    } else {
      console.error("❌ Error from wordpress poster:", error.message);
    }
    return { success: false, data: null };
  }
}
