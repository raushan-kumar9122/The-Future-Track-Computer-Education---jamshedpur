import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FileEdit, 
  AlertTriangle, 
  Download, 
  Copy, 
  Check, 
  Trash2, 
  Printer, 
  Maximize2, 
  Minimize2, 
  Clock, 
  BookOpen, 
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Plus,
  ArrowRight,
  Layers,
  FileText,
  CheckCircle2,
  ListOrdered,
  Target,
  Zap,
  Award,
  Eye,
  EyeOff,
  ChevronDown,
  XCircle,
  HelpCircle,
  Sparkles,
  SpellCheck,
  Info,
  Camera,
  UploadCloud,
  Loader2,
  Images,
  Smartphone,
  Laptop,
  Upload
} from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { SoundEffectType, Passage } from '../types';
import { getPassages } from '../utils/storage';
import { analyzeFreeWritingErrors, TypoIssue } from '../utils/spellChecker';
import { extractTextFromMultipleImages } from '../utils/ocrService';
import { extractTextFromPdfFile } from '../utils/pdfExtractor';
import { PdfImportModal } from './PdfImportModal';

export interface ParagraphSheet {
  id: string;
  paragraphNumber: number;
  content: string;
  wordCount: number;
  charCount: number;
  backspaceCount: number;
  elapsedSeconds: number;
  promptGuidance?: string;
  isCompleted: boolean;
}

const PARAGRAPH_EXERCISE_SUITES = [
  {
    title: '3-Stage Academic Essay (Intro · Body · Conclusion)',
    category: 'Essay Structure',
    paragraphs: [
      {
        prompt: 'Paragraph 1 (Introduction & Thesis): Define the subject of digital literacy and explain why disciplined keyboarding under timed conditions is essential for contemporary students.',
        sample: 'Digital keyboarding proficiency has emerged as a cornerstone of modern educational achievement. When students master fluent touch-typing, cognitive focus shifts from mechanical key finding to analytical formulation.',
      },
      {
        prompt: 'Paragraph 2 (Body & Evidence): Detail the cognitive benefits of zero-backspace typing and how committing to keystrokes builds uninterrupted cognitive flow.',
        sample: 'Operating under zero-backspace restrictions enforces deliberate psychological discipline. Rather than hesitating and second-guessing every word, the typist develops a forward-moving cadence that improves overall throughput.',
      },
      {
        prompt: 'Paragraph 3 (Conclusion & Synthesis): Summarize key insights and conclude with actionable recommendations for sustained daily typing practice.',
        sample: 'In conclusion, continuous typing practice over ten to sixty minutes establishes durable muscle memory. Regular dedication ensures candidates meet institutional examination standards with both speed and accuracy.',
      },
    ],
  },
  {
    title: '4-Part Administrative Memorandum',
    category: 'Official Practice',
    paragraphs: [
      {
        prompt: 'Paragraph 1 (Reference & Formal Salutation): State the examination memo reference number, date, and introductory notice to candidates.',
        sample: 'MEMORANDUM REF: TRK/2026/ADM-04\nTo all prospective candidates appearing for the State Technical Keyboarding Examination: Please be advised that examination consoles require strict adherence to procedural directives.',
      },
      {
        prompt: 'Paragraph 2 (Hardware Verification): Explain keyboard connectivity, posture standards, and ergonomic verification.',
        sample: 'Candidates must ensure physical keyboard alignment before commencing the session. The home-row tactile points on the F and J keys provide the foundational reference for spatial key awareness.',
      },
      {
        prompt: 'Paragraph 3 (Integrity Protocols): Highlight zero-backspace enforcement and anti-cheating window monitor regulations.',
        sample: 'Under official regulations, retroactive keystrokes including backspace and delete are completely disabled. External clipboard interactions and window focus alterations are recorded in the central audit registry.',
      },
      {
        prompt: 'Paragraph 4 (Final Certification): State submission guidelines and qualifying score requirements.',
        sample: 'Upon countdown expiry, the evaluation engine automatically computes gross velocity and net qualifying WPM. Candidates meeting the thirty-five words-per-minute ceiling are awarded certified competency.',
      },
    ],
  },
];

// Available test durations
const TIMER_OPTIONS = [
  { value: 0, label: 'Free Practice (Stopwatch)' },
  { value: 1, label: '1 Minute Test' },
  { value: 2, label: '2 Minutes Test' },
  { value: 3, label: '3 Minutes Test' },
  { value: 5, label: '5 Minutes Test' },
  { value: 10, label: '10 Minutes Test' },
  { value: 15, label: '15 Minutes Test' },
  { value: 20, label: '20 Minutes Test' },
  { value: 30, label: '30 Minutes Test' },
  { value: 60, label: '60 Minutes Test' },
];

export interface UnifiedMistakeRecord {
  index: number;
  type: 'typo' | 'omitted' | 'extra' | 'spelling' | 'grammar';
  expected: string;
  typed: string;
  reason?: string;
}

/**
 * Universal Text Normalization Utility
 * Ensures 100% identical tokenization and comparison across:
 * - Windows (CRLF \r\n) vs Mac/Linux/Android (\n)
 * - Microsoft Word / Apple iOS smart curly quotes (‘ ’ “ ”) vs ASCII straight quotes (' ")
 * - Non-breaking spaces (\u00A0), zero-width spaces (\u200B), and Unicode whitespace
 * - Em-dashes (—) and en-dashes (–) vs ASCII hyphens (-)
 */
export const normalizeCrossPlatformText = (text: string): string => {
  if (!text) return '';
  return text
    // Normalize newlines to standard UNIX \n
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Normalize non-breaking spaces and all Unicode spaces to standard space
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    // Normalize smart curly quotes & apostrophes
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u0060\u00B4]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u00AB\u00BB]/g, '"')
    // Normalize hyphens and dashes
    .replace(/[\u2013\u2014\u2015\u2212]/g, '-')
    // Collapse consecutive horizontal whitespace (spaces/tabs) to a single space
    .replace(/[ \t]+/g, ' ');
};

