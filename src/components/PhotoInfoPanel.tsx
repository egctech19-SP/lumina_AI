/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Universal Photo Info Panel — slide-in panel with EXIF + Drive metadata.
 * Used across GalleryView, TimelineView and any future image views.
 */

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  X, ExternalLink, FileImage, HardDrive, Clock,
  Tag, Star, FolderOpen, Hash, Maximize2, MapPin,
  Camera, Aperture, SunMedium, Zap, Focus,
  Layers, Ruler, Info, Loader2, RotateCcw, Image
} from 'lucide-react';
import type { DriveFile } from '../hooks/useDriveMedia';
import type { MediaItem } from '../types';

// ── Types ──────────────────────────────────────────────────────────────────

export interface PhotoInfoItem {
  id: string;
  name: string;
  url: string;
  createdAt: number;
  size?: number;
  source: string;
  mimeType?: string;
  location?: { address?: string; lat?: number; lng?: number };
  tags?: string[];
  rating?: number;
  aiQualityScore?: number;
  isBlurry?: boolean;
  width?: number;
  height?: number;
  mediaItem?: MediaItem;
  driveFile?: DriveFile;
}

export interface ExifData {
  // Camera
  Make?: string;
  Model?: string;
  LensModel?: string;
  // Exposure
  ExposureTime?: number;
  FNumber?: number;
  ISO?: number;
  FocalLength?: number;
  FocalLengthIn35mmFilm?: number;
  ExposureMode?: number | string;
  WhiteBalance?: number | string;
  Flash?: number | string;
  // Image
  ImageWidth?: number;
  ImageHeight?: number;
  Orientation?: number;
  ColorSpace?: number | string;
  BitsPerSample?: number;
  // GPS
  GPSLatitude?: number;
  GPSLongitude?: number;
  GPSAltitude?: number;
  // Software
  Software?: string;
  DateTime?: Date | string;
  DateTimeOriginal?: Date | string;
  DateTimeDigitized?: Date | string;
  // File
  MIMEType?: string;
  FileType?: string;
  [key: string]: any;
}

// ── Context ────────────────────────────────────────────────────────────────

interface PhotoInfoContextType {
  infoItem: PhotoInfoItem | null;
  setInfoItem: (item: PhotoInfoItem | null) => void;
  toggleInfo: (item: PhotoInfoItem) => void;
}

const PhotoInfoContext = createContext<PhotoInfoContextType>({
  infoItem: null,
  setInfoItem: () => {},
  toggleInfo: () => {},
});

export function PhotoInfoProvider({ children }: { children: React.ReactNode }) {
  const [infoItem, setInfoItem] = useState<PhotoInfoItem | null>(null);

  const toggleInfo = useCallback((item: PhotoInfoItem) => {
    setInfoItem(prev => prev?.id === item.id ? null : item);
  }, []);

  return (
    <PhotoInfoContext.Provider value={{ infoItem, setInfoItem, toggleInfo }}>
      {children}
      <AnimatePresence>
        {infoItem && (
          <PhotoInfoPanelPortal item={infoItem} onClose={() => setInfoItem(null)} />
        )}
      </AnimatePresence>
    </PhotoInfoContext.Provider>
  );
}

export function usePhotoInfo() {
  return useContext(PhotoInfoContext);
}

// ── Info Button ────────────────────────────────────────────────────────────

