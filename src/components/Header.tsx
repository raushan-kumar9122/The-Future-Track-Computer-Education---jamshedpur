import React from 'react';
import { StudentProfile } from '../types';
import { 
  Keyboard, 
  User, 
  History, 
  ShieldAlert, 
  BookOpen, 
  LogOut, 
  FileEdit,
  CheckCircle2, 
  Award
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'test' | 'notepad' | 'passages' | 'history' | 'admin';
  setCurrentTab: (tab: 'test' | 'notepad' | 'passages' | 'history' | 'admin') => void;
  student: StudentProfile | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  isTestActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  student,
  onOpenLogin,
  onLogout,
  isTestActive,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-inner font-bold text-xl">
              <Keyboard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  Examination System
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">Govt. / Academic Standard</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                THE FUTURE TRACK <span className="text-blue-400 font-semibold">TYPING TEST</span>
              </h1>
            </div>
          </div>

          {/* Navigation Links (Disabled during active exam to prevent accidental loss) */}
          {!isTestActive ? (
            <nav className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => setCurrentTab('test')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  currentTab === 'test'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Keyboard className="w-4 h-4" />
                Typing Test
              </button>
              <button
                onClick={() => setCurrentTab('notepad')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  currentTab === 'notepad'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileEdit className="w-4 h-4 text-rose-400" />
                No-Backspace Notepad
              </button>
              <button
                onClick={() => setCurrentTab('passages')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  currentTab === 'passages'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Passages
              </button>
              <button
                onClick={() => setCurrentTab('history')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  currentTab === 'history'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <History className="w-4 h-4" />
                My History
              </button>
              <button
                onClick={() => setCurrentTab('admin')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  currentTab === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                Admin Panel
              </button>
            </nav>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              EXAMINATION IN PROGRESS — NAVIGATION LOCKED
            </div>
          )}

          {/* Student Status & Auth */}
          <div className="flex items-center gap-2.5">
            {student ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-slate-400">Student Roll / ID</div>
                  <div className="text-sm font-semibold text-blue-300">{student.name} ({student.studentId})</div>
                </div>
                {!isTestActive && (
                  <button
                    onClick={onLogout}
                    title="Change Student"
                    className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              !isTestActive && (
                <button
                  onClick={onOpenLogin}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm font-medium border border-slate-700 flex items-center gap-2 transition"
                >
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline">Student Login</span>
                  <span className="sm:hidden">Login</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
