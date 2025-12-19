/**
 * @file processor.ts
 * @description "Raw Green" Processor. 
 * PHILOSOPHY: "Dumb & Honest". Shows raw data so user can find the pulse.
 * CHANNEL: Green (Best for PPG, less saturation than Red).
 */

import type { SignalPoint, Vitals } from '../../types/biosensor';

export class SignalProcessor {
    private buffer: SignalPoint[] = []; // Stores RAW data
    private readonly WINDOW_SIZE = 180; // ~6 seconds
    private lastPeakTime = 0;
    private peakIntervals: number[] = [];
    
    // Telemetry
    public currentChannel = 'GREEN'; // Hardcoded for consistency
    public currentVal = 0;

    /**
     * PROCESS FRAME (The "Dumb" Version)
     * 1. Extracts Green Channel (Best signal-to-noise ratio).
     * 2. Returns RAW value (No smoothing) so you can see the wave.
     */
    processFrame(frame: ImageData, timestamp: number): number {
        const data = frame.data;
        let sumG = 0;
        let count = 0;

        // Sample every 8th pixel (Higher resolution sampling)
        for (let i = 0; i < data.length; i += 32) { 
            // RGBA -> We want G (Index 1)
            sumG += data[i + 1]; 
            count++;
        }

        // RAW GREEN VALUE
        const avgG = sumG / count;
        this.currentVal = avgG;

        // Add to buffer for analysis
        this.addPoint({ timestamp, value: avgG });
        
        // RETURN RAW DATA FOR CHART
        // If it's jittery, that's good! It means we are seeing reality.
        return avgG;
    }

    getSignalQuality(): 'NO_FINGER' | 'NOISY' | 'GOOD' {
        // Simple Gates
        if (this.currentVal < 30) return 'NO_FINGER'; // Too Dark
        if (this.currentVal > 250) return 'NOISY';    // Saturation (Too Bright)
        return 'GOOD';
    }

    calculateVitals(): Vitals {
        if (this.buffer.length < 60) return this.emptyVitals();

        // 1. CREATE SMOOTHED COPY FOR ANALYSIS
        // We smooth here ONLY for math, not for display.
        const smoothed = this.smoothArray(this.buffer.map(p => p.value));
        const timestamps = this.buffer.map(p => p.timestamp);
        
        // 2. DYNAMIC RANGE (on smoothed data)
        let min = 1000, max = -1000;
        for(let v of smoothed) {
            if (v < min) min = v;
            if (v > max) max = v;
        }

        const amplitude = max - min;

        // If wave is too flat (< 2 units), it's just sensor noise
        if (amplitude < 2) return this.emptyVitals();

        // 3. PEAK DETECTION (Valley Logic)
        // Heart beat = Blood rush = Darker Green = Valley
        const threshold = min + (amplitude * 0.4); 
        const currentVal = smoothed[smoothed.length - 1];
        const currentTime = timestamps[timestamps.length - 1];

        if (currentVal < threshold && (currentTime - this.lastPeakTime > 300)) {
            // Check for Local Minimum
            const len = smoothed.length;
            const v0 = smoothed[len-1];
            const v1 = smoothed[len-2];
            const v2 = smoothed[len-3];

            if (v1 < v0 && v1 < v2) { // V-shape
                const beatTime = timestamps[len-2];
                const interval = beatTime - this.lastPeakTime;

                if (interval > 270 && interval < 2000) {
                    this.lastPeakTime = beatTime;
                    this.peakIntervals.push(interval);
                    if (this.peakIntervals.length > 10) this.peakIntervals.shift();
                }
            }
        }

        if (this.peakIntervals.length < 3) return this.emptyVitals();

        // Compute BPM
        const avgInterval = this.peakIntervals.reduce((a, b) => a + b, 0) / this.peakIntervals.length;
        const bpm = Math.round(60000 / avgInterval);
        
        // Sanity Check
        if (bpm < 40 || bpm > 200) return this.emptyVitals();

        return {
            bpm,
            hrv: 50, // Placeholder until BPM is stable
            breathingRate: Math.round(bpm / 4),
            confidence: 100
        };
    }

    /**
     * Simple Moving Average Buffer
     */
    private smoothArray(values: number[]): number[] {
        const output = [];
        for(let i = 2; i < values.length; i++) {
            // Average of last 3 points
            const avg = (values[i] + values[i-1] + values[i-2]) / 3;
            output.push(avg);
        }
        return output;
    }

    private emptyVitals(): Vitals {
        return { bpm: 0, hrv: 0, breathingRate: 0, confidence: 0 };
    }

    reset() {
        this.buffer = [];
        this.peakIntervals = [];
        this.lastPeakTime = 0;
    }
    
    private addPoint(point: SignalPoint): void {
        this.buffer.push(point);
        if (this.buffer.length > this.WINDOW_SIZE) {
            this.buffer.shift();
        }
    }
}

export const signalProcessor = new SignalProcessor();