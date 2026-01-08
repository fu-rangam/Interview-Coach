import React from 'react';
import { GlassCard } from '../../components/ui/glass/GlassCard';
import { GlassButton } from '../../components/ui/glass/GlassButton';
import { Mic, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardHome: React.FC = () => {
    const navigate = useNavigate();

    const stats = [
        { label: 'Sessions Completed', value: '12', icon: <Mic className="text-cyan-400" />, trend: '+2 this week' },
        { label: 'Avg. Confidence', value: '85%', icon: <TrendingUp className="text-green-400" />, trend: '+5% improvement' },
        { label: 'Practice Time', value: '4h 20m', icon: <Clock className="text-purple-400" />, trend: 'Top 10% of users' },
    ];

    const recentSessions = [
        { id: 1, role: 'Senior React Developer', date: '2 hours ago', score: 92, status: 'Completed' },
        { id: 2, role: 'Product Manager', date: 'Yesterday', score: 78, status: 'Reviewed' },
        { id: 3, role: 'Frontend Engineer', date: '2 days ago', score: 85, status: 'Completed' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                <div className="flex gap-3">
                    <GlassButton variant="outline" onClick={() => navigate('/glass/settings')}>
                        Settings & Privacy
                    </GlassButton>
                    <GlassButton onClick={() => navigate('/glass/interview')}>
                        Start New Session
                    </GlassButton>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <GlassCard key={i}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-white/5">{stat.icon}</div>
                            <span className="text-xs text-green-400 font-medium bg-green-500/10 px-2 py-1 rounded-full">{stat.trend}</span>
                        </div>
                        <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
                        <p className="text-sm text-gray-400">{stat.label}</p>
                    </GlassCard>
                ))}
            </div>

            {/* Recent Activity & Suggested Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <GlassCard className="h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Recent Sessions</h3>
                        <button className="text-sm text-cyan-400 hover:text-cyan-300">View All</button>
                    </div>
                    <div className="space-y-4">
                        {recentSessions.map((session) => (
                            <div key={session.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold">
                                        {session.score}
                                    </div>
                                    <div>
                                        <h4 className="font-medium group-hover:text-cyan-400 transition-colors">{session.role}</h4>
                                        <p className="text-xs text-gray-500">{session.date}</p>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Recommendations */}
                <GlassCard className="bg-linear-to-br from-purple-900/20 to-transparent">
                    <h3 className="text-lg font-bold mb-4">Recommended for You</h3>
                    <p className="text-gray-400 text-sm mb-6">Based on your recent performance, we recommend focusing on:</p>

                    <div className="space-y-3">
                        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <h4 className="font-bold text-sm mb-1">System Design: Scalability</h4>
                            <p className="text-xs text-gray-400">You struggled with scaling concepts in your last session.</p>
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
