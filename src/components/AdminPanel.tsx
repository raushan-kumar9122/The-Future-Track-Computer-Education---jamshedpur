import React, { useState } from 'react';
import { 
  Passage, 
  TestResult, 
  Difficulty, 
  Category, 
  AdminSettings 
} from '../types';
import { 
  savePassage, 
  deletePassage, 
  exportResultsToCSV,
  saveAdminSettings 
} from '../utils/storage';
import { DEFAULT_PASSAGES } from '../data/passages';
import { 
  ShieldAlert, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Download, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  X, 
  BarChart3, 
  FileText, 
  Users, 
  Settings, 
  AlertTriangle,
  RotateCcw,
  Upload
} from 'lucide-react';
import { PdfImportModal } from './PdfImportModal';

interface AdminPanelProps {
  passages: Passage[];
  onPassagesUpdated: (passages: Passage[]) => void;
  results: TestResult[];
  onResultsUpdated: (results: TestResult[]) => void;
  adminSettings: AdminSettings;
  onSettingsUpdated: (settings: AdminSettings) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  passages,
  onPassagesUpdated,
  results,
  onResultsUpdated,
  adminSettings,
  onSettingsUpdated,
}) => {
  // Admin authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  // Active sub-tab in Admin
  const [adminTab, setAdminTab] = useState<'stats' | 'passages' | 'results' | 'settings'>('stats');

  // Search & Filter state for results
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedResultDifficulty, setSelectedResultDifficulty] = useState<string>('All');
  const [selectedResultDuration, setSelectedResultDuration] = useState<string>('All');

  // Modal state for Add/Edit passage
  const [isPassageModalOpen, setIsPassageModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [editingPassage, setEditingPassage] = useState<Passage | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<Difficulty>('Medium');
  const [formCategory, setFormCategory] = useState<Category>('General');
  const [formError, setFormError] = useState('');

  // Settings form
  const [maxTabSwitches, setMaxTabSwitches] = useState(adminSettings.maxAllowedTabSwitches);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === 'admin123' || passcode.trim() === 'admin') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Invalid administrator PIN. Try admin123');
    }
  };

  const handleOpenAddPassage = () => {
    setEditingPassage(null);
    setFormTitle('');
    setFormContent('');
    setFormDifficulty('Medium');
    setFormCategory('General');
    setFormError('');
    setIsPassageModalOpen(true);
  };

  const handleOpenEditPassage = (p: Passage) => {
    setEditingPassage(p);
    setFormTitle(p.title);
    setFormContent(p.content);
    setFormDifficulty(p.difficulty);
    setFormCategory(p.category);
    setFormError('');
    setIsPassageModalOpen(true);
  };

  const handleSavePassage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Passage title is required.');
      return;
    }
    if (!formContent.trim()) {
      setFormError('Passage content text is required.');
      return;
    }

    const wordCount = formContent.trim().split(/\s+/).length;
    const passageToSave: Passage = {
      id: editingPassage ? editingPassage.id : `pas_${Date.now()}`,
      title: formTitle.trim(),
      content: formContent.trim(),
      difficulty: formDifficulty,
      category: formCategory,
      wordCount,
      isCustom: true,
    };

    savePassage(passageToSave);
    const updated = passages.some((p) => p.id === passageToSave.id)
      ? passages.map((p) => (p.id === passageToSave.id ? passageToSave : p))
      : [passageToSave, ...passages];
    onPassagesUpdated(updated);
    setIsPassageModalOpen(false);
  };

  const handleDeletePassage = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this passage?')) {
      deletePassage(id);
      onPassagesUpdated(passages.filter((p) => p.id !== id));
    }
  };

  const handleResetDefaultPassages = () => {
    if (window.confirm('Reset passages back to the standard institutional defaults?')) {
      localStorage.setItem('jalan_typing_passages_v1', JSON.stringify(DEFAULT_PASSAGES));
      onPassagesUpdated(DEFAULT_PASSAGES);
    }
  };

  const handleDeleteResult = (id: string) => {
    if (window.confirm('Delete this examination test record?')) {
      const updated = results.filter((r) => r.id !== id);
      localStorage.setItem('jalan_typing_results_v1', JSON.stringify(updated));
      onResultsUpdated(updated);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AdminSettings = {
      ...adminSettings,
      maxAllowedTabSwitches: Number(maxTabSwitches),
    };
    saveAdminSettings(updated);
    onSettingsUpdated(updated);
    alert('Administrator examination settings updated successfully.');
  };

  // Metrics calculation
  const totalTests = results.length;
  const avgWpm = totalTests > 0 
    ? Math.round(results.reduce((acc, curr) => acc + curr.grossWpm, 0) / totalTests) 
    : 0;
  const avgNetWpm = totalTests > 0 
    ? Math.round(results.reduce((acc, curr) => acc + curr.netWpm, 0) / totalTests) 
    : 0;
  const avgAccuracy = totalTests > 0 
    ? Math.round(results.reduce((acc, curr) => acc + curr.accuracy, 0) / totalTests) 
    : 0;
  const totalBackspaceAttempts = results.reduce((acc, curr) => acc + curr.backspaceAttempts, 0);

  // Filtered results
  const filteredResults = results.filter((r) => {
    const searchLower = studentSearch.toLowerCase();
    const matchesSearch = studentSearch
      ? r.studentName.toLowerCase().includes(searchLower) ||
        r.studentId.toLowerCase().includes(searchLower) ||
        r.passageTitle.toLowerCase().includes(searchLower)
      : true;
    const matchesDiff = selectedResultDifficulty === 'All' || r.difficulty === selectedResultDifficulty;
    const matchesDur = selectedResultDuration === 'All' || String(r.durationMinutes) === selectedResultDuration;
    return matchesSearch && matchesDiff && matchesDur;
  });

  // If not authenticated, show passcode login screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 mb-1">
            Administrator Gateway
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Enter administrator PIN to access passages management, candidate scores, and exam policies.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {authError}
              </div>
            )}
            <div>
              <input
                type="password"
                placeholder="Enter Admin PIN (Default: admin123)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-center text-sm font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              Authorize Access
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <button
              onClick={() => {
                setPasscode('admin123');
                setIsAuthenticated(true);
              }}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Quick Unlock (Demo PIN: admin123)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Admin Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-300 bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-800 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
              Administrative Console
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
            Examination Administration
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage official passages, view candidate audit logs, and configure test parameters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            Lock Admin
          </button>
        </div>
      </div>

      {/* Admin Sub Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 mb-6 overflow-x-auto pb-2 text-xs sm:text-sm">
        <button
          onClick={() => setAdminTab('stats')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
            adminTab === 'stats'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Examination Analytics
        </button>

        <button
          onClick={() => setAdminTab('passages')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
            adminTab === 'passages'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          Manage Passages ({passages.length})
        </button>

        <button
          onClick={() => setAdminTab('results')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
            adminTab === 'results'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Student Results Registry ({results.length})
        </button>

        <button
          onClick={() => setAdminTab('settings')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
            adminTab === 'settings'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          Test Rules Configuration
        </button>
      </div>

      {/* Tab 1: Statistics & Analytics */}
      {adminTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Total Tests Taken</div>
              <div className="text-3xl font-black font-mono text-slate-900 mt-1">{totalTests}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Attempted by candidates</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Average Gross WPM</div>
              <div className="text-3xl font-black font-mono text-slate-800 mt-1">{avgWpm}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Raw keystroke pace</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border-2 border-blue-500/30 rounded-2xl p-5 shadow-sm bg-blue-50/20">
              <div className="text-xs font-bold text-blue-700 uppercase">Average Net WPM</div>
              <div className="text-3xl font-black font-mono text-blue-700 mt-1">{avgNetWpm}</div>
              <div className="text-[11px] text-blue-500 mt-0.5">Official score avg</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Average Accuracy</div>
              <div className="text-3xl font-black font-mono text-emerald-600 mt-1">{avgAccuracy}%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Typographical accuracy</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Backspace Attempts</div>
              <div className="text-3xl font-black font-mono text-rose-600 mt-1">{totalBackspaceAttempts}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Total blocked keystrokes</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 font-heading mb-3">
              Institutional Examination Standards Summary
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              All examinations conducted under this portal enforce the Department of Personnel and Examination Board
              guidelines: minimum duration locked at 10 minutes, real-time zero-backspace lockout, tab switch tracking, and net WPM error deductions.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => exportResultsToCSV(results)}
                disabled={results.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Export Full Audit Log to CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Manage Passages */}
      {adminTab === 'passages' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Examination Script Catalog
              </h3>
              <p className="text-xs text-slate-500">
                Create, customize, or prune typing passages across Easy, Medium, and Hard tiers.
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={() => setIsPdfModalOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                title="PDF documents se passages/paragraphs auto-extract karein"
              >
                <Upload className="w-4 h-4" />
                Upload PDF Passages
              </button>
              <button
                onClick={handleResetDefaultPassages}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="Restore default pre-loaded exam papers"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore Defaults
              </button>
              <button
                onClick={handleOpenAddPassage}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add New Passage
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {passages.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        p.difficulty === 'Easy'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.difficulty === 'Medium'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {p.difficulty}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {p.category}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 font-heading mb-1.5">
                    {p.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
                    {p.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono font-medium">~{p.wordCount} words</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditPassage(p)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Passage"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePassage(p.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Passage"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Student Results Registry */}
      {adminTab === 'results' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate name, roll ID, or passage..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedResultDifficulty}
                onChange={(e) => setSelectedResultDifficulty(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              <select
                value={selectedResultDuration}
                onChange={(e) => setSelectedResultDuration(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
              >
                <option value="All">All Durations</option>
                <option value="10">10 Min</option>
                <option value="15">15 Min</option>
                <option value="20">20 Min</option>
                <option value="30">30 Min</option>
                <option value="60">60 Min</option>
              </select>

              <button
                onClick={() => exportResultsToCSV(filteredResults)}
                disabled={filteredResults.length === 0}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow transition disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              {filteredResults.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <div className="text-sm font-bold text-slate-700">No Candidate Records Found</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Try adjusting the search criteria or take a test to populate records.
                  </div>
                </div>
              ) : (
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                      <th className="py-3 px-4">Candidate & Roll ID</th>
                      <th className="py-3 px-4">Passage</th>
                      <th className="py-3 px-4 text-center">Duration</th>
                      <th className="py-3 px-4 text-center">Gross WPM</th>
                      <th className="py-3 px-4 text-center">Net WPM</th>
                      <th className="py-3 px-4 text-center">Accuracy</th>
                      <th className="py-3 px-4 text-center">Errors</th>
                      <th className="py-3 px-4 text-center">Backspace</th>
                      <th className="py-3 px-4 text-center">Tab Switches</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredResults.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{r.studentName}</div>
                          <div className="text-[11px] font-mono text-slate-400">{r.studentId}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800 truncate max-w-xs">{r.passageTitle}</div>
                          <div className="text-[10px] text-slate-400">{r.difficulty} • {r.category}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-slate-700">
                          {r.durationMinutes} min
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                          {r.grossWpm}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-extrabold text-blue-700">
                          {r.netWpm}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600">
                          {r.accuracy}%
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-rose-600">
                          {r.errorCharacters}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-700">
                          {r.backspaceAttempts}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-700">
                          {r.tabSwitchCount}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteResult(r.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition"
                            title="Delete result"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Test Settings */}
      {adminTab === 'settings' && (
        <div className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-bold font-heading text-slate-900 mb-1">
              Examination Integrity & Controls
            </h3>
            <p className="text-xs text-slate-500">
              Configure strict anti-cheating tolerances and examination rules.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-blue-950">
                <CheckCircle2 className="w-4 h-4 text-blue-700" />
                Immutable Examination Rules (Hard-Coded)
              </div>
              <div>• <strong>Minimum Duration:</strong> Fixed at 10 minutes strictly. Cannot be decreased.</div>
              <div>• <strong>Backspace Lockout:</strong> Backspace & Delete keys are completely disabled during tests.</div>
              <div>• <strong>Clipboard Lockout:</strong> Cut, Copy, Paste, Drag & Drop are prevented.</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Maximum Tab/Window Switches Allowed
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={maxTabSwitches}
                onChange={(e) => setMaxTabSwitches(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Warns candidate whenever focus is lost from the examination console.
              </p>
            </div>

            <button
              type="submit"
              className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition cursor-pointer"
            >
              Save Configuration
            </button>
          </form>
        </div>
      )}

      {/* Modal: Add / Edit Passage */}
      {isPassageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-heading">
                  {editingPassage ? 'Edit Examination Passage' : 'Add New Examination Passage'}
                </h3>
                <p className="text-xs text-slate-400">
                  Ensure content has ample length for 10-60 minute typing assessments.
                </p>
              </div>
              <button
                onClick={() => setIsPassageModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePassage} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Passage Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern Civil Services Typing Examination Paper"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Difficulty Level *
                  </label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as Difficulty)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Category)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="General">General</option>
                    <option value="Education">Education</option>
                    <option value="Business">Business</option>
                    <option value="Computer">Computer</option>
                    <option value="English">English</option>
                    <option value="Exam Practice">Exam Practice</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Passage Content Text *
                  </label>
                  <span className="text-xs text-slate-400 font-mono">
                    Words: {formContent.trim() ? formContent.trim().split(/\s+/).length : 0}
                  </span>
                </div>
                <textarea
                  rows={8}
                  required
                  placeholder="Paste or write the full examination paragraph(s) here..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPassageModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition"
                >
                  Save Passage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Import Modal */}
      <PdfImportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onPassagesAdded={(newlyAdded) => {
          onPassagesUpdated([...newlyAdded, ...passages]);
        }}
      />
    </div>
  );
};
