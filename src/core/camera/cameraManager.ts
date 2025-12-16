/**
 * @file cameraManager.ts
 * @description Handles low-level interaction with the device camera.
 */

export class CameraManager {
    private stream: MediaStream | null = null;

    async startCamera(): Promise<MediaStream> {
        this.stopCamera();

        try {
            // 1. Request Camera (Minimal constraints to ensure it opens fast)
            const constraints: MediaStreamConstraints = {
                audio: false,
                video: {
                    facingMode: 'environment',
                    width: { ideal: 320 }, // Keep it small for speed
                    height: { ideal: 320 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            return this.stream;
        } catch (error) {
            console.error("CameraManager: Error starting stream", error);
            throw error;
        }
    }

    /**
     * SAFE TORCH TOGGLE
     * We wrap this in a try-catch so if it fails, it doesn't crash the app.
     */
    async toggleTorch(on: boolean): Promise<boolean> {
        if (!this.stream) return false;

        const track = this.stream.getVideoTracks()[0];
        if (!track) return false;

        // Check capability (TypeScript hack for non-standard API)
        const capabilities = track.getCapabilities() as any;
        
        if (capabilities.torch || (capabilities.fillLightMode && capabilities.fillLightMode.includes('flash'))) {
            try {
                // Add a tiny delay to let the hardware settle
                await new Promise(r => setTimeout(r, 200));
                
                await track.applyConstraints({
                    advanced: [{ torch: on } as any]
                });
                return true;
            } catch (err) {
                console.warn("CameraManager: Torch failed (safe ignore)", err);
                return false;
            }
        }
        return false;
    }

    stopCamera(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
                // Attempt to turn off torch explicitly before stopping
                try { track.applyConstraints({ advanced: [{ torch: false } as any] }); } catch(e){}
            });
            this.stream = null;
        }
    }

    getStream(): MediaStream | null {
        return this.stream;
    }
}

export const cameraManager = new CameraManager();