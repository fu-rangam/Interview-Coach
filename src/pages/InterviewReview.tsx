import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { Activity, Target, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '../hooks/useSessionContext';
import { saveSession, updateHistorySession } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { useGuestTracker } from '../hooks/useGuestTracker';
import { ReviewQuestionItem } from '../components/ui/review-question-item';

// --- Helper Functions
const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald-500 drop-shadow-sm';
  if (score >= 60) return 'text-amber-500 drop-shadow-sm';
  return 'text-red-500 drop-shadow-sm';
};

export const InterviewReview: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSessionContext();
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }, []);

  // Route Guard: Redirect if no session data
  React.useEffect(() => {
    // Guard: Redirect if no session or not completed
    if (
      !session ||
      !session.questions ||
      session.questions.length === 0 ||
      session.status !== 'COMPLETED'
    ) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  // Derived State: Calculate Scores & Stats
  const { score, stats, questionsWithAnalysis } = useMemo(() => {
    const questions = session.questions;
    const answers = session.answers || {};

    let totalScore = 0;
    let count = 0;
    const stats = { strong: 0, good: 0, developing: 0 };

    const questionsWithAnalysis = questions.map((q) => {
      const result = answers[q.id]?.analysis;
      let qScore = 0;

      if (result) {
        // Priority: Use numerical score if available
        if (typeof result.answerScore === 'number') {
          qScore = result.answerScore;
        }
        // Fallback: Use legacy rating mapping
        else if (result.rating === 'Strong') {
          qScore = 100;
        } else if (result.rating === 'Good') {
          qScore = 80;
        } else if (result.rating === 'Developing') {
          qScore = 60;
        }

        // Update Stats based on Final Score
        if (qScore >= 80) stats.strong++;
        else if (qScore >= 60) stats.good++;
        else if (qScore > 0) stats.developing++;

        totalScore += qScore;
        count++;
      }

      return {
        ...q,
        analysis: result,
        transcript: answers[q.id]?.text || 'No transcript available.',
        audioBlob: answers[q.id]?.audioBlob,
      };
    });

    const finalScore = count > 0 ? Math.round(totalScore / count) : 0;
    return { score: finalScore, stats, questionsWithAnalysis };
  }, [session]);

  // PERSISTENCE LOGIC
  const { user } = useAuth();
  const { markSessionComplete } = useGuestTracker();
  const historyId = React.useRef<string | null>(null);
  const savePromiseRef = React.useRef<Promise<string | null> | null>(null);

  React.useEffect(() => {
    const saveOrUpdate = async () => {
      if (session.questions.length > 0) {
        // Determine ID if not present
        if (!historyId.current) {
          if (!savePromiseRef.current) {
            savePromiseRef.current = (async () => {
              if (user) {
                return saveSession(session, score);
              } else {
                markSessionComplete();
                return saveSession(session, score);
              }
            })();
          }
          const id = await savePromiseRef.current;
          historyId.current = id;
        }

        // Update existing record
        if (historyId.current) {
          await updateHistorySession(historyId.current, session, score);
        }
      }
    };
    saveOrUpdate();
  }, [session, score, user, markSessionComplete]);

  // Export Logic
  const handleExport = () => {
    const date = new Date().toLocaleDateString();
    const scoreLine = `Overall Score: ${score}/100`;
    const roleLine = `Role: ${session.role}`;

    let content = `INTERVIEW SESSION REPORT\nDate: ${date}\n${roleLine}\n${scoreLine}\n\n==================================================\n\n`;

    questionsWithAnalysis.forEach((q, idx) => {
      content += `QUESTION ${idx + 1}:\n${q.text}\n\n`;
      content += `YOUR ANSWER:\n${q.transcript}\n\n`;

      if (q.analysis) {
        content += `AI FEEDBACK:\n`;
        content += `Rating: ${q.analysis.rating}\n`;
        content += `Coach Reaction: ${q.analysis.coachReaction || 'N/A'}\n\n`;

        if (q.analysis.feedback && q.analysis.feedback.length > 0) {
          content += `Key Feedback:\n`;
          q.analysis.feedback.forEach((point) => {
            content += `- ${point}\n`;
          });
          content += `\n`;
        }

        if (q.analysis.strongResponse) {
          content += `STRONG RESPONSE EXAMPLE:\n${q.analysis.strongResponse}\n`;
        }
      } else {
        content += `(No AI Analysis available for this answer)\n`;
      }

      content += `\n--------------------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-session-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!session.questions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-600">
        <p className="mb-4">No session data found.</p>
        <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-7xl mx-auto pb-24 bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-rangam-navy tracking-tight mb-2">
            Session Analysis
          </h1>
          <p className="text-slate-500 text-lg">
            Insights for <span className="text-rangam-blue font-medium">{session.role}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-slate-200 text-slate-600 hover:text-rangam-navy"
          >
            <Download size={16} /> Export
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-rangam-blue text-white hover:bg-rangam-blue/90"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Score & Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Score */}
        <Card className="flex flex-col items-center justify-center py-8 relative overflow-hidden group border-slate-200 shadow-sm bg-white">
          <div className="absolute inset-0 bg-linear-to-b from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-4 relative z-10">
            Overall Confidence
          </h3>
          <div className="relative z-10">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 70}
                strokeDashoffset={2 * Math.PI * 70 * (1 - score / 100)}
                strokeLinecap="round"
                className={cn(
                  'transition-all duration-1000 ease-out',
                  getScoreColor(score).split(' ')[0]
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-5xl font-bold', getScoreColor(score))}>{score}</span>
              <span className="text-sm text-slate-400 font-medium">/ 100</span>
            </div>
          </div>
        </Card>

        {/* Performance Breakdown */}
        <Card className="col-span-1 md:col-span-2 flex flex-col justify-center p-8 border-slate-200 shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-rangam-blue" size={24} />
            <h3 className="text-xl font-bold text-rangam-navy">Performance Breakdown</h3>
          </div>
          <div className="space-y-6">
            {/* Strong */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" /> Strong Answers
                </span>
                <span className="text-slate-700 font-mono font-bold">{stats.strong}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${session.questions.length ? (stats.strong / session.questions.length) * 100 : 0}%`,
                  }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>
            {/* Good */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm" /> Good Answers
                </span>
                <span className="text-slate-700 font-mono font-bold">{stats.good}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${session.questions.length ? (stats.good / session.questions.length) * 100 : 0}%`,
                  }}
                  className="h-full bg-cyan-500 rounded-full"
                />
              </div>
            </div>
            {/* Developing */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm" /> Developing
                </span>
                <span className="text-slate-700 font-mono font-bold">{stats.developing}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${session.questions.length ? (stats.developing / session.questions.length) * 100 : 0}%`,
                  }}
                  className="h-full bg-amber-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Questions List */}
      <div>
        <h2 className="text-2xl font-bold text-rangam-navy mb-6 flex items-center gap-2">
          <Target className="text-purple-500" /> Detailed Review
        </h2>
        <div className="space-y-4">
          {questionsWithAnalysis.map((q, i) => (
            <ReviewQuestionItem
              key={q.id}
              q={q}
              index={i}
              isExpanded={expandedIds.includes(q.id)}
              onToggle={toggleExpand}
              blueprint={session.blueprint}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
