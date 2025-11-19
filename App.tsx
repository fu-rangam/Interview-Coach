import React, { useState, useEffect, useRef } from 'react';
import { AppScreen, JOB_ROLES, InterviewSession, AnalysisResult, Question } from './types';
import { generateQuestions, analyzeAnswer } from './services/geminiService';
import { Mic, Square, ChevronRight, RefreshCw, Home, Award, Briefcase, CheckCircle2, MessageSquare } from './components/Icons';
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

  // --- Navigation Handlers ---
  
  const startSetup = () => setScreen(AppScreen.ROLE_SELECTION);

  const selectRole = async (role: string) => {
    setProcessingState({ isActive: true, text: 'Generating interview questions...' });
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
    switch(rating) {
      case 'Strong': return 'bg-emerald-100 text-emerald-700';
      case 'Good': return 'bg-blue-100 text-blue-700';
      default: return 'bg-rose-100 text-rose-700'; // Needs Practice
    }
  };

  const getRatingTextClass = (rating?: string) => {
    switch(rating) {
      case 'Strong': return 'text-emerald-600';
      case 'Good': return 'text-blue-600';
      default: return 'text-rose-600';
    }
  };

  // --- Render Functions ---

  if (screen === AppScreen.HOME) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
        <div className="max-w-3xl text-center z-10">
          <div className="inline-flex items-center justify-center p-5 bg-white rounded-2xl mb-8 shadow-md shadow-violet-100 ring-1 ring-violet-50">
            <Briefcase className="w-12 h-12 text-violet-600" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight">
            AI Interview Coach
          </h1>
          <p className="text-xl text-slate-600 mb-12 max-w-xl mx-auto leading-relaxed">
            Master your interview skills with real-time AI feedback. Practice key questions, refine your answers, and build confidence.
          </p>
          <button 
            onClick={startSetup}
            className="px-10 py-4 bg-violet-600 hover:bg-violet-700 text-white text-xl font-medium rounded-full transition-all transform hover:scale-105 shadow-lg shadow-violet-200"
          >
            Start Practicing
          </button>
        </div>
        
        {/* Decorative background elements - Updated colors */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-violet-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-fuchsia-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse" style={{animationDelay: '1s'}}></div>
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
                      className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-violet-500 hover:shadow-violet-100 hover:shadow-md transition-all text-left group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative z-10">
                        <h3 className="text-lg font-semibold text-slate-800 group-hover:text-violet-700 mb-1 transition-colors">{role}</h3>
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
                      className="w-20 h-20 bg-violet-600 hover:bg-violet-700 text-white rounded-full flex items-center justify-center shadow-xl transition-all transform hover:scale-110 focus:outline-none ring-4 ring-violet-100 active:scale-95"
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

    return (
      <div className="flex flex-col md:flex-row h-full w-full bg-white overflow-hidden">
        {/* Left Panel: Question & Transcript */}
        <div className="w-full md:w-1/2 h-full overflow-y-auto border-r border-slate-100 bg-white">
          <div className="p-6 md:p-12 max-w-xl mx-auto pb-24">
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
            
            <div className="flex gap-4 mt-8 pt-8 border-t border-slate-100">
              <button onClick={handleRedo} className="px-6 py-3 rounded-full border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 flex items-center gap-2 transition-colors">
                <RefreshCw size={18} /> Retry
              </button>
              <button onClick={handleNextQuestion} className="px-8 py-3 rounded-full bg-violet-600 text-white font-medium hover:bg-violet-700 shadow-lg shadow-violet-200 flex items-center gap-2 ml-auto transition-all hover:translate-x-1">
                Next Question <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Insights */}
        <div className="w-full md:w-1/2 h-full overflow-y-auto bg-slate-50/80">
          <div className="p-6 md:p-12 max-w-xl mx-auto pb-24">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-2xl font-bold text-slate-800">AI Insights</h3>
               <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${getRatingColor(answer?.analysis?.rating)}`}>
                 {answer?.analysis?.rating} Match
               </span>
            </div>

            <div className="space-y-6">
              {/* Key Terms Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
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
    return (
      <div className="flex flex-col h-full w-full bg-white">
         <div className="flex-1 overflow-y-auto">
            <div className="w-full max-w-4xl mx-auto p-8 pb-24 flex flex-col items-center">
              <div className="text-center mb-12 mt-8">
                <div className="inline-flex p-6 bg-emerald-50 rounded-full text-emerald-600 mb-6 ring-1 ring-emerald-100">
                  <Award size={48} />
                </div>
                <h2 className="text-4xl font-bold mb-4 text-slate-900">Session Completed!</h2>
                <p className="text-xl text-slate-500">Here is a summary of your practice session for <span className="font-semibold text-slate-700">{session.role}</span>.</p>
              </div>

              <div className="grid gap-6 mb-12 w-full">
                {session.questions.map((q, i) => (
                  <div key={q.id} className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-violet-200 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question {i + 1}</span>
                      <span className={`text-xs font-bold uppercase ${getRatingTextClass(session.answers[q.id]?.analysis?.rating)}`}>
                        {session.answers[q.id]?.analysis?.rating}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 group-hover:text-violet-700 transition-colors">{q.text}</h3>
                    <div className="text-slate-600 text-sm bg-white p-4 rounded-xl border border-slate-100 italic">
                      "{session.answers[q.id]?.analysis?.transcript || "No answer recorded."}"
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <button onClick={restartApp} className="flex-1 px-8 py-4 rounded-full border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                  Back to Home
                </button>
                <button onClick={() => startSetup()} className="flex-1 px-8 py-4 rounded-full bg-violet-600 text-white font-medium hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all">
                  Practice Another
                </button>
              </div>
            </div>
         </div>
      </div>
    );
  }

  return null;
};

export default App;