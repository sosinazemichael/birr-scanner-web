import type {
  ClassificationResult,
  WorkerInboundMessage,
  WorkerOutboundMessage
} from '../types/scanner';

export class ClassifierBridge {
  private worker: Worker;
  private isLoaded = false;
  private pendingResolver: ((value: ClassificationResult) => void) | null = null;
  private pendingRejecter: ((reason?: unknown) => void) | null = null;

  constructor() {
    this.worker = new Worker(
      new URL('../workers/classifier.worker.ts', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = this.handleMessage.bind(this);
  }

  public async initModel(modelUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const handler = (e: MessageEvent<WorkerOutboundMessage>) => {
        if (e.data.type === 'MODEL_LOADED') {
          this.isLoaded = true;
          this.worker.removeEventListener('message', handler);
          resolve();
        } else if (e.data.type === 'ERROR') {
          this.worker.removeEventListener('message', handler);
          reject(new Error(e.data.payload.message));
        }
      };

      this.worker.addEventListener('message', handler);
      const message: WorkerInboundMessage = {
        type: 'LOAD_MODEL',
        payload: { modelUrl }
      };
      this.worker.postMessage(message);
    });
  }

  public classifyFrame(bitmap: ImageBitmap): Promise<ClassificationResult> {
    return new Promise((resolve, reject) => {
      if (!this.isLoaded) {
        reject(new Error('ClassifierBridge: Model is not loaded.'));
        return;
      }

      this.pendingResolver = resolve;
      this.pendingRejecter = reject;

      const message: WorkerInboundMessage = {
        type: 'PREDICT',
        payload: { imageBitmap: bitmap }
      };

      this.worker.postMessage(message, [bitmap]);
    });
  }

  private handleMessage(e: MessageEvent<WorkerOutboundMessage>): void {
    const { type } = e.data;

    if (type === 'PREDICTION_RESULT' && this.pendingResolver) {
      this.pendingResolver(e.data.payload);
      this.pendingResolver = null;
      this.pendingRejecter = null;
    } else if (type === 'ERROR' && this.pendingRejecter) {
      this.pendingRejecter(new Error(e.data.payload.message));
      this.pendingResolver = null;
      this.pendingRejecter = null;
    }
  }

  public terminate(): void {
    this.worker.terminate();
  }
}