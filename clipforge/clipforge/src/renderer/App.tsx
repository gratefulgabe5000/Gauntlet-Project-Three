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
import { VideoMetadata } from '../shared/types';

const AppContent: React.FC = () => {
  const [importedVideos, setImportedVideos] = useState<VideoMetadata[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<{ isPlaying: boolean; clip: any } | null>(null);
  const { addClipToTimeline } = useTimeline();

  const handleVideoImport = async (filePath: string) => {
    console.log('Video imported:', filePath);
    
    // Extract metadata using FFmpeg
    setIsExtracting(true);
    try {
      const metadata = await window.electron?.extractMetadata(filePath);
      
      if (metadata) {
        console.log('✅ Metadata extracted:', metadata);
        setImportedVideos(prev => [...prev, metadata]);
        
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

  return (
    <div style={styles.app}>
      {/* Top Header - Compact */}
      <header style={styles.header}>
        <h1 style={styles.logo}>🎬 ClipForge</h1>
        <p style={styles.tagline}>Desktop Video Editor - MVP Cycle 1.3</p>
      </header>

      {/* Main Layout: Sidebar + Content */}
      <div style={styles.mainLayout}>
        {/* Left Sidebar - Collapsible Material Panel */}
        <aside style={{
          ...styles.sidebar,
          width: sidebarCollapsed ? '50px' : '280px',
        }}>
          {/* Sidebar Header */}
          <div style={styles.sidebarHeader}>
            {!sidebarCollapsed && <h3 style={styles.sidebarTitle}>📁 Media</h3>}
            <button
              style={styles.collapseButton}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expand' : 'Collapse'}
            >
              {sidebarCollapsed ? '▶️' : '◀️'}
            </button>
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
              {importedVideos.length === 0 && !isExtracting && (
                <div style={styles.emptyState}>
                  <p style={styles.emptyStateIcon}>📹</p>
                  <p style={styles.emptyStateText}>No media imported yet</p>
                </div>
              )}

              {importedVideos.map((video, index) => (
                <div key={index} style={styles.mediaCard}>
                  <div style={styles.mediaThumbnail}>
                    <span style={styles.mediaThumbnailIcon}>🎬</span>
                  </div>
                  <div style={styles.mediaInfo}>
                    <div style={styles.mediaFilename}>{video.filename}</div>
                    <div style={styles.mediaMeta}>
                      {video.duration > 0 && <span>{formatDuration(video.duration)}</span>}
                      {video.width > 0 && <span> • {video.width}x{video.height}</span>}
                    </div>
                  </div>
                </div>
              ))}

              {/* Now Playing Section */}
              {nowPlaying && nowPlaying.clip && (
                <div style={styles.nowPlayingSection}>
                  <h4 style={styles.nowPlayingTitle}>
                    {nowPlaying.isPlaying ? '▶️ Now Playing' : '⏸️ Paused'}
                  </h4>
                  <div style={styles.nowPlayingCard}>
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

        {/* Main Content Area */}
        <div style={styles.contentArea}>
          {/* Video Player - Center */}
          <div style={styles.playerArea}>
            {importedVideos.length === 0 ? (
              <div style={styles.welcomeScreen}>
                <VideoImport onVideoImport={handleVideoImport} />
              </div>
            ) : (
              <VideoPlayer onPlaybackStateChange={handlePlaybackStateChange} />
            )}
          </div>

          {/* Timeline - Bottom (Fixed Height) */}
          <div style={styles.timelineArea}>
            <Timeline onImportVideo={() => {
              window.electron?.openFileDialog().then(path => {
                if (path) handleVideoImport(path);
              });
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App with Provider
export const App: React.FC = () => {
  return (
    <TimelineProvider>
      <AppContent />
    </TimelineProvider>
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

  // Compact Header
  header: {
    backgroundColor: '#667eea',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
    flexShrink: 0,
  },
  logo: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold' as const,
  },
  tagline: {
    margin: 0,
    fontSize: '12px',
    opacity: 0.9,
  },

  // Main Layout - Sidebar + Content
  mainLayout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },

  // Left Sidebar - Collapsible
  sidebar: {
    backgroundColor: '#2a2a2a',
    borderRight: '1px solid #444',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    transition: 'width 0.3s ease',
    flexShrink: 0,
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
  collapseButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '5px',
  },
  sidebarContent: {
    flex: 1,
    overflow: 'auto',
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
  },
  loading: {
    padding: '15px',
    backgroundColor: '#3a3a3a',
    borderRadius: '8px',
    textAlign: 'center' as const,
    fontSize: '14px',
    color: '#ffc107',
    marginBottom: '15px',
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
    gap: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  mediaThumbnail: {
    width: '60px',
    height: '45px',
    backgroundColor: '#2a2a2a',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mediaThumbnailIcon: {
    fontSize: '24px',
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
    marginBottom: '4px',
  },
  mediaMeta: {
    fontSize: '11px',
    color: '#888',
  },

  // Now Playing Section
  nowPlayingSection: {
    marginTop: 'auto',
    paddingTop: '15px',
    borderTop: '1px solid #444',
  },
  nowPlayingTitle: {
    margin: '0 0 10px 0',
    fontSize: '12px',
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
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

  // Player Area - Flex grow to fill available space
  playerArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
};



