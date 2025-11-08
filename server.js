// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { NaijaNewsAction } from "./actions/NaijaNewsAction.js";
import { GistReelAction } from "./actions/GistReelAction.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5500;

app.use(cors());
app.use(express.json());

// 🏠 Root route
app.get("/", (req, res) => {
  res.send("✅ Server is running. Background scraper is active...");
});

// 🧪 Test route
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Test route working perfectly 🚀",
    timestamp: new Date().toISOString(),
  });
});

// 🔁 Main Scraper Loop
async function runScraperLoop() {
  console.log("🔁 Starting background news scraper...");

  // Ensure DB exists if necessary
  // await createArticlesTable();
 
  while (true) {
    try {
   
      console.log("📰 Running NaijaNewsAction...");
      await NaijaNewsAction()
      console.log("📰 Running GistReelAction...");
     await GistReelAction();
      console.log("✅ Scrape cycle complete.");
    } catch (err) {
      console.error("🔥 Error in scraper loop:", err.message);
    } 

    console.log("⏰ Waiting 10 minutes before next scrape cycle...");
    await new Promise((resolve) => setTimeout(resolve, 3 * 60 * 1000)); // 10 mins
  }
}

// 🚀 Start Server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  runScraperLoop().catch((err) =>
    console.error("🔥 Background scraper crashed:", err)
  );
});
 