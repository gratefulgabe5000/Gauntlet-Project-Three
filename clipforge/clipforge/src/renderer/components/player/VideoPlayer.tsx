/// <reference path="../../global.d.ts" />

import React, { useRef, useEffect, useState } from 'react';
import { useTimeline } from '../../context/TimelineContext';
import { VideoMetadata } from '../../../shared/types';

interface VideoPlayerProps {
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlaybackStateChange?: (isPlaying: boolean, currentClip: any) => void;
  onVideoImport?: (filePath: string) => void;
  draggingVideo?: VideoMetadata | null;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ onTimeUpdate, onDurationChange, onPlaybackStateChange, onVideoImport, draggingVideo }) => {
  const { timelineState, setCurrentTime } = useTimeline();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPlayingRef = useRef(false); // Track playing state to prevent interference
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Current clip to display (the clip at current playhead position)
  const currentClip = timelineState.clips.find(
    (clip) =>
      timelineState.currentTime >= clip.startTime &&
      timelineState.currentTime < clip.startTime + clip.duration
  );
  
  // Show drop zone when dragging from sidebar OR when timeline is empty
  const shouldShowDropZone = (draggingVideo && !currentClip) || (!currentClip && timelineState.clips.length === 0);

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

  /**
   * Listen for play/pause events from sidebar
   */
  useEffect(() => {
    const handleTogglePlayback = () => {
      handlePlayPause();
    };

    const handleRewindToStart = () => {
      setCurrentTime(0);
    };

    window.addEventListener('toggle-playback', handleTogglePlayback);
    window.addEventListener('rewind-to-start', handleRewindToStart);
    return () => {
      window.removeEventListener('toggle-playback', handleTogglePlayback);
      window.removeEventListener('rewind-to-start', handleRewindToStart);
    };
  }, [isPlaying, currentClip]); // Include dependencies for handlePlayPause

  /**
   * Handle drag over
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  /**
   * Handle drag leave
   */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  /**
   * Handle drop
   */
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    // Check if dropping from sidebar (video metadata)
    if (draggingVideo) {
      if (onVideoImport) {
        console.log('✅ Sidebar video dropped on player:', draggingVideo.path);
        onVideoImport(draggingVideo.path);
      }
      return;
    }

    // Handle file drop from file system
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    const validExtensions = ['mp4', 'mov', 'avi', 'm4v', 'mkv', 'webm'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (!fileExt || !validExtensions.includes(fileExt)) {
      console.error('❌ Invalid file type:', fileExt);
      return;
    }

    try {
      const filePath = await window.electron?.getFilePath(file);
      if (filePath && onVideoImport) {
        console.log('✅ Video dropped:', filePath);
        onVideoImport(filePath);
      } else {
        console.error('❌ Could not access file path');
      }
    } catch (error) {
      console.error('❌ Drop error:', error);
    }
  };

  /**
   * Handle click to open file dialog
   */
  const handleClickToImport = async () => {
    if (!onVideoImport) return;
    
    try {
      const filePath = await window.electron?.openFileDialog();
      if (filePath) {
        onVideoImport(filePath);
      }
    } catch (error) {
      console.error('❌ File dialog error:', error);
    }
  };

  return (
    <div 
      style={styles.container}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
          </>
        ) : (
          // Show import UI when no clips or not on a clip
          <div 
            style={{
              ...styles.placeholder,
              ...(isDraggingOver ? styles.placeholderDragging : {}),
            }}
          >
            {shouldShowDropZone ? (
              // Show full import UI when timeline is empty OR dragging from sidebar
              <div style={styles.dropZone} onClick={!draggingVideo ? handleClickToImport : undefined}>
                <div style={styles.dropZoneContent}>
                  <p style={styles.dropZoneIcon}>🎬</p>
                  <p style={styles.dropZoneTitle}>
                    {isDraggingOver || draggingVideo ? 'Drop video here!' : 'Drag & Drop Video Here'}
                  </p>
                  {!draggingVideo && (
                    <>
                      <p style={styles.dropZoneSubtitle}>or</p>
                      <button style={styles.dropZoneButton} onClick={handleClickToImport}>
                        Choose Video File
                      </button>
                      <p style={styles.dropZoneFormats}>
                        Supports: MP4, MOV, AVI, M4V, MKV, WebM
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              // Show simple placeholder when clips exist but not on one
              <div style={styles.placeholderContent}>
                <p style={styles.placeholderIcon}>🎬</p>
                <p style={styles.placeholderText}>
                  Move the playhead to a clip on the timeline
                </p>
              </div>
            )}
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
    backgroundColor: '#1a1a1a',
    padding: '20px',
  },
  videoWrapper: {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    transition: 'all 0.3s ease',
  },
  placeholderDragging: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: '3px dashed rgba(255, 255, 255, 0.5)',
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
  dropZone: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  dropZoneContent: {
    textAlign: 'center' as const,
  },
  dropZoneIcon: {
    fontSize: '80px',
    margin: '0 0 20px 0',
    animation: 'pulse 2s ease-in-out infinite',
  },
  dropZoneTitle: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    color: '#fff',
    margin: '0 0 10px 0',
  },
  dropZoneSubtitle: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: '0 0 20px 0',
  },
  dropZoneButton: {
    fontSize: '16px',
    padding: '12px 30px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    marginBottom: '20px',
  },
  dropZoneFormats: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    margin: 0,
    marginTop: '150px',
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
};

