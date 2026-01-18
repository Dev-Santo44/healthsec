"use client";

import { FileText, Download, Settings2, ShieldCheck, Mail, Share2, FileJson, FileType as FilePdf } from 'lucide-react';

export default function ReportPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Generate Report</h1>
                <p className="text-slate-400">Export your health insights into professional reports.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Report Configuration */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                            <Settings2 className="w-5 h-5 text-indigo-400" />
                            <h3 className="font-bold text-lg">Report Configuration</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Time Range</label>
                                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors">
                                    <option>Last 7 Days</option>
                                    <option>Last 30 Days</option>
                                    <option>Last 3 Months</option>
                                    <option>Custom Range</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Detail Level</label>
                                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors">
                                    <option>Executive Summary</option>
                                    <option>Extended Analysis</option>
                                    <option>Full Technical Report</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm font-medium text-slate-400">Included Sections</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {['Cardiovascular Trends', 'Sleep Quality Index', 'Model Accuracy Metrics', 'Personalized Suggestions'].map(item => (
                                    <label key={item} className="flex items-center gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-indigo-500/50 transition-colors">
                                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-800 bg-slate-900 checked:bg-indigo-500" />
                                        <span className="text-sm">{item}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Export Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button className="flex flex-col items-start gap-4 p-8 bg-slate-900/50 border border-slate-800 rounded-3xl hover:border-indigo-500/50 transition-all group">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                                <FilePdf className="w-6 h-6 text-indigo-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">Download PDF</h4>
                                <p className="text-sm text-slate-500">Perfect for sharing with your physician.</p>
                            </div>
                            <Download className="w-5 h-5 ml-auto text-slate-600 group-hover:text-indigo-400 transition-colors" />
                        </button>

                        <button className="flex flex-col items-start gap-4 p-8 bg-slate-900/50 border border-slate-800 rounded-3xl hover:border-emerald-500/50 transition-all group">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                <FileJson className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">Export JSON</h4>
                                <p className="text-sm text-slate-500">Raw analysis for 3rd party tool integration.</p>
                            </div>
                            <Download className="w-5 h-5 ml-auto text-slate-600 group-hover:text-emerald-400 transition-colors" />
                        </button>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    <div className="p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl">
                        <ShieldCheck className="w-12 h-12 text-indigo-500 mb-6" />
                        <h3 className="text-xl font-bold mb-3">Secure Delivery</h3>
                        <p className="text-sm text-slate-400 leading-relaxed mb-6">
                            All reports are encrypted locally before download. Use our secure email relay to share directly.
                        </p>
                        <div className="space-y-3">
                            <button className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-all">
                                <Mail className="w-4 h-4" /> Email Report
                            </button>
                            <button className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-all">
                                <Share2 className="w-4 h-4" /> Share Link
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
