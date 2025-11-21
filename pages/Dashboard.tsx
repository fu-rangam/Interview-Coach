import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Trash2, ChevronRight, Calendar, Award, Download } from 'lucide-react';
import { getAllSessions, deleteSession, SessionHistory, exportSessionAsJSON } from '../services/storageService';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<SessionHistory[]>([]);

    useEffect(() => {
        setSessions(getAllSessions());
    }, []);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this session?')) {
            deleteSession(id);
            setSessions(getAllSessions());
        }
    };

    const handleExport = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const json = exportSessionAsJSON(id);
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

    // Simple chart visualization (SVG)
    const renderChart = () => {
        if (sessions.length < 2) return null;

        // Take last 10 sessions, reverse for chronological order
        const data = [...sessions].reverse().slice(-10);
        const maxScore = 100;
        const height = 100;
        const width = 300;
        const pointGap = width / (data.length - 1 || 1);

        const points = data.map((s, i) => {
            const x = i * pointGap;
            const y = height - (s.score / maxScore) * height;
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Progress Over Time</h3>
                <div className="w-full h-32 relative">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                        {/* Grid lines */}
                        <line x1="0" y1="0" x2={width} y2="0" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                        <line x1="0" y1={height} x2={width} y2={height} stroke="#e2e8f0" strokeWidth="1" />

                        {/* Line */}
                        <polyline points={points} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Points */}
                        {data.map((s, i) => {
                            const x = i * pointGap;
                            const y = height - (s.score / maxScore) * height;
                            return (
                                <circle key={s.id} cx={x} cy={y} r="4" fill="#fff" stroke="#6366f1" strokeWidth="2" />
                            );
                        })}
                    </svg>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-50">
            <div className="flex-1 overflow-y-auto p-6">
                <div className="w-full max-w-4xl mx-auto pb-12">
                    <header className="flex justify-between items-center py-8 mb-8">
                        <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-900 font-medium flex items-center gap-2 transition-colors px-4 py-2 rounded-lg hover:bg-white/50">
                            <Home size={20} /> Back Home
                        </button>
                    </header>

                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Your Progress</h2>
                            <p className="text-slate-500 mt-2">Track your interview performance over time.</p>
                        </div>
                        <div className="text-right hidden sm:block">
                            <div className="text-3xl font-bold text-indigo-600">{sessions.length}</div>
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sessions Completed</div>
                        </div>
                    </div>

                    {renderChart()}

                    {sessions.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Award size={32} />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-700 mb-2">No sessions yet</h3>
                            <p className="text-slate-500 mb-8">Complete your first interview to see your history here.</p>
                            <button
                                onClick={() => navigate('/select-role')}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-200"
                            >
                                Start Practice
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 transition-all group cursor-pointer relative overflow-hidden"
                                    // For now, clicking just shows an alert or could navigate to a detail view if we implemented one.
                                    // Since we don't have a dedicated detail route yet, we'll just keep it simple.
                                    onClick={() => alert(`Session details for ${session.role} on ${session.date}\nScore: ${session.score}%`)}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${session.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                                    session.score >= 60 ? 'bg-teal-100 text-teal-700' :
                                                        'bg-orange-100 text-orange-700'
                                                }`}>
                                                {session.score}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg">{session.role}</h3>
                                                <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                    <span className="flex items-center gap-1"><Calendar size={14} /> {session.date}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span>{session.questionsCount} Questions</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 sm:ml-auto">
                                            <button
                                                onClick={(e) => handleExport(session.id, e)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Export JSON"
                                            >
                                                <Download size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(session.id, e)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Delete Session"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <ChevronRight className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
