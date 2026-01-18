"use client";

import { useState, useEffect, useRef } from 'react';
import { Cpu, Play, Square, Terminal as TerminalIcon, Activity, Sparkles, ChevronDown } from 'lucide-react';
import { ModelType } from '@/lib/ml/MLManager';

export default function TrainPage() {
    const [isTraining, setIsTraining] = useState(false);
    const [selectedModel, setSelectedModel] = useState<ModelType>('risk');
    const [logs, setLogs] = useState<string[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const startTraining = () => {
        setIsTraining(true);
        setLogs([
            `[INFO] Initializing ${selectedModel.toUpperCase()} engine...`,
            `[INFO] Loading ${selectedModel} architecture into edge memory...`
        ]);

        let epoch = 1;
        const interval = setInterval(() => {
            setLogs(prev => [
                ...prev,
                `[EPOCH ${epoch}] Training - Loss: ${(Math.random() * 0.5).toFixed(4)} | Accuracy: ${(0.7 + Math.random() * 0.2).toFixed(4)}`
            ]);
            epoch++;
            if (epoch > 10) {
                clearInterval(interval);
                setLogs(prev => [...prev, `[SUCCESS] ${selectedModel.toUpperCase()} training completed locally.`, "[INFO] Encrypting weights for secure synchronization..."]);
                setIsTraining(false);
            }
        }, 1000);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Model Train</h1>
                    <p className="text-slate-400">Select and train specialized healthcare AI models on your edge device.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group">
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                            disabled={isTraining}
                            className="appearance-none bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 pr-12 font-medium text-slate-200 outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
                        >
                            <option value="risk">Risk Predictor (Vitals)</option>
                            <option value="imaging">Imaging Diagnostics (CNN)</option>
                            <option value="nlp">Medical NLP (Analysis)</option>
                            <option value="outcome">Outcome Predictor (Stay)</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>

                    {!isTraining ? (
                        <button
                            onClick={startTraining}
                            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
                        >
                            <Play className="w-4 h-4" /> Start Training
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsTraining(false)}
                            className="flex items-center gap-2 px-8 py-3 bg-red-600/10 text-red-500 hover:bg-red-600/20 rounded-xl font-semibold border border-red-500/20 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Square className="w-4 h-4" /> Stop Session
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Logs Terminal */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 text-slate-400 px-2">
                        <TerminalIcon className="w-4 h-4" />
                        <span className="text-sm font-medium uppercase tracking-wider">Live Training Logs</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 h-[500px] flex flex-col shadow-2xl overflow-hidden">
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto font-mono text-sm space-y-2 custom-scrollbar"
                        >
                            {logs.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 italic">
                                    <TerminalIcon className="w-12 h-12 mb-4 opacity-20" />
                                    No training session active
                                </div>
                            )}
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-4 animate-in slide-in-from-left-2 duration-200">
                                    <span className="text-slate-600 select-none">{i + 1}</span>
                                    <span className={log.includes('[SUCCESS]') ? 'text-emerald-400' : log.includes('[EPOCH]') ? 'text-indigo-400' : 'text-slate-300'}>
                                        {log}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Status Metrics */}
                <div className="space-y-6">
                    <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl group hover:border-indigo-500/30 transition-colors">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                                <Cpu className="w-6 h-6 text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Device Engine</p>
                                <p className="font-bold">WebGL 2.0</p>
                            </div>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="w-[85%] h-full bg-indigo-500 animate-pulse" />
                        </div>
                    </div>

                    <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl group hover:border-emerald-500/30 transition-colors">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                <Activity className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Resource Usage</p>
                                <p className="font-bold">Low Impact</p>
                            </div>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="w-[30%] h-full bg-emerald-500" />
                        </div>
                    </div>

                    <div className="p-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl relative overflow-hidden group">
                        <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-white/10 rotate-12 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-bold mb-2">Privacy Shield</h3>
                        <p className="text-white/70 text-sm leading-relaxed">
                            Your training data is ephemeral and never stored on the cloud. Only optimized mathematical weights are uploaded.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
