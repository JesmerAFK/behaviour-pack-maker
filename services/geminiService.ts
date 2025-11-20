
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const SCRIPT_GENERATION_SYSTEM_INSTRUCTION = `You are an expert Minecraft Bedrock addon developer.
Your task is to generate or modify files for a Bedrock Behavior Pack.

You MUST return a strictly valid JSON object with the following structure:
{
  "files": [
    {
      "path": "scripts/main.js",
      "content": "... javascript code ..."
    },
    {
      "path": "entities/my_entity.json",
      "content": "... json content ..."
    }
  ],
  "explanation": "Brief description of changes"
}

Constraints:
- 'path' must be the relative path (e.g., 'scripts/utils.js', 'functions/tick.mcfunction').
- 'content' must be the raw text content of the file.
- Use '@minecraft/server' version '2.4.0-beta' and '@minecraft/server-ui' version '2.1.0-beta' for scripts.
- Do NOT use markdown formatting (no \`\`\`json).
- Return ONLY the JSON object.
- If the user asks to modify code, return the FULL content of the modified file(s).
- If a new file is needed (e.g., a database module), create it and also update 'scripts/main.js' to import it if necessary.
- Maintain existing functionality unless asked to change it.`;

const SCRIPT_DEBUGGER_SYSTEM_INSTRUCTION = `You are an expert Minecraft Bedrock script debugger. 
Your task is to analyze JavaScript code written for the Minecraft Script API.
Identify syntax errors, potential runtime errors, and logical issues.
If the code is valid, respond with "No issues found."`;

export interface AIFileResponse {
  files: { path: string; content: string }[];
  explanation?: string;
}

export async function generateProjectFiles(prompt: string, currentFiles: { path: string; content: string }[]): Promise<AIFileResponse> {
  try {
    // Create a context summary of existing files
    const fileContext = currentFiles.map(f => 
      `File: ${f.path}\n---\n${f.content}\n---\n`
    ).join("\n");

    const fullPrompt = `User Request: "${prompt}"

Current Project Files:
${fileContext}

Generate the necessary file updates/creations in JSON format.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: fullPrompt,
        config: {
            systemInstruction: SCRIPT_GENERATION_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json"
        }
    });

    const text = response.text;
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse AI JSON response", text);
        throw new Error("AI response was not valid JSON.");
    }
  } catch (error) {
    console.error("Error generating files:", error);
    throw error;
  }
}

export async function checkScript(scriptContent: string): Promise<string> {
  if (!scriptContent.trim()) {
    return "Script is empty. Nothing to check.";
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `Please check the following Minecraft script for errors:\n\n\`\`\`javascript\n${scriptContent}\n\`\`\``,
      config: {
        systemInstruction: SCRIPT_DEBUGGER_SYSTEM_INSTRUCTION,
        temperature: 0.1, 
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error checking script:", error);
    return `// An error occurred while checking the script: ${error instanceof Error ? error.message : String(error)}`;
  }
}


export async function generateImage(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A 512x512px minecraft pack icon, pixel art style. ${prompt}`,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: '1:1',
        }
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages[0].image.imageBytes;
    }
    throw new Error("No image was generated.");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}
