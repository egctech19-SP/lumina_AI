/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Plus, 
  LayoutGrid, 
  Clock, 
  ShieldCheck, 
  ExternalLink,
  FolderOpen,
  Lock,
  Loader2,
  Trash2,
  User,
  Search
} from 'lucide-react';
import { CloudSource } from '../types';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { supabase } from '../lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const AVAILABLE_PROVIDERS = [
  { 
    id: 'onedrive', 
    name: 'Microsoft OneDrive', 
    icon: '☁️',
    color: 'bg-blue-600',
    description: 'Sincronize arquivos do Windows e Office 365',
    accent: 'text-blue-600'
  },
  { 
    id: 'gdrive', 
    name: 'Google Drive', 
    icon: '📁',
    color: 'bg-emerald-600',
    description: 'Acesse documentos e pastas compartilhadas',
    accent: 'text-emerald-600'
  },
  { 
    id: 'gphotos', 
    name: 'Google Fotos', 
    icon: '📸',
    color: 'bg-rose-500', 
    description: 'Importe sua biblioteca completa de memórias',
    accent: 'text-rose-500'
  }
];

const MOCK_FOLDERS = [
  { id: '1', name: 'Camera Roll', size: '12.4 GB', count: 1240 },
  { id: '2', name: 'WhatsApp Images', size: '4.2 GB', count: 850 },
  { id: '3', name: 'Viagem 2024', size: '8.1 GB', count: 420 },
  { id: '4', name: 'Documentos Digitalizados', size: '1.2 GB', count: 150 },
  { id: '5', name: 'Trabalho', size: '15.0 GB', count: 2100 },
];

