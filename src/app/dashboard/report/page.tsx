"use client";

import { FileText, Download, Settings2, ShieldCheck, Mail, Share2, FileJson, FileType as FilePdf } from 'lucide-react';

export default function ReportPage() {
    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Generate Report</h1>
                <p className="text-sm text-slate-400">Export your health insights into professional reports.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Report Configuration */}
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    <section className="p-4 md:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl space-y-4">
                        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                            <Settings2 className="w-4 h-4 text-indigo-400" />
                            <h3 className="font-bold text-base md:text-lg">Report Configuration</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] md:text-xs font-medium text-slate-400 px-1">Time Range</label>
                                <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm outline-none focus:border-indigo-500 transition-colors">
                                    <option>Last 7 Days</option>
                                    <option>Last 30 Days</option>
                                    <option>Last 3 Months</option>
                                    <option>Custom Range</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] md:text-xs font-medium text-slate-400 px-1">Detail Level</label>
                                <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm outline-none focus:border-indigo-500 transition-colors">
                                    <option>Executive Summary</option>
                                    <option>Extended Analysis</option>
                                    <option>Full Technical Report</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[11px] md:text-xs font-medium text-slate-400 px-1">Included Sections</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {['Cardiovascular Trends', 'Sleep Quality Index', 'Model Accuracy Metrics', 'Personalized Suggestions'].map(item => (
                                    <label key={item} className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer hover:border-indigo-500/50 transition-colors group">
                                        <input type="checkbox" defaultChecked className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-900 checked:bg-indigo-500" />
                                        <span className="text-xs text-slate-300 group-hover:text-white transition-colors">{item}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Export Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button className="flex flex-col items-start gap-3 p-5 md:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl hover:border-indigo-500/50 transition-all group">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                                <FilePdf className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-base mb-0.5">Download PDF</h4>
                                <p className="text-[11px] text-slate-500">Perfect for sharing with your physician.</p>
                            </div>
                            <Download className="w-4 h-4 ml-auto text-slate-600 group-hover:text-indigo-400 transition-colors" />
                        </button>

                        <button className="flex flex-col items-start gap-4 p-5 md:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl hover:border-emerald-500/50 transition-all group">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                <FileJson className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-base mb-0.5">Export JSON</h4>
                                <p className="text-[11px] text-slate-500">Raw analysis for 3rd party tool integration.</p>
                            </div>
                            <Download className="w-4 h-4 ml-auto text-slate-600 group-hover:text-emerald-400 transition-colors" />
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
                            <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold transition-all">
                                <Mail className="w-3.5 h-3.5" /> Email Report
                            </button>
                            <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold transition-all">
                                <Share2 className="w-3.5 h-3.5" /> Share Link
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
