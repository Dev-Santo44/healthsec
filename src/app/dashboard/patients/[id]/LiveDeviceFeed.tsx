"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Activity, Zap } from 'lucide-react';

export default function LiveDeviceFeed({ liveBpm }: { liveBpm?: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [bpm, setBpm] = useState(72);
    const [status, setStatus] = useState('Stable');

    useEffect(() => {
        if (liveBpm) {
            setBpm(liveBpm);
            setStatus(liveBpm > 130 || liveBpm < 40 ? 'CRITICAL' : 'Stable');
        }
    }, [liveBpm]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let x = 0;
        const width = canvas.width;
        const height = canvas.height;
        const midY = height / 2;

        // ECG pattern: P wave, QRS complex, T wave
        const points: number[] = [];
        const scale = 0.8;

        const generateECGPoint = (t: number) => {
            // Simplified ECG wave function
            const period = 1000 / (bpm / 60); // ms per beat
            const phase = (t % period) / period;

            let val = 0;
            if (phase > 0.1 && phase < 0.15) { // P wave
                val = Math.sin((phase - 0.1) / 0.05 * Math.PI) * 5;
            } else if (phase > 0.2 && phase < 0.22) { // Q
                val = -(phase - 0.2) / 0.02 * 5;
            } else if (phase > 0.22 && phase < 0.25) { // R
                val = 40 * Math.sin((phase - 0.22) / 0.03 * Math.PI);
            } else if (phase > 0.25 && phase < 0.28) { // S
                val = -10 * Math.sin((phase - 0.25) / 0.03 * Math.PI);
            } else if (phase > 0.4 && phase < 0.55) { // T wave
                val = Math.sin((phase - 0.4) / 0.15 * Math.PI) * 10;
            }

            return midY - (val * scale) + (Math.random() - 0.5) * 1; // Add minor noise
        };

        const render = () => {
            const now = performance.now();
            const y = generateECGPoint(now);

            // Clear a small lead section to create a "trailing" effect
            ctx.fillStyle = 'rgba(2, 6, 23, 0.1)'; // Matches slate-950 with low opacity
            ctx.fillRect(x, 0, 10, height);

            ctx.beginPath();
            ctx.strokeStyle = '#10b981'; // emerald-500
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';

            // Draw segment
            if (points.length > 0) {
                const lastPoint = points[points.length - 1];
                ctx.moveTo(x - 1, lastPoint);
                ctx.lineTo(x, y);
            }
            ctx.stroke();

            points.push(y);
            if (points.length > 10) points.shift();

            x = (x + 1) % width;

            // Periodic BPM jitter (only if no live feed)
            if (!liveBpm && Math.random() > 0.99) {
                setBpm(prev => {
                    const change = (Math.random() - 0.5) * 4;
                    const next = Math.max(60, Math.min(100, prev + change));
                    return Math.round(next);
                });
            }

            animationId = requestAnimationFrame(render);
        };

        // Initial clear
        ctx.fillStyle = '#020617'; // slate-950
        ctx.fillRect(0, 0, width, height);

        render();

        return () => cancelAnimationFrame(animationId);
    }, [bpm]);

    return (
        <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden relative group">
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                        <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white leading-none">Live Device Feed</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">ECG Monitor Channel 1</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Heart Rate</p>
                        <p className="text-2xl font-bold font-mono text-emerald-400">{bpm}<span className="text-xs ml-1 opacity-50">BPM</span></p>
                    </div>
                    <div className="h-10 w-px bg-slate-800 hidden sm:block"></div>
                    <div className="hidden sm:flex flex-col items-end">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full animate-ping ${status === 'CRITICAL' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${status === 'CRITICAL' ? 'text-red-500' : 'text-emerald-500'}`}>{status}</span>
                        </div>
                        <p className="text-[9px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                            <Zap className="w-2 h-2" /> 12-LEAD ENCRYPTED
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-800/50 bg-slate-950 shadow-inner">
                {/* Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                        backgroundImage: `linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)`,
                        backgroundSize: '20px 20px'
                    }}>
                </div>
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={120}
                    className="w-full h-24 md:h-32 relative z-0"
                />
            </div>

            {/* Decoration */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none"></div>
        </div>
    );
}
