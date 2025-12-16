import { useRef, useState, useCallback } from 'react';
import { cameraManager } from '../core/camera/cameraManager';
import { signalProcessor } from '../core/signal/processor';
import type { Vitals } from '../types/biosensor';

export type ScanStatus = 'IDLE' | 'INITIALIZING' | 'SCANNING' | 'COMPLETED' | 'ERROR';

export const useScanner = () => {
    const [status, setStatus] = useState<ScanStatus>('IDLE');
    const [progress, setProgress] = useState(0);
    const [vitals, setVitals] = useState<Vitals | null>(null);
    const [chartData, setChartData] = useState<number[]>(new Array(60).fill(0));
    const [errorMsg, setErrorMsg] = useState<string>("");

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafId = useRef<number>(0);
    
    // CONCURRENCY GUARD: Tracks the current "Session ID"
    // If this changes, any running async tasks (like camera startup) will abort.
    const activeSessionId = useRef<number>(0);

    const stopScan = useCallback(() => {
        // 1. Invalidate current session (Kills pending async starts)
        activeSessionId.current += 1;
        
        // 2. Stop Loop
        if (rafId.current) cancelAnimationFrame(rafId.current);
        
        // 3. Stop Hardware
        cameraManager.stopCamera();
        
        // 4. Reset State
        setStatus('IDLE');
        setProgress(0);
    }, []);

    const startScan = useCallback(async () => {
        // Start a new session
        const mySessionId = activeSessionId.current + 1;
        activeSessionId.current = mySessionId;

        try {
            setStatus('INITIALIZING');
            setErrorMsg("");
            
            // 1. Get Stream
            const stream = await cameraManager.startCamera();
            
            // CHECK: Did user stop/navigate away while we were waiting?
            if (activeSessionId.current !== mySessionId) {
                cameraManager.stopCamera(); // Cleanup and exit
                return;
            }
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                
                // 2. Wait for Video Metadata (Dimensions)
                videoRef.current.onloadedmetadata = async () => {
                    // CHECK AGAIN
                    if (activeSessionId.current !== mySessionId || !videoRef.current) return;
                    
                    try {
                        await videoRef.current.play();
                        
                        // 3. Safety Delay (Let auto-exposure settle)
                        await new Promise(resolve => setTimeout(resolve, 500));
                        if (activeSessionId.current !== mySessionId) return; // Guard

                        // 4. Turn on Flash
                        await cameraManager.toggleTorch(true);
                        
                        // 5. Start Loop
                        signalProcessor.reset();
                        setStatus('SCANNING');
                        loop(mySessionId); // Pass ID to loop
                    } catch (playErr: any) {
                        console.error("Play failed", playErr);
                        // Only report error if we are still the active session
                        if (activeSessionId.current === mySessionId) {
                            setErrorMsg("Camera Play Error: " + playErr.message);
                            setStatus('ERROR');
                        }
                    }
                };
            }
        } catch (error: any) {
            if (activeSessionId.current === mySessionId) {
                console.error("Camera Init failed", error);
                setErrorMsg("Init Error: " + error.message);
                setStatus('ERROR');
            }
        }
    }, []);

    const loop = (sessionId: number) => {
        // KILL SWITCH: If session changed, stop loop immediately
        if (activeSessionId.current !== sessionId) return;

        if (!videoRef.current || !canvasRef.current) return;
        
        // Safety: If video is paused/ended, just wait (don't crash)
        if (videoRef.current.paused || videoRef.current.ended) {
            rafId.current = requestAnimationFrame(() => loop(sessionId));
            return;
        }

        try {
            const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            // Draw & Process
            ctx.drawImage(videoRef.current, 0, 0, 50, 50);
            const frame = ctx.getImageData(0, 0, 50, 50);
            const redValue = signalProcessor.processFrame(frame, Date.now());
            
            setChartData(prev => {
                const next = [...prev, redValue];
                return next.slice(-60);
            });

            // Progress Logic
            setProgress(prev => {
                const newProgress = prev + 0.15;
                if (newProgress >= 100) {
                    const finalResults = signalProcessor.calculateVitals();
                    setVitals(finalResults);
                    setStatus('COMPLETED');
                    cameraManager.stopCamera();
                    return 100;
                }
                return newProgress;
            });

            if (progress < 100) {
                rafId.current = requestAnimationFrame(() => loop(sessionId));
            }

        } catch (err: any) {
            console.warn("Frame dropped", err);
            // Retry next frame instead of crashing
            rafId.current = requestAnimationFrame(() => loop(sessionId));
        }
    };

    return {
        status,
        progress,
        quality: 'GOOD', // Always 'GOOD' for now
        vitals,
        chartData,
        startScan,
        stopScan,
        videoRef,
        canvasRef,
        errorMsg
    };
};