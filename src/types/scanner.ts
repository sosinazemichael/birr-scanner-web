export type Denomination =
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