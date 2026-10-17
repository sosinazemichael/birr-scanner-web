export class CameraService {
    private videoElement: HTMLVideoElement;
    private stream: MediaStream | null = null;

    constructor(videoElement: HTMLVideoElement) {
        this.videoElement = videoElement;
    }

    public async initialize(): Promise<void> {
        const constraints: MediaStreamConstraints = {
            audio: false,
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        try {
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;

            await new Promise<void>((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();
                    resolve();
                };
            });
        } catch (error) {
            throw new Error(`Camera initialization failed: ${(error as Error).message}`);
        }
    }

    public async captureFrameBitmap(): Promise<ImageBitmap> {
        return await createImageBitmap(this.videoElement);
    }

    public stop(): void {
        if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
        }
    }
}