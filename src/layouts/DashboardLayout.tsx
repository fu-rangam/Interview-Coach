import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
    LayoutDashboard,
    Mic,
    Settings,
    LogOut,
    User,
    Menu,
    FileText,
    GraduationCap,
    X,
} from 'lucide-react';
import { GlassButton } from '../components/ui/glass/GlassButton';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export const DashboardLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    const mainContentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        // Scroll reset for internal container
        if (mainContentRef.current) {
            mainContentRef.current.scrollTop = 0;
        }

        if (location.pathname.startsWith('/interview')) {
            document.title = 'Interview Coach';
        } else if (location.pathname.startsWith('/review')) {
            document.title = 'Interview Review';
        } else if (location.pathname === '/settings') {
            document.title = 'Settings';
        } else if (location.pathname === '/resume-builder') {
            document.title = 'Resume Builder';
        } else if (location.pathname === '/training') {
            document.title = 'Training';
        } else {
            document.title = 'Dashboard';
        }
    }, [location.pathname]);

    const navItems = [
        { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { label: 'Training', icon: <GraduationCap size={20} />, path: '/training' },
        { label: 'Resume Builder', icon: <FileText size={20} />, path: '/resume-builder' },
        { label: 'Interview Coach', icon: <Mic size={20} />, path: '/interview' },
        { label: 'Settings', icon: <Settings size={20} />, path: '/settings' },
    ];

    return (
        <div className="h-screen flex text-white overflow-hidden relative">
            {/* Background Blobs (Global for Dashboard) */}
            <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none hidden md:block" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none hidden md:block" />

            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 transition-transform duration-300 md:translate-x-0',
                    'bg-zinc-950/90 backdrop-blur-xl md:glass-panel md:bg-transparent',
                    !sidebarOpen && '-translate-x-full md:translate-x-0'
                )}
            >
                <div
                    className="h-full flex flex-col p-4"
                    onTouchStart={(e) => {
                        const touch = e.touches[0];
                        // Store start X
                        e.currentTarget.dataset.startX = touch.clientX.toString();
                    }}
                    onTouchMove={(e) => {
                        // Optional: live dragging
                    }}
                    onTouchEnd={(e) => {
                        const touch = e.changedTouches[0];
                        const startX = parseFloat(e.currentTarget.dataset.startX || '0');
                        const diff = startX - touch.clientX;
                        if (diff > 50) {
                            // Swiped left
                            setSidebarOpen(false);
                        }
                    }}
                >
                    <div className="h-16 flex items-center justify-between px-2 mb-8">
                        <Link
                            to="/"
                            className="text-xl font-bold text-white tracking-tight font-display"
                            onClick={() => setSidebarOpen(false)}
                        >
                            Ready<span className="text-cyan-400">2</span>Work
                        </Link>
                        {/* On mobile, if text is hidden, show X aligned left or right? 
                            Just keep the close button.
                        */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden text-gray-400 hover:text-white ml-auto"
                            aria-label="Close menu"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                                        isActive
                                            ? 'bg-white/10 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)] border border-white/5'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'transition-colors',
                                            isActive ? 'text-cyan-400' : 'group-hover:text-cyan-400'
                                        )}
                                    >
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-4 border-t border-white/5">
                        <GlassButton
                            variant="ghost"
                            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={async () => {
                                await authService.signOut();
                                localStorage.clear(); // Clear all session data
                                navigate('/');
                                setSidebarOpen(false);
                            }}
                        >
                            <LogOut size={18} className="mr-3" />
                            Sign Out
                        </GlassButton>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main
                className={cn(
                    'flex-1 flex flex-col transition-all duration-300 relative z-10 min-w-0',
                    'md:ml-64'
                )}
            >
                {/* Header */}
                <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="md:hidden text-gray-400 hover:text-white"
                            aria-label="Toggle menu"
                        >
                            <Menu size={24} />
                        </button>
                        {/* Breadcrumbs or Title could go here */}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-white truncate max-w-[150px] md:max-w-none">
                                {user?.email}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-linear-to-tr from-cyan-500 to-purple-500 p-[2px]">
                            <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
                                <User size={20} className="text-gray-300" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div
                    ref={mainContentRef}
                    className={cn(
                        'flex-1 overflow-y-auto',
                        // Remove padding and scroll for active session to allow full-screen layout
                        location.pathname.includes('/session')
                            ? 'p-0 overflow-hidden flex flex-col'
                            : 'p-6 md:p-8'
                    )}
                >
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
