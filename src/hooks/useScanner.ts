import { useRef, useState, useCallback, useEffect } from 'react';
import { cameraManager } from '../core/camera/cameraManager';
import { signalProcessor } from '../core/signal/processor'; // Named import
import type { Vitals } from '../types/biosensor';

export type ScanStatus = 'IDLE' | 'INITIALIZING' | 'SCANNING' | 'COMPLETED' | 'ERROR';
export type SignalQuality = 'NO_FINGER' | 'NOISY' | 'GOOD';

export const useScanner = () => {
    const [status, setStatus] = useState<ScanStatus>('IDLE');
    const [progress, setProgress] = useState(0);
    const [vitals, setVitals] = useState<Vitals | null>(null);
    const [chartData, setChartData] = useState<number[]>(new Array(60).fill(0));
    const [errorMsg, setErrorMsg] = useState<string>("");

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafId = useRef<number>(0);
    const activeSessionId = useRef<number>(0);
    const frameCount = useRef<number>(0);

    const stopScan = useCallback(() => {
        activeSessionId.current += 1;
        if (rafId.current) cancelAnimationFrame(rafId.current);
        cameraManager.stopCamera();
        setStatus('IDLE');
        setProgress(0);
        frameCount.current = 0;
    }, []);

    const startScan = useCallback(async () => {
        const mySessionId = activeSessionId.current + 1;
        activeSessionId.current = mySessionId;

        try {
            setStatus('INITIALIZING');
            setErrorMsg("");
            
            const stream = await cameraManager.startCamera();
            
            if (activeSessionId.current !== mySessionId) {
                cameraManager.stopCamera();
                return;
            }

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                
                await videoRef.current.play().catch(console.warn);
                
                // Flash handling
                try {
                    await cameraManager.toggleTorch(true);
                } catch (e) { console.warn("Torch failed"); }
                
                await new Promise(r => setTimeout(r, 500));
                
                if (activeSessionId.current !== mySessionId) return;

                signalProcessor.reset();
                setStatus('SCANNING');
                frameCount.current = 0;
                loop(mySessionId);
            }
        } catch (error: any) {
            if (activeSessionId.current === mySessionId) {
                console.error("Scanner Error", error);
                setErrorMsg(error.message || "Camera Error");
                setStatus('ERROR');
            }
        }
    }, []);

    const loop = (sessionId: number) => {
        if (activeSessionId.current !== sessionId) return;
        if (!videoRef.current || !canvasRef.current) return;
        
        if (videoRef.current.paused || videoRef.current.ended) {
            rafId.current = requestAnimationFrame(() => loop(sessionId));
            return;
        }

        try {
            const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            ctx.drawImage(videoRef.current, 0, 0, 50, 50);
            const frame = ctx.getImageData(0, 0, 50, 50);
            const redValue = signalProcessor.processFrame(frame, Date.now());
            
            frameCount.current++;

            // Throttle UI Updates (Prevent Crash)
            if (frameCount.current % 5 === 0) {
                setChartData(prev => [...prev, redValue].slice(-60));
                
                setProgress(prev => {
                    const next = prev + 0.5;
                    if (next >= 100) {
                        setVitals(signalProcessor.calculateVitals());
                        setStatus('COMPLETED');
                        cameraManager.stopCamera();
                        return 100;
                    }
                    return next;
                });
            }

            if (progress < 100 && status !== 'COMPLETED') {
                rafId.current = requestAnimationFrame(() => loop(sessionId));
            }
        } catch (err) {
            rafId.current = requestAnimationFrame(() => loop(sessionId));
        }
    };

    useEffect(() => {
        return () => stopScan();
    }, [stopScan]);

    return { status, progress, quality: signalProcessor.getSignalQuality(), vitals, chartData, startScan, stopScan, videoRef, canvasRef, errorMsg };
};