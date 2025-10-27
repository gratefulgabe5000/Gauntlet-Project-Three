/**
 * ClipForge - Shared Type Definitions
 * These types are used across main and renderer processes
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
  resolution: '720p' | '1080p' | 'source';
  format: 'mp4';
  quality: 'high' | 'medium' | 'low';
}

export interface ExportProgress {
  percent: number; // 0-100
  currentFrame: number;
  totalFrames: number;
  timeRemaining?: number; // estimated seconds
}

