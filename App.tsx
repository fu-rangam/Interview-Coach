import React, { useState, useEffect, useRef } from 'react';
import { AppScreen, JOB_ROLES, InterviewSession, AnalysisResult, Question } from './types';
import { generateQuestions, analyzeAnswer } from './services/geminiService';
import { Mic, Square, ChevronRight, RefreshCw, Home, Award, Briefcase, CheckCircle2, MessageSquare, Play } from './components/Icons';
import AudioVisualizer from './components/AudioVisualizer';
import QuestionCard from './components/QuestionCard';
import Loader from './components/Loader';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.HOME);
  const [session, setSession] = useState<InterviewSession>({
    role: '',
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
  });
  
  const [isRecording, setIsRecording] = useState(false);
  const [processingState, setProcessingState] = useState<{ isActive: boolean; text: string }>({ isActive: false, text: '' });
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  
  // State for the Summary/Analysis page accordion
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // --- Navigation Handlers ---
  
  const startSetup = () => setScreen(AppScreen.ROLE_SELECTION);

  const selectRole = async (role: string) => {
    setProcessingState({ isActive: true, text: 'Preparing your interview...' });
    setScreen(AppScreen.INTERVIEW); 
    try {
      const questions = await generateQuestions(role);
      setSession({
        role,
        questions,
        currentQuestionIndex: 0,
        answers: {}
      });
    } catch (e) {
      alert("Failed to generate questions. Please try again.");
      setScreen(AppScreen.ROLE_SELECTION);
    } finally {
      setProcessingState({ isActive: false, text: '' });
    }
  };

  const restartApp = () => {
    setScreen(AppScreen.HOME);
    setSession({ role: '', questions: [], currentQuestionIndex: 0, answers: {} });
  };

  // --- Recording Logic ---

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
        
        await processAnswer(audioBlob);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required to use this app.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAnswer = async (blob: Blob) => {
    setProcessingState({ isActive: true, text: 'Analyzing your answer...' });
    const currentQ = session.questions[session.currentQuestionIndex];
    
    try {
      const result = await analyzeAnswer(currentQ.text, blob);
      
      setSession(prev => ({
        ...prev,
        answers: {
          ...prev.answers,
          [currentQ.id]: {
            audioBlob: blob,
            analysis: result
          }
        }
      }));
      
      setScreen(AppScreen.REVIEW);
    } catch (e) {
      alert("Failed to analyze audio.");
    } finally {
      setProcessingState({ isActive: false, text: '' });
    }
  };

  const handleNextQuestion = () => {
    if (session.currentQuestionIndex < session.questions.length - 1) {
      setSession(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
      setScreen(AppScreen.INTERVIEW);
    } else {
      setScreen(AppScreen.SUMMARY);
    }
  };

  const handleRedo = () => {
    setScreen(AppScreen.INTERVIEW);
  };

  const getRatingColor = (rating?: string) => {
    // Updated color scheme: Emerald (Strong), Teal (Good), Orange (Needs Practice)
    switch(rating) {
      case 'Strong': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Good': return 'bg-teal-100 text-teal-700 border-teal-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200'; // Needs Practice
    }
  };

  // --- Helper for Summary Calculation ---
  const calculateOverallScore = () => {
    const totalQs = session.questions.length;
    if (totalQs === 0) return 0;

    let scoreSum = 0;
    (Object.values(session.answers) as Array<{ audioBlob: Blob; analysis: AnalysisResult | null }>).forEach(ans => {
      if (ans.analysis?.rating === 'Strong') scoreSum += 100;
      else if (ans.analysis?.rating === 'Good') scoreSum += 75;
      else scoreSum += 50;
    });

    return Math.round(scoreSum / totalQs);
  };

  // --- Render Functions ---

  if (screen === AppScreen.HOME) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
        <div className="max-w-3xl text-center z-10">
          <div className="inline-flex items-center justify-center p-5 bg-white rounded-2xl mb-8 shadow-lg shadow-indigo-100 ring-1 ring-indigo-50">
            <Briefcase className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight">
            AI Interview Coach
          </h1>
          <p className="text-xl text-slate-600 mb-12 max-w-xl mx-auto leading-relaxed">
            Master your interview skills with real-time AI feedback. Practice key questions, refine your answers, and build confidence.
          </p>
          <button 
            onClick={startSetup}
            className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-medium rounded-xl transition-all transform hover:scale-105 shadow-xl shadow-indigo-200 ring-4 ring-indigo-50"
          >
            Start Practicing
          </button>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-fuchsia-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
    );
  }

  if (screen === AppScreen.ROLE_SELECTION) {
    return (
      <div className="flex flex-col h-full w-full bg-slate-50">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="w-full max-w-5xl mx-auto pb-12">
              <header className="flex justify-between items-center py-8 mb-8">
                <button onClick={() => setScreen(AppScreen.HOME)} className="text-slate-500 hover:text-slate-900 font-medium flex items-center gap-2 transition-colors px-4 py-2 rounded-lg hover:bg-white/50">
                  <Home size={20} /> Back Home
                </button>
              </header>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center text-slate-800">Select your target role</h2>
              <p className="text-center text-slate-500 mb-12 max-w-lg mx-auto">Choose a field to generate specific interview questions tailored to industry standards.</p>

              {processingState.isActive ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader />
                  <p className="mt-8 text-slate-600 font-medium text-lg animate-pulse">{processingState.text}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {JOB_ROLES.map((role) => (
                    <button
                      key={role}
                      onClick={() => selectRole(role)}
                      className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-500 hover:shadow-indigo-100 hover:shadow-md transition-all text-left group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative z-10">
                        <h3 className="text-lg font-semibold text-slate-800 group-hover:text-indigo-700 mb-1 transition-colors">{role}</h3>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">5 Questions</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>
    );
  }

  if (screen === AppScreen.INTERVIEW) {
    const currentQ = session.questions[session.currentQuestionIndex];
    
    return (
      <div className="flex flex-col h-full w-full bg-slate-50">
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center relative">
          
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
            <>
              <div className="w-full flex flex-col items-center max-w-3xl">
                <QuestionCard 
                  question={currentQ?.text || "Loading..."} 
                  role={session.role}
                  currentIndex={session.currentQuestionIndex}
                  total={session.questions.length}
                />

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
                      onClick={startRecording}
                      className="w-20 h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-xl transition-all transform hover:scale-110 focus:outline-none ring-4 ring-indigo-100 active:scale-95"
                    >
                      <Mic size={32} />
                    </button>
                  ) : (
                    <button 
                      onClick={stopRecording}
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
            </>
          )}
        </div>
      </div>
    );
  }

  if (screen === AppScreen.REVIEW) {
    const currentQ = session.questions[session.currentQuestionIndex];
    const answer = session.answers[currentQ.id];
    const isLastQuestion = session.currentQuestionIndex === session.questions.length - 1;

    return (
      <div className="flex flex-col md:flex-row h-full w-full bg-white overflow-y-auto md:overflow-hidden">
        {/* Left Panel: Question & Transcript */}
        <div className="w-full md:w-1/2 h-auto md:h-full md:overflow-y-auto border-r border-slate-100 bg-white">
          <div className="p-6 md:p-12 max-w-xl mx-auto pb-12 md:pb-24">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Question {session.currentQuestionIndex + 1}</h3>
            <h2 className="text-2xl font-bold text-slate-900 mb-8 leading-tight">{currentQ.text}</h2>
            
            <div className="bg-slate-50 p-8 rounded-2xl mb-8 border border-slate-100 shadow-inner">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wide flex items-center gap-2">
                <Mic size={14} /> Your Transcript
              </h4>
              <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
                {answer?.analysis?.transcript}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-8 border-t border-slate-100">
              <button onClick={handleRedo} className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors">
                <RefreshCw size={18} /> Retry
              </button>
              <button onClick={handleNextQuestion} className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 ml-auto transition-all hover:translate-x-1">
                {isLastQuestion ? (
                  <>Finish & Analyze <Award size={18} /></>
                ) : (
                  <>Next Question <ChevronRight size={18} /></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Insights */}
        <div className="w-full md:w-1/2 h-auto md:h-full md:overflow-y-auto bg-slate-50/80">
          <div className="p-6 md:p-12 max-w-xl mx-auto pb-24">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-2xl font-bold text-slate-800">AI Insights</h3>
               <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border ${getRatingColor(answer?.analysis?.rating)}`}>
                 {answer?.analysis?.rating} Match
               </span>
            </div>

            <div className="space-y-6">
              {/* Key Terms Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Award size={20} />
                  </div>
                  <h4 className="font-semibold text-slate-800">Key Professional Terms</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {answer?.analysis?.keyTerms.map((term, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium border border-slate-200">
                      {term}
                    </span>
                  ))}
                </div>
              </div>

              {/* Feedback Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <MessageSquare size={20} />
                  </div>
                  <h4 className="font-semibold text-slate-800">Feedback</h4>
                </div>
                <ul className="space-y-4">
                  {answer?.analysis?.feedback.map((point, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <p className="text-slate-600 leading-relaxed">{point}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === AppScreen.SUMMARY) {
    const score = calculateOverallScore();
    const answerEntries = Object.values(session.answers) as Array<{ audioBlob: Blob; analysis: AnalysisResult | null }>;
    const strongCount = answerEntries.filter(a => a.analysis?.rating === 'Strong').length;
    const goodCount = answerEntries.filter(a => a.analysis?.rating === 'Good').length;
    const practiceCount = answerEntries.filter(a => a.analysis?.rating === 'Needs Practice').length;

    return (
      <div className="flex flex-col h-full w-full bg-slate-50 overflow-hidden">
         {/* Use flex-1 with overflow-y-auto to ensure scrolling works within the fixed viewport */}
         <div className="flex-1 overflow-y-auto">
            <div className="w-full max-w-5xl mx-auto p-6 md:p-8 pb-32">
              
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Interview Analysis</h2>
                  <p className="text-slate-500 mt-1">Comprehensive insights for <span className="font-semibold text-indigo-600">{session.role}</span> role</p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                    <button onClick={restartApp} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-white hover:border-slate-400 transition-all text-sm">
                      Exit
                    </button>
                    <button onClick={() => startSetup()} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all text-sm shadow-lg shadow-slate-200">
                      New Practice Session
                    </button>
                </div>
              </div>

              {/* Hero Stats Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                
                {/* Score Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
                   <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                        <circle 
                          cx="50" cy="50" r="40" 
                          fill="transparent" 
                          stroke={score >= 80 ? '#10b981' : score >= 60 ? '#0d9488' : '#f97316'} 
                          strokeWidth="8" 
                          strokeDasharray={`${2 * Math.PI * 40}`} 
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - score/100)}`} 
                          strokeLinecap="round"
                          className="transform -rotate-90 origin-center transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-3xl font-bold text-slate-800">{score}%</span>
                      </div>
                   </div>
                   <h3 className="text-slate-600 font-medium">Readiness Score</h3>
                </div>

                {/* Breakdown Card */}
                <div className="col-span-1 md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-center">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">Performance Breakdown</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-24 text-sm font-medium text-slate-500">Strong</div>
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden mx-3">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(strongCount / session.questions.length) * 100}%` }}></div>
                      </div>
                      <div className="w-8 text-right font-bold text-slate-800">{strongCount}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-24 text-sm font-medium text-slate-500">Good</div>
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden mx-3">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(goodCount / session.questions.length) * 100}%` }}></div>
                      </div>
                      <div className="w-8 text-right font-bold text-slate-800">{goodCount}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-24 text-sm font-medium text-slate-500">Practice</div>
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden mx-3">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(practiceCount / session.questions.length) * 100}%` }}></div>
                      </div>
                      <div className="w-8 text-right font-bold text-slate-800">{practiceCount}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Analysis List */}
              <h3 className="text-xl font-bold text-slate-900 mb-4">Detailed Question Review</h3>
              <div className="space-y-4">
                {session.questions.map((q, i) => {
                  const ans = session.answers[q.id];
                  const isExpanded = expandedQuestionId === q.id;
                  
                  return (
                    <div key={q.id} className={`bg-white rounded-2xl border transition-all duration-200 ${isExpanded ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}>
                      <button 
                        onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                        className="w-full flex items-center justify-between p-6 text-left"
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                             ans?.analysis?.rating === 'Strong' ? 'bg-emerald-100 text-emerald-700' :
                             ans?.analysis?.rating === 'Good' ? 'bg-teal-100 text-teal-700' :
                             'bg-orange-100 text-orange-700'
                          }`}>
                            {i + 1}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-slate-800 truncate pr-4">{q.text}</h4>
                            {!isExpanded && <p className="text-xs text-slate-400 mt-1 truncate">Click to view analysis</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <span className={`hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase border ${getRatingColor(ans?.analysis?.rating)}`}>
                            {ans?.analysis?.rating || "Skipped"}
                          </span>
                          <ChevronRight className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} size={20} />
                        </div>
                      </button>

                      {isExpanded && ans?.analysis && (
                        <div className="px-6 pb-8 pt-2 border-t border-slate-50 animate-fade-in">
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                              {/* Left: Transcript & Audio */}
                              <div>
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your Answer</h5>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-600 text-sm leading-relaxed italic mb-4">
                                  "{ans.analysis.transcript}"
                                </div>
                                {/* Terms */}
                                <div className="flex flex-wrap gap-2 mt-4">
                                  {ans.analysis.keyTerms.map((term, idx) => (
                                    <span key={idx} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium border border-indigo-100">
                                      {term}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Right: Feedback */}
                              <div>
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Feedback & Coaching</h5>
                                <ul className="space-y-3">
                                  {ans.analysis.feedback.map((fb, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                      <span>{fb}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                           </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
         </div>
      </div>
    );
  }

  return null;
};

export default App;