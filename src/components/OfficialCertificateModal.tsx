import React from 'react';
import { TestResult, StudentProfile } from '../types';
import { Award, Printer, X, CheckCircle2, ShieldCheck, Download } from 'lucide-react';

interface OfficialCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TestResult;
  student: StudentProfile | null;
}

export const OfficialCertificateModal: React.FC<OfficialCertificateModalProps> = ({
  isOpen,
  onClose,
  result,
  student,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const verificationId = result.verificationCode || `FT-${Date.now().toString(36).toUpperCase()}-${result.netWpm}WPM`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Top Controls Bar (hidden during print) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm tracking-wide">
              Official Examination Competency Certificate
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Body */}
        <div className="p-8 sm:p-12 bg-[#fffdf9] border-8 border-double border-amber-900/30 m-4 sm:m-6 rounded-2xl relative shadow-inner text-slate-900 font-serif">
          {/* Subtle Corner Accents */}
          <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-800"></div>
          <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-800"></div>
          <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-800"></div>
          <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-800"></div>

          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-amber-900 border-2 border-amber-400/80 mb-2">
              <Award className="w-8 h-8 text-amber-700" />
            </div>
            <div className="text-xs uppercase font-sans font-bold tracking-widest text-amber-900/80">
              Department of Technical Keyboard Proficiency & Examination
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-slate-900 font-heading">
              Certificate of Competency
            </h1>
            <p className="text-xs font-sans text-slate-600 max-w-md mx-auto">
              This is to certify that the candidate whose particulars appear below has successfully completed
              an authenticated computer typing speed and accuracy assessment under zero-backspace proctoring.
            </p>
          </div>

          {/* Candidate Name Banner */}
          <div className="text-center my-6 py-4 border-y border-amber-800/20 bg-amber-50/40">
            <div className="text-xs font-sans text-slate-500 uppercase tracking-widest">
              Awarded to Candidate
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-heading text-blue-950 mt-1">
              {result.studentName}
            </div>
            <div className="text-xs font-sans font-mono text-slate-600 mt-1">
              Roll / Registration ID: <strong>{result.studentId}</strong>
            </div>
          </div>

          {/* Examination Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 font-sans text-center">
            <div className="p-3 bg-white border border-amber-200 rounded-xl shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">Official Net WPM</div>
              <div className="text-2xl font-black font-mono text-blue-700">{result.netWpm}</div>
              <div className="text-[10px] text-slate-400">Words Per Minute</div>
            </div>

            <div className="p-3 bg-white border border-amber-200 rounded-xl shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">Gross Velocity</div>
              <div className="text-2xl font-black font-mono text-slate-800">{result.grossWpm}</div>
              <div className="text-[10px] text-slate-400">Raw Key Throughput</div>
            </div>

            <div className="p-3 bg-white border border-amber-200 rounded-xl shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">Accuracy Rate</div>
              <div className="text-2xl font-black font-mono text-emerald-600">{result.accuracy}%</div>
              <div className="text-[10px] text-slate-400">Typographical Precision</div>
            </div>

            <div className="p-3 bg-white border border-amber-200 rounded-xl shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">Test Duration</div>
              <div className="text-2xl font-black font-mono text-slate-800">{result.durationMinutes}m</div>
              <div className="text-[10px] text-slate-400">Continuous Assessment</div>
            </div>
          </div>

          {/* Test Conditions Verification Statement */}
          <div className="my-6 p-4 bg-white/70 border border-slate-200 rounded-xl font-sans text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Proctored Environment Verification
            </div>
            <p>
              • Conducted under mandatory zero-backspace constraints (Backspace attempts blocked: {result.backspaceAttempts}).
            </p>
            <p>
              • Script: "{result.passageTitle}" · Difficulty: {result.difficulty} · Category: {result.category}.
            </p>
          </div>

          {/* Signatures & Security Stamp */}
          <div className="pt-8 mt-6 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-6 font-sans text-xs">
            <div className="text-center sm:text-left">
              <div className="font-mono text-[10px] text-slate-400">SECURITY VERIFICATION HASH</div>
              <div className="font-mono font-bold text-slate-800 tracking-wider">{verificationId}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Issue Date: {new Date(result.completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="w-28 border-b border-slate-500 pb-1 mb-1 font-cursive text-sm text-slate-700">
                  A. Sharma
                </div>
                <div className="text-[10px] uppercase text-slate-500">Chief Examiner</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-600 flex flex-col items-center justify-center text-[8px] font-bold text-amber-800 uppercase leading-tight">
                  <span>Official</span>
                  <span>Board</span>
                  <span>Seal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
