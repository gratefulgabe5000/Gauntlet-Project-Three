/**
 * ClipForge - Main Application Component
 * Root component that manages app state and layout
 */

/// <reference path="./global.d.ts" />

import React, { useState, useCallback } from 'react';
import { VideoImport } from './components/import/VideoImport';
import { Timeline } from './components/timeline/Timeline';
import { VideoPlayer } from './components/player/VideoPlayer';
import { TimelineProvider, useTimeline } from './context/TimelineContext';
import { ActionHistoryProvider, useActionHistory } from './context/ActionHistoryContext';
import { VideoMetadata } from '../shared/types';

const AppContent: React.FC = () => {
  const [importedVideos, setImportedVideos] = useState<VideoMetadata[]>([]);
  const [videoThumbnails, setVideoThumbnails] = useState<{ [path: string]: string }>({});
  const [isExtracting, setIsExtracting] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<{ isPlaying: boolean; clip: any } | null>(null);
  const [isDraggingOverSidebar, setIsDraggingOverSidebar] = useState(false);
  const [draggingVideo, setDraggingVideo] = useState<VideoMetadata | null>(null);
  const { addClipToTimeline } = useTimeline();
  const { canUndo, canRedo, undo, redo } = useActionHistory();

  const handleVideoImport = async (filePath: string) => {
    console.log('Video imported:', filePath);
    
    // Extract metadata using FFmpeg
    setIsExtracting(true);
    try {
      const metadata = await window.electron?.extractMetadata(filePath);
      
      if (metadata) {
        console.log('✅ Metadata extracted:', metadata);
        setImportedVideos(prev => [...prev, metadata]);
        
        // Generate thumbnail for sidebar
        try {
          const thumbnail = await window.electron?.generateThumbnail(filePath, metadata.duration / 2);
          if (thumbnail) {
            setVideoThumbnails(prev => ({ ...prev, [filePath]: thumbnail }));
          }
        } catch (thumbError) {
          console.error('⚠️ Thumbnail generation failed:', thumbError);
        }
        
        // Automatically add to timeline
        addClipToTimeline(metadata);
      }
    } catch (error) {
      console.error('❌ Failed to extract metadata:', error);
      // Still add the video with minimal info
      const fallbackMetadata: VideoMetadata = {
        path: filePath,
        filename: filePath.split(/[\\/]/).pop() || 'unknown',
        duration: 0,
        width: 0,
        height: 0,
        size: 0,
        format: 'unknown',
      };
      setImportedVideos(prev => [...prev, fallbackMetadata]);
      addClipToTimeline(fallbackMetadata);
    } finally {
      setIsExtracting(false);
    }
  };

  /**
   * Format duration from seconds to MM:SS
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Format file size to human-readable format
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Handle playback state changes from VideoPlayer
   */
  const handlePlaybackStateChange = useCallback((isPlaying: boolean, clip: any) => {
    setNowPlaying({ isPlaying, clip });
  }, []);

  /**
   * Handle drag over sidebar
   */
  const handleSidebarDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverSidebar(true);
  };

  /**
   * Handle drag leave sidebar
   */
  const handleSidebarDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverSidebar(false);
  };

  /**
   * Handle drop on sidebar
   */
  const handleSidebarDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverSidebar(false);

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
      if (filePath) {
        console.log('✅ Video dropped on sidebar:', filePath);
        handleVideoImport(filePath);
      } else {
        console.error('❌ Could not access file path');
      }
    } catch (error) {
      console.error('❌ Drop error:', error);
    }
  };

  return (
    <div style={styles.app}>
      {/* Main Layout: Left Section + Content */}
      <div style={styles.mainLayout}>
        {/* Left Section: Fixed Banner + Collapsible Sidebar */}
        <div style={styles.leftSection}>
          {/* ClipForge Banner - ALWAYS VISIBLE, NEVER COLLAPSES */}
          <div style={styles.fixedBanner}>
            <h1 style={styles.logo}>🎬 ClipForge</h1>
          </div>

          {/* Collapsible Sidebar */}
          <aside style={{
            ...styles.sidebar,
            width: sidebarCollapsed ? '50px' : '280px',
          }}>
            {/* Collapse Tab - Fixed to viewport center */}
            <div 
              style={{
                ...styles.collapseTab,
                left: sidebarCollapsed ? '50px' : '280px',
              }}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              onMouseEnter={(e) => {
                const arrow = e.currentTarget.querySelector('span') as HTMLElement;
                if (arrow) arrow.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                const arrow = e.currentTarget.querySelector('span') as HTMLElement;
                if (arrow) arrow.style.color = '#3a3a3a';
              }}
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <span style={styles.collapseTabArrow}>
                {sidebarCollapsed ? '▶' : '◀'}
              </span>
            </div>

            {/* Sidebar Header */}
            <div style={styles.sidebarHeader}>
              {!sidebarCollapsed && <h3 style={styles.sidebarTitle}>📁 Media</h3>}
            </div>

            {/* Sidebar Content */}
            {!sidebarCollapsed && (
            <div style={styles.sidebarContent}>
              {/* Import Button */}
              <button
                style={styles.sidebarImportButton}
                onClick={() => {
                  window.electron?.openFileDialog().then(path => {
                    if (path) handleVideoImport(path);
                  });
                }}
              >
                ➕ Import Video
              </button>

              {/* Loading Indicator */}
              {isExtracting && (
                <div style={styles.loading}>
                  <p>⏳ Loading...</p>
                </div>
              )}

              {/* Imported Videos List */}
              <div 
                style={{
                  ...styles.mediaListContainer,
                  ...(isDraggingOverSidebar ? styles.mediaListDragging : {}),
                }}
                onDragOver={handleSidebarDragOver}
                onDragLeave={handleSidebarDragLeave}
                onDrop={handleSidebarDrop}
              >
                {importedVideos.length === 0 && !isExtracting && (
                  <div style={styles.emptyState}>
                    <p style={styles.emptyStateIcon}>📹</p>
                    <p style={styles.emptyStateText}>
                      {isDraggingOverSidebar ? 'Drop video here!' : 'Drag & drop videos here or use button above'}
                    </p>
                  </div>
                )}

                {importedVideos.map((video, index) => (
                  <div 
                    key={index} 
                    style={styles.mediaCard}
                    draggable
                    onDragStart={(e) => {
                      setDraggingVideo(video);
                      e.dataTransfer.effectAllowed = 'copy';
                      e.dataTransfer.setData('text/plain', video.path);
                      
                      // Create ghost element
                      const ghost = document.createElement('div');
                      ghost.style.cssText = `
                        position: absolute;
                        top: -1000px;
                        width: 250px;
                        background-color: #3a3a3a;
                        border-radius: 8px;
                        padding: 10px;
                        opacity: 0.9;
                        pointer-events: none;
                      `;
                      
                      ghost.innerHTML = `
                        <div style="background: #2a2a2a; border-radius: 6px; padding: 8px; margin-bottom: 8px; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; font-size: 32px;">
                          🎬
                        </div>
                        <div style="font-size: 13px; font-weight: 600; color: white; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          ${video.filename}
                        </div>
                      `;
                      
                      document.body.appendChild(ghost);
                      e.dataTransfer.setDragImage(ghost, 125, 50);
                      setTimeout(() => document.body.removeChild(ghost), 0);
                    }}
                    onDragEnd={() => {
                      setDraggingVideo(null);
                    }}
                  >
                    <div style={styles.mediaThumbnailContainer}>
                      {videoThumbnails[video.path] ? (
                        <img 
                          src={videoThumbnails[video.path]} 
                          alt={video.filename}
                          style={styles.mediaThumbnailImage}
                        />
                      ) : (
                        <div style={styles.mediaThumbnail}>
                          <span style={styles.mediaThumbnailIcon}>🎬</span>
                        </div>
                      )}
                      {video.duration > 0 && (
                        <div style={styles.thumbnailDuration}>
                          {formatDuration(video.duration)}
                        </div>
                      )}
                    </div>
                    <div style={styles.mediaFilename}>{video.filename}</div>
                  </div>
                ))}
              </div>

              {/* Now Playing Section */}
              {nowPlaying && nowPlaying.clip && (
                <div style={styles.nowPlayingSection}>
                  <div style={styles.nowPlayingHeader}>
                    <h4 style={styles.nowPlayingTitle}>
                      {nowPlaying.isPlaying ? '▶️ Now Playing' : '⏸️ Paused'}
                    </h4>
                    <button
                      style={styles.rewindButton}
                      onClick={() => {
                        // Trigger rewind via custom event
                        const event = new CustomEvent('rewind-to-start');
                        window.dispatchEvent(event);
                      }}
                      title="Rewind to start"
                    >
                      ⏮️
                    </button>
                  </div>
                  <div style={styles.nowPlayingCard}>
                    <button
                      style={styles.nowPlayingPlayButton}
                      onClick={() => {
                        // Trigger play/pause via a custom event
                        const event = new CustomEvent('toggle-playback');
                        window.dispatchEvent(event);
                      }}
                      title={nowPlaying.isPlaying ? 'Pause' : 'Play'}
                    >
                      {nowPlaying.isPlaying ? '⏸️' : '▶️'}
                    </button>
                    <div style={styles.nowPlayingIcon}>🎬</div>
                    <div style={styles.nowPlayingInfo}>
                      <div style={styles.nowPlayingFilename}>
                        {nowPlaying.clip.metadata.filename}
                      </div>
                      <div style={styles.nowPlayingMeta}>
                        {formatDuration(nowPlaying.clip.duration)}
                        {nowPlaying.clip.trimStart || nowPlaying.clip.trimEnd ? (
                          <span style={styles.trimmedIndicator}> • ✂️ Trimmed</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
        </div>

        {/* Main Content Area */}
        <div style={styles.contentArea}>
          {/* Top Header Banner */}
          <div style={styles.topHeaderBanner}>
            <div style={styles.headerRight}>
              <button 
                style={{
                  ...styles.headerButton,
                  opacity: canUndo ? 1 : 0.3,
                  cursor: canUndo ? 'pointer' : 'not-allowed',
                }}
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
              >
                ↩️
              </button>
              <button 
                style={{
                  ...styles.headerButton,
                  opacity: canRedo ? 1 : 0.3,
                  cursor: canRedo ? 'pointer' : 'not-allowed',
                }}
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
              >
                ↪️
              </button>
              <div style={styles.headerDivider} />
              <button style={styles.headerButton} title="Share">🔗</button>
              <button style={styles.headerButton} title="Download">⬇️</button>
              <button style={styles.headerButton} title="Settings">⚙️</button>
            </div>
          </div>

          {/* Video Player - Center */}
          <div style={{
            ...styles.playerArea,
            flex: timelineCollapsed ? 1 : undefined,
          }}>
            <VideoPlayer 
              onPlaybackStateChange={handlePlaybackStateChange}
              onVideoImport={handleVideoImport}
              draggingVideo={draggingVideo}
            />
          </div>

          {/* Timeline - Bottom (Fixed Height or Collapsed) */}
          {!timelineCollapsed && (
            <div style={styles.timelineArea}>
              <Timeline 
                onImportVideo={() => {
                  window.electron?.openFileDialog().then(path => {
                    if (path) handleVideoImport(path);
                  });
                }}
                onToggleCollapse={() => setTimelineCollapsed(!timelineCollapsed)}
                onFullscreen={() => {
                  // Toggle fullscreen
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                  } else {
                    document.exitFullscreen();
                  }
                }}
                draggingVideo={draggingVideo}
              />
            </div>
          )}
          
          {/* Collapsed Timeline Button */}
          {timelineCollapsed && (
            <div style={styles.collapsedTimelineBar}>
              <button 
                style={styles.expandTimelineButton}
                onClick={() => setTimelineCollapsed(false)}
                title="Show Timeline"
              >
                ▲ Timeline
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App with Providers
export const App: React.FC = () => {
  return (
    <ActionHistoryProvider>
      <TimelineProvider>
        <AppContent />
      </TimelineProvider>
    </ActionHistoryProvider>
  );
};

const styles = {
  // App Container - Fixed viewport, no scrolling
  app: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },

  // Main Layout - Sidebar + Content (full height)
  mainLayout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },

  // Left Section: Fixed Banner + Collapsible Sidebar
  leftSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    flexShrink: 0,
  },

  // Fixed Banner - NEVER COLLAPSES
  fixedBanner: {
    width: '280px',
    backgroundColor: '#667eea',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
    height: '44px',
    boxSizing: 'border-box' as const,
  },

  // Left Sidebar - Collapsible
  sidebar: {
    backgroundColor: '#2a2a2a',
    borderRight: '1px solid #444',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'visible',
    transition: 'width 0.3s ease',
    flexShrink: 0,
    position: 'relative' as const,
  },
  
  // Collapse Tab on sidebar edge
  collapseTab: {
    position: 'fixed' as const,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '20px',
    height: '80px',
    backgroundColor: '#2a2a2a',
    borderTopRightRadius: '8px',
    borderBottomRightRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'left 0.3s ease',
    zIndex: 10000,
    border: '1px solid #2a2a2a',
    borderLeft: 'none',
  },
  collapseTabArrow: {
    color: '#3a3a3a',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    transition: 'color 0.2s ease',
  },
  
  logo: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold' as const,
  },
  sidebarHeader: {
    padding: '15px',
    borderBottom: '1px solid #444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  sidebarTitle: {
    margin: 0,
    fontSize: '16px',
    color: '#fff',
    fontWeight: 'bold' as const,
  },
  sidebarContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    padding: '15px',
  },
  sidebarImportButton: {
    width: '100%',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '15px',
    flexShrink: 0,
  },
  loading: {
    padding: '15px',
    backgroundColor: '#3a3a3a',
    borderRadius: '8px',
    textAlign: 'center' as const,
    fontSize: '14px',
    color: '#ffc107',
    marginBottom: '15px',
    flexShrink: 0,
  },
  
  // Scrollable media list container
  mediaListContainer: {
    flex: 1,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    marginBottom: '15px',
    transition: 'all 0.3s ease',
    borderRadius: '8px',
  },
  mediaListDragging: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    border: '2px dashed #667eea',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: '#666',
  },
  emptyStateIcon: {
    fontSize: '48px',
    margin: '0 0 15px 0',
  },
  emptyStateText: {
    margin: 0,
    fontSize: '14px',
  },

  // Media Cards in Sidebar
  mediaCard: {
    backgroundColor: '#3a3a3a',
    borderRadius: '8px',
    padding: '10px',
    marginBottom: '10px',
    display: 'flex',
    flexDirection: 'column' as const,
    cursor: 'grab',
    transition: 'all 0.2s ease',
  },
  mediaThumbnailContainer: {
    position: 'relative' as const,
    width: '100%',
    marginBottom: '8px',
  },
  mediaThumbnailImage: {
    width: '100%',
    height: 'auto',
    aspectRatio: '16 / 9',
    objectFit: 'cover' as const,
    borderRadius: '6px',
    display: 'block',
  },
  mediaThumbnail: {
    width: '100%',
    aspectRatio: '16 / 9',
    backgroundColor: '#2a2a2a',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaThumbnailIcon: {
    fontSize: '32px',
  },
  thumbnailDuration: {
    position: 'absolute' as const,
    bottom: '6px',
    right: '6px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    padding: '2px 6px',
    borderRadius: '4px',
  },
  mediaInfo: {
    flex: 1,
    overflow: 'hidden',
  },
  mediaFilename: {
    fontSize: '13px',
    fontWeight: '600' as const,
    color: '#fff',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    textAlign: 'center' as const,
  },
  mediaMeta: {
    fontSize: '11px',
    color: '#888',
  },

  // Now Playing Section - Pinned to bottom
  nowPlayingSection: {
    paddingTop: '15px',
    borderTop: '1px solid #444',
    flexShrink: 0,
    marginTop: 'auto',
  },
  nowPlayingHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  nowPlayingTitle: {
    margin: 0,
    fontSize: '12px',
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  rewindButton: {
    fontSize: '18px',
    padding: '4px 8px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    backgroundColor: '#3a3a3a',
    color: '#fff',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  nowPlayingCard: {
    backgroundColor: '#667eea',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  nowPlayingPlayButton: {
    fontSize: '24px',
    padding: '8px 12px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    transition: 'all 0.2s ease',
    fontWeight: 'bold' as const,
    flexShrink: 0,
  },
  nowPlayingIcon: {
    fontSize: '32px',
  },
  nowPlayingInfo: {
    flex: 1,
    overflow: 'hidden',
  },
  nowPlayingFilename: {
    fontSize: '13px',
    fontWeight: 'bold' as const,
    color: '#fff',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    marginBottom: '4px',
  },
  nowPlayingMeta: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  trimmedIndicator: {
    color: '#ffc107',
  },

  // Content Area (Player + Timeline)
  contentArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  
  // Top Header Banner
  topHeaderBanner: {
    height: '44px',
    backgroundColor: '#2a2a2a',
    borderBottom: '1px solid #444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 20px',
    flexShrink: 0,
    boxSizing: 'border-box' as const,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '6px',
    transition: 'background-color 0.2s ease',
  },
  headerDivider: {
    width: '1px',
    height: '24px',
    backgroundColor: '#555',
    margin: '0 5px',
  },

  // Player Area - Flex grow to fill available space
  playerArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    display: 'flex',
    overflow: 'hidden',
    minHeight: 0, // Critical for flex shrinking
  },
  welcomeScreen: {
    width: '100%',
    maxWidth: '600px',
    padding: '20px',
  },

  // Timeline Area - Fixed height at bottom
  timelineArea: {
    height: '240px',
    backgroundColor: '#2a2a2a',
    borderTop: '1px solid #444',
    overflow: 'hidden',
    flexShrink: 0,
  },
  
  // Collapsed Timeline Bar
  collapsedTimelineBar: {
    height: '40px',
    backgroundColor: '#2a2a2a',
    borderTop: '1px solid #444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  expandTimelineButton: {
    backgroundColor: '#3a3a3a',
    color: 'white',
    border: '1px solid #555',
    padding: '8px 20px',
    fontSize: '14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    transition: 'all 0.2s ease',
  },
};



