/**
 * ClipForge - Action History Context
 * Manages undo/redo functionality for timeline actions
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Action {
  type: string;
  data: any;
  timestamp: number;
}

interface ActionHistoryContextType {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  recordAction: (action: Action) => void;
  clearHistory: () => void;
}

const ActionHistoryContext = createContext<ActionHistoryContextType | undefined>(undefined);

export const useActionHistory = () => {
  const context = useContext(ActionHistoryContext);
  if (!context) {
    throw new Error('useActionHistory must be used within ActionHistoryProvider');
  }
  return context;
};

interface ActionHistoryProviderProps {
  children: React.ReactNode;
}

export const ActionHistoryProvider: React.FC<ActionHistoryProviderProps> = ({ children }) => {
  const [history, setHistory] = useState<Action[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < history.length - 1;

  /**
   * Record a new action
   */
  const recordAction = useCallback((action: Action) => {
    setHistory((prev) => {
      // Remove any actions after current index (if we're in middle of history)
      const newHistory = prev.slice(0, currentIndex + 1);
      // Add new action
      newHistory.push({
        ...action,
        timestamp: Date.now(),
      });
      return newHistory;
    });
    setCurrentIndex((prev) => prev + 1);
    
    console.log('📝 Action recorded:', action.type);
  }, [currentIndex]);

  /**
   * Undo last action
   */
  const undo = useCallback(() => {
    if (!canUndo) return;
    
    const action = history[currentIndex];
    console.log('↩️ Undoing:', action.type);
    
    // Dispatch undo event with action data
    window.dispatchEvent(new CustomEvent('undo-action', { detail: action }));
    
    setCurrentIndex((prev) => prev - 1);
  }, [canUndo, history, currentIndex]);

  /**
   * Redo last undone action
   */
  const redo = useCallback(() => {
    if (!canRedo) return;
    
    const action = history[currentIndex + 1];
    console.log('↪️ Redoing:', action.type);
    
    // Dispatch redo event with action data
    window.dispatchEvent(new CustomEvent('redo-action', { detail: action }));
    
    setCurrentIndex((prev) => prev + 1);
  }, [canRedo, history, currentIndex]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
    console.log('🗑️ Action history cleared');
  }, []);

  return (
    <ActionHistoryContext.Provider
      value={{
        canUndo,
        canRedo,
        undo,
        redo,
        recordAction,
        clearHistory,
      }}
    >
      {children}
    </ActionHistoryContext.Provider>
  );
};

