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
     * * @returns {Promise<MediaStream>} The active video stream.
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
                    width: { ideal: 300 },
                    height: { ideal: 300 },
                    frameRate: { ideal: 30 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Attempt to turn on the flashlight immediately
            await this.toggleTorch(true);

            return this.stream;
        } catch (error) {
            console.error("CameraManager: Error starting stream", error);
            throw error;
        }
    }

    /**
     * Attempts to toggle the device flashlight (Torch).
     * Note: Support for this API is inconsistent across browsers (works best on Chrome/Android).
     * * @param on {boolean} True to turn on, False to turn off.
     * @returns {Promise<boolean>} True if successful, False if not supported.
     */
    async toggleTorch(on: boolean): Promise<boolean> {
        if (!this.stream) return false;

        const track = this.stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any; // 'torch' is non-standard TS yet

        // Check if the device actually has a torch we can control
        if (capabilities.torch || capabilities.fillLightMode) {
            try {
                // Apply the advanced constraint
                await track.applyConstraints({
                    advanced: [{ torch: on } as any]
                });
                return true;
            } catch (err) {
                console.warn("CameraManager: Torch constraint failed", err);
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
            this.stream.getTracks().forEach(track => track.stop());
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