import React from 'react';

interface VirtualKeyboardProps {
  activeChar: string;
  lastKeyStatus?: { key: string; isCorrect: boolean } | null;
  showFingerGuide?: boolean;
}

interface KeyConfig {
  key: string;
  display?: string;
  finger: 'l-pinky' | 'l-ring' | 'l-mid' | 'l-index' | 'thumb' | 'r-index' | 'r-mid' | 'r-ring' | 'r-pinky';
  width?: string;
}

const KEYBOARD_ROWS: KeyConfig[][] = [
  // Number Row
  [
    { key: '`', finger: 'l-pinky' },
    { key: '1', finger: 'l-pinky' },
    { key: '2', finger: 'l-ring' },
    { key: '3', finger: 'l-mid' },
    { key: '4', finger: 'l-index' },
    { key: '5', finger: 'l-index' },
    { key: '6', finger: 'r-index' },
    { key: '7', finger: 'r-index' },
    { key: '8', finger: 'r-mid' },
    { key: '9', finger: 'r-ring' },
    { key: '0', finger: 'r-pinky' },
    { key: '-', finger: 'r-pinky' },
    { key: '=', finger: 'r-pinky' },
    { key: 'Backspace', display: 'Bksp (Off)', finger: 'r-pinky', width: 'flex-[1.5]' },
  ],
  // Top Row
  [
    { key: 'Tab', display: 'Tab', finger: 'l-pinky', width: 'flex-[1.3]' },
    { key: 'q', finger: 'l-pinky' },
    { key: 'w', finger: 'l-ring' },
    { key: 'e', finger: 'l-mid' },
    { key: 'r', finger: 'l-index' },
    { key: 't', finger: 'l-index' },
    { key: 'y', finger: 'r-index' },
    { key: 'u', finger: 'r-index' },
    { key: 'i', finger: 'r-mid' },
    { key: 'o', finger: 'r-ring' },
    { key: 'p', finger: 'r-pinky' },
    { key: '[', finger: 'r-pinky' },
    { key: ']', finger: 'r-pinky' },
    { key: '\\', finger: 'r-pinky', width: 'flex-[1]' },
  ],
  // Home Row
  [
    { key: 'Caps', display: 'Caps', finger: 'l-pinky', width: 'flex-[1.6]' },
    { key: 'a', finger: 'l-pinky' },
    { key: 's', finger: 'l-ring' },
    { key: 'd', finger: 'l-mid' },
    { key: 'f', finger: 'l-index' }, // tactile bump
    { key: 'g', finger: 'l-index' },
    { key: 'h', finger: 'r-index' },
    { key: 'j', finger: 'r-index' }, // tactile bump
    { key: 'k', finger: 'r-mid' },
    { key: 'l', finger: 'r-ring' },
    { key: ';', finger: 'r-pinky' },
    { key: "'", finger: 'r-pinky' },
    { key: 'Enter', display: '↵ Enter', finger: 'r-pinky', width: 'flex-[1.8]' },
  ],
  // Bottom Row
  [
    { key: 'Shift', display: 'Shift', finger: 'l-pinky', width: 'flex-[2]' },
    { key: 'z', finger: 'l-pinky' },
    { key: 'x', finger: 'l-ring' },
    { key: 'c', finger: 'l-mid' },
    { key: 'v', finger: 'l-index' },
    { key: 'b', finger: 'l-index' },
    { key: 'n', finger: 'r-index' },
    { key: 'm', finger: 'r-index' },
    { key: ',', finger: 'r-mid' },
    { key: '.', finger: 'r-ring' },
    { key: '/', finger: 'r-pinky' },
    { key: 'Shift', display: 'Shift', finger: 'r-pinky', width: 'flex-[2]' },
  ],
  // Space Row
  [
    { key: 'Ctrl', display: 'Ctrl', finger: 'l-pinky', width: 'flex-[1.2]' },
    { key: 'Alt', display: 'Alt', finger: 'thumb', width: 'flex-[1.2]' },
    { key: ' ', display: 'Spacebar', finger: 'thumb', width: 'flex-[6]' },
    { key: 'Alt', display: 'Alt', finger: 'thumb', width: 'flex-[1.2]' },
    { key: 'Ctrl', display: 'Ctrl', finger: 'r-pinky', width: 'flex-[1.2]' },
  ],
];

const FINGER_NAMES: Record<string, string> = {
  'l-pinky': 'Left Pinky',
  'l-ring': 'Left Ring',
  'l-mid': 'Left Middle',
  'l-index': 'Left Index',
  'thumb': 'Thumbs',
  'r-index': 'Right Index',
  'r-mid': 'Right Middle',
  'r-ring': 'Right Ring',
  'r-pinky': 'Right Pinky',
};

