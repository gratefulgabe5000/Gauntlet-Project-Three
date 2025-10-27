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
  updateClipTrim: (clipId: string, trimStart?: number, trimEnd?: number) => void;
  splitClipAtTime: (time: number) => boolean;
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
  
  const [userHasAdjustedZoom, setUserHasAdjustedZoom] = useState(false);

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

      // Auto-adjust zoom to fit entire timeline (only if user hasn't manually adjusted)
      let newZoom = prev.zoom;
      if (!userHasAdjustedZoom) {
        // Use window width minus padding/margins (~30px total) and minus ruler offset (50px)
        const availableWidth = window.innerWidth - 80; // Account for padding and ruler
        newZoom = Math.max(0.5, Math.min(30, availableWidth / newTotalDuration));
      }

      console.log('✅ Added clip to timeline:', {
        id: newClip.id,
        filename: metadata.filename,
        startTime,
        duration: metadata.duration,
        totalDuration: newTotalDuration,
        availableWidth: window.innerWidth - 80,
        autoZoom: newZoom,
        userHasAdjustedZoom,
      });

      return {
        ...prev,
        clips: [...prev.clips, newClip],
        totalDuration: newTotalDuration,
        zoom: newZoom, // Use new zoom (auto or preserved)
      };
    });
  }, [userHasAdjustedZoom]);

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
   * Update clip trim points
   */
  const updateClipTrim = useCallback((clipId: string, trimStart?: number, trimEnd?: number) => {
    setTimelineState((prev) => {
      const updatedClips = prev.clips.map((clip) => {
        if (clip.id === clipId) {
          const newTrimStart = trimStart !== undefined ? trimStart : clip.trimStart;
          const newTrimEnd = trimEnd !== undefined ? trimEnd : clip.trimEnd;
          
          // Calculate new duration based on trim
          const effectiveTrimStart = newTrimStart || 0;
          const effectiveTrimEnd = newTrimEnd || 0;
          const newDuration = clip.metadata.duration - effectiveTrimStart - effectiveTrimEnd;

          console.log('🔧 Updating trim for clip:', {
            clipId,
            originalDuration: clip.metadata.duration,
            trimStart: effectiveTrimStart,
            trimEnd: effectiveTrimEnd,
            newDuration,
          });

          return {
            ...clip,
            trimStart: newTrimStart,
            trimEnd: newTrimEnd,
            duration: Math.max(0.1, newDuration), // Ensure minimum duration
          };
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
   * Split a clip at a specific time
   * Returns true if a clip was split, false otherwise
   */
  const splitClipAtTime = useCallback((time: number): boolean => {
    let wasSplit = false;

    setTimelineState((prev) => {
      // Find the clip that contains this time
      const clipToSplit = prev.clips.find(
        (clip) => time >= clip.startTime && time < clip.startTime + clip.duration
      );

      if (!clipToSplit) {
        console.log('❌ No clip found at time:', time);
        return prev;
      }

      // Calculate split point relative to clip start
      const splitPoint = time - clipToSplit.startTime;

      // Don't split if too close to edges (< 0.5 seconds)
      if (splitPoint < 0.5 || splitPoint > clipToSplit.duration - 0.5) {
        console.log('❌ Split point too close to edge:', splitPoint);
        return prev;
      }

      console.log('✂️ Splitting clip:', {
        clipId: clipToSplit.id,
        filename: clipToSplit.metadata.filename,
        originalDuration: clipToSplit.duration,
        splitPoint,
      });

      // Create two new clips
      const firstClip: VideoClip = {
        ...clipToSplit,
        id: `${clipToSplit.id}_first_${Date.now()}`,
        duration: splitPoint,
        trimEnd: (clipToSplit.trimEnd || 0) + (clipToSplit.duration - splitPoint),
      };

      const secondClip: VideoClip = {
        ...clipToSplit,
        id: `${clipToSplit.id}_second_${Date.now()}`,
        startTime: clipToSplit.startTime + splitPoint,
        duration: clipToSplit.duration - splitPoint,
        trimStart: (clipToSplit.trimStart || 0) + splitPoint,
      };

      // Replace the original clip with two new clips
      const newClips = prev.clips.map((clip) => {
        if (clip.id === clipToSplit.id) {
          return [firstClip, secondClip];
        }
        return [clip];
      }).flat();

      wasSplit = true;

      console.log('✅ Clip split successfully:', {
        first: { duration: firstClip.duration },
        second: { duration: secondClip.duration },
      });

      return {
        ...prev,
        clips: newClips,
      };
    });

    return wasSplit;
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
   * Set zoom level (pixels per second) - Range: 0.5-30
   * Finer control for better UX
   */
  const setZoom = useCallback((zoom: number) => {
    setUserHasAdjustedZoom(true); // Mark that user manually adjusted zoom
    setTimelineState((prev) => ({
      ...prev,
      zoom: Math.max(0.5, Math.min(zoom, 30)), // Clamp between 0.5 and 30 px/sec
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
    updateClipTrim,
    splitClipAtTime,
    setCurrentTime,
    setZoom,
    clearTimeline,
  };

  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>;
};

