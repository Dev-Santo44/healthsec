import { useEffect, useState, useRef, useCallback } from 'react';

export interface VitalPacket {
    patient_id: string;
    timestamp: string;
    hr: number;
    spo2: number;
    temp: number;
    bp: string;
}

export interface StreamPayload {
    type: 'vitals_update' | 'connected';
    data?: VitalPacket;
    is_critical?: boolean;
    status?: string;
}

export function useVitalsStream(patientId: string | string[]) {
    const [latestVital, setLatestVital] = useState<VitalPacket | null>(null);
    const [isCritical, setIsCritical] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        const id = Array.isArray(patientId) ? patientId[0] : patientId;
        if (!id) return;

        const mlUrl = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000';
        const wsUrl = mlUrl.replace('http', 'ws') + `/ws/vitals/${id}`;

        console.log(`Connecting to WebSocket: ${wsUrl}`);
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('WS Connected');
            setIsConnected(true);
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        };

        socket.onmessage = (event) => {
            try {
                const payload: StreamPayload = JSON.parse(event.data);
                if (payload.type === 'vitals_update' && payload.data) {
                    setLatestVital(payload.data);
                    setIsCritical(!!payload.is_critical);
                }
            } catch (e) {
                console.error('WS Parse Error:', e);
            }
        };

        socket.onclose = () => {
            console.log('WS Closed');
            setIsConnected(false);
            // Auto-reconnect after 3 seconds
            reconnectTimeout.current = setTimeout(connect, 3000);
        };

        socket.onerror = (err) => {
            console.error('WS Error Details:', {
                url: socket.url,
                readyState: socket.readyState,
                error: err
            });
            socket.close();
        };

        ws.current = socket;
    }, [patientId]);

    useEffect(() => {
        connect();
        return () => {
            if (ws.current) {
                ws.current.close();
            }
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
        };
    }, [connect]);

    const startSimulation = async () => {
        const id = Array.isArray(patientId) ? patientId[0] : patientId;
        const mlUrl = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000';
        try {
            await fetch(`${mlUrl}/simulate/start/${id}`, { method: 'POST' });
        } catch (e) {
            console.error('Failed to start simulation:', e);
        }
    };

    const stopSimulation = async () => {
        const id = Array.isArray(patientId) ? patientId[0] : patientId;
        const mlUrl = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000';
        try {
            await fetch(`${mlUrl}/simulate/stop/${id}`, { method: 'POST' });
        } catch (e) {
            console.error('Failed to stop simulation:', e);
        }
    };

    return { latestVital, isCritical, isConnected, startSimulation, stopSimulation };
}
