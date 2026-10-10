import React, { useState } from 'react';
import { TestResult, StudentProfile } from '../types';
import { exportResultsToCSV } from '../utils/storage';
import { 
  History, 
  Download, 
  TrendingUp, 
  Award, 
  Calendar, 
  Clock, 
  Target, 
  Zap, 
  Trash2, 
  User, 
  Filter,
  CheckCircle2
} from 'lucide-react';

interface HistoryViewProps {
  results: TestResult[];
  student: StudentProfile | null;
  onClearHistory: () => void;
  onStartNewTest: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  results,
  student,
  onClearHistory,
  onStartNewTest,
}) => {
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All');
  const [showOnlyCurrentStudent, setShowOnlyCurrentStudent] = useState<boolean>(!!student);

  // Filtered list
  const filtered = results.filter((r) => {
    const studentMatch = showOnlyCurrentStudent && student ? r.studentId === student.studentId : true;
    const diffMatch = filterDifficulty === 'All' || r.difficulty === filterDifficulty;
    return studentMatch && diffMatch;
  });

  // Calculate summary stats
  const totalTests = filtered.length;
  const bestNetWpm = totalTests > 0 ? Math.max(...filtered.map((r) => r.netWpm)) : 0;
  const avgAccuracy = totalTests > 0 
    ? Math.round(filtered.reduce((acc, curr) => acc + curr.accuracy, 0) / totalTests) 
    : 0;
  const totalMinutes = filtered.reduce((acc, curr) => acc + curr.durationMinutes, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Candidate Performance Ledger
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            Student Result History
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Track typing velocity, typographical accuracy, and backspace discipline over time.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {filtered.length > 0 && (
            <button
              onClick={() => exportResultsToCSV(filtered)}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}

          <button
            onClick={onStartNewTest}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2"
          >
            Take Test
          </button>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
            <Award className="w-4 h-4 text-amber-500" />
            Total Tests
          </div>
          <div className="text-3xl font-black font-mono text-slate-900 mt-1">{totalTests}</div>
          <div className="text-xs text-slate-400 mt-0.5">{totalMinutes} examination minutes</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
            <Zap className="w-4 h-4 text-blue-600" />
            Best Net WPM
          </div>
          <div className="text-3xl font-black font-mono text-blue-600 mt-1">{bestNetWpm}</div>
          <div className="text-xs text-blue-500 mt-0.5">Highest qualifying speed</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
            <Target className="w-4 h-4 text-emerald-600" />
            Average Accuracy
          </div>
          <div className="text-3xl font-black font-mono text-emerald-600 mt-1">{avgAccuracy}%</div>
          <div className="text-xs text-slate-400 mt-0.5">Across all completed tests</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
            <User className="w-4 h-4 text-indigo-600" />
            Active Candidate
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1 truncate">
            {student ? student.name : 'All Candidates'}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            {student ? student.studentId : 'Combined registry'}
          </div>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-700 uppercase">Filter:</span>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-medium"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {student && (
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showOnlyCurrentStudent}
                onChange={(e) => setShowOnlyCurrentStudent(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              Show only results for {student.name} ({student.studentId})
            </label>
          )}
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700 font-heading">No Test Records Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                You have not completed any typing examinations matching the selected filters yet.
              </p>
              <button
                onClick={onStartNewTest}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
              >
                Start a 10-Minute Test
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <th className="py-3.5 px-4 font-bold">Date</th>
                  <th className="py-3.5 px-4 font-bold">Candidate</th>
                  <th className="py-3.5 px-4 font-bold">Duration</th>
                  <th className="py-3.5 px-4 font-bold">Difficulty</th>
                  <th className="py-3.5 px-4 font-bold text-center">Gross WPM</th>
                  <th className="py-3.5 px-4 font-bold text-center">Net WPM</th>
                  <th className="py-3.5 px-4 font-bold text-center">Accuracy</th>
                  <th className="py-3.5 px-4 font-bold text-center">Errors</th>
                  <th className="py-3.5 px-4 font-bold text-center">Backspace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const date = new Date(item.completedAt);
                  const dateStr = date.toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dateStr}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 ml-5">
                          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{item.studentName}</div>
                        <div className="text-[11px] font-mono text-slate-500">{item.studentId}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {item.durationMinutes} min
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.difficulty === 'Easy'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.difficulty === 'Medium'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {item.difficulty}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                        {item.grossWpm}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-extrabold text-blue-700 text-base">
                        {item.netWpm}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        <span
                          className={
                            item.accuracy >= 90
                              ? 'text-emerald-600'
                              : item.accuracy >= 80
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }
                        >
                          {item.accuracy}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-rose-600 font-bold">
                        {item.errorCharacters}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono">
                        <span
                          className={
                            item.backspaceAttempts > 0
                              ? 'text-rose-600 font-bold'
                              : 'text-slate-400 font-medium'
                          }
                        >
                          {item.backspaceAttempts}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Clear Button */}
        {results.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all local typing test history?')) {
                  onClearHistory();
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Local History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
