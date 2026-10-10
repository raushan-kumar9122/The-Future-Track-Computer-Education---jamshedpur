import React, { useState } from 'react';
import { Passage, Difficulty, Category } from '../types';
import { 
  BookOpen, 
  FileText, 
  Play, 
  SlidersHorizontal, 
  Tag, 
  Check, 
  Clock, 
  Plus,
  Upload
} from 'lucide-react';
import { PdfImportModal } from './PdfImportModal';

interface PassagesViewProps {
  passages: Passage[];
  selectedPassage: Passage;
  onSelectAndStart: (passage: Passage) => void;
  onOpenAdmin: () => void;
  onPassagesUpdated?: (passages: Passage[]) => void;
}

export const PassagesView: React.FC<PassagesViewProps> = ({
  passages,
  selectedPassage,
  onSelectAndStart,
  onOpenAdmin,
  onPassagesUpdated,
}) => {
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const filtered = passages.filter((p) => {
    const diffMatch = filterDifficulty === 'All' || p.difficulty === filterDifficulty;
    const catMatch = filterCategory === 'All' || p.category === filterCategory;
    const searchMatch = searchQuery
      ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return diffMatch && catMatch && searchMatch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Passage Repository
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            Official Examination Passages
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Explore authentic educational, civil service, and commercial texts designed for 10 to 60 minute typing assessments.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Upload PDF Passages
          </button>
          <button
            onClick={onOpenAdmin}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            Add / Manage in Admin
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search passages by keyword or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-600">Difficulty:</span>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-600">Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
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
      </div>

      {/* Passages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((p) => {
          const isSelected = selectedPassage.id === p.id;
          return (
            <div
              key={p.id}
              className={`bg-white rounded-3xl p-6 border-2 transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-600/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
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
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-400" />
                    {p.category}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 font-heading mb-2">
                  {p.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed font-sans mb-4">
                  {p.content}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <FileText className="w-3.5 h-3.5" />
                  <span>~{p.wordCount} words</span>
                </div>

                <button
                  onClick={() => onSelectAndStart(p)}
                  className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition ${
                    isSelected
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                      : 'bg-slate-100 text-slate-800 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isSelected ? 'Start Exam with This' : 'Select Passage'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* PDF Import Modal */}
      <PdfImportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onPassagesAdded={(newlyAdded) => {
          if (onPassagesUpdated) {
            onPassagesUpdated([...newlyAdded, ...passages]);
          }
          if (newlyAdded.length > 0) {
            onSelectAndStart(newlyAdded[0]);
          }
        }}
      />
    </div>
  );
};