export const ZeroBackspaceNotepad: React.FC = () => {
  // Mode: 'continuous' (Single Unified Document - Recommended for Custom tests) vs 'paragraph-sheets' (Always New Notepad per Paragraph)
  const [notepadMode, setNotepadMode] = useState<'paragraph-sheets' | 'continuous'>('paragraph-sheets');

  // Test Evaluation Mode: 'passage-copy' (Copy-typing against passage) vs 'free-spellcheck' (Self-writing with live spell check)
  const [evaluationMode, setEvaluationMode] = useState<'passage-copy' | 'free-spellcheck'>('passage-copy');

  // Multi-Paragraph Sheets State
  const [paragraphSheets, setParagraphSheets] = useState<ParagraphSheet[]>(() => {
    try {
      const stored = localStorage.getItem('futuretrack_paragraph_sheets_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // fallback
    }
    return [
      {
        id: 'sheet_1',
        paragraphNumber: 1,
        content: '',
        wordCount: 0,
        charCount: 0,
        backspaceCount: 0,
        elapsedSeconds: 0,
        promptGuidance: 'Paragraph 1: Begin typing your test content here...',
        isCompleted: false,
      },
    ];
  });

  const [activeSheetIndex, setActiveSheetIndex] = useState(0);

  // Continuous single notepad content
  const [continuousContent, setContinuousContent] = useState<string>(() => {
    return localStorage.getItem('futuretrack_notepad_draft') || '';
  });

  // Global Backspace attempt counter
  const [totalBackspaceAttempts, setTotalBackspaceAttempts] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  // Editor Appearance
  const [fontFamily, setFontFamily] = useState<'mono' | 'sans' | 'serif'>('mono');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [notepadTheme, setNotepadTheme] = useState<'paper' | 'clean' | 'warm' | 'dark'>('paper');
  const [soundType, setSoundType] = useState<SoundEffectType>('mechanical');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'notepad' | 'compiled'>('notepad');

  // ==========================================
  // 1. HARDWARE-CLOCK WALL-TIME TIMER ENGINE
  // ==========================================
  // Uses Date.now() timestamps to guarantee 100% exact timing on ANY computer,
  // laptop, mobile, or tablet, regardless of CPU throttling, battery saver, or tab throttling!
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState<number>(2); // Default to 2 min
  const [isTestActive, setIsTestActive] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(2 * 60);
  const [elapsedSessionSeconds, setElapsedSessionSeconds] = useState<number>(0);
  const [isTestCompleted, setIsTestCompleted] = useState<boolean>(false);
  const [showScorecardModal, setShowScorecardModal] = useState<boolean>(false);

  // Wall-clock refs for jitter-free high-precision timing
  const testStartTimeRef = useRef<number | null>(null);
  const accumulatedElapsedSecRef = useRef<number>(0);
  const timerIntervalRef = useRef<number | null>(null);
  const warningTimerRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Text length tracker for mobile/virtual-keyboard backspace detection
  const lastTextValueRef = useRef<string>('');

  // ==========================================
  // 2. REFERENCE PASSAGE CONFIGURATION
  // ==========================================
  const [availablePassages, setAvailablePassages] = useState<Passage[]>([]);
  const [selectedPassageId, setSelectedPassageId] = useState<string>('default');
  const [showReferenceBox, setShowReferenceBox] = useState<boolean>(true);
  const [customPromptText, setCustomPromptText] = useState<string>('');

  // OCR (Multi-Image Text Extraction) State
  const [isOcrLoading, setIsOcrLoading] = useState<boolean>(false);
  const [ocrProgressText, setOcrProgressText] = useState<string>('');
  const [ocrProgressPercent, setOcrProgressPercent] = useState<number>(0);
  const [uploadedImagesList, setUploadedImagesList] = useState<Array<{ id: string; preview: string; name: string }>>([]);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // PDF Import Modal & Direct PDF Upload State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isPdfDirectLoading, setIsPdfDirectLoading] = useState<boolean>(false);
  const [pdfDirectProgressText, setPdfDirectProgressText] = useState<string>('');
  const pdfDirectInputRef = useRef<HTMLInputElement | null>(null);

  // Process multiple hardcopy document images using OCR
  const processImageFiles = async (files: File[]) => {
    const validImages = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validImages.length === 0) {
      setOcrError('Please select valid image files (JPG, PNG, WebP).');
      return;
    }

    const newThumbnails = validImages.map((file, idx) => ({
      id: `${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));

    setUploadedImagesList(prev => [...prev, ...newThumbnails]);
    setIsOcrLoading(true);
    setOcrError(null);
    setOcrProgressText(`Optimizing ${validImages.length} image${validImages.length > 1 ? 's' : ''}...`);
    setOcrProgressPercent(15);

    try {
      const extracted = await extractTextFromMultipleImages(validImages, (progress) => {
        setOcrProgressText(progress.status);
        if (progress.percent !== undefined) setOcrProgressPercent(progress.percent);
      });

      if (extracted && extracted.trim().length > 0) {
        const cleanedText = normalizeCrossPlatformText(extracted.trim());
        setCustomPromptText(prev => {
          if (!prev.trim()) return cleanedText;
          return prev.trim() + '\n\n' + cleanedText;
        });
        soundEngine.playKeypress('mechanical', 0.5);
        handleResetTest();
      } else {
        setOcrError('No readable text could be recognized. Please upload clearer photos with good lighting.');
      }
    } catch (err: any) {
      console.error('OCR Processing Error:', err);
      setOcrError(err?.message || 'Failed to extract text from images. Please try again or paste manually.');
    } finally {
      setIsOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImageFiles(Array.from(files));
    }
  };

  const removeUploadedImage = (id: string) => {
    setUploadedImagesList(prev => prev.filter(item => item.id !== id));
  };

  // Direct fast PDF extraction for custom prompt
  const processDirectPdfFiles = async (files: File[]) => {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (pdfFiles.length === 0) {
      setOcrError('Kripya valid PDF file chunein (.pdf).');
      return;
    }

    setIsPdfDirectLoading(true);
    setPdfDirectProgressText(`Reading PDF document...`);
    setOcrError(null);

    try {
      let combinedPdfText = '';
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        setPdfDirectProgressText(`Extracting "${file.name}" (${i + 1}/${pdfFiles.length})...`);
        const res = await extractTextFromPdfFile(file);
        if (res.fullText && res.fullText.trim()) {
          combinedPdfText += (combinedPdfText ? '\n\n' : '') + res.fullText.trim();
        }
      }

      if (combinedPdfText.trim()) {
        const cleaned = normalizeCrossPlatformText(combinedPdfText.trim());
        setCustomPromptText(prev => {
          if (!prev.trim()) return cleaned;
          return prev.trim() + '\n\n' + cleaned;
        });
        soundEngine.playKeypress('mechanical', 0.5);
        handleResetTest();
      } else {
        setOcrError('PDF se readable text extract nahi ho saka. Agar PDF image/scan hai to "Upload Photos" se try karein.');
      }
    } catch (err: any) {
      console.error('PDF Read Error:', err);
      setOcrError(err?.message || 'PDF parse karne me error aayi.');
    } finally {
      setIsPdfDirectLoading(false);
      setPdfDirectProgressText('');
      if (pdfDirectInputRef.current) pdfDirectInputRef.current.value = '';
    }
  };

  const handlePdfDirectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processDirectPdfFiles(Array.from(files));
    }
  };

  // Load passages on mount
  useEffect(() => {
    const list = getPassages();
    setAvailablePassages(list);
    if (list.length > 0 && selectedPassageId === 'default') {
      setSelectedPassageId(list[0].id);
    }
  }, []);

  // Active Sheet reference
  const currentSheet = paragraphSheets[activeSheetIndex] || paragraphSheets[0];

  // Active Reference Full Text resolution (with cross-platform normalization)
  const activeFullReferenceText = useMemo(() => {
    if (evaluationMode === 'free-spellcheck') return '';
    if (selectedPassageId === 'none') return '';
    if (selectedPassageId === 'custom') return normalizeCrossPlatformText(customPromptText.trim());
    if (selectedPassageId.startsWith('suite_')) {
      const parts = selectedPassageId.split('_');
      const suiteIdx = parseInt(parts[1], 10);
      const suite = PARAGRAPH_EXERCISE_SUITES[suiteIdx];
      if (suite) {
        return normalizeCrossPlatformText(suite.paragraphs.map(p => p.sample).join('\n\n'));
      }
    }
    const found = availablePassages.find((p) => p.id === selectedPassageId);
    return found ? normalizeCrossPlatformText(found.content.trim()) : '';
  }, [evaluationMode, selectedPassageId, availablePassages, customPromptText]);

  // Reference Text split into paragraphs for Multi-Paragraph Mode
  const referenceParagraphs = useMemo(() => {
    if (!activeFullReferenceText) return [];
    const paras = activeFullReferenceText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    return paras.length > 0 ? paras : [activeFullReferenceText];
  }, [activeFullReferenceText]);

  // Target reference text for the ACTIVE editing sheet
  const activeTargetText = useMemo(() => {
    if (!activeFullReferenceText) return '';
    if (notepadMode === 'paragraph-sheets') {
      return referenceParagraphs[activeSheetIndex] || referenceParagraphs[referenceParagraphs.length - 1] || activeFullReferenceText;
    }
    return activeFullReferenceText;
  }, [activeFullReferenceText, notepadMode, referenceParagraphs, activeSheetIndex]);

  // Current typed content in the active editor
  const currentTypedText = notepadMode === 'paragraph-sheets' ? currentSheet?.content || '' : continuousContent;

  // Keep last text ref in sync
  useEffect(() => {
    lastTextValueRef.current = currentTypedText;
  }, [currentTypedText]);

  // ==========================================
  // 3. SYNCHRONIZED UNIVERSAL METRIC AGGREGATION
  // ==========================================
  // Accurately counts Words and Characters regardless of continuous vs paragraph-sheets mode!
  const compiledText = useMemo(() => {
    if (notepadMode === 'paragraph-sheets') {
      return paragraphSheets.map((s) => s.content.trim()).filter(Boolean).join('\n\n');
    }
    return continuousContent;
  }, [notepadMode, paragraphSheets, continuousContent]);

  const { totalWords, totalChars } = useMemo(() => {
    if (notepadMode === 'paragraph-sheets') {
      const chars = paragraphSheets.reduce((sum, s) => sum + s.charCount, 0);
      const words = paragraphSheets.reduce((sum, s) => sum + s.wordCount, 0);
      return { totalWords: words, totalChars: chars };
    } else {
      const normalizedContinuous = normalizeCrossPlatformText(continuousContent);
      const chars = continuousContent.length;
      const words = normalizedContinuous.trim() 
        ? normalizedContinuous.trim().split(/\s+/).filter(Boolean).length 
        : 0;
      return { totalWords: words, totalChars: chars };
    }
  }, [notepadMode, paragraphSheets, continuousContent]);

  // =========================================================================
  // 4. DUAL-ENGINE ACCURATE ERROR EVALUATION (PASSAGE & SPELL-CHECK)
  // =========================================================================
  // Evaluates errors across the FULL typed content so switching sheets never loses errors!
  const { 
    evaluatedErrors, 
    mistakeRecords, 
    charErrorsCount, 
    refWordStatuses,
    isUsingSpellChecker
  } = useMemo(() => {
    const shouldUseSpellChecker = evaluationMode === 'free-spellcheck' || !activeFullReferenceText || activeFullReferenceText.trim().length === 0;

    // Mode B: English Spell Checker & Grammar Analysis
    if (shouldUseSpellChecker) {
      const textToAnalyze = notepadMode === 'paragraph-sheets' ? compiledText : continuousContent;
      const analysis = analyzeFreeWritingErrors(textToAnalyze);
      const mistakes: UnifiedMistakeRecord[] = analysis.typoIssues.map(issue => ({
        index: issue.index,
        type: 'spelling',
        expected: issue.expected || 'Valid Word',
        typed: issue.word,
        reason: issue.reason,
      }));

      return {
        evaluatedErrors: analysis.totalErrors,
        mistakeRecords: mistakes,
        charErrorsCount: analysis.totalErrors,
        refWordStatuses: [],
        isUsingSpellChecker: true,
      };
    }

    // Mode A: High-Precision Token Alignment against official / custom passage
    // Helper function to evaluate one text chunk against a reference target chunk
    const evaluatePassageChunk = (
      typedChunk: string, 
      targetChunk: string, 
      isLiveActiveSheet: boolean
    ) => {
      const normalizedTyped = normalizeCrossPlatformText(typedChunk);
      const normalizedTarget = normalizeCrossPlatformText(targetChunk);

      const refWords = normalizedTarget.trim().split(/\s+/).filter(Boolean);
      const typedWords = normalizedTyped.trim().split(/\s+/).filter(Boolean);
      const isTypingInProgress = isLiveActiveSheet && typedChunk.length > 0 && !typedChunk.endsWith(' ') && !typedChunk.endsWith('\n');

      const chunkMistakes: UnifiedMistakeRecord[] = [];
      const wordStatuses: Array<'pending' | 'correct' | 'error' | 'active'> = new Array(refWords.length).fill('pending');
      let totalMistakes = 0;
      let charMistakes = 0;

      let tIdx = 0;
      let rIdx = 0;

      while (tIdx < typedWords.length && rIdx < refWords.length) {
        const tWord = typedWords[tIdx];
        const rWord = refWords[rIdx];
        const isCurrentActiveWord = isTypingInProgress && (tIdx === typedWords.length - 1);

        if (isCurrentActiveWord) {
          if (rWord.toLowerCase().startsWith(tWord.toLowerCase()) || rWord.startsWith(tWord)) {
            wordStatuses[rIdx] = 'active';
            tIdx++;
            rIdx++;
            continue;
          } else {
            wordStatuses[rIdx] = 'error';
            totalMistakes++;
            charMistakes += Math.max(1, Math.abs(tWord.length - rWord.length));
            chunkMistakes.push({
              index: rIdx + 1,
              type: 'typo',
              expected: rWord,
              typed: tWord,
              reason: `Mistyped word (expected "${rWord}")`,
            });
            tIdx++;
            rIdx++;
            continue;
          }
        }

        // Exact match or cross-platform normalized match
        if (tWord === rWord || tWord.toLowerCase() === rWord.toLowerCase()) {
          wordStatuses[rIdx] = 'correct';
          tIdx++;
          rIdx++;
          continue;
        }

        // Lookahead for skipped / omitted words or inserted extra words (up to 4 words window)
        let foundRefOffset = -1;
        let foundTypedOffset = -1;

        for (let offset = 1; offset <= 4; offset++) {
          if (rIdx + offset < refWords.length && typedWords[tIdx] === refWords[rIdx + offset]) {
            foundRefOffset = offset;
            break;
          }
          if (tIdx + offset < typedWords.length && typedWords[tIdx + offset] === refWords[rIdx]) {
            foundTypedOffset = offset;
            break;
          }
        }

        if (foundRefOffset !== -1) {
          // User omitted words from reference text
          for (let s = 0; s < foundRefOffset; s++) {
            wordStatuses[rIdx + s] = 'error';
            totalMistakes++;
            charMistakes += refWords[rIdx + s].length;
            chunkMistakes.push({
              index: rIdx + s + 1,
              type: 'omitted',
              expected: refWords[rIdx + s],
              typed: '[Omitted word]',
              reason: `Omitted word from test passage`,
            });
          }
          rIdx += foundRefOffset;
        } else if (foundTypedOffset !== -1) {
          // User inserted extra unauthorized words
          for (let s = 0; s < foundTypedOffset; s++) {
            totalMistakes++;
            charMistakes += typedWords[tIdx + s].length;
            chunkMistakes.push({
              index: rIdx + 1,
              type: 'extra',
              expected: '',
              typed: typedWords[tIdx + s],
              reason: `Extra unauthorized word inserted`,
            });
          }
          tIdx += foundTypedOffset;
        } else {
          // Direct typo / character mismatch
          wordStatuses[rIdx] = 'error';
          totalMistakes++;

          let diffCount = 0;
          const maxLen = Math.max(tWord.length, rWord.length);
          for (let c = 0; c < maxLen; c++) {
            if (tWord[c] !== rWord[c]) diffCount++;
          }
          charMistakes += Math.max(1, diffCount);

          chunkMistakes.push({
            index: rIdx + 1,
            type: 'typo',
            expected: rWord,
            typed: tWord,
            reason: `Typo (expected "${rWord}")`,
          });

          tIdx++;
          rIdx++;
        }
      }

      // Any remaining typed words beyond reference are extra mistakes
      while (tIdx < typedWords.length) {
        totalMistakes++;
        charMistakes += typedWords[tIdx].length;
        chunkMistakes.push({
          index: rIdx + 1,
          type: 'extra',
          expected: '',
          typed: typedWords[tIdx],
          reason: `Extra word typed beyond passage length`,
        });
        tIdx++;
      }

      if (rIdx < refWords.length && isTypingInProgress) {
        wordStatuses[rIdx] = 'active';
      }

      return {
        totalMistakes,
        charMistakes,
        chunkMistakes,
        wordStatuses
      };
    };

    // Continuous Mode Evaluation
    if (notepadMode === 'continuous') {
      const res = evaluatePassageChunk(continuousContent, activeFullReferenceText, true);
      return {
        evaluatedErrors: res.totalMistakes,
        mistakeRecords: res.chunkMistakes,
        charErrorsCount: res.charMistakes,
        refWordStatuses: res.wordStatuses,
        isUsingSpellChecker: false,
      };
    }

    // Paragraph Sheets Mode: Evaluate ALL sheets and accumulate
    let aggregatedErrors = 0;
    let aggregatedCharErrors = 0;
    const aggregatedMistakes: UnifiedMistakeRecord[] = [];
    let activeSheetWordStatuses: Array<'pending' | 'correct' | 'error' | 'active'> = [];

    paragraphSheets.forEach((sheet, idx) => {
      const targetForSheet = referenceParagraphs[idx] || referenceParagraphs[referenceParagraphs.length - 1] || activeFullReferenceText;
      const isCurrentActive = idx === activeSheetIndex;
      const res = evaluatePassageChunk(sheet.content, targetForSheet, isCurrentActive);

      aggregatedErrors += res.totalMistakes;
      aggregatedCharErrors += res.charMistakes;
      aggregatedMistakes.push(...res.chunkMistakes);

      if (isCurrentActive) {
        activeSheetWordStatuses = res.wordStatuses;
      }
    });

    return {
      evaluatedErrors: aggregatedErrors,
      mistakeRecords: aggregatedMistakes,
      charErrorsCount: aggregatedCharErrors,
      refWordStatuses: activeSheetWordStatuses,
      isUsingSpellChecker: false,
    };
  }, [
    notepadMode, 
    evaluationMode, 
    continuousContent, 
    paragraphSheets, 
    activeSheetIndex, 
    activeFullReferenceText, 
    referenceParagraphs, 
    compiledText
  ]);

  // ==========================================
  // 5. OFFICIAL TYPING EXAMINATION FORMULAS
  // ==========================================
  // High-precision speed and accuracy:
  // - Effective Elapsed Time (Minutes)
  // - Gross WPM = (Total Typed Characters / 5) / Time (Minutes)
  // - Net WPM = Gross WPM - (Total Penalty Errors / Time (Minutes))
  // - Accuracy % = (Correct Characters / Total Typed Characters) * 100%
  const effectiveElapsedSeconds = useMemo(() => {
    if (selectedDurationMinutes > 0) {
      if (isTestCompleted) {
        return Math.max(1, selectedDurationMinutes * 60);
      }
      return Math.max(1, selectedDurationMinutes * 60 - remainingSeconds);
    }
    return Math.max(1, elapsedSessionSeconds);
  }, [selectedDurationMinutes, isTestCompleted, remainingSeconds, elapsedSessionSeconds]);

  const elapsedMinutes = Math.max(effectiveElapsedSeconds / 60, 0.0167);

  // Total Official Errors: Typo Mistakes + Blocked Backspace Violations
  const totalOfficialErrors = evaluatedErrors + totalBackspaceAttempts;

  // Keystroke Standard (5 strokes = 1 word): Official CPCT / SSC / Govt Exam standard
  const calculatedGrossWpm = effectiveElapsedSeconds > 1 ? Math.round((totalChars / 5) / elapsedMinutes) : 0;
  const calculatedNetWpm = effectiveElapsedSeconds > 1 
    ? Math.max(0, Math.round(((totalChars / 5) - totalOfficialErrors) / elapsedMinutes)) 
    : 0;

  // Space-delimited Word-Based WPM (for direct word comparison)
  const wordBasedGrossWpm = effectiveElapsedSeconds > 1 ? Math.round(totalWords / elapsedMinutes) : 0;
  const wordBasedNetWpm = effectiveElapsedSeconds > 1 
    ? Math.max(0, Math.round((totalWords - totalOfficialErrors) / elapsedMinutes)) 
    : 0;

  // Accuracy Percentage
  const calculatedAccuracy = totalChars > 0 
    ? Math.max(0, Math.min(100, Math.round(((totalChars - (charErrorsCount + totalBackspaceAttempts)) / totalChars) * 100))) 
    : 100;

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('futuretrack_paragraph_sheets_v2', JSON.stringify(paragraphSheets));
  }, [paragraphSheets]);

  useEffect(() => {
    localStorage.setItem('futuretrack_notepad_draft', continuousContent);
  }, [continuousContent]);

  // =========================================================================
  // 6. HIGH-PRECISION WALL-CLOCK TICKER (100% IMMUNE TO INTERVAL DRIFT)
  // =========================================================================
  // Runs a high-frequency synchronization loop using Date.now()
  useEffect(() => {
    if (!isTestActive) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    if (!testStartTimeRef.current) {
      testStartTimeRef.current = Date.now() - (accumulatedElapsedSecRef.current * 1000);
    }

    timerIntervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const realElapsedSec = Math.floor((now - testStartTimeRef.current!) / 1000);
      accumulatedElapsedSecRef.current = realElapsedSec;

      if (selectedDurationMinutes > 0) {
        const totalDurationSec = selectedDurationMinutes * 60;
        const remaining = Math.max(0, totalDurationSec - realElapsedSec);
        setRemainingSeconds(remaining);
        setElapsedSessionSeconds(realElapsedSec);

        if (remaining <= 0) {
          // Time expired!
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          setIsTestActive(false);
          setIsTestCompleted(true);
          setShowScorecardModal(true);
          soundEngine.playCompletionBell(0.65);
        }
      } else {
        setElapsedSessionSeconds(realElapsedSec);
      }
    }, 250); // Check 4 times a second for fluid and instant countdown updates

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isTestActive, selectedDurationMinutes]);

  // Start Test Timer Helper (Works seamlessly across PC, Mac, Android, and iOS)
  const startTestTimer = () => {
    if (isTestActive || isTestCompleted) return;
    testStartTimeRef.current = Date.now() - (accumulatedElapsedSecRef.current * 1000);
    setIsTestActive(true);
  };

  // Pause Test Timer Helper
  const pauseTestTimer = () => {
    if (!isTestActive) return;
    setIsTestActive(false);
    if (testStartTimeRef.current) {
      accumulatedElapsedSecRef.current = Math.floor((Date.now() - testStartTimeRef.current) / 1000);
      testStartTimeRef.current = null;
    }
  };

  // Handle Timer Duration selection change
  const handleSelectDuration = (minutes: number) => {
    pauseTestTimer();
    setSelectedDurationMinutes(minutes);
    setIsTestCompleted(false);
    setShowScorecardModal(false);
    accumulatedElapsedSecRef.current = 0;
    testStartTimeRef.current = null;

    if (minutes > 0) {
      setRemainingSeconds(minutes * 60);
    } else {
      setRemainingSeconds(0);
      setElapsedSessionSeconds(0);
    }
  };

  // Reset Test and Timer
  const handleResetTest = () => {
    setIsTestActive(false);
    setIsTestCompleted(false);
    setShowScorecardModal(false);
    accumulatedElapsedSecRef.current = 0;
    testStartTimeRef.current = null;

    if (selectedDurationMinutes > 0) {
      setRemainingSeconds(selectedDurationMinutes * 60);
    } else {
      setRemainingSeconds(0);
      setElapsedSessionSeconds(0);
    }
    setTotalBackspaceAttempts(0);
    handleTextChange('');
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  // Trigger warning when backspace is intercepted
  const triggerBackspaceWarning = () => {
    soundEngine.playWarning(0.65);
    setTotalBackspaceAttempts((prev) => prev + 1);
    setShowWarning(true);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = window.setTimeout(() => setShowWarning(false), 2400);
  };

  // Content change updater with Mobile & Virtual Keyboard Zero-Backspace Interceptor
  const handleTextChange = (value: string) => {
    // 1. Mobile Virtual Keyboard Backspace Interception:
    // If text length decreased, a backspace or delete occurred on mobile!
    const prevText = lastTextValueRef.current;
    if (value.length < prevText.length) {
      triggerBackspaceWarning();
      // Block the deletion! Prevent text from shrinking
      return;
    }

    // 2. Auto-start test on first typed character (Crucial for Mobile & Tablets)
    if (!isTestActive && !isTestCompleted && value.trim().length > 0) {
      startTestTimer();
    }

    lastTextValueRef.current = value;

    if (notepadMode === 'paragraph-sheets') {
      const normalized = normalizeCrossPlatformText(value);
      const words = normalized.trim() ? normalized.trim().split(/\s+/).filter(Boolean) : [];
      setParagraphSheets((prev) =>
        prev.map((s, idx) =>
          idx === activeSheetIndex
            ? {
                ...s,
                content: value,
                charCount: value.length,
                wordCount: words.length,
              }
            : s
        )
      );
    } else {
      setContinuousContent(value);
    }
  };

  // Mode Switcher with Intelligent Two-Way State Synchronization
  const handleSwitchNotepadMode = (newMode: 'paragraph-sheets' | 'continuous') => {
    if (newMode === notepadMode) return;

    if (newMode === 'continuous') {
      // Sync compiled sheets content into continuous content if sheets have more text
      const compiled = paragraphSheets.map((s) => s.content.trim()).filter(Boolean).join('\n\n');
      if (compiled.length > continuousContent.length) {
        setContinuousContent(compiled);
      }
      setNotepadMode('continuous');
    } else {
      // Sync continuous content into sheet 1 if continuous has more text
      if (continuousContent.trim().length > 0) {
        const words = normalizeCrossPlatformText(continuousContent).trim().split(/\s+/).filter(Boolean);
        setParagraphSheets((prev) => [
          {
            ...prev[0],
            content: continuousContent,
            charCount: continuousContent.length,
            wordCount: words.length,
          },
          ...prev.slice(1),
        ]);
      }
      setNotepadMode('paragraph-sheets');
      setActiveTab('notepad');
    }
  };

  // Create a brand new notepad for the next paragraph
  const handleCreateNextParagraphNotepad = () => {
    setParagraphSheets((prev) => {
      const updated = prev.map((s, idx) =>
        idx === activeSheetIndex ? { ...s, isCompleted: true } : s
      );

      const nextNum = updated.length + 1;
      const newSheet: ParagraphSheet = {
        id: `sheet_${Date.now()}`,
        paragraphNumber: nextNum,
        content: '',
        wordCount: 0,
        charCount: 0,
        backspaceCount: 0,
        elapsedSeconds: 0,
        promptGuidance: `Paragraph ${nextNum}: Type your next paragraph here without backspace...`,
        isCompleted: false,
      };

      return [...updated, newSheet];
    });

    setActiveSheetIndex(paragraphSheets.length);
    soundEngine.playKeypress('mechanical', 0.6);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Load a structured multi-paragraph exercise suite
  const handleLoadExerciseSuite = (suite: typeof PARAGRAPH_EXERCISE_SUITES[0], suiteIdx: number) => {
    const newSheets: ParagraphSheet[] = suite.paragraphs.map((p, idx) => ({
      id: `suite_${Date.now()}_${idx}`,
      paragraphNumber: idx + 1,
      content: '',
      wordCount: 0,
      charCount: 0,
      backspaceCount: 0,
      elapsedSeconds: 0,
      promptGuidance: p.prompt,
      isCompleted: false,
    }));

    setParagraphSheets(newSheets);
    setActiveSheetIndex(0);
    setActiveTab('notepad');
    setNotepadMode('paragraph-sheets');
    setEvaluationMode('passage-copy');
    setSelectedPassageId(`suite_${suiteIdx}`);
    setShowReferenceBox(true);
    handleResetTest();
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  // Delete a paragraph sheet
  const handleDeleteSheet = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (paragraphSheets.length <= 1) {
      handleTextChange('');
      return;
    }
    if (window.confirm(`Delete Paragraph ${idx + 1} notepad sheet?`)) {
      const nextSheets = paragraphSheets
        .filter((_, i) => i !== idx)
        .map((s, newIdx) => ({
          ...s,
          paragraphNumber: newIdx + 1,
        }));
      setParagraphSheets(nextSheets);
      setActiveSheetIndex(Math.max(0, Math.min(activeSheetIndex, nextSheets.length - 1)));
    }
  };

  // Keyboard Handler (Strict Zero Backspace + Auto Timer Start)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isTestCompleted && selectedDurationMinutes > 0) {
      e.preventDefault();
      return;
    }

    // Auto-start timer on first printable keypress (Desktop)
    if (!isTestActive && (e.key.length === 1 || e.key === 'Enter')) {
      startTestTimer();
    }

    // 1. Strict Backspace / Delete Blocker
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      e.stopPropagation();
      triggerBackspaceWarning();
      return;
    }

    // 2. Block Cut (Ctrl+X) and Select-all Delete
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
      e.preventDefault();
      e.stopPropagation();
      triggerBackspaceWarning();
      return;
    }

    // 3. Quick shortcut to create next paragraph notepad: Ctrl + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCreateNextParagraphNotepad();
      return;
    }

    // Audio click feedback
    if (e.key.length === 1 || e.key === 'Enter') {
      soundEngine.playKeypress(soundType, 0.45);
    }
  };

  // Copy compiled text
  const handleCopyCompiled = async () => {
    const textToCopy = notepadMode === 'paragraph-sheets' ? compiledText : continuousContent;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Download compiled text as .txt
  const handleDownloadTxt = () => {
    const textToDownload = notepadMode === 'paragraph-sheets' ? compiledText : continuousContent;
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `futuretrack_notepad_document_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all paragraph notepads and restart?')) {
      setParagraphSheets([
        {
          id: `sheet_${Date.now()}`,
          paragraphNumber: 1,
          content: '',
          wordCount: 0,
          charCount: 0,
          backspaceCount: 0,
          elapsedSeconds: 0,
          promptGuidance: 'Paragraph 1: Start your opening paragraph...',
          isCompleted: false,
        },
      ]);
      setActiveSheetIndex(0);
      setContinuousContent('');
      handleResetTest();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getThemeClass = () => {
    switch (notepadTheme) {
      case 'paper':
        return 'bg-amber-50/40 text-slate-900 border-amber-200/80 shadow-inner';
      case 'warm':
        return 'bg-[#fcf8f2] text-amber-950 border-amber-300 shadow-inner';
      case 'dark':
        return 'bg-slate-950 text-slate-100 border-slate-800 shadow-inner';
      default:
        return 'bg-white text-slate-900 border-slate-200 shadow-inner';
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'large':
        return 'text-lg leading-relaxed';
      case 'xlarge':
        return 'text-xl leading-loose';
      default:
        return 'text-base leading-normal';
    }
  };

  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case 'mono':
        return 'font-mono';
      case 'serif':
        return 'font-serif';
      default:
        return 'font-sans';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`max-w-6xl mx-auto px-4 py-8 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-6 overflow-y-auto' : ''
      }`}
    >
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              Proctored Zero-Backspace Exam Studio
            </span>
            <span className="text-xs text-slate-400 font-medium">Universal Hardware-Synced Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
            <FileEdit className="w-7 h-7 text-blue-600" />
            Notepad Without Backspace
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Official timed test mode with live error counting, word-level verification, English dictionary spell-checking, and zero backspace tolerance across all devices!
          </p>
        </div>

        {/* Global Aggregate Metrics Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timer Display Badge */}
          <div className={`px-4 py-2 rounded-2xl border text-center shadow-sm min-w-[105px] transition-all ${
            isTestActive 
              ? 'bg-blue-600 text-white border-blue-700 animate-pulse' 
              : isTestCompleted 
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : 'bg-slate-900 text-white border-slate-900'
          }`}>
            <div className="text-[10px] uppercase font-extrabold tracking-wider opacity-80 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              {selectedDurationMinutes > 0 ? 'Countdown' : 'Stopwatch'}
            </div>
            <div className="text-xl font-black font-mono mt-0.5 tracking-wider">
              {selectedDurationMinutes > 0 ? formatTime(remainingSeconds) : formatTime(elapsedSessionSeconds)}
            </div>
          </div>

          {/* Gross WPM */}
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl text-center" title={`Raw Keystroke Speed: (${totalChars} chars / 5) / ${(effectiveElapsedSeconds / 60).toFixed(2)} min`}>
            <div className="text-[10px] uppercase font-bold text-slate-500">Gross WPM</div>
            <div className="text-lg font-black font-mono text-slate-900">{calculatedGrossWpm}</div>
          </div>

          {/* Net WPM */}
          <div className="bg-blue-50/80 border-2 border-blue-500 px-3.5 py-2 rounded-2xl text-center shadow-xs" title={`Official Qualifying Speed: Gross WPM - (${totalOfficialErrors} errors / ${(effectiveElapsedSeconds / 60).toFixed(2)} min)`}>
            <div className="text-[10px] uppercase font-extrabold text-blue-700 flex items-center justify-center gap-0.5">
              <Zap className="w-3 h-3 text-blue-600" />
              Net WPM
            </div>
            <div className="text-lg font-black font-mono text-blue-700">{calculatedNetWpm}</div>
          </div>

          {/* Accuracy */}
          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-2xl text-center" title="Typing accuracy percentage">
            <div className="text-[10px] uppercase font-bold text-emerald-700 flex items-center justify-center gap-0.5">
              <Target className="w-3 h-3 text-emerald-600" />
              Accuracy
            </div>
            <div className="text-lg font-black font-mono text-emerald-700">{calculatedAccuracy}%</div>
          </div>

          {/* Real Errors Count Badge */}
          <div className="bg-rose-50 border-2 border-rose-500 px-3.5 py-2 rounded-2xl text-center">
            <div className="text-[10px] uppercase font-extrabold text-rose-700 flex items-center justify-center gap-0.5">
              <XCircle className="w-3 h-3 text-rose-600" />
              Errors
            </div>
            <div className="text-lg font-black font-mono text-rose-700" title={`Typos: ${evaluatedErrors}, Blocked Backspaces: ${totalBackspaceAttempts}`}>
              {totalOfficialErrors}
            </div>
          </div>

          {/* Total Words / Characters */}
          <div className="bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-2xl text-center">
            <div className="text-[10px] uppercase font-bold text-indigo-700">Words / Chars</div>
            <div className="text-sm font-black font-mono text-indigo-900 mt-0.5">
              {totalWords} <span className="text-[10px] font-normal text-indigo-600">w</span> · {totalChars} <span className="text-[10px] font-normal text-indigo-600">c</span>
            </div>
          </div>

          {/* Blocked Backspaces */}
          <div className="bg-amber-50 border border-amber-300 px-3 py-2 rounded-2xl text-center">
            <div className="text-[10px] uppercase font-bold text-amber-800">Backspace</div>
            <div className="text-lg font-black font-mono text-amber-800">{totalBackspaceAttempts}</div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 1. TIMER CONTROLLER & TEST DURATION SELECTION STRIP  */}
      {/* ==================================================== */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-blue-700/40 no-print">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                Examination Timer Control
              </span>
              {isTestActive ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/40 animate-pulse">
                  TEST IN PROGRESS
                </span>
              ) : isTestCompleted ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-extrabold border border-rose-500/40">
                  TIME EXPIRED · COMPLETED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-[10px] font-medium">
                  READY · STARTS ON 1ST KEYSTROKE
                </span>
              )}
            </div>
            <div className="text-sm font-semibold text-white mt-0.5">
              Choose your official test duration:
            </div>
          </div>
        </div>

        {/* Duration Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Duration dropdown */}
          <div className="relative">
            <select
              value={selectedDurationMinutes}
              onChange={(e) => handleSelectDuration(parseInt(e.target.value, 10))}
              disabled={isTestActive}
              className="appearance-none bg-slate-800/90 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2.5 pr-8 rounded-xl border border-blue-400/40 outline-none cursor-pointer focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
            >
              {TIMER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                  ⏱ {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-blue-300 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Quick preset buttons */}
          <div className="hidden sm:flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/10">
            {[1, 2, 5, 10, 15].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleSelectDuration(m)}
                disabled={isTestActive}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedDurationMinutes === m
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                } disabled:opacity-40`}
              >
                {m}m
              </button>
            ))}
          </div>

          {/* Start / Pause / Reset Buttons */}
          <div className="flex items-center gap-2 ml-1">
            <button
              type="button"
              onClick={() => {
                if (isTestActive) {
                  pauseTestTimer();
                } else {
                  startTestTimer();
                }
              }}
              disabled={isTestCompleted}
              className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
                isTestActive
                  ? 'bg-amber-400 hover:bg-amber-300 text-amber-950'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
              } disabled:opacity-40`}
            >
              {isTestActive ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Start Test
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetTest}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition cursor-pointer"
              title="Reset Test & Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. DUAL-MODE TEST SELECTOR STRIP                     */}
      {/* ==================================================== */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 mb-4 flex flex-col sm:flex-row items-center justify-between gap-2 no-print">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setEvaluationMode('passage-copy');
              if (selectedPassageId === 'none' && availablePassages.length > 0) {
                setSelectedPassageId(availablePassages[0].id);
              }
              setShowReferenceBox(true);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer flex-1 sm:flex-initial ${
              evaluationMode === 'passage-copy'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-transparent text-slate-700 hover:bg-white/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Mode A: Exam Passage Copy-Typing</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEvaluationMode('free-spellcheck');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer flex-1 sm:flex-initial ${
              evaluationMode === 'free-spellcheck'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-transparent text-slate-700 hover:bg-white/60'
            }`}
          >
            <SpellCheck className="w-4 h-4" />
            <span>Mode B: Free Typing & Essay (Live Spell-Checker)</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-2">
          {evaluationMode === 'passage-copy' 
            ? 'Verifies each word against official examination passage'
            : 'English dictionary checks your spelling & grammar in real-time'}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 3. REFERENCE PASSAGE BOX (FOR MODE A)                */}
      {/* ==================================================== */}
      {evaluationMode === 'passage-copy' && (
        <div className="bg-white rounded-3xl p-5 border-2 border-blue-200 shadow-sm mb-6 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 font-heading">
                    Reference Examination Passage
                    {notepadMode === 'paragraph-sheets' && referenceParagraphs.length > 1 && (
                      <span className="ml-2 text-xs font-semibold text-blue-600">
                        (Target for Sheet #{activeSheetIndex + 1})
                      </span>
                    )}
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                    Target Script
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Select an official passage or upload hardcopy photos / paste custom text.
                </p>
              </div>
            </div>

            {/* Passage Selection Dropdown & Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedPassageId}
                  onChange={(e) => {
                    setSelectedPassageId(e.target.value);
                    handleResetTest();
                  }}
                  className="appearance-none bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 pr-8 outline-none focus:ring-2 focus:ring-blue-500 max-w-[240px] sm:max-w-[300px] md:max-w-[360px] truncate cursor-pointer shadow-xs transition"
                >
                  <optgroup label="Custom Input / OCR Scan">
                    <option value="custom">✏️ Enter Custom Test Text / Photo OCR...</option>
                  </optgroup>
                  <optgroup label="⭐ Newly Added Exam Passages (Top Priority)">
                    {availablePassages.filter(p => !p.id.startsWith('passage-easy') && !p.id.startsWith('passage-med') && !p.id.startsWith('passage-hard')).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.wordCount || p.content.split(/\s+/).filter(Boolean).length} words)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Standard Practice Passages (Previous)">
                    {availablePassages.filter(p => p.id.startsWith('passage-easy') || p.id.startsWith('passage-med') || p.id.startsWith('passage-hard')).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.wordCount || p.content.split(/\s+/).filter(Boolean).length} words)
                      </option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>


              <button
                type="button"
                onClick={() => setShowReferenceBox((prev) => !prev)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs transition cursor-pointer"
                title={showReferenceBox ? 'Hide reference text' : 'Show reference text'}
              >
                {showReferenceBox ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Custom Textarea & Multi-Image Hardcopy Upload (High-Speed Auto-OCR) */}
          {selectedPassageId === 'custom' && (
            <div className="mt-3 p-4 bg-gradient-to-br from-amber-50/80 via-blue-50/20 to-slate-50 rounded-2xl border-2 border-amber-300 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <Images className="w-4 h-4" />
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-slate-900 block">
                      Custom Target Script (Multi-Page Photo OCR & Text Paste)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Upload hardcopy photos or paste text. Normalized for Windows, Mac, Linux, and Mobile.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Hidden Multi-File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFileChange}
                    className="hidden"
                  />

                  {/* Hidden PDF Direct Input */}
                  <input
                    ref={pdfDirectInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    multiple
                    onChange={handlePdfDirectChange}
                    className="hidden"
                  />

                  {/* Multi-Image Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isOcrLoading || isPdfDirectLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                    title="Upload single or multiple document photos at once"
                  >
                    {isOcrLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Extracting Pages...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>📷 Upload Photos</span>
                      </>
                    )}
                  </button>

                  {/* Direct PDF to Text Button */}
                  <button
                    type="button"
                    onClick={() => pdfDirectInputRef.current?.click()}
                    disabled={isOcrLoading || isPdfDirectLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                    title="Upload PDF document to extract text directly into target"
                  >
                    {isPdfDirectLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Reading PDF...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>📄 Upload PDF Text</span>
                      </>
                    )}
                  </button>

                  {/* Add PDF to Passages Catalog Modal Button */}
                  <button
                    type="button"
                    onClick={() => setIsPdfModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Add PDF as reusable paragraphs to library so anyone can take test"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-700" />
                    <span>Add to Library</span>
                  </button>

                  {availablePassages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPassageId(availablePassages[0].id);
                        handleResetTest();
                      }}
                      className="text-[11px] font-bold text-slate-600 hover:text-blue-600 hover:underline px-1 py-1 cursor-pointer"
                    >
                      Use standard passage →
                    </button>
                  )}
                </div>
              </div>

              {/* OCR Fast Scanning Progress Animation */}
              {isOcrLoading && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 animate-pulse">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-blue-900 flex items-center justify-between">
                      <span>{ocrProgressText || 'Extracting text from document images at high speed...'}</span>
                      <span className="font-mono">{ocrProgressPercent}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-200"
                        style={{ width: `${ocrProgressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Direct PDF Reading Progress Animation */}
              {isPdfDirectLoading && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 animate-pulse">
                  <Loader2 className="w-5 h-5 text-rose-600 animate-spin shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-rose-900">
                      {pdfDirectProgressText || 'Extracting text from PDF document...'}
                    </div>
                    <div className="text-[11px] text-rose-600">
                      Processing PDF pages and formatting into examination target script...
                    </div>
                  </div>
                </div>
              )}

              {/* OCR Error Notice */}
              {ocrError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{ocrError}</span>
                  </div>
                  <button 
                    onClick={() => setOcrError(null)}
                    className="text-rose-500 hover:text-rose-700 font-bold px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Multi-Image Thumbnails Gallery Strip */}
              {uploadedImagesList.length > 0 && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Images className="w-3.5 h-3.5 text-blue-600" />
                      Uploaded Document Pages ({uploadedImagesList.length}):
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isOcrLoading}
                        className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer disabled:opacity-50"
                      >
                        + Add More Pages
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadedImagesList([])}
                        className="text-[11px] text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        Clear Images
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                    {uploadedImagesList.map((item, idx) => (
                      <div 
                        key={item.id} 
                        className="relative group shrink-0 rounded-lg overflow-hidden border border-slate-200 shadow-2xs bg-slate-50"
                      >
                        <img 
                          src={item.preview} 
                          alt={`Page ${idx + 1}`} 
                          className="w-16 h-16 object-cover" 
                        />
                        <div className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-mono px-1 py-0.2 rounded font-bold">
                          #{idx + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(item.id)}
                          className="absolute top-1 right-1 bg-rose-600/90 hover:bg-rose-700 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          title="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drag & Drop Multi-Image Container + Textarea */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
                  if (files.length > 0) {
                    processImageFiles(files);
                  }
                }}
                className="relative"
              >
                <textarea
                  value={customPromptText}
                  onChange={(e) => setCustomPromptText(e.target.value)}
                  placeholder="Paste your examination paragraph here, or drag & drop multiple hardcopy photos/scans into this area..."
                  rows={4}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-amber-300 bg-white outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed shadow-inner"
                />
                {customPromptText.trim().length > 0 && (
                  <div className="absolute right-3 bottom-3 flex items-center gap-2 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200 text-[10px] font-mono text-slate-600 shadow-xs">
                    <span>{normalizeCrossPlatformText(customPromptText).trim().split(/\s+/).filter(Boolean).length} target words</span>
                    <span>·</span>
                    <span>{customPromptText.length} characters</span>
                  </div>
                )}
              </div>

              {/* Footer status / helper info */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-1.5 pt-0.5">
                <span className="flex items-center gap-1 text-slate-500">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Fast Batch Scanning: Select multiple pages at once. Pre-compressed for rapid 2-second extraction.
                </span>
                {customPromptText.trim().length > 0 ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Target ready! Scroll down and begin typing.
                  </span>
                ) : (
                  <span className="text-amber-700 font-medium">
                    Upload images or paste text to set your target passage.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Live Reference Passage Viewer with Intelligent Word-by-Word Highlighting */}
          {showReferenceBox && activeTargetText && (
            <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 max-h-52 overflow-y-auto font-mono text-sm leading-relaxed select-none">
              <div className="flex flex-wrap gap-x-1.5 gap-y-1">
                {activeTargetText.split(/\s+/).filter(Boolean).map((word, wIdx) => {
                  const status = refWordStatuses[wIdx] || 'pending';

                  if (status === 'correct') {
                    return (
                      <span key={wIdx} className="text-emerald-700 font-bold bg-emerald-100/60 px-1 py-0.5 rounded">
                        {word}
                      </span>
                    );
                  }

                  if (status === 'error') {
                    return (
                      <span 
                        key={wIdx} 
                        className="bg-rose-500 text-white font-extrabold px-1 py-0.5 rounded shadow-xs"
                        title="Typo or mismatch in this word"
                      >
                        {word}
                      </span>
                    );
                  }

                  if (status === 'active') {
                    return (
                      <span key={wIdx} className="bg-blue-600 text-white font-extrabold px-1.5 py-0.5 rounded shadow-sm ring-2 ring-blue-400 animate-pulse">
                        {word}
                      </span>
                    );
                  }

                  return (
                    <span key={wIdx} className="text-slate-500 opacity-65">
                      {word}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Error Breakdown Strip */}
          <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                Sahi Words: {Math.max(0, currentTypedText.trim().split(/\s+/).filter(Boolean).length - evaluatedErrors)}
              </span>
              <span className="flex items-center gap-1.5 font-bold text-rose-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                Typo Mistakes: {evaluatedErrors}
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                Blocked Backspaces: {totalBackspaceAttempts}
              </span>
            </div>

            {activeTargetText ? (
              <div className="text-slate-400 font-mono text-[11px]">
                Sheet Words: {currentTypedText.trim().split(/\s+/).filter(Boolean).length} / {activeTargetText.split(/\s+/).filter(Boolean).length}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. LIVE SPELL-CHECKER INFO BOX (FOR MODE B)          */}
      {/* ==================================================== */}
      {(evaluationMode === 'free-spellcheck' || isUsingSpellChecker) && (
        <div className="bg-white rounded-3xl p-5 border-2 border-indigo-200 shadow-sm mb-6 no-print">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <SpellCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Live English Spell-Checker & Grammar Validator
                </h3>
                <p className="text-xs text-slate-500">
                  Every word you type in the notepad is checked against standard English vocabulary.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                {evaluatedErrors} Typos Detected
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notepad Mode Switcher (Always New Notepad per Paragraph vs Continuous Single Page) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 no-print">
        {/* Paragraph Sheets Mode Switcher */}
        <div className="inline-flex rounded-xl p-1 bg-slate-200/80 border border-slate-300 text-xs font-bold">
          <button
            onClick={() => handleSwitchNotepadMode('paragraph-sheets')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              notepadMode === 'paragraph-sheets'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Always New Notepad Per Paragraph
          </button>
          <button
            onClick={() => handleSwitchNotepadMode('continuous')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              notepadMode === 'continuous'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            Continuous Single Page
          </button>
        </div>

        {/* View mode in paragraph-sheets: Edit Active Sheet vs View Full Compiled Document */}
        {notepadMode === 'paragraph-sheets' && (
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('notepad')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'notepad' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-600'
              }`}
            >
              Active Paragraph Sheet
            </button>
            <button
              onClick={() => setActiveTab('compiled')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'compiled' ? 'bg-white shadow text-blue-700 font-bold' : 'text-slate-600'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Compiled Document ({totalWords} words)
            </button>
          </div>
        )}
      </div>

      {/* Paragraph Sheets Tab Strip (Always New Notepad per Paragraph) */}
      {notepadMode === 'paragraph-sheets' && activeTab === 'notepad' && (
        <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-xs mb-4 flex items-center gap-2 overflow-x-auto no-print">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pl-2 shrink-0 flex items-center gap-1">
            <ListOrdered className="w-3.5 h-3.5" />
            Sheets:
          </span>

          <div className="flex items-center gap-1.5 flex-1 overflow-x-auto py-0.5">
            {paragraphSheets.map((sheet, index) => {
              const isActive = index === activeSheetIndex;
              const hasText = sheet.wordCount > 0;
              return (
                <button
                  key={sheet.id}
                  onClick={() => {
                    setActiveSheetIndex(index);
                    setTimeout(() => textareaRef.current?.focus(), 50);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 border cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : hasText
                      ? 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Paragraph {sheet.paragraphNumber}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                      isActive ? 'bg-blue-700 text-white' : 'bg-black/5 text-slate-600'
                    }`}
                  >
                    {sheet.wordCount}w
                  </span>
                  {paragraphSheets.length > 1 && (
                    <span
                      onClick={(e) => handleDeleteSheet(index, e)}
                      className="ml-0.5 text-slate-400 hover:text-rose-500 rounded p-0.5"
                      title="Delete Sheet"
                    >
                      ×
                    </span>
                  )}
                </button>
              );
            })}

            {/* "+ New Paragraph Notepad" Button */}
            <button
              onClick={handleCreateNextParagraphNotepad}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Add a fresh new notepad for the next paragraph"
            >
              <Plus className="w-3.5 h-3.5" />
              + New Paragraph Notepad
            </button>
          </div>
        </div>
      )}

      {/* Warning Toast */}
      {showWarning && (
        <div className="mb-4 p-4 bg-rose-600 text-white rounded-2xl shadow-xl flex items-center justify-between animate-bounce border border-rose-700 no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-800/80 flex items-center justify-center font-bold text-lg">
              ⚠
            </div>
            <div>
              <div className="font-extrabold text-sm uppercase tracking-wide">
                Backspace Disabled in this Notepad!
              </div>
              <div className="text-xs text-rose-100">
                You cannot delete previously typed characters. Maintain your cadence and continue typing forward.
              </div>
            </div>
          </div>
          <div className="bg-rose-900/90 px-3 py-1 rounded-lg text-xs font-mono font-bold">
            Blocked keystroke #{totalBackspaceAttempts}
          </div>
        </div>
      )}

      {/* Editor Controls Toolbar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs mb-3 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
        {/* Font Family & Sizing */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 uppercase">Font:</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setFontFamily('mono')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                fontFamily === 'mono'
                  ? 'bg-white shadow text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mono
            </button>
            <button
              onClick={() => setFontFamily('sans')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                fontFamily === 'sans'
                  ? 'bg-white shadow text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sans
            </button>
            <button
              onClick={() => setFontFamily('serif')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                fontFamily === 'serif'
                  ? 'bg-white shadow text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Serif
            </button>
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 ml-1">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-2 py-1 rounded-md text-xs transition cursor-pointer ${
                fontSize === 'normal' ? 'bg-white shadow font-bold text-blue-700' : 'text-slate-600'
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-2 py-1 rounded-md text-sm transition cursor-pointer ${
                fontSize === 'large' ? 'bg-white shadow font-bold text-blue-700' : 'text-slate-600'
              }`}
            >
              A+
            </button>
          </div>

          {/* Theme */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 ml-1">
            <button
              onClick={() => setNotepadTheme('paper')}
              className={`px-2 py-1 rounded-md text-xs transition cursor-pointer ${
                notepadTheme === 'paper' ? 'bg-amber-100 font-bold text-amber-900 shadow' : 'text-slate-600'
              }`}
              title="Lined Notepad Paper"
            >
              Paper
            </button>
            <button
              onClick={() => setNotepadTheme('clean')}
              className={`px-2 py-1 rounded-md text-xs transition cursor-pointer ${
                notepadTheme === 'clean' ? 'bg-white font-bold text-slate-900 shadow' : 'text-slate-600'
              }`}
              title="Clean White"
            >
              Clean
            </button>
            <button
              onClick={() => setNotepadTheme('warm')}
              className={`px-2 py-1 rounded-md text-xs transition cursor-pointer ${
                notepadTheme === 'warm' ? 'bg-[#f5ecdd] font-bold text-amber-950 shadow' : 'text-slate-600'
              }`}
              title="Warm Sepia"
            >
              Sepia
            </button>
            <button
              onClick={() => setNotepadTheme('dark')}
              className={`px-2 py-1 rounded-md text-xs transition cursor-pointer ${
                notepadTheme === 'dark' ? 'bg-slate-800 font-bold text-white shadow' : 'text-slate-600'
              }`}
              title="Night Focus"
            >
              Night
            </button>
          </div>

          {/* Mechanical Switch Sound Toggle */}
          <button
            onClick={() => {
              const next: SoundEffectType =
                soundType === 'mechanical'
                  ? 'thock'
                  : soundType === 'thock'
                  ? 'typewriter'
                  : soundType === 'typewriter'
                  ? 'silent'
                  : 'mechanical';
              setSoundType(next);
              soundEngine.playKeypress(next, 0.5);
            }}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-1.5 transition ml-1 cursor-pointer"
            title="Switch mechanical switch sound"
          >
            {soundType === 'silent' ? (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span className="capitalize">{soundType}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Finish & View Scorecard Button */}
          {totalChars > 0 && (
            <button
              onClick={() => {
                pauseTestTimer();
                setIsTestCompleted(true);
                setShowScorecardModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Scorecard</span>
            </button>
          )}

          <button
            onClick={handleCopyCompiled}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Copy compiled text"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-500" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button
            onClick={handleDownloadTxt}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Download text file (.txt)"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Download
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Print transcript"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print
          </button>

          <button
            onClick={handleClearAll}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
            title="Clear all notepads"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Zen Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Notepad Body: Active Sheet View */}
      {activeTab === 'notepad' && (
        <div className={`rounded-3xl border-2 p-6 sm:p-8 transition-all relative ${getThemeClass()}`}>
          {/* Visual Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 mb-4 border-current/15 text-xs gap-2">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-current/20 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-current/20 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-current/20 inline-block"></span>
              </div>
              <span className="font-bold tracking-wider uppercase opacity-75 flex items-center gap-1.5">
                {notepadMode === 'paragraph-sheets' ? (
                  <>
                    <Layers className="w-3.5 h-3.5" />
                    <span>SHEET #{currentSheet?.paragraphNumber || 1} · PARAGRAPH {currentSheet?.paragraphNumber || 1}</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>CONTINUOUS ZERO-BACKSPACE NOTEPAD</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-3 opacity-75 font-mono text-[11px]">
              <span>
                Sheet Words: <strong>{notepadMode === 'paragraph-sheets' ? currentSheet?.wordCount : normalizeCrossPlatformText(continuousContent).trim().split(/\s+/).filter(Boolean).length}</strong>
              </span>
              <span>·</span>
              <span>
                Characters: <strong>{notepadMode === 'paragraph-sheets' ? currentSheet?.charCount : continuousContent.length}</strong>
              </span>
            </div>
          </div>

          {/* Optional Prompt Guidance for this paragraph */}
          {notepadMode === 'paragraph-sheets' && currentSheet?.promptGuidance && (
            <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs opacity-90">
              <span className="font-bold text-blue-600 uppercase tracking-wide mr-1.5">Prompt:</span>
              <span>{currentSheet.promptGuidance}</span>
            </div>
          )}

          {/* Dedicated Textarea for this Paragraph */}
          <textarea
            ref={textareaRef}
            value={notepadMode === 'paragraph-sheets' ? currentSheet?.content || '' : continuousContent}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTestCompleted && selectedDurationMinutes > 0}
            placeholder={
              isTestCompleted
                ? 'Time has expired for this test session! View your final scorecard above or click "Reset Test" to retake.'
                : notepadMode === 'paragraph-sheets'
                ? `Type Paragraph ${currentSheet?.paragraphNumber || 1} here...\n\nRemember: Backspace & Delete are disabled. Timer starts automatically on your first keystroke. When you finish this paragraph, click "+ New Paragraph Notepad" (or press Ctrl + Enter) for the next paragraph!`
                : 'Start typing your continuous essay or transcript here...\n\nRemember: Backspace & Delete are completely disabled. Timer starts automatically on your first keystroke. Commit every keystroke forward with steady focus.'
            }
            rows={isFullscreen ? 24 : 14}
            spellCheck={false}
            className={`w-full bg-transparent resize-y outline-none transition-colors border-none p-0 ${getFontFamilyClass()} ${getFontSizeClass()} ${
              isTestCompleted && selectedDurationMinutes > 0 ? 'opacity-80 cursor-not-allowed' : ''
            }`}
            style={{
              lineHeight: notepadTheme === 'paper' ? '2.2rem' : undefined,
              backgroundImage:
                notepadTheme === 'paper'
                  ? 'repeating-linear-gradient(transparent, transparent 2.1rem, rgba(0, 0, 0, 0.06) 2.1rem, rgba(0, 0, 0, 0.06) 2.2rem)'
                  : undefined,
            }}
          />

          {/* Bottom Actions Bar */}
          <div className="mt-4 pt-3 border-t border-current/10 flex flex-col sm:flex-row items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-1.5 opacity-75">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Anti-Correction Active: Backspace & Delete produce zero deletion on PC, Mac, Laptop & Mobile.</span>
            </div>

            {/* Paragraph Completion Button */}
            {notepadMode === 'paragraph-sheets' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateNextParagraphNotepad}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Finish & Open New Paragraph Notepad</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compiled Multi-Paragraph Document View */}
      {activeTab === 'compiled' && notepadMode === 'paragraph-sheets' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 mb-6 gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                Compiled Document (All Paragraphs)
              </h3>
              <p className="text-xs text-slate-500">
                All individual paragraph notepads assembled into a unified document.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCompiled}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                {copied ? 'Copied' : 'Copy All'}
              </button>
              <button
                onClick={handleDownloadTxt}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download Document
              </button>
            </div>
          </div>

          {compiledText ? (
            <div className="space-y-6 font-serif text-base sm:text-lg leading-relaxed text-slate-800">
              {paragraphSheets.map((s) => (
                <div key={s.id} className="relative pl-6 border-l-2 border-blue-200">
                  <span className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center font-mono">
                    {s.paragraphNumber}
                  </span>
                  <p className="whitespace-pre-wrap">{s.content || <span className="italic text-slate-400">[Empty paragraph sheet]</span>}</p>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    Paragraph {s.paragraphNumber} · {s.wordCount} words · {s.charCount} chars
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              No paragraphs typed yet. Switch back to the Active Paragraph Sheet and start typing!
            </div>
          )}
        </div>
      )}

      {/* Multi-Paragraph Exercise Suites & Templates */}
      <div className="mt-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs no-print">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Structured Multi-Paragraph Writing Suites
            </h3>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Loads individual sequential notepads for each paragraph
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PARAGRAPH_EXERCISE_SUITES.map((suite, sIdx) => (
            <div
              key={sIdx}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mb-2">
                  {suite.category} · {suite.paragraphs.length} Paragraph Notepads
                </span>
                <h4 className="text-sm font-bold text-slate-900 mb-1.5">{suite.title}</h4>
                <ul className="text-xs text-slate-600 space-y-1 mb-4 list-disc pl-4">
                  {suite.paragraphs.map((p, pIdx) => (
                    <li key={pIdx} className="line-clamp-1">
                      {p.prompt}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleLoadExerciseSuite(suite, sIdx)}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 text-slate-800 hover:text-blue-700 font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Load This Multi-Paragraph Suite</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 5. TEST SCORECARD MODAL (POPS UP ON TEST COMPLETION) */}
      {/* ==================================================== */}
      {showScorecardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm no-print">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-xs">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 font-heading">
                    Examination Scorecard
                  </h3>
                  <div className="text-xs text-slate-500">
                    No-Backspace Proctored Notepad · {isUsingSpellChecker ? 'English Spell-Check Mode' : 'Passage Verification Mode'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowScorecardModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scorecard Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Net WPM */}
              <div className="bg-blue-50/80 border-2 border-blue-600 rounded-2xl p-4 text-center">
                <div className="text-[10px] font-extrabold text-blue-800 uppercase flex items-center justify-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  Net WPM
                </div>
                <div className="text-3xl font-black text-blue-700 font-mono mt-1">
                  {calculatedNetWpm}
                </div>
                <div className="text-[10px] text-blue-600 mt-0.5">Qualifying Speed</div>
              </div>

              {/* Gross WPM */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Gross WPM</div>
                <div className="text-3xl font-black text-slate-800 font-mono mt-1">
                  {calculatedGrossWpm}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Raw Keystrokes/5</div>
              </div>

              {/* Accuracy */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-center col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold text-emerald-800 uppercase flex items-center justify-center gap-1">
                  <Target className="w-3.5 h-3.5 text-emerald-600" />
                  Accuracy
                </div>
                <div className="text-3xl font-black text-emerald-700 font-mono mt-1">
                  {calculatedAccuracy}%
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">Typing Precision</div>
              </div>

              {/* Total Typo Errors */}
              <div className="bg-rose-50 border border-rose-300 rounded-2xl p-3 text-center">
                <div className="text-[10px] font-bold text-rose-700 uppercase flex items-center justify-center gap-1">
                  <XCircle className="w-3 h-3 text-rose-600" />
                  Typo Mistakes
                </div>
                <div className="text-2xl font-black text-rose-700 font-mono mt-1">
                  {evaluatedErrors}
                </div>
                <div className="text-[10px] text-rose-500 mt-0.5">Word/spelling errors</div>
              </div>

              {/* Blocked Backspaces */}
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-center">
                <div className="text-[10px] font-bold text-amber-800 uppercase">Blocked Backspace</div>
                <div className="text-2xl font-black text-amber-800 font-mono mt-1">
                  {totalBackspaceAttempts}
                </div>
                <div className="text-[10px] text-amber-600 mt-0.5">Zero tolerance</div>
              </div>

              {/* Duration / Words */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Words / Chars</div>
                <div className="text-lg font-black text-slate-900 font-mono mt-1">
                  {totalWords} <span className="text-xs font-normal text-slate-500">w</span> / {totalChars} <span className="text-xs font-normal text-slate-500">c</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Time: {formatTime(effectiveElapsedSeconds)}
                </div>
              </div>
            </div>

            {/* Supplementary Breakdown: 5-Keystroke vs Word-Based Metrics */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-700">Official Exam Standard: </span>
                <span>5 strokes = 1 word ({Math.round(totalChars / 5)} words / {formatTime(effectiveElapsedSeconds)})</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Word-Based Velocity: </span>
                <span className="font-mono font-semibold">{wordBasedGrossWpm} Gross / {wordBasedNetWpm} Net WPM</span>
              </div>
            </div>

            {/* Typo diagnostic preview if errors detected */}
            {mistakeRecords.length > 0 && (
              <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200 text-xs">
                <div className="font-bold text-rose-900 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Identified Mistakes ({mistakeRecords.length} recorded):
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {mistakeRecords.slice(0, 10).map((m, idx) => (
                    <div key={idx} className="bg-white px-2.5 py-1.5 rounded-lg border border-rose-200 text-[11px] font-mono flex items-center justify-between">
                      <div>
                        {m.type === 'omitted' ? (
                          <span>Word #{m.index}: Missed <strong className="text-rose-700">"{m.expected}"</strong></span>
                        ) : m.type === 'extra' ? (
                          <span>Extra word: <strong className="text-rose-700">"{m.typed}"</strong></span>
                        ) : (
                          <span>Word #{m.index}: Typed <span className="text-rose-600 font-bold bg-rose-50 px-1 rounded">"{m.typed}"</span> (Expected: <strong className="text-emerald-700">"{m.expected}"</strong>)</span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">
                        {m.type}
                      </span>
                    </div>
                  ))}
                  {mistakeRecords.length > 10 && (
                    <div className="text-[10px] text-slate-500 text-center pt-1">
                      ...and {mistakeRecords.length - 10} more mistakes
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowScorecardModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer"
              >
                Review Notepad
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Scorecard
              </button>
              <button
                type="button"
                onClick={handleResetTest}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake / New Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Import Modal */}
      <PdfImportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onPassagesAdded={(newlyAdded) => {
          setAvailablePassages((prev) => [...newlyAdded, ...prev]);
          if (newlyAdded.length > 0) {
            setSelectedPassageId(newlyAdded[0].id);
            handleResetTest();
          }
        }}
      />
    </div>
  );
};
