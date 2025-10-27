/**
 * ClipForge - Timeline Component
 * Visual timeline with clips, playhead, and controls
 */

import React, { useRef, useEffect, useState } from 'react';
import { useTimeline } from '../../context/TimelineContext';

// Timeline left offset for visual alignment
const TIMELINE_LEFT_OFFSET = 20;

export const Timeline: React.FC = () => {
  const { timelineState, setCurrentTime, setZoom, removeClip, splitClipAtTime } = useTimeline();
  const { clips, totalDuration, currentTime, zoom } = timelineState;
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  /**
   * Format time in MM:SS format
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Handle playback (simple timer-based for MVP)
   */
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const newTime = currentTime + 0.1;
      
      if (newTime >= totalDuration) {
        setIsPlaying(false);
        setCurrentTime(0); // Loop back to start
      } else {
        setCurrentTime(newTime);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, totalDuration, currentTime, setCurrentTime]);

  /**
   * Handle timeline click to set playhead position
   */
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left - TIMELINE_LEFT_OFFSET; // Subtract left offset
    const clickedTime = Math.max(0, clickX / zoom);
    
    setCurrentTime(Math.min(clickedTime, totalDuration));
  };

  /**
   * Handle mouse down on playhead for dragging
   */
  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingPlayhead(true);
  };

  /**
   * Handle mouse move for playhead dragging
   */
  useEffect(() => {
    if (!isDraggingPlayhead) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - TIMELINE_LEFT_OFFSET;
      const newTime = Math.max(0, Math.min(mouseX / zoom, totalDuration));
      
      setCurrentTime(newTime);
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead, zoom, totalDuration, setCurrentTime]);

  /**
   * Toggle playback
   */
  const togglePlayback = () => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
    }
    setIsPlaying((prev) => !prev);
  };

  /**
   * Handle zoom controls (finer increments: ±1 px/sec)
   */
  const handleZoomIn = () => setZoom(zoom + 1);
  const handleZoomOut = () => setZoom(zoom - 1);

  /**
   * Handle split at playhead
   */
  const handleSplit = () => {
    const splitTime = currentTime; // Capture current time
    const wasSplit = splitClipAtTime(splitTime);
    if (wasSplit) {
      console.log('✅ Split successful at time:', splitTime);
      // Maintain playhead position after split
      setCurrentTime(splitTime);
    } else {
      console.log('❌ No clip to split at playhead position');
    }
  };

  /**
   * Handle mouse wheel zoom
   */
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault(); // Prevent page scroll
    
    const zoomDelta = e.deltaY < 0 ? 1 : -1; // Scroll up = zoom in, down = zoom out
    setZoom(zoom + zoomDelta);
  };

  return (
    <div style={styles.container}>
      {/* Timeline Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>Timeline</h3>
        <div style={styles.controls}>
          {/* Playback Controls */}
          <button
            style={styles.controlButton}
            onClick={togglePlayback}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button
            style={styles.controlButton}
            onClick={() => setCurrentTime(0)}
            title="Reset to start"
          >
            ⏮️
          </button>

          {/* Split Button */}
          <button
            style={{
              ...styles.controlButton,
              backgroundColor: '#dc3545',
            }}
            onClick={handleSplit}
            title="Split clip at playhead (✂️)"
          >
            ✂️ Split
          </button>
          
          {/* Time Display */}
          <span style={styles.timeDisplay}>
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>

          {/* Zoom Controls */}
          <div style={styles.zoomControls}>
            <button style={styles.zoomButton} onClick={handleZoomOut} title="Zoom Out">
              🔍−
            </button>
            <span style={styles.zoomLabel}>{Math.round(zoom)}px/s</span>
            <button style={styles.zoomButton} onClick={handleZoomIn} title="Zoom In">
              🔍+
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Canvas Wrapper - Fixed Width */}
      <div 
        style={{
          width: '100vw', // 100% of viewport width
          maxWidth: '100vw', // Never exceed viewport
          height: '180px',
          overflowX: 'auto',
          overflowY: 'hidden',
          backgroundColor: '#f8f9fa',
          position: 'relative' as const,
        }}
        onWheel={handleWheel} // Mouse wheel zoom control
      >
        {/* Timeline Canvas - Content */}
        <div
          ref={timelineRef}
          style={{
            ...styles.timelineCanvas,
            // Width: at least wrapper width, max 5x wrapper width for reasonable scrolling
            width: `${Math.max(
              window.innerWidth,
              Math.min(totalDuration * zoom + 100, window.innerWidth * 5)
            )}px`,
          }}
        >
        {/* Time Ruler */}
        <div style={styles.ruler} onClick={handleTimelineClick}>
          {Array.from({ length: Math.ceil(totalDuration / 10) + 1 }, (_, i) => (
            <div
              key={i}
              style={{
                ...styles.rulerMark,
                left: `${i * 10 * zoom + TIMELINE_LEFT_OFFSET}px`,
              }}
            >
              <span style={styles.rulerLabel}>{formatTime(i * 10)}</span>
            </div>
          ))}
        </div>

        {/* Clips */}
        <div style={styles.tracksContainer}>
          <div style={styles.track}>
            {clips.map((clip) => {
              const clipWidth = clip.duration * zoom;
              const clipLeft = clip.startTime * zoom + TIMELINE_LEFT_OFFSET;
              const isSelected = selectedClipId === clip.id;

              return (
                <div
                  key={clip.id}
                  style={{
                    ...styles.clip,
                    left: `${clipLeft}px`,
                    width: `${clipWidth}px`,
                    ...(isSelected ? styles.clipSelected : {}),
                  }}
                  title={clip.metadata.filename}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent ruler click
                    setSelectedClipId(clip.id);
                  }}
                >
                  {/* Clip Content */}
                  <div style={styles.clipHeader}>
                    <span style={styles.clipName}>{clip.metadata.filename}</span>
                    <button
                      style={styles.removeButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeClip(clip.id);
                      }}
                      title="Remove clip"
                    >
                      ✕
                    </button>
                  </div>
                  <div style={styles.clipInfo}>
                    {formatTime(clip.duration)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Playhead */}
        <div
          style={{
            ...styles.playhead,
            left: `${currentTime * zoom + TIMELINE_LEFT_OFFSET}px`,
            cursor: isDraggingPlayhead ? 'grabbing' : 'grab',
          }}
          onMouseDown={handlePlayheadMouseDown}
        >
          <div style={styles.playheadHandle} />
          <div style={styles.playheadLine} onMouseDown={handlePlayheadMouseDown} />
        </div>
      </div> {/* Close timelineCanvas */}
      </div> {/* Close wrapper */}

      {/* Timeline Info */}
      <div style={styles.info}>
        <p style={styles.infoText}>
          {clips.length === 0 ? (
            '📹 Import videos to get started'
          ) : (
            `📹 ${clips.length} clip(s) • Total duration: ${formatTime(totalDuration)}`
          )}
        </p>
      </div>
    </div>
  );
};

