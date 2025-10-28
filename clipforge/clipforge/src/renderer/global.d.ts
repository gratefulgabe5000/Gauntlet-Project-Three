/**
 * ClipForge - Global Type Definitions
 * Extends the Window interface for Electron IPC
 */

import { VideoMetadata } from '../shared/types';

export interface ElectronAPI {
  openFileDialog: () => Promise<string | null>;
  getFilePath: (file: File) => string | null;
  extractMetadata: (filePath: string) => Promise<VideoMetadata>;
  generateThumbnail: (filePath: string, timeInSeconds?: number) => Promise<string>;
  generateThumbnails: (filePath: string, count: number, duration: number) => Promise<string[]>;
  onFFmpegStatus: (callback: (status: any) => void) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};

