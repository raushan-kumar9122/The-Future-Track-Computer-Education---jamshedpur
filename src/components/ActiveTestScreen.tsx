import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Passage, 
  TestDuration, 
  StudentProfile, 
  TestResult, 
  AdminSettings,
  SoundEffectType,
  DisplayTheme,
  DisplayFontSize,
  WpmTimelinePoint
} from '../types';
import { getPerformanceFeedback } from '../utils/storage';
import { soundEngine } from '../utils/audio';
import { VirtualKeyboard } from './VirtualKeyboard';
import { 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Zap, 
  Target, 
  XCircle, 
  Keyboard, 
  StopCircle,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Sparkles,
  Gauge
} from 'lucide-react';

interface ActiveTestScreenProps {
  passage: Passage;
  passagesList: Passage[];
  durationMinutes: TestDuration;
  student: StudentProfile | null;
  adminSettings: AdminSettings;
  targetWpm?: number;
  initialSound?: SoundEffectType;
  onFinishTest: (result: TestResult) => void;
  onCancelTest: () => void;
}

interface TypedCharRecord {
  expected: string;
  typed: string;
  isCorrect: boolean;
}

export const ActiveTestScreen: React.FC<ActiveTestScreenProps> = ({
  passage,
  passagesList,
  durationMinutes,
  student,
  adminSettings,
  targetWpm = 0,
  initialSound = 'mechanical',
  onFinishTest,
  onCancelTest,
}) => {
  // Combine passages so candidate never runs out of text over 10-60 min
  const initialText = React.useMemo(() => {
    let combined = passage.content.trim().replace(/\r\n/g, '\n');
    const wordCount = combined.split(/\s+/).length;
    if (wordCount < 1800) {
      const morePassages = passagesList.filter((p) => p.id !== passage.id);
      for (const extra of morePassages) {
        combined += '\n\n' + extra.content.trim().replace(/\r\n/g, '\n');
        if (combined.split(/\s+/).length > 3200) break;
      }
    }
    return combined;
  }, [passage, passagesList]);

  // Test state
  const [hasStarted, setHasStarted] = useState(false);
  const [typedHistory, setTypedHistory] = useState<TypedCharRecord[]>([]);
  const [backspaceAttempts, setBackspaceAttempts] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [keyMistakes, setKeyMistakes] = useState<Record<string, number>>({});
  const [timeline, setTimeline] = useState<WpmTimelinePoint[]>([]);

  // Sound & Visual Options
  const [soundType, setSoundType] = useState<SoundEffectType>(initialSound);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [displayTheme, setDisplayTheme] = useState<DisplayTheme>('academic');
  const [fontSize, setFontSize] = useState<DisplayFontSize>('normal');
  const [lastKeyStatus, setLastKeyStatus] = useState<{ key: string; isCorrect: boolean } | null>(null);

  // Real-time timer state
  const totalSeconds = durationMinutes * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Warnings
  const [showBackspaceWarning, setShowBackspaceWarning] = useState(false);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Refs
  const startTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const activeCharRef = useRef<HTMLSpanElement | null>(null);
  const passageContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const backspaceTimerRef = useRef<number | null>(null);
  const tabWarningTimerRef = useRef<number | null>(null);

  // Live Stats
  const totalCharsTyped = typedHistory.length;
  const correctChars = typedHistory.filter((c) => c.isCorrect).length;
  const errorChars = totalCharsTyped - correctChars;
  const elapsedMinutes = Math.max(elapsedSeconds / 60, 0.0167);
  const grossWpm = elapsedSeconds > 0 ? Math.round((totalCharsTyped / 5) / elapsedMinutes) : 0;
  const netWpm = elapsedSeconds > 0 ? Math.max(0, Math.round(((totalCharsTyped / 5) - errorChars) / elapsedMinutes)) : 0;
  const accuracy = totalCharsTyped > 0 ? Math.max(0, Math.min(100, Math.round((correctChars / totalCharsTyped) * 100))) : 100;

  // Finalize test and generate comprehensive scorecard
  const handleCompleteTest = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    const actualSeconds = Math.max(1, elapsedSeconds);
    const actualMinutes = actualSeconds / 60;
    const finalGrossWpm = Math.round((totalCharsTyped / 5) / actualMinutes);
    const finalNetWpm = Math.max(0, Math.round(((totalCharsTyped / 5) - errorChars) / actualMinutes));
    const finalAccuracy = totalCharsTyped > 0 ? Math.max(0, Math.min(100, Math.round((correctChars / totalCharsTyped) * 100))) : 100;

    // Consistency score (inverse variance of WPM over timeline)
    let consistency = 88;
    if (timeline.length > 5) {
      const avg = finalNetWpm || 1;
      const variances = timeline.map((p) => Math.abs(p.netWpm - avg) / avg);
      const meanVariance = variances.reduce((a, b) => a + b, 0) / variances.length;
      consistency = Math.max(40, Math.min(99, Math.round((1 - meanVariance * 0.5) * 100)));
    }

    const feedback = getPerformanceFeedback(finalNetWpm, finalAccuracy);
    const verificationCode = `FT-${Date.now().toString(36).toUpperCase()}-${finalNetWpm}WPM`;

    const result: TestResult = {
      id: `res_${Date.now()}`,
      studentId: student?.studentId || 'GUEST',
      studentName: student?.name || 'Guest Candidate',
      passageId: passage.id,
      passageTitle: passage.title,
      durationMinutes,
      actualElapsedSeconds: actualSeconds,
      grossWpm: finalGrossWpm,
      netWpm: finalNetWpm,
      accuracy: finalAccuracy,
      totalCharactersTyped: totalCharsTyped,
      correctCharacters: correctChars,
      errorCharacters: errorChars,
      backspaceAttempts,
      tabSwitchCount,
      difficulty: passage.difficulty,
      category: passage.category,
      completedAt: new Date().toISOString(),
      performanceFeedback: `${feedback.title}: ${feedback.message}`,
      timeline,
      keyMistakes,
      consistency,
      verificationCode,
    };

    onFinishTest(result);
  }, [
    elapsedSeconds,
    totalCharsTyped,
    errorChars,
    correctChars,
    durationMinutes,
    student,
    passage,
    backspaceAttempts,
    tabSwitchCount,
    timeline,
    keyMistakes,
    onFinishTest,
  ]);

  // Main countdown timer & timeline sampler (records point every 2s)
  useEffect(() => {
    if (!hasStarted) return;

    let lastSampleSecond = 0;

    timerIntervalRef.current = window.setInterval(() => {
      if (!startTimeRef.current) return;
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);

      setElapsedSeconds(elapsed);
      setRemainingSeconds(remaining);

      // Sample timeline point every 2 seconds for smooth analytics chart
      if (elapsed > lastSampleSecond + 2) {
        lastSampleSecond = elapsed;
        const eMins = Math.max(elapsed / 60, 0.0167);
        const curGross = Math.round((totalCharsTyped / 5) / eMins);
        const curNet = Math.max(0, Math.round(((totalCharsTyped / 5) - errorChars) / eMins));

        setTimeline((prev) => [
          ...prev,
          {
            second: elapsed,
            grossWpm: curGross,
            netWpm: curNet,
            errors: errorChars,
          },
        ]);
      }

      if (remaining <= 0) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        handleCompleteTest();
      }
    }, 250);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [hasStarted, totalSeconds, totalCharsTyped, errorChars, handleCompleteTest]);

  // Auto-scroll active character into focus
  useEffect(() => {
    if (activeCharRef.current && passageContainerRef.current) {
      const container = passageContainerRef.current;
      const activeEl = activeCharRef.current;
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();

      if (activeRect.bottom > containerRect.bottom - 45 || activeRect.top < containerRect.top + 45) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [typedHistory.length]);

  // Ensure textarea remains focused
  useEffect(() => {
    inputRef.current?.focus();
    const handleGlobalClick = () => {
      inputRef.current?.focus();
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Anti-cheating & Window Blur Watchdog
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasStarted) {
        setTabSwitchCount((prev) => prev + 1);
        setShowTabWarning(true);
        soundEngine.playWarning();
        if (tabWarningTimerRef.current) clearTimeout(tabWarningTimerRef.current);
        tabWarningTimerRef.current = window.setTimeout(() => setShowTabWarning(false), 5000);
      }
    };

    const handleWindowBlur = () => {
      if (hasStarted) {
        setTabSwitchCount((prev) => prev + 1);
        setShowTabWarning(true);
        soundEngine.playWarning();
        if (tabWarningTimerRef.current) clearTimeout(tabWarningTimerRef.current);
        tabWarningTimerRef.current = window.setTimeout(() => setShowTabWarning(false), 5000);
      }
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopyPaste = (e: ClipboardEvent) => e.preventDefault();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
    };
  }, [hasStarted]);

  // Keyboard Handler with Strict Backspace & Delete Interception
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Strict Backspace / Delete Blocker
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      e.stopPropagation();

      soundEngine.playWarning(0.6);
      setBackspaceAttempts((prev) => prev + 1);
      setShowBackspaceWarning(true);
      if (backspaceTimerRef.current) clearTimeout(backspaceTimerRef.current);
      backspaceTimerRef.current = window.setTimeout(() => setShowBackspaceWarning(false), 2400);
      return;
    }

    // 2. Prevent keyboard shortcut manipulations
    if (e.ctrlKey || e.metaKey) {
      if (['a', 'c', 'v', 'x', 'z', 'y'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }

    // 3. Ignore non-printable keys
    if (e.key.length > 1 && e.key !== 'Enter') {
      if (e.key === 'Tab') e.preventDefault();
      return;
    }

    // 4. Start timer on first valid keypress
    if (!hasStarted) {
      setHasStarted(true);
      startTimeRef.current = Date.now();
    }

    e.preventDefault();

    const currentIndex = typedHistory.length;
    if (currentIndex >= initialText.length) {
      handleCompleteTest();
      return;
    }

    const expectedChar = initialText[currentIndex];
    let typedChar = e.key;
    if (typedChar === 'Enter') typedChar = '\n';

    const isCorrect = (typedChar === expectedChar);

    // Audio feedback
    if (isCorrect) {
      soundEngine.playKeypress(soundType, 0.45);
    } else {
      soundEngine.playError(0.5);
      // Log key mistake
      setKeyMistakes((prev) => ({
        ...prev,
        [expectedChar]: (prev[expectedChar] || 0) + 1,
      }));
    }

    // Update last key state for virtual keyboard flash
    setLastKeyStatus({ key: e.key, isCorrect });

    const record: TypedCharRecord = {
      expected: expectedChar,
      typed: typedChar,
      isCorrect,
    };

    setTypedHistory((prev) => [...prev, record]);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentIndex = typedHistory.length;
  const activeChar = currentIndex < initialText.length ? initialText[currentIndex] : '';

  // Theme styles
  const getThemeContainerClass = () => {
    switch (displayTheme) {
      case 'midnight':
        return 'bg-slate-950 text-slate-100 border-slate-800';
      case 'sepia':
        return 'bg-[#fcf8f2] text-amber-950 border-amber-300';
      case 'slate':
        return 'bg-slate-900 text-slate-100 border-slate-700';
      default:
        return 'bg-white text-slate-900 border-slate-300';
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'large':
        return 'text-xl leading-relaxed';
      case 'xlarge':
        return 'text-2xl leading-loose';
      default:
        return 'text-lg leading-relaxed';
    }
  };

  // Pacing status calculation
  const pacingDiff = targetWpm > 0 ? netWpm - targetWpm : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 select-none flex flex-col min-h-[calc(100vh-5rem)]">
      {/* 1. Official Examination Top Console */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-800 mb-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
              OFFICIAL EXAMINATION
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Candidate: <strong className="text-white">{student ? student.name : 'Guest'}</strong>
              {student && ` · ${student.studentId}`}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-heading text-white tracking-tight mt-0.5">
            THE FUTURE TRACK TYPING TEST
          </h2>
          <div className="text-xs text-slate-400">
            Passage: <span className="text-slate-200">{passage.title}</span> · Difficulty: <span className="text-blue-300 font-semibold">{passage.difficulty}</span>
          </div>
        </div>

        {/* Big Countdown Timer & Pacing */}
        <div className="flex items-center gap-4 sm:gap-6">
          {targetWpm > 0 && (
            <div className="hidden sm:block text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 justify-end">
                <Gauge className="w-3 h-3 text-amber-400" /> Target: {targetWpm} WPM
              </div>
              <div className={`text-xs font-mono font-bold ${pacingDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {pacingDiff >= 0 ? `+${pacingDiff} ahead` : `${pacingDiff} behind`}
              </div>
            </div>
          )}

          <div className="bg-slate-950 border-2 border-blue-500/40 rounded-xl px-5 py-2 text-center shadow-inner">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              TIME REMAINING
            </div>
            <div className={`text-3xl sm:text-4xl font-mono font-extrabold tracking-wider ${
              remainingSeconds <= 60 ? 'text-rose-500 animate-pulse' : 'text-blue-400'
            }`}>
              {formatTime(remainingSeconds)}
            </div>
          </div>

          <button
            onClick={() => setShowConfirmSubmit(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-700 text-xs font-semibold transition flex items-center gap-1.5"
            title="Submit test early"
          >
            <StopCircle className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Submit</span>
          </button>
        </div>
      </div>

      {/* 2. Real-Time Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs text-center">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Gross WPM</div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">{grossWpm}</div>
          <div className="text-[10px] text-slate-400">Raw Key Speed</div>
        </div>

        <div className="bg-white rounded-xl p-3 border-2 border-blue-500/40 shadow-xs text-center bg-blue-50/20">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center justify-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Net WPM
          </div>
          <div className="text-2xl font-black text-blue-600 font-mono mt-0.5">{netWpm}</div>
          <div className="text-[10px] text-blue-500 font-medium">Official Score</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs text-center">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1">
            <Target className="w-3.5 h-3.5 text-emerald-600" /> Accuracy
          </div>
          <div className={`text-2xl font-black font-mono mt-0.5 ${
            accuracy >= 90 ? 'text-emerald-600' : accuracy >= 80 ? 'text-amber-600' : 'text-rose-600'
          }`}>
            {accuracy}%
          </div>
          <div className="text-[10px] text-slate-400">Precision Rate</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs text-center">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-500" /> Errors
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono mt-0.5">{errorChars}</div>
          <div className="text-[10px] text-slate-400">Mistakes Logged</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs text-center">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Characters</div>
          <div className="text-2xl font-black text-slate-800 font-mono mt-0.5">{totalCharsTyped}</div>
          <div className="text-[10px] text-slate-400">Total Strokes</div>
        </div>

        <div className={`rounded-xl p-3 border shadow-xs text-center transition-colors ${
          backspaceAttempts > 0 ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1">
            <AlertTriangle className={`w-3.5 h-3.5 ${backspaceAttempts > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
            Backspace
          </div>
          <div className={`text-2xl font-black font-mono mt-0.5 ${backspaceAttempts > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {backspaceAttempts}
          </div>
          <div className="text-[10px] text-rose-600 font-semibold">Blocked Attempts</div>
        </div>
      </div>

      {/* 3. Toolbar Controls (Sound, Keyboard guide, Theme, Font Size) */}
      <div className="bg-white rounded-xl px-4 py-2 border border-slate-200 shadow-xs mb-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          {/* Sound Selector */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const nextSound: SoundEffectType = soundType === 'mechanical' ? 'thock' : soundType === 'thock' ? 'typewriter' : soundType === 'typewriter' ? 'silent' : 'mechanical';
                setSoundType(nextSound);
                soundEngine.playKeypress(nextSound, 0.5);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center gap-1.5 transition"
              title="Change mechanical switch sound effect"
            >
              {soundType === 'silent' ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-blue-600" />}
              <span>Sound: <strong className="capitalize">{soundType}</strong></span>
            </button>
          </div>

          {/* Virtual Keyboard Toggle */}
          <button
            onClick={() => setShowKeyboard((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              showKeyboard ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{showKeyboard ? 'Hide Key Guide' : 'Show Key Guide'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme switcher */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-medium">Theme:</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                onClick={() => setDisplayTheme('academic')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${displayTheme === 'academic' ? 'bg-white shadow text-blue-700 font-bold' : 'text-slate-600'}`}
              >
                Light
              </button>
              <button
                onClick={() => setDisplayTheme('midnight')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${displayTheme === 'midnight' ? 'bg-slate-900 text-white font-bold shadow' : 'text-slate-600'}`}
              >
                Dark
              </button>
              <button
                onClick={() => setDisplayTheme('sepia')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${displayTheme === 'sepia' ? 'bg-amber-100 text-amber-950 font-bold shadow' : 'text-slate-600'}`}
              >
                Sepia
              </button>
            </div>
          </div>

          {/* Font Sizer */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-medium">Size:</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-0.5 rounded text-[11px] ${fontSize === 'normal' ? 'bg-white shadow font-bold text-blue-700' : 'text-slate-600'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-0.5 rounded text-[11px] ${fontSize === 'large' ? 'bg-white shadow font-bold text-blue-700' : 'text-slate-600'}`}
              >
                A+
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Alert Toasts */}
      {showBackspaceWarning && (
        <div className="mb-3 p-3.5 bg-rose-600 text-white rounded-xl shadow-lg flex items-center justify-between animate-bounce transition-all border border-rose-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-700 flex items-center justify-center font-bold">
              ⚠
            </div>
            <div>
              <div className="font-extrabold text-sm uppercase tracking-wide">
                Backspace Disabled During Examination
              </div>
              <div className="text-xs text-rose-100">
                Corrections using Backspace or Delete are prohibited. Maintain your cadence and continue typing forward.
              </div>
            </div>
          </div>
          <div className="text-xs bg-rose-800/80 px-2.5 py-1 rounded-md font-mono font-bold">
            Attempt #{backspaceAttempts}
          </div>
        </div>
      )}

      {showTabWarning && (
        <div className="mb-3 p-3.5 bg-amber-500 text-slate-950 rounded-xl shadow-lg flex items-center justify-between border border-amber-600 animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-slate-950" />
            <div>
              <div className="font-extrabold text-sm uppercase tracking-wide">
                ⚠ Test Window Changed
              </div>
              <div className="text-xs font-medium text-slate-900">
                Please remain on the typing test screen. Window switches are logged ({tabSwitchCount} recorded).
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowTabWarning(false)}
            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 5. Main Examination Typing Matrix */}
      <div 
        onClick={() => inputRef.current?.focus()}
        className={`flex-1 rounded-2xl border-2 shadow-xl overflow-hidden flex flex-col cursor-text relative transition-colors ${getThemeContainerClass()}`}
      >
        {/* Status top bar */}
        <div className="px-5 py-2.5 border-b border-current/10 flex flex-wrap items-center justify-between text-xs opacity-85">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider">Examination Script</span>
            {!hasStarted ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold animate-pulse">
                <Keyboard className="w-3.5 h-3.5" />
                TIMER STARTS ON FIRST KEYSTROKE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                RECORDING ACTIVE
              </span>
            )}
          </div>
          <div className="text-[11px] opacity-75 hidden sm:block">
            Green: Correct · Red: Typo · Blue: Active Next Keystroke
          </div>
        </div>

        {/* Text Viewport */}
        <div 
          ref={passageContainerRef}
          className={`flex-1 p-6 sm:p-8 overflow-y-auto font-mono ${getFontSizeClass()} tracking-wide max-h-[44vh] select-none`}
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >
          {/* Render already typed characters */}
          {typedHistory.map((item, index) => {
            const isNewline = item.expected === '\n';
            if (isNewline) {
              return (
                <span 
                  key={index}
                  className={item.isCorrect ? 'text-emerald-600' : 'bg-rose-200 text-rose-800 px-0.5 rounded'}
                >
                  {'\n'}
                </span>
              );
            }
            return (
              <span
                key={index}
                className={
                  item.isCorrect
                    ? 'text-emerald-600 bg-emerald-50/40'
                    : 'text-white bg-rose-600 font-bold rounded-xs px-0.5'
                }
              >
                {item.expected === ' ' && !item.isCorrect ? '_' : item.expected}
              </span>
            );
          })}

          {/* Currently Active Character (Target) */}
          {currentIndex < initialText.length && (
            <span
              ref={activeCharRef}
              className="relative inline-block bg-blue-600 text-white font-bold rounded-xs shadow-sm ring-2 ring-blue-400 animate-pulse px-0.5"
            >
              {initialText[currentIndex] === '\n' ? '↵\n' : initialText[currentIndex] === ' ' ? ' ' : initialText[currentIndex]}
            </span>
          )}

          {/* Upcoming Remaining Text */}
          {currentIndex + 1 < initialText.length && (
            <span className="opacity-45 font-normal">
              {initialText.slice(currentIndex + 1, currentIndex + 800)}
            </span>
          )}
        </div>

        {/* Hidden Zero-Opacity Textarea */}
        <textarea
          ref={inputRef}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          className="absolute -top-96 left-0 opacity-0 pointer-events-none"
        />

        {/* Bottom Typing Progress Footer */}
        <div className="border-t border-current/10 px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs opacity-80">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-blue-500" />
            <span>Click anywhere on this area to resume typing focus if cursor leaves.</span>
          </div>
          <div className="font-mono font-semibold">
            Progress: {currentIndex} / {initialText.length} characters ({Math.round((currentIndex / initialText.length) * 100)}%)
          </div>
        </div>
      </div>

      {/* 6. Live Interactive Virtual Keyboard with Finger Coaching */}
      {showKeyboard && (
        <div className="mt-4">
          <VirtualKeyboard
            activeChar={activeChar}
            lastKeyStatus={lastKeyStatus}
            showFingerGuide={true}
          />
        </div>
      )}

      {/* Confirmation Modal for Early Submission */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="text-lg font-bold font-heading text-slate-900">
                Confirm Examination Submission?
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              You have <strong>{formatTime(remainingSeconds)}</strong> remaining in your {durationMinutes}-minute examination.
              Are you sure you wish to submit and calculate your final official score now?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium text-sm"
              >
                Continue Typing
              </button>
              <button
                onClick={() => {
                  setShowConfirmSubmit(false);
                  handleCompleteTest();
                }}
                className="px-4 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-bold text-sm shadow-md"
              >
                Yes, Submit Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
