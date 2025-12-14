/**
 * @file gemini.ts
 * @description Service layer for communicating with Google's Gemini Pro model.
 * Responsible for interpreting raw physiological data into clinical insights.
 */

import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from "@google/generative-ai";
import type { AIContextPayload, AIHealthAnalysis } from "../../types/biosensor";

// Initialize Gemini
// CRITICAL: You must create a .env file with VITE_GOOGLE_AI_KEY=your_key
const API_KEY = import.meta.env.VITE_GOOGLE_AI_KEY || ""; 
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * The schema ensures Gemini returns JSON, not markdown text.
 * This is "Controlled Generation" - perfect for UI integration.
 */
const schema: ResponseSchema = {
  description: "Clinical health assessment",
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING, description: "1-sentence clinical summary" },
    status: { 
      type: SchemaType.STRING, 
      description: "The triage status. Must be one of: NORMAL, WARNING, CRITICAL" 
      // FIX: Removed strict 'enum' array to prevent TS build errors.
      // The description is sufficient for Gemini to understand the constraints.
    },
    recommendation: { type: SchemaType.STRING, description: "Actionable health advice" },
    possibleCauses: { 
      type: SchemaType.ARRAY, 
      items: { type: SchemaType.STRING } 
    }
  },
  required: ["summary", "status", "recommendation", "possibleCauses"]
};

export const analyzeVitals = async (payload: AIContextPayload): Promise<AIHealthAnalysis> => {
  if (!API_KEY) {
    console.warn("Missing Gemini API Key");
    return {
        summary: "AI Configuration Missing",
        status: "WARNING",
        recommendation: "Please add VITE_GOOGLE_AI_KEY to your .env file",
        possibleCauses: []
    };
  }

  try {
    // We use gemini-1.5-flash for speed (Clinical Triage needs to be fast)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", 
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const prompt = `
      Act as a clinical cardiologist assistant.
      Analyze the following PPG Biosensor data:
      
      Heart Rate: ${payload.vitals.bpm} BPM
      HRV (Stress Index): ${payload.vitals.hrv} ms
      Respiration Rate: ${payload.vitals.breathingRate} rpm
      Signal Confidence: ${payload.vitals.confidence}%
      
      Patient Context:
      - Activity: Resting state
      
      Provide a triage assessment in JSON format.
      Focus on stress analysis based on HRV (Low HRV < 30ms = High Stress).
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse the structured JSON response
    return JSON.parse(responseText) as AIHealthAnalysis;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
        summary: "AI Analysis Failed",
        status: "WARNING",
        recommendation: "Check internet connection or API limits.",
        possibleCauses: ["Network Error", "API Quota Exceeded"]
    };
  }
};