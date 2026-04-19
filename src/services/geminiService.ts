/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Standard initialization for @google/generative-ai
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function analyzeImage(imageBase64: string, mimeType: string) {
  try {
    // Using gemini-1.5-flash-latest for high speed and cost efficiency
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBase64,
            },
          },
          {
            text: "Analyze this photo. Return a JSON object with: 'tags' (array of strings), 'qualityScore' (0-1), 'isBlurry' (boolean), 'description' (string), and 'detectedObjects' (array of strings).",
          },
        ],
      }],
    });

    const response = await result.response;
    const text = response.text();
    return JSON.parse(text || "{}");
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return null;
  }
}
