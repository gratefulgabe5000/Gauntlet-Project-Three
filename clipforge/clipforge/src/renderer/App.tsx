/**
 * ClipForge - Main Application Component
 * Root component that manages app state and layout
 */

/// <reference path="./global.d.ts" />

import React, { useState } from 'react';
import { VideoImport } from './components/import/VideoImport';
import { VideoMetadata } from '../shared/types';

export const App: React.FC = () => {
  const [importedVideos, setImportedVideos] = useState<VideoMetadata[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleVideoImport = async (filePath: string) => {
    console.log('Video imported:', filePath);
    
    // Extract metadata using FFmpeg
    setIsExtracting(true);
    try {
      const metadata = await window.electron?.extractMetadata(filePath);
      
      if (metadata) {
        console.log('✅ Metadata extracted:', metadata);
        setImportedVideos(prev => [...prev, metadata]);
      }
    } catch (error) {
      console.error('❌ Failed to extract metadata:', error);
      // Still add the video with minimal info
      setImportedVideos(prev => [...prev, {
        path: filePath,
        filename: filePath.split(/[\\/]/).pop() || 'unknown',
        duration: 0,
        width: 0,
        height: 0,
        size: 0,
        format: 'unknown',
      }]);
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

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.logo}>🎬 ClipForge</h1>
        <p style={styles.tagline}>Desktop Video Editor</p>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <VideoImport onVideoImport={handleVideoImport} />

        {/* Loading indicator */}
        {isExtracting && (
          <div style={styles.loading}>
            <p>⏳ Extracting video metadata...</p>
          </div>
        )}

        {/* Show imported videos with metadata */}
        {importedVideos.length > 0 && (
          <div style={styles.status}>
            <h3 style={styles.statusTitle}>✅ Imported Videos ({importedVideos.length})</h3>
            <div style={styles.videoGrid}>
              {importedVideos.map((video, index) => (
                <div key={index} style={styles.videoCard}>
                  <div style={styles.videoCardHeader}>
                    <span style={styles.videoIcon}>🎬</span>
                    <span style={styles.videoFilename}>{video.filename}</span>
                  </div>
                  <div style={styles.videoMetadata}>
                    <div style={styles.metadataRow}>
                      <span style={styles.metadataLabel}>Duration:</span>
                      <span style={styles.metadataValue}>{formatDuration(video.duration)}</span>
                    </div>
                    <div style={styles.metadataRow}>
                      <span style={styles.metadataLabel}>Resolution:</span>
                      <span style={styles.metadataValue}>{video.width}x{video.height}</span>
                    </div>
                    <div style={styles.metadataRow}>
                      <span style={styles.metadataLabel}>Size:</span>
                      <span style={styles.metadataValue}>{formatFileSize(video.size)}</span>
                    </div>
                    <div style={styles.metadataRow}>
                      <span style={styles.metadataLabel}>Format:</span>
                      <span style={styles.metadataValue}>{video.format}</span>
                    </div>
                    {video.fps && (
                      <div style={styles.metadataRow}>
                        <span style={styles.metadataLabel}>FPS:</span>
                        <span style={styles.metadataValue}>{Math.round(video.fps)}</span>
                      </div>
                    )}
                    {video.codec && (
                      <div style={styles.metadataRow}>
                        <span style={styles.metadataLabel}>Codec:</span>
                        <span style={styles.metadataValue}>{video.codec}</span>
                      </div>
                    )}
                  </div>
                  <div style={styles.videoPath}>{video.path}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>72-Hour Sprint - MVP Development - Monday Morning</p>
      </footer>
    </div>
  );
};

const styles = {
  app: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#667eea',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '20px 40px',
    textAlign: 'center' as const,
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  logo: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 'bold' as const,
  },
  tagline: {
    margin: '5px 0 0 0',
    fontSize: '14px',
    opacity: 0.9,
  },
  main: {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
  },
  loading: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#fff3cd',
    borderRadius: '10px',
    border: '2px solid #ffc107',
    textAlign: 'center' as const,
    fontSize: '16px',
    fontWeight: 'bold' as const,
  },
  status: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  statusTitle: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    color: '#333',
  },
  videoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  videoCard: {
    backgroundColor: '#f8f9fa',
    border: '2px solid #e9ecef',
    borderRadius: '10px',
    padding: '15px',
    transition: 'all 0.2s ease',
  },
  videoCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '1px solid #dee2e6',
  },
  videoIcon: {
    fontSize: '24px',
  },
  videoFilename: {
    fontSize: '16px',
    fontWeight: 'bold' as const,
    color: '#333',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  videoMetadata: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  metadataRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
  },
  metadataLabel: {
    color: '#666',
    fontWeight: '500' as const,
  },
  metadataValue: {
    color: '#333',
    fontWeight: 'bold' as const,
  },
  videoPath: {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid #dee2e6',
    fontSize: '11px',
    color: '#999',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  videoList: {
    marginTop: '10px',
    paddingLeft: '20px',
  },
  footer: {
    backgroundColor: '#333',
    color: 'white',
    padding: '15px',
    textAlign: 'center' as const,
    fontSize: '12px',
  },
};

