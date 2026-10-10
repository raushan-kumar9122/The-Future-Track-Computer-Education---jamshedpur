# The Future Track Typing Examination System

A world-class typing examination, practice, and certification platform with strict 10-60 minute examination modes, zero-backspace enforcement, multi-paragraph notepad, real-time WPM statistics, virtual touch-typing keyboard with finger guide, mechanical switch audio synthesis, and printable competency certificates.

## 🚀 Quick Start Guide (Kaise Run Karein)

### 1. Requirements
- Node.js (version 18 or higher)
- npm or bun or yarn

### 2. Installation (Setup Steps)

1. Unzip the project folder (File ko extract karein).
2. Open terminal in the unzipped folder (Folder me terminal kholein).
3. Dependencies install karein:
   ```bash
   npm install
   ```
4. Development server start karein:
   ```bash
   npm run dev
   ```
5. Browser me open karein:
   ```
   http://localhost:5173  (ya terminal me dikhaya gaya URL)
   ```

### 3. Production Build
Agar production ke liye build karna hai:
```bash
npm run build
npm run preview
```

---

## 🌟 Key Features

1. **Strict 10-Minute Minimum Examination Mode**:
   - Examination durations locked to 10, 15, 20, 30, and 60 minutes.
   - Timer starts automatically on the first keystroke.
   - Anti-cheating window monitor.

2. **Strict Zero-Backspace & Zero-Delete Lockout**:
   - Backspace and Delete keys produce 0 deletions.
   - Keystroke is intercepted with an instant warning alert and count tracker.
   - Cut (`Ctrl+X`) and copy/paste locks.

3. **Notepad Without Backspace (Always New Notepad for Each Paragraph)**:
   - Each paragraph is typed on its own dedicated notepad sheet.
   - Finish and advance to a clean sheet with `Ctrl + Enter` or button click.
   - Real-time word, character, and speed metrics.
   - Compiled Document view for 1-click Copy, Export `.txt`, and Print.

4. **Interactive Virtual Keyboard & Finger Guide**:
   - Color-coded finger zones (Pinky, Ring, Middle, Index, Thumbs).
   - Home-row tactile bumps on `F` and `J`.
   - Real-time keypress lighting.

5. **Mechanical Switch Audio Engine (Web Audio API)**:
   - Authentic Cherry MX Clicky, Thock, Typewriter, and Mute audio feedback.
   - Works 100% offline with zero latency.

6. **Official Competency Certificate & Speed Graphs**:
   - Time-series SVG line chart of Net WPM vs Gross WPM with error burst marks.
   - Weak finger/key diagnostic analysis.
   - Printable official Certificate of Competency with verification security code.

7. **Admin Gateway**:
   - Default PIN: `admin123`
   - Manage passages, view candidate audit logs, and export CSV.
