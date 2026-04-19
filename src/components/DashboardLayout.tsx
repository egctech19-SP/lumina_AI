/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutGrid, 
  Map as MapIcon, 
  Users, 
  Sparkles, 
  Cloud, 
  Trash2, 
  Settings,
  Plus,
  Search,
  Zap,
  Clock,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ViewType } from '@/types';
import { useMedia } from '../MediaContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  onAddClick?: () => void;
}

export function DashboardLayout({ children, activeView, onViewChange, onAddClick }: DashboardLayoutProps) {
  const { searchQuery, setSearchQuery } = useMedia();
  const navItems = [
    { id: 'gallery', label: 'Toda a Mídia', icon: LayoutGrid },
    { id: 'map', label: 'Explorador de Mapas', icon: MapIcon },
    { id: 'people', label: 'Grupos de Rostos', icon: Users },
    { id: 'cloud', label: 'Fontes de Nuvem', icon: Cloud },
  ];

  const tools = [
    { id: 'cleanup', label: 'Duplicatas', icon: Trash2 },
    { id: 'editor', label: 'Inspetor/IA', icon: Sparkles },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">Lumina AI</span>
        </div>

        <div className="px-4 mb-6">
          <Button 
            className="w-full justify-start gap-2 h-11 bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-600/20" 
            variant="default" 
            onClick={onAddClick}
          >
            <Plus className="w-4 h-4" />
            Adicionar Mídia
          </Button>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-6 py-2">
            <div>
              <h2 className="mb-3 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Biblioteca
              </h2>
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 px-3 h-10 transition-all duration-200",
                      activeView === item.id 
                        ? "bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white shadow-md shadow-indigo-600/10" 
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    )}
                    onClick={() => onViewChange(item.id as ViewType)}
                  >
                    <item.icon className={cn("w-4 h-4", activeView === item.id ? "text-white" : "text-slate-500")} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Processado por IA
              </h2>
              <div className="space-y-1">
                {tools.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 px-3 h-10 transition-all duration-200",
                      activeView === item.id 
                        ? "bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white shadow-md shadow-indigo-600/10" 
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    )}
                    onClick={() => onViewChange(item.id as ViewType)}
                  >
                    <item.icon className={cn("w-4 h-4", activeView === item.id ? "text-white" : "text-amber-400")} />
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.id === 'cleanup' && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        12
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-tight">
                <span>Sincronizando OneDrive</span>
                <span className="text-indigo-400">82%</span>
              </div>
              <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: '82%' }}></div>
              </div>
              <p className="text-[10px] mt-3 text-slate-500 leading-tight">24.102 itens indexados localmente</p>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200">
              AD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">Conta do Usuário</p>
              <p className="text-[10px] text-slate-500 truncate">egcampos@gmail.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 w-full border border-transparent focus-within:border-indigo-200 focus-within:bg-white transition-all shadow-sm">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Pesquisar pessoas, lugares, tags ou 'cachorro'..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-full outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 relative">
              <Clock className="w-5 h-5 text-slate-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white"></span>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
              <Settings className="w-5 h-5 text-slate-600" />
            </Button>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm border-slate-200 hover:bg-slate-50">
                Ordenar: Mais Recentes
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-50">
          {children}
        </div>
      </main>
    </div>
  );
}
