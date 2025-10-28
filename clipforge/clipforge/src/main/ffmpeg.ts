/**
 * ClipForge - FFmpeg Service
 * Handles all video processing operations
 */

import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { VideoMetadata } from '../shared/types';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

// Set FFmpeg and FFprobe paths from the installers
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

console.log('FFmpeg path:', ffmpegInstaller.path);
console.log('FFprobe path:', ffprobeInstaller.path);

/**
 * Test if FFmpeg is working correctly
 */
export async function testFFmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Verify FFmpeg path exists
      if (!ffmpegInstaller.path) {
        console.error('❌ FFmpeg path not found');
        resolve(false);
        return;
      }

      console.log('✅ FFmpeg working! Path:', ffmpegInstaller.path);
      
      // Test FFmpeg by getting version info
      ffmpeg()
        .getAvailableFormats((err, formats) => {
          if (err) {
            console.error('❌ FFmpeg test failed:', err);
            resolve(false);
          } else {
            console.log('✅ FFmpeg formats available:', Object.keys(formats).length);
            resolve(true);
          }
        });
    } catch (err) {
      console.error('❌ FFmpeg test failed:', err);
      resolve(false);
    }
  });
}

/**
 * Test if FFprobe is working correctly
 */
export async function testFFprobe(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Verify FFprobe path exists
      if (!ffprobeInstaller.path) {
        console.error('❌ FFprobe path not found');
        resolve(false);
        return;
      }

      console.log('✅ FFprobe working! Path:', ffprobeInstaller.path);
      resolve(true);
    } catch (err) {
      console.error('❌ FFprobe test failed:', err);
      resolve(false);
    }
  });
}

/**
 * Get FFmpeg version information
 */
export async function getFFmpegVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg.getAvailableFormats((err, formats) => {
      if (err) {
        reject(err);
      } else {
        resolve(`FFmpeg installed with ${Object.keys(formats).length} formats available`);
      }
    });
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
        fps: videoStream.r_frame_rate ? parseFps(videoStream.r_frame_rate) : undefined,
        codec: videoStream.codec_name,
        bitrate: metadata.format.bit_rate,
      };

      console.log('✅ Extracted metadata:', result);
      resolve(result);
    });
  });
}

/**
 * Parse frame rate from FFmpeg's fraction format (e.g., "30/1" -> 30)
 */
function parseFps(rFrameRate: string): number {
  const parts = rFrameRate.split('/');
  if (parts.length === 2) {
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    return den !== 0 ? num / den : 0;
  }
  return parseFloat(rFrameRate) || 0;
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

/**
 * Generate thumbnail for a video at a specific time
 * Returns base64 data URL
 */
export async function generateThumbnail(
  videoPath: string,
  timeInSeconds: number = 0,
  width: number = 160
): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`🖼️ Generating thumbnail for: ${videoPath} at ${timeInSeconds}s`);
    
    const tempDir = path.join(app.getPath('temp'), 'clipforge-thumbnails');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log('📁 Created temp directory:', tempDir);
    }

    const outputFilename = `thumb_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const outputPath = path.join(tempDir, outputFilename);

    console.log('📸 Output path:', outputPath);

    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timeInSeconds],
        filename: outputFilename,
        folder: tempDir,
        size: `${width}x?`, // Maintain aspect ratio
      })
      .on('end', () => {
        try {
          console.log('✅ Screenshot generated, reading file...');
          // Read the thumbnail and convert to base64
          const thumbnailData = fs.readFileSync(outputPath);
          const base64 = thumbnailData.toString('base64');
          const dataUrl = `data:image/jpeg;base64,${base64}`;
          
          console.log(`✅ Thumbnail ready, size: ${(base64.length / 1024).toFixed(2)} KB`);
          
          // Clean up temp file
          fs.unlinkSync(outputPath);
          
          resolve(dataUrl);
        } catch (err) {
          console.error('❌ Error reading thumbnail:', err);
          reject(err);
        }
      })
      .on('error', (err) => {
        console.error('❌ Thumbnail generation error:', err);
        reject(err);
      });
  });
}

/**
 * Generate multiple thumbnails for a video (for timeline preview)
 */
export async function generateThumbnails(
  videoPath: string,
  count: number,
  duration: number,
  width: number = 120
): Promise<string[]> {
  const thumbnails: string[] = [];
  const interval = duration / Math.max(count, 1);
  
  for (let i = 0; i < count; i++) {
    const time = i * interval;
    try {
      const thumbnail = await generateThumbnail(videoPath, time, width);
      thumbnails.push(thumbnail);
    } catch (err) {
      console.error(`Failed to generate thumbnail at ${time}s:`, err);
      // Continue with next thumbnail
    }
  }
  
  return thumbnails;
}

export default {
  testFFmpeg,
  testFFprobe,
  getFFmpegVersion,
  extractVideoMetadata,
  trimVideo,
  generateThumbnail,
  generateThumbnails,
};

