import React, { useState } from 'react';
import { QUIZ_QUESTIONS } from '../data/quizQuestions';
import { QuizQuestion, ProcessType, LoopParameters } from '../types';
import {
  HelpCircle,
  X,
  CheckCircle2,
  XCircle,
  Play,
  Award,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
} from 'lucide-react';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPreset: (config: {
    process: ProcessType;
    kc: number;
    invTi: number;
    tau1: number;
    tauD: number;
    sp: number;
    load: number;
  }) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  onLoadPreset,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState(false);

  if (!isOpen) return null;

  const currentQ = QUIZ_QUESTIONS[currentIdx];
  const userSelected = selectedAnswers[currentQ.id];
  const isAnswered = userSelected !== undefined;
  const isCorrect = isAnswered && userSelected === currentQ.correctIndex;

  const handleSelect = (optIdx: number) => {
    if (isAnswered) return; // Locked once answered
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optIdx,
    }));
  };

  const handleNext = () => {
    if (currentIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setCurrentIdx(0);
    setShowResults(false);
  };

  // Calculate score
  const totalAnswered = Object.keys(selectedAnswers).length;
  const correctCount = Object.entries(selectedAnswers).filter(
    ([id, ans]) => QUIZ_QUESTIONS.find((q) => q.id === parseInt(id))?.correctIndex === ans
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-850 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="text-amber-400" size={18} />
            <h2 className="font-bold text-slate-100 text-sm tracking-wide">
              NWP Closed Loop Control Quiz Prep (Part A)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-slate-200">
          {showResults ? (
            <div className="text-center py-6 space-y-4">
              <Award className="mx-auto text-amber-400" size={48} />
              <h3 className="text-xl font-bold text-slate-100">Quiz Completed!</h3>
              <p className="text-slate-300 text-sm">
                You scored <span className="font-bold text-amber-400">{correctCount}</span> out of{' '}
                <span className="font-bold">{QUIZ_QUESTIONS.length}</span> (
                {Math.round((correctCount / QUIZ_QUESTIONS.length) * 100)}%)
              </p>

              <div className="max-w-md mx-auto bg-slate-800/60 p-4 rounded-lg border border-slate-700 text-xs text-left space-y-2">
                <div className="font-semibold text-slate-300">Exam Readiness Summary:</div>
                <p className="text-slate-400">
                  {correctCount >= 8
                    ? 'Excellent command of Barkhausen criteria, offset math, transfer functions, and lag dynamics!'
                    : 'Review Objectives 1 through 5 using the 3D visual simulator to reinforce how phase shift and gains interact.'}
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  <RotateCcw size={14} />
                  <span>Retry Quiz</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
                >
                  Return to Simulator
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Question Meta & Progress */}
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span className="font-semibold text-cyan-400">{currentQ.objective}</span>
                <span>
                  Question {currentIdx + 1} of {QUIZ_QUESTIONS.length}
                </span>
              </div>

              {/* Question Text */}
              <div className="text-sm font-semibold text-slate-100 leading-relaxed">
                {currentQ.question}
              </div>

              {/* Options */}
              <div className="space-y-2 pt-1">
                {currentQ.options.map((opt, oIdx) => {
                  let optStyle = 'bg-slate-800/70 border-slate-700 hover:bg-slate-800 text-slate-300';
                  if (isAnswered) {
                    if (oIdx === currentQ.correctIndex) {
                      optStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200';
                    } else if (oIdx === userSelected) {
                      optStyle = 'bg-rose-950/60 border-rose-500 text-rose-200';
                    } else {
                      optStyle = 'bg-slate-850/40 border-slate-800 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelect(oIdx)}
                      disabled={isAnswered}
                      className={`w-full text-left p-3 rounded-lg border text-xs leading-snug flex items-start gap-2.5 transition ${optStyle}`}
                    >
                      <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border-slate-600">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isAnswered && oIdx === currentQ.correctIndex && (
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      {isAnswered && oIdx === userSelected && oIdx !== currentQ.correctIndex && (
                        <XCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Simulate in 3D Button */}
              {isAnswered && (
                <div
                  className={`p-3.5 rounded-lg border text-xs space-y-2.5 ${
                    isCorrect
                      ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    <span>{isCorrect ? 'Correct!' : 'Incorrect'}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {currentQ.explanation}
                  </p>

                  {/* Simulate this concept in 3D */}
                  {currentQ.presetConfig && (
                    <button
                      onClick={() => {
                        onLoadPreset(currentQ.presetConfig!);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-sm"
                    >
                      <Play size={12} />
                      <span>Simulate this concept in 3D</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Navigation */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-t border-slate-800 text-xs">
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0 || showResults}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 font-semibold transition"
          >
            <ChevronLeft size={14} />
            <span>Previous</span>
          </button>

          <div className="text-[11px] text-slate-400">
            {totalAnswered} of {QUIZ_QUESTIONS.length} Answered
          </div>

          <button
            onClick={handleNext}
            disabled={!isAnswered && !showResults}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold transition"
          >
            <span>{currentIdx === QUIZ_QUESTIONS.length - 1 ? 'View Results' : 'Next'}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
