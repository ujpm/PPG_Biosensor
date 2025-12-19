/**
 * @file processor.ts
 * @description "Showcase Mode" Processor.
 * PHILOSOPHY: Aggressive Sensitivity.
 * GOAL: Always show a BPM value if there is ANY signal variation.
 * TRADEOFF: Less medically accurate, but excellent for demos/visuals.
 */

import type { SignalPoint, Vitals } from '../../types/biosensor';

export class SignalProcessor {
    private buffer: SignalPoint[] = []; 
    // Reduced window for faster updates (approx 4 seconds at 30fps)
    private readonly WINDOW_SIZE = 120; 

    // Telemetry for the graph
    public currentVal = 0;

    /**
     * PROCESS FRAME
     * Uses Green channel (best contrast) but accepts anything.
     */
    processFrame(frame: ImageData, timestamp: number): number {
        const data = frame.data;
        let sum = 0;
        let count = 0;

        // Sample every 8th pixel for speed
        for (let i = 0; i < data.length; i += 32) { 
            // Index 1 is Green (Best for pulse)
            sum += data[i + 1]; 
            count++;
        }

        const avg = sum / count;
        this.currentVal = avg;

        this.addPoint({ timestamp, value: avg });
        
        // Return raw value for the graph (so it looks responsive)
        return avg;
    }

    /**
     * QUALITY CHECK
     * Extremely permissive for the demo. 
     * Only fails if the camera is completely covered (Black) or Blown out (White).
     */
    getSignalQuality(): 'NO_FINGER' | 'NOISY' | 'GOOD' {
        if (this.currentVal < 10) return 'NO_FINGER'; // Pitch black
        if (this.currentVal > 254) return 'NO_FINGER'; // Pure white (Flash without finger)
        
        // If we have data, we assume it's GOOD for the demo.
        return 'GOOD';
    }

    calculateVitals(): Vitals {
        // Need at least 2 seconds of data (~60 frames) to guess BPM
        if (this.buffer.length < 60) {
            return { bpm: 0, hrv: 0, breathingRate: 0, confidence: 0 };
        }

        const values = this.buffer.map(p => p.value);
        const timestamps = this.buffer.map(p => p.timestamp);

        // 1. AUTO-MAGNIFICATION (Normalization)
        // Find the range of the current window
        let min = 1000, max = -1000;
        for (let v of values) {
            if (v < min) min = v;
            if (v > max) max = v;
        }

        const range = max - min;

        // If the line is flat (dead sensor), return 0
        if (range < 1) {
             return { bpm: 0, hrv: 0, breathingRate: 0, confidence: 0 };
        }

        // Normalize data to 0-100 scale (Stretches the wave)
        const normalized = values.map(v => ((v - min) / range) * 100);

        // 2. ZERO-CROSSING DETECTOR (Robust Counting)
        // We calculate the average of this magnified wave (usually around 50)
        const midPoint = 50;
        let crossCount = 0;
        let isAbove = normalized[0] > midPoint;

        for (let i = 1; i < normalized.length; i++) {
            const currentIsAbove = normalized[i] > midPoint;
            
            // If we crossed the line, count it
            if (currentIsAbove !== isAbove) {
                crossCount++;
                isAbove = currentIsAbove;
            }
        }

        // A full heartbeat crosses the line twice (Up and Down).
        // So beats = crosses / 2.
        const beatCount = Math.floor(crossCount / 2);

        // Calculate time duration of the buffer in seconds
        const durationSec = (timestamps[timestamps.length - 1] - timestamps[0]) / 1000;

        // 3. CALCULATE BPM
        // BPM = (Beats / Seconds) * 60
        // We add a tiny clamp to prevent "Infinity" on startup
        if (durationSec < 1 || beatCount < 1) {
             return { bpm: 0, hrv: 0, breathingRate: 0, confidence: 0 };
        }

        let bpm = Math.round((beatCount / durationSec) * 60);

        // 4. DEMO SMOOTHING / CLAMPING
        // Keep result realistic (Human heart range)
        if (bpm < 40) bpm = 0;   // Too slow to be real
        if (bpm > 200) bpm = 0;  // Too fast (noise)

        // Generate "Fake" HRV/Breathing derived from BPM for the showcase
        // (Real HRV requires millisecond-perfect peak detection, which we skipped for speed)
        const estimatedHRV = Math.max(20, 100 - (bpm * 0.5)); 
        const estimatedBreath = Math.round(bpm / 4.5);

        return {
            bpm,
            hrv: Math.round(estimatedHRV),
            breathingRate: estimatedBreath,
            confidence: 85 // Static confidence for demo
        };
    }

    reset() {
        this.buffer = [];
        this.currentVal = 0;
    }
    
    private addPoint(point: SignalPoint): void {
        this.buffer.push(point);
        if (this.buffer.length > this.WINDOW_SIZE) {
            this.buffer.shift();
        }
    }
}

export const signalProcessor = new SignalProcessor();