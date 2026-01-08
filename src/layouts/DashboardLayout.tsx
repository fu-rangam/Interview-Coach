import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { LayoutDashboard, Mic, Settings, LogOut, User, Menu } from 'lucide-react';
import { GlassButton } from '../components/ui/glass/GlassButton';

export const DashboardLayout: React.FC = () => {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

    const navItems = [
        { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { label: 'Interview Prep', icon: <Mic size={20} />, path: '/dashboard/interview' },
        { label: 'Settings', icon: <Settings size={20} />, path: '/dashboard/settings' },
    ];

    return (
        <div className="min-h-screen flex bg-zinc-950 text-white overflow-hidden relative">
            {/* Background Blobs (Global for Dashboard) */}
            <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r border-white/10 transition-transform duration-300 md:translate-x-0",
                    !sidebarOpen && "-translate-x-full md:translate-x-0" // Mobile toggle logic
                )}
            >
                <div className="h-full flex flex-col p-4">
                    <div className="h-16 flex items-center px-2 mb-8">
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-cyan-400 to-purple-500">
                            Ready2Work
                        </span>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                                        isActive
                                            ? "bg-white/10 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)] border border-white/5"
                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <span className={cn("transition-colors", isActive ? "text-cyan-400" : "group-hover:text-cyan-400")}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="mt-auto pt-4 border-t border-white/5">
                        <GlassButton variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10">
                            <LogOut size={18} className="mr-3" />
                            Sign Out
                        </GlassButton>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={cn(
                "flex-1 flex flex-col transition-all duration-300 relative z-10",
                "md:ml-64"
            )}>
                {/* Header */}
                <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        {/* Mobile Toggle */}
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-gray-400 hover:text-white">
                            <Menu size={24} />
                        </button>
                        {/* Breadcrumbs or Title could go here */}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-white">John Doe</p>
                            <p className="text-xs text-gray-400">Basic Plan</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-linear-to-tr from-cyan-500 to-purple-500 p-[2px]">
                            <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
                                <User size={20} className="text-gray-300" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
