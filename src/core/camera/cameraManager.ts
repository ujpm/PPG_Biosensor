/**
 * @file cameraManager.ts
 * @description Handles low-level interaction with the device camera.
 * Responsible for stream acquisition, constraint application (Torch), and cleanup.
 */

export class CameraManager {
    private stream: MediaStream | null = null;

    /**
     * Initializes the camera with specific constraints for PPG signal acquisition.
     * We prefer the 'environment' (back) camera and low resolution for performance.
     * @returns {Promise<MediaStream>} The active video stream.
     * @throws {Error} If permission is denied or hardware is unavailable.
     */
    async startCamera(): Promise<MediaStream> {
        // Stop any existing stream first
        this.stopCamera();

        try {
            const constraints: MediaStreamConstraints = {
                audio: false,
                video: {
                    facingMode: 'environment', // Use back camera
                    // Low resolution is CRITICAL. 
                    // 1. Better performance (less pixels to loop through).
                    // 2. Higher potential framerate.
                    width: { ideal: 320 },
                    height: { ideal: 320 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // NOTE: We do NOT turn on the torch here anymore. 
            // We let the Scanner Hook do it after the video loads to prevent crashes.

            return this.stream;
        } catch (error) {
            console.error("CameraManager: Error starting stream", error);
            throw error;
        }
    }

    /**
     * Attempts to toggle the device flashlight (Torch).
     * Includes a safety delay to prevent hardware race conditions.
     * @param on {boolean} True to turn on, False to turn off.
     * @returns {Promise<boolean>} True if successful, False if not supported.
     */
    async toggleTorch(on: boolean): Promise<boolean> {
        if (!this.stream) return false;

        const track = this.stream.getVideoTracks()[0];
        if (!track) return false;

        // Check capability (TypeScript hack for non-standard API)
        const capabilities = track.getCapabilities() as any; 

        // Check if the device actually has a torch we can control
        if (capabilities.torch || (capabilities.fillLightMode && capabilities.fillLightMode.includes('flash'))) {
            try {
                // CRITICAL FIX: Add a tiny delay to let the hardware settle before applying constraints.
                // This prevents the "Blink and Crash" on many Android devices.
                await new Promise(r => setTimeout(r, 200));
                
                // Apply the advanced constraint
                await track.applyConstraints({
                    advanced: [{ torch: on } as any]
                });
                return true;
            } catch (err) {
                console.warn("CameraManager: Torch constraint failed (safe ignore)", err);
                return false;
            }
        }
        
        console.warn("CameraManager: Device does not support Torch control.");
        return false;
    }

    /**
     * Stops all active tracks and releases the camera hardware.
     */
    stopCamera(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
                // Attempt to turn off torch explicitly before stopping (Best Practice)
                try { 
                    track.applyConstraints({ advanced: [{ torch: false } as any] }); 
                } catch(e) {
                    // Ignore errors during stop
                }
            });
            this.stream = null;
        }
    }

    /**
     * Returns the active stream if it exists.
     */
    getStream(): MediaStream | null {
        return this.stream;
    }
}

// Export a singleton instance for global use
export const cameraManager = new CameraManager();