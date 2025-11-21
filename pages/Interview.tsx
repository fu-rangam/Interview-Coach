import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, MessageSquare, Send } from '../components/Icons';
import AudioVisualizer from '../components/AudioVisualizer';
import QuestionCard from '../components/QuestionCard';
import Loader from '../components/Loader';
import { useSession } from '../hooks/useSession';
import { useRecording } from '../hooks/useRecording';
import { useTextAnswer } from '../hooks/useTextAnswer';
import { analyzeAnswer } from '../services/geminiService';

const Interview: React.FC = () => {
    const navigate = useNavigate();
    const { session, saveAnswer } = useSession();
    const { isRecording, mediaStream, startRecording, stopRecording } = useRecording();
    const { text, error: textError, handleTextChange, submitTextAnswer, resetText, maxLength } = useTextAnswer();

    const [processingState, setProcessingState] = useState<{ isActive: boolean; text: string }>({ isActive: false, text: '' });
    const [activeTab, setActiveTab] = useState<'voice' | 'text'>('voice');

    const currentQ = session.questions[session.currentQuestionIndex];

    // Redirect if no questions (e.g. page reload on empty session)
    React.useEffect(() => {
        if (session.questions.length === 0) {
            navigate('/select-role');
        }
    }, [session.questions, navigate]);

    if (!currentQ) return <Loader />;

    const handleStartRecording = async () => {
        try {
            await startRecording();
        } catch (err) {
            alert("Microphone access is required to use this app.");
        }
    };

    const handleStopRecording = async () => {
        const blob = await stopRecording();
        await processAnswer(blob);
    };

    const handleTextSubmit = async () => {
        const validText = submitTextAnswer();
        if (validText) {
            await processAnswer(validText);
        }
    };

    const processAnswer = async (input: Blob | string) => {
        setProcessingState({ isActive: true, text: 'Analyzing your answer...' });

        try {
            const result = await analyzeAnswer(currentQ.text, input);

            saveAnswer(currentQ.id, {
                audioBlob: typeof input !== 'string' ? input : undefined,
                text: typeof input === 'string' ? input : undefined,
                analysis: result
            });

            resetText();
            navigate('/review');
        } catch (e) {
            alert("Failed to analyze answer.");
        } finally {
            setProcessingState({ isActive: false, text: '' });
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-50">
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center relative">

                {!processingState.isActive && (
                    <div className="absolute top-6 left-6 z-10">
                        <div className="h-10 px-4 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-500 text-sm font-semibold border border-slate-200">
                            Question {session.currentQuestionIndex + 1} / {session.questions.length}
                        </div>
                    </div>
                )}

                {processingState.isActive ? (
                    <div className="flex flex-col items-center animate-fade-in">
                        <Loader />
                        <p className="mt-8 text-xl text-slate-700 font-semibold">{processingState.text}</p>
                        <p className="text-sm text-slate-400 mt-2">This may take a few seconds...</p>
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center max-w-3xl my-auto">
                        <QuestionCard
                            question={currentQ?.text || "Loading..."}
                            role={session.role}
                            currentIndex={session.currentQuestionIndex}
                            total={session.questions.length}
                        />

                        {/* Input Method Toggle */}
                        <div className="flex p-1 bg-slate-200 rounded-xl mb-8 w-64">
                            <button
                                onClick={() => setActiveTab('voice')}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'voice' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Mic size={16} /> Voice
                            </button>
                            <button
                                onClick={() => setActiveTab('text')}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <MessageSquare size={16} /> Text
                            </button>
                        </div>

                        {/* Voice Input Area */}
                        {activeTab === 'voice' && (
                            <div className="flex flex-col items-center w-full animate-fade-in">
                                <div className="w-full h-32 flex items-center justify-center mb-10">
                                    {isRecording ? (
                                        <AudioVisualizer stream={mediaStream} isRecording={isRecording} />
                                    ) : (
                                        <div className="text-slate-400 text-sm text-center italic bg-white/50 px-6 py-3 rounded-full border border-slate-200/50">
                                            Click the microphone to begin your answer
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-6 relative">
                                    {!isRecording ? (
                                        <button
                                            onClick={handleStartRecording}
                                            className="w-20 h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-xl transition-all transform hover:scale-110 focus:outline-none ring-4 ring-indigo-100 active:scale-95"
                                        >
                                            <Mic size={32} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleStopRecording}
                                            className="w-20 h-20 bg-white border-4 border-rose-500 text-rose-500 rounded-full flex items-center justify-center shadow-xl transition-all transform hover:scale-105 focus:outline-none active:scale-95"
                                        >
                                            <Square size={32} fill="currentColor" />
                                        </button>
                                    )}
                                </div>
                                <p className="mt-6 text-slate-500 font-medium tracking-wide text-sm uppercase">
                                    {isRecording ? "Listening..." : "Tap to record"}
                                </p>
                            </div>
                        )}

                        {/* Text Input Area */}
                        {activeTab === 'text' && (
                            <div className="w-full animate-fade-in">
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 relative">
                                    <textarea
                                        value={text}
                                        onChange={(e) => handleTextChange(e.target.value)}
                                        placeholder="Type your answer here..."
                                        className="w-full h-48 p-4 text-slate-700 resize-none outline-none text-lg leading-relaxed"
                                        maxLength={maxLength}
                                    />
                                    <div className="flex justify-between items-center mt-2 px-2">
                                        <span className={`text-xs font-medium ${text.length > maxLength * 0.9 ? 'text-orange-500' : 'text-slate-400'}`}>
                                            {text.length} / {maxLength}
                                        </span>
                                        {textError && <span className="text-xs text-red-500 font-medium">{textError}</span>}
                                    </div>
                                </div>

                                <div className="flex justify-center mt-8">
                                    <button
                                        onClick={handleTextSubmit}
                                        disabled={text.trim().length < 10}
                                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-indigo-200 flex items-center gap-2"
                                    >
                                        Submit Answer <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
};

export default Interview;
