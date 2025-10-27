# ClipForge - Desktop Video Editor 🎬

**72-Hour Sprint Project**  
**Framework**: Electron + React + TypeScript + FFmpeg  
**Goal**: Production-ready video editor with recording, editing, and export capabilities

---

## 🚀 Quick Start

### **Development**
```bash
cd clipforge
npm install
npm start
```

### **Build for Production**
```bash
npm run make
```

---

## 📁 Project Structure

```
clipforge/
├── src/
│   ├── main/              # Electron main process (Node.js)
│   │   └── ffmpeg.ts      # Video processing service
│   ├── renderer/          # React frontend (browser)
│   │   ├── components/    # UI components
│   │   ├── services/      # Frontend services
│   │   ├── utils/         # Helper utilities
│   │   └── styles/        # CSS styles
│   ├── shared/            # Shared between main & renderer
│   │   ├── types.ts       # TypeScript interfaces
│   │   └── constants.ts   # App configuration
│   ├── index.ts           # Main process entry point
│   ├── index.html         # App HTML template
│   ├── preload.ts         # IPC bridge (secure)
│   └── renderer.ts        # Renderer process entry
├── package.json           # Dependencies & scripts
└── forge.config.ts        # Build configuration
```

---

## 🎯 Sprint Timeline

### **Phase 0: Setup** ✅ (COMPLETE - Sunday Evening)
- Electron + React + TypeScript configured
- FFmpeg integration verified
- Project structure organized
- Professional branding established

### **Phase 1: MVP Foundation** 🔄 (Monday-Tuesday)
- **Monday**: Video import, timeline, player, FFmpeg setup
- **Tuesday AM**: Trim functionality, export pipeline
- **Tuesday PM**: Integration, testing, packaging
- **Tuesday 10:59 PM**: MVP SUBMISSION ⏰

### **Phase 2: Core Features** 📅 (Wednesday)
- **Morning**: Screen recording, webcam recording, PiP
- **Afternoon**: Multi-track timeline, resolution options
- **Evening**: Final polish, testing
- **Wednesday 10:59 PM**: FINAL SUBMISSION ⏰

---

## 🔧 Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Desktop Framework** | Electron 38.4.0 | Cross-platform native app |
| **Frontend** | React 18 + TypeScript 4.5 | UI components & type safety |
| **Video Processing** | FFmpeg + fluent-ffmpeg | Video encoding/decoding |
| **Build System** | Webpack + Electron Forge | Bundling & packaging |
| **Development** | Hot Reload + DevTools | Rapid iteration |

---

## 📋 Features Roadmap

### **MVP Requirements (P0 - Due Tuesday 10:59 PM)**
- [x] Desktop app launches
- [ ] Video import (drag & drop + file picker)
- [ ] Timeline view with clips
- [ ] Video preview player
- [ ] Basic trim functionality
- [ ] Export to MP4
- [ ] Packaged native app

### **Core Features (P1 - Due Wednesday 10:59 PM)**
- [ ] Screen recording
- [ ] Webcam recording
- [ ] Picture-in-Picture (screen + webcam)
- [ ] Multi-track timeline (2+ tracks)
- [ ] Resolution options (720p, 1080p, source)
- [ ] Snap-to-grid/clip edges

### **Bonus Features (P2 - If Time Permits)**
- [ ] AI auto-captions (Whisper API)
- [ ] Smart scene detection
- [ ] Auto-highlight suggestions

---

## 🧪 Testing

### **Manual Testing**
```bash
npm start
```
1. Import various video files (MP4, MOV)
2. Test timeline interactions
3. Verify export functionality
4. Test on different file sizes

### **Build Testing**
```bash
npm run package
```
Test packaged app runs without dev environment

---

## 📚 Documentation

- **PRD**: `../Artifacts/PRD-ClipForge.md` - Product requirements
- **TaskList**: `../Artifacts/TASK-TaskList-ClipForge.md` - Detailed tasks
- **Phase 0 Summary**: `PHASE-0-COMPLETION-SUMMARY.md` - Setup results
- **Monday Guide**: `MONDAY-QUICK-START.md` - Next steps

---

## 🐛 Known Issues

- Security warning in console (normal for dev, fixed for production)
- FFmpeg logs to terminal (not browser console)

---

## 📊 Progress Tracking

**Phase 0**: ✅ **100% Complete**  
**MVP Progress**: 🔄 **0% Complete** (starts Monday)  
**Overall Timeline**: 🎯 **On Track**

---

## 🏆 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| MVP Completion | Tuesday 10:59 PM | On Track ✅ |
| Core Features | Wednesday 10:59 PM | Planned |
| Code Quality | No linter errors | ✅ Clean |
| Performance | App launches < 3s | ✅ Fast |

---

## 👨‍💻 Development Notes

### **Main Process (Backend)**
- Runs in Node.js environment
- Handles file system, FFmpeg operations
- Logs appear in **terminal/PowerShell**

### **Renderer Process (Frontend)**
- Runs in Chromium browser
- React UI components
- Logs appear in **DevTools console**

### **IPC Communication**
- Main ↔ Renderer via Electron IPC
- Secure with `contextIsolation: true`
- Channels defined in `shared/constants.ts`

---

## 🚨 Important Reminders

1. **Test frequently** - Every 30 minutes
2. **Commit often** - After each working feature
3. **Follow checkpoints** - 4-hour cycles non-negotiable
4. **Activate backups early** - At 2x time estimate
5. **MVP gate is absolute** - Tuesday 10:59 PM CT

---

## 📞 Emergency Contacts & Resources

- **FFmpeg Documentation**: https://ffmpeg.org/documentation.html
- **Electron Docs**: https://www.electronjs.org/docs
- **React Docs**: https://react.dev

---

**Built with ❤️ by GratefulGabe5000**  
**October 27-29, 2025**  
**72-Hour Development Sprint**

---

*Last Updated: Phase 0 Complete - October 27, 2025*

