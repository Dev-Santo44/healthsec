import * as tf from '@tensorflow/tfjs';

export type ModelType = 'risk_tabular' | 'risk_vitals' | 'imaging' | 'nlp' | 'outcome';

export class MLManager {
    private models: Map<string, tf.Sequential> = new Map();
    private apiUrl = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000';

    constructor() {
        this.initializeModels();
    }

    private async initializeModels() {
        if (typeof window === 'undefined') return;

        // Initialize local proxies for federated learning / local processing

        // Risk Vitals (Time-series LSTM proxy)
        const riskVitals = tf.sequential();
        riskVitals.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [5] }));
        riskVitals.add(tf.layers.dense({ units: 3, activation: 'sigmoid' }));
        this.models.set('risk_vitals', riskVitals as tf.Sequential);

        // Imaging Model (Light CNN proxy)
        const imaging = tf.sequential();
        imaging.add(tf.layers.conv2d({ filters: 8, kernelSize: 3, activation: 'relu', inputShape: [64, 64, 1] }));
        imaging.add(tf.layers.flatten());
        imaging.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
        this.models.set('imaging', imaging as tf.Sequential);

        this.models.forEach(model => {
            model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
        });

        console.log('HealthSec ML Manager initialized. Backend:', this.apiUrl);
    }

    /**
     * Call the ML microservice for prediction
     */
    public async predict(type: ModelType, data: number[] | number[][] | object) {
        try {
            const response = await fetch(`${this.apiUrl}/predict/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: data }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Prediction failed');
            }

            const result = await response.json();
            return result.prediction;
        } catch (error) {
            console.error(`Error predicting with ${type}:`, error);
            throw error;
        }
    }

    public async train(type: string, data: tf.Tensor, labels: tf.Tensor, epochs: number = 5) {
        const model = this.models.get(type);
        if (!model) throw new Error(`Model ${type} not initialized locally`);

        const history = await model.fit(data, labels, {
            epochs,
            callbacks: {
                onEpochEnd: (epoch: number, logs?: tf.Logs) => {
                    console.log(`[${type}] Local training - Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}`);
                },
            },
        });

        return history;
    }

    public getModel(type: string) {
        return this.models.get(type);
    }
}

export const mlManager = new MLManager();
