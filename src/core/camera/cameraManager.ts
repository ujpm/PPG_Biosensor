/**
 * @file cameraManager.ts
 * @description STRICT Camera Manager. 
 * ENFORCES: Rear Camera ('environment') Only.
 * REASON: PPG Signal requires the Flashlight to be physically adjacent to the Lens.
 */

export class CameraManager {
    private stream: MediaStream | null = null;

    async startCamera(): Promise<MediaStream> {
        this.stopCamera();

        try {
            // STRICT CONSTRAINTS:
            // We demand the 'environment' (Rear) camera.
            // If the device is a laptop (no rear cam), this WILL fail.
            // This is intentional behavior for this specific app.
            const constraints: MediaStreamConstraints = {
                audio: false,
                video: {
                    facingMode: 'environment', // STRICT REAR CAMERA
                    width: { ideal: 320 },      // Low Res for High FPS
                    height: { ideal: 320 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            return this.stream;

        } catch (error: any) {
            // Specific handling for Laptops/Devices without Rear Cameras
            if (error.name === 'OverconstrainedError') {
                console.error("CameraManager: Critical Error - No Rear Camera Found.");
                throw new Error("Device does not have a Rear Camera (Required for Biosensing).");
            }
            
            console.error("CameraManager: Hardware Access Failed", error);
            throw error;
        }
    }

    async toggleTorch(on: boolean): Promise<boolean> {
        if (!this.stream) return false;
        
        const tracks = this.stream.getVideoTracks();
        if (tracks.length === 0) return false;

        const track = tracks[0];
        
        // 1. Check Capabilities
        const capabilities = track.getCapabilities() as any;
        const hasTorch = capabilities.torch || (capabilities.fillLightMode && capabilities.fillLightMode.includes('flash'));

        if (!hasTorch) {
            // We warn, but we don't crash. 
            // This handles the edge case of a phone with a rear camera but broken flash driver.
            console.warn("CameraManager: Rear Camera found, but Torch is unavailable.");
            return false;
        }

        try {
            // 2. Stability Delay (Prevents Android Driver Crash)
            await new Promise(r => setTimeout(r, 250));
            
            await track.applyConstraints({
                advanced: [{ torch: on } as any]
            });
            return true;
        } catch (err) {
            console.warn("CameraManager: Torch attempt failed", err);
            return false;
        }
    }

    stopCamera(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                try { 
                    // Attempt to turn off torch before killing the track
                    track.applyConstraints({ advanced: [{ torch: false } as any] });
                } catch(e) {}
                track.stop();
            });
            this.stream = null;
        }
    }
}

export const cameraManager = new CameraManager();