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
import { Button } from '../components/ui/button';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

import { AppBackground } from '../components/AppBackground';

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
    <div className="h-screen flex text-slate-900 overflow-hidden relative font-sans">
      <AppBackground />
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-rangam-navy/20 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 transition-transform duration-300 lg:translate-x-0',
          'bg-white lg:bg-white shadow-sm',
          !sidebarOpen && '-translate-x-full lg:translate-x-0'
        )}
      >
        <div
          className="h-full flex flex-col p-4"
          onTouchStart={(e) => {
            const touch = e.touches[0];
            e.currentTarget.dataset.startX = touch.clientX.toString();
          }}
          onTouchMove={() => {
            // Optional: live dragging
          }}
          onTouchEnd={(e) => {
            const touch = e.changedTouches[0];
            const startX = parseFloat(e.currentTarget.dataset.startX || '0');
            const diff = startX - touch.clientX;
            if (diff > 50) {
              setSidebarOpen(false);
            }
          }}
        >
          <div className="h-16 flex items-center justify-between px-2 mb-8 border-b border-slate-100">
            <Link
              to="/"
              className="text-xl font-bold text-rangam-navy tracking-tight font-display"
              onClick={() => setSidebarOpen(false)}
            >
              Ready<span className="text-rangam-orange">2</span>
              <span className="text-rangam-blue">Work</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-500 hover:text-rangam-navy ml-auto"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 group font-medium',
                    isActive
                      ? 'bg-rangam-orange/10 text-rangam-orange shadow-sm'
                      : 'text-slate-600 hover:text-rangam-navy hover:bg-slate-50'
                  )}
                >
                  <span
                    className={cn(
                      'transition-colors',
                      isActive
                        ? 'text-rangam-orange'
                        : 'text-slate-400 group-hover:text-rangam-navy'
                    )}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-slate-100">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
              onClick={async () => {
                await authService.signOut();
                localStorage.clear();
                navigate('/');
                setSidebarOpen(false);
              }}
            >
              <LogOut size={18} className="mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 relative z-10 min-w-0',
          'lg:ml-64'
        )}
      >
        {/* Header */}
        <header className="h-16 px-6 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Mobile Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-rangam-navy hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
            {/* Optional Breadcrumb Placeholder */}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-rangam-navy truncate max-w-[150px] lg:max-w-none">
                {user?.email}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-rangam-blue to-rangam-orange p-[2px] shadow-sm">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-rangam-navy font-bold">
                {user?.email?.charAt(0).toUpperCase() || (
                  <User size={20} className="text-slate-400" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div
          ref={mainContentRef}
          className={cn(
            'flex-1 overflow-y-auto w-full',
            location.pathname.includes('/session')
              ? 'p-0 overflow-hidden flex flex-col'
              : location.pathname === '/'
                ? 'p-0'
                : 'p-6'
          )}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};