/**
 * Styles
 */
const styles = {
  container: {
    marginTop: '0', // Remove top margin
    backgroundColor: 'white',
    borderRadius: '0', // Remove border radius for full width
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    width: '100%', // Full window width
    maxWidth: '100%', // Prevent expansion
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 15px', // Match contentWrapper padding (15px)
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #e9ecef',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold' as const,
    color: '#333',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  controlButton: {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    fontSize: '16px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  timeDisplay: {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: '#333',
    padding: '0 15px',
    fontFamily: 'monospace',
  },
  zoomControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginLeft: '10px',
  },
  zoomButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    fontSize: '14px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  zoomLabel: {
    fontSize: '12px',
    color: '#666',
    minWidth: '50px',
    textAlign: 'center' as const,
  },
  timelineWrapper: {
    width: '100%', // Fixed width - always full screen
    maxWidth: '100%', // Prevent expansion beyond 100%
    height: '180px',
    overflowX: 'auto' as const, // Horizontal scroll
    overflowY: 'hidden' as const, // No vertical scroll
    backgroundColor: '#f8f9fa',
    position: 'relative' as const,
  },
  timelineCanvas: {
    position: 'relative' as const,
    height: '180px',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
    padding: '0', // No padding - use offset for alignment instead
    // Width is set dynamically via inline style based on zoom
  },
  ruler: {
    position: 'relative' as const,
    height: '30px',
    borderBottom: '1px solid #dee2e6',
    backgroundColor: '#fff',
  },
  rulerMark: {
    position: 'absolute' as const,
    top: 0,
    height: '100%',
    borderLeft: '1px solid #adb5bd',
  },
  rulerLabel: {
    fontSize: '10px',
    color: '#6c757d',
    marginLeft: '3px',
  },
  tracksContainer: {
    position: 'relative' as const,
    paddingTop: '10px',
  },
  track: {
    position: 'relative' as const,
    height: '80px',
    margin: '10px 0',
  },
  clip: {
    position: 'absolute' as const,
    top: 0,
    height: '80px',
    backgroundColor: '#667eea',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '6px',
    border: '2px solid #5a67d8',
    padding: '8px',
    cursor: 'grab',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
  },
  clipSelected: {
    border: '3px solid #fbbf24',
    boxShadow: '0 0 12px rgba(251, 191, 36, 0.5)',
  },
  trimHandle: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: '8px',
    backgroundColor: 'rgba(251, 191, 36, 0.8)',
    cursor: 'ew-resize',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
  },
  trimHandleBar: {
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold' as const,
    userSelect: 'none' as const,
  },
  trimOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none' as const,
    zIndex: 1,
  },
  trimmedRegion: {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderLeft: '2px dashed rgba(255, 255, 255, 0.5)',
    borderRight: '2px dashed rgba(255, 255, 255, 0.5)',
  },
  trimIndicator: {
    fontSize: '10px',
    opacity: 0.9,
  },
  clipHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px',
  },
  clipName: {
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: '80%',
  },
  removeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipInfo: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: '11px',
    fontWeight: '500' as const,
  },
  playhead: {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    width: '2px',
    zIndex: 10,
    pointerEvents: 'none' as const,
  },
  playheadHandle: {
    position: 'absolute' as const,
    top: 0,
    left: '-6px',
    width: '12px',
    height: '12px',
    backgroundColor: '#dc3545',
    borderRadius: '50%',
    cursor: 'grab',
    pointerEvents: 'auto' as const,
  },
  playheadLine: {
    width: '2px',
    height: '100%',
    backgroundColor: '#dc3545',
    marginLeft: '-1px',
    cursor: 'grab',
    pointerEvents: 'auto' as const,
  },
  info: {
    padding: '12px 20px',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #e9ecef',
  },
  infoText: {
    margin: 0,
    fontSize: '14px',
    color: '#6c757d',
  },
};