const FINGER_COLORS: Record<string, string> = {
  'l-pinky': 'border-b-2 border-b-rose-400',
  'l-ring': 'border-b-2 border-b-amber-400',
  'l-mid': 'border-b-2 border-b-emerald-400',
  'l-index': 'border-b-2 border-b-sky-400',
  'thumb': 'border-b-2 border-b-indigo-400',
  'r-index': 'border-b-2 border-b-sky-400',
  'r-mid': 'border-b-2 border-b-emerald-400',
  'r-ring': 'border-b-2 border-b-amber-400',
  'r-pinky': 'border-b-2 border-b-rose-400',
};

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  activeChar,
  lastKeyStatus,
  showFingerGuide = true,
}) => {
  // Normalize target character for key mapping
  const normalizedTarget = activeChar.toLowerCase();
  const isTargetNewline = activeChar === '\n' || activeChar === '\r';
  const isTargetSpace = activeChar === ' ';

  // Find finger recommendation for active target
  let activeFinger = '';
  for (const row of KEYBOARD_ROWS) {
    for (const key of row) {
      if (
        (isTargetNewline && key.key === 'Enter') ||
        (isTargetSpace && key.key === ' ') ||
        key.key.toLowerCase() === normalizedTarget
      ) {
        activeFinger = key.finger;
        break;
      }
    }
    if (activeFinger) break;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl text-white select-none max-w-4xl mx-auto transition-all">
      {/* Finger posture coaching bar */}
      {showFingerGuide && (
        <div className="flex flex-wrap items-center justify-between text-xs pb-3 mb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
              Next Key Finger Guide:
            </span>
            <span className="font-bold text-blue-400 bg-blue-950 px-2.5 py-0.5 rounded border border-blue-800 font-mono text-xs">
              Key: {isTargetNewline ? 'Enter (↵)' : isTargetSpace ? 'Space (␣)' : activeChar || 'End'}
            </span>
            {activeFinger && (
              <span className="font-semibold text-emerald-400">
                &rarr; Use {FINGER_NAMES[activeFinger] || 'Index'}
              </span>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Pinky</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Ring</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Middle</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400"></span> Index</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400"></span> Thumbs</span>
          </div>
        </div>
      )}

      {/* Keyboard Matrix */}
      <div className="flex flex-col gap-1.5 font-mono text-xs sm:text-sm">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-1.5 justify-center">
            {row.map((item, kIdx) => {
              const isSpace = item.key === ' ';
              const isEnter = item.key === 'Enter';
              const isBksp = item.key === 'Backspace';

              // Check if this key matches the active required keystroke
              const isCurrentTarget =
                (isTargetNewline && isEnter) ||
                (isTargetSpace && isSpace) ||
                (item.key.toLowerCase() === normalizedTarget);

              // Check if last user press hit this key
              const isLastPressed =
                lastKeyStatus &&
                (lastKeyStatus.key.toLowerCase() === item.key.toLowerCase() ||
                  (lastKeyStatus.key === 'Enter' && isEnter) ||
                  (lastKeyStatus.key === ' ' && isSpace));

              let statusBg = 'bg-slate-800/90 text-slate-200 border-slate-700/80';
              if (isBksp) {
                statusBg = 'bg-rose-950/60 text-rose-400 border-rose-900/60 opacity-60';
              } else if (isCurrentTarget) {
                statusBg = 'bg-blue-600 text-white font-bold ring-2 ring-blue-400 scale-[1.03] z-10 shadow-lg';
              } else if (isLastPressed) {
                statusBg = lastKeyStatus.isCorrect
                  ? 'bg-emerald-600 text-white font-bold scale-[0.98]'
                  : 'bg-rose-600 text-white font-bold scale-[0.98]';
              }

              const widthClass = item.width || 'flex-1';
              const tactileBump = (item.key === 'f' || item.key === 'j');

              return (
                <div
                  key={kIdx}
                  className={`relative h-10 sm:h-12 ${widthClass} min-w-[28px] sm:min-w-[36px] rounded-lg border flex items-center justify-center font-medium shadow-sm transition-all duration-75 select-none ${statusBg} ${
                    showFingerGuide && !isCurrentTarget ? FINGER_COLORS[item.finger] : ''
                  }`}
                >
                  <span>{item.display || item.key.toUpperCase()}</span>

                  {/* Physical Home-Row Tactile Bump marker on F & J */}
                  {tactileBump && (
                    <span className="absolute bottom-1 w-2.5 h-0.5 bg-slate-400 rounded-full opacity-80"></span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