export function CloudSourcesView() {
  const [sources, setSources] = useState<CloudSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncingSource, setSyncingSource] = useState<string | null>(null);
  
  // UI States for Auth Flow
  const [showAuthStep, setShowAuthStep] = useState(false);
  const [showFolderStep, setShowFolderStep] = useState(false);
  const [activeProvider, setActiveProvider] = useState<any>(null);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);

  // Fetch from Supabase
  useEffect(() => {
    async function fetchSources() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('cloud_sources')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Map snake_case to camelCase
        const mapped: CloudSource[] = (data || []).map(item => ({
          id: item.id,
          provider: item.provider,
          name: item.name,
          email: item.email,
          status: item.status,
          lastSync: new Date(item.last_sync).getTime(),
          usage: { 
            used: Number(item.usage_used), 
            total: Number(item.usage_total) 
          }
        }));

        setSources(mapped);
      } catch (e) {
        console.error("Failed to fetch cloud sources", e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSources();
  }, []);

  const handleStartConnect = (providerId: string) => {
    const provider = AVAILABLE_PROVIDERS.find(p => p.id === providerId);
    if (!provider) return;
    setActiveProvider(provider);
    setShowAuthStep(true);
  };

  const handleAuthComplete = () => {
    setConnecting(activeProvider.id);
    setTimeout(() => {
      setShowAuthStep(false);
      setShowFolderStep(true);
      setConnecting(null);
    }, 1500);
  };

  const handleFinishConnection = async () => {
    setConnecting(activeProvider.id);
    try {
      const newSourceData = {
        provider: activeProvider.id,
        name: activeProvider.name.split(' ')[1] + ' Pessoal',
        email: 'egcampos@gmail.com',
        status: 'connected',
        usage_used: 10 * 1024 * 1024 * 1024,
        usage_total: 100 * 1024 * 1024 * 1024
      };

      const { data, error } = await supabase
        .from('cloud_sources')
        .insert([newSourceData])
        .select()
        .single();

      if (error) throw error;

      const newSource: CloudSource = {
        id: data.id,
        provider: data.provider,
        name: data.name,
        email: data.email,
        status: data.status as any,
        lastSync: Date.now(),
        usage: { used: data.usage_used, total: data.usage_total }
      };

      setSources([newSource, ...sources]);
      setShowFolderStep(false);
      setActiveProvider(null);
      setSelectedFolders([]);
    } catch (e) {
      console.error("Failed to save cloud source", e);
    } finally {
      setConnecting(null);
    }
  };

  const handleSync = async (id: string) => {
    setSyncingSource(id);
    try {
      const { error } = await supabase
        .from('cloud_sources')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setSources(sources.map(s => s.id === id ? { ...s, lastSync: Date.now() } : s));
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setTimeout(() => setSyncingSource(null), 2000);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Deseja realmente desconectar esta fonte? A indexação local será perdida.')) return;
    try {
      const { error } = await supabase
        .from('cloud_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSources(sources.filter(s => s.id !== id));
    } catch (e) {
      console.error("Failed to disconnect source", e);
    }
  };

  const toggleFolder = (folderId: string) => {
    setSelectedFolders(prev => 
      prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]
    );
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
              {isLoading ? (
                <div className="flex items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 italic text-slate-400">
                   <Loader2 className="w-6 h-6 animate-spin mr-3" /> Carregando conexões...
                </div>
              ) : sources.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium">Nenhuma fonte conectada ainda. Adicione uma abaixo.</p>
                </div>
              ) : (
                sources.map(source => (
                  <Card key={source.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all rounded-3xl">
                    <div className="flex items-center p-6 gap-6">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-100">
                        {AVAILABLE_PROVIDERS.find(p => p.id === source.provider)?.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900">{source.name}</h3>
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-bold text-[9px] uppercase tracking-tighter">
                            {source.status === 'connected' ? 'Ativo' : 'Erro'}
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
                            <p className="text-[10px] font-bold text-slate-800">{new Date(source.lastSync!).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
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
                         <button 
                           onClick={() => handleDisconnect(source.id)}
                           className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"
                         >
                           <Trash2 className="w-3.5 h-3.5 mr-2" />
                           Desconectar
                         </button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
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
                      className="w-full mt-6 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest py-6 shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all font-sans"
                      onClick={() => handleStartConnect(provider.id)}
                      disabled={!!connecting}
                    >
                       <Plus className="w-4 h-4 mr-2" />
                       Conectar
                    </Button>
                  </Card>
                ))}
             </div>
          </section>
        </div>

        {/* Sidebar Info Panels */}
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

           {sources.some(s => s.provider === 'onedrive') && (
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
                  <Button variant="link" className="px-0 text-indigo-600 font-bold h-auto flex items-center gap-2 group p-0">
                     Ver logs de atividade
                     <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </Button>
               </div>
             </div>
           )}
        </div>
      </div>

      {/* STEP 1: Auth Dialog (Simulated) */}
      <Dialog open={showAuthStep} onOpenChange={setShowAuthStep}>
         <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
            <div className={cn("p-10 text-white flex flex-col items-center justify-center gap-6", activeProvider?.color)}>
               <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-5xl border border-white/20">
                  {activeProvider?.icon}
               </div>
               <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black tracking-tight">Conectando ao {activeProvider?.name}</h2>
                  <p className="text-white/60 text-sm font-medium">O Lumina AI solicita permissão para indexar sua galeria.</p>
               </div>
            </div>
            <div className="p-10 space-y-6 bg-white">
               <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                     <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                        <User className="w-5 h-5" />
                     </div>
                     <div className="flex-1">
                        <p className="text-xs font-bold text-slate-900">egcampos@gmail.com</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Conta Identificada</p>
                     </div>
                  </div>
                  <div className="space-y-3">
                     {[
                        'Ler arquivos e pastas da galeria',
                        'Acessar metadados EXIF e GPS',
                        'Criar webhooks para novos uploads'
                     ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                           <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                           {item}
                        </div>
                     ))}
                  </div>
               </div>
               <div className="flex flex-col gap-3 pt-4">
                  <Button 
                    className={cn("w-full py-7 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl text-white", activeProvider?.color)}
                    onClick={handleAuthComplete}
                    disabled={!!connecting}
                  >
                     {connecting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Permitir Acesso'}
                  </Button>
                  <Button variant="ghost" className="w-full text-slate-400 font-bold uppercase text-[10px] py-6" onClick={() => setShowAuthStep(false)}>
                     Cancelar
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>

      {/* STEP 2: Folder Selection (Simulated) */}
      <Dialog open={showFolderStep} onOpenChange={setShowFolderStep}>
         <DialogContent className="sm:max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Seleção de Diretórios</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Selecione o que deseja indexar no {activeProvider?.name}</p>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center text-2xl border border-slate-100">
                  {activeProvider?.icon}
               </div>
            </div>
            
            <div className="p-8">
               <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type="text" 
                    placeholder="Filtrar pastas..." 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
                  />
               </div>

               <ScrollArea className="h-72 pr-4">
                  <div className="grid grid-cols-1 gap-2">
                     {MOCK_FOLDERS.map(folder => (
                        <div 
                          key={folder.id} 
                          onClick={() => toggleFolder(folder.id)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                            selectedFolders.includes(folder.id) 
                              ? "bg-indigo-50 border-indigo-200" 
                              : "bg-white border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30"
                          )}
                        >
                           <div className={cn(
                             "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                             selectedFolders.includes(folder.id) ? "bg-indigo-500 text-white" : "bg-slate-50 ml-1 text-slate-400 group-hover:bg-indigo-100"
                           )}>
                              <FolderOpen className="w-5 h-5" />
                           </div>
                           <div className="flex-1">
                              <p className="text-sm font-bold text-slate-900">{folder.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{folder.count} Mídias • {folder.size}</p>
                           </div>
                           <div className={cn(
                             "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                             selectedFolders.includes(folder.id) ? "bg-indigo-500 border-indigo-500" : "border-slate-200"
                           )}>
                              {selectedFolders.includes(folder.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                           </div>
                        </div>
                     ))}
                  </div>
               </ScrollArea>
            </div>

            <DialogFooter className="p-8 bg-slate-50 flex-col sm:flex-row gap-3">
               <div className="flex-1 text-xs text-slate-400 font-medium">
                  {selectedFolders.length} pastas selecionadas para indexação inteligente.
               </div>
               <div className="flex gap-3">
                  <Button variant="ghost" className="rounded-xl font-bold uppercase text-[10px]" onClick={() => setShowFolderStep(false)}>Voltar</Button>
                  <Button 
                    variant="default" 
                    className="rounded-2xl bg-slate-900 hover:bg-indigo-600 px-8 py-6 text-[10px] font-black uppercase tracking-widest shadow-xl"
                    disabled={selectedFolders.length === 0 || !!connecting}
                    onClick={handleFinishConnection}
                  >
                     {connecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                     {connecting ? 'Iniciando...' : 'Iniciar Indexação'}
                  </Button>
               </div>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
