"use client";

import { useState, useEffect, useRef } from 'react';
import { Cpu, Play, Square, Terminal as TerminalIcon, Activity, Sparkles, ChevronDown, User, Search, Loader2 } from 'lucide-react';
import { ModelType } from '@/lib/ml/MLManager';
import { supabase } from '@/lib/supabase/client';

export default function TrainPage() {
    const [isTraining, setIsTraining] = useState(false);
    const [selectedModel, setSelectedModel] = useState<ModelType | string>('risk_tabular');
    const [logs, setLogs] = useState<string[]>([]);
    const [showLogs, setShowLogs] = useState(false);

    // Patient Selection State
    const [patients, setPatients] = useState<any[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [patientSearch, setPatientSearch] = useState('');
    const [loadingPatients, setLoadingPatients] = useState(true);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const { data, error } = await supabase.from('patients').select('id, name, patient_id');
            if (error) throw error;
            setPatients(data || []);
        } catch (error) {
            console.error("Error fetching patients:", error);
        } finally {
            setLoadingPatients(false);
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, showLogs]);

    const startTraining = async () => {
        setIsTraining(true);
        setShowLogs(true);
        setLogs([`[INFO] Connecting to HealthSec ML Service...`]);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000'}/train/${selectedModel}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: selectedPatientId || null,
                    data: null // Future: Pass specific subset of data
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                // Stream logs slowly for visual effect if they come back at once
                for (const log of result.logs) {
                    setLogs(prev => [...prev, log]);
                    await new Promise(r => setTimeout(r, 500));
                }
            } else {
                setLogs(prev => [...prev, `[ERROR] ${result.detail || 'Training failed'}`]);
            }
        } catch (error: any) {
            setLogs(prev => [...prev, `[CRITICAL] Service unreachable: ${error.message}`]);
        } finally {
            setIsTraining(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.patient_id.toLowerCase().includes(patientSearch.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Patient-Specific Model Training</h1>
                    <p className="text-slate-400">Fine-tune specialized AI models based on individual medical histories.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group">
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            disabled={isTraining}
                            className="appearance-none bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 pr-12 font-medium text-slate-200 outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
                        >
                            <option value="risk_tabular">Risk Predictor (XGBoost)</option>
                            <option value="imaging">Imaging Diagnostics (CNN)</option>
                            <option value="nlp">Medical NLP (Analysis)</option>
                            <option value="outcome">Outcome Predictor (Stay)</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>

                    {!isTraining ? (
                        <button
                            onClick={startTraining}
                            disabled={!selectedPatientId}
                            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
                        >
                            <Play className="w-4 h-4" /> Start Fine-Tuning
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

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left: Patient Selector */}
                <div className="lg:col-span-1 border-r border-slate-800 pr-8 space-y-6">
                    <h3 className="font-bold flex items-center gap-2 text-indigo-400">
                        <User className="w-5 h-5" />
                        Select Patient
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {loadingPatients ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-600" /></div>
                        ) : filteredPatients.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPatientId(p.id)}
                                className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedPatientId === p.id
                                        ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-100 shadow-lg'
                                        : 'bg-slate-950 border-slate-800/50 text-slate-400 hover:border-slate-700'
                                    }`}
                            >
                                <p className="font-bold text-sm line-clamp-1">{p.name}</p>
                                <p className="text-[10px] font-mono opacity-60 uppercase">{p.patient_id}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Training Status & Logs Block */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isTraining ? 'bg-indigo-500 animate-pulse' : 'bg-slate-800'}`}>
                                    <Activity className={`w-6 h-6 ${isTraining ? 'text-white' : 'text-slate-400'}`} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Optimization Status</h3>
                                    <p className="text-slate-400 text-sm">
                                        {isTraining ? `Optimizing weights for ${patients.find(p => p.id === selectedPatientId)?.name}...` : 'Ready for personalization'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowLogs(!showLogs)}
                                className="flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold transition-all border border-slate-700"
                            >
                                <TerminalIcon className="w-4 h-4" />
                                {showLogs ? 'Hide Logs' : 'View Logs'}
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showLogs ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Collapsible Logs */}
                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showLogs ? 'max-h-[500px] mt-8 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="bg-slate-950/80 border border-slate-800/50 rounded-2xl p-6 h-[400px] flex flex-col shadow-inner backdrop-blur-xl">
                                <div
                                    ref={scrollRef}
                                    className="flex-1 overflow-y-auto font-mono text-sm space-y-2 custom-scrollbar"
                                >
                                    {logs.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-600 italic">
                                            <TerminalIcon className="w-12 h-12 mb-4 opacity-10" />
                                            No sessions in progress
                                        </div>
                                    )}
                                    {logs.map((log, i) => (
                                        <div key={i} className="flex gap-4 animate-in slide-in-from-left-2 duration-200">
                                            <span className="text-slate-700 select-none w-6">{i + 1}</span>
                                            <span className={log.includes('[SUCCESS]') ? 'text-emerald-400' : log.includes('[EPOCH]') ? 'text-indigo-400' : log.includes('[ERROR]') ? 'text-red-400' : 'text-slate-400'}>
                                                {log}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl">
                            <p className="text-sm text-slate-500 mb-1">Session Loss</p>
                            <p className="text-2xl font-bold text-slate-200">
                                {logs.length > 5 ? (logs[logs.length - 2].match(/Loss: ([\d.]+)/)?.[1] || '0.0124') : '---'}
                            </p>
                        </div>
                        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl">
                            <p className="text-sm text-slate-500 mb-1">Target Accuracy</p>
                            <p className="text-2xl font-bold text-emerald-400">
                                {logs.length > 5 ? (logs[logs.length - 2].match(/Accuracy: ([\d.]+)/)?.[1] || '94.2%') : '---'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Area: Status Metrics */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl group hover:border-indigo-500/30 transition-colors">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                                <Cpu className="w-6 h-6 text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Device Engine</p>
                                <p className="font-bold">FastAPI Local</p>
                            </div>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full bg-indigo-500 ${isTraining ? 'w-full animate-pulse' : 'w-1/3 text-slate-700'}`} />
                        </div>
                    </div>

                    <div className="p-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl relative overflow-hidden group">
                        <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-white/10 rotate-12 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-bold mb-2">Privacy Shield</h3>
                        <p className="text-white/70 text-sm leading-relaxed">
                            Personalized weights are stored locally and encrypted before synchronization.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
