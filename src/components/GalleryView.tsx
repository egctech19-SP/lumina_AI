/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MediaItem } from '../types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Heart, Play, MapPin, Cloud, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { MediaDetailDialog } from './MediaDetailDialog';
import { useDriveMedia, DriveFile } from '../hooks/useDriveMedia';
import { PhotoInfoButton, usePhotoInfo, type PhotoInfoItem } from './PhotoInfoPanel';

interface GalleryViewProps {
  media: MediaItem[];
}

export function GalleryView({ media }: GalleryViewProps) {
  const [selectedMedia, setSelectedMedia] = React.useState<MediaItem | null>(null);
  const [selectedDriveFile, setSelectedDriveFile] = React.useState<DriveFile | null>(null);
  const { driveFiles, isLoadingDrive, driveError, isConnected, getDriveImageUrl, reloadDrive } = useDriveMedia();

  // Group Supabase media by date
  const groupedMedia = media.reduce((acc, item) => {
    const date = format(item.createdAt, 'MMMM yyyy', { locale: ptBR });
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, MediaItem[]>);

  return (
    <div className="p-8 space-y-12">

      {/* ── Google Drive Section ────────────────────────────────────────────── */}
      {isConnected && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-3">
              <span className="text-2xl">📁</span>
              Google Drive
              {driveFiles.length > 0 && (
                <span className="text-slate-400 font-normal text-sm">
                  {driveFiles.length} imagens
                </span>
              )}
            </h3>
            <button
              onClick={reloadDrive}
              disabled={isLoadingDrive}
              className="flex items-center gap-2 text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoadingDrive && "animate-spin")} />
              Atualizar
            </button>
          </div>

          {driveError && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700 font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {driveError}
            </div>
          )}

          {isLoadingDrive ? (
            <div className="flex items-center justify-center p-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-3" /> Carregando imagens do Drive...
            </div>
          ) : driveFiles.length === 0 && !driveError ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Cloud className="w-10 h-10 mx-auto text-slate-200 mb-3" />
              <p className="font-medium">Nenhuma imagem encontrada nas pastas selecionadas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {driveFiles.map((file, idx) => {
                const infoItem: PhotoInfoItem = {
                  id: `gdrive-${file.id}`,
                  name: file.name,
                  url: getDriveImageUrl(file),
                  createdAt: file.createdTime ? new Date(file.createdTime).getTime() : Date.now(),
                  size: file.size ? parseInt(file.size) : undefined,
                  source: 'gdrive',
                  mimeType: file.mimeType,
                  driveFile: file,
                };
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => setSelectedDriveFile(file)}
                  >
                    <div className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/20 hover:ring-4 hover:ring-emerald-500/40 transition-all duration-300 cursor-pointer">
                      <img
                        src={getDriveImageUrl(file)}
                        alt={file.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent p-3 flex flex-col justify-end">
                        <p className="text-[10px] text-white/90 font-bold uppercase tracking-widest truncate">
                          {file.name.replace(/\.[^.]+$/, '')}
                        </p>
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-emerald-600/80 backdrop-blur-md border-none text-[8px] text-white h-5 px-2 font-bold">
                          DRIVE
                        </Badge>
                      </div>
                      {/* Info button */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <PhotoInfoButton item={infoItem} className="w-7 h-7" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Drive Image Preview Modal ──────────────────────────────────────── */}
      {selectedDriveFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedDriveFile(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <img
              src={getDriveImageUrl(selectedDriveFile)}
              alt={selectedDriveFile.name}
              className="w-full h-full object-contain max-h-[85vh]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white font-bold">{selectedDriveFile.name}</p>
              <a
                href={`https://drive.google.com/file/d/${selectedDriveFile.id}/view`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 text-xs font-bold mt-1 hover:underline"
                onClick={e => e.stopPropagation()}
              >
                Abrir no Google Drive ↗
              </a>
            </div>
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors flex items-center justify-center text-xl font-bold"
              onClick={() => setSelectedDriveFile(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Local / Supabase Gallery ───────────────────────────────────────── */}
      {Object.keys(groupedMedia).length > 0 && (
        <>
          {isConnected && (
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Biblioteca Local</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          )}
          {Object.entries(groupedMedia).map(([date, items]) => (
            <section key={date} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-lg font-bold tracking-tight text-slate-800 capitalize">
                  {date}
                  <span className="text-slate-400 font-normal text-sm ml-3">{items.length} itens</span>
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {items.map((item, idx) => {
                  const infoItem: PhotoInfoItem = {
                    id: item.id,
                    name: item.name,
                    url: item.url,
                    createdAt: item.createdAt,
                    size: item.size,
                    source: item.source,
                    mimeType: item.mimeType,
                    location: item.location,
                    tags: item.tags,
                    rating: item.rating,
                    aiQualityScore: item.aiQualityScore,
                    isBlurry: item.isBlurry,
                    width: item.width,
                    height: item.height,
                    mediaItem: item,
                  };
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => setSelectedMedia(item)}
                    >
                      <div className="group relative aspect-square rounded-xl overflow-hidden bg-slate-200 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/20 hover:ring-4 hover:ring-indigo-500/50 transition-all duration-300 cursor-pointer">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                          <p className="text-[10px] text-white/90 font-bold uppercase tracking-widest truncate mb-1">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="h-1 w-8 bg-indigo-500 rounded-full" />
                            {item.location && (
                              <span className="text-[9px] text-white/60 truncate flex items-center gap-1 font-medium">
                                <MapPin className="w-2.5 h-2.5 text-indigo-400" />
                                {item.location.address?.split(',')[0]}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Info button — top right */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <PhotoInfoButton item={infoItem} className="w-7 h-7" />
                        </div>
                        {item.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-12 h-12 rounded-full bg-indigo-500/60 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg group-hover:scale-125 transition-transform">
                              <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                            </div>
                          </div>
                        )}
                        {item.source !== 'local' && (
                          <div className="absolute top-2 left-2">
                            <Badge variant="secondary" className="bg-indigo-600/80 backdrop-blur-md border-none text-[8px] text-white h-5 px-2 font-bold tracking-tighter">
                              {item.source.toUpperCase()}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          ))}
        </>
      )}

      {media.length === 0 && driveFiles.length === 0 && !isLoadingDrive && (
        <div className="flex flex-col items-center justify-center py-32 text-slate-300 space-y-4">
          <Cloud className="w-20 h-20" />
          <p className="text-lg font-bold text-slate-400">Nenhuma imagem encontrada</p>
          <p className="text-sm text-slate-300">Adicione fotos ou conecte uma fonte de nuvem.</p>
        </div>
      )}

      <MediaDetailDialog
        media={selectedMedia}
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
      />
    </div>
  );
}
