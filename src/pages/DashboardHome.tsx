import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/ui/glass/GlassCard';
import { GlassButton } from '../components/ui/glass/GlassButton';
import {
  Mic,
  TrendingUp,
  Clock,
  ArrowRight,
  Loader2,
  Trash2,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getAllSessions,
  SessionHistory,
  deleteSession,
  exportSessionAsJSON,
} from '../services/storageService';
import { ReviewQuestionItem } from '../components/ui/glass/ReviewQuestionItem';
import { AnimatePresence, motion } from 'framer-motion';

export const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const toggleSession = (id: string) => {
    setExpandedSessionId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    const data = await getAllSessions();
    setSessions(data);
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this session?')) {
      await deleteSession(id);
      await fetchSessions();
    }
  };

  const handleExport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const json = await exportSessionAsJSON(id);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-session-${id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Calculate Stats
  const totalSessions = sessions.length;
  const avgScore =
    totalSessions > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.score, 0) / totalSessions)
      : 0;

  // Simple trend calculation (mock for now, real later)
  const trend = totalSessions > 0 ? '+100%' : '0%';

  const stats = [
    {
      label: 'Sessions Completed',
      value: totalSessions.toString(),
      icon: <Mic className="text-cyan-400" />,
      trend: 'All time',
    },
    {
      label: 'Avg. Confidence',
      value: `${avgScore}%`,
      icon: <TrendingUp className="text-green-400" />,
      trend: 'Overall',
    },
    {
      label: 'Practice Time',
      value: `${totalSessions * 15}m`,
      icon: <Clock className="text-purple-400" />,
      trend: 'Estimated',
    },
  ];

  const recentSessions = [...sessions].slice(0, 5); // Newest first

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <GlassCard key={i}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-lg bg-white/5">{stat.icon}</div>
              <span className="text-xs text-gray-300 font-medium bg-zinc-800/80 border border-white/10 px-2 py-1 rounded-full">
                {stat.trend}
              </span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-400">{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Recent Activity & Suggested Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <GlassCard className="h-full p-3 md:p-6">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="text-lg font-bold">Recent Sessions</h3>
          </div>
          <div className="space-y-3 md:space-y-4">
            {recentSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No sessions yet. Start practicing!
              </div>
            ) : (
              recentSessions.map((session) => {
                const score = session.score || 0;
                let borderColor = 'border-white/10';
                if (score >= 80) borderColor = 'border-emerald-500/50';
                else if (score >= 60) borderColor = 'border-amber-500/50';
                else if (score > 0) borderColor = 'border-red-500/50';

                return (
                  <div
                    key={session.id}
                    className="border border-transparent hover:border-white/5 rounded-lg overflow-hidden transition-all bg-white/0 hover:bg-white/5"
                  >
                    <div
                      onClick={() => toggleSession(session.id)}
                      className="flex items-center justify-between p-2 md:p-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0 mr-2">
                        <div
                          className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-800/80 border ${borderColor} flex items-center justify-center text-gray-200 font-bold text-xs md:text-base shrink-0`}
                        >
                          {session.score || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm md:text-base group-hover:text-cyan-400 transition-colors truncate">
                            {session.role}
                          </h4>
                          <p className="text-[10px] md:text-xs text-gray-500 truncate">
                            {session.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center shrink-0">
                        <div className="flex items-center gap-1 md:gap-2 mr-6 md:mr-12">
                          <button
                            onClick={(e) => handleExport(session.id, e)}
                            className="p-1.5 md:p-2 text-gray-500 hover:text-cyan-400 hover:bg-white/10 rounded-full transition-colors"
                            title="Export JSON"
                            aria-label="Export session"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(session.id, e)}
                            className="p-1.5 md:p-2 text-gray-500 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors"
                            title="Delete"
                            aria-label="Delete session"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="text-gray-500 group-hover:text-cyan-400 transition-colors">
                          {expandedSessionId === session.id ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {expandedSessionId === session.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 space-y-6 bg-black/20 border-t border-white/5">
                            {session.session.questions && session.session.questions.length > 0 ? (
                              session.session.questions.map((q, idx) => {
                                const answer = session.session.answers[q.id];
                                return (
                                  <ReviewQuestionItem
                                    key={q.id}
                                    q={{
                                      ...q,
                                      analysis: answer?.analysis,
                                      transcript: answer?.text || 'No transcript available.',
                                      audioBlob: undefined, // Not stored in history
                                    }}
                                    index={idx}
                                    isExpanded={true}
                                    onToggle={() => { }}
                                    blueprint={session.session.blueprint}
                                    hideExpandIcon={true}
                                  />
                                );
                              })
                            ) : (
                              <p className="text-center text-gray-500 text-sm py-4">
                                No detailed feedback available for this session.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>

        {/* Recommendations */}
        <GlassCard className="bg-linear-to-br from-purple-900/20 to-transparent">
          <h3 className="text-lg font-bold mb-4">Recommended for You</h3>
          <p className="text-gray-400 text-sm mb-6">
            Based on your recent performance, we recommend focusing on:
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <h4 className="font-bold text-sm mb-1">System Design: Scalability</h4>
              <p className="text-xs text-gray-400">
                You struggled with scaling concepts in your last session.
              </p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <h4 className="font-bold text-sm mb-1">Behavioral: Conflict Resolution</h4>
              <p className="text-xs text-gray-400">Refine your STAR method for better clarity.</p>
            </div>
          </div>

          <GlassButton variant="outline" className="w-full mt-6">
            View Practice Plan
          </GlassButton>
        </GlassCard>
      </div>
    </div>
  );
};
