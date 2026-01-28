import React from 'react';
import { Card } from '../components/ui/card';
import { Mic, FileText, GraduationCap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { AppBackground } from '../components/AppBackground';

export const Portal: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-16 relative">
      <AppBackground />
      {/* Header Section */}
      <div className="text-center space-y-6 max-w-4xl mx-auto">
        {/* Ready2Work Brand Title */}
        <span className="text-7xl md:text-8xl font-bold font-display tracking-tight block">
          <span className="bg-clip-text text-transparent bg-linear-to-r from-rangam-navy to-rangam-blue">
            Ready
          </span>
          <span className="text-rangam-orange">2</span>
          <span className="bg-clip-text text-transparent bg-linear-to-r from-rangam-blue to-[#5378FF]">
            Work
          </span>
        </span>

        <h1 className="text-3xl md:text-5xl font-bold text-rangam-navy font-display leading-tight">
          Everything you need to get hired
        </h1>

        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Our platform combines technical training, resume optimization, and behavioral practice
          into one seamless workflow.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl">
        <FeatureCard
          title="Resume Builder"
          description="Create professional, ATS-friendly resumes in minutes with AI assistance to stand out to recruiters."
          icon={<FileText size={28} className="text-white" />}
          color="orange"
          onClick={() => navigate('/resume-builder')}
          delay={0}
        />
        <FeatureCard
          title="Interview Coach"
          description="Practice with an intelligent AI coach that gives you real-time feedback on your delivery and confidence."
          icon={<Mic size={28} className="text-white" />}
          color="navy"
          onClick={() => navigate('/interview')}
          delay={100}
        />
        <FeatureCard
          title="Smart Training"
          description="Access our extensive e-learning library to upskill, earn certifications, and get workforce ready."
          icon={<GraduationCap size={28} className="text-white" />}
          color="green"
          onClick={() => navigate('/training')}
          delay={200}
        />
      </div>
    </div>
  );
};

// --- Subcomponents ---

const FeatureCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'orange' | 'navy' | 'green';
  onClick: () => void;
  delay?: number;
}> = ({ title, description, icon, color, onClick, delay }) => {
  const colorMap = {
    orange: 'bg-rangam-orange',
    navy: 'bg-rangam-navy',
    green: 'bg-rangam-green',
  };

  const shadowMap = {
    orange: 'shadow-rangam-orange/20',
    navy: 'shadow-rangam-navy/20',
    green: 'shadow-green-900/10',
  };

  return (
    <Card
      className="cursor-pointer group p-8"
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <div
        className={`w-14 h-14 rounded-2xl ${colorMap[color]} flex items-center justify-center mb-6 shadow-[0_3px_1px_var(--tw-shadow-color)] ${shadowMap[color]} group-hover:scale-110 transition-transform duration-300`}
      >
        {icon}
      </div>

      <h3 className="text-xl font-bold text-rangam-navy mb-3 font-display">{title}</h3>
      <p className="text-slate-500 text-sm mb-8 leading-relaxed">{description}</p>

      <div className="flex items-center text-sm font-semibold text-rangam-navy group-hover:gap-2 transition-all">
        Explore Tool <ArrowRight size={16} className="ml-1" />
      </div>
    </Card>
  );
};
