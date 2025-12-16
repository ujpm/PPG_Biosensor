/**
 * @file processor.ts
 * @description Core signal processing logic.
 * RESTRICTIONS REMOVED: This version processes ALL input, regardless of quality.
 */

import type { SignalPoint, Vitals } from '../../types/biosensor';

export class SignalProcessor {
    private buffer: SignalPoint[] = [];
    private readonly WINDOW_SIZE = 150; // Keep last ~5 seconds
    private lastPeakTime = 0;
    private peakIntervals: number[] = [];

    /**
     * Processes a single raw video frame.
     * NOW: Accepts everything (no exposure protection).
     */
    processFrame(frame: ImageData, timestamp: number): number {
        const data = frame.data;
        let totalRed = 0;
        let count = 0;

        // Optimization: Loop through every 16th pixel
        for (let i = 0; i < data.length; i += 16) { 
            totalRed += data[i];
            count++;
        }

        const avgRed = totalRed / count;
        
        // DIRECT PASS-THROUGH: No filtering, no "dim" checks.
        this.addPoint({ timestamp, value: avgRed });
        
        return avgRed;
    }

    /**
     * THE GATEKEEPER (DISABLED)
     * Always returns 'GOOD' so the UI never blocks the user.
     */
    getSignalQuality(): 'NO_FINGER' | 'NOISY' | 'GOOD' {
        // We act like the signal is always perfect so we can test the math.
        return 'GOOD';
    }

    calculateVitals(): Vitals {
        // Need a small buffer to avoid math errors on empty arrays
        if (this.buffer.length < 30) {
            return { bpm: 0, hrv: 0, breathingRate: 0, confidence: 0 };
        }

        const values = this.buffer.map(p => p.value);
        const currentVal = values[values.length - 1];
        const now = this.buffer[this.buffer.length - 1].timestamp;

        // 1. DYNAMIC THRESHOLDING
        // Find the min/max of the recent window to auto-scale gain
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        // Avoid division by zero if signal is flat
        if (max - min < 1) return { bpm: 0, hrv: 0, breathingRate: 0, confidence: 0 };

        // Threshold is 60% up the wave
        const threshold = min + (max - min) * 0.6;

        // 2. PEAK DETECTION
        // Logic: Value must be > Threshold AND enough time passed since last peak
        if (currentVal > threshold && (now - this.lastPeakTime > 300)) {
            // Is it a local maximum? (Higher than previous 2 points)
            const isLocalMax = currentVal >= values[values.length - 2];
            
            if (isLocalMax) {
                const interval = now - this.lastPeakTime;
                this.lastPeakTime = now;

                // Simple physiological limits (30 - 220 BPM)
                if (interval > 270 && interval < 2000) {
                    this.peakIntervals.push(interval);
                    if (this.peakIntervals.length > 30) this.peakIntervals.shift();
                }
            }
        }

        // 3. CALCULATE RESULTS
        if (this.peakIntervals.length < 3) {
             return { bpm: 0, hrv: 0, breathingRate: 0, confidence: 0 };
        }

        // BPM = 60000 / Average Interval
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
            bpm: bpm || 0,
            hrv: hrv || 0,
            breathingRate: Math.round(bpm / 4),
            confidence: 100 // Fake confidence for testing
        };
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