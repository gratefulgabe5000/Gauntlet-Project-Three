/**
 * ClipForge - FFmpeg Service
 * Handles all video processing operations
 */

import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { VideoMetadata } from '../shared/types';

// Set FFmpeg path from the installer
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Test if FFmpeg is working correctly
 */
export async function testFFmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Test FFmpeg by getting its version via command
      const command = ffmpeg();
      
      // Just creating an ffmpeg instance and checking the path is enough
      if (ffmpegInstaller.path) {
        console.log('✅ FFmpeg working! Path:', ffmpegInstaller.path);
        resolve(true);
      } else {
        console.error('❌ FFmpeg path not found');
        resolve(false);
      }
    } catch (err) {
      console.error('❌ FFmpeg test failed:', err);
      resolve(false);
    }
  });
}

/**
 * Extract metadata from a video file
 */
export async function extractVideoMetadata(videoPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error('Error extracting metadata:', err);
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      
      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }

      const result: VideoMetadata = {
        path: videoPath,
        filename: videoPath.split(/[\\/]/).pop() || 'unknown',
        duration: metadata.format.duration || 0,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        size: metadata.format.size || 0,
        format: metadata.format.format_name?.split(',')[0] || 'unknown',
        fps: videoStream.r_frame_rate ? eval(videoStream.r_frame_rate) : undefined,
        codec: videoStream.codec_name,
        bitrate: metadata.format.bit_rate,
      };

      console.log('Extracted metadata:', result);
      resolve(result);
    });
  });
}

/**
 * Trim a video file (basic export for MVP)
 */
export async function trimVideo(
  inputPath: string,
  outputPath: string,
  startTime: number,
  duration: number,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        const percent = Math.round((progress.timemark ? parseFloat(progress.timemark) / duration * 100 : 0));
        console.log(`Export progress: ${percent}%`);
        if (onProgress) {
          onProgress(percent);
        }
      })
      .on('end', () => {
        console.log('✅ Export complete!');
        resolve();
      })
      .on('error', (err) => {
        console.error('Export error:', err);
        reject(err);
      });

    command.run();
  });
}

export default {
  testFFmpeg,
  extractVideoMetadata,
  trimVideo,
};

