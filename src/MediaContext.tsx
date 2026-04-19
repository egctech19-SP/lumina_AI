/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MediaItem } from './types';
import { supabase } from './lib/supabase';

interface MediaContextType {
  media: MediaItem[];
  filteredMedia: MediaItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addMedia: (item: MediaItem) => Promise<void>;
  removeMedia: (id: string) => Promise<void>;
  updateMedia: (id: string, updates: Partial<MediaItem>) => Promise<void>;
  isLoading: boolean;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch from Supabase on mount
  useEffect(() => {
    async function fetchMedia() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('media_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Map snake_case to camelCase
        const mappedMedia: MediaItem[] = (data || []).map(item => ({
          id: item.id,
          name: item.name,
          url: item.url,
          type: item.type,
          mimeType: item.mime_type,
          size: item.size,
          width: item.width,
          height: item.height,
          createdAt: new Date(item.created_at).getTime(),
          location: item.location,
          tags: item.tags,
          aiQualityScore: item.ai_quality_score,
          isBlurry: item.is_blurry,
          faces: item.faces,
          perceptualHash: item.perceptual_hash,
          rating: item.rating,
          source: item.source
        }));

        setMedia(mappedMedia);
      } catch (e) {
        console.error("Failed to fetch media from Supabase", e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMedia();
  }, []);

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

  const addMedia = async (item: MediaItem) => {
    try {
      // Map camelCase to snake_case for Supabase
      const { data, error } = await supabase
        .from('media_items')
        .insert([{
          name: item.name,
          url: item.url,
          type: item.type,
          mime_type: item.mimeType,
          size: item.size,
          width: item.width,
          height: item.height,
          created_at: new Date(item.createdAt).toISOString(),
          location: item.location,
          tags: item.tags,
          ai_quality_score: item.aiQualityScore,
          is_blurry: item.isBlurry,
          faces: item.faces,
          perceptual_hash: item.perceptualHash,
          rating: item.rating,
          source: item.source
        }])
        .select()
        .single();

      if (error) throw error;

      // Add with generated ID
      const newItem: MediaItem = { ...item, id: data.id };
      setMedia(prev => [newItem, ...prev]);
    } catch (e) {
      console.error("Failed to add media to Supabase", e);
    }
  };

  const removeMedia = async (id: string) => {
    try {
      const { error } = await supabase
        .from('media_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMedia(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      console.error("Failed to remove media from Supabase", e);
    }
  };

  const updateMedia = async (id: string, updates: Partial<MediaItem>) => {
    try {
      // Map camelCase to snake_case for specific fields
      const dbUpdates: any = { ...updates };
      if (updates.mimeType) dbUpdates.mime_type = updates.mimeType;
      if (updates.createdAt) dbUpdates.created_at = new Date(updates.createdAt).toISOString();
      if (updates.aiQualityScore !== undefined) dbUpdates.ai_quality_score = updates.aiQualityScore;
      if (updates.perceptualHash) dbUpdates.perceptual_hash = updates.perceptualHash;
      
      // Remove original camelCase fields
      delete dbUpdates.mimeType;
      delete dbUpdates.createdAt;
      delete dbUpdates.aiQualityScore;
      delete dbUpdates.perceptualHash;

      const { error } = await supabase
        .from('media_items')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      setMedia(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    } catch (e) {
      console.error("Failed to update media in Supabase", e);
    }
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
