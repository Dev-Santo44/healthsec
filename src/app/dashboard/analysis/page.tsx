"use client";

import { BarChart3, TrendingUp, Sparkles, Lightbulb, AlertTriangle, ArrowRight } from 'lucide-react';

export default function AnalysisPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Health Analysis</h1>
                <p className="text-slate-400">Interpretation of your locally trained health model results.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Prediction Card */}
                <div className="lg:col-span-2 p-8 bg-slate-900/50 border border-slate-800 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-24 h-24" />
                    </div>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                        Next-Gen Prediction
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <p className="text-slate-500 text-sm mb-1">Health Stability Score</p>
                            <div className="text-4xl font-extrabold text-white">87<span className="text-indigo-500">/100</span></div>
                        </div>
                        <p className="text-slate-400 leading-relaxed">
                            Based on your last 7 days of training, your health metrics indicate high cardiovascular stability with a slight trend in improved recovery times.
                        </p>
                        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-sm">
                            <span className="text-emerald-400 flex items-center gap-1 font-medium">
                                <TrendingUp className="w-4 h-4" /> 5.2% improvement
                            </span>
                            <span className="text-slate-500">Standard Deviation: 1.4</span>
                        </div>
                    </div>
                </div>

                {/* Quick Insights */}
                <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                        AI Suggestion
                    </h3>
                    <ul className="space-y-4">
                        <li className="text-sm text-slate-300 flex gap-3 italic">
                            <span className="text-indigo-500 font-bold">•</span>
                            "Consider increasing deep sleep by 30 mins to optimize recovery."
                        </li>
                        <li className="text-sm text-slate-300 flex gap-3 italic">
                            <span className="text-indigo-500 font-bold">•</span>
                            "Pulse variability suggests higher intensity morning workouts."
                        </li>
                    </ul>
                </div>

                <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Risk Factor
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Minor anomalies detected in late-night HR variability. Monitor stress levels during working hours.
                    </p>
                </div>
            </div>

            {/* Main Analysis Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Deep Insights</h2>
                    <div className="space-y-4">
                        {[
                            { title: "Improvement Plan", description: "Gradual load increase for lung capacity optimization based on current SpO2 trends.", color: "text-emerald-400" },
                            { title: "Lifestyle Adjustment", description: "Shift caffeine intake to earlier hours to mitigate detected sleep-cycle interference.", color: "text-indigo-400" }
                        ].map((box, i) => (
                            <div key={i} className="p-6 bg-slate-900/40 border border-slate-800/50 rounded-2xl hover:border-indigo-500/20 transition-all flex items-start gap-4">
                                <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500" />
                                <div>
                                    <h4 className={`font-semibold ${box.color} mb-1`}>{box.title}</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">{box.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Model Performance</h2>
                    <div className="p-8 bg-slate-950 border border-slate-800 rounded-3xl block">
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-sm font-medium text-slate-400 uppercase tracking-widest">Global Correlation</span>
                            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-full">High Accuracy</span>
                        </div>
                        <div className="flex items-end gap-2 h-40">
                            {[40, 70, 45, 90, 65, 80, 50, 85].map((h, i) => (
                                <div
                                    key={i}
                                    className="flex-1 bg-indigo-500/20 rounded-t-lg relative group transition-all hover:bg-indigo-600/40"
                                    style={{ height: `${h}%` }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-800 text-xs px-2 py-1 rounded transition-opacity">
                                        {h}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
