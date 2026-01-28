import React, { useEffect, useState } from 'react';
import { Loader2, Trash2, Download, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import {
  getAllSessions,
  SessionHistory,
  deleteSession,
  exportSessionAsJSON,
} from '../services/storageService';
import { ReviewQuestionItem } from '../components/ui/review-question-item';
import { AnimatePresence, motion } from 'framer-motion';

// Coach Logic & Components
import { generateDashboardSignals, CoachDashboardSignals } from '../services/coachService';
import { CurrentBaseline } from '../components/dashboard/CurrentBaseline';
import { CoachingFocus } from '../components/dashboard/CoachingFocus';
import { CompetencyConstellation } from '../components/dashboard/CompetencyConstellation';
import { ProgressMomentum } from '../components/dashboard/ProgressMomentum';

export const DashboardHome: React.FC = () => {
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Coach Signals State
  const [signals, setSignals] = useState<CoachDashboardSignals | null>(null);

  const fetchSessions = React.useCallback(async () => {
    // Loading is true by default, so we don't need to set it true initially
    // setLoading(true);
    const data = await getAllSessions();
    setSessions(data);

    // Generate Coach Signals derived from data
    const coachSignals = generateDashboardSignals(data);
    setSignals(coachSignals);

    setLoading(false);
  }, []);

  const toggleSession = (id: string) => {
    setExpandedSessionId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const data = await getAllSessions();
        if (isMounted) {
          setSessions(data);

          // Generate signals
          const coachSignals = generateDashboardSignals(data);
          setSignals(coachSignals);

          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load dashboard sessions', error);
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const recentSessions = [...sessions].slice(0, 5); // Newest first

  if (loading || !signals) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-rangam-blue" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-rangam-navy">Dashboard</h1>

        {/* Practice Time Widget (Temporary Restoration) */}
        <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white rounded-full border border-slate-200 shadow-sm text-slate-600 animate-fade-in">
          <Clock size={16} className="text-rangam-blue" />
          <span className="text-xs md:text-sm font-medium">
            <span className="font-bold text-rangam-navy">
              {Math.floor(
                sessions.reduce((acc, s) => acc + (s.session.engagedTimeSeconds || 0), 0) / 3600
              )}
              h{' '}
              {Math.floor(
                (sessions.reduce((acc, s) => acc + (s.session.engagedTimeSeconds || 0), 0) % 3600) /
                  60
              )}
              m
            </span>{' '}
            Practice
          </span>
        </div>
      </div>

      {/* SECTION 1: Current Baseline (Sacred) */}
      <CurrentBaseline signal={signals.baseline} />

      {/* SECTION 2 & 3: Focus & Constellation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coaching Focus (Sacred) - Shows the ONE most important thing */}
        <div className="lg:col-span-1">
          <CoachingFocus
            signal={signals.focus}
            onActionClick={() => console.log('Navigate to practice')}
          />
        </div>

        {/* Competency Constellation (Constrained) - Visual Shape */}
        <div className="lg:col-span-2">
          <CompetencyConstellation signal={signals.constellation} />
        </div>
      </div>

      {/* SECTION 4: Progress Momentum */}
      {signals.progress.state !== 'Low Signal' && (
        <div className="max-w-md">
          <ProgressMomentum signal={signals.progress} />
        </div>
      )}

      {/* LAYER 1: Raw Session Facts (Persisted Data) */}
      <div className="pt-8 border-t border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-rangam-navy">Recent Sessions</h3>
          <span className="text-xs text-slate-400 font-medium">Recorded Facts</span>
        </div>

        <div className="space-y-3 md:space-y-4">
          {recentSessions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No sessions yet. Start practicing to build your baseline.
            </div>
          ) : (
            recentSessions.map((session) => {
              // We keep the score ONLY in this "History" view as a record of that specific session,
              // NOT as a profile-level aggregate. This complies with "Layer 1" persistence.
              const score = session.score || 0;
              let borderColor = 'border-slate-200';
              if (score >= 80) borderColor = 'border-emerald-200';
              else if (score >= 60) borderColor = 'border-amber-200';
              else if (score > 0) borderColor = 'border-red-200';

              return (
                <div
                  key={session.id}
                  className="border border-slate-200 hover:border-slate-300 rounded-lg overflow-hidden transition-all bg-white hover:bg-slate-50"
                >
                  <div
                    onClick={() => toggleSession(session.id)}
                    className="flex items-center justify-between p-2 md:p-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0 mr-2">
                      <div
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-white border ${borderColor} flex items-center justify-center text-slate-700 font-bold text-xs md:text-base shrink-0 shadow-sm`}
                      >
                        {session.score || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm md:text-base text-rangam-navy group-hover:text-rangam-blue transition-colors truncate">
                          {session.role}
                        </h4>
                        <p className="text-[10px] md:text-xs text-slate-400 truncate">
                          {session.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center shrink-0">
                      <div className="flex items-center gap-1 md:gap-2 mr-6 md:mr-12">
                        <button
                          onClick={(e) => handleExport(session.id, e)}
                          className="p-1.5 md:p-2 text-slate-400 hover:text-rangam-blue hover:bg-blue-50 rounded-full transition-colors"
                          title="Export JSON"
                          aria-label="Export session"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(session.id, e)}
                          className="p-1.5 md:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete"
                          aria-label="Delete session"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="text-slate-400 group-hover:text-rangam-blue transition-colors">
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
                        <div className="p-4 space-y-6 bg-slate-50 border-t border-slate-200">
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
                                  onToggle={() => {}}
                                  blueprint={session.session.blueprint}
                                  hideExpandIcon={true}
                                />
                              );
                            })
                          ) : (
                            <p className="text-center text-slate-400 text-sm py-4">
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
      </div>
    </div>
  );
};
