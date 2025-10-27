# 🚀 Monday Morning Quick Start Guide

**Date**: Monday, October 28, 2025  
**Start Time**: 8:00 AM CT  
**First Checkpoint**: 11:00 AM (Cycle 1A)

---

## ☕ Before You Begin (15 minutes)

1. **Open your terminal** in project directory:
   ```powershell
   cd "C:\Users\grate\Documents\Cursor\GratefulGabe5000\Gauntlet-Project-Three\clipforge\clipforge"
   ```

2. **Start the app** (keep this running in background):
   ```powershell
   npm start
   ```

3. **Open Cursor** with the `clipforge` folder

4. **Review Phase 0 Summary**: Read `PHASE-0-COMPLETION-SUMMARY.md`

---

## 📋 Cycle 1A: Video Import System (8:00 AM - 11:00 AM)

### **Task 1.1.1: Drag-and-Drop Import Component** (75 min)

**Create:** `src/renderer/components/import/VideoImport.tsx`

**Key Features:**
- Drag & drop zone with visual feedback
- File validation for MP4/MOV formats
- Size limit validation (up to 1GB)
- Error messages for invalid files

**Starter Code Structure:**
```tsx
import React, { useState } from 'react';

export const VideoImport: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    // Validate and import video files
  };
  
  return (
    <div 
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={isDragging ? 'dragging' : ''}
    >
      <p>Drop video files here</p>
    </div>
  );
};
```

**Testing:**
- Try dragging MP4 file
- Try dragging unsupported file
- Check console for errors

---

### **Task 1.1.2: File Picker Alternative** (30 min)

**Add to:** `VideoImport.tsx`

**Key Features:**
- File input button
- Same validation as drag & drop
- User-friendly file selection

**Starter Code:**
```tsx
<input
  type="file"
  accept=".mp4,.mov"
  onChange={handleFileSelect}
  style={{ display: 'none' }}
  ref={fileInputRef}
/>
<button onClick={() => fileInputRef.current?.click()}>
  Choose Video File
</button>
```

---

### **Task 1.1.3: Video Metadata Extraction** (45 min)

**Use:** `src/main/ffmpeg.ts` (already created!)

**IPC Setup:**
```typescript
// In main process (index.ts)
import { ipcMain } from 'electron';
import { extractVideoMetadata } from './main/ffmpeg';

ipcMain.handle(IPC_CHANNELS.FFMPEG_EXTRACT_METADATA, async (event, path) => {
  return await extractVideoMetadata(path);
});

// In renderer (VideoImport.tsx)
const metadata = await window.electron.extractMetadata(filePath);
console.log('Video metadata:', metadata);
```

**You need to add:** Preload script IPC bridge

---

### **Task 1.1.4: Import Testing** (30 min)

**Test Files Needed:**
- Small MP4 (< 50MB)
- Large MP4 (> 500MB) - should warn
- MOV file
- Invalid file (text file renamed to .mp4)

**Success Criteria:**
- All formats import correctly
- Metadata displays accurately
- Error handling works

---

## 🔄 Checkpoint 1A (11:00 AM) - Decision Point

### **Green ✅ (90%+ complete)**:
→ Continue to Cycle 1B (Timeline Canvas)

### **Yellow ⚠️ (70-89% complete)**:
→ Extend 30-60 minutes, then continue

### **Red 🔴 (<70% complete)**:
→ **ACTIVATE BACKUP PLAN**: Simplify file system approach
→ Skip metadata extraction for now, store file path only
→ Move forward to timeline

**Remember:** MVP must be done by Tuesday 10:59 PM!

---

## 🛠️ Quick Reference

### **Useful Commands:**
```powershell
# Start dev server
npm start

# Check for lint errors
npm run lint

# Install new package
npm install package-name
```

### **Files You'll Create Today:**
- `src/renderer/components/import/VideoImport.tsx`
- `src/renderer/components/timeline/Timeline.tsx`
- `src/renderer/components/player/VideoPlayer.tsx`
- `src/renderer/utils/timelineUtils.ts`

### **Files You'll Modify:**
- `src/index.ts` (add IPC handlers)
- `src/preload.ts` (add IPC bridge)
- `src/index.html` (update to use React components)

---

## 📞 Emergency Backup Plans

### **If FFmpeg metadata fails:**
Use basic file system info only:
```typescript
const metadata = {
  path: filePath,
  filename: path.basename(filePath),
  size: fs.statSync(filePath).size,
  // Skip duration, width, height for MVP
};
```

### **If drag-and-drop is complex:**
Focus on file picker first, add drag & drop later

### **If validation takes too long:**
Accept all files initially, add validation in testing phase

---

## 🎯 Monday Evening Goal

**By 6:00 PM tonight, you should have:**
- ✅ Video import working (drag & drop + file picker)
- ✅ Basic timeline displaying imported clips
- ✅ Video player showing imported videos
- ✅ FFmpeg integration tested with real files

**This sets you up for Tuesday:** Trim + Export functionality

---

## 💪 Motivation

You've got this! Phase 0 was PERFECT. The foundation is solid.  
Just follow the TaskList, hit the checkpoints, and you'll have an MVP by Tuesday night!

**Remember:** 
- Test frequently (every 30 minutes)
- Commit to git after each working feature
- Take breaks (Pomodoro: 25 min work, 5 min break)
- If stuck > 15 min, move to backup plan

---

**Good luck and happy coding!** 🚀

*Start: Monday 8:00 AM*  
*First Checkpoint: Monday 11:00 AM*  
*End of Day Goal: Video Import + Timeline + Player working*

