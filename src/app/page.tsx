import Link from 'next/link';
import { Activity, Shield, Cpu, Upload } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30">
      {/* Hero Section */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-indigo-500" />
            <span className="text-xl font-bold tracking-tight">HealthSec</span>
          </div>
          <div className="flex gap-4">
            <Link href="/auth/login" className="px-4 py-2 text-sm font-medium hover:text-indigo-400 transition-colors">
              Login
            </Link>
            <Link href="/auth/signup" className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-600/10 blur-[120px] rounded-full -z-10" />

        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Secure Health AI, <br />
            <span className="text-indigo-500">Trained on the Edge.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Protect your data while advancing medical research. HealthSec trains AI models locally on your device, sharing only anonymized insights.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20">
              Start Local Training
              <Cpu className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all">
              View Documentation
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 py-24 border-t border-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition-colors group">
            <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
              <Shield className="w-6 h-6 text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Data Sovereignty</h3>
            <p className="text-slate-400 leading-relaxed">
              Your health records never leave your device. We use federated learning principles to keep you in control.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition-colors group">
            <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
              <Activity className="w-6 h-6 text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Edge Optimization</h3>
            <p className="text-slate-400 leading-relaxed">
              Leverage TensorFlow.js to train models in real-time within your browser or mobile environment.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition-colors group">
            <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
              <Upload className="w-6 h-6 text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Global Sync</h3>
            <p className="text-slate-400 leading-relaxed">
              Contribute to a global model by uploading encrypted weights to our secure Supabase storage.
            </p>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-900 text-center text-slate-500 text-sm">
        <p>&copy; 2026 HealthSec AI Labs. Built for privacy.</p>
      </footer>
    </main>
  );
}
