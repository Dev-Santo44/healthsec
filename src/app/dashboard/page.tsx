"use client";

import { Activity, Cpu, Shield, Users, ArrowUpRight, TrendingUp, Sparkles, AlertTriangle, FileText, Clock } from 'lucide-react';

export default function DashboardPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard Overview</h1>
                <p className="text-slate-400">Welcome back to your secure health command center.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Sepsis Risk', value: 'Low', icon: Shield, color: 'text-emerald-500', trend: '12.4% Prob.' },
                    { label: 'Imaging Scans', value: 'Clear', icon: Cpu, color: 'text-indigo-500', trend: 'No Anomalies' },
                    { label: 'NLP Reports', value: '3', icon: FileText, color: 'text-violet-500', trend: 'Last: 2h ago' },
                    { label: 'Recovery Score', value: '92%', icon: TrendingUp, color: 'text-amber-500', trend: '+5% Est.' },
                ].map((stat, i) => (
                    <div key={i} className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl group hover:border-slate-700 transition-all hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl bg-slate-950 border border-slate-800 ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                            <h4 className="text-2xl font-bold mt-1">{stat.value}</h4>
                            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                {stat.trend}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            Specialized AI Insights
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { title: "Risk Predictor", desc: "Sepsis & ICU deterioration monitoring active.", status: "Stable", icon: AlertTriangle, color: "text-red-500" },
                                { title: "Computer Vision", desc: "X-ray/MRI anomaly detection verified clear.", status: "Verified", icon: Shield, color: "text-emerald-500" },
                                { title: "Medical NLP", desc: "Patient discharge notes analyzed for drug interactions.", status: "Analyzed", icon: FileText, color: "text-violet-500" },
                                { title: "Stay Estimator", desc: "Predicted recovery period based on current vitals.", status: "4.2 Days", icon: Clock, color: "text-amber-500" }
                            ].map((item, i) => (
                                <div key={i} className="p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl flex items-start gap-3">
                                    <div className={`mt-1 p-2 rounded-lg bg-slate-900 ${item.color}`}>
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-sm">{item.title}</h5>
                                        <p className="text-[11px] text-slate-500 leading-tight mb-2">{item.desc}</p>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${item.color}`}>{item.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-3xl relative overflow-hidden flex flex-col justify-end min-h-[300px] border border-white/10 shadow-2xl shadow-indigo-500/20">
                    <div className="absolute top-0 right-0 p-8 opacity-20">
                        <Shield className="w-32 h-32 text-white" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-2">Edge Computing</h3>
                        <p className="text-white/80 text-sm leading-relaxed mb-6">
                            Your health insights are calculated locally. This ensures total data sovereignty while providing military-grade privacy.
                        </p>
                        <button className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors">
                            Read Security Protocol
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
