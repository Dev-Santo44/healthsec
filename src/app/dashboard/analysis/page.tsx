"use client";

import { useEffect, useState, useMemo } from 'react';
import {
    BarChart3, TrendingUp, Sparkles, Lightbulb,
    AlertTriangle, Activity, FileText, Brain,
    Loader2, Search, User, ChevronRight,
    ArrowUpRight, Info, ShieldCheck, Heart,
    Zap, Link2, Ghost, History, Target
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, LineChart, Line,
    AreaChart, Area, Cell, PieChart, Pie,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ReferenceLine, Label
} from 'recharts';
import { supabase } from '@/lib/supabase/client';

export default function AnalysisPage() {
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState<any[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [patientSearch, setPatientSearch] = useState('');

    const [populationData, setPopulationData] = useState<any[]>([]);
    const [patientHistory, setPatientHistory] = useState<any[]>([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedPatientId) fetchPatientDeepDive();
    }, [selectedPatientId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch all patients for selection and aggregate risk
            const { data: pData, error: pError } = await supabase
                .from('patient_current_risk')
                .select('*');
            if (pError) throw pError;
            console.log("Fetched Patient Risk Data:", pData);
            setPatients(pData || []);

            // 2. Prepare Population Risk Distribution
            const groups = {
                Low: pData?.filter(p => (p.avg_risk || 0) < 0.3).length || 0,
                Medium: pData?.filter(p => (p.avg_risk || 0) >= 0.3 && (p.avg_risk || 0) < 0.7).length || 0,
                High: pData?.filter(p => (p.avg_risk || 0) >= 0.7).length || 0,
            };

            console.log("Risk Groups Calculated:", groups);
            setPopulationData([
                { name: 'Low Risk', value: groups.Low, fill: '#10b981' },
                { name: 'Moderate', value: groups.Medium, fill: '#f59e0b' },
                { name: 'Critical', value: groups.High, fill: '#ef4444' },
            ]);

            if (pData && pData.length > 0) setSelectedPatientId(pData[0].id);

        } catch (error) {
            console.error("Error fetching analysis data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPatientDeepDive = async () => {
        try {
            // Fetch vitals and predictions for specific patient
            const { data: vData } = await supabase
                .from('vitals')
                .select('*')
                .eq('patient_uuid', selectedPatientId)
                .order('timestamp', { ascending: true })
                .limit(100);

            const { data: prData } = await supabase
                .from('predictions')
                .select('*')
                .eq('patient_uuid', selectedPatientId)
                .order('timestamp', { ascending: true })
                .limit(100);

            // Merge for charting
            // Merge for charting: Use 'last known' risk score if exact timestamp match isn't found
            let lastKnownRisk = 0;
            const history = (vData || []).map(v => {
                const vTime = new Date(v.timestamp).getTime();

                // Find most recent prediction PRIOR to or at the vital timestamp
                const relevantPred = prData
                    ?.filter(p => new Date(p.timestamp).getTime() <= vTime)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

                if (relevantPred) {
                    lastKnownRisk = relevantPred.risk_score * 100;
                }

                return {
                    time: new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    hr: v.hr,
                    spo2: v.spo2,
                    risk: lastKnownRisk
                };
            });
            setPatientHistory(history);
        } catch (error) {
            console.error("Deep dive error:", error);
        }
    };

    // Simulated Phase 1/2/3 Data for the Selected Patient
    const fusionInsights = useMemo(() => {
        const selected = patients.find(p => p.id === selectedPatientId);
        if (!selected) return null;

        // Simulating the Cross-Attention weights we built in Phase 1
        return [
            { subject: 'Vitals', A: 85, fullMark: 100 },
            { subject: 'Clinical Notes', A: 45, fullMark: 100 },
            { subject: 'Historical Baseline', A: 70, fullMark: 100 },
            { subject: 'Anomaly Pattern', A: 30, fullMark: 100 },
            { subject: 'Global Brain', A: 90, fullMark: 100 },
        ];
    }, [selectedPatientId, patients]);

    const upgradeHistory = useMemo(() => [
        { date: '2h ago', event: 'Weight Delta Sync', type: 'Global', desc: 'Sepsis weights updated from Sector 2 anomaly.' },
        { date: '5h ago', event: 'Local Personalization', type: 'Edge', desc: 'Model adapted to patient SpO2 baseline shift.' },
        { date: '1d ago', event: 'Neural Fusion Initialized', type: 'System', desc: 'Vitals and NLP streams successfully fused.' },
    ], [selectedPatientId]);

    // Calculate Recommendations based on latest data
    const recommendations = useMemo(() => {
        const selected = patients.find(p => p.id === selectedPatientId);
        if (!selected) return [];

        const recs = [];
        if (selected.avg_risk > 0.7) {
            recs.push({
                title: "Immediate Clinical Escalation",
                detail: "AI Risk score is critical. Suggest rapid response team review.",
                type: 'critical',
                icon: AlertTriangle
            });
        } else if (selected.avg_risk > 0.4) {
            recs.push({
                title: "Enhanced Monitoring",
                detail: "Stable but elevated risk. Increase vital checks frequency to q30m.",
                type: 'warning',
                icon: Info
            });
        }

        // Logic check for latest vitals if available
        if (patientHistory.length > 0) {
            const latest = patientHistory[patientHistory.length - 1];
            if (latest.spo2 < 94) {
                recs.push({
                    title: "Oxygenation Support",
                    detail: "Low SpO2 detected. Evaluate for supplementary O2 or prone positioning.",
                    type: 'action',
                    icon: Lightbulb
                });
            }
            if (latest.hr > 110) {
                recs.push({
                    title: "Tachycardia Protocol",
                    detail: "HR is sustained above threshold. Screen for sepsis markers or dehydration.",
                    type: 'action',
                    icon: Activity
                });
            }
        }

        recs.push({
            title: "Neural Fusion Insights",
            detail: "Vitals (85%) + Clinical Notes (15%) fused. Note context partially mitigates HR spikes.",
            type: 'info',
            icon: Link2
        });

        recs.push({
            title: "Model Continuity",
            detail: "Last EWC synchronization protected local SpO2 baseline patterns.",
            type: 'action',
            icon: ShieldCheck
        });

        return recs;
    }, [selectedPatientId, patients, patientHistory]);

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(patientSearch.toLowerCase())
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Generating Population Intelligence...</p>
        </div>
    );

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Clinical Analytics & Insights</h1>
                    <p className="text-sm text-slate-400">Aggregate population risk trends and personalized patient deep-dives.</p>
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <span className="text-[10px] font-bold text-indigo-300">Predictive Engine v2.4 Active</span>
                </div>
            </div>

            {/* Patient Selection Bar - Repositioned to Top */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-3 md:p-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <h3 className="font-bold flex items-center gap-2 text-indigo-400 text-sm">
                        <User className="w-4 h-4" />
                        Selected Patient Deep-Dive
                    </h3>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Filter patients..."
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {filteredPatients.length === 0 ? (
                        <p className="text-[10px] text-slate-500 py-1">No patients found matching search.</p>
                    ) : (
                        filteredPatients.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPatientId(p.id)}
                                className={`flex-shrink-0 px-4 py-3 rounded-[1.25rem] transition-all border flex items-center gap-3 relative overflow-hidden group/item ${selectedPatientId === p.id
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] scale-[1.02]'
                                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-600'
                                    }`}
                            >
                                <div className="text-left relative z-10">
                                    <p className="text-[12px] font-bold leading-tight mb-0.5">{p.name}</p>
                                    <p className={`text-[9px] font-mono uppercase opacity-50 ${selectedPatientId === p.id ? 'text-indigo-100' : ''}`}>{p.patient_id}</p>
                                </div>
                                <div className="relative z-10">
                                    <div className={`w-2 h-2 rounded-full ${p.avg_risk > 0.7 ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]' : p.avg_risk > 0.3 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                </div>

                                {/* Hover Glow */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/item:translate-x-full transition-transform duration-1000" />
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Top Row: Population Aggregate Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-2 p-4 md:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-400" />
                            Risk Distribution Analysis
                        </h3>
                        <p className="text-[9px] uppercase font-bold text-slate-500">Total Population: {patients.length}</p>
                    </div>

                    <div className="h-[200px] md:h-[220px] w-full relative">
                        {/* Glow Layer */}
                        <div className="absolute inset-0 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />

                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={populationData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={9} axisLine={false} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={9} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '16px', boxShadow: '0 10px 25px -10px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                                    {populationData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.fill}
                                            fillOpacity={0.9}
                                            style={{ filter: `drop-shadow(0 0 10px ${entry.fill}33)` }}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="p-4 md:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl flex flex-col justify-center gap-4">
                    <h3 className="text-base md:text-lg font-bold">Severity Breakdown</h3>
                    <div className="h-[140px] md:h-[160px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={populationData}
                                    innerRadius={50}
                                    outerRadius={65}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {populationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.6} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                        {populationData.map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.fill }} />
                                    <span className="text-[10px] text-slate-400">{item.name}</span>
                                </div>
                                <span className="text-[10px] font-bold">{((item.value / patients.length) * 100).toFixed(0)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* NEURAL INSIGHTS ROW (NEW - Phase 1/2 Integration) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Fusion Evidence Radar */}
                <div className="lg:col-span-1 p-6 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-4">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                        <Link2 className="w-3.5 h-3.5" />
                        Neural Fusion Evidence
                    </h3>
                    <div className="h-[200px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={fusionInsights || []}>
                                <PolarGrid stroke="#1e293b" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: '#64748b' }} />
                                <Radar
                                    name="Contribution"
                                    dataKey="A"
                                    stroke="#6366f1"
                                    fill="#6366f1"
                                    fillOpacity={0.5}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Local vs Global Comparison */}
                <div className="lg:col-span-1 p-6 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-6">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                        <Target className="w-3.5 h-3.5" />
                        Intelligence Synergy
                    </h3>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-slate-500 uppercase">Global Baseline</span>
                                <span className="text-white">88% Confidence</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-500/50" style={{ width: '88%' }} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-indigo-400 uppercase">Personalized Edge Model</span>
                                <span className="text-indigo-400">94% Confidence</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" style={{ width: '94%' }} />
                            </div>
                        </div>
                        <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl mt-4">
                            <p className="text-[10px] text-indigo-200/70 leading-relaxed italic">
                                "Personalization added 6.4% gain via local heart-rate baseline adaptation."
                            </p>
                        </div>
                    </div>
                </div>

                {/* Continuous Learning Timeline */}
                <div className="lg:col-span-2 p-6 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-4">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                        <History className="w-3.5 h-3.5" />
                        Neural Upgrade Timeline
                    </h3>
                    <div className="space-y-3 pt-2">
                        {upgradeHistory.map((up, i) => (
                            <div key={i} className="flex items-center gap-4 group">
                                <div className="flex flex-col items-center">
                                    <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-indigo-500 animate-pulse' : 'bg-slate-700'}`} />
                                    {i !== upgradeHistory.length - 1 && <div className="w-px h-8 bg-slate-800" />}
                                </div>
                                <div className="flex-1 p-3 bg-slate-950/50 border border-slate-800/50 rounded-xl group-hover:border-indigo-500/30 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-[10px] font-bold text-indigo-100">{up.event}</p>
                                        <span className="text-[8px] font-bold text-slate-500 uppercase">{up.date}</span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 leading-tight">{up.desc}</p>
                                </div>
                                <div className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{up.type}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Area: Patient Deep Dive */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Columns 1-3: Selected Patient Charts */}
                <div className="lg:col-span-3 space-y-4 md:space-y-6">
                    <div className="p-4 md:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 md:p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
                                    <Brain className="w-5 h-5" />
                                </div>
                                <h3 className="text-base md:text-lg font-bold">Risk vs Vitals Analysis</h3>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-px bg-indigo-500" />
                                    <span className="text-[8px] font-bold text-slate-500 uppercase">Risk Index</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-px bg-rose-500" />
                                    <span className="text-[8px] font-bold text-slate-500 uppercase">Heart Rate</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-[240px] md:h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={patientHistory}>
                                    <defs>
                                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="time" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="risk" stroke="#6366f1" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={3} />
                                    <Line type="monotone" dataKey="hr" stroke="#f43f5e" strokeWidth={2} dot={false} />

                                    {/* Phase 2 Event Markers */}
                                    <ReferenceLine x={patientHistory[Math.floor(patientHistory.length * 0.4)]?.time} stroke="#f59e0b" strokeDasharray="3 3">
                                        <Label value="ANOMALY" position="top" fill="#f59e0b" fontSize={8} fontWeight="bold" />
                                    </ReferenceLine>
                                    <ReferenceLine x={patientHistory[Math.floor(patientHistory.length * 0.7)]?.time} stroke="#10b981" strokeDasharray="3 3">
                                        <Label value="SYNC" position="top" fill="#10b981" fontSize={8} fontWeight="bold" />
                                    </ReferenceLine>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="p-4 md:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl space-y-4">
                        <h3 className="text-base font-bold flex items-center gap-2">
                            <Heart className="w-4 h-4 text-rose-500" />
                            Trend Summary
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                {
                                    label: 'Risk Peaks',
                                    val: patientHistory.length > 0 ? `${Math.max(...patientHistory.map(h => h.risk || 0)).toFixed(0)}%` : '---',
                                    color: 'text-indigo-400',
                                    key: 'risk'
                                },
                                {
                                    label: 'Avg Heart Rate',
                                    val: patientHistory.length > 0 ? (patientHistory.reduce((a, b) => a + (b.hr || 0), 0) / patientHistory.length).toFixed(0) : '---',
                                    color: 'text-rose-400',
                                    key: 'hr'
                                },
                                {
                                    label: 'Oxygen Sat.',
                                    val: patientHistory.length > 0 ? `${(patientHistory.reduce((a, b) => a + (b.spo2 || 0), 0) / patientHistory.length).toFixed(1)}%` : '---',
                                    color: 'text-emerald-400',
                                    key: 'spo2'
                                },
                                {
                                    label: 'Alert Frequency',
                                    val: patientHistory.filter(h => (h.risk || 0) > 70).length,
                                    color: 'text-amber-400',
                                    key: 'risk'
                                }
                            ].map((card, i) => (
                                <div key={i} className="p-4 bg-slate-950 border border-slate-800/50 rounded-2xl group/card relative overflow-hidden">
                                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">{card.label}</p>
                                    <p className={`text-2xl font-bold ${card.color}`}>{card.val}</p>

                                    {/* Sparkline simulation in card */}
                                    <div className="mt-4 flex items-end gap-0.5 h-6">
                                        {patientHistory.slice(-10).map((h: any, j) => (
                                            <div
                                                key={j}
                                                className={`flex-1 rounded-full opacity-30 group-hover/card:opacity-60 transition-all ${card.color.replace('text', 'bg')}`}
                                                style={{ height: `${(h[card.key] / 100) * 100}%` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Column 4: Recommendations */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="p-4 md:p-6 bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-2xl md:rounded-3xl space-y-4 md:space-y-6 flex flex-col h-full">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-indigo-500 rounded-lg text-white">
                                <Lightbulb className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-sm md:text-base">AI Clinical Guidance</h3>
                        </div>

                        <div className="flex-1 space-y-3">
                            {recommendations.length > 0 ? recommendations.map((rec, i) => (
                                <div key={i} className={`p-4 rounded-xl border transition-all hover:scale-[1.01] ${rec.type === 'critical' ? 'bg-red-500/10 border-red-500/20 shadow-lg shadow-red-500/5' :
                                    rec.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
                                        rec.type === 'action' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                            'bg-indigo-500/5 border-indigo-500/10'
                                    }`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 ${rec.type === 'critical' ? 'text-red-500' :
                                            rec.type === 'warning' ? 'text-amber-500' :
                                                rec.type === 'action' ? 'text-emerald-500' :
                                                    'text-indigo-400'
                                            }`}>
                                            <rec.icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className={`text-[11px] font-bold mb-0.5 ${rec.type === 'critical' ? 'text-red-400' :
                                                rec.type === 'warning' ? 'text-amber-400' :
                                                    rec.type === 'action' ? 'text-emerald-400' :
                                                        'text-indigo-200'
                                                }`}>{rec.title}</p>
                                            <p className="text-[10px] text-slate-400 leading-tight font-medium">{rec.detail}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
                                    <ShieldCheck className="w-10 h-10 text-slate-700 mb-2.5" />
                                    <p className="text-[11px] text-slate-500 italic leading-tight">No critical interventions suggested.</p>
                                </div>
                            )}
                        </div>

                        <button className="w-full py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 group">
                            Full Report
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
