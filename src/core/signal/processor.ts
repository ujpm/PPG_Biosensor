/**
 * @file processor.ts
 * @description Core signal processing logic for PPG extraction.
 * Handles the calculation of 'Redness' and Peak Detection algorithms.
 */

import { SignalPoint, Vitals } from '../../types/biosensor';

export class SignalProcessor {
    private buffer: SignalPoint[] = [];
    private readonly WINDOW_SIZE = 150; // Keep last ~5 seconds (at 30fps)
    private lastPeakTime = 0;
    private peakIntervals: number[] = [];

    /**
     * Processes a single raw video frame to extract the average red intensity.
     * * @param frame - The ImageData object from the canvas.
     * @param timestamp - Current timestamp.
     * @returns {number} The average red value (0-255).
     */
    processFrame(frame: ImageData, timestamp: number): number {
        const data = frame.data;
        let totalRed = 0;
        let count = 0;

        // Optimization: Loop through every 4th pixel to save CPU
        // data structure: [R, G, B, A, R, G, B, A, ...]
        for (let i = 0; i < data.length; i += 16) { 
            totalRed += data[i];
            count++;
        }

        const avgRed = totalRed / count;
        
        // Add to buffer
        this.addPoint({ timestamp, value: avgRed });
        
        return avgRed;
    }

    /**
     * Adds a data point to the circular buffer.
     */
    private addPoint(point: SignalPoint): void {
        this.buffer.push(point);
        if (this.buffer.length > this.WINDOW_SIZE) {
            this.buffer.shift();
        }
    }

    /**
     * Analyzes the current buffer to calculate vitals (BPM, HRV).
     * Uses a simple Local Maxima (Peak Detection) algorithm.
     * * @returns {Vitals} The calculated physiological metrics.
     */
    calculateVitals(): Vitals {
        // Need at least 2 seconds of data to start
        if (this.buffer.length < 60) {
            return { bpm: 0, hrv: 0, breathingRate: 0, confidence: 0 };
        }

        // 1. Detect Peak (Simple Thresholding)
        const currentVal = this.buffer[this.buffer.length - 1].value;
        // Calculate dynamic threshold based on recent max
        const recentMax = Math.max(...this.buffer.slice(-20).map(p => p.value));
        
        // Peak Logic: Must be the max of local window AND enough time passed since last peak
        // 350ms = Limit max BPM to ~170 to avoid noise
        const now = Date.now();
        const isPeak = (currentVal >= recentMax) && (now - this.lastPeakTime > 350);

        if (isPeak) {
            const interval = now - this.lastPeakTime;
            this.lastPeakTime = now;
            
            // Store valid intervals (RR-intervals)
            if (interval < 1500) { // Ignore gaps > 1.5s
                this.peakIntervals.push(interval);
                if (this.peakIntervals.length > 20) this.peakIntervals.shift();
            }
        }

        // 2. Calculate Metrics from Intervals
        if (this.peakIntervals.length < 5) {
             return { bpm: 0, hrv: 0, breathingRate: 0, confidence: 20 };
        }

        // BPM = 60000 / Average Interval
        const avgInterval = this.peakIntervals.reduce((a, b) => a + b, 0) / this.peakIntervals.length;
        const bpm = Math.round(60000 / avgInterval);

        // HRV (SDNN) = Standard Deviation of Intervals
        const variance = this.peakIntervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / this.peakIntervals.length;
        const hrv = Math.round(Math.sqrt(variance));

        return {
            bpm,
            hrv,
            breathingRate: Math.round(bpm / 4), // Approximation for MVP
            confidence: 85 // Static high confidence for demo
        };
    }
    
    /**
     * Get the entire signal history for visualization.
     */
    getSignalData(): number[] {
        return this.buffer.map(p => p.value);
    }
}

export const signalProcessor = new SignalProcessor();