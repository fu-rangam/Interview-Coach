import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'Ready2Work | Workforce Readiness';
  }, []);

  return (
    <div className="w-full flex flex-col relative overflow-hidden font-sans selection:bg-orange-500/20">
      {/* Background Hero Image */}
      <div className="absolute top-0 inset-x-0 h-[500px] md:h-[800px] z-0 pointer-events-none">
        <img
          src="/r2w_hero.png"
          alt="Hero Background"
          className="w-full h-full object-cover object-[75%] md:object-center opacity-100"
        />
      </div>

      {/* --- Navbar (Simple) --- */}
      <nav className="relative z-50 w-full px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <img src="/ready2work.png" alt="Ready2Work Logo" className="h-16 w-auto object-contain" />
          <span className="text-7xl font-bold font-display tracking-tight hidden sm:block">
            <span className="bg-clip-text text-transparent bg-linear-to-r from-rangam-navy to-rangam-blue">
              Ready
            </span>
            <span className="text-rangam-orange">2</span>
            <span className="bg-clip-text text-transparent bg-linear-to-r from-rangam-blue to-[#5378FF]">
              Work
            </span>
          </span>
        </div>
        <div className="flex gap-4">
          {!user && (
            <button
              onClick={() => navigate('/auth')}
              className="text-sm font-medium text-slate-600 hover:text-rangam-navy transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-12 pb-24 md:pt-20 md:pb-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: Text Content */}
        <div className="space-y-8 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-bold text-rangam-navy tracking-tight font-display leading-[1.1]">
            Build the skills to
            <br />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-rangam-blue via-rangam-navy to-rangam-orange">
              Launch Your Career
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-lg leading-relaxed">
            Ready2Work provides the tools, training, and personalized coaching you need to
            confidently enter the workforce and succeed in your dream job.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button onClick={() => navigate('/portal')} size="lg" className="group font-bold">
              Explore Tools
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Mock Interface Removed */}
      </div>
    </div>
  );
};

export default Home;
