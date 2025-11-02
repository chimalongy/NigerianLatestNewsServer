 import YAML from "yaml";
 
 export function cleanJSON(text) {
  if (typeof text !== "string") {
    text = String(text);
  }

  // Remove backticks or markdown wrappers if any
  return text.replace(/```(?:json)?|```/g, '').trim();
}


// export function cleanAndParseJSON(input) {
 
//   const cleaned = input.replace(/^```json\s*|\s*```$/g, '').trim();

//   try {
//     return JSON.parse(cleaned);
//   } catch (error) {
//     //console.error("Invalid JSON:", error);
//     return null;
//   }
// }

// export function cleanAndParseJSON(input) {
//   if (typeof input !== "string") return null;

//   // Remove markdown/json wrappers and weird artifacts
//   let cleaned = input
//     .replace(/^```json\s*|\s*```$/g, '')
//     .replace(/<\｜begin▁of▁sentence｜>.*/g, '') // remove that weird tag and everything after
//     .trim();

//   // Fix common AI JSON issues
//   cleaned = cleaned
//     .replace(/[“”]/g, '"') // replace curly quotes with normal quotes
//     .replace(/[‘’]/g, "'") // replace curly apostrophes with normal ones
//     .replace(/\\n/g, '\n'); // optional: make newlines readable

//   // Truncate anything after the last closing brace
//   const lastBrace = cleaned.lastIndexOf('}');
//   if (lastBrace !== -1) cleaned = cleaned.slice(0, lastBrace + 1);

//   try {
//     return JSON.parse(cleaned);
//   } catch (error) {
//     console.error("Invalid JSON:", error.message);
//     console.log("👉 Near:", cleaned.slice(Math.max(0, lastBrace - 200), lastBrace + 200));
//     return null;
//   }
// }

export function cleanAndParseJSON(input) {
  if (typeof input !== "string") return null;

  let cleaned = input
    .replace(/^```json\s*|\s*```$/g, "")
    .replace(/<\｜begin▁of▁sentence｜>.*/g, "")
    .replace(/['`]\s*\+\s*/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();

  // Escape inner quotes within WP block comment attributes
  cleaned = cleaned.replace(
    /<!--\s*wp:[^>]*?{[^}]+}[^>]*-->/g,
    (match) => match.replace(/"/g, '\\"')
  );

  // Truncate anything after final closing brace
  const lastBrace = cleaned.lastIndexOf("}");
  if (lastBrace !== -1) cleaned = cleaned.slice(0, lastBrace + 1);

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Invalid JSON:", error.message);
    console.log("👉 Near:", cleaned.slice(lastBrace - 300, lastBrace + 300));
    return null;
  }
}




export function safeParseYAML(yamlText) {
  try {
    if (!yamlText || typeof yamlText !== "string") {
      throw new Error("Input is not a string");
    }

    // 🧹 Step 1: Remove markdown code fences and invisible markers
    let cleaned = yamlText
      .replace(/^```yaml\s*/i, "")
      .replace(/```$/i, "")
      .replace(/```<.*?>/g, "") // removes ```<｜begin▁of▁sentence｜> type
      .replace(/<\｜.*?\｜>/g, "") // removes OpenRouter/DeepSeek markers
      .trim();

    // 🧹 Step 2: Remove stray characters sometimes added at the end
    cleaned = cleaned.replace(/[`]+.*$/g, "").trim();

    // 🧹 Step 3: Ensure content field with `|` preserves indentation properly
    // (YAML requires indented block under `|`)
    // This ensures the parser won’t break if spacing is slightly off.
    cleaned = cleaned.replace(/\r/g, "");

    // 🧠 Step 4: Parse
    const parsed = YAML.parse(cleaned);

    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("Parsed YAML is not a valid object");
    }

    return parsed;
  } catch (error) {
    console.error("❌ YAML parsing failed:", error.message);
    return null;
  }
}
