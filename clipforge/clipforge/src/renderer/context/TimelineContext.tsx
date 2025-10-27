/**
 * ClipForge - Timeline Context
 * Manages timeline state and operations
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { VideoClip, TimelineState, VideoMetadata } from '../../shared/types';

interface TimelineContextType {
  timelineState: TimelineState;
  addClipToTimeline: (metadata: VideoMetadata) => void;
  removeClip: (clipId: string) => void;
  updateClipPosition: (clipId: string, startTime: number) => void;
  setCurrentTime: (time: number) => void;
  setZoom: (zoom: number) => void;
  clearTimeline: () => void;
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

export const useTimeline = () => {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error('useTimeline must be used within TimelineProvider');
  }
  return context;
};

interface TimelineProviderProps {
  children: React.ReactNode;
}

export const TimelineProvider: React.FC<TimelineProviderProps> = ({ children }) => {
  const [timelineState, setTimelineState] = useState<TimelineState>({
    clips: [],
    totalDuration: 0,
    currentTime: 0,
    zoom: 10, // 10 pixels per second (default zoom level)
  });

  /**
   * Generate unique ID for clips
   */
  const generateClipId = (): string => {
    return `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Add a video clip to the timeline
   */
  const addClipToTimeline = useCallback((metadata: VideoMetadata) => {
    setTimelineState((prev) => {
      // Calculate where to place the clip (at the end of existing clips)
      const startTime = prev.totalDuration;
      
      const newClip: VideoClip = {
        id: generateClipId(),
        metadata,
        startTime,
        duration: metadata.duration,
        track: 0, // For MVP, all clips go on track 0
      };

      const newTotalDuration = startTime + metadata.duration;

      console.log('✅ Added clip to timeline:', {
        id: newClip.id,
        filename: metadata.filename,
        startTime,
        duration: metadata.duration,
      });

      return {
        ...prev,
        clips: [...prev.clips, newClip],
        totalDuration: newTotalDuration,
      };
    });
  }, []);

  /**
   * Remove a clip from the timeline
   */
  const removeClip = useCallback((clipId: string) => {
    setTimelineState((prev) => {
      const clipToRemove = prev.clips.find((c) => c.id === clipId);
      if (!clipToRemove) return prev;

      // Remove the clip
      const newClips = prev.clips.filter((c) => c.id !== clipId);

      // Recalculate positions of clips after the removed one
      const updatedClips = newClips.map((clip) => {
        if (clip.startTime > clipToRemove.startTime) {
          return {
            ...clip,
            startTime: clip.startTime - clipToRemove.duration,
          };
        }
        return clip;
      });

      // Recalculate total duration
      const newTotalDuration = updatedClips.reduce(
        (max, clip) => Math.max(max, clip.startTime + clip.duration),
        0
      );

      console.log('🗑️ Removed clip from timeline:', clipId);

      return {
        ...prev,
        clips: updatedClips,
        totalDuration: newTotalDuration,
      };
    });
  }, []);

  /**
   * Update clip position on timeline
   */
  const updateClipPosition = useCallback((clipId: string, startTime: number) => {
    setTimelineState((prev) => {
      const updatedClips = prev.clips.map((clip) => {
        if (clip.id === clipId) {
          return { ...clip, startTime };
        }
        return clip;
      });

      // Recalculate total duration
      const newTotalDuration = updatedClips.reduce(
        (max, clip) => Math.max(max, clip.startTime + clip.duration),
        0
      );

      return {
        ...prev,
        clips: updatedClips,
        totalDuration: newTotalDuration,
      };
    });
  }, []);

  /**
   * Set playhead position
   */
  const setCurrentTime = useCallback((time: number) => {
    setTimelineState((prev) => ({
      ...prev,
      currentTime: Math.max(0, Math.min(time, prev.totalDuration)),
    }));
  }, []);

  /**
   * Set zoom level (pixels per second)
   */
  const setZoom = useCallback((zoom: number) => {
    setTimelineState((prev) => ({
      ...prev,
      zoom: Math.max(5, Math.min(zoom, 50)), // Clamp between 5 and 50 px/sec
    }));
  }, []);

  /**
   * Clear all clips from timeline
   */
  const clearTimeline = useCallback(() => {
    setTimelineState({
      clips: [],
      totalDuration: 0,
      currentTime: 0,
      zoom: 10,
    });
    console.log('🧹 Timeline cleared');
  }, []);

  const value: TimelineContextType = {
    timelineState,
    addClipToTimeline,
    removeClip,
    updateClipPosition,
    setCurrentTime,
    setZoom,
    clearTimeline,
  };

  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>;
};

