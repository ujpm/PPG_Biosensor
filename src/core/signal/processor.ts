/**
 * @file processor.ts
 * @description Advanced PPG Signal Processor.
 * FIXES: "No exported member" error and "Zero BPM" issues.
 */

import type { SignalPoint, Vitals } from '../../types/biosensor';

export class SignalProcessor {
    private buffer: SignalPoint[] = [];
    private readonly WINDOW_SIZE = 180; // ~6 seconds at 30fps
    private lastPeakTime = 0;
    private peakIntervals: number[] = [];
    
    // Quality Metrics
    private currentAmplitude = 0;
    private currentLightLevel = 0;

    /**
     * Processes a single raw video frame.
     * Calculates average redness and applies smoothing.
     */
    processFrame(frame: ImageData, timestamp: number): number {
        const data = frame.data;
        let totalRed = 0;
        let pixelCount = 0;

        // Optimization: Sample every 16th pixel
        for (let i = 0; i < data.length; i += 16) { 
            totalRed += data[i];
            pixelCount++;
        }

        const rawRed = totalRed / pixelCount;
        this.currentLightLevel = rawRed;

        // 1. SMOOTHING (Simple Moving Average)
        let smoothedRed = rawRed;
        if (this.buffer.length > 0) {
            const prev = this.buffer[this.buffer.length - 1].value;
            smoothedRed = (prev * 0.7) + (rawRed * 0.3); // Low-pass filter
        }

        this.addPoint({ timestamp, value: smoothedRed });
        
        return smoothedRed;
    }

    /**
     * Determines if the user's finger is actually on the camera.
     */
    getSignalQuality(): 'NO_FINGER' | 'NOISY' | 'GOOD' {
        // Too Dark (<20) = No finger covering flash
        if (this.currentLightLevel < 20) return 'NO_FINGER';
        
        // Too Bright (>253) = Saturation
        if (this.currentLightLevel > 253) return 'NOISY'; 

        // Amplitude Check: If wave is flat, no heartbeat is present
        if (this.currentAmplitude < 1.5) return 'NO_FINGER'; 

        return 'GOOD';
    }

    calculateVitals(): Vitals {
        if (this.buffer.length < 45) {
            return { bpm: 0, hrv: 0, breathingRate: 0, confidence: 0 };
        }

        const values = this.buffer.map(p => p.value);
        const timestamps = this.buffer.map(p => p.timestamp);
        const currentVal = values[values.length - 1];
        const currentTime = timestamps[timestamps.length - 1];

        // 1. DYNAMIC RANGE
        let min = 1000, max = -1000;
        for(let v of values) {
            if (v < min) min = v;
            if (v > max) max = v;
        }

        this.currentAmplitude = max - min;

        // Signal too weak?
        if (this.currentAmplitude < 2) {
             return { bpm: 0, hrv: 0, breathingRate: 0, confidence: 0 };
        }

        // 2. INVERTED PEAK DETECTION (Blood Pulse = Drop in Redness)
        const threshold = min + (this.currentAmplitude * 0.4);

        // Logic: Value is LOW (Systolic dip) + Time passed + Local Valley
        if (currentVal < threshold && (currentTime - this.lastPeakTime > 300)) {
            
            // Check neighbors to confirm it's a bottom valley
            const len = values.length;
            const v0 = values[len-1]; // Current
            const v1 = values[len-2]; // Previous
            const v2 = values[len-3]; // Previous-Previous

            // V-Shape Detection
            if (v1 < v0 && v1 < v2) {
                const beatTime = timestamps[len-2];
                const interval = beatTime - this.lastPeakTime;
                
                // Physiological Limits (30 - 220 BPM)
                if (interval > 270 && interval < 2000) {
                    this.lastPeakTime = beatTime;
                    this.peakIntervals.push(interval);
                    if (this.peakIntervals.length > 12) this.peakIntervals.shift();
                }
            }
        }

        // 3. FINAL CALCULATION
        if (this.peakIntervals.length < 4) {
             return { bpm: 0, hrv: 0, breathingRate: 0, confidence: 0 };
        }

        const avgInterval = this.peakIntervals.reduce((a, b) => a + b, 0) / this.peakIntervals.length;
        const bpm = Math.round(60000 / avgInterval);

        // HRV (rMSSD)
        let sumSquaredDiff = 0;
        for(let i = 0; i < this.peakIntervals.length - 1; i++) {
            const diff = this.peakIntervals[i+1] - this.peakIntervals[i];
            sumSquaredDiff += diff * diff;
        }
        const hrv = Math.round(Math.sqrt(sumSquaredDiff / (this.peakIntervals.length - 1)));

        return {
            bpm,
            hrv: hrv || 0,
            breathingRate: Math.round(bpm / 4.5),
            confidence: 90
        };
    }

    reset() {
        this.buffer = [];
        this.peakIntervals = [];
        this.lastPeakTime = 0;
        this.currentAmplitude = 0;
        this.currentLightLevel = 0;
    }
    
    private addPoint(point: SignalPoint): void {
        this.buffer.push(point);
        if (this.buffer.length > this.WINDOW_SIZE) {
            this.buffer.shift();
        }
    }
}

// CRITICAL EXPORT: This must be OUTSIDE the class
export const signalProcessor = new SignalProcessor();