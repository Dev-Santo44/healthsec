"use client";

import { useEffect, useState } from 'react';
import { Search, Filter, ArrowUpRight, Shield, AlertTriangle, CheckCircle2, User, Calendar, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

export default function PatientListPage() {
    const [search, setSearch] = useState('');
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('patient_current_risk')
                .select('*');

            if (error) throw error;
            setPatients(data || []);
        } catch (error) {
            console.error("Error fetching patients:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete patient ${name}? This action cannot be undone.`)) return;

        try {
            // Check for dependent records first if your logic requires it, 
            // but for now we assume cascade or direct deletion is okay
            const { error } = await supabase
                .from('patients')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Optimistic update
            setPatients(patients.filter(p => p.id !== id));
            alert(`Patient ${name} deleted successfully.`);
        } catch (error: any) {
            alert(`Error deleting patient: ${error.message}`);
        }
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.mrn.toLowerCase().includes(search.toLowerCase()) ||
        (p.bed_number && p.bed_number.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Patient Directory</h1>
                    <p className="text-sm text-slate-400">Manage and monitor all admitted patients and their AI-driven risk profiles.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search MRN or Name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-1.5 text-sm text-white w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                        />
                    </div>
                    <button
                        onClick={fetchPatients}
                        className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors self-end sm:self-auto">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-xl md:rounded-2xl overflow-hidden backdrop-blur-xl">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-8 md:p-12 space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <p className="text-slate-500 font-medium text-xs">Syncing with Clinical Vault...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left min-w-[600px]">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/50">
                                    <th className="px-4 md:px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Patient</th>
                                    <th className="px-4 md:px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">MRN</th>
                                    <th className="px-4 md:px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Bed</th>
                                    <th className="px-4 md:px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                                    <th className="px-4 md:px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredPatients.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                                            No patients found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPatients.map((patient) => (
                                        <tr key={patient.id} className="group hover:bg-slate-800/30 transition-colors">
                                            <td className="px-4 md:px-5 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400 font-bold group-hover:scale-105 transition-transform text-[10px] md:text-xs">
                                                        {patient.name.split(' ').map((n: string) => n[0]).join('')}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-slate-200 text-xs md:text-sm truncate">{patient.name}</p>
                                                        <p className="text-[9px] md:text-[10px] text-slate-500 truncate">ID: {patient.id.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 md:px-5 py-3">
                                                <span className="text-[11px] md:text-xs font-mono text-slate-400">{patient.mrn}</span>
                                            </td>
                                            <td className="px-4 md:px-5 py-3">
                                                <span className="text-[9px] md:text-[10px] font-bold bg-slate-800 text-indigo-400 px-1.5 py-0.5 rounded-md border border-slate-700 whitespace-nowrap">
                                                    {patient.bed_number || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-5 py-3">
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wider border shadow-sm whitespace-nowrap ${patient.status === 'Flagged' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    patient.status === 'Reviewed' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    }`}>
                                                    {patient.status}
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-5 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleDelete(patient.id, patient.name)}
                                                        className="inline-flex p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                        title="Delete Patient"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <Link
                                                        href={`/dashboard/patients/${patient.id}`}
                                                        className="inline-flex p-1.5 text-slate-500 hover:text-white hover:bg-indigo-600 rounded-lg transition-all"
                                                    >
                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 text-center">
                <div className="p-3 md:p-4 bg-slate-900/50 border border-slate-800 rounded-xl md:rounded-2xl">
                    <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Total Admitted</p>
                    <h4 className="text-xl md:text-2xl font-bold text-white">{patients.length}</h4>
                </div>
                <div className="p-3 md:p-4 bg-slate-900/50 border border-slate-800 rounded-xl md:rounded-2xl">
                    <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Critically Flagged</p>
                    <h4 className="text-xl md:text-2xl font-bold text-red-500">
                        {patients.filter(p => p.status === 'Flagged').length}
                    </h4>
                </div>
                <div className="p-3 md:p-4 bg-slate-900/50 border border-slate-800 rounded-xl md:rounded-2xl sm:col-span-2 lg:col-span-1">
                    <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">AI Reviewed</p>
                    <h4 className="text-xl md:text-2xl font-bold text-emerald-500">
                        {patients.length > 0 ? Math.round((patients.filter(p => p.status === 'Reviewed').length / patients.length) * 100) : 0}%
                    </h4>
                </div>
            </div>
        </div>
    );
}
