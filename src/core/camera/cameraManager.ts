/**
 * @file cameraManager.ts
 * @description Camera Manager with Exposure Correction
 */

export class CameraManager {
    private stream: MediaStream | null = null;

    async startCamera(): Promise<MediaStream> {
        this.stopCamera();

        try {
            const constraints: MediaStreamConstraints = {
                audio: false,
                video: {
                    facingMode: 'environment',
                    width: { ideal: 320 },
                    height: { ideal: 320 },
                    // ATTEMPT EXPOSURE CORRECTION
                    // @ts-ignore - Non-standard constraints that help on Android
                    exposureMode: 'continuous', 
                    exposureCompensation: -2, // Attempt to darken image
                    whiteBalanceMode: 'continuous'
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            return this.stream;

        } catch (error: any) {
            if (error.name === 'OverconstrainedError') {
                 // Fallback if exposure constraints fail
                 console.warn("Exposure constraints failed, retrying basic...");
                 return await navigator.mediaDevices.getUserMedia({ 
                     video: { facingMode: 'environment' } 
                 });
            }
            throw error;
        }
    }

    async toggleTorch(on: boolean): Promise<boolean> {
        if (!this.stream) return false;
        
        const track = this.stream.getVideoTracks()[0];
        // @ts-ignore
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};

        try {
            await new Promise(r => setTimeout(r, 250));
            
            const constraints = { advanced: [{ torch: on }] } as any;
            
            // If we can control intensity (rare, but good if available)
            // @ts-ignore
            if (on && capabilities.torchLevel) {
                 // @ts-ignore
                 constraints.advanced[0].torchLevel = 1; // Try lowest intensity
            }

            await track.applyConstraints(constraints);
            return true;
        } catch (err) {
            return false;
        }
    }

    stopCamera(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                try { track.stop(); } catch(e) {}
            });
            this.stream = null;
        }
    }
}

export const cameraManager = new CameraManager();