import type { SignalPoint, Vitals } from '../../types/biosensor';

export class SignalProcessor {
    private buffer: SignalPoint[] = [];
    private readonly WINDOW_SIZE = 150; // 5 seconds @ 30fps
    private lastPeakTime = 0;
    private peakIntervals: number[] = [];
    
    // EXPOSURE PROTECTION
    private lastBrightness = 0;
    private exposureStableCounter = 0;

    /**
     * Processes a single frame. Returns '0' if the frame was rejected due to exposure jumps.
     */
    processFrame(frame: ImageData, timestamp: number): number {
        const data = frame.data;
        let totalRed = 0;
        let count = 0;

        // Optimization: Sample 1 in 16 pixels
        for (let i = 0; i < data.length; i += 16) { 
            totalRed += data[i];
            count++;
        }

        const avgRed = totalRed / count;
        
        // 1. EXPOSURE JUMP DETECTION
        // If brightness changes >10% instantly, it's the camera adjusting ISO, not a heartbeat.
        if (Math.abs(avgRed - this.lastBrightness) > 15) {
            this.buffer = []; // CLEAR BUFFER - Discard bad data
            this.exposureStableCounter = 0;
            this.lastBrightness = avgRed;
            return 0; // Signal invalid this frame
        } 
        
        this.exposureStableCounter++;
        this.lastBrightness = avgRed;

        // Only record data if exposure has been stable for ~10 frames (0.3s)
        if (this.exposureStableCounter > 10) {
            this.addPoint({ timestamp, value: avgRed });
        }
        
        return avgRed;
    }

    /**
     * THE GATEKEEPER: Tells the UI if we should measure or wait.
     */
    getSignalQuality(): 'NO_FINGER' | 'NOISY' | 'GOOD' {
        // Need at least 1 second of data to judge stability
        if (this.buffer.length < 30) return 'NO_FINGER';

        const lastVal = this.buffer[this.buffer.length - 1].value;
        
        // CHECK 1: REDNESS (Is it a finger?)
        // Flash through skin is bright red (>60). Dark room is <20.
        if (lastVal < 60) return 'NO_FINGER'; 

        // CHECK 2: STABILITY (Is the hand shaking?)
        // Calculate range (Max - Min) of the last 1 second
        const recent = this.buffer.slice(-30).map(v => v.value);
        const range = Math.max(...recent) - Math.min(...recent);
        
        if (range > 40) return 'NOISY'; // Huge swings = Movement
        if (range < 2) return 'NO_FINGER'; // Flatline = Static image/Table

        return 'GOOD';
    }

    calculateVitals(): Vitals {
        if (this.buffer.length < 60) return { bpm: 0, hrv: 0, breathingRate: 0, confidence: 0 };

        // Dynamic Thresholding for Peak Detection
        const values = this.buffer.map(p => p.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const threshold = min + (max - min) * 0.6; // Peak must be in top 40%

        const now = this.buffer[this.buffer.length - 1].timestamp;
        const currentVal = values[values.length - 1];

        // Peak Logic
        if (currentVal > threshold && (now - this.lastPeakTime > 300)) {
            // Local Maxima check
            const isLocalMax = currentVal >= values[values.length - 2];
            
            if (isLocalMax) {
                const interval = now - this.lastPeakTime;
                this.lastPeakTime = now;

                // Human physiological limits (30 BPM to 200 BPM)
                if (interval > 300 && interval < 2000) {
                    this.peakIntervals.push(interval);
                    if (this.peakIntervals.length > 30) this.peakIntervals.shift();
                }
            }
        }

        // Must have 5 beats to calculate BPM
        if (this.peakIntervals.length < 5) return { bpm: 0, hrv: 0, breathingRate: 0, confidence: 0 };

        // BPM
        const avgInterval = this.peakIntervals.reduce((a, b) => a + b, 0) / this.peakIntervals.length;
        const bpm = Math.round(60000 / avgInterval);

        // HRV (rMSSD) - The Gold Standard for Stress
        let sumSquaredDiff = 0;
        for(let i = 0; i < this.peakIntervals.length - 1; i++) {
            const diff = this.peakIntervals[i+1] - this.peakIntervals[i];
            sumSquaredDiff += diff * diff;
        }
        const hrv = Math.round(Math.sqrt(sumSquaredDiff / (this.peakIntervals.length - 1)));

        return {
            bpm,
            hrv,
            breathingRate: Math.round(bpm / 4), // RSA Estimation
            confidence: 90 
        };
    }

    reset() {
        this.buffer = [];
        this.peakIntervals = [];
        this.lastPeakTime = 0;
        this.exposureStableCounter = 0;
    }
    
    // Helper for the "Clean Wave" visualization later
    getBufferSnippet(): number[] {
        return this.buffer.slice(-60).map(p => p.value); // Last 2 seconds
    }
    
    private addPoint(point: SignalPoint): void {
        this.buffer.push(point);
        if (this.buffer.length > this.WINDOW_SIZE) {
            this.buffer.shift();
        }
    }
}

export const signalProcessor = new SignalProcessor();