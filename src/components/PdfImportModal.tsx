import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Plus, 
  Trash2, 
  BookOpen, 
  X,
  FileCheck
} from 'lucide-react';
import { Passage, Difficulty, Category } from '../types';
import { extractTextFromPdfFile, ExtractedPdfResult } from '../utils/pdfExtractor';
import { savePassage } from '../utils/storage';

interface PdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPassagesAdded: (newPassages: Passage[]) => void;
}

export const PdfImportModal: React.FC<PdfImportModalProps> = ({
  isOpen,
  onClose,
  onPassagesAdded,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Extracted results ready for review / import
  const [extractedPdfs, setExtractedPdfs] = useState<ExtractedPdfResult[]>([]);
  const [importMode, setImportMode] = useState<'per-pdf' | 'per-paragraph' | 'per-page'>('per-paragraph');
  const [defaultDifficulty, setDefaultDifficulty] = useState<Difficulty>('Medium');
  const [defaultCategory, setDefaultCategory] = useState<Category>('Exam Practice');
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handlePdfFiles = async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      setError('Kripya valid .pdf file chunein (Please select valid PDF documents).');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessCount(null);

    const results: ExtractedPdfResult[] = [];

    try {
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        setProgressText(`Processing "${file.name}" (${i + 1}/${pdfFiles.length})...`);
        setProgressPercent(Math.round(((i) / pdfFiles.length) * 100));

        const res = await extractTextFromPdfFile(file, (pageProg) => {
          setProgressText(
            `Reading "${file.name}" - Page ${pageProg.page} of ${pageProg.total}...`
          );
        });

        if (res.fullText && res.fullText.trim().length > 10) {
          results.push(res);
        }
      }

      if (results.length === 0) {
        setError('PDF files se koi readable text extract nahi ho paya. Ho sakta hai PDF scan/image based ho.');
      } else {
        setExtractedPdfs((prev) => [...prev, ...results]);
      }
    } catch (err: any) {
      console.error('PDF extraction failed:', err);
      setError(err?.message || 'PDF read karne me samasya aayi. Kripya doosri PDF try karein.');
    } finally {
      setIsProcessing(false);
      setProgressText('');
      setProgressPercent(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handlePdfFiles(e.target.files);
    }
  };

  // Convert extracted PDF data into Passage objects
  const handleConfirmImport = () => {
    if (extractedPdfs.length === 0) return;

    const newPassages: Passage[] = [];
    const timestamp = Date.now();

    extractedPdfs.forEach((pdf, pdfIndex) => {
      const baseCleanTitle = pdf.fileName
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .trim();

      if (importMode === 'per-pdf') {
        // 1 single full test passage per PDF
        const wordCount = pdf.fullText.split(/\s+/).filter(Boolean).length;
        if (wordCount >= 10) {
          newPassages.push({
            id: `pdf_${timestamp}_${pdfIndex}`,
            title: `[PDF] ${baseCleanTitle}`,
            category: defaultCategory,
            difficulty: defaultDifficulty,
            content: pdf.fullText,
            wordCount,
            isCustom: true,
          });
        }
      } else if (importMode === 'per-page') {
        // Each page becomes an individual test passage
        pdf.pages.forEach((page) => {
          const wordCount = page.text.split(/\s+/).filter(Boolean).length;
          if (wordCount >= 15) {
            newPassages.push({
              id: `pdf_${timestamp}_${pdfIndex}_p${page.pageNumber}`,
              title: `[PDF] ${baseCleanTitle} - Page ${page.pageNumber}`,
              category: defaultCategory,
              difficulty: defaultDifficulty,
              content: page.text,
              wordCount,
              isCustom: true,
            });
          }
        });
      } else {
        // per-paragraph: Split long paragraphs into exam-friendly passages (around 150-500 words)
        pdf.paragraphs.forEach((para, paraIndex) => {
          const wordCount = para.split(/\s+/).filter(Boolean).length;
          // Filter out tiny headers/footers
          if (wordCount >= 20) {
            newPassages.push({
              id: `pdf_${timestamp}_${pdfIndex}_para${paraIndex + 1}`,
              title: `[PDF] ${baseCleanTitle} - Para ${paraIndex + 1} (${wordCount} words)`,
              category: defaultCategory,
              difficulty: defaultDifficulty,
              content: para,
              wordCount,
              isCustom: true,
            });
          }
        });
      }
    });

    if (newPassages.length === 0) {
      setError('No valid passages met the minimum word requirement (min 15-20 words).');
      return;
    }

    // Save each passage to localStorage
    newPassages.forEach((p) => savePassage(p));

    // Callback to parent
    onPassagesAdded(newPassages);
    setSuccessCount(newPassages.length);
    setExtractedPdfs([]);

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const removePdfItem = (index: number) => {
    setExtractedPdfs((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-heading leading-tight">
                PDF se Paragraphs Add Karein
              </h3>
              <p className="text-xs text-rose-100">
                Apni PDF text upload karein taaki koi bhi test de sake
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-rose-300 hover:border-rose-500 bg-rose-50/40 hover:bg-rose-50/80 rounded-2xl p-6 text-center cursor-pointer transition group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 group-hover:scale-110 flex items-center justify-center mx-auto mb-3 transition">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              PDF File(s) Yahan Click Karke Upload Karein
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Ek ya ek se zyada PDF select kar sakte hain (.pdf format)
            </p>
            <span className="inline-block mt-3 px-3 py-1 bg-white border border-rose-200 text-rose-700 text-[11px] font-bold rounded-lg shadow-xs">
              ⚡ Instant Auto Text Extraction
            </span>
          </div>

          {/* Progress Indicator */}
          {isProcessing && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-bold text-blue-900">{progressText || 'Reading PDF...'}</div>
                <div className="text-[11px] text-blue-600">Extracting paragraphs and pages...</div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="font-bold text-rose-600 px-1 cursor-pointer">
                ✕
              </button>
            </div>
          )}

          {/* Success Banner */}
          {successCount !== null && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-emerald-900 font-bold">Safal! {successCount} Passages jud gaye hain!</strong>
                Ab ye No-Backspace Notepad aur Typing Test menu me sabhi ke liye uplabdh hain.
              </div>
            </div>
          )}

          {/* Extracted PDFs Preview & Settings */}
          {extractedPdfs.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  Uploaded Documents ({extractedPdfs.length}):
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  + Aur PDF Jodein
                </button>
              </div>

              {/* PDF Items List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {extractedPdfs.map((pdf, idx) => {
                  const totalWords = pdf.fullText.split(/\s+/).filter(Boolean).length;
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{pdf.fileName}</div>
                          <div className="text-[11px] text-slate-500">
                            {pdf.totalPages} page(s) • {pdf.paragraphs.length} paragraphs • {totalWords} words
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePdfItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Import Options */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-800 block">
                  Paragraph me add karne ka tarika (Passage Division):
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode('per-paragraph')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      importMode === 'per-paragraph'
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-bold">Har Paragraph Alag</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Recommended for short tests (1-5 min)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('per-page')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      importMode === 'per-page'
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-bold">Har Page Alag Test</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Page 1, Page 2 jaise alag passages
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('per-pdf')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      importMode === 'per-pdf'
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-bold">Puri PDF Ek Test</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Full continuous exam script
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={defaultDifficulty}
                      onChange={(e) => setDefaultDifficulty(e.target.value as Difficulty)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Category
                    </label>
                    <select
                      value={defaultCategory}
                      onChange={(e) => setDefaultCategory(e.target.value as Category)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium"
                    >
                      <option value="Exam Practice">Exam Practice</option>
                      <option value="General">General</option>
                      <option value="Education">Education</option>
                      <option value="English">English</option>
                      <option value="Business">Business</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={extractedPdfs.length === 0 || isProcessing}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Passages me Add Karein ({extractedPdfs.length} PDFs)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
