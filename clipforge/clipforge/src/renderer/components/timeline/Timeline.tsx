/**
 * ClipForge - Timeline Component
 * Visual timeline with clips, playhead, and controls
 */

import React, { useRef, useEffect, useState } from 'react';
import { useTimeline } from '../../context/TimelineContext';
import { VideoMetadata } from '../../../shared/types';

// Timeline left offset for visual alignment
const TIMELINE_LEFT_OFFSET = 20;

interface TimelineProps {
  onImportVideo?: () => void;
  onToggleCollapse?: () => void;
  onFullscreen?: () => void;
  draggingVideo?: VideoMetadata | null;
}

export const Timeline: React.FC<TimelineProps> = ({ onImportVideo, onToggleCollapse, onFullscreen, draggingVideo }) => {
  const { timelineState, setCurrentTime, setZoom, removeClip, splitClipAtTime, reorderClips, addClipToTimeline } = useTimeline();
  const { clips, totalDuration, currentTime, zoom } = timelineState;
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineWrapperRef = useRef<HTMLDivElement>(null); // For scroll position
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [mouseTimelineX, setMouseTimelineX] = useState<number | null>(null); // Track mouse X for zoom
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const [, setWindowWidth] = useState(window.innerWidth); // Force re-render on resize
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);
  const [hasDragMoved, setHasDragMoved] = useState(false); // Track if drag actually moved
  const [sidebarDropIndicatorIndex, setSidebarDropIndicatorIndex] = useState<number | null>(null);
  const [isDraggingOverTimeline, setIsDraggingOverTimeline] = useState(false);
  const [showZoomLabel, setShowZoomLabel] = useState(false);
  const zoomLabelTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Format time in MM:SS format
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Handle playback (simple timer-based for MVP) - DISABLED
   */
  useEffect(() => {
    // Disabled - VideoPlayer now handles playback
    // Timeline only manages playhead position for scrubbing
    return;
  }, [isPlaying, totalDuration, currentTime, setCurrentTime]);

  /**
   * Handle keyboard events (Delete/Backspace for selected clips)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete or Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId) {
        // Prevent default backspace navigation
        e.preventDefault();
        console.log('🗑️ Deleting selected clip:', selectedClipId);
        removeClip(selectedClipId);
        setSelectedClipId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedClipId, removeClip]);

  /**
   * Handle window resize to update timeline width
   */
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
   * Toggle playback - DISABLED: VideoPlayer handles playback now
   */
  const togglePlayback = () => {
    // Disabled - use VideoPlayer controls instead
    console.log('⚠️ Timeline playback disabled - use VideoPlayer controls');
  };

  /**
   * Handle zoom controls with cursor-based centering
   */
  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    setShowZoomLabel(true);
    
    // Clear existing timeout
    if (zoomLabelTimeoutRef.current) {
      clearTimeout(zoomLabelTimeoutRef.current);
    }
    
    // Hide label after 3 seconds
    zoomLabelTimeoutRef.current = setTimeout(() => {
      setShowZoomLabel(false);
    }, 3000);
  };

  const handleZoomIn = () => {
    if (!timelineWrapperRef.current || !timelineRef.current) {
      handleZoomChange(Math.min(zoom + 1, 30));
      return;
    }

    const newZoom = Math.min(zoom + 1, 30);
    zoomTowardsCursor(newZoom);
    handleZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    if (!timelineWrapperRef.current || !timelineRef.current) {
      handleZoomChange(Math.max(zoom - 1, 1));
      return;
    }

    const newZoom = Math.max(zoom - 1, 1);
    zoomTowardsCursor(newZoom);
    handleZoomChange(newZoom);
  };

  /**
   * Zoom towards cursor position (or center if no mouse position tracked)
   */
  const zoomTowardsCursor = (newZoom: number) => {
    if (!timelineWrapperRef.current || !timelineRef.current) return;

    const wrapper = timelineWrapperRef.current;
    const timeline = timelineRef.current;

    // Get the time at the mouse position (or center if no mouse)
    const mouseX = mouseTimelineX !== null ? mouseTimelineX : wrapper.scrollLeft + wrapper.clientWidth / 2;
    const timeAtMouse = (mouseX - TIMELINE_LEFT_OFFSET) / zoom;

    // Apply new zoom
    setZoom(newZoom);

    // After zoom is applied, calculate new position and scroll
    requestAnimationFrame(() => {
      const newMouseX = timeAtMouse * newZoom + TIMELINE_LEFT_OFFSET;
      const targetScrollLeft = mouseX !== null 
        ? newMouseX - (mouseTimelineX - wrapper.scrollLeft)
        : newMouseX - wrapper.clientWidth / 2;
      
      wrapper.scrollLeft = Math.max(0, targetScrollLeft);
      console.log('🔍 Zoomed to', newZoom, 'px/sec, centered on time:', timeAtMouse.toFixed(2));
    });
  };

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
   * Handle clip drag start
   */
  const handleClipDragStart = (e: React.MouseEvent, clipId: string) => {
    // Only allow drag from clip body, not from buttons
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    
    e.stopPropagation();
    setDraggingClipId(clipId);
    setDragStartX(e.clientX);
    setHasDragMoved(false); // Reset drag moved flag
    
    const clip = clips.find(c => c.id === clipId);
    if (clip) {
      setDragStartTime(clip.startTime);
    }
    
    console.log('🖐️ Started dragging clip:', clipId);
  };

  /**
   * Handle clip dragging
   */
  useEffect(() => {
    if (!draggingClipId) {
      setDropIndicatorIndex(null);
      setGhostPosition(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current) return;

      const deltaX = e.clientX - dragStartX;
      
      // Only consider it a drag if moved more than 5 pixels
      if (Math.abs(deltaX) > 5) {
        setHasDragMoved(true);
      }

      // Update ghost position to follow cursor
      const rect = timelineRef.current.getBoundingClientRect();
      setGhostPosition({ x: e.clientX, y: e.clientY });

      const deltaTime = deltaX / zoom;
      
      // Find which clip position we're hovering over
      const hoverTime = dragStartTime + deltaTime;
      let targetIndex = 0;
      
      for (let i = 0; i < clips.length; i++) {
        if (hoverTime >= clips[i].startTime + clips[i].duration / 2) {
          targetIndex = i + 1;
        }
      }
      
      // Update drop indicator position
      targetIndex = Math.max(0, Math.min(targetIndex, clips.length));
      setDropIndicatorIndex(targetIndex);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!timelineRef.current) return;

      // Only reorder and move playhead if the clip was actually dragged
      if (!hasDragMoved) {
        console.log('🖱️ Click detected (no drag movement), not reordering');
        setDraggingClipId(null);
        setDropIndicatorIndex(null);
        setGhostPosition(null);
        return;
      }

      const deltaX = e.clientX - dragStartX;
      const deltaTime = deltaX / zoom;
      const hoverTime = dragStartTime + deltaTime;
      
      // Find target index based on where we dropped
      let targetIndex = 0;
      for (let i = 0; i < clips.length; i++) {
        if (hoverTime >= clips[i].startTime + clips[i].duration / 2) {
          targetIndex = i + 1;
        }
      }
      
      // Don't exceed bounds
      targetIndex = Math.max(0, Math.min(targetIndex, clips.length - 1));
      
      console.log('📍 Dropping clip at index:', targetIndex);
      reorderClips(draggingClipId, targetIndex);
      
      // Calculate new start time for the reordered clip
      // After reordering, clips are sequential, so we sum up durations before this index
      let newStartTime = 0;
      for (let i = 0; i < targetIndex; i++) {
        if (clips[i].id !== draggingClipId) {
          newStartTime += clips[i].duration;
        }
      }
      
      // Set playhead to the start of the reordered clip
      setCurrentTime(newStartTime);
      
      setDraggingClipId(null);
      setDropIndicatorIndex(null);
      setGhostPosition(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingClipId, dragStartX, dragStartTime, zoom, clips, reorderClips, hasDragMoved, setCurrentTime]);

  /**
   * Handle mouse wheel zoom - only when over timeline
   */
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault(); // Prevent page scroll
    e.stopPropagation(); // Stop event from bubbling
    
    const zoomDelta = e.deltaY < 0 ? 1 : -1; // Scroll up = zoom in, down = zoom out
    setZoom(zoom + zoomDelta);
  };

  /**
   * Attach native wheel event listener - require Ctrl for zoom
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // Only zoom if Ctrl key is held
      if (!e.ctrlKey) {
        return; // Allow normal page scrolling
      }

      e.preventDefault(); // Block page scroll when zooming
      e.stopPropagation();
      
      // Track mouse position for zoom centering
      if (timelineWrapperRef.current) {
        const rect = timelineWrapperRef.current.getBoundingClientRect();
        setMouseTimelineX(e.clientX - rect.left + timelineWrapperRef.current.scrollLeft);
      }
      
      const zoomDelta = e.deltaY < 0 ? 1 : -1;
      const newZoom = Math.max(1, Math.min(zoom + zoomDelta, 30));
      
      // Use zoom towards cursor
      if (timelineWrapperRef.current && timelineRef.current) {
        zoomTowardsCursor(newZoom);
      } else {
        setZoom(newZoom);
      }
      
      // Show zoom label (same as buttons/slider)
      handleZoomChange(newZoom);
    };

    // Use native event with { passive: false } to allow preventDefault
    container.addEventListener('wheel', handleNativeWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, [zoom, setZoom, mouseTimelineX]);

  /**
   * Handle drag over timeline (for sidebar videos)
   */
  const handleTimelineDragOver = (e: React.DragEvent) => {
    if (!draggingVideo) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverTimeline(true);
    
    // Calculate drop position
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left - TIMELINE_LEFT_OFFSET;
    const hoverTime = Math.max(0, mouseX / zoom);
    
    // Find which index to insert at
    let targetIndex = clips.length; // Default to end
    for (let i = 0; i < clips.length; i++) {
      if (hoverTime < clips[i].startTime + clips[i].duration / 2) {
        targetIndex = i;
        break;
      }
    }
    
    setSidebarDropIndicatorIndex(targetIndex);
  };

  /**
   * Handle drag leave timeline
   */
  const handleTimelineDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverTimeline(false);
    setSidebarDropIndicatorIndex(null);
  };

  /**
   * Handle drop on timeline (for sidebar videos)
   */
  const handleTimelineDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverTimeline(false);
    setSidebarDropIndicatorIndex(null);
    
    if (draggingVideo) {
      console.log('✅ Sidebar video dropped on timeline:', draggingVideo.filename);
      addClipToTimeline(draggingVideo);
    }
  };

  return (
    <div ref={containerRef} style={styles.container}>
      {/* Timeline Header */}
      <div style={styles.header}>
        {/* Left: Toolbar Buttons */}
        <div style={styles.toolbarLeft}>
          <button style={styles.toolButton} title="Selection Tool (V)">
            ⬆️
          </button>
          <button 
            style={styles.toolButton} 
            title="Delete (Del)"
            onClick={() => {
              if (selectedClipId) {
                removeClip(selectedClipId);
                setSelectedClipId(null);
              }
            }}
          >
            🗑️
          </button>
          <button style={styles.toolButton} title="Undo (Ctrl+Z)">
            ↩️
          </button>
          <button style={styles.toolButton} title="Redo (Ctrl+Y)">
            ↪️
          </button>
          <button 
            style={styles.toolButton}
            onClick={handleSplit}
            title="Split at Playhead (✂️)"
          >
            ✂️
          </button>
          <button style={styles.toolButton} title="Add Marker">
            🚩
          </button>
          <button style={styles.toolButton} title="Transitions">
            🎭
          </button>
          <button style={styles.toolButton} title="Add Text">
            📝
          </button>
        </div>

        {/* Center: Controls */}
        <div style={styles.controls}>
          {/* Time Display */}
          <span style={styles.timeDisplay}>
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>

          {/* Zoom Controls with Slider */}
          <div style={styles.zoomControls}>
            <button style={styles.zoomButton} onClick={handleZoomOut} title="Zoom Out">
              🔍−
            </button>
            
            {/* Zoom Slider */}
            <div style={styles.zoomSliderContainer}>
              {showZoomLabel && (
                <div style={styles.zoomLabelFloat}>
                  {Math.round(zoom)}px/s
                </div>
              )}
              <input
                type="range"
                min="1"
                max="30"
                value={zoom}
                onChange={(e) => {
                  const newZoom = parseFloat(e.target.value);
                  if (timelineWrapperRef.current && timelineRef.current) {
                    zoomTowardsCursor(newZoom);
                  }
                  handleZoomChange(newZoom);
                }}
                style={styles.zoomSlider}
              />
            </div>
            
            <button style={styles.zoomButton} onClick={handleZoomIn} title="Zoom In">
              🔍+
            </button>
          </div>
        </div>

        {/* Right: View Options */}
        <div style={styles.toolbarRight}>
          <button 
            style={styles.toolButton} 
            title="Fullscreen (F11)"
            onClick={onFullscreen}
          >
            ⛶
          </button>
          <button 
            style={styles.toolButton} 
            title="Hide Timeline"
            onClick={onToggleCollapse}
          >
            👁️
          </button>
        </div>
      </div>

      {/* Timeline Canvas Wrapper - Fixed Width */}
      <div 
        ref={timelineWrapperRef}
        style={{
          width: '100%', // 100% of parent container
          maxWidth: '100%', // Never exceed parent
          height: '180px',
          overflowX: 'auto',
          overflowY: 'hidden',
          backgroundColor: '#1a1a1a',
          position: 'relative' as const,
        }}
      >
        {/* Timeline Canvas - Content */}
        <div
          ref={timelineRef}
          style={{
            ...styles.timelineCanvas,
            // Width: use wrapper width if available, otherwise use timeline duration
            width: timelineWrapperRef.current 
              ? `${Math.max(
                  timelineWrapperRef.current.clientWidth,
                  Math.min(totalDuration * zoom + 100, timelineWrapperRef.current.clientWidth * 5)
                )}px`
              : `${totalDuration * zoom + 100}px`,
          }}
          onDragOver={handleTimelineDragOver}
          onDragLeave={handleTimelineDragLeave}
          onDrop={handleTimelineDrop}
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
              const isDragging = draggingClipId === clip.id;

              return (
                <div
                  key={clip.id}
                  style={{
                    ...styles.clip,
                    left: `${clipLeft}px`,
                    width: `${clipWidth}px`,
                    ...(isSelected ? styles.clipSelected : {}),
                    ...(isDragging ? styles.clipDragging : {}),
                    cursor: isDragging ? 'grabbing' : 'grab',
                  }}
                  title={clip.metadata.filename}
                  onMouseDown={(e) => handleClipDragStart(e, clip.id)}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent ruler click
                    setSelectedClipId(clip.id);
                  }}
                >
                  {/* Thumbnail Sequence */}
                  {clip.thumbnails && clip.thumbnails.length > 0 && (
                    <div style={styles.thumbnailSequence}>
                      {clip.thumbnails.map((thumbnail, thumbIndex) => {
                        const thumbWidth = 120; // Fixed width for each thumbnail
                        const thumbLeft = thumbIndex * thumbWidth;
                        
                        // Only render if thumbnail is within clip bounds
                        if (thumbLeft < clipWidth) {
                          return (
                            <img
                              key={thumbIndex}
                              src={thumbnail}
                              alt=""
                              style={{
                                ...styles.thumbnailImage,
                                left: `${thumbLeft}px`,
                                width: `${thumbWidth}px`,
                              }}
                            />
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}

                  {/* Clip Content Overlay */}
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

        {/* Drop Indicator Triangle (for clip reorder) */}
        {dropIndicatorIndex !== null && (
          <div
            style={{
              ...styles.dropIndicator,
              left: dropIndicatorIndex === 0
                ? `${TIMELINE_LEFT_OFFSET}px`
                : `${(clips.slice(0, dropIndicatorIndex).reduce((sum, c) => sum + c.duration, 0) * zoom) + TIMELINE_LEFT_OFFSET}px`,
            }}
          >
            <div style={styles.dropIndicatorTriangle} />
            <div style={styles.dropIndicatorLine} />
          </div>
        )}
        
        {/* Drop Indicator for Sidebar Videos */}
        {sidebarDropIndicatorIndex !== null && draggingVideo && (
          <div
            style={{
              ...styles.dropIndicator,
              left: sidebarDropIndicatorIndex === 0
                ? `${TIMELINE_LEFT_OFFSET}px`
                : `${(clips.slice(0, sidebarDropIndicatorIndex).reduce((sum, c) => sum + c.duration, 0) * zoom) + TIMELINE_LEFT_OFFSET}px`,
            }}
          >
            <div style={styles.dropIndicatorTriangle} />
            <div style={styles.dropIndicatorLine} />
          </div>
        )}

        {/* Ghost Clip */}
        {draggingClipId && ghostPosition && (() => {
          const draggingClip = clips.find(c => c.id === draggingClipId);
          return draggingClip && (
            <div
              style={{
                ...styles.ghostClip,
                left: `${ghostPosition.x - 40}px`,
                top: `${ghostPosition.y - 40}px`,
                width: `${draggingClip.duration * zoom}px`,
              }}
            >
              <div style={styles.clipHeader}>
                <span style={styles.clipName}>{draggingClip.metadata.filename}</span>
              </div>
              <div style={styles.clipInfo}>
                {formatTime(draggingClip.duration)}
              </div>
            </div>
          );
        })()}
      </div> {/* Close timelineCanvas */}
      </div> {/* Close wrapper */}
    </div>
  );
};

/**
 * Styles
 */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#2a2a2a',
    color: '#fff',
    height: '100%',
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 15px',
    backgroundColor: '#2a2a2a',
    borderBottom: '1px solid #444',
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  toolButton: {
    backgroundColor: '#3a3a3a',
    color: 'white',
    border: '1px solid #555',
    padding: '8px 12px',
    fontSize: '18px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '40px',
    height: '40px',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  importButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  controlButton: {
    backgroundColor: '#3a3a3a',
    color: 'white',
    border: '1px solid #555',
    padding: '8px 16px',
    fontSize: '16px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  timeDisplay: {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: '#aaa',
    padding: '0 15px',
    fontFamily: 'monospace',
  },
  zoomControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginLeft: '10px',
  },
  zoomSliderContainer: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  zoomSlider: {
    width: '150px',
    height: '4px',
    cursor: 'pointer',
    accentColor: '#667eea',
  },
  zoomLabelFloat: {
    position: 'absolute' as const,
    top: '-30px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    whiteSpace: 'nowrap' as const,
    pointerEvents: 'none' as const,
    zIndex: 1000,
  },
  zoomButton: {
    backgroundColor: '#3a3a3a',
    color: 'white',
    border: '1px solid #555',
    padding: '6px 12px',
    fontSize: '14px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  zoomLabel: {
    fontSize: '12px',
    color: '#888',
    minWidth: '50px',
    textAlign: 'center' as const,
  },
  timelineWrapper: {
    width: '100%',
    maxWidth: '100%',
    height: '180px',
    overflowX: 'auto' as const,
    overflowY: 'hidden' as const,
    backgroundColor: '#1a1a1a',
    position: 'relative' as const,
  },
  timelineCanvas: {
    position: 'relative' as const,
    height: '180px',
    backgroundColor: '#1a1a1a',
    cursor: 'pointer',
    padding: '0',
  },
  ruler: {
    position: 'relative' as const,
    height: '30px',
    borderBottom: '1px solid #444',
    backgroundColor: '#2a2a2a',
  },
  rulerMark: {
    position: 'absolute' as const,
    top: 0,
    height: '100%',
    borderLeft: '1px solid #555',
  },
  rulerLabel: {
    fontSize: '10px',
    color: '#888',
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
    padding: '0', // Remove padding to fit thumbnails
    cursor: 'grab',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
  },
  thumbnailSequence: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    overflow: 'hidden',
  },
  thumbnailImage: {
    position: 'absolute' as const,
    top: 0,
    height: '100%',
    objectFit: 'cover' as const,
    pointerEvents: 'none' as const,
    opacity: 0.7,
  },
  clipSelected: {
    border: '3px solid #fbbf24',
    boxShadow: '0 0 12px rgba(251, 191, 36, 0.5)',
  },
  clipDragging: {
    opacity: 0.6,
    cursor: 'grabbing',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    zIndex: 10,
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
    position: 'relative' as const,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 8px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 2,
  },
  clipName: {
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: '80%',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
  },
  removeButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
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
    zIndex: 3,
  },
  clipInfo: {
    position: 'absolute' as const,
    bottom: '6px',
    left: '8px',
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    padding: '2px 6px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: '4px',
    zIndex: 2,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
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
  
  // Drop indicator styles
  dropIndicator: {
    position: 'absolute' as const,
    top: '30px',
    bottom: 0,
    zIndex: 15,
    pointerEvents: 'none' as const,
  },
  dropIndicatorTriangle: {
    width: 0,
    height: 0,
    borderLeft: '8px solid transparent',
    borderRight: '8px solid transparent',
    borderTop: '12px solid #667eea',
    marginLeft: '-8px',
  },
  dropIndicatorLine: {
    width: '3px',
    height: '100%',
    backgroundColor: '#667eea',
    marginLeft: '-1.5px',
  },
  
  // Ghost clip styles
  ghostClip: {
    position: 'fixed' as const,
    height: '80px',
    backgroundColor: 'rgba(102, 126, 234, 0.5)',
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.5) 0%, rgba(118, 75, 162, 0.5) 100%)',
    borderRadius: '6px',
    border: '2px dashed rgba(255, 255, 255, 0.5)',
    padding: '8px',
    cursor: 'grabbing',
    overflow: 'hidden',
    zIndex: 1000,
    pointerEvents: 'none' as const,
  },
};

