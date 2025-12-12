import React, { useState } from 'react';
import { generateQuestions } from '../services/geminiService';
import { Question } from '../types';

const DebugPrompt: React.FC = () => {
    const [role, setRole] = useState('Cashier');
    const [jd, setJd] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [error, setError] = useState('');

    const handleTest = async () => {
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const questions = await generateQuestions(role, jd);

            // Wrap result with useful metadata for the seed bank
            const enrichedResult = {
                metadata: {
                    role,
                    jobDescription: jd ? jd.substring(0, 100) + '...' : 'N/A', // Truncate for readability
                    timestamp: new Date().toISOString(),
                    model: 'gemini-2.5-flash',
                    tags: ['generated', 'v1'],
                    qualityScore: 0 // Placeholder for manual rating (0-4)
                },
                questions: questions.map(q => ({
                    ...q,
                    category: 'General', // Placeholder
                    difficulty: 'Adaptive' // Placeholder
                }))
            };

            setResult(enrichedResult);
        } catch (e: any) {
            setError(e.message || "Error generating questions");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;

        const fileName = `${role.replace(/\s+/g, '_').toLowerCase()}_questions_${Date.now()}.json`;
        const jsonStr = JSON.stringify(result, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-screen overflow-y-auto bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 relative">
                <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 p-6 shadow-sm transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold text-slate-800">Prompt Engineering Debugger</h1>
                        {result && (
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
                            >
                                Download JSON 📥
                            </button>
                        )}
                    </div>

                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Role</label>
                            <input
                                type="text"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                placeholder="e.g. Cashier"
                            />
                        </div>
                        <button
                            onClick={handleTest}
                            disabled={loading}
                            className="bg-indigo-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm h-[38px]"
                        >
                            {loading ? 'Generating...' : 'Test Generation'}
                        </button>
                    </div>
                </div>

                <div className="p-8 pt-6">
                    <div className="grid gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Job Description (Optional)</label>
                            <textarea
                                value={jd}
                                onChange={(e) => setJd(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg h-32 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Paste JD here..."
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-6 border border-red-200">
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Generated Output</h2>
                            {result.questions.map((q: any, i: number) => (
                                <div key={q.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Question {i + 1}</span>
                                    <p className="text-lg text-slate-800">{q.text}</p>
                                </div>
                            ))}

                            <div className="mt-8">
                                <h3 className="text-sm font-semibold text-slate-500 mb-2">Raw JSON Payload</h3>
                                <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto text-xs">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DebugPrompt;
