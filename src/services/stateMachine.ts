import type { AppState } from '../types/scanner';

type StateListener = (state: AppState) => void;

export class AppStateMachine {
    private currentState: AppState = 'BOOTING';
    private listeners: StateListener[] = [];

    public getState(): AppState {
        return this.currentState;
    }

    public transition(to: AppState): boolean {
        const validTransitions: Record<AppState, AppState[]> = {
            BOOTING: ['READY', 'ERROR'],
            READY: ['ANALYZING', 'ERROR'],
            ANALYZING: ['ANNOUNCING', 'READY', 'ERROR'],
            ANNOUNCING: ['READY', 'ERROR'],
            ERROR: ['BOOTING', 'READY']
        };

        if (validTransitions[this.currentState]?.includes(to)) {
            this.currentState = to;
            this.notifyListeners();
            return true;
        }

        console.warn(`Invalid state transition: ${this.currentState} -> ${to}`);
        return false;
    }

    public subscribe(listener: StateListener): () => void {
        this.listeners.push(listener);
        listener(this.currentState);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }

    private notifyListeners(): void {
        this.listeners.forEach((listener) => listener(this.currentState));
    }
}