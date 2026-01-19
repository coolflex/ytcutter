import { GoogleGenAI, Type } from "@google/genai";
import { VideoHighlight } from "../types";

export const analyzeVideoHighlights = async (videoUrl: string): Promise<VideoHighlight[]> => {
  // Always obtain the API key exclusively from process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `I have a YouTube video at ${videoUrl}. Please act as an expert video editor. 
      Identify 3 likely high-quality segments for this video (e.g., intro, main point, conclusion).
      Return the response in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              startTime: { type: Type.STRING, description: "Format MM:SS" },
              endTime: { type: Type.STRING, description: "Format MM:SS" },
              label: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["startTime", "endTime", "label", "description"]
          }
        }
      }
    });

    // Access the .text property directly and trim it before parsing
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as VideoHighlight[];
  } catch (error) {
    console.error("Gemini Analysis failed:", error);
    return [
      { startTime: "00:00", endTime: "00:30", label: "Initial Catch", description: "The video opening." },
      { startTime: "01:00", endTime: "01:45", label: "Main Content", description: "The core discussion." }
    ];
  }
};