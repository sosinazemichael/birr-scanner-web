import { AppStateMachine } from './services/stateMachine';
import { CameraService } from './services/camera';
import { AudioFeedbackService } from './services/audio';

const stateMachine = new AppStateMachine();
const audio = new AudioFeedbackService();

const videoElement = document.getElementById('webcam') as HTMLVideoElement;
const triggerBtn = document.getElementById('touch-trigger') as HTMLButtonElement;
const triggerLabel = document.getElementById('trigger-label') as HTMLSpanElement;
const stateBadge = document.getElementById('state-indicator') as HTMLDivElement;
const screenReaderLive = document.getElementById('accessible-announcements') as HTMLDivElement;

const camera = new CameraService(videoElement);

function updateLiveRegion(message: string): void {
  screenReaderLive.textContent = '';
  setTimeout(() => {
    screenReaderLive.textContent = message;
  }, 50);
}

stateMachine.subscribe((state) => {
  stateBadge.textContent = state;

  switch (state) {
    case 'BOOTING':
      triggerBtn.disabled = true;
      triggerLabel.textContent = 'Starting Camera...';
      break;

    case 'READY':
      triggerBtn.disabled = false;
      triggerLabel.textContent = 'Tap to Scan Note';
      break;

    case 'ANALYZING':
      triggerBtn.disabled = true;
      triggerLabel.textContent = 'Analyzing Frame...';
      break;

    case 'ANNOUNCING':
      triggerBtn.disabled = true;
      triggerLabel.textContent = 'Speaking Result...';
      break;

    case 'ERROR':
      triggerBtn.disabled = true;
      triggerLabel.textContent = 'Camera Error';
      break;
  }
});

triggerBtn.addEventListener('click', async () => {
  if (stateMachine.getState() !== 'READY') return;

  audio.triggerHaptic('tap');
  stateMachine.transition('ANALYZING');
  updateLiveRegion('Scanning note...');

  try {
    const bitmap = await camera.captureFrameBitmap();
    console.log(`Captured frame ready: ${bitmap.width}x${bitmap.height}`);
    bitmap.close();

    stateMachine.transition('ANNOUNCING');
    audio.triggerHaptic('success');

    const statusMessage = 'Scan registered. Model inference ready for connection.';
    updateLiveRegion(statusMessage);
    await audio.speak(statusMessage);

    stateMachine.transition('READY');
  } catch (err) {
    console.error(err);
    audio.triggerHaptic('error');
    stateMachine.transition('READY');
  }
});

async function bootstrap(): Promise<void> {
  try {
    await camera.initialize();
    stateMachine.transition('READY');

    const welcome = 'Camera ready. Tap screen to scan.';
    updateLiveRegion(welcome);
    await audio.speak(welcome);
  } catch (error) {
    console.error(error);
    stateMachine.transition('ERROR');
    updateLiveRegion('Error accessing camera. Please check permissions.');
  }
}

window.addEventListener('DOMContentLoaded', bootstrap);