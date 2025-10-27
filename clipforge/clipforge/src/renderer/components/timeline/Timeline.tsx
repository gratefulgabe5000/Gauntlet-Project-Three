/**
 * ClipForge - Timeline Component
 * Visual timeline with clips, playhead, and controls
 */

import React, { useRef, useEffect, useState } from 'react';
import { useTimeline } from '../../context/TimelineContext';

export const Timeline: React.FC = () => {
  const { timelineState, setCurrentTime, setZoom, removeClip } = useTimeline();
  const { clips, totalDuration, currentTime, zoom } = timelineState;
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

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
    const clickX = e.clientX - rect.left - 50; // Subtract left padding
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
      const mouseX = e.clientX - rect.left - 50;
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
   * Handle zoom controls
   */
  const handleZoomIn = () => setZoom(zoom + 5);
  const handleZoomOut = () => setZoom(zoom - 5);

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

      {/* Timeline Canvas */}
      <div
        ref={timelineRef}
        style={styles.timeline}
        onClick={handleTimelineClick}
      >
        {/* Time Ruler */}
        <div style={styles.ruler}>
          {Array.from({ length: Math.ceil(totalDuration / 10) + 1 }, (_, i) => (
            <div
              key={i}
              style={{
                ...styles.rulerMark,
                left: `${i * 10 * zoom + 50}px`,
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
              const clipLeft = clip.startTime * zoom + 50;

              return (
                <div
                  key={clip.id}
                  style={{
                    ...styles.clip,
                    left: `${clipLeft}px`,
                    width: `${clipWidth}px`,
                  }}
                  title={clip.metadata.filename}
                >
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
            left: `${currentTime * zoom + 50}px`,
          }}
          onMouseDown={handlePlayheadMouseDown}
        >
          <div style={styles.playheadHandle} />
          <div style={styles.playheadLine} />
        </div>
      </div>

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
    marginTop: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
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
  timeline: {
    position: 'relative' as const,
    height: '180px',
    backgroundColor: '#f8f9fa',
    overflow: 'auto',
    cursor: 'pointer',
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
    cursor: 'ew-resize',
    pointerEvents: 'auto' as const,
  },
  playheadLine: {
    width: '2px',
    height: '100%',
    backgroundColor: '#dc3545',
    marginLeft: '-1px',
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

