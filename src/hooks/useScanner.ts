import { useRef, useState, useCallback } from 'react';
import { cameraManager } from '../core/camera/cameraManager';
import { signalProcessor } from '../core/signal/processor';
import type { Vitals } from '../types/biosensor';

export type ScanStatus = 'IDLE' | 'CALIBRATING' | 'SCANNING' | 'COMPLETED';
export type SignalQuality = 'NO_FINGER' | 'NOISY' | 'GOOD';

export const useScanner = () => {
    const [status, setStatus] = useState<ScanStatus>('IDLE');
    const [progress, setProgress] = useState(0);
    const [quality, setQuality] = useState<SignalQuality>('NO_FINGER');
    const [vitals, setVitals] = useState<Vitals | null>(null);
    
    // Live Chart Data (for visualization only)
    const [chartData, setChartData] = useState<number[]>(new Array(60).fill(0));

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafId = useRef<number>(0);

    const stopScan = useCallback(() => {
        if (rafId.current) cancelAnimationFrame(rafId.current);
        cameraManager.stopCamera();
        setStatus('IDLE');
        setProgress(0);
    }, []);

    const startScan = useCallback(async () => {
        try {
            await cameraManager.startCamera();
            
            // Link stream to invisible video element
            if (videoRef.current) {
                videoRef.current.srcObject = cameraManager.getStream();
                videoRef.current.play();
            }

            signalProcessor.reset();
            setStatus('CALIBRATING');
            loop();
        } catch (error) {
            console.error("Camera failed", error);
            alert("Could not start camera. Check permissions.");
        }
    }, []);

    const loop = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // 1. Draw & Process
        ctx.drawImage(videoRef.current, 0, 0, 50, 50);
        const frame = ctx.getImageData(0, 0, 50, 50);
        const redValue = signalProcessor.processFrame(frame, Date.now());

        // Update Graph Data (Visual only)
        setChartData(prev => {
            const next = [...prev, redValue];
            return next.slice(-60); // Keep last 60 frames
        });

        // 2. Run Gatekeeper Logic
        const currentQuality = signalProcessor.getSignalQuality();
        setQuality(currentQuality);

        // 3. State Machine Transitions
        setProgress(prev => {
            // Case A: Bad Signal -> Pause or Reset
            if (currentQuality !== 'GOOD') {
                return Math.max(0, prev - 0.5); // Decay progress if finger slips
            }

            // Case B: Good Signal -> Advance
            // Transition Calibrating -> Scanning if we have a bit of progress
            if (prev > 10) setStatus('SCANNING');

            // Completed?
            if (prev >= 100) {
                const finalResults = signalProcessor.calculateVitals();
                setVitals(finalResults);
                setStatus('COMPLETED');
                cameraManager.stopCamera(); // Auto-stop
                return 100;
            }

            return prev + 0.4; // Fills in ~4-5 seconds at 60fps
        });

        // Loop if not done
        if (progress < 100) {
            rafId.current = requestAnimationFrame(loop);
        }
    };

    return {
        status,
        progress,
        quality,
        vitals,
        chartData,
        startScan,
        stopScan,
        videoRef,
        canvasRef
    };
};