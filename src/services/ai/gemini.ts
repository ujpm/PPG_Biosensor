/**
 * @file gemini.ts
 * @description Service layer for Gemini AI.
 * UPDATED: Implements "Model Fallback" to bypass 429/404 errors.
 * Tries: Experimental -> Lite -> Standard.
 */

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { AIContextPayload, AIHealthAnalysis } from "../../types/biosensor";

const RAW_KEY = import.meta.env.VITE_GOOGLE_AI_KEY;
const API_KEY = RAW_KEY || ""; 

if (!API_KEY) {
    console.error("❌ GEMINI ERROR: VITE_GOOGLE_AI_KEY is missing.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// PRIORITY LIST:
// 1. Experimental: Often free/unlimited for testing.
// 2. Lite: Cheaper/lighter, often has different quotas.
// 3. Standard: The one that gave you the 429 error (last resort).
const MODELS_TO_TRY = [
    "gemini-2.0-flash-exp", 
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.5-flash"
];

// Define Schema
const schema = {
  description: "Clinical health assessment",
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING, description: "1-sentence clinical summary" },
    status: { type: SchemaType.STRING, description: "NORMAL, WARNING, or CRITICAL" },
    recommendation: { type: SchemaType.STRING, description: "Actionable health advice" },
    possibleCauses: { 
      type: SchemaType.ARRAY, 
      items: { type: SchemaType.STRING } 
    }
  },
  required: ["summary", "status", "recommendation", "possibleCauses"]
};

export const analyzeVitals = async (payload: AIContextPayload): Promise<AIHealthAnalysis> => {
  if (!API_KEY) return createErrorResponse("API Key Missing");

  // Loop through our list of models until one works
  for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`🤖 Attempting AI Analysis with model: ${modelName}...`);
        
        const model = genAI.getGenerativeModel({
          model: modelName, 
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema as any, 
          }
        });

        const prompt = `
          Act as a cardiologist assistant. Analyze:
          HR: ${payload.vitals.bpm} BPM
          HRV: ${payload.vitals.hrv} ms
          Resp: ${payload.vitals.breathingRate} rpm
          Confidence: ${payload.vitals.confidence}%
          
          Provide a triage assessment in JSON format.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        console.log(`✅ Success with ${modelName}`);
        return JSON.parse(responseText) as AIHealthAnalysis;

      } catch (error: any) {
        console.warn(`⚠️ Failed with ${modelName}:`, error.message);
        
        // If it's the last model and it failed, throw the error to be caught below
        if (modelName === MODELS_TO_TRY[MODELS_TO_TRY.length - 1]) {
            throw error;
        }
        // Otherwise, loop continues to next model...
      }
  }

  return createErrorResponse("All AI Models Failed");
};

function createErrorResponse(msg: string): AIHealthAnalysis {
    return {
        summary: msg,
        status: "WARNING",
        recommendation: "Check browser console for error details.",
        possibleCauses: ["Rate Limit Exceeded", "Region Restriction", "Billing Required"]
    };
}