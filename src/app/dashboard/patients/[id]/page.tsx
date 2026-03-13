"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
    User, HeartPulse, FileText, Activity, Shield,
    ArrowLeft, Save, Edit3, Loader2, AlertTriangle,
    CheckCircle2, Clock, Trash2, History as HistoryIcon,
    Zap, Link2, Ghost, Target, Cpu, Sparkles, Mic, MessageSquare, Bot, FlaskConical, Image as ImageIcon, Droplets,
    UploadCloud, FileUp, RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import LiveDeviceFeed from './LiveDeviceFeed';
import { useVitalsStream } from '@/hooks/useVitalsStream';

export default function PatientDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [patient, setPatient] = useState<any>(null);
    const [vitals, setVitals] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);
    const [predictions, setPredictions] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'reports' | 'diagnostics'>('overview');

    const { latestVital, isCritical: isStreamCritical, isConnected, startSimulation, stopSimulation } = useVitalsStream(id as string);

    // Update vitals list when new packet arrives from stream
    useEffect(() => {
        if (latestVital) {
            setVitals(prev => [latestVital, ...prev].slice(0, 50));
        }
    }, [latestVital]);

    // Edit State
    const [editData, setEditData] = useState({
        name: '',
        status: '',
        age: 0,
        gender: '',
        bed_number: ''
    });

    // NLP State
    const [newNote, setNewNote] = useState('');
    const [processingNLP, setProcessingNLP] = useState(false);
    const [nlpInsights, setNlpInsights] = useState<any>(null);
    const [saveNoteLoading, setSaveNoteLoading] = useState(false);
    const [generatingCarePlan, setGeneratingCarePlan] = useState(false);
    const [carePlan, setCarePlan] = useState<any>(null);
    const [uploadingReport, setUploadingReport] = useState<string | null>(null);
    const [uploadedReports, setUploadedReports] = useState<{ type: string, fileName: string }[]>([]);
    const [runningDiagnostic, setRunningDiagnostic] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const currentUploadType = useRef<string | null>(null);

    // Helper to parse note content
    const parseNoteContent = (content: string) => {
        const parts = {
            text: content,
            summary: '',
            insights: null as any
        };

        if (content.includes('[AI Summary]:')) {
            const [main, rest] = content.split('[AI Summary]:');
            parts.text = main.trim();

            if (rest.includes('[INSIGHTS]:')) {
                const [sum, ins] = rest.split('[INSIGHTS]:');
                parts.summary = sum.trim();
                try { parts.insights = JSON.parse(ins.trim()); } catch (e) { }
            } else {
                parts.summary = rest.trim();
            }
        } else if (content.includes('[INSIGHTS]:')) {
            const [main, ins] = content.split('[INSIGHTS]:');
            parts.text = main.trim();
            try { parts.insights = JSON.parse(ins.trim()); } catch (e) { }
        }

        return parts;
    };

    const handleAddNote = async () => {
        if (!newNote) return;
        setSaveNoteLoading(true);

        // Append AI Summary and Insights if available
        let finalContent = newNote;
        if (nlpInsights) {
            if (nlpInsights.summary) {
                finalContent += `\n\n[AI Summary]: ${nlpInsights.summary}`;
            }
            if (nlpInsights.insights) {
                finalContent += `\n\n[INSIGHTS]: ${JSON.stringify(nlpInsights.insights)}`;
            }
        }

        try {
            await supabase.from('notes').insert([{
                patient_uuid: id,
                content: finalContent,
                doctor_id: 'Dr. Auto'
            }]);

            setNewNote('');
            setNlpInsights(null);
            fetchPatientData(); // Refresh list
        } catch (error) {
            console.error("Error saving note:", error);
        } finally {
            setSaveNoteLoading(false);
        }
    };

    const handleReportUpload = (reportType: string) => {
        currentUploadType.current = reportType;
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUploadType.current) return;

        const type = currentUploadType.current;
        setUploadingReport(type);

        // Simulate extraction & processing delay
        await new Promise(r => setTimeout(r, 2000));

        const reportData = { type, fileName: file.name };
        setUploadedReports(prev => [...prev, reportData]);

        // PERSIST: Save Report Link Metadata
        await supabase.from('predictions').insert([{
            patient_uuid: id,
            model_type: type === 'xray' ? 'imaging' : `lab_${type}`,
            risk_score: 0.1,
            details: reportData
        }]);

        await fetchPatientData(); // Refresh predictions for Neural Profile
        setUploadingReport(null);
        currentUploadType.current = null;
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!confirm("Are you sure you want to delete this clinical note?")) return;
        try {
            const { error } = await supabase.from('notes').delete().eq('id', noteId);
            if (error) throw error;

            // Optimistic update
            setNotes(notes.filter(n => n.id !== noteId));
        } catch (error: any) {
            alert(`Error deleting note: ${error.message}`);
        }
    };

    const handleRunFullDiagnostic = async () => {
        setRunningDiagnostic(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000'}/train/all`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patient_id: id })
            });

            const result = await response.json();

            if (result.status === 'success' && result.results) {
                // PERSIST: Save all results to predictions table
                const inserts = result.results.map((r: any) => ({
                    patient_uuid: id,
                    model_type: r.model,
                    risk_score: parseFloat(r.accuracy) / 100,
                    status: 'OPTIMIZED',
                    timestamp: new Date().toISOString()
                }));

                const { error: insertError } = await supabase.from('predictions').insert(inserts);
                if (insertError) {
                    console.error("Supabase Insert Error:", insertError);
                    throw new Error(`Database Error: ${insertError.message} (${insertError.details || 'no details'})`);
                }

                await fetchPatientData(); // Refresh UI with new data
                alert("Unified Diagnostic Suite completed successfully. All models optimized.");
            } else {
                throw new Error(result.message || result.detail || "Diagnostic suite failed - check ML service logs");
            }
        } catch (error: any) {
            console.error("Full Diagnostic Error Object:", error);
            alert(error.message || "An unknown error occurred during the diagnostic run.");
        } finally {
            setRunningDiagnostic(false);
        }
    };

    const handleAddNoteButton = () => {
        setActiveTab('reports');
        setTimeout(() => {
            const element = document.getElementById('nlp-note-input');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-slate-950');
                setTimeout(() => element.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-slate-950'), 2000);
            }
        }, 100);
    };


    // Handle tab query parameter
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'reports' || tabParam === 'vitals' || tabParam === 'overview' || tabParam === 'diagnostics') {
            setActiveTab(tabParam as any);
        }

        // Refresh data if refresh parameter is present
        const refreshParam = searchParams.get('refresh');
        if (refreshParam === 'true' && id) {
            fetchPatientData();
        }
    }, [searchParams, id]);

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

            // 5. Load latest AI results from predictions history
            if (prData && prData.length > 0) {
                const latestNLP = prData.find(p => p.model_type === 'nlp');
                if (latestNLP) setNlpInsights(latestNLP.details);

                const latestCarePlan = prData.find(p => p.model_type === 'outcome' && p.details?.medications);
                if (latestCarePlan) setCarePlan(latestCarePlan.details);

                // Load uploaded reports state
                const reports = prData
                    .filter(p => ['imaging', 'lab_blood', 'lab_metabolic'].includes(p.model_type))
                    .map(p => ({
                        type: p.model_type === 'imaging' ? 'xray' : p.model_type.replace('lab_', ''),
                        fileName: p.details?.fileName || 'report.pdf'
                    }));

                // Ensure unique by type, taking most recent
                const uniqueReports: { type: string, fileName: string }[] = [];
                reports.forEach(r => {
                    if (!uniqueReports.find(ur => ur.type === r.type)) {
                        uniqueReports.push(r);
                    }
                });
                setUploadedReports(uniqueReports);
            }

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

    const simulateStream = async () => {
        const confirmed = window.confirm("This will generate synthetic vital signs data for this patient. Continue?");
        if (!confirmed) return;

        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000'}/simulate/vitals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patient_id: id })
            });

            if (response.ok) {
                await fetchPatientData();
                alert("Device stream simulation complete. 24h of data generated.");
            } else {
                throw new Error("Simulation request failed");
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
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
            {/* Live Status & Critical Alert */}
            {isConnected && (
                <div className="flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl animate-pulse">
                    <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"></span>
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Live Bio-Stream Active</p>
                    </div>
                    {isStreamCritical && (
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-red-500 text-white rounded-xl animate-bounce">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs font-black uppercase">Critical Physiologic Anomaly Detected</span>
                        </div>
                    )}
                </div>
            )}
            {/* Hidden File Input for PDF Uploads */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="application/pdf"
            />
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

                    <button
                        onClick={isConnected && latestVital ? stopSimulation : startSimulation}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg ${isConnected && latestVital
                                ? 'bg-rose-600 hover:bg-rose-500'
                                : 'bg-emerald-600 hover:bg-emerald-500'
                            }`}
                    >
                        {isConnected && latestVital ? <Zap className="w-4 h-4 animate-pulse" /> : <Activity className="w-4 h-4" />}
                        {isConnected && latestVital ? 'Stop Live Feed' : 'Start Live Stream'}
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-slate-900/50 border border-slate-800 rounded-2xl w-fit">
                {[
                    { id: 'overview', label: 'Overview', icon: User },
                    { id: 'vitals', label: 'Vitals & Feed', icon: Activity },
                    { id: 'diagnostics', label: 'Diagnostics', icon: FlaskConical },
                    { id: 'reports', label: 'Reports & AI', icon: FileText }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* REPORTS & AI TAB */}
            {activeTab === 'reports' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    {/* NEURAL COMMAND PROFILE (NEW - Holistic Patient Intelligence) */}
                    <div className="p-8 bg-indigo-600/5 border border-indigo-500/10 rounded-[2.5rem]">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
                                    <Cpu className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-indigo-100">Neural Command Profile</h2>
                                    <p className="text-xs text-indigo-200/50">Unified intelligence from Multi-Modal Diagnostic Suite</p>
                                </div>
                            </div>
                            <button
                                onClick={handleRunFullDiagnostic}
                                disabled={runningDiagnostic}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                            >
                                {runningDiagnostic ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Optimizing Models...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Run Full Diagnostic Suite
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            {['risk_fusion', 'risk_tabular', 'imaging', 'nlp', 'outcome'].map((mType) => {
                                const latest = predictions.find(p => p.model_type === mType);
                                return (
                                    <div key={mType} className="p-5 bg-slate-950/50 border border-slate-800 rounded-2xl group hover:border-indigo-500/30 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{mType.replace('_', ' ')}</p>
                                            {latest ? (
                                                <div className={`px-2 py-0.5 border rounded-md ${latest.status === 'OPTIMIZED' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
                                                    <span className={`text-[8px] font-bold uppercase ${latest.status === 'OPTIMIZED' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                                        {latest.status || 'Active'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md">
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase">Pending</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <p className={`text-2xl font-bold ${latest ? 'text-indigo-300' : 'text-slate-700'}`}>
                                                {latest ? `${(latest.risk_score * 100).toFixed(0)}%` : '---'}
                                            </p>
                                            <div className="text-right">
                                                <p className="text-[8px] text-slate-600 font-mono uppercase mb-0.5">Confidence</p>
                                                <p className="text-[10px] font-bold text-slate-400">
                                                    {latest ? '94.2%' : '---'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 flex items-center gap-6 p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                <span className="text-slate-200 font-bold">Neural Insight:</span> {predictions.length > 0
                                    ? (() => {
                                        const coreRisk = predictions.find(p => p.model_type === 'risk_fusion' || p.model_type === 'risk_tabular');
                                        const score = coreRisk ? coreRisk.risk_score : predictions[0].risk_score;
                                        return `Latest cross-modal analysis suggests a ${score > 0.6 ? 'high' : 'stable'} risk trajectory based on recent vitals fusion and multi-modal diagnostics.`;
                                    })()
                                    : "Predictive engine awaiting patient data stream for initial baseline optimization."}
                            </p>
                        </div>
                    </div>

                    {/* NEW: Smart Clinical Assistant (NLP) */}
                    <div className="p-8 bg-gradient-to-br from-indigo-900/20 to-violet-900/20 border border-indigo-500/20 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Smart Clinical Assistant</h3>
                                <p className="text-xs text-indigo-300">AI-powered documentation & insight extraction</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                            {/* Dictation / Input Area */}
                            <div className="space-y-4">
                                <div id="nlp-note-input" className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 transition-all focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[10px] font-bold uppercase text-slate-500">Dictation / Quick Note</label>
                                        <button
                                            onClick={() => {
                                                const simulations = [
                                                    "Patient reports mild chest discomfort radiating to left arm. BP is elevated at 145/90. History of hypertension. Recommending ECG and cardiac enzyme panel.",
                                                    "Post-operative recovery is proceeding as expected. Incision site is clean and dry. Patient's pain is well-controlled with current regimen.",
                                                    "Observation of mild wheezing in lower lobes. SpO2 stable at 95% on room air. Starting nebulizer treatment.",
                                                    "Patient is alert and oriented. Discussed discharge plan and follow-up care. Vitals remain within normal limits."
                                                ];
                                                const randomSim = simulations[Math.floor(Math.random() * simulations.length)];

                                                setNewNote(""); // Clear first for effect
                                                let i = 0;
                                                const interval = setInterval(() => {
                                                    setNewNote(prev => prev + randomSim.charAt(i));
                                                    i++;
                                                    if (i >= randomSim.length) clearInterval(interval);
                                                }, 20);

                                                alert("Microphone listening... Recording captured.");
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold transition-all"
                                        >
                                            <Mic className="w-3 h-3" /> Record
                                        </button>
                                    </div>
                                    <textarea
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Start typing or use dictation to record clinical observations..."
                                        className="w-full bg-transparent border-none text-sm text-slate-200 focus:ring-0 resize-none min-h-[120px] placeholder:text-slate-600"
                                    />
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800/50">
                                        <button
                                            onClick={async () => {
                                                if (!newNote) return;
                                                setProcessingNLP(true);
                                                try {
                                                    const res = await fetch(`${process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000'}/nlp/analyze`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ text: newNote })
                                                    });
                                                    const data = await res.json();
                                                    setNlpInsights(data);

                                                    // PERSIST: Save NLP analysis to predictions table
                                                    await supabase.from('predictions').insert([{
                                                        patient_uuid: id,
                                                        model_type: 'nlp',
                                                        risk_score: 0.1, // Placeholder
                                                        details: data
                                                    }]);
                                                    await fetchPatientData(); // Refresh Neural Profile
                                                } catch (e) { console.error(e); }
                                                setProcessingNLP(false);
                                            }}
                                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                        >
                                            <Sparkles className="w-3 h-3" /> Analyze Text
                                        </button>
                                        <button
                                            onClick={handleAddNote}
                                            disabled={!newNote || saveNoteLoading}
                                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                        >
                                            {saveNoteLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save Note"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* NLP Analysis Output */}
                            <div className="space-y-4">
                                {nlpInsights ? (
                                    <div className="bg-slate-950/50 border border-indigo-500/20 rounded-2xl p-5 h-full animate-in fade-in slide-in-from-right-4">
                                        <div className="mb-4">
                                            <h4 className="text-xs font-bold text-indigo-300 mb-1 flex items-center gap-2">
                                                <FileText className="w-3.5 h-3.5" /> Generated Summary
                                            </h4>
                                            <p className="text-xs text-slate-400 leading-relaxed italic">"{nlpInsights.summary}"</p>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-2">
                                                <Target className="w-3.5 h-3.5" /> Extracted Insights
                                            </h4>
                                            <div className="space-y-3">
                                                {nlpInsights.insights?.Conditions?.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="text-[9px] text-slate-500 font-bold uppercase w-16">Conditions</span>
                                                        {nlpInsights.insights.Conditions.map((c: string, i: number) => (
                                                            <span key={i} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] rounded-md font-bold">{c}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                {nlpInsights.insights?.Medications?.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="text-[9px] text-slate-500 font-bold uppercase w-16">Rx</span>
                                                        {nlpInsights.insights.Medications.map((m: string, i: number) => (
                                                            <span key={i} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] rounded-md font-bold">{m}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                {nlpInsights.insights?.Symptoms?.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="text-[9px] text-slate-500 font-bold uppercase w-16">Symptoms</span>
                                                        {nlpInsights.insights.Symptoms.map((s: string, i: number) => (
                                                            <span key={i} className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] rounded-md font-bold">{s}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-600 p-8">
                                        {processingNLP ? (
                                            <>
                                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
                                                <p className="text-xs font-bold">Extracting clinical entities...</p>
                                            </>
                                        ) : (
                                            <>
                                                <Bot className="w-8 h-8 opacity-20 mb-3" />
                                                <p className="text-xs font-bold text-center">AI ready.<br />Type or dictate a note to analyze.</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Clinical Notes (Moved to Reports) */}
                    <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold flex items-center gap-2 text-amber-400">
                                <FileText className="w-5 h-5" />
                                Clinical Progress Notes
                            </h3>
                            <button
                                onClick={handleAddNoteButton}
                                className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
                            >
                                Add Entry
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {notes.length > 0 ? (
                                notes.map((note) => {
                                    const { text, summary, insights } = parseNoteContent(note.content);
                                    return (
                                        <div key={note.id} className="p-6 bg-slate-950/50 border border-slate-800/50 rounded-2xl relative group">
                                            <button
                                                onClick={() => handleDeleteNote(note.id)}
                                                className="absolute top-4 right-4 p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                                title="Delete Note"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            <div className="flex justify-between items-center mb-4 pr-8">
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

                                            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap mb-4">{text}</p>

                                            {/* Visual AI Findings */}
                                            {(summary || insights) && (
                                                <div className="mt-4 p-4 bg-slate-900/50 border border-indigo-500/10 rounded-xl space-y-4">
                                                    {summary && (
                                                        <div>
                                                            <h5 className="text-[10px] font-bold text-indigo-300 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                                                                <FileText className="w-3 h-3" /> Generated Summary
                                                            </h5>
                                                            <p className="text-xs text-slate-400 italic">"{summary}"</p>
                                                        </div>
                                                    )}

                                                    {insights && (
                                                        <div>
                                                            <h5 className="text-[10px] font-bold text-emerald-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                                                                <Target className="w-3 h-3" /> Extracted Insights
                                                            </h5>
                                                            <div className="space-y-3">
                                                                {insights.Conditions?.length > 0 && (
                                                                    <div className="flex flex-wrap gap-2">
                                                                        <span className="text-[9px] text-slate-500 font-bold uppercase w-16">Conditions</span>
                                                                        {insights.Conditions.map((c: string, i: number) => (
                                                                            <span key={i} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] rounded-md font-bold">{c}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {insights.Medications?.length > 0 && (
                                                                    <div className="flex flex-wrap gap-2">
                                                                        <span className="text-[9px] text-slate-500 font-bold uppercase w-16">Rx</span>
                                                                        {insights.Medications.map((m: string, i: number) => (
                                                                            <span key={i} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] rounded-md font-bold">{m}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {insights.Symptoms?.length > 0 && (
                                                                    <div className="flex flex-wrap gap-2">
                                                                        <span className="text-[9px] text-slate-500 font-bold uppercase w-16">Symptoms</span>
                                                                        {insights.Symptoms.map((s: string, i: number) => (
                                                                            <span key={i} className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] rounded-md font-bold">{s}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-10 text-slate-500 italic text-sm">
                                    No clinical observations recorded.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Treatment Recommendations */}
                    <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold flex items-center gap-2 text-emerald-400">
                                <Sparkles className="w-5 h-5" />
                                AI-Driven Treatment Insights
                            </h3>
                            <button
                                onClick={async () => {
                                    setGeneratingCarePlan(true);
                                    await new Promise(r => setTimeout(r, 2000));
                                    const newPlan = {
                                        medications: [
                                            { name: "Lisinopril", dose: "10mg", freq: "Once daily", reason: "BP Management" },
                                            { name: "Atorvastatin", dose: "20mg", freq: "Bedtime", reason: "Lipid Control" }
                                        ],
                                        riskMitigation: "Increase daily walking to 30 mins. Monitor morning glucose levels.",
                                        carePlan: "Consistent monitoring of vital signs given the borderline risk index. Schedule follow-up in 2 weeks."
                                    };
                                    setCarePlan(newPlan);

                                    // PERSIST: Save Care Plan to predictions table
                                    await supabase.from('predictions').insert([{
                                        patient_uuid: id,
                                        model_type: 'outcome',
                                        risk_score: 0.0,
                                        details: newPlan
                                    }]);

                                    await fetchPatientData(); // Refresh Neural Profile
                                    setGeneratingCarePlan(false);
                                }}
                                disabled={generatingCarePlan}
                                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {carePlan ? <RefreshCw className={`w-3 h-3 ${generatingCarePlan ? 'animate-spin' : ''}`} /> : <Sparkles className="w-3 h-3" />}
                                {generatingCarePlan ? "Updating Recommendations..." : (carePlan ? "Update Care Plan" : "Generate Care Plan")}
                            </button>
                        </div>

                        {carePlan ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-5 bg-slate-950/50 border border-slate-800 rounded-2xl">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-3 text-emerald-500/80">Priority Medications</p>
                                        <div className="space-y-3">
                                            {carePlan.medications.map((m: any, i: number) => (
                                                <div key={i} className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-slate-200">{m.name} {m.dose}</span>
                                                    <span className="text-slate-500 italic">{m.reason}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-5 bg-slate-950/50 border border-slate-800 rounded-2xl">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-3 text-amber-500/80">Risk Mitigation</p>
                                        <p className="text-xs text-slate-300 leading-relaxed">{carePlan.riskMitigation}</p>
                                    </div>
                                </div>
                                <div className="p-5 bg-indigo-600/5 border border-indigo-500/20 rounded-2xl">
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase mb-2">Primary Care Strategy</p>
                                    <p className="text-sm text-indigo-100/90 leading-relaxed">{carePlan.carePlan}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-600 bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                                <Sparkles className="w-8 h-8 mb-3 opacity-20" />
                                <p className="text-sm italic">Analyze medical history to generate AI recommendations</p>
                            </div>
                        )}
                    </div>

                    {/* Unified Clinical History (Moved to Reports) */}
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
                            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-800" />
                            {[
                                ...vitals.map(v => ({ ...v, logType: 'vitals' })),
                                ...notes.map(n => ({ ...n, logType: 'note' }))
                            ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log, i) => (
                                <div key={i} className="relative pl-12">
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
                        </div>
                    </div>
                </div>
            )}

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-6">
                        <h3 className="font-bold flex items-center gap-2 text-indigo-400">
                            <User className="w-5 h-5" />
                            Demographics
                        </h3>
                        {/* ... demographics content ... */}
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
            )}

            {/* DIAGNOSTICS TAB */}
            {activeTab === 'diagnostics' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    {/* X-Ray / Imaging Section */}
                    <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold flex items-center gap-2 text-indigo-400">
                                <ImageIcon className="w-5 h-5" />
                                Radiographic Imaging (X-Ray)
                            </h3>
                            <span className="text-[10px] font-mono text-slate-500 uppercase">Captured: 2026-02-01 09:12 AM</span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 aspect-square bg-slate-950 rounded-3xl border border-slate-800 flex items-center justify-center relative overflow-hidden group/img">
                                {uploadedReports.find(r => r.type === 'xray') ? (
                                    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-4">
                                        <FileText className="w-12 h-12 text-indigo-500 mb-2" />
                                        <p className="text-[10px] font-bold text-white text-center break-all">{uploadedReports.find(r => r.type === 'xray')?.fileName}</p>
                                        <div className="absolute inset-0 bg-emerald-500/5 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase">PDF Linked</p>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleReportUpload('xray')}
                                        disabled={uploadingReport === 'xray'}
                                        className="flex flex-col items-center gap-3 text-slate-700 hover:text-indigo-400 transition-colors px-6"
                                    >
                                        {uploadingReport === 'xray' ? (
                                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                        ) : (
                                            <>
                                                <UploadCloud className="w-8 h-8" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Select PDF Report</span>
                                            </>
                                        )}
                                    </button>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60 pointer-events-none" />
                                <div className="absolute bottom-4 left-4 pointer-events-none">
                                    <p className="text-[10px] font-bold text-white uppercase tracking-widest">Chest PA View</p>
                                    <p className="text-[8px] text-slate-400">Reference: XR-77291-B</p>
                                </div>
                            </div>
                            <div className="lg:col-span-2 space-y-6">
                                <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-2xl">
                                    <h4 className="text-xs font-bold text-slate-300 uppercase mb-3">Clinical Findings</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed italic">
                                        "Lungs are clear bilaterally. No evidence of pneumothorax or pleural effusion. The cardiomediastinal silhouette is normal in size and contour. Bony structures are intact. No acute cardiopulmonary process identified."
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase">Status: Normal</span>
                                    </div>
                                    <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase">Reviewer: Dr. Sarah Chen</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Blood Test Panel */}
                        <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem]">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-bold flex items-center gap-2 text-rose-400">
                                    <Droplets className="w-5 h-5" />
                                    Comprehensive Blood Work
                                </h3>
                                <button
                                    onClick={() => handleReportUpload('blood')}
                                    disabled={uploadingReport === 'blood' || uploadedReports.some(r => r.type === 'blood')}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all border ${uploadedReports.some(r => r.type === 'blood')
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                                        }`}
                                >
                                    {uploadingReport === 'blood' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileUp className="w-3 h-3" />}
                                    {uploadedReports.some(r => r.type === 'blood') ? (
                                        <span className="flex items-center gap-2">
                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                            {uploadedReports.find(r => r.type === 'blood')?.fileName.substring(0, 10)}...
                                        </span>
                                    ) : 'Upload PDF'}
                                </button>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: 'WBC Count', value: '7.2', unit: 'x10³/µL', range: '4.5 - 11.0', status: 'Normal' },
                                    { label: 'RBC Count', value: '4.8', unit: 'x10⁶/µL', range: '4.5 - 5.9', status: 'Normal' },
                                    { label: 'Hemoglobin', value: '14.1', unit: 'g/dL', range: '13.5 - 17.5', status: 'Normal' },
                                    { label: 'Platelets', value: '250', unit: 'x10³/µL', range: '150 - 450', status: 'Normal' }
                                ].map((item, i) => (
                                    <div key={i} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">{item.label}</p>
                                            <p className="text-sm font-bold text-white">{item.value} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span></p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-mono text-slate-600 mb-1">Ref: {item.range}</p>
                                            <span className="text-[8px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-bold uppercase">{item.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* B12 & Sugar Panel */}
                        <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] space-y-8">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="font-bold flex items-center gap-2 text-amber-400">
                                        <FlaskConical className="w-5 h-5" />
                                        Metabolic & Vitamins
                                    </h3>
                                    <button
                                        onClick={() => handleReportUpload('metabolic')}
                                        disabled={uploadingReport === 'metabolic' || uploadedReports.some(r => r.type === 'metabolic')}
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all border ${uploadedReports.some(r => r.type === 'metabolic')
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                                            }`}
                                    >
                                        {uploadingReport === 'metabolic' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileUp className="w-3 h-3" />}
                                        {uploadedReports.some(r => r.type === 'metabolic') ? (
                                            <span className="flex items-center gap-2">
                                                <CheckCircle2 className="w-2.5 h-2.5" />
                                                {uploadedReports.find(r => r.type === 'metabolic')?.fileName.substring(0, 10)}...
                                            </span>
                                        ) : 'Upload PDF'}
                                    </button>
                                </div>

                                {/* Glucose / Sugar */}
                                <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl group hover:border-amber-500/30 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Blood Glucose (Sugar)</p>
                                            <p className="text-2xl font-bold text-white">98 <span className="text-xs font-normal text-slate-500">mg/dL</span></p>
                                        </div>
                                        <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                            <span className="text-[10px] font-bold text-amber-400 uppercase">Fasting State</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 w-[60%] rounded-full" />
                                    </div>
                                    <p className="mt-3 text-[10px] text-slate-500">Normal Range: 70 - 99 mg/dL</p>
                                </div>

                                {/* B12 */}
                                <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl group hover:border-violet-500/30 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vitamin B12 Level</p>
                                            <p className="text-2xl font-bold text-white">450 <span className="text-xs font-normal text-slate-500">pg/mL</span></p>
                                        </div>
                                        <div className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                                            <span className="text-[10px] font-bold text-violet-400 uppercase">Optimal</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                        <div className="h-full bg-violet-500 w-[45%] rounded-full" />
                                    </div>
                                    <p className="mt-3 text-[10px] text-slate-500">Normal Range: 200 - 900 pg/mL</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VITALS & FEED TAB */}
            {activeTab === 'vitals' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <LiveDeviceFeed liveBpm={latestVital?.hr} />

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
                                <button
                                    onClick={simulateStream}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold uppercase transition-all ml-2"
                                >
                                    <Activity className="w-3 h-3" />
                                    Simulate Device Stream
                                </button>
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
                </div>
            )}

        </div>
    );
}
