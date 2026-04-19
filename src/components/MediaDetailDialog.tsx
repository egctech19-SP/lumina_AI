/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MediaItem } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Star, 
  MapPin, 
  Calendar, 
  Tag, 
  Info, 
  Trash2, 
  Download, 
  Share2, 
  Maximize2,
  Sparkles,
  Save
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useMedia } from '../MediaContext';

interface MediaDetailDialogProps {
  media: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MediaDetailDialog({ media, isOpen, onClose }: MediaDetailDialogProps) {
  const { updateMedia, removeMedia } = useMedia();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  if (!media) return null;

  const handleToggleStar = (rating: number) => {
    updateMedia(media.id, { rating });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const newTag = tagInput.trim().toLowerCase();
      if (!media.tags?.includes(newTag)) {
        updateMedia(media.id, { tags: [...(media.tags || []), newTag] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateMedia(media.id, { tags: media.tags?.filter(t => t !== tagToRemove) });
  };

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir esta mídia?')) {
      removeMedia(media.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-slate-900 border-slate-800 text-slate-100 shadow-2xl">
        <div className="flex h-[80vh] flex-col md:flex-row overflow-hidden">
          {/* Main View Area */}
          <div className="flex-1 bg-black flex items-center justify-center relative group">
            <img 
              src={media.url} 
              alt={media.name}
              className="max-w-full max-h-full object-contain"
              referrerPolicy="no-referrer"
            />
            
            {/* Overlay Toolbar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-slate-900/60 backdrop-blur-xl rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button variant="ghost" size="icon" className="w-9 h-9 text-white hover:bg-white/20 rounded-full">
                <Maximize2 className="w-4 h-4" />
              </Button>
              <div className="w-px h-4 bg-white/10 mx-1"></div>
              <Button variant="ghost" size="icon" className="w-9 h-9 text-white hover:bg-white/20 rounded-full">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-9 h-9 text-white hover:bg-white/20 rounded-full">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Sidebar Info Area */}
          <div className="w-full md:w-80 bg-slate-900 flex flex-col border-l border-slate-800">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="space-y-1 overflow-hidden">
                 <h2 className="text-sm font-bold truncate leading-tight tracking-tight">{media.name}</h2>
                 <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                   {(media.size / (1024 * 1024)).toFixed(2)} MB • {media.mimeType.split('/')[1].toUpperCase()}
                 </p>
              </div>
              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-6 space-y-8">
                {/* Ratings */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Star className="w-3 h-3 text-amber-500" />
                    Classificação
                  </h3>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleToggleStar(star)}
                        className="transition-transform active:scale-95"
                      >
                        <Star 
                          className={cn(
                            "w-5 h-5 transition-colors",
                            star <= (media.rating || 0) ? "fill-amber-500 text-amber-500" : "text-slate-700 hover:text-slate-500"
                          )} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Insights Segment */}
                <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Análise Lumina AI
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Qualidade Visual</span>
                      <span className="text-indigo-300 font-bold">{(media.aiQualityScore || 0 * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-indigo-500/20 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full transition-all duration-1000 ease-out" 
                        style={{ width: `${(media.aiQualityScore || 0) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {media.faces && media.faces.length > 0 && (
                    <div className="space-y-2">
                       <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Pessoas Identificadas</span>
                       <div className="flex flex-wrap gap-1.5">
                         {media.faces.map(face => (
                           <Badge key={face.id} variant="secondary" className="bg-indigo-500/20 text-indigo-300 border-none text-[9px] h-5">
                             {face.label}
                           </Badge>
                         ))}
                       </div>
                    </div>
                  )}
                </div>

                {/* Metadata Details */}
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Criado em</p>
                      <p className="text-xs text-slate-200">
                        {format(media.createdAt, "d 'de' MMMM, yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {media.location && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Localização</p>
                        <p className="text-xs text-slate-200 leading-normal">{media.location.address}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Tag className="w-3 h-3" />
                        Palavras-chave
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <AnimatePresence>
                        {media.tags?.map(tag => (
                          <motion.div
                            key={tag}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <Badge 
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 pl-2 pr-1 h-6 flex items-center gap-1 group/tag"
                            >
                              {tag}
                              <button 
                                onClick={() => handleRemoveTag(tag)}
                                className="opacity-0 group-hover/tag:opacity-100 transition-opacity hover:text-red-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <div className="relative mt-1 w-full">
                        <input 
                          type="text"
                          placeholder="Adicionar tag..."
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleAddTag}
                          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-1.5 px-3 text-[11px] text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex gap-3">
              <Button 
                variant="destructive" 
                className="flex-1 gap-2 bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all h-10"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 gap-2 border-slate-700 text-slate-300 hover:bg-slate-800 h-10"
                onClick={onClose}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
