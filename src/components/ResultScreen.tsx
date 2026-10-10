import React, { useState } from 'react';
import { TestResult, StudentProfile } from '../types';
import { SpeedAnalyticsChart } from './SpeedAnalyticsChart';
import { OfficialCertificateModal } from './OfficialCertificateModal';
import { 
  Award, 
  RotateCcw, 
  ListFilter, 
  History, 
  Printer, 
  CheckCircle2, 
  Zap, 
  Target, 
  XCircle, 
  Clock, 
  ShieldCheck,
  FileCheck,
  Activity,
  Keyboard,
  ExternalLink,
  Percent
} from 'lucide-react';

interface ResultScreenProps {
  result: TestResult;
  student: StudentProfile | null;
  onRetry: () => void;
  onChooseAnother: () => void;
  onViewHistory: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  student,
  onRetry,
  onChooseAnother,
  onViewHistory,
}) => {
  const [showCertificate, setShowCertificate] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  // Split performance feedback into title and message
  const [feedbackTitle, feedbackMessage] = result.performanceFeedback.includes(':')
    ? result.performanceFeedback.split(': ')
    : ['Test Evaluation', result.performanceFeedback];

  // Weak key mistakes sorted by frequency
  const sortedMistakes = result.keyMistakes
    ? Object.entries(result.keyMistakes)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
    : [];

  // Government / Court exam qualification threshold check
  const isGovtQualified = result.netWpm >= 35 && result.accuracy >= 90;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Print-Only Header */}
      <div className="hidden print-only text-center mb-8 border-b-2 border-slate-900 pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">
          The Future Track Typing Examination System
        </h1>
        <p className="text-xs text-slate-600">
          Official Candidate Typing Evaluation & Competency Scorecard
        </p>
      </div>

      {/* Main Scorecard Card */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-8 text-white text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold mb-3 uppercase tracking-widest">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Official Evaluation Completed
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight">
            TEST COMPLETED
          </h1>
          <p className="text-sm sm:text-base text-blue-200 mt-1 max-w-lg mx-auto">
            Your typing speed and typographical metrics have been evaluated under zero-backspace proctoring.
          </p>
        </div>

        {/* Candidate Info Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
          <div>
            <span className="text-slate-500 font-medium">Candidate:</span>{' '}
            <strong className="text-slate-900 font-bold">{result.studentName}</strong>
            <span className="text-slate-400 ml-1 font-mono">({result.studentId})</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Passage:</span>{' '}
            <strong className="text-slate-800">{result.passageTitle}</strong>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Date & Time:</span>{' '}
            <span className="text-slate-700 font-medium">
              {new Date(result.completedAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="p-6 sm:p-10 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                Your Examination Scorecard
              </h3>

              {/* Certificate Trigger Button */}
              <button
                onClick={() => setShowCertificate(true)}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 no-print cursor-pointer"
              >
                <Award className="w-4 h-4" />
                View Official Certificate
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Gross WPM */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                <div className="text-xs font-semibold text-slate-500 uppercase">Gross WPM</div>
                <div className="text-3xl font-black text-slate-900 font-mono mt-1">
                  {result.grossWpm}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Raw Keystroke Velocity</div>
              </div>

              {/* Net WPM */}
              <div className="bg-blue-50/70 border-2 border-blue-600 rounded-2xl p-4 text-center shadow-sm">
                <div className="text-xs font-bold text-blue-800 uppercase flex items-center justify-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  Net WPM
                </div>
                <div className="text-4xl font-black text-blue-700 font-mono mt-1">
                  {result.netWpm}
                </div>
                <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
                  Official Qualifying Speed
                </div>
              </div>

              {/* Accuracy */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
                  <Target className="w-3.5 h-3.5 text-emerald-600" />
                  Accuracy
                </div>
                <div className={`text-3xl font-black font-mono mt-1 ${
                  result.accuracy >= 90 ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {result.accuracy}%
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Typographical Precision</div>
              </div>

              {/* Errors */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  Errors
                </div>
                <div className="text-3xl font-black text-rose-600 font-mono mt-1">
                  {result.errorCharacters}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Penalized Mistakes</div>
              </div>

              {/* Characters Typed */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                <div className="text-xs font-semibold text-slate-500 uppercase">Characters Typed</div>
                <div className="text-2xl font-black text-slate-800 font-mono mt-1">
                  {result.totalCharactersTyped.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {result.correctCharacters} correct keystrokes
                </div>
              </div>

              {/* Consistency */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  Consistency
                </div>
                <div className="text-2xl font-black text-slate-800 font-mono mt-1">
                  {result.consistency || 88}%
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Cadence Stability</div>
              </div>

              {/* Backspace Attempts */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                <div className="text-xs font-semibold text-slate-500 uppercase">
                  Backspace Attempts
                </div>
                <div className={`text-2xl font-black font-mono mt-1 ${
                  result.backspaceAttempts > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {result.backspaceAttempts}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Zero-Tolerance Blocked</div>
              </div>

              {/* Test Duration */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Duration
                </div>
                <div className="text-2xl font-black text-slate-800 font-mono mt-1">
                  {result.durationMinutes} Min
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Standard Proctored Exam</div>
              </div>
            </div>
          </div>

          {/* Speed Velocity Graph */}
          {result.timeline && result.timeline.length > 1 && (
            <SpeedAnalyticsChart
              timeline={result.timeline}
              grossWpm={result.grossWpm}
              netWpm={result.netWpm}
              totalErrors={result.errorCharacters}
            />
          )}

          {/* Key Mistake Diagnostic Heatmap */}
          {sortedMistakes.length > 0 && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Keyboard className="w-4 h-4 text-rose-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Key Mistake Diagnostic (Weak Finger Analysis)
                </h4>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Characters where your fingers experienced typographical friction during the exam:
              </p>
              <div className="flex flex-wrap gap-2">
                {sortedMistakes.map(([char, count]) => {
                  const displayChar = char === ' ' ? 'Spacebar (␣)' : char === '\n' ? 'Enter (↵)' : char;
                  return (
                    <div
                      key={char}
                      className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 shadow-xs flex items-center gap-2 text-xs"
                    >
                      <span className="font-mono font-bold text-slate-900 bg-rose-50 px-1.5 py-0.5 rounded text-rose-700">
                        {displayChar}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {count} {count === 1 ? 'error' : 'errors'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Neutral Performance Assessment Message */}
          <div className="bg-blue-50/60 border border-blue-200/90 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-blue-950 font-heading mb-1 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-700" />
                {feedbackTitle}
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed font-sans">
                {feedbackMessage}
              </p>
            </div>

            {/* Standard qualification indicator */}
            <div className="bg-white px-4 py-3 rounded-xl border border-blue-200 shadow-xs shrink-0 text-center sm:text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Institutional Benchmark</div>
              <div className={`text-sm font-bold mt-0.5 ${isGovtQualified ? 'text-emerald-600' : 'text-slate-700'}`}>
                {isGovtQualified ? '✓ Meets Qualifying Threshold' : 'Practice Target: 35+ WPM'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 no-print">
            <button
              onClick={onRetry}
              className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <RotateCcw className="w-4 h-4" />
              RETRY TEST
            </button>

            <button
              onClick={onChooseAnother}
              className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <ListFilter className="w-4 h-4" />
              CHOOSE ANOTHER TEST
            </button>

            <button
              onClick={() => setShowCertificate(true)}
              className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Award className="w-4 h-4" />
              OFFICIAL CERTIFICATE
            </button>

            <button
              onClick={onViewHistory}
              className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <History className="w-4 h-4 text-blue-600" />
              HISTORY
            </button>

            <button
              onClick={handlePrint}
              className="w-full sm:w-auto py-3.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
              title="Print examination scorecard"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Official Certificate Modal */}
      <OfficialCertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        result={result}
        student={student}
      />
    </div>
  );
};
