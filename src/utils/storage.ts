import { Passage, StudentProfile, TestResult, AdminSettings } from '../types';
import { DEFAULT_PASSAGES } from '../data/passages';

const STORAGE_KEYS = {
  PASSAGES: 'jalan_typing_passages_v1',
  RESULTS: 'jalan_typing_results_v1',
  CURRENT_STUDENT: 'jalan_typing_student_v1',
  SETTINGS: 'jalan_typing_settings_v1',
};

const DEFAULT_SETTINGS: AdminSettings = {
  strictExaminationMode: true,
  maxAllowedTabSwitches: 3,
  disqualifyOnTabSwitch: false,
  institutionName: 'THE FUTURE TRACK TYPING TEST',
};

// Initialize or get Passages
export function getPassages(): Passage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PASSAGES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PASSAGES, JSON.stringify(DEFAULT_PASSAGES));
      return DEFAULT_PASSAGES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_PASSAGES;
  } catch (e) {
    console.error('Failed to load passages from storage', e);
    return DEFAULT_PASSAGES;
  }
}

export function savePassage(passage: Passage): void {
  const passages = getPassages();
  const index = passages.findIndex((p) => p.id === passage.id);
  if (index >= 0) {
    passages[index] = passage;
  } else {
    passages.unshift(passage);
  }
  localStorage.setItem(STORAGE_KEYS.PASSAGES, JSON.stringify(passages));
}

export function deletePassage(id: string): void {
  const passages = getPassages().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PASSAGES, JSON.stringify(passages));
}

// Student Profile Management
export function getCurrentStudent(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_STUDENT);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setCurrentStudent(student: StudentProfile | null): void {
  if (student) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, JSON.stringify(student));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT);
  }
}

// Results Management
export function getAllResults(): TestResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESULTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load results', e);
    return [];
  }
}

export function saveTestResult(result: TestResult): void {
  const results = getAllResults();
  results.unshift(result);
  localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
}

export function getStudentResults(studentId?: string): TestResult[] {
  const all = getAllResults();
  if (!studentId) return all;
  return all.filter((r) => r.studentId === studentId);
}

// Settings
export function getAdminSettings(): AdminSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveAdminSettings(settings: AdminSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// Neutral Performance Feedback generator
export function getPerformanceFeedback(netWpm: number, accuracy: number): { title: string; message: string } {
  if (netWpm >= 50 && accuracy >= 95) {
    return {
      title: 'Excellent Progress',
      message: 'Your typing speed and accuracy show strong practice consistency and examination readiness.'
    };
  } else if (netWpm >= 35 && accuracy >= 90) {
    return {
      title: 'Commendable Performance',
      message: 'Good typing pace and solid accuracy. Consistent daily practice will further stabilize your cadence.'
    };
  } else if (accuracy < 85) {
    return {
      title: 'Focus on Accuracy',
      message: 'Aim for higher typographical precision before accelerating keystroke speed. Meticulous key placement reduces penalized errors.'
    };
  } else {
    return {
      title: 'Keep Practising',
      message: 'Continue practicing regularly to improve speed and accuracy. Sustained practice builds reliable muscle memory.'
    };
  }
}

// Export to CSV
export function exportResultsToCSV(results: TestResult[]): void {
  if (results.length === 0) {
    return;
  }
  const headers = [
    'Date & Time',
    'Student Name',
    'Student ID',
    'Passage Title',
    'Difficulty',
    'Duration (Min)',
    'Gross WPM',
    'Net WPM',
    'Accuracy (%)',
    'Errors',
    'Total Characters',
    'Backspace Attempts',
    'Tab Switches',
  ];

  const rows = results.map((r) => [
    `"${new Date(r.completedAt).toLocaleString()}"`,
    `"${r.studentName.replace(/"/g, '""')}"`,
    `"${r.studentId.replace(/"/g, '""')}"`,
    `"${r.passageTitle.replace(/"/g, '""')}"`,
    `"${r.difficulty}"`,
    r.durationMinutes,
    r.grossWpm,
    r.netWpm,
    `${r.accuracy}%`,
    r.errorCharacters,
    r.totalCharactersTyped,
    r.backspaceAttempts,
    r.tabSwitchCount,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `futuretrack_typing_results_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
