/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MediaItem, CleanupGroup } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CleanupViewProps {
  groups: CleanupGroup[];
}

export function CleanupView({ groups }: CleanupViewProps) {
  const duplicates = groups.filter(g => g.type === 'duplicate');
  const blurry = groups.filter(g => g.type === 'blurry');

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-16">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase border border-amber-100">Armazenamento Inteligente</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Hub de Limpeza</h1>
          <p className="text-slate-500 font-medium tracking-tight">O Lumina AI identificou 12 oportunidades de otimização economizando <span className="text-indigo-600 font-bold">1.4GB</span>.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-slate-900 shadow-xl shadow-indigo-500/20 px-8 py-6 rounded-2xl font-bold uppercase tracking-widest text-xs">Analisar Novamente</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-8 -mt-8 transition-all group-hover:scale-150 duration-500" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10">Economia Estimada</p>
          <div className="flex items-baseline gap-1 relative z-10">
            <span className="text-3xl font-extrabold text-slate-900">1.4</span>
            <span className="text-xl font-bold text-slate-400 uppercase">GB</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 transition-all group-hover:scale-150 duration-500" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10">Duplicatas Encontradas</p>
          <div className="flex items-baseline gap-1 relative z-10">
            <span className="text-3xl font-extrabold text-slate-900">{duplicates.length}</span>
            <span className="text-xl font-bold text-slate-400 uppercase">Grupos</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-8 -mt-8 transition-all group-hover:scale-150 duration-500" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10">Baixa Qualidade</p>
          <div className="flex items-baseline gap-1 relative z-10">
            <span className="text-3xl font-extrabold text-slate-900">{blurry.length}</span>
            <span className="text-xl font-bold text-slate-400 uppercase">Itens</span>
          </div>
        </div>
      </div>

      {/* Duplicates Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center border border-slate-100">
              <Trash2 className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Duplicatas Exatas</h2>
              <p className="text-sm text-slate-400 font-medium">Arquivos binários idênticos consumindo armazenamento redundante</p>
            </div>
          </div>
          <Button variant="outline" className="rounded-xl font-bold text-xs uppercase tracking-widest border-slate-200 bg-white shadow-sm">Seleção em Massa</Button>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {duplicates.map(group => (
            <div key={group.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grupo {group.id.slice(0,4)}</span>
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-none font-bold text-[9px] uppercase">{group.items.length} Versões</Badge>
                </div>
                <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-white hover:bg-indigo-600 transition-all rounded-full px-4">Manter melhor versão</Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 p-6 overflow-x-auto">
                {group.items.map(item => (
                  <div key={item.id} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 group shadow-sm">
                    <img src={item.url} referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-white/90 backdrop-blur rounded-lg shadow-lg border border-white">
                       <span className="text-[9px] font-bold text-slate-800">{(item.size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                       <button className="p-1.5 bg-rose-500 rounded-full text-white shadow-lg shadow-rose-500/20 active:scale-90">
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quality Analysis */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center border border-slate-100">
              <AlertCircle className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Detecção de Baixa Qualidade</h2>
              <p className="text-sm text-slate-400 font-medium">Fotos com exposição ruim, borradas ou falha técnica</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {blurry.flatMap(g => g.items).map(item => (
            <div key={item.id} className="space-y-3 group">
              <div className="aspect-[3/4] rounded-3xl overflow-hidden border border-slate-200 bg-white relative shadow-sm hover:shadow-2xl transition-all duration-300">
                <img src={item.url} referrerPolicy="no-referrer" className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                   <Button size="sm" className="w-full h-9 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-rose-500/20 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">Mover para a Lixeira</Button>
                </div>
                <div className="absolute top-4 left-4">
                  <div className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg border border-white shadow-sm flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    <span className="text-[8px] font-bold text-slate-800 uppercase tracking-wider">Borrada</span>
                  </div>
                </div>
              </div>
              <div className="px-2">
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-tight truncate">{item.name}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="h-1 bg-slate-100 flex-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${(item.aiQualityScore || 0) * 100}%` }} 
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 tabular-nums uppercase">{Math.round((item.aiQualityScore || 0) * 100)}% Correspondência</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
