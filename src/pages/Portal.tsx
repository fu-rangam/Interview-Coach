import React from 'react';
import { GlassCard } from '../components/ui/glass/GlassCard';
import { GlassButton } from '../components/ui/glass/GlassButton';
import { Mic, FileText, GraduationCap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Portal: React.FC = () => {
  const navigate = useNavigate();

  const tools = [
    {
      title: 'Interview Coach',
      description: 'Master your interview skills with real-time AI feedback and voice simulations.',
      icon: <Mic className="w-8 h-8 text-cyan-400" />,
      action: 'Start Practicing',
      path: '/dashboard/interview',
      active: true,
    },
    {
      title: 'Resume Builder',
      description: 'Create ATS-optimized resumes that stand out to recruiters in seconds.',
      icon: <FileText className="w-8 h-8 text-purple-400" />,
      action: 'Coming Soon',
      path: '#',
      active: false,
    },
    {
      title: 'Career Training',
      description: 'Upskill with curated courses designed to help you land your dream job.',
      icon: <GraduationCap className="w-8 h-8 text-pink-400" />,
      action: 'Coming Soon',
      path: '#',
      active: false,
    },
  ];

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none hidden md:block" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[100px] pointer-events-none hidden md:block" />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-3xl mb-16 relative z-10"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white">
          Ready to <span className="text-gradient-primary">Work</span>?
        </h1>
        <p className="text-xl text-gray-300 mb-8 leading-relaxed">
          Your all-in-one platform to prepare, practice, and perfect your path to employment. Select
          a tool to get started.
        </p>
        <div className="flex gap-4 justify-center">
          <GlassButton size="lg" onClick={() => navigate('/auth')}>
            Get Started
          </GlassButton>
          <GlassButton size="lg" variant="outline">
            Learn More
          </GlassButton>
        </div>
      </motion.div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl relative z-10">
        {tools.map((tool, index) => (
          <GlassCard
            key={index}
            hoverEffect={tool.active}
            className={`flex flex-col items-start h-full ${!tool.active ? 'opacity-70 grayscale-[0.5]' : ''}`}
          >
            <div className="mb-6 p-4 rounded-full bg-white/5 border border-white/10">
              {tool.icon}
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">{tool.title}</h3>
            <p className="text-gray-400 mb-8 grow">{tool.description}</p>
            <GlassButton
              variant={tool.active ? 'primary' : 'ghost'}
              className="w-full justify-between group"
              disabled={!tool.active}
              onClick={() => tool.active && navigate(tool.path)}
            >
              {tool.action}
              {tool.active && (
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              )}
            </GlassButton>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
