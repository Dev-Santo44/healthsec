"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    HeartPulse,
    LayoutDashboard,
    Upload,
    Cpu,
    BarChart3,
    FileText,
    LogOut,
    ChevronRight,
    Users,
    Stethoscope,
    Bell,
    X,
    AlertCircle,
    CheckCircle2,
    Heart
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const sidebarItems = [
    { name: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Patients', icon: Users, href: '/dashboard/patients' },
    { name: 'Nurse Portal', icon: Stethoscope, href: '/dashboard/nurse' },
    { name: 'Intake', icon: Upload, href: '/dashboard/input' },
    { name: 'Model Config', icon: Cpu, href: '/dashboard/train' },
    { name: 'ML Center', icon: HeartPulse, href: '/dashboard/ml-center' },
    { name: 'Analytics', icon: BarChart3, href: '/dashboard/analysis' },
    { name: 'Reports', icon: FileText, href: '/dashboard/report' },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [alerts, setAlerts] = useState<any[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        fetchAlerts();
        // Polling for new alerts every 30 seconds
        const interval = setInterval(fetchAlerts, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchAlerts = async () => {
        try {
            const { data: patients } = await supabase.from('patients').select('id, name, patient_id, bed_number, status');
            const flagged: any[] = [];

            if (patients) {
                for (const patient of patients) {
                    const { data: latestVitals } = await supabase
                        .from('vitals')
                        .select('*')
                        .eq('patient_uuid', patient.id)
                        .eq('is_resolved', false)
                        .order('timestamp', { ascending: false })
                        .limit(1)
                        .single();

                    if (latestVitals) {
                        const issues = [];
                        if (latestVitals.hr > 100) issues.push(`Tachycardia (${latestVitals.hr} bpm)`);
                        if (latestVitals.spo2 < 94) issues.push(`Hypoxia (${latestVitals.spo2}%)`);
                        if (latestVitals.temp > 38) issues.push(`Febrile (${latestVitals.temp}°C)`);

                        if (issues.length > 0) {
                            flagged.push({
                                id: latestVitals.id,
                                patient_id: patient.id,
                                name: patient.name,
                                bed: patient.bed_number,
                                status: patient.status,
                                issues,
                                type: 'VITAL',
                                time: new Date(latestVitals.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            });
                        } else if (patient.status === 'Flagged') {
                            flagged.push({
                                id: `status-${patient.id}`,
                                patient_id: patient.id,
                                name: patient.name,
                                bed: patient.bed_number,
                                status: patient.status,
                                issues: ['Manual Flag'],
                                type: 'STATUS',
                                time: 'Awaiting Action'
                            });
                        }
                    } else if (patient.status === 'Flagged') {
                        flagged.push({
                            id: `status-${patient.id}`,
                            patient_id: patient.id,
                            name: patient.name,
                            bed: patient.bed_number,
                            status: patient.status,
                            issues: ['Manual Flag'],
                            type: 'STATUS',
                            time: 'Awaiting Action'
                        });
                    }
                }
            }
            setAlerts(flagged);
        } catch (error) {
            console.error("Layout alerts fetch error:", error);
        }
    };

    const handleResolve = async (id: string, type: 'VITAL' | 'STATUS') => {
        try {
            if (type === 'VITAL') {
                const { error } = await supabase
                    .from('vitals')
                    .update({ is_resolved: true })
                    .eq('id', id);
                if (error) throw error;
            } else {
                // If it's a manual flag, we change the status back to 'Active'
                const patientId = id.replace('status-', '');
                const { error } = await supabase
                    .from('patients')
                    .update({ status: 'Active' })
                    .eq('id', patientId);
                if (error) throw error;
            }
            fetchAlerts();
        } catch (error) {
            console.error("Resolve error:", error);
        }
    };

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            window.location.href = '/'; // Redirect to login/home
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-50">
            {/* Sidebar Overlay (Mobile) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-[70] w-64 border-r border-slate-800 bg-slate-950/50 backdrop-blur-xl flex flex-col transition-transform duration-300 transform
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen
            `}>
                <div className="p-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <HeartPulse className="w-8 h-8 text-indigo-500 animate-pulse group-hover:scale-110 transition-transform" />
                        <span className="text-xl font-bold tracking-tight">HealthSec</span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 text-slate-400 hover:text-white lg:hidden"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5'
                                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-500' : 'group-hover:text-indigo-400'}`} />
                                    <span className="font-medium">{item.name}</span>
                                </div>
                                {isActive && <ChevronRight className="w-4 h-4" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 transition-colors group"
                    >
                        <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        <span className="font-medium">Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 overflow-hidden relative flex flex-col">
                <div className="absolute top-0 left-0 w-full h-96 bg-indigo-600/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

                {/* Global Header */}
                <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 mr-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl lg:hidden"
                        >
                            <LayoutDashboard className="w-6 h-6" />
                        </button>
                        <span className="hidden sm:inline-block text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                            Sector 4 - Alpha Wing
                        </span>
                        <span className="sm:hidden text-xs font-bold text-indigo-500 uppercase tracking-widest font-mono">
                            S4-AW
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className={`p-2 rounded-xl border transition-all relative ${alerts.length > 0
                                    ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-lg shadow-red-500/10 animate-pulse'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                <Bell className="w-5 h-5" />
                                {alerts.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-950">
                                        {alerts.length}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {dropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-0" onClick={() => setDropdownOpen(false)} />
                                    <div className="max-sm:fixed max-sm:top-20 max-sm:left-4 max-sm:right-4 max-sm:w-auto sm:absolute sm:right-0 sm:mt-3 sm:w-80 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-10 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                                        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                                            <h3 className="font-bold text-sm flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-red-500" />
                                                Active Clinical Alerts
                                            </h3>
                                            <button onClick={() => setDropdownOpen(false)}>
                                                <X className="w-4 h-4 text-slate-500 hover:text-white" />
                                            </button>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {alerts.length > 0 ? alerts.map((alert) => (
                                                <div key={alert.id} className="p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex flex-col">
                                                            <Link
                                                                href={`/dashboard/patients/${alert.patient_id}`}
                                                                onClick={() => setDropdownOpen(false)}
                                                                className="font-bold text-xs text-slate-200 hover:text-indigo-400 decoration-indigo-500/30 underline-offset-4"
                                                            >
                                                                {alert.name}
                                                            </Link>
                                                            <span className="text-[10px] font-bold text-indigo-400 mt-0.5">
                                                                {alert.bed ? `Bed ${alert.bed}` : 'No Bed'}
                                                            </span>
                                                        </div>
                                                        <span className="text-[9px] text-slate-500 font-mono uppercase">{alert.time}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {alert.issues.map((issue: string, idx: number) => (
                                                            <span key={idx} className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${alert.type === 'VITAL'
                                                                ? 'bg-red-500/10 text-red-400 border-red-500/10'
                                                                : 'bg-amber-500/10 text-amber-400 border-amber-500/10'
                                                                }`}>
                                                                {issue}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={() => handleResolve(alert.id, alert.type)}
                                                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold transition-all border border-slate-700 flex items-center justify-center gap-2"
                                                    >
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Mark as Handled
                                                    </button>
                                                </div>
                                            )) : (
                                                <div className="p-8 text-center bg-slate-950/20">
                                                    <span className="text-xs text-slate-500 italic">No pending alerts. System stable.</span>
                                                </div>
                                            )}
                                        </div>
                                        {alerts.length > 0 && (
                                            <div className="p-3 bg-slate-950/50 text-center border-t border-slate-800">
                                                <Link
                                                    href="/dashboard"
                                                    onClick={() => setDropdownOpen(false)}
                                                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest"
                                                >
                                                    View Live Dashboard
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold border border-indigo-500/50">
                            JD
                        </div>
                    </div>
                </header>

                <div className="p-3 md:p-6 max-w-7xl mx-auto flex-1 w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
