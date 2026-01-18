"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    HeartPulse,
    LayoutDashboard,
    Upload,
    Cpu,
    BarChart3,
    FileText,
    LogOut,
    ChevronRight
} from 'lucide-react';

const sidebarItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Input Data', icon: Upload, href: '/dashboard/input' },
    { name: 'Model Train', icon: Cpu, href: '/dashboard/train' },
    { name: 'Analysis', icon: BarChart3, href: '/dashboard/analysis' },
    { name: 'Generate Report', icon: FileText, href: '/dashboard/report' },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-50">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-800 bg-slate-950/50 backdrop-blur-xl flex flex-col sticky top-0 h-screen">
                <div className="p-6">
                    <Link href="/" className="flex items-center gap-2 group">
                        <HeartPulse className="w-8 h-8 text-indigo-500 animate-pulse group-hover:scale-110 transition-transform" />
                        <span className="text-xl font-bold tracking-tight">HealthSec</span>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
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
                    <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 transition-colors group">
                        <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                <div className="absolute top-0 left-0 w-full h-96 bg-indigo-600/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
