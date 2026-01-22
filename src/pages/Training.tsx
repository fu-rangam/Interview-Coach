import React from 'react';
import { GlassCard } from '../components/ui/glass/GlassCard';
import { GlassButton } from '../components/ui/glass/GlassButton';
import { GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Training: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-2 items-center text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Training Center</h1>
        <p className="text-xl text-gray-400 max-w-2xl">
          Upskill with our curated library of courses and certifications.
        </p>

        <GlassCard className="mt-12 p-12 flex flex-col items-center justify-center border-dashed border-2 border-white/10 w-full max-w-xl">
          <div className="w-24 h-24 rounded-full bg-linear-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center mb-8 border border-amber-500/20">
            <GraduationCap size={48} className="text-amber-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Coming Soon</h3>
          <p className="text-gray-400 mb-8">
            We are building a comprehensive learning platform to help you land your dream job.
          </p>

          <GlassButton onClick={() => navigate('/dashboard')} variant="outline">
            Back to Dashboard
          </GlassButton>
        </GlassCard>
      </div>
    </div>
  );
};
