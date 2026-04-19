/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MediaItem } from '../types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Play, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { MediaDetailDialog } from './MediaDetailDialog';

interface GalleryViewProps {
  media: MediaItem[];
}

export function GalleryView({ media }: GalleryViewProps) {
  const [selectedMedia, setSelectedMedia] = React.useState<MediaItem | null>(null);

  // Group media by date
  const groupedMedia = media.reduce((acc, item) => {
    const date = format(item.createdAt, 'MMMM yyyy', { locale: ptBR });
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, MediaItem[]>);

  return (
    <div className="p-8 space-y-12">
      {Object.entries(groupedMedia).map(([date, items]) => (
        <section key={date} className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-lg font-bold tracking-tight text-slate-800 capitalize">
              {date}
              <span className="text-slate-400 font-normal text-sm ml-3 text-lowercase">{items.length} itens</span>
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {items.map((item, idx) => (
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
                  />
                  
                  {/* Design HTML style overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 p-4 flex flex-col justify-end transition-all duration-500">
                    <p className="text-[10px] text-white/90 font-bold uppercase tracking-widest truncate mb-1">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2">
                       <div className="h-1 w-8 bg-indigo-500 rounded-full"></div>
                       {item.location && (
                         <span className="text-[9px] text-white/60 truncate flex items-center gap-1 font-medium">
                           <MapPin className="w-2.5 h-2.5 text-indigo-400" />
                           {item.location.address?.split(',')[0]}
                         </span>
                       )}
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <Button variant="secondary" size="icon" className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border-white/20 text-white hover:bg-indigo-500 hover:text-white hover:border-transparent">
                      <Heart className={cn("w-4 h-4", (item.rating || 0) >= 4 && "fill-rose-500 text-rose-500")} />
                    </Button>
                  </div>

                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/60 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg group-hover:scale-125 transition-transform">
                        <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                      </div>
                    </div>
                  )}

                  {item.source !== 'local' && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-indigo-600/80 backdrop-blur-md border-none text-[8px] text-white h-5 px-2 font-bold tracking-tighter">
                        {item.source.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      ))}

      <MediaDetailDialog 
        media={selectedMedia}
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
      />
    </div>
  );
}
