/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Hook to fetch and display images directly from Google Drive
 * Images are never copied to Supabase — they stay in Drive.
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

export function useDriveMedia() {
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchFromFolder = async (token: string, folderId: string | null): Promise<DriveFile[]> => {
    const parentClause = folderId
      ? `'${folderId}' in parents`
      : `'root' in parents`;
    const query = `${parentClause} and (mimeType contains 'image/') and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,createdTime,thumbnailLink)&pageSize=100&orderBy=createdTime desc`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.files || [];
  };

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

      if (folderIds.length > 0) {
        for (const fid of folderIds) {
          const files = await fetchFromFolder(token, fid);
          allFiles.push(...files);
        }
      } else {
        const files = await fetchFromFolder(token, null);
        allFiles.push(...files);
      }

      setDriveFiles(allFiles);
    } catch (e: any) {
      if (e.message.includes('401') || e.message.includes('403')) {
        // Token expired — clear it
        sessionStorage.removeItem('gdrive_token');
        sessionStorage.removeItem('gdrive_folders');
        setIsConnected(false);
        setDriveError('Sessão do Google expirada. Reconecte na página "Fontes de Nuvem".');
      } else {
        setDriveError(e.message);
      }
    } finally {
      setIsLoadingDrive(false);
    }
  }, []);

  useEffect(() => {
    loadDriveFiles();
  }, [loadDriveFiles]);

  // Build display URL for a Drive file (thumbnail that works for authenticated session)
  const getDriveImageUrl = (file: DriveFile) => {
    // Use official thumbnail link from Drive API (smaller, faster)
    if (file.thumbnailLink) return file.thumbnailLink.replace('=s220', '=s1024');
    // Fallback: thumbnail URL pattern
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
