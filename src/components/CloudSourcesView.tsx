/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cloud, CheckCircle2, AlertCircle, RefreshCw, Plus, LayoutGrid, Clock, ShieldCheck, ExternalLink } from 'lucide-react';
import { CloudSource } from '../types';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const AVAILABLE_PROVIDERS = [
  { 
    id: 'onedrive', 
    name: 'Microsoft OneDrive', 
    icon: '☁️',
    color: 'bg-blue-600',
    description: 'Sincronize arquivos do Windows e Office 365'
  },
  { 
    id: 'gdrive', 
    name: 'Google Drive', 
    icon: '📁',
    color: 'bg-emerald-600',
    description: 'Acesse documentos e pastas compartilhadas'
  },
  { 
    id: 'gphotos', 
    name: 'Google Fotos', 
    icon: '📸',
    color: 'bg-rose-500', 
    description: 'Importe sua biblioteca completa de memórias'
  }
];

export function CloudSourcesView() {
  const [sources, setSources] = useState<CloudSource[]>([
    {
      id: '1',
      provider: 'onedrive',
      name: 'OneDrive Pessoal',
      email: 'egcampos@gmail.com',
      status: 'connected',
      lastSync: Date.now() - 3600000,
      usage: { used: 42.5 * 1024 * 1024 * 1024, total: 100 * 1024 * 1024 * 1024 }
    }
  ]);

  const [connecting, setConnecting] = useState<string | null>(null);

  const simulateConnect = (providerId: string) => {
    setConnecting(providerId);
    setTimeout(() => {
      const provider = AVAILABLE_PROVIDERS.find(p => p.id === providerId);
      if (provider) {
        setSources([...sources, {
          id: Math.random().toString(),
          provider: providerId as any,
          name: provider.name,
          email: 'usuario@exemplo.com',
          status: 'connected',
          lastSync: Date.now(),
          usage: { used: 1.2 * 1024 * 1024 * 1024, total: 15 * 1024 * 1024 * 1024 }
        }]);
      }
      setConnecting(null);
    }, 2000);
  };

  const [syncingSource, setSyncingSource] = useState<string | null>(null);
  const handleSync = (id: string) => {
    setSyncingSource(id);
    setTimeout(() => {
      setSyncingSource(null);
      setSources(sources.map(s => s.id === id ? { ...s, lastSync: Date.now() } : s));
    }, 3000);
  };

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-16">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase border border-indigo-100 italic">Conexão Híbrida</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Fontes de Nuvem</h1>
          <p className="text-slate-500 font-medium tracking-tight">Gerencie integrações com serviços externos para consolidar sua biblioteca.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              Fontes Conectadas
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              {sources.map(source => (
                <Card key={source.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all rounded-3xl">
                  <div className="flex items-center p-6 gap-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-100">
                      {AVAILABLE_PROVIDERS.find(p => p.id === source.provider)?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900">{source.name}</h3>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-bold text-[9px] uppercase tracking-tighter">
                          Ativo
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 font-medium truncate">{source.email}</p>
                      <div className="mt-4 flex items-center gap-6">
                        <div className="flex-1">
                          <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1.5 uppercase">
                            <span>Espaço em uso</span>
                            <span className="text-slate-900">{(source.usage!.used / (1024 ** 3)).toFixed(1)}GB / {(source.usage!.total / (1024 ** 3)).toFixed(1)}GB</span>
                          </div>
                          <Progress value={(source.usage!.used / source.usage!.total) * 100} className="h-1 bg-slate-100" />
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Última Sincronia</p>
                          <p className="text-[10px] font-bold text-slate-800">Hoje às 14:20</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border-slate-200"
                         onClick={() => handleSync(source.id)}
                         disabled={syncingSource === source.id}
                       >
                         <RefreshCw className={cn("w-3 h-3 mr-2", syncingSource === source.id && "animate-spin")} /> 
                         {syncingSource === source.id ? 'Sincronizando...' : 'Sincronizar'}
                       </Button>
                       <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                         Desconectar
                       </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-6">
             <h2 className="text-lg font-bold text-slate-800">Provedores Disponíveis</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AVAILABLE_PROVIDERS.filter(p => !sources.find(s => s.provider === p.id)).map(provider => (
                  <Card key={provider.id} className="border-slate-200 bg-white rounded-3xl shadow-sm hover:border-indigo-300 transition-colors group p-6">
                    <div className="flex items-start gap-4">
                       <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                         {provider.icon}
                       </div>
                       <div className="flex-1 space-y-1">
                         <h4 className="font-bold text-slate-900">{provider.name}</h4>
                         <p className="text-xs text-slate-400 leading-tight">{provider.description}</p>
                       </div>
                    </div>
                    <Button 
                      className="w-full mt-6 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest py-6 shadow-lg shadow-slate-200 group-hover:shadow-indigo-500/20 transition-all font-sans"
                      onClick={() => simulateConnect(provider.id)}
                      disabled={!!connecting}
                    >
                      {connecting === provider.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      {connecting === provider.id ? 'Conectando...' : 'Adicionar Local'}
                    </Button>
                  </Card>
                ))}
             </div>
          </section>
        </div>

        <div className="space-y-8">
           <Card className="bg-slate-900 text-white rounded-[2.5rem] border-none shadow-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
              <div className="relative z-10 space-y-6">
                 <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40">
                   <Cloud className="w-6 h-6" />
                 </div>
                 <h3 className="text-2xl font-black tracking-tight leading-tight">Backup Inteligente e Local</h3>
                 <p className="text-slate-400 text-sm leading-relaxed font-medium">
                   O Lumina AI não altera seus arquivos originais na nuvem. Nós apenas criamos um índice inteligente local para busca instantânea e reconhecimento facial.
                 </p>
                 <div className="pt-4 space-y-3">
                    {[
                      { icon: CheckCircle2, text: 'Privacidade Total (Local-first)' },
                      { icon: CheckCircle2, text: 'Metadata Sync Bidirecional' },
                      { icon: ShieldCheck, text: 'Codificação segura TLS 1.3' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-300">
                        <item.icon className="w-4 h-4 text-indigo-400" />
                        {item.text}
                      </div>
                    ))}
                 </div>
              </div>
           </Card>

           <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
             <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Status do OneDrive</h4>
             <div className="space-y-6">
                <div className="flex justify-between items-start">
                   <div className="space-y-1">
                      <p className="text-3xl font-black text-slate-900 tabular-nums">82%</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Sincronizado</p>
                   </div>
                   <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-bold uppercase border border-indigo-100">
                      Ativo
                   </div>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      <span>Indexando Faces</span>
                      <span>1.2k / 1.5k</span>
                   </div>
                   <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full w-[82%] rounded-full animate-pulse" />
                   </div>
                </div>
                <Button variant="link" className="px-0 text-indigo-600 font-bold h-auto flex items-center gap-2 group">
                   Ver logs de atividade
                   <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </Button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
