"use client";

import { useState } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function InputDataPage() {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);

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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Input Data</h1>
                <p className="text-slate-400">Upload your health data in CSV format to begin local training.</p>
            </div>

            <div
                className={`relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300 flex flex-col items-center justify-center min-h-[400px] ${dragActive
                        ? 'border-indigo-500 bg-indigo-500/5 scale-102 shadow-2xl shadow-indigo-500/10'
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
                        <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Upload className="w-10 h-10 text-indigo-500" />
                        </div>
                        <label
                            htmlFor="file-upload"
                            className="text-xl font-semibold mb-2 cursor-pointer hover:text-indigo-400 transition-colors"
                        >
                            Click to upload or drag and drop
                        </label>
                        <p className="text-slate-500">Only CSV files are supported for training</p>
                    </div>
                ) : (
                    <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 relative group animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setFile(null)}
                            className="absolute -top-3 -right-3 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                                <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate">{file.name}</h4>
                                <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                        <button className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
                            Process Data
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold">Privacy Note</h3>
                    </div>
                    <p className="text-sm text-slate-400">
                        Your data is processed entirely in your browser using TensorFlow.js. No raw data is ever sent to our servers.
                    </p>
                </div>
                <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-bold">Format Required</h3>
                    </div>
                    <p className="text-sm text-slate-400">
                        CSV should include columns for: Heart Rate, Temperature, Activity Level, Sleep Hours, and SpO2.
                    </p>
                </div>
            </div>
        </div>
    );
}