export function PhotoInfoButton({ item, className }: { item: PhotoInfoItem; className?: string }) {
  const { toggleInfo, infoItem } = usePhotoInfo();
  const isActive = infoItem?.id === item.id;

  return (
    <button
      onClick={e => { e.stopPropagation(); toggleInfo(item); }}
      title="Informações"
      className={cn(
        "flex items-center justify-center rounded-full transition-all duration-200",
        "bg-black/30 backdrop-blur-md border border-white/20",
        isActive
          ? "bg-indigo-500 border-indigo-400 text-white scale-110"
          : "text-white hover:bg-indigo-500 hover:border-indigo-400 hover:scale-110",
        className
      )}
    >
      <Info className="w-3.5 h-3.5" />
    </button>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatExposureTime(t?: number): string {
  if (!t) return '—';
  if (t >= 1) return `${t}s`;
  return `1/${Math.round(1 / t)}s`;
}

function formatGPS(lat?: number, lng?: number): string {
  if (!lat || !lng) return '—';
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'L' : 'O';
  return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lng).toFixed(6)}° ${lngDir}`;
}

function isoFormat(date?: Date | string): string {
  if (!date) return '—';
  try {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
  } catch { return String(date); }
}

// ── Row Component ──────────────────────────────────────────────────────────

function InfoRow({ label, value, icon: Icon, mono }: {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  mono?: boolean;
}) {
  if (!value || value === '—') return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        {typeof value === 'string' || typeof value === 'number' ? (
          <p className={cn("text-sm font-medium text-slate-800 break-words", mono && "font-mono text-xs")}>{value}</p>
        ) : value}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <div className="flex-1 h-px bg-slate-100" />
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{children}</p>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

// ── Panel ──────────────────────────────────────────────────────────────────

function PhotoInfoPanelPortal({ item, onClose }: { item: PhotoInfoItem; onClose: () => void }) {
  const [exif, setExif] = useState<ExifData | null>(null);
  const [loadingExif, setLoadingExif] = useState(false);
  const [exifError, setExifError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setExif(null);
    setExifError(null);
    setLoadingExif(true);

    async function readExif() {
      try {
        // Dynamically import exifr to avoid blocking initial load
        const exifr = (await import('exifr')).default;
        const data = await exifr.parse(item.url, {
          tiff: true,
          exif: true,
          gps: true,
          iptc: false,
          xmp: false,
          translateValues: true,
          pick: [
            'Make', 'Model', 'LensModel',
            'ExposureTime', 'FNumber', 'ISO', 'FocalLength', 'FocalLengthIn35mmFilm',
            'ExposureMode', 'WhiteBalance', 'Flash',
            'ImageWidth', 'ImageHeight', 'Orientation', 'ColorSpace', 'BitsPerSample',
            'Software', 'DateTime', 'DateTimeOriginal', 'DateTimeDigitized',
            'GPSLatitude', 'GPSLongitude', 'GPSAltitude',
          ],
        });
        if (!cancelled) setExif(data || {});
      } catch (e: any) {
        if (!cancelled) {
          // Not an error for the user — EXIF might just not exist
          setExif({});
          if (!e.message?.includes('Expected') && !e.message?.includes('tiff')) {
            setExifError('EXIF não disponível para esta imagem.');
          }
        }
      } finally {
        if (!cancelled) setLoadingExif(false);
      }
    }

    readExif();
    return () => { cancelled = true; };
  }, [item.url]);

  const driveUrl = item.driveFile
    ? `https://drive.google.com/file/d/${item.driveFile.id}/view`
    : null;

  const lat = exif?.GPSLatitude ?? item.location?.lat;
  const lng = exif?.GPSLongitude ?? item.location?.lng;
  const address = item.location?.address;
  const dimensionW = exif?.ImageWidth ?? item.width;
  const dimensionH = exif?.ImageHeight ?? item.height;

  return (
    <motion.div
      key="info-panel"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 320 }}
      className="fixed top-0 right-0 bottom-0 z-50 w-80 bg-white border-l border-slate-200 shadow-2xl flex flex-col"
      onClick={e => e.stopPropagation()}
    >
      {/* ── Image Preview ────────────────────────────────────────────────── */}
      <div className="relative bg-slate-900 shrink-0" style={{ height: 200 }}>
        <img
          src={item.url}
          alt={item.name}
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="absolute bottom-3 left-3">
          <Badge className={cn(
            "text-[8px] font-black uppercase border-none",
            item.source === 'gdrive' ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'
          )}>
            {item.source === 'gdrive' ? '📁 Google Drive' : '💾 Local'}
          </Badge>
        </div>
      </div>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-b border-slate-100 shrink-0">
        <p className="font-bold text-slate-900 text-sm leading-tight break-all line-clamp-2">{item.name}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-slate-400">{formatFileSize(item.size)}</span>
          {dimensionW && dimensionH && (
            <span className="text-xs text-slate-400">{dimensionW}×{dimensionH}px</span>
          )}
        </div>
      </div>

      {/* ── Scrollable Content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* ── FILE ATTRIBUTES ─────────────────────────────────────────────── */}
        <SectionTitle>Atributos do Arquivo</SectionTitle>
        <InfoRow label="Nome" value={item.name} icon={FileImage} />
        <InfoRow label="Formato / Tipo" value={item.mimeType || '—'} icon={Hash} />
        <InfoRow
          label="Tamanho"
          value={formatFileSize(item.size)}
          icon={HardDrive}
        />
        {dimensionW && dimensionH && (
          <InfoRow label="Resolução" value={`${dimensionW} × ${dimensionH} pixels`} icon={Maximize2} />
        )}
        <InfoRow label="Fonte" value={item.source === 'gdrive' ? 'Google Drive' : 'Dispositivo Local'} icon={FolderOpen} />
        <InfoRow
          label="Data de Criação"
          value={format(new Date(item.createdAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
          icon={Clock}
        />

        {/* ── EXIF ─────────────────────────────────────────────────────────── */}
        <SectionTitle>Metadados EXIF</SectionTitle>

        {loadingExif && (
          <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Lendo dados EXIF...
          </div>
        )}

        {!loadingExif && exif && Object.keys(exif).length > 0 ? (
          <>
            {/* Camera */}
            {(exif.Make || exif.Model) && (
              <InfoRow
                label="Câmera"
                value={[exif.Make, exif.Model].filter(Boolean).join(' ')}
                icon={Camera}
              />
            )}
            {exif.LensModel && (
              <InfoRow label="Lente" value={exif.LensModel} icon={Focus} />
            )}
            {exif.Software && (
              <InfoRow label="Software" value={exif.Software} icon={Layers} />
            )}

            {/* Exposure */}
            {exif.ExposureTime && (
              <InfoRow label="Exposição" value={formatExposureTime(exif.ExposureTime)} icon={Clock} />
            )}
            {exif.FNumber && (
              <InfoRow label="Abertura" value={`ƒ/${exif.FNumber}`} icon={Aperture} />
            )}
            {exif.ISO && (
              <InfoRow label="ISO" value={String(exif.ISO)} icon={SunMedium} />
            )}
            {exif.FocalLength && (
              <InfoRow
                label="Focal"
                value={`${exif.FocalLength}mm${exif.FocalLengthIn35mmFilm ? ` (${exif.FocalLengthIn35mmFilm}mm equiv.)` : ''}`}
                icon={Ruler}
              />
            )}
            {exif.Flash != null && (
              <InfoRow label="Flash" value={String(exif.Flash)} icon={Zap} />
            )}
            {exif.WhiteBalance != null && (
              <InfoRow label="Balanço de Branco" value={String(exif.WhiteBalance)} icon={SunMedium} />
            )}

            {/* Dates */}
            {exif.DateTimeOriginal && (
              <InfoRow label="Capturada em" value={isoFormat(exif.DateTimeOriginal)} icon={Camera} />
            )}
            {exif.DateTimeDigitized && (
              <InfoRow label="Digitalizada em" value={isoFormat(exif.DateTimeDigitized)} icon={Clock} />
            )}

            {/* Image attributes */}
            {exif.ColorSpace && (
              <InfoRow label="Espaço de Cor" value={String(exif.ColorSpace)} icon={Layers} />
            )}
            {exif.BitsPerSample && (
              <InfoRow label="Profundidade" value={`${exif.BitsPerSample} bits`} icon={Hash} />
            )}
            {exif.Orientation && (
              <InfoRow label="Orientação" value={String(exif.Orientation)} icon={RotateCcw} />
            )}
          </>
        ) : !loadingExif && (
          <p className="text-xs text-slate-400 italic py-1">
            {exifError || 'Nenhum dado EXIF encontrado nesta imagem.'}
          </p>
        )}

        {/* ── GPS / LOCATION ───────────────────────────────────────────────── */}
        {(lat || address) && (
          <>
            <SectionTitle>Localização</SectionTitle>
            {address && (
              <InfoRow label="Endereço" value={address} icon={MapPin} />
            )}
            {lat && lng && (
              <InfoRow label="Coordenadas GPS" value={formatGPS(lat, lng)} icon={MapPin} mono />
            )}
            {exif?.GPSAltitude && (
              <InfoRow label="Altitude" value={`${Math.round(exif.GPSAltitude)}m`} icon={Layers} />
            )}
            {lat && lng && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 mt-2">
                <iframe
                  title="map"
                  width="100%"
                  height="110"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`}
                  allowFullScreen
                />
              </div>
            )}
          </>
        )}

        {/* ── TAGS & AI ────────────────────────────────────────────────────── */}
        {(item.tags?.length || item.rating != null || item.aiQualityScore != null) && (
          <>
            <SectionTitle>Análise IA</SectionTitle>
            {item.tags && item.tags.length > 0 && (
              <InfoRow
                label="Tags"
                value={
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.tags.map(t => (
                      <span key={t} className="bg-indigo-50 text-indigo-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                        {t}
                      </span>
                    ))}
                  </div>
                }
                icon={Tag}
              />
            )}
            {item.rating != null && (
              <InfoRow
                label="Avaliação"
                value={<span className="text-amber-400 text-base tracking-tight">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span>}
                icon={Star}
              />
            )}
            {item.aiQualityScore != null && (
              <InfoRow
                label="Qualidade IA"
                value={
                  <div className="mt-1">
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                      <span>{Math.round(item.aiQualityScore * 100)}%</span>
                      {item.isBlurry && <span className="text-amber-500">⚠ Desfocada</span>}
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", item.aiQualityScore > 0.7 ? 'bg-emerald-500' : item.aiQualityScore > 0.4 ? 'bg-amber-400' : 'bg-rose-500')}
                        style={{ width: `${item.aiQualityScore * 100}%` }}
                      />
                    </div>
                  </div>
                }
                icon={Image}
              />
            )}
          </>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-t border-slate-100 space-y-2 shrink-0">
        {driveUrl && (
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir no Google Drive
          </a>
        )}
        <button
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-widest transition-colors"
        >
          Fechar
        </button>
      </div>
    </motion.div>
  );
}
