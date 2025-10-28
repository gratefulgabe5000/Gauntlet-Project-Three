/// <reference path="../../global.d.ts" />

import React, { useRef, useEffect, useState } from 'react';
import { useTimeline } from '../../context/TimelineContext';

interface VideoPlayerProps {
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlaybackStateChange?: (isPlaying: boolean, currentClip: any) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ onTimeUpdate, onDurationChange, onPlaybackStateChange }) => {
  const { timelineState, setCurrentTime } = useTimeline();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPlayingRef = useRef(false); // Track playing state to prevent interference

  // Current clip to display (the clip at current playhead position)
  const currentClip = timelineState.clips.find(
    (clip) =>
      timelineState.currentTime >= clip.startTime &&
      timelineState.currentTime < clip.startTime + clip.duration
  );

  // Update ref when isPlaying changes
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  /**
   * Notify parent of playback state changes
   */
  useEffect(() => {
    if (onPlaybackStateChange) {
      onPlaybackStateChange(isPlaying, currentClip || null);
    }
  }, [isPlaying, currentClip?.id, onPlaybackStateChange]); // Use currentClip.id instead of full object

  /**
   * Update video source when current clip changes
   */
  useEffect(() => {
    if (!videoRef.current || !currentClip) return;

    const video = videoRef.current;
    const clipLocalTime = timelineState.currentTime - currentClip.startTime;
    const videoFileTime = (currentClip.trimStart || 0) + clipLocalTime;

    // Use custom protocol for video loading
    // Convert Windows backslashes to forward slashes
    const videoPath = currentClip.metadata.path.replace(/\\/g, '/');
    const videoSrc = `video-local:///${videoPath}`;

    // Only update source if it changed
    if (!video.src.includes(currentClip.metadata.filename)) {
      console.log('📹 Loading video:', currentClip.metadata.filename);
      const wasPlaying = isPlayingRef.current; // Remember if we were playing
      
      video.src = videoSrc;
      video.load(); // Force load
      
      // Set time after the video metadata is loaded
      video.onloadedmetadata = () => {
        console.log('📹 Video metadata loaded, duration:', video.duration);
        console.log('📹 Initial seek to:', videoFileTime);
        video.currentTime = videoFileTime;
      };
      
      video.onloadeddata = () => {
        console.log('📹 Video data loaded, ready to play');
        
        // If we were playing before, auto-resume
        if (wasPlaying) {
          console.log('▶️ Auto-resuming playback for next clip');
          video.play().then(() => {
            console.log('✅ Playback resumed');
          }).catch(err => {
            console.error('❌ Failed to auto-resume:', err);
            setIsPlaying(false);
          });
        }
      };
      
      video.onerror = (e) => {
        console.error('📹 Video load error:', e);
        if (e && typeof e === 'object' && 'target' in e) {
          const videoEl = e.target as HTMLVideoElement;
          console.error('📹 Error details:', videoEl.error);
        }
        setError(`Failed to load: ${currentClip.metadata.filename}`);
      };
    } else {
      // Same video - only seek if NOT currently playing
      if (!isPlayingRef.current && video.readyState >= 2) {
        const currentVideoTime = video.currentTime;
        const expectedVideoTime = videoFileTime;
        // Only seek if there's a significant difference (avoid micro-adjustments)
        if (Math.abs(currentVideoTime - expectedVideoTime) > 0.5) {
          console.log('📹 Seeking from', currentVideoTime, 'to', expectedVideoTime);
          video.currentTime = expectedVideoTime;
        }
      }
    }

    setError(null);
  }, [currentClip?.id]); // Only re-run when clip changes, NOT when timeline time changes

  /**
   * Handle manual playhead seeking (when user drags playhead)
   */
  useEffect(() => {
    if (!videoRef.current || !currentClip) return;

    const video = videoRef.current;
    const clipLocalTime = timelineState.currentTime - currentClip.startTime;
    const videoFileTime = (currentClip.trimStart || 0) + clipLocalTime;

    // Seek to new position (works whether playing or paused)
    if (video.readyState >= 2) {
      const currentVideoTime = video.currentTime;
      // Only seek if there's a significant difference
      if (Math.abs(currentVideoTime - videoFileTime) > 0.5) {
        console.log('🎯 Manual seek to:', videoFileTime);
        
        // If playing, pause briefly for seek, then resume
        const wasPlaying = !video.paused;
        if (wasPlaying) {
          console.log('⏸️ Pausing for seek...');
        }
        
        video.currentTime = videoFileTime;
        
        // Resume if it was playing
        if (wasPlaying) {
          setTimeout(() => {
            video.play().then(() => {
              console.log('▶️ Resumed after seek');
            }).catch(err => {
              console.error('Failed to resume:', err);
            });
          }, 50); // Small delay to let seek complete
        }
      }
    }
  }, [timelineState.currentTime, currentClip?.id]); // React to timeline time changes

  /**
   * Handle video time updates - ONLY update timeline when playing
   */
  const handleTimeUpdate = () => {
    if (!videoRef.current || !currentClip || videoRef.current.paused) return;

    const video = videoRef.current;
    const videoFileTime = video.currentTime;
    const clipLocalTime = videoFileTime - (currentClip.trimStart || 0);
    const timelineTime = currentClip.startTime + clipLocalTime;

    // Update timeline playhead position ONLY during playback
    setCurrentTime(timelineTime);

    if (onTimeUpdate) {
      onTimeUpdate(timelineTime);
    }

    // Check if we've reached the end of the current clip
    if (clipLocalTime >= currentClip.duration - 0.1) { // Small buffer to prevent boundary issues
      console.log('🎬 Reached end of clip:', currentClip.metadata.filename);
      
      // Find next clip
      const nextClip = timelineState.clips.find(
        (clip) => clip.startTime >= currentClip.startTime + currentClip.duration
      );

      if (nextClip) {
        console.log('🎬 Moving to next clip:', nextClip.metadata.filename);
        // Move playhead to start of next clip
        setCurrentTime(nextClip.startTime);
        // Keep playing - the video loading effect will handle loading the new video
      } else {
        // No more clips, pause
        console.log('🎬 End of timeline, stopping playback');
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  /**
   * Handle play/pause toggle
   */
  const handlePlayPause = async () => {
    if (!videoRef.current || !currentClip) {
      console.warn('⚠️ Cannot play: no video or clip');
      return;
    }

    const video = videoRef.current;
    console.log('🎬 Play button clicked, isPlaying:', isPlaying);
    console.log('🎬 Video readyState:', video.readyState);
    console.log('🎬 Video paused:', video.paused);
    console.log('🎬 Video currentTime:', video.currentTime);

    try {
      if (isPlaying || !video.paused) {
        console.log('⏸️ Pausing video');
        video.pause();
        setIsPlaying(false);
      } else {
        console.log('▶️ Playing video');
        await video.play();
        setIsPlaying(true);
        console.log('✅ Video playing');
      }
    } catch (err) {
      console.error('❌ Playback error:', err);
      setError('Failed to play video');
      setIsPlaying(false);
    }
  };

  /**
   * Handle video errors
   */
  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video error:', e);
    setError('Failed to load video');
    setIsPlaying(false);
  };

  /**
   * Handle metadata loaded
   */
  const handleLoadedMetadata = () => {
    if (!videoRef.current || !currentClip) return;

    const duration = videoRef.current.duration;
    console.log('✅ Video loaded, duration:', duration);

    if (onDurationChange) {
      onDurationChange(duration);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.videoWrapper}>
        {currentClip ? (
          <>
            <video
              ref={videoRef}
              style={styles.video}
              onTimeUpdate={handleTimeUpdate}
              onError={handleError}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
            />
            {error && (
              <div style={styles.error}>
                <p>❌ {error}</p>
              </div>
            )}
            {/* Play button overlay on video */}
            <div style={styles.playOverlay}>
              <button
                style={styles.playButton}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('🖱️ Play button clicked!');
                  handlePlayPause();
                }}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
            </div>
          </>
        ) : (
          <div style={styles.placeholder}>
            <div style={styles.placeholderContent}>
              <p style={styles.placeholderIcon}>🎬</p>
              <p style={styles.placeholderText}>
                {timelineState.clips.length === 0
                  ? 'Import a video to start editing'
                  : 'Move the playhead to a clip on the timeline'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#1a1a1a',
  },
  videoWrapper: {
    position: 'relative' as const,
    width: '100%',
    maxWidth: '1200px',
    aspectRatio: '16 / 9',
    backgroundColor: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const,
  },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
  },
  placeholderContent: {
    textAlign: 'center' as const,
  },
  placeholderIcon: {
    fontSize: '64px',
    margin: '0 0 15px 0',
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '16px',
    margin: 0,
  },
  error: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
    color: 'white',
    padding: '15px 25px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
  },
  playOverlay: {
    position: 'absolute' as const,
    bottom: '20px',
    left: '20px',
    zIndex: 10,
  },
  playButton: {
    fontSize: '32px',
    padding: '15px 25px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    color: 'white',
    transition: 'all 0.2s ease',
    fontWeight: 'bold' as const,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
  },
};

