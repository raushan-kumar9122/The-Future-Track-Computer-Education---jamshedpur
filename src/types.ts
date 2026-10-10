export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type Category = 
  | 'General'
  | 'Education'
  | 'Business'
  | 'Computer'
  | 'English'
  | 'Exam Practice';

// Minimum duration is 10 minutes strictly as requested
export type TestDuration = 10 | 15 | 20 | 30 | 60;

export const VALID_DURATIONS: TestDuration[] = [10, 15, 20, 30, 60];

export interface Passage {
  id: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  content: string;
  wordCount: number;
  isCustom?: boolean;
}

export interface StudentProfile {
  id: string;
  name: string;
  studentId: string;
  mobile: string;
  registeredAt: string;
}

export interface WpmTimelinePoint {
  second: number;
  grossWpm: number;
  netWpm: number;
  errors: number;
}

export interface TestResult {
  id: string;
  studentId: string;
  studentName: string;
  passageId: string;
  passageTitle: string;
  durationMinutes: TestDuration;
  actualElapsedSeconds: number;
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  totalCharactersTyped: number;
  correctCharacters: number;
  errorCharacters: number;
  backspaceAttempts: number;
  tabSwitchCount: number;
  difficulty: Difficulty;
  category: Category;
  completedAt: string;
  performanceFeedback: string;
  timeline?: WpmTimelinePoint[];
  keyMistakes?: Record<string, number>;
  consistency?: number;
  verificationCode?: string;
}

export interface AdminSettings {
  strictExaminationMode: boolean;
  maxAllowedTabSwitches: number; // 0 for unlimited warnings
  disqualifyOnTabSwitch: boolean;
  institutionName: string;
}

export type SoundEffectType = 'mechanical' | 'thock' | 'typewriter' | 'silent';
export type DisplayTheme = 'academic' | 'midnight' | 'sepia' | 'slate';
export type DisplayFontSize = 'normal' | 'large' | 'xlarge';

export interface UserPreferences {
  soundType: SoundEffectType;
  volume: number; // 0 to 1
  targetWpm: number; // 0 for none, 30, 40, 50, 60
  showKeyboardGuide: boolean;
  theme: DisplayTheme;
  fontSize: DisplayFontSize;
}
