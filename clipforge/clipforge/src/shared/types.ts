/**
 * ClipForge - Shared TypeScript Types
 * Type definitions used across main and renderer processes
 */

export interface VideoMetadata {
  path: string;
  filename: string;
  duration: number; // in seconds
  width: number;
  height: number;
  size: number; // file size in bytes
  format: string; // e.g., 'mp4', 'mov'
  fps?: number;
  codec?: string;
  bitrate?: number;
}

export interface VideoClip {
  id: string;
  metadata: VideoMetadata;
  startTime: number; // where clip starts on timeline (seconds)
  duration: number; // clip duration (seconds)
  trimStart?: number; // trim from beginning (seconds)
  trimEnd?: number; // trim from end (seconds)
  track: number; // which timeline track (0, 1, 2...)
}

export interface TimelineState {
  clips: VideoClip[];
  totalDuration: number;
  currentTime: number; // playhead position
  zoom: number; // pixels per second
}

export interface ExportSettings {
  outputPath: string;
  format: 'mp4' | 'mov' | 'webm';
  quality: 'low' | 'medium' | 'high';
  resolution?: {
    width: number;
    height: number;
  };
}

export interface ExportProgress {
  percent: number;
  currentFile?: string;
  timeRemaining?: number;
}

