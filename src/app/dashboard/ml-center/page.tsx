"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Brain,
    Globe,
    Activity,
    Zap,
    ShieldCheck,
    TrendingUp,
    AlertCircle,
    Cpu,
    RefreshCcw,
    Database,
    Network
} from 'lucide-react';

export default function MLCenterPage() {
    const [knowledgeGain, setKnowledgeGain] = useState(2048576);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [logs, setLogs] = useState([
        { status: 'OPTIMIZED', msg: 'Sepsis Risk thresholds tightened for geriatric cluster.', time: '2m ago', icon: TrendingUp, color: 'text-indigo-400' },
        { status: 'ANOMALY', msg: 'Unexpected vital correlation detected in Sector 2.', time: '15m ago', icon: AlertCircle, color: 'text-amber-400' },
        { status: 'NORMALIZED', msg: 'Local weights successfully merged into Global Brain.', time: '1h ago', icon: ShieldCheck, color: 'text-emerald-400' },
        { status: 'SECURE', msg: 'New differential privacy layer applied to weight submission.', time: '3h ago', icon: Lock, color: 'text-indigo-400' }
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            setKnowledgeGain(prev => prev + Math.floor(Math.random() * 10));

            // Randomly inject an anomaly correction log
            if (Math.random() > 0.8) {
                const newLog = {
                    status: 'CORRECTED',
                    msg: 'EWC local optimization applied to Sector 4 anomaly.',
                    time: 'Just now',
                    icon: Zap,
                    color: 'text-emerald-400'
                };
                setLogs(prev => [newLog, ...prev.slice(0, 3)]);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const triggerSync = async () => {
        setIsSyncing(true);
        setSyncProgress(0);

        // Progress bar simulation
        const timer = setInterval(() => {
            setSyncProgress(prev => Math.min(95, prev + 5));
        }, 100);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000'}/sync/global/risk_fusion`, {
                method: 'POST'
            });
            const result = await response.json();

            setSyncProgress(100);
            await new Promise(r => setTimeout(r, 500));

            if (result.status === 'success') {
                const newLog = {
                    status: 'SYNCED',
                    msg: 'Global Brain updated. Proactive screening triggered across 144 nodes.',
                    time: 'Just now',
                    icon: Globe,
                    color: 'text-indigo-400'
                };
                setLogs(prev => [newLog, ...prev.slice(0, 3)]);
            }
        } catch (error) {
            console.error("Global sync failed:", error);
        } finally {
            clearInterval(timer);
            setIsSyncing(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">ML Operations Center</h1>
                    <p className="text-slate-400">Monitoring global AI evolution and federated knowledge propagation.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Neural Fusion: Active</span>
                    </div>
                    <button
                        onClick={triggerSync}
                        disabled={isSyncing}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${isSyncing ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                            }`}
                    >
                        <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing Weights...' : 'Force Global Sync'}
                    </button>
                </div>
            </div>

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Global Model Health */}
                <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl">
                            <ShieldCheck className="w-6 h-6 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10">+2.4% vs last week</span>
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Global Model Health</h3>
                    <div className="flex items-end gap-2">
                        <p className="text-4xl font-bold text-white">98.2%</p>
                        <p className="text-slate-500 text-sm mb-1 font-mono">Confidence</p>
                    </div>
                    {/* Tiny Graph Sparkline Simulation */}
                    <div className="mt-8 flex items-end gap-1 h-12">
                        {[40, 70, 45, 90, 65, 80, 50, 95, 85, 100].map((h, i) => (
                            <div key={i} className="flex-1 bg-emerald-500/20 rounded-t-sm group-hover:bg-emerald-500/40 transition-all" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                </div>

                {/* Online Learning Progress */}
                <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl">
                            <Activity className="w-6 h-6 text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/5 px-2 py-1 rounded-lg border border-indigo-500/10">Active Edge Nodes</span>
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Online Learning Progress</h3>
                    <div className="flex items-end gap-2">
                        <p className="text-4xl font-bold text-white">14</p>
                        <p className="text-slate-500 text-sm mb-1 font-mono">In-Flight Tasks</p>
                    </div>
                    <div className="mt-8 space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                            <span>Sector 4 Sync</span>
                            <span>{isSyncing ? `${syncProgress}%` : '82%'}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: isSyncing ? `${syncProgress}%` : '82%' }} />
                        </div>
                    </div>
                </div>

                {/* Knowledge Gain */}
                <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] relative overflow-hidden group border-indigo-500/20 shadow-2xl shadow-indigo-500/5">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-amber-500/10 rounded-2xl">
                            <Zap className="w-6 h-6 text-amber-400 animate-pulse" />
                        </div>
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Knowledge Gain</h3>
                    <p className="text-4xl font-bold text-white font-mono tracking-tighter tabular-nums">
                        {knowledgeGain.toLocaleString()}
                    </p>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Unique Clinical Data Points</p>
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Global Sync Map (Visual Placeholder) */}
                <div className="lg:col-span-2 p-8 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Globe className="w-5 h-5 text-indigo-500" />
                                Federated Weight Syncing
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Cross-sector knowledge propagation network</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Synced</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                                <span className="text-[10px] font-bold text-indigo-400 uppercase">Optimizing</span>
                            </div>
                        </div>
                    </div>

                    <div className="aspect-[2/1] bg-slate-950 rounded-2xl border border-slate-800/50 relative overflow-hidden group">
                        {/* Simulated Map Background */}
                        <div className="absolute inset-0 opacity-10"
                            style={{
                                backgroundImage: `radial-gradient(circle, #4f46e5 1px, transparent 1px)`,
                                backgroundSize: '30px 30px'
                            }}>
                        </div>

                        {/* Node Connections (Simple SVGs) */}
                        <svg className="absolute inset-0 w-full h-full">
                            <line x1="20%" y1="30%" x2="50%" y2="50%" stroke="rgba(79, 70, 229, 0.2)" strokeWidth="1" strokeDasharray="4 2" />
                            <line x1="80%" y1="40%" x2="50%" y2="50%" stroke="rgba(79, 70, 229, 0.2)" strokeWidth="1" strokeDasharray="4 2" />
                            <line x1="40%" y1="80%" x2="50%" y2="50%" stroke="rgba(79, 70, 229, 0.2)" strokeWidth="1" strokeDasharray="4 2" />

                            {/* Central Hub */}
                            <circle cx="50%" cy="50%" r="8" fill="rgba(79, 70, 229, 0.2)" className="animate-pulse" />
                            <circle cx="50%" cy="50%" r="4" fill="#4f46e5" />

                            {/* Regional Nodes */}
                            <circle cx="20%" cy="30%" r="4" fill="#10b981" />
                            <circle cx="80%" cy="40%" r="4" fill="#4f46e5" className="animate-pulse" />
                            <circle cx="40%" cy="80%" r="4" fill="#10b981" />
                        </svg>

                        {/* Labels */}
                        <div className="absolute top-[25%] left-[15%] text-[8px] font-bold text-slate-600 uppercase">Alpha-Wing-S4</div>
                        <div className="absolute top-[35%] right-[15%] text-[8px] font-bold text-indigo-400 uppercase">Omega-Node-S1</div>
                        <div className="absolute bottom-[25%] left-[38%] text-[8px] font-bold text-slate-600 uppercase">Beta-Station-S2</div>

                        {/* Status Overlay */}
                        <div className="absolute bottom-6 right-6 p-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl space-y-2">
                            <div className="flex justify-between items-center gap-8">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Latency</span>
                                <span className="text-[10px] text-emerald-400 font-mono">12ms</span>
                            </div>
                            <div className="flex justify-between items-center gap-8">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Delta Size</span>
                                <span className="text-[10px] text-slate-300 font-mono">41.2 KB</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: News Feed / Learning Logs */}
                <div className="space-y-6">
                    <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-[2.5rem]">
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-indigo-400">
                            <Brain className="w-5 h-5" />
                            Learning Logs
                        </h3>
                        <div className="space-y-4">
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-4 p-4 hover:bg-slate-800/30 rounded-2xl transition-colors border border-transparent hover:border-slate-800">
                                    <div className={`mt-1 ${log.color}`}>
                                        <log.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold uppercase ${log.color}`}>{log.status}</span>
                                            <span className="text-[9px] text-slate-600 font-medium">{log.time}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">{log.msg}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link
                            href="/dashboard/analysis"
                            className="block w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-2xl text-[10px] uppercase tracking-widest transition-all text-center"
                        >
                            View Historical Training Data
                        </Link>
                    </div>

                    <div className="p-8 bg-indigo-600 rounded-[2.5rem] relative overflow-hidden group">
                        <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-white/10 rotate-12 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-bold text-white mb-2">Continuous Learning</h3>
                        <p className="text-indigo-100/70 text-sm leading-relaxed">
                            The system is currently processing clinical logs from 144 patients across the network.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Missing icons from imports helper
function Lock(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    )
}

function Sparkles(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
        </svg>
    )
}
