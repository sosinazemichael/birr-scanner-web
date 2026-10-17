export class AudioFeedbackService {
    private synth: SpeechSynthesis | null = null;

    constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.synth = window.speechSynthesis;
        }
    }

    public triggerHaptic(type: 'tap' | 'success' | 'error'): void {
        if (!('vibrate' in navigator)) return;

        switch (type) {
            case 'tap':
                navigator.vibrate(40);
                break;
            case 'success':
                navigator.vibrate([60, 50, 100]);
                break;
            case 'error':
                navigator.vibrate([100, 50, 100, 50, 100]);
                break;
        }
    }

    public speak(text: string, lang = 'en-US'): Promise<void> {
        return new Promise((resolve) => {
            if (!this.synth) {
                console.warn('Speech synthesis not available.');
                resolve();
                return;
            }

            this.synth.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();

            this.synth.speak(utterance);
        });
    }
}