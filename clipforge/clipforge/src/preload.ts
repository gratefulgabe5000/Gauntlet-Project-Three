/**
 * ClipForge - Preload Script
 * Secure bridge between renderer and main process
 */

import { contextBridge, ipcRenderer, webUtils } from 'electron';

// Expose safe IPC methods to renderer
contextBridge.exposeInMainWorld('electron', {
  // Open file dialog and get path
  openFileDialog: () => {
    return ipcRenderer.invoke('open-file-dialog');
  },
  
  // Get file path from File object (for drag & drop)
  getFilePath: (file: File) => {
    try {
      // Use Electron's webUtils to get the real file path
      // This works for drag & drop File objects
      return webUtils.getPathForFile(file);
    } catch (error) {
      console.error('Failed to get file path:', error);
      // Fallback: check if File has .path property (older Electron versions)
      return (file as any).path || null;
    }
  },
  
  // Extract video metadata
  extractMetadata: (filePath: string) => {
    return ipcRenderer.invoke('extract-metadata', filePath);
  },
  
  // Listen for FFmpeg status
  onFFmpegStatus: (callback: (status: any) => void) => {
    ipcRenderer.on('ffmpeg-status', (_event, status) => callback(status));
  },
});

console.log('✅ Preload script loaded - IPC bridge ready');

