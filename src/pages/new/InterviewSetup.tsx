import React, { useState } from 'react';
import { GlassCard } from '../../components/ui/glass/GlassCard';
import { GlassButton } from '../../components/ui/glass/GlassButton';
import { GlassTextarea } from '../../components/ui/glass/GlassTextarea';
import { Upload, FileText, Mic, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '../../hooks/useSessionContext';

export const InterviewSetup: React.FC = () => {
    const navigate = useNavigate();
    const { startSession, isLoading } = useSessionContext();
    const [jobDescription, setJobDescription] = useState('');
    const [isStarting, setIsStarting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStartSession = async () => {
        if (!jobDescription.trim()) {
            setError("Please provide a job description to tailor the interview.");
            return;
        }

        setIsStarting(true);
        setError(null);

        try {
            // Default role is "Software Engineer" for now, or extracted from JD
            await startSession("Frontend Engineer", jobDescription);
            navigate('/glass/interview/session');
        } catch (err) {
            console.error("Failed to start session:", err);
            setError("Failed to initialize AI session. Please try again.");
            setIsStarting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Setup Your Interview Simulation</h1>
                <p className="text-gray-400">Provide the context for the AI coach to generate relevant questions.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Inputs */}
                <div className="lg:col-span-2 space-y-6">
                    <GlassCard>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <FileText className="text-cyan-400" size={20} />
                            Job Description
                        </h3>
                        <GlassTextarea
                            placeholder="Paste the job description here (e.g., Senior Frontend Engineer at Google...)"
                            className="mb-4 font-mono text-sm"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            error={error || undefined}
                        />
                        <div className="flex justify-end">
                            <button
                                className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                                onClick={() => setJobDescription("Senior Frontend Engineer needed. Must know React, TypeScript, and TailwindCSS. Experience with system design is a plus.")}
                            >
                                Load Sample JD
                            </button>
                        </div>
                    </GlassCard>

                    <GlassCard>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Upload className="text-purple-400" size={20} />
                            Upload Resume (Optional)
                        </h3>
                        <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:bg-white/5 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-3 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                                <Upload className="text-gray-400 group-hover:text-cyan-400" />
                            </div>
                            <p className="text-sm text-gray-300 font-medium">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-500 mt-1">PDF or DOCX (Max 5MB)</p>
                        </div>
                    </GlassCard>
                </div>

                {/* Right Column: Summary & Action */}
                <div className="lg:col-span-1">
                    <GlassCard className="sticky top-24 border-t-4 border-t-cyan-500">
                        <h3 className="text-lg font-bold mb-4">Session Settings</h3>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Role</span>
                                <span className="font-medium">Frontend Engineer</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Duration</span>
                                <span className="font-medium">15 Minutes</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Focus</span>
                                <span className="font-medium">Technical + Behavioral</span>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-xs text-red-300">
                                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                {error}
                            </div>
                        )}

                        <GlassButton
                            className="w-full py-4 text-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-pulse hover:animate-none"
                            onClick={handleStartSession}
                            disabled={isStarting}
                        >
                            <Mic className="mr-2" />
                            {isStarting ? 'Generating...' : 'Start Session'}
                        </GlassButton>

                        <p className="text-xs text-center text-gray-500 mt-4">
                            By starting, you agree to the recording of this session for analysis purposes.
                        </p>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};
