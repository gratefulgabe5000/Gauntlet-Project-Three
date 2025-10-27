/**
 * ClipForge - Application Constants
 */

export const APP_CONFIG = {
  name: 'ClipForge',
  version: '1.0.0',
  description: 'Desktop Video Editor - Record, Edit, Export',
};

export const VIDEO_FORMATS = {
  SUPPORTED_INPUT: ['.mp4', '.mov', '.avi', '.m4v', '.mkv', '.webm'],
  SUPPORTED_OUTPUT: ['.mp4'],
  MAX_FILE_SIZE: 1024 * 1024 * 1024, // 1GB in bytes
};

export const TIMELINE_CONFIG = {
  DEFAULT_ZOOM: 50, // pixels per second
  MIN_ZOOM: 10,
  MAX_ZOOM: 200,
  TRACK_HEIGHT: 80, // pixels
  RULER_HEIGHT: 30, // pixels
};

export const EXPORT_RESOLUTIONS = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
};

export const IPC_CHANNELS = {
  // Video import
  IMPORT_VIDEO: 'import-video',
  VIDEO_METADATA: 'video-metadata',
  
  // FFmpeg operations
  FFMPEG_TEST: 'ffmpeg-test',
  FFMPEG_EXTRACT_METADATA: 'ffmpeg-extract-metadata',
  
  // Export
  EXPORT_VIDEO: 'export-video',
  EXPORT_PROGRESS: 'export-progress',
  EXPORT_COMPLETE: 'export-complete',
  EXPORT_ERROR: 'export-error',
};

