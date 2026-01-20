"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    User, HeartPulse, FileText, Activity, Shield,
    ArrowLeft, Save, Edit3, Loader2, AlertTriangle,
    CheckCircle2, Clock, Trash2, History as HistoryIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function PatientDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [patient, setPatient] = useState<any>(null);
    const [vitals, setVitals] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);
    const [predictions, setPredictions] = useState<any[]>([]);

    // Edit State
    const [editData, setEditData] = useState({
        name: '',
        status: '',
        age: 0,
        gender: '',
        bed_number: ''
    });

    useEffect(() => {
        if (id) fetchPatientData();
    }, [id]);

    const fetchPatientData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Patient
            const { data: pData, error: pError } = await supabase
                .from('patients')
                .select('*')
                .eq('id', id)
                .single();
            if (pError) throw pError;
            setPatient(pData);
            setEditData({
                name: pData.name,
                status: pData.status,
                age: pData.age,
                gender: pData.gender,
                bed_number: pData.bed_number || ''
            });

            // 2. Fetch Vitals
            const { data: vData } = await supabase
                .from('vitals')
                .select('*')
                .eq('patient_uuid', id)
                .order('timestamp', { ascending: false });
            setVitals(vData || []);

            // 3. Fetch Notes
            const { data: nData } = await supabase
                .from('notes')
                .select('*')
                .eq('patient_uuid', id)
                .order('timestamp', { ascending: false });
            setNotes(nData || []);

            // 4. Fetch Predictions
            const { data: prData } = await supabase
                .from('predictions')
                .select('*')
                .eq('patient_uuid', id)
                .order('timestamp', { ascending: false });
            setPredictions(prData || []);

        } catch (error) {
            console.error("Error fetching patient details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('patients')
                .update({
                    name: editData.name,
                    status: editData.status,
                    age: editData.age,
                    gender: editData.gender,
                    bed_number: editData.bed_number
                })
                .eq('id', id);

            if (error) throw error;

            setPatient({ ...patient, ...editData });
            setEditMode(false);
            alert("Patient profile updated successfully.");
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Accessing Decrypted Records...</p>
        </div>
    );

    if (!patient) return (
        <div className="text-center p-20">
            <h2 className="text-2xl font-bold">Patient Not Found</h2>
            <button onClick={() => router.back()} className="mt-4 text-indigo-400 font-bold hover:underline flex items-center gap-2 mx-auto">
                <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all hover:scale-105"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-bold tracking-tight">{patient.name}</h1>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm ${patient.status === 'Flagged' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                patient.status === 'Reviewed' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}>
                                {patient.status}
                            </span>
                        </div>
                        <p className="text-slate-500 font-mono text-xs">UUID: {patient.id}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    {editMode ? (
                        <>
                            <button
                                onClick={() => setEditMode(false)}
                                className="px-6 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setEditMode(true)}
                            className="px-6 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                        >
                            <Edit3 className="w-4 h-4 text-indigo-400" />
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Demographics & Stats */}
                <div className="space-y-8">
                    <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-6">
                        <h3 className="font-bold flex items-center gap-2 text-indigo-400">
                            <User className="w-5 h-5" />
                            Demographics
                        </h3>
                        <div className="space-y-4">
                            {editMode ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-slate-500">Full Name</label>
                                        <input
                                            type="text"
                                            value={editData.name}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase text-slate-500">Age</label>
                                            <input
                                                type="number"
                                                value={editData.age}
                                                onChange={(e) => setEditData({ ...editData, age: parseInt(e.target.value) })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase text-slate-500">Gender</label>
                                            <select
                                                value={editData.gender}
                                                onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white"
                                            >
                                                <option value="M">Male</option>
                                                <option value="F">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-slate-500">Bed Assignment</label>
                                        <select
                                            value={editData.bed_number}
                                            onChange={(e) => setEditData({ ...editData, bed_number: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-indigo-500"
                                        >
                                            <option value="">Unassigned</option>
                                            {['A', 'B'].map(row =>
                                                [1, 2, 3, 4, 5].map(num => (
                                                    <option key={`${row}${num}`} value={`${row}${num}`}>Bed {row}{num}</option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-slate-500">Clinical Status</label>
                                        <select
                                            value={editData.status}
                                            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-indigo-500"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Flagged">Flagged</option>
                                            <option value="Reviewed">Reviewed</option>
                                            <option value="Discharged">Discharged</option>
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                                            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Age</label>
                                            <p className="font-bold text-white text-lg">{patient.age}y</p>
                                        </div>
                                        <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                                            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Sex</label>
                                            <p className="font-bold text-white text-lg">{patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}</p>
                                        </div>
                                        <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                                            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Bed</label>
                                            <p className="font-bold text-indigo-400 text-lg">{patient.bed_number || 'N/A'}</p>
                                        </div>
                                        <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                                            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Admitted</label>
                                            <p className="font-bold text-white text-lg">{new Date(patient.admission_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-6">
                        <h3 className="font-bold flex items-center gap-2 text-emerald-400">
                            <Shield className="w-5 h-5" />
                            AI Risk Index
                        </h3>
                        {predictions.length > 0 ? (
                            <div className="space-y-6">
                                {predictions.slice(0, 3).map((pred, i) => (
                                    <div key={pred.id} className={`p-4 rounded-2xl border ${i === 0 ? 'bg-slate-950 border-slate-800' : 'bg-transparent border-slate-900/50'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-bold uppercase text-slate-500">{pred.model_type}</span>
                                            <span className="text-[10px] font-medium text-slate-600">{new Date(pred.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${pred.risk_score > 0.7 ? 'bg-red-500' : pred.risk_score > 0.3 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${pred.risk_score * 100}%` }}
                                                />
                                            </div>
                                            <span className={`font-bold text-lg ${pred.risk_score > 0.7 ? 'text-red-400' : pred.risk_score > 0.3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                {(pred.risk_score * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-slate-500 text-sm italic">
                                No AI predictions generated yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Col: Vitals & Notes */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Vitals Feed */}
                    <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold flex items-center gap-2 text-rose-400">
                                <HeartPulse className="w-5 h-5" />
                                Vitals Monitoring
                            </h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-[10px] font-bold uppercase text-slate-500">Safe</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <span className="text-[10px] font-bold uppercase text-slate-500">Flagged</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {vitals.length > 0 ? (
                                <>
                                    {[
                                        { label: 'Heart Rate', value: vitals[0].hr, unit: 'bpm', flag: vitals[0].hr > 100 || vitals[0].hr < 60 },
                                        { label: 'BP (Sys/Dia)', value: vitals[0].bp, unit: '', flag: false },
                                        { label: 'SpO2', value: vitals[0].spo2, unit: '%', flag: vitals[0].spo2 < 94 },
                                        { label: 'Temp', value: vitals[0].temp, unit: '°C', flag: vitals[0].temp > 37.5 }
                                    ].map((v, i) => (
                                        <div key={i} className={`p-4 rounded-2xl border ${v.flag ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-950 border-slate-800'}`}>
                                            <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">{v.label}</p>
                                            <p className={`text-xl font-bold ${v.flag ? 'text-red-400' : 'text-white'}`}>{v.value} {v.unit}</p>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="col-span-4 p-8 bg-slate-950 border border-slate-800 rounded-2xl text-center text-slate-500 italic text-sm">
                                    No vitals recorded for this session.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Clinical Notes */}
                    <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold flex items-center gap-2 text-amber-400">
                                <FileText className="w-5 h-5" />
                                Clinical Progress Notes
                            </h3>
                            <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300">Add Entry</button>
                        </div>

                        <div className="space-y-6">
                            {notes.length > 0 ? (
                                notes.map((note) => (
                                    <div key={note.id} className="p-6 bg-slate-950/50 border border-slate-800/50 rounded-2xl">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-slate-900 rounded-lg text-slate-400">
                                                    <Clock className="w-3 h-3" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-500">
                                                    {new Date(note.timestamp).toLocaleDateString()} at {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold text-indigo-500 uppercase">Dr. {note.doctor_id || 'System'}</span>
                                        </div>
                                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-slate-500 italic text-sm">
                                    No clinical observations recorded.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Unified Clinical History */}
            <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
                        <HistoryIcon className="w-5 h-5" />
                        Complete Clinical History
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase">
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Vitals</span>
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Notes</span>
                    </div>
                </div>

                <div className="relative space-y-4">
                    {/* Vertical Line */}
                    <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-800" />

                    {[
                        ...vitals.map(v => ({ ...v, logType: 'vitals' })),
                        ...notes.map(n => ({ ...n, logType: 'note' }))
                    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log, i) => (
                        <div key={i} className="relative pl-12">
                            {/* Dot */}
                            <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-slate-950 flex items-center justify-center z-10 ${log.logType === 'vitals' ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'
                                }`}>
                                {log.logType === 'vitals' ? <HeartPulse className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            </div>

                            <div className="p-5 bg-slate-950 border border-slate-800/50 rounded-2xl hover:border-slate-700 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <p className="text-xs font-bold text-slate-200">
                                            {log.logType === 'vitals' ? 'Vitals Logged' : 'Clinical Observation'}
                                        </p>
                                        <span className="text-[10px] px-2 py-0.5 bg-slate-900 rounded-md text-slate-500 font-mono">
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">
                                        {new Date(log.timestamp).toLocaleDateString()}
                                    </p>
                                </div>

                                {log.logType === 'vitals' ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-[11px]"><span className="text-slate-500 font-medium">HR:</span> <span className="text-white font-bold">{log.hr} bpm</span></div>
                                        <div className="text-[11px]"><span className="text-slate-500 font-medium">BP:</span> <span className="text-white font-bold">{log.bp}</span></div>
                                        <div className="text-[11px]"><span className="text-slate-500 font-medium">SpO2:</span> <span className="text-white font-bold">{log.spo2}%</span></div>
                                        <div className="text-[11px]"><span className="text-slate-500 font-medium">Temp:</span> <span className="text-white font-bold">{log.temp}°C</span></div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-xs text-slate-400 leading-relaxed">{log.content}</p>
                                        <p className="text-[10px] font-bold text-indigo-500 uppercase">Observed By: {log.doctor_id || 'Staff'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {(vitals.length === 0 && notes.length === 0) && (
                        <div className="text-center py-10 text-slate-500 italic text-sm">
                            No medical history found for this patient.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
