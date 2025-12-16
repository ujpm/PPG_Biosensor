import { useRef, useState, useCallback } from 'react';
import { cameraManager } from '../core/camera/cameraManager';
import { signalProcessor } from '../core/signal/processor';
import type { Vitals } from '../types/biosensor';

// --- FIX 1: EXPORT THESE TYPES (Fixes Vercel Build Error) ---
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

    const stopScan = useCallback(() => {
        activeSessionId.current += 1;
        if (rafId.current) cancelAnimationFrame(rafId.current);
        cameraManager.stopCamera();
        setStatus('IDLE');
        setProgress(0);
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

            // --- FIX 2: THE DEATH MONITOR (Fixes "Blink & Die" Crash) ---
            // If the flash toggle kills the stream, this detects it instantly.
            const track = stream.getVideoTracks()[0];
            track.onended = () => {
                if (activeSessionId.current === mySessionId) {
                    console.error("Hardware Stream Ended Unexpectedly");
                    setErrorMsg("Camera disconnected. Hardware reset required.");
                    setStatus('ERROR');
                }
            };
            
            if (videoRef.current) {
                // Clear old source to prevent freezing
                videoRef.current.srcObject = null;
                videoRef.current.srcObject = stream;
                
                videoRef.current.onloadedmetadata = async () => {
                    if (activeSessionId.current !== mySessionId || !videoRef.current) return;
                    
                    try {
                        await videoRef.current.play();
                        
                        // Safety Delay before Flash
                        await new Promise(resolve => setTimeout(resolve, 500));
                        if (activeSessionId.current !== mySessionId) return;

                        // Toggle Flash
                        await cameraManager.toggleTorch(true);
                        
                        signalProcessor.reset();
                        setStatus('SCANNING');
                        loop(mySessionId);

                    } catch (playErr: any) {
                        console.error("Play Execution Failed", playErr);
                        if (activeSessionId.current === mySessionId) {
                            setErrorMsg("Video Playback Failed: " + playErr.message);
                            setStatus('ERROR');
                        }
                    }
                };
            }
        } catch (error: any) {
            if (activeSessionId.current === mySessionId) {
                console.error("Camera Access Failed", error);
                setErrorMsg("Hardware Error: " + error.message);
                setStatus('ERROR');
            }
        }
    }, []);

    const loop = (sessionId: number) => {
        if (activeSessionId.current !== sessionId) return;
        if (!videoRef.current || !canvasRef.current) return;

        // Skip frame if video paused (don't crash)
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
            
            setChartData(prev => {
                const next = [...prev, redValue];
                return next.slice(-60);
            });

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

        } catch (err) {
            rafId.current = requestAnimationFrame(() => loop(sessionId));
        }
    };

    return {
        status,
        progress,
        quality: 'GOOD' as SignalQuality, // Cast to exported type
        vitals,
        chartData,
        startScan,
        stopScan,
        videoRef,
        canvasRef,
        errorMsg
    };
};