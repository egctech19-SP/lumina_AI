/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MediaItem } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Users, MoreVertical, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface PeopleViewProps {
  media: MediaItem[];
}

export function PeopleView({ media }: PeopleViewProps) {
  // Extract all faces and group them by label
  const peopleGroups = media.reduce((acc, item) => {
    item.faces?.forEach(face => {
      if (!acc[face.label]) {
        acc[face.label] = {
          name: face.label,
          coverUrl: item.url,
          count: 0,
          items: []
        };
      }
      acc[face.label].count++;
      acc[face.label].items.push(item);
    });
    return acc;
  }, {} as Record<string, { name: string; coverUrl: string; count: number; items: MediaItem[] }>);

  const groups = Object.values(peopleGroups).sort((a, b) => b.count - a.count);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <header className="flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Pessoas e Animais</h2>
          <p className="text-slate-500 font-medium">IA agrupou automaticamente {groups.length} figuras reconhecidas</p>
        </div>
        
        <div className="relative w-64 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Encontrar pessoa..." 
            className="w-full bg-white border border-slate-200 rounded-full py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
        {groups.map((group, idx) => (
          <motion.div
            key={group.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="group cursor-pointer"
          >
            <div className="relative mb-3">
              <div className="aspect-square rounded-full overflow-hidden border-4 border-white shadow-lg ring-1 ring-slate-200 group-hover:ring-4 group-hover:ring-indigo-500/30 transition-all duration-300">
                <img 
                  src={group.coverUrl} 
                  alt={group.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              {group.count > 5 && (
                <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
                  {group.count}
                </div>
              )}
            </div>
            
            <div className="text-center space-y-0.5">
              <p className="font-bold text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
                {group.name}
              </p>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">
                {group.count} fotos
              </p>
            </div>
          </motion.div>
        ))}

        {/* Add Someone Placeholder */}
        <div className="group cursor-pointer">
          <div className="aspect-square rounded-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all duration-300 mb-3">
            <Users className="w-8 h-8 mb-1" />
          </div>
          <p className="text-center font-bold text-slate-400 text-sm">Adicionar Rosto</p>
        </div>
      </div>

      {groups.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-800">Nenhum rosto identificado ainda</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Continue subindo fotos e nossa IA irá agrupar pessoas automaticamente para você.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
