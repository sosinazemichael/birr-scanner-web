export type Denomination =
  | '5 Birr'
  | '10 Birr'
  | '50 Birr'
  | '100 Birr'
  | '200 Birr'
  | 'Background';

export type AppState =
  | 'BOOTING'
  | 'READY'
  | 'ANALYZING'
  | 'ANNOUNCING'
  | 'ERROR';

export interface ClassificationResult {
  denomination: Denomination;
  confidence: number;
  inferenceTimeMs: number;
}

// Main Thread -> Web Worker
export type WorkerInboundMessage =
  | { type: 'LOAD_MODEL'; payload: { modelUrl: string } }
  | { type: 'PREDICT'; payload: { imageBitmap: ImageBitmap } };

// Web Worker -> Main Thread
export type WorkerOutboundMessage =
  | { type: 'MODEL_LOADED' }
  | { type: 'PREDICTION_RESULT'; payload: ClassificationResult }
  | { type: 'ERROR'; payload: { message: string } };