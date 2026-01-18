import * as tf from '@tensorflow/tfjs';

export type ModelType = 'risk' | 'imaging' | 'nlp' | 'outcome';

export class MLManager {
    private models: Map<ModelType, tf.Sequential> = new Map();

    constructor() {
        this.initializeModels();
    }

    private async initializeModels() {
        if (typeof window === 'undefined') return;

        // Initialize Risk Model (Time-series LSTM simulation)
        const risk = tf.sequential();
        risk.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [5] }));
        risk.add(tf.layers.dense({ units: 3, activation: 'sigmoid' })); // Sepsis, ICU, Readmission
        this.models.set('risk', risk as tf.Sequential);

        // Initialize Imaging Model (Light CNN proxy)
        const imaging = tf.sequential();
        imaging.add(tf.layers.conv2d({ filters: 8, kernelSize: 3, activation: 'relu', inputShape: [64, 64, 1] }));
        imaging.add(tf.layers.flatten());
        imaging.add(tf.layers.dense({ units: 1, activation: 'sigmoid' })); // Anomaly detection
        this.models.set('imaging', imaging as tf.Sequential);

        // Initialize Outcome Model
        const outcome = tf.sequential();
        outcome.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [10] }));
        outcome.add(tf.layers.dense({ units: 2, activation: 'linear' })); // Stay length, Recovery prob
        this.models.set('outcome', outcome as tf.Sequential);

        this.models.forEach(model => {
            model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
        });

        console.log('Specialized Health AI Models initialized');
    }

    public async train(type: ModelType, data: tf.Tensor, labels: tf.Tensor, epochs: number = 5) {
        const model = this.models.get(type);
        if (!model) throw new Error(`Model ${type} not initialized`);

        return await model.fit(data, labels, {
            epochs,
            callbacks: {
                onEpochEnd: (epoch: number, logs?: tf.Logs) => {
                    console.log(`[${type}] Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}`);
                },
            },
        });
    }

    public getModel(type: ModelType) {
        return this.models.get(type);
    }
}

export const mlManager = new MLManager();
