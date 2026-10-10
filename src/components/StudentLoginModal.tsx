import React, { useState } from 'react';
import { StudentProfile } from '../types';
import { setCurrentStudent } from '../utils/storage';
import { User, X, Check, ShieldCheck, Sparkles } from 'lucide-react';

interface StudentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudent: StudentProfile | null;
  onStudentUpdated: (student: StudentProfile | null) => void;
}

export const StudentLoginModal: React.FC<StudentLoginModalProps> = ({
  isOpen,
  onClose,
  currentStudent,
  onStudentUpdated,
}) => {
  const [name, setName] = useState(currentStudent?.name || '');
  const [studentId, setStudentId] = useState(currentStudent?.studentId || '');
  const [mobile, setMobile] = useState(currentStudent?.mobile || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter student name.');
      return;
    }
    if (!studentId.trim()) {
      setError('Please enter student examination ID / Roll number.');
      return;
    }

    const profile: StudentProfile = {
      id: currentStudent?.id || `stu_${Date.now()}`,
      name: name.trim(),
      studentId: studentId.trim().toUpperCase(),
      mobile: mobile.trim() || 'N/A',
      registeredAt: currentStudent?.registeredAt || new Date().toISOString(),
    };

    setCurrentStudent(profile);
    onStudentUpdated(profile);
    onClose();
  };

  const handleQuickDemoFill = () => {
    setName('Aarav Sharma');
    setStudentId('JTT-2026-084');
    setMobile('+91 98765 43210');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/50 border border-blue-400/40 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading">Student Registration</h2>
              <p className="text-xs text-blue-200">Official Computer Typing Examination Desk</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Student Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Aarav Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Student ID / Roll Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. JTT-2026-084"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mobile Number (Optional)
            </label>
            <input
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Save & Proceed to Examination
            </button>

            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Quick Fill Sample Student Details
            </button>
          </div>

          <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Scores & metrics will be recorded under this Roll ID</span>
          </div>
        </form>
      </div>
    </div>
  );
};
