import React, { useState } from 'react';
import { 
  TestDuration, 
  Difficulty, 
  Category, 
  Passage, 
  StudentProfile, 
  VALID_DURATIONS,
  SoundEffectType 
} from '../types';
import { soundEngine } from '../utils/audio';
import { 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  Play, 
  User, 
  FileText, 
  SlidersHorizontal,
  Lock,
  AlertTriangle,
  FileEdit,
  ArrowRight,
  Volume2,
  VolumeX,
  Gauge,
  PlusCircle,
  X
} from 'lucide-react';

interface StartScreenProps {
  passages: Passage[];
  selectedDuration: TestDuration;
  setSelectedDuration: (duration: TestDuration) => void;
  selectedDifficulty: Difficulty;
  setSelectedDifficulty: (difficulty: Difficulty) => void;
  selectedPassage: Passage;
  setSelectedPassage: (passage: Passage) => void;
  student: StudentProfile | null;
  targetWpm: number;
  setTargetWpm: (wpm: number) => void;
  soundType: SoundEffectType;
  setSoundType: (sound: SoundEffectType) => void;
  onAddCustomPassage: (title: string, text: string) => void;
  onOpenLogin: () => void;
  onStartTest: () => void;
  onOpenNotepad?: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  passages,
  selectedDuration,
  setSelectedDuration,
  selectedDifficulty,
  setSelectedDifficulty,
  selectedPassage,
  setSelectedPassage,
  student,
  targetWpm,
  setTargetWpm,
  soundType,
  setSoundType,
  onAddCustomPassage,
  onOpenLogin,
  onStartTest,
  onOpenNotepad,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customText, setCustomText] = useState('');

  // Filter passages
  const filteredPassages = passages.filter((p) => {
    const diffMatch = p.difficulty === selectedDifficulty;
    const catMatch = selectedCategory === 'All' || p.category === selectedCategory;
    return diffMatch && catMatch;
  });

  const handleDifficultyChange = (diff: Difficulty) => {
    setSelectedDifficulty(diff);
    const matching = passages.filter((p) => p.difficulty === diff);
    if (matching.length > 0) {
      setSelectedPassage(matching[0]);
    }
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    const matching = passages.filter(
      (p) => p.difficulty === selectedDifficulty && (cat === 'All' || p.category === cat)
    );
    if (matching.length > 0) {
      setSelectedPassage(matching[0]);
    }
  };

  const handleSoundPreview = (type: SoundEffectType) => {
    setSoundType(type);
    soundEngine.playKeypress(type, 0.6);
  };

  const handleSaveCustomPassage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customText.trim()) return;
    onAddCustomPassage(customTitle.trim(), customText.trim());
    setIsCustomModalOpen(false);
    setCustomTitle('');
    setCustomText('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Student Welcome & Profile Strip */}
      <div className="mb-8 bg-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-blue-300" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-blue-300 font-semibold">
              Candidate Examination Desk
            </div>
            {student ? (
              <div>
                <h3 className="text-xl font-bold font-heading text-white">
                  Welcome, <span className="text-blue-300">{student.name}</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Roll ID: <span className="font-mono font-bold text-white">{student.studentId}</span> · Official test records active
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold font-heading text-white">Candidate Not Logged In</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Type as Guest, or register your Roll Number to archive formal test certificates.
                </p>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onOpenLogin}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition whitespace-nowrap cursor-pointer"
        >
          {student ? 'Switch Candidate Profile' : 'Enter Student Roll ID'}
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Hero Header */}
        <div className="text-center pt-8 pb-6 px-6 border-b border-slate-100 bg-slate-50/50">
          <div className="text-xs font-semibold uppercase tracking-widest text-blue-700 mb-2 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            STRICT ZERO-BACKSPACE EXAMINATION SYSTEM
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-heading">
            Typing Speed Test
          </h1>
          <p className="text-base text-slate-600 font-medium mt-1">
            Improve Your Speed. Build Your Accuracy.
          </p>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          {/* 1. Duration Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Select Test Duration:
              </label>
              <span className="text-xs font-semibold text-rose-600">
                Minimum Duration: 10 Minutes
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {VALID_DURATIONS.map((dur) => {
                const isSelected = selectedDuration === dur;
                return (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setSelectedDuration(dur)}
                    className={`py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base transition-all flex flex-col items-center justify-center border-2 cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-2 ring-blue-600/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>[ {dur} MIN ]</span>
                    {dur === 10 && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-600 mt-0.5">
                        Standard Default
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              * Note: Per state and examination council regulations, test durations below 10 minutes are locked.
            </p>
          </div>

          {/* 2. Difficulty Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              Select Difficulty:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((diff) => {
                const isSelected = selectedDifficulty === diff;
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => handleDifficultyChange(diff)}
                    className={`py-3 px-4 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 border-2 cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-2 ring-blue-600/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>[ {diff} ]</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Passage Selection (Category & Passage + Custom) */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <label className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Examination Passage:
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="All">All Categories</option>
                    <option value="General">General</option>
                    <option value="Education">Education</option>
                    <option value="Business">Business</option>
                    <option value="Computer">Computer</option>
                    <option value="English">English</option>
                    <option value="Exam Practice">Exam Practice</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Paste Custom Text
                </button>
              </div>
            </div>

            <select
              value={selectedPassage.id}
              onChange={(e) => {
                const found = passages.find((p) => p.id === e.target.value);
                if (found) setSelectedPassage(found);
              }}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {filteredPassages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.difficulty} · {p.category} · ~{p.wordCount} words)
                </option>
              ))}
            </select>

            <p className="text-xs text-slate-500 mt-2 line-clamp-2 italic">
              Preview: "{selectedPassage.content.slice(0, 140)}..."
            </p>
          </div>

          {/* 4. Audio Feedback & Target Pacing Customization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Audio Feedback */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                <Volume2 className="w-4 h-4 text-blue-600" />
                Mechanical Keyboard Audio:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['mechanical', 'thock', 'typewriter', 'silent'] as SoundEffectType[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleSoundPreview(st)}
                    className={`py-2 px-1 text-xs rounded-xl font-bold capitalize transition border ${
                      soundType === st
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'silent' ? 'Mute' : st}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5">
                Click any switch to hear audio sample
              </div>
            </div>

            {/* Target Pacing WPM */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                <Gauge className="w-4 h-4 text-blue-600" />
                Target Exam Speed (Pacing Ghost):
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 30, 35, 40, 50].map((wpm) => (
                  <button
                    key={wpm}
                    type="button"
                    onClick={() => setTargetWpm(wpm)}
                    className={`py-2 px-1 text-xs rounded-xl font-bold transition border ${
                      targetWpm === wpm
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {wpm === 0 ? 'Off' : `${wpm}`}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5">
                35 WPM is standard qualifying threshold for Court/SSC exams
              </div>
            </div>
          </div>

          {/* 5. Test Rules Card */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-6">
            <h3 className="text-base font-bold text-blue-950 font-heading mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-700" />
              Official Examination Test Rules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-800">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Minimum test duration is 10 minutes</strong> (No tests below 10 min permitted)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Backspace is disabled</strong> (Cannot delete or edit typed characters)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Delete is disabled</strong> (Keystroke will trigger warning alert)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Copy/Paste & Cut are disabled</strong> (Anti-cheating locks active)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Type the displayed text accurately</strong> (Errors are marked in real time)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Timer starts on first keypress</strong> (WPM & accuracy calculated automatically)</span>
              </div>
            </div>
          </div>

          {/* Physical Keyboard Recommendation for Mobile/Tablet */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Hardware Recommendation:</span> For authentic examination practice and precise WPM calculation, please connect a physical desktop or laptop keyboard.
            </div>
          </div>

          {/* Feature Spotlight: Notepad Without Backspace */}
          {onOpenNotepad && (
            <div className="p-5 bg-gradient-to-r from-rose-50 via-pink-50 to-orange-50 rounded-2xl border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow shrink-0">
                  <FileEdit className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-full">
                      Free Practice
                    </span>
                    <span className="text-xs font-bold text-slate-800">Notepad Without Backspace</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Want to train your muscle memory or write essays freely without backspace? Use the No-Backspace Notepad.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenNotepad}
                className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 whitespace-nowrap self-end sm:self-auto cursor-pointer"
              >
                Open Notepad
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 6. Start Test Button */}
          <div className="pt-2">
            <button
              onClick={onStartTest}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl font-extrabold text-lg sm:text-xl shadow-lg hover:shadow-xl transition-all transform active:scale-[0.99] flex items-center justify-center gap-3 uppercase tracking-wider font-heading cursor-pointer"
            >
              <Play className="w-6 h-6 fill-current" />
              START TEST
            </button>
            <p className="text-center text-xs text-slate-500 mt-3">
              Pressing "START TEST" will prepare the examination console. The {selectedDuration}-minute countdown will begin when you press your first key.
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Paste Custom Text */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-heading text-slate-900">
                Paste Custom Examination Text
              </h3>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomPassage} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Passage Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SSC CGL Practice Passage 2026"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Passage Content Text
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Paste your examination passage text here..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Load Passage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
