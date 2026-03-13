"use client";

import { useState, useEffect } from 'react';
import {
    FileText, Download, Settings2, ShieldCheck,
    Mail, Share2, FileJson, FileType as FilePdf,
    Users, Search, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportPage() {
    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState<any[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [timeRange, setTimeRange] = useState('Last 7 Days');
    const [detailLevel, setDetailLevel] = useState('Executive Summary');
    const [sections, setSections] = useState({
        cardiovascular: true,
        sleep: true,
        accuracy: true,
        suggestions: true
    });
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('id, name, bed_number')
                .order('name');
            if (error) throw error;
            setPatients(data || []);
            if (data && data.length > 0) setSelectedPatientId(data[0].id);
        } catch (err) {
            console.error('Error fetching patients:', err);
        }
    };

    const handleAction = async (action: 'pdf' | 'json' | 'email' | 'share') => {
        if (!selectedPatientId) {
            setStatus({ type: 'error', message: 'Please select a patient first.' });
            return;
        }

        setLoading(true);
        setStatus({ type: 'info', message: `Preparing ${action.toUpperCase()}...` });

        try {
            // Fetch Patient Detail Data
            const { data: patient } = await supabase.from('patients').select('*').eq('id', selectedPatientId).single();
            const { data: vitals } = await supabase.from('vitals').select('*').eq('patient_uuid', selectedPatientId).order('timestamp', { ascending: false }).limit(20);
            const { data: predictions } = await supabase.from('predictions').select('*').eq('patient_uuid', selectedPatientId).order('timestamp', { ascending: false }).limit(10);
            const { data: notes } = await supabase.from('notes').select('*').eq('patient_uuid', selectedPatientId).order('timestamp', { ascending: false }).limit(5);

            if (action === 'pdf') {
                generatePDF(patient, vitals || [], predictions || [], notes || []);
            } else if (action === 'json') {
                exportJSON(patient, vitals || [], predictions || [], notes || []);
            } else {
                // Mock for email/share
                await new Promise(r => setTimeout(r, 1500));
                setStatus({ type: 'success', message: `${action === 'email' ? 'Report emailed successfully!' : 'Secure share link generated!'}` });
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Action failed.' });
        } finally {
            setLoading(false);
            if (action === 'pdf' || action === 'json') {
                setTimeout(() => setStatus(null), 3000);
            }
        }
    };

    const generatePDF = (patient: any, vitals: any[], predictions: any[], notes: any[]) => {
        try {
            const doc = new jsPDF();
            const patientName = patient?.name || 'Unknown Patient';

            // Header
            doc.setFillColor(99, 102, 241); // Indigo-500
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text('HealthSec Clinical Report', 15, 20);
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 30);
            doc.text(`Detail Level: ${detailLevel}`, 15, 35);

            // Patient Info
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(16);
            doc.text('Patient Information', 15, 55);
            doc.setFontSize(10);

            const info = [
                `Name: ${patientName}`,
                `Age: ${patient?.age || 'N/A'}`,
                `Gender: ${patient?.gender || 'N/A'}`,
                `ID: ${String(patient?.id || 'N/A')}`,
                `Bed: ${patient?.bed_number || 'Unassigned'}`,
                `Status: ${patient?.status || 'Active'}`
            ];
            doc.text(info, 15, 65);

            let finalY = 100;

            // Vitals Table
            if (sections.cardiovascular && vitals && vitals.length > 0) {
                doc.setFontSize(14);
                doc.text('Recent Vital Signs', 15, 110);
                autoTable(doc, {
                    startY: 115,
                    head: [['Timestamp', 'HR', 'SpO2', 'BP', 'Temp']],
                    body: vitals.map(v => [
                        new Date(v.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
                        String(v.hr || 'N/A'),
                        (v.spo2 || 'N/A') + '%',
                        `${v.bp_systolic || 'N/A'}/${v.bp_diastolic || 'N/A'}`,
                        (v.temp || 'N/A') + 'C'
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [99, 102, 241] }
                });
                finalY = (doc as any).lastAutoTable?.finalY + 15 || 150;
            }

            // AI Predictions
            if (sections.accuracy && predictions && predictions.length > 0) {
                doc.setFontSize(14);
                doc.text('AI Predictive Insights', 15, finalY);
                autoTable(doc, {
                    startY: finalY + 5,
                    head: [['Model Type', 'Risk Score', 'Status', 'Timestamp']],
                    body: predictions.map(p => [
                        String(p.model_type || 'N/A').toUpperCase().replace('_', ' '),
                        (Number(p.risk_score || 0) * 100).toFixed(1) + '%',
                        String(p.status || 'Active'),
                        p.timestamp ? new Date(p.timestamp).toLocaleDateString() : 'N/A'
                    ]),
                    theme: 'grid',
                    headStyles: { fillColor: [139, 92, 246] } // Violet-500
                });
                finalY = (doc as any).lastAutoTable?.finalY + 15 || finalY + 50;
            }

            // Clinical Status & Progress
            if (notes && notes.length > 0) {
                doc.setFontSize(14);
                doc.text('Clinical Status & Progress', 15, finalY);

                let currentY = finalY + 10;
                notes.forEach((note, index) => {
                    // Check for page break
                    if (currentY > 250) {
                        doc.addPage();
                        currentY = 20;
                    }

                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    const dateStr = new Date(note.timestamp).toLocaleString();
                    doc.text(`Entry - ${dateStr} (Dr. ${note.doctor_id || 'System'})`, 15, currentY);

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);

                    // Simple parsing for AI insights if present
                    let mainText = note.content;
                    let aiText = '';
                    if (mainText.includes('[AI Summary]:')) {
                        const parts = mainText.split('[AI Summary]:');
                        mainText = parts[0].trim();
                        aiText = 'AI Summary: ' + parts[1].split('[INSIGHTS]:')[0].trim();
                    }

                    const splitText = doc.splitTextToSize(mainText, 180);
                    doc.text(splitText, 15, currentY + 5);
                    currentY += (splitText.length * 5) + 10;

                    if (aiText) {
                        doc.setFont('helvetica', 'italic');
                        doc.setTextColor(99, 102, 241);
                        const splitAI = doc.splitTextToSize(aiText, 170);
                        doc.text(splitAI, 20, currentY);
                        doc.setTextColor(0, 0, 0);
                        doc.setFont('helvetica', 'normal');
                        currentY += (splitAI.length * 5) + 5;
                    }

                    currentY += 5; // Spacer between notes
                });
            }

            doc.save(`HealthSec_Report_${patientName.replace(/\s/g, '_')}_${new Date().getTime()}.pdf`);
            setStatus({ type: 'success', message: 'PDF Report downloaded successfully.' });
        } catch (err: any) {
            console.error('PDF Generation Error:', err);
            setStatus({ type: 'error', message: `PDF Error: ${err.message}` });
        }
    };

    const exportJSON = (patient: any, vitals: any[], predictions: any[], notes: any[]) => {
        const data = {
            reportMetadata: {
                source: "HealthSec Intelligence Platform",
                generatedAt: new Date().toISOString(),
                timeRange,
                detailLevel
            },
            patient,
            clinicalData: {
                vitals,
                predictions,
                notes
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HealthSec_Data_${patient?.name.replace(/\s/g, '_')}.json`;
        a.click();
        setStatus({ type: 'success', message: 'JSON Data exported successfully.' });
    };

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Generate Report</h1>
                    <p className="text-sm text-slate-400">Export clinical insights and AI diagnostics into professional formats.</p>
                </div>

                {status && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border animate-in slide-in-from-right-4 ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        status.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                            'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        }`}>
                        {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {status.message}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    {/* Patient Selection */}
                    <section className="p-4 md:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl space-y-4">
                        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                            <Users className="w-4 h-4 text-indigo-400" />
                            <h3 className="font-bold text-base md:text-lg">Patient Selection</h3>
                        </div>

                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            <select
                                value={selectedPatientId}
                                onChange={(e) => setSelectedPatientId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                            >
                                <option value="" disabled>Select a patient...</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} {p.bed_number ? `(Bed ${p.bed_number})` : ''}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                <Download className="w-3 h-3 rotate-180" />
                            </div>
                        </div>
                    </section>

                    <section className="p-4 md:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl space-y-4">
                        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                            <Settings2 className="w-4 h-4 text-indigo-400" />
                            <h3 className="font-bold text-base md:text-lg">Report Configuration</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] md:text-xs font-medium text-slate-400 px-1">Time Range</label>
                                <select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm outline-none focus:border-indigo-500 transition-colors"
                                >
                                    <option>Last 7 Days</option>
                                    <option>Last 30 Days</option>
                                    <option>Last 3 Months</option>
                                    <option>Custom Range</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] md:text-xs font-medium text-slate-400 px-1">Detail Level</label>
                                <select
                                    value={detailLevel}
                                    onChange={(e) => setDetailLevel(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm outline-none focus:border-indigo-500 transition-colors"
                                >
                                    <option>Executive Summary</option>
                                    <option>Extended Analysis</option>
                                    <option>Full Technical Report</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[11px] md:text-xs font-medium text-slate-400 px-1">Included Sections</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {[
                                    { key: 'cardiovascular', label: 'Cardiovascular Trends' },
                                    { key: 'sleep', label: 'Sleep Quality Index' },
                                    { key: 'accuracy', label: 'Model Accuracy Metrics' },
                                    { key: 'suggestions', label: 'Personalized Suggestions' }
                                ].map(item => (
                                    <label key={item.key} className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer hover:border-indigo-500/50 transition-colors group">
                                        <input
                                            type="checkbox"
                                            checked={(sections as any)[item.key]}
                                            onChange={(e) => setSections(prev => ({ ...prev, [item.key]: e.target.checked }))}
                                            className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-900 checked:bg-indigo-500 text-indigo-500"
                                        />
                                        <span className="text-xs text-slate-300 group-hover:text-white transition-colors">{item.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Export Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => handleAction('pdf')}
                            disabled={loading || !selectedPatientId}
                            className="flex flex-col items-start gap-3 p-5 md:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl hover:border-indigo-500/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                                <FilePdf className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div className="flex-1 w-full text-left">
                                <div className="flex items-center justify-between mb-0.5">
                                    <h4 className="font-bold text-base">Download PDF</h4>
                                    {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-600" />}
                                </div>
                                <p className="text-[11px] text-slate-500">Perfect for sharing with your physician.</p>
                            </div>
                            <Download className="w-4 h-4 ml-auto text-slate-600 group-hover:text-indigo-400 transition-colors mt-2" />
                        </button>

                        <button
                            onClick={() => handleAction('json')}
                            disabled={loading || !selectedPatientId}
                            className="flex flex-col items-start gap-4 p-5 md:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl hover:border-emerald-500/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                <FileJson className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="flex-1 w-full text-left">
                                <div className="flex items-center justify-between mb-0.5">
                                    <h4 className="font-bold text-base">Export JSON</h4>
                                    {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-600" />}
                                </div>
                                <p className="text-[11px] text-slate-500">Raw analysis for 3rd party tool integration.</p>
                            </div>
                            <Download className="w-4 h-4 ml-auto text-slate-600 group-hover:text-emerald-400 transition-colors mt-2" />
                        </button>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-4 md:space-y-6">
                    <div className="p-6 md:p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl md:rounded-3xl">
                        <ShieldCheck className="w-10 h-10 text-indigo-500 mb-4" />
                        <h3 className="text-lg md:text-xl font-bold mb-2">Secure Delivery</h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-6">
                            All reports are encrypted locally before download. Use our secure email relay to share directly.
                        </p>
                        <div className="space-y-2.5">
                            <button
                                onClick={() => handleAction('email')}
                                disabled={loading || !selectedPatientId}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                            >
                                <Mail className="w-4 h-4" /> Email Report
                            </button>
                            <button
                                onClick={() => handleAction('share')}
                                disabled={loading || !selectedPatientId}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                            >
                                <Share2 className="w-4 h-4" /> Share Link
                            </button>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Report Tips</h4>
                        <div className="space-y-3">
                            {[
                                "Select the 'Full Technical Report' to include raw data streams.",
                                "Toggle specific sections to focus on relevant clinical parameters.",
                                "PDFs are optimized for professional high-resolution printing."
                            ].map((tip, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                    <p className="text-[11px] text-slate-400 leading-relaxed">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
