/**
 * ClipForge - Video Import Component
 * Drag & drop and file picker for video imports
 */

/// <reference path="../../global.d.ts" />

import React, { useState, DragEvent } from 'react';
import { VIDEO_FORMATS } from '../../../shared/constants';

interface VideoImportProps {
  onVideoImport: (filePath: string) => void;
}

export const VideoImport: React.FC<VideoImportProps> = ({ onVideoImport }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validate file type and size
   */
  const validateFile = (file: File): string | null => {
    // Check file extension
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!VIDEO_FORMATS.SUPPORTED_INPUT.includes(extension)) {
      return `Unsupported format. Please use: ${VIDEO_FORMATS.SUPPORTED_INPUT.join(', ')}`;
    }

    // Check file size
    if (file.size > VIDEO_FORMATS.MAX_FILE_SIZE) {
      const maxSizeMB = VIDEO_FORMATS.MAX_FILE_SIZE / (1024 * 1024);
      return `File too large. Maximum size: ${maxSizeMB}MB`;
    }

    return null; // Valid file
  };

  /**
   * Handle file import from drag & drop
   */
  const handleFile = async (file: File) => {
    setError(null);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Try to get file path from Electron API
    let filePath = window.electron?.getFilePath(file);
    
    if (!filePath) {
      // If .path is not available, show error suggesting file picker
      setError('Drag & drop path not accessible. Please use the "Choose Video File" button.');
      console.error('File path not available from drag & drop:', file);
      console.log('File object keys:', Object.keys(file));
      console.log('Try using the Choose Video File button instead');
      return;
    }

    console.log('✅ Video imported (drag & drop):', filePath);

    // Notify parent component
    onVideoImport(filePath);
  };

  /**
   * Drag & Drop Handlers
   */
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) {
      setError('No file detected');
      return;
    }

    // Handle first file only for now
    handleFile(files[0]);
  };

  /**
   * File Picker Handler using native dialog
   */
  const openFilePicker = async () => {
    setError(null);
    
    try {
      console.log('Opening file dialog...');
      const filePath = await window.electron?.openFileDialog();
      
      if (!filePath) {
        // User cancelled
        console.log('User cancelled file selection');
        return;
      }
      
      console.log('✅ Video selected:', filePath);
      
      // Notify parent component
      onVideoImport(filePath);
    } catch (error) {
      console.error('Error opening file dialog:', error);
      setError(`Failed to open file dialog: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.dropZone,
          ...(isDragging ? styles.dropZoneDragging : {}),
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div style={styles.content}>
          {/* Icon */}
          <div style={styles.icon}>🎬</div>

          {/* Title */}
          <h2 style={styles.title}>Import Video</h2>

          {/* Instructions */}
          <p style={styles.instructions}>
            {isDragging 
              ? 'Drop your video here!' 
              : 'Drag and drop a video file here'}
          </p>

          {/* Divider */}
          <div style={styles.divider}>or</div>

          {/* File Picker Button */}
          <button style={styles.button} onClick={openFilePicker}>
            Choose Video File
          </button>

          {/* Supported Formats */}
          <p style={styles.formats}>
            Supported: {VIDEO_FORMATS.SUPPORTED_INPUT.join(', ')}
          </p>

          {/* Error Message */}
          {error && (
            <div style={styles.error}>
              <span style={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Styles
 */
const styles = {
  container: {
    padding: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
  dropZone: {
    border: '3px dashed #667eea',
    borderRadius: '20px',
    padding: '60px 40px',
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minWidth: '500px',
    textAlign: 'center' as const,
  },
  dropZoneDragging: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    border: '3px solid #764ba2',
    transform: 'scale(1.02)',
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '20px',
  },
  icon: {
    fontSize: '64px',
    marginBottom: '10px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold' as const,
    color: '#667eea',
    margin: 0,
  },
  instructions: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
  },
  divider: {
    fontSize: '14px',
    color: '#999',
    margin: '10px 0',
    position: 'relative' as const,
  },
  button: {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  formats: {
    fontSize: '12px',
    color: '#999',
    margin: 0,
  },
  error: {
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#c33',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    maxWidth: '400px',
  },
  errorIcon: {
    fontSize: '18px',
  },
};

