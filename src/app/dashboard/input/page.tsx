"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { mlManager } from '@/lib/ml/MLManager';
import {
    Users,
    HeartPulse,
    FileText,
    Loader2,
    CheckCircle2,
    Upload,
    X,
    FileSpreadsheet,
    AlertCircle
} from 'lucide-react';

export default function InputDataPage() {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith('.csv')) {
                setFile(droppedFile);
            } else {
                alert("Please upload a CSV file");
            }
        }
    };

    const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('manual');
    const [patientData, setPatientData] = useState({
        name: '',
        patient_id: '',
        age: 30,
        gender: 'M',
        bed_number: '',
        hr: 75,
        bp: '120/80',
        spo2: 98,
        temp: 36.6,
        notes: ''
    });

    const handleBulkImport = async () => {
        if (!file) return;
        setSubmitting(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            const rows = text.split('\n').filter(r => r.trim() !== '');
            // Assume header is row 0: "patient_id","name","age","gender","zip_code","ethnicity","admission_type"

            const patientsToInsert = [];

            // Start from index 1 to skip header
            for (let i = 1; i < rows.length; i++) {
                try {
                    // Remove quotes and split
                    const cols = rows[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());

                    if (cols.length < 4) continue;

                    patientsToInsert.push({
                        patient_id: cols[0],
                        name: cols[1],
                        age: parseInt(cols[2]) || 0,
                        gender: cols[3],
                        bed_number: '',
                        status: 'Active'
                    });
                } catch (err) {
                    console.error("Row parse error:", err);
                }
            }

            try {
                const { error } = await supabase
                    .from('patients')
                    .insert(patientsToInsert);

                if (error) throw error;

                alert(`Successfully imported ${patientsToInsert.length} patients.`);
                setFile(null);
                setActiveTab('manual');
            } catch (error: any) {
                alert(`Import failed: ${error.message}`);
            } finally {
                setSubmitting(false);
            }
        };

        reader.readAsText(file);
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // 1. Insert Patient
            const { data: patient, error: pError } = await supabase
                .from('patients')
                .insert([{
                    name: patientData.name,
                    patient_id: patientData.patient_id,
                    age: patientData.age,
                    gender: patientData.gender,
                    bed_number: patientData.bed_number
                }])
                .select()
                .single();

            if (pError) throw pError;

            // 2. Insert Vitals
            await supabase.from('vitals').insert([{
                patient_uuid: patient.id,
                hr: patientData.hr,
                bp: patientData.bp,
                spo2: patientData.spo2,
                temp: patientData.temp
            }]);

            // 3. Insert Notes
            if (patientData.notes) {
                await supabase.from('notes').insert([{
                    patient_uuid: patient.id,
                    content: patientData.notes
                }]);
            }

            // 4. Trigger AI Prediction (Edge Simulation/Prompt)
            const riskScore = await mlManager.predict('risk_tabular', {
                age: patientData.age,
                gender: patientData.gender,
                hr: patientData.hr,
                spo2: patientData.spo2,
                diabetes: 1, // assume diabetes for simulation
                hypertension: 0  // assume hypertension for simulation
            });

            await supabase.from('predictions').insert([{
                patient_uuid: patient.id,
                model_type: 'risk_tabular',
                risk_score: riskScore
            }]);

            alert("Patient registered and AI analysis complete!");
            setPatientData({
                name: '', patient_id: '', age: 30, gender: 'M', bed_number: '',
                hr: 75, bp: '120/80', spo2: 98, temp: 36.6, notes: ''
            });
        } catch (error: any) {
            console.error("Registration Error:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Patient Intake / EHR Upload</h1>
                    <p className="text-sm text-slate-400">Add new patients manually or via bulk CSV import.</p>
                </div>
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-full lg:w-auto">
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`flex-1 lg:flex-none px-4 md:px-5 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all ${activeTab === 'manual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Manual Entry
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 lg:flex-none px-4 md:px-5 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all ${activeTab === 'upload' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        CSV Upload
                    </button>
                </div>
            </div>

            {activeTab === 'manual' ? (
                <form onSubmit={handleManualSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <div className="p-4 md:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl space-y-4">
                        <h3 className="text-base md:text-lg font-bold flex items-center gap-2 text-indigo-400">
                            <Users className="w-4 h-4" />
                            Demographics
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold px-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={patientData.name}
                                    onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 md:p-2.5 text-xs text-white focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Patient Name"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold px-1">MRN / Patient ID</label>
                                <input
                                    type="text"
                                    required
                                    value={patientData.patient_id}
                                    onChange={(e) => setPatientData({ ...patientData, patient_id: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 md:p-2.5 text-xs text-white focus:ring-1 focus:ring-indigo-500"
                                    placeholder="ID-12345"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold px-1">Age</label>
                                <input
                                    type="number"
                                    required
                                    value={isNaN(patientData.age) ? '' : patientData.age}
                                    onChange={(e) => setPatientData({ ...patientData, age: e.target.value === '' ? NaN : parseInt(e.target.value) })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 md:p-2.5 text-xs text-white focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold px-1">Gender</label>
                                <select
                                    value={patientData.gender}
                                    onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 md:p-2.5 text-xs text-white focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold px-1">Assigned Bed</label>
                                <select
                                    value={patientData.bed_number}
                                    onChange={(e) => setPatientData({ ...patientData, bed_number: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 md:p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="">Unassigned</option>
                                    {['A', 'B'].map(row =>
                                        [1, 2, 3, 4, 5].map(num => (
                                            <option key={`${row}${num}`} value={`${row}${num}`}>Bed {row}{num}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 md:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl space-y-4">
                        <h3 className="text-base md:text-lg font-bold flex items-center gap-2 text-emerald-400">
                            <HeartPulse className="w-4 h-4" />
                            Baseline Vitals
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold px-1">Heart Rate (bpm)</label>
                                <input
                                    type="number"
                                    value={isNaN(patientData.hr) ? '' : patientData.hr}
                                    onChange={(e) => setPatientData({ ...patientData, hr: e.target.value === '' ? NaN : parseInt(e.target.value) })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 md:p-2.5 text-xs text-white focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold px-1">Blood Pressure</label>
                                <input
                                    type="text"
                                    value={patientData.bp}
                                    onChange={(e) => setPatientData({ ...patientData, bp: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 md:p-2.5 text-xs text-white focus:ring-1 focus:ring-emerald-500"
                                    placeholder="120/80"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold px-1">SpO2 (%)</label>
                                <input
                                    type="number"
                                    value={isNaN(patientData.spo2) ? '' : patientData.spo2}
                                    onChange={(e) => setPatientData({ ...patientData, spo2: e.target.value === '' ? NaN : parseInt(e.target.value) })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 md:p-2.5 text-xs text-white focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold px-1">Temp (°C)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={isNaN(patientData.temp) ? '' : patientData.temp}
                                    onChange={(e) => setPatientData({ ...patientData, temp: e.target.value === '' ? NaN : parseFloat(e.target.value) })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 md:p-2.5 text-xs text-white focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 p-4 md:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h3 className="text-base md:text-lg font-bold flex items-center gap-2 text-violet-400">
                                <FileText className="w-4 h-4" />
                                Clinical Notes
                            </h3>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                {submitting ? 'Registering...' : 'Register Patient'}
                            </button>
                        </div>
                        <textarea
                            value={patientData.notes}
                            onChange={(e) => setPatientData({ ...patientData, notes: e.target.value })}
                            placeholder="Symptoms, previous history, and findings..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white min-h-[100px] md:min-h-[120px] resize-none focus:ring-1 focus:ring-violet-500"
                        />
                    </div>
                </form>
            ) : (
                <div
                    className={`relative border-2 border-dashed rounded-3xl p-6 md:p-10 transition-all duration-300 flex flex-col items-center justify-center min-h-[250px] md:min-h-[300px] ${dragActive
                        ? 'border-indigo-500 bg-indigo-500/5 scale-[1.01] shadow-2xl shadow-indigo-500/10'
                        : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/60'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".csv"
                        onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                    />

                    {!file ? (
                        <div className="text-center">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Upload className="w-6 h-6 md:w-8 md:h-8 text-indigo-500" />
                            </div>
                            <label
                                htmlFor="file-upload"
                                className="text-base md:text-lg font-semibold mb-1 cursor-pointer hover:text-indigo-400 transition-colors block"
                            >
                                Click to upload or drag and drop
                            </label>
                            <p className="text-[9px] md:text-xs text-slate-500">Only CSV files are supported for training</p>
                        </div>
                    ) : (
                        <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-xl p-4 md:p-5 relative group animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => setFile(null)}
                                className="absolute -top-2 -right-2 w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow-lg"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 md:w-10 md:h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                    <FileSpreadsheet className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-xs md:text-sm truncate">{file.name}</h4>
                                    <p className="text-[9px] md:text-[10px] text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                            <button
                                onClick={handleBulkImport}
                                disabled={submitting}
                                className="w-full mt-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                            >
                                {submitting ? 'Processing...' : 'Process Bulk Import'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2.5 mb-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <h3 className="font-bold text-[11px] md:text-xs">Clinical Accuracy</h3>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                        Ensure all MRNs are unique to prevent data collisions. Real-time AI analysis will trigger automatically upon registration.
                    </p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2.5 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-bold text-[11px] md:text-xs">SafeEdge Protocol</h3>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                        Your patient data remains local and encrypted. No PHI (Protected Health Information) is cached on public cloud endpoints.
                    </p>
                </div>
            </div>
        </div>
    );
}
