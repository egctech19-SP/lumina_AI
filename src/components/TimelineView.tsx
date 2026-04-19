/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Photo Timeline View — Photos organized by date with Windows Explorer-style
 * view size controls and a slide-in info panel per photo.
 */

import React, { useState, useMemo } from 'react';
import { format, isToday, isYesterday, isThisYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MediaItem } from '../types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useDriveMedia, DriveFile } from '../hooks/useDriveMedia';
import { MediaDetailDialog } from './MediaDetailDialog';
import {
  LayoutGrid, List, AlignJustify,
  RefreshCw, Loader2, AlertCircle, MapPin, Calendar,
  Image, ChevronRight, ChevronDown,
  Info, X, ExternalLink, FileImage, HardDrive,
  Clock, Edit3, Tag, Star, FolderOpen,
  Hash, Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ── View Modes ─────────────────────────────────────────────────────────────

type ViewMode = 'extra-large' | 'large' | 'medium' | 'small' | 'list' | 'details';
const SLIDER_MODES: ViewMode[] = ['details', 'list', 'small', 'medium', 'large', 'extra-large'];

interface ViewModeConfig {
  id: ViewMode;
  label: string;
  icon: React.ElementType;
  gridCols: string;
  imgSize: string;
}

const VIEW_MODES: ViewModeConfig[] = [
  { id: 'extra-large', label: 'Ícones extra grandes', icon: LayoutGrid,   gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',              imgSize: 'aspect-square' },
  { id: 'large',       label: 'Ícones grandes',       icon: LayoutGrid,   gridCols: 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6', imgSize: 'aspect-square' },
  { id: 'medium',      label: 'Ícones médios',        icon: LayoutGrid,   gridCols: 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10',imgSize: 'aspect-square' },
  { id: 'small',       label: 'Ícones pequenos',      icon: LayoutGrid,   gridCols: 'grid-cols-6 md:grid-cols-8 lg:grid-cols-12',              imgSize: 'aspect-square' },
  { id: 'list',        label: 'Lista',                icon: List,         gridCols: 'grid-cols-1',                                              imgSize: 'aspect-square w-12 h-12' },
  { id: 'details',     label: 'Detalhes',             icon: AlignJustify, gridCols: 'grid-cols-1',                                              imgSize: 'aspect-square w-10 h-10' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDateLabel(ts: number): string {
  const d = new Date(ts);
  if (isToday(d)) return 'Hoje';
  if (isYesterday(d)) return 'Ontem';
  if (isThisYear(d)) return format(d, "d 'de' MMMM", { locale: ptBR });
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

function formatMonth(ts: number): string {
  return format(new Date(ts), 'MMMM yyyy', { locale: ptBR });
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Unified item type ──────────────────────────────────────────────────────

interface TimelineItem {
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

// ── Info Panel ─────────────────────────────────────────────────────────────

interface InfoRow {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
}

function InfoPanel({ item, onClose, getDriveImageUrl }: {
  item: TimelineItem;
  onClose: () => void;
  getDriveImageUrl: (f: DriveFile) => string;
}) {
  const rows: InfoRow[] = [
    { label: 'Nome',          value: item.name,                                        icon: FileImage },
    { label: 'Tipo',          value: item.mimeType || '—',                             icon: Hash },
    { label: 'Tamanho',       value: formatFileSize(item.size),                        icon: HardDrive },
    { label: 'Criado em',     value: format(new Date(item.createdAt), "dd/MM/yyyy 'às' HH:mm"), icon: Clock },
    { label: 'Fonte',         value: item.source === 'gdrive' ? 'Google Drive' : 'Dispositivo Local', icon: FolderOpen },
    ...(item.location?.address ? [{
      label: 'Localização',
      value: item.location.address,
      icon: MapPin,
    }] : []),
    ...(item.width && item.height ? [{
      label: 'Dimensões',
      value: `${item.width} × ${item.height} px`,
      icon: Maximize2,
    }] : []),
    ...(item.tags && item.tags.length > 0 ? [{
      label: 'Tags',
      value: (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {item.tags.map(t => (
            <span key={t} className="bg-indigo-50 text-indigo-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-indigo-100">
              {t}
            </span>
          ))}
        </div>
      ),
      icon: Tag,
    }] : []),
    ...(item.rating != null ? [{
      label: 'Avaliação',
      value: '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating),
      icon: Star,
    }] : []),
    ...(item.aiQualityScore != null ? [{
      label: 'Qualidade IA',
      value: `${Math.round(item.aiQualityScore * 100)}%${item.isBlurry ? ' · Desfocada' : ''}`,
      icon: Star,
    }] : []),
  ];

  const driveUrl = item.driveFile
    ? `https://drive.google.com/file/d/${item.driveFile.id}/view`
    : null;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="w-80 shrink-0 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-30 overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Preview */}
      <div className="relative bg-slate-900 aspect-video overflow-hidden">
        <img
          src={item.url}
          alt={item.name}
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 py-2 px-3 bg-gradient-to-t from-black/70 to-transparent">
          <Badge className={cn(
            "text-[8px] font-black uppercase",
            item.source === 'gdrive' ? 'bg-emerald-500 text-white border-none' : 'bg-indigo-500 text-white border-none'
          )}>
            {item.source === 'gdrive' ? '📁 Google Drive' : '💾 Local'}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm leading-tight break-all">{item.name}</h3>
          <p className="text-xs text-slate-400 mt-1">{formatFileSize(item.size)}</p>
        </div>

        {/* Info Rows */}
        <div className="px-5 py-4 space-y-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Propriedades</p>
          {rows.map((row, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                <row.icon className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{row.label}</p>
                {typeof row.value === 'string' ? (
                  <p className="text-sm font-medium text-slate-800 break-words">{row.value}</p>
                ) : (
                  row.value
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Location Map Preview */}
        {item.location?.lat && item.location?.lng && (
          <div className="mx-5 mb-4 rounded-2xl overflow-hidden border border-slate-200">
            <iframe
              title="location"
              width="100%"
              height="120"
              style={{ border: 0 }}
              src={`https://maps.google.com/maps?q=${item.location.lat},${item.location.lng}&z=14&output=embed`}
              allowFullScreen
            />
          </div>
        )}
      </div>

      {/* Footer actions */}
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

// ── Grid Card ──────────────────────────────────────────────────────────────

function GridCard({ item, mode, onClick, onInfo }: {
  item: TimelineItem;
  mode: ViewModeConfig;
  onClick: () => void;
  onInfo: (e: React.MouseEvent) => void;
}) {
  if (mode.id === 'list') {
    return (
      <div
        onClick={onClick}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 cursor-pointer group transition-colors"
      >
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 shrink-0">
          <img src={item.url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
          <p className="text-xs text-slate-400">{format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm')}</p>
        </div>
        <button
          onClick={onInfo}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Info className="w-4 h-4" />
        </button>
        <Badge className={cn("text-[8px] font-bold uppercase shrink-0",
          item.source === 'gdrive' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
        )}>
          {item.source === 'gdrive' ? 'Drive' : 'Local'}
        </Badge>
      </div>
    );
  }

  if (mode.id === 'details') {
    return (
      <div
        onClick={onClick}
        className="flex items-center gap-3 px-4 py-2 border-b border-slate-100 hover:bg-slate-50 cursor-pointer group transition-colors"
      >
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 shrink-0">
          <img src={item.url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-4 gap-4 items-center">
          <p className="text-sm font-semibold text-slate-800 truncate col-span-2">{item.name}</p>
          <p className="text-xs text-slate-400">{format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm')}</p>
          <p className="text-xs text-slate-400 text-right">{formatFileSize(item.size)}</p>
        </div>
        <button
          onClick={onInfo}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="group cursor-pointer"
    >
      <div
        className={cn(
          "relative rounded-xl overflow-hidden bg-slate-200 shadow-sm",
          "hover:shadow-xl hover:ring-2 hover:ring-indigo-500/50 transition-all duration-300",
          mode.imgSize
        )}
        onClick={onClick}
      >
        <img
          src={item.url}
          alt={item.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 flex flex-col justify-end">
          <p className="text-[9px] text-white font-bold truncate">{item.name.replace(/\.[^.]+$/, '')}</p>
        </div>

        {/* Source badge */}
        {item.source === 'gdrive' && (
          <div className="absolute top-1.5 left-1.5">
            <div className="w-5 h-5 bg-emerald-500/90 rounded-full flex items-center justify-center text-[8px]">📁</div>
          </div>
        )}

        {/* ℹ️ Info button — appears on hover in top-right */}
        <button
          onClick={onInfo}
          className={cn(
            "absolute top-1.5 right-1.5 w-7 h-7 rounded-full",
            "bg-white/20 backdrop-blur-md border border-white/30",
            "text-white hover:bg-indigo-500 hover:border-indigo-400",
            "flex items-center justify-center transition-all duration-200",
            "opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100",
            // Always visible for small icons (no hover text space)
            mode.id === 'small' && "opacity-0 group-hover:opacity-100"
          )}
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {(mode.id === 'large' || mode.id === 'extra-large') && (
        <p className="text-[10px] font-medium text-slate-600 truncate mt-1.5 px-0.5">
          {item.name.replace(/\.[^.]+$/, '')}
        </p>
      )}
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface TimelineViewProps {
  media: MediaItem[];
}

export function TimelineView({ media }: TimelineViewProps) {
  const { driveFiles, isLoadingDrive, driveError, isConnected, getDriveImageUrl, reloadDrive } = useDriveMedia();

  const [viewModeIdx, setViewModeIdx] = useState(4);
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [infoItem, setInfoItem] = useState<TimelineItem | null>(null);
  const [showViewMenu, setShowViewMenu] = useState(false);

  const currentMode = VIEW_MODES.find(m => m.id === SLIDER_MODES[viewModeIdx])!;

  // ── Merge all items ──────────────────────────────────────────────────────
  const allItems = useMemo<TimelineItem[]>(() => {
    const localItems: TimelineItem[] = media.map(m => ({
      id: m.id,
      name: m.name,
      url: m.url,
      createdAt: m.createdAt,
      size: m.size,
      source: m.source,
      mimeType: m.mimeType,
      location: m.location,
      tags: m.tags,
      rating: m.rating,
      aiQualityScore: m.aiQualityScore,
      isBlurry: m.isBlurry,
      width: m.width,
      height: m.height,
      mediaItem: m,
    }));

    const driveItems: TimelineItem[] = driveFiles.map(f => ({
      id: `gdrive-${f.id}`,
      name: f.name,
      url: getDriveImageUrl(f),
      createdAt: f.createdTime ? new Date(f.createdTime).getTime() : Date.now(),
      size: f.size ? parseInt(f.size) : undefined,
      source: 'gdrive',
      mimeType: f.mimeType,
      driveFile: f,
    }));

    return [...localItems, ...driveItems].sort((a, b) => b.createdAt - a.createdAt);
  }, [media, driveFiles, getDriveImageUrl]);

  // ── Group by Month → Day ─────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const byMonth: Record<string, Record<string, TimelineItem[]>> = {};
    for (const item of allItems) {
      const month = formatMonth(item.createdAt);
      const day = formatDateLabel(item.createdAt);
      if (!byMonth[month]) byMonth[month] = {};
      if (!byMonth[month][day]) byMonth[month][day] = [];
      byMonth[month][day].push(item);
    }
    return byMonth;
  }, [allItems]);

  const toggleMonth = (month: string) => {
    setCollapsedMonths(prev => {
      const next = new Set(prev);
      next.has(month) ? next.delete(month) : next.add(month);
      return next;
    });
  };

  const handleInfo = (e: React.MouseEvent, item: TimelineItem) => {
    e.stopPropagation();
    setInfoItem(prev => prev?.id === item.id ? null : item);
  };

  return (
    <div className="flex h-full overflow-hidden bg-white" onClick={() => setShowViewMenu(false)}>
      
      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <Image className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-slate-900">{allItems.length}</span> itens
            {isConnected && driveFiles.length > 0 && (
              <span className="text-slate-400">({media.length} local · {driveFiles.length} Drive)</span>
            )}
          </div>

          <div className="flex-1" />

          {isConnected && (
            <button onClick={reloadDrive} disabled={isLoadingDrive}
              className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoadingDrive && "animate-spin")} />
              Atualizar Drive
            </button>
          )}

          {/* Slider */}
          <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-2 bg-slate-50">
            <AlignJustify className="w-4 h-4 text-slate-400" />
            <input
              type="range" min={0} max={5} step={1}
              value={viewModeIdx}
              onChange={e => setViewModeIdx(Number(e.target.value))}
              className="w-28 h-1 accent-indigo-600 cursor-pointer"
            />
            <LayoutGrid className="w-4 h-4 text-slate-600" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap hidden lg:block">
              {currentMode.label}
            </span>
          </div>

          {/* View mode dropdown */}
          <div className="relative">
            <button
              onClick={e => { e.stopPropagation(); setShowViewMenu(v => !v); }}
              className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-white hover:bg-slate-50 text-sm font-bold text-slate-700 transition-colors"
            >
              <currentMode.icon className="w-4 h-4" />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            <AnimatePresence>
              {showViewMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden w-52"
                  onClick={e => e.stopPropagation()}
                >
                  {VIEW_MODES.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setViewModeIdx(SLIDER_MODES.indexOf(m.id)); setShowViewMenu(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-indigo-50 hover:text-indigo-700",
                        currentMode.id === m.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                      )}
                    >
                      <m.icon className="w-4 h-4" />
                      {m.label}
                      {currentMode.id === m.id && <div className="ml-auto w-2 h-2 rounded-full bg-indigo-500" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Error */}
        {driveError && (
          <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 border-b border-amber-200 text-sm text-amber-700 font-medium shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {driveError}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingDrive && (
            <div className="flex items-center justify-center gap-3 p-8 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              Carregando imagens do Google Drive...
            </div>
          )}

          {allItems.length === 0 && !isLoadingDrive ? (
            <div className="flex flex-col items-center justify-center h-full py-32 text-slate-300 space-y-4">
              <Image className="w-20 h-20" />
              <p className="text-lg font-bold text-slate-400">Nenhuma imagem encontrada</p>
              <p className="text-sm">Adicione fotos ou conecte uma fonte de nuvem.</p>
            </div>
          ) : (
            <div className="px-6 py-4 space-y-8">
              {/* Details header */}
              {currentMode.id === 'details' && (
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 border-b border-slate-200 rounded-xl">
                  <div className="w-10 h-10 shrink-0" />
                  <div className="flex-1 grid grid-cols-4 gap-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 col-span-2">Nome</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Tamanho</p>
                  </div>
                </div>
              )}

              {Object.entries(grouped).map(([month, days]) => {
                const isCollapsed = collapsedMonths.has(month);
                const totalItems = Object.values(days).flat().length;
                return (
                  <section key={month}>
                    <button
                      onClick={() => toggleMonth(month)}
                      className="flex items-center gap-3 w-full text-left mb-4 group"
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed
                          ? <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                          : <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        }
                        <h2 className="text-xl font-black text-slate-900 capitalize tracking-tight group-hover:text-indigo-700 transition-colors">
                          {month}
                        </h2>
                      </div>
                      <span className="text-sm text-slate-400 font-medium">{totalItems} itens</span>
                      <div className="flex-1 h-px bg-slate-200 ml-2" />
                    </button>

                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-6 overflow-hidden"
                        >
                          {Object.entries(days).map(([day, items]) => (
                            <div key={day}>
                              <div className="flex items-center gap-2 mb-3">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{day}</span>
                                <span className="text-xs text-slate-300 font-medium">{items.length} foto{items.length !== 1 ? 's' : ''}</span>
                              </div>
                              <div className={cn("grid gap-2", currentMode.gridCols)}>
                                {items.map(item => (
                                  <GridCard
                                    key={item.id}
                                    item={item}
                                    mode={currentMode}
                                    onClick={() => {
                                      if (item.mediaItem) setSelectedMedia(item.mediaItem);
                                    }}
                                    onInfo={e => handleInfo(e, item)}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Info Panel (slide-in from right) ─────────────────────────────── */}
      <AnimatePresence>
        {infoItem && (
          <InfoPanel
            item={infoItem}
            onClose={() => setInfoItem(null)}
            getDriveImageUrl={getDriveImageUrl}
          />
        )}
      </AnimatePresence>

      {/* ── Local Media Detail Dialog ─────────────────────────────────────── */}
      <MediaDetailDialog
        media={selectedMedia}
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
      />
    </div>
  );
}
