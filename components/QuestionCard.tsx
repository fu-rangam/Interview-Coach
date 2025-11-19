import React from 'react';

interface QuestionCardProps {
  question: string;
  role: string;
  currentIndex: number;
  total: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, role, currentIndex, total }) => {
  return (
    <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-md border border-slate-100 mb-8 ring-1 ring-slate-900/5">
      <div className="flex items-center space-x-2 mb-4">
         <span className="px-3 py-1 bg-violet-50 text-violet-700 text-xs font-bold rounded-md uppercase tracking-wider">
            {role}
         </span>
         <span className="text-slate-400 text-sm font-medium">Question {currentIndex + 1} of {total}</span>
      </div>
      <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 leading-snug">
        {question}
      </h2>
    </div>
  );
};

export default QuestionCard;