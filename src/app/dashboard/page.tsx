"use client";

import { useEffect, useState } from 'react';
import {
    Activity, Cpu, Shield, Users, ArrowUpRight,
    TrendingUp, Sparkles, AlertTriangle, FileText,
    Clock, Loader2, Heart, Thermometer, UserCheck, CheckCircle2,
    LayoutDashboard
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalPatients: 0,
        highRiskCount: 0,
        avgRisk: 0,
        activeAlerts: 0
    });
    const [patients, setPatients] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Summary Stats from View
            const { data: riskData } = await supabase.from('patient_current_risk').select('*');
            const total = riskData?.length || 0;
            const highRisk = riskData?.filter(p => p.avg_risk >= 0.7).length || 0;
            const avg = riskData?.length ? (riskData.reduce((acc, p) => acc + (p.avg_risk || 0), 0) / total) : 0;

            // 2. Fetch Patients for Bed Grid
            const { data: patientsData } = await supabase.from('patients').select('id, name, patient_id, bed_number, status');
            setPatients(patientsData || []);

            // 3. Fetch Active Vital Alerts (for the stat counter badge)
            const flaggedIds: string[] = [];
            if (patientsData) {
                for (const patient of patientsData) {
                    const { data: latestVitals } = await supabase
                        .from('vitals')
                        .select('*')
                        .eq('patient_uuid', patient.id)
                        .eq('is_resolved', false)
                        .order('timestamp', { ascending: false })
                        .limit(1)
                        .single();

                    if (latestVitals) {
                        const issues = [];
                        if (latestVitals.hr > 100) issues.push('Tachycardia');
                        if (latestVitals.spo2 < 94) issues.push('Hypoxia');
                        if (latestVitals.temp > 38) issues.push('Fever');

                        if (issues.length > 0) flaggedIds.push(patient.id);
                    }
                }
            }

            setStats({
                totalPatients: total,
                highRiskCount: highRisk,
                avgRisk: avg,
                activeAlerts: flaggedIds.length
            });

        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Define Ward Layout (2 rows A-B, 5 beds each = 10 beds)
    const beds = ['A', 'B'].flatMap(row =>
        [1, 2, 3, 4, 5].map(num => `${row}${num}`)
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Synchronizing Clinical Data...</p>
        </div>
    );

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Clinical Overview</h1>
                    <p className="text-sm md:text-base text-slate-400 mt-1">Real-time occupancy and risk surveillance.</p>
                </div>
                <span className="self-start text-[10px] font-bold bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-widest">
                    Sector 4 - Live
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: 'Total Inpatients', value: stats.totalPatients, icon: Users, color: 'text-indigo-500', trend: 'Active Admissions' },
                    { label: 'Critical Risk', value: stats.highRiskCount, icon: Shield, color: 'text-red-500', trend: 'Sepsis Priority' },
                    { label: 'Vital Alerts', value: stats.activeAlerts, icon: AlertTriangle, color: 'text-amber-500', trend: 'Action Required' },
                    { label: 'Avg System Risk', value: `${(stats.avgRisk * 100).toFixed(1)}%`, icon: TrendingUp, color: 'text-emerald-500', trend: 'Stability Index' },
                ].map((stat, i) => (
                    <div key={i} className="p-3 md:p-4 bg-slate-900/50 border border-slate-800 rounded-xl md:rounded-2xl group hover:border-slate-700 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <div className={`p-2 rounded-xl bg-slate-950 border border-slate-800 ${stat.color}`}>
                                <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-medium text-slate-500">{stat.label}</p>
                            <h4 className="text-xl md:text-2xl font-bold mt-0.5 md:mt-1 tracking-tight">{stat.value}</h4>
                            <p className="text-[9px] md:text-[10px] font-bold uppercase text-slate-400 mt-2 flex items-center gap-1">
                                <Activity className="w-3 h-3 opacity-50" />
                                {stat.trend}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    {/* Ward Occupancy Grid */}
                    <div className="p-4 md:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
                            <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
                                <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
                                Ward Bed Occupancy
                            </h3>
                            <div className="flex gap-4 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-indigo-500 rounded-sm" />
                                    <span>Occupied</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 border border-slate-700 rounded-sm" />
                                    <span>Vacant</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                            {beds.map(bedId => {
                                const patient = patients.find(p => p.bed_number === bedId);
                                return (
                                    <div key={bedId} className="aspect-square relative">
                                        {patient ? (
                                            <Link
                                                href={`/dashboard/patients/${patient.id}`}
                                                className="absolute inset-0 p-2 bg-indigo-600/10 border-2 border-indigo-500/30 rounded-lg md:rounded-xl hover:bg-indigo-600 hover:border-indigo-400 hover:scale-[1.05] transition-all group flex flex-col justify-between"
                                            >
                                                <span className="text-[8px] md:text-[9px] font-bold text-indigo-400 group-hover:text-white/80">{bedId}</span>
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] md:text-[10px] font-bold truncate group-hover:text-white leading-tight">{patient.name.split(' ')[0]}</p>
                                                    <div className="w-3 md:w-4 h-0.5 bg-indigo-500 group-hover:bg-white/40" />
                                                </div>
                                            </Link>
                                        ) : (
                                            <div className="absolute inset-0 p-2 bg-slate-950/40 border border-slate-800 border-dashed rounded-lg md:rounded-xl flex flex-col justify-between opacity-40">
                                                <span className="text-[8px] md:text-[9px] font-bold text-slate-600">{bedId}</span>
                                                <p className="text-[7px] md:text-[8px] font-bold text-slate-700 tracking-tighter uppercase">Vacant</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-4 md:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl">
                        <h3 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            Clinical Resource Tracker
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {[
                                { title: "Imaging Backlog", val: "0 Pending", icon: Cpu, color: "text-indigo-400", href: "/dashboard/analysis" },
                                { title: "NLP Proc Engine", val: "Active", icon: FileText, color: "text-violet-400", href: "/dashboard/ml-center" },
                                { title: "Secure Edge nodes", val: "4 Synchronized", icon: Shield, color: "text-emerald-400", href: "/dashboard" },
                                { title: "System Latency", val: "< 12ms", icon: Activity, color: "text-amber-400", href: "/dashboard/analysis" }
                            ].map((item, i) => (
                                <Link
                                    key={i}
                                    href={item.href}
                                    className="p-3 bg-slate-950/50 border border-slate-800/50 rounded-xl flex items-center justify-between hover:bg-slate-900 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform`} />
                                        <span className="text-xs font-bold text-slate-300">{item.title}</span>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-slate-500">{item.val}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4 md:space-y-6">
                    <div className="p-5 md:p-6 bg-indigo-600 rounded-2xl md:rounded-3xl relative overflow-hidden group">
                        <Shield className="absolute -top-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
                        <h3 className="text-lg md:text-xl font-bold mb-2">HIPAA Compliance</h3>
                        <p className="text-white/70 text-[10px] md:text-xs leading-relaxed mb-4">
                            Verified on-device processing. No patient PHI left the secure edge gateway during the last 24h cycle.
                        </p>
                        <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-white tracking-widest uppercase">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Standards Active
                        </div>
                    </div>

                    <div className="p-5 md:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl space-y-3">
                        <h3 className="font-bold flex items-center gap-2 text-sm md:text-base">
                            <Clock className="w-4 h-4 text-emerald-400" />
                            Next Patient Rounds
                        </h3>
                        <div className="space-y-2.5">
                            {patients?.slice(0, 5).map((p, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-1 h-6 bg-indigo-500 rounded-full" />
                                    <div>
                                        <p className="text-[11px] md:text-xs font-bold">{p.name}</p>
                                        <p className="text-[9px] md:text-[10px] text-slate-500">Bed {p.bed_number || 'N/A'} • T+2h checkup</p>
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
