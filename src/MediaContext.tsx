/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MediaItem } from './types';
import { MOCK_MEDIA } from './lib/mockData';

interface MediaContextType {
  media: MediaItem[];
  filteredMedia: MediaItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addMedia: (item: MediaItem) => void;
  removeMedia: (id: string) => void;
  updateMedia: (id: string, updates: Partial<MediaItem>) => void;
  isLoading: boolean;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [media, setMedia] = useState<MediaItem[]>(MOCK_MEDIA);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Persistence to localStorage for "Local App" feel
  useEffect(() => {
    const saved = localStorage.getItem('lumina_media');
    if (saved) {
      try {
        setMedia(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved media", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lumina_media', JSON.stringify(media));
  }, [media]);

  const filteredMedia = media.filter(item => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    
    // Search in name
    if (item.name.toLowerCase().includes(lowerQuery)) return true;
    
    // Search in tags
    if (item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) return true;
    
    // Search in people labels
    if (item.faces?.some(face => face.label.toLowerCase().includes(lowerQuery))) return true;
    
    // Search in location
    if (item.location?.address?.toLowerCase().includes(lowerQuery)) return true;

    // Search in type
    if (item.type.toLowerCase().includes(lowerQuery)) return true;

    return false;
  });

  const addMedia = (item: MediaItem) => {
    setMedia(prev => [item, ...prev]);
  };

  const removeMedia = (id: string) => {
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  const updateMedia = (id: string, updates: Partial<MediaItem>) => {
    setMedia(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  return (
    <MediaContext.Provider value={{ 
      media, 
      filteredMedia, 
      searchQuery, 
      setSearchQuery, 
      addMedia, 
      removeMedia, 
      updateMedia, 
      isLoading 
    }}>
      {children}
    </MediaContext.Provider>
  );
}

export function useMedia() {
  const context = useContext(MediaContext);
  if (!context) throw new Error('useMedia must be used within a MediaProvider');
  return context;
}
