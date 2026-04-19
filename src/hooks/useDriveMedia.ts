/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Hook to fetch and display images directly from Google Drive.
 * Images are never copied to Supabase — they stay in Drive.
 * Supports recursive subfolder traversal.
 */

import { useState, useEffect, useCallback } from 'react';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  thumbnailLink?: string;
}

const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';

// ── API helpers ────────────────────────────────────────────────────────────

async function driveRequest(token: string, q: string, extraFields = ''): Promise<any[]> {
  const fields = `files(id,name,mimeType,size,createdTime,thumbnailLink${extraFields})`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${fields}&pageSize=200&orderBy=createdTime desc`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.files || [];
}

/** Fetch all image files inside a folder (non-recursive). */
async function fetchImagesInFolder(token: string, folderId: string): Promise<DriveFile[]> {
  const q = `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`;
  return driveRequest(token, q);
}

/** Fetch all direct subfolders of a folder. */
async function fetchSubfolders(token: string, folderId: string): Promise<any[]> {
  const q = `'${folderId}' in parents and mimeType='${DRIVE_FOLDER_MIME}' and trashed=false`;
  return driveRequest(token, q);
}

/**
 * Recursively collect all images under a folder and all its subfolders.
 * Uses BFS to avoid deep call stacks. Tracks visited folders to prevent loops.
 */
async function fetchImagesRecursively(
  token: string,
  rootFolderId: string,
  visited = new Set<string>()
): Promise<DriveFile[]> {
  if (visited.has(rootFolderId)) return [];
  visited.add(rootFolderId);

  // Fetch images and subfolders in parallel
  const [images, subfolders] = await Promise.all([
    fetchImagesInFolder(token, rootFolderId),
    fetchSubfolders(token, rootFolderId),
  ]);

  const allImages: DriveFile[] = [...images];

  // Recurse into each subfolder in parallel (up to 5 at a time to avoid rate limits)
  const chunks: any[][] = [];
  for (let i = 0; i < subfolders.length; i += 5) {
    chunks.push(subfolders.slice(i, i + 5));
  }
  for (const chunk of chunks) {
    const results = await Promise.all(
      chunk.map((sub: any) => fetchImagesRecursively(token, sub.id, visited))
    );
    results.forEach(r => allImages.push(...r));
  }

  return allImages;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useDriveMedia() {
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const loadDriveFiles = useCallback(async () => {
    const token = sessionStorage.getItem('gdrive_token');
    const foldersRaw = sessionStorage.getItem('gdrive_folders');

    if (!token) {
      setIsConnected(false);
      return;
    }

    setIsConnected(true);
    setIsLoadingDrive(true);
    setDriveError(null);

    try {
      const folderIds: string[] = foldersRaw ? JSON.parse(foldersRaw) : [];
      const allFiles: DriveFile[] = [];
      const visited = new Set<string>();

      if (folderIds.length > 0) {
        // Recursively fetch from each selected folder + all subfolders
        const results = await Promise.all(
          folderIds.map(fid => fetchImagesRecursively(token, fid, visited))
        );
        results.forEach(r => allFiles.push(...r));
      } else {
        // No folder selected → fetch from Drive root (non-recursive for performance)
        const q = `'root' in parents and mimeType contains 'image/' and trashed=false`;
        const rootImages = await driveRequest(token, q);
        allFiles.push(...rootImages);
      }

      // Remove duplicates (a file could appear if parent and child both selected)
      const unique = Array.from(new Map(allFiles.map(f => [f.id, f])).values());

      // Sort by createdTime descending
      unique.sort((a, b) => {
        const ta = a.createdTime ? new Date(a.createdTime).getTime() : 0;
        const tb = b.createdTime ? new Date(b.createdTime).getTime() : 0;
        return tb - ta;
      });

      setDriveFiles(unique);
    } catch (e: any) {
      if (e.message.includes('401') || e.message.includes('403')) {
        sessionStorage.removeItem('gdrive_token');
        sessionStorage.removeItem('gdrive_folders');
        setIsConnected(false);
        setDriveError('Sessão do Google Drive expirada. Reconecte na página "Fontes de Nuvem".');
      } else {
        setDriveError(`Erro ao carregar imagens: ${e.message}`);
      }
    } finally {
      setIsLoadingDrive(false);
    }
  }, []);

  useEffect(() => {
    loadDriveFiles();
  }, [loadDriveFiles]);

  /** Build the best display URL for a Drive file. */
  const getDriveImageUrl = (file: DriveFile): string => {
    if (file.thumbnailLink) {
      // Increase resolution of thumbnail from s220 to s1024
      return file.thumbnailLink.replace(/=s\d+$/, '=s1024');
    }
    return `https://drive.google.com/thumbnail?id=${file.id}&sz=w800`;
  };

  return {
    driveFiles,
    isLoadingDrive,
    driveError,
    isConnected,
    getDriveImageUrl,
    reloadDrive: loadDriveFiles,
  };
}
