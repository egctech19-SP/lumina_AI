/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: number;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  tags?: string[];
  aiQualityScore?: number; // 0-1
  isBlurry?: boolean;
  faces?: Array<{
    id: string;
    label: string;
    boundingBox?: any;
  }>;
  perceptualHash?: string;
  rating?: number; // 0-5 stars
  source: 'local' | 'onedrive' | 'gdrive';
}

export type ViewType = 'gallery' | 'map' | 'people' | 'cleanup' | 'editor' | 'cloud';

export interface CloudSource {
  id: string;
  provider: 'onedrive' | 'gdrive' | 'gphotos';
  name: string;
  email?: string;
  status: 'connected' | 'syncing' | 'error' | 'disconnected';
  lastSync?: number;
  usage?: {
    used: number;
    total: number;
  };
}

export interface CleanupGroup {
  id: string;
  type: 'duplicate' | 'similar' | 'blurry';
  items: MediaItem[];
}
