import { useCallback, useRef, useState } from 'react';

export const useHaptics = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const triggerPulse = useCallback(() => {
    // Navigator Vibrate API
    // Pattern: 50ms vibration, 100ms pause, 50ms vibration (Simulates "Lub-Dub")
    if (navigator.vibrate) {
      navigator.vibrate([50, 100, 50]);
    }
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    // Stop any ongoing vibration
    if (navigator.vibrate) navigator.vibrate(0);
  }, []);

  const playHeartbeat = useCallback((bpm: number, durationSeconds = 10) => {
    if (!bpm || bpm <= 0) return;
    
    stopHeartbeat(); // Clear existing
    setIsPlaying(true);

    // Calculate ms per beat (60000 / BPM)
    const intervalMs = 60000 / bpm;

    // Play immediate first beat
    triggerPulse();

    // Loop
    intervalRef.current = window.setInterval(triggerPulse, intervalMs);

    // Auto-stop after duration
    setTimeout(() => {
      stopHeartbeat();
    }, durationSeconds * 1000);

  }, [stopHeartbeat, triggerPulse]);

  return { isPlaying, playHeartbeat, stopHeartbeat };
};