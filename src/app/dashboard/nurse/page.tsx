"use client";

import { useEffect, useState } from 'react';
import {
    Stethoscope, HeartPulse, FileText, Search,
    Save, Loader2, CheckCircle2, History, User,
    ArrowUpRight, Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function NursePortalPage() {
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [patients, setPatients] = useState<any[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [patientSearch, setPatientSearch] = useState('');

    const [vitals, setVitals] = useState({
        hr: '',
        bp: '',
        spo2: '',
        temp: ''
    });
    const [note, setNote] = useState('');
    const [recentLogs, setRecentLogs] = useState<any[]>([]);

    useEffect(() => {
        fetchPatients();
    }, []);

    useEffect(() => {
        if (selectedPatientId) {
            fetchRecentLogs();
        } else {
            setRecentLogs([]);
        }
    }, [selectedPatientId]);

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

    const fetchRecentLogs = async () => {
        try {
            const { data: vData } = await supabase
                .from('vitals')
                .select('*')
                .eq('patient_uuid', selectedPatientId)
                .order('timestamp', { ascending: false })
                .limit(5);

            const { data: nData } = await supabase
                .from('notes')
                .select('*')
                .eq('patient_uuid', selectedPatientId)
                .order('timestamp', { ascending: false })
                .limit(5);

            // Combine and sort
            const combined = [
                ...(vData || []).map(v => ({ ...v, type: 'vitals' })),
                ...(nData || []).map(n => ({ ...n, type: 'note' }))
            ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            setRecentLogs(combined.slice(0, 10));
        } catch (error) {
            console.error("Error fetching logs:", error);
        }
    };

    const handleLogSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatientId) return alert("Please select a patient first.");

        setSubmitting(true);
        try {
            // 1. Insert Vitals if any provided
            if (vitals.hr || vitals.bp || vitals.spo2 || vitals.temp) {
                const { error: vError } = await supabase.from('vitals').insert([{
                    patient_uuid: selectedPatientId,
                    hr: vitals.hr ? parseInt(vitals.hr) : null,
                    bp: vitals.bp || null,
                    spo2: vitals.spo2 ? parseInt(vitals.spo2) : null,
                    temp: vitals.temp ? parseFloat(vitals.temp) : null
                }]);
                if (vError) throw vError;
            }

            // 2. Insert Note if provided
            if (note.trim()) {
                const { error: nError } = await supabase.from('notes').insert([{
                    patient_uuid: selectedPatientId,
                    content: note,
                    doctor_id: 'Staff Nurse'
                }]);
                if (nError) throw nError;
            }

            alert("Logs saved successfully.");
            setVitals({ hr: '', bp: '', spo2: '', temp: '' });
            setNote('');
            fetchRecentLogs();
        } catch (error: any) {
            alert(`Log Error: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.patient_id.toLowerCase().includes(patientSearch.toLowerCase())
    );

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Nurse Actions / Clinical Logs</h1>
                    <p className="text-sm text-slate-400">Manual entry for bedside vitals and progressive care observations.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Selector & History */}
                <div className="space-y-4 md:space-y-6">
                    <div className="p-4 md:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl space-y-4">
                        <h3 className="text-base md:text-lg font-bold flex items-center gap-2 text-indigo-400">
                            <User className="w-5 h-5" />
                            Select Patient
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search by name or MRN..."
                                value={patientSearch}
                                onChange={(e) => setPatientSearch(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {loadingPatients ? (
                                <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-slate-600" /></div>
                            ) : filteredPatients.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPatientId(p.id)}
                                    className={`w-full text-left p-3 rounded-xl transition-all border ${selectedPatientId === p.id
                                        ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-100 shadow-lg'
                                        : 'bg-slate-950 border-slate-800/50 text-slate-400 hover:border-slate-700'
                                        }`}
                                >
                                    <p className="font-bold text-xs">{p.name}</p>
                                    <p className="text-[9px] font-mono opacity-60">MRN: {p.patient_id}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 md:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl space-y-4">
                        <h3 className="text-base md:text-lg font-bold flex items-center gap-2 text-amber-400">
                            <History className="w-5 h-5" />
                            Session History
                        </h3>
                        <div className="space-y-3">
                            {!selectedPatientId ? (
                                <p className="text-center py-6 text-slate-500 italic text-xs">Select a patient to view recent activity.</p>
                            ) : recentLogs.length === 0 ? (
                                <p className="text-center py-6 text-slate-500 italic text-xs">No recent logs found.</p>
                            ) : recentLogs.map((log, i) => (
                                <div key={i} className="p-3 bg-slate-950 border border-slate-800/50 rounded-xl">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-[9px] font-bold uppercase ${log.type === 'vitals' ? 'text-rose-500' : 'text-amber-500'}`}>
                                            {log.type}
                                        </span>
                                        <span className="text-[8px] text-slate-600 italic">
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {log.type === 'vitals' ? (
                                        <p className="text-[11px] text-slate-300">HR: {log.hr} | SpO2: {log.spo2}% | BP: {log.bp}</p>
                                    ) : (
                                        <p className="text-[11px] text-slate-300 line-clamp-2">{log.content}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Log Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleLogSubmit} className="space-y-4 md:space-y-6">
                        <div className="p-4 md:p-8 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl space-y-6 md:space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 text-rose-400">
                                    <HeartPulse className="w-6 h-6" />
                                    Manual Vitals Entry
                                </h3>
                                <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                                    <p className="text-[9px] font-bold text-emerald-500 uppercase">Live Sync Active</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold uppercase text-slate-500 px-1">Heart Rate</label>
                                    <input
                                        type="number"
                                        placeholder="75 bpm"
                                        value={vitals.hr}
                                        onChange={(e) => setVitals({ ...vitals, hr: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-rose-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold uppercase text-slate-500 px-1">Blood Pressure</label>
                                    <input
                                        type="text"
                                        placeholder="120/80"
                                        value={vitals.bp}
                                        onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-rose-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold uppercase text-slate-500 px-1">SpO2 (%)</label>
                                    <input
                                        type="number"
                                        placeholder="98%"
                                        value={vitals.spo2}
                                        onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-rose-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold uppercase text-slate-500 px-1">Temp (°C)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="36.6"
                                        value={vitals.temp}
                                        onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-rose-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 md:p-8 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl space-y-4 md:space-y-6">
                            <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 text-violet-400">
                                <FileText className="w-6 h-6" />
                                Clinical Progress Observations
                            </h3>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Observe patient condition, meds administered, or relevant findings..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 md:p-6 text-sm text-white min-h-[140px] resize-none focus:ring-1 focus:ring-violet-500"
                            />

                            <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">Secured</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">Auto-Logged</span>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting || !selectedPatientId}
                                    className="px-6 md:px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-sm transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2 group active:scale-95"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {submitting ? 'Saving...' : 'Commit Log'}
                                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform opacity-50" />
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
