/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Photo Timeline View — Photos organized by date with Windows Explorer-style
 * view size controls (Extra Grande → Detalhes).
 */

import React, { useState, useMemo } from 'react';
import { format, isToday, isYesterday, isThisYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MediaItem } from '../types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDriveMedia, DriveFile } from '../hooks/useDriveMedia';
import { MediaDetailDialog } from './MediaDetailDialog';
import {
  LayoutGrid, List, AlignJustify, Rows3, Table2,
  RefreshCw, Loader2, AlertCircle, MapPin, Calendar,
  FileImage, Cloud, ChevronRight, ChevronDown,
  SlidersHorizontal, Image
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ── View Modes ─────────────────────────────────────────────────────────────

type ViewMode = 'extra-large' | 'large' | 'medium' | 'small' | 'list' | 'details';

interface ViewModeConfig {
  id: ViewMode;
  label: string;
  icon: React.ElementType;
  gridCols: string;
  imgSize: string;
}

const VIEW_MODES: ViewModeConfig[] = [
  { id: 'extra-large', label: 'Ícones extra grandes', icon: LayoutGrid,   gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',         imgSize: 'aspect-square' },
  { id: 'large',       label: 'Ícones grandes',       icon: LayoutGrid,   gridCols: 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6', imgSize: 'aspect-square' },
  { id: 'medium',      label: 'Ícones médios',        icon: LayoutGrid,   gridCols: 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10', imgSize: 'aspect-square' },
  { id: 'small',       label: 'Ícones pequenos',      icon: LayoutGrid,   gridCols: 'grid-cols-6 md:grid-cols-8 lg:grid-cols-12',       imgSize: 'aspect-square' },
  { id: 'list',        label: 'Lista',                icon: List,         gridCols: 'grid-cols-1',                                       imgSize: 'aspect-square w-12 h-12' },
  { id: 'details',     label: 'Detalhes',             icon: AlignJustify, gridCols: 'grid-cols-1',                                       imgSize: 'aspect-square w-10 h-10' },
];

// ── Size Slider Marks ──────────────────────────────────────────────────────
// Maps slider value 0-5 to a ViewMode
const SLIDER_MODES: ViewMode[] = ['details', 'list', 'small', 'medium', 'large', 'extra-large'];

// ── Date Label Helper ──────────────────────────────────────────────────────
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
  location?: { address?: string };
  mediaItem?: MediaItem;
  driveFile?: DriveFile;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function GridCard({ item, mode, onClick }: { item: TimelineItem; mode: ViewModeConfig; onClick: () => void }) {
  const isSmallMode = mode.id === 'extra-large' || mode.id === 'large' || mode.id === 'medium' || mode.id === 'small';

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
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className={cn(
        "relative rounded-xl overflow-hidden bg-slate-200 shadow-sm",
        "hover:shadow-xl hover:ring-2 hover:ring-indigo-500/50 transition-all duration-300",
        mode.imgSize
      )}>
        <img
          src={item.url}
          alt={item.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 flex flex-col justify-end">
          <p className="text-[9px] text-white font-bold truncate">{item.name.replace(/\.[^.]+$/, '')}</p>
        </div>
        {item.source === 'gdrive' && (
          <div className="absolute top-1.5 left-1.5">
            <div className="w-5 h-5 bg-emerald-500/90 rounded-full flex items-center justify-center text-[8px]">📁</div>
          </div>
        )}
      </div>
      {(mode.id === 'large' || mode.id === 'extra-large') && (
        <p className="text-[10px] font-medium text-slate-600 truncate mt-1.5 px-0.5">{item.name.replace(/\.[^.]+$/, '')}</p>
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

  const [viewModeIdx, setViewModeIdx] = useState(4); // default: 'large'
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedDriveFile, setSelectedDriveFile] = useState<DriveFile | null>(null);
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

  // ── Details header ───────────────────────────────────────────────────────
  const DetailsHeader = () => (
    currentMode.id === 'details' ? (
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
        <div className="w-10 h-10 shrink-0" />
        <div className="flex-1 grid grid-cols-4 gap-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 col-span-2">Nome</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Tamanho</p>
        </div>
      </div>
    ) : null
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-200 bg-white shrink-0">
        {/* Stats */}
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <Image className="w-4 h-4 text-indigo-500" />
          <span className="font-bold text-slate-900">{allItems.length}</span> itens
          {isConnected && driveFiles.length > 0 && (
            <span className="text-slate-400">
              ({media.length} local · {driveFiles.length} Drive)
            </span>
          )}
        </div>

        <div className="flex-1" />

        {/* Drive reload */}
        {isConnected && (
          <button
            onClick={reloadDrive}
            disabled={isLoadingDrive}
            className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoadingDrive && "animate-spin")} />
            Atualizar Drive
          </button>
        )}

        {/* ── Size Slider ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-2 bg-slate-50">
          <AlignJustify className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-1">
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={viewModeIdx}
              onChange={e => setViewModeIdx(Number(e.target.value))}
              className="w-28 h-1 accent-indigo-600 cursor-pointer"
            />
          </div>
          <LayoutGrid className="w-4 h-4 text-slate-600" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap hidden lg:block">
            {currentMode.label}
          </span>
        </div>

        {/* ── View Mode Quick Buttons ──────────────────────────────────── */}
        <div className="relative">
          <button
            onClick={() => setShowViewMenu(v => !v)}
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
              >
                {VIEW_MODES.map((m, i) => (
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

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {driveError && (
        <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 border-b border-amber-200 text-sm text-amber-700 font-medium shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {driveError}
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────────── */}
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
          <div className="px-6 py-4 space-y-8" onClick={() => setShowViewMenu(false)}>
            {currentMode.id === 'details' && <DetailsHeader />}

            {Object.entries(grouped).map(([month, days]) => {
              const isCollapsed = collapsedMonths.has(month);
              const totalItems = Object.values(days).flat().length;

              return (
                <section key={month}>
                  {/* Month header */}
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

                  {/* Days */}
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
                            {/* Day label */}
                            <div className="flex items-center gap-2 mb-3">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{day}</span>
                              <span className="text-xs text-slate-300 font-medium">{items.length} foto{items.length !== 1 ? 's' : ''}</span>
                            </div>

                            {/* Grid */}
                            <div className={cn("grid gap-2", currentMode.gridCols)}>
                              {items.map(item => (
                                <GridCard
                                  key={item.id}
                                  item={item}
                                  mode={currentMode}
                                  onClick={() => {
                                    if (item.mediaItem) setSelectedMedia(item.mediaItem);
                                    else if (item.driveFile) setSelectedDriveFile(item.driveFile);
                                  }}
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

      {/* ── Drive Image Preview ───────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedDriveFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
            onClick={() => setSelectedDriveFile(null)}
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              className="relative max-w-5xl max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={getDriveImageUrl(selectedDriveFile)}
                alt={selectedDriveFile.name}
                className="max-h-[85vh] w-auto"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between">
                <div>
                  <p className="text-white font-bold">{selectedDriveFile.name}</p>
                  <a
                    href={`https://drive.google.com/file/d/${selectedDriveFile.id}/view`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-emerald-400 text-xs font-bold hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    Abrir no Google Drive ↗
                  </a>
                </div>
                {selectedDriveFile.size && (
                  <span className="text-white/50 text-xs">{formatFileSize(parseInt(selectedDriveFile.size))}</span>
                )}
              </div>
              <button
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-xl font-bold transition-colors"
                onClick={() => setSelectedDriveFile(null)}
              >✕</button>
            </motion.div>
          </motion.div>
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
