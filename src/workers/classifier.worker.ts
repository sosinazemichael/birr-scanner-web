import * as tf from '@tensorflow/tfjs';
import type {
  WorkerInboundMessage,
  WorkerOutboundMessage,
  Denomination
} from '../types/scanner';

let model: tf.LayersModel | tf.GraphModel | null = null;

const LABELS: Denomination[] = [
  '5 Birr',
  '10 Birr',
  '50 Birr',
  '100 Birr',
  '200 Birr',
  'Background'
];

self.onmessage = async (e: MessageEvent<WorkerInboundMessage>) => {
  const { type, payload } = e.data;

  if (type === 'LOAD_MODEL') {
    try {
      await tf.ready();
      if (tf.findBackend('webgl')) {
        await tf.setBackend('webgl');
      } else {
        await tf.setBackend('cpu');
      }

      model = await tf.loadLayersModel(payload.modelUrl);
      const response: WorkerOutboundMessage = { type: 'MODEL_LOADED' };
      self.postMessage(response);
    } catch (err) {
      const response: WorkerOutboundMessage = {
        type: 'ERROR',
        payload: { message: `Failed to load model: ${(err as Error).message}` }
      };
      self.postMessage(response);
    }
  }

  if (type === 'PREDICT') {
    if (!model) {
      const response: WorkerOutboundMessage = {
        type: 'ERROR',
        payload: { message: 'Inference attempted before model initialization.' }
      };
      self.postMessage(response);
      return;
    }

    const startTime = performance.now();
    const { imageBitmap } = payload;

    try {
      const tensor = tf.tidy(() => {
        const fromPixels = tf.browser.fromPixels(imageBitmap);
        const resized = tf.image.resizeBilinear(fromPixels, [224, 224]);
        const normalized = resized.div(255.0);
        return normalized.expandDims(0);
      });

      imageBitmap.close();

      const predictionTensor = model.predict(tensor) as tf.Tensor;
      const probabilities = (await predictionTensor.data()) as Float32Array;

      tensor.dispose();
      predictionTensor.dispose();

      let topIndex = 0;
      let topConfidence = 0;

      for (let i = 0; i < probabilities.length; i++) {
        if (probabilities[i] > topConfidence) {
          topConfidence = probabilities[i];
          topIndex = i;
        }
      }

      const inferenceTimeMs = performance.now() - startTime;
      const denomination = LABELS[topIndex] || 'Background';

      const response: WorkerOutboundMessage = {
        type: 'PREDICTION_RESULT',
        payload: {
          denomination,
          confidence: topConfidence,
          inferenceTimeMs
        }
      };

      self.postMessage(response);
    } catch (err) {
      imageBitmap.close();
      const response: WorkerOutboundMessage = {
        type: 'ERROR',
        payload: { message: `Prediction failure: ${(err as Error).message}` }
      };
      self.postMessage(response);
    }
  }
};