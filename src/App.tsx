/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Passage, 
  TestDuration, 
  Difficulty, 
  StudentProfile, 
  TestResult, 
  AdminSettings,
  SoundEffectType 
} from './types';
import { 
  getPassages, 
  getAllResults, 
  getCurrentStudent, 
  setCurrentStudent, 
  getAdminSettings,
  saveTestResult,
  savePassage 
} from './utils/storage';
import { Header } from './components/Header';
import { StartScreen } from './components/StartScreen';
import { ActiveTestScreen } from './components/ActiveTestScreen';
import { ResultScreen } from './components/ResultScreen';
import { HistoryView } from './components/HistoryView';
import { PassagesView } from './components/PassagesView';
import { AdminPanel } from './components/AdminPanel';
import { StudentLoginModal } from './components/StudentLoginModal';
import { ZeroBackspaceNotepad } from './components/ZeroBackspaceNotepad';

export default function App() {
  // Navigation & Screen state
  const [currentTab, setCurrentTab] = useState<'test' | 'notepad' | 'passages' | 'history' | 'admin'>('test');
  const [testState, setTestState] = useState<'idle' | 'active' | 'completed'>('idle');

  // Core Data
  const [passages, setPassages] = useState<Passage[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(getAdminSettings());

  // Test Selection Configuration (Strict minimum 10 minutes)
  const [selectedDuration, setSelectedDuration] = useState<TestDuration>(10);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('Easy');
  const [selectedPassage, setSelectedPassage] = useState<Passage | null>(null);

  // Sound and Target Speed Preferences
  const [soundType, setSoundType] = useState<SoundEffectType>('mechanical');
  const [targetWpm, setTargetWpm] = useState<number>(35); // Default 35 WPM standard

  // Active / Completed result
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null);

  // Student Login Modal
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Initial load
  useEffect(() => {
    const loadedPassages = getPassages();
    setPassages(loadedPassages);
    setResults(getAllResults());
    const existingStudent = getCurrentStudent();
    setStudent(existingStudent);

    // Default select first passage
    if (loadedPassages.length > 0) {
      setSelectedPassage(loadedPassages[0]);
    }
  }, []);

  // Handle Custom Passage Addition
  const handleAddCustomPassage = (title: string, content: string) => {
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const newPassage: Passage = {
      id: `custom_${Date.now()}`,
      title,
      category: 'Exam Practice',
      difficulty: selectedDifficulty,
      content,
      wordCount,
      isCustom: true,
    };
    savePassage(newPassage);
    setPassages((prev) => [newPassage, ...prev]);
    setSelectedPassage(newPassage);
  };

  // Handle Start Test
  const handleStartTest = () => {
    if (!selectedPassage) {
      if (passages.length > 0) {
        setSelectedPassage(passages[0]);
      } else {
        return;
      }
    }
    setTestState('active');
  };

  // Handle Finished Test
  const handleFinishTest = (result: TestResult) => {
    saveTestResult(result);
    setResults((prev) => [result, ...prev]);
    setCurrentResult(result);
    setTestState('completed');
  };

  // Retry same test
  const handleRetryTest = () => {
    setTestState('active');
  };

  // Choose another test
  const handleChooseAnother = () => {
    setTestState('idle');
  };

  // View history
  const handleViewHistory = () => {
    setTestState('idle');
    setCurrentTab('history');
  };

  // Selecting a passage from the library and starting test
  const handleSelectPassageAndStart = (p: Passage) => {
    setSelectedPassage(p);
    setSelectedDifficulty(p.difficulty);
    setCurrentTab('test');
    setTestState('idle');
  };

  // Handle Student Logout / Profile Switch
  const handleLogout = () => {
    setCurrentStudent(null);
    setStudent(null);
    setIsLoginModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        student={student}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        isTestActive={testState === 'active'}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Test Tab */}
        {currentTab === 'test' && (
          <>
            {testState === 'idle' && selectedPassage && (
              <StartScreen
                passages={passages}
                selectedDuration={selectedDuration}
                setSelectedDuration={setSelectedDuration}
                selectedDifficulty={selectedDifficulty}
                setSelectedDifficulty={setSelectedDifficulty}
                selectedPassage={selectedPassage}
                setSelectedPassage={setSelectedPassage}
                student={student}
                targetWpm={targetWpm}
                setTargetWpm={setTargetWpm}
                soundType={soundType}
                setSoundType={setSoundType}
                onAddCustomPassage={handleAddCustomPassage}
                onOpenLogin={() => setIsLoginModalOpen(true)}
                onStartTest={handleStartTest}
                onOpenNotepad={() => setCurrentTab('notepad')}
              />
            )}

            {testState === 'active' && selectedPassage && (
              <ActiveTestScreen
                passage={selectedPassage}
                passagesList={passages}
                durationMinutes={selectedDuration}
                student={student}
                adminSettings={adminSettings}
                targetWpm={targetWpm}
                initialSound={soundType}
                onFinishTest={handleFinishTest}
                onCancelTest={() => setTestState('idle')}
              />
            )}

            {testState === 'completed' && currentResult && (
              <ResultScreen
                result={currentResult}
                student={student}
                onRetry={handleRetryTest}
                onChooseAnother={handleChooseAnother}
                onViewHistory={handleViewHistory}
              />
            )}
          </>
        )}

        {/* No-Backspace Notepad Tab */}
        {currentTab === 'notepad' && (
          <ZeroBackspaceNotepad />
        )}

        {/* Passages Repository Tab */}
        {currentTab === 'passages' && selectedPassage && (
          <PassagesView
            passages={passages}
            selectedPassage={selectedPassage}
            onSelectAndStart={handleSelectPassageAndStart}
            onOpenAdmin={() => setCurrentTab('admin')}
            onPassagesUpdated={setPassages}
          />
        )}

        {/* History Tab */}
        {currentTab === 'history' && (
          <HistoryView
            results={results}
            student={student}
            onClearHistory={() => {
              localStorage.removeItem('jalan_typing_results_v1');
              setResults([]);
            }}
            onStartNewTest={() => {
              setCurrentTab('test');
              setTestState('idle');
            }}
          />
        )}

        {/* Admin Portal Tab */}
        {currentTab === 'admin' && (
          <AdminPanel
            passages={passages}
            onPassagesUpdated={setPassages}
            results={results}
            onResultsUpdated={setResults}
            adminSettings={adminSettings}
            onSettingsUpdated={setAdminSettings}
          />
        )}
      </main>

      {/* Student Login Modal */}
      <StudentLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentStudent={student}
        onStudentUpdated={setStudent}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs text-center no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-bold text-slate-200">THE FUTURE TRACK TYPING TEST</span> • Official Educational Examination Console
          </div>
          <div className="flex items-center gap-3">
            <span>Minimum Test Duration: <strong className="text-white">10 Minutes</strong></span>
            <span>·</span>
            <a
              href="/future-track-typing-system.zip"
              download="future-track-typing-system.zip"
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 flex items-center gap-1"
            >
              📥 Download Project Source (.ZIP)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
