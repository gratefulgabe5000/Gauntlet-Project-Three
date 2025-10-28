# ClipForge - Desktop Video Editor

**A modern, lightweight desktop video editor built with Electron, React, and TypeScript.**

![ClipForge Banner](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/badge/Version-0.1.0--alpha-orange)

---

## 🎬 Overview

ClipForge is a desktop video editing application designed for quick, efficient video editing workflows. Built as part of a 72-hour development sprint, it focuses on core editing functionality with a clean, intuitive interface.

### Key Features

✅ **Implemented (Phase 0 Complete)**
- 🎨 Modern dark-themed UI with gradient branding
- 📥 Video import via drag-and-drop or file picker
- 🎞️ Visual timeline with zoom controls (1-30px/s)
- 🎮 Integrated video player with playback controls
- ✂️ Split-at-playhead functionality
- 📊 Video thumbnails (sidebar and timeline)
- 🔄 Undo/Redo system with 50-entry history
- ⌨️ Keyboard shortcuts (Space = play/pause, Delete = remove clip)
- 🖱️ Drag-and-drop clip reordering on timeline
- 🎯 Zoom-to-cursor on timeline
- 📱 Collapsible sidebar with media management
- 🚀 Animated splash screen on startup
- 🔍 Ctrl+MouseWheel timeline zoom
- 📐 Timeline toolbar with professional controls
- 🎬 Asynchronous thumbnail generation

🚧 **In Progress (Phase 1 - MVP)**
- Export to MP4 with trim support
- Multi-file project support
- Advanced trim controls

📋 **Planned (Phase 2+)**
- Screen + webcam recording
- Multi-track timeline
- Transitions and effects
- Audio editing
- Text overlays

---

## 🖥️ Screenshots

### Main Interface
![Main Interface](docs/screenshots/main-interface.png)
*Dark-themed interface with video player, timeline, and media library*

### Timeline Controls
![Timeline](docs/screenshots/timeline.png)
*Professional timeline with zoom controls, split tool, and thumbnail previews*

