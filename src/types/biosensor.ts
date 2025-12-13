/**
 * @file biosensor.ts
 * @description Core type definitions for the PPG Biosensor application.
 * Defines the contract between the raw signal processing layer and the AI analysis layer.
 */

// ==========================================
// 1. SIGNAL PROCESSING TYPES
// ==========================================

/**
 * Represents a single frame of data extracted from the camera.
 * @property timestamp - Time in ms since scanning started.
 * @property value - The average redness intensity (0-255).
 */
export interface SignalPoint {
    timestamp: number;
    value: number;
}

/**
 * The calculated physiological metrics from the raw signal.
 */
export interface Vitals {
    /** Beats Per Minute (Standard: 60-100) */
    bpm: number;
    /** * Heart Rate Variability (SDNN/rMSSD in ms).
     * Higher is generally better (indicates adaptability).
     * < 20ms: High Stress / > 50ms: Healthy 
     */
    hrv: number;
    /** Respiratory Rate estimated from RSA (breaths/min) */
    breathingRate: number;
    /** Quality confidence score (0-100%) based on noise level */
    confidence: number;
}

// ==========================================
// 2. AI INTELLIGENCE TYPES
// ==========================================

/**
 * The strict JSON structure we expect from Gemini.
 * We do NOT want free text; we want data we can render.
 */
export interface AIHealthAnalysis {
    /** Short clinical summary (e.g., "Elevated heart rate with signs of acute stress.") */
    summary: string;
    
    /** * The triage status.
     * - NORMAL: Green UI
     * - WARNING: Yellow UI
     * - CRITICAL: Red UI (Seek help)
     */
    status: 'NORMAL' | 'WARNING' | 'CRITICAL';
    
    /** Specific actionable advice (e.g., "Perform 4-7-8 breathing.") */
    recommendation: string;
    
    /** * A list of potential causes based on the metrics.
     * e.g., ["Caffeine intake", "Sleep deprivation", "Anxiety"]
     */
    possibleCauses: string[];
}

/**
 * The context payload we send TO the AI.
 */
export interface AIContextPayload {
    vitals: Vitals;
    demographics?: {
        age: number; // e.g., 25
        gender?: string;
        activityLevel?: 'resting' | 'active';
    };
}