### Video Import
![Import](docs/screenshots/import.png)
*Drag-and-drop video import with file validation*

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn** (comes with Node.js)
- **FFmpeg** installed and in system PATH ([Download](https://ffmpeg.org/download.html))
- **Git** (for cloning the repository)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/clipforge.git
   cd clipforge/Gauntlet-Project-Three/clipforge/clipforge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Verify FFmpeg installation**
   ```bash
   ffmpeg -version
   ```

4. **Start development server**
   ```bash
   npm start
   ```

The application will launch with hot-reload enabled for development.

---

## 📖 Usage Guide

### Importing Videos

1. **Drag and Drop**: Drag video files directly onto the import area
2. **File Picker**: Click "Import Video" button to browse files
3. **Supported Formats**: MP4, MOV, AVI, M4V, MKV, WebM

### Timeline Operations

- **Play/Pause**: Click play button or press `Space`
- **Split Clip**: Position playhead and click scissors (✂️) button
- **Delete Clip**: Select clip and press `Delete` or `Backspace`
- **Reorder Clips**: Drag clips to reorder on timeline
- **Zoom Timeline**: 
  - Use zoom slider
  - Click zoom +/− buttons
  - Hold `Ctrl` + scroll mouse wheel
- **Seek**: Click on timeline ruler to jump to position

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Play/Pause video |
| `Delete` / `Backspace` | Remove selected clip |
| `Ctrl + Z` | Undo last action |
| `Ctrl + Y` | Redo last undone action |
| `Ctrl + Scroll` | Zoom timeline |
| `F11` | Fullscreen mode |

### Video Player

- **Now Playing Section**: Shows current video with controls
- **Playback**: Automatically continues across multiple clips
- **Seek**: Drag playhead on timeline
- **Rewind**: Reset to beginning of current clip

---

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18 + TypeScript
- **Desktop Framework**: Electron 27
- **Video Processing**: FFmpeg (fluent-ffmpeg wrapper)
- **Build System**: Webpack + electron-forge
- **State Management**: React Context API
- **Styling**: Inline React styles (CSS-in-JS)

### Project Structure

```
clipforge/
├── src/
│   ├── index.ts                    # Main Electron process
│   ├── preload.ts                  # Preload script (IPC bridge)
│   ├── splash.html                 # Startup splash screen
│   ├── main/
│   │   └── ffmpeg.ts              # FFmpeg service
│   ├── renderer/
│   │   ├── App.tsx                # Root component
│   │   ├── components/
│   │   │   ├── player/
│   │   │   │   └── VideoPlayer.tsx
│   │   │   └── timeline/
│   │   │       └── Timeline.tsx
│   │   └── context/
│   │       ├── TimelineContext.tsx
│   │       └── ActionHistoryContext.tsx
│   └── shared/
│       ├── types.ts               # TypeScript interfaces
│       └── constants.ts           # App constants
├── package.json
└── webpack.*.config.ts
```

### IPC Architecture

ClipForge uses Electron's IPC (Inter-Process Communication) for secure file system access:

```
Renderer Process          Main Process
┌──────────────┐         ┌──────────────┐
│ React UI     │ ──IPC──>│ File System  │
│              │         │ FFmpeg API   │
│              │<─IPC────│ Native APIs  │
└──────────────┘         └──────────────┘
```

**Exposed APIs** (via preload script):
- `openFileDialog()` - Native file picker
- `getFilePath(file)` - Get real path from File object
- `extractMetadata(path)` - Get video metadata via FFprobe
- `generateThumbnail(path, time)` - Generate single thumbnail
- `generateThumbnails(path, count, duration)` - Generate multiple thumbnails

---

## 🔧 Development

### Development Workflow

1. **Start dev server**: `npm start`
2. **Hot reload enabled**: Changes auto-refresh
3. **DevTools open**: Inspect and debug in development mode

### Building for Production

```bash
# Build application
npm run make

# Output location
out/make/
```

### Testing

Manual testing is currently employed. Test scenarios include:

- Import various video formats and sizes
- Timeline operations (split, reorder, delete)
- Playback across multiple clips
- Undo/redo operations
- Export functionality (when implemented)

### Code Quality

- **TypeScript**: Full type safety
- **Linting**: ESLint configuration
- **Git Hooks**: Pre-commit validation (when configured)

---

## 📋 Roadmap

### Phase 0: Setup ✅ COMPLETE
- [x] Electron + React + TypeScript setup
- [x] FFmpeg integration
- [x] Basic architecture foundation
- [x] Splash screen
- [x] UI polish and dark theme

### Phase 1: MVP (Current)
- [x] Video import system
- [x] Timeline canvas with ruler
- [x] Video player integration
- [x] Split functionality
- [x] Thumbnail generation
- [x] Undo/Redo system
- [ ] Export pipeline (in progress)
- [ ] Production packaging
- [ ] Demo video

### Phase 2: Core Features
- [ ] Screen + webcam recording
- [ ] Multi-track timeline
- [ ] Advanced trim controls
- [ ] Timeline snap features
- [ ] Resolution options (720p, 1080p, 4K)

### Phase 3: Advanced Features
- [ ] Transitions library
- [ ] Text overlays
- [ ] Audio editing
- [ ] Effects and filters
- [ ] Keyboard shortcut customization

---

## 🐛 Known Issues

1. **Undo/Redo**: Code implemented but not fully tested - may require debugging (Day 2 priority)
2. **Large Video Files**: Performance may degrade with videos >1GB
3. **Thumbnail Generation**: Initial load can take time for long videos
4. **Export**: Not yet implemented (Phase 1 in progress)
5. **Cross-platform**: Tested primarily on Windows (macOS/Linux untested)

---

## 🤝 Contributing

This is an educational project developed as part of a 72-hour sprint challenge. While it's not currently open for contributions, feel free to fork and experiment!

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **FFmpeg**: Powerful multimedia framework
- **Electron**: Cross-platform desktop framework
- **React**: UI library
- **TypeScript**: Type-safe JavaScript

---

## 📞 Support

For issues, questions, or feedback:
- Open an issue on GitHub
- Check the [documentation](docs/)
- Review the [TaskList](Artifacts/TASK-TaskList-ClipForge.md) for planned features

---

## 📊 Project Stats

- **Development Time**: 72-hour sprint (in progress)
- **Lines of Code**: ~8,000+ (TypeScript/TSX)
- **Components**: 15+ React components
- **Phase Complete**: Phase 0 ✅
- **Current Phase**: Phase 1 (MVP) 🚧

---

**Built with ❤️ during a 72-hour development sprint**

*Last Updated: October 28, 2025*

